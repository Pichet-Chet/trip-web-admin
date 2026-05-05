import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration for trip-web-admin.
 *
 * Tests mock the backend API with page.route() so they run without
 * a live trip-api instance. The Next.js dev server is started
 * automatically by `webServer` when running `npx playwright test`.
 *
 * To run locally:
 *   npx playwright install chromium   # first time only
 *   npx playwright test               # run all specs
 *   npx playwright test --ui          # interactive UI mode
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    // Inject a fake auth token so routes that check for a cookie/header
    // pass without hitting the real API. Tests that test auth flows
    // clear this via page.context().clearCookies().
    extraHTTPHeaders: {
      "x-playwright-test": "1",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_API_URL: "http://localhost:5100/api",
    },
  },
});
