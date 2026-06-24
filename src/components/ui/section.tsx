import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

/** A vertically-padded page section with an optional anchor id. */
export function Section({
  id,
  className,
  containerClassName,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-24 py-20 sm:py-section", className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

/** Standard eyebrow / title / subtitle header used at the top of sections. */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start",
        className,
      )}
    >
      {eyebrow ? (
        align === "left" ? (
          <span className="inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            <span className="h-px w-8 bg-accent" aria-hidden />
            {eyebrow}
          </span>
        ) : (
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </span>
        )
      ) : null}
      <h2 className="max-w-2xl text-balance font-display text-3xl font-normal tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
}
