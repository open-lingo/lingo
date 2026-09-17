/**
 * axe-core smoke gate (2026-09-17 project review, lane A2 —
 * docs/accessibility-2026-09-17.md).
 *
 * Runs `@axe-core/playwright` against four learner-facing surfaces:
 *   1. the learn map (`/ja/learn`)
 *   2. a `build_sentence` step (`/ja/learn/lessons/ja-m34-neo-7?step=5` —
 *      the exact route named in the lane brief)
 *   3. a `multiple_choice` step (`ja-m34-neo-7?step=2`, "Pick the word for
 *      \"park\"" — found by probing the SAME lesson id rather than guessing
 *      a second one; `ja-m3-1`, used elsewhere in this suite, did not
 *      render under the dev-auth-bypass session used here)
 *   4. the settings modal (`/settings` — a client-side redirect to `/home`
 *      that opens `role="dialog"`, not a page of its own; see
 *      `SettingsOpenRoute.tsx`)
 *
 * NOT wired into `npm run test:mobile` — that gate's `mobile` Playwright
 * project only matches `tests/mobile/*.mobile.spec.ts`
 * (`playwright.config.ts`), a different directory and suffix than the
 * `tests/e2e/*.public.spec.ts` pattern this lane was pointed at, so tagging
 * a `tests/e2e/` spec cannot make `test:mobile` include it regardless of
 * how it's named. This file runs under ITS OWN project (`a11y`, added
 * below `mobile` in `playwright.config.ts`) via `npm run test:a11y`. CI
 * wiring is a recommendation for the lead, not done here — see
 * docs/accessibility-2026-09-17.md.
 *
 * AUTH: these routes render real (non-landing-page) content only under a
 * bypass session (`VITE_DEV_AUTH_BYPASS=true` — see the lane's Tools
 * section and `src/shared/auth/bypass.ts`), which is what the `a11y`
 * project's `baseURL` (reusing the existing mobile-gate bypass server on
 * `MOBILE_PORT`) provides. Every route also needs three pieces of
 * first-run UI dismissed before it reflects steady-state content — found
 * by probing the actual app, not guessed:
 *   - the cookie-consent banner (`open-lingo-cookie-consent` localStorage,
 *     the same key `visual-qa-capture.authed.spec.ts` seeds)
 *   - the first-session onboarding arc ("What brings you to Japanese?" —
 *     `learning.ftueArcSeen` in the `open-lingo-settings` cache,
 *     `FirstSessionArc.tsx`)
 *   - the optional placement-test prompt over the learn map
 *     (`lingo_placement_dismissed_v2_ja`, `usePlacementDismissed.ts`)
 * Skipping any one of these means axe would score first-run chrome
 * (a cookie banner, an onboarding dialog) instead of the surface named —
 * a false read on both scanned-node count and violations.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "open-lingo-cookie-consent",
      JSON.stringify({ essential: true, advertising: false, decidedAt: "2026-07-20" }),
    );
    localStorage.setItem(
      "open-lingo-settings",
      JSON.stringify({ learning: { ftueArcSeen: true } }),
    );
    localStorage.setItem("lingo_placement_dismissed_v2_ja", "1");
  });
});

/** One node per {rule id, impact, count, one example target selector} —
 *  compact enough to read in a CI log, complete enough to triage from. */
function summarize(results: Awaited<ReturnType<AxeBuilder["analyze"]>>) {
  return results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    count: v.nodes.length,
    example: v.nodes[0]?.target?.join(" "),
    help: v.help,
  }));
}

test.describe("axe smoke", () => {
  test("learn map — /ja/learn", async ({ page }) => {
    await page.goto("/ja/learn", { waitUntil: "networkidle" });
    await expect(page.locator("h1, h2").first()).toBeVisible({ timeout: 15_000 });
    const results = await new AxeBuilder({ page }).analyze();
    console.log("[axe] /ja/learn violations:", JSON.stringify(summarize(results), null, 2));
    expect(results.violations, JSON.stringify(summarize(results), null, 2)).toEqual([]);
  });

  test("build_sentence step — ja-m34-neo-7?step=5", async ({ page }) => {
    await page.goto("/ja/learn/lessons/ja-m34-neo-7?step=5", { waitUntil: "networkidle" });
    // Excludes the invisible `state="ghost"` pre-sizer tiles (`Tile.tsx`
    // renders them `aria-hidden`, zero-opacity) — `.first()` on the
    // unfiltered selector matched a ghost row tile and never became
    // visible.
    await expect(
      page.locator('[data-tile][data-variant="build"]:not([data-state="ghost"])').first(),
    ).toBeVisible({ timeout: 15_000 });
    const results = await new AxeBuilder({ page }).analyze();
    console.log(
      "[axe] build_sentence step violations:",
      JSON.stringify(summarize(results), null, 2),
    );
    expect(results.violations, JSON.stringify(summarize(results), null, 2)).toEqual([]);
  });

  test("multiple_choice step — ja-m34-neo-7?step=2", async ({ page }) => {
    await page.goto("/ja/learn/lessons/ja-m34-neo-7?step=2", { waitUntil: "networkidle" });
    await expect(page.locator('[data-tile][data-variant="option"]').first()).toBeVisible({
      timeout: 15_000,
    });
    const results = await new AxeBuilder({ page }).analyze();
    console.log("[axe] MCQ step violations:", JSON.stringify(summarize(results), null, 2));
    expect(results.violations, JSON.stringify(summarize(results), null, 2)).toEqual([]);
  });

  test("settings modal — /settings", async ({ page }) => {
    await page.goto("/settings", { waitUntil: "networkidle" });
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 15_000 });
    const results = await new AxeBuilder({ page }).analyze();
    console.log("[axe] settings modal violations:", JSON.stringify(summarize(results), null, 2));
    expect(results.violations, JSON.stringify(summarize(results), null, 2)).toEqual([]);
  });
});
