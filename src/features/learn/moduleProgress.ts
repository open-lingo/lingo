import type { Course, CourseModule } from "@/shared/domain/course";
import { ALL_ROWS } from "@/features/lesson/data/hiraganaCurriculum";
import { getAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";

export type ModuleStatus = "completed" | "current" | "locked";

/** Module-level display metadata. Content modules get a 1-indexed
 *  position ("M1", "M2", ...); review modules render as "R" and are
 *  skipped in the content-module count so M3 stays M3 even after an
 *  m3-review entry is inserted between m3 and m4. The 2026-05-17
 *  Spencer report "labeled wrong and I can't access them" traced to
 *  the old code passing array index as the badge number.
 */
export type ModuleDisplay = {
  badgeLabel: string;
  isReview: boolean;
  /** 1-indexed content-module number (m1 = 1, m2 = 2, ...). null for
   *  review modules — they don't get a numbered slot. */
  contentNumber: number | null;
  /** Text for the "After Module N" gate pill — the previous content
   *  module's 1-indexed number rendered as "Module N", or null when
   *  this is the first module (no prerequisite). */
  gateAfterLabel: string | null;
};

function isReviewModule(mod: CourseModule): boolean {
  return mod.eyebrow === "Review";
}

export function getModuleDisplay(
  modules: CourseModule[],
  index: number,
): ModuleDisplay {
  let contentCountUpTo = 0;
  let contentCountBefore = 0;
  for (let i = 0; i <= index; i++) {
    if (!isReviewModule(modules[i])) contentCountUpTo++;
  }
  for (let i = 0; i < index; i++) {
    if (!isReviewModule(modules[i])) contentCountBefore++;
  }
  const review = isReviewModule(modules[index]);
  const contentNumber = review ? null : contentCountUpTo;
  return {
    badgeLabel: review ? "R" : `M${contentNumber}`,
    isReview: review,
    contentNumber,
    gateAfterLabel:
      contentCountBefore > 0 ? `Module ${contentCountBefore}` : null,
  };
}

// Matches old-course review ids (ja-m3-review-1) and the rewrite-spine
// pilot's (ja-m3-neo-review) — review lessons never gate module unlock.
const REVIEW_LESSON_RE = /^(?:ja|ko)-m\d+(?:-neo)?-review(?:-\d+)?$/;

function isContentLesson(lesson: { id: string }): boolean {
  return !REVIEW_LESSON_RE.test(lesson.id);
}

/** Derive module status from completion (linear: complete previous to unlock next).
 *  Review lessons (SRS practice) don't gate module progression — only content
 *  sub-lessons count toward the unlock chain. */
export function getModuleStatus(
  moduleIndex: number,
  completedLessonIds: ReadonlySet<string>,
  modules: CourseModule[]
): ModuleStatus {
  // comingSoon modules (rewrite-spine placeholders with no lessons) are
  // always locked — an empty lessons array would otherwise read as
  // vacuously "completed" via .every() and unlock everything after it.
  if (modules[moduleIndex]?.comingSoon) return "locked";
  if (moduleIndex === 0) {
    const mod = modules[0];
    const allDone = mod.lessons.filter(isContentLesson).every((l) => completedLessonIds.has(l.id));
    return allDone ? "completed" : "current";
  }
  const prevMod = modules[moduleIndex - 1];
  const prevAllDone = prevMod.lessons.filter(isContentLesson).every((l) => completedLessonIds.has(l.id));
  if (!prevAllDone) return "locked";
  const mod = modules[moduleIndex];
  const allDone = mod.lessons.filter(isContentLesson).every((l) => completedLessonIds.has(l.id));
  return allDone ? "completed" : "current";
}

/** Index of the current module (first with incomplete lessons, or last if all done). */
export function getCurrentModuleIndex(
  course: Course,
  completedLessonIds: ReadonlySet<string>
): number {
  for (let i = 0; i < course.modules.length; i++) {
    const mod = course.modules[i];
    const allDone = mod.lessons.every((l) => completedLessonIds.has(l.id));
    if (!allDone) return i;
  }
  return Math.max(0, course.modules.length - 1);
}

/** Index of the next incomplete lesson within a module, or last index if all done. */
export function getNextLessonIndex(
  lessons: { id: string }[],
  completedIds: ReadonlySet<string>
): number {
  const i = lessons.findIndex((l) => !completedIds.has(l.id));
  return i >= 0 ? i : Math.max(0, lessons.length - 1);
}

/** Slice a lesson list to show a contextual window around the "current" lesson. */
export function getLessonWindow<T>(
  items: T[],
  currentIndex: number,
  windowSize: number
): { items: T[]; startIndex: number; hasMoreBefore: boolean; hasMoreAfter: boolean } {
  if (items.length <= windowSize) {
    return { items: [...items], startIndex: 0, hasMoreBefore: false, hasMoreAfter: false };
  }
  // Center on current: show (windowSize-1)/2 before and after
  const half = Math.floor(windowSize / 2);
  let start = Math.max(0, currentIndex - half);
  const end = Math.min(items.length, start + windowSize);
  if (end - start < windowSize) {
    start = Math.max(0, end - windowSize);
  }
  return {
    items: items.slice(start, end),
    startIndex: start,
    hasMoreBefore: start > 0,
    hasMoreAfter: end < items.length,
  };
}

/**
 * Resolve the row id this lesson belongs to, if it's a curriculum row
 * sub-lesson (`ja-m{N}-{rowId}-{suffix}`). Row ids may themselves contain
 * hyphens (`da-ba`, `yoon-sh-ch`) so we strip the trailing
 * `-(\d+|test|recap)` suffix and check against the catalog.
 */
function rowIdForLessonId(lessonId: string): string | null {
  const m = /^ja-m\d+-(.+)$/.exec(lessonId);
  if (!m) return null;
  let tail = m[1];
  const sub = /^(.+)-(\d+|test|recap)$/.exec(tail);
  if (sub) tail = sub[1];
  if (ALL_ROWS.some((r) => r.id === tail)) return tail;
  return null;
}

/**
 * Whether every sub-lesson of `prereqRowId` is in `completedLessonIds`.
 * Lessons follow `ja-m{N}-{rowId}-{suffix}` shape with rowId potentially
 * carrying hyphens.
 */
function isRowFullyComplete(
  prereqRowId: string,
  completedLessonIds: ReadonlySet<string>,
): boolean {
  const row = ALL_ROWS.find((r) => r.id === prereqRowId);
  if (!row) return true; // unknown prereq — fail open
  const subs = row.subLessons ?? [];
  if (subs.length === 0) {
    // Legacy single-lesson row.
    return completedLessonIds.has(`ja-m1-${row.id}`);
  }
  for (const sub of subs) {
    if (!completedLessonIds.has(`ja-m1-${row.id}-${sub.suffix}`)) return false;
  }
  return true;
}

/** Whether a lesson is effectively locked (module or lesson-level lock).
 *
 * Dev-mode override: when `devUnlock` is true (set via the dev panel on
 * the learn page or `?dev=1` in the URL), every lesson is treated as
 * unlocked regardless of completion state. Used for screenshot runs and
 * authoring spot-checks.
 *
 * Row-prereq override: even if the module is unlocked AND the previous
 * lesson is complete, a row's `prerequisites` (e.g. yōon → ya-row) must
 * all be fully complete first. Per curriculum-restructure 2026-05-15.
 */
export function isLessonLocked(
  lessonId: string,
  moduleIndex: number,
  course: Course,
  completedLessonIds: ReadonlySet<string>,
  devUnlock: boolean = false,
): boolean {
  if (devUnlock) return false;
  const status = getModuleStatus(moduleIndex, completedLessonIds, course.modules);
  if (status === "locked") return true;
  const mod = course.modules[moduleIndex];
  const lessonIndex = mod.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex < 0) return true;
  // Within module: lock if previous lesson not completed
  for (let i = 0; i < lessonIndex; i++) {
    if (!completedLessonIds.has(mod.lessons[i].id)) return true;
  }
  // Row-level prerequisites (e.g. ya-row → yōon).
  const rowId = rowIdForLessonId(lessonId);
  if (rowId) {
    const row = ALL_ROWS.find((r) => r.id === rowId);
    const prereqs = row?.prerequisites ?? [];
    for (const prereqRowId of prereqs) {
      if (!isRowFullyComplete(prereqRowId, completedLessonIds)) return true;
    }
  }
  // M5 soft-gate (curriculum-design-v2, 2026-05-16):
  //   When M5 lessons exist, the FIRST lesson of M5 should also require
  //   katakana practice completion. M3 introduces katakana as a SYSTEM
  //   only; learners are expected to do the standalone katakana drill at
  //   /:lang/practice/alphabet/katakana before M5 unlocks.
  //
  // The gate check belongs here, just before `return false`:
  //
  //   const isM5FirstLesson =
  //     course.modules[moduleIndex]?.id === "m5" && lessonIndex === 0;
  //   if (isM5FirstLesson && !isKatakanaPracticeComplete()) return true;
  //
  // M5 doesn't exist yet (placeholder `comingSoon: true`), so the check
  // is intentionally absent. Add it when M5 lessons are authored.
  return false;
}

/**
 * Soft mastery check used by the M5 unlock gate (curriculum-design-v2
 * 2026-05-16, Spencer's call: katakana introduced as a SYSTEM in M3, then
 * deliberate practice is M5's prerequisite).
 *
 * Returns true when the learner has passed the full-katakana test in the
 * standalone `/:lang/practice/alphabet/katakana` flow — same persistence
 * the alphabet learner already uses (`getAlphabetProgress("ja",
 * "katakana")?.fullTestPassed`).
 *
 * SSR-safe: returns false if localStorage is unavailable.
 */
export function isKatakanaPracticeComplete(): boolean {
  if (typeof localStorage === "undefined") return false;
  try {
    return getAlphabetProgress("ja", "katakana")?.fullTestPassed === true;
  } catch {
    return false;
  }
}
