import { clearAllAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";
import { clearAllReviewSchedules } from "@/features/lesson/data/moduleReviewSchedule";
import { clearAllLessonInProgress } from "@/features/lesson/data/lessonProgress";
import { clearGraduatedVocab } from "@/features/japanese/vocabGraduation";
import {
  clearMockProgress,
  markLessonProgressReset,
} from "@/shared/domain/mockProgress";

const MASTERY_TOAST_PREFIX = "lingo_mastery_toasted_v1_";

function clearMasteryToastFlags(): void {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(MASTERY_TOAST_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Wipe local learn progress and block server re-hydrate until new completions sync. */
export function resetLearnProgress(courseId: string): void {
  clearMockProgress();
  clearAllAlphabetProgress();
  clearAllReviewSchedules();
  clearAllLessonInProgress();
  clearGraduatedVocab(courseId);
  clearMasteryToastFlags();
  markLessonProgressReset();
}
