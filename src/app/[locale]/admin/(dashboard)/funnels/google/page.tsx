import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { GoogleDisconnectButton } from "@/components/admin/google-disconnect-button";
import { getGoogleAccount } from "@/lib/admin-queries";
import { isGoogleConfigured } from "@/lib/google-calendar";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default async function FunnelGooglePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.funnels");

  const { connected: justConnected, error } = await searchParams;
  const account = await getGoogleAccount();
  // A token rejected by Google (invalid_grant) keeps its row but needs a reconnect.
  const expired = Boolean(account?.refreshToken && account?.invalidatedAt);
  const connected = Boolean(account?.refreshToken) && !expired;
  const configured = isGoogleConfigured();

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

      {justConnected ? (
        <p className="rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {t("googleJustConnected")}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {t("googleConnectError")}
        </p>
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        {!configured ? (
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium">{t("googleNotConfigured")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("googleNotConfiguredHint")}
              </p>
            </div>
          </div>
        ) : expired ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium">{t("googleExpired")}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("googleExpiredHint")}
                </p>
                {account?.email ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {account.email}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/api/admin/google/connect"
                className={cn(buttonVariants({ size: "md" }))}
              >
                {t("googleReconnect")}
              </a>
              <GoogleDisconnectButton />
            </div>
          </div>
        ) : connected ? (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-emerald-600" />
              <div>
                <p className="font-medium">{t("googleConnected")}</p>
                {account?.email ? (
                  <p className="text-sm text-muted-foreground">{account.email}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* OAuth start is an API route, not a page — plain anchor is correct. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/api/admin/google/connect"
                className={cn(buttonVariants({ variant: "outline", size: "md" }))}
              >
                {t("googleReconnect")}
              </a>
              <GoogleDisconnectButton />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-amber-500" />
              <p className="font-medium">{t("googleNotConnected")}</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/admin/google/connect"
              className={cn(buttonVariants({ size: "md" }), "w-fit")}
            >
              {t("googleConnect")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
