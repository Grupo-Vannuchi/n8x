import { z } from "zod";
import { locales, defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Validation for the admin stats editor. Describes the *stored* shape of a stat
 * (a bilingual label + scalar columns); the client form collects flatter values
 * and maps them to this shape before submitting, and the server action
 * re-validates with the same schema as a security boundary.
 *
 * The localized `label` is built from `locales` so adding a locale needs no
 * change here: the default locale is required, the others may be left blank (the
 * public site falls back to the default locale via `localize`).
 */

/** `{ pt: string, en: string }` — default locale required, others optional. */
const localizedText = z.object(
  Object.fromEntries(
    locales.map((l) => [
      l,
      l === defaultLocale
        ? z.string().trim().min(1, "Required").max(120)
        : z.string().trim().max(120),
    ]),
  ) as Record<Locale, z.ZodString>,
);

/** Lowercase, hyphen-separated key (e.g. "happy-clients"). */
const key = z
  .string()
  .trim()
  .min(1)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

export const statSchema = z.object({
  key,
  value: z.coerce.number().int().min(0).max(1_000_000_000),
  suffix: z.string().trim().max(10),
  order: z.coerce.number().int().min(0).max(9999),
  label: localizedText,
  published: z.boolean(),
});

export type StatInput = z.infer<typeof statSchema>;
