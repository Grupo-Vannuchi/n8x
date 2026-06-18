/**
 * ─────────────────────────────────────────────────────────────────────────
 *  N8X MARKETING — BRAND CONFIGURATION
 * ─────────────────────────────────────────────────────────────────────────
 * This is the single source of truth for branding. To re-skin the entire site
 * for a new agency, edit the values below — name, contact details, social
 * links, theme colours and navigation. Nothing else needs to change.
 *
 * All user-facing *copy* lives in `src/messages/{locale}.json` (it is bilingual);
 * this file holds only brand identity, contact data and theme tokens.
 */

export type ThemePalette = {
  /** Primary brand colour (buttons, links, highlights). */
  brand: string;
  /** Readable text colour on top of `brand`. */
  brandForeground: string;
  /** Secondary accent used sparingly for emphasis. */
  accent: string;
  /** Page background and its readable foreground. */
  background: string;
  foreground: string;
};

/** Keys available under the `nav` translation namespace. */
export type NavKey = "about" | "services" | "portfolio" | "careers" | "contact";

export type NavItem = {
  /** Translation key under the `nav` namespace. */
  key: NavKey;
  /** Route relative to the locale root, e.g. "/portfolio". */
  href: string;
};

export type SiteConfig = {
  /** Public brand name shown in the wordmark and titles. */
  name: string;
  /** Legal entity name (footer / legal copy). */
  legalName: string;
  /** Year the agency was founded — drives the "years in business" copy. */
  foundedYear: number;
  /** Company registration number (Brazil: CNPJ). Optional. */
  registration?: string;
  /**
   * Parent company, when the agency is a brand/division of a larger group.
   * Emitted as `parentOrganization` in structured data so search/AI engines
   * resolve the corporate relationship and disambiguate the brand. Optional.
   */
  parentOrganization?: {
    name: string;
    /** Parent's official website, if any. */
    url?: string;
    /** Authoritative profiles for the parent (Google profile, LinkedIn, …). */
    sameAs?: string[];
  };

  contact: {
    email: string;
    /** Phone in human-readable form. */
    phone: string;
    whatsapp: {
      /** Digits only, with country code, for wa.me links. */
      number: string;
      /** Human-readable display form. */
      display: string;
    };
    address: {
      street: string;
      city: string;
      region: string;
      country: string;
    };
  };

  social: {
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
    facebook?: string;
  };

  /** Primary navigation shown in the header and footer. */
  nav: NavItem[];

  theme: {
    light: ThemePalette;
    dark: ThemePalette;
  };
};

export const siteConfig: SiteConfig = {
  name: "N8X Marketing",
  legalName: "n8x marketing & vendas.",
  foundedYear: 2017,
  registration: "43.158.706/0001-99",

  parentOrganization: {
    name: "Grupo Vannuchi Engenharia",
    // url: "https://...",            // preencher com o site oficial do Grupo
    // sameAs: ["https://..."],       // perfil do Google / LinkedIn do Grupo
  },

  contact: {
    email: "marketing@n8company.com.br",
    phone: "+55 (13) 99618-4401",
    whatsapp: {
      number: "5513996184401",
      display: "(13) 99618-4401",
    },
    address: {
      street: "Rua Frei Gaspar, 22 - sala 14",
      city: "Santos",
      region: "SP",
      country: "Brasil",
    },
  },

  social: {
    instagram: "https://instagram.com/n8xmarketing",
    tiktok: "https://tiktok.com/@thigo.vannuchi",
    linkedin: "https://www.linkedin.com/in/thiago-v-a060a7215/",
  },

  nav: [
    { key: "about", href: "/about" },
    { key: "services", href: "/services" },
    { key: "portfolio", href: "/portfolio" },
    { key: "careers", href: "/careers" },
    { key: "contact", href: "/contact" },
  ],

  theme: {
    light: {
      brand: "#0B0050",
      brandForeground: "#ffffff",
      accent: "#f59e0b",
      background: "#e0e0e0",
      foreground: "#0a0a0a",
    },
    dark: {
      brand: "#4D9CFB",
      brandForeground: "#0a0a0a",
      accent: "#fbbf24",
      background: "#0a0a0a",
      foreground: "#ededed",
    },
  },
};

/** Number of full years the agency has been operating. */
export function yearsInBusiness(now: Date = new Date()): number {
  return now.getFullYear() - siteConfig.foundedYear;
}

/** Build a wa.me deep link with an optional pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${siteConfig.contact.whatsapp.number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** The agency's address as a single comma-separated line. */
export function fullAddress(): string {
  const { street, city, region, country } = siteConfig.contact.address;
  return [street, city, region, country].filter(Boolean).join(", ");
}

/**
 * Build a Google Maps embed URL pointing at the agency's address. Uses the
 * keyless `output=embed` endpoint, which renders a fully interactive map (zoom,
 * pan, "Open in Maps") without an API key.
 *
 * @param zoom Initial zoom level (1 = world, 20 = building).
 */
export function mapEmbedUrl(zoom = 15): string {
  const params = new URLSearchParams({
    q: fullAddress(),
    z: String(zoom),
    output: "embed",
  });
  return `https://maps.google.com/maps?${params.toString()}`;
}
