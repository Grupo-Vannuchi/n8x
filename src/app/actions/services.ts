"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { serviceSchema, type ServiceInput } from "@/lib/validations/service";

export type ServiceActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "slug_taken" | "unknown" };

/** Admin routes are localized (pt unprefixed, en under /en); services are also
 * listed on the home page. Revalidate every affected path. */
function revalidateServicePaths(): void {
  for (const path of ["/admin/services", "/"]) {
    revalidatePath(path);
    revalidatePath(`/en${path}`);
  }
}

/** Persist a service's bilingual + scalar fields. Shared by create and update. */
function toData(input: ServiceInput) {
  return {
    slug: input.slug,
    icon: input.icon,
    order: input.order,
    title: input.title,
    description: input.description,
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
    revalidateServicePaths();
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
    revalidateServicePaths();
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
    revalidateServicePaths();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete service", error);
    return { ok: false };
  }
}
