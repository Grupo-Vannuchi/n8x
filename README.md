# n8x marketing

[![CI](https://github.com/Grupo-Vannuchi/n8x/actions/workflows/ci.yml/badge.svg)](https://github.com/Grupo-Vannuchi/n8x/actions/workflows/ci.yml)

A production-grade, **marketing-agency website** built with Next.js 16
(App Router), TypeScript, Tailwind CSS v4, Prisma and PostgreSQL. Inspired by the
structure of a full-service advertising agency: hero, services, portfolio/case
studies, stats, client logos, testimonials, team, plus contact & careers lead
capture and a small authenticated admin.

The whole brand is driven by a single config file, the UI is **bilingual
(pt-BR / English)** via next-intl, and all dynamic content lives in Postgres and
is editable through the admin.

> Beyond the marketing site, the app ships a **conversational lead-capture
> "funnels"** feature (admin builder + public `/f/<slug>` runtime) with Google
> Calendar, WhatsApp (Evolution) and rate-limiting integrations. See
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Documentation

| Doc | What |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Conventions & rules — **read before coding** (DB, React, security, Next). |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Setup, workflow, commit/board conventions. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the system fits together + the funnels subsystem. |
| [`docs/RUNBOOK.md`](docs/RUNBOOK.md) | Operations: Google, WhatsApp, Upstash, env vars, deploy. |
| [`docs/adr/`](docs/adr/) | Architecture decision records (the *why*). |
| [`SECURITY.md`](SECURITY.md) | Security policy & pre-deploy checklist. |
| [`SNAPSHOT.md`](SNAPSHOT.md) | Restore/snapshot & first production deploy. |
| [`docs/seo/`](docs/seo/) | SEO audit & action plan. |

---

## Stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | Next.js 16 (App Router, Server Components, Turbopack) |
| Language       | TypeScript (strict)                               |
| Styling        | Tailwind CSS v4 (CSS-first `@theme`)              |
| i18n           | next-intl 4 (locale routing + typed messages)     |
| Database / ORM | PostgreSQL + Prisma 6                             |
| Auth           | jose (HS256 JWT session) + bcryptjs               |
| Forms          | react-hook-form + zod (shared client/server schema) |
| Icons          | lucide-react                                      |

## Architecture at a glance

```
src/
  app/
    [locale]/
      (marketing)/        # public site: home, portfolio, about, contact, careers
      admin/
        login/            # public login screen
        (dashboard)/      # session-guarded: dashboard + leads management
      layout.tsx          # root <html>: fonts, theme, NextIntlClientProvider
    actions/              # server actions (leads, auth, admin)
    sitemap.ts robots.ts manifest.ts
  components/             # ui primitives, layout, sections, forms, admin
  config/site.ts          # ⭐ white-label brand config (single source of truth)
  i18n/                   # routing, navigation, request config
  lib/                    # env, prisma, queries (DAL), session, auth, validations
  messages/               # pt.json, en.json (typed translation catalogs)
  proxy.ts                # Next 16 proxy (next-intl locale negotiation)
prisma/                   # schema.prisma + seed.ts
```

Key design decisions:

- **White-label by config.** `src/config/site.ts` holds brand name, contact
  details, social links, navigation and the **theme palette**. Colours are
  injected as CSS custom properties at runtime (`ThemeStyle`), so re-skinning is
  a config edit — no component changes.
- **Content in the database, copy in catalogs.** UI strings live in
  `src/messages/*.json` (type-checked against the catalog). Dynamic content
  (services, projects, testimonials, team, stats, clients) lives in Postgres with
  bilingual JSON fields resolved per request in the data-access layer
  (`src/lib/queries.ts`).
- **Security boundary in the DAL.** Admin pages are guarded by `requireAdmin`
  (verifies the jose session + DB user). Server actions re-validate every input
  with the same zod schema used on the client.

## How the code works

Everything is organized around one principle: **three kinds of "content" live in
three different places**, so each is easy to change in isolation.

| Kind of content                          | Lives in                         | Why                                   |
| ---------------------------------------- | -------------------------------- | ------------------------------------- |
| **Brand identity** (name, colours, contact, socials, menu) | `src/config/site.ts`            | Re-branding = editing one file        |
| **UI copy** (section titles, buttons, labels)              | `src/messages/{pt,en}.json`     | Bilingual and easy to review          |
| **Dynamic content** (projects, services, testimonials, team, stats) | PostgreSQL (seeded + admin)     | Editable without touching code        |

### Request flow

```
Request  →  proxy.ts                 detects the locale (pt = "/", en = "/en")
         →  app/[locale]/layout.tsx  loads fonts, injects brand colours, provides translations
         →  the page (Server Component)
              ├─ reads UI copy   via getTranslations() → src/messages/*.json
              └─ reads content   via src/lib/queries.ts → PostgreSQL (resolved to the active locale)
         →  rendered HTML
```

### Layer responsibilities

- **`src/config/site.ts`** — the brand. Name, contact, WhatsApp, address, socials,
  navigation and the **theme palette**. `src/components/theme-style.tsx` turns the
  palette into CSS variables in `<head>`, so the colours defined here drive the
  whole site.
- **`src/i18n/`** — locale setup. `routing.ts` declares the locales; `proxy.ts`
  negotiates the locale per request; `request.ts` loads the right message file.
- **`src/messages/{pt,en}.json`** — every fixed string on the site, grouped by
  area (`home`, `about`, `contact`, `footer`, `admin`, …). Keys are type-checked.
- **`prisma/schema.prisma`** — the database tables. Bilingual fields (e.g. a
  project title) are stored as JSON `{ "pt": "…", "en": "…" }`.
- **`prisma/seed.ts`** — the initial/demo content that populates the database.
- **`src/lib/queries.ts`** — the data-access layer: reads published content and
  returns it already resolved to the active locale (view-ready objects).
- **`src/app/[locale]/(marketing)/`** — the public pages. The home page is
  assembled from blocks in **`src/components/sections/`** (hero, services,
  portfolio, stats, clients, testimonials, team, cta).
- **`src/app/[locale]/admin/`** — the login screen and the session-guarded
  dashboard + leads management.
- **`src/lib/{session,auth}.ts` + `src/app/actions/`** — auth (signed cookie via
  jose) and server actions (login, saving a lead, changing a lead's status).

## Funnels & integrations

The admin builds conversational funnels served at `/f/<slug>` (noindex). Endings
can book a **Google Calendar** meeting (with a Meet link), send a **WhatsApp**
message (**Evolution API**), offer a **bonus** download, or **redirect** to an
external URL. The public submit endpoint is **rate-limited** per IP
(**Upstash**/Vercel KV, in-memory fallback). Full design in
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md); operational steps (connecting
Google/WhatsApp, env vars) in [`docs/RUNBOOK.md`](docs/RUNBOOK.md).

Integration env (all optional — features degrade gracefully when unset):
`EVOLUTION_BASE_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`,
`WHATSAPP_INBOX_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`,
`GOOGLE_REDIRECT_URI`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`.

## Customization guide

> Rule of thumb: anything that differs **between pt and en** lives in the message
> files; anything that's **the brand** lives in `src/config/site.ts`.

### Colours

`src/config/site.ts` → the `theme` object (has `light` and `dark`):

```ts
theme: {
  light: {
    brand: "#4f46e5",           // primary colour (buttons, links, highlights)
    brandForeground: "#ffffff", // text on top of the brand colour
    accent: "#f59e0b",          // secondary accent
    background: "#ffffff",
    foreground: "#0a0a0a",      // body text colour
  },
  dark: { /* … */ },
}
```

Change these and the whole site re-colours — no CSS edits needed.

### Brand name, contact, socials, registration

Top of `src/config/site.ts`:

```ts
name: "Lumen Studio",   // shown in the wordmark and page titles
foundedYear: 2016,      // drives the "X years in business" copy
contact: { email, phone, whatsapp, address },
social:  { instagram, tiktok, linkedin },
```

### Navigation menu

`src/config/site.ts` → the `nav` array (order + links). The **labels** are
translations, under the `nav` key in `src/messages/{pt,en}.json`.

### Section titles, hero, buttons and all fixed text

`src/messages/pt.json` and `src/messages/en.json`. For example:

- Hero headline → `home.hero.titleLead` + `home.hero.rotating`
- "Services" title → `home.services.title`
- Buttons → `common.talkToUs`, `common.viewWork`, …
- About page → `about.*`

### Content (projects, services, testimonials, team, stats)

Two options:

1. **Edit the seed data** in `prisma/seed.ts` (each item has a `pt` and `en`
   value), then re-run `npm run db:seed`.
2. **Through the admin** at `/admin` — currently leads management; content CRUD
   is the documented next step.

### Logo

`src/components/layout/logo.tsx` — the only place the wordmark is rendered. Swap
the text for an `<Image>` to use a logo file.

### Images

Demo imagery comes from `picsum.photos` (set in `prisma/seed.ts`). To use images
from another host, add the hostname to `images.remotePatterns` in `next.config.ts`.

### Add a language

1. Add the locale to `locales` in `src/i18n/routing.ts`.
2. Create `src/messages/<locale>.json`.
3. Add the locale key to every bilingual value in `prisma/seed.ts`.

### Quick reference

| I want to change…              | Go to…                                                            |
| ------------------------------ | ----------------------------------------------------------------- |
| Colours                        | `theme` in `src/config/site.ts`                                   |
| Name / contact / socials       | top of `src/config/site.ts`                                       |
| Menu items                     | `nav` in `src/config/site.ts` + labels in `src/messages/*.json`   |
| Section titles / button text   | `src/messages/pt.json` and `src/messages/en.json`                 |
| Projects / services / etc.     | `prisma/seed.ts` (+ `npm run db:seed`) or the admin               |
| Logo                           | `src/components/layout/logo.tsx`                                  |
| Allowed image hosts            | `next.config.ts`                                                  |

## Getting started

### 1. Prerequisites

- Node.js ≥ 20.9
- A PostgreSQL database (a local one is provided via Docker)

### 2. Install & configure

```bash
npm install
cp .env.example .env   # then edit values (a dev .env is already included)
```

Generate a real `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Database

Start the bundled Postgres, apply the schema and load demo content:

```bash
docker compose up -d      # starts Postgres (host port from DB_PORT, default 5432)
npm run db:migrate        # create tables
npm run db:seed           # demo content + first admin user
```

> **Port note:** if you already run a local PostgreSQL on `5432`, set `DB_PORT`
> to a free port (e.g. `5433`) and point `DATABASE_URL` at it. The bundled
> `.env` is configured this way out of the box (`5433`).

The seed creates an admin from `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`
(defaults: `admin@example.com` / `changeme123`).

### 4. Run

```bash
npm run dev
```

- Public site: <http://localhost:3000> (pt-BR) and <http://localhost:3000/en>
- Admin: <http://localhost:3000/admin> → redirects to `/admin/login`

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server (Turbopack)     |
| `npm run build`     | Production build                     |
| `npm run start`     | Serve the production build           |
| `npm run lint`      | ESLint (flat config)                 |
| `npm run typecheck` | `tsc --noEmit`                       |
| `npm run db:migrate`| Apply Prisma migrations (dev)        |
| `npm run db:seed`   | Seed demo content + admin            |
| `npm run db:studio` | Open Prisma Studio                   |

## Notes

- Public content pages render dynamically (fresh from the CMS). Switch to ISR
  with `export const revalidate = N` per page if you prefer cached pages.
- `/admin` is excluded from `robots.txt` and marked `noindex`.
- The admin currently ships **leads management** and a dashboard; the data layer
  and admin shell are structured so content CRUD (projects, services, etc.) can
  be added as additional `(dashboard)` routes following the same pattern.
