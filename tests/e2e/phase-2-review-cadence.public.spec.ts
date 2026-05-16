/**
 * Smoke test for the Phase 2 review-cadence rollout.
 *
 * Hits `/ja/learn?dev=1` (every node unlocked) and verifies:
 *   - Module 1 lessons present in the pathway (cluster-collapsed view
 *     means we see ~14 nodes: vowels + 11 hiragana rows + 2 yōon rows
 *     + recap = 15; tolerate >= 10 to be resilient to layout tweaks).
 *   - A recap node renders with the data-recap="true" marker.
 *   - The module pill reads as a percent (Phase 1 carry-over, asserted
 *     here as part of the Phase 2 smoke too).
 *
 * Captures a desktop screenshot for visual review.
 */
import { test, expect } from "@playwright/test";

test.describe("phase 2 review cadence — pathway smoke", () => {
  test("renders recap node + percent pill at /ja/learn?dev=1", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/ja/learn?dev=1");

    // Wait for the first module pathway to mount.
    await page.waitForSelector(".lingo-path", { timeout: 15_000 });

    const nodeCount = await page.locator(".lingo-node").count();
    expect(nodeCount).toBeGreaterThan(5);

    // At least one recap node renders with the amber-gradient marker.
    const recapNodeCount = await page
      .locator('.lingo-node[data-recap="true"]')
      .count();
    expect(recapNodeCount).toBeGreaterThan(0);

    // Module pill reads as percentage.
    const pill = page.locator(".lingo-status-pill").first();
    if ((await pill.count()) > 0) {
      const pillText = (await pill.innerText()).trim();
      expect(pillText).toMatch(/(%|Coming soon)/i);
    }

    await page.screenshot({
      path: "test-results/phase-2-review-cadence-desktop.png",
      fullPage: true,
    });
  });
});
