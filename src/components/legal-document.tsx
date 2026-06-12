import { Fragment } from "react";
import type { LegalDoc } from "@/content/legal";
import { PageHeader } from "@/components/page-header";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

/** Render a paragraph, turning `**…**` spans into bold (used for company data). */
function renderText(text: string) {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** Renders a Terms/Privacy document: title band + intro + numbered sections. */
export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <PageHeader title={doc.title} subtitle={doc.updated} />

      <Section>
        <article className="mx-auto max-w-3xl">
          <div className="flex flex-col gap-4">
            {doc.intro.map((p, i) => (
              <p
                key={i}
                className="text-pretty text-lg leading-relaxed text-muted-foreground"
              >
                {renderText(p)}
              </p>
            ))}
          </div>

          <div className="mt-12 flex flex-col gap-10">
            {doc.sections.map((section) => (
              <Reveal as="section" key={section.heading}>
                <h2 className="text-xl font-bold sm:text-2xl">
                  {section.heading}
                </h2>
                <div className="mt-4 flex flex-col gap-3">
                  {section.body.map((p, i) => (
                    <p
                      key={i}
                      className="text-pretty leading-relaxed text-muted-foreground"
                    >
                      {renderText(p)}
                    </p>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </article>
      </Section>
    </>
  );
}
