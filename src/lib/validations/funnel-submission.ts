import { z } from "zod";

/**
 * Validation for a public funnel submission. Re-validated server-side in the
 * `submitFunnel` action (the security boundary). `hp` is a honeypot field — bots
 * tend to fill every input; a non-empty value means "drop silently".
 */
export const funnelSubmissionSchema = z.object({
  funnelId: z.string().min(1).max(40),
  submissionToken: z.string().min(8).max(100),
  name: z.string().trim().min(1).max(200),
  role: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: z.string().trim().max(200).optional(),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1).max(40),
        prompt: z.string().max(2000),
        answer: z.string().max(500),
      }),
    )
    .max(50),
  /** Chosen meeting slot (ISO 8601), only for MEETING funnels. */
  meetingStartAt: z.string().datetime().optional(),
  /** Honeypot — must stay empty. */
  hp: z.string().max(0).optional(),
});

export type FunnelSubmissionInput = z.infer<typeof funnelSubmissionSchema>;
