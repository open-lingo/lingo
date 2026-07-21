/**
 * Mobile gate — primary CTA in the initial viewport (research §6 assertion 4).
 *
 * For routes that opt in (`primaryCta: true` in the matrix), the main action
 * marked `[data-testid="primary-cta"]` must sit fully within the initial
 * viewport — this catches the `mt-auto`-below-fold class of lesson/placement bug.
 *
 * Ratchet: the markup prereq (adding the testid) lives in src and is owned by
 * the layout worklist items (W14). Until it lands, opted-in routes are
 * skipped-with-annotation so the spec stays green and auto-activates the moment
 * the testid appears. Non-opted-in routes are not exercised here at all.
 */
import { test, expect } from "@playwright/test";
import { activeRoutes, activeViewports, routeSlug } from "./_matrix";
import { gotoSeeded } from "./_seed";
import { ctaInFold } from "./_measure";

for (const vp of activeViewports()) {
  test.describe(`cta-in-fold @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    for (const route of activeRoutes().filter((r) => r.primaryCta)) {
      test(`${routeSlug(route.path)} primary CTA is in the initial viewport`, async ({
        page,
      }, testInfo) => {
        await gotoSeeded(page, route, vp);

        const cta = await ctaInFold(page);
        if (!cta.present) {
          testInfo.annotations.push({
            type: "cta-markup-pending",
            description: `${route.path}: no [data-testid="primary-cta"] yet (W14 markup prereq)`,
          });
          test.skip(true, "primary-cta markup prereq not present yet");
          return;
        }

        expect(
          cta.inFold,
          `${route.path} @ ${vp.name}: primary CTA out of fold — ` +
            `rect(top=${cta.top},bottom=${cta.bottom},left=${cta.left},right=${cta.right}) ` +
            `vs viewport ${cta.innerWidth}x${cta.innerHeight}`,
        ).toBe(true);
      });
    }
  });
}
