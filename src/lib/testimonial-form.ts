import { locales, type Locale } from "@/i18n/routing";
import type { TestimonialInput } from "@/lib/validations/testimonial";

/**
 * Bridges the admin testimonials form and the stored testimonial shape (numbers
 * as strings, bilingual maps). Kept free of "use client" / "server-only" so both
 * sides can import it.
 */

type LocalizedStrings = Record<Locale, string>;

export type TestimonialFormValues = {
  authorName: string;
  company: string;
  avatarUrl: string;
  rating: string;
  order: string;
  published: boolean;
  role: LocalizedStrings;
  quote: LocalizedStrings;
};

function blankLocalized(): LocalizedStrings {
  return Object.fromEntries(locales.map((l) => [l, ""])) as LocalizedStrings;
}

function readLocalizedText(value: unknown): LocalizedStrings {
  const obj = (value ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    locales.map((l) => [l, typeof obj[l] === "string" ? (obj[l] as string) : ""]),
  ) as LocalizedStrings;
}

function trimLocalized(value: LocalizedStrings): LocalizedStrings {
  return Object.fromEntries(
    locales.map((l) => [l, value[l].trim()]),
  ) as LocalizedStrings;
}

/** Blank form, used by the "new testimonial" page. Defaults to 5 stars, published. */
export function emptyTestimonialForm(): TestimonialFormValues {
  return {
    authorName: "",
    company: "",
    avatarUrl: "",
    rating: "5",
    order: "0",
    published: true,
    role: blankLocalized(),
    quote: blankLocalized(),
  };
}

/** Testimonial row as stored (avatarUrl nullable, bilingual fields opaque JSON). */
type TestimonialRow = {
  authorName: string;
  company: string;
  avatarUrl: string | null;
  rating: number;
  order: number;
  published: boolean;
  role: unknown;
  quote: unknown;
};

/** Pre-fill the form from a stored testimonial (edit page). */
export function testimonialToForm(t: TestimonialRow): TestimonialFormValues {
  return {
    authorName: t.authorName,
    company: t.company,
    avatarUrl: t.avatarUrl ?? "",
    rating: String(t.rating),
    order: String(t.order),
    published: t.published,
    role: readLocalizedText(t.role),
    quote: readLocalizedText(t.quote),
  };
}

/** Map flat form values to the structured input the server validates. */
export function formToInput(values: TestimonialFormValues): TestimonialInput {
  return {
    authorName: values.authorName.trim(),
    company: values.company.trim(),
    avatarUrl: values.avatarUrl.trim(),
    rating: Number(values.rating),
    order: Number(values.order),
    published: values.published,
    role: trimLocalized(values.role),
    quote: trimLocalized(values.quote),
  };
}
