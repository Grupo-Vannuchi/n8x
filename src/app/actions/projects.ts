"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { projectSchema, type ProjectInput } from "@/lib/validations/project";

export type ProjectActionResult =
  | { ok: true; id: string }
  | { ok: false; error: "unauthorized" | "invalid" | "slug_taken" | "unknown" };

/** Admin routes are localized (pt unprefixed, en under /en); public portfolio
 * pages and the home page list projects too. Revalidate every affected path. */
function revalidateProjectPaths(slug?: string): void {
  for (const path of ["/admin/projects", "/", "/portfolio"]) {
    revalidatePath(path);
    revalidatePath(`/en${path}`);
  }
  if (slug) {
    revalidatePath(`/portfolio/${slug}`);
    revalidatePath(`/en/portfolio/${slug}`);
  }
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
    revalidateProjectPaths(project.slug);
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
    revalidateProjectPaths(project.slug);
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
    const project = await prisma.project.delete({ where: { id } });
    revalidateProjectPaths(project.slug);
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete project", error);
    return { ok: false };
  }
}
