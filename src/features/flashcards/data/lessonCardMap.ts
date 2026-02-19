/**
 * Maps lesson IDs to the card IDs they introduce.
 * When a lesson is completed, its cards become unlocked in the course deck.
 * Key: languageId (deck language). Value: lessonId -> cardIds.
 *
 * Unlock is computed on each load/refresh. A nightly backend job could pre-compute
 * and persist unlock state per user; this module would then read from the backend
 * instead of computing from completedLessonIds.
 */
export const LESSON_TO_CARDS: Record<string, Record<string, string[]>> = {
  ko: {
    "m1-l0": ["ko-1"],
    "m1-l1": ["ko-2", "ko-5"],
    "m1-l2": ["ko-3", "ko-4"],
  },
  ja: {
    "m1-l0": ["ja-1"],
    "m1-l1": ["ja-2", "ja-5"],
    "m1-l2": ["ja-3", "ja-4"],
  },
};

/**
 * Returns the set of card IDs that are unlocked given completed lesson IDs.
 * Cards are unlocked when the lesson that introduces them is completed.
 */
export function getUnlockedCardIds(
  languageId: string,
  completedLessonIds: string[]
): Set<string> {
  const lessonMap = LESSON_TO_CARDS[languageId];
  if (!lessonMap) return new Set();

  const unlocked = new Set<string>();
  for (const lessonId of completedLessonIds) {
    const cardIds = lessonMap[lessonId];
    if (cardIds) {
      for (const cid of cardIds) unlocked.add(cid);
    }
  }
  return unlocked;
}
