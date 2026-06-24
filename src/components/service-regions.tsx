"use client";

import { useState } from "react";
import { serviceRegions } from "@/config/regions";
import { cn } from "@/lib/utils";

/**
 * Service-area widget shown on each information detail page, matching the
 * reference layout: a horizontal row of region tabs (first one active by
 * default) with the selected region's cities listed below as bullets. Tabs —
 * only one region's cities are visible at a time. The heading is passed in
 * already localized so this stays self-contained.
 */
export function ServiceRegions({ heading }: { heading: string }) {
  const [active, setActive] = useState(0);
  const region = serviceRegions[active];

  return (
    <section className="mt-16">
      <h2 className="font-display text-2xl font-normal tracking-tight sm:text-3xl">{heading}</h2>

      <div
        role="tablist"
        aria-label={heading}
        className="mt-6 flex flex-wrap gap-2"
      >
        {serviceRegions.map((r, i) => (
          <button
            key={r.name}
            type="button"
            role="tab"
            id={`region-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`region-panel-${i}`}
            onClick={() => setActive(i)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              i === active
                ? "border-brand bg-brand text-brand-foreground"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`region-panel-${active}`}
        aria-labelledby={`region-tab-${active}`}
        className="mt-6 rounded-xl border border-border bg-card p-6"
      >
        <ul className="grid list-disc grid-cols-2 gap-x-8 gap-y-1.5 pl-5 text-sm text-muted-foreground sm:grid-cols-3 lg:grid-cols-4">
          {region.cities.map((city) => (
            <li key={city}>{city}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
