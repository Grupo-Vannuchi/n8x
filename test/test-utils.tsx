import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { Locale } from "@/i18n/routing";
import messages from "@/messages/pt.json";

/**
 * Render a component wrapped in the real next-intl provider (pt copy), so `t()`
 * returns the actual UI strings and assertions read like the interface. Never
 * mock next-intl — wrap with the real provider.
 */
export function renderWithIntl(
  ui: ReactElement,
  { locale = "pt", ...options }: { locale?: Locale } & Omit<RenderOptions, "wrapper"> = {},
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}

export * from "@testing-library/react";
export { userEvent };
