"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Lazily mounts the Google Maps embed only when the footer scrolls near the
 * viewport (IntersectionObserver, 300px margin). The interactive `output=embed`
 * iframe pulls ~270ms of Maps JS main-thread work; native `loading="lazy"` still
 * loaded it during the initial-load window on desktop (its preload margin is
 * large enough to reach the footer), which tanked TBT. Deferring the mount until
 * the user actually approaches the footer keeps that cost off the critical path
 * and out of the performance trace — same Google map, no click, no API key.
 */
export function MapEmbed({ src, title }: { src: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setShow(true);
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [show]);

  return (
    <div
      ref={ref}
      className="h-64 w-full overflow-hidden rounded-2xl border border-border bg-muted/40"
    >
      {show ? (
        <iframe
          title={title}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          className="h-full w-full"
        />
      ) : null}
    </div>
  );
}
