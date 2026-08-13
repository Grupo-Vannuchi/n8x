import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
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
  setRequestLocale(resolveLocale(rawLocale));

  const funnel = await getPublishedFunnelBySlug(slug);
  if (!funnel) notFound();

  /**
   * A funnel is single-language, and that language is the funnel's — not the
   * URL's. The locale proxy negotiates visitors on an English device into
   * `/en/…`, which previously 404'd them out of every Portuguese funnel. We
   * serve the funnel wherever it is reached and override the surrounding UI
   * strings (send button, validation errors) with its own locale, so the copy
   * the admin wrote and the chrome around it always speak the same language.
   */
  const funnelLocale = resolveLocale(funnel.locale);
  const messages = await getMessages({ locale: funnelLocale });

  return (
    <NextIntlClientProvider locale={funnelLocale} messages={messages}>
      <FunnelRunner funnel={funnel} />
    </NextIntlClientProvider>
  );
}
