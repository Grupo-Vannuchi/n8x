"use server";

import { updateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { tags } from "@/lib/cache";
import { projectSchema, type ProjectInput } from "@/lib/validations/project";

export type ProjectActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "slug_taken" | "unknown" };

/** Projects render on the home page, the portfolio list and each project page.
 * One content tag invalidates every cached page that reads them, in any locale
 * — no need to enumerate paths. (Admin pages are auth-gated, hence dynamic.) */
function revalidateProjects(): void {
  // Read-your-own-writes: `updateTag` expires the tag immediately so the next
  // request to any page that reads it fetches fresh data, rather than the
  // stale-while-revalidate serve of `revalidateTag(tag, "max")`. Admin edits
  // must show up on the public site on the very next visit, not the one after.
  updateTag(tags.projects);
}

/** Persist a project's bilingual + scalar fields. Shared by create and update. */
function toData(input: ProjectInput) {
  return {
    slug: input.slug,
    clientName: input.clientName,
    year: input.year,
    order: input.order,
    coverImage: input.coverImage,
    gallery: input.gallery,
    tags: input.tags,
    category: input.category,
    title: input.title,
    summary: input.summary,
    content: input.content,
    featured: input.featured,
    published: input.published,
  };
}

/** Create a portfolio project. Admin-only; re-validates server-side. */
export async function createProject(
  input: ProjectInput,
): Promise<ProjectActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const project = await prisma.project.create({ data: toData(parsed.data) });
    revalidateProjects();
    return { ok: true, id: project.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "slug_taken" };
    }
    console.error("Failed to create project", error);
    return { ok: false, error: "unknown" };
  }
}

/** Update an existing portfolio project. Admin-only; re-validates server-side. */
export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<ProjectActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  try {
    const project = await prisma.project.update({
      where: { id },
      data: toData(parsed.data),
    });
    revalidateProjects();
    return { ok: true, id: project.id };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, error: "slug_taken" };
    }
    console.error("Failed to update project", error);
    return { ok: false, error: "unknown" };
  }
}

/** Delete a portfolio project. Admin-only. */
export async function deleteProject(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    await prisma.project.delete({ where: { id } });
    revalidateProjects();
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete project", error);
    return { ok: false };
  }
}
