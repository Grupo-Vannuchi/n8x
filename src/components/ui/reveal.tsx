"use client";

import { useEffect, useRef, useState, type ElementType, type Ref } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveals its children with a fade + slide-up the first time they scroll into
 * view (the actual motion lives in globals.css, keyed off the `data-reveal` /
 * `data-visible` attributes, and is disabled for reduced-motion users).
 *
 * - `delay` (ms) staggers siblings in a grid, e.g. `delay={i * 80}`.
 * - `variant="fade"` skips the vertical movement (fade only).
 * - `as` renders a different element so it can be a grid `<li>` directly.
 */
export function Reveal({
  as,
  delay = 0,
  variant = "up",
  className,
  children,
}: {
  as?: ElementType;
  delay?: number;
  variant?: "up" | "fade";
  className?: string;
  children: React.ReactNode;
}) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (very old browser): reveal immediately so content
    // is never stuck hidden. One-shot fallback, not a render loop.
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as Ref<HTMLElement>}
      data-reveal={variant}
      data-visible={visible ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(className)}
    >
      {children}
    </Tag>
  );
}
