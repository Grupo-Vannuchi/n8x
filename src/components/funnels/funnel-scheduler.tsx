"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getFunnelSlots,
  type FunnelSlotsResult,
} from "@/app/actions/funnels-public";
import type { MeetingSlot } from "@/lib/google-calendar";

export function FunnelScheduler({
  funnelId,
  endingKey,
  retryNotice,
  onConfirm,
  onUnavailable,
}: {
  funnelId: string;
  endingKey: string;
  retryNotice: boolean;
  onConfirm: (startISO: string) => void;
  onUnavailable: () => void;
}) {
  const t = useTranslations("funnel");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [selected, setSelected] = useState<MeetingSlot | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [dayOpen, setDayOpen] = useState(false);

  useEffect(() => {
    let active = true;
    getFunnelSlots(funnelId, locale, endingKey).then((res: FunnelSlotsResult) => {
      if (!active) return;
      setLoading(false);
      if (!res.configured || res.slots.length === 0) {
        onUnavailable();
        return;
      }
      setSlots(res.slots);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funnelId, locale]);

  // One "page" per day: [dayLabel, slots-for-that-day][].
  const byDay = useMemo(() => {
    const map = new Map<string, MeetingSlot[]>();
    for (const s of slots) {
      const list = map.get(s.dayLabel);
      if (list) list.push(s);
      else map.set(s.dayLabel, [s]);
    }
    return Array.from(map.entries());
  }, [slots]);

  if (loading) {
    return (
      <div className="mt-4 self-stretch rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {t("loadingSlots")}
      </div>
    );
  }

  if (byDay.length === 0) return null;

  // Clamp in case a re-fetch (retry) dropped the day we were on.
  const page = Math.min(dayIndex, byDay.length - 1);
  const [currentDayLabel, currentSlots] = byDay[page];

  function goToDay(i: number) {
    setDayIndex(i);
    setDayOpen(false);
  }

  return (
    <div className="mt-4 self-stretch rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-bold">{t("scheduleTitle")}</h2>
      {retryNotice ? (
        <p className="mt-2 text-sm text-amber-600">{t("slotTaken")}</p>
      ) : null}

      {/* Day pager: ◀  [custom dropdown]  ▶ */}
      <div className="relative mt-4 flex items-center gap-2">
        <button
          type="button"
          aria-label={t("prevDay")}
          disabled={page === 0}
          onClick={() => goToDay(page - 1)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-brand hover:bg-brand/5 hover:text-brand disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setDayOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={dayOpen}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-2.5 text-sm font-semibold capitalize transition-colors",
              dayOpen
                ? "border-brand bg-brand/5 text-brand"
                : "border-brand/30 bg-brand/5 text-foreground hover:border-brand",
            )}
          >
            {currentDayLabel}
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-brand transition-transform",
                dayOpen && "rotate-180",
              )}
            />
          </button>

          {dayOpen ? (
            <>
              {/* Click-away backdrop */}
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                onClick={() => setDayOpen(false)}
                className="fixed inset-0 z-10 cursor-default"
              />
              <ul
                role="listbox"
                className="absolute left-1/2 top-full z-20 mt-2 max-h-64 w-full min-w-44 -translate-x-1/2 overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-xl"
              >
                {byDay.map(([day], i) => (
                  <li key={day}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === page}
                      onClick={() => goToDay(i)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm capitalize transition-colors",
                        i === page
                          ? "bg-brand/10 font-semibold text-brand"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      {day}
                      {i === page ? <Check className="size-4 shrink-0" /> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </div>

        <button
          type="button"
          aria-label={t("nextDay")}
          disabled={page === byDay.length - 1}
          onClick={() => goToDay(page + 1)}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:border-brand hover:bg-brand/5 hover:text-brand disabled:opacity-30 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Times for the selected day */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {currentSlots.map((s) => (
          <button
            key={s.startISO}
            type="button"
            onClick={() => setSelected(s)}
            className={cn(
              "rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors",
              selected?.startISO === s.startISO
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border bg-background hover:border-brand",
            )}
          >
            {s.timeLabel}
          </button>
        ))}
      </div>

      {selected ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <span className="capitalize">{selected.dayLabel}</span> ·{" "}
          {selected.timeLabel}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!selected}
        onClick={() => selected && onConfirm(selected.startISO)}
        className="mt-3 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-opacity disabled:opacity-50"
      >
        {t("confirmSlot")}
      </button>
    </div>
  );
}
