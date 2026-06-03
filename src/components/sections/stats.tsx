import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { CountUp } from "@/components/ui/count-up";
import { Reveal } from "@/components/ui/reveal";
import { getStats } from "@/lib/queries";
import type { Locale } from "@/i18n/routing";

export async function Stats({ locale }: { locale: Locale }) {
  const t = await getTranslations("home.stats");
  const stats = await getStats(locale);

  if (stats.length === 0) return null;

  return (
    <section className="bg-brand text-brand-foreground">
      <Container className="py-16">
        <h2 className="sr-only">{t("title")}</h2>
        <dl className="grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Reveal key={stat.id} delay={(i % 4) * 100} className="flex flex-col gap-1">
              <dd className="text-4xl font-bold tracking-tight sm:text-5xl">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="text-sm font-medium opacity-80">{stat.label}</dt>
            </Reveal>
          ))}
        </dl>
      </Container>
    </section>
  );
}
