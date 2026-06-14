/**
 * Client mirror of the server's XP rules — lingo-core/app/progress/xp.py
 * is AUTHORITATIVE; these constants exist only so pre-sync UI (the
 * lesson-complete screen, header chips) estimates the same number the
 * server will award. If you change one side, change both.
 */
export const XP_LESSON_COMPLETE = 10;
export const XP_PERFECT_BONUS = 5;
/** Row tests / recaps (ids ending -test / -recap) pay a premium. */
export const XP_TEST_BONUS = 10;
export const XP_PER_LEVEL = 500;

export function isTestLessonId(lessonId: string): boolean {
  return lessonId.endsWith("-test") || lessonId.endsWith("-recap");
}

/** XP the server will award for a passed lesson. */
export function expectedXp(opts: {
  lessonId: string;
  perfect: boolean;
  multiplier?: number;
}): number {
  const base =
    XP_LESSON_COMPLETE +
    (isTestLessonId(opts.lessonId) ? XP_TEST_BONUS : 0) +
    (opts.perfect ? XP_PERFECT_BONUS : 0);
  return Math.max(1, Math.round(base * (opts.multiplier ?? 1)));
}
