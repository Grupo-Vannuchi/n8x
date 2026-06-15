import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getFunnelById, getFunnelSubmissions } from "@/lib/admin-queries";
import { resolveLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type Answer = { questionId: string; prompt: string; answer: string };

export default async function FunnelSubmissionsPage({
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

  const submissions = await getFunnelSubmissions(id);
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });

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
          {t("submissionsTitle", { name: funnel.name })}
        </h1>
      </div>

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
                      <span className="text-sm text-muted-foreground">
                        · {s.role}
                      </span>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    {t(`outcome_${s.outcome}`)}
                  </span>
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
