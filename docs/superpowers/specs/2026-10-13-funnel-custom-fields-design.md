# Funnel custom fields — named, typed, reusable answers

**Status:** approved design, pending implementation plan
**Date:** 2026-10-13

## Problem

Funnels already support free-text ("descriptive") custom questions next to
multiple choice (`FunnelQuestionKind.TEXT`, shipped). What they cannot do,
compared with the custom-field collection in Método Chat (`lib/campos.ts`):

1. **Reuse an answer.** Messages only interpolate the built-in tokens
   (`{nome}`, `{cargo}`, `{link}`, `{data}`, `{hora}`). A custom answer can
   never be quoted later ("How many people work at {empresa}?").
2. **Export it usefully.** The CSV squeezes every custom answer into one
   `Respostas` cell (`Pergunta: resposta | Pergunta: resposta`), which can't be
   filtered or sorted in a spreadsheet.
3. **Validate it.** Free text accepts anything; there is no number, date,
   document or link format.

There is also a trust gap: `submitFunnel` stores `answers` exactly as the
browser sends them, including the question label (`prompt`). Any format
validation added only on the client would be cosmetic.

## Goals

- A custom question can be given a **field name** (e.g. `Empresa`). It becomes
  the variable `{empresa}` and the CSV column header.
- A descriptive question can declare a **format**: free text, number, date,
  CPF, CNPJ or link — validated, masked and normalized.
- Works for multiple-choice questions too (the variable/column holds the chosen
  option).
- The server re-validates every answer against the stored question.
- Existing funnels and existing submissions keep working with no edits.

## Non-goals (YAGNI)

- E-mail / phone as custom formats (the default block already captures them;
  trivial to add later on top of the same module).
- SQL-level reporting or a normalized answers table.
- Changes to the admin submissions inbox (it already lists every answer).

## Design

### Data model (additive migration)

```prisma
model FunnelQuestion {
  // …existing fields…
  /// Admin-facing field name, e.g. "Empresa". Optional. Drives the `{token}`
  /// and the CSV column header.
  fieldName String          @default("")
  /// Answer format. Only meaningful when `kind = TEXT`.
  inputType FunnelInputType @default(TEXT)
}

enum FunnelInputType {
  TEXT
  NUMBER
  DATE
  CPF
  CNPJ
  URL
}
```

Both columns have defaults, so every existing question becomes
`fieldName = ""` / `inputType = TEXT` — exactly today's behavior. `kind` keeps one
meaning (buttons vs typing), so branching (`next` / `optionNext`) is untouched.

`FunnelSubmission.answers` keeps its shape `[{ questionId, prompt, answer }]`.
`questionId` is the question's stable `key`, which survives edits — that is what
lets old submissions fill the new CSV columns.

### Shared module — `src/lib/funnel-fields.ts`

Pure, no server-only imports; used by the admin form, the runner and the server.

- `fieldToken(field: string): string` — lowercase, strip accents, non
  `[a-z0-9]` → `_`, collapse/trim `_`. `"Nome da Empresa"` → `nome_da_empresa`.
- `RESERVED_TOKENS` — `nome name cargo role link data date hora time`.
- `validateAnswer(type, raw, locale): { ok: true; value: string } | { ok: false }`
  — validates and returns the normalized value to store.
- `maskAnswer(type, raw, locale): string` — input mask while typing.

| Type | Mobile keyboard | Mask | Rule | Stored as |
|---|---|---|---|---|
| TEXT | default | — | non-empty | trimmed |
| NUMBER | `decimal` | — | digits, optional `,` or `.` decimal | trimmed, as typed |
| DATE | `numeric` | `dd/mm/aaaa` (pt) · `mm/dd/yyyy` (en) | real calendar date (rejects 31/02; leap years) | formatted per funnel locale |
| CPF | `numeric` | `000.000.000-00` | mod-11 check digits; rejects repeated digits | formatted |
| CNPJ | default, uppercased | `00.000.000/0000-00` | alphanumeric-aware check digits (below) | formatted |
| URL | `url` | — | `new URL()` parses, host contains a dot; `https://` prepended if missing | with scheme |

**CNPJ is alphanumeric since July 2026** (Receita Federal): the first 12
positions may be letters, the last 2 are numeric check digits. Each character's
value is `charCode − 48`, then the classic mod-11 weights apply. This accepts
both new and legacy numeric CNPJs. Verified against the official example
`12.ABC.345/01DE-35` and the numeric `11.222.333/0001-81`. A digits-only
validator would wrongly reject real, newly issued CNPJs.

### Admin editor

Per question, two new controls:

- **Field name** (optional) with a live hint: *Use `{empresa}` in messages.*
- **Answer format** (descriptive questions only): Free text · Number · Date ·
  CPF · CNPJ · Link.

Validation lives in two pure functions in `funnel-fields.ts`, shared by the
editor and the save actions: `fieldNameIssue(questions, index)` returns
`"invalid" | "reserved" | "duplicate" | null`, and `hasFieldNameIssue(questions)`
guards `createFunnel` / `updateFunnel`, which refuse the save with a dedicated
`field_conflict` error. (Doing this inside `funnelSchema` would surface only the
generic "check the fields" message.) Rules: `fieldToken(fieldName)` must be
unique within the funnel and not in `RESERVED_TOKENS`; `fieldName` is at most 40
characters (zod). Empty `fieldName` is allowed and simply opts out of
variable/column naming; a **non-empty** `fieldName` whose token comes out empty
(e.g. `"!!!"`) is rejected as `invalid`. The editor shows the issue inline, under
the field name input, as the admin types.

The column is named `fieldName`, not `field`, because the default block already
uses `field` for the built-in capture fields (`"name" | "role" | "phone" | "email"`).

`src/lib/funnel-form.ts` maps both new fields to and from the form values.

New strings go in both `pt.json` and `en.json`.

### Runner

- `FunnelRunView` (the DAL view-model sent to the public page) exposes each
  question's `fieldName` and `inputType`. Neither is sensitive.
- The descriptive input picks `inputMode` and mask from `inputType`, and keeps
  `text-base sm:text-sm` (iOS focus-zoom fix).
- Invalid answer → inline error under the field (same pattern as the default
  block's phone/email), the funnel does not advance. One message key per type.
- The stored value is `validateAnswer(…).value`, not the raw text.

### Variables

`FunnelLeadValues` gains `fields?: Record<string, string>` (token → answer).
It holds **every token the funnel defines**, seeded with `""` and filled in as
answers arrive — presence in the map is what distinguishes a defined field from
a typo. `interpolateTokens` replaces, after the built-ins:

- a token that matches a **defined field** → its answer, or **empty** if not
  answered yet (or skipped by branching) — the visitor never sees raw braces;
- a token that matches **nothing** (typo such as `{empresaa}`) → **left as
  typed**, so the mistake is visible while testing instead of vanishing.

Applies to subsequent bot messages in the runner and to the WhatsApp completion
message on the server. Choice answers are variables too.

### Server — `submitFunnel`

Load the funnel's questions with it and run every submitted answer through one
extracted, unit-tested function:

- unknown `questionId` (funnel edited mid-session) → drop that answer, **keep
  the lead**;
- descriptive with a format → `validateAnswer`; invalid → `{ ok: false,
  error: "invalid" }` (only reachable by tampering — the client validated first);
- choice → kept as given (length-capped label);
- `prompt` always comes from the database, never from the client.

The WhatsApp completion tokens and the Google Calendar event description use
the validated answers.

### CSV export

- One column per current question, in funnel order. Header = `fieldName`, falling
  back to `prompt`; duplicate headers get ` (2)`, ` (3)`.
- **"Outras respostas"** column for answers whose question was deleted —
  nothing is lost.
- The single `Respostas` column is removed (replaced). **Breaking for anyone
  importing this CSV by column position.**

Column building is a pure function, unit-tested.

## Testing

Written before the implementation:

- `test/funnel-fields.test.ts` — CPF and CNPJ (numeric and alphanumeric, valid
  and invalid), dates (31/02, 29/02 leap and non-leap, en format), links with and
  without scheme, numbers, `fieldToken` and reserved names.
- `test/funnel-runtime.test.ts` — interpolation: answered → value, defined but
  unanswered → empty, undefined → literal.
- Unit tests for CSV column building (order, fallback header, duplicates,
  orphaned answers, legacy submissions) and for server answer revalidation.
- `test/funnel-runner.test.tsx` — invalid CNPJ shows the error and blocks;
  valid advances; a field variable renders in the next message.
- Gate: `npm run typecheck && npm run lint && npm run build`, `npm test`, and
  the e2e suite stays green.

## Risks

- **CSV layout change** — announce before release.
- **Funnel edited during a live session** — handled by dropping unknown answers
  rather than failing the lead.
