/**
 * Mock progress and completion data. Replace with API or storage when ready.
 */

/** Which lesson IDs are completed. Default: empty. */
const MOCK_COMPLETED_LESSON_IDS: string[] = [];

export function getMockCompletedLessonIds(): string[] {
  return [...MOCK_COMPLETED_LESSON_IDS];
}

export type ProgressSummary = {
  streakDays: number;
  lessonsCompletedThisWeek: number;
  dailyGoalMinutes: number;
  dailyGoalCompletedMinutes: number;
  cardsDueToday: number;
  xpTotal?: number;
  xpEarnedToday?: number;
};

const MOCK_PROGRESS: ProgressSummary = {
  streakDays: 5,
  lessonsCompletedThisWeek: 3,
  dailyGoalMinutes: 10,
  dailyGoalCompletedMinutes: 4,
  cardsDueToday: 12,
  xpTotal: 1250,
  xpEarnedToday: 50,
};

export function getMockProgressSummary(): ProgressSummary {
  return { ...MOCK_PROGRESS };
}
