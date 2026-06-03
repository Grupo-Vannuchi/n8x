import { locales, type Locale } from "@/i18n/routing";
import type { TeamMemberInput } from "@/lib/validations/team";

/**
 * Bridges the admin team form and the stored team-member shape. Socials are
 * flattened to individual form fields (instagram, linkedin) and re-assembled on
 * submit. Kept free of "use client" / "server-only" so both sides can import it.
 */

type LocalizedStrings = Record<Locale, string>;

export type TeamFormValues = {
  name: string;
  photoUrl: string;
  order: string;
  published: boolean;
  instagram: string;
  linkedin: string;
  role: LocalizedStrings;
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

/** Blank form, used by the "new team member" page. Defaults to published. */
export function emptyTeamForm(): TeamFormValues {
  return {
    name: "",
    photoUrl: "",
    order: "0",
    published: true,
    instagram: "",
    linkedin: "",
    role: blankLocalized(),
  };
}

/** Team-member row as stored (photoUrl nullable, socials opaque JSON). */
type TeamMemberRow = {
  name: string;
  photoUrl: string | null;
  order: number;
  published: boolean;
  socials: unknown;
  role: unknown;
};

function readSocial(socials: unknown, key: string): string {
  const obj = (socials ?? {}) as Record<string, unknown>;
  return typeof obj[key] === "string" ? (obj[key] as string) : "";
}

/** Pre-fill the form from a stored team member (edit page). */
export function teamMemberToForm(member: TeamMemberRow): TeamFormValues {
  return {
    name: member.name,
    photoUrl: member.photoUrl ?? "",
    order: String(member.order),
    published: member.published,
    instagram: readSocial(member.socials, "instagram"),
    linkedin: readSocial(member.socials, "linkedin"),
    role: readLocalizedText(member.role),
  };
}

/** Map flat form values to the structured input the server validates. */
export function formToInput(values: TeamFormValues): TeamMemberInput {
  return {
    name: values.name.trim(),
    photoUrl: values.photoUrl.trim(),
    order: Number(values.order),
    published: values.published,
    socials: {
      instagram: values.instagram.trim(),
      linkedin: values.linkedin.trim(),
    },
    role: trimLocalized(values.role),
  };
}
