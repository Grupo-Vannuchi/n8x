import { getTranslations } from "next-intl/server";
import { yearsInBusiness } from "@/config/site";
import { HeroCarousel, type HeroSlide } from "@/components/sections/hero-carousel";

/**
 * Hero carousel background images — self-hosted under `/public/hero` so
 * `next/image` serves optimized AVIF/WebP from the SAME origin (faster LCP than
 * fetching from a remote host). One per slide, matched by index to the localized
 * copy in `home.hero.slides`. The brand plate opens, then our own office photography.
 */
const slideImages = [
  "/hero/slide-1.webp", // n8x brand plate (LCP — flat art, compresses tiny)
  "/hero/slide-2.webp", // the team at work in the open office
  "/hero/slide-3.webp", // strategy session around the meeting table
];

export async function Hero() {
  const t = await getTranslations("home.hero");
  const copy = t.raw("slides") as { title: string; subtitle: string }[];

  const slides: HeroSlide[] = copy.map((slide, i) => ({
    ...slide,
    image: slideImages[i % slideImages.length],
  }));

  return (
    <HeroCarousel
      slides={slides}
      eyebrow={t("eyebrow", { years: yearsInBusiness() })}
      primaryCta={t("primaryCta")}
      secondaryCta={t("secondaryCta")}
      labels={{
        carousel: t("carouselLabel"),
        prev: t("prevSlide"),
        next: t("nextSlide"),
        goTo: slides.map((_, i) => t("goToSlide", { n: i + 1 })),
      }}
    />
  );
}
