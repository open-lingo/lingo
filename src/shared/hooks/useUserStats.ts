import { useProgressMe } from "./useProgressMe";

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
 * Server-cached user stats from /progress/me (via useProgressMe).
 */
export function useUserStats(): {
  stats: UserStats;
  isReady: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { summary, isProgressReady, isLoading, isError, refetch } = useProgressMe();

  return {
    stats: summary?.user ?? DEFAULT_STATS,
    isReady: isProgressReady,
    isLoading,
    isError,
    refetch,
  };
}
