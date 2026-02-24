/** Lesson within a module (mock shape; real API may differ). */
export type Lesson = {
  id: string;
  title: string;
  /** e.g. "locked" | "completed" | "available" */
  status?: string;
  /** Card IDs introduced by this lesson (for course-linked decks). Unlocked when lesson is completed. */
  introducesCardIds?: string[];
  /** When "alphabet", this row links to the alphabet learner instead of learn/lessons/:id. */
  kind?: "lesson" | "alphabet";
  /** For kind "alphabet": alphabet id for route practice/alphabet/:alphabetId/learn */
  alphabetId?: string;
};

/** Module groups lessons (mock shape). */
export type CourseModule = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  languageId: string;
  modules: CourseModule[];
};
