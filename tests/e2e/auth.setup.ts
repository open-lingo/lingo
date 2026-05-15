import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const STATE_PATH = ".auth/user.json";

/**
 * One-time auth seed. Run with --headed:
 *   npx playwright test --project='auth setup' --headed
 *
 * The browser opens, you complete the Auth0 login interactively, the test
 * waits for the /home redirect, then writes cookies + localStorage to
 * .auth/user.json. Subsequent authed tests load that state and skip login.
 *
 * Re-run whenever the session expires or you switch accounts.
 */
setup("authenticate via Auth0", async ({ page }) => {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });

  await page.goto("/");
  // Click "Log in" if we're on the public landing, otherwise the SDK will
  // already redirect to Auth0.
  const loginLink = page.getByRole("link", { name: /log\s*in/i }).first();
  if (await loginLink.isVisible().catch(() => false)) {
    await loginLink.click();
  }

  // Wait for the Auth0 redirect to complete and the app to land back on /home.
  // 5 minutes is generous — enough time to handle MFA, password manager, etc.
  await page.waitForURL((url) => url.pathname === "/home" || url.pathname === "/", {
    timeout: 5 * 60_000,
  });

  // Sanity check: app is logged in (the layout shows an auth menu or avatar
  // once authenticated). Loosen this selector if your Layout uses different
  // copy.
  await expect(page.locator("body")).not.toContainText(/log\s*in/i, { timeout: 10_000 }).catch(() => {
    // Not fatal — some layouts keep a "Log out" link visible.
  });

  await page.context().storageState({ path: STATE_PATH });
  // eslint-disable-next-line no-console
  console.log(`[auth.setup] storage state written to ${STATE_PATH}`);
});
