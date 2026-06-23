# 0004 — Defer Content-Security-Policy

- **Status:** Accepted
- **Date:** 2026-06

## Context

The `security-review` skill recommends a strict CSP to mitigate XSS. We added the
safe baseline headers (HSTS, X-Frame-Options, X-Content-Type-Options,
Referrer-Policy, Permissions-Policy) in `next.config.ts`, but a naive CSP would
**break** the site: it emits inline JSON-LD (`<script type="application/ld+json">`),
loads external fonts/images (Google Drive, Unsplash), and Next injects inline
hydration scripts that need a per-request **nonce**.

## Decision

Ship the safe headers now and **defer the CSP** to its own task: a nonce
middleware + an allowlist for the legitimate inline/external sources + per-page
testing.

## Consequences

- ✅ Real, non-breaking security hardening today.
- ⚠️ XSS mitigation via CSP is still missing — tracked as a known gap in
  `SECURITY.md`. Do it as a dedicated, tested change, not a quick add.
