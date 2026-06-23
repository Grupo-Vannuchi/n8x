"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type SubmissionsQuestion = {
  key: string;
  prompt: string;
  answers: string[];
};

const selectStyles =
  "h-9 max-w-full rounded-lg border border-border bg-background px-3 text-sm";

/**
 * Dynamic submissions filter: pick a question, then pick one of the answers
 * that actually occurred for it. Both live in the URL (?q=&a=) so the server
 * filters and the CSV export honors the same selection.
 */
export function SubmissionsFilter({
  questions,
  selectedQuestion,
  selectedAnswer,
}: {
  questions: SubmissionsQuestion[];
  selectedQuestion: string | null;
  selectedAnswer: string | null;
}) {
  const t = useTranslations("admin.funnels");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const current = questions.find((q) => q.key === selectedQuestion) ?? null;

  function update(changes: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams?.toString() ?? "");
    for (const [k, v] of Object.entries(changes)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  if (questions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label={t("filterByQuestion")}
        className={cn(selectStyles)}
        value={selectedQuestion ?? ""}
        onChange={(e) => update({ q: e.target.value || null, a: null })}
      >
        <option value="">{t("filterByQuestion")}</option>
        {questions.map((q) => (
          <option key={q.key} value={q.key}>
            {q.prompt}
          </option>
        ))}
      </select>

      {current ? (
        <select
          aria-label={t("filterByAnswer")}
          className={cn(selectStyles)}
          value={selectedAnswer ?? ""}
          onChange={(e) => update({ a: e.target.value || null })}
        >
          <option value="">{t("filterByAnswer")}</option>
          {current.answers.map((ans) => (
            <option key={ans} value={ans}>
              {ans}
            </option>
          ))}
        </select>
      ) : null}

      {selectedQuestion ? (
        <button
          type="button"
          onClick={() => update({ q: null, a: null })}
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("filterClear")}
        </button>
      ) : null}
    </div>
  );
}
