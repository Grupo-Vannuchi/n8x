<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Working in this repo (agents & humans)

Project conventions distilled from real lessons in this codebase and from the
team's coding skills (`prisma-patterns`, `react-patterns`, `react-performance`,
`security-review`, `nextjs-turbopack`). These rules exist because we hit the
bugs they prevent. Follow them.

## Golden rules (read first)

- **Branch:** develop on `Development`. **Ask before committing**; the human
  does the `git push` manually. Don't push or merge to `main` unless asked.
- **Validate every change** before declaring it done:
  `npm run typecheck && npm run lint && npm run build`. Report failures honestly.
- **Never send secrets to the client.** Keys (Evolution, Google, Upstash, DB)
  stay server-side. No `NEXT_PUBLIC_*` for secrets.
- **Both languages, always.** Any UI string goes in **both** `src/messages/pt.json`
  and `src/messages/en.json`.
- Use the dedicated tools/skills. When touching DB, React, security or Next.js,
  the matching skill encodes deeper rules — these are the project-specific subset.

## Where things live

```
src/
  app/[locale]/(marketing)/   public site
  app/[locale]/(funnels)/     public funnel runtime  (/f/<slug>) — noindex
  app/[locale]/admin/         login + (dashboard) session-guarded admin
  app/actions/                server actions (funnels, funnels-public, whatsapp, auth, …)
  app/api/admin/…             admin API routes (google oauth, csv export)
  components/                 ui, sections, admin, funnels
  config/site.ts              ⭐ white-label brand + theme (single source of truth)
  lib/                        env, prisma, queries (DAL), auth, rate-limit, evolution,
                              google-calendar, validations, funnel-*
  messages/                   pt.json, en.json (typed catalogs)
  proxy.ts                    Next 16 proxy (next-intl locale negotiation; excludes /api)
prisma/                       schema.prisma + migrations + seeds + backups/snapshot.sql
docs/                         ARCHITECTURE, RUNBOOK, ADRs, SEO audit
```

## Prisma (database) — skill: `prisma-patterns`

- **Serverless connection pool:** in production `DATABASE_URL` must carry
  `?pgbouncer=true&connection_limit=1` (Supabase pooler, port 6543). `DIRECT_URL`
  (port 5432) is migrations-only and stays unpooled.
- **Migrations:** `prisma migrate deploy` in CI/prod (the Vercel build runs it);
  `prisma migrate dev` **only** on the local Docker DB (it can reset data).
  Never edit a migration file after it has been applied (checksum break).
- **No external calls inside `$transaction`** (5s timeout) — book meetings / send
  WhatsApp *outside* the transaction. Use the array form for independent ops.
- **Never return raw Prisma rows to the client.** Map to a view-model that omits
  secrets (e.g. `FunnelRunView` drops `completionMessage`).
- `updateMany`/`deleteMany` return a **count, not rows**; `@updatedAt` is skipped
  on bulk writes; always pass a `where` to `deleteMany` (the one exception is the
  `GoogleAccount` singleton, commented as intentional).

## React / Next.js — skills: `react-patterns`, `react-performance`, `nextjs-turbopack`

- **Render is pure** (React Compiler is on). No `Date.now()`, `Math.random()`,
  `crypto.randomUUID()` or mutation during render — use refs, effects, or event
  handlers. No `setState` during render.
- **Stale closures kill data.** Don't read state you just set in the same handler.
  Compute the new value locally and pass it forward (this is exactly the funnel
  "answers disappeared" bug — see `answerChoice` → `runSubmit`).
- **Kill request waterfalls.** Independent `await`s → `Promise.all`. Check cheap
  sync conditions before awaiting remote data.
- **Don't block a page render on a slow/optional integration.** Load it
  client-side and non-blocking (e.g. the funnel editor loads WhatsApp instances
  in an effect, never server-side).
- **Server/client boundary:** keep Prisma, secrets and `server-only` modules on
  the server. `"use client"` only when you need state/effects/handlers.
- **Caching:** read content through the DAL (`src/lib/queries.ts`) with
  `unstable_cache` + `tags`; invalidate with `updateTag(tags.<x>)` on writes.
- **Before coding Next APIs**, read `node_modules/next/dist/docs/` — this is
  Next 16 + Turbopack, not your training data.

## Security — skill: `security-review`

- **Public endpoints** (`submitFunnel`, `getFunnelSlots`): honeypot + **per-IP
  rate limit** (`lib/rate-limit`, Upstash with in-memory fallback) + `zod`
  validation as the server boundary.
- **Admin** server actions and `/api/admin/*` routes gate on `getCurrentUser()`.
- **Secrets** only in env, read server-side. Never log them; redact in errors.
- **Integration tokens expire** — detect and surface it (Google `invalid_grant`
  flags `GoogleAccount.invalidatedAt`; the admin panel prompts a reconnect).
  Never fail silently in a way that mimics a different outcome.
- **Headers** are set in `next.config.ts`. CSP is intentionally **deferred**
  (needs a nonce middleware; would break inline JSON-LD) — see ADR-0004.
- Validate user input with `zod`; rely on Prisma's parameterized queries (no raw
  SQL concatenation).

## i18n

- `next-intl`. Add keys to **both** `pt.json` and `en.json`. The funnel is
  single-language per funnel (`locale` chosen at creation). ICU braces in stored
  copy that should render literally must be escaped: `'{NOME}'`.

## Funnels (the big subsystem)

Conversational lead-capture quiz at `/f/<slug>` (noindex), built in the admin.
Branching → per-answer named endings (MEETING / BONUS / MESSAGE / REDIRECT),
Google Calendar + Evolution WhatsApp integrations, per-funnel instance, CSV
export. **Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) before changing it.**

## Workflow & board

- Conventional commits; end the message with
  `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` when an agent helped.
- Tasks on the "Desenvolvimento Vannuchi" board use the title format
  `[ÁREA] - verbo + tarefa`, where ÁREA ∈ **CRE** (novo do zero) · **IMP**
  (integrar o que existe) · **UPD** (melhorar o que existe) · **CRX** (corrigir)
  · **RMV** (remover). See [`.github/ISSUE_TEMPLATE/task.md`](.github/ISSUE_TEMPLATE/task.md).

## Operations

Many integrations need manual setup/maintenance (Google reconnect + publish,
WhatsApp QR, Upstash, Vercel env vars). The steps live in
**[`docs/RUNBOOK.md`](docs/RUNBOOK.md)**; restore/snapshot lives in
[`SNAPSHOT.md`](SNAPSHOT.md).
