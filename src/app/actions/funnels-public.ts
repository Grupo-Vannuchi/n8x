"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendText, isEvolutionConfigured } from "@/lib/evolution";
import { normalizePhoneBR } from "@/lib/phone";
import { interpolateTokens } from "@/lib/funnel-runtime";
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

    const phoneE164 = normalizePhoneBR(data.phone);

    // The submission is the durable record — write it first, before any send.
    const submission = await prisma.funnelSubmission.create({
      data: {
        funnelId: funnel.id,
        name: data.name,
        role: data.role || null,
        phone: data.phone || null,
        phoneE164,
        email: data.email || null,
        answers: data.answers as unknown as Prisma.InputJsonValue,
        outcome: funnel.type === "MESSAGE" ? "MESSAGE_SENT" : "COMPLETED",
        submissionToken: data.submissionToken,
        locale: funnel.locale,
      },
    });

    // WhatsApp is best-effort and must never fail the submission.
    await deliverWhatsapp({
      submissionId: submission.id,
      phoneE164,
      name: data.name,
      role: data.role,
      completionMessage: funnel.completionMessage,
      // The MESSAGE-type funnel's specific deliverable, defined per funnel.
      messageBody: funnel.type === "MESSAGE" ? funnel.messageBody : null,
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

/** Best-effort WhatsApp delivery + status write. Never throws. */
async function deliverWhatsapp(args: {
  submissionId: string;
  phoneE164: string | null;
  name: string;
  role?: string;
  completionMessage: string;
  messageBody: string | null;
}): Promise<void> {
  const tokens = { name: args.name, role: args.role };

  if (!args.phoneE164) return markWhatsapp(args.submissionId, "FAILED", "no_phone");
  if (!isEvolutionConfigured())
    return markWhatsapp(args.submissionId, "FAILED", "not_configured");

  // Primary: the per-funnel completion message (every funnel type).
  const primary = await sendText(
    args.phoneE164,
    interpolateTokens(args.completionMessage, tokens),
  );

  // MESSAGE funnels also deliver their specific message body (best-effort).
  if (args.messageBody && args.messageBody.trim()) {
    await sendText(args.phoneE164, interpolateTokens(args.messageBody, tokens));
  }

  return markWhatsapp(
    args.submissionId,
    primary.ok ? "SENT" : "FAILED",
    primary.ok ? null : primary.error,
  );
}

async function markWhatsapp(
  id: string,
  status: "SENT" | "FAILED",
  error: string | null,
): Promise<void> {
  try {
    await prisma.funnelSubmission.update({
      where: { id },
      data: { whatsappStatus: status, whatsappError: error },
    });
  } catch (e) {
    console.error("Failed to update whatsapp status", e);
  }
}
