/**
 * Single source of truth for practice-page data.
 *
 * Today this returns typed mock values. When swapping to a real
 * backend, replace the body with a real TanStack Query
 * (e.g. `useQuery({ queryKey: ["practice", "summary"], ... })` against
 * `/api/core/v1/practice/summary`). Component contracts (the
 * `PracticeData` shape) stay stable. Until then it serves typed mocks.
 *
 * Cross-page note: the Home page pulls weekly activity from
 * `useLocalProgressSummary()` in `src/shared/hooks/useLocalProgressSummary.ts`
 * (lives on `main`, not yet on this branch's working tree). Once that
 * hook is here, the recommended next step is to delegate the
 * `weekMinutes`/`todayMinutes` fields to it so the `WeekSparkline`
 * widget on Home and Practice match. The wrapping shape stays the
 * same — only the inside of this hook changes.
 *
 * Every `MOCK_*` constant that used to be sprinkled across
 * `PracticePage.tsx`, `PracticeGrammarPage.tsx`, etc. now lives here
 * and only here. Don't reintroduce per-component mock constants — feed
 * new fields through this hook so the swap remains a one-file change.
 */

import { useMemo } from "react";

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
 * Mock values. Update here (and only here) when swapping in real data.
 * `weekMinutes` is oldest -> newest, so the last entry is "today".
 */
const MOCK_WEEK_MINUTES: number[] = [12, 0, 8, 5, 14, 6, 9];
const MOCK_TODAY_MIN = 12;
const MOCK_DUE_MODULES = 3;
const MOCK_TOTAL_MODULES = 4;
const MOCK_LAST_TOUCHED_HOURS: PracticeLastTouchedHours = {
  flashcards: 2,
  grammar: 9,
  alphabet: 22,
};

export function usePracticeData(): UsePracticeDataResult {
  return useMemo<UsePracticeDataResult>(
    () => ({
      data: {
        todayMinutes: MOCK_TODAY_MIN,
        weekMinutes: MOCK_WEEK_MINUTES,
        dueModules: MOCK_DUE_MODULES,
        totalModules: MOCK_TOTAL_MODULES,
        lastTouchedHours: MOCK_LAST_TOUCHED_HOURS,
      },
      isLoading: false,
    }),
    [],
  );
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
