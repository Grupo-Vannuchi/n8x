import { test, expect } from "@playwright/test";
import { E2E_FUNNEL_SLUG } from "../prisma/seed-e2e";

test("completes the seeded MESSAGE funnel end to end", async ({ page }) => {
  await page.goto(`/f/${E2E_FUNNEL_SLUG}`);

  // Default block: a bot line, then the name capture.
  await page.getByPlaceholder("Digite sua resposta…").fill("Maria E2E");
  await page.getByRole("button", { name: "Enviar" }).click();

  // The custom question and its options.
  await page.getByRole("button", { name: "Sim" }).click();

  // The MESSAGE ending's completion screen.
  await expect(
    page.getByRole("heading", { name: "Tudo certo! 🎉" }),
  ).toBeVisible();
});
