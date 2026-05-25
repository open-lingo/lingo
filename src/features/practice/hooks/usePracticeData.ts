/**
 * Single source of truth for practice-page data.
 *
 * Today this returns mock values mixed with lightly-real signals (week
 * minutes are derived from local lesson completions via
 * `useLocalProgressSummary` — same source the Home page uses, so the
 * `WeekSparkline` widget no longer diverges between Home and Practice).
 *
 * Swap path: when the backend ships `/api/core/v1/practice/summary`,
 * replace the body with a real TanStack Query
 * (`useQuery({ queryKey: ["practice", "summary"], ... })`). Component
 * contracts (the `PracticeData` shape) stay stable. Until then it
 * serves typed mocks.
 *
 * Every `MOCK_*` constant that used to be sprinkled across
 * `PracticePage.tsx`, `PracticeGrammarPage.tsx`, etc. now lives here
 * and only here. Don't reintroduce per-component mock constants — feed
 * new fields through this hook so the swap remains a one-file change.
 */

import { useMemo } from "react";
import { useLocalProgressSummary } from "@/shared/hooks/useLocalProgressSummary";

export interface PracticeLastTouchedHours {
  flashcards: number;
  grammar: number;
  alphabet: number;
}

export interface PracticeData {
  /** Minutes practiced today (single integer). */
  todayMinutes: number;
  /** Last 7 calendar days oldest -> newest. Length always 7. */
  weekMinutes: number[];
  /** Modules with due reviews. */
  dueModules: number;
  /** Total modules tracked. */
  totalModules: number;
  /** Hours since last activity per domain. */
  lastTouchedHours: PracticeLastTouchedHours;
}

export interface UsePracticeDataResult {
  data: PracticeData;
  isLoading: boolean;
}

/**
 * Mock values that don't yet have a real backing signal.
 * Update here (and only here) when swapping in real data.
 */
const MOCK_DUE_MODULES = 3;
const MOCK_TOTAL_MODULES = 4;
const MOCK_LAST_TOUCHED_HOURS: PracticeLastTouchedHours = {
  flashcards: 2,
  grammar: 9,
  alphabet: 22,
};

export function usePracticeData(): UsePracticeDataResult {
  const { weekMinutes } = useLocalProgressSummary();

  return useMemo<UsePracticeDataResult>(() => {
    // `weekMinutes` is oldest -> newest, so "today" is the last entry.
    const todayMinutes = weekMinutes[weekMinutes.length - 1] ?? 0;
    return {
      data: {
        todayMinutes,
        weekMinutes,
        dueModules: MOCK_DUE_MODULES,
        totalModules: MOCK_TOTAL_MODULES,
        lastTouchedHours: MOCK_LAST_TOUCHED_HOURS,
      },
      isLoading: false,
    };
  }, [weekMinutes]);
}

// ---------- Grammar subpage ----------

export interface GrammarPracticeData {
  trainerCount: number;
  lessonCount: number;
  hoursPracticed: number;
}

export interface UseGrammarPracticeDataResult {
  data: GrammarPracticeData;
  isLoading: boolean;
}

const MOCK_GRAMMAR_TRAINER_COUNT = 4;
const MOCK_GRAMMAR_LESSON_COUNT = 0;
const MOCK_GRAMMAR_HOURS_PRACTICED = 0;

/**
 * Grammar-subpage data. Kept separate from `usePracticeData` because
 * the shape is page-specific (trainer roster stats vs. the practice
 * hub overview). Same swap-to-real-query pattern applies.
 */
export function useGrammarPracticeData(): UseGrammarPracticeDataResult {
  return useMemo<UseGrammarPracticeDataResult>(
    () => ({
      data: {
        trainerCount: MOCK_GRAMMAR_TRAINER_COUNT,
        lessonCount: MOCK_GRAMMAR_LESSON_COUNT,
        hoursPracticed: MOCK_GRAMMAR_HOURS_PRACTICED,
      },
      isLoading: false,
    }),
    [],
  );
}
