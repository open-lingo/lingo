/**
 * Data helpers for the course-map page (`/<lang>/learn/course`).
 *
 * Derives per-module overview data from real course content:
 *   - lesson count (content lessons, review lessons split out)
 *   - vocabulary introduced — collected from each lesson's
 *     `introducesCardIds` / `introducesVocabIds` (resolved via lesson
 *     content) and, for Japanese, enriched from the authored course-atom
 *     catalog (`JA_COURSE_ATOMS`, which carries a `fromModule` tag).
 *
 * NOTE: this file deliberately does NOT define a `moduleVocab.ts` — vocab
 * resolution lives here, scoped to the course-map surface.
 */
import type { Course, CourseModule } from "@/shared/domain/course";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import {
  JA_COURSE_ATOMS,
  JA_COURSE_ATOMS_BY_ID,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";

/** A displayable vocab sample (kana/hangul surface + english gloss). */
export type VocabSample = {
  id: string;
  /** Target-language surface form (kana for JA). */
  surface: string;
  /** Short english meaning. */
  meaning: string;
};

export type ModuleVocab = {
  /** Total distinct vocab items introduced in the module. */
  count: number;
  /** First few resolvable samples for display (capped). */
  samples: VocabSample[];
};

const REVIEW_LESSON_RE = /-review-[12]$/;

/** Whether a lesson id is an SRS review lesson (doesn't introduce content). */
export function isReviewLessonId(lessonId: string): boolean {
  return REVIEW_LESSON_RE.test(lessonId);
}

/** Count content lessons vs review lessons in a module. */
export function getModuleLessonCounts(module: CourseModule): {
  content: number;
  review: number;
  total: number;
} {
  let content = 0;
  let review = 0;
  for (const l of module.lessons) {
    if (isReviewLessonId(l.id)) review++;
    else content++;
  }
  return { content, review, total: module.lessons.length };
}

/**
 * Collect the vocab/card ids a module's lessons declare via lesson content
 * (`introducesCardIds` first, falling back to `introducesVocabIds`). Returns
 * a de-duped, order-preserving list. Empty when no lesson content declares
 * any — callers must handle the empty case gracefully.
 */
function collectIntroducedIds(module: CourseModule): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const lesson of module.lessons) {
    if (isReviewLessonId(lesson.id)) continue;
    const content = getMockLessonContent(lesson.id);
    if (!content) continue;
    const ids = content.introducesCardIds ?? content.introducesVocabIds ?? [];
    for (const id of ids) {
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function atomToSample(atom: CourseAtom): VocabSample {
  return { id: atom.id, surface: atom.kana, meaning: atom.meaningEn };
}

const SAMPLE_CAP = 6;

/**
 * Resolve the vocabulary introduced by a module.
 *
 * Japanese: primary source is the authored course-atom catalog filtered by
 * `fromModule` (real curriculum data, includes kana + meaning), which is the
 * most complete signal. We also fold in any ids declared on lesson content so
 * the count never undercounts authored decks.
 *
 * Other languages: fall back to lesson-content declared ids. When those ids
 * can't be resolved to a display surface, the count still reflects the number
 * of distinct ids; samples are simply omitted.
 */
export function getModuleVocab(
  module: CourseModule,
  languageId: string,
): ModuleVocab {
  const declaredIds = collectIntroducedIds(module);

  if (languageId === "ja") {
    const byId = new Map<string, CourseAtom>();
    // Atoms tagged as first-introduced in this module.
    for (const atom of JA_COURSE_ATOMS) {
      if (atom.fromModule === module.id) byId.set(atom.id, atom);
    }
    // Fold in any explicitly-declared ids that resolve to a known atom.
    for (const id of declaredIds) {
      const atom = JA_COURSE_ATOMS_BY_ID.get(id);
      if (atom) byId.set(atom.id, atom);
    }
    const atoms = [...byId.values()];
    return {
      count: atoms.length,
      samples: atoms.slice(0, SAMPLE_CAP).map(atomToSample),
    };
  }

  // Generic path: count distinct declared ids; no surface resolver available.
  return { count: declaredIds.length, samples: [] };
}

/**
 * Authored fluency milestones — short capability labels anchored to module
 * indices, marking points where a meaningful real-world skill unlocks.
 *
 * IMPORTANT: these labels are AUTHORED for this page, not derived from the
 * course model. Keyed by module index (0-based) within the course's module
 * list. Only languages with an entry render milestones; others render none.
 *
 * Korean course is authored first (its M1/M2 are Hangul, M3+ are grammar/
 * vocab modules — see mockCourse.ts).
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
