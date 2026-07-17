import type { LessonContent } from "@/features/lesson/types";
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
  listeningComp,
  pickReviewWords,
} from "@/features/languages/ja/curriculum/_consonantRowHelpers";

/**
 * M2 yōon sh + ch families: しゃ しゅ しょ + ちゃ ちゅ ちょ. 3 hand-
 * authored sub-lessons + auto row-test. Mirrors g-row template.
 *
 * Sub-1: sh-family (しゃ しゅ しょ). Anchor: しゃしん (photo 📷).
 * Sub-2: ch-family (ちゃ ちゅ ちょ) + consolidation. Anchor: おちゃ (tea 🍵).
 * Sub-3: cumulative review + M1 cross-module sprinkle.
 *
 * Quirk: し→しゃ is 'sha' (not 'sya'), same as し→'shi'. Same logic for ch.
 */

// Sub-1 context — sh chars + sub-2 ch chars + parent si/chi foils.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "しゃ", romaji: "sha" },
    { symbol: "しゅ", romaji: "shu" },
    { symbol: "しょ", romaji: "sho" },
    { symbol: "ちゃ", romaji: "cha" },
    { symbol: "ちゅ", romaji: "chu" },
    { symbol: "ちょ", romaji: "cho" },
    // Parent foils.
    { symbol: "し", romaji: "shi" },
    { symbol: "ち", romaji: "chi" },
  ],
  words: [
    { kana: "しゃしん", meaningEn: "photo", emoji: "📸" },
  ],
  tileBankPool: ["しゃ", "しゅ", "しょ", "ちゃ", "ちゅ", "ちょ", "あ", "い", "う", "え", "お", "ん"],
};

// Sub-2 context — all 6 yōon chars + 2 anchor words.
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "しゃ", romaji: "sha" },
    { symbol: "しゅ", romaji: "shu" },
    { symbol: "しょ", romaji: "sho" },
    { symbol: "ちゃ", romaji: "cha" },
    { symbol: "ちゅ", romaji: "chu" },
    { symbol: "ちょ", romaji: "cho" },
  ],
  words: [
    { kana: "しゃしん", meaningEn: "photo", emoji: "📸" },
    { kana: "おちゃ", meaningEn: "tea", emoji: "🍵" },
  ],
  tileBankPool: ["しゃ", "しゅ", "しょ", "ちゃ", "ちゅ", "ちょ", "あ", "い", "う", "え", "お", "ん"],
};

const REVIEW_WORDS = pickReviewWords("ja-m1-yoon-sh-ch-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

// Yoon-sh-ch only has 2 anchor words; pad with 2 M1 carryovers so
// translateMcq's 4-option grid always fills.
const Y_WORD_POOL = [
  ...ctxSub2.words.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
  { kana: REVIEW_WORDS[0].kana, meaningEn: REVIEW_WORDS[0].meaningEn },
  { kana: REVIEW_WORDS[1].kana, meaningEn: REVIEW_WORDS[1].meaningEn },
];

const SUB3_TRANSLATE_POOL = [
  ...Y_WORD_POOL,
  ...REVIEW_WORDS.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
];

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 1 — Intro (sh-family しゃ しゅ しょ)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_SH_CH_1: LessonContent = {
  id: "ja-m1-yoon-sh-ch-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon sh + ch — Intro",
  description: "Same small-ゃゅょ rule on し and ち. し→しゃ is 'sha' (not 'sya').",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["shashin"],
  steps: [
    {
      id: "ja-ysc1-info-open",
      type: "grammar_rule",
      title: "sh + ch yōon",
      rule:
        "Same small-ゃゅょ rule, two new families. The 'sh' of し and 'ch' of ち carry over into the blend — し + ゃ = しゃ is 'sha', not 'sya'.",
      examples: [
        { ja: "し + ゃ = しゃ", romaji: "shi + ya = sha", en: "'sha', not 'sya'" },
        { ja: "ち + ゃ = ちゃ", romaji: "chi + ya = cha", en: "'cha', not 'tya'" },
      ],
    },

    // ─── Char 1: しゃ (sha) — no individual anchor; trace slot.
    symbolIntro(
      "ja-ysc1-intro-sha",
      "しゃ",
      "sha",
      "ʃa",
      "shi + small ya — 'sha'",
      "しゃしん (shashin) = photo",
    ),
    traceTwice("ja-ysc1-trace-sha", "しゃ", "sha", "Write し, then add a SMALL や next to it."),

    // ─── Char 2: しゅ (shu) — also drill via recognition + s2s.
    symbolIntro(
      "ja-ysc1-intro-shu",
      "しゅ",
      "shu",
      "ʃɯ",
      "shi + small yu — 'shu'",
      "One syllable.",
    ),
    recognition(ctxSub1, "ja-ysc1-recog-shu", "しゅ", "shu", "shi + small yu"),

    // ─── Char 3: しょ (sho) → shashin builds here (uses しゃ + しん).
    symbolIntro(
      "ja-ysc1-intro-sho",
      "しょ",
      "sho",
      "ʃo",
      "shi + small yo — 'sho'",
      "One syllable.",
    ),
    wordImageMcq(ctxSub1, "ja-ysc1-mcq-shashin", "しゃしん"),
    speaking("ja-ysc1-speak-shashin", "しゃしん", "photo"),

    // ─── Consolidation tail (R3 interleave) ───
    symbolToSound(ctxSub1, "ja-ysc1-s2s-sha", "しゃ", "sha", "shi + small ya"),
    recognition(ctxSub1, "ja-ysc1-recog-sho", "しょ", "sho", "shi + small yo"),
    symbolToSound(ctxSub1, "ja-ysc1-s2s-shu", "しゅ", "shu", "shi + small yu"),
    listeningBuild(ctxSub1, "ja-ysc1-build-shashin", "しゃしん", "photo"),
    symbolToSound(ctxSub1, "ja-ysc1-s2s-sho", "しょ", "sho", "shi + small yo"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (ch-family ちゃ ちゅ ちょ + consolidation)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_SH_CH_2: LessonContent = {
  id: "ja-m1-yoon-sh-ch-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon sh + ch — Practice",
  description: "Meet ちゃ ちゅ ちょ, then practice all 6 sh + ch yōon together.",
  estimatedMinutes: 7,
  xpReward: 18,
  introducesVocabIds: ["ocha"],
  steps: [
    symbolIntro(
      "ja-ysc2-intro-cha",
      "ちゃ",
      "cha",
      "tʃa",
      "chi + small ya — 'cha'",
      "おちゃ (ocha) = tea",
    ),
    symbolIntro(
      "ja-ysc2-intro-chu",
      "ちゅ",
      "chu",
      "tʃɯ",
      "chi + small yu — 'chu'",
      "One syllable.",
    ),
    symbolIntro(
      "ja-ysc2-intro-cho",
      "ちょ",
      "cho",
      "tʃo",
      "chi + small yo — 'cho'",
      "One syllable.",
    ),
    wordImageMcq(ctxSub2, "ja-ysc2-mcq-ocha", "おちゃ"),

    symbolToSound(ctxSub2, "ja-ysc2-s2s-cha", "ちゃ", "cha", "chi + small ya"),
    wordImageMcq(ctxSub2, "ja-ysc2-mcq-shashin-redo", "しゃしん"),

    translateMcq("ja-ysc2-translate-ocha", "tea", "おちゃ", Y_WORD_POOL),
    matchKanaToRomaji("ja-ysc2-match-all", [
      { symbol: "しゃ", romaji: "sha" },
      { symbol: "しゅ", romaji: "shu" },
      { symbol: "しょ", romaji: "sho" },
      { symbol: "ちゃ", romaji: "cha" },
      { symbol: "ちゅ", romaji: "chu" },
      { symbol: "ちょ", romaji: "cho" },
    ]),
    translateMcq("ja-ysc2-translate-shashin", "photo", "しゃしん", Y_WORD_POOL),

    listeningBuild(ctxSub2, "ja-ysc2-build-ocha", "おちゃ", "tea"),

    listeningComp("ja-ysc2-lc-ocha", "おちゃ", "ocha", "tea",
      ["photo", "today", "cucumber"]),
    speaking("ja-ysc2-speak-ocha", "おちゃ", "tea"),
    listeningComp("ja-ysc2-lc-shashin", "しゃしん", "shashin", "photo",
      ["tea", "today", "cucumber"]),
    recognition(ctxSub2, "ja-ysc2-recog-cho", "ちょ", "cho", "chi + small yo"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_SH_CH_3: LessonContent = {
  id: "ja-m1-yoon-sh-ch-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon sh + ch — Review",
  description: "Cumulative practice on the sh + ch yōon + a spaced-review tap from M1.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [

    wordImageMcq(ctxSub3, "ja-ysc3-mcq-ocha", "おちゃ"),
    symbolToSound(ctxSub3, "ja-ysc3-s2s-shu", "しゅ", "shu", "shi + small yu"),
    wordImageMcq(ctxSub3, "ja-ysc3-mcq-shashin", "しゃしん"),

    wordImageMcq(ctxSub3, "ja-ysc3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-ysc3-mcq-review-2", REVIEW_WORDS[1].kana),

    recognition(ctxSub3, "ja-ysc3-recog-cha", "ちゃ", "cha", "chi + small ya"),
    translateMcq("ja-ysc3-translate-ocha", "tea", "おちゃ", Y_WORD_POOL),
    translateMcq("ja-ysc3-translate-shashin", "photo", "しゃしん", Y_WORD_POOL),
    speaking("ja-ysc3-speak-ocha", "おちゃ", "tea"),
    recognition(ctxSub3, "ja-ysc3-recog-sho", "しょ", "sho", "shi + small yo"),
    translateMcq(
      "ja-ysc3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    speaking("ja-ysc3-speak-shashin", "しゃしん", "photo"),
    translateMcq(
      "ja-ysc3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    matchKanaToRomaji("ja-ysc3-match-final", [
      { symbol: "しゃ", romaji: "sha" },
      { symbol: "しゅ", romaji: "shu" },
      { symbol: "しょ", romaji: "sho" },
      { symbol: "ちゃ", romaji: "cha" },
      { symbol: "ちゅ", romaji: "chu" },
      { symbol: "ちょ", romaji: "cho" },
    ]),
  ],
};
