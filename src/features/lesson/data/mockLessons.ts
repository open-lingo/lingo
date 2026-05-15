import type { LessonContent } from "../types";
import { MOCK_LESSON_M1_L1 } from "./mock-m1-l1";
import { MOCK_LESSON_M1_L2 } from "./mock-m1-l2";
import { MOCK_LESSON_JA_M1_L1 } from "./mock-ja-m1-l1";
import { GENERATED_HIRAGANA_LESSONS } from "./generatedHiraganaLessons";

const LESSONS: Record<string, LessonContent> = {
  "m1-l1": MOCK_LESSON_M1_L1,
  "m1-l2": MOCK_LESSON_M1_L2,
  "ja-m1-l1": MOCK_LESSON_JA_M1_L1,
  ...GENERATED_HIRAGANA_LESSONS,
};

export function getMockLessonContent(
  lessonId: string
): LessonContent | null {
  return LESSONS[lessonId] ?? null;
}

export function getAvailableMockLessonIds(): string[] {
  return Object.keys(LESSONS);
}
