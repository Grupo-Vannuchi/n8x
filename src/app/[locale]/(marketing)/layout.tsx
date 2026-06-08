import { setRequestLocale } from "next-intl/server";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsappButton } from "@/components/layout/whatsapp-button";
import { OrganizationJsonLd } from "@/components/json-ld";
import { getProjects, getServices } from "@/lib/queries";
import { resolveLocale } from "@/i18n/routing";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);

  const [projects, services] = await Promise.all([
    getProjects(locale),
    getServices(locale),
  ]);
  const portfolioLinks = projects.map((p) => ({ slug: p.slug, title: p.title }));
  const serviceLinks = services.map((s) => ({ slug: s.slug, title: s.title }));

  return (
    <>
      <OrganizationJsonLd />
      <Header portfolioLinks={portfolioLinks} serviceLinks={serviceLinks} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsappButton />
    </>
  );
}
