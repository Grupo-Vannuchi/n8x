import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getGoogleAccount } from "@/lib/admin-queries";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default async function FunnelGooglePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.funnels");

  const account = await getGoogleAccount();
  const connected = Boolean(account?.refreshToken);

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
        <h1 className="text-2xl font-bold tracking-tight">{t("googleConnection")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("googleSubtitle")}</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        {connected ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600" />
            <div>
              <p className="font-medium">{t("googleConnected")}</p>
              {account?.email ? (
                <p className="text-sm text-muted-foreground">{account.email}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <AlertCircle className="size-5 text-amber-500" />
            <p className="font-medium">{t("googleNotConnected")}</p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          {/* Server-side OAuth start route (an API route, not a page) — a plain
              anchor is correct here, so the page-link lint rule is disabled. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/api/admin/google/connect"
            className={cn(buttonVariants({ size: "md" }))}
          >
            {connected ? t("googleReconnect") : t("googleConnect")}
          </a>
        </div>
      </div>
    </div>
  );
}
