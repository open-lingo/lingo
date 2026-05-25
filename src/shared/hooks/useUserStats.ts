import { useMemo } from "react";
import { useProgressMe } from "./useProgressMe";
import { getMockProgressSummary } from "@/shared/domain/mockProgress";

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

/** XP required per level — simple linear curve until backend surfaces a target. */
const XP_PER_LEVEL = 500;

/**
 * Server-cached user stats from /progress/me (via useProgressMe).
 *
 * When the server-provided level is the default (1) or streak is 0, the hook
 * computes local fallbacks from accumulated XP / completion dates in
 * localStorage so demo/offline users see real numbers instead of zeros.
 */
export function useUserStats(): {
  stats: UserStats;
  isReady: boolean;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const { summary, isProgressReady, isLoading, isError, refetch } = useProgressMe();

  const serverStats = summary?.user ?? DEFAULT_STATS;

  const stats = useMemo(() => {
    const localProgress = getMockProgressSummary();
    const totalXp = localProgress.xpTotal ?? 0;

    const localStreak = localProgress.streakDays;
    const streak =
      serverStats.streak === 0 && localStreak > 0
        ? localStreak
        : serverStats.streak;
    const bestStreak = Math.max(serverStats.bestStreak, streak);

    if (serverStats.level !== 1 && serverStats.streak !== 0) {
      return serverStats;
    }

    const localLevel =
      serverStats.level === 1 && totalXp > 0
        ? Math.floor(totalXp / XP_PER_LEVEL) + 1
        : serverStats.level;

    return {
      ...serverStats,
      streak,
      bestStreak,
      xp: Math.max(serverStats.xp, totalXp),
      level: localLevel,
    };
  }, [serverStats]);

  return {
    stats,
    isReady: isProgressReady,
    isLoading,
    isError,
    refetch,
  };
}
