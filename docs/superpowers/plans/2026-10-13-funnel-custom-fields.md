# Funnel Custom Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let funnel custom questions carry a field name (reused as a `{token}` in later messages and as its own CSV column) and, for descriptive questions, a validated answer format (number, date, CPF, CNPJ, link).

**Architecture:** Two additive columns on `FunnelQuestion` (`fieldName`, `inputType`). All rules live in one pure module, `src/lib/funnel-fields.ts`, shared by the admin editor, the public runner and the `submitFunnel` server action — the server re-runs them as the trust boundary. Token interpolation becomes a single pass that knows built-in tokens and the funnel's own field tokens.

**Tech Stack:** Next.js 16 (App Router, server actions), Prisma 6 + Postgres, react-hook-form, next-intl, zod 3, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-13-funnel-custom-fields-design.md`

## Global Constraints

- Work on branch `Development`. **Never `git push`, never merge.**
- **Commits need the user's explicit authorization.** If granted for this plan, commit at the end of each task as written; if not, skip every commit step and leave the work staged.
- Commit messages: conventional commits, ending with `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
- Every UI string goes in **both** `src/messages/pt.json` and `src/messages/en.json`.
- **No new dependencies.**
- Funnel inputs keep `text-base sm:text-sm` (≥16px on phones prevents iOS focus zoom; guarded by `e2e/ios-input-zoom.spec.ts`).
- Never return raw Prisma rows to the client — extend the existing view-models.
- React Compiler is on: render stays pure (no `Date.now()`, `Math.random()`, `crypto.randomUUID()` during render).
- `prisma migrate dev` runs **only** against the local Docker DB (`n8x-marketing-db`, port 5433). On Windows, stop the dev server first — it holds the Prisma query-engine DLL and the migration fails with `EPERM`.
- Before running anything that touches the DB (build, e2e, migrate): Docker Desktop running and `docker start n8x-marketing-db` healthy.
- Gate before declaring done: `npm run typecheck && npm run lint && npm run build`, `npm test`, `npx playwright test`.

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/lib/funnel-runtime.ts` | Runtime types + token interpolation | Modify: `BUILT_IN_TOKENS`, `fields` on `FunnelLeadValues`, single-pass `interpolateTokens` |
| `src/lib/funnel-fields.ts` | **All custom-field rules**: tokens, name issues, per-format validation/masks, field values, server answer sanitizing, CSV columns | Create |
| `prisma/schema.prisma` | `FunnelQuestion.fieldName`, `FunnelQuestion.inputType`, enum `FunnelInputType` | Modify + migration |
| `src/lib/validations/funnel.ts` | zod for the admin save | Modify |
| `src/lib/funnel-form.ts` | Admin form ↔ stored shape | Modify |
| `src/app/actions/funnels.ts` | Admin save actions | Modify: persist new columns, `field_conflict` |
| `src/lib/queries.ts` | `FunnelRunView` for the public runner | Modify |
| `src/components/admin/funnel-form.tsx` | Admin editor UI | Modify |
| `src/components/funnels/funnel-runner.tsx` | Public runner UI | Modify |
| `src/app/actions/funnels-public.ts` | `submitFunnel` | Modify: sanitize answers, field tokens in WhatsApp |
| `src/app/api/admin/funnels/[id]/export/route.ts` | CSV export | Modify: one column per question |
| `src/messages/pt.json`, `src/messages/en.json` | Copy | Modify |
| `docs/ARCHITECTURE.md` | Data model docs | Modify |
| `test/funnel-runtime.test.ts`, `test/funnel-fields.test.ts`, `test/funnel-form.test.ts`, `test/funnel-runner.test.tsx` | Tests | Modify / Create |

---

### Task 1: Single-pass token interpolation with custom field tokens

**Files:**
- Modify: `src/lib/funnel-runtime.ts` (type `FunnelLeadValues`, function `interpolateTokens` and its doc comment)
- Test: `test/funnel-runtime.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces:
  - `export const BUILT_IN_TOKENS: ReadonlyMap<string, "name" | "role" | "link" | "date" | "time">`
  - `FunnelLeadValues.fields?: Record<string, string>` — every field token the funnel defines → its answer (`""` until answered)
  - `interpolateTokens(text: string, values: FunnelLeadValues): string` — unchanged signature

- [ ] **Step 1: Write the failing tests**

Append to `test/funnel-runtime.test.ts`:

```ts
describe("interpolateTokens — custom field tokens", () => {
  const fields = { empresa: "Acme", cidade: "" };

  it("replaces a defined field token with its answer, case-insensitively", () => {
    expect(interpolateTokens("Na {empresa} ou {EMPRESA}?", { fields })).toBe(
      "Na Acme ou Acme?",
    );
  });

  it("renders a defined but unanswered field as empty", () => {
    expect(interpolateTokens("Em {cidade}.", { fields })).toBe("Em .");
  });

  it("leaves an undefined token literal, so typos stay visible", () => {
    expect(interpolateTokens("Na {empresaa}", { fields })).toBe("Na {empresaa}");
  });

  it("fills built-in and custom tokens together", () => {
    expect(interpolateTokens("{NOME}, da {empresa}", { name: "Ana", fields })).toBe(
      "Ana, da Acme",
    );
  });

  it("never re-interpolates a value that itself looks like a token", () => {
    expect(
      interpolateTokens("{NOME} / {empresa}", { name: "{empresa}", fields }),
    ).toBe("{empresa} / Acme");
  });

  it("does not resolve object-prototype names as fields", () => {
    expect(interpolateTokens("{constructor}", { fields })).toBe("{constructor}");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/funnel-runtime.test.ts`
Expected: FAIL — `fields` is not a property of `FunnelLeadValues` (type error) and the custom-token cases return the text unchanged (e.g. `expected 'Na {empresa} ou {EMPRESA}?' to be 'Na Acme ou Acme?'`).

- [ ] **Step 3: Implement**

In `src/lib/funnel-runtime.ts`, add the field to `FunnelLeadValues` (after `time?: string;`):

```ts
  /**
   * Custom-question answers by field token (see `buildFieldValues` in
   * `funnel-fields.ts`). Holds every token the funnel defines, "" until
   * answered — presence is what separates a defined field from a typo.
   */
  fields?: Record<string, string>;
```

Replace the whole doc comment + body of `interpolateTokens` (from `/**` above `export function interpolateTokens(` through its closing `}`) with:

```ts
/** Built-in tokens (pt and en spellings) → the lead value that fills them. */
export const BUILT_IN_TOKENS: ReadonlyMap<
  string,
  "name" | "role" | "link" | "date" | "time"
> = new Map([
  ["nome", "name"],
  ["name", "name"],
  ["cargo", "role"],
  ["role", "role"],
  ["link", "link"],
  ["data", "date"],
  ["date", "date"],
  ["hora", "time"],
  ["time", "time"],
]);

/**
 * Replace `{tokens}` (case-insensitive, spaces inside the braces tolerated) in a
 * bot/message string, in a single pass so a value that looks like a token is
 * never re-interpolated:
 * - built-ins (`{NOME}`, `{CARGO}`, `{LINK}`, `{DATA}`, `{HORA}` and English
 *   spellings) → the captured value, or "" when empty;
 * - a field token the funnel defines → its answer, or "" until answered;
 * - anything else (a typo such as `{empresaa}`) → left as written, so it shows
 *   up while testing instead of silently vanishing.
 */
export function interpolateTokens(
  text: string,
  values: FunnelLeadValues,
): string {
  return text.replace(/\{\s*([a-z0-9_]+)\s*\}/gi, (match, raw: string) => {
    const token = raw.toLowerCase();
    const builtIn = BUILT_IN_TOKENS.get(token);
    if (builtIn) return values[builtIn]?.trim() ?? "";
    const fields = values.fields;
    if (fields && Object.hasOwn(fields, token)) return fields[token].trim();
    return match;
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run test/funnel-runtime.test.ts`
Expected: PASS — all 11 tests (the 5 existing ones must still pass unchanged).

- [ ] **Step 5: Commit**

```bash
git add src/lib/funnel-runtime.ts test/funnel-runtime.test.ts
git commit -m "feat(funnel): single-pass token interpolation with custom field tokens

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Custom-field rules module

**Files:**
- Create: `src/lib/funnel-fields.ts`
- Create: `test/funnel-fields.test.ts`

**Interfaces:**
- Consumes: `BUILT_IN_TOKENS` from `@/lib/funnel-runtime` (Task 1).
- Produces:
  - `export const FUNNEL_INPUT_TYPES: readonly ["TEXT", "NUMBER", "DATE", "CPF", "CNPJ", "URL"]`
  - `export type FunnelInputType` — union of the above
  - `export const RESERVED_TOKENS: ReadonlySet<string>`
  - `export function fieldToken(fieldName: string): string`
  - `export type FieldNameIssue = "invalid" | "reserved" | "duplicate"`
  - `export function fieldNameIssue(questions: readonly { fieldName: string }[], index: number): FieldNameIssue | null`
  - `export function hasFieldNameIssue(questions: readonly { fieldName: string }[]): boolean`
  - `export type ValidatedAnswer = { ok: true; value: string } | { ok: false }`
  - `export function validateAnswer(type: FunnelInputType, raw: string, locale: string): ValidatedAnswer`
  - `export function maskAnswer(type: FunnelInputType, raw: string): string`
  - `export function inputModeFor(type: FunnelInputType): "text" | "decimal" | "numeric" | "url"`
  - `export function buildFieldValues(questions: readonly { key: string; fieldName?: string }[], answers: readonly { questionId: string; answer: string }[]): Record<string, string>`

- [ ] **Step 1: Write the failing tests**

Create `test/funnel-fields.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  fieldToken,
  fieldNameIssue,
  hasFieldNameIssue,
  validateAnswer,
  maskAnswer,
  buildFieldValues,
} from "@/lib/funnel-fields";

describe("fieldToken", () => {
  it("lowercases, strips accents and joins words with _", () => {
    expect(fieldToken("Nome da Empresa")).toBe("nome_da_empresa");
    expect(fieldToken("  Endereço Comercial! ")).toBe("endereco_comercial");
  });

  it("returns '' when nothing usable remains", () => {
    expect(fieldToken("!!!")).toBe("");
  });
});

describe("fieldNameIssue", () => {
  const qs = (...names: string[]) => names.map((fieldName) => ({ fieldName }));

  it("accepts an empty name (the question just has no variable)", () => {
    expect(fieldNameIssue(qs(""), 0)).toBeNull();
  });

  it("accepts a unique, non-reserved name", () => {
    expect(fieldNameIssue(qs("Empresa", "Cidade"), 0)).toBeNull();
  });

  it("flags a name with no usable characters", () => {
    expect(fieldNameIssue(qs("!!!"), 0)).toBe("invalid");
  });

  it("flags names that collide with built-in tokens", () => {
    expect(fieldNameIssue(qs("Nome"), 0)).toBe("reserved");
    expect(fieldNameIssue(qs("Data"), 0)).toBe("reserved");
  });

  it("flags duplicates by token, ignoring case and accents", () => {
    const list = qs("Endereço", "endereco");
    expect(fieldNameIssue(list, 0)).toBe("duplicate");
    expect(fieldNameIssue(list, 1)).toBe("duplicate");
  });

  it("hasFieldNameIssue is true when any question has an issue", () => {
    expect(hasFieldNameIssue(qs("Empresa", "Cidade"))).toBe(false);
    expect(hasFieldNameIssue(qs("Empresa", "Cargo"))).toBe(true);
  });
});

describe("validateAnswer", () => {
  const ok = (value: string) => ({ ok: true, value });
  const bad = { ok: false };

  it("TEXT: trims, rejects blank", () => {
    expect(validateAnswer("TEXT", "  oi  ", "pt")).toEqual(ok("oi"));
    expect(validateAnswer("TEXT", "   ", "pt")).toEqual(bad);
  });

  it("NUMBER: integers and decimals in pt or en notation", () => {
    for (const n of ["1500", "12,5", "12.5", "1.500,50", "1,500.50", "-3"]) {
      expect(validateAnswer("NUMBER", n, "pt")).toEqual(ok(n));
    }
    for (const n of ["abc", "1.2.3", "12,", "1 500"]) {
      expect(validateAnswer("NUMBER", n, "pt")).toEqual(bad);
    }
  });

  it("DATE: real calendar dates, dd/mm/yyyy in pt and mm/dd/yyyy in en", () => {
    expect(validateAnswer("DATE", "29/02/2024", "pt")).toEqual(ok("29/02/2024"));
    expect(validateAnswer("DATE", "29/02/2023", "pt")).toEqual(bad);
    expect(validateAnswer("DATE", "31/04/2026", "pt")).toEqual(bad);
    expect(validateAnswer("DATE", "31/02/2026", "pt")).toEqual(bad);
    expect(validateAnswer("DATE", "2026-02-10", "pt")).toEqual(bad);
    expect(validateAnswer("DATE", "02/29/2024", "en")).toEqual(ok("02/29/2024"));
    expect(validateAnswer("DATE", "13/01/2026", "en")).toEqual(bad);
  });

  it("CPF: check digits, stored formatted", () => {
    expect(validateAnswer("CPF", "52998224725", "pt")).toEqual(ok("529.982.247-25"));
    expect(validateAnswer("CPF", "529.982.247-25", "pt")).toEqual(ok("529.982.247-25"));
    expect(validateAnswer("CPF", "529.982.247-24", "pt")).toEqual(bad);
    expect(validateAnswer("CPF", "111.111.111-11", "pt")).toEqual(bad);
  });

  it("CNPJ: numeric and the 2026 alphanumeric format, stored formatted", () => {
    expect(validateAnswer("CNPJ", "11222333000181", "pt")).toEqual(
      ok("11.222.333/0001-81"),
    );
    // Official Receita Federal example of the alphanumeric format.
    expect(validateAnswer("CNPJ", "12.abc.345/01de-35", "pt")).toEqual(
      ok("12.ABC.345/01DE-35"),
    );
    expect(validateAnswer("CNPJ", "11.222.333/0001-82", "pt")).toEqual(bad);
    expect(validateAnswer("CNPJ", "12.ABC.345/01DE-36", "pt")).toEqual(bad);
    expect(validateAnswer("CNPJ", "11.111.111/1111-11", "pt")).toEqual(bad);
  });

  it("URL: adds https:// when missing, needs a dotted host", () => {
    expect(validateAnswer("URL", "n8xmarketing.com.br", "pt")).toEqual(
      ok("https://n8xmarketing.com.br"),
    );
    expect(validateAnswer("URL", "https://instagram.com/n8x", "pt")).toEqual(
      ok("https://instagram.com/n8x"),
    );
    for (const u of ["localhost", "não é url", "ftp://x.com"]) {
      expect(validateAnswer("URL", u, "pt")).toEqual(bad);
    }
  });
});

describe("maskAnswer", () => {
  it("masks CPF, CNPJ and dates while typing", () => {
    expect(maskAnswer("CPF", "5299822")).toBe("529.982.2");
    expect(maskAnswer("CPF", "52998224725999")).toBe("529.982.247-25");
    expect(maskAnswer("CNPJ", "12abc34501de35")).toBe("12.ABC.345/01DE-35");
    expect(maskAnswer("DATE", "2902")).toBe("29/02");
    expect(maskAnswer("DATE", "29022024")).toBe("29/02/2024");
  });

  it("leaves the other formats untouched", () => {
    expect(maskAnswer("TEXT", "Olá, mundo")).toBe("Olá, mundo");
    expect(maskAnswer("URL", "site.com")).toBe("site.com");
  });
});

describe("buildFieldValues", () => {
  const questions = [
    { key: "q1", fieldName: "Empresa" },
    { key: "q2", fieldName: "" },
    { key: "q3", fieldName: "Cidade" },
  ];

  it("maps every named field to its answer, '' until answered", () => {
    expect(
      buildFieldValues(questions, [{ questionId: "q1", answer: "Acme" }]),
    ).toEqual({ empresa: "Acme", cidade: "" });
  });

  it("keeps the latest answer when a question is answered twice", () => {
    expect(
      buildFieldValues(questions, [
        { questionId: "q1", answer: "A" },
        { questionId: "q1", answer: "B" },
      ]).empresa,
    ).toBe("B");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/funnel-fields.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/funnel-fields"`.

- [ ] **Step 3: Implement**

Create `src/lib/funnel-fields.ts`:

```ts
import { BUILT_IN_TOKENS } from "@/lib/funnel-runtime";

/**
 * Custom-question fields for funnels: the `{token}` an admin-given field name
 * becomes, and per-format answer validation, normalization and input masks.
 *
 * Pure and dependency-free on purpose — the admin builder, the public runner and
 * the `submitFunnel` server action all import it, and the server re-runs the
 * same checks as the trust boundary. No "use client" / "server-only".
 */

export const FUNNEL_INPUT_TYPES = [
  "TEXT",
  "NUMBER",
  "DATE",
  "CPF",
  "CNPJ",
  "URL",
] as const;
export type FunnelInputType = (typeof FUNNEL_INPUT_TYPES)[number];

/** Tokens the runtime already fills (default block + meeting): not field names. */
export const RESERVED_TOKENS: ReadonlySet<string> = new Set(BUILT_IN_TOKENS.keys());

/** "Nome da Empresa" → "nome_da_empresa": lowercase, no accents, `_` between words. */
export function fieldToken(fieldName: string): string {
  return fieldName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export type FieldNameIssue = "invalid" | "reserved" | "duplicate";

/**
 * Why question `index`'s field name can't be used, or null when it's fine. An
 * empty name is fine: the question just has no variable and no named column.
 */
export function fieldNameIssue(
  questions: readonly { fieldName: string }[],
  index: number,
): FieldNameIssue | null {
  const name = questions[index]?.fieldName.trim() ?? "";
  if (!name) return null;
  const token = fieldToken(name);
  if (!token) return "invalid";
  if (RESERVED_TOKENS.has(token)) return "reserved";
  const clash = questions.some(
    (q, i) =>
      i !== index && q.fieldName.trim() !== "" && fieldToken(q.fieldName) === token,
  );
  return clash ? "duplicate" : null;
}

/** True when any question's field name is unusable — the save is refused. */
export function hasFieldNameIssue(
  questions: readonly { fieldName: string }[],
): boolean {
  return questions.some((_, i) => fieldNameIssue(questions, i) !== null);
}

export type ValidatedAnswer = { ok: true; value: string } | { ok: false };

const CPF_SEPARATORS: [number, string][] = [
  [3, "."],
  [6, "."],
  [9, "-"],
];
const CNPJ_SEPARATORS: [number, string][] = [
  [2, "."],
  [5, "."],
  [8, "/"],
  [12, "-"],
];
const DATE_SEPARATORS: [number, string][] = [
  [2, "/"],
  [4, "/"],
];

/** Insert each separator right before the character at its position. */
function insertSeparators(chars: string, separators: [number, string][]): string {
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const separator = separators.find(([position]) => position === i);
    if (separator) out += separator[1];
    out += chars[i];
  }
  return out;
}

const repeatsOneChar = (s: string) => /^(.)\1*$/.test(s);

/** CPF: 11 digits with mod-11 check digits. */
function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || repeatsOneChar(digits)) return false;
  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
}

/**
 * CNPJ, numeric or alphanumeric. Since July 2026 the Receita Federal issues
 * CNPJs whose first 12 positions may be letters; the last 2 stay numeric check
 * digits. Each character counts as `charCode − 48` (digits keep their value),
 * then the classic mod-11 weights apply — so legacy numeric CNPJs still pass.
 */
function isValidCnpj(chars: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars) || repeatsOneChar(chars)) return false;
  const checkDigit = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) sum += (chars.charCodeAt(i) - 48) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return checkDigit(12) === Number(chars[12]) && checkDigit(13) === Number(chars[13]);
}

/** A real calendar date: dd/mm/yyyy (pt) or mm/dd/yyyy (en). */
function isValidDate(value: string, locale: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [first, second, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const [day, month] = locale === "en" ? [second, first] : [first, second];
  if (year < 1900 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Integers or decimals, with optional thousands groups in pt (1.500,5) or en (1,500.5). */
const NUMBER_PATTERNS = [
  /^-?\d+([.,]\d+)?$/,
  /^-?\d{1,3}(\.\d{3})+(,\d+)?$/,
  /^-?\d{1,3}(,\d{3})+(\.\d+)?$/,
];

/** A web link; `https://` is added when the visitor left the scheme out. */
function normalizeUrl(value: string): string | null {
  if (/\s/.test(value)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname;
    if (!host.includes(".") || host.startsWith(".") || host.endsWith(".")) return null;
    return withScheme;
  } catch {
    return null;
  }
}

/**
 * Validate an answer in its format and return the value to store, normalized:
 * trimmed, CPF/CNPJ formatted, links with a scheme. `locale` is the funnel's.
 */
export function validateAnswer(
  type: FunnelInputType,
  raw: string,
  locale: string,
): ValidatedAnswer {
  const value = raw.trim();
  if (!value) return { ok: false };
  switch (type) {
    case "TEXT":
      return { ok: true, value };
    case "NUMBER":
      return NUMBER_PATTERNS.some((re) => re.test(value))
        ? { ok: true, value }
        : { ok: false };
    case "DATE":
      return isValidDate(value, locale) ? { ok: true, value } : { ok: false };
    case "CPF": {
      const digits = value.replace(/\D/g, "");
      return isValidCpf(digits)
        ? { ok: true, value: insertSeparators(digits, CPF_SEPARATORS) }
        : { ok: false };
    }
    case "CNPJ": {
      const chars = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
      return isValidCnpj(chars)
        ? { ok: true, value: insertSeparators(chars, CNPJ_SEPARATORS) }
        : { ok: false };
    }
    case "URL": {
      const url = normalizeUrl(value);
      return url ? { ok: true, value: url } : { ok: false };
    }
  }
}

/** Live input mask for the formats that have one; the rest pass through. */
export function maskAnswer(type: FunnelInputType, raw: string): string {
  if (type === "CPF") {
    return insertSeparators(raw.replace(/\D/g, "").slice(0, 11), CPF_SEPARATORS);
  }
  if (type === "CNPJ") {
    const chars = raw.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
    return insertSeparators(chars, CNPJ_SEPARATORS);
  }
  if (type === "DATE") {
    return insertSeparators(raw.replace(/\D/g, "").slice(0, 8), DATE_SEPARATORS);
  }
  return raw;
}

/** Mobile keyboard per format. CNPJ keeps the full keyboard: it may hold letters. */
export function inputModeFor(
  type: FunnelInputType,
): "text" | "decimal" | "numeric" | "url" {
  if (type === "NUMBER") return "decimal";
  if (type === "DATE" || type === "CPF") return "numeric";
  if (type === "URL") return "url";
  return "text";
}

/**
 * Every field token the funnel defines → its answer, "" until answered. Being in
 * the map is what lets `interpolateTokens` tell a defined field (empty until
 * answered — never raw braces) from a typo like `{empresaa}` (left literal).
 */
export function buildFieldValues(
  questions: readonly { key: string; fieldName?: string }[],
  answers: readonly { questionId: string; answer: string }[],
): Record<string, string> {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a.answer]));
  const values: Record<string, string> = {};
  for (const q of questions) {
    const token = q.fieldName ? fieldToken(q.fieldName) : "";
    if (token) values[token] = byQuestion.get(q.key) ?? "";
  }
  return values;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run test/funnel-fields.test.ts`
Expected: PASS — all tests in the file.

- [ ] **Step 5: Typecheck and lint**

Run: `npm run typecheck && npm run lint`
Expected: typecheck clean; lint `0 errors` (warnings already present in the repo are fine).

- [ ] **Step 6: Commit**

```bash
git add src/lib/funnel-fields.ts test/funnel-fields.test.ts
git commit -m "feat(funnel): custom-field rules — tokens, name issues, typed answers

Number, date, CPF and CNPJ (including the 2026 alphanumeric format) and
link validation with masks, shared by admin, runner and server.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Server-side answer sanitizing

**Files:**
- Modify: `src/lib/funnel-fields.ts` (append)
- Test: `test/funnel-fields.test.ts` (append)

**Interfaces:**
- Consumes: `validateAnswer`, `FunnelInputType` (Task 2); `FunnelAnswer` from `@/lib/funnel-runtime`.
- Produces: `export function sanitizeAnswers(questions: readonly { key: string; kind: "CHOICE" | "TEXT"; prompt: string; inputType: FunnelInputType }[], submitted: readonly FunnelAnswer[], locale: string): { ok: true; answers: FunnelAnswer[] } | { ok: false }` — Prisma `FunnelQuestion` rows fit the `questions` parameter as-is.

- [ ] **Step 1: Write the failing tests**

Add `sanitizeAnswers` to the import list at the top of `test/funnel-fields.test.ts`, then append:

```ts
describe("sanitizeAnswers", () => {
  const questions = [
    { key: "q1", kind: "CHOICE" as const, prompt: "Tem orçamento?", inputType: "TEXT" as const },
    { key: "q2", kind: "TEXT" as const, prompt: "CNPJ da empresa", inputType: "CNPJ" as const },
  ];

  it("re-validates typed answers, normalizes them and takes the prompt from the database", () => {
    const result = sanitizeAnswers(
      questions,
      [
        { questionId: "q1", prompt: "forjado pelo navegador", answer: " Sim " },
        { questionId: "q2", prompt: "forjado", answer: "11222333000181" },
      ],
      "pt",
    );
    expect(result).toEqual({
      ok: true,
      answers: [
        { questionId: "q1", prompt: "Tem orçamento?", answer: "Sim" },
        { questionId: "q2", prompt: "CNPJ da empresa", answer: "11.222.333/0001-81" },
      ],
    });
  });

  it("drops answers to questions that no longer exist, keeping the rest", () => {
    const result = sanitizeAnswers(
      questions,
      [
        { questionId: "apagada", prompt: "x", answer: "y" },
        { questionId: "q1", prompt: "x", answer: "Não" },
      ],
      "pt",
    );
    expect(result).toEqual({
      ok: true,
      answers: [{ questionId: "q1", prompt: "Tem orçamento?", answer: "Não" }],
    });
  });

  it("refuses the submission when a typed answer is invalid (tampered client)", () => {
    expect(
      sanitizeAnswers(questions, [{ questionId: "q2", prompt: "x", answer: "123" }], "pt"),
    ).toEqual({ ok: false });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/funnel-fields.test.ts`
Expected: FAIL — `sanitizeAnswers` is not exported (`is not a function`).

- [ ] **Step 3: Implement**

At the top of `src/lib/funnel-fields.ts`, change the import to:

```ts
import { BUILT_IN_TOKENS, type FunnelAnswer } from "@/lib/funnel-runtime";
```

Append to `src/lib/funnel-fields.ts`:

```ts
/**
 * Re-check submitted answers against the stored questions — the server is the
 * trust boundary, the browser's copy is only a suggestion:
 * - an unknown question (the funnel was edited mid-session) is dropped: losing
 *   one answer beats losing the lead;
 * - a descriptive answer is re-validated in its format and stored normalized;
 * - the prompt always comes from the database, never from the client.
 * A typed answer that fails here can only come from a tampered client, so the
 * whole submission is refused.
 */
export function sanitizeAnswers(
  questions: readonly {
    key: string;
    kind: "CHOICE" | "TEXT";
    prompt: string;
    inputType: FunnelInputType;
  }[],
  submitted: readonly FunnelAnswer[],
  locale: string,
): { ok: true; answers: FunnelAnswer[] } | { ok: false } {
  const byKey = new Map(questions.map((q) => [q.key, q]));
  const answers: FunnelAnswer[] = [];
  for (const a of submitted) {
    const question = byKey.get(a.questionId);
    if (!question) continue;
    if (question.kind === "TEXT") {
      const checked = validateAnswer(question.inputType, a.answer, locale);
      if (!checked.ok) return { ok: false };
      answers.push({ questionId: question.key, prompt: question.prompt, answer: checked.value });
    } else {
      answers.push({ questionId: question.key, prompt: question.prompt, answer: a.answer.trim() });
    }
  }
  return { ok: true, answers };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run test/funnel-fields.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/funnel-fields.ts test/funnel-fields.test.ts
git commit -m "feat(funnel): re-validate submitted answers against the stored questions

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: CSV columns per question

**Files:**
- Modify: `src/lib/funnel-fields.ts` (append)
- Test: `test/funnel-fields.test.ts` (append)

**Interfaces:**
- Consumes: `FunnelAnswer` (already imported in Task 3).
- Produces:
  - `export const OTHER_ANSWERS_HEADER = "Outras respostas"`
  - `export type AnswerColumns = { headers: string[]; keys: string[] }`
  - `export function answerColumns(questions: readonly { key: string; fieldName: string; prompt: string }[]): AnswerColumns`
  - `export function answerCells(columns: AnswerColumns, answers: readonly FunnelAnswer[]): string[]`

- [ ] **Step 1: Write the failing tests**

Add `answerColumns, answerCells` to the import list of `test/funnel-fields.test.ts`, then append:

```ts
describe("answerColumns / answerCells", () => {
  const questions = [
    { key: "q1", fieldName: "Empresa", prompt: "Qual a empresa?" },
    { key: "q2", fieldName: "", prompt: "Tem orçamento?" },
    { key: "q3", fieldName: "Empresa", prompt: "Outra empresa?" },
  ];

  it("one column per question in order — field name, else prompt; repeats numbered — plus Outras respostas", () => {
    expect(answerColumns(questions).headers).toEqual([
      "Empresa",
      "Tem orçamento?",
      "Empresa (2)",
      "Outras respostas",
    ]);
  });

  it("fills each column by question key, '' when unanswered, orphans in the last column", () => {
    const columns = answerColumns(questions);
    expect(
      answerCells(columns, [
        { questionId: "q2", prompt: "Tem orçamento?", answer: "Sim" },
        { questionId: "old", prompt: "Pergunta apagada", answer: "talvez" },
        { questionId: "old2", prompt: "Outra apagada", answer: "não" },
      ]),
    ).toEqual(["", "Sim", "", "Pergunta apagada: talvez | Outra apagada: não"]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/funnel-fields.test.ts`
Expected: FAIL — `answerColumns` is not a function.

- [ ] **Step 3: Implement**

Append to `src/lib/funnel-fields.ts`:

```ts
/** Last CSV column: answers to questions that no longer exist. */
export const OTHER_ANSWERS_HEADER = "Outras respostas";

export type AnswerColumns = { headers: string[]; keys: string[] };

/**
 * One CSV column per question, in funnel order (header = field name, or the
 * question text when unnamed; a repeated header gets " (2)", " (3)"), plus a
 * trailing column for answers whose question was deleted — nothing is dropped.
 */
export function answerColumns(
  questions: readonly { key: string; fieldName: string; prompt: string }[],
): AnswerColumns {
  const seen = new Map<string, number>();
  const headers = questions.map((q) => {
    const base = q.fieldName.trim() || q.prompt.trim();
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base} (${count})`;
  });
  return {
    headers: [...headers, OTHER_ANSWERS_HEADER],
    keys: questions.map((q) => q.key),
  };
}

/** A submission's cells for `answerColumns`, in the same order. */
export function answerCells(
  columns: AnswerColumns,
  answers: readonly FunnelAnswer[],
): string[] {
  const known = new Set(columns.keys);
  const byKey = new Map(answers.map((a) => [a.questionId, a.answer]));
  const orphans = answers
    .filter((a) => !known.has(a.questionId))
    .map((a) => `${a.prompt}: ${a.answer}`)
    .join(" | ");
  return [...columns.keys.map((key) => byKey.get(key) ?? ""), orphans];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run test/funnel-fields.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/funnel-fields.ts test/funnel-fields.test.ts
git commit -m "feat(funnel): build one CSV column per custom question

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Persist field name and answer format

**Files:**
- Modify: `prisma/schema.prisma` (model `FunnelQuestion`, new enum)
- Create: `prisma/migrations/<timestamp>_funnel_custom_fields/migration.sql` (generated)
- Modify: `src/lib/validations/funnel.ts`
- Modify: `src/lib/funnel-form.ts`
- Modify: `src/app/actions/funnels.ts`
- Modify: `src/lib/queries.ts`
- Modify: `src/messages/pt.json`, `src/messages/en.json` (`admin.funnels.error.field_conflict`)
- Test: `test/funnel-form.test.ts`

**Interfaces:**
- Consumes: `FUNNEL_INPUT_TYPES`, `FunnelInputType`, `hasFieldNameIssue` (Task 2).
- Produces:
  - DB columns `funnel_questions.fieldName` (text, default `''`) and `funnel_questions.inputType` (`FunnelInputType`, default `TEXT`)
  - `FunnelFormQuestion.fieldName: string`, `FunnelFormQuestion.inputType: FunnelInputType`
  - `FunnelInput["questions"][number]` gains `fieldName: string`, `inputType: FunnelInputType`
  - `FunnelActionResult` error union gains `"field_conflict"`
  - `FunnelRunView["questions"][number]` gains `fieldName: string`, `inputType: FunnelInputType`

- [ ] **Step 1: Write the failing tests**

Append inside the `describe("funnel-form round-trip", …)` block of `test/funnel-form.test.ts` (before its closing `});`):

```ts
  it("round-trips a question's field name and answer format", () => {
    const named = [
      { ...questions[0], fieldName: "Orçamento", inputType: "TEXT" as const },
      { ...questions[1], fieldName: " CNPJ ", inputType: "CNPJ" as const },
    ];
    const input = formToInput(funnelToForm(funnel, named, endings));
    expect(input.questions[0]).toMatchObject({ fieldName: "Orçamento", inputType: "TEXT" });
    expect(input.questions[1]).toMatchObject({ fieldName: "CNPJ", inputType: "CNPJ" });
  });

  it("defaults legacy questions to no field name and free text", () => {
    const input = formToInput(funnelToForm(funnel, questions, endings));
    expect(input.questions[1]).toMatchObject({ fieldName: "", inputType: "TEXT" });
  });

  it("stores a choice question's format as TEXT even if the form held another", () => {
    const form = funnelToForm(funnel, questions, endings);
    form.questions[0]!.inputType = "CPF";
    expect(formToInput(form).questions[0]).toMatchObject({ kind: "CHOICE", inputType: "TEXT" });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/funnel-form.test.ts`
Expected: FAIL — `fieldName` / `inputType` missing from the output (`toMatchObject` mismatch) and a type error on `form.questions[0]!.inputType`.

- [ ] **Step 3: Schema + migration**

In `prisma/schema.prisma`, inside `model FunnelQuestion`, add after the `next` field (`next     String   @default("")`):

```prisma
  /// Admin-given field name (e.g. "Empresa"): drives the `{empresa}` message
  /// token and the CSV column header. "" = unnamed.
  fieldName String          @default("")
  /// Answer format — only meaningful for TEXT questions.
  inputType FunnelInputType @default(TEXT)
```

Right after the `enum FunnelQuestionKind { … }` block, add:

```prisma
enum FunnelInputType {
  TEXT
  NUMBER
  DATE
  CPF
  CNPJ
  URL
}
```

Stop the dev server (Windows holds the query-engine DLL otherwise), make sure the DB is up, then migrate:

```bash
netstat -ano | grep ":3000 .*LISTENING" | awk '{print $5}' | head -1 | xargs -r taskkill //F //PID
docker start n8x-marketing-db
npx prisma migrate dev --name funnel_custom_fields
```

Expected: `Your database is now in sync with your schema` and a new `prisma/migrations/<timestamp>_funnel_custom_fields/migration.sql` containing `CREATE TYPE "FunnelInputType" AS ENUM (…)` and two `ALTER TABLE "funnel_questions" ADD COLUMN …` with defaults. Open it and confirm it has **no** `DROP` statements.

- [ ] **Step 4: zod schema**

In `src/lib/validations/funnel.ts`, add the import at the top:

```ts
import { FUNNEL_INPUT_TYPES } from "@/lib/funnel-fields";
```

In `funnelQuestionSchema`, replace:

```ts
    // TEXT only: single continuation target.
    next: z.string().trim().max(60).default(""),
  })
```

with:

```ts
    // TEXT only: single continuation target.
    next: z.string().trim().max(60).default(""),
    // Field name → `{token}` + CSV header. Uniqueness/reserved names are checked
    // by `hasFieldNameIssue` in the save actions (dedicated error message).
    fieldName: z.string().trim().max(40).default(""),
    inputType: z.enum(FUNNEL_INPUT_TYPES).default("TEXT"),
  })
```

- [ ] **Step 5: Form mapping**

In `src/lib/funnel-form.ts`:

Add the import after the existing imports:

```ts
import type { FunnelInputType } from "@/lib/funnel-fields";
```

In `type FunnelFormQuestion`, add after `next: string;`:

```ts
  /** Field name → `{token}` + CSV column ("" = unnamed). */
  fieldName: string;
  /** Answer format; meaningful for TEXT only. */
  inputType: FunnelInputType;
```

In `blankQuestion()`, replace `    next: "",\n  };` with:

```ts
    next: "",
    fieldName: "",
    inputType: "TEXT",
  };
```

In `type QuestionRow`, add after `next: string;` (optional so rows saved before the migration — and older test fixtures — still fit):

```ts
  fieldName?: string;
  inputType?: FunnelInputType;
```

In `funnelToForm`, replace `      next: q.next ?? "",\n    })),` with:

```ts
      next: q.next ?? "",
      fieldName: q.fieldName ?? "",
      inputType: q.inputType ?? "TEXT",
    })),
```

In `formToInput`, in the TEXT branch replace:

```ts
            optionNext: [],
            next: q.next,
          };
```

with:

```ts
            optionNext: [],
            next: q.next,
            fieldName: q.fieldName.trim(),
            inputType: q.inputType,
          };
```

and in the CHOICE branch replace:

```ts
          optionNext: opts.map((o) => o.next),
          next: "",
        };
```

with:

```ts
          optionNext: opts.map((o) => o.next),
          next: "",
          fieldName: q.fieldName.trim(),
          // Choice questions have no format; normalize whatever the form held.
          inputType: "TEXT" as const,
        };
```

- [ ] **Step 6: Run the form tests**

Run: `npx vitest run test/funnel-form.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 7: Save actions**

In `src/app/actions/funnels.ts`, add the import after the `@/lib/validations/funnel` import block:

```ts
import { hasFieldNameIssue } from "@/lib/funnel-fields";
```

Replace:

```ts
  | { ok: false; error: "unauthorized" | "invalid" | "slug_taken" | "unknown" };
```

with:

```ts
  | {
      ok: false;
      error: "unauthorized" | "invalid" | "slug_taken" | "field_conflict" | "unknown";
    };
```

In `questionsCreate`, replace `    next: q.next,\n  }));` with:

```ts
    next: q.next,
    fieldName: q.fieldName,
    inputType: q.inputType,
  }));
```

Replace **every** occurrence (exactly two: `createFunnel` and `updateFunnel`) of:

```ts
  if (!parsed.success) return { ok: false, error: "invalid" };
```

with:

```ts
  if (!parsed.success) return { ok: false, error: "invalid" };
  if (hasFieldNameIssue(parsed.data.questions)) {
    return { ok: false, error: "field_conflict" };
  }
```

(`funnelDefaultTemplateSchema`'s guard reads differently and is not matched.)

- [ ] **Step 8: Error copy**

`src/components/admin/funnel-form.tsx` renders `t(\`error.${result.error}\`)`, so the new code needs copy in both catalogs.

In `src/messages/pt.json`, replace:

```json
        "slug_taken": "Esse slug já está em uso. Escolha outro.",
        "unknown": "Algo deu errado. Tente novamente."
      }
    },
    "whatsapp": {
```

with:

```json
        "slug_taken": "Esse slug já está em uso. Escolha outro.",
        "field_conflict": "Há nomes de campo repetidos ou reservados. Corrija os avisos nas perguntas.",
        "unknown": "Algo deu errado. Tente novamente."
      }
    },
    "whatsapp": {
```

In `src/messages/en.json`, replace:

```json
        "slug_taken": "That slug is already in use. Choose another.",
        "unknown": "Something went wrong. Please try again."
      }
    },
    "whatsapp": {
```

with:

```json
        "slug_taken": "That slug is already in use. Choose another.",
        "field_conflict": "Some field names are repeated or reserved. Fix the warnings on the questions.",
        "unknown": "Something went wrong. Please try again."
      }
    },
    "whatsapp": {
```

- [ ] **Step 9: Public view-model**

In `src/lib/queries.ts`, add after `import type { FunnelDefaultStep } from "@/lib/funnel-runtime";`:

```ts
import type { FunnelInputType } from "@/lib/funnel-fields";
```

In `type FunnelRunView`, replace:

```ts
    /** TEXT only: single continuation target. */
    next: string;
  }[];
```

with:

```ts
    /** TEXT only: single continuation target. */
    next: string;
    /** Admin-given field name ("" = unnamed): its `{token}` and CSV column. */
    fieldName: string;
    /** Answer format; meaningful for TEXT only. */
    inputType: FunnelInputType;
  }[];
```

In `getPublishedFunnelBySlug`, replace:

```ts
        next: q.next,
      })),
      endings: f.endings.map((e) => ({
```

with:

```ts
        next: q.next,
        fieldName: q.fieldName,
        inputType: q.inputType,
      })),
      endings: f.endings.map((e) => ({
```

- [ ] **Step 10: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run`
Expected: typecheck clean, lint `0 errors`, all Vitest tests PASS.

- [ ] **Step 11: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/validations/funnel.ts src/lib/funnel-form.ts src/app/actions/funnels.ts src/lib/queries.ts src/messages/pt.json src/messages/en.json test/funnel-form.test.ts
git commit -m "feat(funnel): persist a question's field name and answer format

Additive migration (two columns with defaults): existing funnels keep
today's behavior. Saves with a repeated or reserved field name are refused
with a dedicated field_conflict error.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Admin editor — field name and answer format

**Files:**
- Modify: `src/components/admin/funnel-form.tsx`
- Modify: `src/messages/pt.json`, `src/messages/en.json` (`admin.funnels`)

**Interfaces:**
- Consumes: `FUNNEL_INPUT_TYPES`, `fieldNameIssue`, `fieldToken` (Task 2); `FunnelFormQuestion` (Task 5).
- Produces: UI only.

- [ ] **Step 1: Copy**

In `src/messages/pt.json`, replace:

```json
      "textAnswerHint": "O visitante digita a resposta livremente.",
```

with:

```json
      "textAnswerHint": "O visitante digita a resposta livremente.",
      "fieldName": "Nome do campo (opcional)",
      "fieldNamePlaceholder": "Ex.: Empresa",
      "fieldNameHelp": "Dê um nome para usar a resposta nas mensagens seguintes e ter uma coluna própria no CSV.",
      "fieldNameToken": "Use {token} nas mensagens seguintes.",
      "fieldNameIssue": {
        "invalid": "Use letras ou números no nome do campo.",
        "reserved": "Esse nome já é uma variável do sistema (nome, cargo, link, data, hora). Escolha outro.",
        "duplicate": "Outra pergunta já usa esse nome de campo."
      },
      "answerFormat": "Formato da resposta",
      "format": {
        "TEXT": "Texto livre",
        "NUMBER": "Número",
        "DATE": "Data",
        "CPF": "CPF",
        "CNPJ": "CNPJ",
        "URL": "Link (URL)"
      },
```

In `src/messages/en.json`, replace:

```json
      "textAnswerHint": "The visitor types the answer freely.",
```

with:

```json
      "textAnswerHint": "The visitor types the answer freely.",
      "fieldName": "Field name (optional)",
      "fieldNamePlaceholder": "e.g. Company",
      "fieldNameHelp": "Name it to reuse the answer in later messages and get its own CSV column.",
      "fieldNameToken": "Use {token} in later messages.",
      "fieldNameIssue": {
        "invalid": "Use letters or numbers in the field name.",
        "reserved": "That name is already a system variable (name, role, link, date, time). Pick another.",
        "duplicate": "Another question already uses this field name."
      },
      "answerFormat": "Answer format",
      "format": {
        "TEXT": "Free text",
        "NUMBER": "Number",
        "DATE": "Date",
        "CPF": "CPF",
        "CNPJ": "CNPJ",
        "URL": "Link (URL)"
      },
```

(`{token}` is an ICU argument filled with e.g. `"{empresa}"` — the braces in the value render literally.)

- [ ] **Step 2: Imports**

In `src/components/admin/funnel-form.tsx`, replace:

```ts
  blankEnding,
  type FunnelFormValues,
} from "@/lib/funnel-form";
```

with:

```ts
  blankEnding,
  type FunnelFormQuestion,
  type FunnelFormValues,
} from "@/lib/funnel-form";
import { FUNNEL_INPUT_TYPES, fieldNameIssue, fieldToken } from "@/lib/funnel-fields";
```

- [ ] **Step 3: Field-name hint component**

Add at the end of `src/components/admin/funnel-form.tsx`:

```tsx
/** Live feedback under a question's field name: its `{token}`, or why it can't be used. */
function FieldNameHint({
  questions,
  index,
}: {
  questions: FunnelFormQuestion[];
  index: number;
}) {
  const t = useTranslations("admin.funnels");
  const name = questions[index]?.fieldName ?? "";
  if (!name.trim()) {
    return <p className="mt-1 text-xs text-muted-foreground">{t("fieldNameHelp")}</p>;
  }
  const issue = fieldNameIssue(questions, index);
  if (issue) {
    return <p className="mt-1 text-xs text-red-600">{t(`fieldNameIssue.${issue}`)}</p>;
  }
  return (
    <p className="mt-1 text-xs text-muted-foreground">
      {t("fieldNameToken", { token: `{${fieldToken(name)}}` })}
    </p>
  );
}
```

- [ ] **Step 4: Editor controls**

In the question editor, replace:

```tsx
                    <option value="CHOICE">{t("kindChoice")}</option>
                    <option value="TEXT">{t("kindText")}</option>
                  </select>
                </div>
                {watchedQuestions[qIndex]?.kind === "TEXT" ? (
                  <div>
                    <Label>{t("textNextLabel")}</Label>
```

with:

```tsx
                    <option value="CHOICE">{t("kindChoice")}</option>
                    <option value="TEXT">{t("kindText")}</option>
                  </select>
                </div>
                <div>
                  <Label>{t("fieldName")}</Label>
                  <Input
                    maxLength={40}
                    placeholder={t("fieldNamePlaceholder")}
                    {...register(`questions.${qIndex}.fieldName` as const)}
                  />
                  <FieldNameHint questions={watchedQuestions} index={qIndex} />
                </div>
                {watchedQuestions[qIndex]?.kind === "TEXT" ? (
                  <>
                  <div>
                    <Label>{t("answerFormat")}</Label>
                    <select
                      className={cn(selectStyles)}
                      {...register(`questions.${qIndex}.inputType` as const)}
                    >
                      {FUNNEL_INPUT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {t(`format.${type}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>{t("textNextLabel")}</Label>
```

and close the fragment: replace

```tsx
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("textAnswerHint")}
                    </p>
                  </div>
                ) : (
```

with:

```tsx
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("textAnswerHint")}
                    </p>
                  </div>
                  </>
                ) : (
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint`
Expected: clean / `0 errors`. (Prettier-style indentation of the fragment is cosmetic; keep it if lint is silent.)

Manual check (DB up): `npm run dev`, open `http://localhost:3000/admin/funnels`, edit a funnel, and on a question:
1. Type `Empresa` in *Nome do campo* → hint reads **"Use {empresa} nas mensagens seguintes."**
2. Type `Nome` → red **reserved** warning.
3. Give two questions `Empresa` → both show the red **duplicate** warning; saving shows the `field_conflict` banner.
4. Switch *Tipo de resposta* to *Resposta descritiva* → *Formato da resposta* appears with the six options.
5. Save with a valid setup → saves; reopen → values persisted.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/funnel-form.tsx src/messages/pt.json src/messages/en.json
git commit -m "feat(funnel): edit a question's field name and answer format in the admin

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Runner — typed answers and field variables

**Files:**
- Modify: `src/components/funnels/funnel-runner.tsx`
- Modify: `src/messages/pt.json`, `src/messages/en.json` (`funnel`)
- Test: `test/funnel-runner.test.tsx`

**Interfaces:**
- Consumes: `validateAnswer`, `maskAnswer`, `inputModeFor`, `buildFieldValues`, `FunnelInputType` (Task 2); `FunnelRunView` questions with `fieldName` / `inputType` (Task 5); `interpolateTokens` with `fields` (Task 1).
- Produces: UI only.

- [ ] **Step 1: Write the failing tests**

Append inside `describe("FunnelRunner", …)` in `test/funnel-runner.test.tsx` (before its closing `});`):

```tsx
  /** A funnel made only of the given custom questions, ending in a MESSAGE. */
  function questionsFunnel(questions: unknown[]) {
    return {
      id: "f2",
      slug: "y",
      locale: "pt",
      name: "Y",
      defaultBlock: [],
      questions,
      endings: [messageEnding("end-default")],
    } as unknown as FunnelRunView;
  }

  it("blocks an invalid CNPJ with an inline error and submits the valid one formatted", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <FunnelRunner
        funnel={questionsFunnel([
          {
            key: "q1",
            kind: "TEXT",
            prompt: "Qual o CNPJ?",
            options: [],
            next: "END",
            fieldName: "CNPJ",
            inputType: "CNPJ",
          },
        ])}
      />,
    );

    const input = await screen.findByPlaceholderText("Digite sua resposta…");
    await user.type(input, "11222333000182");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("Digite um CNPJ válido.")).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();

    await user.clear(input);
    await user.type(input, "11222333000181");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    await waitFor(() => expect(mockSubmit).toHaveBeenCalledTimes(1));
    expect(mockSubmit.mock.calls[0]![0].answers).toEqual([
      { questionId: "q1", prompt: "Qual o CNPJ?", answer: "11.222.333/0001-81" },
    ]);
  });

  it("quotes an earlier answer through its field token in the next message", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <FunnelRunner
        funnel={questionsFunnel([
          {
            key: "q1",
            kind: "TEXT",
            prompt: "Qual o nome da sua empresa?",
            options: [],
            next: "",
            fieldName: "Empresa",
            inputType: "TEXT",
          },
          {
            key: "q2",
            kind: "CHOICE",
            prompt: "Quantas pessoas trabalham na {empresa}?",
            options: [{ label: "Até 10", next: "END" }],
            next: "",
            fieldName: "",
            inputType: "TEXT",
          },
        ])}
      />,
    );

    await user.type(await screen.findByPlaceholderText("Digite sua resposta…"), "Acme");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(
      await screen.findByText("Quantas pessoas trabalham na Acme?"),
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run test/funnel-runner.test.tsx`
Expected: FAIL — the invalid CNPJ is accepted (no "Digite um CNPJ válido." text) and the second test finds the literal `Quantas pessoas trabalham na {empresa}?` instead of `…na Acme?`.

- [ ] **Step 3: Copy**

In `src/messages/pt.json`, replace:

```json
    "invalidEmail": "Digite um e-mail válido.",
    "prevDay": "Dia anterior",
```

with:

```json
    "invalidEmail": "Digite um e-mail válido.",
    "invalidNumber": "Digite apenas números, ex: 1500 ou 12,5.",
    "invalidDate": "Digite uma data válida no formato dd/mm/aaaa.",
    "invalidCpf": "Digite um CPF válido.",
    "invalidCnpj": "Digite um CNPJ válido.",
    "invalidUrl": "Digite um link válido, ex: seusite.com.br",
    "datePlaceholder": "dd/mm/aaaa",
    "prevDay": "Dia anterior",
```

In `src/messages/en.json`, replace:

```json
    "invalidEmail": "Enter a valid email.",
    "prevDay": "Previous day",
```

with:

```json
    "invalidEmail": "Enter a valid email.",
    "invalidNumber": "Numbers only, e.g. 1500 or 12.5.",
    "invalidDate": "Enter a valid date as mm/dd/yyyy.",
    "invalidCpf": "Enter a valid CPF.",
    "invalidCnpj": "Enter a valid CNPJ.",
    "invalidUrl": "Enter a valid link, e.g. yoursite.com",
    "datePlaceholder": "mm/dd/yyyy",
    "prevDay": "Previous day",
```

(The runner is wrapped in a provider with the **funnel's** locale, so the date placeholder matches the format `validateAnswer` expects.)

- [ ] **Step 4: Runner — imports, node type, errors**

In `src/components/funnels/funnel-runner.tsx`, add after the `@/lib/phone` import:

```ts
import {
  validateAnswer,
  maskAnswer,
  inputModeFor,
  buildFieldValues,
  type FunnelInputType,
} from "@/lib/funnel-fields";
```

In `type Node`, replace:

```ts
      /** Single continuation target after the free-text answer. */
      next: string;
    };
```

with:

```ts
      /** Single continuation target after the free-text answer. */
      next: string;
      /** Answer format, validated before the funnel advances. */
      inputType: FunnelInputType;
    };
```

In `buildNodes`, replace:

```ts
        prompt: q.prompt,
        next: q.next,
      });
```

with:

```ts
        prompt: q.prompt,
        next: q.next,
        inputType: q.inputType ?? "TEXT",
      });
```

Replace:

```ts
type FieldError = "invalidPhone" | "invalidEmail";
```

with:

```ts
type FieldError =
  | "invalidPhone"
  | "invalidEmail"
  | "invalidNumber"
  | "invalidDate"
  | "invalidCpf"
  | "invalidCnpj"
  | "invalidUrl";

/** Message for a descriptive answer that fails its format (non-empty TEXT can't). */
const ANSWER_ERROR: Record<FunnelInputType, FieldError | null> = {
  TEXT: null,
  NUMBER: "invalidNumber",
  DATE: "invalidDate",
  CPF: "invalidCpf",
  CNPJ: "invalidCnpj",
  URL: "invalidUrl",
};
```

- [ ] **Step 5: Runner — variables in messages**

Replace:

```ts
      const text = interpolateTokens(
        node.type === "bot" ? node.text : node.prompt,
        values,
      );
```

with:

```ts
      const text = interpolateTokens(node.type === "bot" ? node.text : node.prompt, {
        ...values,
        fields: buildFieldValues(funnel.questions, answers),
      });
```

- [ ] **Step 6: Runner — validate descriptive answers**

Replace the opening of `answerText`:

```ts
  function answerText(questionKey: string, prompt: string, next: string) {
    const value = draft.trim();
    if (!value) return;
```

with:

```ts
  function answerText(
    questionKey: string,
    prompt: string,
    next: string,
    type: FunnelInputType,
  ) {
    const raw = draft.trim();
    if (!raw) return;
    const checked = validateAnswer(type, raw, funnel.locale);
    if (!checked.ok) {
      setInputError(ANSWER_ERROR[type]);
      return;
    }
    // Store the normalized value (formatted CPF/CNPJ, link with https://).
    const value = checked.value;
    setInputError(null);
```

- [ ] **Step 7: Runner — the descriptive answer form**

Replace the whole block from `      {showText && textNode ? (` through its matching `      ) : null}` (the form with the `<textarea>`) with:

```tsx
      {showText && textNode ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            answerText(
              textNode.questionKey,
              textNode.prompt,
              textNode.next,
              textNode.inputType,
            );
          }}
          className="mt-4 flex flex-col gap-1.5"
        >
          <div className="flex items-end gap-2">
            {textNode.inputType === "TEXT" ? (
              <textarea
                autoFocus
                rows={3}
                maxLength={2000}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("placeholder")}
                // 16px on phones avoids iOS's focus zoom; sm:text-sm elsewhere.
                className="flex-1 resize-y rounded-xl border border-border bg-card px-4 py-3 text-base focus-visible:border-brand focus-visible:outline-none sm:text-sm"
              />
            ) : (
              <input
                autoFocus
                type="text"
                inputMode={inputModeFor(textNode.inputType)}
                autoCapitalize={textNode.inputType === "CNPJ" ? "characters" : undefined}
                maxLength={2000}
                value={draft}
                onChange={(e) => {
                  setDraft(maskAnswer(textNode.inputType, e.target.value));
                  if (inputError) setInputError(null);
                }}
                placeholder={
                  textNode.inputType === "DATE" ? t("datePlaceholder") : t("placeholder")
                }
                aria-invalid={Boolean(inputError)}
                // 16px on phones avoids iOS's focus zoom; sm:text-sm elsewhere.
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-base focus-visible:border-brand focus-visible:outline-none aria-[invalid=true]:border-red-500 sm:text-sm"
              />
            )}
            <button
              type="submit"
              aria-label={t("send")}
              disabled={!draft.trim()}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground transition-opacity disabled:opacity-50"
            >
              <Send className="size-5" />
            </button>
          </div>
          {inputError ? (
            <p className="px-1 text-xs text-red-500">{t(inputError)}</p>
          ) : null}
        </form>
      ) : null}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run test/funnel-runner.test.tsx`
Expected: PASS — 3 tests (the existing "Não keeps the answer" regression included).

- [ ] **Step 9: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run`
Expected: clean / `0 errors` / all PASS.

- [ ] **Step 10: Commit**

```bash
git add src/components/funnels/funnel-runner.tsx src/messages/pt.json src/messages/en.json test/funnel-runner.test.tsx
git commit -m "feat(funnel): typed answers with masks and field variables in the runner

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Server and CSV wiring

**Files:**
- Modify: `src/app/actions/funnels-public.ts`
- Modify: `src/app/api/admin/funnels/[id]/export/route.ts`

**Interfaces:**
- Consumes: `sanitizeAnswers` (Task 3), `buildFieldValues` (Task 2), `answerColumns` / `answerCells` (Task 4).
- Produces: behavior only. **Do not export new functions from `funnels-public.ts`** — it is a `"use server"` module, where every export becomes a public server action.

- [ ] **Step 1: `submitFunnel` — load questions and sanitize**

In `src/app/actions/funnels-public.ts`, replace:

```ts
import { interpolateTokens } from "@/lib/funnel-runtime";
```

with:

```ts
import { interpolateTokens } from "@/lib/funnel-runtime";
import { sanitizeAnswers, buildFieldValues } from "@/lib/funnel-fields";
```

Replace:

```ts
    const funnel = await prisma.funnel.findFirst({
      where: { id: data.funnelId, status: "PUBLISHED" },
      include: { endings: { orderBy: { order: "asc" } } },
    });
```

with:

```ts
    const funnel = await prisma.funnel.findFirst({
      where: { id: data.funnelId, status: "PUBLISHED" },
      include: {
        endings: { orderBy: { order: "asc" } },
        questions: { orderBy: { order: "asc" } },
      },
    });
```

Replace:

```ts
    if (existing) return { ok: true };
```

with:

```ts
    if (existing) return { ok: true };

    // The server is the trust boundary: re-check every answer against the stored
    // questions (format, prompt) before it is booked, stored or messaged.
    const checked = sanitizeAnswers(funnel.questions, data.answers, funnel.locale);
    if (!checked.ok) return { ok: false, error: "invalid" };
    const answers = checked.answers;
```

Replace:

```ts
        answers: data.answers.map((a) => ({ prompt: a.prompt, answer: a.answer })),
```

with:

```ts
        answers: answers.map((a) => ({ prompt: a.prompt, answer: a.answer })),
```

Replace:

```ts
        answers: data.answers as unknown as Prisma.InputJsonValue,
```

with:

```ts
        answers: answers as unknown as Prisma.InputJsonValue,
```

- [ ] **Step 2: Field tokens in the WhatsApp completion message**

Replace:

```ts
      completionMessage: ending.completionMessage,
      instance: funnel.whatsappInstance,
    });
```

with:

```ts
      completionMessage: ending.completionMessage,
      instance: funnel.whatsappInstance,
      fields: buildFieldValues(funnel.questions, answers),
    });
```

In `deliverWhatsapp`'s argument type, replace:

```ts
  completionMessage: string;
  instance?: string | null;
}): Promise<void> {
```

with:

```ts
  completionMessage: string;
  instance?: string | null;
  /** Field token → answer, for custom `{tokens}` in the completion message. */
  fields: Record<string, string>;
}): Promise<void> {
```

and in its `tokens` object, replace:

```ts
    time: args.time ?? "",
  };
```

with:

```ts
    time: args.time ?? "",
    fields: args.fields,
  };
```

- [ ] **Step 3: CSV — one column per question**

In `src/app/api/admin/funnels/[id]/export/route.ts`, add after the existing imports:

```ts
import { answerColumns, answerCells } from "@/lib/funnel-fields";
```

Replace from `  const header = [` through the end of the `return [ … ]` array inside `rows.map` — i.e. this exact code:

```ts
  const header = [
    "Nome",
    "Cargo",
    "WhatsApp",
    "E-mail",
    "Resultado",
    "Reuniao",
    "Status WhatsApp",
    "Respostas",
    "Recebido em",
  ];

  const lines = rows.map((r) => {
    const answers = (Array.isArray(r.answers) ? r.answers : []) as Answer[];
    const answersText = answers.map((a) => `${a.prompt}: ${a.answer}`).join(" | ");
    return [
      r.name,
      r.role ?? "",
      r.phone ?? "",
      r.email ?? "",
      r.outcome,
      r.meetingStartAt ? r.meetingStartAt.toISOString() : "",
      r.whatsappStatus,
      answersText,
      r.createdAt.toISOString(),
    ]
```

with:

```ts
  // One column per custom question (field name, else the question text), plus
  // "Outras respostas" for answers to deleted questions — nothing is dropped.
  const columns = answerColumns(funnel.questions);
  const header = [
    "Nome",
    "Cargo",
    "WhatsApp",
    "E-mail",
    ...columns.headers,
    "Resultado",
    "Reuniao",
    "Status WhatsApp",
    "Recebido em",
  ];

  const lines = rows.map((r) => {
    const answers = (Array.isArray(r.answers) ? r.answers : []) as Answer[];
    return [
      r.name,
      r.role ?? "",
      r.phone ?? "",
      r.email ?? "",
      ...answerCells(columns, answers),
      r.outcome,
      r.meetingStartAt ? r.meetingStartAt.toISOString() : "",
      r.whatsappStatus,
      r.createdAt.toISOString(),
    ]
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint && npx vitest run`
Expected: clean / `0 errors` / all PASS.

Run the e2e suite (DB up; space runs out — the public endpoints are rate limited to 5/min/IP): `npx playwright test`
Expected: all specs PASS, including `e2e/funnel.spec.ts` — its `Sim` answer to question `q1` must survive `sanitizeAnswers` (question exists → kept).

Manual CSV check: with the dev server up, in `/admin/funnels/<id>/submissions` export the CSV of a funnel that has submissions; confirm one column per question and an `Outras respostas` column.

- [ ] **Step 5: Commit**

```bash
git add src/app/actions/funnels-public.ts "src/app/api/admin/funnels/[id]/export/route.ts"
git commit -m "feat(funnel): validate answers server-side and export one column per question

The server now re-checks every answer against the stored questions and
takes the prompt from the database. Custom {tokens} also work in the
WhatsApp completion message. The CSV replaces the single 'Respostas'
column with one column per question plus 'Outras respostas'.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: Docs and final verification

**Files:**
- Modify: `docs/ARCHITECTURE.md:53`
- Add (if not yet committed): `docs/superpowers/specs/2026-10-13-funnel-custom-fields-design.md`, this plan

- [ ] **Step 1: Architecture docs**

In `docs/ARCHITECTURE.md`, replace:

```markdown
  - `FunnelQuestion` — `key`, `prompt`, `options[]`, `optionNext[]` (branching).
```

with:

```markdown
  - `FunnelQuestion` — `key`, `kind` (`CHOICE` buttons / `TEXT` typed), `prompt`,
    `options[]` + `optionNext[]` or `next` (branching), `fieldName` (its
    `{token}` in later messages and its CSV column) and `inputType` (TEXT
    format: number, date, CPF, CNPJ, link). Rules live in `src/lib/funnel-fields.ts`.
```

- [ ] **Step 2: Full gate**

Run, in order (DB up):

```bash
npm run typecheck && npm run lint && npm run build
npm test
npx playwright test
```

Expected: typecheck clean; lint `0 errors`; build `✓ Generating static pages (74/74)`; Vitest all PASS; Playwright all PASS. Report any failure verbatim instead of declaring done.

- [ ] **Step 3: End-to-end manual check (dev server)**

1. In the admin, add to a test funnel: a descriptive question *"Qual o CNPJ da empresa?"* with field name `CNPJ` and format *CNPJ*, then a question whose prompt uses `{cnpj}`.
2. Open `/f/<slug>` on a phone-width window: the CNPJ field shows the masked input; `11222333000182` shows the error; `11222333000181` advances; the next message quotes `11.222.333/0001-81`.
3. Export the CSV: a `CNPJ` column holds the formatted value.

- [ ] **Step 4: Commit and hand off**

```bash
git add docs/ARCHITECTURE.md docs/superpowers/specs/2026-10-13-funnel-custom-fields-design.md docs/superpowers/plans/2026-10-13-funnel-custom-fields.md
git commit -m "docs(funnel): document custom fields (field name + answer format)

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>"
```

Do **not** push or open the PR — ask the user. When asked to open it, the PR body must call out the **CSV layout change** (the single `Respostas` column is replaced by one column per question) and end with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
