import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Icon } from "@/components/ui/icon";
import type { InformationView } from "@/lib/queries";

/**
 * Information catalog card: a thematic cover image with the topic icon badged on
 * it, the title and description below, and a "Ver" call-to-action. The whole card
 * links to the detail page (the reference site behaves the same way). `viewLabel`
 * is passed in already localized so this stays a server component.
 */
export function InformationCard({
  information,
  viewLabel,
}: {
  information: InformationView;
  viewLabel: string;
}) {
  return (
    <Link
      href={`/informations/${information.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg focus-visible:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-brand/10">
        {information.image ? (
          <Image
            src={information.image}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
        <span className="absolute left-3 top-3 inline-flex size-9 items-center justify-center rounded-lg bg-background/85 text-brand backdrop-blur">
          <Icon name={information.icon} className="size-5" />
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="text-balance text-lg font-semibold">{information.title}</h3>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {information.description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-brand">
          {viewLabel}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
