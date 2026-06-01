import {
  JA_COURSE_ATOMS,
  isSrsEligibleAtom,
  type CourseAtom,
} from "@/features/languages/ja/courseAtoms";

/**
 * Lesson → atoms index.
 *
 * Currently hard-bound to JA via JA_COURSE_ATOMS. Per ADR-005, callers
 * should eventually pass a `languageId` and route through the central
 * language registry; the helper `courseAtomsFor(languageId)` is the
 * local seam that hardcodes "ja" today and will switch to
 * `getLanguageModule(languageId).courseAtoms` in Phase 2.
 */
function courseAtomsFor(languageId: string): ReadonlyArray<CourseAtom> {
  // Phase 2: route through registry.
  if (languageId !== "ja") return [];
  return JA_COURSE_ATOMS;
}

const MODULE_ORDER = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"] as const;

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
  // Phase 2: route through registry; default "ja" preserves behavior.
  languageId: string = "ja",
): CourseAtom[] {
  if (languageId !== "ja") return [];
  return lessonToAtoms.get(lessonId) ?? [];
}

export function getAtomsUpToModule(
  moduleId: string,
  // Phase 2: route through registry; default "ja" preserves behavior.
  languageId: string = "ja",
): CourseAtom[] {
  const cutoff = MODULE_ORDER.indexOf(moduleId as (typeof MODULE_ORDER)[number]);
  if (cutoff === -1) return [];
  const eligible = MODULE_ORDER.slice(0, cutoff + 1);
  const set = new Set(eligible as readonly string[]);
  return courseAtomsFor(languageId).filter(
    (a) => isSrsEligibleAtom(a) && set.has(a.fromModule),
  );
}
