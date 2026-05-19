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

  // Go straight to /login — the LoginPage triggers the Auth0 redirect on mount.
  // (Going to "/" matches waitForURL immediately and short-circuits the wait.)
  await page.goto("/login");

  // Wait until the app lands on /home (post-Auth0 callback). 5 minutes covers
  // MFA / password-manager flows.
  await page.waitForURL((url) => url.pathname === "/home", {
    timeout: 5 * 60_000,
  });

  // Sanity check: the authed Layout exposes an auth menu trigger — wait for it
  // before snapshotting state, otherwise we might serialize before tokens are
  // persisted.
  await expect(
    page.getByRole("button", { name: /account|logout|sign\s*out/i }).first(),
  ).toBeVisible({ timeout: 10_000 }).catch(() => {
    // Layout copy may vary — non-fatal.
  });

  await page.context().storageState({ path: STATE_PATH });
  // eslint-disable-next-line no-console
  console.log(`[auth.setup] storage state written to ${STATE_PATH}`);
});
