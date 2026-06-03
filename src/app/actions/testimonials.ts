"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  testimonialSchema,
  type TestimonialInput,
} from "@/lib/validations/testimonial";

export type TestimonialActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "unknown" };

/** Admin routes are localized (pt unprefixed, en under /en); testimonials are
 * also shown on the home page. Revalidate every affected path. */
function revalidateTestimonialPaths(): void {
  for (const path of ["/admin/testimonials", "/"]) {
    revalidatePath(path);
    revalidatePath(`/en${path}`);
  }
}

/** Persist a testimonial's fields. Shared by create and update. */
function toData(input: TestimonialInput) {
  return {
    authorName: input.authorName,
    company: input.company,
    avatarUrl: input.avatarUrl || null,
    rating: input.rating,
    role: input.role,
    quote: input.quote,
    order: input.order,
    published: input.published,
  };
}

/** Create a testimonial. Admin-only; re-validates server-side. */
export async function createTestimonial(
  input: TestimonialInput,
): Promise<TestimonialActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const t = await prisma.testimonial.create({ data: toData(parsed.data) });
    revalidateTestimonialPaths();
    return { ok: true, id: t.id };
  } catch (error) {
    console.error("Failed to create testimonial", error);
    return { ok: false, error: "unknown" };
  }
}

/** Update an existing testimonial. Admin-only; re-validates server-side. */
export async function updateTestimonial(
  id: string,
  input: TestimonialInput,
): Promise<TestimonialActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = testimonialSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const t = await prisma.testimonial.update({
      where: { id },
      data: toData(parsed.data),
    });
    revalidateTestimonialPaths();
    return { ok: true, id: t.id };
  } catch (error) {
    console.error("Failed to update testimonial", error);
    return { ok: false, error: "unknown" };
  }
}

/** Delete a testimonial. Admin-only. */
export async function deleteTestimonial(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    await prisma.testimonial.delete({ where: { id } });
    revalidateTestimonialPaths();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete testimonial", error);
    return { ok: false };
  }
}
