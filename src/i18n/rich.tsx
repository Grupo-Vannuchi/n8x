import type { ReactNode } from "react";

/**
 * Default rich-text tags for translated strings.
 *
 * next-intl v4 removed the provider-level `defaultTranslationValues`, so instead
 * of registering tags globally we share them here and spread them into each
 * `t.rich(...)` call. Works the same in Server and Client Components.
 *
 * In a message catalog (pt.json / en.json):
 *   "lead": "Transformamos marcas com <b>estratégia</b> e <i>performance</i>."
 *
 * In a component:
 *   t.rich("lead", richTags)
 *   // with extra values:
 *   t.rich("subtitle", { ...richTags, foundedYear })
 */
export const richTags = {
  /** Bold / negrito */
  b: (chunks: ReactNode) => <strong className="font-semibold">{chunks}</strong>,
  /** Italic / itálico */
  i: (chunks: ReactNode) => <em className="italic">{chunks}</em>,
} as const;
