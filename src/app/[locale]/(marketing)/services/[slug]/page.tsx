import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Icon } from "@/components/ui/icon";
import { RichText } from "@/components/rich-text";
import { buttonVariants } from "@/components/ui/button";
import { getServiceBySlug, getServiceSlugs } from "@/lib/queries";
import { resolveLocale } from "@/i18n/routing";
import { localeAlternates, localizedUrl } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { BreadcrumbJsonLd, ServiceJsonLd } from "@/components/json-ld";

type Params = { locale: string; slug: string };

// Prerender every published service (per locale). New/edited services are
// rendered on demand and cached, then refreshed via the `services` tag.
// Resilient to the DB being unavailable at build time — falls back to on-demand.
export async function generateStaticParams() {
  try {
    return (await getServiceSlugs()).map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const service = await getServiceBySlug(locale, slug);
  if (!service) return {};
  // No explicit `openGraph`: og:title/description derive from title/description
  // and og:image falls back to the shared `[locale]/opengraph-image.tsx`.
  return {
    title: service.title,
    description: service.description,
    alternates: localeAlternates(locale, `/services/${slug}`),
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const tn = await getTranslations("nav");
  const service = await getServiceBySlug(locale, slug);

  if (!service) notFound();

  return (
    <article>
      <ServiceJsonLd
        locale={locale}
        slug={slug}
        name={service.title}
        description={service.description}
      />
      <BreadcrumbJsonLd
        items={[
          { name: siteConfig.name, url: localizedUrl(locale) },
          { name: tn("services"), url: localizedUrl(locale, "/services") },
          {
            name: service.title,
            url: localizedUrl(locale, `/services/${slug}`),
          },
        ]}
      />
      <div className="border-b border-border bg-muted/30">
        <Container className="py-12 sm:py-16">
          <Link
            href="/services"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {t("title")}
          </Link>
          <span className="inline-flex size-14 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon name={service.icon} className="size-7" />
          </span>
          <h1 className="mt-6 max-w-3xl text-balance font-display text-4xl font-normal tracking-tight sm:text-5xl">
            {service.title}
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            {service.description}
          </p>
        </Container>
      </div>

      {service.content.length > 0 ? (
        <Container className="py-12 sm:py-16">
          <RichText
            blocks={service.content}
            className="mx-auto flex max-w-3xl flex-col gap-5 text-pretty"
          />
        </Container>
      ) : null}

      <Section className="bg-muted/30">
        <div className="flex flex-col items-center gap-5 text-center">
          <h2 className="text-balance font-display text-2xl font-normal tracking-tight sm:text-3xl">
            {t("ctaTitle")}
          </h2>
          <Link href="/contact" className={buttonVariants({ size: "lg" })}>
            {t("ctaButton")}
            <ArrowRight className="size-5" />
          </Link>
          <Link
            href="/services"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("viewAll")}
          </Link>
        </div>
      </Section>
    </article>
  );
}
