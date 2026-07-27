/**
 * Mobile gate — no console/page errors during render (research §6 assertion 7).
 *
 * Captures `pageerror` (uncaught JS exceptions) and `console` type `error`
 * during navigation + settle (pattern from `scripts/qa-link-crawl.mjs`). HARD-FAIL.
 *
 * A tight ignore-list filters non-actionable noise that is not a render bug:
 * backend/resource fetch failures (the render harness may run without a live
 * API), the benign ResizeObserver loop warning, and dev-tools chatter. Keep the
 * list minimal — every pattern here is a suppressed signal.
 */
import { test, expect } from "@playwright/test";
import { activeRoutes, activeViewports, routeSlug } from "./_matrix";
import { gotoSeeded } from "./_seed";

const IGNORE = [
  /ResizeObserver loop/i,
  /Failed to load resource/i, // resource/API fetch failures — not a render bug
  /net::ERR_/i,
  /Download the React DevTools/i,
  /\[vite\]/i, // HMR/dev-server chatter
  /favicon/i,
];

function ignored(msg: string): boolean {
  return IGNORE.some((re) => re.test(msg));
}

for (const vp of activeViewports()) {
  test.describe(`render-errors @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    for (const route of activeRoutes()) {
      test(`${routeSlug(route.path)} renders without console/page errors`, async ({ page }) => {
        const errors: string[] = [];

        // Listeners MUST be attached before navigation.
        page.on("pageerror", (err) => {
          const msg = `pageerror: ${err.message}`;
          if (!ignored(msg)) errors.push(msg);
        });
        page.on("console", (msg) => {
          if (msg.type() !== "error") return;
          const text = `console.error: ${msg.text()}`;
          if (!ignored(text)) errors.push(text);
        });

        await gotoSeeded(page, route, vp);

        expect(
          errors.length,
          `${route.path} @ ${vp.name}: ${errors.length} render error(s):\n` +
            errors.map((e) => `  - ${e}`).join("\n"),
        ).toBe(0);
      });
    }
  });
}
