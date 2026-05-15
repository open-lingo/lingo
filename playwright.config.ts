import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for E2E tests.
 *
 * Auth pattern:
 *   - `auth setup` project runs `tests/e2e/auth.setup.ts` once; it pauses for
 *     interactive Auth0 login, then saves cookies/localStorage to
 *     `.auth/user.json` (gitignored).
 *   - `chromium` (authed) project loads that storage state for every test.
 *   - `chromium-public` skips auth entirely — for landing/login pages.
 *
 * Run public tests:        npx playwright test --project=chromium-public
 * Run authed tests:        npx playwright test --project=chromium
 * Refresh auth state:      npx playwright test --project='auth setup' --headed
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";
const AUTH_STATE = ".auth/user.json";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    // Reuse the running dev server if it's already on 5173; otherwise start it.
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: "chromium-public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.public\.spec\.ts$/,
    },
    {
      name: "auth setup",
      testMatch: /auth\.setup\.ts$/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: AUTH_STATE },
      dependencies: ["auth setup"],
      testMatch: /.*\.authed\.spec\.ts$/,
    },
  ],
});
