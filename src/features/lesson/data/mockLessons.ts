import type { LessonContent, LessonStep } from "../types";
import { MOCK_LESSON_M1_L1 } from "./mock-m1-l1";
import { MOCK_LESSON_M1_L2 } from "./mock-m1-l2";
import {
  MOCK_LESSON_JA_M1_L1A,
  MOCK_LESSON_JA_M1_L1B,
} from "./mock-ja-m1-l1";
import { GENERATED_HIRAGANA_LESSONS } from "./generatedHiraganaLessons";
import { getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { buildReviewTailSteps } from "./buildReviewTailSteps";

const LESSONS: Record<string, LessonContent> = {
  "m1-l1": MOCK_LESSON_M1_L1,
  "m1-l2": MOCK_LESSON_M1_L2,
  "ja-m1-l1a": MOCK_LESSON_JA_M1_L1A,
  "ja-m1-l1b": MOCK_LESSON_JA_M1_L1B,
  ...GENERATED_HIRAGANA_LESSONS,
};

/**
 * Extract the row id from a JA sub-lesson id. Returns null for any id that
 * doesn't follow the `ja-mN-{rowId}-{suffix}` shape (e.g. legacy
 * `ja-m1-l1a` / `ja-m1-l1b`, the alphabet-lesson stub, the recap node).
 */
function rowIdOf(lessonId: string): string | null {
  const m = /^ja-m\d+-(.+)-(\d+|test|recap)$/.exec(lessonId);
  return m ? m[1] : null;
}

/**
 * Augment a lesson with the cross-row review tail (Phase 2). Tail items
 * sit just before the final wrap-up info step so the user's last
 * interaction is a retrieval (Karpicke recency).
 *
 * The tail is skipped for:
 *   - lessons that aren't JA sub-lessons (legacy m1-l1 etc.)
 *   - row-test lessons (they ARE the review)
 *   - recap lessons (whole-module review)
 *   - cases where `buildReviewTailSteps` returns [] (empty cross-row pool)
 */
function augmentWithReviewTail(lesson: LessonContent): LessonContent {
  const id = lesson.id;
  // Skip row-test and recap lessons — they're already review-heavy.
  if (id.endsWith("-test") || id.endsWith("-recap")) return lesson;
  const rowId = rowIdOf(id);
  if (!rowId) return lesson;

  const priorLessonIds = new Set(getMockCompletedLessonIds());
  // The current lesson MUST be excluded from the prior set even when
  // revisiting — the tail draws from OTHER rows, not this one.
  priorLessonIds.delete(id);

  const tail = buildReviewTailSteps({
    currentLessonId: id,
    currentRowId: rowId,
    priorLessonIds,
  });
  if (tail.length === 0) return lesson;

  // Insert tail just BEFORE the trailing wrap-up info step (if any).
  const steps: LessonStep[] = [...lesson.steps];
  const lastIdx = steps.length - 1;
  const last = steps[lastIdx];
  if (last && last.type === "info" && last.id.endsWith("-info-end")) {
    steps.splice(lastIdx, 0, ...tail);
  } else {
    steps.push(...tail);
  }
  return { ...lesson, steps };
}

export function getMockLessonContent(
  lessonId: string,
): LessonContent | null {
  const base = LESSONS[lessonId] ?? null;
  if (!base) return null;
  return augmentWithReviewTail(base);
}

export function getAvailableMockLessonIds(): string[] {
  return Object.keys(LESSONS);
}
