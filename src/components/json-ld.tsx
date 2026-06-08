import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import { absoluteUrl, localizedUrl } from "@/lib/seo";

/**
 * Structured data (JSON-LD only — never Microdata/RDFa). Each component emits a
 * single `<script type="application/ld+json">`. Entities cross-reference each
 * other by stable `@id` so search/AI engines resolve one connected graph:
 *
 *   ORG_ID  — the agency as a {@link https://schema.org/ProfessionalService}
 *   SITE_ID — the website as a {@link https://schema.org/WebSite}
 *
 * Services and portfolio cases point back to ORG_ID as their provider/creator.
 */
const ORG_ID = `${localizedUrl(defaultLocale)}/#organization`;
const SITE_ID = `${localizedUrl(defaultLocale)}/#website`;

/** Serialize a JSON-LD object into a `<script>` tag safe for `<head>`/`<body>`. */
function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Schema.org payload is built from trusted static config, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Organization / LocalBusiness structured data for the agency. Emitted once on
 * public pages so search engines (and AI engines) can resolve the brand as an
 * entity — name, contact, address and social profiles. JSON-LD only.
 */
export function OrganizationJsonLd() {
  const { name, legalName, foundedYear, contact, social } = siteConfig;
  const url = localizedUrl(defaultLocale);

  const data = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name,
    legalName,
    url,
    email: contact.email,
    telephone: contact.phone,
    foundingDate: String(foundedYear),
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.street,
      addressLocality: contact.address.city,
      addressRegion: contact.address.region,
      addressCountry: contact.address.country,
    },
    // Filter out unset social links so `sameAs` never contains undefined.
    sameAs: Object.values(social).filter(Boolean),
  };

  return <JsonLd data={data} />;
}

/**
 * WebSite entity for the whole site. Declares the site's languages and ties it
 * to the publishing Organization. No `SearchAction` — the site has no on-site
 * search endpoint, so advertising one would be misleading.
 */
export function WebSiteJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    url: localizedUrl(defaultLocale),
    name: siteConfig.name,
    inLanguage: [...locales],
    publisher: { "@id": ORG_ID },
  };

  return <JsonLd data={data} />;
}

/**
 * Breadcrumb trail for a detail page. `items` are ordered root → current page;
 * pass absolute URLs (use {@link localizedUrl}). Enables breadcrumb rich results.
 */
export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

/** `Service` schema for a service detail page, provided by the agency. */
export function ServiceJsonLd({
  locale,
  slug,
  name,
  description,
}: {
  locale: Locale;
  slug: string;
  name: string;
  description: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    serviceType: name,
    url: localizedUrl(locale, `/services/${slug}`),
    inLanguage: locale,
    provider: { "@id": ORG_ID },
    areaServed: {
      "@type": "Country",
      name: siteConfig.contact.address.country,
    },
  };

  return <JsonLd data={data} />;
}

/** `CreativeWork` schema for a portfolio case study, created by the agency. */
export function CreativeWorkJsonLd({
  locale,
  slug,
  name,
  description,
  image,
  year,
  category,
}: {
  locale: Locale;
  slug: string;
  name: string;
  description: string;
  image: string;
  year: number;
  category: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name,
    description,
    genre: category,
    url: localizedUrl(locale, `/portfolio/${slug}`),
    image: absoluteUrl(image),
    dateCreated: String(year),
    inLanguage: locale,
    creator: { "@id": ORG_ID },
  };

  return <JsonLd data={data} />;
}
