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
 * M2 voiced k → g: が ぎ ぐ げ ご.
 *
 * Per the M2-row-template (docs/m2-row-template-2026-05-17.md, updated
 * 2026-05-17 after Spencer's walkthrough): 3 hand-authored sub-lessons +
 * auto row-test. Sub-3 does NOT contribute to ★ mastery (row-test only).
 *
 * Sub-1: chars 1-3 (g/g/g with intro+mcq+speaking for chars 1-2, intro+
 *        trace for char 3 since kagu was dropped — no anchor word means
 *        a kana drill in its place).
 * Sub-2: chars 4-5 + consolidation block.
 * Sub-3: cumulative review (all 4 g-words + 4 M1 review words).
 *
 * Anchor words (1 per char with a word):
 *   が → めがね (glasses 👓)
 *   ぎ → かぎ (key 🔑)
 *   ぐ → (none — kagu dropped; kana drill via symbol_trace)
 *   げ → げんき (well/energy 💪)
 *   ご → ごはん (rice/meal 🍚)
 */

// Sub-1 context — chars 1-3. ぐ has NO anchor word; recognition + s2s
// distractors include k-row foils so eliminating "must be new g" fails.
// 2026-05-17 (Marcus audit): added げ + ご to the pool so distractors
// for sub-1 alphabet drills include other g-row kana, not just k-row.
// Pre-fix every correct answer was the only dakuten in the grid, so
// "tap the dotted one" beat every step. Mixing in げ/ご forces actual
// shape discrimination within the dakuten set.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "が", romaji: "ga" },
    { symbol: "ぎ", romaji: "gi" },
    { symbol: "ぐ", romaji: "gu" },
    // Same-row g-kana as foils (sub-2 will introduce these formally).
    { symbol: "げ", romaji: "ge" },
    { symbol: "ご", romaji: "go" },
    // k-row parent foils — discrimination across the voicing line.
    { symbol: "か", romaji: "ka" },
    { symbol: "き", romaji: "ki" },
    { symbol: "く", romaji: "ku" },
  ],
  words: [
    { kana: "めがね", meaningEn: "glasses", emoji: "👓" },
    { kana: "かぎ", meaningEn: "key", emoji: "🔑" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "ま", "ね"],
};

// Sub-2 context — all 5 g-chars + 4 anchor words (ぐ has none).
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "が", romaji: "ga" },
    { symbol: "ぎ", romaji: "gi" },
    { symbol: "ぐ", romaji: "gu" },
    { symbol: "げ", romaji: "ge" },
    { symbol: "ご", romaji: "go" },
  ],
  words: [
    { kana: "めがね", meaningEn: "glasses", emoji: "👓" },
    { kana: "かぎ", meaningEn: "key", emoji: "🔑" },
    { kana: "げんき", meaningEn: "well/energy", emoji: "💪" },
    { kana: "ごはん", meaningEn: "rice/meal", emoji: "🍚" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ", "ま", "ね", "は", "ん"],
};

// Sub-3 context — same as sub-2 but augmented with M1 review words
// (pickReviewWords selects deterministically from M1_REVIEW_POOL).
const REVIEW_WORDS = pickReviewWords("ja-m1-g-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

// G-row word pool used by translateMcq distractor selection — 4 entries
// so the MCQ always fills exactly 4 options with row-only words.
const G_WORD_POOL = ctxSub2.words.map((w) => ({
  kana: w.kana,
  meaningEn: w.meaningEn,
}));

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 1 — Intro (chars が ぎ ぐ)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_G_1: LessonContent = {
  id: "ja-m1-g-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced k → g — Intro",
  description: "Dakuten voices k → g. Meet が ぎ ぐ + 2 anchor words.",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["megane", "kagi"],
  steps: [
    // First-of-type info card explaining dakuten.
    // 2026-05-17 R1.2: trimmed from 70w → ~30w (Mia/Aisha/Tyler audit
    // flagged the 5-arrow chain + multi-row preview as a friction
    // wall). Scope is now "just this row"; the z/d/b preview lands
    // naturally on z-row's first-of-type intro.
    {
      id: "ja-g1-info-open",
      type: "grammar_rule",
      title: "Dakuten — the voicing mark",
      rule:
        "Two small strokes (゛) on a kana voice it: the shape stays the same but your vocal cords buzz. You'll meet 5 of these in the k→g row.",
      examples: [
        { ja: "か → が", romaji: "ka → ga", en: "voiced k becomes g" },
        { ja: "き → ぎ", romaji: "ki → gi", en: "voiced k becomes g" },
      ],
    },

    // ─── Char 1: が (ga) → めがね (glasses) ───
    symbolIntro(
      "ja-g1-intro-ga",
      "が",
      "ga",
      "ɡa",
      "voiced か (ka → ga)",
      "めがね (megane) = glasses",
    ),
    wordImageMcq(ctxSub1, "ja-g1-mcq-megane", "めがね"),
    speaking("ja-g1-speak-megane", "めがね", "glasses"),

    // ─── Char 2: ぎ (gi) → かぎ (key) ───
    symbolIntro(
      "ja-g1-intro-gi",
      "ぎ",
      "gi",
      "ɡi",
      "voiced き (ki → gi)",
      "かぎ (kagi) = key",
    ),
    wordImageMcq(ctxSub1, "ja-g1-mcq-kagi", "かぎ"),
    speaking("ja-g1-speak-kagi", "かぎ", "key"),

    // ─── Char 3: ぐ (gu) — no anchor word; intro + trace (kana drill).
    // Spencer 2026-05-17: "replace the word that kagu gives, and instead
    // do another kana drill for gu, just pick one we dont use initially".
    // Trace is unused elsewhere in M2 today + fills the kinesthetic
    // channel the M2 template currently lacks (research-doc §2.4).
    symbolIntro(
      "ja-g1-intro-gu",
      "ぐ",
      "gu",
      "ɡɯ",
      "voiced く (ku → gu)",
      "Same shape as く with two strokes.",
    ),
    traceTwice("ja-g1-trace-gu", "ぐ", "gu", "Trace く, then add the two strokes top-right."),

    // ─── Consolidation tail ───
    // 2026-05-17 R3: full step-type interleave. Tyler measured focus
    // drop to 25% on the prior s2s-s2s tail even with R1.4's build
    // break — the crater just moved to the trailing s2s pair. Full
    // alternation: s2s → recog → s2s → build → s2s. No two same-type
    // adjacent. Pulls recognition + build into the middle as
    // dividers rather than openers.
    symbolToSound(ctxSub1, "ja-g1-s2s-ga", "が", "ga", "voiced か"),
    recognition(ctxSub1, "ja-g1-recog-gi", "ぎ", "gi", "voiced き"),
    symbolToSound(ctxSub1, "ja-g1-s2s-gu", "ぐ", "gu", "voiced く"),
    listeningBuild(ctxSub1, "ja-g1-build-kagi", "かぎ", "key"),
    symbolToSound(ctxSub1, "ja-g1-s2s-gi", "ぎ", "gi", "voiced き"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (chars げ ご + consolidation across all 5)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_G_2: LessonContent = {
  id: "ja-m1-g-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced k → g — Practice",
  description: "Meet げ + ご, then practice all 5 g-kana together.",
  estimatedMinutes: 7,
  xpReward: 18,
  introducesVocabIds: ["genki", "gohan"],
  steps: [
    // ─── Intro block: introduce げ + ご BOTH FIRST, then both mcqs.
    // Pre-fix the original order was intro-ge → mcq-genki → intro-go,
    // which meant the genki mcq's distractor pool (all 4 g-row words)
    // showed ごはん before ご had been introduced. Sarah flagged it on
    // walkthrough. Now both kana are introduced before any word-mcq
    // distractor pool can reference them.
    symbolIntro(
      "ja-g2-intro-ge",
      "げ",
      "ge",
      "ɡe",
      "voiced け (ke → ge)",
      "げんき (genki) = well/energy",
    ),
    symbolIntro(
      "ja-g2-intro-go",
      "ご",
      "go",
      "ɡo",
      "voiced こ (ko → go)",
      "ごはん (gohan) = rice/meal",
    ),
    wordImageMcq(ctxSub2, "ja-g2-mcq-genki", "げんき"),
    wordImageMcq(ctxSub2, "ja-g2-mcq-gohan", "ごはん"),

    // 2026-05-17 R3: alphabet break between new-char mcqs and sub-1
    // redos. Sophie + Yuki both flagged the 4-consecutive-wordImageMcq
    // block at the start of g-2 as a rhythm crash. s2s-ge also fills
    // a real gap — pre-R3, げ had zero production drill in g-2 (only
    // appeared as an intro + mcq + speak).
    symbolToSound(ctxSub2, "ja-g2-s2s-ge", "げ", "ge", "voiced け"),

    // ─── Consolidation block ───
    // Redo sub-1 mcqs (cumulative recall).
    wordImageMcq(ctxSub2, "ja-g2-mcq-megane-redo", "めがね"),
    wordImageMcq(ctxSub2, "ja-g2-mcq-kagi-redo", "かぎ"),

    // 2026-05-17 (Spencer walkthrough): break the two consecutive
    // translateMcqs with match_pairs between them. Pre-fix the
    // translate-megane card showed kagi as a distractor, then the
    // next card (translate-kagi) made it the correct answer — kagi
    // appeared in 2 adjacent MCQs as a pattern-match-prime. Inserting
    // match_pairs (kana↔romaji sweep, different cognitive mode)
    // breaks the same-step-type AND same-prompt-format adjacency.
    translateMcq("ja-g2-translate-megane", "glasses", "めがね", G_WORD_POOL),
    // match_pairs — all 5 g-row chars; kana side plays TTS on tap.
    // Columns shuffle independently per step.id. Big kana font, no ruby.
    matchKanaToRomaji("ja-g2-match-all", [
      { symbol: "が", romaji: "ga" },
      { symbol: "ぎ", romaji: "gi" },
      { symbol: "ぐ", romaji: "gu" },
      { symbol: "げ", romaji: "ge" },
      { symbol: "ご", romaji: "go" },
    ]),
    translateMcq("ja-g2-translate-kagi", "key", "かぎ", G_WORD_POOL),

    // listening_build — hear かぎ, assemble from tile bank.
    listeningBuild(ctxSub2, "ja-g2-build-kagi", "かぎ", "key"),

    // 2026-05-17 R3: interleave speaking + listeningComp. Pre-R3 the
    // tail ran speak-speak then lc-lc-lc (Yuki/Sophie/Tyler all
    // flagged the 3-LC block-feel; Tyler's finger started picking
    // before the audio finished). Now: lc → speak → lc → speak → lc
    // — full alternation, no two same-type adjacent.
    listeningComp("ja-g2-lc-megane", "めがね", "megane", "glasses",
      ["key", "well/energy", "rice/meal"]),
    speaking("ja-g2-speak-genki", "げんき", "well/energy"),
    listeningComp("ja-g2-lc-gohan", "ごはん", "gohan", "rice/meal",
      ["well/energy", "glasses", "key"]),
    speaking("ja-g2-speak-gohan", "ごはん", "rice/meal"),
    listeningComp("ja-g2-lc-genki", "げんき", "genki", "well/energy",
      ["key", "glasses", "rice/meal"]),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────
// Per Spencer's 2026-05-17 walkthrough feedback: less alphabet focus,
// vocab in context; randomized step order; one final sound→symbol OR
// symbol→sound per kana sprinkled; end with match_pairs; sprinkle in
// 2 translate + 2 image_mcq for words from prior modules (FSRS-style
// "last used" via M1_REVIEW_POOL).
//
// Does NOT contribute to ★ — row_test still owns mastery.

// Pool for sub-3's translateMcq distractors (sub-2 g-words + a curated
// pair of M1 words so options are plausible but not row-only).
const SUB3_TRANSLATE_POOL = [
  ...G_WORD_POOL,
  ...REVIEW_WORDS.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
];

export const MOCK_LESSON_JA_M2_G_3: LessonContent = {
  id: "ja-m1-g-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced k → g — Review",
  description: "Cumulative practice on the g-row + a spaced-review tap from M1.",
  // 2026-05-17 R2.1: trimmed 17 → 13 graded steps (Cut Set A). Removed
  // mcq-kagi + mcq-gohan (already covered in g-2 sub-2), translate-megane
  // (paired with mcq-megane recall earlier in g-3), and s2s-ga (most-
  // drilled kana by this point). estimatedMinutes 7 → 5 (~25s/step × 13).
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [

    // 2 word_image_mcq for the harder g-row words (megane + genki).
    // kagi + gohan dropped — already drilled in g-2 sub-2.
    wordImageMcq(ctxSub3, "ja-g3-mcq-megane", "めがね"),
    // Single sound→symbol sprinkle for ぎ (alphabet upkeep, low focus).
    symbolToSound(ctxSub3, "ja-g3-s2s-gi", "ぎ", "gi", "voiced き"),
    wordImageMcq(ctxSub3, "ja-g3-mcq-genki", "げんき"),

    // M1 cross-module image_mcq sprinkle (2 review words) — "little
    // dopamine hits build retention" per Spencer.
    wordImageMcq(ctxSub3, "ja-g3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-g3-mcq-review-2", REVIEW_WORDS[1].kana),

    // 2026-05-17 R3: speakings woven INTO the translate cluster
    // instead of tail-stacked. Pre-R3 the row ran 4 translateMcqs
    // back-to-back in a 6-step span (Sophie + Tyler + Mia all flagged
    // the rhythm dip). Now max 2 consecutive translates; speakings
    // act as production-direction breaks between translates.
    // Sequence: recog → tr → tr → speak → recog → tr → tr → speak → tr → match.
    recognition(ctxSub3, "ja-g3-recog-go", "ご", "go", "voiced こ"),
    translateMcq("ja-g3-translate-kagi", "key", "かぎ", G_WORD_POOL),
    translateMcq("ja-g3-translate-genki", "well/energy", "げんき", G_WORD_POOL),
    speaking("ja-g3-speak-megane", "めがね", "glasses"),
    recognition(ctxSub3, "ja-g3-recog-ge", "げ", "ge", "voiced け"),
    translateMcq("ja-g3-translate-gohan", "rice/meal", "ごはん", G_WORD_POOL),
    // M1 cross-module translateMcq sprinkle (2 review words) — pool
    // includes both M1 + g-row so distractors aren't pure category.
    translateMcq(
      "ja-g3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    speaking("ja-g3-speak-genki", "げんき", "well/energy"),
    translateMcq(
      "ja-g3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    // Final match_pairs — kana ↔ romaji, big kana, audio on tap, columns
    // shuffle independently.
    matchKanaToRomaji("ja-g3-match-final", [
      { symbol: "が", romaji: "ga" },
      { symbol: "ぎ", romaji: "gi" },
      { symbol: "ぐ", romaji: "gu" },
      { symbol: "げ", romaji: "ge" },
      { symbol: "ご", romaji: "go" },
    ]),
  ],
};
