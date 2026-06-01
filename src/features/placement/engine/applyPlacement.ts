import { getMockCourse } from "@/shared/domain/mockCourse";
import { markLessonCompleted } from "@/shared/domain/mockProgress";
import { unlockLessonAtoms } from "@/features/lesson/data/unlockLessonAtoms";
import { setCardState } from "@/features/flashcards/engine/srsStorage";
import {
  getCourseAtoms,
  isLanguageRegistered,
} from "@/shared/language/registry";
import type { SRSCardState } from "@/features/flashcards/data/types";

export type PlacementResult = {
  passedModules: string[];
  skippedLessonCount: number;
  seededAtomCount: number;
};

function createPlacementSeedState(): SRSCardState {
  const today = new Date().toISOString().slice(0, 10);
  const sub = {
    stability: 0,
    difficulty: 0,
    state: "learning" as const,
    interval: 0,
    dueDate: today,
    lastReviewDate: today,
    reps: 0,
    lapses: 0,
  };
  return { recognition: { ...sub }, production: { ...sub } };
}

export function applyPlacementResult(
  passedModules: string[],
  languageId: string = "ja",
): PlacementResult {
  if (passedModules.length === 0) {
    return { passedModules, skippedLessonCount: 0, seededAtomCount: 0 };
  }
  if (!isLanguageRegistered(languageId)) {
    return { passedModules, skippedLessonCount: 0, seededAtomCount: 0 };
  }

  const course = getMockCourse(languageId);
  const passedSet = new Set(passedModules);
  let lessonCount = 0;

  for (const mod of course.modules) {
    if (!passedSet.has(mod.id)) continue;
    for (const lesson of mod.lessons) {
      markLessonCompleted(lesson.id, {
        accuracy: 1,
        xpEarned: 0,
        isReview: false,
      });
      unlockLessonAtoms(lesson.id);
      lessonCount++;
    }
  }

  const seedState = createPlacementSeedState();
  let atomCount = 0;
  for (const atom of getCourseAtoms(languageId)) {
    if (!atom.srsEligible) continue;
    if (atom.fromModule === undefined) continue;
    if (!passedSet.has(atom.fromModule)) continue;
    setCardState(atom.id, seedState);
    atomCount++;
  }

  return { passedModules, skippedLessonCount: lessonCount, seededAtomCount: atomCount };
}
