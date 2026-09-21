import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.pw.ts",
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    channel: "chrome",
    headless: true,
  },
  webServer: {
    command: "node --import ./tests/fixtures/supabase-preload.mjs ./node_modules/next/dist/bin/next start -p 3100",
    url: "http://127.0.0.1:3100/ai-guide",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
