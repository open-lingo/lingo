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
  listeningComp,
  pickReviewWords,
} from "./_consonantRowHelpers";

/**
 * M2 yōon intro: きゃ きゅ きょ. 3 hand-authored sub-lessons + auto
 * row-test. Mirrors the g-row template (docs/m2-row-template-2026-05-17.md).
 *
 * First-of-type yōon info card lives on sub-1 (this is the worked example
 * for the small-ゃゅょ rule).
 *
 * Sub-1: chars 1-2 (きゃ きゅ). Anchor: きゅうり (cucumber 🥒).
 * Sub-2: char 3 (きょ) + consolidation. Anchor: きょう (today 📅).
 * Sub-3: cumulative review + M1 cross-module sprinkle.
 */

// Sub-1 context — chars 1-2 + sub-2 char + parent ki + s-yoon foils.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "きゃ", romaji: "kya" },
    { symbol: "きゅ", romaji: "kyu" },
    { symbol: "きょ", romaji: "kyo" },
    // Parent + cousin foils for yōon discrimination.
    { symbol: "き", romaji: "ki" },
    { symbol: "か", romaji: "ka" },
    { symbol: "し", romaji: "shi" },
  ],
  words: [
    { kana: "きゅうり", meaningEn: "cucumber", emoji: "🥒" },
  ],
  tileBankPool: ["きゃ", "きゅ", "きょ", "あ", "い", "う", "え", "お", "か", "き", "り"],
};

// Sub-2 context — all 3 yōon chars + 2 anchor words.
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "きゃ", romaji: "kya" },
    { symbol: "きゅ", romaji: "kyu" },
    { symbol: "きょ", romaji: "kyo" },
  ],
  words: [
    { kana: "きゅうり", meaningEn: "cucumber", emoji: "🥒" },
    { kana: "きょう", meaningEn: "today", emoji: "📅" },
  ],
  tileBankPool: ["きゃ", "きゅ", "きょ", "あ", "い", "う", "え", "お", "か", "き", "り"],
};

const REVIEW_WORDS = pickReviewWords("ja-m1-yoon-intro-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

// Yoon-intro only has 2 anchor words; pad with 2 M1 carryovers so
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
// Sub-lesson 1 — Intro (chars きゃ きゅ)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_INTRO_1: LessonContent = {
  id: "ja-m1-yoon-intro-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon — Intro",
  description: "Small ゃゅょ glued to a consonant = one syllable. Worked example with き.",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["kyuuri"],
  steps: [
    // First-of-type yōon info card.
    {
      id: "ja-yi1-info-open",
      type: "info",
      title: "Yōon — small kana combinations",
      body:
        "A small や, ゆ, or ょ next to an i-row kana blends them into one mora: き + ゃ = きゃ. One sound, two glyphs. The small kana never separates — it sticks to its neighbor.",
      variant: "culture",
    },

    // ─── Char 1: きゃ (kya) — no anchor on its own; trace slot. ─
    symbolIntro(
      "ja-yi1-intro-kya",
      "きゃ",
      "kya",
      "kja",
      "ki + small ya — one syllable 'kya'",
      "Pronounced 'kya' — like the start of 'cute' said quickly.",
    ),
    traceTwice("ja-yi1-trace-kya", "きゃ", "kya", "Write き, then add a SMALL や next to it."),

    // ─── Char 2: きゅ (kyu) → きゅうり (cucumber) ───
    symbolIntro(
      "ja-yi1-intro-kyu",
      "きゅ",
      "kyu",
      "kjɯ",
      "ki + small yu — one syllable 'kyu'",
      "きゅうり (kyuuri) = cucumber",
    ),
    wordImageMcq(ctxSub1, "ja-yi1-mcq-kyuuri", "きゅうり"),
    speaking("ja-yi1-speak-kyuuri", "きゅうり", "cucumber"),

    // ─── Consolidation tail (R3 interleave) ───
    symbolToSound(ctxSub1, "ja-yi1-s2s-kya", "きゃ", "kya", "ki + small ya"),
    recognition(ctxSub1, "ja-yi1-recog-kyu", "きゅ", "kyu", "ki + small yu"),
    symbolToSound(ctxSub1, "ja-yi1-s2s-kyu", "きゅ", "kyu", "ki + small yu"),
    listeningBuild(ctxSub1, "ja-yi1-build-kyuuri", "きゅうり", "cucumber"),
    symbolToSound(ctxSub1, "ja-yi1-s2s-kya-2", "きゃ", "kya", "ki + small ya"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (char きょ + consolidation across all 3)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_INTRO_2: LessonContent = {
  id: "ja-m1-yoon-intro-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon — Practice",
  description: "Meet きょ, then practice all 3 k-yōon together.",
  estimatedMinutes: 6,
  xpReward: 16,
  introducesVocabIds: ["kyou"],
  steps: [
    symbolIntro(
      "ja-yi2-intro-kyo",
      "きょ",
      "kyo",
      "kjo",
      "ki + small yo — one syllable 'kyo'",
      "きょう (kyou) = today",
    ),
    wordImageMcq(ctxSub2, "ja-yi2-mcq-kyou", "きょう"),
    speaking("ja-yi2-speak-kyou", "きょう", "today"),
    traceTwice("ja-yi2-trace-kyo", "きょ", "kyo", "Write き, then add a SMALL よ next to it."),

    symbolToSound(ctxSub2, "ja-yi2-s2s-kyo", "きょ", "kyo", "ki + small yo"),

    wordImageMcq(ctxSub2, "ja-yi2-mcq-kyuuri-redo", "きゅうり"),

    translateMcq("ja-yi2-translate-kyuuri", "cucumber", "きゅうり", Y_WORD_POOL),
    matchKanaToRomaji("ja-yi2-match-all", [
      { symbol: "きゃ", romaji: "kya" },
      { symbol: "きゅ", romaji: "kyu" },
      { symbol: "きょ", romaji: "kyo" },
    ]),
    translateMcq("ja-yi2-translate-kyou", "today", "きょう", Y_WORD_POOL),

    listeningBuild(ctxSub2, "ja-yi2-build-kyou", "きょう", "today"),

    listeningComp("ja-yi2-lc-kyuuri", "きゅうり", "kyuuri", "cucumber",
      ["today", "tea", "ten"]),
    speaking("ja-yi2-speak-kyou-2", "きょう", "today"),
    listeningComp("ja-yi2-lc-kyou", "きょう", "kyou", "today",
      ["cucumber", "tea", "ten"]),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_INTRO_3: LessonContent = {
  id: "ja-m1-yoon-intro-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon — Review",
  description: "Cumulative practice on the k-yōon + a spaced-review tap from M1.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    {
      id: "ja-yi3-info-open",
      type: "info",
      title: "Putting it together",
      body:
        "Quick review of the 3 k-yōon plus earlier-row words. The same small-ゃゅょ rule applies to every consonant family — you'll see them in the next lessons.",
      variant: "default",
    },

    wordImageMcq(ctxSub3, "ja-yi3-mcq-kyou", "きょう"),
    symbolToSound(ctxSub3, "ja-yi3-s2s-kya", "きゃ", "kya", "ki + small ya"),
    wordImageMcq(ctxSub3, "ja-yi3-mcq-kyuuri", "きゅうり"),

    wordImageMcq(ctxSub3, "ja-yi3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-yi3-mcq-review-2", REVIEW_WORDS[1].kana),

    recognition(ctxSub3, "ja-yi3-recog-kyu", "きゅ", "kyu", "ki + small yu"),
    translateMcq("ja-yi3-translate-kyou", "today", "きょう", Y_WORD_POOL),
    translateMcq("ja-yi3-translate-kyuuri", "cucumber", "きゅうり", Y_WORD_POOL),
    speaking("ja-yi3-speak-kyou", "きょう", "today"),
    recognition(ctxSub3, "ja-yi3-recog-kyo", "きょ", "kyo", "ki + small yo"),
    translateMcq(
      "ja-yi3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    speaking("ja-yi3-speak-kyuuri", "きゅうり", "cucumber"),
    translateMcq(
      "ja-yi3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    matchKanaToRomaji("ja-yi3-match-final", [
      { symbol: "きゃ", romaji: "kya" },
      { symbol: "きゅ", romaji: "kyu" },
      { symbol: "きょ", romaji: "kyo" },
    ]),
  ],
};
