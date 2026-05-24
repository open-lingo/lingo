import type {
  BatchAttemptResponse,
  BatchAttemptSubmission,
  ProgressSummary,
} from "@/shared/api/progress";
import {
  hasLessonProgressReset,
  mergeServerLessonRollups,
} from "@/shared/domain/mockProgress";
import { performLessonSync } from "./lessonSync";

/** Pull lesson rollups from GET /progress/me into the local completion cache. */
export async function hydrateLessonProgressFromServer(
  getMe: () => Promise<ProgressSummary | null>,
): Promise<number> {
  if (hasLessonProgressReset()) return 0;
  const summary = await getMe();
  if (!summary?.lessons?.length) return 0;
  return mergeServerLessonRollups(summary.lessons);
}

/** Push buffered attempts, then pull rollups from the server. */
export async function syncLessonProgressWithServer(options: {
  batch: (payload: BatchAttemptSubmission) => Promise<BatchAttemptResponse>;
  getMe: () => Promise<ProgressSummary | null>;
}): Promise<{ pushed: number; hydrated: number }> {
  const pushed = await performLessonSync(options.batch);
  const hydrated = await hydrateLessonProgressFromServer(options.getMe);
  return { pushed, hydrated };
}
