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
import { test, type CDPSession, type Page } from "@playwright/test";
import { PUBLIC_BASE_URL, type Insets, type RouteTarget, type Viewport } from "./_matrix";

const SETTINGS_KEY = "open-lingo-settings";

/** One CDP session per page — reused across navigations within a test. */
const cdpSessions = new WeakMap<Page, Promise<CDPSession>>();

/**
 * Make `env(safe-area-inset-*)` report real numbers.
 *
 * Chromium resolves every `env(safe-area-inset-*)` to 0 by default, so the
 * `*-safe` utilities in `tailwind.config.js` — `max(env(safe-area-inset-top),
 * <fallback>)` — collapse to their fallbacks and the gate cannot see a
 * Dynamic Island or home-indicator overlap AT ANY VIEWPORT. That is not a gap
 * in coverage, it is a gap in physics: no route list or viewport matrix could
 * have caught the 2026-08-08 phone bug, and none did.
 *
 * `Emulation.setSafeAreaInsetsOverride` fixes that. It is marked EXPERIMENTAL
 * in the CDP spec, so it is called strictly rather than optionally: if a
 * Chromium bump removes or renames it, this throws and the gate goes red.
 * Swallowing the error would silently return the gate to its blind state while
 * every safe-area assertion kept passing vacuously — the single worst outcome
 * available here. Verified working on Playwright 1.60 / Chromium 148.
 */
async function applySafeAreaInsets(page: Page, insets: Insets): Promise<void> {
  let session = cdpSessions.get(page);
  if (!session) {
    session = page.context().newCDPSession(page);
    cdpSessions.set(page, session);
  }
  const client = await session;
  try {
    await client.send("Emulation.setSafeAreaInsetsOverride", { insets });
  } catch (err) {
    throw new Error(
      `Emulation.setSafeAreaInsetsOverride failed — the mobile gate cannot ` +
        `measure safe areas without it and must not pretend otherwise. ` +
        `Check the bundled Chromium version (needs the experimental Emulation ` +
        `method; known good on Playwright 1.60 / Chromium 148). ` +
        `Original error: ${(err as Error).message}`,
    );
  }
}

/**
 * Read back what the PAGE thinks its insets are.
 *
 * The override is set on the browser, but what matters is whether CSS `env()`
 * actually resolves to it — that is the thing every `*-safe` utility depends
 * on. Asserting the round trip is what stops a silent protocol change from
 * turning the safe-area assertions into a vacuous pass.
 */
export async function readSafeAreaInsets(page: Page): Promise<Insets> {
  // A route that redirects on mount (e.g. /ko/community/leaderboard) can
  // destroy the execution context mid-evaluate. That is a navigation race, not
  // a layout result, so retry once against the page that actually settled
  // rather than reporting it as an overflow failure.
  try {
    return await evaluateInsets(page);
  } catch (err) {
    if (!/Execution context was destroyed|Target closed/.test(String(err))) throw err;
    await page.waitForTimeout(400);
    return evaluateInsets(page);
  }
}

function evaluateInsets(page: Page): Promise<Insets> {
  return page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText =
      "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;" +
      "padding-top:env(safe-area-inset-top);padding-right:env(safe-area-inset-right);" +
      "padding-bottom:env(safe-area-inset-bottom);padding-left:env(safe-area-inset-left)";
    document.body.appendChild(probe);
    const cs = getComputedStyle(probe);
    const px = (v: string) => Math.round(parseFloat(v) || 0);
    const out = {
      top: px(cs.paddingTop),
      right: px(cs.paddingRight),
      bottom: px(cs.paddingBottom),
      left: px(cs.paddingLeft),
    };
    probe.remove();
    return out;
  });
}

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
  // Before nav, so first paint already lays out against the real insets.
  await applySafeAreaInsets(page, viewport.insets);
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
  // React mounts the shell after `networkidle` resolves, so a flat settle
  // timeout is a race: under parallel workers it intermittently measured a page
  // with zero interactive elements and reported it as a layout result. Wait for
  // the FACT (something interactive has painted), not for a duration. A
  // genuinely empty page is a real finding, so this only waits — the specs
  // still assert on emptiness and produce the useful message.
  await page
    .waitForFunction(
      () => !!document.querySelector('a[href], button, input, [role="button"]'),
      undefined,
      { timeout: 15_000 },
    )
    .catch(() => {
      /* leave the verdict to the spec */
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

  // ── Safe-area round-trip guard ────────────────────────────────────────────
  // The override is set on the browser; this checks the PAGE agrees. If CSS
  // `env()` doesn't resolve to the requested values, every `*-safe` utility is
  // back to its fallback and the safe-area assertions would pass on a layout
  // nobody is actually shipping. Fail on the fact, not on the API call
  // returning without throwing.
  const actual = await readSafeAreaInsets(page);
  const want = viewport.insets;
  if (
    actual.top !== want.top ||
    actual.right !== want.right ||
    actual.bottom !== want.bottom ||
    actual.left !== want.left
  ) {
    throw new Error(
      `safe-area insets did not reach CSS at ${viewport.name}: env() reports ` +
        `${JSON.stringify(actual)}, expected ${JSON.stringify(want)}. Every ` +
        `*-safe utility is resolving to its fallback, so safe-area coverage ` +
        `here is not real.`,
    );
  }
}
