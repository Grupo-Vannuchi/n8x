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
