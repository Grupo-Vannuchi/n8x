import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { FunnelForm } from "@/components/admin/funnel-form";
import { getFunnelById, getFunnelDefaultTemplate } from "@/lib/admin-queries";
import { funnelToForm } from "@/lib/funnel-form";
import { fetchInstances, isEvolutionConfigured } from "@/lib/evolution";
import {
  DEFAULT_TEMPLATE_STEPS,
  type FunnelDefaultStep,
} from "@/lib/funnel-runtime";
import { resolveLocale } from "@/i18n/routing";

export default async function EditFunnelPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.funnels");

  const funnel = await getFunnelById(id);
  if (!funnel) notFound();

  const template = await getFunnelDefaultTemplate(funnel.locale);
  const steps =
    (template?.steps as FunnelDefaultStep[] | undefined) ??
    DEFAULT_TEMPLATE_STEPS[resolveLocale(funnel.locale)];

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
        <h1 className="text-2xl font-bold tracking-tight">
          {t("editTitle", { name: funnel.name })}
        </h1>
      </div>

      <FunnelForm
        mode="edit"
        funnelId={funnel.id}
        defaultValues={funnelToForm(funnel, funnel.questions, funnel.endings)}
        templateSteps={steps}
        instanceOptions={instanceOptions}
      />
    </div>
  );
}
