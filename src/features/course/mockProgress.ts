/**
 * Mock: which lesson IDs are completed. Replace with API or storage when ready.
 * Default: empty so Learn page and alphabet learner start fresh.
 */
export const MOCK_COMPLETED_LESSON_IDS: string[] = [];

export function getMockCompletedLessonIds(): string[] {
  return [...MOCK_COMPLETED_LESSON_IDS];
}
