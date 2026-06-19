import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FunnelForm } from "@/components/admin/funnel-form";
import { emptyFunnelForm } from "@/lib/funnel-form";
import { getFunnelDefaultTemplate } from "@/lib/admin-queries";
import { fetchInstances, isEvolutionConfigured } from "@/lib/evolution";
import {
  DEFAULT_TEMPLATE_STEPS,
  type FunnelDefaultStep,
} from "@/lib/funnel-runtime";
import { resolveLocale } from "@/i18n/routing";

export default async function NewFunnelPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.funnels");

  // The new funnel defaults to the current admin locale; pull its default block.
  const template = await getFunnelDefaultTemplate(locale);
  const steps =
    (template?.steps as FunnelDefaultStep[] | undefined) ??
    DEFAULT_TEMPLATE_STEPS[locale];

  const evo = isEvolutionConfigured() ? await fetchInstances() : null;
  const instanceOptions = evo?.ok ? evo.data.map((i) => i.name) : [];

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
        <h1 className="text-2xl font-bold tracking-tight">{t("new")}</h1>
      </div>

      <FunnelForm
        mode="create"
        defaultValues={emptyFunnelForm(steps, locale)}
        templateSteps={steps}
        instanceOptions={instanceOptions}
      />
    </div>
  );
}
