import type {
  BatchAttemptResponse,
  BatchAttemptSubmission,
  ProgressSummary,
} from "@/shared/api/progress";
import {
  hasLessonProgressReset,
  mergeServerLessonRollups,
} from "@/shared/domain/mockProgress";
import { drainTestOutSyncQueue } from "@/shared/domain/testOutSyncQueue";
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

/** Push buffered attempts, then pull rollups from the server.
 *
 *  The test-out queue drains here too (b18 #144): it is the one choke point
 *  every sync trigger already goes through — boot hydrate, the 30s periodic
 *  tick, and the SyncManager's manual "Sync now" — so a test-out that lost
 *  its network the first time retries without a new trigger of its own. The
 *  drain never throws; a failure leaves the rows queued. */
export async function syncLessonProgressWithServer(options: {
  batch: (payload: BatchAttemptSubmission) => Promise<BatchAttemptResponse>;
  getMe: () => Promise<ProgressSummary | null>;
}): Promise<{ pushed: number; hydrated: number; testOutPushed: number }> {
  const pushed = await performLessonSync(options.batch);
  let testOutPushed = 0;
  try {
    testOutPushed = await drainTestOutSyncQueue(options.batch);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[test-out] queue drain failed, rows stay queued", err);
  }
  const hydrated = await hydrateLessonProgressFromServer(options.getMe);
  return { pushed, hydrated, testOutPushed };
}
