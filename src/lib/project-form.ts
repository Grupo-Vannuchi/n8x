import { locales, type Locale } from "@/i18n/routing";
import type { ProjectInput } from "@/lib/validations/project";

/**
 * Bridges the admin portfolio form and the stored project shape.
 *
 * The form works with flat, text-friendly values (arrays entered as comma- or
 * newline-separated text, numbers as strings); `formToInput` maps those to the
 * structured `ProjectInput` the server expects, and `projectToForm` does the
 * reverse so the edit form can be pre-filled. Kept free of "use client" /
 * "server-only" so both sides can import it.
 */

/** Localized string map, one entry per supported locale. */
type LocalizedStrings = Record<Locale, string>;

export type ProjectFormValues = {
  slug: string;
  clientName: string;
  year: string;
  order: string;
  coverImage: string;
  /** One image URL per line. */
  gallery: string;
  /** Comma-separated tags. */
  tags: string;
  featured: boolean;
  published: boolean;
  category: LocalizedStrings;
  title: LocalizedStrings;
  summary: LocalizedStrings;
  /** One paragraph per line, per locale. */
  content: LocalizedStrings;
};

function blankLocalized(): LocalizedStrings {
  return Object.fromEntries(locales.map((l) => [l, ""])) as LocalizedStrings;
}

function linesToArray(value: string): string[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function csvToArray(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Read a `LocalizedText` JSON value into a complete per-locale string map. */
function readLocalizedText(value: unknown): LocalizedStrings {
  const obj = (value ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    locales.map((l) => [l, typeof obj[l] === "string" ? (obj[l] as string) : ""]),
  ) as LocalizedStrings;
}

/** Read a `LocalizedRichText` JSON value into newline-joined paragraphs. */
function readLocalizedRich(value: unknown): LocalizedStrings {
  const obj = (value ?? {}) as Record<string, unknown>;
  return Object.fromEntries(
    locales.map((l) => {
      const arr = Array.isArray(obj[l]) ? (obj[l] as unknown[]) : [];
      return [l, arr.filter((p): p is string => typeof p === "string").join("\n")];
    }),
  ) as LocalizedStrings;
}

function trimLocalized(value: LocalizedStrings): LocalizedStrings {
  return Object.fromEntries(
    locales.map((l) => [l, value[l].trim()]),
  ) as LocalizedStrings;
}

function richFromLocalized(value: LocalizedStrings): Record<Locale, string[]> {
  return Object.fromEntries(
    locales.map((l) => [l, linesToArray(value[l])]),
  ) as Record<Locale, string[]>;
}

/** Blank form, used by the "new project" page. Defaults to published. */
export function emptyProjectForm(): ProjectFormValues {
  return {
    slug: "",
    clientName: "",
    year: "",
    order: "0",
    coverImage: "",
    gallery: "",
    tags: "",
    featured: false,
    published: true,
    category: blankLocalized(),
    title: blankLocalized(),
    summary: blankLocalized(),
    content: blankLocalized(),
  };
}

/** Project row (the bilingual fields arrive as opaque JSON). */
type ProjectRow = {
  slug: string;
  clientName: string;
  year: number;
  order: number;
  coverImage: string;
  gallery: string[];
  tags: string[];
  featured: boolean;
  published: boolean;
  category: unknown;
  title: unknown;
  summary: unknown;
  content: unknown;
};

/** Pre-fill the form from a stored project (edit page). */
export function projectToForm(project: ProjectRow): ProjectFormValues {
  return {
    slug: project.slug,
    clientName: project.clientName,
    year: String(project.year),
    order: String(project.order),
    coverImage: project.coverImage,
    gallery: project.gallery.join("\n"),
    tags: project.tags.join(", "),
    featured: project.featured,
    published: project.published,
    category: readLocalizedText(project.category),
    title: readLocalizedText(project.title),
    summary: readLocalizedText(project.summary),
    content: readLocalizedRich(project.content),
  };
}

/** Map flat form values to the structured input the server validates. */
export function formToInput(values: ProjectFormValues): ProjectInput {
  return {
    slug: values.slug.trim(),
    clientName: values.clientName.trim(),
    year: Number(values.year),
    order: Number(values.order),
    coverImage: values.coverImage.trim(),
    gallery: linesToArray(values.gallery),
    tags: csvToArray(values.tags),
    category: trimLocalized(values.category),
    title: trimLocalized(values.title),
    summary: trimLocalized(values.summary),
    content: richFromLocalized(values.content),
    featured: values.featured,
    published: values.published,
  };
}
