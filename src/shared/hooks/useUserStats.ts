import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/shared/api";
import { useAuth } from "@/shared/auth/useAuth";

/** User-level progress stats — streak, XP, level, lingots. */
export interface UserStats {
  streak: number;
  bestStreak: number;
  lastActiveDate: string | null;
  xp: number;
  level: number;
  lingots: number;
}

const DEFAULT_STATS: UserStats = {
  streak: 0,
  bestStreak: 0,
  lastActiveDate: null,
  xp: 0,
  level: 1,
  lingots: 0,
};

/**
 * Server-cached user stats. Reads /progress/me and returns the `user` payload.
 *
 * Returns DEFAULT_STATS when not authenticated or backend is not yet wired
 * (ProgressApi.getMe swallows 404/501 and returns null) — callers can treat
 * the stats object as always-present.
 *
 * staleTime is 1m because these are surfaced on hot paths (home cards, header
 * lingot badge) and we don't want to refetch on every navigation.
 */
export function useUserStats(): {
  stats: UserStats;
  /** False while the first /progress/me fetch is in flight for signed-in users. */
  isReady: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { isAuthenticated } = useAuth();
  const { progress } = useApi();

  const query = useQuery({
    queryKey: ["progress", "me"],
    queryFn: async () => {
      const res = await progress.getMe();
      return res?.user ?? DEFAULT_STATS;
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  const isReady = !isAuthenticated || query.isFetched;

  return {
    stats: query.data ?? DEFAULT_STATS,
    isReady,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      void query.refetch();
    },
  };
}
