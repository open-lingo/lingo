/**
 * Module mastery (★) — Task #84.
 *
 * A module is "mastered" (★) when:
 *   1. Every sub-lesson in the module is in `completedLessonIds`, AND
 *   2. Every row-test sub-lesson in the module was completed WITHOUT
 *      being skipped (i.e. its LessonCompletion.wasSkipped === false /
 *      undefined).
 *
 * Per-row test mastery is granular: the yōon-capstone does NOT grant
 * retroactive mastery for the four prior yōon rows; each row's own
 * row-test must be completed un-skipped.
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
 * Look-up function for whether a given lesson's row-test was passed
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
 * A row-test lesson's id ends in `-test` (e.g. `ja-m1-ka-test`). Recap
 * and capstone lessons also contain `row_test` steps but don't count
 * toward per-row mastery — the id suffix is the authoritative signal.
 */
function isRowTestLesson(lessonId: string): boolean {
  if (!lessonId.endsWith("-test")) return false;
  const content = getMockLessonContent(lessonId);
  return content?.steps.some((s) => s.type === "row_test") ?? false;
}

/** Return ids of every row-test lesson in the module, in module order. */
export function getRowTestLessonIds(module: CourseModule): string[] {
  return module.lessons.filter((l) => isRowTestLesson(l.id)).map((l) => l.id);
}

export type ModuleMastery = {
  /** Row-tests passed (completed without `wasSkipped`). */
  passed: number;
  /** Total row-tests in the module. */
  total: number;
  /** True iff all sub-lessons complete AND `passed === total`. */
  mastered: boolean;
};

/**
 * Compute mastery for a module.
 *
 * - `total === 0` (module with no row-tests, e.g. vowels-only module) is
 *   auto-mastered once all sub-lessons complete.
 * - When any sub-lesson is incomplete, `mastered` is `false` regardless
 *   of how many row-tests have been passed.
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
 * Of the row-test lessons in `module`, return those NOT yet mastered
 * (either not completed, or completed via skip). Used by callout copy
 * to nudge "you still have 2 row tests to ace for ★".
 */
export function getMissingMasteryTests(
  module: CourseModule,
  completedSet: ReadonlySet<string>,
  isPassedFn: IsRowTestPassedFn = isRowTestPassed,
): Lesson[] {
  return module.lessons.filter((l) => {
    if (!isRowTestLesson(l.id)) return false;
    if (!completedSet.has(l.id)) return true;
    return !isPassedFn(l.id);
  });
}
