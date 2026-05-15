/**
 * Generated hiragana lessons. Pure module-level evaluation —
 * `buildRowLesson` walks the curriculum catalog once at import time and
 * exposes the resulting `LessonContent` instances by id.
 *
 * Adding a row = add it to `hiraganaCurriculum.ts`. No code changes here.
 */
import type { LessonContent } from "../types";
import { ALL_ROWS } from "./hiraganaCurriculum";
import { buildRowLesson } from "./lessonBuilder";

export const GENERATED_HIRAGANA_LESSONS: Record<string, LessonContent> = (() => {
  const map: Record<string, LessonContent> = {};
  ALL_ROWS.forEach((row, idx) => {
    const lesson = buildRowLesson(row, idx + 2);
    map[lesson.id] = lesson;
  });
  return map;
})();

/** Ordered ids matching the row catalog (for course module wiring). */
export const GENERATED_HIRAGANA_LESSON_IDS: string[] = ALL_ROWS.map(
  (r) => `ja-m1-${r.id}`,
);
