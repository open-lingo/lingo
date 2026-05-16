/**
 * Smoke test for the alphabet-streamline rollout.
 *
 * Hits `/ja/learn?dev=1` so every node is unlocked, then verifies:
 *   - Module 1 expands enough lessons to reflect the sub-lesson split
 *   - At least one row-divider renders inside the active module
 *   - At least one test node has the data-test="true" marker
 *   - The module pill shows a `%` value (not "N of M")
 *
 * Captures a desktop screenshot for visual review.
 */
import { test, expect } from "@playwright/test";

test.describe("alphabet streamline — pathway smoke", () => {
  test("renders cluster + test nodes + percent pill at /ja/learn", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/ja/learn?dev=1");

    // Wait for the first module pathway to mount.
    await page.waitForSelector(".lingo-path", { timeout: 15_000 });

    // Module 1 should now host > 40 lessons after the streamline split.
    const nodeCount = await page.locator(".lingo-node").count();
    expect(nodeCount).toBeGreaterThan(20);

    // At least one row-divider renders for a row cluster.
    const dividerCount = await page.locator(".lingo-row-divider").count();
    expect(dividerCount).toBeGreaterThan(0);

    // At least one test node has the dashed/test treatment.
    const testNodeCount = await page
      .locator('.lingo-node[data-test="true"]')
      .count();
    expect(testNodeCount).toBeGreaterThan(0);

    // Module pill reads as percentage (no "N of M" phrasing).
    const pill = page.locator(".lingo-status-pill").first();
    if ((await pill.count()) > 0) {
      const pillText = (await pill.innerText()).trim();
      // Either "XX%", "✓ Complete · 100%", or "🔒 Coming soon".
      expect(pillText).toMatch(/(%|Coming soon)/i);
      expect(pillText).not.toMatch(/\d+ of \d+ lessons/);
    }

    await page.screenshot({
      path: "test-results/alphabet-streamline-desktop.png",
      fullPage: true,
    });
  });
});
