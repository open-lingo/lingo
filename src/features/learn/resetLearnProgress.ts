import { notifySRSStoreChanged } from "@/features/flashcards/SRSStoreRevisionContext";
import { clearSRSStore } from "@/features/flashcards/engine/srsStorage";
import { clearAllAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";
import { clearAllReviewSchedules } from "@/features/lesson/data/moduleReviewSchedule";
import { clearAllLessonInProgress } from "@/features/lesson/data/lessonProgress";
import {
  clearAllStepEvents,
  clearPendingAttempts,
} from "@/features/lesson/engine/lessonStorage";
import { clearGraduatedVocab } from "@/features/japanese/vocabGraduation";
import type { ProgressApi } from "@/shared/api/progress";
import type { SrsApi } from "@/shared/api/srs";
import {
  clearLessonProgressReset,
  clearMockProgress,
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

/** Wipe local learn caches (pathway, alphabet, reviews, lesson buffer). */
export function resetLearnProgressLocal(courseId: string): void {
  clearMockProgress();
  clearAllAlphabetProgress();
  clearAllReviewSchedules();
  clearAllLessonInProgress();
  clearPendingAttempts();
  clearAllStepEvents();
  clearSRSStore();
  notifySRSStoreChanged();
  clearGraduatedVocab(courseId);
  clearMasteryToastFlags();
  clearLessonProgressReset();
}

/** Local reset plus server progress/SRS wipe when signed in. */
export async function resetLearnProgress(
  courseId: string,
  api?: { progress: ProgressApi; srs: SrsApi } | null,
): Promise<void> {
  resetLearnProgressLocal(courseId);
  if (!api) return;
  await Promise.all([
    api.progress.resetMe().catch(() => {}),
    api.srs.clearAll().catch(() => {}),
  ]);
}
