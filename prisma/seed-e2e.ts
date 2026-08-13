import process from "node:process";
import { PrismaClient } from "@prisma/client";

/** Slug of the funnel the E2E suite drives. */
export const E2E_FUNNEL_SLUG = "e2e-funnel";

/**
 * Fixed id for the seeded funnel — deliberately not a fresh cuid.
 *
 * The seed writes straight to Postgres, so it can't invalidate the DAL's
 * `unstable_cache` the way the admin actions do (`updateTag(tags.funnels)`).
 * A dev server that is already running therefore keeps serving the funnel it
 * cached from an earlier seed. When every run minted a new id, that cached copy
 * carried a **deleted** id, and submitting it failed with `not_found` — the
 * suite went red locally while CI (fresh server, cold cache) stayed green.
 * Pinning the id keeps a stale cache pointing at a funnel that still exists.
 */
export const E2E_FUNNEL_ID = "e2efunnelfixedid000000000";

/**
 * Seed (idempotently) a published, dependency-free MESSAGE funnel for the E2E
 * suite: a one-line default block + a name capture, one yes/no question, and a
 * MESSAGE ending — no Google/WhatsApp needed (the WhatsApp send is best-effort
 * and never blocks the submission). Re-running replaces the prior copy.
 */
export async function seedE2EFunnel(): Promise<void> {
  // Outside Next (tsx / Playwright global setup) nothing loads .env, so pull in
  // DATABASE_URL ourselves. `loadEnvFile` exists on Node 20.12+/22+.
  const proc = process as typeof process & {
    loadEnvFile?: (path?: string) => void;
  };
  try {
    proc.loadEnvFile?.();
  } catch {
    /* .env is optional (e.g. CI provides env directly) */
  }

  const prisma = new PrismaClient();
  try {
    await prisma.funnel.deleteMany({ where: { slug: E2E_FUNNEL_SLUG } });
    await prisma.funnel.create({
      data: {
        id: E2E_FUNNEL_ID,
        slug: E2E_FUNNEL_SLUG,
        locale: "pt",
        name: "E2E test funnel",
        status: "PUBLISHED",
        defaultBlock: [
          { kind: "bot", text: "Oi! Este é um funil de teste." },
          { kind: "input", field: "name", prompt: "Como podemos te chamar?" },
        ],
        questions: {
          create: [
            {
              order: 0,
              key: "q1",
              prompt: "Tudo certo para começar?",
              options: ["Sim", "Não"],
              optionNext: ["END", "END"],
            },
          ],
        },
        endings: {
          create: [
            {
              order: 0,
              key: "end",
              name: "Mensagem",
              type: "MESSAGE",
              completionMessage: "Obrigado, {NOME}!",
            },
          ],
        },
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

// Allow `npm run db:seed-e2e` to run it directly (no import.meta — this module
// is also imported by Playwright's global setup, which transpiles to CommonJS).
const invokedDirectly = process.argv[1]
  ?.replace(/\\/g, "/")
  .endsWith("prisma/seed-e2e.ts");
if (invokedDirectly) {
  seedE2EFunnel()
    .then(() => console.log(`Seeded E2E funnel at /f/${E2E_FUNNEL_SLUG}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
