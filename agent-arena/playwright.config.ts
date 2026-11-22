import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

// End-to-end tests run a production build on its own port with a throwaway
// data folder, so they never touch your real experiment history.
const dataDir = path.join(os.tmpdir(), `arena-e2e-${Date.now()}`);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:6710", trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@responsive/ },
  ],
  webServer: {
    command: "pnpm exec next start -p 6710",
    url: "http://localhost:6710",
    reuseExistingServer: false,
    timeout: 60_000,
    env: { ARENA_DATA_DIR: dataDir, ARENA_DEV_FIXTURES: "1" },
  },
});
