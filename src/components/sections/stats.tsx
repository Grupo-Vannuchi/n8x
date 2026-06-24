import { getTranslations } from "next-intl/server";
import { CountUp } from "@/components/ui/count-up";
import { getStats } from "@/lib/queries";
import type { Locale } from "@/i18n/routing";

type StatView = Awaited<ReturnType<typeof getStats>>[number];

/** One copy of the stats row. Rendered twice to feed the seamless marquee. */
function StatRow({ stats, clone = false }: { stats: StatView[]; clone?: boolean }) {
  return (
    <dl
      aria-hidden={clone || undefined}
      className={clone ? "marquee-clone flex shrink-0" : "flex shrink-0"}
    >
      {stats.map((stat, i) => (
        <div
          key={`${stat.id}-${i}`}
          className="flex shrink-0 flex-col items-center gap-1 px-10 text-center sm:px-14"
        >
          <dd className="font-display text-4xl font-normal tracking-tight sm:text-5xl">
            <CountUp value={stat.value} suffix={stat.suffix} />
          </dd>
          <dt className="whitespace-nowrap text-sm font-medium opacity-80">
            {stat.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

export async function Stats({ locale }: { locale: Locale }) {
  const t = await getTranslations("home.stats");
  const stats = await getStats(locale);

  if (stats.length === 0) return null;

  // Repeat until one copy is wide enough to fill wide screens, so the seamless
  // loop never shows a gap (same approach as the clients marquee).
  const repeats = Math.max(1, Math.ceil(8 / stats.length));
  const row = Array.from({ length: repeats }, () => stats).flat();

  return (
    <section className="bg-brand py-16 text-brand-foreground">
      <h2 className="sr-only">{t("title")}</h2>

      {/* Full-bleed marquee with faded edges — appears (counting up) then keeps
          scrolling. Reduced-motion wraps it into a static centered row. */}
      <div className="marquee group relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]">
        <div className="marquee-track flex w-max">
          <StatRow stats={row} />
          <StatRow stats={row} clone />
        </div>
      </div>
    </section>
  );
}
