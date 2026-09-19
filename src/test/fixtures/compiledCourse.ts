/**
 * ONE course walk, shared by every read-only content gate/report test.
 *
 * TESTAUDIT lane, 2026-09-18 (docs/testaudit-2026-09-18.md, decision 1).
 * The top-10 CPU test files (296s of the suite's 684s summed file time)
 * each independently call `getAvailableMockLessonIds()` +
 * `getMockLessonContent(id)` for every lesson in the course — often more
 * than once per file — to check a DIFFERENT invariant over the SAME
 * derived data (kanji substitution, tile floors, atom attribution, answer
 * collisions, sentence reuse, distractor audits…). None of them mutate
 * content or progress; they only read it. This fixture derives that walk
 * ONCE per worker and every consumer reads the same cached array.
 *
 * Why this can't just live inside `getMockLessonContent` itself (the
 * natural-looking seam): that function's review-tail augmentation reads
 * LIVE progress state (`getMockCompletedLessonIds()` via
 * `augmentWithReviewTail` in mockLessons.ts) and is legitimately expected
 * to return different content for the same lesson id as progress changes
 * — real callers (and some tests elsewhere) rely on that. Caching it
 * unconditionally at the production seam would be a silent behavior
 * change for every caller, not just these tests. This fixture instead
 * pins a clean, empty-progress baseline once (`clearMockProgress()`) and
 * freezes the walk from there — correct for every consumer here because
 * none of the merged gates are progress-sensitive (verified 2026-09-18:
 * zero `markLessonCompleted`/`devMarkLessonsCompleted` calls anywhere
 * under `src/features/languages/**` test files).
 *
 * `curriculum` (vite.config.ts) runs `isolate: false`, so this
 * module-level cache is shared across every test FILE in a worker, not
 * just within one file — the memoization survives the file boundary,
 * which is the whole point. `getCompiledCourse()`'s `it` in
 * courseSweep.test.ts proves this with `__compiledCourseBuildCount()`.
 */
import {
  getAvailableMockLessonIds,
  getMockLessonContent,
} from "@/features/lesson/data/mockLessons";
import { clearMockProgress } from "@/shared/domain/mockProgress";
import type { LessonContent } from "@/features/lesson/types";

export type CompiledLesson = { id: string; content: LessonContent };

let allLessons: CompiledLesson[] | null = null;
let buildCount = 0;

/**
 * The whole compiled course (every language), derived once and cached for
 * the rest of the worker's life. Order matches `getAvailableMockLessonIds()`
 * (registration order) — callers that walked `getMockCourse(lang).modules`
 * directly before may see a different but EQUIVALENT-content ordering;
 * none of the ported predicates below are order-sensitive (they bucket,
 * filter, or sum, and the one that IS order-sensitive —
 * `sentenceReuseSpacing`'s "recent lessons" window — walks per-module
 * lesson order explicitly, not this flat list; see that section).
 */
export function getCompiledCourse(): CompiledLesson[] {
  if (allLessons) return allLessons;
  buildCount += 1;
  clearMockProgress();
  const built: CompiledLesson[] = [];
  for (const id of getAvailableMockLessonIds()) {
    const content = getMockLessonContent(id);
    if (content) built.push({ id, content });
  }
  allLessons = built;
  return allLessons;
}

/** Convenience: only lessons for one language (matches `LessonContent.languageId`). */
export function getCompiledCourseFor(languageId: string): CompiledLesson[] {
  return getCompiledCourse().filter((l) => l.content.languageId === languageId);
}

/** `id -> content` lookup over the same cached walk — for call sites that
 *  used to loop `getMockCourse(lang).modules[].lessons` and look up each
 *  lesson id individually (buildTileFloor, matchPairsPairCount,
 *  glossBeforeProduction keep their own module/lesson-order loop for
 *  readability and just resolve content through this map instead of a
 *  fresh `getMockLessonContent` call). */
export function getCompiledCourseMap(): ReadonlyMap<string, LessonContent> {
  const map = new Map<string, LessonContent>();
  for (const l of getCompiledCourse()) map.set(l.id, l.content);
  return map;
}

/** Test-only escape hatch: how many times the real walk actually ran.
 *  Should be 1 for an entire worker's run no matter how many files/`it`s
 *  call the getters above — see the "memoization proof" test in
 *  courseSweep.test.ts. Not for production code. */
export function __compiledCourseBuildCount(): number {
  return buildCount;
}

/** Test-only: force a rebuild on next access. No production/CI caller
 *  needs this; it exists so a test file can prove the cache is doing
 *  something (compare a fresh build's output to the cached one) without
 *  polluting the shared cache other files rely on afterward — always
 *  restore with another `__resetCompiledCourseForTests()` call bracketed
 *  by a fresh `getCompiledCourse()` if a test does this. */
export function __resetCompiledCourseForTests(): void {
  allLessons = null;
}
