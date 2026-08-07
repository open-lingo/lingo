/**
 * Mobile gate — VERTICAL fit inside the lesson stage (research §6 assertion 5:
 * "no unintended vertical scroll on fixed-shell surfaces").
 *
 * Assertion 5 was marked N/A when the research doc was written because the
 * fixed shell did not exist yet. It does now (`LessonShell`, `h-[calc(100dvh-6.5rem)]`),
 * and this is the check that was missing: on 2026-08-06 `word_image_mcq`
 * overflowed its stage by **204px** at 320×568 and by 28px at 375×667, and
 * every existing gate spec was green throughout — `overflow` only looks
 * horizontally, and `cta-fold` was structurally blind on the step types that
 * carried no `primary-cta`.
 *
 * What it measures: `scrollHeight - clientHeight` of the lesson stage's
 * SCROLLER. CLAUDE.md § "Lesson UI stability rules" — the window never scrolls
 * during a lesson; the step container is the only scroll area. So any value
 * above the tolerance means content the learner has to scroll to reach inside
 * a step that was designed to fit.
 */
import { test, expect } from "@playwright/test";
import { activeRoutes, activeViewports, routeSlug } from "./_matrix";
import { gotoSeeded } from "./_seed";

/**
 * Step types that are ALLOWED to scroll inside the stage.
 *
 * `grammar_rule` is by design — CLAUDE.md: "Long reading content (grammar
 * cards) scrolls inside it." Everything else is a bug until proven otherwise.
 * Keep this list short; every entry suppresses a real check.
 */
const SCROLLABLE_STEP_TYPES = ["grammar_rule"];

/**
 * Sub-pixel slack. Fractional layout (ruby text, borders at odd DPRs) routinely
 * produces a 1px phantom delta that is not a real scroll.
 */
const TOLERANCE_PX = 2;

for (const vp of activeViewports()) {
  test.describe(`stage fit @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    for (const route of activeRoutes()) {
      test(`${routeSlug(route.path)} stage does not scroll vertically`, async ({ page }) => {
        await gotoSeeded(page, route, vp);

        const stage = page.locator("[data-lesson-stage]").first();
        // Most routes in the matrix are not lesson surfaces at all.
        if ((await stage.count()) === 0) {
          test.skip(true, "not a lesson stage surface");
        }
        await stage.waitFor({ state: "visible" });

        const m = await stage.evaluate((el) => {
          // The stage element itself is the flex child; its PARENT is the
          // element that actually scrolls (`LessonShell` owns the scroller).
          // Measuring the wrong one reports 0 and the check passes vacuously.
          const scroller = el.parentElement ?? el;
          return {
            overflow: scroller.scrollHeight - scroller.clientHeight,
            scrollHeight: scroller.scrollHeight,
            clientHeight: scroller.clientHeight,
            // Set by LessonPage's `stageProps`. The placement / test-out
            // surface does not set it, so those report "unknown" and get
            // checked STRICTLY — the safe default: an unrecognised surface
            // should have to prove it may scroll, not be waved through.
            stepType: el.getAttribute("data-visual-qa-step-type") ?? "unknown",
          };
        });

        if (SCROLLABLE_STEP_TYPES.includes(m.stepType)) {
          test.skip(true, `${m.stepType} scrolls by design`);
        }

        expect(
          m.overflow,
          `${route.path} @ ${vp.name} (step type "${m.stepType}"): stage scroller ` +
            `overflows by ${m.overflow}px (scrollHeight ${m.scrollHeight} > ` +
            `clientHeight ${m.clientHeight}). The learner has to scroll inside a ` +
            `step that is supposed to fit.`,
        ).toBeLessThanOrEqual(TOLERANCE_PX);

        // The window itself must never scroll during a lesson.
        const windowOverflow = await page.evaluate(
          () => document.documentElement.scrollHeight - window.innerHeight,
        );
        expect(
          windowOverflow,
          `${route.path} @ ${vp.name}: the WINDOW scrolls by ${windowOverflow}px ` +
            `during a lesson — the fixed shell is supposed to prevent this.`,
        ).toBeLessThanOrEqual(TOLERANCE_PX);
      });
    }
  });
}
