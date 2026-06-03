import { resolveLocale } from "@/i18n/routing";
import { richTags } from "@/i18n/rich";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/ui/section";
import { Team } from "@/components/sections/team";
import { siteConfig } from "@/config/site";

// The team section is managed in the admin CMS, so render fresh per request
// (same approach as the home page).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("lead") };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("about");
  const values = t.raw("values") as { title: string; description: string }[];

  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle", { foundedYear: siteConfig.foundedYear })}
      />
      <Section>
        <p className="max-w-3xl text-pretty text-xl leading-relaxed">
          {t.rich("lead", richTags)}
        </p>

        <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">{t("missionTitle")}</h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              {t("mission")}
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("valuesTitle")}</h2>
            <ul className="mt-4 flex flex-col gap-4">
              {values.map((value) => (
                <li key={value.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <Check className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Team locale={locale} />
    </>
  );
}
