import type { Course, CourseModule } from "@/shared/domain/course";

export type ModuleStatus = "completed" | "current" | "locked";

/** Derive module status from completion (linear: complete previous to unlock next). */
export function getModuleStatus(
  moduleIndex: number,
  completedLessonIds: Set<string>,
  modules: CourseModule[]
): ModuleStatus {
  if (moduleIndex === 0) {
    const mod = modules[0];
    const allDone = mod.lessons.every((l) => completedLessonIds.has(l.id));
    return allDone ? "completed" : "current";
  }
  const prevMod = modules[moduleIndex - 1];
  const prevAllDone = prevMod.lessons.every((l) => completedLessonIds.has(l.id));
  if (!prevAllDone) return "locked";
  const mod = modules[moduleIndex];
  const allDone = mod.lessons.every((l) => completedLessonIds.has(l.id));
  return allDone ? "completed" : "current";
}

/** Index of the current module (first with incomplete lessons, or last if all done). */
export function getCurrentModuleIndex(
  course: Course,
  completedLessonIds: Set<string>
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
  completedIds: Set<string>
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

/** Whether a lesson is effectively locked (module or lesson-level lock).
 *
 * Dev-mode override: when `devUnlock` is true (set via the dev panel on
 * the learn page or `?dev=1` in the URL), every lesson is treated as
 * unlocked regardless of completion state. Used for screenshot runs and
 * authoring spot-checks.
 */
export function isLessonLocked(
  lessonId: string,
  moduleIndex: number,
  course: Course,
  completedLessonIds: Set<string>,
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
  return false;
}
