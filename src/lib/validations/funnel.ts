import { z } from "zod";
import { locales, type Locale } from "@/i18n/routing";

/**
 * Validation for the admin funnel editor. Describes the *stored* shape of a
 * funnel (single-language plain strings + an ordered default block + custom
 * single-choice questions + type-specific config). The client form collects
 * flatter values and maps them here; the server action re-validates with the
 * same schema as a security boundary.
 */

const localeValue = z
  .string()
  .refine((l): l is Locale => (locales as readonly string[]).includes(l), {
    message: "Invalid locale",
  });

/** Lowercase, hyphen-separated slug (e.g. "diagnostico-ia"). */
const slug = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

/** One step of the standard lead-capture opening. */
export const funnelDefaultStepSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("bot"), text: z.string().trim().min(1).max(2000) }),
  z.object({
    kind: z.literal("input"),
    field: z.enum(["name", "role", "phone", "email"]),
    prompt: z.string().trim().min(1).max(2000),
  }),
]);

/** A custom single-choice question (buttons). */
const funnelQuestionSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  options: z
    .array(z.string().trim().min(1).max(200))
    .min(2, "Add at least two options")
    .max(12),
});

export const funnelSchema = z
  .object({
    slug,
    locale: localeValue,
    name: z.string().trim().min(1).max(200),
    type: z.enum(["MEETING", "BONUS", "MESSAGE"]),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    defaultBlock: z.array(funnelDefaultStepSchema).min(1, "Add at least one step"),
    completionMessage: z.string().trim().min(1).max(2000),
    questions: z.array(funnelQuestionSchema).max(30),
    // MEETING config (always present with sane defaults; only used when MEETING)
    meetingDurationMinutes: z.coerce.number().int().min(5).max(480),
    meetingSlotStartHour: z.coerce.number().int().min(0).max(23),
    meetingSlotEndHour: z.coerce.number().int().min(1).max(24),
    meetingDaysAhead: z.coerce.number().int().min(1).max(90),
    meetingTimezone: z.string().trim().min(1).max(60),
    // BONUS config
    bonusUrl: z.union([z.string().trim().url().max(2000), z.literal("")]),
    bonusButtonLabel: z.string().trim().max(120),
    // MESSAGE config
    messageBody: z.string().trim().max(2000),
  })
  .superRefine((val, ctx) => {
    if (val.type === "BONUS" && !val.bonusUrl) {
      ctx.addIssue({
        path: ["bonusUrl"],
        code: z.ZodIssueCode.custom,
        message: "Required for a bonus funnel",
      });
    }
    if (val.type === "MEETING" && val.meetingSlotEndHour <= val.meetingSlotStartHour) {
      ctx.addIssue({
        path: ["meetingSlotEndHour"],
        code: z.ZodIssueCode.custom,
        message: "End hour must be after start hour",
      });
    }
  });

export type FunnelInput = z.infer<typeof funnelSchema>;

/** Schema for the global "edit default" template (one per locale). */
export const funnelDefaultTemplateSchema = z.object({
  locale: localeValue,
  steps: z.array(funnelDefaultStepSchema).min(1, "Add at least one step"),
});

export type FunnelDefaultTemplateInput = z.infer<typeof funnelDefaultTemplateSchema>;
