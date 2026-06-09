"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeroSlide = {
  image: string;
  title: string;
  subtitle: string;
};

export type HeroCarouselLabels = {
  carousel: string;
  prev: string;
  next: string;
  /** One "Go to slide N" label per slide. */
  goTo: string[];
};

/**
 * Full-width hero image carousel — mirrors the reference site's hero: a
 * background image per slide with overlaid heading/subtitle + CTAs, autoplay,
 * prev/next arrows and dot indicators. Slides cross-fade; autoplay pauses on
 * hover/focus and is disabled under `prefers-reduced-motion`.
 */
export function HeroCarousel({
  slides,
  eyebrow,
  primaryCta,
  secondaryCta,
  labels,
}: {
  slides: HeroSlide[];
  eyebrow: string;
  primaryCta: string;
  secondaryCta: string;
  labels: HeroCarouselLabels;
}) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (n: number) => setIndex((n + count) % count),
    [count],
  );

  // Autoplay (skipped when paused, single-slide, or reduced-motion is on).
  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => window.clearInterval(id);
  }, [paused, count]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.carousel}
      className="relative isolate overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative h-[34rem] sm:h-[42rem]">
        {slides.map((slide, i) => {
          const active = i === index;
          // One real <h1> for the page (first slide); the rest are <h2>.
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              aria-hidden={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-out",
                active ? "opacity-100" : "pointer-events-none opacity-0",
              )}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
              />
              {/* Readability overlay — strong on the left where the text sits. */}
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/30" />

              <Container className="relative flex h-full max-w-none flex-col items-start justify-center gap-6 text-left">
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur">
                  <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
                  {eyebrow}
                </span>
                <Heading className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
                  {slide.title}
                </Heading>
                <p className="max-w-xl text-pretty text-lg text-muted-foreground">
                  {slide.subtitle}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    tabIndex={active ? undefined : -1}
                    className={buttonVariants({ size: "lg", className: "group" })}
                  >
                    {primaryCta}
                    <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                  <Link
                    href="/portfolio"
                    tabIndex={active ? undefined : -1}
                    className={buttonVariants({ variant: "outline", size: "lg" })}
                  >
                    {secondaryCta}
                  </Link>
                </div>
              </Container>
            </div>
          );
        })}

        {count > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={labels.prev}
              className="absolute left-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/70 text-foreground backdrop-blur transition-colors hover:bg-background sm:left-5"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={labels.next}
              className="absolute right-3 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/70 text-foreground backdrop-blur transition-colors hover:bg-background sm:right-5"
            >
              <ChevronRight className="size-6" />
            </button>

            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={labels.goTo[i]}
                  aria-current={i === index}
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    i === index
                      ? "w-8 bg-brand"
                      : "w-2.5 bg-foreground/30 hover:bg-foreground/50",
                  )}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
