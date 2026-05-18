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
 * M2 voiced h → b: ば び ぶ べ ぼ. 3 hand-authored sub-lessons + auto
 * row-test. Mirrors the g-row template (docs/m2-row-template-2026-05-17.md).
 *
 * Sub-1: chars 1-3 (ば び ぶ). Anchors: かばん (bag 🎒) and えび (shrimp 🦐).
 * Sub-2: chars 4-5 (べ ぼ) + consolidation. Anchors: たべる (eat 🍽), ぼうし (hat).
 * Sub-3: cumulative review + M1 cross-module sprinkle.
 *
 * Quick note on h-row: this is the ONLY family that takes both dakuten
 * (゛ → b) AND handakuten (゜ → p, p-row in the next lesson).
 */

// Sub-1 context — chars 1-3 + sub-2 chars + h-row parent foils.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "ば", romaji: "ba" },
    { symbol: "び", romaji: "bi" },
    { symbol: "ぶ", romaji: "bu" },
    // Same-row foils.
    { symbol: "べ", romaji: "be" },
    { symbol: "ぼ", romaji: "bo" },
    // h-row parent foils for cross-voicing discrimination.
    { symbol: "は", romaji: "ha" },
    { symbol: "ひ", romaji: "hi" },
    { symbol: "ふ", romaji: "fu" },
  ],
  words: [
    { kana: "かばん", meaningEn: "bag", emoji: "🎒" },
    { kana: "えび", meaningEn: "shrimp", emoji: "🦐" },
    { kana: "ぶた", meaningEn: "pig", emoji: "🐖" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "は", "ひ", "ふ", "へ", "ほ", "た", "る", "か", "ん", "し"],
};

// Sub-2 context — all 5 b-chars + 5 anchor words.
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "ば", romaji: "ba" },
    { symbol: "び", romaji: "bi" },
    { symbol: "ぶ", romaji: "bu" },
    { symbol: "べ", romaji: "be" },
    { symbol: "ぼ", romaji: "bo" },
  ],
  words: [
    { kana: "かばん", meaningEn: "bag", emoji: "🎒" },
    { kana: "えび", meaningEn: "shrimp", emoji: "🦐" },
    { kana: "ぶた", meaningEn: "pig", emoji: "🐖" },
    { kana: "たべる", meaningEn: "to eat", emoji: "🍽️" },
    { kana: "ぼうし", meaningEn: "hat", emoji: "🎩" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "は", "ひ", "ふ", "へ", "ほ", "た", "る", "か", "ん", "し"],
};

const REVIEW_WORDS = pickReviewWords("ja-m1-b-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

const B_WORD_POOL = ctxSub2.words.map((w) => ({
  kana: w.kana,
  meaningEn: w.meaningEn,
}));

const SUB3_TRANSLATE_POOL = [
  ...B_WORD_POOL,
  ...REVIEW_WORDS.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
];

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 1 — Intro (chars ば び ぶ)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_B_1: LessonContent = {
  id: "ja-m1-b-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced h → b — Intro",
  description: "Dakuten on h-kana gives b-sounds. Same mark as g/z/d — just on a new family.",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["kaban", "ebi"],
  steps: [
    {
      id: "ja-b1-info-open",
      type: "info",
      title: "H → B",
      body:
        "Dakuten ゛ on h-kana voices them: は→ば, ひ→び, ふ→ぶ, へ→べ, ほ→ぼ. The h-row is the only family that also takes a circle mark (゜) — that's the p-row, next lesson.",
      variant: "culture",
    },

    // ─── Char 1: ば (ba) → かばん (bag) ───
    symbolIntro(
      "ja-b1-intro-ba",
      "ば",
      "ba",
      "ba",
      "voiced は (ha → ba)",
      "かばん (kaban) = bag",
    ),
    wordImageMcq(ctxSub1, "ja-b1-mcq-kaban", "かばん"),
    speaking("ja-b1-speak-kaban", "かばん", "bag"),

    // ─── Char 2: び (bi) → えび (shrimp) ───
    symbolIntro(
      "ja-b1-intro-bi",
      "び",
      "bi",
      "bi",
      "voiced ひ (hi → bi)",
      "えび (ebi) = shrimp",
    ),
    wordImageMcq(ctxSub1, "ja-b1-mcq-ebi", "えび"),
    speaking("ja-b1-speak-ebi", "えび", "shrimp"),

    // ─── Char 3: ぶ (bu) → ぶた (pig). Two anchors share sub-1 already
    // (kaban + ebi), so ぶ gets intro + trace as the kana-drill slot.
    symbolIntro(
      "ja-b1-intro-bu",
      "ぶ",
      "bu",
      "bɯ",
      "voiced ふ (fu → bu)",
      "Same shape as ふ with two strokes.",
    ),
    traceTwice("ja-b1-trace-bu", "ぶ", "bu", "Trace ふ, then add the two strokes top-right."),

    // ─── Consolidation tail (R3 interleave) ───
    symbolToSound(ctxSub1, "ja-b1-s2s-ba", "ば", "ba", "voiced は"),
    recognition(ctxSub1, "ja-b1-recog-bi", "び", "bi", "voiced ひ"),
    symbolToSound(ctxSub1, "ja-b1-s2s-bu", "ぶ", "bu", "voiced ふ"),
    listeningBuild(ctxSub1, "ja-b1-build-ebi", "えび", "shrimp"),
    symbolToSound(ctxSub1, "ja-b1-s2s-bi", "び", "bi", "voiced ひ"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (chars べ ぼ + consolidation across all 5)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_B_2: LessonContent = {
  id: "ja-m1-b-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced h → b — Practice",
  description: "Meet べ + ぼ, then practice all 5 b-kana together.",
  estimatedMinutes: 7,
  xpReward: 18,
  introducesVocabIds: ["taberu", "boushi"],
  steps: [
    symbolIntro(
      "ja-b2-intro-be",
      "べ",
      "be",
      "be",
      "voiced へ (he → be)",
      "たべる (taberu) = to eat",
    ),
    symbolIntro(
      "ja-b2-intro-bo",
      "ぼ",
      "bo",
      "bo",
      "voiced ほ (ho → bo)",
      "ぼうし (boushi) = hat",
    ),
    wordImageMcq(ctxSub2, "ja-b2-mcq-taberu", "たべる"),
    wordImageMcq(ctxSub2, "ja-b2-mcq-boushi", "ぼうし"),

    // R3 alphabet break before sub-1 redos.
    symbolToSound(ctxSub2, "ja-b2-s2s-be", "べ", "be", "voiced へ"),

    wordImageMcq(ctxSub2, "ja-b2-mcq-kaban-redo", "かばん"),
    wordImageMcq(ctxSub2, "ja-b2-mcq-ebi-redo", "えび"),

    translateMcq("ja-b2-translate-kaban", "bag", "かばん", B_WORD_POOL),
    matchKanaToRomaji("ja-b2-match-all", [
      { symbol: "ば", romaji: "ba" },
      { symbol: "び", romaji: "bi" },
      { symbol: "ぶ", romaji: "bu" },
      { symbol: "べ", romaji: "be" },
      { symbol: "ぼ", romaji: "bo" },
    ]),
    translateMcq("ja-b2-translate-taberu", "to eat", "たべる", B_WORD_POOL),

    listeningBuild(ctxSub2, "ja-b2-build-taberu", "たべる", "to eat"),

    listeningComp("ja-b2-lc-kaban", "かばん", "kaban", "bag",
      ["shrimp", "pig", "hat"]),
    speaking("ja-b2-speak-taberu", "たべる", "to eat"),
    listeningComp("ja-b2-lc-boushi", "ぼうし", "boushi", "hat",
      ["bag", "shrimp", "pig"]),
    speaking("ja-b2-speak-boushi", "ぼうし", "hat"),
    listeningComp("ja-b2-lc-buta", "ぶた", "buta", "pig",
      ["shrimp", "bag", "hat"]),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_B_3: LessonContent = {
  id: "ja-m1-b-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced h → b — Review",
  description: "Cumulative practice on the b-row + a spaced-review tap from M1.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    {
      id: "ja-b3-info-open",
      type: "info",
      title: "Putting it together",
      body:
        "Quick review of everything from the b-row, plus a few words from earlier rows so they stay sharp.",
      variant: "default",
    },

    wordImageMcq(ctxSub3, "ja-b3-mcq-kaban", "かばん"),
    symbolToSound(ctxSub3, "ja-b3-s2s-be", "べ", "be", "voiced へ"),
    wordImageMcq(ctxSub3, "ja-b3-mcq-taberu", "たべる"),

    wordImageMcq(ctxSub3, "ja-b3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-b3-mcq-review-2", REVIEW_WORDS[1].kana),

    recognition(ctxSub3, "ja-b3-recog-bo", "ぼ", "bo", "voiced ほ"),
    translateMcq("ja-b3-translate-ebi", "shrimp", "えび", B_WORD_POOL),
    translateMcq("ja-b3-translate-buta", "pig", "ぶた", B_WORD_POOL),
    speaking("ja-b3-speak-kaban", "かばん", "bag"),
    recognition(ctxSub3, "ja-b3-recog-bi", "び", "bi", "voiced ひ"),
    translateMcq("ja-b3-translate-boushi", "hat", "ぼうし", B_WORD_POOL),
    translateMcq(
      "ja-b3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    speaking("ja-b3-speak-taberu", "たべる", "to eat"),
    translateMcq(
      "ja-b3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    matchKanaToRomaji("ja-b3-match-final", [
      { symbol: "ば", romaji: "ba" },
      { symbol: "び", romaji: "bi" },
      { symbol: "ぶ", romaji: "bu" },
      { symbol: "べ", romaji: "be" },
      { symbol: "ぼ", romaji: "bo" },
    ]),
  ],
};
