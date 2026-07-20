import { resolveLocale, type Locale } from "@/i18n/routing";
import type { FunnelDefaultStep } from "@/lib/funnel-runtime";
import type { FunnelInput } from "@/lib/validations/funnel";

/**
 * Bridges the admin funnel form and the stored funnel shape. The form works with
 * flat, text-friendly values (numbers as strings; option lists as objects so
 * react-hook-form `useFieldArray` can track them). `formToInput` maps those to the
 * structured `FunnelInput` the server validates; `funnelToForm` does the reverse.
 * No "use client"/"server-only" so both sides can import it.
 */

/** A default-block step in form-friendly shape (all fields present). */
export type FunnelFormStep = {
  kind: "bot" | "input";
  text: string;
  field: "name" | "role" | "phone" | "email";
  prompt: string;
};

/** A custom question in form-friendly shape. `key` is the stable branch id.
 * CHOICE: each option's `next` is its branch target (a question/ending key,
 * "END", or ""). TEXT: `next` is the single continuation target. */
export type FunnelFormQuestion = {
  key: string;
  kind: "CHOICE" | "TEXT";
  prompt: string;
  options: { value: string; next: string }[];
  /** TEXT only: single continuation target. */
  next: string;
};

/** A named ending in form-friendly shape (numbers as strings). */
export type FunnelFormEnding = {
  key: string;
  name: string;
  type: "MEETING" | "BONUS" | "MESSAGE" | "REDIRECT";
  completionMessage: string;
  meetingDurationMinutes: string;
  meetingSlotStartHour: string;
  meetingSlotEndHour: string;
  meetingDaysAhead: string;
  meetingTimezone: string;
  bonusUrl: string;
  bonusButtonLabel: string;
  redirectUrl: string;
  redirectButtonLabel: string;
  redirectDelaySeconds: string;
};

export type FunnelFormValues = {
  slug: string;
  locale: Locale;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  /** Evolution instance for WhatsApp sends; "" = use the default instance. */
  whatsappInstance: string;
  defaultBlock: FunnelFormStep[];
  questions: FunnelFormQuestion[];
  endings: FunnelFormEnding[];
};

/** Blank steps/questions/endings for the form's "add" buttons. */
export function blankBotStep(): FunnelFormStep {
  return { kind: "bot", text: "", field: "name", prompt: "" };
}
export function blankInputStep(): FunnelFormStep {
  return { kind: "input", text: "", field: "name", prompt: "" };
}
export function blankQuestion(): FunnelFormQuestion {
  return {
    key: crypto.randomUUID(),
    kind: "CHOICE",
    prompt: "",
    options: [
      { value: "", next: "" },
      { value: "", next: "" },
    ],
    next: "",
  };
}
export function blankEnding(): FunnelFormEnding {
  return {
    key: crypto.randomUUID(),
    name: "",
    type: "MESSAGE",
    completionMessage: "",
    meetingDurationMinutes: "30",
    meetingSlotStartHour: "9",
    meetingSlotEndHour: "18",
    meetingDaysAhead: "14",
    meetingTimezone: "America/Sao_Paulo",
    bonusUrl: "",
    bonusButtonLabel: "",
    redirectUrl: "",
    redirectButtonLabel: "",
    redirectDelaySeconds: "3",
  };
}

/** Read a stored default-block JSON value into form steps. */
export function readSteps(value: unknown): FunnelFormStep[] {
  const arr = Array.isArray(value) ? value : [];
  return arr.map((raw) => {
    const step = (raw ?? {}) as Record<string, unknown>;
    if (step.kind === "input") {
      const field = step.field;
      return {
        kind: "input" as const,
        text: "",
        field:
          field === "role" || field === "phone" || field === "email"
            ? field
            : "name",
        prompt: typeof step.prompt === "string" ? step.prompt : "",
      };
    }
    return {
      kind: "bot" as const,
      text: typeof step.text === "string" ? step.text : "",
      field: "name" as const,
      prompt: "",
    };
  });
}

/** Convert one form step to the stored discriminated-union shape. */
function stepToStored(step: FunnelFormStep): FunnelDefaultStep {
  if (step.kind === "input") {
    return { kind: "input", field: step.field, prompt: step.prompt.trim() };
  }
  return { kind: "bot", text: step.text.trim() };
}

/** Convert a list of form steps to stored steps (shared by funnel + default editors). */
export function stepsToStored(steps: FunnelFormStep[]): FunnelDefaultStep[] {
  return steps.map(stepToStored);
}

/** Blank form for the "new funnel" page; default block pre-filled, one ending. */
export function emptyFunnelForm(
  templateSteps: FunnelDefaultStep[],
  locale: Locale,
): FunnelFormValues {
  return {
    slug: "",
    locale,
    name: "",
    status: "DRAFT",
    whatsappInstance: "",
    defaultBlock: readSteps(templateSteps),
    questions: [],
    endings: [blankEnding()],
  };
}

/** Stored funnel row (defaultBlock arrives as opaque JSON). */
type FunnelRow = {
  slug: string;
  locale: string;
  name: string;
  status: "DRAFT" | "PUBLISHED";
  whatsappInstance: string | null;
  defaultBlock: unknown;
};

type QuestionRow = {
  key: string;
  kind: "CHOICE" | "TEXT";
  prompt: string;
  options: string[];
  optionNext: string[];
  next: string;
};

type EndingRow = {
  key: string;
  name: string;
  type: "MEETING" | "BONUS" | "MESSAGE" | "REDIRECT";
  completionMessage: string;
  meetingDurationMinutes: number | null;
  meetingSlotStartHour: number | null;
  meetingSlotEndHour: number | null;
  meetingDaysAhead: number | null;
  meetingTimezone: string | null;
  bonusUrl: string | null;
  bonusButtonLabel: string | null;
  redirectUrl: string | null;
  redirectButtonLabel: string | null;
  redirectDelaySeconds: number | null;
};

function endingToForm(e: EndingRow): FunnelFormEnding {
  return {
    key: e.key || crypto.randomUUID(),
    name: e.name,
    type: e.type,
    completionMessage: e.completionMessage,
    meetingDurationMinutes: String(e.meetingDurationMinutes ?? 30),
    meetingSlotStartHour: String(e.meetingSlotStartHour ?? 9),
    meetingSlotEndHour: String(e.meetingSlotEndHour ?? 18),
    meetingDaysAhead: String(e.meetingDaysAhead ?? 14),
    meetingTimezone: e.meetingTimezone ?? "America/Sao_Paulo",
    bonusUrl: e.bonusUrl ?? "",
    bonusButtonLabel: e.bonusButtonLabel ?? "",
    redirectUrl: e.redirectUrl ?? "",
    redirectButtonLabel: e.redirectButtonLabel ?? "",
    redirectDelaySeconds: String(e.redirectDelaySeconds ?? 3),
  };
}

/** Pre-fill the form from a stored funnel + its questions + endings (edit page). */
export function funnelToForm(
  funnel: FunnelRow,
  questions: QuestionRow[],
  endings: EndingRow[],
): FunnelFormValues {
  return {
    slug: funnel.slug,
    locale: resolveLocale(funnel.locale),
    name: funnel.name,
    status: funnel.status,
    whatsappInstance: funnel.whatsappInstance ?? "",
    defaultBlock: readSteps(funnel.defaultBlock),
    questions: questions.map((q) => ({
      key: q.key || crypto.randomUUID(),
      kind: q.kind ?? "CHOICE",
      prompt: q.prompt,
      options: q.options.length
        ? q.options.map((value, i) => ({ value, next: q.optionNext?.[i] ?? "" }))
        : [
            { value: "", next: "" },
            { value: "", next: "" },
          ],
      next: q.next ?? "",
    })),
    endings: endings.length ? endings.map(endingToForm) : [blankEnding()],
  };
}

/** Map flat form values to the structured input the server validates. */
export function formToInput(values: FunnelFormValues): FunnelInput {
  return {
    slug: values.slug.trim(),
    locale: values.locale,
    name: values.name.trim(),
    status: values.status,
    whatsappInstance: values.whatsappInstance.trim(),
    defaultBlock: stepsToStored(values.defaultBlock),
    questions: values.questions
      .map((q) => {
        // TEXT questions carry no options — just the single `next` target.
        if (q.kind === "TEXT") {
          return {
            key: q.key,
            kind: "TEXT" as const,
            prompt: q.prompt.trim(),
            options: [],
            optionNext: [],
            next: q.next,
          };
        }
        // CHOICE: drop blank options, keeping options[] and optionNext[] aligned.
        const opts = q.options
          .map((o) => ({ label: o.value.trim(), next: o.next }))
          .filter((o) => o.label.length > 0);
        return {
          key: q.key,
          kind: "CHOICE" as const,
          prompt: q.prompt.trim(),
          options: opts.map((o) => o.label),
          optionNext: opts.map((o) => o.next),
          next: "",
        };
      })
      .filter((q) => q.prompt.length > 0),
    endings: values.endings.map((e) => ({
      key: e.key,
      name: e.name.trim(),
      type: e.type,
      completionMessage: e.completionMessage.trim(),
      meetingDurationMinutes: Number(e.meetingDurationMinutes),
      meetingSlotStartHour: Number(e.meetingSlotStartHour),
      meetingSlotEndHour: Number(e.meetingSlotEndHour),
      meetingDaysAhead: Number(e.meetingDaysAhead),
      meetingTimezone: e.meetingTimezone.trim(),
      bonusUrl: e.bonusUrl.trim(),
      bonusButtonLabel: e.bonusButtonLabel.trim(),
      redirectUrl: e.redirectUrl.trim(),
      redirectButtonLabel: e.redirectButtonLabel.trim(),
      redirectDelaySeconds: Number(e.redirectDelaySeconds),
    })),
  };
}
