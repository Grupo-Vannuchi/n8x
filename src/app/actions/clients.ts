"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { clientSchema, type ClientInput } from "@/lib/validations/client";

export type ClientActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "unknown" };

/** Admin routes are localized (pt unprefixed, en under /en); clients are also
 * shown on the home page logo strip. Revalidate every affected path. */
function revalidateClientPaths(): void {
  for (const path of ["/admin/clients", "/"]) {
    revalidatePath(path);
    revalidatePath(`/en${path}`);
  }
}

/** Persist a client's fields. Shared by create and update. */
function toData(input: ClientInput) {
  return {
    name: input.name,
    logoUrl: input.logoUrl,
    website: input.website || null,
    order: input.order,
    published: input.published,
  };
}

/** Create a client. Admin-only; re-validates server-side. */
export async function createClient(
  input: ClientInput,
): Promise<ClientActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const client = await prisma.client.create({ data: toData(parsed.data) });
    revalidateClientPaths();
    return { ok: true, id: client.id };
  } catch (error) {
    console.error("Failed to create client", error);
    return { ok: false, error: "unknown" };
  }
}

/** Update an existing client. Admin-only; re-validates server-side. */
export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<ClientActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const client = await prisma.client.update({
      where: { id },
      data: toData(parsed.data),
    });
    revalidateClientPaths();
    return { ok: true, id: client.id };
  } catch (error) {
    console.error("Failed to update client", error);
    return { ok: false, error: "unknown" };
  }
}

/** Delete a client. Admin-only. */
export async function deleteClient(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    await prisma.client.delete({ where: { id } });
    revalidateClientPaths();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete client", error);
    return { ok: false };
  }
}
