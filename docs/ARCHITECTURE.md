# Architecture

How the n8x system fits together. For coding conventions see
[`AGENTS.md`](../AGENTS.md); for operations see [`RUNBOOK.md`](RUNBOOK.md).

## Big picture

```
                        ┌──────────────────────── Vercel (gru1) ────────────────────────┐
  Visitor ── HTTPS ──▶  │  Next.js 16 (App Router, RSC, Turbopack)                       │
                        │   • (marketing)  public site, SEO, JSON-LD                     │
                        │   • (funnels)    /f/<slug> conversational runtime (noindex)    │
                        │   • admin        login + session-guarded dashboard             │
                        │   server actions ── Prisma ─┐                                  │
                        └─────────────────────────────┼──────────────────────────────────┘
                                                       │ (pooled, pgbouncer, conn_limit=1)
                          Supabase Postgres  ◀─────────┘   DIRECT_URL (5432) for migrations
                                                       │
        external services (server-side only) ◀─────────┤
          • Evolution API (WhatsApp)  api.metodon8n.com.br  → send / instance mgmt
          • Google Calendar (OAuth)   free/busy + create event + Meet link
          • Upstash Redis (Vercel KV) per-IP rate limiting (in-memory fallback)
          • External inbox (link)     metodon8n / Chatwoot / Evo CRM  (no custom chat)
```

- **Hosting:** app on **Vercel** (region `gru1`), DB on **Supabase** (`sa-east-1`),
  domain at Hostinger. The app is **serverless** — no long-lived processes, so
  anything needing a persistent connection (Evolution, an inbox) is external.
- **Cache:** content reads go through the data-access layer with `unstable_cache`
  + tags; admin writes call `updateTag(...)`. On Vercel the cache is distributed,
  so admin edits propagate across instances.

## Layers

| Layer | Where | Notes |
|---|---|---|
| Routing / i18n | `src/proxy.ts`, `src/i18n/*` | next-intl, locale prefix `as-needed`; proxy excludes `/api` |
| Pages (RSC) | `src/app/[locale]/**` | route groups: `(marketing)`, `(funnels)`, `admin` |
| Server actions | `src/app/actions/**` | the write/command layer (auth-gated for admin) |
| API routes | `src/app/api/admin/**` | Google OAuth connect/callback, CSV export |
| Data access (DAL) | `src/lib/queries.ts`, `src/lib/admin-queries.ts` | cached public reads; admin reads |
| Integrations | `src/lib/evolution.ts`, `google-calendar.ts`, `rate-limit.ts` | server-only |
| Validation | `src/lib/validations/*` (zod) | shared client form + server boundary |
| Config | `src/config/site.ts` | white-label brand + theme |

## Data model (Prisma — highlights)

- **Marketing content:** `Service`, `Project`, `Information`, `Testimonial`,
  `TeamMember`, `Stat`, `Client` — bilingual JSON fields resolved per request.
- **Leads:** `Lead` (contact / careers).
- **Funnels:**
  - `Funnel` — `slug`, `locale`, `status`, `defaultBlock` (Json), `whatsappInstance?`.
  - `FunnelQuestion` — `key`, `kind` (`CHOICE` buttons / `TEXT` typed), `prompt`,
    `options[]` + `optionNext[]` or `next` (branching), `fieldName` (its
    `{token}` in later messages and its CSV column) and `inputType` (TEXT
    format: number, date, CPF, CNPJ, link). Rules live in `src/lib/funnel-fields.ts`.
  - `FunnelEnding` — `key`, `name`, `type` (MEETING/BONUS/MESSAGE/REDIRECT),
    `completionMessage`, + per-type config (meeting hours, bonus URL, redirect URL).
  - `FunnelSubmission` — captured lead + `answers` (Json) + `outcome` + WhatsApp status.
  - `FunnelDefaultTemplate` — global default opening block per locale.
- **Integration state:** `GoogleAccount` (singleton: tokens + `invalidatedAt`).

## Funnels subsystem (the core feature)

A funnel is a chat-style quiz shared by direct link (Instagram bio, message bots).

**Build (admin):** `funnel-form` (react-hook-form + useFieldArray) edits the
default capture block, branching questions, and named endings. Sub-pages:
`whatsapp` (instance panel), `google` (OAuth), `[id]/submissions` (inbox + CSV).

**Run (public):** `(funnels)/f/[slug]` → `funnel-runner` (client) walks the
default block → questions (buttons) → an ending resolved by **branching**
(`optionNext` points to a question key, an ending key, `"END"`, or `""`=next).

**Endings:**
- **MEETING** → `funnel-scheduler` loads slots from Google (live, not cached),
  books an event with a Meet link. Falls back honestly if scheduling is down.
- **BONUS** → button opens + downloads a PDF.
- **MESSAGE** → completion WhatsApp only.
- **REDIRECT** → sends the lead to an external URL (countdown + button).

**On completion** (`submitFunnel`, public, no auth): rate-limit → validate →
persist `FunnelSubmission` (durable first) → book meeting (if MEETING) →
best-effort WhatsApp (never blocks persistence). Idempotent via `submissionToken`.

**Tokens** in messages: `{NOME}`, `{CARGO}`, `{LINK}`, `{DATA}`, `{HORA}`.

## Key decisions

Recorded as ADRs in [`docs/adr/`](adr/): Evolution vs Cloud API, Upstash for
rate limiting, per-funnel WhatsApp instance, CSP deferred, external inbox instead
of a custom one.
