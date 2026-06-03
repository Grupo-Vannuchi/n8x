import { locales, type Locale } from "@/i18n/routing";
import type { ServiceInput } from "@/lib/validations/service";

/**
 * Bridges the admin services form and the stored service shape.
 *
 * The form works with flat, text-friendly values (numbers as strings);
 * `formToInput` maps those to the structured `ServiceInput` the server expects,
 * and `serviceToForm` does the reverse so the edit form can be pre-filled. Kept
 * free of "use client" / "server-only" so both sides can import it.
 */

/** Localized string map, one entry per supported locale. */
type LocalizedStrings = Record<Locale, string>;

export type ServiceFormValues = {
  slug: string;
  icon: string;
  order: string;
  published: boolean;
  title: LocalizedStrings;
  description: LocalizedStrings;
};

function blankLocalized(): LocalizedStrings {
  return Object.fromEntries(locales.map((l) => [l, ""])) as LocalizedStrings;
}

/** Read a `LocalizedText` JSON value into a complete per-locale string map. */
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

/** Blank form, used by the "new service" page. Defaults to published. */
export function emptyServiceForm(): ServiceFormValues {
  return {
    slug: "",
    icon: "",
    order: "0",
    published: true,
    title: blankLocalized(),
    description: blankLocalized(),
  };
}

/** Service row (the bilingual fields arrive as opaque JSON). */
type ServiceRow = {
  slug: string;
  icon: string;
  order: number;
  published: boolean;
  title: unknown;
  description: unknown;
};

/** Pre-fill the form from a stored service (edit page). */
export function serviceToForm(service: ServiceRow): ServiceFormValues {
  return {
    slug: service.slug,
    icon: service.icon,
    order: String(service.order),
    published: service.published,
    title: readLocalizedText(service.title),
    description: readLocalizedText(service.description),
  };
}

/** Map flat form values to the structured input the server validates. */
export function formToInput(values: ServiceFormValues): ServiceInput {
  return {
    slug: values.slug.trim(),
    icon: values.icon.trim(),
    order: Number(values.order),
    published: values.published,
    title: trimLocalized(values.title),
    description: trimLocalized(values.description),
  };
}
