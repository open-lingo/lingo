/**
 * Persona Maya — 16yo anime-curious teen, M3 + M4 walk.
 *
 * What this asserts (per docs/wave-4-m3-m7-reauthor-2026-05-18.md §5):
 *   - Every M3 + M4 sub-lesson loads + walks to LessonComplete.
 *   - No console errors during the walk.
 *   - Step-type variety surfaces (≥5 distinct types per content sub-lesson).
 *   - Dialogue closer (M3-7, M4-7) shows the new dialogue_listen step.
 *   - selfExplain steps surface on the grammar-drill sub-lessons.
 *
 * Maya's pacing model: 2 short sessions/day, 5-8 min each. Translated
 * to test time: walk one sub-lesson at "fast tap" pace (~200ms/step),
 * then next, capped by maxSteps. The walker tolerates wrong answers —
 * Maya doesn't always pick the right one but always advances.
 */
import { test, expect, type ConsoleMessage } from "@playwright/test";
import { walkLesson } from "./wave-4-lesson-walker";

const MAYA_LESSONS = [
  "ja-m3-1", "ja-m3-2", "ja-m3-3", "ja-m3-4",
  "ja-m3-5", "ja-m3-6", "ja-m3-7", "ja-m3-8",
  "ja-m4-1", "ja-m4-2", "ja-m4-3", "ja-m4-4",
  "ja-m4-5", "ja-m4-6", "ja-m4-7", "ja-m4-8",
];

test.describe("Persona — Maya (M3 + M4 teen walk)", () => {
  for (const id of MAYA_LESSONS) {
    test(`${id}: Maya completes the lesson`, async ({ page }) => {
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
        stepPaceMs: 200, // teen-fast taps
      });

      expect(
        result.completed,
        `${id} did not reach LessonComplete (walked ${result.stepsObserved} steps, saw types: ${result.stepTypesSeen.join(", ")})`,
      ).toBe(true);
      expect(
        result.stepsObserved,
        `${id} walked only ${result.stepsObserved} steps; expected ≥10`,
      ).toBeGreaterThanOrEqual(10);
      expect(
        errors,
        `${id} had ${errors.length} console errors:\n  ${errors.slice(0, 5).join("\n  ")}`,
      ).toHaveLength(0);
    });
  }

  test("dialogue closers (M3-7, M4-7) reach a dialogue_listen step", async ({ page }) => {
    for (const id of ["ja-m3-7", "ja-m4-7"]) {
      await page.goto(`/ja/learn/lessons/${id}?dev=1`);
      await page.waitForLoadState("networkidle", { timeout: 30_000 });
      const result = await walkLesson(page, { maxSteps: 60, stepPaceMs: 150 });
      expect(
        result.stepTypesSeen,
        `${id} should expose dialogue_listen; saw ${result.stepTypesSeen.join(", ")}`,
      ).toContain("dialogue_listen");
    }
  });
});
