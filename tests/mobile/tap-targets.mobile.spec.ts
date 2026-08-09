/**
 * Mobile gate — WCAG 2.2 SC 2.5.8 Target Size (Minimum), Level AA.
 *
 * HARD FAILURE, no allow-list, no WARN mode (2026-08-09).
 *
 * This used to compare every interactive element against a flat 44px floor and
 * emit a non-failing warning, because a hard 44px gate would have "failed"
 * constantly. That was the wrong criterion, not excessive strictness: 44x44 is
 * Apple's HIG recommendation and WCAG Level AAA, while the AA criterion is
 * 24x24 with a spacing exception that legitimises exactly the dense icon rows
 * the old check kept flagging. Measured across 19 routes at 430x932: 114
 * elements under 44x44, and ZERO failures against 2.5.8. A gate whose output
 * is 114 items nobody acts on is a gate nobody reads.
 *
 * With the right criterion the app already conforms, so this can be strict from
 * the day it lands — and a real regression now turns CI red instead of adding a
 * line to a warning list. The allow-list went with it: `role="link"` used to be
 * blanket-exempt, which silently excused every link-shaped button; the Inline
 * exception in `tapTargetReport` handles genuine prose links on the actual
 * rule (constrained by the line-height of surrounding text) rather than by role.
 */
import { test, expect } from "@playwright/test";
import { activeRoutes, activeViewports, routeSlug } from "./_matrix";
import { gotoSeeded } from "./_seed";
import { tapTargetReport, describeEl } from "./_measure";

for (const vp of activeViewports()) {
  test.describe(`tap-targets @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    for (const route of activeRoutes()) {
      test(`${routeSlug(route.path)} meets WCAG 2.5.8 (24px + spacing)`, async ({
        page,
      }, testInfo) => {
        await gotoSeeded(page, route, vp);
        const report = await tapTargetReport(page);

        // Guard the guard: a route with no measurable targets means the page
        // did not render what we think it did, and "0 failures" is vacuous.
        expect(
          report.measured,
          `${route.path} @ ${vp.name}: no interactive elements found at all — ` +
            `the page probably did not render. A pass here would be vacuous.`,
        ).toBeGreaterThan(0);

        testInfo.annotations.push({
          type: "tap-targets",
          description:
            `${report.measured} targets: ${report.passSize} pass on size, ` +
            `${report.passSpacing} via spacing, ${report.inlineExempt} inline-exempt`,
        });

        if (report.failures.length === 0) return;

        const detail = report.failures
          .map((el) => `  - ${describeEl(el)} ${el.width}x${el.height} — ${el.blockedBy}`)
          .join("\n");
        expect(
          report.failures.length,
          `${route.path} @ ${vp.name}: ${report.failures.length} target(s) under ` +
            `24x24 CSS px that also fail the spacing exception:\n${detail}\n` +
            `Fix by enlarging the target to 24x24 or by spacing it so a 24px ` +
            `circle on its centre clears its neighbours.`,
        ).toBe(0);
      });
    }
  });
}
