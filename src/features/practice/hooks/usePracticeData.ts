/**
 * Single source of truth for practice-page data.
 *
 * Every stat is derived from real local state (2026-06-12 pass — the old
 * hardcoded `MOCK_*` constants are gone):
 *
 * - `todayMinutes` / `weekMinutes` — lesson-completion cache via
 *   `getWeekPracticeMinutes()` (same signal the Home `WeekSparkline` uses),
 *   live-updated through `subscribeLessonProgress`.
 * - `dueModules` / `totalModules` — module review schedule
 *   (`getDueReviews`) measured against the course map (`getMockCourse`).
 * - `lastTouchedHours.flashcards` — most recent review across the FSRS
 *   store (`getSRSStore` + `cardLastReviewedAt`). `null` = never reviewed.
 * - `lastTouchedHours.alphabet` — newest `updatedAt` across the language's
 *   alphabet-progress entries. `null` = never practiced.
 *
 * Removed (no real backing source — don't reintroduce fabricated numbers,
 * wire a real source first):
 * - `lastTouchedHours.grammar` — the particle trainer doesn't record
 *   activity timestamps anywhere yet.
 * - `useGrammarPracticeData` (`trainerCount` / `lessonCount` /
 *   `hoursPracticed`) — all three were invented; the grammar page stat
 *   tiles were removed with it.
 */

import { useEffect, useMemo, useState } from "react";
import {
  getWeekPracticeMinutes,
  subscribeLessonProgress,
} from "@/shared/domain/mockProgress";
import { getMockCourse } from "@/shared/domain/mockCourse";
import { getDueReviews } from "@/features/lesson/data/moduleReviewSchedule";
import { getSRSStore } from "@/features/flashcards/engine/srsStorage";
import { cardLastReviewedAt } from "@/features/flashcards/engine";
import { getAlphabetProgress } from "@/features/practice/alphabet/alphabetProgress";
import { getLanguageConfig } from "@/shared/domain/languageConfig";

export interface PracticeLastTouchedHours {
  /** Hours since the most recent flashcard review, or null if never. */
  flashcards: number | null;
  /** Hours since the alphabet trainer last saved progress, or null if never. */
  alphabet: number | null;
}

export interface PracticeData {
  /** Minutes practiced today (single integer). */
  todayMinutes: number;
  /** Last 7 calendar days oldest -> newest. Length always 7. */
  weekMinutes: number[];
  /** Modules with due reviews. */
  dueModules: number;
  /** Total modules in the course map. */
  totalModules: number;
  /** Hours since last activity per domain (null = no activity recorded). */
  lastTouchedHours: PracticeLastTouchedHours;
}

export interface UsePracticeDataResult {
  data: PracticeData;
  isLoading: boolean;
}

function hoursAgo(iso: string, nowMs: number): number | null {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((nowMs - t) / 3_600_000));
}

/** Hours since the newest flashcard review across the whole SRS store. */
function flashcardsLastTouchedHours(nowMs: number): number | null {
  let newest: string | null = null;
  for (const state of Object.values(getSRSStore())) {
    const at = cardLastReviewedAt(state);
    // Cards that have never been reviewed fall back to an empty / invalid
    // day string — skip anything that doesn't parse.
    if (Number.isNaN(new Date(at).getTime())) continue;
    if (newest === null || at > newest) newest = at;
  }
  return newest ? hoursAgo(newest, nowMs) : null;
}

/** Hours since any alphabet-progress write for this language. */
function alphabetLastTouchedHours(langId: string, nowMs: number): number | null {
  const cfg = getLanguageConfig(langId);
  const defs = cfg?.alphabets ?? (cfg?.alphabet ? [cfg.alphabet] : []);
  let newest: string | null = null;
  for (const def of defs) {
    const progress = getAlphabetProgress(langId, def.id);
    if (!progress?.updatedAt) continue;
    if (newest === null || progress.updatedAt > newest) {
      newest = progress.updatedAt;
    }
  }
  return newest ? hoursAgo(newest, nowMs) : null;
}

export function usePracticeData(langId: string): UsePracticeDataResult {
  // Re-derive when lesson progress changes (completion writes, sync hydrate).
  const [version, setVersion] = useState(0);
  useEffect(() => subscribeLessonProgress(() => setVersion((v) => v + 1)), []);

  return useMemo<UsePracticeDataResult>(() => {
    const nowMs = Date.now();
    const weekMinutes = getWeekPracticeMinutes();
    const course = getMockCourse(langId);

    return {
      data: {
        todayMinutes: weekMinutes[weekMinutes.length - 1] ?? 0,
        weekMinutes,
        dueModules: getDueReviews(course, nowMs).length,
        totalModules: course.modules.length,
        lastTouchedHours: {
          flashcards: flashcardsLastTouchedHours(nowMs),
          alphabet: alphabetLastTouchedHours(langId, nowMs),
        },
      },
      isLoading: false,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` re-derives from storage
  }, [langId, version]);
}
