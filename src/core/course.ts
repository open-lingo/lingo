/** Lesson within a module (mock shape; real API may differ). */
export type Lesson = {
  id: string;
  title: string;
  /** e.g. "locked" | "completed" | "available" */
  status?: string;
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
