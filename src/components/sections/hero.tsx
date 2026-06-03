import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { buttonVariants } from "@/components/ui/button";
import { yearsInBusiness } from "@/config/site";

export async function Hero() {
  const t = await getTranslations("home.hero");
  const rotating = t.raw("rotating") as string[];

  return (
    <section className="relative overflow-hidden">
      {/* Decorative brand gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[42rem] -translate-x-1/2 rounded-full bg-brand/15 blur-3xl"
      />
      <Container className="relative flex flex-col items-center gap-8 py-24 text-center sm:py-32">
        <Reveal as="span" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground">
          <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
          {t("eyebrow", { years: yearsInBusiness() })}
        </Reveal>

        <Reveal as="h1" delay={80} className="max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          {t("titleLead")}{" "}
          <span className="text-brand">
            {rotating.join(" · ")}
          </span>
        </Reveal>

        <Reveal as="p" delay={160} className="max-w-2xl text-pretty text-lg text-muted-foreground">
          {t("subtitle")}
        </Reveal>

        <Reveal delay={240} className="flex flex-col gap-3 sm:flex-row">
          <Link href="/contact" className={buttonVariants({ size: "lg", className: "group" })}>
            {t("primaryCta")}
            <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/portfolio"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            {t("secondaryCta")}
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
