import type { Course, SideQuest } from "./course";
import { getLanguageConfig } from "./languageConfig";
import {
  HIRAGANA_ROWS,
  DAKUTEN_ROWS,
  YOON_ROWS,
  type RowDef,
} from "@/features/lesson/data/hiraganaCurriculum";
import { MODULE_RECAP_LESSON_IDS } from "@/features/lesson/data/generatedHiraganaLessons";

export const ALPHABET_LESSON_ID = "m1-l0-alphabet";

/**
 * Helper for building inter-module review-module entries (M3 restructure
 * 2026-05-16). Each review module = 3 review lessons + 1 mastery test
 * (id-suffix `-test`) authored by `buildModuleReviewLessons`. Lessons
 * carry kind="module_review" so UI surfaces them as separate from regular
 * content modules.
 */
function reviewModuleEntry(
  reviewModuleId: string,
  title: string,
  accent: { from: string; to: string },
) {
  return {
    id: reviewModuleId,
    title,
    eyebrow: "Review",
    summary: "Inter-module review cycle. SRS-style spaced retention.",
    lessons: [
      { id: `ja-${reviewModuleId}-1`, title: `${title} · 1 of 3`, status: "available" as const, kind: "module_review" as const },
      { id: `ja-${reviewModuleId}-2`, title: `${title} · 2 of 3`, status: "available" as const, kind: "module_review" as const },
      { id: `ja-${reviewModuleId}-3`, title: `${title} · 3 of 3`, status: "available" as const, kind: "module_review" as const },
      { id: `ja-${reviewModuleId}-test`, title: `${title} · Mastery`, status: "available" as const, kind: "module_review" as const },
    ],
    accent,
  };
}

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
    // Curriculum-restructure (2026-05-15):
    //   M1 = pure hiragana only (vowels + 9 base rows + recap).
    //   M2 = dakuten block (g/z/d/b/p, compact 1 content + 1 test each)
    //        then yōon block (yoon-intro / yoon-sh-ch / yoon-voiced /
    //        yoon-rare each compact 1 content + 1 test, plus a final
    //        yoon-capstone test-only sweep) then recap.
    //
    // Yōon prereq: every yōon row carries `prerequisites: ["ya"]` which
    // `isLessonLocked` honors — yōon stays locked until the full ya-row
    // is complete, even when M2 itself is unlocked.

    // Emit one lesson per sub-lesson. Each sub-lesson becomes its own
    // pathway node; ModulePathway groups them into a row cluster by
    // parsing the id prefix.
    const rowToLessons = (row: RowDef | undefined) => {
      if (!row) return []; // defensive — yōon ids may transition during HMR
      const subs = row.subLessons ?? [];
      if (subs.length === 0) {
        return [
          {
            id: `ja-m1-${row.id}`,
            title: row.title,
            status: "available" as const,
          },
        ];
      }
      return subs.map((sub) => ({
        id: `ja-m1-${row.id}-${sub.suffix}`,
        title: `${row.title.split(":")[0]} — ${sub.label}`,
        status: "available" as const,
      }));
    };

    // Module 1 — pure hiragana. Vowels stub + 9 HIRAGANA_ROWS + recap.
    // The legacy "Learn the Alphabet" + "Intro to Japanese" lessons are
    // skipped for JA — learners go straight into vowels.
    const m1Lessons: {
      id: string;
      title: string;
      status: "available";
      kind?: "recap";
    }[] = [
      {
        id: "ja-m1-l1-1",
        title: "Vowels — Intro 1",
        status: "available" as const,
      },
      {
        id: "ja-m1-l1-2",
        title: "Vowels — Intro 2",
        status: "available" as const,
      },
    ];
    for (const row of HIRAGANA_ROWS) {
      m1Lessons.push(...rowToLessons(row));
    }
    // Phase 2: module-recap node — final lesson, amber styling, ~15 items.
    const m1RecapId = MODULE_RECAP_LESSON_IDS["m1"];
    if (m1RecapId) {
      m1Lessons.push({
        id: m1RecapId,
        title: "Module 1 — Recap",
        status: "available" as const,
        kind: "recap" as const,
      });
    }

    // Module 2 — dakuten (compressed to 2 sub-lessons + test per row) +
    // yōon (4 compressed rows + a capstone) + recap.
    const m2Lessons: {
      id: string;
      title: string;
      status: "available";
      kind?: "recap";
    }[] = [];
    for (const row of DAKUTEN_ROWS) {
      m2Lessons.push(...rowToLessons(row));
    }
    for (const row of YOON_ROWS) {
      m2Lessons.push(...rowToLessons(row));
    }
    const m2RecapId = MODULE_RECAP_LESSON_IDS["m2"];
    if (m2RecapId) {
      m2Lessons.push({
        id: m2RecapId,
        title: "Module 2 — Recap",
        status: "available" as const,
        kind: "recap" as const,
      });
    }

    const sideQuests: SideQuest[] = [
      {
        // Survival Phrasebook — pinned first (day-1 unlock per
        // curriculum-design-v2 §6). Audio-driven, romaji-first; solves
        // the Priya persona: travelers who want functional Japanese
        // before grinding the kana chart.
        id: "ja-survival-phrasebook",
        emoji: "🗺️",
        title: "Survival Phrasebook",
        meta: "15 essentials · ~5 min · travel-ready",
        progress: 0,
      },
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
        // M3 — First sentences (です + か, は as topic).
        {
          id: "m3",
          title: "First sentences",
          eyebrow: "Module 3 · Speak",
          summary: "です + か + は as topic. Adjective EXPOSURE in examples; no formal conjugation yet.",
          lessons: [
            { id: "ja-m3-1", title: "Katakana — the second alphabet", status: "available" as const },
            { id: "ja-m3-2", title: "です + か — your first sentences", status: "available" as const },
            { id: "ja-m3-3", title: "Things + colors in context", status: "available" as const },
            { id: "ja-m3-4", title: "は — the topic marker", status: "available" as const },
            { id: "ja-m3-5", title: "Interleaved drill — は + です + か", status: "available" as const },
            { id: "ja-m3-6", title: "Sentence Build — putting it together", status: "available" as const },
            { id: "ja-m3-7", title: "Mini-dialogue — meeting someone", status: "available" as const },
            { id: "ja-m3-8", title: "M3 Mastery Test", status: "available" as const },
          ],
          accent: { from: "#ec4899", to: "#db2777" },
        },
        // R1 — Review · M3
        reviewModuleEntry("m3-review", "Review · M3", { from: "#fbbf24", to: "#f59e0b" }),
        // M4 — Things and people (の + これ/それ/あれ/どれ).
        {
          id: "m4",
          title: "Things and people",
          eyebrow: "Module 4 · Possessives + pointers",
          summary: "の (possession) + the four-way pointer system これ/それ/あれ/どれ.",
          lessons: [
            { id: "ja-m4-1", title: "Everyday objects", status: "available" as const },
            { id: "ja-m4-2", title: "の — possession", status: "available" as const },
            { id: "ja-m4-3", title: "More objects + の in context", status: "available" as const },
            { id: "ja-m4-4", title: "これ / それ / あれ / どれ", status: "available" as const },
            { id: "ja-m4-5", title: "Interleaved drill — の + pointers + は", status: "available" as const },
            { id: "ja-m4-6", title: "Sentence Build — pointers + possessives", status: "available" as const },
            { id: "ja-m4-7", title: "Mini-dialogue — at a friend's place", status: "available" as const },
            { id: "ja-m4-8", title: "M4 Mastery Test", status: "available" as const },
          ],
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        // R2 — Review · M3+M4
        reviewModuleEntry("m4-review", "Review · M3 + M4", { from: "#fbbf24", to: "#f59e0b" }),
        // M5 — Numbers (1-10 + 人 counter).
        {
          id: "m5",
          title: "Numbers",
          eyebrow: "Module 5 · Counting",
          summary: "Numbers 1-10 + the 人 (people) counter. Café + transaction scenes.",
          lessons: [
            { id: "ja-m5-1", title: "Numbers 1–5", status: "available" as const },
            { id: "ja-m5-2", title: "Numbers 6–10 + ください", status: "available" as const },
            { id: "ja-m5-3", title: "Counting people — 人", status: "available" as const },
            { id: "ja-m5-4", title: "Café + transactions", status: "available" as const },
            { id: "ja-m5-5", title: "Interleaved — numbers + pointers + は", status: "available" as const },
            { id: "ja-m5-6", title: "Sentence Build — at the café", status: "available" as const },
            { id: "ja-m5-7", title: "Mini-dialogue — ordering coffee", status: "available" as const },
            { id: "ja-m5-8", title: "M5 Mastery Test", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        // R3 — Review · M3+M4+M5
        reviewModuleEntry("m5-review", "Review · M3 + M4 + M5", { from: "#fbbf24", to: "#f59e0b" }),
        // M6 — Where things are (に + で + が via existence).
        {
          id: "m6",
          title: "Where things are",
          eyebrow: "Module 6 · Locations",
          summary: "に + で + が introduced via existence (___ が あります / います).",
          lessons: [
            { id: "ja-m6-1", title: "Places", status: "available" as const },
            { id: "ja-m6-2", title: "に — destination + existence", status: "available" as const },
            { id: "ja-m6-3", title: "で — action setting + means", status: "available" as const },
            { id: "ja-m6-4", title: "が — there is / there are", status: "available" as const },
            { id: "ja-m6-5", title: "Interleaved — に + で", status: "available" as const },
            { id: "ja-m6-6", title: "Interleaved — が + あります / います", status: "available" as const },
            { id: "ja-m6-7", title: "Sentence Build — places + actions", status: "available" as const },
            { id: "ja-m6-8", title: "Mini-dialogue — asking directions", status: "available" as const },
            { id: "ja-m6-9", title: "M6 Mastery Test", status: "available" as const },
          ],
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        // R4 — Review · M4+M5+M6 (M3 has graduated to its own SRS by now).
        reviewModuleEntry("m6-review", "Review · M4 + M5 + M6", { from: "#fbbf24", to: "#f59e0b" }),
        // M7 — Verbs in motion (dictionary + ます + を).
        {
          id: "m7",
          title: "Verbs in motion",
          eyebrow: "Module 7 · Actions",
          summary: "Dictionary form + ます polite stem + を (direct object). Real sentences with action.",
          lessons: [
            { id: "ja-m7-1", title: "Verbs — dictionary + polite stem", status: "available" as const },
            { id: "ja-m7-2", title: "Dictionary form ↔ ます stem", status: "available" as const },
            { id: "ja-m7-3", title: "を — the direct-object particle", status: "available" as const },
            { id: "ja-m7-4", title: "Food + drink vocab", status: "available" as const },
            { id: "ja-m7-5", title: "Drill — verbs + を", status: "available" as const },
            { id: "ja-m7-6", title: "Interleaved — に + で + を", status: "available" as const },
            { id: "ja-m7-7", title: "Sentence Build — actions in the world", status: "available" as const },
            { id: "ja-m7-8", title: "Mini-dialogue — at a restaurant", status: "available" as const },
            { id: "ja-m7-9", title: "M7 Mastery Test", status: "available" as const },
          ],
          accent: { from: "#a855f7", to: "#9333ea" },
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
