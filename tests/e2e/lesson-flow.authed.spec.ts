/**
 * Lesson player smoke — start-to-finish step walk.
 *
 * Drives a real, currently-registered lesson through its steps with the
 * shared `walkLesson` harness, tapping a plausible answer on each and
 * clicking Continue, asserting the player renders and advances every step
 * type it hits WITHOUT a console error or a crash.
 *
 * Why bounded rather than "reach LessonComplete": JA lessons gate every
 * teach card behind a mandatory 1.5–5s read timer AND grow an adaptive
 * review tail when answers are wrong — and this blind walker taps the
 * first option, so it answers wrong often. A full completion walk is
 * therefore both slow (minutes of read-gates) and effectively unbounded
 * (the review tail keeps regrowing). So this smoke asserts robust,
 * error-free forward progress across many step TYPES — the signal that
 * matters for "does the lesson player still work end to end" — and caps
 * the walk so it stays a fast CI check. `completed` is recorded when a
 * short lesson does finish, but is not required.
 *
 * Follow-up to make this a true completion walk: mock the read-gate timer
 * (Playwright `page.clock`) and feed an answer key so the walker answers
 * correctly and the review tail drains. Tracked in the QA bug report.
 *
 * NOTE: the persona-*.authed.spec.ts suites are STALE — they navigate to
 * the pre-restructure flat module IDs (`ja-mN-K`), which now 404 as
 * "Lesson not found". Real playable lessons are the sub-lesson IDs
 * (`ja-mN-K-S`) used below. Those suites need an ID refresh (noted in the
 * report); the walker fixes here already make them driveable once reIDed.
 */
import { test, expect, type ConsoleMessage } from "@playwright/test";
import { walkLesson } from "./wave-4-lesson-walker";

// Real registered sub-lesson IDs (see mockLessons.ts LESSON_REGISTRY).
// Chosen exercise-forward (not teach-card heavy) so the bounded walk
// traverses varied step types quickly. Read-gate-dense intro sub-lessons
// (e.g. ja-m3-1-1, ja-m4-2-1) spend the whole budget on mandatory 5s read
// timers — walking those to completion needs `page.clock` gate-mocking
// (see the follow-up note above), so they're intentionally excluded here.
const LESSONS = ["ja-m4-1-1"];

test.describe("Lesson player — step walk", () => {
  for (const id of LESSONS) {
    test(`${id}: advances through many step types with no console errors`, async ({ page }) => {
      test.setTimeout(120_000);
      const errors: string[] = [];
      page.on("console", (m: ConsoleMessage) => {
        if (m.type() !== "error") return;
        const t = m.text();
        // TTS / speech / diagnostic / haptics noise is expected headless.
        if (t.includes("[tts]") || t.includes("Whisper") || t.includes("[diag]")) return;
        if (t.includes("navigator.vibrate") || t.includes("vibrate")) return;
        errors.push(t);
      });
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

      await page.goto(`/ja/learn/lessons/${id}?dev=1`);
      await page.waitForLoadState("networkidle", { timeout: 30_000 });

      // Bounded walk — enough to traverse the lesson's opening arc across
      // several distinct step types, fast enough for CI.
      const result = await walkLesson(page, { maxSteps: 25, stepPaceMs: 40 });

      const distinctTypes = new Set(
        result.stepTypesSeen.filter((t) => t && t !== "unknown"),
      );

      expect(
        result.stepsObserved,
        `${id} advanced only ${result.stepsObserved} steps; the player is not walking`,
      ).toBeGreaterThanOrEqual(12);
      expect(
        result.stepTypesSeen.length,
        `${id} observed no steps`,
      ).toBeGreaterThan(0);
      expect(
        errors,
        `${id} had ${errors.length} console error(s):\n  ${errors.slice(0, 5).join("\n  ")}`,
      ).toHaveLength(0);

      // Informational: surfaces coverage without failing on it.
      // eslint-disable-next-line no-console
      console.log(
        `[lesson-smoke] ${id}: ${result.stepsObserved} steps, ` +
          `${distinctTypes.size} distinct types (${[...distinctTypes].join(", ")}), ` +
          `completed=${result.completed}, ${Math.round(result.elapsedMs / 1000)}s`,
      );
    });
  }
});
