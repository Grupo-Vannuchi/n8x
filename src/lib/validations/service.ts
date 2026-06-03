import { z } from "zod";
import { locales, defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Validation for the admin services editor. Describes the *stored* shape of a
 * service (bilingual JSON maps + scalar columns); the client form collects
 * flatter values and maps them to this shape before submitting, and the server
 * action re-validates with the same schema as a security boundary.
 *
 * Localized fields are built from `locales` so adding a locale needs no change
 * here: the default locale is required, the others may be left blank (the public
 * site falls back to the default locale via `localize`).
 */

/** `{ pt: string, en: string }` — default locale required, others optional. */
const localizedText = z.object(
  Object.fromEntries(
    locales.map((l) => [
      l,
      l === defaultLocale
        ? z.string().trim().min(1, "Required").max(300)
        : z.string().trim().max(300),
    ]),
  ) as Record<Locale, z.ZodString>,
);

/** Lowercase, hyphen-separated slug (e.g. "social-media"). */
const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

export const serviceSchema = z.object({
  slug,
  icon: z.string().trim().min(1).max(50),
  order: z.coerce.number().int().min(0).max(9999),
  title: localizedText,
  description: localizedText,
  published: z.boolean(),
});

export type ServiceInput = z.infer<typeof serviceSchema>;
