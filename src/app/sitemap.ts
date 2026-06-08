import type { MetadataRoute } from "next";
import { defaultLocale } from "@/i18n/routing";
import { localizedUrl, languageAlternates } from "@/lib/seo";
import { getProjectSlugs, getServiceSlugs } from "@/lib/queries";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/about",
    "/services",
    "/portfolio",
    "/contact",
    "/careers",
  ];

  let projectPaths: string[] = [];
  let servicePaths: string[] = [];
  try {
    projectPaths = (await getProjectSlugs()).map((slug) => `/portfolio/${slug}`);
    servicePaths = (await getServiceSlugs()).map((slug) => `/services/${slug}`);
  } catch {
    // Database unavailable at build time — ship the static routes only.
  }

  return [...staticPaths, ...projectPaths, ...servicePaths].map((path) => ({
    url: localizedUrl(defaultLocale, path),
    lastModified: new Date(),
    alternates: { languages: languageAlternates(path) },
  }));
}
