/**
 * Persona Devon — 32yo returning adult after 7-day gap. M5 walk.
 *
 * Devon's profile (from docs/m3-m7-audit-synthesis-2026-05-18.md §1 +
 * docs/user-feedback/2026-05-18-tester-m1-m2-walkthrough.md):
 *   - Kana ~60% post-break; romaji-anchored.
 *   - 10-15 min sessions, deliberate.
 *   - Goal: handle ordering food + basic logistics on a Japan trip.
 *   - Expects re-entry warm-up.
 *
 * What this asserts:
 *   - Every M5 sub-lesson completes for Devon (he can finish even with
 *     wobbly recall — the curriculum must not gate on perfection).
 *   - The café (M5-4 / M5-7) + transactional steps land — his goal hook.
 *   - Counter words (M5-3 人 + generic counters) re-surface within M5
 *     (wave 4B should have collapsed the previous one-and-done duplicates).
 */
import { test, expect, type ConsoleMessage } from "@playwright/test";
import { walkLesson } from "./wave-4-lesson-walker";

const DEVON_LESSONS = [
  "ja-m5-1", "ja-m5-2", "ja-m5-3", "ja-m5-4",
  "ja-m5-5", "ja-m5-6", "ja-m5-7", "ja-m5-8",
];

test.describe.skip("Persona — Devon (M5 returning-user walk)", () => {
  for (const id of DEVON_LESSONS) {
    test(`${id}: Devon completes the lesson`, async ({ page }) => {
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

      await page.goto(`/ja/learn/lessons/${id}?dev=1`);
      await page.waitForLoadState("networkidle", { timeout: 30_000 });

      const result = await walkLesson(page, {
        maxSteps: 60,
        stepPaceMs: 350, // adult-deliberate pace
      });

      expect(
        result.completed,
        `${id} did not reach LessonComplete (walked ${result.stepsObserved} steps)`,
      ).toBe(true);
      // Devon needs density to feel the cumulative-review payoff. Per
      // the wave-4 standard 20-22 steps per sub-lesson, walked-step
      // count should be ≥15 (a Devon who skips speaking still hits 15+).
      expect(
        result.stepsObserved,
        `${id} walked only ${result.stepsObserved} steps; expected ≥15 (post wave-4 density)`,
      ).toBeGreaterThanOrEqual(15);
      expect(
        errors,
        `${id} had ${errors.length} console errors:\n  ${errors.slice(0, 5).join("\n  ")}`,
      ).toHaveLength(0);
    });
  }

  test("M5-7 café dialogue lands the dialogue_listen step (Devon's goal hook)", async ({ page }) => {
    await page.goto(`/ja/learn/lessons/ja-m5-7?dev=1`);
    await page.waitForLoadState("networkidle", { timeout: 30_000 });
    const result = await walkLesson(page, { maxSteps: 60, stepPaceMs: 250 });
    expect(
      result.stepTypesSeen,
      `M5-7 should expose dialogue_listen; saw ${result.stepTypesSeen.join(", ")}`,
    ).toContain("dialogue_listen");
  });
});
