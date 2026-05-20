import type { Course, Lesson } from "@/shared/domain/course";

/**
 * First non-locked, non-completed lesson in the course, for "Continue lesson" CTA.
 * Falls back to the first non-locked lesson if every visible lesson is complete
 * (course-finished state — caller decides what to render).
 *
 * `completedIds` is optional so existing callers that don't track progress
 * still get the legacy behavior (first non-locked).
 */
export function getNextLesson(
  course: Course,
  completedIds?: Iterable<string>,
): {
  module: string;
  lesson: { id: string; title: string; kind?: Lesson["kind"]; alphabetId?: string };
} | null {
  const completed = completedIds ? new Set(completedIds) : null;
  for (const mod of course.modules) {
    const next = mod.lessons.find(
      (l) => l.status !== "locked" && (!completed || !completed.has(l.id)),
    );
    if (next) {
      return {
        module: mod.title,
        lesson: {
          id: next.id,
          title: next.title,
          kind: next.kind,
          alphabetId: next.alphabetId,
        },
      };
    }
  }
  // Fallback: every non-locked lesson is complete. Return the very first
  // non-locked so the CTA still has somewhere to go (replay).
  for (const mod of course.modules) {
    const first = mod.lessons.find((l) => l.status !== "locked");
    if (first) {
      return {
        module: mod.title,
        lesson: {
          id: first.id,
          title: first.title,
          kind: first.kind,
          alphabetId: first.alphabetId,
        },
      };
    }
  }
  return null;
}
