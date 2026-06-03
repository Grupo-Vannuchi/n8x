import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { localize, localizeRich } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

/**
 * Content data-access layer.
 *
 * Each function reads published content from Postgres and resolves bilingual
 * JSON fields to plain strings for the requested locale, returning view-ready
 * objects. Wrapped in React `cache` so repeated calls within one request (e.g.
 * a page and its metadata) hit the database only once.
 */

export type ServiceView = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  description: string;
};

export type ProjectCardView = {
  id: string;
  slug: string;
  clientName: string;
  category: string;
  year: number;
  coverImage: string;
  tags: string[];
  title: string;
  summary: string;
  featured: boolean;
};

export type ProjectDetailView = ProjectCardView & {
  gallery: string[];
  content: string[];
};

export type TestimonialView = {
  id: string;
  authorName: string;
  company: string;
  avatarUrl: string | null;
  rating: number;
  role: string;
  quote: string;
};

export type TeamMemberView = {
  id: string;
  name: string;
  photoUrl: string | null;
  role: string;
  socials: Record<string, string>;
};

export type StatView = {
  id: string;
  key: string;
  value: number;
  suffix: string;
  label: string;
};

export type ClientView = {
  id: string;
  name: string;
  logoUrl: string;
  website: string | null;
};

export const getServices = cache(
  async (locale: Locale): Promise<ServiceView[]> => {
    const rows = await prisma.service.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });
    return rows.map((s) => ({
      id: s.id,
      slug: s.slug,
      icon: s.icon,
      title: localize(s.title, locale),
      description: localize(s.description, locale),
    }));
  },
);

export const getProjects = cache(
  async (
    locale: Locale,
    options: { featuredOnly?: boolean; take?: number } = {},
  ): Promise<ProjectCardView[]> => {
    const rows = await prisma.project.findMany({
      where: {
        published: true,
        ...(options.featuredOnly ? { featured: true } : {}),
      },
      orderBy: [{ order: "asc" }, { year: "desc" }],
      take: options.take,
    });
    return rows.map(toProjectCard(locale));
  },
);

export const getProjectBySlug = cache(
  async (
    locale: Locale,
    slug: string,
  ): Promise<ProjectDetailView | null> => {
    const p = await prisma.project.findFirst({
      where: { slug, published: true },
    });
    if (!p) return null;
    return {
      ...toProjectCard(locale)(p),
      gallery: p.gallery,
      content: localizeRich(p.content, locale),
    };
  },
);

/** Slugs of all published projects, for `generateStaticParams`. */
export const getProjectSlugs = cache(async (): Promise<string[]> => {
  const rows = await prisma.project.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
});

export const getTestimonials = cache(
  async (locale: Locale): Promise<TestimonialView[]> => {
    const rows = await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });
    return rows.map((t) => ({
      id: t.id,
      authorName: t.authorName,
      company: t.company,
      avatarUrl: t.avatarUrl,
      rating: t.rating,
      role: localize(t.role, locale),
      quote: localize(t.quote, locale),
    }));
  },
);

export const getTeam = cache(
  async (locale: Locale): Promise<TeamMemberView[]> => {
    const rows = await prisma.teamMember.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });
    return rows.map((m) => ({
      id: m.id,
      name: m.name,
      photoUrl: m.photoUrl,
      role: localize(m.role, locale),
      socials: (m.socials as Record<string, string>) ?? {},
    }));
  },
);

export const getStats = cache(
  async (locale: Locale): Promise<StatView[]> => {
    const rows = await prisma.stat.findMany({
      where: { published: true },
      orderBy: { order: "asc" },
    });
    return rows.map((s) => ({
      id: s.id,
      key: s.key,
      value: s.value,
      suffix: s.suffix,
      label: localize(s.label, locale),
    }));
  },
);

export const getClients = cache(async (): Promise<ClientView[]> => {
  const rows = await prisma.client.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    logoUrl: c.logoUrl,
    website: c.website,
  }));
});

function toProjectCard(locale: Locale) {
  return (p: {
    id: string;
    slug: string;
    clientName: string;
    category: unknown;
    year: number;
    coverImage: string;
    tags: string[];
    title: unknown;
    summary: unknown;
    featured: boolean;
  }): ProjectCardView => ({
    id: p.id,
    slug: p.slug,
    clientName: p.clientName,
    category: localize(p.category, locale),
    year: p.year,
    coverImage: p.coverImage,
    tags: p.tags,
    title: localize(p.title, locale),
    summary: localize(p.summary, locale),
    featured: p.featured,
  });
}
