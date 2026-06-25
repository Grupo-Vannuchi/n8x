import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { env } from "@/lib/env";

const base = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

/**
 * Absolute URL for a path in a given locale. The default locale is served
 * without a prefix ("/"), other locales are prefixed ("/en") — matching the
 * `localePrefix: "as-needed"` routing config.
 */
export function localizedUrl(locale: string, path = ""): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  return `${base}${prefix}${path}`;
}

/** hreflang language → URL map for a path across every supported locale. */
export function languageAlternates(path = ""): Record<string, string> {
  return Object.fromEntries(locales.map((l) => [l, localizedUrl(l, path)]));
}

/**
 * Resolve a stored asset reference (which may be a relative path like
 * `/uploads/x.jpg` or an already-absolute `https://…` URL) to an absolute URL.
 * JSON-LD and social images must be absolute, unlike `next/image` `src` values.
 */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${base}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * `alternates` block for a page's `generateMetadata`: a self-referencing
 * canonical for the current locale plus hreflang links for every locale.
 * Pass the page's path without the locale prefix, e.g. `"/about"` (home = "").
 */
export function localeAlternates(locale: Locale, path = "") {
  return {
    canonical: localizedUrl(locale, path),
    languages: languageAlternates(path),
  };
}

/**
 * The `alternates` + `openGraph.url` block for a page's `generateMetadata`, both
 * pointing at the page's self-referencing canonical (per the `as-needed` locale
 * rule) so social shares resolve the right URL. Spread into the returned
 * metadata: `...localeMetadata(locale, "/about")`.
 */
export function localeMetadata(locale: Locale, path = "") {
  return {
    alternates: localeAlternates(locale, path),
    openGraph: { url: localizedUrl(locale, path) },
  };
}
