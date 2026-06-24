import { seedE2EFunnel } from "../prisma/seed-e2e";

/** Playwright global setup — seed the E2E funnel before the suite runs. */
export default async function globalSetup() {
  await seedE2EFunnel();
}
