"use server";

import { updateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { tags } from "@/lib/cache";
import { clientSchema, type ClientInput } from "@/lib/validations/client";

export type ClientActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "unknown" };

/** Clients render on the home page logo strip. One content tag invalidates
 * every cached page that reads them, in any locale. (Admin pages are auth-gated,
 * hence dynamic.) */
function revalidateClients(): void {
  // Read-your-own-writes: `updateTag` expires the tag immediately so the next
  // request to any page that reads it fetches fresh data, rather than the
  // stale-while-revalidate serve of `revalidateTag(tag, "max")`. Admin edits
  // must show up on the public site on the very next visit, not the one after.
  updateTag(tags.clients);
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
    revalidateClients();
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
    revalidateClients();
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
    revalidateClients();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete client", error);
    return { ok: false };
  }
}
