import type { LessonContent } from "../types";
import {
  type RowContext,
  symbolIntro,
  traceTwice,
  recognition,
  symbolToSound,
  wordImageMcq,
  listeningBuild,
  speaking,
  translateMcq,
  matchKanaToRomaji,
  pickReviewWords,
} from "./_consonantRowHelpers";

/**
 * M2 yōon voiced: ぎゃ じゃ びゃ ぴゃ families — 12 kana total. 3 hand-
 * authored sub-lessons + auto row-test. Mirrors g-row template.
 *
 * 12 chars is too many for per-char intros. Strategy:
 *   Sub-1: j-family (じゃ じゅ じょ) — highest utility. Anchor じゅう (ten).
 *   Sub-2: g/b/p families — wide recognition + s2s sweep, no new anchor.
 *   Sub-3: cumulative review + M1 cross-module sprinkle.
 * Row test still quizzes all 12 (chart-completeness).
 */

// Sub-1 context — j-family chars + a few cousins as foils.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "じゃ", romaji: "ja" },
    { symbol: "じゅ", romaji: "ju" },
    { symbol: "じょ", romaji: "jo" },
    // Cousin foils (from voiced + ち families).
    { symbol: "ぎゃ", romaji: "gya" },
    { symbol: "びゃ", romaji: "bya" },
    { symbol: "じ", romaji: "ji" },
    { symbol: "ちゃ", romaji: "cha" },
  ],
  words: [
    { kana: "じゅう", meaningEn: "ten", emoji: "🔟" },
  ],
  tileBankPool: ["じゃ", "じゅ", "じょ", "ぎゃ", "ぎゅ", "ぎょ", "あ", "い", "う", "え", "お"],
};

// Sub-2 context — all 12 voiced yōon for the wide sweep.
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "ぎゃ", romaji: "gya" },
    { symbol: "ぎゅ", romaji: "gyu" },
    { symbol: "ぎょ", romaji: "gyo" },
    { symbol: "じゃ", romaji: "ja" },
    { symbol: "じゅ", romaji: "ju" },
    { symbol: "じょ", romaji: "jo" },
    { symbol: "びゃ", romaji: "bya" },
    { symbol: "びゅ", romaji: "byu" },
    { symbol: "びょ", romaji: "byo" },
    { symbol: "ぴゃ", romaji: "pya" },
    { symbol: "ぴゅ", romaji: "pyu" },
    { symbol: "ぴょ", romaji: "pyo" },
  ],
  words: [
    { kana: "じゅう", meaningEn: "ten", emoji: "🔟" },
  ],
  tileBankPool: ["じゃ", "じゅ", "じょ", "ぎゃ", "ぎゅ", "ぎょ", "びゃ", "びゅ", "びょ", "ぴゃ", "ぴゅ", "ぴょ", "う"],
};

const REVIEW_WORDS = pickReviewWords("ja-m1-yoon-voiced-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

// Yoon-voiced only has 1 anchor word (じゅう); pad with 3 M1 carryovers
// so translateMcq's 4-option grid always fills.
const Y_WORD_POOL = [
  ...ctxSub2.words.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
  { kana: REVIEW_WORDS[0].kana, meaningEn: REVIEW_WORDS[0].meaningEn },
  { kana: REVIEW_WORDS[1].kana, meaningEn: REVIEW_WORDS[1].meaningEn },
  { kana: REVIEW_WORDS[2].kana, meaningEn: REVIEW_WORDS[2].meaningEn },
];

const SUB3_TRANSLATE_POOL = [
  ...Y_WORD_POOL,
  ...REVIEW_WORDS.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
];

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 1 — Intro (j-family じゃ じゅ じょ)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_VOICED_1: LessonContent = {
  id: "ja-m1-yoon-voiced-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon voiced — Intro",
  description: "Same rule on voiced consonants. Worked example with the j-family.",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["juu"],
  steps: [
    {
      id: "ja-yv1-info-open",
      type: "info",
      title: "Voiced yōon",
      body:
        "Same small-ゃゅょ rule, voiced consonants. じ + ゃ = じゃ ('ja') — same 'j' as じ ('ji'), not 'zy'. ぎ・び・ぴ each pair the same way.",
      variant: "culture",
    },

    // ─── Char 1: じゃ (ja) — trace slot (no individual anchor word).
    symbolIntro(
      "ja-yv1-intro-ja",
      "じゃ",
      "ja",
      "dʒa",
      "ji + small ya — 'ja'",
      "Pronounced 'ja' — like 'jar' said quickly.",
    ),
    traceTwice("ja-yv1-trace-ja", "じゃ", "ja", "Write じ, then add a SMALL や next to it."),

    // ─── Char 2: じゅ (ju) → じゅう (ten) ───
    symbolIntro(
      "ja-yv1-intro-ju",
      "じゅ",
      "ju",
      "dʒɯ",
      "ji + small yu — 'ju'",
      "じゅう (juu) = ten",
    ),
    wordImageMcq(ctxSub1, "ja-yv1-mcq-juu", "じゅう"),
    speaking("ja-yv1-speak-juu", "じゅう", "ten"),

    // ─── Char 3: じょ (jo) ───
    symbolIntro(
      "ja-yv1-intro-jo",
      "じょ",
      "jo",
      "dʒo",
      "ji + small yo — 'jo'",
      "Same sh→j logic as じ → 'ji'.",
    ),
    recognition(ctxSub1, "ja-yv1-recog-jo", "じょ", "jo", "ji + small yo"),

    // ─── Consolidation tail (R3 interleave) ───
    symbolToSound(ctxSub1, "ja-yv1-s2s-ja", "じゃ", "ja", "ji + small ya"),
    recognition(ctxSub1, "ja-yv1-recog-ju", "じゅ", "ju", "ji + small yu"),
    symbolToSound(ctxSub1, "ja-yv1-s2s-jo", "じょ", "jo", "ji + small yo"),
    listeningBuild(ctxSub1, "ja-yv1-build-juu", "じゅう", "ten"),
    symbolToSound(ctxSub1, "ja-yv1-s2s-ju", "じゅ", "ju", "ji + small yu"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (g/b/p families — wide sweep)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_VOICED_2: LessonContent = {
  id: "ja-m1-yoon-voiced-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon voiced — Practice",
  description: "The other voiced yōon: ぎ + び + ぴ families. Recognition sweep across all 12.",
  estimatedMinutes: 6,
  xpReward: 16,
  steps: [
    {
      id: "ja-yv2-info-open",
      type: "info",
      title: "g + b + p yōon — wide sweep",
      body:
        "Same rule across the remaining voiced consonants. We'll meet 9 more — ぎゃぎゅぎょ, びゃびゅびょ, ぴゃぴゅぴょ — via recognition. They follow the j-family pattern exactly.",
      variant: "tip",
    },

    // Brief intro flagged for each new family.
    symbolIntro(
      "ja-yv2-intro-gya",
      "ぎゃ",
      "gya",
      "gja",
      "gi + small ya — 'gya'",
      "Voiced ki-yōon.",
    ),
    symbolIntro(
      "ja-yv2-intro-bya",
      "びゃ",
      "bya",
      "bja",
      "bi + small ya — 'bya'",
      "Voiced hi-yōon.",
    ),
    symbolIntro(
      "ja-yv2-intro-pya",
      "ぴゃ",
      "pya",
      "pja",
      "pi + small ya — 'pya'",
      "Handakuten hi-yōon.",
    ),

    // Recognition sweep — 1 per family across the small-vowel slots.
    recognition(ctxSub2, "ja-yv2-recog-gyu", "ぎゅ", "gyu", "gi + small yu"),
    recognition(ctxSub2, "ja-yv2-recog-gyo", "ぎょ", "gyo", "gi + small yo"),
    recognition(ctxSub2, "ja-yv2-recog-byo", "びょ", "byo", "bi + small yo"),
    recognition(ctxSub2, "ja-yv2-recog-pyo", "ぴょ", "pyo", "pi + small yo"),

    // s2s sweep across the wider set.
    symbolToSound(ctxSub2, "ja-yv2-s2s-gya", "ぎゃ", "gya", "gi + small ya"),
    symbolToSound(ctxSub2, "ja-yv2-s2s-byu", "びゅ", "byu", "bi + small yu"),
    symbolToSound(ctxSub2, "ja-yv2-s2s-pyu", "ぴゅ", "pyu", "pi + small yu"),

    // Anchor recall + j-family redo woven through.
    wordImageMcq(ctxSub2, "ja-yv2-mcq-juu-redo", "じゅう"),
    listeningBuild(ctxSub2, "ja-yv2-build-juu", "じゅう", "ten"),
    speaking("ja-yv2-speak-juu", "じゅう", "ten"),

    matchKanaToRomaji("ja-yv2-match-sweep", [
      { symbol: "じゃ", romaji: "ja" },
      { symbol: "ぎゃ", romaji: "gya" },
      { symbol: "びゃ", romaji: "bya" },
      { symbol: "ぴゃ", romaji: "pya" },
    ]),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_VOICED_3: LessonContent = {
  id: "ja-m1-yoon-voiced-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon voiced — Review",
  description: "Cumulative practice across all 12 voiced yōon + a spaced-review tap from M1.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    {
      id: "ja-yv3-info-open",
      type: "info",
      title: "Putting it together",
      body:
        "Quick review of the voiced yōon plus earlier-row words. One more yōon sweep left — the rare n/h/m/r families.",
      variant: "default",
    },

    wordImageMcq(ctxSub3, "ja-yv3-mcq-juu", "じゅう"),
    symbolToSound(ctxSub3, "ja-yv3-s2s-ja", "じゃ", "ja", "ji + small ya"),
    symbolToSound(ctxSub3, "ja-yv3-s2s-gya", "ぎゃ", "gya", "gi + small ya"),

    wordImageMcq(ctxSub3, "ja-yv3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-yv3-mcq-review-2", REVIEW_WORDS[1].kana),

    recognition(ctxSub3, "ja-yv3-recog-byo", "びょ", "byo", "bi + small yo"),
    translateMcq("ja-yv3-translate-juu", "ten", "じゅう", Y_WORD_POOL),
    speaking("ja-yv3-speak-juu", "じゅう", "ten"),
    recognition(ctxSub3, "ja-yv3-recog-pyo", "ぴょ", "pyo", "pi + small yo"),
    translateMcq(
      "ja-yv3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    translateMcq(
      "ja-yv3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    matchKanaToRomaji("ja-yv3-match-final", [
      { symbol: "ぎゃ", romaji: "gya" },
      { symbol: "じゃ", romaji: "ja" },
      { symbol: "じゅ", romaji: "ju" },
      { symbol: "じょ", romaji: "jo" },
      { symbol: "びゃ", romaji: "bya" },
      { symbol: "ぴゃ", romaji: "pya" },
    ]),
  ],
};
