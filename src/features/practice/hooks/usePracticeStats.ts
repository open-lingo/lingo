import { useMemo } from "react";
import { useFlashcardDueSummary } from "@/features/flashcards/useFlashcardDueSummary";
import { useUserStats } from "@/shared/hooks/useUserStats";

/**
 * Real FSRS-derived stats for the practice hub overview bar.
 *
 * Everything here is sourced from the live SRS store (via
 * `useFlashcardDueSummary`) and server/local user stats (via
 * `useUserStats`) — no mock minutes. This is what makes the hub
 * honestly reflect that the learner is making progress:
 *
 * - `dueCount`     — cards due for review right now (FSRS queue)
 * - `retention`    — reps / (reps + lapses) across reviewed cards, 0-100
 * - `streak`       — consecutive active days (user stats)
 * - `weekReviews`  — per-day review counts, last 7 days oldest -> newest
 * - `learning` / `mastered` / `total` — card-state bucket counts
 */
export interface PracticeStats {
  dueCount: number;
  retention: number;
  hasRetention: boolean;
  streak: number;
  bestStreak: number;
  weekReviews: number[];
  weekTotalReviews: number;
  daysActiveThisWeek: number;
  learning: number;
  mastered: number;
  total: number;
  level: number;
  isLoading: boolean;
}

export function usePracticeStats(langId: string): PracticeStats {
  const {
    dueCount,
    totalCount,
    learningCount,
    masteredCount,
    weekReviews,
    deckRetentions,
    isLoading,
  } = useFlashcardDueSummary(langId);
  const { stats } = useUserStats();

  return useMemo(() => {
    // Aggregate per-deck retention into one figure, weighting equally
    // across decks that have any reviewed cards (retention 0 means "no
    // reps yet" in the source, so skip those to avoid dragging the
    // average to zero for brand-new decks).
    const scored = deckRetentions.filter((r) => r > 0);
    const retention =
      scored.length > 0
        ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length)
        : 0;
    const safeWeek =
      Array.isArray(weekReviews) && weekReviews.length === 7
        ? weekReviews
        : [0, 0, 0, 0, 0, 0, 0];
    return {
      dueCount,
      retention,
      hasRetention: scored.length > 0,
      streak: stats.streak,
      bestStreak: stats.bestStreak,
      weekReviews: safeWeek,
      weekTotalReviews: safeWeek.reduce((a, b) => a + b, 0),
      daysActiveThisWeek: safeWeek.filter((n) => n > 0).length,
      learning: learningCount,
      mastered: masteredCount,
      total: totalCount,
      level: stats.level,
      isLoading,
    };
  }, [
    dueCount,
    totalCount,
    learningCount,
    masteredCount,
    weekReviews,
    deckRetentions,
    stats.streak,
    stats.bestStreak,
    stats.level,
    isLoading,
  ]);
}
