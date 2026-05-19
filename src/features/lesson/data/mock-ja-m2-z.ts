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
 * M2 voiced s → z: ざ じ ず ぜ ぞ. 3 hand-authored sub-lessons + auto
 * row-test. Mirrors the g-row template
 * (docs/m2-row-template-2026-05-17.md) authored 2026-05-17 from Spencer's
 * walkthrough.
 *
 * No first-of-type dakuten intro — that lives on g-row sub-1.
 *
 * Sub-1: chars 1-3 (ざ じ ず) — intro+mcq+speaking for 2 anchored chars,
 *        intro+trace for ず (kana drill since anchor mizu already exposes
 *        ず in sub-2).
 *   Anchors: みず (water 💧) and じかん (time ⏰).
 *   Quirk: し→じ is 'ji' (not 'zi') — same sh→j change as English
 *   shore→jaw. Surfaced in the ja-intro hint string and ja-z1-info-open.
 * Sub-2: chars 4-5 (ぜ ぞ) + consolidation across all 5 z-kana.
 *   Anchors: かぜ (wind 🌬) and ぞう (elephant 🐘).
 * Sub-3: cumulative review + M1 cross-module sprinkle.
 */

// Sub-1 context — chars 1-3 + sub-2 chars as foils + s-row parent foils.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "ざ", romaji: "za" },
    { symbol: "じ", romaji: "ji" },
    { symbol: "ず", romaji: "zu" },
    // Same-row foils (sub-2 will introduce these formally).
    { symbol: "ぜ", romaji: "ze" },
    { symbol: "ぞ", romaji: "zo" },
    // s-row parent foils for cross-voicing discrimination.
    { symbol: "さ", romaji: "sa" },
    { symbol: "し", romaji: "shi" },
    { symbol: "す", romaji: "su" },
  ],
  words: [
    { kana: "みず", meaningEn: "water", emoji: "💧" },
    { kana: "じかん", meaningEn: "time", emoji: "🕒" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "さ", "し", "す", "せ", "そ", "み", "か", "ん"],
};

// Sub-2 context — all 5 z-chars + 4 anchor words.
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "ざ", romaji: "za" },
    { symbol: "じ", romaji: "ji" },
    { symbol: "ず", romaji: "zu" },
    { symbol: "ぜ", romaji: "ze" },
    { symbol: "ぞ", romaji: "zo" },
  ],
  words: [
    { kana: "みず", meaningEn: "water", emoji: "💧" },
    { kana: "じかん", meaningEn: "time", emoji: "🕒" },
    { kana: "かぜ", meaningEn: "wind", emoji: "🌬" },
    { kana: "ぞう", meaningEn: "elephant", emoji: "🐘" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "さ", "し", "す", "せ", "そ", "み", "か", "ん"],
};

const REVIEW_WORDS = pickReviewWords("ja-m1-z-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

const Z_WORD_POOL = ctxSub2.words.map((w) => ({
  kana: w.kana,
  meaningEn: w.meaningEn,
}));

const SUB3_TRANSLATE_POOL = [
  ...Z_WORD_POOL,
  ...REVIEW_WORDS.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
];

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 1 — Intro (chars ざ じ ず)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_Z_1: LessonContent = {
  id: "ja-m1-z-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced s → z — Intro",
  description: "Same dakuten rule on s-kana. One quirk: し→じ is 'ji' (not 'zi').",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["mizu", "jikan"],
  steps: [
    {
      id: "ja-z1-info-open",
      type: "info",
      title: "S → Z (with one twist)",
      body:
        "Dakuten ゛ voices s-kana: さ→ざ, す→ず, せ→ぜ, そ→ぞ. One quirk: し voiced is じ, pronounced 'ji' (not 'zi') — same shore→jaw change as English.",
      variant: "culture",
    },

    // ─── Char 1: ざ (za) → no anchor here; spend the slot on a kana drill ─
    // ざ's anchor would be かぜ (sub-2) — already accounted for. We give ざ
    // intro + trace so the first row card is hand+eye, not a forced word.
    symbolIntro(
      "ja-z1-intro-za",
      "ざ",
      "za",
      "za",
      "voiced さ (sa → za)",
      "Same shape as さ with two strokes.",
    ),
    traceTwice("ja-z1-trace-za", "ざ", "za", "Trace さ, then add the two strokes top-right."),

    // ─── Char 2: じ (ji) → じかん (time) ───
    symbolIntro(
      "ja-z1-intro-ji",
      "じ",
      "ji",
      "dʒi",
      "voiced し — pronounced 'ji' (not 'zi')",
      "じかん (jikan) = time",
    ),
    wordImageMcq(ctxSub1, "ja-z1-mcq-jikan", "じかん"),
    speaking("ja-z1-speak-jikan", "じかん", "time"),

    // ─── Char 3: ず (zu) → みず (water) ───
    symbolIntro(
      "ja-z1-intro-zu",
      "ず",
      "zu",
      "zɯ",
      "voiced す (su → zu)",
      "みず (mizu) = water",
    ),
    wordImageMcq(ctxSub1, "ja-z1-mcq-mizu", "みず"),
    speaking("ja-z1-speak-mizu", "みず", "water"),

    // ─── Consolidation tail (R3 interleave: no two same-type adjacent) ───
    // s2s → recog → s2s → build → s2s.
    symbolToSound(ctxSub1, "ja-z1-s2s-ji", "じ", "ji", "voiced し — 'ji'"),
    recognition(ctxSub1, "ja-z1-recog-za", "ざ", "za", "voiced さ"),
    symbolToSound(ctxSub1, "ja-z1-s2s-zu", "ず", "zu", "voiced す"),
    listeningBuild(ctxSub1, "ja-z1-build-mizu", "みず", "water"),
    symbolToSound(ctxSub1, "ja-z1-s2s-za", "ざ", "za", "voiced さ"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (chars ぜ ぞ + consolidation across all 5)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_Z_2: LessonContent = {
  id: "ja-m1-z-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced s → z — Practice",
  description: "Meet ぜ + ぞ, then practice all 5 z-kana together.",
  estimatedMinutes: 7,
  xpReward: 18,
  introducesVocabIds: ["kaze", "zou"],
  steps: [
    // Both intros first, then both mcqs — keeps distractor pool valid.
    symbolIntro(
      "ja-z2-intro-ze",
      "ぜ",
      "ze",
      "ze",
      "voiced せ (se → ze)",
      "かぜ (kaze) = wind",
    ),
    symbolIntro(
      "ja-z2-intro-zo",
      "ぞ",
      "zo",
      "zo",
      "voiced そ (so → zo)",
      "ぞう (zou) = elephant",
    ),
    wordImageMcq(ctxSub2, "ja-z2-mcq-kaze", "かぜ"),
    wordImageMcq(ctxSub2, "ja-z2-mcq-zou", "ぞう"),

    // R3 alphabet break before sub-1 redos.
    symbolToSound(ctxSub2, "ja-z2-s2s-ze", "ぜ", "ze", "voiced せ"),

    // Sub-1 redos (cumulative recall).
    wordImageMcq(ctxSub2, "ja-z2-mcq-mizu-redo", "みず"),
    wordImageMcq(ctxSub2, "ja-z2-mcq-jikan-redo", "じかん"),

    // Translate cluster broken with match_pairs (cognitive-mode break).
    translateMcq("ja-z2-translate-mizu", "water", "みず", Z_WORD_POOL),
    matchKanaToRomaji("ja-z2-match-all", [
      { symbol: "ざ", romaji: "za" },
      { symbol: "じ", romaji: "ji" },
      { symbol: "ず", romaji: "zu" },
      { symbol: "ぜ", romaji: "ze" },
      { symbol: "ぞ", romaji: "zo" },
    ]),
    translateMcq("ja-z2-translate-kaze", "wind", "かぜ", Z_WORD_POOL),

    listeningBuild(ctxSub2, "ja-z2-build-kaze", "かぜ", "wind"),

    // R3 tail: lc + speak interleave.
    listeningComp("ja-z2-lc-mizu", "みず", "mizu", "water",
      ["time", "wind", "elephant"]),
    speaking("ja-z2-speak-kaze", "かぜ", "wind"),
    listeningComp("ja-z2-lc-zou", "ぞう", "zou", "elephant",
      ["water", "time", "wind"]),
    speaking("ja-z2-speak-zou", "ぞう", "elephant"),
    listeningComp("ja-z2-lc-jikan", "じかん", "jikan", "time",
      ["wind", "water", "elephant"]),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_Z_3: LessonContent = {
  id: "ja-m1-z-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced s → z — Review",
  description: "Cumulative practice on the z-row + a spaced-review tap from M1.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    {
      id: "ja-z3-info-open",
      type: "info",
      title: "Putting it together",
      body:
        "Quick review of everything from the z-row, plus a few words from earlier rows so they stay sharp.",
      variant: "default",
    },

    wordImageMcq(ctxSub3, "ja-z3-mcq-mizu", "みず"),
    symbolToSound(ctxSub3, "ja-z3-s2s-ji", "じ", "ji", "voiced し — 'ji'"),
    wordImageMcq(ctxSub3, "ja-z3-mcq-kaze", "かぜ"),

    // M1 cross-module image_mcq sprinkle.
    wordImageMcq(ctxSub3, "ja-z3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-z3-mcq-review-2", REVIEW_WORDS[1].kana),

    // Translate cluster interleaved with speaking + recognition.
    recognition(ctxSub3, "ja-z3-recog-zo", "ぞ", "zo", "voiced そ"),
    translateMcq("ja-z3-translate-jikan", "time", "じかん", Z_WORD_POOL),
    translateMcq("ja-z3-translate-kaze", "wind", "かぜ", Z_WORD_POOL),
    speaking("ja-z3-speak-mizu", "みず", "water"),
    recognition(ctxSub3, "ja-z3-recog-ze", "ぜ", "ze", "voiced せ"),
    translateMcq("ja-z3-translate-zou", "elephant", "ぞう", Z_WORD_POOL),
    translateMcq(
      "ja-z3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    speaking("ja-z3-speak-jikan", "じかん", "time"),
    translateMcq(
      "ja-z3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    matchKanaToRomaji("ja-z3-match-final", [
      { symbol: "ざ", romaji: "za" },
      { symbol: "じ", romaji: "ji" },
      { symbol: "ず", romaji: "zu" },
      { symbol: "ぜ", romaji: "ze" },
      { symbol: "ぞ", romaji: "zo" },
    ]),
  ],
};
