import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getFunnelById, getFunnelSubmissions } from "@/lib/admin-queries";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Answer = { questionId: string; prompt: string; answer: string };

const OUTCOMES = [
  "COMPLETED",
  "MEETING_BOOKED",
  "BONUS_DOWNLOADED",
  "MESSAGE_SENT",
] as const;

export default async function FunnelSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ outcome?: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("admin.funnels");

  const funnel = await getFunnelById(id);
  if (!funnel) notFound();

  const all = await getFunnelSubmissions(id);
  const { outcome } = await searchParams;

  // Count per outcome → only show chips for outcomes that actually occur.
  const counts = new Map<string, number>();
  for (const s of all) counts.set(s.outcome, (counts.get(s.outcome) ?? 0) + 1);
  const activeOutcome = outcome && counts.has(outcome) ? outcome : null;
  const submissions = activeOutcome
    ? all.filter((s) => s.outcome === activeOutcome)
    : all;

  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });

  const base = `/admin/funnels/${id}/submissions`;
  const exportHref = `/api/admin/funnels/${id}/export${activeOutcome ? `?outcome=${activeOutcome}` : ""}`;

  const chip = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1 text-sm font-medium transition-colors",
      active
        ? "bg-brand text-brand-foreground"
        : "bg-muted text-muted-foreground hover:text-foreground",
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {t("submissionsTitle", { name: funnel.name })}
          </h1>
          {all.length > 0 ? (
            // CSV export is an API route (not a page) — a plain anchor is correct.
            <a
              href={exportHref}
              className={cn(buttonVariants({ variant: "outline", size: "md" }))}
            >
              <Download className="size-4" />
              {t("exportCsv")}
            </a>
          ) : null}
        </div>
      </div>

      {all.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          <Link href={base} className={chip(!activeOutcome)}>
            {t("filterAll")} ({all.length})
          </Link>
          {OUTCOMES.filter((o) => counts.has(o)).map((o) => (
            <Link
              key={o}
              href={`${base}?outcome=${o}`}
              className={chip(activeOutcome === o)}
            >
              {t(`outcome_${o}`)} ({counts.get(o)})
            </Link>
          ))}
        </div>
      ) : null}

      {submissions.length === 0 ? (
        <p className="text-muted-foreground">{t("submissionsEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {submissions.map((s) => {
            const answers = (Array.isArray(s.answers) ? s.answers : []) as Answer[];
            return (
              <li
                key={s.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{s.name}</span>
                    {s.role ? (
                      <span className="text-sm text-muted-foreground">· {s.role}</span>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {s.endingName ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {s.endingName}
                      </span>
                    ) : null}
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                      {t(`outcome_${s.outcome}`)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                  {s.phone ? (
                    <span>
                      {t("field_phone")}: {s.phone}
                    </span>
                  ) : null}
                  {s.email ? (
                    <span>
                      {t("field_email")}: {s.email}
                    </span>
                  ) : null}
                </div>

                {answers.length > 0 ? (
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t("answersLabel")}
                    </p>
                    <dl className="flex flex-col gap-2">
                      {answers.map((a, i) => (
                        <div key={i}>
                          <dt className="text-xs text-muted-foreground">{a.prompt}</dt>
                          <dd className="text-sm font-medium">{a.answer}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ) : null}

                {s.meetingStartAt ? (
                  <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <CalendarClock className="size-4" />
                    {t("meetingAtLabel")}: {dateFmt.format(s.meetingStartAt)}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                  <span>
                    {t("receivedAt")}: {dateFmt.format(s.createdAt)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-medium",
                      s.whatsappStatus === "SENT"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : s.whatsappStatus === "FAILED"
                          ? "bg-red-500/10 text-red-600"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {t(`wa_${s.whatsappStatus}`)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
