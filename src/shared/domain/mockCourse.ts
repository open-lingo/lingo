import type { Course, SideQuest } from "./course";
import { getLanguageConfig } from "./languageConfig";
import {
  HIRAGANA_ROWS,
  DAKUTEN_ROWS,
  YOON_ROWS,
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
    // Yōon are sprinkled into the basic + dakuten modules right after the
    // last parent consonant row needed. This avoids dumping all yōon into
    // a separate module at the end where most kana would lack reinforcement.
    //
    //   yo-k       (k)              → after na-row (k consonant unlocked)
    //   yo-sh-ch   (s+ch)           → after ma-row (s + ch consonants unlocked)
    //   yo-g-j     (g+j, dakuten)   → after za-row (z→j, g from m2)
    //   yo-n-h-m-r (n,h,m,r capstone) → after pa-row (all consonants unlocked)
    //   yo-b-p     (b+p, handakuten)  → after pa-row
    const yoonById = Object.fromEntries(YOON_ROWS.map((y) => [y.id, y]));
    const toLesson = (row: { id: string; title: string }) => ({
      id: `ja-m1-${row.id}`,
      title: row.title,
      status: "available" as const,
    });

    // Module 1 — basic rows interleaved with yo-k (after na) and yo-sh-ch
    // (after ma). The legacy "Learn the Alphabet" + "Intro to Japanese"
    // lessons are skipped for JA — learners go straight into vowels.
    const m1Lessons = [
      {
        id: "ja-m1-l1",
        title: "Vowels: あ い う え お",
        status: "available" as const,
      },
    ];
    for (const row of HIRAGANA_ROWS) {
      m1Lessons.push(toLesson(row));
      if (row.id === "na") m1Lessons.push(toLesson(yoonById["yo-k"]));
      if (row.id === "ma") m1Lessons.push(toLesson(yoonById["yo-sh-ch"]));
    }

    // Module 2 — voicing + the three yōon sets that need dakuten/handakuten
    // prereqs. yo-g-j after za, yo-n-h-m-r + yo-b-p after pa as capstone.
    const m2Lessons: { id: string; title: string; status: "available" }[] = [];
    for (const row of DAKUTEN_ROWS) {
      m2Lessons.push(toLesson(row));
      if (row.id === "za") m2Lessons.push(toLesson(yoonById["yo-g-j"]));
      if (row.id === "pa") {
        m2Lessons.push(toLesson(yoonById["yo-n-h-m-r"]));
        m2Lessons.push(toLesson(yoonById["yo-b-p"]));
      }
    }

    const sideQuests: SideQuest[] = [
      {
        id: "anime-vocab",
        emoji: "🌸",
        title: "Anime Vocab",
        meta: "12 words · senpai, kawaii…",
        progress: 0,
      },
      {
        id: "travel-specifics",
        emoji: "✈️",
        title: "Travel Specifics",
        meta: "10 words · subway, hotel, taxi",
        unlockAfter: "ja-m1-complete",
        progress: 0,
      },
      {
        id: "festivals-culture",
        emoji: "⛩️",
        title: "Festivals & Culture",
        meta: "8 words · 桜, 祭, 神社",
        unlockAfter: "ja-m2-complete",
        progress: 0,
      },
      {
        id: "gaming-vocab",
        emoji: "🎮",
        title: "Gaming Vocab",
        meta: "14 words · attack, level up, boss",
        unlockAfter: "ja-m2-complete",
        progress: 0,
      },
      {
        id: "daily-challenge",
        emoji: "⚡",
        title: "Daily Challenge",
        meta: "+20 XP · 60s timer",
        progress: 0,
        isDaily: true,
      },
    ];

    return {
      id: "mock-1",
      title: `${langName} for Beginners`,
      languageId,
      modules: [
        {
          id: "m1",
          title: "The first 46 sounds",
          eyebrow: "Module 1 · Hiragana",
          summary: "Foundation kana for reading anything written in Japanese.",
          lessons: m1Lessons,
          accent: { from: "#059669", to: "#047857" },
        },
        {
          id: "m2",
          title: "Dakuten · Handakuten · Yōon dakuten",
          eyebrow: "Module 2 · Voicing",
          summary: "Voiced consonants and yōon dakuten variations.",
          lessons: m2Lessons,
          accent: { from: "#6366f1", to: "#8b5cf6" },
        },
        {
          id: "m3",
          title: "Loanwords & the second alphabet",
          eyebrow: "Module 3 · Katakana",
          summary: "Foreign words, brand names, the angular second script.",
          lessons: [],
          accent: { from: "#ec4899", to: "#db2777" },
          comingSoon: true,
        },
        {
          id: "m4",
          title: "Counters, time, days, money",
          eyebrow: "Module 4 · Numbers & Counting",
          summary: "Japanese counters and the time / date / money systems.",
          lessons: [],
          accent: { from: "#f59e0b", to: "#d97706" },
          comingSoon: true,
        },
        {
          id: "m5",
          title: "Hello, my name is, where I'm from",
          eyebrow: "Module 5 · Greetings & Self",
          summary: "Introduce yourself and exchange basic pleasantries.",
          lessons: [],
          accent: { from: "#0ea5e9", to: "#0284c7" },
          comingSoon: true,
        },
        {
          id: "m6",
          title: "です, particles は・を・に",
          eyebrow: "Module 6 · Simple Sentences",
          summary: "Build your first real sentences with core particles.",
          lessons: [],
          accent: { from: "#14b8a6", to: "#0d9488" },
          comingSoon: true,
        },
      ],
      sideQuests,
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
