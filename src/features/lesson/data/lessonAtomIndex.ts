import { JA_COURSE_ATOMS, isSrsEligibleAtom, type CourseAtom } from "@/features/flashcards/data/ja-course-atoms";

const MODULE_ORDER = ["m1", "m2", "m3", "m4", "m5", "m6", "m7"] as const;

const lessonToAtoms = new Map<string, CourseAtom[]>();

for (const atom of JA_COURSE_ATOMS) {
  if (!isSrsEligibleAtom(atom)) continue;
  const lid = atom.introducedByLessonId;
  if (!lid) continue;
  const arr = lessonToAtoms.get(lid) ?? [];
  arr.push(atom);
  lessonToAtoms.set(lid, arr);
}

export function getAtomsForLesson(lessonId: string): CourseAtom[] {
  return lessonToAtoms.get(lessonId) ?? [];
}

export function getAtomsUpToModule(moduleId: string): CourseAtom[] {
  const cutoff = MODULE_ORDER.indexOf(moduleId as typeof MODULE_ORDER[number]);
  if (cutoff === -1) return [];
  const eligible = MODULE_ORDER.slice(0, cutoff + 1);
  const set = new Set(eligible as readonly string[]);
  return JA_COURSE_ATOMS.filter(
    (a) => isSrsEligibleAtom(a) && set.has(a.fromModule),
  );
}
