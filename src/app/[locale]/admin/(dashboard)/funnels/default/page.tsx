import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FunnelDefaultForm } from "@/components/admin/funnel-default-form";
import { getFunnelDefaultTemplate } from "@/lib/admin-queries";
import {
  DEFAULT_TEMPLATE_STEPS,
  type FunnelDefaultStep,
} from "@/lib/funnel-runtime";
import { locales, resolveLocale } from "@/i18n/routing";

export default async function FunnelDefaultPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.funnels");

  const templates = await Promise.all(
    locales.map(async (l) => {
      const row = await getFunnelDefaultTemplate(l);
      const steps =
        (row?.steps as FunnelDefaultStep[] | undefined) ??
        DEFAULT_TEMPLATE_STEPS[l];
      return { locale: l, steps };
    }),
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/funnels"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("title")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{t("defaultTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("defaultSubtitle")}</p>
      </div>

      {templates.map(({ locale: l, steps }) => (
        <section
          key={l}
          className="rounded-xl border border-border bg-card p-5"
        >
          <h2 className="mb-4 text-sm font-semibold">
            {t("defaultForLocale", { locale: l.toUpperCase() })}
          </h2>
          <FunnelDefaultForm locale={l} initialSteps={steps} />
        </section>
      ))}
    </div>
  );
}
