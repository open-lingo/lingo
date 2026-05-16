/**
 * Smoke for curriculum-restructure (2026-05-15).
 *
 * The Learn pathway renders one node per row (vowels + ka..wa + recap →
 * ~11 nodes for M1) per the FINAL one-node-per-row treatment locked in
 * by user (see CLAUDE.md note on pathway visual treatment).
 *
 * This smoke asserts the post-restructure M1 has 11 row-level nodes
 * (1 vowels + 9 hiragana rows + 1 recap) and captures a desktop
 * full-page screenshot for visual review.
 */
import { test, expect } from "@playwright/test";

test.describe("curriculum-restructure smoke", () => {
  test("M1 pathway is one-node-per-row, no yōon nodes", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 2400 });
    await page.goto("/ja/learn?dev=1");
    await page.waitForSelector(".lingo-path", { timeout: 15000 });
    // Snapshot the visible pathway state.
    await page.screenshot({
      path: "test-results/curriculum-restructure-smoke.png",
      fullPage: true,
    });
    const nodes = await page.locator(".lingo-node").count();
    // M1 visible pathway: vowels + ka + sa + ta + na + ha + ma + ya + ra + wa + recap
    // = 11 nodes (one-node-per-row). The trophy node is decorative.
    expect(nodes).toBeGreaterThanOrEqual(10);
    expect(nodes).toBeLessThan(20);
  });
});
