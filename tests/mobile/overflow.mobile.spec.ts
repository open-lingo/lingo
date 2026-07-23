/**
 * Mobile gate — horizontal overflow (research §6 assertions 1 & 2).
 *
 *   (1) No horizontal page overflow — scrollWidth <= clientWidth + 1px. HARD-FAIL.
 *   (2) No element pushed off the right edge — HARD-FAIL (allow-list for known
 *       intentional off-canvas elements; empty today).
 *
 * Runs across VIEWPORTS × active ROUTES. CI runs the public subset as the
 * always-green gate; the full authed matrix is the local regression net.
 */
import { test, expect } from "@playwright/test";
import { activeRoutes, activeViewports, routeSlug } from "./_matrix";
import { gotoSeeded } from "./_seed";
import { overflowCheck, wideElements, describeEl } from "./_measure";

/**
 * Off-right-edge allow-list. Match by `data-testid` or a class substring for
 * elements that are *intentionally* off-canvas (e.g. a pre-open drawer). Keep
 * this tight — every entry is a suppressed real check.
 */
const RIGHT_EDGE_ALLOW: Array<{ testid?: string; cls?: string }> = [];

function isAllowed(el: { testid: string; cls: string }): boolean {
  return RIGHT_EDGE_ALLOW.some(
    (a) =>
      (a.testid && el.testid === a.testid) ||
      (a.cls && el.cls.includes(a.cls)),
  );
}

for (const vp of activeViewports()) {
  test.describe(`overflow @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    for (const route of activeRoutes()) {
      test(`${routeSlug(route.path)} has no horizontal overflow`, async ({ page }) => {
        await gotoSeeded(page, route, vp);

        // (1) page-level horizontal overflow — highest-signal.
        const o = await overflowCheck(page);
        expect(
          o.overflow,
          `${route.path} @ ${vp.name}: page scrollWidth ${o.scrollWidth} > clientWidth ${o.clientWidth}`,
        ).toBe(false);

        // (2) individual elements off the right edge.
        const offenders = (await wideElements(page)).filter((el) => !isAllowed(el));
        expect(
          offenders.length,
          `${route.path} @ ${vp.name}: ${offenders.length} element(s) off the right edge:\n` +
            offenders
              .map((el) => `  - ${describeEl(el)} right=${el.right} w=${el.width} (vw=${vp.width})`)
              .join("\n"),
        ).toBe(0);
      });
    }
  });
}
