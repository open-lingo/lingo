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

export function getAtomsForLesson(
  lessonId: string,
  languageId: string = "ja",
): CourseAtom[] {
  if (!isLanguageRegistered(languageId)) return [];
  if (languageId !== "ja") return [];
  return lessonToAtoms.get(lessonId) ?? [];
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
