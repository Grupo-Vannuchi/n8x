import { BUILT_IN_TOKENS } from "@/lib/funnel-runtime";

/**
 * Custom-question fields for funnels: the `{token}` an admin-given field name
 * becomes, and per-format answer validation, normalization and input masks.
 *
 * Pure and dependency-free on purpose — the admin builder, the public runner and
 * the `submitFunnel` server action all import it, and the server re-runs the
 * same checks as the trust boundary. No "use client" / "server-only".
 */

export const FUNNEL_INPUT_TYPES = [
  "TEXT",
  "NUMBER",
  "DATE",
  "CPF",
  "CNPJ",
  "URL",
] as const;
export type FunnelInputType = (typeof FUNNEL_INPUT_TYPES)[number];

/** Tokens the runtime already fills (default block + meeting): not field names. */
export const RESERVED_TOKENS: ReadonlySet<string> = new Set(BUILT_IN_TOKENS.keys());

/** "Nome da Empresa" → "nome_da_empresa": lowercase, no accents, `_` between words. */
export function fieldToken(fieldName: string): string {
  return fieldName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export type FieldNameIssue = "invalid" | "reserved" | "duplicate";

/**
 * Why question `index`'s field name can't be used, or null when it's fine. An
 * empty name is fine: the question just has no variable and no named column.
 */
export function fieldNameIssue(
  questions: readonly { fieldName: string }[],
  index: number,
): FieldNameIssue | null {
  const name = questions[index]?.fieldName.trim() ?? "";
  if (!name) return null;
  const token = fieldToken(name);
  if (!token) return "invalid";
  if (RESERVED_TOKENS.has(token)) return "reserved";
  const clash = questions.some(
    (q, i) =>
      i !== index && q.fieldName.trim() !== "" && fieldToken(q.fieldName) === token,
  );
  return clash ? "duplicate" : null;
}

/** True when any question's field name is unusable — the save is refused. */
export function hasFieldNameIssue(
  questions: readonly { fieldName: string }[],
): boolean {
  return questions.some((_, i) => fieldNameIssue(questions, i) !== null);
}

export type ValidatedAnswer = { ok: true; value: string } | { ok: false };

const CPF_SEPARATORS: [number, string][] = [
  [3, "."],
  [6, "."],
  [9, "-"],
];
const CNPJ_SEPARATORS: [number, string][] = [
  [2, "."],
  [5, "."],
  [8, "/"],
  [12, "-"],
];
const DATE_SEPARATORS: [number, string][] = [
  [2, "/"],
  [4, "/"],
];

/** Insert each separator right before the character at its position. */
function insertSeparators(chars: string, separators: [number, string][]): string {
  let out = "";
  for (let i = 0; i < chars.length; i++) {
    const separator = separators.find(([position]) => position === i);
    if (separator) out += separator[1];
    out += chars[i];
  }
  return out;
}

const repeatsOneChar = (s: string) => /^(.)\1*$/.test(s);

/** CPF: 11 digits with mod-11 check digits. */
function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || repeatsOneChar(digits)) return false;
  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(digits[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(digits[9]) && checkDigit(10) === Number(digits[10]);
}

/**
 * CNPJ, numeric or alphanumeric. Since July 2026 the Receita Federal issues
 * CNPJs whose first 12 positions may be letters; the last 2 stay numeric check
 * digits. Each character counts as `charCode − 48` (digits keep their value),
 * then the classic mod-11 weights apply — so legacy numeric CNPJs still pass.
 */
function isValidCnpj(chars: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(chars) || repeatsOneChar(chars)) return false;
  const checkDigit = (length: number) => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) sum += (chars.charCodeAt(i) - 48) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return checkDigit(12) === Number(chars[12]) && checkDigit(13) === Number(chars[13]);
}

/** A real calendar date: dd/mm/yyyy (pt) or mm/dd/yyyy (en). */
function isValidDate(value: string, locale: string): boolean {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;
  const [first, second, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const [day, month] = locale === "en" ? [second, first] : [first, second];
  if (year < 1900 || year > 2100) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Integers or decimals, with optional thousands groups in pt (1.500,5) or en (1,500.5). */
const NUMBER_PATTERNS = [
  /^-?\d+([.,]\d+)?$/,
  /^-?\d{1,3}(\.\d{3})+(,\d+)?$/,
  /^-?\d{1,3}(,\d{3})+(\.\d+)?$/,
];

/** A web link; `https://` is added when the visitor left the scheme out. */
function normalizeUrl(value: string): string | null {
  if (/\s/.test(value)) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    const host = url.hostname;
    if (!host.includes(".") || host.startsWith(".") || host.endsWith(".")) return null;
    return withScheme;
  } catch {
    return null;
  }
}

/**
 * Validate an answer in its format and return the value to store, normalized:
 * trimmed, CPF/CNPJ formatted, links with a scheme. `locale` is the funnel's.
 */
export function validateAnswer(
  type: FunnelInputType,
  raw: string,
  locale: string,
): ValidatedAnswer {
  const value = raw.trim();
  if (!value) return { ok: false };
  switch (type) {
    case "TEXT":
      return { ok: true, value };
    case "NUMBER":
      return NUMBER_PATTERNS.some((re) => re.test(value))
        ? { ok: true, value }
        : { ok: false };
    case "DATE":
      return isValidDate(value, locale) ? { ok: true, value } : { ok: false };
    case "CPF": {
      const digits = value.replace(/\D/g, "");
      return isValidCpf(digits)
        ? { ok: true, value: insertSeparators(digits, CPF_SEPARATORS) }
        : { ok: false };
    }
    case "CNPJ": {
      const chars = value.toUpperCase().replace(/[^0-9A-Z]/g, "");
      return isValidCnpj(chars)
        ? { ok: true, value: insertSeparators(chars, CNPJ_SEPARATORS) }
        : { ok: false };
    }
    case "URL": {
      const url = normalizeUrl(value);
      return url ? { ok: true, value: url } : { ok: false };
    }
  }
}

/** Live input mask for the formats that have one; the rest pass through. */
export function maskAnswer(type: FunnelInputType, raw: string): string {
  if (type === "CPF") {
    return insertSeparators(raw.replace(/\D/g, "").slice(0, 11), CPF_SEPARATORS);
  }
  if (type === "CNPJ") {
    const chars = raw.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 14);
    return insertSeparators(chars, CNPJ_SEPARATORS);
  }
  if (type === "DATE") {
    return insertSeparators(raw.replace(/\D/g, "").slice(0, 8), DATE_SEPARATORS);
  }
  return raw;
}

/** Mobile keyboard per format. CNPJ keeps the full keyboard: it may hold letters. */
export function inputModeFor(
  type: FunnelInputType,
): "text" | "decimal" | "numeric" | "url" {
  if (type === "NUMBER") return "decimal";
  if (type === "DATE" || type === "CPF") return "numeric";
  if (type === "URL") return "url";
  return "text";
}

/**
 * Every field token the funnel defines → its answer, "" until answered. Being in
 * the map is what lets `interpolateTokens` tell a defined field (empty until
 * answered — never raw braces) from a typo like `{empresaa}` (left literal).
 */
export function buildFieldValues(
  questions: readonly { key: string; fieldName?: string }[],
  answers: readonly { questionId: string; answer: string }[],
): Record<string, string> {
  const byQuestion = new Map(answers.map((a) => [a.questionId, a.answer]));
  const values: Record<string, string> = {};
  for (const q of questions) {
    const token = q.fieldName ? fieldToken(q.fieldName) : "";
    if (token) values[token] = byQuestion.get(q.key) ?? "";
  }
  return values;
}
