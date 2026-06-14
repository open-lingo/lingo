import {
  JA_COURSE_ATOMS,
  isSrsEligibleAtom,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";
import {
  isLanguageRegistered,
  tryGetLanguageModule,
} from "@/shared/language/registry";

/**
 * Lesson → atoms index. Routes through the central language registry
 * per ADR-005.
 *
 * This file still hands callers (`buildSrsReviewLesson`,
 * `unlockLessonAtoms`) the JA-internal `CourseAtom` shape — they read
 * kana / kanji / emoji / introducedByLessonId, which the contract-level
 * `Atom` doesn't carry. The registry-gated `courseAtomsFor` ensures
 * non-JA languages return an empty list rather than silently falling
 * back to JA data.
 *
 * Phase 4+ (when KO lesson content lands) the JA-CourseAtom dependency
 * here can be replaced by a JA-specific Atom subtype consumed via a
 * per-language consumer surface.
 */
function courseAtomsFor(languageId: string): ReadonlyArray<CourseAtom> {
  if (!isLanguageRegistered(languageId)) return [];
  if (languageId !== "ja") return [];
  return JA_COURSE_ATOMS;
}

const lessonToAtoms = new Map<string, CourseAtom[]>();

for (const atom of courseAtomsFor("ja")) {
  if (!isSrsEligibleAtom(atom)) continue;
  const lid = atom.introducedByLessonId;
  if (!lid) continue;
  const arr = lessonToAtoms.get(lid) ?? [];
  arr.push(atom);
  lessonToAtoms.set(lid, arr);
}

/**
 * M8+ fallback (2026-06-12 attribution backfill): content sub-lessons in
 * m8..m27 carry module-level attribution (`fromModule`) but no per-atom
 * `introducedByLessonId`. For a lesson absent from the static index,
 * derive its atoms as "the lesson's module's attributed atoms whose
 * surface form (kana or kanji) appears in the lesson's steps". Lesson
 * content is resolved through the `__lingo_get_lesson_content__` global
 * registered by mockLessons — same cycle-avoidance pattern as
 * `__lingo_row_sub_lesson_ids__`.
 */
const fallbackAtomsCache = new Map<string, CourseAtom[]>();

function atomSurfaces(atom: CourseAtom): string[] {
  const out = atom.kana.split("/").map((s) => s.trim());
  if (atom.kanji) out.push(...atom.kanji.split("/").map((s) => s.trim()));
  return out.filter(Boolean);
}

function fallbackAtomsForLesson(lessonId: string): CourseAtom[] {
  const cached = fallbackAtomsCache.get(lessonId);
  if (cached) return cached;
  // SRS review lessons re-surface already-unlocked atoms — never a source
  // of new introductions.
  const moduleId = /^ja-(m\d+)-(?!review-)/.exec(lessonId)?.[1] ?? null;
  const getContent = (
    globalThis as {
      __lingo_get_lesson_content__?: (
        id: string,
      ) => { steps: unknown[] } | null;
    }
  ).__lingo_get_lesson_content__;
  let atoms: CourseAtom[] = [];
  if (moduleId && typeof getContent === "function") {
    const lesson = getContent(lessonId);
    if (lesson) {
      const haystack = JSON.stringify(lesson.steps);
      atoms = courseAtomsFor("ja").filter(
        (a) =>
          isSrsEligibleAtom(a) &&
          a.fromModule === moduleId &&
          !a.introducedByLessonId &&
          atomSurfaces(a).some((s) => haystack.includes(s)),
      );
    }
  }
  fallbackAtomsCache.set(lessonId, atoms);
  return atoms;
}

export function getAtomsForLesson(
  lessonId: string,
  languageId: string = "ja",
): CourseAtom[] {
  if (!isLanguageRegistered(languageId)) return [];
  if (languageId !== "ja") return [];
  return lessonToAtoms.get(lessonId) ?? fallbackAtomsForLesson(lessonId);
}

export function getAtomsUpToModule(
  moduleId: string,
  languageId: string = "ja",
): CourseAtom[] {
  // Module order derived from the language module's curriculum, not
  // hardcoded m1..m7.
  const module = tryGetLanguageModule(languageId);
  if (!module) return [];
  const order = module.curriculum.map((m) => m.id);
  const cutoff = order.indexOf(moduleId);
  if (cutoff === -1) return [];
  const set = new Set(order.slice(0, cutoff + 1));
  return courseAtomsFor(languageId).filter(
    (a) => isSrsEligibleAtom(a) && set.has(a.fromModule),
  );
}
