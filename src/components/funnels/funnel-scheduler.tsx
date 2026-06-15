"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  getFunnelSlots,
  type FunnelSlotsResult,
} from "@/app/actions/funnels-public";
import type { MeetingSlot } from "@/lib/google-calendar";

export function FunnelScheduler({
  funnelId,
  retryNotice,
  onConfirm,
  onUnavailable,
}: {
  funnelId: string;
  retryNotice: boolean;
  onConfirm: (startISO: string) => void;
  onUnavailable: () => void;
}) {
  const t = useTranslations("funnel");
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getFunnelSlots(funnelId, locale).then((res: FunnelSlotsResult) => {
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

  if (slots.length === 0) return null;

  return (
    <div className="mt-4 self-stretch rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-bold">{t("scheduleTitle")}</h2>
      {retryNotice ? (
        <p className="mt-2 text-sm text-amber-600">{t("slotTaken")}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-4">
        {byDay.map(([day, daySlots]) => (
          <div key={day}>
            <p className="mb-2 text-sm font-medium capitalize text-muted-foreground">
              {day}
            </p>
            <div className="flex flex-wrap gap-2">
              {daySlots.map((s) => (
                <button
                  key={s.startISO}
                  type="button"
                  onClick={() => setSelected(s.startISO)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    selected === s.startISO
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border bg-background hover:border-brand",
                  )}
                >
                  {s.timeLabel}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        disabled={!selected}
        onClick={() => selected && onConfirm(selected)}
        className="mt-5 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-brand-foreground transition-opacity disabled:opacity-50"
      >
        {t("confirmSlot")}
      </button>
    </div>
  );
}
