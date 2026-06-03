import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { defaultLocale, locales } from "@/i18n/routing";
import { getProjectSlugs } from "@/lib/queries";

const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/** Build an absolute URL for a path in a given locale (default locale unprefixed). */
function url(locale: string, path: string): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${base}${prefix}${path}`;
}

/** hreflang alternates map for a path across all locales. */
function alternates(path: string) {
  return {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, url(locale, path)]),
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/about", "/portfolio", "/contact", "/careers"];

  let projectPaths: string[] = [];
  try {
    projectPaths = (await getProjectSlugs()).map((slug) => `/portfolio/${slug}`);
  } catch {
    // Database unavailable at build time — ship the static routes only.
  }

  return [...staticPaths, ...projectPaths].map((path) => ({
    url: url(defaultLocale, path),
    lastModified: new Date(),
    alternates: alternates(path),
  }));
}
