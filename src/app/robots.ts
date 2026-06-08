import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { defaultLocale, locales } from "@/i18n/routing";

const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/**
 * Admin paths to keep out of the index, for every locale. The default locale is
 * served unprefixed ("/admin"), others are prefixed ("/en/admin") — matching the
 * `localePrefix: "as-needed"` routing. Derived from `locales` so adding a locale
 * never silently leaves an admin path crawlable.
 */
const adminPaths = locales.map((locale) =>
  locale === defaultLocale ? "/admin" : `/${locale}/admin`,
);

/**
 * Generative-AI crawlers. We explicitly allow them (minus admin) so the agency's
 * content is eligible for citation in AI answers (GEO/AEO) — an opt-in stance,
 * since some of these honour `Disallow` but not the `*` rule.
 */
const aiCrawlers = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: adminPaths },
      { userAgent: aiCrawlers, allow: "/", disallow: adminPaths },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
