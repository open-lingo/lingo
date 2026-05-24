import type { ProgressSummary } from "@/shared/api/progress";
import {
  hasLessonProgressReset,
  mergeServerLessonRollups,
} from "@/shared/domain/mockProgress";

/** Pull lesson rollups from GET /progress/me into the local completion cache. */
export async function hydrateLessonProgressFromServer(
  getMe: () => Promise<ProgressSummary | null>,
): Promise<number> {
  if (hasLessonProgressReset()) return 0;
  const summary = await getMe();
  if (!summary?.lessons?.length) return 0;
  return mergeServerLessonRollups(summary.lessons);
}
