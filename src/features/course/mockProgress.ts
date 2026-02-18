/**
 * Mock: which lesson IDs are completed. Replace with API or storage when ready.
 */
export const MOCK_COMPLETED_LESSON_IDS: string[] = [
  "m1-l0", // intro
  "m1-l1", // Greetings
];

export function getMockCompletedLessonIds(): string[] {
  return [...MOCK_COMPLETED_LESSON_IDS];
}
