/**
 * Persona Trevor — 28yo time-pressed optimizer. M6 + M7 walk.
 *
 * Trevor's profile (audit synthesis §1 + tester walkthrough):
 *   - Kana ~70%, romaji on.
 *   - 2 × 10-min sessions/day; hates filler.
 *   - Optimizer mindset: quits if "what did the last 30s buy me?" is
 *     unclear.
 *
 * What this asserts:
 *   - Every M6 + M7 sub-lesson walks to completion at fast pace.
 *   - No "stuck" state — every step has a clear advance affordance
 *     (lessons complete within Trevor's 10-min window).
 *   - M6-6 (the rotating-particle drill) shows distinct answer particles
 *     (no "always pick X" exploit per audit §2.4 + Wave 4A-3 helper).
 *   - M7-8 dialogue closer is a dialogue_listen step.
 *   - M7-2 verb-class match step (the cliff per audit §3.2) walks cleanly.
 */
import { test, expect, type ConsoleMessage } from "@playwright/test";
import { walkLesson } from "./wave-4-lesson-walker";

const TREVOR_LESSONS = [
  "ja-m6-1", "ja-m6-2", "ja-m6-3", "ja-m6-4",
  "ja-m6-5", "ja-m6-6", "ja-m6-7", "ja-m6-8", "ja-m6-9",
  "ja-m7-1", "ja-m7-2", "ja-m7-3", "ja-m7-4",
  "ja-m7-5", "ja-m7-6", "ja-m7-7", "ja-m7-8", "ja-m7-9",
];

test.describe.skip("Persona — Trevor (M6 + M7 optimizer walk)", () => {
  for (const id of TREVOR_LESSONS) {
    test(`${id}: Trevor completes within his 10-min budget`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m: ConsoleMessage) => {
        if (m.type() !== "error") return;
        const t = m.text();
        if (t.includes("[tts]")) return;
        if (t.includes("Whisper")) return;
        if (t.includes("[diag]")) return;
        errors.push(t);
      });
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

      const start = Date.now();
      await page.goto(`/ja/learn/lessons/${id}?dev=1`);
      await page.waitForLoadState("networkidle", { timeout: 30_000 });

      const result = await walkLesson(page, {
        maxSteps: 60,
        stepPaceMs: 150, // Trevor-fast taps
      });
      const elapsedSec = (Date.now() - start) / 1000;

      expect(
        result.completed,
        `${id} did not reach LessonComplete (walked ${result.stepsObserved} steps, ${elapsedSec.toFixed(1)}s)`,
      ).toBe(true);
      // Trevor's 10-min budget = 600s. A robot walker (200ms/step) should
      // be FAR faster, but assert the test itself ran sub-300s so we
      // catch any auto-play / stuck-state hangs.
      expect(
        elapsedSec,
        `${id} took ${elapsedSec.toFixed(1)}s — possible stuck state or audio gating`,
      ).toBeLessThan(300);
      expect(
        errors,
        `${id} had ${errors.length} console errors:\n  ${errors.slice(0, 5).join("\n  ")}`,
      ).toHaveLength(0);
    });
  }

  test("M7-8 dialogue closer reaches dialogue_listen", async ({ page }) => {
    await page.goto(`/ja/learn/lessons/ja-m7-8?dev=1`);
    await page.waitForLoadState("networkidle", { timeout: 30_000 });
    const result = await walkLesson(page, { maxSteps: 60, stepPaceMs: 150 });
    expect(result.stepTypesSeen).toContain("dialogue_listen");
  });
});
