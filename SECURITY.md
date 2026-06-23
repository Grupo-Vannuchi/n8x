# Security policy

This project handles personal data (leads) and integrates third-party services,
so security is a first-class concern. It is governed by Brazil's **LGPD** — see
the in-app Terms of Use and Privacy Policy.

## Reporting a vulnerability

Email **marketing@n8company.com.br** with a description and reproduction steps.
Do **not** open a public issue for a security problem. We aim to acknowledge
within a few business days.

## Where the boundaries are

- **Public, unauthenticated:** the marketing site, the contact & careers lead
  forms (`submitContactLead` / `submitCareerLead`), and the funnel runtime
  (`/f/<slug>` + `submitFunnel` / `getFunnelSlots`). All of these carry a honeypot
  + per-IP rate limit. Treat all input as hostile.
- **Authenticated (admin):** everything under `/admin` and `/api/admin/*`, gated
  by `getCurrentUser()` (jose JWT session, bcrypt password).
- **Secrets:** DB, Evolution, Google, Upstash — server-side only, in env vars.

## Conventions (enforced in `AGENTS.md`)

- **Input validation:** every server action / route validates with `zod` at the
  boundary. Prisma queries are parameterized (no raw SQL concatenation).
- **Public endpoints:** honeypot + **per-IP rate limit** (`src/lib/rate-limit.ts`).
- **Secrets:** never `NEXT_PUBLIC_*`, never sent to the client, never logged;
  redact in error messages. The Evolution global key and Google tokens stay server-side.
- **Expired integration tokens** are detected and surfaced (Google `invalid_grant`
  → `GoogleAccount.invalidatedAt` → admin reconnect prompt), never silently mimicking
  a different outcome.
- **Response headers** (`next.config.ts`): HSTS, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
  A **CSP is not yet in place** (needs a nonce middleware — see ADR-0004); this is
  a known gap.

## Pre-deploy checklist

Before merging to `main`:

- [ ] No hardcoded secrets; all in env (and `.env*` git-ignored).
- [ ] New user input validated with `zod`.
- [ ] New public endpoints rate-limited (and honeypotted where it's a form).
- [ ] New admin actions/routes gate on `getCurrentUser()`.
- [ ] No raw Prisma rows with secrets returned to the client (use a view-model).
- [ ] No secrets in logs or error responses.
- [ ] `npm audit` reviewed (transitive Next/postcss advisories are known, dev/build-only).
- [ ] Dependabot PRs triaged.

## Dependencies

Dependabot (`.github/dependabot.yml`) opens weekly npm + actions update PRs.
Run `npm audit` before releases. Note: the current moderate advisories are
transitive to Next.js (postcss/esbuild), build/dev-time, not runtime-exploitable
here — do **not** `npm audit fix --force` (it would downgrade Next). Fix by
upgrading Next within semver when a patch ships.
