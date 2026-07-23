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
 *
 * For a PORT-PORTABLE capture use `npm run auth:capture` (CAPTURE_E2E=1): it
 * serves the worktree with VITE_E2E=true on :5173 so the login persists a
 * localStorage + refresh-token session. After that one-time capture, the mobile
 * matrix runs on MOBILE_PORT (default 5273) replaying .auth/user.json — no :5173
 * dev server needed, so the developer's main server is never disturbed.
 */
setup("authenticate via Auth0", async ({ page }) => {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });

  // Skip interactive login when a saved state already exists AND contains
  // actual auth tokens (not just settings data). Check for Auth0 SPA SDK
  // keys in localStorage to verify the state is usable.
  if (fs.existsSync(STATE_PATH)) {
    try {
      const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
      const hasAuth = (state.origins ?? []).some((o: { localStorage?: { name: string }[] }) =>
        (o.localStorage ?? []).some((item: { name: string }) =>
          item.name.includes("auth0") || item.name.includes("@@auth0spajs@@"),
        ),
      );
      if (hasAuth) {
        // eslint-disable-next-line no-console
        console.log(`[auth.setup] reusing existing ${STATE_PATH} (has auth tokens)`);
        return;
      }
      // eslint-disable-next-line no-console
      console.log(`[auth.setup] ${STATE_PATH} exists but has no auth tokens — re-authenticating`);
    } catch {
      // corrupt file, re-authenticate
    }
  }

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
