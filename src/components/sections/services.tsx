import { getTranslations } from "next-intl/server";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { getServices } from "@/lib/queries";
import type { Locale } from "@/i18n/routing";

export async function Services({ locale }: { locale: Locale }) {
  const t = await getTranslations("home.services");
  const services = await getServices(locale);

  if (services.length === 0) return null;

  return (
    <Section id="services" className="bg-muted/30">
      <SectionHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        className="mx-auto"
      />
      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service, i) => (
          <Reveal
            as="li"
            key={service.id}
            delay={(i % 3) * 90}
            className="group flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg"
          >
            <span className="inline-flex size-12 items-center justify-center rounded-lg bg-brand/10 text-brand transition-transform duration-300 group-hover:scale-110">
              <Icon name={service.icon} className="size-6" />
            </span>
            <h3 className="text-lg font-semibold">{service.title}</h3>
            <p className="text-sm text-muted-foreground">
              {service.description}
            </p>
          </Reveal>
        ))}
      </ul>
    </Section>
  );
}
