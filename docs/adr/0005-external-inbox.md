# 0005 — Link an external inbox, don't build a chat

- **Status:** Accepted
- **Date:** 2026-06

## Context

We considered building a WhatsApp conversation inbox inside the admin (read chats,
reply per contact). Evolution exposes the endpoints (findChats/findMessages/send +
webhooks), but a full inbox is a CRM product: it needs message storage, a webhook
receiver, realtime, media handling and LGPD retention — and realtime fights the
serverless architecture (no server-side websockets on Vercel).

## Decision

**Do not rebuild the chat.** Follow the market gold standard: a dedicated inbox
(Chatwoot, or Evolution's bundled Evo CRM) as a separate service, **linked** from
the admin via `WHATSAPP_INBOX_URL` (the "Conversas" button). Our app keeps the
funnels + instance lifecycle; the inbox handles conversations.

## Consequences

- ✅ No reinventing a CRM; the inbox is maintained, multi-agent, portable across
  gateways; the codebase stays lean.
- The link points at metonon8n today; when self-hosting Evolution, point it at
  Chatwoot/Evo CRM (one env change). Revisit only if a branded in-app inbox
  becomes strategically necessary.
