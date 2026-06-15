"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  funnelSubmissionSchema,
  type FunnelSubmissionInput,
} from "@/lib/validations/funnel-submission";

export type SubmitFunnelResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "not_found" | "unknown" };

/**
 * Persist a completed funnel run. Public (no auth) — like `submitContactLead`.
 * The submission is the durable record and is written first; type-specific
 * outcomes (bonus/message/meeting) and the WhatsApp completion message are
 * layered on in later phases and must never block this persistence.
 */
export async function submitFunnel(
  input: FunnelSubmissionInput,
): Promise<SubmitFunnelResult> {
  const parsed = funnelSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  // Honeypot tripped — pretend success, persist nothing.
  if (data.hp) return { ok: true };

  try {
    const funnel = await prisma.funnel.findFirst({
      where: { id: data.funnelId, status: "PUBLISHED" },
    });
    if (!funnel) return { ok: false, error: "not_found" };

    // Idempotency: a repeated token (double-submit/retry) is a no-op success.
    const existing = await prisma.funnelSubmission.findUnique({
      where: { submissionToken: data.submissionToken },
    });
    if (existing) return { ok: true };

    await prisma.funnelSubmission.create({
      data: {
        funnelId: funnel.id,
        name: data.name,
        role: data.role || null,
        phone: data.phone || null,
        email: data.email || null,
        answers: data.answers as unknown as Prisma.InputJsonValue,
        outcome: "COMPLETED",
        submissionToken: data.submissionToken,
        locale: funnel.locale,
      },
    });

    return { ok: true };
  } catch (error) {
    // Unique-violation race on the token → idempotent success.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: true };
    }
    console.error("Failed to submit funnel", error);
    return { ok: false, error: "unknown" };
  }
}
