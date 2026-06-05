import { locales, type Locale } from "@/i18n/routing";
import type { StatInput } from "@/lib/validations/stat";

/**
 * Bridges the admin stats form and the stored stat shape.
 *
 * The form works with flat, text-friendly values (numbers as strings);
 * `formToInput` maps those to the structured `StatInput` the server expects, and
 * `statToForm` does the reverse so the edit form can be pre-filled. Kept free of
 * "use client" / "server-only" so both sides can import it.
 */

/** Localized string map, one entry per supported locale. */
type LocalizedStrings = Record<Locale, string>;

export type StatFormValues = {
  key: string;
  value: string;
  suffix: string;
  order: string;
  published: boolean;
  label: LocalizedStrings;
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

/** Blank form, used by the "new stat" page. Defaults to published. */
export function emptyStatForm(): StatFormValues {
  return {
    key: "",
    value: "0",
    suffix: "",
    order: "0",
    published: true,
    label: blankLocalized(),
  };
}

/** Stat row (the bilingual fields arrive as opaque JSON). */
type StatRow = {
  key: string;
  value: number;
  suffix: string;
  order: number;
  published: boolean;
  label: unknown;
};

/** Pre-fill the form from a stored stat (edit page). */
export function statToForm(stat: StatRow): StatFormValues {
  return {
    key: stat.key,
    value: String(stat.value),
    suffix: stat.suffix,
    order: String(stat.order),
    published: stat.published,
    label: readLocalizedText(stat.label),
  };
}

/** Map flat form values to the structured input the server validates. */
export function formToInput(values: StatFormValues): StatInput {
  return {
    key: values.key.trim(),
    value: Number(values.value),
    suffix: values.suffix.trim(),
    order: Number(values.order),
    published: values.published,
    label: trimLocalized(values.label),
  };
}
