import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        // Next.js route entry points are thin framework glue, verified by `pnpm build`.
        "src/app/**",
      ],
      reporter: ["text", "html", "lcov", "json-summary"],
      // Ratchet: set just below current coverage. Raise these when coverage improves; never lower them.
      thresholds: { statements: 83, branches: 78, functions: 79, lines: 83 },
    },
  },
});
