import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

/** Title band shown at the top of inner pages (portfolio, contact, etc.). */
export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-border bg-muted/30">
      <Container className="py-16 sm:py-20">
        <Reveal as="h1" className="max-w-3xl text-balance font-display text-4xl font-normal tracking-tight sm:text-5xl">
          {title}
        </Reveal>
        {subtitle ? (
          <Reveal as="p" delay={100} className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            {subtitle}
          </Reveal>
        ) : null}
      </Container>
    </div>
  );
}
