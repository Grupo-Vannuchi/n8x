import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import logoMark from "../../../public/n8x-logo.png";
import logoMarkDark from "../../../public/n8x-logo-dark.png";

/**
 * Brand logo. Renders the brand mark (which already contains the wordmark),
 * linking home. Two variants are shipped and toggled by colour scheme:
 *
 * - Light mode: `n8x-logo.png` — the mark on its navy field; `rounded-lg`
 *   clips the square corners so they don't show on light backgrounds.
 * - Dark mode: `n8x-logo-dark.png` — a transparent cut-out that blends into
 *   the dark page background.
 *
 * The mark is sized in `em` so callers can scale it with the usual text-size
 * utilities (`text-lg`, `text-xl`, …). It's the only place the mark is
 * rendered — swap the imports to re-brand.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center text-lg", className)}
      aria-label={siteConfig.name}
    >
      <Image
        src={logoMark}
        alt={siteConfig.name}
        className="h-[2em] w-auto rounded-lg dark:hidden"
        priority
      />
      <Image
        src={logoMarkDark}
        alt={siteConfig.name}
        className="hidden h-[2em] w-auto dark:block"
        priority
      />
    </Link>
  );
}
