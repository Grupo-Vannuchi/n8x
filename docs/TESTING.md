# Testing plan

The strategy and rollout for automated tests in n8x. Grounded in the
`react-testing` and `e2e-testing` skills, adapted to this codebase. Status:
**Phase 3a landed** (Vitest base + first unit/component tests + CI). Phase 3b
(Playwright) and 3c (growth) still open.

## Philosophy

Test the **test pyramid**, behavior over implementation:

```
        ▲  few   E2E (Playwright) ............ full user flows, real browser
       ███       Component (Vitest + RTL) ..... a component's behavior + a11y
      █████ many Unit (Vitest) ................ pure logic (no DB, no DOM)
```

- **Test what the user sees and does**, not internal state, props, or render counts.
- Query by **role/label/text** first; `data-testid` is the escape hatch.
- A pure function or a component with logic → **Vitest/RTL**. A flow across pages,
  real layout, or a browser API JSDOM lacks → **Playwright**.

## Tooling to add (dev deps)

| Layer | Packages |
|---|---|
| Unit / component | `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `vitest-axe` |
| E2E | `@playwright/test` (+ `npx playwright install`) |

Scripts (package.json):

```jsonc
"test": "vitest run",
"test:watch": "vitest",
"test:cov": "vitest run --coverage",
"test:e2e": "playwright test"
```

## Setup pieces (n8x-specific)

### Vitest
- **`vitest.config.ts`** — `environment: "jsdom"`, the `@/` alias mirroring
  `tsconfig.json`, a setup file, coverage (v8). Crucially, **stub static asset
  imports** (`*.png`, `*.svg`) so tests don't need `next build`/`next-env.d.ts`:
  ```ts
  resolve: { alias: { "@": "/src", "\\.(png|jpe?g|svg|webp)$": "/test/asset-stub.ts" } }
  ```
- **`test/setup.ts`** — `import "@testing-library/jest-dom"`; extend `vitest-axe`.
- **`test/test-utils.tsx`** — a `renderWithIntl(ui, { locale })` that wraps in
  `NextIntlClientProvider` with the real `src/messages/pt.json`, so `t()` returns
  the actual copy and assertions read like the UI.

### What to mock (and what NOT)
- **Server actions** (`submitFunnel`, `submitContactLead`, …): n8x uses Server
  Actions, **not client `fetch`** — so don't reach for MSW for these. `vi.mock`
  the action module and assert it was called with the right payload:
  ```ts
  vi.mock("@/app/actions/funnels-public", () => ({ submitFunnel: vi.fn() }));
  ```
  (Use **MSW** only if/when a real client-side `fetch` appears.)
- **`@/lib/prisma`**: mock it for any action *unit* test (no DB in unit tests).
- **Never** mock React or `next-intl` internals; wrap with the real provider.
- React Compiler is off in Vitest (plain React) — fine; purity is a lint concern.

### Playwright
- **`playwright.config.ts`** — `webServer` runs the app against a **test DB**
  (`npm run build && npm run start`, or `npm run dev` locally); `retries: 2` in
  CI, `workers: 1` in CI; `trace: "on-first-retry"`, `screenshot/video:
  "...-on-failure"`. Projects: chromium (+ mobile-chrome later).
- **Seed a published, dependency-free funnel** (a `MESSAGE` or `REDIRECT` ending —
  no Google/WhatsApp needed; WhatsApp send is best-effort and never blocks). Add a
  `prisma/seed-e2e.ts` that creates it, run before the suite.
- Prefer accessible locators (`getByRole`/`getByText`); add a few `data-testid`
  only where the chat UI is ambiguous.

## What to test — prioritized

### Unit (Vitest) — pure logic, fast, high coverage
| Target | File | Why |
|---|---|---|
| `interpolateTokens` ({NOME}/{DATA}/{HORA}…) | `src/lib/funnel-runtime.ts` | core, pure, easy |
| phone normalize / mask (BR → E.164) | `src/lib/phone.ts` | pure, edge cases |
| rate-limit in-memory window | `src/lib/rate-limit.ts` | pure, fail-open |
| form converters `formToInput`/`funnelToForm` | `src/lib/funnel-form.ts` | round-trip correctness |
| zod schemas (funnel, lead, submission) | `src/lib/validations/*` | boundary rules + honeypot |

### Component (Vitest + RTL) — behavior + a11y
| Target | File | Key cases |
|---|---|---|
| **`funnel-runner`** | `src/components/funnels/funnel-runner.tsx` | branching to questions/endings; **the "Não" → ending keeps the answer** (regression of the stale-closure bug); phone validation/mask; rate-limited / error messages |
| `funnel-scheduler` | `src/components/funnels/funnel-scheduler.tsx` | unavailable slots → `onUnavailable`; pick a slot → `onConfirm` |
| `contact-form` / `careers-form` | `src/components/forms/*` | honeypot dropped; zod errors shown; success state; **axe: no violations** |
| `funnel-form` (admin) | `src/components/admin/funnel-form.tsx` | add/remove ending; empty-name error (light) |

### E2E (Playwright) — full flows
| Flow | Notes |
|---|---|
| Fill a funnel end-to-end | seeded `MESSAGE`/`REDIRECT` funnel → answer → see completion → assert a `FunnelSubmission` row |
| Contact form submit | fill → success; (optionally) honeypot path |
| Admin smoke | login → one CRUD action visible |

> The funnel **MEETING** ending depends on Google (live slots) — cover it with a
> component test (mock the slots action), **not** E2E, to stay deterministic.

## Conventions (from the skills)
- `await` every `userEvent`; `userEvent.setup()` once per test.
- Async: `findBy*` / `waitFor` — **never** `setTimeout` + assert.
- No DOM snapshots (break on styling, rubber-stamped). Snapshots only for pure
  serializers.
- Run **axe** on every interactive component.
- Coverage targets: utils ≥90%, hooks ≥85%, presentational ≥80%, containers ≥70%.
  Start thresholds **non-blocking**, tighten over time.

## CI integration
- **Vitest → the existing job** (`.github/workflows/ci.yml`): add a `Test` step.
  It's fast and needs no browser/DB (static assets are stubbed), so it can run
  early. Goal: a red `npm run test` blocks the PR.
- **Playwright → a separate job/workflow** (heavier: browsers + app + DB):
  `playwright install --with-deps`, the Postgres service, seed, `playwright test`,
  upload the HTML report artifact. Land this **after** the local E2E suite is
  green; until then run E2E locally.

## Phased rollout

### Phase 3a — Vitest base + first tests + CI  *(DONE)*
- [x] Deps + scripts (`test`, `test:watch`) + `vitest.config.ts` + `test/setup.ts` + `test/test-utils.tsx`. Asset stub deferred — the tested components don't import images; add it when one does.
- [x] Unit tests: `interpolateTokens`, `phone`, `rate-limit` (exported `memLimit`), `funnel-form` round-trip.
- [x] Component tests: `funnel-runner` (**answers regression**), `contact-form` (honeypot hidden + validation + success + axe).
- [x] Added the `Test` step to `ci.yml` (runs first — no DB/browser needed).
- **Done:** `npm run test` is green (26 tests); the answers-regression test fails if the `answerChoice` fix is reverted.

### Phase 3b — Playwright + E2E  *(local DONE)*
- [x] Playwright + `playwright.config.ts` (chromium; `webServer: npm run dev`; `locale: pt-BR` so next-intl serves the seeded pt content) + `prisma/seed-e2e.ts` (run in `globalSetup`).
- [x] E2E: complete the seeded MESSAGE funnel end to end; submit the contact form. `npm run test:e2e` (2 passing).
- [ ] CI: the separate `e2e` job (Postgres service + seed + browsers) is intentionally **deferred** — run E2E locally first, wire CI once the suite is stable.
- **Done (local):** `npm run test:e2e` is green. CI job still open.

### Phase 3c — grow coverage  *(ongoing)*
- [ ] Add tests with each new feature (TDD where it fits).
- [ ] Tighten coverage thresholds once the base is stable.

## Anti-patterns to avoid
`container.querySelector`, asserting render counts, mocking React/`next-intl`,
mocking child components by default, ignoring `act()` warnings, `waitForTimeout`,
DOM snapshots. (See the `react-testing` / `e2e-testing` skills for the full list.)

## Open decisions
1. Add the Playwright **CI job now** or run E2E locally first? *(recommend: local first)*
2. **Enforce coverage thresholds** from the start, or start non-blocking? *(recommend: non-blocking, then tighten)*
3. E2E browsers: chromium-only at first, or add firefox/webkit/mobile? *(recommend: chromium first)*
