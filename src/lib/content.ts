import { z } from "zod";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";

/**
 * Bilingual content stored in the database (Prisma `Json` columns) is shaped as
 * a map of locale → string. These helpers resolve and validate that shape so the
 * rest of the app works with plain, locale-correct strings.
 */
export type LocalizedText = Record<Locale, string>;

/** A localized rich-text body: an ordered list of paragraphs per locale. */
export type LocalizedRichText = Record<Locale, string[]>;

const localizedTextSchema = z.object(
  Object.fromEntries(locales.map((l) => [l, z.string()])) as Record<
    Locale,
    z.ZodString
  >,
);

const localizedRichTextSchema = z.object(
  Object.fromEntries(locales.map((l) => [l, z.array(z.string())])) as Record<
    Locale,
    z.ZodArray<z.ZodString>
  >,
);

/** Resolve a `LocalizedText` JSON value to a string for the active locale. */
export function localize(value: unknown, locale: Locale): string {
  const parsed = localizedTextSchema.safeParse(value);
  if (!parsed.success) return "";
  return parsed.data[locale] || parsed.data[defaultLocale] || "";
}

/** Resolve a `LocalizedRichText` JSON value to a string[] for the active locale. */
export function localizeRich(value: unknown, locale: Locale): string[] {
  const parsed = localizedRichTextSchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data[locale]?.length
    ? parsed.data[locale]
    : (parsed.data[defaultLocale] ?? []);
}

/** Build a `LocalizedText` value, useful in seeds, forms and tests. */
export function localizedText(values: LocalizedText): LocalizedText {
  return values;
}
