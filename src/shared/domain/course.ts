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

/** Gradient endpoints used to paint the module-card banner. */
export type ModuleAccent = {
  from: string; // CSS color (e.g. "#059669")
  to: string; // CSS color (e.g. "#047857")
};

/** Module groups lessons (mock shape). */
export type CourseModule = {
  id: string;
  title: string;
  lessons: Lesson[];
  /** Short eyebrow line shown above the module title in the pathway UI. */
  eyebrow?: string;
  /** Optional subtitle / summary shown in the preview body. */
  summary?: string;
  /** Gradient endpoints for the banner header. */
  accent?: ModuleAccent;
  /** Future module: shows placeholder UI, no clickable lessons. */
  comingSoon?: boolean;
};

/** Bonus / interest-driven side quests shown in the right rail. */
export type SideQuest = {
  id: string;
  title: string;
  emoji: string;
  /** Subtitle line, e.g. "12 words · senpai, kawaii…". */
  meta: string;
  /** Module/lesson id this unlocks after. Undefined = available now. */
  unlockAfter?: string;
  /** Completion progress, 0–100. */
  progress: number;
  /** Styled as the warning-tone "daily" card when true. */
  isDaily?: boolean;
};

export type Course = {
  id: string;
  title: string;
  languageId: string;
  modules: CourseModule[];
  sideQuests?: SideQuest[];
};
