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
        title: "Vowels — あ い う",
        status: "available" as const,
      },
      {
        id: "ja-m1-l1-2",
        title: "Vowels — え お",
        status: "available" as const,
      },
      {
        id: "ja-m1-l1-3",
        title: "Vowels — Full Review",
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
        id: "ja-travel-sprint",
        emoji: "✈️",
        title: "Travel Sprint",
        meta: "4 lessons · listen & speak · Pimsleur-style",
        progress: 0,
        featured: true,
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

    // Placement test — disabled pending adaptive redesign (2026-05-25).
    // The shallow kana-only test was too limited. Future version will
    // adaptively test kana → grammar → vocab → kanji, walking up the
    // module ladder until it finds the learner's frontier. Code lives
    // in buildPlacementTest.ts + placementResult.ts, ready to re-enable.

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
            { id: "ja-m3-1-1", title: "Katakana — Intro", status: "available" as const },
            { id: "ja-m3-1-2", title: "Katakana — Practice", status: "available" as const },
            { id: "ja-m3-2-1", title: "です + か — Intro", status: "available" as const },
            { id: "ja-m3-2-2", title: "です + か — Practice", status: "available" as const },
            { id: "ja-m3-3-1", title: "Things + colors — Intro", status: "available" as const },
            { id: "ja-m3-3-2", title: "Things + colors — Practice", status: "available" as const },
            { id: "ja-m3-4-1", title: "は — Intro", status: "available" as const },
            { id: "ja-m3-4-2", title: "は — Practice", status: "available" as const },
            { id: "ja-m3-5-1", title: "Mixed drill — Intro", status: "available" as const },
            { id: "ja-m3-5-2", title: "Mixed drill — Practice", status: "available" as const },
            { id: "ja-m3-6-1", title: "Sentence Build — Intro", status: "available" as const },
            { id: "ja-m3-6-2", title: "Sentence Build — Practice", status: "available" as const },
            { id: "ja-m3-7-1", title: "Mini-dialogue — Intro", status: "available" as const },
            { id: "ja-m3-7-2", title: "Mini-dialogue — Practice", status: "available" as const },
            { id: "ja-m3-review-1", title: "Module 3 — Review 1", status: "available" as const },
            { id: "ja-m3-review-2", title: "Module 3 — Review 2", status: "available" as const },
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
            { id: "ja-m4-1-1", title: "Everyday objects — Intro", status: "available" as const },
            { id: "ja-m4-1-2", title: "Everyday objects — Practice", status: "available" as const },
            { id: "ja-m4-2-1", title: "の — Intro", status: "available" as const },
            { id: "ja-m4-2-2", title: "の — Practice", status: "available" as const },
            { id: "ja-m4-3-1", title: "More objects — Intro", status: "available" as const },
            { id: "ja-m4-3-2", title: "More objects — Practice", status: "available" as const },
            { id: "ja-m4-4-1", title: "Pointers — Intro", status: "available" as const },
            { id: "ja-m4-4-2", title: "Pointers — Practice", status: "available" as const },
            { id: "ja-m4-5-1", title: "Mixed drill — Intro", status: "available" as const },
            { id: "ja-m4-5-2", title: "Mixed drill — Practice", status: "available" as const },
            { id: "ja-m4-6-1", title: "Sentence Build — Intro", status: "available" as const },
            { id: "ja-m4-6-2", title: "Sentence Build — Practice", status: "available" as const },
            { id: "ja-m4-7-1", title: "Mini-dialogue — Intro", status: "available" as const },
            { id: "ja-m4-7-2", title: "Mini-dialogue — Practice", status: "available" as const },
            { id: "ja-m4-review-1", title: "Module 4 — Review 1", status: "available" as const },
            { id: "ja-m4-review-2", title: "Module 4 — Review 2", status: "available" as const },
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
            { id: "ja-m5-1-1", title: "Numbers 1–3", status: "available" as const },
            { id: "ja-m5-1-2", title: "Numbers 4–5 + consolidation", status: "available" as const },
            { id: "ja-m5-2-1", title: "Numbers 6–8", status: "available" as const },
            { id: "ja-m5-2-2", title: "Numbers 9–10 + consolidation", status: "available" as const },
            { id: "ja-m5-3-1", title: "ください — the order word", status: "available" as const },
            { id: "ja-m5-3-2", title: "ください + quantity orders", status: "available" as const },
            { id: "ja-m5-4-1", title: "Counting people — ひとり & ふたり", status: "available" as const },
            { id: "ja-m5-4-2", title: "Counting people — 3, 4, 5", status: "available" as const },
            { id: "ja-m5-5-1", title: "Money talk — おかね, いくら, えん", status: "available" as const },
            { id: "ja-m5-5-2", title: "おちゃ + ordering drill", status: "available" as const },
            { id: "ja-m5-6-1", title: "から (from) — origin marker", status: "available" as const },
            { id: "ja-m5-6-2", title: "Mixed drill — は / の / から / ください", status: "available" as const },
            { id: "ja-m5-7-1", title: "Sentence build — cafe production", status: "available" as const },
            { id: "ja-m5-7-2", title: "Mini-dialogue — ordering at a cafe", status: "available" as const },
            { id: "ja-m5-review-1", title: "Module 5 — Review 1", status: "available" as const },
            { id: "ja-m5-review-2", title: "Module 5 — Review 2", status: "available" as const },
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
            { id: "ja-m6-1-1", title: "Places — Intro", status: "available" as const },
            { id: "ja-m6-1-2", title: "Places — Practice", status: "available" as const },
            { id: "ja-m6-2-1", title: "に — Intro", status: "available" as const },
            { id: "ja-m6-2-2", title: "に — Practice", status: "available" as const },
            { id: "ja-m6-3-1", title: "で — Intro", status: "available" as const },
            { id: "ja-m6-3-2", title: "で — Practice", status: "available" as const },
            { id: "ja-m6-4-1", title: "が + existence — Intro", status: "available" as const },
            { id: "ja-m6-4-2", title: "が + existence — Practice", status: "available" as const },
            { id: "ja-m6-5-1", title: "Interleaved に + で — Intro", status: "available" as const },
            { id: "ja-m6-5-2", title: "Interleaved に + で — Practice", status: "available" as const },
            { id: "ja-m6-6-1", title: "が + あります — Intro", status: "available" as const },
            { id: "ja-m6-6-2", title: "が + あります — Practice", status: "available" as const },
            { id: "ja-m6-7-1", title: "Sentence Build — Intro", status: "available" as const },
            { id: "ja-m6-7-2", title: "Sentence Build — Practice", status: "available" as const },
            { id: "ja-m6-8-1", title: "Mini-dialogue — Intro", status: "available" as const },
            { id: "ja-m6-8-2", title: "Mini-dialogue — Practice", status: "available" as const },
            { id: "ja-m6-review-1", title: "Module 6 — Review 1", status: "available" as const },
            { id: "ja-m6-review-2", title: "Module 6 — Review 2", status: "available" as const },
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
            { id: "ja-m7-1-1", title: "Verbs — dictionary form (part 1)", status: "available" as const },
            { id: "ja-m7-1-2", title: "Verbs — dictionary form (part 2)", status: "available" as const },
            { id: "ja-m7-2-1", title: "Dictionary ↔ ます stem (part 1)", status: "available" as const },
            { id: "ja-m7-2-2", title: "Dictionary ↔ ます stem (part 2)", status: "available" as const },
            { id: "ja-m7-3-1", title: "を — direct-object particle (part 1)", status: "available" as const },
            { id: "ja-m7-3-2", title: "を — rotating drills (part 2)", status: "available" as const },
            { id: "ja-m7-4-1", title: "Food + drink vocab (part 1)", status: "available" as const },
            { id: "ja-m7-4-2", title: "Food + drink vocab (part 2)", status: "available" as const },
            { id: "ja-m7-5-1", title: "Drill — を rotated (part 1)", status: "available" as const },
            { id: "ja-m7-5-2", title: "Drill — を rotated (part 2)", status: "available" as const },
            { id: "ja-m7-6-1", title: "Compound sentences (part 1)", status: "available" as const },
            { id: "ja-m7-6-2", title: "Compound sentences (part 2)", status: "available" as const },
            { id: "ja-m7-7-1", title: "Production — actions (part 1)", status: "available" as const },
            { id: "ja-m7-7-2", title: "Production — actions (part 2)", status: "available" as const },
            { id: "ja-m7-8-1", title: "Mini-dialogue — ramen shop (part 1)", status: "available" as const },
            { id: "ja-m7-8-2", title: "Cumulative review — M7 wrap-up", status: "available" as const },
            { id: "ja-m7-review-1", title: "Module 7 — Review 1", status: "available" as const },
            { id: "ja-m7-review-2", title: "Module 7 — Review 2", status: "available" as const },
          ],
          accent: { from: "#a855f7", to: "#9333ea" },
        },
        // M8 — i-Adjectives (この/その/あの/どの + い-adj conjugation + と)
        {
          id: "m8",
          title: "Describing things",
          eyebrow: "Module 8 · Adjectives I",
          summary: "い-adjective conjugation (たかい → たかくない) + この/その/あの/どの + と (and).",
          lessons: [
            { id: "ja-m8-1-1", title: "Describing things — Intro", status: "available" as const },
            { id: "ja-m8-1-2", title: "Describing things — Practice", status: "available" as const },
            { id: "ja-m8-2-1", title: "Good and bad — Intro", status: "available" as const },
            { id: "ja-m8-2-2", title: "Good and bad — Practice", status: "available" as const },
            { id: "ja-m8-3-1", title: "Hot and cold — Intro", status: "available" as const },
            { id: "ja-m8-3-2", title: "Hot and cold — Practice", status: "available" as const },
            { id: "ja-m8-4-1", title: "Long and short — Intro", status: "available" as const },
            { id: "ja-m8-4-2", title: "Long and short — Practice", status: "available" as const },
            { id: "ja-m8-5-1", title: "Hard and easy — Intro", status: "available" as const },
            { id: "ja-m8-5-2", title: "Hard and easy — Practice", status: "available" as const },
            { id: "ja-m8-6-1", title: "Near and far — Intro", status: "available" as const },
            { id: "ja-m8-6-2", title: "Near and far — Practice", status: "available" as const },
            { id: "ja-m8-story", title: "Shopping dialogue", status: "available" as const },
            { id: "ja-m8-7-1", title: "Mixed adjective drill", status: "available" as const },
            { id: "ja-m8-7-2", title: "Adjective production", status: "available" as const },
            { id: "ja-m8-review-1", title: "Module 8 — Review 1", status: "available" as const },
            { id: "ja-m8-review-2", title: "Module 8 — Review 2", status: "available" as const },
          ],
          accent: { from: "#f43f5e", to: "#e11d48" },
        },
        // M9 — na-Adjectives + よ/ね sentence-final particles
        {
          id: "m9",
          title: "Qualities & feelings",
          eyebrow: "Module 9 · Adjectives II",
          summary: "な-adjective conjugation (きれい → きれいじゃない) + よ (emphasis) + ね (agreement).",
          lessons: [
            { id: "ja-m9-1-1", title: "Pretty and quiet — Intro", status: "available" as const },
            { id: "ja-m9-1-2", title: "Pretty and quiet — Practice", status: "available" as const },
            { id: "ja-m9-2-1", title: "Like and dislike — Intro", status: "available" as const },
            { id: "ja-m9-2-2", title: "Like and dislike — Practice", status: "available" as const },
            { id: "ja-m9-3-1", title: "Good at, bad at — Intro", status: "available" as const },
            { id: "ja-m9-3-2", title: "Good at, bad at — Practice", status: "available" as const },
            { id: "ja-m9-4-1", title: "How are you? — Intro", status: "available" as const },
            { id: "ja-m9-4-2", title: "How are you? — Practice", status: "available" as const },
            { id: "ja-m9-5-1", title: "Convenient or not — Intro", status: "available" as const },
            { id: "ja-m9-5-2", title: "Convenient or not — Practice", status: "available" as const },
            { id: "ja-m9-6-1", title: "Famous and lively — Intro", status: "available" as const },
            { id: "ja-m9-6-2", title: "Famous and lively — Practice", status: "available" as const },
            { id: "ja-m9-story", title: "Neighborhood visit", status: "available" as const },
            { id: "ja-m9-7-1", title: "i vs na discrimination", status: "available" as const },
            { id: "ja-m9-7-2", title: "Adjective production", status: "available" as const },
            { id: "ja-m9-review-1", title: "Module 9 — Review 1", status: "available" as const },
            { id: "ja-m9-review-2", title: "Module 9 — Review 2", status: "available" as const },
          ],
          accent: { from: "#8b5cf6", to: "#7c3aed" },
        },
        // M10 — Past tense (polite forms only — no た-form)
        {
          id: "m10",
          title: "What happened?",
          eyebrow: "Module 10 · Past tense",
          summary: "ました + でした + adjective past forms. Polite past only — plain past comes with て-form.",
          lessons: [
            { id: "ja-m10-1-1", title: "What did you do? — Intro", status: "available" as const },
            { id: "ja-m10-1-2", title: "What did you do? — Practice", status: "available" as const },
            { id: "ja-m10-2-1", title: "Morning routine — Intro", status: "available" as const },
            { id: "ja-m10-2-2", title: "Morning routine — Practice", status: "available" as const },
            { id: "ja-m10-3-1", title: "It was... — Intro", status: "available" as const },
            { id: "ja-m10-3-2", title: "It was... — Practice", status: "available" as const },
            { id: "ja-m10-4-1", title: "It was expensive — Intro", status: "available" as const },
            { id: "ja-m10-4-2", title: "It was expensive — Practice", status: "available" as const },
            { id: "ja-m10-5-1", title: "It was pretty — Intro", status: "available" as const },
            { id: "ja-m10-5-2", title: "It was pretty — Practice", status: "available" as const },
            { id: "ja-m10-6-1", title: "Last week — Intro", status: "available" as const },
            { id: "ja-m10-6-2", title: "Last week — Practice", status: "available" as const },
            { id: "ja-m10-story", title: "Yesterday's adventure", status: "available" as const },
            { id: "ja-m10-7-1", title: "Mixed past drill", status: "available" as const },
            { id: "ja-m10-7-2", title: "Past tense production", status: "available" as const },
            { id: "ja-m10-review-1", title: "Module 10 — Review 1", status: "available" as const },
            { id: "ja-m10-review-2", title: "Module 10 — Review 2", status: "available" as const },
          ],
          accent: { from: "#06b6d4", to: "#0891b2" },
        },
        // M11 — Negation (ません, ない-form, まだ/もう)
        {
          id: "m11",
          title: "Saying no",
          eyebrow: "Module 11 · Negation",
          summary: "ません + ませんでした + ない-form (casual negative) + まだ/もう (still/already).",
          lessons: [
            { id: "ja-m11-1-1", title: "I don't... — Intro", status: "available" as const },
            { id: "ja-m11-1-2", title: "I don't... — Practice", status: "available" as const },
            { id: "ja-m11-2-1", title: "I didn't... — Intro", status: "available" as const },
            { id: "ja-m11-2-2", title: "I didn't... — Practice", status: "available" as const },
            { id: "ja-m11-3-1", title: "Not much, not at all — Intro", status: "available" as const },
            { id: "ja-m11-3-2", title: "Not much, not at all — Practice", status: "available" as const },
            { id: "ja-m11-4-1", title: "Plain negative — Intro", status: "available" as const },
            { id: "ja-m11-4-2", title: "Plain negative — Practice", status: "available" as const },
            { id: "ja-m11-5-1", title: "Still and already — Intro", status: "available" as const },
            { id: "ja-m11-5-2", title: "Still and already — Practice", status: "available" as const },
            { id: "ja-m11-6-1", title: "Every day — Intro", status: "available" as const },
            { id: "ja-m11-6-2", title: "Every day — Practice", status: "available" as const },
            { id: "ja-m11-story", title: "Daily habits dialogue", status: "available" as const },
            { id: "ja-m11-7-1", title: "Mixed negation drill", status: "available" as const },
            { id: "ja-m11-7-2", title: "Negation production", status: "available" as const },
            { id: "ja-m11-review-1", title: "Module 11 — Review 1", status: "available" as const },
            { id: "ja-m11-review-2", title: "Module 11 — Review 2", status: "available" as const },
          ],
          accent: { from: "#ef4444", to: "#dc2626" },
        },
        // M12 — Time & Calendar
        {
          id: "m12",
          title: "Telling time",
          eyebrow: "Module 12 · Time",
          summary: "Clock time (じ/ふん) + days of the week + に (time marker) + numbers 11-99.",
          lessons: [
            { id: "ja-m12-1-1", title: "What time? (1-6) — Intro", status: "available" as const },
            { id: "ja-m12-1-2", title: "What time? (1-6) — Practice", status: "available" as const },
            { id: "ja-m12-2-1", title: "Hours 7-12 — Intro", status: "available" as const },
            { id: "ja-m12-2-2", title: "Hours 7-12 — Practice", status: "available" as const },
            { id: "ja-m12-3-1", title: "Minutes — Intro", status: "available" as const },
            { id: "ja-m12-3-2", title: "Minutes — Practice", status: "available" as const },
            { id: "ja-m12-4-1", title: "Days of the week — Intro", status: "available" as const },
            { id: "ja-m12-4-2", title: "Days of the week — Practice", status: "available" as const },
            { id: "ja-m12-5-1", title: "Time に — Intro", status: "available" as const },
            { id: "ja-m12-5-2", title: "Time に — Practice", status: "available" as const },
            { id: "ja-m12-6-1", title: "Numbers 11-99 — Intro", status: "available" as const },
            { id: "ja-m12-6-2", title: "Numbers 11-99 — Practice", status: "available" as const },
            { id: "ja-m12-story", title: "Making plans", status: "available" as const },
            { id: "ja-m12-7-1", title: "Mixed time drill", status: "available" as const },
            { id: "ja-m12-7-2", title: "Time production", status: "available" as const },
            { id: "ja-m12-review-1", title: "Module 12 — Review 1", status: "available" as const },
            { id: "ja-m12-review-2", title: "Module 12 — Review 2", status: "available" as const },
          ],
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        // M13 — Months + Frequency + から (because)
        {
          id: "m13",
          title: "Schedules & reasons",
          eyebrow: "Module 13 · Calendar",
          summary: "Months + frequency adverbs + から...まで (from...until) + から (because).",
          lessons: [
            { id: "ja-m13-1-1", title: "Months 1-6 — Intro", status: "available" as const },
            { id: "ja-m13-1-2", title: "Months 1-6 — Practice", status: "available" as const },
            { id: "ja-m13-2-1", title: "Months 7-12 — Intro", status: "available" as const },
            { id: "ja-m13-2-2", title: "Months 7-12 — Practice", status: "available" as const },
            { id: "ja-m13-3-1", title: "From...until — Intro", status: "available" as const },
            { id: "ja-m13-3-2", title: "From...until — Practice", status: "available" as const },
            { id: "ja-m13-4-1", title: "Because — Intro", status: "available" as const },
            { id: "ja-m13-4-2", title: "Because — Practice", status: "available" as const },
            { id: "ja-m13-5-1", title: "Daily routine — Intro", status: "available" as const },
            { id: "ja-m13-5-2", title: "Daily routine — Practice", status: "available" as const },
            { id: "ja-m13-6-1", title: "How often? — Intro", status: "available" as const },
            { id: "ja-m13-6-2", title: "How often? — Practice", status: "available" as const },
            { id: "ja-m13-story", title: "Planning a trip", status: "available" as const },
            { id: "ja-m13-7-1", title: "Mixed drill", status: "available" as const },
            { id: "ja-m13-7-2", title: "Schedule production", status: "available" as const },
            { id: "ja-m13-review-1", title: "Module 13 — Review 1", status: "available" as const },
            { id: "ja-m13-review-2", title: "Module 13 — Review 2", status: "available" as const },
          ],
          accent: { from: "#10b981", to: "#059669" },
        },
        // M14 — Te-form + Ta-form + Counters + Numbers 100-10000
        {
          id: "m14",
          title: "Te-form & counting",
          eyebrow: "Module 14 · Conjugation",
          summary: "て-form formation (THE core grammar) + た-form as derivative + てください + counters 個/枚/本.",
          lessons: [
            { id: "ja-m14-1-1", title: "Te-form: Group 2 — Intro", status: "available" as const },
            { id: "ja-m14-1-2", title: "Te-form: Group 2 — Practice", status: "available" as const },
            { id: "ja-m14-2-1", title: "Te-form: って — Intro", status: "available" as const },
            { id: "ja-m14-2-2", title: "Te-form: って — Practice", status: "available" as const },
            { id: "ja-m14-3-1", title: "Te-form: んで/いて — Intro", status: "available" as const },
            { id: "ja-m14-3-2", title: "Te-form: んで/いて — Practice", status: "available" as const },
            { id: "ja-m14-4-1", title: "Irregulars + た-form — Intro", status: "available" as const },
            { id: "ja-m14-4-2", title: "Irregulars + た-form — Practice", status: "available" as const },
            { id: "ja-m14-5-1", title: "Please do — Intro", status: "available" as const },
            { id: "ja-m14-5-2", title: "Please do — Practice", status: "available" as const },
            { id: "ja-m14-6-1", title: "Big numbers + counters — Intro", status: "available" as const },
            { id: "ja-m14-6-2", title: "Big numbers + counters — Practice", status: "available" as const },
            { id: "ja-m14-story", title: "At the electronics shop", status: "available" as const },
            { id: "ja-m14-7-1", title: "Mixed te-form drill", status: "available" as const },
            { id: "ja-m14-7-2", title: "Te-form production", status: "available" as const },
            { id: "ja-m14-review-1", title: "Module 14 — Review 1", status: "available" as const },
            { id: "ja-m14-review-2", title: "Module 14 — Review 2", status: "available" as const },
          ],
          accent: { from: "#6366f1", to: "#4f46e5" },
        },
        // M15 — ている + てもいい + Wants & Desires
        {
          id: "m15",
          title: "Doing & wanting",
          eyebrow: "Module 15 · Applications",
          summary: "〜ている (progressive) + 〜てもいい (permission) + 〜たい (want to) + ほしい + けど.",
          lessons: [
            { id: "ja-m15-1-1", title: "Right now — Intro", status: "available" as const },
            { id: "ja-m15-1-2", title: "Right now — Practice", status: "available" as const },
            { id: "ja-m15-2-1", title: "What are they doing? — Intro", status: "available" as const },
            { id: "ja-m15-2-2", title: "What are they doing? — Practice", status: "available" as const },
            { id: "ja-m15-3-1", title: "May I? — Intro", status: "available" as const },
            { id: "ja-m15-3-2", title: "May I? — Practice", status: "available" as const },
            { id: "ja-m15-4-1", title: "I want to... — Intro", status: "available" as const },
            { id: "ja-m15-4-2", title: "I want to... — Practice", status: "available" as const },
            { id: "ja-m15-5-1", title: "I want... — Intro", status: "available" as const },
            { id: "ja-m15-5-2", title: "I want... — Practice", status: "available" as const },
            { id: "ja-m15-6-1", title: "But... — Intro", status: "available" as const },
            { id: "ja-m15-6-2", title: "But... — Practice", status: "available" as const },
            { id: "ja-m15-story", title: "Planning a trip", status: "available" as const },
            { id: "ja-m15-7-1", title: "Mixed drill", status: "available" as const },
            { id: "ja-m15-7-2", title: "Desires production", status: "available" as const },
            { id: "ja-m15-review-1", title: "Module 15 — Review 1", status: "available" as const },
            { id: "ja-m15-review-2", title: "Module 15 — Review 2", status: "available" as const },
          ],
          accent: { from: "#ec4899", to: "#db2777" },
        },
        // M16 — Te-form Part 2 (prohibition + sequence + すき/きらい)
        {
          id: "m16",
          title: "Rules & routines",
          eyebrow: "Module 16 · Te-form II",
          summary: "〜てはいけません (prohibition) + ないでください + てから (sequence) + のがすき/きらい.",
          lessons: [
            { id: "ja-m16-1-1", title: "You must not — Intro", status: "available" as const },
            { id: "ja-m16-1-2", title: "You must not — Practice", status: "available" as const },
            { id: "ja-m16-2-1", title: "Please don't — Intro", status: "available" as const },
            { id: "ja-m16-2-2", title: "Please don't — Practice", status: "available" as const },
            { id: "ja-m16-3-1", title: "After doing X — Intro", status: "available" as const },
            { id: "ja-m16-3-2", title: "After doing X — Practice", status: "available" as const },
            { id: "ja-m16-4-1", title: "I like doing... — Intro", status: "available" as const },
            { id: "ja-m16-4-2", title: "I like doing... — Practice", status: "available" as const },
            { id: "ja-m16-5-1", title: "Rules — Intro", status: "available" as const },
            { id: "ja-m16-5-2", title: "Rules — Practice", status: "available" as const },
            { id: "ja-m16-6-1", title: "Sequences & routines — Intro", status: "available" as const },
            { id: "ja-m16-6-2", title: "Sequences & routines — Practice", status: "available" as const },
            { id: "ja-m16-story", title: "Museum visit", status: "available" as const },
            { id: "ja-m16-7-1", title: "Mixed te-form drill", status: "available" as const },
            { id: "ja-m16-7-2", title: "Production", status: "available" as const },
            { id: "ja-m16-review-1", title: "Module 16 — Review 1", status: "available" as const },
            { id: "ja-m16-review-2", title: "Module 16 — Review 2", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
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
