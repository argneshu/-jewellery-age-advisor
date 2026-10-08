import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    coverage: {
      // Epic 10: coverage is measured on pure business-logic modules only
      // (no jsdom/component harness, so React hooks `lib/use-*.ts` are excluded and verified manually/QA — see docs/architecture/design/03-patterns-and-standards-brownfield.md §E10.9).
      provider: "v8",
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.test.ts", "lib/utils.ts", "lib/use-*.ts", "lib/supabase/client.ts", "lib/supabase/server.ts"],
      reporter: ["text", "text-summary"],
    },
  },
});
