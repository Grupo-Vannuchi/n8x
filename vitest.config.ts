import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/** Resolve a path relative to this config file to an absolute fs path. */
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}", "src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
    coverage: {
      // `npm run test:cov`. Reporting only for now — no thresholds (kept
      // non-blocking; tighten once the base stabilises, per docs/TESTING.md).
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.d.ts", "src/messages/**"],
    },
  },
  resolve: {
    alias: [
      // Stub server-only / Next server modules so server-side modules (env,
      // rate-limit) can be imported in the jsdom test environment.
      { find: /^server-only$/, replacement: r("./test/stubs/empty.ts") },
      { find: /^next\/headers$/, replacement: r("./test/stubs/next-headers.ts") },
      // Path alias mirroring tsconfig's "@/*" → "src/*".
      { find: /^@\//, replacement: r("./src") + "/" },
    ],
  },
});
