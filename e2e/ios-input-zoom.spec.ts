import { test, expect, devices, type Locator } from "@playwright/test";
import { E2E_FUNNEL_SLUG } from "../prisma/seed-e2e";

/**
 * iOS Safari — and every in-app WebView built on it (Instagram, WhatsApp) —
 * auto-zooms when a text-entry control with a computed font-size under 16px
 * takes focus. The page keeps its layout width while the visual viewport
 * shrinks, so whatever sits at the right edge (our send/submit button) is
 * pushed out of frame.
 *
 * The trigger is a pure CSS invariant, so that is what we guard here: at an
 * iPhone viewport, every control the visitor can type into must compute to at
 * least 16px. (Chromium doesn't reproduce Safari's zoom itself — asserting the
 * invariant is what keeps the regression from coming back.)
 */

const MIN_IOS_FONT_PX = 16;

test.use({ viewport: devices["iPhone 13"].viewport });

async function fontSizePx(locator: Locator): Promise<number> {
  const value = await locator.evaluate(
    (el) => getComputedStyle(el).fontSize,
  );
  return Number.parseFloat(value);
}

test("public form controls render at >= 16px so iOS doesn't zoom", async ({
  page,
}) => {
  await page.goto("/contact");

  const controls = [
    page.getByLabel("Nome"),
    page.getByLabel("E-mail"),
    page.getByLabel("Mensagem"),
  ];

  for (const control of controls) {
    expect(await fontSizePx(control)).toBeGreaterThanOrEqual(MIN_IOS_FONT_PX);
  }
});

test("funnel answer input renders at >= 16px so iOS doesn't zoom", async ({
  page,
}) => {
  await page.goto(`/f/${E2E_FUNNEL_SLUG}`);

  const answer = page.getByPlaceholder("Digite sua resposta…");
  await expect(answer).toBeVisible();
  expect(await fontSizePx(answer)).toBeGreaterThanOrEqual(MIN_IOS_FONT_PX);
});
