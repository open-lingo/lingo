/**
 * Per-module lesson-count + vocab resolution — the SAME logic used to:
 *   1. Build the course-map page's live node data (`courseMapData.ts`,
 *      which re-exports these), reading whatever lesson content happens to
 *      be registered.
 *   2. Emit the small per-language `index.<hash>.json` file
 *      (`emitContent.test.ts`) under the eager (all-registered) test
 *      runtime, which the course map loads instead of every module's full
 *      lesson JSON (2026-09-13; see `docs/content-as-data-2026-09-13.md`).
 *
 * Shared on purpose — the emitted index and a live recompute can never
 * drift because both call `buildModuleIndexEntry`.
 *
 * Lesson-count needs no lesson content (module/lesson ids only). Vocab
 * resolution reads lesson content when available (`introducesCardIds` /
 * `introducesVocabIds`) and is enriched from the authored course-atom
 * catalogs (`JA_COURSE_ATOMS` for Japanese; the normalized atom view for
 * KO/ES — both carry a per-atom module attribution), which don't require
 * any lesson content to be loaded.
 */
import type { CourseModule } from "@/shared/domain/course";
import { getRegisteredLesson as getRawMockLesson } from "@/features/lesson/data/lessonRegistry";
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

export type ModuleLessonCounts = {
  content: number;
  review: number;
  total: number;
};

/** The shape written to `<lang>/index.<hash>.json` — one entry per module. */
export type ModuleIndex = {
  id: string;
  lessonCount: ModuleLessonCounts;
  vocabCount: number;
  vocabSamples: VocabSample[];
};

// `-review` with no numeric suffix is the rewrite-spine shape
// (ja-m3-neo-review, 2026-07-19); `-review-1/2` is the old-course shape.
const REVIEW_LESSON_RE = /-review(?:-[12])?$/;

/** Whether a lesson id is an SRS review lesson (doesn't introduce content). */
export function isReviewLessonId(lessonId: string): boolean {
  return REVIEW_LESSON_RE.test(lessonId);
}

/** Count content lessons vs review lessons in a module. */
export function getModuleLessonCounts(module: CourseModule): ModuleLessonCounts {
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
    // Raw read: `introduces*` is authored, never set by padding, and the
    // padded read would compile/pad every lesson on the boot path.
    const content = getRawMockLesson(lesson.id);
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

export const SAMPLE_CAP = 6;

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
 * Other languages (FR today): fall back to lesson-content declared ids, so
 * a non-zero count needs that module's lesson content registered. When
 * those ids can't be resolved to a display surface, the count still
 * reflects the number of distinct ids; samples are simply omitted.
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
 * Build one module's index entry — lesson counts + vocab count/samples, the
 * exact shape emitted to `<lang>/index.<hash>.json` and read back by
 * `getLoadedModuleIndex`. Single source both the emitter and the browser
 * fallback path call, so they cannot drift.
 */
export function buildModuleIndexEntry(
  module: CourseModule,
  languageId: string,
): ModuleIndex {
  const vocab = getModuleVocab(module, languageId);
  return {
    id: module.id,
    lessonCount: getModuleLessonCounts(module),
    vocabCount: vocab.count,
    vocabSamples: vocab.samples,
  };
}
