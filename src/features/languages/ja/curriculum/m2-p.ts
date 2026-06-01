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
} from "@/features/lesson/data/_consonantRowHelpers";

/**
 * M2 handakuten p-row: ぱ ぴ ぷ ぺ ぽ. 3 hand-authored sub-lessons + auto
 * row-test. Mirrors the g-row template (docs/m2-row-template-2026-05-17.md).
 *
 * First-of-type handakuten info card lives on sub-1 (this is the only
 * family that uses the small circle ゜).
 *
 * Sub-1: chars 1-3 (ぱ ぴ ぷ). Anchors: ぱん (bread 🍞), ぴあの (piano 🎹).
 * Sub-2: chars 4-5 (ぺ ぽ) + consolidation. Anchors: ぷりん (pudding 🍮),
 *        ぺん (pen 🖊).
 * Sub-3: cumulative review + M1 cross-module sprinkle.
 */

// Sub-1 context — chars 1-3 + sub-2 chars + h-row parent foils.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "ぱ", romaji: "pa" },
    { symbol: "ぴ", romaji: "pi" },
    { symbol: "ぷ", romaji: "pu" },
    // Same-row foils.
    { symbol: "ぺ", romaji: "pe" },
    { symbol: "ぽ", romaji: "po" },
    // h-row parent foils.
    { symbol: "は", romaji: "ha" },
    { symbol: "ひ", romaji: "hi" },
    { symbol: "ふ", romaji: "fu" },
  ],
  words: [
    { kana: "ぱん", meaningEn: "bread", emoji: "🍞" },
    { kana: "ぴあの", meaningEn: "piano", emoji: "🎹" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "は", "ひ", "ふ", "へ", "ほ", "ん", "の", "り"],
};

// Sub-2 context — all 5 p-chars + 4 anchor words.
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "ぱ", romaji: "pa" },
    { symbol: "ぴ", romaji: "pi" },
    { symbol: "ぷ", romaji: "pu" },
    { symbol: "ぺ", romaji: "pe" },
    { symbol: "ぽ", romaji: "po" },
  ],
  words: [
    { kana: "ぱん", meaningEn: "bread", emoji: "🍞" },
    { kana: "ぴあの", meaningEn: "piano", emoji: "🎹" },
    { kana: "ぷりん", meaningEn: "pudding", emoji: "🍮" },
    { kana: "ぺん", meaningEn: "pen", emoji: "🖊️" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "は", "ひ", "ふ", "へ", "ほ", "ん", "の", "り"],
};

const REVIEW_WORDS = pickReviewWords("ja-m1-p-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

const P_WORD_POOL = ctxSub2.words.map((w) => ({
  kana: w.kana,
  meaningEn: w.meaningEn,
}));

const SUB3_TRANSLATE_POOL = [
  ...P_WORD_POOL,
  ...REVIEW_WORDS.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
];

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 1 — Intro (chars ぱ ぴ ぷ)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_P_1: LessonContent = {
  id: "ja-m1-p-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Handakuten p-row — Intro",
  description: "The tiny circle (゜) only appears on h-kana, turning them into p. Your first handakuten word is bread.",
  estimatedMinutes: 7,
  xpReward: 15,
  introducesVocabIds: ["pan", "piano"],
  steps: [
    // First-of-type handakuten info card.
    {
      id: "ja-p1-info-open",
      type: "info",
      title: "Handakuten — the circle mark",
      body:
        "A small circle (゜) on h-kana flips it to a p-sound: は becomes ぱ. Same shape, different breath. You'll meet 5 of these in this row — and only h-kana take the circle.",
      variant: "culture",
    },

    // ─── Char 1: ぱ (pa) → ぱん (bread) ───
    symbolIntro(
      "ja-p1-intro-pa",
      "ぱ",
      "pa",
      "pa",
      "は + ゜ → 'pa'",
      "ぱん (pan) = bread (from Portuguese pão)",
    ),
    wordImageMcq(ctxSub1, "ja-p1-mcq-pan", "ぱん"),
    speaking("ja-p1-speak-pan", "ぱん", "bread"),

    // ─── Char 2: ぴ (pi) → ぴあの (piano) ───
    symbolIntro(
      "ja-p1-intro-pi",
      "ぴ",
      "pi",
      "pi",
      "ひ + ゜ → 'pi'",
      "ぴあの (piano) = piano",
    ),
    wordImageMcq(ctxSub1, "ja-p1-mcq-piano", "ぴあの"),
    speaking("ja-p1-speak-piano", "ぴあの", "piano"),

    // ─── Char 3: ぷ (pu) — no anchor (the others are in sub-2). Trace slot.
    symbolIntro(
      "ja-p1-intro-pu",
      "ぷ",
      "pu",
      "pɯ",
      "ふ + ゜ → 'pu'",
      "Same shape as ふ with a small circle on top-right.",
    ),
    traceTwice("ja-p1-trace-pu", "ぷ", "pu", "Trace ふ, then add the small circle top-right."),

    // ─── Consolidation tail (R3 interleave) ───
    symbolToSound(ctxSub1, "ja-p1-s2s-pa", "ぱ", "pa", "は + ゜"),
    recognition(ctxSub1, "ja-p1-recog-pi", "ぴ", "pi", "ひ + ゜"),
    symbolToSound(ctxSub1, "ja-p1-s2s-pu", "ぷ", "pu", "ふ + ゜"),
    listeningBuild(ctxSub1, "ja-p1-build-pan", "ぱん", "bread"),
    symbolToSound(ctxSub1, "ja-p1-s2s-pi", "ぴ", "pi", "ひ + ゜"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (chars ぺ ぽ + consolidation across all 5)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_P_2: LessonContent = {
  id: "ja-m1-p-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Handakuten p-row — Practice",
  description: "Meet ぺ + ぽ, then practice all 5 p-kana together.",
  estimatedMinutes: 7,
  xpReward: 18,
  introducesVocabIds: ["purin", "pen"],
  steps: [
    symbolIntro(
      "ja-p2-intro-pe",
      "ぺ",
      "pe",
      "pe",
      "へ + ゜ → 'pe'",
      "ぺん (pen) = pen",
    ),
    symbolIntro(
      "ja-p2-intro-po",
      "ぽ",
      "po",
      "po",
      "ほ + ゜ → 'po'",
      "ぷりん (purin) = pudding",
    ),
    wordImageMcq(ctxSub2, "ja-p2-mcq-pen", "ぺん"),
    wordImageMcq(ctxSub2, "ja-p2-mcq-purin", "ぷりん"),

    symbolToSound(ctxSub2, "ja-p2-s2s-pe", "ぺ", "pe", "へ + ゜"),

    wordImageMcq(ctxSub2, "ja-p2-mcq-pan-redo", "ぱん"),
    wordImageMcq(ctxSub2, "ja-p2-mcq-piano-redo", "ぴあの"),

    translateMcq("ja-p2-translate-pan", "bread", "ぱん", P_WORD_POOL),
    matchKanaToRomaji("ja-p2-match-all", [
      { symbol: "ぱ", romaji: "pa" },
      { symbol: "ぴ", romaji: "pi" },
      { symbol: "ぷ", romaji: "pu" },
      { symbol: "ぺ", romaji: "pe" },
      { symbol: "ぽ", romaji: "po" },
    ]),
    translateMcq("ja-p2-translate-pen", "pen", "ぺん", P_WORD_POOL),

    listeningBuild(ctxSub2, "ja-p2-build-pen", "ぺん", "pen"),

    listeningComp("ja-p2-lc-pan", "ぱん", "pan", "bread",
      ["pen", "pudding", "piano"]),
    speaking("ja-p2-speak-pen", "ぺん", "pen"),
    listeningComp("ja-p2-lc-purin", "ぷりん", "purin", "pudding",
      ["bread", "pen", "piano"]),
    speaking("ja-p2-speak-purin", "ぷりん", "pudding"),
    listeningComp("ja-p2-lc-piano", "ぴあの", "piano", "piano",
      ["bread", "pen", "pudding"]),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_P_3: LessonContent = {
  id: "ja-m1-p-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Handakuten p-row — Review",
  description: "Cumulative practice on the p-row + a spaced-review tap from M1. Voicing system complete.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    {
      id: "ja-p3-info-open",
      type: "info",
      title: "Putting it together",
      body:
        "Last review of the dakuten/handakuten block. Quick sweep of the p-row plus a few words from earlier rows. Up next: yōon — small ゃゅょ.",
      variant: "default",
    },

    wordImageMcq(ctxSub3, "ja-p3-mcq-pan", "ぱん"),
    symbolToSound(ctxSub3, "ja-p3-s2s-pi", "ぴ", "pi", "ひ + ゜"),
    wordImageMcq(ctxSub3, "ja-p3-mcq-purin", "ぷりん"),

    wordImageMcq(ctxSub3, "ja-p3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-p3-mcq-review-2", REVIEW_WORDS[1].kana),

    recognition(ctxSub3, "ja-p3-recog-po", "ぽ", "po", "ほ + ゜"),
    translateMcq("ja-p3-translate-piano", "piano", "ぴあの", P_WORD_POOL),
    translateMcq("ja-p3-translate-purin", "pudding", "ぷりん", P_WORD_POOL),
    speaking("ja-p3-speak-pan", "ぱん", "bread"),
    recognition(ctxSub3, "ja-p3-recog-pe", "ぺ", "pe", "へ + ゜"),
    translateMcq("ja-p3-translate-pen", "pen", "ぺん", P_WORD_POOL),
    translateMcq(
      "ja-p3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    speaking("ja-p3-speak-piano", "ぴあの", "piano"),
    translateMcq(
      "ja-p3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    matchKanaToRomaji("ja-p3-match-final", [
      { symbol: "ぱ", romaji: "pa" },
      { symbol: "ぴ", romaji: "pi" },
      { symbol: "ぷ", romaji: "pu" },
      { symbol: "ぺ", romaji: "pe" },
      { symbol: "ぽ", romaji: "po" },
    ]),
  ],
};
