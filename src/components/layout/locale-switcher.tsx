"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * Switches locale while preserving the current pathname. Uses next-intl's
 * locale-aware router so the prefix is updated correctly.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("localeSwitcher");
  const active = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="group"
      aria-label={t("label")}
    >
      <Languages className="size-4 text-muted-foreground" aria-hidden />
      {locales.map((locale) => (
        <button
          key={locale}
          type="button"
          disabled={isPending || locale === active}
          onClick={() =>
            startTransition(() => router.replace(pathname, { locale }))
          }
          className={cn(
            "rounded px-1.5 py-0.5 text-sm font-medium uppercase transition-colors",
            locale === active
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-current={locale === active ? "true" : undefined}
        >
          {locale}
        </button>
      ))}
    </div>
  );
}
