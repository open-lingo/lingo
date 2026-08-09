/**
 * Mobile gate — nothing anchored may sit inside a safe-area band.
 *
 * THE BUG THIS EXISTS FOR (2026-08-08): on a 15 Pro Max the lesson header's
 * close button, progress bar and XP chip rendered underneath the Dynamic
 * Island. It was reported from a phone, by hand, after a reinstall — because
 * this gate could not see it and no addition to the route list or the viewport
 * matrix would have helped. Chromium resolves every `env(safe-area-inset-*)`
 * to 0, so `pt-safe` and friends collapsed to their fallbacks and the header
 * measured as correctly positioned at every size.
 *
 * `gotoSeeded` now pushes each viewport's real insets in over CDP before
 * navigating, and verifies CSS `env()` reports them back, so this spec measures
 * the layout the device actually produces. Negative control, run 2026-08-09 on
 * `/ja/learn` at 430x932 with the insets applied: as shipped, 0 intrusions;
 * with `.pt-safe`/`.pb-safe` forced to 0, 4 — the site header's brand link at
 * top=10px, the account menu at 4px and the menu toggle at 0px, i.e. the
 * reported bug, reproduced headlessly.
 *
 * Scrolling CONTENT under the island is fine and intended — that is what
 * `viewport-fit=cover` buys. Only `fixed`/`sticky` chrome is measured.
 */
import { test, expect } from "@playwright/test";
import { activeRoutes, activeViewports, routeSlug } from "./_matrix";
import { gotoSeeded, readSafeAreaInsets } from "./_seed";
import { safeAreaIntrusions } from "./_measure";

for (const vp of activeViewports()) {
  const hasInsets = Object.values(vp.insets).some((v) => v > 0);

  test.describe(`safe-area @ ${vp.name} (${vp.width}x${vp.height})`, () => {
    for (const route of activeRoutes()) {
      test(`${routeSlug(route.path)} keeps anchored controls clear of the insets`, async ({
        page,
      }, testInfo) => {
        // Desktop and `android-small` model devices with no insets at all.
        // Skip rather than assert nothing, so the report never implies this
        // viewport proved something it structurally cannot. Checked before
        // navigating — there is nothing to learn from loading the page.
        test.skip(!hasInsets, `${vp.name} has no safe-area insets to violate`);

        await gotoSeeded(page, route, vp);

        // gotoSeeded already round-trip-checked this; re-reading here keeps the
        // failure message local to the assertion that depends on it.
        const applied = await readSafeAreaInsets(page);
        expect(
          applied,
          `env(safe-area-inset-*) did not report the ${vp.name} insets — this ` +
            `spec cannot detect anything without them`,
        ).toEqual(vp.insets);

        const intrusions = await safeAreaIntrusions(page, vp.insets);
        testInfo.annotations.push({
          type: "safe-area",
          description: `insets ${JSON.stringify(vp.insets)}, ${intrusions.length} intrusion(s)`,
        });
        if (intrusions.length === 0) return;

        const detail = intrusions
          .map(
            (el) =>
              `  - ${el.band} band, ${el.depth}px in: ${el.tag}` +
              `${el.testid ? `[data-testid=${el.testid}]` : ""} "${el.text}"`,
          )
          .join("\n");
        expect(
          intrusions.length,
          `${route.path} @ ${vp.name}: ${intrusions.length} anchored control(s) ` +
            `inside a safe-area band:\n${detail}\n` +
            `On a device these sit under the Dynamic Island, the status bar or ` +
            `the home indicator. Pad the anchored container with the *-safe ` +
            `utilities from tailwind.config.js.`,
        ).toBe(0);
      });
    }
  });
}
