import type { Lesson } from "@/shared/domain/course";

/** Shape returned by `getNextLesson(course)` — re-exported for prop typing. */
export type NextLessonInfo = {
  module: string;
  lesson: {
    id: string;
    title: string;
    kind?: Lesson["kind"];
    alphabetId?: string;
  };
};
