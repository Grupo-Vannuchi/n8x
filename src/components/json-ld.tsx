import { defaultLocale } from "@/i18n/routing";
import { siteConfig } from "@/config/site";
import { localizedUrl } from "@/lib/seo";

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
    "@id": `${url}/#organization`,
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
