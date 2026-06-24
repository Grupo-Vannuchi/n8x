import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Plus,
  Pencil,
  ExternalLink,
  SlidersHorizontal,
  CalendarClock,
  AlertCircle,
  MessageCircle,
  Inbox,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { FunnelDeleteButton } from "@/components/admin/funnel-delete-button";
import { getAdminFunnels, getGoogleAccount } from "@/lib/admin-queries";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Public path for a funnel, honoring its own (single) locale. */
function funnelPath(locale: string, slug: string): string {
  return locale === "en" ? `/en/f/${slug}` : `/f/${slug}`;
}

export default async function AdminFunnelsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.funnels");
  const [funnels, googleAccount] = await Promise.all([
    getAdminFunnels(),
    getGoogleAccount(),
  ]);
  // Google token rejected (invalid_grant) → flag the button before the tab is opened.
  const googleExpired = Boolean(
    googleAccount?.refreshToken && googleAccount?.invalidatedAt,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/funnels/default"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            <SlidersHorizontal className="size-4" />
            {t("editDefault")}
          </Link>
          <Link
            href="/admin/funnels/whatsapp"
            className={cn(buttonVariants({ variant: "outline", size: "md" }))}
          >
            <MessageCircle className="size-4" />
            {t("whatsappPanel")}
          </Link>
          <Link
            href="/admin/funnels/google"
            aria-label={
              googleExpired ? t("googleConnectionExpired") : t("googleConnection")
            }
            className={cn(
              buttonVariants({ variant: "outline", size: "md" }),
              googleExpired &&
                "border-amber-500 bg-amber-500/10 text-amber-600 hover:border-amber-500 hover:bg-amber-500/20 hover:text-amber-700",
            )}
          >
            {googleExpired ? (
              <AlertCircle className="size-4" />
            ) : (
              <CalendarClock className="size-4" />
            )}
            {t("googleConnection")}
            {googleExpired ? (
              <span className="ml-0.5 inline-flex size-2 rounded-full bg-amber-500" />
            ) : null}
          </Link>
          <Link href="/admin/funnels/new" className={buttonVariants({ size: "md" })}>
            <Plus className="size-4" />
            {t("new")}
          </Link>
        </div>
      </div>

      {funnels.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {funnels.map((funnel) => (
            <li
              key={funnel.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{funnel.name}</span>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    {t("endingsCount", { count: funnel.endings.length })}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {funnel.locale.toUpperCase()}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      funnel.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600",
                    )}
                  >
                    {funnel.status === "PUBLISHED" ? t("statusPublished") : t("statusDraft")}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  /f/{funnel.slug} · {t("submissionsCount", { count: funnel._count.submissions })}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                {funnel.status === "PUBLISHED" ? (
                  <a
                    href={funnelPath(funnel.locale, funnel.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="size-4" />
                    {t("openFunnel")}
                  </a>
                ) : null}
                <Link
                  href={`/admin/funnels/${funnel.id}/submissions`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Inbox className="size-4" />
                  {t("openSubmissions")}
                </Link>
                <Link
                  href={`/admin/funnels/${funnel.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" />
                  {t("edit")}
                </Link>
                <FunnelDeleteButton id={funnel.id} name={funnel.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
