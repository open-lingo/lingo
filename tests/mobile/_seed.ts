/**
 * Pre-navigation seeding for the mobile gate (lifted from `scripts/shot.mjs:57-92`).
 *
 * These `addInitScript` calls run BEFORE first render so blocking modals never
 * cover the page geometry we measure:
 *   - `open-lingo-settings.learning.learningLanguageId` — skips the first-time
 *     LanguagePickerModal on authed/lang routes.
 *   - `ftueArcSeen: true` — suppresses the FirstSessionArc survey modal.
 *   - funding panel collapsed — the persistent funding strip covers top content.
 *   - cookie-consent decided — the consent banner covers bottom content.
 *
 * Must be called on the Page before `page.goto()`.
 */
import { test, type Page } from "@playwright/test";
import { PUBLIC_BASE_URL, type RouteTarget, type Viewport } from "./_matrix";

const SETTINGS_KEY = "open-lingo-settings";

export async function seedPage(page: Page, route: RouteTarget): Promise<void> {
  if (route.lang) {
    await page.addInitScript(
      ({ key, langId }) => {
        try {
          const raw = window.localStorage.getItem(key);
          const parsed = raw ? JSON.parse(raw) : {};
          parsed.learning = {
            learningLanguageId: langId,
            uiLocale: parsed.learning?.uiLocale ?? "en",
            showAlphabetRomanization: parsed.learning?.showAlphabetRomanization ?? true,
            showAlphabetFurigana: parsed.learning?.showAlphabetFurigana ?? true,
            showRomaji: parsed.learning?.showRomaji ?? true,
            // Never a brand-new session — keep the FTUE survey modal off the page.
            ftueArcSeen: true,
          };
          window.localStorage.setItem(key, JSON.stringify(parsed));
        } catch {
          /* page may not be same-origin yet */
        }
      },
      { key: SETTINGS_KEY, langId: route.lang },
    );
  }

  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("open-lingo-funding-collapsed", "1");
      window.localStorage.setItem(
        "open-lingo-cookie-consent",
        JSON.stringify({
          essential: true,
          advertising: false,
          decidedAt: "2026-01-01T00:00:00.000Z",
        }),
      );
    } catch {
      /* ignore */
    }
  });
}

/**
 * Set the viewport, seed pre-nav state, navigate, and let layout settle.
 * Shared by every gate spec so measurement conditions are identical. Any
 * `page.on(...)` listeners a spec needs (render-errors) must be attached
 * BEFORE calling this.
 */
export async function gotoSeeded(
  page: Page,
  route: RouteTarget,
  viewport: Viewport,
): Promise<void> {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  await seedPage(page, route);

  // Anonymous routes go to the NON-bypassed server; authed routes use the
  // project's own baseURL (the bypassed one). See PUBLIC_BASE_URL for why there
  // are two. Authed routes navigate relative so an explicit PLAYWRIGHT_BASE_URL
  // or MOBILE_PORT keeps working — which is also why the expected origin has to
  // be read back from the project rather than assumed.
  const base = route.auth
    ? (test.info().project.use.baseURL ?? "http://localhost")
    : PUBLIC_BASE_URL;
  await page.goto(route.auth ? route.path : new URL(route.path, base).toString(), {
    waitUntil: "networkidle",
    timeout: 30_000,
  });
  // Settle async layout (fonts, lazy chunks, transitions) before measuring.
  await page.waitForTimeout(600);

  const landedUrl = new URL(page.url());
  const expectedOrigin = new URL(route.path, base).origin;

  // ── Off-origin guard ──────────────────────────────────────────────────────
  // Until 2026-08-07 the public subset listed /landing, /about and /login,
  // none of which are routes in this app: the first two left for the live
  // marketing site (`lingo-landing`, served from the apex) and the third for
  // Auth0's hosted login. The gate spent months asserting layout on the public
  // internet, and a decorative overflow on the MARKETING site is what turned
  // this repo's CI red — a failure nothing in this repo could fix.
  //
  // Measuring another origin is never what this gate means, whatever the route
  // list says, so fail on the fact rather than trusting the list.
  if (landedUrl.origin !== expectedOrigin) {
    throw new Error(
      `${route.path} left the app: landed on ${landedUrl.origin} (expected ` +
        `${expectedOrigin}). This gate measures THIS app only — if the path ` +
        `belongs to the marketing site or Auth0, remove it from routes.mjs.`,
    );
  }

  const landed = landedUrl.pathname;
  const requested = new URL(route.path, base).pathname;

  // ── Auth-bounce guard ─────────────────────────────────────────────────────
  // An expired/absent `.auth/user.json` makes every authed route silently
  // redirect, where the overflow/off-edge/render/cta assertions all pass
  // VACUOUSLY on whatever renders instead.
  if (route.auth && landed !== requested && (landed === "/landing" || landed === "/login")) {
    throw new Error(
      `auth storageState is stale — refresh with npm run test:e2e:auth ` +
        `(requested ${requested}, bounced to ${landed})`,
    );
  }

  // ── Signed-in-bounce guard (the mirror image) ─────────────────────────────
  // If a public route lands on /home, the anonymous server is serving a
  // signed-in session — i.e. the bypass leaked back onto it. Every public
  // assertion would then measure /home under another route's name and stay
  // green. That is precisely the 2026-08-06 regression this split undoes.
  if (!route.auth && landed !== requested && landed === "/home") {
    throw new Error(
      `${route.path} rendered as a SIGNED-IN user (landed on /home). The ` +
        `anonymous dev server at ${PUBLIC_BASE_URL} must run WITHOUT ` +
        `VITE_DEV_AUTH_BYPASS — check the webServer list in playwright.config.ts.`,
    );
  }
}
