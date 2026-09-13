/**
 * Data helpers for the course-map page (`/<lang>/learn/course`).
 *
 * Lesson-count + vocab resolution live in `moduleVocabIndex.ts` (shared with
 * the content emitter so the page and the emitted `index.<hash>.json` can't
 * drift) and are re-exported here unchanged. This file adds the course-map-
 * specific pieces: authored fluency milestones.
 */
import type { Course } from "@/shared/domain/course";
export {
  isReviewLessonId,
  getModuleLessonCounts,
  getModuleVocab,
  SAMPLE_CAP,
  buildModuleIndexEntry,
  type VocabSample,
  type ModuleVocab,
  type ModuleLessonCounts,
  type ModuleIndex,
} from "./moduleVocabIndex";

/**
 * Authored fluency milestones — short capability labels anchored to module
 * indices, marking points where a meaningful real-world skill unlocks.
 *
 * IMPORTANT: these labels are AUTHORED for this page, not derived from the
 * course model. Keyed by module index (0-based) within the course's module
 * list. Only languages with an entry render milestones; others render none.
 *
 * Korean course is authored first (its M1/M2 are Hangul, M3+ are grammar/
 * vocab modules — see mockCourse.ts). Spanish is Latin-script, so its
 * milestones are conversational from module one (spine: m1 sounds &
 * greetings … m16 travel & review).
 */
export const COURSE_MILESTONES: Record<string, Record<number, string>> = {
  ko: {
    1: "Read all of Hangul",
    3: "Greet people & introduce yourself",
    4: "Talk about everyday objects",
    6: "Order food & shop",
    9: "Describe people and things",
    13: "Hold a basic conversation",
  },
  ja: {
    1: "Read all of Hiragana",
    2: "Read Dakuten, Yōon & Katakana",
    4: "Build your first sentences",
    6: "Count, order & shop",
    9: "Describe qualities & feelings",
    13: "Talk about times & schedules",
    16: "Handle requests & routines",
  },
  es: {
    // 2026-08-21: §13-doctrine course restarts at m1/m2; more as m3+ lands.
    0: "Greet people & count to 10",
    1: "Hold the café conversation",
    2: "Name & count the things around you",
    3: "Ask where anything is — and answer",
    4: "Talk about your people",
    5: "Describe what you see",
    6: "Order at the café",
    7: "Plan your week",
    8: "Say where you're going",
    9: "Run your first verb machine",
  },
  fr: {
    0: "Greet people & count to 10",
    1: "Hold the café conversation",
  },
};

/** Milestone label for a module index in a given language, or null. */
export function getMilestoneForModule(
  languageId: string,
  moduleIndex: number,
): string | null {
  return COURSE_MILESTONES[languageId]?.[moduleIndex] ?? null;
}

/** Whether the language has any authored milestones. */
export function hasMilestones(languageId: string): boolean {
  return Boolean(COURSE_MILESTONES[languageId]);
}

/** Convenience: are there any non-empty milestones for this course. */
export function courseHasMilestones(course: Course): boolean {
  return hasMilestones(course.languageId);
}
