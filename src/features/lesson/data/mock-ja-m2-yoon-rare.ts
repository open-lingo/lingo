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
 * M2 yōon rare: にゃ ひゃ みゃ りゃ families — 12 kana total. 3 hand-
 * authored sub-lessons + auto row-test. Mirrors g-row template.
 *
 * Strategy mirrors yoon-voiced:
 *   Sub-1: h-family (ひゃ ひゅ ひょ). Anchor: ひゃく (hundred 💯).
 *   Sub-2: r-family (りゃ りゅ りょ) + sweep across n + m families.
 *          Anchor: りょうり (cooking 🍳).
 *   Sub-3: cumulative review + M1 cross-module sprinkle.
 * Row test still quizzes all 12.
 */

// Sub-1 context — h-family chars + cousins as foils.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "ひゃ", romaji: "hya" },
    { symbol: "ひゅ", romaji: "hyu" },
    { symbol: "ひょ", romaji: "hyo" },
    // Cousin foils.
    { symbol: "りゃ", romaji: "rya" },
    { symbol: "みゃ", romaji: "mya" },
    { symbol: "ひ", romaji: "hi" },
    { symbol: "きゃ", romaji: "kya" },
  ],
  words: [
    { kana: "ひゃく", meaningEn: "hundred", emoji: "💯" },
  ],
  tileBankPool: ["ひゃ", "ひゅ", "ひょ", "りゃ", "りゅ", "りょ", "あ", "い", "う", "え", "お", "く"],
};

// Sub-2 context — all 12 rare yōon for the wide sweep.
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "にゃ", romaji: "nya" },
    { symbol: "にゅ", romaji: "nyu" },
    { symbol: "にょ", romaji: "nyo" },
    { symbol: "ひゃ", romaji: "hya" },
    { symbol: "ひゅ", romaji: "hyu" },
    { symbol: "ひょ", romaji: "hyo" },
    { symbol: "みゃ", romaji: "mya" },
    { symbol: "みゅ", romaji: "myu" },
    { symbol: "みょ", romaji: "myo" },
    { symbol: "りゃ", romaji: "rya" },
    { symbol: "りゅ", romaji: "ryu" },
    { symbol: "りょ", romaji: "ryo" },
  ],
  words: [
    { kana: "ひゃく", meaningEn: "hundred", emoji: "💯" },
    { kana: "りょうり", meaningEn: "cooking", emoji: "🍳" },
  ],
  tileBankPool: ["ひゃ", "ひゅ", "ひょ", "りゃ", "りゅ", "りょ", "にゃ", "にゅ", "にょ", "みゃ", "みゅ", "みょ", "あ", "い", "う", "え", "お", "く"],
};

const REVIEW_WORDS = pickReviewWords("ja-m1-yoon-rare-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

// Yoon-rare only has 2 anchor words; pad with 2 M1 carryovers so
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
// Sub-lesson 1 — Intro (h-family ひゃ ひゅ ひょ)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_RARE_1: LessonContent = {
  id: "ja-m1-yoon-rare-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon rare — Intro",
  description: "h-family yōon — ひゃく (hundred) is the win here.",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["hyaku"],
  steps: [
    {
      id: "ja-yr1-info-open",
      type: "info",
      title: "Last yōon — recognition focus",
      body:
        "The n/h/m/r yōon round out the chart. Many are uncommon in everyday text — recognize them when they show up, but don't sweat memorizing every one. The wins here are ひゃく (hundred) and りょうり (cooking).",
      variant: "culture",
    },

    // ─── Char 1: ひゃ (hya) → ひゃく (hundred). ─
    symbolIntro(
      "ja-yr1-intro-hya",
      "ひゃ",
      "hya",
      "ça",
      "hi + small ya — 'hya'",
      "ひゃく (hyaku) = hundred",
    ),
    wordImageMcq(ctxSub1, "ja-yr1-mcq-hyaku", "ひゃく"),
    speaking("ja-yr1-speak-hyaku", "ひゃく", "hundred"),

    // ─── Char 2: ひゅ (hyu) — trace + recognition.
    symbolIntro(
      "ja-yr1-intro-hyu",
      "ひゅ",
      "hyu",
      "çɯ",
      "hi + small yu — 'hyu'",
      "Rare in everyday words.",
    ),
    traceTwice("ja-yr1-trace-hyu", "ひゅ", "hyu", "Write ひ, then add a SMALL ゆ next to it."),

    // ─── Char 3: ひょ (hyo) — recognition.
    symbolIntro(
      "ja-yr1-intro-hyo",
      "ひょ",
      "hyo",
      "ço",
      "hi + small yo — 'hyo'",
      "Rare in everyday words.",
    ),
    recognition(ctxSub1, "ja-yr1-recog-hyo", "ひょ", "hyo", "hi + small yo"),

    // ─── Consolidation tail (R3 interleave) ───
    symbolToSound(ctxSub1, "ja-yr1-s2s-hya", "ひゃ", "hya", "hi + small ya"),
    recognition(ctxSub1, "ja-yr1-recog-hyu", "ひゅ", "hyu", "hi + small yu"),
    symbolToSound(ctxSub1, "ja-yr1-s2s-hyo", "ひょ", "hyo", "hi + small yo"),
    listeningBuild(ctxSub1, "ja-yr1-build-hyaku", "ひゃく", "hundred"),
    symbolToSound(ctxSub1, "ja-yr1-s2s-hya-2", "ひゃ", "hya", "hi + small ya"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (r-family + n + m sweep)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_RARE_2: LessonContent = {
  id: "ja-m1-yoon-rare-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon rare — Practice",
  description: "r-family (りゃ りゅ りょ) + n + m sweep across the rare yōon set.",
  estimatedMinutes: 7,
  xpReward: 18,
  introducesVocabIds: ["ryouri"],
  steps: [
    {
      id: "ja-yr2-info-open",
      type: "info",
      title: "r-family + the chart-completeness sweep",
      body:
        "りゃ りゅ りょ are the most common 'rare' yōon — りょうり (cooking) and りょこう (trip) both use them. The n + m families are mainly recognition; you'll see them in dictionaries more than in conversation.",
      variant: "tip",
    },

    symbolIntro(
      "ja-yr2-intro-rya",
      "りゃ",
      "rya",
      "ɾja",
      "ri + small ya — 'rya'",
      "りょうり (ryouri) = cooking",
    ),
    symbolIntro(
      "ja-yr2-intro-ryu",
      "りゅ",
      "ryu",
      "ɾjɯ",
      "ri + small yu — 'ryu'",
      "りゅう (ryuu) = dragon",
    ),
    symbolIntro(
      "ja-yr2-intro-ryo",
      "りょ",
      "ryo",
      "ɾjo",
      "ri + small yo — 'ryo'",
      "りょこう (ryokou) = trip",
    ),
    wordImageMcq(ctxSub2, "ja-yr2-mcq-ryouri", "りょうり"),
    speaking("ja-yr2-speak-ryouri", "りょうり", "cooking"),

    symbolToSound(ctxSub2, "ja-yr2-s2s-ryu", "りゅ", "ryu", "ri + small yu"),

    // n + m sweep — recognition-only.
    recognition(ctxSub2, "ja-yr2-recog-nya", "にゃ", "nya", "ni + small ya"),
    recognition(ctxSub2, "ja-yr2-recog-myo", "みょ", "myo", "mi + small yo"),
    recognition(ctxSub2, "ja-yr2-recog-nyu", "にゅ", "nyu", "ni + small yu"),

    wordImageMcq(ctxSub2, "ja-yr2-mcq-hyaku-redo", "ひゃく"),

    translateMcq("ja-yr2-translate-ryouri", "cooking", "りょうり", Y_WORD_POOL),
    matchKanaToRomaji("ja-yr2-match-rh", [
      { symbol: "ひゃ", romaji: "hya" },
      { symbol: "ひょ", romaji: "hyo" },
      { symbol: "りゃ", romaji: "rya" },
      { symbol: "りゅ", romaji: "ryu" },
      { symbol: "りょ", romaji: "ryo" },
    ]),
    translateMcq("ja-yr2-translate-hyaku", "hundred", "ひゃく", Y_WORD_POOL),

    listeningBuild(ctxSub2, "ja-yr2-build-ryouri", "りょうり", "cooking"),

    listeningComp("ja-yr2-lc-hyaku", "ひゃく", "hyaku", "hundred",
      ["cooking", "tea", "ten"]),
    speaking("ja-yr2-speak-hyaku", "ひゃく", "hundred"),
    listeningComp("ja-yr2-lc-ryouri", "りょうり", "ryouri", "cooking",
      ["hundred", "tea", "ten"]),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_YOON_RARE_3: LessonContent = {
  id: "ja-m1-yoon-rare-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Yōon rare — Review",
  description: "Cumulative practice across rare yōon + a spaced-review tap from M1. Yōon system complete.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    {
      id: "ja-yr3-info-open",
      type: "info",
      title: "Putting it together",
      body:
        "Quick review of the rare yōon plus earlier-row words. Next: the yōon capstone — one final sweep across everything.",
      variant: "default",
    },

    wordImageMcq(ctxSub3, "ja-yr3-mcq-hyaku", "ひゃく"),
    symbolToSound(ctxSub3, "ja-yr3-s2s-ryo", "りょ", "ryo", "ri + small yo"),
    wordImageMcq(ctxSub3, "ja-yr3-mcq-ryouri", "りょうり"),

    wordImageMcq(ctxSub3, "ja-yr3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-yr3-mcq-review-2", REVIEW_WORDS[1].kana),

    recognition(ctxSub3, "ja-yr3-recog-hya", "ひゃ", "hya", "hi + small ya"),
    translateMcq("ja-yr3-translate-hyaku", "hundred", "ひゃく", Y_WORD_POOL),
    translateMcq("ja-yr3-translate-ryouri", "cooking", "りょうり", Y_WORD_POOL),
    speaking("ja-yr3-speak-hyaku", "ひゃく", "hundred"),
    recognition(ctxSub3, "ja-yr3-recog-ryu", "りゅ", "ryu", "ri + small yu"),
    translateMcq(
      "ja-yr3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    speaking("ja-yr3-speak-ryouri", "りょうり", "cooking"),
    translateMcq(
      "ja-yr3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    matchKanaToRomaji("ja-yr3-match-final", [
      { symbol: "ひゃ", romaji: "hya" },
      { symbol: "ひょ", romaji: "hyo" },
      { symbol: "りゃ", romaji: "rya" },
      { symbol: "りゅ", romaji: "ryu" },
      { symbol: "りょ", romaji: "ryo" },
    ]),
  ],
};
