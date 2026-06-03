import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Text wordmark built from `siteConfig.name`. Swap this for an <Image> logo when
 * re-branding — it's the only place the mark is rendered.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "text-lg font-extrabold tracking-tight lowercase",
        className,
      )}
      aria-label={siteConfig.name}
    >
      {siteConfig.name.split(" ")[0]}
      <span className="text-brand">.</span>
    </Link>
  );
}
