import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a REAL stack: the ERP backend (with the Rosaya demo catalogue seeded and STORE_MOCK_PAYMENTS=1) and this
 * storefront. Start them first (see README), then `npm run test:e2e`. PLAYWRIGHT_CHROMIUM=/path/to/chromium uses a system browser.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
