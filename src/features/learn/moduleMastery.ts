/**
 * Module mastery (★) — Task #84.
 *
 * A module is "mastered" (★) when:
 *   1. Every sub-lesson in the module is in `completedLessonIds`, AND
 *   2. Every mastery-gate lesson in the module was completed WITHOUT
 *      being skipped (i.e. its LessonCompletion.wasSkipped === false /
 *      undefined).
 *
 * A mastery-gate lesson is one that contains a `row_test` step AND whose
 * id ends in `-test` OR `-recap`:
 *   - Kana modules (M1/M2) no longer ship per-row row-tests — they were
 *     retired 2026-07-20. Their single gate is the module recap
 *     (`ja-m1-recap` / `ja-m2-recap`), which runs the same `row_test`
 *     step. Acing the recap (un-skipped) is what grants ★.
 *   - Grammar modules (e.g. M3) gate on their mastery test
 *     (`ja-m3-8-test`), which has no recap.
 *
 * Backward-compat: pre-feature completion records have no `wasSkipped`
 * field. They're treated as `false` (= passed) so users mid-flight
 * don't lose mastery on existing completions.
 */
import type { CourseModule, Lesson } from "@/shared/domain/course";
import {
  getLessonCompletion,
  type LessonCompletion,
} from "@/shared/domain/mockProgress";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";

/**
 * Kept for future use — review-tail mechanics enforce all-correct at the
 * runtime queue level, so there's no separate grader threshold today.
 * If a non-review-tail grader is reintroduced later, `1.0` is the
 * mastery bar (every item correct).
 */
export const MASTERY_PASS_THRESHOLD = 1.0;

/**
 * Look-up function for whether a given mastery-gate lesson was passed
 * un-skipped. Injectable for testing so callers can avoid touching
 * localStorage. The default reads from the live completion store.
 */
export type IsRowTestPassedFn = (lessonId: string) => boolean;

/** Default implementation — backed by the live completion store. */
export function isRowTestPassed(lessonId: string): boolean {
  const rec = getLessonCompletion(lessonId);
  return isCompletionPassed(rec);
}

function isCompletionPassed(rec: LessonCompletion | null): boolean {
  if (!rec) return false;
  // Missing `wasSkipped` on a legacy record counts as passed.
  return rec.wasSkipped !== true;
}

/**
 * A mastery-gate lesson contains a `row_test` step AND its id ends in
 * `-test` or `-recap`:
 *   - `-test`  → a grammar-module mastery test (e.g. `ja-m3-8-test`).
 *   - `-recap` → a kana-module recap (`ja-m1-recap` / `ja-m2-recap`),
 *     now the only graded checkpoint in M1/M2 after per-row row-tests
 *     were retired.
 * The id suffix is the authoritative signal; the `row_test` step check
 * keeps ordinary review/story lessons out.
 */
function isMasteryTestLesson(lessonId: string): boolean {
  if (!(lessonId.endsWith("-test") || lessonId.endsWith("-recap"))) {
    return false;
  }
  const content = getMockLessonContent(lessonId);
  return content?.steps.some((s) => s.type === "row_test") ?? false;
}

/** Return ids of every mastery-gate lesson in the module, in module order. */
export function getRowTestLessonIds(module: CourseModule): string[] {
  return module.lessons
    .filter((l) => isMasteryTestLesson(l.id))
    .map((l) => l.id);
}

export type ModuleMastery = {
  /** Mastery gates passed (completed without `wasSkipped`). */
  passed: number;
  /** Total mastery gates in the module. */
  total: number;
  /** True iff all sub-lessons complete AND `passed === total`. */
  mastered: boolean;
};

/**
 * Compute mastery for a module.
 *
 * - `total === 0` (module with no mastery gate, e.g. a vowels-only stub)
 *   is auto-mastered once all sub-lessons complete.
 * - When any sub-lesson is incomplete, `mastered` is `false` regardless
 *   of how many gates have been passed.
 */
export function getModuleMastery(
  module: CourseModule,
  completedSet: ReadonlySet<string>,
  isPassedFn: IsRowTestPassedFn = isRowTestPassed,
): ModuleMastery {
  const testIds = getRowTestLessonIds(module);
  const total = testIds.length;
  let passed = 0;
  for (const id of testIds) {
    if (!completedSet.has(id)) continue;
    if (isPassedFn(id)) passed++;
  }
  const allSubDone = module.lessons.every((l) => completedSet.has(l.id));
  const mastered = allSubDone && passed === total;
  return { passed, total, mastered };
}

/**
 * Of the mastery-gate lessons in `module`, return those NOT yet mastered
 * (either not completed, or completed via skip). Used by callout copy to
 * nudge "ace the recap to master this module" (kana) or "you still have N
 * mastery tests to ace for ★" (grammar).
 */
export function getMissingMasteryTests(
  module: CourseModule,
  completedSet: ReadonlySet<string>,
  isPassedFn: IsRowTestPassedFn = isRowTestPassed,
): Lesson[] {
  return module.lessons.filter((l) => {
    if (!isMasteryTestLesson(l.id)) return false;
    if (!completedSet.has(l.id)) return true;
    return !isPassedFn(l.id);
  });
}
