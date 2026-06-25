import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { resolveLocale } from "@/i18n/routing";
import { localeMetadata } from "@/lib/seo";
import { LegalDocument } from "@/components/legal-document";
import { getLegal } from "@/content/legal";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const { terms } = getLegal(locale);
  return {
    title: terms.title,
    description: terms.intro[0].replace(/\*\*/g, ""),
    ...localeMetadata(locale, "/terms"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const { terms } = getLegal(locale);
  return <LegalDocument doc={terms} />;
}
