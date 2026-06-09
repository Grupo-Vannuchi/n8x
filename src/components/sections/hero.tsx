import { getTranslations } from "next-intl/server";
import { yearsInBusiness } from "@/config/site";
import { HeroCarousel, type HeroSlide } from "@/components/sections/hero-carousel";

/**
 * Background images for the hero carousel — generic marketing/office stock from
 * Unsplash (host allowlisted in next.config). One per slide, matched by index to
 * the localized copy in `home.hero.slides`.
 */
const slideImages = [
  // Marketing team meeting
  "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1920&q=70",
  // Modern office interior
  "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1920&q=70",
  // Marketing analytics / data
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=70",
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
