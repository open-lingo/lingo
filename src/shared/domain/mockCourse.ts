import type { Course, SideQuest } from "./course";
import { getLanguageConfig } from "./languageConfig";
import {
  HIRAGANA_ROWS,
  DAKUTEN_ROWS,
  YOON_ROWS,
  type RowDef,
} from "@/features/lesson/data/hiraganaCurriculum";
import { MODULE_RECAP_LESSON_IDS } from "@/features/lesson/data/generatedHiraganaLessons";
import { KO_M1_ROWS } from "@/features/lesson/data/koreanCurriculum";

export const ALPHABET_LESSON_ID = "m1-l0-alphabet";

// `reviewModuleEntry` helper removed 2026-05-18 alongside the standalone
// inter-module Review pseudo-modules. The M3-M7 density rebuild now bakes
// compounding review into every sub-lesson tail (per
// docs/m3-m7-rebuild-spec-2026-05-18.md §3) so the separate pathway
// entries were dead weight. The lesson-data registration in
// `mockLessons.ts` was retired in the same edit.

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
    //   M2 = dakuten block (g/z/d/b/p, 3 content + 1 test each)
    //        then yōon block (yoon-intro / yoon-sh-ch / yoon-voiced /
    //        yoon-rare each 3 content + 1 test) then recap. The recap
    //        absorbs cross-yōon coverage (Hannah audit, 2026-05-17:
    //        standalone yoon-capstone removed — too many test nodes in a
    //        row read as exam week, not climax).
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

    // Module 2 — dakuten (g/z/d/b/p, 3 sub-lessons + test per row) +
    // yōon (4 rows × 3 sub-lessons + test) + recap.
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
        // M7 — Verbs in motion (dictionary + ます + を).
        // 2026-05-18: standalone inter-module Review pseudo-modules removed.
        // Compounding review is now baked into every M3-M7 sub-lesson per
        // m3-m7-rebuild-spec-2026-05-18.md §3 (review-to-new ratio ≥0.25),
        // so the separate R1-R4 pathway entries became dead pathway weight.
        // `buildModuleReviewLessons` + `moduleReviewSchedule` infra kept
        // alive for future FSRS-tier surfacing on the Learn / flashcards
        // surfaces (per curriculum-roadmap §6 module-review subsection).
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

  const isKorean = languageId === "ko";

  if (isKorean) {
    // Curriculum rebuild (2026-05-19): Korean mirrors the JA depth pattern.
    //   M1 = Hangul foundation — concept intro → 2 vowel sub-lessons → 9
    //        plain-consonant rows × 3 sub-lessons each. Pure script,
    //        minimal vocab (concept-first; the legacy m1-l1/m1-l2
    //        "Greetings / Introductions" lessons were deleted because
    //        they threw words at learners who couldn't read them).
    //   M2 = aspirated + tense consonants + y/compound vowels + final
    //        consonants (받침). Pathway scaffolded; content lands in a
    //        follow-up pass — the lesson ids resolve to null in
    //        mockLessons for now, mirroring how JA modules existed in
    //        the pathway before their content was authored.
    //   M3 = first phrases — greetings, intros, 이에요/예요. Brings the
    //        m1-l1/m1-l2 vocab back, now that learners can actually read it.
    const m1Lessons: { id: string; title: string; status: "available"; kind?: "recap" }[] = [
      { id: "ko-m1-intro", title: "How Hangul works",    status: "available" as const },
      { id: "ko-m1-v-1",   title: "Vowels — Intro 1",    status: "available" as const },
      { id: "ko-m1-v-2",   title: "Vowels — Intro 2",    status: "available" as const },
    ];
    for (const row of KO_M1_ROWS) {
      for (const suffix of ["1", "2", "3"] as const) {
        const label = suffix === "3" ? "Review" : `Intro ${suffix}`;
        m1Lessons.push({
          id: `ko-m1-${row.id}-${suffix}`,
          title: `${row.title} — ${label}`,
          status: "available" as const,
        });
      }
    }

    const m2Lessons = [
      { id: "ko-m2-asp-c-1",   title: "Aspirated ㅊ — Intro 1",   status: "available" as const },
      { id: "ko-m2-asp-c-2",   title: "Aspirated ㅊ — Intro 2",   status: "available" as const },
      { id: "ko-m2-asp-k-1",   title: "Aspirated ㅋ — Intro 1",   status: "available" as const },
      { id: "ko-m2-asp-k-2",   title: "Aspirated ㅋ — Intro 2",   status: "available" as const },
      { id: "ko-m2-asp-t-1",   title: "Aspirated ㅌ",             status: "available" as const },
      { id: "ko-m2-asp-p-1",   title: "Aspirated ㅍ",             status: "available" as const },
      { id: "ko-m2-tense-1",   title: "Tense ㄲ ㄸ",              status: "available" as const },
      { id: "ko-m2-tense-2",   title: "Tense ㅃ ㅆ ㅉ",          status: "available" as const },
      { id: "ko-m2-yv-1",      title: "Y-vowels ㅑ ㅕ ㅛ ㅠ",     status: "available" as const },
      { id: "ko-m2-comp-1",    title: "Compound vowels ㅐ ㅔ",   status: "available" as const },
      { id: "ko-m2-comp-2",    title: "W-vowels ㅘ ㅙ ㅝ ㅞ",     status: "available" as const },
      { id: "ko-m2-batchim-1", title: "Final consonants (받침)", status: "available" as const },
    ];

    const m3Lessons = [
      { id: "ko-m3-1", title: "Greetings — 안녕하세요",          status: "available" as const },
      { id: "ko-m3-2", title: "Formality — formal vs. polite",     status: "available" as const },
      { id: "ko-m3-3", title: "이에요 / 예요 — the copula",        status: "available" as const },
      { id: "ko-m3-4", title: "저는 X 이에요 — introducing yourself", status: "available" as const },
      { id: "ko-m3-5", title: "Asking names — 이름이 뭐예요?",     status: "available" as const },
      { id: "ko-m3-6", title: "Numbers 1–10 (Sino-Korean)",       status: "available" as const },
      { id: "ko-m3-7", title: "Mini-dialogue — meeting someone",   status: "available" as const },
      { id: "ko-m3-8", title: "M3 Mastery Test",                  status: "available" as const },
    ];

    const sideQuests: SideQuest[] = [
      {
        id: "ko-survival-phrasebook",
        emoji: "🗺️",
        title: "Survival Phrasebook",
        meta: "15 essentials · ~5 min · travel-ready",
        progress: 0,
      },
      {
        id: "kdrama-vocab",
        emoji: "📺",
        title: "K-drama Vocab",
        meta: "12 words · oppa, daebak…",
        progress: 0,
      },
      {
        id: "kfood-vocab",
        emoji: "🍜",
        title: "Korean Food",
        meta: "10 words · 비빔밥, 김치, 라면",
        unlockAfter: "ko-m1-complete",
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
          title: "The Hangul foundation",
          eyebrow: "Module 1 · Reading",
          summary: "Concept + 6 vowels + 9 plain consonants. By the end you can read any pure-plain-consonant Korean syllable.",
          lessons: m1Lessons,
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          id: "m2",
          title: "Aspirated · Tense · Extended vowels",
          eyebrow: "Module 2 · Finishing the script",
          summary: "Aspirated and tense consonants, y/compound vowels, and final consonants (받침). Everything you need to read every Korean syllable.",
          lessons: m2Lessons,
          accent: { from: "#6366f1", to: "#8b5cf6" },
        },
        {
          id: "m3",
          title: "First phrases",
          eyebrow: "Module 3 · Speak",
          summary: "Greetings, introductions, 이에요/예요. Real vocabulary on top of a real reading foundation.",
          lessons: m3Lessons,
          accent: { from: "#ec4899", to: "#db2777" },
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
