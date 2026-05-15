import type { Course } from "./course";
import { getLanguageConfig } from "./languageConfig";
import {
  HIRAGANA_ROWS,
  DAKUTEN_ROWS,
} from "@/features/lesson/data/hiraganaCurriculum";

export const ALPHABET_LESSON_ID = "m1-l0-alphabet";

export function getMockCourse(languageId: string): Course {
  const config = getLanguageConfig(languageId);
  const langName = config?.name ?? "Language";

  const alphabetLesson = config?.alphabet
    ? [
        {
          id: ALPHABET_LESSON_ID,
          title: `Learn the ${langName} Alphabet`,
          status: "available" as const,
          kind: "alphabet" as const,
          alphabetId: config.alphabet.id,
        },
      ]
    : [];

  const introLesson = config?.introLessonTitle
    ? [
        {
          id: "m1-l0",
          title: config.introLessonTitle,
          status: "available" as const,
        },
      ]
    : [];

  const isJapanese = languageId === "ja";

  if (isJapanese) {
    // Module 1 — basic hiragana rows, lesson by lesson.
    const m1Lessons = [
      ...alphabetLesson,
      ...introLesson,
      {
        id: "ja-m1-l1",
        title: "Vowels: あ い う え お",
        status: "available" as const,
      },
      ...HIRAGANA_ROWS.map((row) => ({
        id: `ja-m1-${row.id}`,
        title: row.title,
        status: "available" as const,
      })),
    ];

    // Module 2 — voicing (dakuten + handakuten).
    const m2Lessons = DAKUTEN_ROWS.map((row) => ({
      id: `ja-m1-${row.id}`,
      title: row.title,
      status: "available" as const,
    }));

    return {
      id: "mock-1",
      title: `${langName} for Beginners`,
      languageId,
      modules: [
        { id: "m1", title: "Hiragana", lessons: m1Lessons },
        {
          id: "m2",
          title: "Voicing — dakuten + handakuten",
          lessons: m2Lessons,
        },
        {
          id: "m3",
          title: "Yōon (combination kana)",
          lessons: [
            {
              id: "ja-m3-l1-yoon",
              title: "Yōon intro — coming soon",
              status: "locked" as const,
            },
          ],
        },
        {
          id: "m4",
          title: "Katakana",
          lessons: [
            {
              id: "ja-m4-l1-katakana",
              title: "Katakana a-row — coming soon",
              status: "locked" as const,
            },
          ],
        },
      ],
    };
  }

  return {
    id: "mock-1",
    title: `${langName} for Beginners`,
    languageId,
    modules: [
      {
        id: "m1",
        title: "Basics",
        lessons: [
          ...alphabetLesson,
          ...introLesson,
          { id: "m1-l1", title: "Greetings", status: "available" as const },
          { id: "m1-l2", title: "Numbers 1–10", status: "available" as const },
          { id: "m1-l3", title: "Colors", status: "locked" as const },
        ],
      },
      {
        id: "m2",
        title: "Everyday phrases",
        lessons: [
          { id: "m2-l1", title: "Please and thank you", status: "available" },
          { id: "m2-l2", title: "Asking for directions", status: "locked" },
          { id: "m2-l3", title: "At the market", status: "locked" },
        ],
      },
      {
        id: "m3",
        title: "Grammar foundations",
        lessons: [
          { id: "m3-l1", title: "Simple present", status: "locked" },
          { id: "m3-l2", title: "Questions", status: "locked" },
        ],
      },
    ],
  };
}
