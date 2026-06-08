"use server";

import { updateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { tags } from "@/lib/cache";
import { statSchema, type StatInput } from "@/lib/validations/stat";

export type StatActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "key_taken" | "unknown" };

/** Stats render on the home page. One content tag invalidates every cached page
 * that reads them, in any locale. (Admin pages are auth-gated, hence dynamic.) */
function revalidateStats(): void {
  // Read-your-own-writes: `updateTag` expires the tag immediately so the next
  // request to any page that reads it fetches fresh data, rather than the
  // stale-while-revalidate serve of `revalidateTag(tag, "max")`. Admin edits
  // must show up on the public site on the very next visit, not the one after.
  updateTag(tags.stats);
}

/** Persist a stat's bilingual + scalar fields. Shared by create and update. */
function toData(input: StatInput) {
  return {
    key: input.key,
    value: input.value,
    suffix: input.suffix,
    order: input.order,
    label: input.label,
    published: input.published,
  };
}

/** Create a stat. Admin-only; re-validates server-side. */
export async function createStat(input: StatInput): Promise<StatActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = statSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const stat = await prisma.stat.create({ data: toData(parsed.data) });
    revalidateStats();
    return { ok: true, id: stat.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "key_taken" };
    }
    console.error("Failed to create stat", error);
    return { ok: false, error: "unknown" };
  }
}

/** Update an existing stat. Admin-only; re-validates server-side. */
export async function updateStat(
  id: string,
  input: StatInput,
): Promise<StatActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = statSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const stat = await prisma.stat.update({
      where: { id },
      data: toData(parsed.data),
    });
    revalidateStats();
    return { ok: true, id: stat.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "key_taken" };
    }
    console.error("Failed to update stat", error);
    return { ok: false, error: "unknown" };
  }
}

/** Delete a stat. Admin-only. */
export async function deleteStat(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    await prisma.stat.delete({ where: { id } });
    revalidateStats();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete stat", error);
    return { ok: false };
  }
}
