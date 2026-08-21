/**
 * Data helpers for the course-map page (`/<lang>/learn/course`).
 *
 * Derives per-module overview data from real course content:
 *   - lesson count (content lessons, review lessons split out)
 *   - vocabulary introduced — collected from each lesson's
 *     `introducesCardIds` / `introducesVocabIds` (resolved via lesson
 *     content) and enriched from the authored course-atom catalogs
 *     (`JA_COURSE_ATOMS` for Japanese; the normalized atom view for
 *     KO/ES — both carry a per-atom module attribution).
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
import {
  getNormalizedAtomIndex,
  getNormalizedCourseAtoms,
  type NormalizedAtom,
} from "@/features/lesson/data/normalizedAtoms";

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

// `-review` with no numeric suffix is the rewrite-spine shape
// (ja-m3-neo-review, 2026-07-19); `-review-1/2` is the old-course shape.
const REVIEW_LESSON_RE = /-review(?:-[12])?$/;

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

function normalizedToSample(atom: NormalizedAtom): VocabSample {
  return { id: atom.id, surface: atom.display, meaning: atom.gloss };
}

/**
 * Vocab eligibility for the normalized (non-JA) path: real words only —
 * KO alphabet atoms (jamo / syllables, kind "other") aren't vocabulary.
 */
function isDisplayableVocab(atom: NormalizedAtom): boolean {
  return atom.srsEligible && atom.kind !== "other";
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
 * KO/ES: same shape via the normalized atom view — module-attributed atoms
 * plus resolvable declared ids, with surfaces + glosses for samples.
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

  const catalog = getNormalizedCourseAtoms(languageId);
  if (catalog.length > 0) {
    const byId = new Map<string, NormalizedAtom>();
    // Atoms attributed to this module.
    for (const atom of catalog) {
      if (atom.module === module.id && isDisplayableVocab(atom)) {
        byId.set(atom.id, atom);
      }
    }
    // Fold in any explicitly-declared ids that resolve to a known atom.
    const index = getNormalizedAtomIndex(languageId);
    for (const id of declaredIds) {
      const canonical = id.includes(":") ? id : `${languageId}:${id}`;
      const atom = index.get(canonical);
      if (atom && isDisplayableVocab(atom)) byId.set(atom.id, atom);
    }
    const atoms = [...byId.values()];
    return {
      count: atoms.length,
      samples: atoms.slice(0, SAMPLE_CAP).map(normalizedToSample),
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
