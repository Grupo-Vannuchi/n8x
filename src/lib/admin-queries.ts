import "server-only";
import type { Lead, LeadStatus, LeadType, Project } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardStats = {
  newLeads: number;
  totalProjects: number;
  totalServices: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [newLeads, totalProjects, totalServices] = await Promise.all([
    prisma.lead.count({ where: { status: "NEW" } }),
    prisma.project.count({ where: { published: true } }),
    prisma.service.count({ where: { published: true } }),
  ]);
  return { newLeads, totalProjects, totalServices };
}

export async function getRecentLeads(take = 5): Promise<Lead[]> {
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take,
  });
}

export type LeadFilters = {
  type?: LeadType;
  status?: LeadStatus;
  tag?: string;
};

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  return prisma.lead.findMany({
    where: {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.tag ? { tags: { has: filters.tag } } : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Distinct tags used across all leads, alphabetically sorted (for filters). */
export async function getLeadTags(): Promise<string[]> {
  const rows = await prisma.lead.findMany({ select: { tags: true } });
  const tags = new Set<string>();
  for (const row of rows) for (const tag of row.tags) tags.add(tag);
  return [...tags].sort((a, b) => a.localeCompare(b));
}

/** All projects (published and drafts) for the admin list, in display order. */
export async function getAdminProjects(): Promise<Project[]> {
  return prisma.project.findMany({
    orderBy: [{ order: "asc" }, { year: "desc" }],
  });
}

export async function getProjectById(id: string): Promise<Project | null> {
  return prisma.project.findUnique({ where: { id } });
}
