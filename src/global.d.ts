import type { routing } from "@/i18n/routing";
import type messages from "@/messages/pt.json";

/**
 * Augments next-intl with our app config so that locales and message keys are
 * fully type-checked (`useTranslations`, `getTranslations`, `<Link href>`).
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
