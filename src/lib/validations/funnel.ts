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

/** A custom single-choice question (buttons), with per-option branch targets. */
const funnelQuestionSchema = z.object({
  key: z.string().trim().min(1).max(60),
  prompt: z.string().trim().min(1).max(2000),
  options: z
    .array(z.string().trim().min(1).max(200))
    .min(2, "Add at least two options")
    .max(12),
  /** Aligned with `options`: a question key, an ending key, "END", or "" (next). */
  optionNext: z.array(z.string().trim().max(60)).max(12),
});

/** A named funnel ending (type + WhatsApp message + type-specific config). */
const funnelEndingSchema = z
  .object({
    key: z.string().trim().min(1).max(60),
    name: z.string().trim().min(1).max(120),
    type: z.enum(["MEETING", "BONUS", "MESSAGE", "REDIRECT"]),
    completionMessage: z.string().trim().min(1).max(2000),
    // MEETING config
    meetingDurationMinutes: z.coerce.number().int().min(5).max(480),
    meetingSlotStartHour: z.coerce.number().int().min(0).max(23),
    meetingSlotEndHour: z.coerce.number().int().min(1).max(24),
    meetingDaysAhead: z.coerce.number().int().min(1).max(90),
    meetingTimezone: z.string().trim().min(1).max(60),
    // BONUS config
    bonusUrl: z.union([z.string().trim().url().max(2000), z.literal("")]),
    bonusButtonLabel: z.string().trim().max(120),
    // REDIRECT config
    redirectUrl: z.union([z.string().trim().url().max(2000), z.literal("")]),
    redirectButtonLabel: z.string().trim().max(120),
    redirectDelaySeconds: z.coerce.number().int().min(0).max(60),
  })
  .superRefine((val, ctx) => {
    if (val.type === "BONUS" && !val.bonusUrl) {
      ctx.addIssue({
        path: ["bonusUrl"],
        code: z.ZodIssueCode.custom,
        message: "Required for a bonus ending",
      });
    }
    if (val.type === "REDIRECT" && !val.redirectUrl) {
      ctx.addIssue({
        path: ["redirectUrl"],
        code: z.ZodIssueCode.custom,
        message: "Required for a redirect ending",
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

export const funnelSchema = z.object({
  slug,
  locale: localeValue,
  name: z.string().trim().min(1).max(200),
  status: z.enum(["DRAFT", "PUBLISHED"]),
  /** Evolution instance for WhatsApp sends; "" = default instance. */
  whatsappInstance: z.string().trim().max(60),
  defaultBlock: z.array(funnelDefaultStepSchema).min(1, "Add at least one step"),
  questions: z.array(funnelQuestionSchema).max(30),
  // The first ending is the default/fallback for the straight-through path.
  endings: z.array(funnelEndingSchema).min(1, "Add at least one ending").max(20),
});

export type FunnelInput = z.infer<typeof funnelSchema>;

/** Schema for the global "edit default" template (one per locale). */
export const funnelDefaultTemplateSchema = z.object({
  locale: localeValue,
  steps: z.array(funnelDefaultStepSchema).min(1, "Add at least one step"),
});

export type FunnelDefaultTemplateInput = z.infer<typeof funnelDefaultTemplateSchema>;
