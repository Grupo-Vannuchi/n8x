import { test, expect } from "@playwright/test";
import { E2E_FUNNEL_SLUG } from "../prisma/seed-e2e";

/**
 * A funnel is single-language by design: its `locale` is chosen at creation and
 * belongs to the funnel, not to the URL. Visitors whose device is set to
 * English are negotiated to `/en/...` by the locale proxy, so a Portuguese
 * funnel opened that way used to 404 — silently blocking every English-device
 * visitor from every funnel. The funnel must be served wherever it is reached,
 * in the language it was written in.
 */
test("a pt funnel reached under /en is served, not 404'd", async ({ page }) => {
  const response = await page.goto(`/en/f/${E2E_FUNNEL_SLUG}`);

  expect(response?.status()).toBe(200);
  // Rendered in the funnel's language, not the URL's: the placeholder and the
  // send button come from the pt catalog even though the URL says /en.
  await expect(page.getByPlaceholder("Digite sua resposta…")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar" })).toBeVisible();
});

test("the funnel still works on its own locale path", async ({ page }) => {
  const response = await page.goto(`/f/${E2E_FUNNEL_SLUG}`);

  expect(response?.status()).toBe(200);
  await expect(page.getByPlaceholder("Digite sua resposta…")).toBeVisible();
});

test("an unknown slug still 404s", async ({ page }) => {
  const response = await page.goto("/f/nao-existe-mesmo");
  expect(response?.status()).toBe(404);
});
