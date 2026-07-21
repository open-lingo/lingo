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
import type { Page } from "@playwright/test";
import type { RouteTarget, Viewport } from "./_matrix";

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
  await page.goto(route.path, { waitUntil: "networkidle", timeout: 30_000 });
  // Settle async layout (fonts, lazy chunks, transitions) before measuring.
  await page.waitForTimeout(600);
}
