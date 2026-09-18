import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { clearLessonProgressReset, getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import type { ProgressSummary } from "@/shared/api/progress";
// DEV-ONLY devlog hook (lane A11, 2026-09-17) — see the matching doc comment
// on `setReconcileObserver` in `shared/domain/progressReconcile.ts`.
// `reportReconcileEvent` is a no-op unless `remoteConsole.ts` has armed the
// underlying observer.
import { reportReconcileEvent } from "@/shared/domain/progressReconcile";

export interface PullIgnoringResetResult {
  localCount: number;
  serverCount: number | null;
}

/**
 * Bug #176a — Sync panel action: "Pull from server (ignore local reset)".
 *
 * Leading hypothesis for #176a (server has 12/12 m5 lessons, iPad shows
 * 4/12, both pushes and pulls fire per CloudWatch): the client's local
 * "lesson progress reset" flag (`markLessonProgressReset` /
 * `hasLessonProgressReset`, `src/shared/domain/mockProgress.ts`) is stuck
 * set on that device, and `useProgressMe`'s queryFn
 * (`src/shared/hooks/useProgressMe.ts`) — by design — refuses to merge
 * server lesson rollups into the local cache while it's set, so every real
 * GET /progress/me round-trip lands and is thrown away.
 *
 * This is a manual override for that stuck state, not a change to the
 * default behaviour: it clears the flag, then forces a real refetch of the
 * SAME `["progress", "me", <userId>]` query `useProgressMe` owns — with the
 * flag gone, that refetch's queryFn merges server rollups into the local
 * cache exactly the way an unstuck client would (see
 * `mergeServerLessonRollups` in `useProgressMe.ts`). Every other code path
 * (`progressSync.ts`, `progressReconcile.ts`) still honours the flag
 * normally; this function is the only caller that clears it before a fetch.
 */
export async function pullFromServerIgnoringReset(
  queryClient: Pick<QueryClient, "refetchQueries" | "getQueryData">,
  queryKey: QueryKey,
): Promise<PullIgnoringResetResult> {
  clearLessonProgressReset();
  await queryClient.refetchQueries({ queryKey, exact: true });
  const localCount = getMockCompletedLessonIds().length;
  const summary = queryClient.getQueryData<ProgressSummary>(queryKey) ?? null;
  const serverCount = summary ? summary.lessons.filter((l) => l.firstPassedAt).length : null;
  reportReconcileEvent({ source: "pull-ignoring-reset", localCount, serverCount });
  return { localCount, serverCount };
}
