import type { Course } from "@/core/course";

/**
 * First available (non-locked) lesson in the course, for "Continue learning" CTA.
 */
export function getNextLesson(course: Course): { module: string; lesson: { id: string; title: string } } | null {
  for (const mod of course.modules) {
    const available = mod.lessons.find((l) => l.status !== "locked");
    if (available) {
      return { module: mod.title, lesson: { id: available.id, title: available.title } };
    }
  }
  return null;
}
