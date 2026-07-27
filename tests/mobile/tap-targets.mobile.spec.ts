/**
 * Mobile gate — tap-target floor (research §6 assertion 3).
 *
 * Interactive elements should be >= 44px tall and >= 24px wide. Starts as a
 * WARN (annotation + console) rather than a hard failure — inline text links
 * and icons-inside-a-larger-hit-area legitimately fall below the floor. Promote
 * per route by setting MOBILE_TAP_STRICT=1, which turns the WARN into a HARD-FAIL
 * for every offender not on the allow-list.
 */
import { test, expect } from "@playwright/test";
import { activeRoutes, activeViewports, routeSlug } from "./_matrix";
import { gotoSeeded } from "./_seed";
import { smallTapTargets, describeEl } from "./_measure";

const STRICT = process.env.MOBILE_TAP_STRICT === "1";

/**
 * Allow-list of legitimately-small interactive elements (inline links, icon
 * buttons whose padded hit-area is a parent, etc.). Match by testid, role, or
 * class substring.
 */
const TAP_ALLOW: Array<{ testid?: string; role?: string; cls?: string }> = [
  { role: "link" }, // inline prose links are exempt from the 44px block floor
];

function isAllowed(el: { testid: string; role: string; cls: string }): boolean {
  return TAP_ALLOW.some(
    (a) =>
      (a.testid && el.testid === a.testid) ||
      (a.role && el.role === a.role) ||
      (a.cls && el.cls.includes(a.cls)),
  );
}

for (const vp of activeViewports()) {
  test.describe(`tap-targets @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    for (const route of activeRoutes()) {
      test(`${routeSlug(route.path)} tap targets meet 44px floor`, async ({ page }, testInfo) => {
        await gotoSeeded(page, route, vp);

        const offenders = (await smallTapTargets(page)).filter((el) => !isAllowed(el));
        if (offenders.length === 0) return;

        const report =
          `${route.path} @ ${vp.name}: ${offenders.length} sub-44px tap target(s):\n` +
          offenders
            .map((el) => `  - ${describeEl(el)} ${el.width}x${el.height}`)
            .join("\n");

        testInfo.annotations.push({ type: "tap-target-warning", description: report });

        if (STRICT) {
          expect(offenders.length, report).toBe(0);
        } else {
          // Non-failing WARN — surfaces in the report + stdout without red-flagging CI.
          console.warn(`[tap-targets WARN] ${report}`);
        }
      });
    }
  });
}
