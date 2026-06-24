import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. Local-first: runs the app via `npm run dev` (reusing a running
 * server if there is one) against the local DB, seeds an E2E funnel in global
 * setup, and runs the specs in `e2e/`. CI wiring (separate job) comes later.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "html" : "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    // The funnel/content is seeded in pt; force the browser locale so next-intl
    // serves Portuguese (default, unprefixed) instead of redirecting to /en.
    locale: "pt-BR",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
