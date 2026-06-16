"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendText, isEvolutionConfigured } from "@/lib/evolution";
import { normalizePhoneBR } from "@/lib/phone";
import {
  bookMeeting,
  getAvailableSlots,
  isGoogleConfigured,
  type MeetingSlot,
} from "@/lib/google-calendar";
import { interpolateTokens } from "@/lib/funnel-runtime";
import {
  funnelSubmissionSchema,
  type FunnelSubmissionInput,
} from "@/lib/validations/funnel-submission";

export type SubmitFunnelResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "not_found" | "slot_taken" | "unknown" };

/** Outcome for a completed run, derived from the funnel type. */
function outcomeFor(type: "MEETING" | "BONUS" | "MESSAGE", booked: boolean) {
  if (type === "MEETING") return booked ? "MEETING_BOOKED" : "COMPLETED";
  if (type === "BONUS") return "BONUS_DOWNLOADED";
  return "MESSAGE_SENT";
}

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

    // MEETING funnels book the calendar event BEFORE persisting: a taken slot
    // must let the visitor re-pick (no submission), but a missing Google
    // connection still records the lead (COMPLETED, no event).
    let meetingStartAt: Date | null = null;
    let googleEventId: string | null = null;
    if (funnel.type === "MEETING" && data.meetingStartAt) {
      const booking = await bookMeeting(funnel, data.meetingStartAt, {
        name: data.name,
        phone: phoneE164,
        email: data.email || null,
      });
      if (booking.ok) {
        meetingStartAt = new Date(data.meetingStartAt);
        googleEventId = booking.eventId;
      } else if (booking.error === "slot_taken") {
        return { ok: false, error: "slot_taken" };
      }
      // not_configured / unknown → fall through, record the lead without an event.
    }

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
        outcome: outcomeFor(funnel.type, Boolean(googleEventId)),
        meetingStartAt,
        googleEventId,
        submissionToken: data.submissionToken,
        locale: funnel.locale,
      },
    });

    // WhatsApp is best-effort and must never fail the submission. The single
    // completion message is the funnel's message (incl. MESSAGE-type funnels).
    await deliverWhatsapp({
      submissionId: submission.id,
      phoneE164,
      name: data.name,
      role: data.role,
      completionMessage: funnel.completionMessage,
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

export type FunnelSlotsResult = { configured: boolean; slots: MeetingSlot[] };

/** Available meeting slots for a MEETING funnel (live — not cached). */
export async function getFunnelSlots(
  funnelId: string,
  locale: string,
): Promise<FunnelSlotsResult> {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, status: "PUBLISHED", type: "MEETING" },
  });
  if (!funnel || !isGoogleConfigured()) return { configured: false, slots: [] };
  const slots = await getAvailableSlots(funnel, locale);
  return { configured: true, slots };
}

/** Best-effort WhatsApp delivery + status write. Never throws. Sends exactly one
 * message per funnel: the completion message (which IS a MESSAGE funnel's body). */
async function deliverWhatsapp(args: {
  submissionId: string;
  phoneE164: string | null;
  name: string;
  role?: string;
  completionMessage: string;
}): Promise<void> {
  const tokens = { name: args.name, role: args.role };

  if (!args.phoneE164) return markWhatsapp(args.submissionId, "FAILED", "no_phone");
  if (!isEvolutionConfigured())
    return markWhatsapp(args.submissionId, "FAILED", "not_configured");

  const result = await sendText(
    args.phoneE164,
    interpolateTokens(args.completionMessage, tokens),
  );

  return markWhatsapp(
    args.submissionId,
    result.ok ? "SENT" : "FAILED",
    result.ok ? null : result.error,
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
