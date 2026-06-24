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
 * Editorial hero with a carousel (NewForm + Giga direction, original palette).
 * A light "linen" canvas (theme-aware via `--hero-surface`): a statement column
 * on the left whose title/subtitle rotate, and a photograph framed in a rounded
 * tile on the right that crossfades through the slides — with a single surgical
 * amber accent. Autoplay (6s) pauses on hover/focus and is disabled under
 * reduced-motion; prev/next + dots; one real <h1> (the active slide), announced
 * politely for assistive tech.
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

  const go = useCallback((n: number) => setIndex((n + count) % count), [count]);

  // Autoplay (skipped when paused, single-slide, or reduced-motion is on).
  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), 6000);
    return () => window.clearInterval(id);
  }, [paused, count]);

  const slide = slides[index];

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.carousel}
      className="bg-[var(--hero-surface)] py-20 sm:py-28"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Container className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Statement column */}
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {eyebrow}
          </span>

          {/* Rotating statement. key={index} remounts it so the fade replays on
              every slide change. */}
          <div
            key={index}
            aria-live="polite"
            aria-atomic="true"
            className="hero-fade-in flex flex-col gap-6"
          >
            <h1 className="text-balance font-display text-4xl font-normal leading-[1.05] tracking-tight text-brand sm:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              {slide.subtitle}
            </p>
          </div>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className={buttonVariants({ size: "lg", className: "group" })}
            >
              {primaryCta}
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/portfolio"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              {secondaryCta}
            </Link>
          </div>

          {count > 1 ? (
            <div className="mt-4 flex items-center gap-5">
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => go(i)}
                    aria-label={labels.goTo[i]}
                    aria-current={i === index}
                    className={cn(
                      "h-2 rounded-full transition-all",
                      i === index
                        ? "w-8 bg-accent"
                        : "w-2 bg-foreground/25 hover:bg-foreground/40",
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => go(index - 1)}
                  aria-label={labels.prev}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={() => go(index + 1)}
                  aria-label={labels.next}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Photo tile — crossfades through the slide images. The soft amber
            block behind it is the one surgical accent. */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden
            className="absolute -bottom-5 -right-5 h-32 w-32 rounded-3xl bg-accent/15 sm:h-40 sm:w-40"
          />
          <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] ring-1 ring-foreground/10 sm:aspect-[5/6]">
            {slides.map((s, i) => (
              <Image
                key={i}
                src={s.image}
                alt=""
                fill
                priority={i === 0}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className={cn(
                  "object-cover transition-opacity duration-700 ease-out",
                  i === index ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
