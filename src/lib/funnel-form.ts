import { resolveLocale, type Locale } from "@/i18n/routing";
import type { FunnelDefaultStep } from "@/lib/funnel-runtime";
import type { FunnelInput } from "@/lib/validations/funnel";

/**
 * Bridges the admin funnel form and the stored funnel shape. The form works with
 * flat, text-friendly values (numbers as strings; option lists as `{value}`
 * objects so react-hook-form `useFieldArray` can track them). `formToInput` maps
 * those to the structured `FunnelInput` the server validates; `funnelToForm` does
 * the reverse to pre-fill the edit form. No "use client"/"server-only" so both
 * sides can import it.
 */

/** A default-block step in form-friendly shape (all fields present). */
export type FunnelFormStep = {
  kind: "bot" | "input";
  text: string;
  field: "name" | "role" | "phone" | "email";
  prompt: string;
};

/** A custom question in form-friendly shape (options as objects for field array). */
export type FunnelFormQuestion = {
  prompt: string;
  options: { value: string }[];
};

export type FunnelFormValues = {
  slug: string;
  locale: Locale;
  name: string;
  type: "MEETING" | "BONUS" | "MESSAGE";
  status: "DRAFT" | "PUBLISHED";
  defaultBlock: FunnelFormStep[];
  completionMessage: string;
  questions: FunnelFormQuestion[];
  meetingDurationMinutes: string;
  meetingSlotStartHour: string;
  meetingSlotEndHour: string;
  meetingDaysAhead: string;
  meetingTimezone: string;
  bonusUrl: string;
  bonusButtonLabel: string;
  messageBody: string;
};

/** Blank steps/questions for the form's "add" buttons. */
export function blankBotStep(): FunnelFormStep {
  return { kind: "bot", text: "", field: "name", prompt: "" };
}
export function blankInputStep(): FunnelFormStep {
  return { kind: "input", text: "", field: "name", prompt: "" };
}
export function blankQuestion(): FunnelFormQuestion {
  return { prompt: "", options: [{ value: "" }, { value: "" }] };
}

/** Read a stored default-block JSON value into form steps. */
export function readSteps(value: unknown): FunnelFormStep[] {
  const arr = Array.isArray(value) ? value : [];
  return arr.map((raw) => {
    const step = (raw ?? {}) as Record<string, unknown>;
    if (step.kind === "input") {
      const field = step.field;
      return {
        kind: "input",
        text: "",
        field:
          field === "role" || field === "phone" || field === "email"
            ? field
            : "name",
        prompt: typeof step.prompt === "string" ? step.prompt : "",
      };
    }
    return {
      kind: "bot",
      text: typeof step.text === "string" ? step.text : "",
      field: "name",
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

/** Blank form for the "new funnel" page; default block pre-filled from template. */
export function emptyFunnelForm(
  templateSteps: FunnelDefaultStep[],
  locale: Locale,
): FunnelFormValues {
  return {
    slug: "",
    locale,
    name: "",
    type: "MESSAGE",
    status: "DRAFT",
    defaultBlock: readSteps(templateSteps),
    completionMessage: "",
    questions: [],
    meetingDurationMinutes: "30",
    meetingSlotStartHour: "9",
    meetingSlotEndHour: "18",
    meetingDaysAhead: "14",
    meetingTimezone: "America/Sao_Paulo",
    bonusUrl: "",
    bonusButtonLabel: "",
    messageBody: "",
  };
}

/** Stored funnel row (the JSON/nullable fields arrive loosely typed). */
type FunnelRow = {
  slug: string;
  locale: string;
  name: string;
  type: "MEETING" | "BONUS" | "MESSAGE";
  status: "DRAFT" | "PUBLISHED";
  defaultBlock: unknown;
  completionMessage: string;
  meetingDurationMinutes: number | null;
  meetingSlotStartHour: number | null;
  meetingSlotEndHour: number | null;
  meetingDaysAhead: number | null;
  meetingTimezone: string | null;
  bonusUrl: string | null;
  bonusButtonLabel: string | null;
  messageBody: string | null;
};

type QuestionRow = { prompt: string; options: string[] };

/** Pre-fill the form from a stored funnel + its questions (edit page). */
export function funnelToForm(
  funnel: FunnelRow,
  questions: QuestionRow[],
): FunnelFormValues {
  return {
    slug: funnel.slug,
    locale: resolveLocale(funnel.locale),
    name: funnel.name,
    type: funnel.type,
    status: funnel.status,
    defaultBlock: readSteps(funnel.defaultBlock),
    completionMessage: funnel.completionMessage,
    questions: questions.map((q) => ({
      prompt: q.prompt,
      options: q.options.map((value) => ({ value })),
    })),
    meetingDurationMinutes: String(funnel.meetingDurationMinutes ?? 30),
    meetingSlotStartHour: String(funnel.meetingSlotStartHour ?? 9),
    meetingSlotEndHour: String(funnel.meetingSlotEndHour ?? 18),
    meetingDaysAhead: String(funnel.meetingDaysAhead ?? 14),
    meetingTimezone: funnel.meetingTimezone ?? "America/Sao_Paulo",
    bonusUrl: funnel.bonusUrl ?? "",
    bonusButtonLabel: funnel.bonusButtonLabel ?? "",
    messageBody: funnel.messageBody ?? "",
  };
}

/** Map flat form values to the structured input the server validates. */
export function formToInput(values: FunnelFormValues): FunnelInput {
  return {
    slug: values.slug.trim(),
    locale: values.locale,
    name: values.name.trim(),
    type: values.type,
    status: values.status,
    defaultBlock: stepsToStored(values.defaultBlock),
    completionMessage: values.completionMessage.trim(),
    questions: values.questions
      .map((q) => ({
        prompt: q.prompt.trim(),
        options: q.options.map((o) => o.value.trim()).filter(Boolean),
      }))
      .filter((q) => q.prompt.length > 0),
    meetingDurationMinutes: Number(values.meetingDurationMinutes),
    meetingSlotStartHour: Number(values.meetingSlotStartHour),
    meetingSlotEndHour: Number(values.meetingSlotEndHour),
    meetingDaysAhead: Number(values.meetingDaysAhead),
    meetingTimezone: values.meetingTimezone.trim(),
    bonusUrl: values.bonusUrl.trim(),
    bonusButtonLabel: values.bonusButtonLabel.trim(),
    messageBody: values.messageBody.trim(),
  };
}
