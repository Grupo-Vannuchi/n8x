import { z } from "zod";
import { locales, defaultLocale, type Locale } from "@/i18n/routing";

/**
 * Validation for the admin team editor. A team member has a name, optional
 * photo, a bilingual role/title, optional social links (the public site renders
 * Instagram and LinkedIn) and the usual order/published flags.
 *
 * The client form collects flat string values and maps them to this shape
 * before submitting; the server action re-validates with the same schema as a
 * security boundary.
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

const url = z.string().trim().url().max(500);
/** Optional URL — an empty string means "not set". */
const optionalUrl = z.union([url, z.literal("")]);

export const teamMemberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  photoUrl: optionalUrl,
  role: localizedText,
  socials: z.object({
    instagram: optionalUrl,
    linkedin: optionalUrl,
  }),
  order: z.coerce.number().int().min(0).max(9999),
  published: z.boolean(),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
