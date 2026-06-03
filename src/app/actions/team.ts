"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { teamMemberSchema, type TeamMemberInput } from "@/lib/validations/team";

export type TeamActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "unknown" };

/** Admin routes are localized (pt unprefixed, en under /en); the team is also
 * shown on the home page. Revalidate every affected path. */
function revalidateTeamPaths(): void {
  for (const path of ["/admin/team", "/"]) {
    revalidatePath(path);
    revalidatePath(`/en${path}`);
  }
}

/** Keep only the social links that were actually filled in. */
function buildSocials(socials: TeamMemberInput["socials"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(socials)) {
    if (value) out[key] = value;
  }
  return out;
}

/** Persist a team member's fields. Shared by create and update. */
function toData(input: TeamMemberInput) {
  return {
    name: input.name,
    photoUrl: input.photoUrl || null,
    socials: buildSocials(input.socials),
    role: input.role,
    order: input.order,
    published: input.published,
  };
}

/** Create a team member. Admin-only; re-validates server-side. */
export async function createTeamMember(
  input: TeamMemberInput,
): Promise<TeamActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = teamMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const member = await prisma.teamMember.create({ data: toData(parsed.data) });
    revalidateTeamPaths();
    return { ok: true, id: member.id };
  } catch (error) {
    console.error("Failed to create team member", error);
    return { ok: false, error: "unknown" };
  }
}

/** Update an existing team member. Admin-only; re-validates server-side. */
export async function updateTeamMember(
  id: string,
  input: TeamMemberInput,
): Promise<TeamActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = teamMemberSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const member = await prisma.teamMember.update({
      where: { id },
      data: toData(parsed.data),
    });
    revalidateTeamPaths();
    return { ok: true, id: member.id };
  } catch (error) {
    console.error("Failed to update team member", error);
    return { ok: false, error: "unknown" };
  }
}

/** Delete a team member. Admin-only. */
export async function deleteTeamMember(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    await prisma.teamMember.delete({ where: { id } });
    revalidateTeamPaths();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete team member", error);
    return { ok: false };
  }
}
