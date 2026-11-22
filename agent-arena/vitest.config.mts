import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 60_000,
    // Every test file gets its own data dir; see tests/unit/setup.ts.
    setupFiles: ["tests/unit/setup.ts"],
    pool: "forks",
  },
});
