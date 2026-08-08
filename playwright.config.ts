import fs from "node:fs";
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
// The mobile project always serves its OWN worktree dev server on a configurable
// port (default 5273, NOT 5173) so it never collides with the developer's main
// :5173 dev server and never accidentally tests a stale tree. VITE_E2E=true makes
// the captured :5173 storageState portable to this port.
const MOBILE_PORT = process.env.MOBILE_PORT ?? "5273";
const MOBILE_URL = `http://localhost:${MOBILE_PORT}`;
// Second gate server, for ANONYMOUS routes. Kept in sync with PUBLIC_BASE_URL
// in `tests/mobile/_matrix.ts`, which reads the same two env vars.
const MOBILE_PUBLIC_PORT = process.env.MOBILE_PUBLIC_PORT ?? "5274";
const MOBILE_PUBLIC_URL =
  process.env.MOBILE_PUBLIC_URL ?? `http://localhost:${MOBILE_PUBLIC_PORT}`;
// The mobile gate attaches the Auth0 storageState only when it actually exists.
// In CI (or a fresh checkout) the file is absent — the gate then runs the
// always-green public-route subset (MOBILE_PUBLIC_ONLY=1) with no auth.
const MOBILE_STORAGE_STATE = fs.existsSync(AUTH_STATE) ? AUTH_STATE : undefined;

// Portable-auth capture mode (CAPTURE_E2E=1, driven by `npm run auth:capture`):
// serve the worktree WITH VITE_E2E=true on :5173 — the only Auth0-allowlisted
// origin — so the one-time headed login writes a localStorage-cached, refresh-
// token-backed session into .auth/user.json that replays on any port. In this
// mode we start ONLY that server (no reuse of a plain non-E2E :5173, no mobile
// server) so the captured token is guaranteed portable.
const CAPTURE_E2E = process.env.CAPTURE_E2E === "1";
const webServer = CAPTURE_E2E
  ? [
      {
        command: "VITE_E2E=true npm run dev -- --port 5173 --strictPort",
        url: "http://localhost:5173",
        reuseExistingServer: false,
        timeout: 120_000,
      },
    ]
  : [
      {
        // Non-mobile e2e: reuse the running dev server if it's already on 5173;
        // otherwise start it. Unchanged.
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
      {
        // Mobile render gate: ALWAYS start its own worktree dev server on
        // MOBILE_PORT (never :5173) with the E2E portable-auth flag on, so the
        // captured :5173 storageState replays here and we never test a stale tree.
        //
        // ⚠️ `VITE_DEV_AUTH_BYPASS=true` (added 2026-08-06) is what makes the
        // AUTHED half of the matrix actually run. It was covering NOTHING:
        // `.auth/user.json` held 0 cookies and no `@@auth0spajs@@` token — it
        // had been captured from a dev-bypass session (its localStorage still
        // names `dev|user-1`), so it never carried one. Every authed route
        // therefore failed `RequireAuth`, left for the marketing origin, and
        // every assertion skipped "not a lesson surface" while the run stayed
        // green. Measured: 273/273 skipped on stage-fit before this line.
        //
        // A layout gate has no business depending on a hand-captured Auth0
        // session that expires: the bypass makes the authed routes render
        // deterministically, on every machine, with no re-capture chore. It is
        // dev-server-only (`import.meta.env.DEV`), so it cannot reach a build.
        command: `VITE_E2E=true VITE_DEV_AUTH_BYPASS=true npm run dev -- --port ${MOBILE_PORT} --strictPort`,
        url: MOBILE_URL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
      {
        // ⚠️ The SAME tree WITHOUT the bypass, for the anonymous routes.
        //
        // The bypass above is what makes the authed matrix render. It also
        // signs the browser in on every OTHER route, so from 2026-08-06 to
        // 08-07 every public page landed on /home and the public gate measured
        // one page under three names while staying green. `DEV_AUTH_BYPASS` is
        // a module-level constant folded from `import.meta.env`, so no single
        // server can serve both session states — hence a second server rather
        // than a runtime override in `shared/auth/bypass.ts`, which is the
        // fence that keeps the bypass out of web builds and should not grow a
        // test-only door.
        //
        // The only difference from the server above is the missing bypass flag;
        // keep it that way so a public/authed discrepancy can only ever be the
        // session state.
        command: `VITE_E2E=true npm run dev -- --port ${MOBILE_PUBLIC_PORT} --strictPort`,
        url: MOBILE_PUBLIC_URL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
    ];

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
  webServer,
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
    {
      // Mobile render gate (research §6). Specs set their own per-test viewport
      // from the VIEWPORTS matrix, so the project fixes only Chrome + auth. The
      // storageState is attached only if `.auth/user.json` exists; without it the
      // gate runs the public-route subset (set MOBILE_PUBLIC_ONLY=1). This project
      // has no `auth setup` dependency — that step is interactive/headed and
      // cannot run in CI.
      name: "mobile",
      testDir: "./tests/mobile",
      testMatch: /.*\.mobile\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: MOBILE_URL,
        deviceScaleFactor: 1,
        ...(MOBILE_STORAGE_STATE ? { storageState: MOBILE_STORAGE_STATE } : {}),
      },
    },
  ],
});
