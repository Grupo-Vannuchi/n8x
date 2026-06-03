import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/sections/hero";
import { Clients } from "@/components/sections/clients";
import { Services } from "@/components/sections/services";
import { PortfolioPreview } from "@/components/sections/portfolio-preview";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { Team } from "@/components/sections/team";
import { CTA } from "@/components/sections/cta";
import { resolveLocale } from "@/i18n/routing";

// Content is managed in the admin CMS, so render fresh from the database per
// request. Switch to ISR (`export const revalidate = N`) if you prefer caching.
export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Clients />
      <Services locale={locale} />
      <PortfolioPreview locale={locale} />
      <Stats locale={locale} />
      <Testimonials locale={locale} />
      <Team locale={locale} />
      <CTA />
    </>
  );
}
