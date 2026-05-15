import { test } from "@playwright/test";

/**
 * Throwaway visual capture for cross-checking UI changes during refinement.
 * Not asserting anything — just dumps PNGs into test-results/ so reviewer can
 * eyeball them. Run with: `npx playwright test _visual-snapshots --project=chromium-public --update-snapshots`.
 *
 * Delete this file once we have proper auth-seeded screenshots in CI.
 */
test.describe("@visual landing visuals", () => {
  test("landing top of fold", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: "test-results/visual/landing-top.png",
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
  });

  test("landing footer (attribution)", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const footer = page.locator("footer").last();
    await footer.scrollIntoViewIfNeeded();
    await footer.screenshot({ path: "test-results/visual/landing-footer.png" });
  });
});
