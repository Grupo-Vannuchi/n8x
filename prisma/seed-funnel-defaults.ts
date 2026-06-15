import type { PrismaClient } from "@prisma/client";
import { DEFAULT_TEMPLATE_STEPS } from "../src/lib/funnel-runtime";

/**
 * Seed the global default lead-capture block, one row per locale. Idempotent
 * (upsert by locale). New funnels copy these steps into their `defaultBlock`.
 */
export async function seedFunnelDefaults(prisma: PrismaClient): Promise<void> {
  const locales = Object.keys(DEFAULT_TEMPLATE_STEPS) as Array<
    keyof typeof DEFAULT_TEMPLATE_STEPS
  >;
  for (const locale of locales) {
    const steps = DEFAULT_TEMPLATE_STEPS[locale];
    await prisma.funnelDefaultTemplate.upsert({
      where: { locale },
      update: { steps },
      create: { locale, steps },
    });
  }
  console.log(`✓ funnel default templates (${locales.join(", ")})`);
}
