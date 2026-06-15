import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { resolveLocale } from "@/i18n/routing";
import { getPublishedFunnelBySlug } from "@/lib/queries";
import { FunnelRunner } from "@/components/funnels/funnel-runner";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function FunnelPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const funnel = await getPublishedFunnelBySlug(locale, slug);
  if (!funnel) notFound();

  return <FunnelRunner funnel={funnel} />;
}
