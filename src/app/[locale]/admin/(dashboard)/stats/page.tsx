import { getTranslations, setRequestLocale } from "next-intl/server";
import { Plus, Pencil } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { StatDeleteButton } from "@/components/admin/stat-delete-button";
import { getAdminStats } from "@/lib/admin-queries";
import { localize } from "@/lib/content";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export default async function AdminStatsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = resolveLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.stats");
  const stats = await getAdminStats();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <Link href="/admin/stats/new" className={buttonVariants({ size: "md" })}>
          <Plus className="size-4" />
          {t("new")}
        </Link>
      </div>

      {stats.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {stats.map((stat) => (
            <li
              key={stat.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 px-3 text-sm font-bold text-brand tabular-nums">
                  {stat.value.toLocaleString()}
                  {stat.suffix}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {localize(stat.label, locale)}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        stat.published
                          ? "bg-emerald-500/10 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {stat.published ? t("statusPublished") : t("statusDraft")}
                    </span>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {stat.key}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <Link
                  href={`/admin/stats/${stat.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="size-4" />
                  {t("edit")}
                </Link>
                <StatDeleteButton
                  id={stat.id}
                  title={localize(stat.label, locale)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
