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
function outcomeFor(
  type: "MEETING" | "BONUS" | "MESSAGE" | "REDIRECT",
  booked: boolean,
) {
  if (type === "MEETING") return booked ? "MEETING_BOOKED" : "COMPLETED";
  if (type === "BONUS") return "BONUS_DOWNLOADED";
  if (type === "REDIRECT") return "REDIRECTED";
  return "MESSAGE_SENT";
}

/**
 * Persist a completed funnel run. Public (no auth) — like `submitContactLead`.
 * The reached ending (resolved by `endingKey`, falling back to the default/first)
 * drives the outcome, the meeting booking and the WhatsApp completion message.
 * The submission is the durable record; WhatsApp never blocks persistence.
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
      include: { endings: { orderBy: { order: "asc" } } },
    });
    if (!funnel || funnel.endings.length === 0) {
      return { ok: false, error: "not_found" };
    }

    // Idempotency: a repeated token (double-submit/retry) is a no-op success.
    const existing = await prisma.funnelSubmission.findUnique({
      where: { submissionToken: data.submissionToken },
    });
    if (existing) return { ok: true };

    // Resolve the reached ending; fall back to the default (first) ending.
    const ending =
      funnel.endings.find((e) => e.key === data.endingKey) ?? funnel.endings[0];

    const phoneE164 = normalizePhoneBR(data.phone);

    // A MEETING ending books the event BEFORE persisting: a taken slot must let
    // the visitor re-pick (no submission); a missing Google connection still
    // records the lead (no event).
    let meetingStartAt: Date | null = null;
    let googleEventId: string | null = null;
    let meetLink: string | null = null;
    if (ending.type === "MEETING" && data.meetingStartAt) {
      const booking = await bookMeeting(ending, data.meetingStartAt, {
        name: data.name,
        phone: phoneE164,
        email: data.email || null,
      });
      if (booking.ok) {
        meetingStartAt = new Date(data.meetingStartAt);
        googleEventId = booking.eventId;
        meetLink = booking.meetLink;
      } else if (booking.error === "slot_taken") {
        return { ok: false, error: "slot_taken" };
      }
    }

    const submission = await prisma.funnelSubmission.create({
      data: {
        funnelId: funnel.id,
        name: data.name,
        role: data.role || null,
        phone: data.phone || null,
        phoneE164,
        email: data.email || null,
        answers: data.answers as unknown as Prisma.InputJsonValue,
        outcome: outcomeFor(ending.type, Boolean(googleEventId)),
        endingName: ending.name,
        meetingStartAt,
        googleEventId,
        submissionToken: data.submissionToken,
        locale: funnel.locale,
      },
    });

    // WhatsApp is best-effort and must never fail the submission.
    // Pre-format the booked date/time in the ending's timezone + funnel locale
    // for the {DATA} / {HORA} tokens.
    const tz = ending.meetingTimezone ?? "America/Sao_Paulo";
    const meetingDate = meetingStartAt
      ? new Intl.DateTimeFormat(funnel.locale, {
          dateStyle: "long",
          timeZone: tz,
        }).format(meetingStartAt)
      : "";
    const meetingTime = meetingStartAt
      ? new Intl.DateTimeFormat(funnel.locale, {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: tz,
        }).format(meetingStartAt)
      : "";

    await deliverWhatsapp({
      submissionId: submission.id,
      phoneE164,
      name: data.name,
      role: data.role,
      link: meetLink,
      date: meetingDate,
      time: meetingTime,
      completionMessage: ending.completionMessage,
      instance: funnel.whatsappInstance,
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

/** Available meeting slots for a funnel's MEETING ending (live — not cached). */
export async function getFunnelSlots(
  funnelId: string,
  locale: string,
  endingKey?: string,
): Promise<FunnelSlotsResult> {
  const funnel = await prisma.funnel.findFirst({
    where: { id: funnelId, status: "PUBLISHED" },
    include: { endings: { orderBy: { order: "asc" } } },
  });
  if (!funnel || funnel.endings.length === 0 || !isGoogleConfigured()) {
    return { configured: false, slots: [] };
  }
  const ending = funnel.endings.find((e) => e.key === endingKey) ?? funnel.endings[0];
  if (ending.type !== "MEETING") return { configured: false, slots: [] };
  const slots = await getAvailableSlots(ending, locale);
  return { configured: true, slots };
}

/** Best-effort WhatsApp delivery + status write. Never throws. Sends exactly one
 * message per funnel: the completion message (which IS a MESSAGE funnel's body). */
async function deliverWhatsapp(args: {
  submissionId: string;
  phoneE164: string | null;
  name: string;
  role?: string;
  link?: string | null;
  date?: string;
  time?: string;
  completionMessage: string;
  instance?: string | null;
}): Promise<void> {
  const tokens = {
    name: args.name,
    role: args.role,
    link: args.link ?? "",
    date: args.date ?? "",
    time: args.time ?? "",
  };

  if (!args.phoneE164) return markWhatsapp(args.submissionId, "FAILED", "no_phone");
  if (!isEvolutionConfigured())
    return markWhatsapp(args.submissionId, "FAILED", "not_configured");

  const result = await sendText(
    args.phoneE164,
    interpolateTokens(args.completionMessage, tokens),
    args.instance,
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
