import { notifySRSStoreChanged } from "@/features/flashcards/SRSStoreRevisionContext";
import { clearSRSStore } from "@/features/flashcards/engine/srsStorage";
import { clearGrammarStore } from "@/features/flashcards/engine/grammarSrs";
import { clearAllAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";
import { clearAllReviewSchedules } from "@/features/lesson/data/moduleReviewSchedule";
import { clearAllLessonInProgress } from "@/features/lesson/data/lessonProgress";
import {
  clearAllStepEvents,
  clearPendingAttempts,
} from "@/features/lesson/engine/lessonStorage";
import { clearGraduatedVocab } from "@/shared/vocabGraduation";
import type { ProgressApi } from "@/shared/api/progress";
import type { SrsApi } from "@/shared/api/srs";
import {
  clearLessonProgressReset,
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

/**
 * Wipe local learn caches (pathway, alphabet, reviews, lesson buffer).
 *
 * `languageId` is required for language-scoped state (vocab
 * graduation). The `courseId` arg here is overloaded in callers — some
 * pass a course id ("mock-1") and some pass the language id ("ja") for
 * historical reasons; both flow into per-course storage clearing,
 * preserving pre-Phase-1 behavior.
 */
export function resetLearnProgressLocal(
  languageId: string,
  courseId: string,
): void {
  clearMockProgress();
  clearAllAlphabetProgress();
  clearAllReviewSchedules();
  clearAllLessonInProgress();
  clearPendingAttempts();
  clearAllStepEvents();
  clearSRSStore();
  clearGrammarStore();
  notifySRSStoreChanged();
  clearGraduatedVocab(languageId, courseId);
  clearMasteryToastFlags();
  clearLessonProgressReset();
}

/** Local reset plus server progress/SRS wipe when signed in. */
export async function resetLearnProgress(
  languageId: string,
  courseId: string,
  api?: { progress: ProgressApi; srs: SrsApi } | null,
): Promise<void> {
  resetLearnProgressLocal(languageId, courseId);
  if (!api) return;
  // Fix H10 — mark the reset flag AFTER kicking off the server reset so
  // useProgressMe won't re-merge stale phone-era rollups into the just-cleared
  // local store before the server's post-reset GET round-trip confirms the
  // wipe. useProgressMe clears the flag once it sees the empty server state.
  const [progressResult] = await Promise.allSettled([
    api.progress.resetMe(),
    api.srs.clearAll(),
  ]);
  if (progressResult.status === "fulfilled") {
    markLessonProgressReset();
  }
}
