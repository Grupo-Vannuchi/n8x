import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { resolveLocale } from "@/i18n/routing";
import { localeAlternates } from "@/lib/seo";
import { LegalDocument } from "@/components/legal-document";
import { getLegal } from "@/content/legal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const { privacy } = getLegal(locale);
  return {
    title: privacy.title,
    description: privacy.intro[0].replace(/\*\*/g, ""),
    alternates: localeAlternates(locale, "/privacy"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const { privacy } = getLegal(locale);
  return <LegalDocument doc={privacy} />;
}
