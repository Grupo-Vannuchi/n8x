import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, AlertCircle, MessagesSquare } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { WhatsappManager } from "@/components/admin/whatsapp-manager";
import {
  fetchInstances,
  isEvolutionConfigured,
  defaultInstance,
} from "@/lib/evolution";
import { env } from "@/lib/env";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default async function FunnelWhatsappPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.whatsapp");

  const configured = isEvolutionConfigured();
  const res = configured ? await fetchInstances() : null;
  const instances = res?.ok ? res.data : [];
  const inboxUrl = env.WHATSAPP_INBOX_URL;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div>
        <Link
          href="/admin/funnels"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("backToFunnels")}
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Conversations live in the dedicated inbox (gold standard) — link, don't rebuild. */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-5",
          inboxUrl ? "border-border" : "border-dashed border-border",
        )}
      >
        <div className="min-w-0">
          <p className="font-medium">{t("inboxTitle")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {inboxUrl ? t("inboxHint") : t("inboxNotConfigured")}
          </p>
        </div>
        {inboxUrl ? (
          <a
            href={inboxUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "md" }))}
          >
            <MessagesSquare className="size-4" />
            {t("openInbox")}
          </a>
        ) : null}
      </div>

      {!configured ? (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium">{t("notConfigured")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("notConfiguredHint")}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <WhatsappManager
          initialInstances={instances}
          defaultInstance={defaultInstance()}
        />
      )}
    </div>
  );
}
