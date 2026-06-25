"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

/**
 * Facade for the Google Maps embed. The interactive `output=embed` iframe pulls
 * the full Maps JS API (~250 KiB of mostly-unused JS + many long tasks), which
 * tanked desktop TBT once it loaded during the trace. Render a lightweight,
 * zero-network placeholder instead and only mount the real iframe on click —
 * the recommended "import on interaction" pattern for heavy third-party embeds.
 */
export function MapEmbed({
  src,
  title,
  label,
}: {
  src: string;
  title: string;
  label: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="h-64 w-full rounded-2xl border border-border"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={label}
      className="flex h-64 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      <MapPin className="size-7" aria-hidden />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
