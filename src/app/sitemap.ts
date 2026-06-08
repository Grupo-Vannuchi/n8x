import type { MetadataRoute } from "next";
import { defaultLocale } from "@/i18n/routing";
import { localizedUrl, languageAlternates } from "@/lib/seo";
import {
  getProjectSitemapEntries,
  getServiceSitemapEntries,
} from "@/lib/queries";

type Entry = { path: string; lastModified: Date };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static marketing routes share the deploy time as their last-modified date.
  const now = new Date();
  const staticEntries: Entry[] = [
    "",
    "/about",
    "/services",
    "/portfolio",
    "/contact",
    "/careers",
  ].map((path) => ({ path, lastModified: now }));

  let projectEntries: Entry[] = [];
  let serviceEntries: Entry[] = [];
  try {
    const [projects, services] = await Promise.all([
      getProjectSitemapEntries(),
      getServiceSitemapEntries(),
    ]);
    // Detail pages carry the real edit date of their content record.
    projectEntries = projects.map((p) => ({
      path: `/portfolio/${p.slug}`,
      lastModified: p.updatedAt,
    }));
    serviceEntries = services.map((s) => ({
      path: `/services/${s.slug}`,
      lastModified: s.updatedAt,
    }));
  } catch {
    // Database unavailable at build time — ship the static routes only.
  }

  return [...staticEntries, ...projectEntries, ...serviceEntries].map(
    ({ path, lastModified }) => ({
      url: localizedUrl(defaultLocale, path),
      lastModified,
      alternates: { languages: languageAlternates(path) },
    }),
  );
}
