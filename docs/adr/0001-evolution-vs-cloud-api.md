# 0001 — WhatsApp gateway: Evolution API (Baileys), not Cloud API (yet)

- **Status:** Accepted
- **Date:** 2026-06

## Context

Funnels send WhatsApp on completion and (optionally) manage instances. Two
gateways were considered: the **official WhatsApp Cloud API** (Meta) and
**Evolution API** (Baileys, unofficial). The team already had an Evolution
server available (via metodon8n) with credentials.

## Decision

Use **Evolution API** as the WhatsApp gateway for now, accessed via
`EVOLUTION_BASE_URL` + a global API key. The app stays gateway-agnostic at the
edges (a thin `src/lib/evolution.ts` client), so the gateway can be swapped.

## Consequences

- ✅ Fast to ship, cheap, free-form messaging, an existing server to use.
- ⚠️ Baileys is unofficial → **ban risk** on the number; reliability depends on
  the (currently third-party) server being up.
- The **gold-standard** transport long-term is the official **Cloud API** for
  compliance/scale. Revisit when WhatsApp becomes business-critical; the inbox
  (ADR-0005) is already gateway-portable.
