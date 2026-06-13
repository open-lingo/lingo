import { getMockCourse } from "@/shared/domain/mockCourse";
import { markLessonCompleted } from "@/shared/domain/mockProgress";
import {
  unlockLessonAtoms,
  unlockAtomIds,
} from "@/features/lesson/data/unlockLessonAtoms";
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

const REVIEW_LESSON_RE = /^ja-m\d+-review-[12]$/;
const JA_KANA_MODULES = ["m1", "m2"];

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

  // If any M3+ module passed, the learner clearly knows kana — auto-complete
  // M1 and M2 so the linear unlock chain isn't broken.
  if (languageId === "ja") {
    for (const kana of JA_KANA_MODULES) {
      if (!passedSet.has(kana)) passedSet.add(kana);
    }
  }

  let lessonCount = 0;

  for (const mod of course.modules) {
    if (!passedSet.has(mod.id)) continue;
    for (const lesson of mod.lessons) {
      // Don't pre-complete review lessons — they're the learner's first SRS
      // review opportunity and should remain available.
      if (REVIEW_LESSON_RE.test(lesson.id)) continue;
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
  const seededIds: string[] = [];
  for (const atom of getCourseAtoms(languageId)) {
    if (!atom.srsEligible) continue;
    if (atom.fromModule === undefined) continue;
    if (!passedSet.has(atom.fromModule)) continue;
    setCardState(atom.id, seedState);
    seededIds.push(atom.id);
  }
  // M8+ atoms carry module-level attribution only (no introducedByLessonId),
  // so the per-lesson unlock above can't reach them — unlock the seeded
  // atoms directly or SRS review lessons will skip them.
  unlockAtomIds(seededIds);
  const atomCount = seededIds.length;

  const allPassed = [...passedSet];
  return { passedModules: allPassed, skippedLessonCount: lessonCount, seededAtomCount: atomCount };
}
