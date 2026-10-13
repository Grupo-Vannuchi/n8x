/**
 * Shared funnel runtime types + helpers, used by the admin builder, the public
 * runner, and the seed. Funnel copy is single-language plain strings (the funnel
 * carries its own `locale`), NOT the bilingual LocalizedText JSON of the CMS.
 */

import type { Locale } from "@/i18n/routing";

/**
 * One step of the standard lead-capture opening ("default block"). Either a bot
 * line (chat bubble) or a field the visitor must fill. The block is stored as an
 * ordered array of these on both the global template and each funnel snapshot.
 */
export type FunnelDefaultStep =
  | { kind: "bot"; text: string }
  | {
      kind: "input";
      field: "name" | "role" | "phone" | "email";
      prompt: string;
    };

/** A captured answer to a custom question (a chosen option or free text). */
export type FunnelAnswer = { questionId: string; prompt: string; answer: string };

/** Values collected by the default block, used for token interpolation. */
export type FunnelLeadValues = {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
  /** Google Meet link of a booked meeting, for the `{LINK}` token. */
  link?: string;
  /** Booked meeting date / time (pre-formatted in the funnel locale + timezone). */
  date?: string;
  time?: string;
  /**
   * Custom-question answers by field token (see `buildFieldValues` in
   * `funnel-fields.ts`). Holds every token the funnel defines, "" until
   * answered — presence is what separates a defined field from a typo.
   */
  fields?: Record<string, string>;
};

/** Built-in tokens (pt and en spellings) → the lead value that fills them. */
export const BUILT_IN_TOKENS: ReadonlyMap<
  string,
  "name" | "role" | "link" | "date" | "time"
> = new Map([
  ["nome", "name"],
  ["name", "name"],
  ["cargo", "role"],
  ["role", "role"],
  ["link", "link"],
  ["data", "date"],
  ["date", "date"],
  ["hora", "time"],
  ["time", "time"],
]);

/**
 * Replace `{tokens}` (case-insensitive, spaces inside the braces tolerated) in a
 * bot/message string, in a single pass so a value that looks like a token is
 * never re-interpolated:
 * - built-ins (`{NOME}`, `{CARGO}`, `{LINK}`, `{DATA}`, `{HORA}` and English
 *   spellings) → the captured value, or "" when empty;
 * - a field token the funnel defines → its answer, or "" until answered;
 * - anything else (a typo such as `{empresaa}`) → left as written, so it shows
 *   up while testing instead of silently vanishing.
 */
export function interpolateTokens(
  text: string,
  values: FunnelLeadValues,
): string {
  return text.replace(/\{\s*([a-z0-9_]+)\s*\}/gi, (match, raw: string) => {
    const token = raw.toLowerCase();
    const builtIn = BUILT_IN_TOKENS.get(token);
    if (builtIn) return values[builtIn]?.trim() ?? "";
    const fields = values.fields;
    if (fields && Object.hasOwn(fields, token)) return fields[token].trim();
    return match;
  });
}

/**
 * The original, editable default lead-capture block, one per locale. Seeded into
 * `FunnelDefaultTemplate` and copied into each new funnel's `defaultBlock`. Admins
 * can fully edit both the global default and each funnel's copy.
 */
export const DEFAULT_TEMPLATE_STEPS: Record<Locale, FunnelDefaultStep[]> = {
  pt: [
    {
      kind: "bot",
      text: "Olá! Que bom ter você por aqui. 👋 Vou te fazer algumas perguntas rápidas para personalizar tudo pra você.",
    },
    { kind: "input", field: "name", prompt: "Para começar, como podemos te chamar?" },
    { kind: "bot", text: "Prazer em te conhecer, {NOME}! 🙌" },
    {
      kind: "input",
      field: "phone",
      prompt: "Qual é o seu melhor número de WhatsApp? (com DDD)",
    },
    { kind: "input", field: "email", prompt: "E qual o seu melhor e-mail?" },
    { kind: "input", field: "role", prompt: "Qual é o seu cargo na empresa?" },
    {
      kind: "bot",
      text: "Show, {NOME}! Com a sua experiência como {CARGO}, tenho certeza de que isso vai fazer muito sentido pra você. Bora?",
    },
  ],
  en: [
    {
      kind: "bot",
      text: "Hi there! Great to have you. 👋 I'll ask a few quick questions to tailor everything for you.",
    },
    { kind: "input", field: "name", prompt: "First things first — what should we call you?" },
    { kind: "bot", text: "Nice to meet you, {NOME}! 🙌" },
    {
      kind: "input",
      field: "phone",
      prompt: "What's your best WhatsApp number? (with country/area code)",
    },
    { kind: "input", field: "email", prompt: "And what's your best email?" },
    { kind: "input", field: "role", prompt: "What's your role at the company?" },
    {
      kind: "bot",
      text: "Awesome, {NOME}! With your experience as {CARGO}, I'm sure this will click for you. Ready?",
    },
  ],
};
