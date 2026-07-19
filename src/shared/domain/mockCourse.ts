import type { Course, SideQuest } from "./course";
import { getLanguageConfig } from "./languageConfig";
import {
  HIRAGANA_ROWS,
  DAKUTEN_ROWS,
  YOON_ROWS,
  type RowDef,
} from "@/features/lesson/data/hiraganaCurriculum";
import { MODULE_RECAP_LESSON_IDS } from "@/features/lesson/data/generatedHiraganaLessons";
import { KO_M1_ROWS } from "@/features/languages/ko/curriculum/m1-rows";
import { KO_M2_ROWS } from "@/features/languages/ko/curriculum/m2";
import { buildSpanishCourse } from "@/features/languages/es/curriculum";
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
      // Survival Phrasebook — PULLED from the map 2026-07-12 (Spencer QA
      // note: "I don't like the survival phrases quest for now"). Its
      // lessons were then DELETED 2026-07-16 with the rest of the
      // side-lesson content (all to be remade), so restoring this tile
      // now also needs a new ja-sidequest-survival-phrases lesson.
      // Original rationale: pinned day-1 unlock per curriculum-design-v2
      // §6, audio-driven, romaji-first (the Priya traveler persona).
      // {
      //   id: "ja-survival-phrasebook",
      //   emoji: "🗺️",
      //   title: "Survival Phrasebook",
      //   meta: "15 essentials · ~5 min · travel-ready",
      //   progress: 0,
      // },
      {
        id: "anime-vocab",
        emoji: "🌸",
        title: "Anime Vocab",
        meta: "12 words · senpai, kawaii…",
        progress: 0,
        comingSoon: true,
      },
      // Travel Sprint — lesson content DELETED 2026-07-16 (Spencer: side
      // lessons will be remade). comingSoon keeps the loop + 4 stop dots
      // on the transit map but makes every entry point inert.
      {
        id: "ja-travel-sprint",
        emoji: "✈️",
        title: "Travel Sprint",
        meta: "4 lessons · listen & speak · Pimsleur-style",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "festivals-culture",
        emoji: "⛩️",
        title: "Festivals & Culture",
        meta: "8 words · 桜, 祭, 神社",
        unlockAfter: "ja-m2-complete",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "gaming-vocab",
        emoji: "🎮",
        title: "Gaming Vocab",
        meta: "14 words · attack, level up, boss",
        unlockAfter: "ja-m2-complete",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "daily-challenge",
        emoji: "⚡",
        title: "Daily Challenge",
        meta: "+20 XP · 60s timer",
        progress: 0,
        isDaily: true,
        comingSoon: true,
      },
    ];

    // Placement test — the old shallow kana-only builder was removed;
    // the adaptive 2-stage placement engine (src/features/placement/)
    // superseded it.

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
            { id: "ja-m3-1-1", title: "Katakana — ア イ ウ", status: "available" as const },
            { id: "ja-m3-1-2", title: "Katakana — エ オ + sweep", status: "available" as const },
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
            { id: "ja-m3-9", title: "Meeting someone new", status: "available" as const },
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
            { id: "ja-m4-kata", title: "Katakana — カ row", status: "available" as const },
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
            { id: "ja-m4-story", title: "Whose is this?", status: "available" as const },
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
            { id: "ja-m5-kata", title: "Katakana — サ row", status: "available" as const },
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
            { id: "ja-m5-story", title: "Ordering for the group", status: "available" as const },
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
            { id: "ja-m6-kata", title: "Katakana — タ row", status: "available" as const },
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
            { id: "ja-m6-story", title: "After school", status: "available" as const },
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
        // `buildModuleReviewLessons` + jaReviewPools were deleted as dead
        // code (2026-07-01); `moduleReviewSchedule` remains live in its
        // own file.
        {
          id: "m7",
          title: "Verbs in motion",
          eyebrow: "Module 7 · Actions",
          summary: "Dictionary form + ます polite stem + を (direct object). Real sentences with action.",
          lessons: [
            { id: "ja-m7-kata", title: "Katakana — ナ row", status: "available" as const },
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
            { id: "ja-m7-story", title: "What do you eat?", status: "available" as const },
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
            { id: "ja-m8-kata", title: "Katakana — ハ row", status: "available" as const },
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
            { id: "ja-m8-8-1", title: "This way, please — Intro", status: "available" as const },
            { id: "ja-m8-8-2", title: "This way, please — Practice", status: "available" as const },
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
            { id: "ja-m9-kata", title: "Katakana — マ row", status: "available" as const },
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
            { id: "ja-m10-kata", title: "Katakana — ヤ row", status: "available" as const },
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
            { id: "ja-m11-kata", title: "Katakana — ラ row", status: "available" as const },
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
            { id: "ja-m12-kata", title: "Katakana — ワ ヲ ン", status: "available" as const },
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
            { id: "ja-m16-story", title: "Library day", status: "available" as const },
            { id: "ja-m16-7-1", title: "Mixed te-form drill", status: "available" as const },
            { id: "ja-m16-7-2", title: "Production", status: "available" as const },
            { id: "ja-m16-review-1", title: "Module 16 — Review 1", status: "available" as const },
            { id: "ja-m16-review-2", title: "Module 16 — Review 2", status: "available" as const },
          ],
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        // M17 — Transportation & Directions
        {
          id: "m17",
          title: "Getting around",
          eyebrow: "Module 17 · Transport",
          summary: "で (means), に/へ (direction), までに (deadline), まえに (before).",
          lessons: [
            { id: "ja-m17-1-1", title: "By train — Intro", status: "available" as const },
            { id: "ja-m17-1-2", title: "By train — Practice", status: "available" as const },
            { id: "ja-m17-2-1", title: "Directions — Intro", status: "available" as const },
            { id: "ja-m17-2-2", title: "Directions — Practice", status: "available" as const },
            { id: "ja-m17-3-1", title: "Getting on/off — Intro", status: "available" as const },
            { id: "ja-m17-3-2", title: "Getting on/off — Practice", status: "available" as const },
            { id: "ja-m17-4-1", title: "Where to? — Intro", status: "available" as const },
            { id: "ja-m17-4-2", title: "Where to? — Practice", status: "available" as const },
            { id: "ja-m17-8-1", title: "Around town — Positions", status: "available" as const },
            { id: "ja-m17-8-2", title: "Around town — People & places", status: "available" as const },
            { id: "ja-m17-5-1", title: "Before and by — Intro", status: "available" as const },
            { id: "ja-m17-5-2", title: "Before and by — Practice", status: "available" as const },
            { id: "ja-m17-6-1", title: "Travel plans — Intro", status: "available" as const },
            { id: "ja-m17-6-2", title: "Travel plans — Practice", status: "available" as const },
            { id: "ja-m17-story", title: "Getting to the airport", status: "available" as const },
            { id: "ja-m17-7-1", title: "Mixed transport drill", status: "available" as const },
            { id: "ja-m17-7-2", title: "Transport production", status: "available" as const },
            { id: "ja-m17-review-1", title: "Module 17 — Review 1", status: "available" as const },
            { id: "ja-m17-review-2", title: "Module 17 — Review 2", status: "available" as const },
          ],
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        // M18 — Weather & Nature + でしょう
        {
          id: "m18",
          title: "Weather & nature",
          eyebrow: "Module 18 · Weather",
          summary: "でしょう (probably) + 〜とおもいます (I think) + weather/nature/seasons vocab.",
          lessons: [
            { id: "ja-m18-1-1", title: "Weather — Intro", status: "available" as const },
            { id: "ja-m18-1-2", title: "Weather — Practice", status: "available" as const },
            { id: "ja-m18-2-1", title: "Probably — Intro", status: "available" as const },
            { id: "ja-m18-2-2", title: "Probably — Practice", status: "available" as const },
            { id: "ja-m18-3-1", title: "I think... — Intro", status: "available" as const },
            { id: "ja-m18-3-2", title: "I think... — Practice", status: "available" as const },
            { id: "ja-m18-4-1", title: "Nature — Intro", status: "available" as const },
            { id: "ja-m18-4-2", title: "Nature — Practice", status: "available" as const },
            { id: "ja-m18-5-1", title: "Seasons — Intro", status: "available" as const },
            { id: "ja-m18-5-2", title: "Seasons — Practice", status: "available" as const },
            { id: "ja-m18-6-1", title: "Mixed weather — Intro", status: "available" as const },
            { id: "ja-m18-6-2", title: "Mixed weather — Practice", status: "available" as const },
            { id: "ja-m18-story", title: "Weekend plans", status: "available" as const },
            { id: "ja-m18-7-1", title: "Weather mixed drill", status: "available" as const },
            { id: "ja-m18-7-2", title: "Weather production", status: "available" as const },
            { id: "ja-m18-review-1", title: "Module 18 — Review 1", status: "available" as const },
            { id: "ja-m18-review-2", title: "Module 18 — Review 2", status: "available" as const },
          ],
          accent: { from: "#06b6d4", to: "#0891b2" },
        },
        // M19 — Family & People
        {
          id: "m19",
          title: "My family",
          eyebrow: "Module 19 · Family",
          summary: "Family register (ちち vs おとうさん) + counter さい (age) + にんかぞく.",
          lessons: [
            { id: "ja-m19-1-1", title: "Parents — Intro", status: "available" as const },
            { id: "ja-m19-1-2", title: "Parents — Practice", status: "available" as const },
            { id: "ja-m19-2-1", title: "Siblings — Intro", status: "available" as const },
            { id: "ja-m19-2-2", title: "Siblings — Practice", status: "available" as const },
            { id: "ja-m19-3-1", title: "Grandparents — Intro", status: "available" as const },
            { id: "ja-m19-3-2", title: "Grandparents — Practice", status: "available" as const },
            { id: "ja-m19-4-1", title: "Ages — Intro", status: "available" as const },
            { id: "ja-m19-4-2", title: "Ages — Practice", status: "available" as const },
            { id: "ja-m19-5-1", title: "My family — Intro", status: "available" as const },
            { id: "ja-m19-5-2", title: "My family — Practice", status: "available" as const },
            { id: "ja-m19-6-1", title: "People — Intro", status: "available" as const },
            { id: "ja-m19-6-2", title: "People — Practice", status: "available" as const },
            { id: "ja-m19-story", title: "Meeting a friend's family", status: "available" as const },
            { id: "ja-m19-7-1", title: "Family mixed drill", status: "available" as const },
            { id: "ja-m19-7-2", title: "Family production", status: "available" as const },
            { id: "ja-m19-review-1", title: "Module 19 — Review 1", status: "available" as const },
            { id: "ja-m19-review-2", title: "Module 19 — Review 2", status: "available" as const },
          ],
          accent: { from: "#f97316", to: "#ea580c" },
        },
        // M20 — Body & Health + ので
        {
          id: "m20",
          title: "Body & health",
          eyebrow: "Module 20 · Health",
          summary: "Body parts + 〜がいたい (hurts) + ので (because, softer).",
          lessons: [
            { id: "ja-m20-1-1", title: "Head & face — Intro", status: "available" as const },
            { id: "ja-m20-1-2", title: "Head & face — Practice", status: "available" as const },
            { id: "ja-m20-2-1", title: "Hands & feet — Intro", status: "available" as const },
            { id: "ja-m20-2-2", title: "Hands & feet — Practice", status: "available" as const },
            { id: "ja-m20-3-1", title: "It hurts — Intro", status: "available" as const },
            { id: "ja-m20-3-2", title: "It hurts — Practice", status: "available" as const },
            { id: "ja-m20-4-1", title: "Because (ので) — Intro", status: "available" as const },
            { id: "ja-m20-4-2", title: "Because (ので) — Practice", status: "available" as const },
            { id: "ja-m20-5-1", title: "At the doctor — Intro", status: "available" as const },
            { id: "ja-m20-5-2", title: "At the doctor — Practice", status: "available" as const },
            { id: "ja-m20-6-1", title: "Daily items — Intro", status: "available" as const },
            { id: "ja-m20-6-2", title: "Daily items — Practice", status: "available" as const },
            { id: "ja-m20-story", title: "Going to the doctor", status: "available" as const },
            { id: "ja-m20-7-1", title: "Body mixed drill", status: "available" as const },
            { id: "ja-m20-7-2", title: "Health production", status: "available" as const },
            { id: "ja-m20-review-1", title: "Module 20 — Review 1", status: "available" as const },
            { id: "ja-m20-review-2", title: "Module 20 — Review 2", status: "available" as const },
          ],
          accent: { from: "#ef4444", to: "#dc2626" },
        },
        // M21 — Food & Restaurants
        {
          id: "m21",
          title: "Food & dining",
          eyebrow: "Module 21 · Food",
          summary: "Food vocab + と (quotation) + や (incomplete list) + counter はい/ぱい/ばい.",
          lessons: [
            { id: "ja-m21-1-1", title: "At the table — Intro", status: "available" as const },
            { id: "ja-m21-1-2", title: "At the table — Practice", status: "available" as const },
            { id: "ja-m21-2-1", title: "Fruits & drinks — Intro", status: "available" as const },
            { id: "ja-m21-2-2", title: "Fruits & drinks — Practice", status: "available" as const },
            { id: "ja-m21-3-1", title: "Things like... — Intro", status: "available" as const },
            { id: "ja-m21-3-2", title: "Things like... — Practice", status: "available" as const },
            { id: "ja-m21-4-1", title: "Utensils — Intro", status: "available" as const },
            { id: "ja-m21-4-2", title: "Utensils — Practice", status: "available" as const },
            { id: "ja-m21-5-1", title: "Cups of... — Intro", status: "available" as const },
            { id: "ja-m21-5-2", title: "Cups of... — Practice", status: "available" as const },
            { id: "ja-m21-6-1", title: "Quoting — Intro", status: "available" as const },
            { id: "ja-m21-6-2", title: "Quoting — Practice", status: "available" as const },
            { id: "ja-m21-story", title: "Restaurant ordering", status: "available" as const },
            { id: "ja-m21-7-1", title: "Food mixed drill", status: "available" as const },
            { id: "ja-m21-7-2", title: "Food production", status: "available" as const },
            { id: "ja-m21-review-1", title: "Module 21 — Review 1", status: "available" as const },
            { id: "ja-m21-review-2", title: "Module 21 — Review 2", status: "available" as const },
          ],
          accent: { from: "#84cc16", to: "#65a30d" },
        },
        // M22 — Comparison
        {
          id: "m22",
          title: "Comparing things",
          eyebrow: "Module 22 · Comparison",
          summary: "〜のほうが〜より (more than) + 〜のなかで〜がいちばん (most among) + どちら.",
          lessons: [
            { id: "ja-m22-1-1", title: "More than — Intro", status: "available" as const },
            { id: "ja-m22-1-2", title: "More than — Practice", status: "available" as const },
            { id: "ja-m22-2-1", title: "The most — Intro", status: "available" as const },
            { id: "ja-m22-2-2", title: "The most — Practice", status: "available" as const },
            { id: "ja-m22-3-1", title: "Which one? — Intro", status: "available" as const },
            { id: "ja-m22-3-2", title: "Which one? — Practice", status: "available" as const },
            { id: "ja-m22-4-1", title: "Same and different — Intro", status: "available" as const },
            { id: "ja-m22-4-2", title: "Same and different — Practice", status: "available" as const },
            { id: "ja-m22-5-1", title: "Comparing places — Intro", status: "available" as const },
            { id: "ja-m22-5-2", title: "Comparing places — Practice", status: "available" as const },
            { id: "ja-m22-6-1", title: "Preferences — Intro", status: "available" as const },
            { id: "ja-m22-6-2", title: "Preferences — Practice", status: "available" as const },
            { id: "ja-m22-story", title: "Comparing restaurants", status: "available" as const },
            { id: "ja-m22-7-1", title: "Comparison mixed drill", status: "available" as const },
            { id: "ja-m22-7-2", title: "Comparison production", status: "available" as const },
            { id: "ja-m22-review-1", title: "Module 22 — Review 1", status: "available" as const },
            { id: "ja-m22-review-2", title: "Module 22 — Review 2", status: "available" as const },
          ],
          accent: { from: "#a855f7", to: "#9333ea" },
        },
        // M23 — Capability & Suggestions
        {
          id: "m23",
          title: "Can you? Let's!",
          eyebrow: "Module 23 · Skills",
          summary: "〜のがじょうず/へた (good/bad at) + ましょう (let's) + ませんか (shall we?).",
          lessons: [
            { id: "ja-m23-1-1", title: "Good at — Intro", status: "available" as const },
            { id: "ja-m23-1-2", title: "Good at — Practice", status: "available" as const },
            { id: "ja-m23-8-1", title: "Can do — Intro", status: "available" as const },
            { id: "ja-m23-8-2", title: "Can do — Practice", status: "available" as const },
            { id: "ja-m23-2-1", title: "Bad at — Intro", status: "available" as const },
            { id: "ja-m23-2-2", title: "Bad at — Practice", status: "available" as const },
            { id: "ja-m23-3-1", title: "Let's! — Intro", status: "available" as const },
            { id: "ja-m23-3-2", title: "Let's! — Practice", status: "available" as const },
            { id: "ja-m23-4-1", title: "Shall we? — Intro", status: "available" as const },
            { id: "ja-m23-4-2", title: "Shall we? — Practice", status: "available" as const },
            { id: "ja-m23-5-1", title: "Skills vocab — Intro", status: "available" as const },
            { id: "ja-m23-5-2", title: "Skills vocab — Practice", status: "available" as const },
            { id: "ja-m23-6-1", title: "Invitations — Intro", status: "available" as const },
            { id: "ja-m23-6-2", title: "Invitations — Practice", status: "available" as const },
            { id: "ja-m23-story", title: "Inviting friends", status: "available" as const },
            { id: "ja-m23-7-1", title: "Skills mixed drill", status: "available" as const },
            { id: "ja-m23-7-2", title: "Skills production", status: "available" as const },
            { id: "ja-m23-review-1", title: "Module 23 — Review 1", status: "available" as const },
            { id: "ja-m23-review-2", title: "Module 23 — Review 2", status: "available" as const },
          ],
          accent: { from: "#6366f1", to: "#4f46e5" },
        },
        // M24 — Hobbies & Activities
        {
          id: "m24",
          title: "Hobbies & fun",
          eyebrow: "Module 24 · Hobbies",
          summary: "〜のがすき (like doing) + 〜たり〜たりする (things like X and Y) + counter 回.",
          lessons: [
            { id: "ja-m24-1-1", title: "Creative hobbies — Intro", status: "available" as const },
            { id: "ja-m24-1-2", title: "Creative hobbies — Practice", status: "available" as const },
            { id: "ja-m24-2-1", title: "Outdoor hobbies — Intro", status: "available" as const },
            { id: "ja-m24-2-2", title: "Outdoor hobbies — Practice", status: "available" as const },
            { id: "ja-m24-3-1", title: "Things like... — Intro", status: "available" as const },
            { id: "ja-m24-3-2", title: "Things like... — Practice", status: "available" as const },
            { id: "ja-m24-4-1", title: "Media — Intro", status: "available" as const },
            { id: "ja-m24-4-2", title: "Media — Practice", status: "available" as const },
            { id: "ja-m24-5-1", title: "How many times — Intro", status: "available" as const },
            { id: "ja-m24-5-2", title: "How many times — Practice", status: "available" as const },
            { id: "ja-m24-6-1", title: "Mixed hobbies — Intro", status: "available" as const },
            { id: "ja-m24-6-2", title: "Mixed hobbies — Practice", status: "available" as const },
            { id: "ja-m24-story", title: "Weekend hobbies", status: "available" as const },
            { id: "ja-m24-7-1", title: "Hobbies mixed drill", status: "available" as const },
            { id: "ja-m24-7-2", title: "Hobbies production", status: "available" as const },
            { id: "ja-m24-review-1", title: "Module 24 — Review 1", status: "available" as const },
            { id: "ja-m24-review-2", title: "Module 24 — Review 2", status: "available" as const },
          ],
          accent: { from: "#84cc16", to: "#65a30d" },
        },
        // M25 — Plans & Intentions
        {
          id: "m25",
          title: "Plans & experiences",
          eyebrow: "Module 25 · Intentions",
          summary: "つもりです + 〜にいく + ことがある + とき (when).",
          lessons: [
            { id: "ja-m25-1-1", title: "I plan to... — Intro", status: "available" as const },
            { id: "ja-m25-1-2", title: "I plan to... — Practice", status: "available" as const },
            { id: "ja-m25-2-1", title: "Going to do — Intro", status: "available" as const },
            { id: "ja-m25-2-2", title: "Going to do — Practice", status: "available" as const },
            { id: "ja-m25-3-1", title: "Have you ever? — Intro", status: "available" as const },
            { id: "ja-m25-3-2", title: "Have you ever? — Practice", status: "available" as const },
            { id: "ja-m25-4-1", title: "When I was... — Intro", status: "available" as const },
            { id: "ja-m25-4-2", title: "When I was... — Practice", status: "available" as const },
            { id: "ja-m25-5-1", title: "Travel plans — Intro", status: "available" as const },
            { id: "ja-m25-5-2", title: "Travel plans — Practice", status: "available" as const },
            { id: "ja-m25-6-1", title: "Life events — Intro", status: "available" as const },
            { id: "ja-m25-6-2", title: "Life events — Practice", status: "available" as const },
            { id: "ja-m25-story", title: "Yuki's trips to Japan", status: "available" as const },
            { id: "ja-m25-7-1", title: "Plans mixed drill", status: "available" as const },
            { id: "ja-m25-7-2", title: "Plans production", status: "available" as const },
            { id: "ja-m25-review-1", title: "Module 25 — Review 1", status: "available" as const },
            { id: "ja-m25-review-2", title: "Module 25 — Review 2", status: "available" as const },
          ],
          accent: { from: "#ec4899", to: "#db2777" },
        },
        // M26 — Explanatory & Excess
        {
          id: "m26",
          title: "Explaining why",
          eyebrow: "Module 26 · Reasoning",
          summary: "〜んです (explanatory) + 〜すぎる (too much). Express reasons and excess.",
          lessons: [
            { id: "ja-m26-1-1", title: "What happened? — Intro", status: "available" as const },
            { id: "ja-m26-1-2", title: "What happened? — Practice", status: "available" as const },
            { id: "ja-m26-2-1", title: "Too much — Intro", status: "available" as const },
            { id: "ja-m26-2-2", title: "Too much — Practice", status: "available" as const },
            { id: "ja-m26-3-1", title: "Explaining — Intro", status: "available" as const },
            { id: "ja-m26-3-2", title: "Explaining — Practice", status: "available" as const },
            { id: "ja-m26-4-1", title: "Reasons — Intro", status: "available" as const },
            { id: "ja-m26-4-2", title: "Reasons — Practice", status: "available" as const },
            { id: "ja-m26-5-1", title: "Conjunctions — Intro", status: "available" as const },
            { id: "ja-m26-5-2", title: "Conjunctions — Practice", status: "available" as const },
            { id: "ja-m26-6-1", title: "Mixed reasoning — Intro", status: "available" as const },
            { id: "ja-m26-6-2", title: "Mixed reasoning — Practice", status: "available" as const },
            { id: "ja-m26-story", title: "Why are you late?", status: "available" as const },
            { id: "ja-m26-7-1", title: "Reasoning mixed drill", status: "available" as const },
            { id: "ja-m26-7-2", title: "Reasoning production", status: "available" as const },
            { id: "ja-m26-review-1", title: "Module 26 — Review 1", status: "available" as const },
            { id: "ja-m26-review-2", title: "Module 26 — Review 2", status: "available" as const },
          ],
          accent: { from: "#f43f5e", to: "#e11d48" },
        },
        // M27 — Modal Grammar
        {
          id: "m27",
          title: "Must, should, become",
          eyebrow: "Module 27 · Modal",
          summary: "〜なければならない (must) + 〜ほうがいい (should) + 〜く/になる (become).",
          lessons: [
            { id: "ja-m27-1-1", title: "Must do — Intro", status: "available" as const },
            { id: "ja-m27-1-2", title: "Must do — Practice", status: "available" as const },
            { id: "ja-m27-2-1", title: "Casual must — Intro", status: "available" as const },
            { id: "ja-m27-2-2", title: "Casual must — Practice", status: "available" as const },
            { id: "ja-m27-3-1", title: "Should — Intro", status: "available" as const },
            { id: "ja-m27-3-2", title: "Should — Practice", status: "available" as const },
            { id: "ja-m27-4-1", title: "Becoming — Intro", status: "available" as const },
            { id: "ja-m27-4-2", title: "Becoming — Practice", status: "available" as const },
            { id: "ja-m27-5-1", title: "Advice — Intro", status: "available" as const },
            { id: "ja-m27-5-2", title: "Advice — Practice", status: "available" as const },
            { id: "ja-m27-6-1", title: "Mixed modal — Intro", status: "available" as const },
            { id: "ja-m27-6-2", title: "Mixed modal — Practice", status: "available" as const },
            { id: "ja-m27-story", title: "Giving advice", status: "available" as const },
            { id: "ja-m27-7-1", title: "Modal mixed drill", status: "available" as const },
            { id: "ja-m27-7-2", title: "Modal production", status: "available" as const },
            { id: "ja-m27-review-1", title: "Module 27 — Review 1", status: "available" as const },
            { id: "ja-m27-review-2", title: "Module 27 — Review 2", status: "available" as const },
          ],
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        // M28 — N5 Mastery Capstone (review-only, no new grammar)
        {
          id: "m28",
          title: "N5 Mastery",
          eyebrow: "Module 28 · Capstone",
          summary: "Cumulative review of all N5 grammar and vocabulary. You made it!",
          lessons: [
            { id: "ja-m28-review-1", title: "N5 Review — Grammar", status: "available" as const },
            { id: "ja-m28-review-2", title: "N5 Review — Vocabulary", status: "available" as const },
          ],
          accent: { from: "#eab308", to: "#ca8a04" },
        },
        // ── N4 tier (m29+) ────────────────────────────────────────────────
        // m28 is the N5 capstone, so the N4 tier starts at m29 — and m28 is
        // the graduation/transfer point onto the N4 map.
        //
        // These modules are `tier: "n4"`, which keeps them OFF the N5 transit
        // map (TransitLearnPage filters to n5) while keeping them in the
        // curriculum — `modules` is also the pedagogical order behind
        // `getAtomsUpToModule`, so a module absent here has atoms the SRS can
        // never schedule. Reviewed via /ja/qa until the N4 map ships.
        // M29 — Plain form
        {
          id: "m29",
          title: "Plain form",
          eyebrow: "Module 29 · Plain",
          summary: "Dictionary form, ない, た, and なかった — the base polite form is built from.",
          tier: "n4",
          lessons: [
            { id: "ja-m29-1-1", title: "Dictionary form (う-verbs) — Intro", status: "available" as const },
            { id: "ja-m29-1-2", title: "Dictionary form (う-verbs) — Practice", status: "available" as const },
            { id: "ja-m29-2-1", title: "Dictionary form (る-verbs, する/くる) — Intro", status: "available" as const },
            { id: "ja-m29-2-2", title: "Dictionary form (る-verbs, する/くる) — Practice", status: "available" as const },
            { id: "ja-m29-3-1", title: "ない form — Intro", status: "available" as const },
            { id: "ja-m29-3-2", title: "ない form — Practice", status: "available" as const },
            { id: "ja-m29-4-1", title: "た form — Intro", status: "available" as const },
            { id: "ja-m29-4-2", title: "た form — Practice", status: "available" as const },
            { id: "ja-m29-5-1", title: "なかった — Intro", status: "available" as const },
            { id: "ja-m29-5-2", title: "なかった — Practice", status: "available" as const },
            { id: "ja-m29-6-1", title: "Mixed plain form — Intro", status: "available" as const },
            { id: "ja-m29-6-2", title: "Mixed plain form — Practice", status: "available" as const },
            { id: "ja-m29-story", title: "Two friends talking", status: "available" as const },
            { id: "ja-m29-7-1", title: "Plain form mixed drill", status: "available" as const },
            { id: "ja-m29-7-2", title: "Plain form production", status: "available" as const },
          ],
          accent: { from: "#0e7c8c", to: "#0b616e" },
        },
        // M30 — Casual register (docs/n4-pilot-spine-2026-07-16.md). Both
        // stages authored: pairs 1-4 (stage 1) + pairs 5-7, the story
        // lesson (stage 2). Per the spine's "Not in the pilot" note, m30
        // is NOT registered as a transit station — reviewed via /ja/qa.
        {
          id: "m30",
          title: "Casual register",
          eyebrow: "Module 30 · Casual",
          summary: "Casual questions, よ/ね, casual の, register awareness, invitations, and mixed-register drills — when plain form is (and isn't) socially correct.",
          tier: "n4",
          lessons: [
            { id: "ja-m30-1-1", title: "Casual questions — Intro", status: "available" as const },
            { id: "ja-m30-1-2", title: "Casual questions — Practice", status: "available" as const },
            { id: "ja-m30-2-1", title: "よ / ね — Intro", status: "available" as const },
            { id: "ja-m30-2-2", title: "よ / ね — Practice", status: "available" as const },
            { id: "ja-m30-3-1", title: "Casual の question — Intro", status: "available" as const },
            { id: "ja-m30-3-2", title: "Casual の question — Practice", status: "available" as const },
            { id: "ja-m30-4-1", title: "Register awareness — Intro", status: "available" as const },
            { id: "ja-m30-4-2", title: "Register awareness — Practice", status: "available" as const },
            { id: "ja-m30-5-1", title: "Casual invitations — Intro", status: "available" as const },
            { id: "ja-m30-5-2", title: "Invitations — Accept / decline", status: "available" as const },
            { id: "ja-m30-6-1", title: "Mixed register — Intro", status: "available" as const },
            { id: "ja-m30-6-2", title: "Mixed register — Speed drill", status: "available" as const },
            { id: "ja-m30-story", title: "Story — ゆき invites twice", status: "available" as const },
            { id: "ja-m30-7-1", title: "Comprehension drill — register", status: "available" as const },
            { id: "ja-m30-7-2", title: "Final production — M30", status: "available" as const },
          ],
          accent: { from: "#7c3aed", to: "#5b21b6" },
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

    // M2 — aspirated + tense consonants + y-vowels (Phase 5, 2026-06-01).
    // Each row gets 3 sub-lessons via the same row builder as M1.
    // Compound vowels (ㅐ ㅔ ㅘ ㅝ ㅢ ㅟ) and final-consonant 받침 are
    // deferred to a future M2 extension pass — out of scope here.
    const m2Lessons: { id: string; title: string; status: "available"; kind?: "recap" }[] = [];
    for (const row of KO_M2_ROWS) {
      for (const suffix of ["1", "2", "3"] as const) {
        const label = suffix === "3" ? "Review" : `Intro ${suffix}`;
        m2Lessons.push({
          id: `ko-m2-${row.id}-${suffix}`,
          title: `${row.title} — ${label}`,
          status: "available" as const,
        });
      }
    }
    m2Lessons.push({
      id: "ko-m2-yv-1",
      title: "Y-vowels — ㅑ ㅕ ㅛ ㅠ",
      status: "available" as const,
    });
    m2Lessons.push({
      id: "ko-m2-review",
      title: "Module 2 — Full review",
      status: "available" as const,
      kind: "recap" as const,
    });

    const m3Lessons = [
      { id: "ko-m3-1", title: "Greetings — 안녕하세요",          status: "available" as const },
      { id: "ko-m3-2", title: "Formality — formal vs. polite",     status: "available" as const },
      { id: "ko-m3-3", title: "이에요 / 예요 — the copula",        status: "available" as const },
      { id: "ko-m3-4", title: "저는 X 이에요 — introducing yourself", status: "available" as const },
      { id: "ko-m3-4b", title: "은 / 는 — the topic marker",        status: "available" as const },
      { id: "ko-m3-5", title: "Asking names — 이름이 뭐예요?",     status: "available" as const },
      { id: "ko-m3-6", title: "Numbers 1–10 (Sino-Korean)",       status: "available" as const },
      { id: "ko-m3-7", title: "Mini-dialogue — meeting someone",   status: "available" as const },
      { id: "ko-m3-8", title: "M3 Mastery Test",                  status: "available" as const },
    ];

    // M4-M6 (2026-06-13): the N5 spine after first-phrases. Mirrors the JA
    // M4-M6 grammar arc (の/possessive + demonstratives → numbers/counters/
    // ください → に/で/が + existence) using Korean's own grammar. 8 lessons
    // each, matching M3's shape. Content lives in curriculum/m4.ts ... m6.ts.
    const m4Lessons = [
      { id: "ko-m4-1", title: "Everyday objects — 책, 펜, 가방",    status: "available" as const },
      { id: "ko-m4-2", title: "의 — possessive 's",                status: "available" as const },
      { id: "ko-m4-3", title: "이거 / 그거 / 저거 — this & that",   status: "available" as const },
      { id: "ko-m4-4", title: "이게 뭐예요? — what is this?",       status: "available" as const },
      { id: "ko-m4-5", title: "누구 거예요? — whose is it?",        status: "available" as const },
      { id: "ko-m4-6", title: "Building it together",              status: "available" as const },
      { id: "ko-m4-7", title: "Mini-dialogue — at a shop",         status: "available" as const },
      { id: "ko-m4-8", title: "M4 Mastery Test",                  status: "available" as const },
    ];

    const m5Lessons = [
      { id: "ko-m5-1", title: "Native numbers 1–5",               status: "available" as const },
      { id: "ko-m5-2", title: "Native numbers 6–10",              status: "available" as const },
      { id: "ko-m5-3", title: "주세요 — please give me",           status: "available" as const },
      { id: "ko-m5-4", title: "Counters — 개 / 명 / 잔",           status: "available" as const },
      { id: "ko-m5-5", title: "이거 한 개 주세요 — ordering",       status: "available" as const },
      { id: "ko-m5-6", title: "얼마예요? — how much?",             status: "available" as const },
      { id: "ko-m5-7", title: "Mini-dialogue — at a cafe",         status: "available" as const },
      { id: "ko-m5-8", title: "M5 Mastery Test",                  status: "available" as const },
    ];

    const m6Lessons = [
      { id: "ko-m6-1", title: "Places — 집, 학교, 가게",           status: "available" as const },
      { id: "ko-m6-2", title: "있어요 / 없어요 — there is / isn't", status: "available" as const },
      { id: "ko-m6-3", title: "에 — at / in (a place)",            status: "available" as const },
      { id: "ko-m6-4", title: "에 vs 에서 — being vs doing",       status: "available" as const },
      { id: "ko-m6-5", title: "이/가 + 있어요 — the subject",       status: "available" as const },
      { id: "ko-m6-6", title: "어디에 있어요? — where is it?",      status: "available" as const },
      { id: "ko-m6-7", title: "Mini-dialogue — finding your way",  status: "available" as const },
      { id: "ko-m6-8", title: "M6 Mastery Test",                  status: "available" as const },
    ];

    // M7-M12 (2026-06-13): the N5→N4 grammar spine after existence. Mirrors
    // the JA M7-M12 grammar arc (verbs + を → adjectives → connectors → past
    // → negation → time) using Korean's own grammar. 8 lessons each, matching
    // M3-M6's shape. Content lives in curriculum/m7.ts ... m12.ts.
    const m7Lessons = [
      { id: "ko-m7-1", title: "Action verbs — 가다, 먹다, 보다",    status: "available" as const },
      { id: "ko-m7-2", title: "The 해요 present — 가요, 먹어요",     status: "available" as const },
      { id: "ko-m7-3", title: "하다 verbs — 해요, 공부해요",        status: "available" as const },
      { id: "ko-m7-4", title: "Things to eat, drink & watch",      status: "available" as const },
      { id: "ko-m7-5", title: "을 / 를 — the object marker",        status: "available" as const },
      { id: "ko-m7-6", title: "Building full sentences",           status: "available" as const },
      { id: "ko-m7-7", title: "Mini-dialogue — what are you doing?", status: "available" as const },
      { id: "ko-m7-8", title: "M7 Mastery Test",                  status: "available" as const },
    ];

    const m8Lessons = [
      { id: "ko-m8-1", title: "Describing words — 좋다, 크다",      status: "available" as const },
      { id: "ko-m8-2", title: "좋아요 / 작아요 — adjectives conjugate", status: "available" as const },
      { id: "ko-m8-3", title: "크다 → 커요 — the ㅡ drop",          status: "available" as const },
      { id: "ko-m8-4", title: "맛있어요 / 비싸요 — food & price",   status: "available" as const },
      { id: "ko-m8-5", title: "좋은 책 — describing a noun",        status: "available" as const },
      { id: "ko-m8-6", title: "Building descriptions",             status: "available" as const },
      { id: "ko-m8-7", title: "Mini-dialogue — at a shop",         status: "available" as const },
      { id: "ko-m8-8", title: "M8 Mastery Test",                  status: "available" as const },
    ];

    const m9Lessons = [
      { id: "ko-m9-1", title: "하고 — and",                        status: "available" as const },
      { id: "ko-m9-2", title: "하고 — with (someone)",             status: "available" as const },
      { id: "ko-m9-3", title: "와 / 과 — the formal 'and'",        status: "available" as const },
      { id: "ko-m9-4", title: "도 — too / also",                   status: "available" as const },
      { id: "ko-m9-5", title: "Connectors together",              status: "available" as const },
      { id: "ko-m9-6", title: "Lists & company",                  status: "available" as const },
      { id: "ko-m9-7", title: "Mini-dialogue — ordering together", status: "available" as const },
      { id: "ko-m9-8", title: "M9 Mastery Test",                  status: "available" as const },
    ];

    const m10Lessons = [
      { id: "ko-m10-1", title: "어제 / 오늘 — yesterday & today",   status: "available" as const },
      { id: "ko-m10-2", title: "Past tense — 먹었어요",            status: "available" as const },
      { id: "ko-m10-3", title: "갔어요 / 왔어요 / 했어요",          status: "available" as const },
      { id: "ko-m10-4", title: "좋았어요 / 맛있었어요",            status: "available" as const },
      { id: "ko-m10-5", title: "였어요 / 이었어요 — was",           status: "available" as const },
      { id: "ko-m10-6", title: "Narrating a day",                 status: "available" as const },
      { id: "ko-m10-7", title: "Mini-dialogue — how was it?",      status: "available" as const },
      { id: "ko-m10-8", title: "M10 Mastery Test",                status: "available" as const },
    ];

    const m11Lessons = [
      { id: "ko-m11-1", title: "안 — don't / not",                 status: "available" as const },
      { id: "ko-m11-2", title: "공부 안 해요 — the 하다 split",     status: "available" as const },
      { id: "ko-m11-3", title: "못 — can't",                       status: "available" as const },
      { id: "ko-m11-4", title: "안 vs 못 — which 'no'?",           status: "available" as const },
      { id: "ko-m11-5", title: "Negation in the past",            status: "available" as const },
      { id: "ko-m11-6", title: "고 싶어요 — want to",              status: "available" as const },
      { id: "ko-m11-7", title: "Mini-dialogue — declining politely", status: "available" as const },
      { id: "ko-m11-8", title: "M11 Mastery Test",                status: "available" as const },
    ];

    const m12Lessons = [
      { id: "ko-m12-1", title: "시 — o'clock",                     status: "available" as const },
      { id: "ko-m12-2", title: "분 / 반 — minutes & half past",    status: "available" as const },
      { id: "ko-m12-3", title: "몇 시예요? — what time is it?",     status: "available" as const },
      { id: "ko-m12-4", title: "Days of the week — 요일",          status: "available" as const },
      { id: "ko-m12-5", title: "에 — 'at' (a time)",               status: "available" as const },
      { id: "ko-m12-6", title: "Scheduling — day + time + action", status: "available" as const },
      { id: "ko-m12-7", title: "Mini-dialogue — making plans",     status: "available" as const },
      { id: "ko-m12-8", title: "M12 Mastery Test",                status: "available" as const },
    ];

    const m13Lessons = [
      { id: "ko-m13-1", title: "월 — months",                       status: "available" as const },
      { id: "ko-m13-2", title: "Frequency — 항상 / 자주 / 가끔",     status: "available" as const },
      { id: "ko-m13-3", title: "부터 / 까지 — from … until",         status: "available" as const },
      { id: "ko-m13-4", title: "그래서 — so / therefore",           status: "available" as const },
      { id: "ko-m13-5", title: "Routine — how often",               status: "available" as const },
      { id: "ko-m13-6", title: "Schedules — ranges + actions",      status: "available" as const },
      { id: "ko-m13-7", title: "Mini-dialogue — your routine",      status: "available" as const },
      { id: "ko-m13-8", title: "M13 Mastery Test",                  status: "available" as const },
    ];

    const m14Lessons = [
      { id: "ko-m14-1", title: "고 — and / and then",               status: "available" as const },
      { id: "ko-m14-2", title: "아서 / 어서 — and so (sequence)",    status: "available" as const },
      { id: "ko-m14-3", title: "아서 / 어서 — because",              status: "available" as const },
      { id: "ko-m14-4", title: "Big numbers — 백 / 천 / 만",         status: "available" as const },
      { id: "ko-m14-5", title: "Prices — 원 + big numbers",          status: "available" as const },
      { id: "ko-m14-6", title: "아 / 어 주세요 — please do",         status: "available" as const },
      { id: "ko-m14-7", title: "Mini-dialogue — asking for help",   status: "available" as const },
      { id: "ko-m14-8", title: "M14 Mastery Test",                  status: "available" as const },
    ];

    const m15Lessons = [
      { id: "ko-m15-1", title: "고 있어요 — is …-ing",              status: "available" as const },
      { id: "ko-m15-2", title: "고 있어요 — questions & more",       status: "available" as const },
      { id: "ko-m15-3", title: "아도 / 어도 돼요 — may I…?",         status: "available" as const },
      { id: "ko-m15-4", title: "Yes you may / no you may not",      status: "available" as const },
      { id: "ko-m15-5", title: "지만 — but / although",             status: "available" as const },
      { id: "ko-m15-6", title: "Ongoing actions + contrast",       status: "available" as const },
      { id: "ko-m15-7", title: "Mini-dialogue — at the café",       status: "available" as const },
      { id: "ko-m15-8", title: "M15 Mastery Test",                  status: "available" as const },
    ];

    const m16Lessons = [
      { id: "ko-m16-1", title: "(으)면 안 돼요 — you must not",      status: "available" as const },
      { id: "ko-m16-2", title: "지 마세요 — please don't",           status: "available" as const },
      { id: "ko-m16-3", title: "고 나서 — after doing",             status: "available" as const },
      { id: "ko-m16-4", title: "좋아하다 — to like",                status: "available" as const },
      { id: "ko-m16-5", title: "싫어하다 — to dislike",             status: "available" as const },
      { id: "ko-m16-6", title: "Rules & preferences",              status: "available" as const },
      { id: "ko-m16-7", title: "Mini-dialogue — house rules",       status: "available" as const },
      { id: "ko-m16-8", title: "M16 Mastery Test",                  status: "available" as const },
    ];

    const m17Lessons = [
      { id: "ko-m17-1", title: "Getting around — 버스, 지하철",      status: "available" as const },
      { id: "ko-m17-2", title: "(으)로 — by (transport)",           status: "available" as const },
      { id: "ko-m17-3", title: "타다 / 내리다 — get on / off",       status: "available" as const },
      { id: "ko-m17-4", title: "Directions — 왼쪽 / 오른쪽",         status: "available" as const },
      { id: "ko-m17-5", title: "까지 — as far as (a place)",         status: "available" as const },
      { id: "ko-m17-6", title: "Getting somewhere",                status: "available" as const },
      { id: "ko-m17-7", title: "Mini-dialogue — asking the way",    status: "available" as const },
      { id: "ko-m17-8", title: "M17 Mastery Test",                  status: "available" as const },
    ];

    const m18Lessons = [
      { id: "ko-m18-1", title: "Weather — 날씨, 비, 눈",            status: "available" as const },
      { id: "ko-m18-2", title: "덥다 / 춥다 — hot & cold",          status: "available" as const },
      { id: "ko-m18-3", title: "Seasons — 봄 / 여름 / 가을 / 겨울",  status: "available" as const },
      { id: "ko-m18-4", title: "(으)ㄹ 거예요 — will / probably",    status: "available" as const },
      { id: "ko-m18-5", title: "것 같아요 — I think / it seems",     status: "available" as const },
      { id: "ko-m18-6", title: "Forecasting",                      status: "available" as const },
      { id: "ko-m18-7", title: "Mini-dialogue — the weather",       status: "available" as const },
      { id: "ko-m18-8", title: "M18 Mastery Test",                  status: "available" as const },
    ];

    const m19Lessons = [
      { id: "ko-m19-1", title: "Family — 가족, 엄마, 아빠",          status: "available" as const },
      { id: "ko-m19-2", title: "Siblings — 형 / 오빠 / 누나 / 언니",  status: "available" as const },
      { id: "ko-m19-3", title: "우리 — our / my (family)",           status: "available" as const },
      { id: "ko-m19-4", title: "Counting people — 명",              status: "available" as const },
      { id: "ko-m19-5", title: "Age — 살",                          status: "available" as const },
      { id: "ko-m19-6", title: "Describing your family",            status: "available" as const },
      { id: "ko-m19-7", title: "Mini-dialogue — family",            status: "available" as const },
      { id: "ko-m19-8", title: "M19 Mastery Test",                  status: "available" as const },
    ];

    const m20Lessons = [
      { id: "ko-m20-1", title: "Body — 머리, 눈, 코, 입",            status: "available" as const },
      { id: "ko-m20-2", title: "Body — 손, 발, 배, 목",             status: "available" as const },
      { id: "ko-m20-3", title: "아프다 — to hurt / be sick",         status: "available" as const },
      { id: "ko-m20-4", title: "Health — 병원, 약, 감기, 열",        status: "available" as const },
      { id: "ko-m20-5", title: "(으)니까 — because / since",        status: "available" as const },
      { id: "ko-m20-6", title: "Explaining you're sick",            status: "available" as const },
      { id: "ko-m20-7", title: "Mini-dialogue — at the doctor's",    status: "available" as const },
      { id: "ko-m20-8", title: "M20 Mastery Test",                  status: "available" as const },
    ];

    const m21Lessons = [
      { id: "ko-m21-1", title: "Food — 고기, 생선, 채소, 과일",       status: "available" as const },
      { id: "ko-m21-2", title: "Dishes — 김치, 비빔밥, 라면",        status: "available" as const },
      { id: "ko-m21-3", title: "하고 / (이)랑 — and / with",        status: "available" as const },
      { id: "ko-m21-4", title: "Counting drinks — 잔",             status: "available" as const },
      { id: "ko-m21-5", title: "(이)라고 하다 — it's called …",      status: "available" as const },
      { id: "ko-m21-6", title: "Ordering food",                     status: "available" as const },
      { id: "ko-m21-7", title: "Mini-dialogue — at a restaurant",    status: "available" as const },
      { id: "ko-m21-8", title: "M21 Mastery Test",                  status: "available" as const },
    ];

    const m22Lessons = [
      { id: "ko-m22-1", title: "보다 — than",                       status: "available" as const },
      { id: "ko-m22-2", title: "더 / 덜 — more / less",             status: "available" as const },
      { id: "ko-m22-3", title: "제일 / 가장 — the most",            status: "available" as const },
      { id: "ko-m22-4", title: "중에서 — among / out of",          status: "available" as const },
      { id: "ko-m22-5", title: "Which is more …?",                  status: "available" as const },
      { id: "ko-m22-6", title: "Comparing food & places",           status: "available" as const },
      { id: "ko-m22-7", title: "Mini-dialogue — which is better?",   status: "available" as const },
      { id: "ko-m22-8", title: "M22 Mastery Test",                  status: "available" as const },
    ];

    const m23Lessons = [
      { id: "ko-m23-1", title: "Activities — 수영, 운전, 노래, 요리",  status: "available" as const },
      { id: "ko-m23-2", title: "(으)ㄹ 수 있다 / 없다 — can / cannot", status: "available" as const },
      { id: "ko-m23-3", title: "잘하다 / 못하다 — good / bad at",     status: "available" as const },
      { id: "ko-m23-4", title: "(으)ㄹ까요? — shall we …?",          status: "available" as const },
      { id: "ko-m23-5", title: "(으)ㅂ시다 — let's …",              status: "available" as const },
      { id: "ko-m23-6", title: "Making plans",                      status: "available" as const },
      { id: "ko-m23-7", title: "Mini-dialogue — let's do something", status: "available" as const },
      { id: "ko-m23-8", title: "M23 Mastery Test",                  status: "available" as const },
    ];

    const m24Lessons = [
      { id: "ko-m24-1", title: "Hobbies — 취미, 그림, 사진, 음악",     status: "available" as const },
      { id: "ko-m24-2", title: "(으)ㄹ 줄 알다 / 모르다 — know how to", status: "available" as const },
      { id: "ko-m24-3", title: "거나 — or (doing X or Y)",          status: "available" as const },
      { id: "ko-m24-4", title: "Counting times — 번",              status: "available" as const },
      { id: "ko-m24-5", title: "How often — 일주일에 두 번",         status: "available" as const },
      { id: "ko-m24-6", title: "Describing your hobbies",           status: "available" as const },
      { id: "ko-m24-7", title: "Mini-dialogue — hobbies",           status: "available" as const },
      { id: "ko-m24-8", title: "M24 Mastery Test",                  status: "available" as const },
    ];

    const m25Lessons = [
      { id: "ko-m25-1", title: "Travel — 여행, 계획, 출발, 도착",       status: "available" as const },
      { id: "ko-m25-2", title: "Events — 온천, 축제, 결혼, 졸업",       status: "available" as const },
      { id: "ko-m25-3", title: "(으)려고 하다 — intend to",            status: "available" as const },
      { id: "ko-m25-4", title: "(으)러 가다 — go to do",              status: "available" as const },
      { id: "ko-m25-5", title: "(으)ㄴ 적이 있다 — have you ever",      status: "available" as const },
      { id: "ko-m25-6", title: "(으)ㄹ 때 — when",                    status: "available" as const },
      { id: "ko-m25-7", title: "Mini-dialogue — planning a trip",     status: "available" as const },
      { id: "ko-m25-8", title: "M25 Mastery Test",                   status: "available" as const },
    ];

    const m26Lessons = [
      { id: "ko-m26-1", title: "Trouble — 피곤하다, 늦다, 잊어버리다",   status: "available" as const },
      { id: "ko-m26-2", title: "Connectives — 그래서, 하지만, 그리고",  status: "available" as const },
      { id: "ko-m26-3", title: "거든요 — explaining a reason",         status: "available" as const },
      { id: "ko-m26-4", title: "너무 — too / too much",               status: "available" as const },
      { id: "ko-m26-5", title: "아/어서 — so / because",              status: "available" as const },
      { id: "ko-m26-6", title: "Explaining why",                      status: "available" as const },
      { id: "ko-m26-7", title: "Mini-dialogue — why are you late?",   status: "available" as const },
      { id: "ko-m26-8", title: "M26 Mastery Test",                   status: "available" as const },
    ];

    const m27Lessons = [
      { id: "ko-m27-1", title: "Goals — 결정하다, 약속, 준비, 연습",     status: "available" as const },
      { id: "ko-m27-2", title: "Health — 건강, 조심하다",              status: "available" as const },
      { id: "ko-m27-3", title: "아/어야 되다 — must / have to",        status: "available" as const },
      { id: "ko-m27-4", title: "는 게 좋다 — should / better to",      status: "available" as const },
      { id: "ko-m27-5", title: "아/어지다 — become",                  status: "available" as const },
      { id: "ko-m27-6", title: "이/가 되다 — become (a …)",           status: "available" as const },
      { id: "ko-m27-7", title: "Mini-dialogue — giving advice",       status: "available" as const },
      { id: "ko-m27-8", title: "M27 Mastery Test",                   status: "available" as const },
    ];

    const sideQuests: SideQuest[] = [
      {
        id: "ko-survival-phrasebook",
        emoji: "🗺️",
        title: "Survival Phrasebook",
        meta: "15 essentials · ~5 min · travel-ready",
        progress: 0,
        // Lesson content DELETED 2026-07-16 (side lessons to be remade);
        // tile stays visible but inert until the remake lands.
        comingSoon: true,
      },
      {
        id: "kdrama-vocab",
        emoji: "📺",
        title: "K-drama Vocab",
        meta: "12 words · oppa, daebak…",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "kfood-vocab",
        emoji: "🍜",
        title: "Korean Food",
        meta: "10 words · 비빔밥, 김치, 라면",
        unlockAfter: "ko-m1-complete",
        progress: 0,
        comingSoon: true,
      },
      {
        id: "daily-challenge",
        emoji: "⚡",
        title: "Daily Challenge",
        meta: "+20 XP · 60s timer",
        progress: 0,
        isDaily: true,
        comingSoon: true,
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
        {
          id: "m4",
          title: "Things & possession",
          eyebrow: "Module 4 · Describe",
          summary: "Everyday objects, the possessive 의 (and 제 = my), and the 이거/그거/저거 'this & that' system.",
          lessons: m4Lessons,
          accent: { from: "#f97316", to: "#ea580c" },
        },
        {
          id: "m5",
          title: "Numbers & counting",
          eyebrow: "Module 5 · Order",
          summary: "Native numbers, counters (개/명/잔), and 주세요 — everything you need to count and order.",
          lessons: m5Lessons,
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        {
          id: "m6",
          title: "Places & existence",
          eyebrow: "Module 6 · Locate",
          summary: "Places, 있어요/없어요 (there is/isn't), the 에 vs 에서 contrast, and asking 어디에 있어요?",
          lessons: m6Lessons,
          accent: { from: "#8b5cf6", to: "#7c3aed" },
        },
        {
          id: "m7",
          title: "Verbs & the 해요 present",
          eyebrow: "Module 7 · Act",
          summary: "Action verbs in the polite 해요 present (가요/먹어요/해요) and the object particle 을/를.",
          lessons: m7Lessons,
          accent: { from: "#ef4444", to: "#dc2626" },
        },
        {
          id: "m8",
          title: "Describing things",
          eyebrow: "Module 8 · Describe",
          summary: "Korean adjectives are verbs: 좋아요/커요/예뻐요, the ㅡ-drop, and the attributive 좋은 책.",
          lessons: m8Lessons,
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        {
          id: "m9",
          title: "Connecting things",
          eyebrow: "Module 9 · Connect",
          summary: "Join nouns and add 'also': 하고 (and/with), the formal 와/과, and the particle-replacing 도.",
          lessons: m9Lessons,
          accent: { from: "#10b981", to: "#059669" },
        },
        {
          id: "m10",
          title: "The past tense",
          eyebrow: "Module 10 · Recall",
          summary: "Polite past for verbs and adjectives (먹었어요/좋았어요), the past copula, and 어제/오늘.",
          lessons: m10Lessons,
          accent: { from: "#3b82f6", to: "#2563eb" },
        },
        {
          id: "m11",
          title: "Saying no & saying can't",
          eyebrow: "Module 11 · Negate",
          summary: "안 (don't) vs 못 (can't), the 공부 안 해요 split, past negation, and 고 싶어요 (want to).",
          lessons: m11Lessons,
          accent: { from: "#a855f7", to: "#9333ea" },
        },
        {
          id: "m12",
          title: "Time & the week",
          eyebrow: "Module 12 · Schedule",
          summary: "The clock (native-number hours + Sino-number minutes), days of the week, and the time particle 에.",
          lessons: m12Lessons,
          accent: { from: "#06b6d4", to: "#0891b2" },
        },
        {
          id: "m13",
          title: "Months & frequency",
          eyebrow: "Module 13 · Habits",
          summary: "Months (Sino + 월, incl. 유월/시월), the frequency spectrum (항상→전혀), ranges 부터/까지, and 그래서.",
          lessons: m13Lessons,
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          id: "m14",
          title: "Connecting & requesting",
          eyebrow: "Module 14 · Combine",
          summary: "The 고 and 아/어서 clause connectives, 아/어 주세요 requests, and big Sino numbers (백/천/만).",
          lessons: m14Lessons,
          accent: { from: "#6366f1", to: "#8b5cf6" },
        },
        {
          id: "m15",
          title: "Now, allowed, but",
          eyebrow: "Module 15 · Nuance",
          summary: "The progressive 고 있어요, asking/granting permission with 도 돼요, and contrast with 지만.",
          lessons: m15Lessons,
          accent: { from: "#ec4899", to: "#db2777" },
        },
        {
          id: "m16",
          title: "Rules & preferences",
          eyebrow: "Module 16 · Permit",
          summary: "Prohibition (으)면 안 돼요, the negative request 지 마세요, 고 나서, and 좋아하다/싫어하다.",
          lessons: m16Lessons,
          accent: { from: "#f97316", to: "#ea580c" },
        },
        {
          id: "m17",
          title: "Getting around",
          eyebrow: "Module 17 · Travel",
          summary: "Transport vocab, the means particle (으)로, 타다/내리다, directions, and the spatial 까지.",
          lessons: m17Lessons,
          accent: { from: "#14b8a6", to: "#0d9488" },
        },
        {
          id: "m18",
          title: "Weather & the future",
          eyebrow: "Module 18 · Predict",
          summary: "Weather & seasons, the ㅂ-irregular 덥다/춥다, the future (으)ㄹ 거예요, and 것 같아요 (it seems).",
          lessons: m18Lessons,
          accent: { from: "#8b5cf6", to: "#7c3aed" },
        },
        {
          id: "m19",
          title: "Family & people",
          eyebrow: "Module 19 · Kin",
          summary: "Family & sibling words, the in-group 우리 ('my'), counting people with 명, and giving ages with 살.",
          lessons: m19Lessons,
          accent: { from: "#f43f5e", to: "#e11d48" },
        },
        {
          id: "m20",
          title: "Body & health",
          eyebrow: "Module 20 · Care",
          summary: "Body parts, the ㅡ-irregular 아파요 ('hurts'), health vocab, and the reason connector (으)니까.",
          lessons: m20Lessons,
          accent: { from: "#10b981", to: "#059669" },
        },
        {
          id: "m21",
          title: "Food & restaurants",
          eyebrow: "Module 21 · Dine",
          summary: "Food & Korean dishes, listing with 하고/(이)랑, counting drinks with 잔, and naming with (이)라고 하다.",
          lessons: m21Lessons,
          accent: { from: "#f59e0b", to: "#d97706" },
        },
        {
          id: "m22",
          title: "Comparison",
          eyebrow: "Module 22 · Compare",
          summary: "Comparatives with 보다 and 더/덜, superlatives with 제일/가장, and picking the best with 중에서.",
          lessons: m22Lessons,
          accent: { from: "#06b6d4", to: "#0891b2" },
        },
        {
          id: "m23",
          title: "Ability & suggestions",
          eyebrow: "Module 23 · Plan",
          summary: "Ability with (으)ㄹ 수 있다/없다, skills with 잘하다/못하다, and suggestions with (으)ㄹ까요? / (으)ㅂ시다.",
          lessons: m23Lessons,
          accent: { from: "#6366f1", to: "#4f46e5" },
        },
        {
          id: "m24",
          title: "Hobbies & activities",
          eyebrow: "Module 24 · Enjoy",
          summary: "Hobby vocab, knowing how with (으)ㄹ 줄 알다/모르다, alternatives with 거나, and counting times with 번.",
          lessons: m24Lessons,
          accent: { from: "#a855f7", to: "#9333ea" },
        },
        {
          id: "m25",
          title: "Plans & intentions",
          eyebrow: "Module 25 · Plan",
          summary: "Intentions with (으)려고 하다, purpose with (으)러 가다, experience with (으)ㄴ 적이 있다, and 'when' with (으)ㄹ 때.",
          lessons: m25Lessons,
          accent: { from: "#0ea5e9", to: "#0284c7" },
        },
        {
          id: "m26",
          title: "Explaining & excess",
          eyebrow: "Module 26 · Explain",
          summary: "Explaining reasons with 거든요, excess with 너무, cause→result with 아/어서, and connectives 그래서/하지만/그리고/그런데.",
          lessons: m26Lessons,
          accent: { from: "#f43f5e", to: "#e11d48" },
        },
        {
          id: "m27",
          title: "Modal grammar",
          eyebrow: "Module 27 · Advise",
          summary: "Obligation with 아/어야 되다, advice with 는 게 좋다, and change of state with 아/어지다 and 이/가 되다.",
          lessons: m27Lessons,
          accent: { from: "#10b981", to: "#059669" },
        },
      ],
      sideQuests,
    };
  }

  const isSpanish = languageId === "es";

  if (isSpanish) {
    // ES pathway is assembled from the per-module curriculum files — see
    // es/curriculum/index.ts. Modules whose lesson arrays are still empty
    // stubs are skipped there, so the learn map only shows authored content.
    return {
      id: "mock-1",
      title: `${langName} for Beginners`,
      languageId,
      modules: buildSpanishCourse(),
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
