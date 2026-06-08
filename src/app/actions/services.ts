"use server";

import { updateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { tags } from "@/lib/cache";
import { serviceSchema, type ServiceInput } from "@/lib/validations/service";

export type ServiceActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "slug_taken" | "unknown" };

/** Services render on the home page, the services list and each service page.
 * One content tag invalidates every cached page that reads them, in any locale
 * — no need to enumerate paths. (Admin pages are auth-gated, hence dynamic.) */
function revalidateServices(): void {
  // Read-your-own-writes: `updateTag` expires the tag immediately so the next
  // request to any page that reads it fetches fresh data, rather than the
  // stale-while-revalidate serve of `revalidateTag(tag, "max")`. Admin edits
  // must show up on the public site on the very next visit, not the one after.
  updateTag(tags.services);
}

/** Persist a service's bilingual + scalar fields. Shared by create and update. */
function toData(input: ServiceInput) {
  return {
    slug: input.slug,
    icon: input.icon,
    order: input.order,
    title: input.title,
    description: input.description,
    content: input.content,
    featured: input.featured,
    published: input.published,
  };
}

/** Create a service. Admin-only; re-validates server-side. */
export async function createService(
  input: ServiceInput,
): Promise<ServiceActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const service = await prisma.service.create({ data: toData(parsed.data) });
    revalidateServices();
    return { ok: true, id: service.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "slug_taken" };
    }
    console.error("Failed to create service", error);
    return { ok: false, error: "unknown" };
  }
}

/** Update an existing service. Admin-only; re-validates server-side. */
export async function updateService(
  id: string,
  input: ServiceInput,
): Promise<ServiceActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const service = await prisma.service.update({
      where: { id },
      data: toData(parsed.data),
    });
    revalidateServices();
    return { ok: true, id: service.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "slug_taken" };
    }
    console.error("Failed to update service", error);
    return { ok: false, error: "unknown" };
  }
}

/** Delete a service. Admin-only. */
export async function deleteService(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    await prisma.service.delete({ where: { id } });
    revalidateServices();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete service", error);
    return { ok: false };
  }
}
