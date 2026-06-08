import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import logoMark from "../../../public/n8x-logo.png";

/**
 * Brand logo. Renders the `n8x-logo.png` mark (which already contains the
 * wordmark), linking home. The mark is sized in `em` so callers can scale it
 * with the usual text-size utilities (`text-lg`, `text-xl`, …); `rounded-lg`
 * clips the image's square corners so they don't show on dark backgrounds.
 *
 * It's the only place the mark is rendered — swap `logoMark` to re-brand.
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
        className="h-[2em] w-auto rounded-lg"
        priority
      />
    </Link>
  );
}
