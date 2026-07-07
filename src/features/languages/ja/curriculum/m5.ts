/**
 * M5 — Numbers + ください (sub-lesson split 2026-05-24).
 *
 * Spine:
 *   - Numbers 1-10 (Sino-Japanese: いち, に, さん…)
 *   - Counter 人 (people only)
 *   - ください (please give me / I'll have) — the order pattern
 *   - から (origin — "from")
 *
 * 14 sub-lessons (M5_1_1 through M5_7_2). Each ~18 steps.
 * All new-word introductions use `build()` (figuroutable from context).
 * Grammar teach cards retained. Info cards only for system/grammar concepts.
 * Each sub-lesson ends with a 3-5 step review tail.
 */
import type {
  LessonContent,
  MatchPairsStep,
} from "@/features/lesson/types";
import {
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
  build,
  cloze,
  dialogueListen,
  grammarRule,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  vocabMcq,
  WORD_IMAGE_MCQ_BLOCKLIST,
  type ReviewAtom,
} from "@/features/languages/ja/grammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// M5-local atom pool
// ───────────────────────────────────────────────────────────────────────
const M5_NUMBER_ATOMS: ReviewAtom[] = [
  { kana: "いち",   meaningEn: "1 (one)",   emoji: "1️⃣", fromModule: "m5" },
  { kana: "に",     meaningEn: "2 (two)",   emoji: "2️⃣", fromModule: "m5" },
  { kana: "さん",   meaningEn: "3 (three)", emoji: "3️⃣", fromModule: "m5" },
  { kana: "よん",   meaningEn: "4 (four)",  emoji: "4️⃣", fromModule: "m5" },
  { kana: "ご",     meaningEn: "5 (five)",  emoji: "5️⃣", fromModule: "m5" },
  { kana: "ろく",   meaningEn: "6 (six)",   emoji: "6️⃣", fromModule: "m5" },
  { kana: "なな",   meaningEn: "7 (seven)", emoji: "7️⃣", fromModule: "m5" },
  { kana: "はち",   meaningEn: "8 (eight)", emoji: "8️⃣", fromModule: "m5" },
  { kana: "きゅう", meaningEn: "9 (nine)",  emoji: "9️⃣", fromModule: "m5" },
  { kana: "じゅう", meaningEn: "10 (ten)",  emoji: "🔟", fromModule: "m5" },
];

// ───────────────────────────────────────────────────────────────────────
// Cumulative prior-module pools (M1 + M2 + M3 + M4)
// ───────────────────────────────────────────────────────────────────────
const PRIOR_POOL = M3_M7_REVIEW_POOL.filter(
  (a) =>
    (a.fromModule === "m1" || a.fromModule === "m2" ||
     a.fromModule === "m3" || a.fromModule === "m4") &&
    !WORD_IMAGE_MCQ_BLOCKLIST.has(a.kana),
);

// ═══════════════════════════════════════════════════════════════════════
// M5-1-1 — Numbers 1-3 (figuroutable build intros)
// ═══════════════════════════════════════════════════════════════════════

const M5_1_1_REVIEW = pickReviewAtoms("ja-m5-1-1-rev", PRIOR_POOL, 4);

export const M5_1_1: LessonContent = {
  id: "ja-m5-1-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 1–3",
  description:
    "The first three Sino-Japanese numbers. Build each word from tiles — the English prompt makes the answer obvious.",
  estimatedMinutes: 7,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m5-1-1-info-open",
      "Numbers — two systems, one priority",
      "Japanese has two number systems. Sino-Japanese (いち, に, さん…) is used for math, money, time, addresses, and counting most things. Native readings (ひとつ, ふたつ…) are for generic objects. Today: the Sino set, starting with 1-3.",
      "culture",
    ),
    // ── いち (1) — single tile, English "1 (one)" makes it obvious ──
    build(
      "ja-m5-1-1-build-ichi",
      "1 (one)",
      "いち",
      ["に", "いち", "さん", "よん"],
      ["いち"],
    ),
    vocabMcq("ja-m5-1-1-mcq-ichi", M5_NUMBER_ATOMS[0], M5_NUMBER_ATOMS),
    listeningCompSentence({
      id: "ja-m5-1-1-lc-ichi",
      audioText: "いち",
      correctMeaningEn: "1 (one)",
      distractorsEn: ["2 (two)", "3 (three)", "5 (five)"],
    }),
    // ── に (2) — single tile pick ──
    build(
      "ja-m5-1-1-build-ni",
      "2 (two)",
      "に",
      ["いち", "さん", "に", "ご"],
      ["に"],
    ),
    listeningCompSentence({
      id: "ja-m5-1-1-lc-ni",
      audioText: "に",
      correctMeaningEn: "2 (two)",
      distractorsEn: ["1 (one)", "3 (three)", "4 (four)"],
    }),
    // ── さん (3) — single tile pick ──
    build(
      "ja-m5-1-1-build-san",
      "3 (three)",
      "さん",
      ["に", "よん", "いち", "さん"],
      ["さん"],
    ),
    vocabMcq("ja-m5-1-1-mcq-san", M5_NUMBER_ATOMS[2], M5_NUMBER_ATOMS),
    // ── Discrimination & retrieval ──
    sentenceMcq({
      id: "ja-m5-1-1-mcq-discrim",
      prompt: "Which kana means '2'?",
      correctKana: "に",
      distractorsKana: ["いち", "さん", "よん"],
      explanation: "に = two. いち = 1, さん = 3, よん = 4.",
    }),
    // Match pairs — numerals 1-3
    {
      id: "ja-m5-1-1-match-1-3",
      type: "match_pairs",
      prompt: "Match each Japanese number to its numeral",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "いち", target: "1", sourceAnnotation: [{ surface: "いち", reading: "いち" }] },
        { id: "p2", source: "に",   target: "2", sourceAnnotation: [{ surface: "に",   reading: "に" }] },
        { id: "p3", source: "さん", target: "3", sourceAnnotation: [{ surface: "さん", reading: "さん" }] },
      ],
    } satisfies MatchPairsStep,
    speaking("ja-m5-1-1-speak-san", "さん", "3 (three)"),
    sentenceMcq({
      id: "ja-m5-1-1-mcq-produce-1",
      prompt: "How do you say '1' in Japanese?",
      correctKana: "いち",
      distractorsKana: ["に", "さん", "ご"],
      explanation: "いち = 1. に = 2, さん = 3, ご = 5.",
    }),
    listeningBuildSentence({
      id: "ja-m5-1-1-lb-ni",
      target: "に",
      tiles: ["さん", "に", "いち"],
      correctOrder: ["に"],
      promptEn: "Hear it, pick the tile: '2'",
    }),
    speaking("ja-m5-1-1-speak-ichi", "いち", "1 (one)"),
    // ── Review tail ──
    speaking("ja-m5-1-1-rev-speak-1", M5_1_1_REVIEW[0].kana, M5_1_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-1-1-rev-lc-1",
      audioText: M5_1_1_REVIEW[1].kana,
      correctMeaningEn: M5_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_1_1_REVIEW[2].meaningEn,
        M5_1_1_REVIEW[3].meaningEn,
        PRIOR_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-1-1-rev-mcq-2", M5_1_1_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-1-1-rev", M5_1_1_REVIEW),
    infoStep(
      "ja-m5-1-1-info-end",
      "You can now count to three in Japanese",
      "The first three Sino-Japanese numbers: いち (1), に (2), さん (3) — the system used for math, money, and time.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_1_1.steps);
assertAnswerRotation(M5_1_1.steps, 2);
assertNoConsecutiveSame(M5_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-1-2 — Numbers 4-5 + consolidation of 1-5
// ═══════════════════════════════════════════════════════════════════════

const M5_1_2_REVIEW = pickReviewAtoms("ja-m5-1-2-rev", PRIOR_POOL, 4);

export const M5_1_2: LessonContent = {
  id: "ja-m5-1-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 4–5 + consolidation",
  description:
    "Complete the first half of the counting set. よん has a cultural reason to exist alongside し.",
  estimatedMinutes: 7,
  xpReward: 20,
  steps: [
    // ── よん (4) — single tile, figuroutable from "4 (four)" ──
    build(
      "ja-m5-1-2-build-yon",
      "4 (four)",
      "よん",
      ["ご", "よん", "さん", "ろく"],
      ["よん"],
    ),
    listeningCompSentence({
      id: "ja-m5-1-2-lc-yon",
      audioText: "よん",
      correctMeaningEn: "4 (four)",
      distractorsEn: ["3 (three)", "5 (five)", "2 (two)"],
    }),
    infoStep(
      "ja-m5-1-2-info-yon",
      "Why よん, not し?",
      "'Shi' (し) overlaps with 'death' (死) in Japanese. Most speakers prefer よん for clarity in everyday use — hospitals even skip floor 4. You'll hear し in set phrases (like しがつ = April), but よん is the safe default.",
      "culture",
    ),
    // ── ご (5) — single tile ──
    build(
      "ja-m5-1-2-build-go",
      "5 (five)",
      "ご",
      ["よん", "に", "ご", "ろく"],
      ["ご"],
    ),
    vocabMcq("ja-m5-1-2-mcq-go", M5_NUMBER_ATOMS[4], M5_NUMBER_ATOMS),
    speaking("ja-m5-1-2-speak-go", "ご", "5 (five)"),
    // ── Full 1-5 consolidation ──
    {
      id: "ja-m5-1-2-match-1-5",
      type: "match_pairs",
      prompt: "Match each Japanese number to its numeral",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "いち", target: "1", sourceAnnotation: [{ surface: "いち", reading: "いち" }] },
        { id: "p2", source: "に",   target: "2", sourceAnnotation: [{ surface: "に",   reading: "に" }] },
        { id: "p3", source: "さん", target: "3", sourceAnnotation: [{ surface: "さん", reading: "さん" }] },
        { id: "p4", source: "よん", target: "4", sourceAnnotation: [{ surface: "よん", reading: "よん" }] },
        { id: "p5", source: "ご",   target: "5", sourceAnnotation: [{ surface: "ご",   reading: "ご" }] },
        { id: "p6", source: "し",   target: "4 (set phrases)", sourceAnnotation: [{ surface: "し", reading: "し" }] },
      ],
    } satisfies MatchPairsStep,
    sentenceMcq({
      id: "ja-m5-1-2-mcq-produce-3",
      prompt: "How do you say '3' in Japanese?",
      correctKana: "さん",
      distractorsKana: ["に", "ご", "よん"],
      explanation: "さん = 3. に = 2, ご = 5, よん = 4.",
    }),
    listeningCompSentence({
      id: "ja-m5-1-2-lc-go",
      audioText: "ご",
      correctMeaningEn: "5 (five)",
      distractorsEn: ["4 (four)", "3 (three)", "1 (one)"],
    }),
    sentenceMcq({
      id: "ja-m5-1-2-mcq-produce-5",
      prompt: "How do you say '5' in Japanese?",
      correctKana: "ご",
      distractorsKana: ["いち", "さん", "よん"],
      explanation: "ご = 5.",
    }),
    speaking("ja-m5-1-2-speak-yon", "よん", "4 (four)"),
    listeningBuildSentence({
      id: "ja-m5-1-2-lb-ichi",
      target: "いち",
      tiles: ["よん", "さん", "に", "いち"],
      correctOrder: ["いち"],
      promptEn: "Hear it, pick the tile: '1'",
    }),
    sentenceMcq({
      id: "ja-m5-1-2-mcq-produce-2",
      prompt: "How do you say '2' in Japanese?",
      correctKana: "に",
      distractorsKana: ["いち", "さん", "よん"],
      explanation: "に = 2. いち = 1, さん = 3, よん = 4.",
    }),
    speaking("ja-m5-1-2-speak-ni", "に", "2 (two)"),
    // ── Review tail ──
    speaking("ja-m5-1-2-rev-speak-1", M5_1_2_REVIEW[0].kana, M5_1_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-1-2-rev-lc-1",
      audioText: M5_1_2_REVIEW[1].kana,
      correctMeaningEn: M5_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_1_2_REVIEW[2].meaningEn,
        M5_1_2_REVIEW[3].meaningEn,
        PRIOR_POOL[1].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-1-2-rev-mcq-2", M5_1_2_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-1-2-rev", M5_1_2_REVIEW),
    infoStep(
      "ja-m5-1-2-info-end",
      "You can now count to five in Japanese",
      "よん (4) and ご (5) complete the first half. よん is preferred over し to avoid the overlap with 'death' (死).",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_1_2.steps);
assertAnswerRotation(M5_1_2.steps, 2);
assertNoConsecutiveSame(M5_1_2.steps);

// ═════════════════════════════════════════════════════════════════════════
// M5-2-1 — Numbers 6-8
// ═══════════════════════════════════════════════════════════════════════

const M5_2_1_REVIEW = pickReviewAtoms("ja-m5-2-1-rev", PRIOR_POOL, 4);

export const M5_2_1: LessonContent = {
  id: "ja-m5-2-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 6–8",
  description: "Three more numbers to expand your counting range.",
  estimatedMinutes: 7,
  xpReward: 20,
  steps: [
    // ── ろく (6) — single tile ──
    build(
      "ja-m5-2-1-build-roku",
      "6 (six)",
      "ろく",
      ["なな", "ろく", "はち", "ご"],
      ["ろく"],
    ),
    vocabMcq("ja-m5-2-1-mcq-roku", M5_NUMBER_ATOMS[5], M5_NUMBER_ATOMS),
    listeningCompSentence({
      id: "ja-m5-2-1-lc-roku",
      audioText: "ろく",
      correctMeaningEn: "6 (six)",
      distractorsEn: ["7 (seven)", "5 (five)", "8 (eight)"],
    }),
    // ── なな (7) — single tile ──
    build(
      "ja-m5-2-1-build-nana",
      "7 (seven)",
      "なな",
      ["ろく", "はち", "なな", "きゅう"],
      ["なな"],
    ),
    listeningCompSentence({
      id: "ja-m5-2-1-lc-nana",
      audioText: "なな",
      correctMeaningEn: "7 (seven)",
      distractorsEn: ["6 (six)", "8 (eight)", "9 (nine)"],
    }),
    sentenceMcq({
      id: "ja-m5-2-1-mcq-discrim-7",
      prompt: "Which kana means '7'?",
      correctKana: "なな",
      distractorsKana: ["ろく", "はち", "ご"],
      explanation: "なな = seven. Also pronounced 'shichi' but 'nana' is preferred to avoid confusion with いち.",
    }),
    // ── はち (8) — single tile ──
    build(
      "ja-m5-2-1-build-hachi",
      "8 (eight)",
      "はち",
      ["なな", "きゅう", "ろく", "はち"],
      ["はち"],
    ),
    vocabMcq("ja-m5-2-1-mcq-hachi", M5_NUMBER_ATOMS[7], M5_NUMBER_ATOMS),
    listeningCompSentence({
      id: "ja-m5-2-1-lc-hachi",
      audioText: "はち",
      correctMeaningEn: "8 (eight)",
      distractorsEn: ["6 (six)", "7 (seven)", "9 (nine)"],
    }),
    // ── Consolidation ──
    {
      id: "ja-m5-2-1-match-6-8",
      type: "match_pairs",
      prompt: "Match each Japanese number to its numeral",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "ろく", target: "6", sourceAnnotation: [{ surface: "ろく", reading: "ろく" }] },
        { id: "p2", source: "なな", target: "7", sourceAnnotation: [{ surface: "なな", reading: "なな" }] },
        { id: "p3", source: "はち", target: "8", sourceAnnotation: [{ surface: "はち", reading: "はち" }] },
        { id: "p4", source: "ご",   target: "5", sourceAnnotation: [{ surface: "ご",   reading: "ご" }] },
      ],
    } satisfies MatchPairsStep,
    speaking("ja-m5-2-1-speak-roku", "ろく", "6 (six)"),
    sentenceMcq({
      id: "ja-m5-2-1-mcq-produce-8",
      prompt: "How do you say '8' in Japanese?",
      correctKana: "はち",
      distractorsKana: ["ろく", "なな", "きゅう"],
      explanation: "はち = 8.",
    }),
    listeningBuildSentence({
      id: "ja-m5-2-1-lb-nana",
      target: "なな",
      tiles: ["はち", "なな", "ろく"],
      correctOrder: ["なな"],
      promptEn: "Hear it, pick the tile: '7'",
    }),
    speaking("ja-m5-2-1-speak-hachi", "はち", "8 (eight)"),
    // ── Review tail ──
    speaking("ja-m5-2-1-rev-speak-1", M5_2_1_REVIEW[0].kana, M5_2_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-2-1-rev-lc-1",
      audioText: M5_2_1_REVIEW[1].kana,
      correctMeaningEn: M5_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_2_1_REVIEW[2].meaningEn,
        M5_2_1_REVIEW[3].meaningEn,
        PRIOR_POOL[2].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-2-1-rev-mcq-2", M5_2_1_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-2-1-rev", M5_2_1_REVIEW),
    infoStep(
      "ja-m5-2-1-info-end",
      "You can now count from six to eight",
      "ろく (6), なな (7), and はち (8). なな is preferred over しち to avoid confusion with いち.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_2_1.steps);
assertAnswerRotation(M5_2_1.steps, 2);
assertNoConsecutiveSame(M5_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-2-2 — Numbers 9-10 + full 1-10 consolidation
// ═══════════════════════════════════════════════════════════════════════

const M5_2_2_REVIEW = pickReviewAtoms("ja-m5-2-2-rev", PRIOR_POOL, 4);

export const M5_2_2: LessonContent = {
  id: "ja-m5-2-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Numbers 9–10 + full set consolidation",
  description: "Finish the Sino set and consolidate all ten numbers.",
  estimatedMinutes: 7,
  xpReward: 20,
  steps: [
    // ── きゅう (9) — single tile ──
    build(
      "ja-m5-2-2-build-kyuu",
      "9 (nine)",
      "きゅう",
      ["じゅう", "きゅう", "はち", "ろく"],
      ["きゅう"],
    ),
    listeningCompSentence({
      id: "ja-m5-2-2-lc-kyuu",
      audioText: "きゅう",
      correctMeaningEn: "9 (nine)",
      distractorsEn: ["10 (ten)", "8 (eight)", "7 (seven)"],
    }),
    infoStep(
      "ja-m5-2-2-info-kyuu",
      "Why きゅう, not く?",
      "'Ku' (く) overlaps with 'pain/suffering' (苦). Most speakers prefer きゅう for clarity. You'll hear く in set phrases (like くがつ = September), but きゅう is the safe default.",
      "culture",
    ),
    // ── じゅう (10) — single tile ──
    build(
      "ja-m5-2-2-build-juu",
      "10 (ten)",
      "じゅう",
      ["きゅう", "はち", "じゅう", "なな"],
      ["じゅう"],
    ),
    vocabMcq("ja-m5-2-2-mcq-juu", M5_NUMBER_ATOMS[9], M5_NUMBER_ATOMS),
    speaking("ja-m5-2-2-speak-juu", "じゅう", "10 (ten)"),
    // ── Full 6-10 match ──
    {
      id: "ja-m5-2-2-match-6-10",
      type: "match_pairs",
      prompt: "Match each Japanese number to its numeral",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "ろく",   target: "6",  sourceAnnotation: [{ surface: "ろく",   reading: "ろく" }] },
        { id: "p2", source: "なな",   target: "7",  sourceAnnotation: [{ surface: "なな",   reading: "なな" }] },
        { id: "p3", source: "はち",   target: "8",  sourceAnnotation: [{ surface: "はち",   reading: "はち" }] },
        { id: "p4", source: "きゅう", target: "9",  sourceAnnotation: [{ surface: "きゅう", reading: "きゅう" }] },
        { id: "p5", source: "じゅう", target: "10", sourceAnnotation: [{ surface: "じゅう", reading: "じゅう" }] },
        { id: "p6", source: "いち",   target: "1",  sourceAnnotation: [{ surface: "いち",   reading: "いち" }] },
      ],
    } satisfies MatchPairsStep,
    sentenceMcq({
      id: "ja-m5-2-2-mcq-produce-9",
      prompt: "How do you say '9' in Japanese?",
      correctKana: "きゅう",
      distractorsKana: ["じゅう", "はち", "なな"],
      explanation: "きゅう = 9.",
    }),
    listeningCompSentence({
      id: "ja-m5-2-2-lc-juu",
      audioText: "じゅう",
      correctMeaningEn: "10 (ten)",
      distractorsEn: ["9 (nine)", "8 (eight)", "6 (six)"],
    }),
    sentenceMcq({
      id: "ja-m5-2-2-mcq-produce-6",
      prompt: "How do you say '6' in Japanese?",
      correctKana: "ろく",
      distractorsKana: ["なな", "はち", "きゅう"],
      explanation: "ろく = 6.",
    }),
    speaking("ja-m5-2-2-speak-kyuu", "きゅう", "9 (nine)"),
    listeningBuildSentence({
      id: "ja-m5-2-2-lb-juu",
      target: "じゅう",
      tiles: ["はち", "じゅう", "なな", "きゅう"],
      correctOrder: ["じゅう"],
      promptEn: "Hear it, pick the tile: '10'",
    }),
    sentenceMcq({
      id: "ja-m5-2-2-mcq-produce-7",
      prompt: "How do you say '7' in Japanese?",
      correctKana: "なな",
      distractorsKana: ["ろく", "はち", "じゅう"],
      explanation: "なな = 7.",
    }),
    speaking("ja-m5-2-2-speak-roku", "ろく", "6 (six)"),
    // ── Review tail ──
    speaking("ja-m5-2-2-rev-speak-1", M5_2_2_REVIEW[0].kana, M5_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-2-2-rev-lc-1",
      audioText: M5_2_2_REVIEW[1].kana,
      correctMeaningEn: M5_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_2_2_REVIEW[2].meaningEn,
        M5_2_2_REVIEW[3].meaningEn,
        PRIOR_POOL[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-2-2-rev-mcq-2", M5_2_2_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-2-2-rev", M5_2_2_REVIEW),
    infoStep(
      "ja-m5-2-2-info-end",
      "You can now count from one to ten",
      "きゅう (9) and じゅう (10) finish the set. All ten Sino-Japanese numbers consolidated — いち through じゅう.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_2_2.steps);
assertAnswerRotation(M5_2_2.steps, 2);
assertNoConsecutiveSame(M5_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-3-1 — ください grammar rule + basic orders
// ═══════════════════════════════════════════════════════════════════════

const M5_3_1_REVIEW = pickReviewAtoms("ja-m5-3-1-rev", PRIOR_POOL, 4);

const RULE_KUDASAI = grammarRule({
  id: "ja-m5-3-1-rule-kudasai",
  grammarPointId: "kudasai",
  title: "ください — 'please give me / I'll have'",
  rule:
    "ください comes at the END of a request after the thing you want. Pattern: [item] ください. Add a quantity in front for orders: [item] [number] ください — 'X of these, please.' Politer than the dictionary form, polite enough for shops, restaurants, taxis, anywhere.",
  examples: [
    {
      ja: "みず ください。",
      romaji: "mizu kudasai.",
      en: "Water, please.",
    },
    {
      ja: "コーヒー ふたつ ください。",
      romaji: "koohii futatsu kudasai.",
      en: "Two coffees, please.",
    },
  ],
  antiPattern: {
    ja: "ください コーヒー。",
    romaji: "kudasai koohii.",
    en: "(broken — ください always comes last)",
    why: "ください is a sentence-ending request marker. Putting it first sounds like a verb-stem mistake. The item + (quantity) come first, then ください.",
  },
  cultureNote:
    "ください is the polite, neutral request form — fine in any non-formal context. For business or formal asks, swap to おねがいします (which you'll meet in M6).",
});

export const M5_3_1: LessonContent = {
  id: "ja-m5-3-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "ください — the order word",
  description:
    "Learn the magic word that turns any noun into a polite request. Pattern: [item] ください.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    RULE_KUDASAI,
    // ── ください — figuroutable: learner knows コーヒー, only ください is new ──
    build(
      "ja-m5-3-1-build-kudasai",
      "Coffee, please.",
      "コーヒー ください",
      ["ください", "です", "コーヒー", "ですか"],
      ["コーヒー", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m5-3-1-lc-kudasai",
      audioText: "コーヒー ください",
      correctMeaningEn: "Coffee, please.",
      distractorsEn: ["Is this coffee?", "Water, please.", "How much is the coffee?"],
    }),
    // ── みず ください — learner knows みず from M3, ください just learned ──
    build(
      "ja-m5-3-1-build-mizu",
      "Water, please.",
      "みず ください",
      ["ください", "みず", "ですか", "コーヒー"],
      ["みず", "ください"],
    ),
    speaking("ja-m5-3-1-speak-mizu", "みず ください", "Water, please."),
    // Cloze — pick ください vs other endings
    cloze(
      "ja-m5-3-1-cloze-1",
      "みず ",
      "。",
      "ください",
      ["ください", "です", "ですか", "は"],
      "Water, please.",
      "みず ください。",
      "ください ends the request — it attaches AFTER the item.",
    ),
    listeningBuildSentence({
      id: "ja-m5-3-1-lb-kasa",
      target: "かさ ください",
      tiles: ["ください", "かさ", "かばん", "です"],
      correctOrder: ["かさ", "ください"],
      promptEn: "Hear it, build it: 'An umbrella, please.'",
    }),
    sentenceMcq({
      id: "ja-m5-3-1-mcq-order",
      prompt: "Which sentence says 'A book, please.'?",
      correctKana: "ほん ください。",
      distractorsKana: [
        "ほん です。",
        "ほん ですか。",
        "ください ほん。",
      ],
      explanation: "Item + ください = polite request. ください always comes last.",
    }),
    // Production — the pattern works for ANY noun you already know
    build(
      "ja-m5-3-1-build-pen",
      "A pen, please.",
      "ペン ください",
      ["えん", "ください", "ペン", "です"],
      ["ペン", "ください"],
    ),
    build(
      "ja-m5-3-1-build-beer",
      "Beer, please.",
      "ビール ください",
      ["です", "ください", "ビール", "コーヒー"],
      ["ビール", "ください"],
    ),
    speaking("ja-m5-3-1-speak-jisho", "じしょ ください", "A dictionary, please."),
    listeningCompSentence({
      id: "ja-m5-3-1-lc-beer",
      audioText: "ビール ください",
      correctMeaningEn: "Beer, please.",
      distractorsEn: ["Coffee, please.", "Water, please.", "Is this beer?"],
    }),
    selfExplain({
      id: "ja-m5-3-1-self-kudasai",
      anchorLabel: "You picked ください in: みず ＿",
      anchorAudioText: "みず ください",
      question: "Why is ください correct here?",
      rule: { text: "ください turns a noun into a polite request — 'please give me X.'" },
      surface: { text: "ください is required whenever です would sound too formal." },
      distractor: { text: "ください is the question marker." },
      ruleExplanation:
        "ください attaches to ANY item you're requesting (food, drink, object, service). It's the polite request marker — not a politeness-register switch on です, and not a question.",
    }),
    // ── Review tail ──
    speaking("ja-m5-3-1-rev-speak-1", M5_3_1_REVIEW[0].kana, M5_3_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-3-1-rev-lc-1",
      audioText: M5_3_1_REVIEW[1].kana,
      correctMeaningEn: M5_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_3_1_REVIEW[2].meaningEn,
        M5_3_1_REVIEW[3].meaningEn,
        PRIOR_POOL[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-3-1-rev-mcq-2", M5_3_1_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-3-1-rev", M5_3_1_REVIEW),
    infoStep(
      "ja-m5-3-1-info-end",
      "You can now order anything politely with ください",
      "The magic request word: item + ください. Coffee, water, a pen, an umbrella — any noun you know is now a polite request.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_3_1.steps);
assertAnswerRotation(M5_3_1.steps, 2);
assertNoConsecutiveSame(M5_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-3-2 — ください with quantities
// ═══════════════════════════════════════════════════════════════════════

const M5_3_2_REVIEW = pickReviewAtoms("ja-m5-3-2-rev", PRIOR_POOL, 4);

export const M5_3_2: LessonContent = {
  id: "ja-m5-3-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "ください + quantity orders",
  description:
    "Combine item + number + ください for real café orders. Introduce generic counters ひとつ / ふたつ / みっつ.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m5-3-2-info-open",
      "Generic counters for ordering",
      "When ordering items (coffees, dishes, tickets), use the native-reading counters: ひとつ (1 thing), ふたつ (2 things), みっつ (3 things). Pattern: item + counter + ください.",
      "grammar",
    ),
    // ── ひとつ — figuroutable: "1 thing" + only one unknown tile ──
    build(
      "ja-m5-3-2-build-hitotsu",
      "One coffee, please. (1 thing)",
      "コーヒー ひとつ ください",
      ["ください", "ひとつ", "ふたつ", "コーヒー"],
      ["コーヒー", "ひとつ", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m5-3-2-lc-hitotsu",
      audioText: "コーヒー ひとつ ください",
      correctMeaningEn: "One coffee, please.",
      distractorsEn: ["Two coffees, please.", "Coffee, please.", "Three coffees, please."],
    }),
    // ── ふたつ — figuroutable: "2 things" + only ふたつ unknown ──
    build(
      "ja-m5-3-2-build-futatsu",
      "Two books, please. (2 things)",
      "ほん ふたつ ください",
      ["みっつ", "ふたつ", "ほん", "ください"],
      ["ほん", "ふたつ", "ください"],
    ),
    speaking("ja-m5-3-2-speak-futatsu", "かさ ふたつ ください", "Two umbrellas, please."),
    // ── みっつ — figuroutable: "3 things" + only みっつ unknown ──
    build(
      "ja-m5-3-2-build-mittsu",
      "Three waters, please. (3 things)",
      "みず みっつ ください",
      ["みっつ", "みず", "ひとつ", "ください"],
      ["みず", "みっつ", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m5-3-2-lc-mittsu",
      audioText: "みず みっつ ください",
      correctMeaningEn: "Three waters, please.",
      distractorsEn: ["One water, please.", "Two waters, please.", "Water, please."],
    }),
    // Match the counters
    {
      id: "ja-m5-3-2-match-counters",
      type: "match_pairs",
      prompt: "Match each counter or number to its meaning",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "ひとつ", target: "1 thing",  sourceAnnotation: [{ surface: "ひとつ", reading: "ひとつ" }] },
        { id: "p2", source: "ふたつ", target: "2 things", sourceAnnotation: [{ surface: "ふたつ", reading: "ふたつ" }] },
        { id: "p3", source: "みっつ", target: "3 things", sourceAnnotation: [{ surface: "みっつ", reading: "みっつ" }] },
        { id: "p4", source: "さん",   target: "3 (bare number)", sourceAnnotation: [{ surface: "さん", reading: "さん" }] },
      ],
    } satisfies MatchPairsStep,
    sentenceMcq({
      id: "ja-m5-3-2-mcq-order-2",
      prompt: "Which sentence orders TWO beers?",
      correctKana: "ビール ふたつ ください。",
      distractorsKana: [
        "ビール ひとつ ください。",
        "ビール みっつ ください。",
        "ふたつ ビール ください。",
      ],
      explanation: "ふたつ = 2 things. Word order: item + quantity + ください.",
    }),
    build(
      "ja-m5-3-2-build-order-3",
      "Three beers, please.",
      "ビール みっつ ください",
      ["ください", "ビール", "ふたつ", "みっつ"],
      ["ビール", "みっつ", "ください"],
    ),
    speaking("ja-m5-3-2-speak-hitotsu", "かばん ひとつ ください", "One bag, please."),
    listeningBuildSentence({
      id: "ja-m5-3-2-lb-hitotsu",
      target: "みず ひとつ ください",
      tiles: ["ひとつ", "ください", "みず", "ふたつ"],
      correctOrder: ["みず", "ひとつ", "ください"],
      promptEn: "Hear it, build it: 'One water, please.'",
    }),
    sentenceMcq({
      id: "ja-m5-3-2-mcq-order-3",
      prompt: "Which counter form is for THREE things?",
      correctKana: "みっつ",
      distractorsKana: ["ひとつ", "ふたつ", "さん"],
      explanation: "みっつ = 3 generic things (native counter). さん is for math/money, not object orders.",
    }),
    cloze(
      "ja-m5-3-2-cloze-1",
      "ペン ふたつ ",
      "。",
      "ください",
      ["ください", "です", "ですか", "は"],
      "Two pens, please.",
      "ペン ふたつ ください。",
      "Item + quantity + ください — the full order pattern.",
    ),
    cloze(
      "ja-m5-3-2-cloze-2",
      "ほん ",
      " ください。",
      "ひとつ",
      ["ひとつ", "ふたつ", "みっつ", "ふたり"],
      "One book, please.",
      "ほん ひとつ ください。",
      "ひとつ = 1 thing. Item + quantity + ください.",
    ),
    // ── Review tail ──
    speaking("ja-m5-3-2-rev-speak-1", M5_3_2_REVIEW[0].kana, M5_3_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-3-2-rev-lc-1",
      audioText: M5_3_2_REVIEW[1].kana,
      correctMeaningEn: M5_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_3_2_REVIEW[2].meaningEn,
        M5_3_2_REVIEW[3].meaningEn,
        PRIOR_POOL[5].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-3-2-rev-mcq-2", M5_3_2_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-3-2-rev", M5_3_2_REVIEW),
    infoStep(
      "ja-m5-3-2-info-end",
      "You can now order multiple items at a cafe",
      "Generic counters ひとつ (1 thing), ふたつ (2 things), みっつ (3 things) slotted into the item + quantity + ください pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_3_2.steps);
assertAnswerRotation(M5_3_2.steps, 2);
assertNoConsecutiveSame(M5_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-4-1 — 人 counter: ひとり / ふたり (native readings)
// ═══════════════════════════════════════════════════════════════════════

const M5_4_1_REVIEW = pickReviewAtoms("ja-m5-4-1-rev", PRIOR_POOL, 4);

export const M5_4_1: LessonContent = {
  id: "ja-m5-4-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Counting people — ひとり & ふたり",
  description:
    "The people-counter uses NATIVE readings for 1 and 2. Every restaurant entrance asks 'how many?'",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m5-4-1-info-open",
      "Counters — why Japanese doesn't say 'three cats'",
      "Japanese doesn't say 'three cats' — it says 'cats, three [counter].' Each category has its own counter. 人 (the people-counter) is first because every restaurant entrance asks 'how many people?' 1 and 2 people use NATIVE readings (ひとり, ふたり) — NOT Sino いち/に.",
      "grammar",
    ),
    // ── ひとり — figuroutable: "1 person" prompt, single unknown tile ──
    build(
      "ja-m5-4-1-build-hitori",
      "(A table for) 1 person.",
      "ひとり です",
      ["です", "ひとり", "ふたり", "ください"],
      ["ひとり", "です"],
    ),
    listeningCompSentence({
      id: "ja-m5-4-1-lc-hitori",
      audioText: "ひとり です",
      correctMeaningEn: "One person.",
      distractorsEn: ["Two people.", "Three people.", "1 (one)."],
    }),
    sentenceMcq({
      id: "ja-m5-4-1-mcq-hitori",
      prompt: "Which word means '1 person'?",
      correctKana: "ひとり",
      distractorsKana: ["いち", "ひとつ", "ふたり"],
      explanation: "ひとり = 1 person (NATIVE reading). いち = 1 (number). ひとつ = 1 thing (object counter).",
    }),
    // ── ふたり — figuroutable: "2 people" prompt, single unknown tile ──
    build(
      "ja-m5-4-1-build-futari",
      "(A table for) 2 people.",
      "ふたり です",
      ["ひとり", "です", "ふたり", "さんにん"],
      ["ふたり", "です"],
    ),
    listeningCompSentence({
      id: "ja-m5-4-1-lc-futari",
      audioText: "ふたり です",
      correctMeaningEn: "Two people.",
      distractorsEn: ["One person.", "Three people.", "Four people."],
    }),
    speaking("ja-m5-4-1-speak-futari", "ふたり です", "(A table for) two."),
    // Match pairs
    {
      id: "ja-m5-4-1-match-people",
      type: "match_pairs",
      prompt: "Match each counter to its meaning — people vs things",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "ひとり", target: "1 person", sourceAnnotation: [{ surface: "ひとり", reading: "ひとり" }] },
        { id: "p2", source: "ふたり", target: "2 people", sourceAnnotation: [{ surface: "ふたり", reading: "ふたり" }] },
        { id: "p3", source: "ひとつ", target: "1 thing",  sourceAnnotation: [{ surface: "ひとつ", reading: "ひとつ" }] },
        { id: "p4", source: "ふたつ", target: "2 things", sourceAnnotation: [{ surface: "ふたつ", reading: "ふたつ" }] },
      ],
    } satisfies MatchPairsStep,
    infoStep(
      "ja-m5-4-1-info-restaurant",
      "At a restaurant entrance",
      "Staff will ask 'なんめいさまですか' (how many people?). You answer with the counter + です: 'ふたりです.' (Two.) Say 'いちにん' or 'ににん' and they'll smile and gently correct you — the native readings for 1 and 2 are non-negotiable.",
      "culture",
    ),
    listeningBuildSentence({
      id: "ja-m5-4-1-lb-sensei",
      target: "せんせいは ひとりです",
      tiles: ["は", "せんせい", "ひとり", "です", "ふたり"],
      correctOrder: ["せんせい", "は", "ひとり", "です"],
      promptEn: "Hear it, build it: 'There is one teacher.'",
    }),
    sentenceMcq({
      id: "ja-m5-4-1-mcq-entrance",
      prompt: "Which sentence answers 'how many?' with TWO people?",
      correctKana: "ふたり です。",
      distractorsKana: [
        "ひとり です。",
        "ふたつ です。",
        "に です。",
      ],
      explanation: "ふたり = 2 people (NATIVE reading). ふたつ is the generic object counter; に is just the number 2.",
    }),
    build(
      "ja-m5-4-1-build-tomodachi",
      "There are two friends.",
      "ともだちは ふたりです",
      ["ふたり", "ともだち", "は", "です", "ひとり"],
      ["ともだち", "は", "ふたり", "です"],
    ),
    speaking("ja-m5-4-1-speak-tomodachi", "ともだちは ふたりです", "There are two friends."),
    selfExplain({
      id: "ja-m5-4-1-self-futari",
      anchorLabel: "You picked ふたり in: ＿ です (table for two)",
      anchorAudioText: "ふたり です",
      question: "Why is ふたり correct (and ににん wrong)?",
      rule: { text: "1 and 2 people use NATIVE readings (ひとり, ふたり) — not the Sino number + にん pattern." },
      surface: { text: "ににん is a regional dialect form; ふたり is the Tokyo standard." },
      distractor: { text: "ふたり is the question form of に." },
      ruleExplanation:
        "The counter for people swaps to native readings ONLY for 1 and 2 (ひとり, ふたり). From 3 onward the regular Sino + にん pattern kicks in. It's not regional — every speaker uses ふたり for 2 people; ににん is simply ungrammatical.",
    }),
    // ── Review tail ──
    speaking("ja-m5-4-1-rev-speak-1", M5_4_1_REVIEW[0].kana, M5_4_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-4-1-rev-lc-1",
      audioText: M5_4_1_REVIEW[1].kana,
      correctMeaningEn: M5_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_4_1_REVIEW[2].meaningEn,
        M5_4_1_REVIEW[3].meaningEn,
        PRIOR_POOL[6].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-4-1-rev-mcq-2", M5_4_1_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-4-1-rev", M5_4_1_REVIEW),
    infoStep(
      "ja-m5-4-1-info-end",
      "You can now get a table for one or two",
      "The people-counter uses native readings for 1 and 2: ひとり (1 person) and ふたり (2 people) — the first thing every restaurant asks.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_4_1.steps);
assertAnswerRotation(M5_4_1.steps, 2);
assertNoConsecutiveSame(M5_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-4-2 — 人 counter: さんにん / よにん / ごにん (regular pattern)
// ═══════════════════════════════════════════════════════════════════════

const M5_4_2_REVIEW = pickReviewAtoms("ja-m5-4-2-rev", PRIOR_POOL, 4);

export const M5_4_2: LessonContent = {
  id: "ja-m5-4-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Counting people — 3, 4, 5 (regular pattern)",
  description:
    "From 3 onward: number + にん. さんにん, よにん, ごにん — the regular pattern kicks in.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m5-4-2-info-open",
      "The regular pattern: number + にん",
      "From 3 people onward, just add にん to the Sino number. さんにん (3), よにん (4), ごにん (5). The irregulars (ひとり, ふたり) are done — everything else is predictable.",
      "grammar",
    ),
    // ── さんにん — figuroutable: learner knows さん=3 + "3 people" prompt ──
    build(
      "ja-m5-4-2-build-sannin",
      "(A table for) 3 people.",
      "さんにん です",
      ["です", "さんにん", "ふたり", "よにん"],
      ["さんにん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m5-4-2-lc-sannin",
      audioText: "さんにん です",
      correctMeaningEn: "Three people.",
      distractorsEn: ["Two people.", "Four people.", "One person."],
    }),
    // ── よにん — figuroutable: learner knows よん=4 + "4 people" prompt ──
    build(
      "ja-m5-4-2-build-yonin",
      "(A table for) 4 people.",
      "よにん です",
      ["です", "さんにん", "よにん", "ごにん"],
      ["よにん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m5-4-2-lc-yonin",
      audioText: "よにん です",
      correctMeaningEn: "Four people.",
      distractorsEn: ["Three people.", "Five people.", "Two people."],
    }),
    speaking("ja-m5-4-2-speak-sannin", "さんにん です", "(A table for) three."),
    // ── ごにん — figuroutable: learner knows ご=5 + "5 people" prompt ──
    build(
      "ja-m5-4-2-build-gonin",
      "(A table for) 5 people.",
      "ごにん です",
      ["よにん", "です", "ごにん", "さんにん"],
      ["ごにん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m5-4-2-lc-gonin",
      audioText: "ごにん です",
      correctMeaningEn: "Five people.",
      distractorsEn: ["Four people.", "Three people.", "Two people."],
    }),
    // Match pairs — full people-counter set
    {
      id: "ja-m5-4-2-match-people",
      type: "match_pairs",
      prompt: "Match each people-counter to its meaning",
      playAudioOnSelect: true,
      pairs: [
        { id: "p1", source: "ひとり",   target: "1 person", sourceAnnotation: [{ surface: "ひとり",   reading: "ひとり" }] },
        { id: "p2", source: "ふたり",   target: "2 people", sourceAnnotation: [{ surface: "ふたり",   reading: "ふたり" }] },
        { id: "p3", source: "さんにん", target: "3 people", sourceAnnotation: [{ surface: "さんにん", reading: "さんにん" }] },
        { id: "p4", source: "よにん",   target: "4 people", sourceAnnotation: [{ surface: "よにん",   reading: "よにん" }] },
        { id: "p5", source: "ごにん",   target: "5 people", sourceAnnotation: [{ surface: "ごにん",   reading: "ごにん" }] },
        { id: "p6", source: "ふたつ",   target: "2 things", sourceAnnotation: [{ surface: "ふたつ",   reading: "ふたつ" }] },
      ],
    } satisfies MatchPairsStep,
    sentenceMcq({
      id: "ja-m5-4-2-mcq-5people",
      prompt: "Which sentence answers 'How many people?' with FIVE?",
      correctKana: "ごにん です。",
      distractorsKana: [
        "ふたり です。",
        "よにん です。",
        "さんにん です。",
      ],
      explanation: "ごにん = 5 people (Sino ご + にん). Listen for the Sino digit at the front.",
    }),
    build(
      "ja-m5-4-2-build-yonin2",
      "There are four friends.",
      "ともだちは よにんです",
      ["よにん", "ともだち", "は", "です", "ごにん"],
      ["ともだち", "は", "よにん", "です"],
    ),
    speaking("ja-m5-4-2-speak-gonin", "がくせいは ごにんです", "There are five students."),
    listeningBuildSentence({
      id: "ja-m5-4-2-lb-sannin",
      target: "がくせいは さんにんです",
      tiles: ["さんにん", "がくせい", "は", "です", "よにん"],
      correctOrder: ["がくせい", "は", "さんにん", "です"],
      promptEn: "Hear it, build it: 'There are three students.'",
    }),
    sentenceMcq({
      id: "ja-m5-4-2-mcq-4people",
      prompt: "Which word means '4 people'?",
      correctKana: "よにん",
      distractorsKana: ["さんにん", "ごにん", "よん"],
      explanation: "よにん = 4 people. よん is just the number 4 (no counter attached).",
    }),
    // ── Review tail ──
    speaking("ja-m5-4-2-rev-speak-1", M5_4_2_REVIEW[0].kana, M5_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-4-2-rev-lc-1",
      audioText: M5_4_2_REVIEW[1].kana,
      correctMeaningEn: M5_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_4_2_REVIEW[2].meaningEn,
        M5_4_2_REVIEW[3].meaningEn,
        PRIOR_POOL[7].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-4-2-rev-mcq-2", M5_4_2_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-4-2-rev", M5_4_2_REVIEW),
    infoStep(
      "ja-m5-4-2-info-end",
      "You can now request a table for up to five people",
      "The regular pattern kicks in from 3: さんにん, よにん, ごにん. Number + にん for any group size.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_4_2.steps);
assertAnswerRotation(M5_4_2.steps, 2);
assertNoConsecutiveSame(M5_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-5-1 — Cafe vocab: おかね / いくら / えん
// ═══════════════════════════════════════════════════════════════════════

const M5_5_1_REVIEW = pickReviewAtoms("ja-m5-5-1-rev", PRIOR_POOL, 4);

export const M5_5_1: LessonContent = {
  id: "ja-m5-5-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Money talk — おかね, いくら, えん",
  description: "Three transaction words that pair with numbers + ください for real orders.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    // ── おかね — figuroutable: "money" prompt, single tile pick ──
    build(
      "ja-m5-5-1-build-okane",
      "Money",
      "おかね",
      ["いくら", "おかね", "えん", "みず"],
      ["おかね"],
    ),
    listeningCompSentence({
      id: "ja-m5-5-1-lc-okane",
      audioText: "おかね",
      correctMeaningEn: "money",
      distractorsEn: ["yen", "how much", "water"],
    }),
    sentenceMcq({
      id: "ja-m5-5-1-mcq-okane",
      prompt: "Which word means 'money'?",
      correctKana: "おかね",
      distractorsKana: ["えん", "いくら", "おちゃ"],
      explanation: "おかね = money (generic). えん = yen (currency unit). いくら = how much.",
    }),
    // ── いくら — figuroutable in sentence: これは ＿ ですか = "How much is this?" ──
    build(
      "ja-m5-5-1-build-ikura",
      "How much is this?",
      "これは いくら ですか",
      ["いくら", "これ", "なん", "は", "です", "か"],
      ["これ", "は", "いくら", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m5-5-1-lc-ikura",
      audioText: "これは いくら ですか",
      correctMeaningEn: "How much is this?",
      distractorsEn: ["What is this?", "Is this expensive?", "Where is this?"],
    }),
    speaking("ja-m5-5-1-speak-ikura", "いくら ですか", "How much is it?"),
    // ── えん — figuroutable: "yen" prompt, single tile pick ──
    build(
      "ja-m5-5-1-build-en",
      "Yen (Japanese currency)",
      "えん",
      ["おかね", "えん", "いくら", "から"],
      ["えん"],
    ),
    listeningCompSentence({
      id: "ja-m5-5-1-lc-en",
      audioText: "えん",
      correctMeaningEn: "yen",
      distractorsEn: ["money", "how much", "from"],
    }),
    // ── Katakana interleave (rollout M5 サ row → ジュース is now fully
    //    base-readable). Order a juice with ください, then price it. ──
    build(
      "ja-m5-5-1-build-juice-kudasai",
      "Juice, please.",
      "ジュース ください",
      ["ジュース", "ください", "コーヒー", "おちゃ"],
      ["ジュース", "ください"],
      ["ジュース"],
    ),
    // Cloze — price question discrimination
    cloze(
      "ja-m5-5-1-cloze-1",
      "あれは ",
      " ですか。",
      "いくら",
      ["いくら", "なん", "どれ", "ください"],
      "How much is that (over there)?",
      "あれは いくら ですか。",
      "いくら is the question word for price. なん asks identity ('what'), どれ asks 'which.'",
    ),
    sentenceMcq({
      id: "ja-m5-5-1-mcq-price",
      prompt: "Which sentence asks 'How much is this?'",
      correctKana: "これは いくら ですか。",
      distractorsKana: [
        "これは なん ですか。",
        "これは どれ ですか。",
        "いくら これは ですか。",
      ],
      explanation: "いくら = how much. Word order: topic は + question word + ですか.",
    }),
    // NOTE: the detached "は" spacing is deliberate — atom-coverage.test.ts
    // strips the long-vowel mark ー when tokenizing, so an attached
    // "ジュースは" would mint a junk "スは" atom. Keep the space.
    listeningBuildSentence({
      id: "ja-m5-5-1-lb-juice-price",
      target: "ジュース は いくら ですか",
      tiles: ["ジュース", "は", "いくら", "です", "か", "おかね"],
      correctOrder: ["ジュース", "は", "いくら", "です", "か"],
      promptEn: "Hear it, build it: 'How much is the juice?'",
      exercisedAtomKanas: ["ジュース"],
    }),
    build(
      "ja-m5-5-1-build-price2",
      "How much is the coffee?",
      "コーヒーは いくら ですか",
      ["は", "コーヒー", "です", "いくら", "おかね", "か"],
      ["コーヒー", "は", "いくら", "です", "か"],
    ),
    build(
      "ja-m5-5-1-build-bag-price",
      "How much is the bag?",
      "かばんは いくら ですか",
      ["いくら", "かばん", "は", "です", "おかね", "か"],
      ["かばん", "は", "いくら", "です", "か"],
    ),
    listeningBuildSentence({
      id: "ja-m5-5-1-lb-ikura",
      target: "いくら ですか",
      tiles: ["か", "いくら", "おかね", "です", "は"],
      correctOrder: ["いくら", "です", "か"],
      promptEn: "Hear it, build it: 'How much is it?'",
    }),
    speaking("ja-m5-5-1-speak-okane", "おかね", "Money."),
    // ── Review tail ──
    speaking("ja-m5-5-1-rev-speak-1", M5_5_1_REVIEW[0].kana, M5_5_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-5-1-rev-lc-1",
      audioText: M5_5_1_REVIEW[1].kana,
      correctMeaningEn: M5_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_5_1_REVIEW[2].meaningEn,
        M5_5_1_REVIEW[3].meaningEn,
        PRIOR_POOL[8].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-5-1-rev-mcq-2", M5_5_1_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-5-1-rev", M5_5_1_REVIEW),
    infoStep(
      "ja-m5-5-1-info-end",
      "You can now ask how much something costs",
      "Three transaction words: おかね (money), いくら (how much), and えん (yen). これは いくら ですか = 'How much is this?'",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_5_1.steps);
assertAnswerRotation(M5_5_1.steps, 2);
assertNoConsecutiveSame(M5_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-5-2 — Drinks vocab: おちゃ + ordering drill
// ═══════════════════════════════════════════════════════════════════════

const M5_5_2_REVIEW = pickReviewAtoms("ja-m5-5-2-rev", PRIOR_POOL, 4);

export const M5_5_2: LessonContent = {
  id: "ja-m5-5-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "おちゃ (green tea) + ordering drill",
  description:
    "One more drink + a drill that combines numbers, counters, and ください into full orders.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    // ── おちゃ — figuroutable: "Green tea, please" where only おちゃ is unknown ──
    build(
      "ja-m5-5-2-build-ocha",
      "Green tea, please.",
      "おちゃ ください",
      ["ください", "コーヒー", "みず", "おちゃ"],
      ["おちゃ", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m5-5-2-lc-ocha",
      audioText: "おちゃ ください",
      correctMeaningEn: "Green tea, please.",
      distractorsEn: ["Water, please.", "Coffee, please.", "How much is the tea?"],
    }),
    sentenceMcq({
      id: "ja-m5-5-2-mcq-ocha",
      prompt: "Which word means 'green tea'?",
      correctKana: "おちゃ",
      distractorsKana: ["みず", "コーヒー", "おかね"],
      explanation: "おちゃ = green tea. Free at most sit-down restaurants — just ask おちゃ ください.",
    }),
    speaking("ja-m5-5-2-speak-ocha", "おちゃ ください", "Green tea, please."),
    // ── Ordering drill combining everything ──
    build(
      "ja-m5-5-2-build-order-2tea",
      "Two green teas, please.",
      "おちゃ ふたつ ください",
      ["ふたつ", "おちゃ", "ください", "みっつ"],
      ["おちゃ", "ふたつ", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m5-5-2-lc-order",
      audioText: "かばん ふたつ ください",
      correctMeaningEn: "Two bags, please.",
      distractorsEn: [
        "Three bags, please.",
        "A bag, please.",
        "How much is the bag?",
      ],
    }),
    cloze(
      "ja-m5-5-2-cloze-1",
      "ほん ふたつ ",
      "。",
      "ください",
      ["ください", "ですか", "は", "の"],
      "Two books, please.",
      "ほん ふたつ ください。",
      "Item + quantity + ください = order. Works for any noun.",
    ),
    build(
      "ja-m5-5-2-build-3pens",
      "Three pens, please.",
      "ペン みっつ ください",
      ["みっつ", "ペン", "ください", "ひとつ"],
      ["ペン", "みっつ", "ください"],
    ),
    speaking("ja-m5-5-2-speak-order", "かばん みっつ ください", "Three bags, please."),
    listeningBuildSentence({
      id: "ja-m5-5-2-lb-order",
      target: "じしょ ふたつ ください",
      tiles: ["ふたつ", "じしょ", "ください", "みっつ"],
      correctOrder: ["じしょ", "ふたつ", "ください"],
      promptEn: "Hear it, build it: 'Two dictionaries, please.'",
    }),
    sentenceMcq({
      id: "ja-m5-5-2-mcq-3waters",
      prompt: "Which sentence orders THREE waters?",
      correctKana: "みず みっつ ください。",
      distractorsKana: [
        "みず ふたつ ください。",
        "みず ひとつ ください。",
        "みっつ みず ください。",
      ],
      explanation: "みっつ = 3 things. Word order: item + quantity + ください.",
    }),
    cloze(
      "ja-m5-5-2-cloze-2",
      "かさ ",
      " ください。",
      "みっつ",
      ["みっつ", "ふたつ", "ひとつ", "さんにん"],
      "Three umbrellas, please.",
      "かさ みっつ ください。",
      "みっつ = 3 things. さんにん counts people, not umbrellas.",
    ),
    build(
      "ja-m5-5-2-build-price",
      "How much is the green tea?",
      "おちゃは いくら ですか",
      ["いくら", "おちゃ", "は", "です", "ください", "か"],
      ["おちゃ", "は", "いくら", "です", "か"],
    ),
    speaking("ja-m5-5-2-speak-price", "おちゃは いくら ですか", "How much is the green tea?"),
    // ── Review tail ──
    speaking("ja-m5-5-2-rev-speak-1", M5_5_2_REVIEW[0].kana, M5_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-5-2-rev-lc-1",
      audioText: M5_5_2_REVIEW[1].kana,
      correctMeaningEn: M5_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_5_2_REVIEW[2].meaningEn,
        M5_5_2_REVIEW[3].meaningEn,
        PRIOR_POOL[9].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-5-2-rev-mcq-2", M5_5_2_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-5-2-rev", M5_5_2_REVIEW),
    infoStep(
      "ja-m5-5-2-info-end",
      "You can now order drinks and ask prices at a cafe",
      "おちゃ (green tea) plus full orders combining item + counter + ください, and price questions with いくら ですか.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_5_2.steps);
assertAnswerRotation(M5_5_2.steps, 2);
assertNoConsecutiveSame(M5_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-STORY — Story comprehension: Ordering for the group
// ═══════════════════════════════════════════════════════════════════════

export const M5_STORY: LessonContent = {
  id: "ja-m5-story",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Ordering for the group",
  description:
    "Listen to friends ordering at a café. Answer questions about what they order and how many.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m5-story-info-open",
      "Story time — Ordering for the group",
      "ゆき and たけし are at a café with friends. Listen as they order drinks and count their group.",
    ),
    dialogueListen({
      id: "ja-m5-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "みず ふたつ ください。" },
        { speaker: "たけし", kana: "わたしは コーヒー ひとつ ください。" },
        { speaker: "ゆき", kana: "コーヒーですか。" },
        { speaker: "たけし", kana: "はい、コーヒーです。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "How many waters does ゆき order?",
          correctText: "Two",
          distractors: ["One", "Three", "None"],
          explanation: "みず ふたつ ください = 'Two waters, please.' ふたつ = 2 things.",
        },
        {
          id: "s1-q2",
          prompt: "What does たけし order?",
          correctText: "One coffee",
          distractors: ["Two waters", "One beer", "Two coffees"],
          explanation: "コーヒー ひとつ ください = 'One coffee, please.'",
        },
      ],
    }),
    build(
      "ja-m5-story-build-order",
      "Order: Two waters, please.",
      "みず ふたつ ください",
      ["ふたつ", "みず", "ください", "ひとつ", "みっつ"],
      ["みず", "ふたつ", "ください"],
    ),
    sentenceMcq({
      id: "ja-m5-story-mcq-coffee",
      prompt: "Which sentence orders one coffee?",
      correctKana: "コーヒー ひとつ ください",
      distractorsKana: [
        "ビール ひとつ ください",
        "みず ひとつ ください",
        "コーヒー みっつ ください",
      ],
      explanation: "コーヒー = coffee. ひとつ = 1 thing. ください = please.",
    }),
    dialogueListen({
      id: "ja-m5-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "ともだちは さんにんです。" },
        { speaker: "たけし", kana: "さんにんですか。コーヒー みっつ ください。" },
        { speaker: "ゆき", kana: "ともだちも がくせいですか。" },
        { speaker: "たけし", kana: "はい、がくせいです。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "How many friends are coming?",
          correctText: "Three",
          distractors: ["Two", "Four", "Five"],
          explanation: "ともだちは さんにんです = 'There are three friends.' さんにん = 3 people.",
        },
        {
          id: "s2-q2",
          prompt: "How many more coffees does たけし order for the friends?",
          correctText: "Three",
          distractors: ["Two", "One", "Four"],
          explanation: "コーヒー みっつ ください = 'Three coffees, please.' みっつ = 3 things.",
        },
      ],
    }),
    cloze(
      "ja-m5-story-cloze-counter",
      "コーヒー ",
      " ください。 (Three coffees, please.)",
      "みっつ",
      ["みっつ", "ふたつ", "さんにん", "さん"],
      "Three coffees, please.",
      "コーヒー みっつ ください。",
      "みっつ = 3 (things). さんにん = 3 (people). さん = the bare number.",
    ),
    build(
      "ja-m5-story-build-sannin",
      "Say: There are three friends.",
      "ともだちは さんにんです",
      ["さんにん", "ともだち", "は", "です", "ふたり", "ひとり"],
      ["ともだち", "は", "さんにん", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m5-story-lb-order",
      target: "コーヒー みっつ ください",
      tiles: ["みっつ", "コーヒー", "ください", "ふたつ", "ビール"],
      correctOrder: ["コーヒー", "みっつ", "ください"],
      promptEn: "Hear it, build it: 'Three coffees, please.'",
    }),
    speaking(
      "ja-m5-story-speak-order",
      "わたしは コーヒー ひとつ ください",
      "I'll have one coffee.",
    ),
    sentenceMcq({
      id: "ja-m5-story-mcq-summary",
      prompt: "In the story, which counter is for people?",
      correctKana: "さんにん",
      distractorsKana: ["みっつ", "さん", "ふたつ"],
      explanation: "さんにん = 3 people (人 counter). みっつ = 3 things (generic counter). さん = 3 (number).",
    }),
    speaking(
      "ja-m5-story-speak-sannin",
      "ともだちは さんにんです",
      "There are three friends.",
    ),
    infoStep(
      "ja-m5-story-info-end",
      "You can now follow a group ordering conversation",
      "You understood counters (ひとつ, ふたつ, みっつ) for things and people counters (さんにん) for people — and placed an order with ください.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M5_STORY.steps);
assertPassiveCardsHaveFollowup(M5_STORY.steps);
assertNoExplanationOnPassive(M5_STORY.steps);
assertExplanationDoesntLeakAnswer(M5_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-6-1 — から (from) grammar rule + basic usage
// ═══════════════════════════════════════════════════════════════════════

const M5_6_1_REVIEW = pickReviewAtoms("ja-m5-6-1-rev", PRIOR_POOL, 4);

const RULE_KARA = grammarRule({
  id: "ja-m5-6-1-rule-kara",
  grammarPointId: "kara-origin",
  title: "から — 'from'",
  rule:
    "から marks origin — where someone or something comes FROM. Pattern: [place / time] から. Used for nationality ('I'm from America'), starting times ('open from 9'), and physical origin. Doesn't conflict with は — they stack: '[topic] は [origin] から です.'",
  examples: [
    {
      ja: "わたしは アメリカから です。",
      romaji: "watashi wa amerika kara desu.",
      en: "I'm from America.",
    },
    {
      ja: "にほんから です。",
      romaji: "nihon kara desu.",
      en: "(I'm) from Japan.",
    },
  ],
  antiPattern: {
    ja: "アメリカ わたし から です。",
    romaji: "amerika watashi kara desu.",
    en: "(broken — から must immediately follow its origin word)",
    why: "から sticks to the place/time it marks. You can't separate them. The topic (は phrase) comes first, then the origin + から, then です.",
  },
  cultureNote:
    "から also means 'because' when it ends a clause (you'll meet that later in this course). For now, just 'from.'",
});

export const M5_6_1: LessonContent = {
  id: "ja-m5-6-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "から (from) — origin marker",
  description: "から marks where someone or something comes from. Stacks with は for topic.",
  estimatedMinutes: 8,
  xpReward: 22,
  steps: [
    RULE_KARA,
    // ── から in context — figuroutable: learner knows わたし, は, アメリカ, です ──
    build(
      "ja-m5-6-1-build-kara1",
      "I'm from America.",
      "わたしは アメリカから です",
      ["から", "わたし", "アメリカ", "は", "にほん", "です"],
      ["わたし", "は", "アメリカ", "から", "です"],
    ),
    listeningCompSentence({
      id: "ja-m5-6-1-lc-kara1",
      audioText: "あなたは アメリカから ですか",
      correctMeaningEn: "Are you from America?",
      distractorsEn: ["Are you American?", "I'm from America.", "Is America big?"],
    }),
    cloze(
      "ja-m5-6-1-cloze-1",
      "がくせいは アメリカ",
      " です。",
      "から",
      ["から", "は", "の", "を"],
      "The student is from America.",
      "がくせいは アメリカ から です。",
      "から marks origin. Stack: topic は + origin から + です.",
    ),
    speaking("ja-m5-6-1-speak-kara", "わたしは にほんから です", "I'm from Japan."),
    // ── にほんから ──
    build(
      "ja-m5-6-1-build-kara2",
      "(I'm) from Japan.",
      "にほんから です",
      ["です", "にほん", "は", "から", "アメリカ"],
      ["にほん", "から", "です"],
    ),
    listeningCompSentence({
      id: "ja-m5-6-1-lc-kara2",
      audioText: "にほんから です",
      correctMeaningEn: "(I'm) from Japan.",
      distractorsEn: ["This is Japan.", "Japan is nice.", "I'm in Japan."],
    }),
    sentenceMcq({
      id: "ja-m5-6-1-mcq-kara",
      prompt: "Which sentence says 'I'm from Japan.'?",
      correctKana: "わたしは にほんから です。",
      distractorsKana: [
        "わたしは にほん です。",
        "わたしは にほんの です。",
        "にほんは わたしから です。",
      ],
      explanation: "から marks origin and immediately follows the place.",
    }),
    // Mixed cloze — rotate to は
    cloze(
      "ja-m5-6-1-cloze-2",
      "せんせい",
      " にほんから です。",
      "は",
      ["は", "が", "の", "から"],
      "The teacher is from Japan.",
      "せんせいは にほんから です。",
      "は marks the topic (the teacher). から marks origin (Japan).",
    ),
    listeningCompSentence({
      id: "ja-m5-6-1-lc-sensei",
      audioText: "せんせいは にほんから です",
      correctMeaningEn: "The teacher is from Japan.",
      distractorsEn: [
        "The teacher speaks Japanese.",
        "The teacher is in Japan.",
        "I'm from Japan.",
      ],
    }),
    build(
      "ja-m5-6-1-build-sensei",
      "The teacher is from America.",
      "せんせいは アメリカから です",
      ["アメリカ", "せんせい", "から", "は", "にほん", "です"],
      ["せんせい", "は", "アメリカ", "から", "です"],
    ),
    speaking("ja-m5-6-1-speak-amerika", "アメリカから です", "(I'm) from America."),
    selfExplain({
      id: "ja-m5-6-1-self-kara",
      anchorLabel: "You picked から in: わたしは アメリカ＿ です",
      anchorAudioText: "わたしは アメリカから です",
      question: "Why is から correct here?",
      rule: { text: "から attaches to a place to mean 'from there.'" },
      surface: { text: "から is required after any noun ending in a vowel sound." },
      distractor: { text: "から is the polite 'please' word." },
      ruleExplanation:
        "から marks origin (place OR time). It doesn't care about the ending sound of the noun — works for cities, schools, the office, opening times. Sentence shape: [topic] は [origin] から です.",
    }),
    // ── Review tail ──
    speaking("ja-m5-6-1-rev-speak-1", M5_6_1_REVIEW[0].kana, M5_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-6-1-rev-lc-1",
      audioText: M5_6_1_REVIEW[1].kana,
      correctMeaningEn: M5_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_6_1_REVIEW[2].meaningEn,
        M5_6_1_REVIEW[3].meaningEn,
        PRIOR_POOL[10].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-6-1-rev-mcq-2", M5_6_1_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-6-1-rev", M5_6_1_REVIEW),
    infoStep(
      "ja-m5-6-1-info-end",
      "You can now say where you're from",
      "The origin marker から: わたしは アメリカから です (I'm from America). Stacks with は for topic + origin in one sentence.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_6_1.steps);
assertAnswerRotation(M5_6_1.steps, 2);
assertNoConsecutiveSame(M5_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-6-2 — から + mixed M3-M5 drill
// ═══════════════════════════════════════════════════════════════════════

const M5_6_2_REVIEW = pickReviewAtoms("ja-m5-6-2-rev", PRIOR_POOL, 4);

export const M5_6_2: LessonContent = {
  id: "ja-m5-6-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill — は / の / から / ください",
  description: "Interleaved cloze + build across all M3-M5 grammar points.",
  estimatedMinutes: 8,
  xpReward: 24,
  steps: [
    // ── Mixed cloze drill rotating across particles ──
    cloze(
      "ja-m5-6-2-cloze-1",
      "それ",
      " いくら ですか。",
      "は",
      ["は", "が", "の", "を"],
      "How much is that (near you)?",
      "それ は いくら ですか。",
      "Topic = that. Question = how much?",
    ),
    listeningCompSentence({
      id: "ja-m5-6-2-lc-price",
      audioText: "コーヒー は いくら ですか",
      correctMeaningEn: "How much is the coffee?",
      distractorsEn: [
        "Is this coffee?",
        "Two coffees, please.",
        "What is this?",
      ],
    }),
    cloze(
      "ja-m5-6-2-cloze-2",
      "あれは わたし",
      " かばん です。",
      "の",
      ["の", "は", "が", "から"],
      "That over there is my bag.",
      "あれは わたし の かばん です。",
      "の = possession (from M4). 'My bag.'",
    ),
    build(
      "ja-m5-6-2-build-bag",
      "That over there is my bag.",
      "あれは わたしの かばん です",
      ["わたし", "あれ", "は", "の", "かばん", "です", "から"],
      ["あれ", "は", "わたし", "の", "かばん", "です"],
    ),
    sentenceMcq({
      id: "ja-m5-6-2-mcq-order",
      prompt: "Which sentence ORDERS two green teas?",
      correctKana: "おちゃ ふたつ ください。",
      distractorsKana: [
        "おちゃは ふたつ です。",
        "おちゃ ふたつ です。",
        "おちゃは ふたつ ですか。",
      ],
      explanation: "An order ends in ください. The others are descriptions or questions.",
    }),
    cloze(
      "ja-m5-6-2-cloze-3",
      "じしょ ひとつ ",
      "。",
      "ください",
      ["ください", "ですか", "は", "の"],
      "One dictionary, please.",
      "じしょ ひとつ ください。",
      "Item + quantity + ください = order.",
    ),
    listeningCompSentence({
      id: "ja-m5-6-2-lc-from",
      audioText: "ともだちは アメリカから です",
      correctMeaningEn: "My friend is from America.",
      distractorsEn: [
        "My friend is American.",
        "America is my friend.",
        "I'm from America.",
      ],
    }),
    cloze(
      "ja-m5-6-2-cloze-4",
      "ともだちは アメリカ",
      " です。",
      "から",
      ["から", "は", "の", "が"],
      "My friend is from America.",
      "ともだちは アメリカ から です。",
      "から marks origin.",
    ),
    build(
      "ja-m5-6-2-build-from",
      "My friend is from Japan.",
      "ともだちは にほんから です",
      ["にほん", "ともだち", "から", "は", "です", "アメリカ"],
      ["ともだち", "は", "にほん", "から", "です"],
    ),
    speaking("ja-m5-6-2-speak-from", "ともだちは にほんから です", "My friend is from Japan."),
    sentenceMcq({
      id: "ja-m5-6-2-mcq-which-from",
      prompt: "Which sentence says 'The student is from Japan'?",
      correctKana: "がくせいは にほんから です。",
      distractorsKana: [
        "がくせいは にほん です。",
        "にほんは がくせいから です。",
        "がくせい にほんから です。",
      ],
      explanation: "Topic は + place + から + です.",
    }),
    listeningBuildSentence({
      id: "ja-m5-6-2-lb-order",
      target: "おちゃ ひとつ ください",
      tiles: ["ひとつ", "おちゃ", "ください", "ふたつ"],
      correctOrder: ["おちゃ", "ひとつ", "ください"],
      promptEn: "Hear it, build it: 'One green tea, please.'",
    }),
    build(
      "ja-m5-6-2-build-order",
      "One bag, please.",
      "かばん ひとつ ください",
      ["ひとつ", "かばん", "ください", "かさ"],
      ["かばん", "ひとつ", "ください"],
    ),
    speaking("ja-m5-6-2-speak-order", "ペン ふたつ ください", "Two pens, please."),
    // ── Review tail ──
    speaking("ja-m5-6-2-rev-speak-1", M5_6_2_REVIEW[0].kana, M5_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-6-2-rev-lc-1",
      audioText: M5_6_2_REVIEW[1].kana,
      correctMeaningEn: M5_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_6_2_REVIEW[2].meaningEn,
        M5_6_2_REVIEW[3].meaningEn,
        PRIOR_POOL[11].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-6-2-rev-mcq-2", M5_6_2_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-6-2-rev", M5_6_2_REVIEW),
    infoStep(
      "ja-m5-6-2-info-end",
      "You can now sort は, の, から, and ください under pressure",
      "Mixed cloze + build across all M3-M5 particles: topic は, possession の, origin から, and request ください in rotating drills.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_6_2.steps);
assertAnswerRotation(M5_6_2.steps, 2);
assertNoConsecutiveSame(M5_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-7-1 — Production: sentence build at the cafe
// ═══════════════════════════════════════════════════════════════════════

const M5_7_1_REVIEW = pickReviewAtoms("ja-m5-7-1-rev", PRIOR_POOL, 4);

export const M5_7_1: LessonContent = {
  id: "ja-m5-7-1",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence build — cafe production",
  description: "Five transactional sentences across build, listening_build, and speaking.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    build(
      "ja-m5-7-1-build-s1",
      "An umbrella, please.",
      "かさ ください",
      ["ください", "かさ", "おちゃ", "かばん"],
      ["かさ", "ください"],
    ),
    speaking("ja-m5-7-1-speak-s1", "かさ ください", "An umbrella, please."),
    build(
      "ja-m5-7-1-build-s2",
      "Two beers, please.",
      "ビール ふたつ ください",
      ["ふたつ", "ビール", "ください", "みっつ"],
      ["ビール", "ふたつ", "ください"],
    ),
    speaking("ja-m5-7-1-speak-s2", "じしょ ふたつ ください", "Two dictionaries, please."),
    listeningCompSentence({
      id: "ja-m5-7-1-lc-mittsu",
      audioText: "おちゃ みっつ ください",
      correctMeaningEn: "Three green teas, please.",
      distractorsEn: [
        "Three coffees, please.",
        "Green tea, please.",
        "How much is the green tea?",
      ],
    }),
    build(
      "ja-m5-7-1-build-s3",
      "How much is that (over there)?",
      "あれは いくら ですか",
      ["いくら", "あれ", "は", "です", "なん", "か"],
      ["あれ", "は", "いくら", "です", "か"],
    ),
    speaking("ja-m5-7-1-speak-price", "あれは いくら ですか", "How much is that over there?"),
    listeningBuildSentence({
      id: "ja-m5-7-1-lb-4friends",
      target: "ともだちは よにんです",
      tiles: ["よにん", "ともだち", "は", "です", "さんにん"],
      correctOrder: ["ともだち", "は", "よにん", "です"],
      promptEn: "Hear it, build it: 'There are four friends.'",
    }),
    build(
      "ja-m5-7-1-build-from",
      "The student is from America.",
      "がくせいは アメリカから です",
      ["アメリカ", "がくせい", "から", "は", "です", "にほん"],
      ["がくせい", "は", "アメリカ", "から", "です"],
    ),
    speaking("ja-m5-7-1-speak-from", "がくせいは アメリカから です", "The student is from America."),
    sentenceMcq({
      id: "ja-m5-7-1-mcq-recall",
      prompt: "Which sentence orders 'Three beers, please.'?",
      correctKana: "ビール みっつ ください。",
      distractorsKana: [
        "ビール さん ください。",
        "ビール ふたつ ください。",
        "みっつ ビール ください。",
      ],
      explanation: "みっつ = 3 things (native counter). Word order: item + quantity + ください.",
    }),
    listeningCompSentence({
      id: "ja-m5-7-1-lc-dictionary",
      audioText: "じしょ は いくら ですか",
      correctMeaningEn: "How much is the dictionary?",
      distractorsEn: [
        "Is this a dictionary?",
        "How much is the book?",
        "Is the dictionary here?",
      ],
    }),
    build(
      "ja-m5-7-1-build-2friends",
      "There are two friends.",
      "ともだちは ふたりです",
      ["ふたり", "ともだち", "は", "です", "ひとり"],
      ["ともだち", "は", "ふたり", "です"],
    ),
    speaking("ja-m5-7-1-speak-yonin", "よにん です", "(A table for) four."),
    selfExplain({
      id: "ja-m5-7-1-self-mittsu",
      anchorLabel: "You heard みっつ in: おちゃ ＿ ください (three green teas)",
      anchorAudioText: "おちゃ みっつ ください",
      question: "Why is みっつ correct (and Sino さん wrong)?",
      rule: { text: "Generic-object orders use the NATIVE counter family (ひとつ ふたつ みっつ) — not Sino いち に さん." },
      surface: { text: "みっつ is required when the item starts with a consonant sound." },
      distractor: { text: "Sino numbers can only follow ください, not precede it." },
      ruleExplanation:
        "ひとつ / ふたつ / みっつ are the native counter forms for unspecified-shape objects (coffees, dishes, items). Sino いち / に / さん are for math, money, and counters with explicit kanji (さんにん for people). Item-order is always item + quantity + ください.",
    }),
    // ── Review tail ──
    speaking("ja-m5-7-1-rev-speak-1", M5_7_1_REVIEW[0].kana, M5_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-7-1-rev-lc-1",
      audioText: M5_7_1_REVIEW[1].kana,
      correctMeaningEn: M5_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_7_1_REVIEW[2].meaningEn,
        M5_7_1_REVIEW[3].meaningEn,
        PRIOR_POOL[12].meaningEn,
      ],
    }),
    vocabMcq("ja-m5-7-1-rev-mcq-2", M5_7_1_REVIEW[2], PRIOR_POOL),
    reviewMatchPairs("ja-m5-7-1-rev", M5_7_1_REVIEW),
    infoStep(
      "ja-m5-7-1-info-end",
      "You can now handle a full cafe transaction",
      "Five transactional sentences produced from scratch: ordering drinks, asking prices, counting people, and stating your origin.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_7_1.steps);
assertAnswerRotation(M5_7_1.steps, 2);
assertNoConsecutiveSame(M5_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M5-7-2 — Mini-dialogue: ordering at a cafe
// ═══════════════════════════════════════════════════════════════════════

const M5_7_2_REVIEW = pickReviewAtoms("ja-m5-7-2-rev", PRIOR_POOL, 5);

export const M5_7_2: LessonContent = {
  id: "ja-m5-7-2",
  moduleId: "m5",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue — ordering at a cafe",
  description:
    "A 3-turn cafe exchange delivered audio-only, then comprehension questions probe what was ordered and how many.",
  estimatedMinutes: 9,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m5-7-2-info-open",
      "Drop into the scene",
      "You walk into a Tokyo cafe with a friend. They order, you ask the price. Every word + grammar piece is from M3-M5. The dialogue plays audio-only — listen first, then answer comprehension questions.",
      "culture",
    ),
    // Warm-up listening
    listeningCompSentence({
      id: "ja-m5-7-2-lc-warmup",
      audioText: "いくら ですか",
      correctMeaningEn: "How much is it?",
      distractorsEn: ["What is this?", "Where is it?", "Who is it?"],
    }),
    // ── THE DIALOGUE ──
    dialogueListen({
      id: "ja-m5-7-2-dialogue",
      lines: [
        { speaker: "Staff", kana: "いらっしゃいませ。" },
        { speaker: "Friend", kana: "コーヒー ふたつ ください。" },
        {
          speaker: "Staff",
          kana: "はい、コーヒー ふたつ ですね。",
          audioText: "はい コーヒー ふたつ ですね",
        },
        {
          speaker: "Friend",
          kana: "はい。ありがとうございます。",
          audioText: "はい ありがとうございます",
        },
      ],
      questions: [
        {
          id: "ja-m5-7-2-q-what",
          prompt: "What did the friend order?",
          correctText: "Coffee",
          distractors: ["Green tea", "Water", "Beer"],
          explanation: "コーヒー = coffee. The friend orders 'コーヒー ふたつ ください.'",
        },
        {
          id: "ja-m5-7-2-q-how-many",
          prompt: "How many did the friend order?",
          correctText: "Two",
          distractors: ["One", "Three", "Four"],
          explanation: "ふたつ = 2 (generic counter). Item + quantity + ください.",
        },
      ],
    }),
    // Post-dialogue comprehension — the staff's confirmation echo
    listeningCompSentence({
      id: "ja-m5-7-2-lc-dialogue",
      audioText: "はい コーヒー ふたつ ですね",
      correctMeaningEn: "Sure — two coffees, right?",
      distractorsEn: [
        "Sure — two teas, right?",
        "Sorry, we have no coffee.",
        "Here are three coffees.",
      ],
    }),
    // Cumulative grammar check
    cloze(
      "ja-m5-7-2-cloze-1",
      "おちゃ ひとつ ",
      "。",
      "ください",
      ["ください", "ですか", "は", "の"],
      "One green tea, please.",
      "おちゃ ひとつ ください。",
      "Item + quantity + ください — the canonical order shape.",
    ),
    sentenceMcq({
      id: "ja-m5-7-2-mcq-from",
      prompt: "Which sentence says 'I'm from Japan.'?",
      correctKana: "わたしは にほんから です。",
      distractorsKana: [
        "わたしは にほん です。",
        "わたしは にほんの です。",
        "にほんは わたしから です。",
      ],
      explanation: "から marks origin and immediately follows the place.",
    }),
    cloze(
      "ja-m5-7-2-cloze-2",
      "ともだちは アメリカ",
      " です。",
      "から",
      ["から", "は", "の", "が"],
      "My friend is from America.",
      "ともだちは アメリカから です。",
      "から marks origin; the topic ともだち already carries は.",
    ),
    // Production
    build(
      "ja-m5-7-2-build-final",
      "How much is the beer?",
      "ビールは いくら ですか",
      ["いくら", "ビール", "は", "です", "おかね", "か"],
      ["ビール", "は", "いくら", "です", "か"],
    ),
    speaking("ja-m5-7-2-speak-order", "ペン みっつ ください", "Three pens, please."),
    build(
      "ja-m5-7-2-build-order",
      "Three books, please.",
      "ほん みっつ ください",
      ["みっつ", "ほん", "ください", "ふたつ"],
      ["ほん", "みっつ", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m5-7-2-lb-sannin",
      target: "がくせいは さんにんです",
      tiles: ["さんにん", "がくせい", "は", "です", "ふたり"],
      correctOrder: ["がくせい", "は", "さんにん", "です"],
      promptEn: "Hear it, build it: 'There are three students.'",
    }),
    sentenceMcq({
      id: "ja-m5-7-2-mcq-counter",
      prompt: "Which counter form orders THREE green teas?",
      correctKana: "おちゃ みっつ ください。",
      distractorsKana: [
        "おちゃ ふたつ ください。",
        "おちゃ さんにん ください。",
        "おちゃ さん ください。",
      ],
      explanation: "みっつ = 3 generic things. さんにん is 3 people (wrong counter for tea); さん is for math.",
    }),
    selfExplain({
      id: "ja-m5-7-2-self-order",
      anchorLabel: "Dialogue line: コーヒー ふたつ ください",
      anchorAudioText: "コーヒー ふたつ ください",
      question: "Why is ふたつ in the MIDDLE (not the end)?",
      rule: { text: "Japanese order shape is fixed: item + quantity + ください." },
      surface: { text: "ふたつ goes in the middle because it has two mora." },
      distractor: { text: "ふたつ is the topic marker for the order." },
      ruleExplanation:
        "Every order follows item + quantity + ください. Quantity slots between the item and ください, not at the end. Mora count is irrelevant; ふたつ is a counter, not a topic marker.",
    }),
    // ── Review tail ──
    speaking("ja-m5-7-2-rev-speak-1", M5_7_2_REVIEW[0].kana, M5_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m5-7-2-rev-lc-1",
      audioText: M5_7_2_REVIEW[1].kana,
      correctMeaningEn: M5_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M5_7_2_REVIEW[2].meaningEn,
        M5_7_2_REVIEW[3].meaningEn,
        M5_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq(
      "ja-m5-7-2-rev-mcq-2",
      M5_7_2_REVIEW.filter((a) => Boolean(a.emoji))[1]!,
      PRIOR_POOL,
    ),
    reviewMatchPairs("ja-m5-7-2-rev", M5_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m5-7-2-info-end",
      "You can now order for a group at a Tokyo cafe",
      "A full cafe dialogue: listening comprehension, ordering with counters, asking prices, and explaining the item + quantity + ください pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M5_7_2.steps);
assertAnswerRotation(M5_7_2.steps, 2);
assertNoConsecutiveSame(M5_7_2.steps);

// ---------------------------------------------------------------------------
// Passive-card lint (2026-05-22) — see _stepAssertions.ts for rules.
// ---------------------------------------------------------------------------
for (const lesson of [M5_1_1, M5_1_2, M5_2_1, M5_2_2, M5_3_1, M5_3_2, M5_4_1, M5_4_2, M5_5_1, M5_5_2, M5_STORY, M5_6_1, M5_6_2, M5_7_1, M5_7_2]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
