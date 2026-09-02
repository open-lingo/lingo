import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import { SERVER_SYNC_ENABLED } from "@/shared/auth/bypass";
import type { ProgressSummary } from "@/shared/api/progress";
import {
  clearLessonProgressReset,
  hasLessonProgressReset,
  mergeServerLessonRollups,
  refreshLessonProgressFromStorage,
} from "@/shared/domain/mockProgress";
import { readProgressSnapshot, writeProgressSnapshot } from "./progressSnapshotCache";

function canFetchProgress(
  isAuthenticated: boolean,
  authLoading: boolean,
  userId: string | undefined,
): boolean {
  // A bypass build (no valid token) can only 401 here; firing it blocks the
  // home paint on a cold-Lambda round-trip for nothing. Progress is
  // local-first, so skip the fetch and let the hook report ready immediately.
  return SERVER_SYNC_ENABLED && isAuthenticated && !authLoading && Boolean(userId);
}

/**
 * GET /progress/me — single source for stats + lesson rollups.
 * Merges `lessons` into the local completion cache on every successful fetch.
 */
export function useProgressMe() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { progress } = useApi();
  const userId = user?.sub;
  const enabled = canFetchProgress(isAuthenticated, authLoading, userId);
  const snapshot = userId ? readProgressSnapshot(userId) : null;

  const query = useQuery({
    queryKey: ["progress", "me", userId ?? "anon"],
    queryFn: async (): Promise<ProgressSummary | null> => {
      const summary = await progress.getMe();
      const resetActive = hasLessonProgressReset();
      const hasServerLessons = Boolean(summary?.lessons?.length);

      if (hasServerLessons && !resetActive) {
        mergeServerLessonRollups(summary!.lessons!);
        refreshLessonProgressFromStorage();
      } else if (resetActive && !hasServerLessons) {
        // Fix H10 — the server has confirmed the reset (no lessons in the
        // round-trip after DELETE /progress/me). Local + server are now
        // consistent so the reset flag can be released; otherwise it would
        // stay sticky and block every future merge on this device forever.
        clearLessonProgressReset();
      }
      if (userId && summary) writeProgressSnapshot(userId, summary);
      return summary;
    },
    // Option B cold-start: hydrate from the last persisted summary so the
    // home paint doesn't full-page-gate on this round-trip. `initialData`
    // marks the query fetched/successful immediately; `initialDataUpdatedAt`
    // is the real save time, so staleTime still schedules a background
    // refetch instead of treating the snapshot as forever-fresh.
    initialData: snapshot?.data,
    initialDataUpdatedAt: snapshot?.savedAt,
    enabled,
    // LessonProgressHydrate explicitly invalidates ["progress", "me"] after
    // every lesson-attempt sync, and shop purchases / placement tests also
    // invalidate it. So the only "stale" window is when a different device
    // mutates progress for the same user, which is rare. 5 min is a safe
    // ceiling that saves a refetch on every cross-tab nav past 1 min.
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
  });

  // `isFetched` (dataUpdateCount > 0) stays false while a query is only
  // hydrated from `initialData` — a real fetch never happened yet. Ready
  // means "there is data to show OR we gave up trying", so check status
  // directly: success covers both a completed fetch and the optimistic
  // hydration case; error covers a failed first attempt with no snapshot.
  const isProgressReady = !enabled || query.isSuccess || query.isError;

  return {
    summary: query.data ?? null,
    isProgressReady,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
