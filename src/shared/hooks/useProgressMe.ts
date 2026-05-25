import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";
import type { ProgressSummary } from "@/shared/api/progress";
import {
  clearLessonProgressReset,
  hasLessonProgressReset,
  mergeServerLessonRollups,
  refreshLessonProgressFromStorage,
} from "@/shared/domain/mockProgress";

function canFetchProgress(
  isAuthenticated: boolean,
  authLoading: boolean,
  userId: string | undefined,
): boolean {
  return isAuthenticated && !authLoading && Boolean(userId);
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
      return summary;
    },
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: 2,
  });

  const isProgressReady = !enabled || query.isFetched;

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
