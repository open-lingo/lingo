/**
 * Mobile gate — touch devices must not text-select the app.
 *
 * THE BUG (Spencer, 2026-09-02): a long-press or drag on the phone selected
 * every word on screen. `src/index.css` suppressed tap-highlight and
 * overscroll but never `user-select` / `-webkit-touch-callout`. Desktop keeps
 * selection, so the rule is scoped to `(pointer: coarse)` and this spec
 * asserts BOTH directions: none when coarse, auto otherwise. Inputs keep
 * `text` so typed-answer steps still show a caret.
 *
 * WHY TWO `describe` BLOCKS, NOT ONE LOOP: the `mobile` Playwright project
 * (playwright.config.ts) spreads `...devices["Desktop Chrome"]` and never
 * sets `hasTouch`, so `matchMedia("(pointer: coarse)")` is `false` for EVERY
 * viewport here by default — phone-sized ones included — because `pointer`
 * tracks the context's `hasTouch`/`isMobile` flags, not the viewport's pixel
 * size (confirmed directly against Chromium: a 430x932 context with
 * `hasTouch:false` never matches `(pointer:coarse)`). A single loop over
 * `activeViewports()` therefore always takes the "else" branch and can never
 * fail on the actual defect (Wave A review finding, round 1).
 *
 * `test.use({ hasTouch: true, isMobile: true })` inside a `describe` makes
 * Chromium report a coarse pointer for tests in that block — the same trick
 * `scripts/ux-loop/capture.mjs` relies on for device-faithful captures. The
 * "coarse pointer" describe below runs every non-desktop viewport under that
 * emulation and asserts the fix; the "fine pointer" describe runs the
 * desktop viewports under the project's normal (non-touch) context and
 * asserts selection is untouched. Each also asserts `matchMedia` matches the
 * pointer type it expects FIRST, so a Chromium/Playwright change that stops
 * `hasTouch`/`isMobile` from producing `(pointer:coarse)` fails loudly here
 * instead of the coarse assertions passing vacuously.
 *
 * `-webkit-touch-callout` IS NOT ASSERTED: verified directly against this
 * Chromium build (148.0.7778.96) that `CSS.supports("-webkit-touch-callout",
 * "none")` is `false` — Blink does not implement the property at all, so
 * `getComputedStyle(...).getPropertyValue("-webkit-touch-callout")` returns
 * `""` unconditionally, regardless of what src/index.css sets. Asserting
 * `toBe("none")` here would be permanently red on every Chromium run, which
 * would make this a broken gate rather than a stricter one. The CSS rule
 * itself stays (src/index.css) — it is real and does the job on WebKit
 * (Safari / the iOS Capacitor WKWebView) — this is a documented engine gap,
 * recorded as an annotation below, not a silent vacuous pass.
 */
import { test, expect } from "@playwright/test";
import { activeViewports, DESKTOP_VIEWPORTS } from "./_matrix";
import { gotoSeeded } from "./_seed";

const ROUTE = { path: "/ja/practice/flashcards/review", auth: true, lang: "ja" } as const;

const desktopNames = new Set(DESKTOP_VIEWPORTS.map((vp) => vp.name));
const touchViewports = activeViewports().filter((vp) => !desktopNames.has(vp.name));
const desktopViewports = activeViewports().filter((vp) => desktopNames.has(vp.name));

async function probeSelection(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const body = getComputedStyle(document.body);
    const input = document.createElement("input");
    document.body.appendChild(input);
    const inputSelect = getComputedStyle(input).userSelect;
    input.remove();
    return {
      coarse,
      bodySelect: body.userSelect,
      callout: body.getPropertyValue("-webkit-touch-callout"),
      inputSelect,
    };
  });
}

test.describe("coarse pointer", () => {
  test.use({ hasTouch: true, isMobile: true });

  for (const vp of touchViewports) {
    test(`selection is off @ ${vp.name}`, async ({ page }, testInfo) => {
      await gotoSeeded(page, ROUTE, vp);
      const probe = await probeSelection(page);
      expect(
        probe.coarse,
        "hasTouch+isMobile emulation must report a coarse pointer or this assertion means nothing",
      ).toBe(true);
      expect(probe.bodySelect, "coarse pointer must not select body text").toBe("none");
      expect(probe.inputSelect, "inputs stay selectable on touch").toBe("text");
      testInfo.annotations.push({
        type: "known-gap",
        description:
          `-webkit-touch-callout unverifiable on Chromium (probe.callout=` +
          `${JSON.stringify(probe.callout)}); verify on WebKit (iOS Capacitor / Safari)`,
      });
    });
  }
});

test.describe("fine pointer", () => {
  for (const vp of desktopViewports) {
    test(`selection stays on @ ${vp.name}`, async ({ page }) => {
      await gotoSeeded(page, ROUTE, vp);
      const probe = await probeSelection(page);
      expect(probe.coarse, "desktop context must not report a coarse pointer").toBe(false);
      expect(probe.bodySelect, "fine pointer keeps selection").not.toBe("none");
    });
  }
});
