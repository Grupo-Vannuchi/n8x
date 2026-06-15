"use server";

import { updateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { disconnectGoogleAccount } from "@/lib/google-calendar";
import { tags } from "@/lib/cache";
import {
  funnelSchema,
  funnelDefaultTemplateSchema,
  type FunnelInput,
  type FunnelDefaultTemplateInput,
} from "@/lib/validations/funnel";

export type FunnelActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "slug_taken" | "unknown" };

/** Funnels are read by the public runtime; one tag invalidates every cached read. */
function revalidateFunnels(): void {
  updateTag(tags.funnels);
}

/** Scalar/JSON funnel columns shared by create and update (questions are separate). */
function toScalarData(input: FunnelInput) {
  return {
    slug: input.slug,
    locale: input.locale,
    name: input.name,
    type: input.type,
    status: input.status,
    defaultBlock: input.defaultBlock as unknown as Prisma.InputJsonValue,
    completionMessage: input.completionMessage,
    meetingDurationMinutes: input.meetingDurationMinutes,
    meetingSlotStartHour: input.meetingSlotStartHour,
    meetingSlotEndHour: input.meetingSlotEndHour,
    meetingDaysAhead: input.meetingDaysAhead,
    meetingTimezone: input.meetingTimezone,
    bonusUrl: input.bonusUrl || null,
    bonusButtonLabel: input.bonusButtonLabel || null,
    messageBody: input.messageBody || null,
  };
}

/** Custom questions as nested-create rows, order taken from array position. */
function questionsCreate(input: FunnelInput) {
  return input.questions.map((q, i) => ({
    order: i,
    prompt: q.prompt,
    options: q.options,
  }));
}

/** Create a funnel + its questions. Admin-only; re-validates server-side. */
export async function createFunnel(
  input: FunnelInput,
): Promise<FunnelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = funnelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const funnel = await prisma.funnel.create({
      data: {
        ...toScalarData(parsed.data),
        questions: { create: questionsCreate(parsed.data) },
      },
    });
    revalidateFunnels();
    return { ok: true, id: funnel.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "slug_taken" };
    }
    console.error("Failed to create funnel", error);
    return { ok: false, error: "unknown" };
  }
}

/** Update a funnel, replacing its questions transactionally. Admin-only. */
export async function updateFunnel(
  id: string,
  input: FunnelInput,
): Promise<FunnelActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = funnelSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    await prisma.$transaction([
      prisma.funnelQuestion.deleteMany({ where: { funnelId: id } }),
      prisma.funnel.update({
        where: { id },
        data: {
          ...toScalarData(parsed.data),
          questions: { create: questionsCreate(parsed.data) },
        },
      }),
    ]);
    revalidateFunnels();
    return { ok: true, id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "slug_taken" };
    }
    console.error("Failed to update funnel", error);
    return { ok: false, error: "unknown" };
  }
}

/** Delete a funnel (cascades to questions + submissions). Admin-only. */
export async function deleteFunnel(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    await prisma.funnel.delete({ where: { id } });
    revalidateFunnels();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete funnel", error);
    return { ok: false };
  }
}

/** Update the global default lead-capture block for a locale. Admin-only. */
export async function updateFunnelDefaultTemplate(
  input: FunnelDefaultTemplateInput,
): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  const parsed = funnelDefaultTemplateSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  try {
    const steps = parsed.data.steps as unknown as Prisma.InputJsonValue;
    await prisma.funnelDefaultTemplate.upsert({
      where: { locale: parsed.data.locale },
      update: { steps },
      create: { locale: parsed.data.locale, steps },
    });
    return { ok: true };
  } catch (error) {
    console.error("Failed to update funnel default template", error);
    return { ok: false };
  }
}

/** Disconnect the Google account used by MEETING funnels. Admin-only. */
export async function disconnectGoogle(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  try {
    await disconnectGoogleAccount();
    return { ok: true };
  } catch (error) {
    console.error("Failed to disconnect Google", error);
    return { ok: false };
  }
}
