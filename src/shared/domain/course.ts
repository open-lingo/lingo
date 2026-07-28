/**
 * RowDef-level prerequisite hook (curriculum-restructure §2026-05-15).
 *
 * Row catalog modules attach `prerequisites: string[]` (an array of row ids
 * that must be fully completed before lessons in the dependent row unlock).
 * `isLessonLocked` in `features/learn/moduleProgress.ts` honors the field.
 *
 * Type kept here (and not on `RowDef`) so the course/lesson layer can read
 * it without importing the curriculum module. The field is duplicated on
 * the `RowDef` catalog type for the curriculum module.
 */

/** Lesson within a module (mock shape; real API may differ). */
export type Lesson = {
  id: string;
  title: string;
  /** e.g. "locked" | "completed" | "available" */
  status?: string;
  /** Card IDs introduced by this lesson (for course-linked decks). Unlocked when lesson is completed. */
  introducesCardIds?: string[];
  /** When "alphabet", this row links to the alphabet learner instead of learn/lessons/:id.
   *  When "recap", this is the final module-recap node (~15 review items, amber styling).
   *  When "module_review", this lesson belongs to an inter-module review module
   *  (SRS-style retention cycle between two content modules).
   *  When "trainer", this row links to the conjugation trainer instead of the
   *  lesson player — a paradigm drill the path REQUIRES rather than offers. */
  kind?: "lesson" | "alphabet" | "recap" | "module_review" | "trainer";
  /** For kind "alphabet": alphabet id for route practice/alphabet/:alphabetId/learn */
  alphabetId?: string;
  /** For kind "trainer": which trainer tiles the drill selects. One id runs the
   *  per-type session; two or more run the combined session, where the stacked
   *  ("double conjugation") forms live. Order is display order. */
  trainerTypeIds?: string[];
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
  /**
   * JLPT tier this module belongs to. Absent means `"n5"` — the whole shipped
   * course predates the split, so undefined must keep behaving as it always has.
   *
   * The tier is what separates the two transit maps: each map renders one
   * tier's stations and keeps its own ZONE 1/2/3. It exists because
   * `modules` is doing double duty — it is BOTH the pedagogical module order
   * (`languages/ja/module.ts` → `jaCurriculum()` → `getAtomsUpToModule`, which
   * is how the SRS knows an atom is reachable) AND the map's station list. A
   * module must therefore be in `modules` to be learnable at all, even when it
   * should not be drawn on the N5 map.
   */
  tier?: "n5" | "n4";
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
  /** Highlighted with accent gradient in the sidequest rail. */
  featured?: boolean;
  /**
   * Visible in the rail but not clickable yet — renders disabled with a
   * "Coming soon" pill. Use for quests that have no implementation
   * route mapped (no SIDEQUEST_TO_LESSON or SIDEQUEST_TO_ROUTE entry).
   */
  comingSoon?: boolean;
};

export type Course = {
  id: string;
  title: string;
  languageId: string;
  modules: CourseModule[];
  sideQuests?: SideQuest[];
};
