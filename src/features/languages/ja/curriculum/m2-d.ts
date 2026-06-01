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
 * M2 voiced t → d: だ で ど. 3 hand-authored sub-lessons + auto row-test.
 * Mirrors the g-row template (docs/m2-row-template-2026-05-17.md).
 *
 * 2026-05-17 Spencer: ぢ・づ dropped entirely from the row. They get a
 * one-line callout in the sub-1 intro info card for chart-completeness
 * awareness, but neither lesson drills nor the row-test quiz them — modern
 * Japanese writes those sounds as じ・ず in nearly every word.
 *
 * Sub-1: chars 1-2 (だ で). Anchors: でんわ (telephone 📞), からだ (body).
 * Sub-2: char 3 (ど) + consolidation across all 3 d-kana. Anchor: どあ.
 * Sub-3: cumulative review + M1 cross-module sprinkle.
 */

// Sub-1 context — chars 1-2 + sub-2 char + t-row parent foils.
const ctxSub1: RowContext = {
  allKana: [
    { symbol: "だ", romaji: "da" },
    { symbol: "で", romaji: "de" },
    // Sub-2 char as same-row foil.
    { symbol: "ど", romaji: "do" },
    // t-row parent foils for cross-voicing discrimination.
    { symbol: "た", romaji: "ta" },
    { symbol: "て", romaji: "te" },
    { symbol: "と", romaji: "to" },
  ],
  words: [
    { kana: "でんわ", meaningEn: "telephone", emoji: "📞" },
    { kana: "からだ", meaningEn: "body", emoji: "🧍" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "た", "ち", "つ", "て", "と", "ん", "わ", "か", "ら"],
};

// Sub-2 context — all 3 d-chars + 3 anchor words.
const ctxSub2: RowContext = {
  allKana: [
    { symbol: "だ", romaji: "da" },
    { symbol: "で", romaji: "de" },
    { symbol: "ど", romaji: "do" },
  ],
  words: [
    { kana: "でんわ", meaningEn: "telephone", emoji: "📞" },
    { kana: "からだ", meaningEn: "body", emoji: "🧍" },
    { kana: "どあ", meaningEn: "door", emoji: "🚪" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "た", "ち", "つ", "て", "と", "ん", "わ", "か", "ら"],
};

const REVIEW_WORDS = pickReviewWords("ja-m1-d-3", 4);
const ctxSub3: RowContext = {
  allKana: ctxSub2.allKana,
  words: [...ctxSub2.words, ...REVIEW_WORDS],
  tileBankPool: ctxSub2.tileBankPool,
};

// D_WORD_POOL needs ≥4 entries for translateMcq's 4-option grid. The d-row
// only has 3 anchors after dropping ぢ・づ, so we pad with a single M1
// carryover (deterministically picked from REVIEW_WORDS) to fill the slot.
const D_WORD_POOL = [
  ...ctxSub2.words.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
  { kana: REVIEW_WORDS[0].kana, meaningEn: REVIEW_WORDS[0].meaningEn },
];

const SUB3_TRANSLATE_POOL = [
  ...D_WORD_POOL,
  ...REVIEW_WORDS.map((w) => ({ kana: w.kana, meaningEn: w.meaningEn })),
];

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 1 — Intro (chars だ で)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_D_1: LessonContent = {
  id: "ja-m1-d-1",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced t → d — Intro",
  description: "Dakuten on t-kana gives d. ぢ・づ exist on the chart but are rarely written — じ・ず are used instead.",
  estimatedMinutes: 6,
  xpReward: 15,
  introducesVocabIds: ["denwa", "karada"],
  steps: [
    {
      id: "ja-d1-info-open",
      type: "info",
      title: "T → D (with two ghosts)",
      body:
        "Dakuten ゛ on t-kana voices them: た→だ, て→で, と→ど. ち and つ can take dakuten too — ぢ・づ — but modern Japanese almost always writes those sounds as じ・ず. We skip drilling ぢ・づ here; recognize them in the wild, no need to write them.",
      variant: "culture",
    },

    // ─── Char 1: だ (da) → からだ (body) ───
    symbolIntro(
      "ja-d1-intro-da",
      "だ",
      "da",
      "da",
      "voiced た (ta → da)",
      "からだ (karada) = body",
    ),
    wordImageMcq(ctxSub1, "ja-d1-mcq-karada", "からだ"),
    speaking("ja-d1-speak-karada", "からだ", "body"),

    // ─── Char 2: で (de) → でんわ (telephone) ───
    symbolIntro(
      "ja-d1-intro-de",
      "で",
      "de",
      "de",
      "voiced て (te → de)",
      "でんわ (denwa) = telephone",
    ),
    wordImageMcq(ctxSub1, "ja-d1-mcq-denwa", "でんわ"),
    speaking("ja-d1-speak-denwa", "でんわ", "telephone"),

    // ─── Consolidation tail (R3 interleave) ───
    symbolToSound(ctxSub1, "ja-d1-s2s-da", "だ", "da", "voiced た"),
    recognition(ctxSub1, "ja-d1-recog-de", "で", "de", "voiced て"),
    symbolToSound(ctxSub1, "ja-d1-s2s-de", "で", "de", "voiced て"),
    listeningBuild(ctxSub1, "ja-d1-build-denwa", "でんわ", "telephone"),
    symbolToSound(ctxSub1, "ja-d1-s2s-da-2", "だ", "da", "voiced た"),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 2 — Practice (char ど + consolidation across all 3)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_D_2: LessonContent = {
  id: "ja-m1-d-2",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced t → d — Practice",
  description: "Meet ど, then practice all 3 d-kana together.",
  estimatedMinutes: 6,
  xpReward: 16,
  introducesVocabIds: ["doa"],
  steps: [
    // Single new-char intro + anchor + speaking + trace (only 1 new kana).
    symbolIntro(
      "ja-d2-intro-do",
      "ど",
      "do",
      "do",
      "voiced と (to → do)",
      "どあ (doa) = door",
    ),
    wordImageMcq(ctxSub2, "ja-d2-mcq-doa", "どあ"),
    speaking("ja-d2-speak-doa", "どあ", "door"),
    traceTwice("ja-d2-trace-do", "ど", "do", "Trace と, then add the two strokes top-right."),

    // R3 alphabet break before sub-1 redos.
    symbolToSound(ctxSub2, "ja-d2-s2s-do", "ど", "do", "voiced と"),

    // Sub-1 redos (cumulative recall).
    wordImageMcq(ctxSub2, "ja-d2-mcq-denwa-redo", "でんわ"),
    wordImageMcq(ctxSub2, "ja-d2-mcq-karada-redo", "からだ"),

    // Translate cluster broken with match_pairs.
    translateMcq("ja-d2-translate-denwa", "telephone", "でんわ", D_WORD_POOL),
    matchKanaToRomaji("ja-d2-match-all", [
      { symbol: "だ", romaji: "da" },
      { symbol: "で", romaji: "de" },
      { symbol: "ど", romaji: "do" },
    ]),
    translateMcq("ja-d2-translate-doa", "door", "どあ", D_WORD_POOL),

    listeningBuild(ctxSub2, "ja-d2-build-doa", "どあ", "door"),

    // R3 tail: lc + speak interleave.
    listeningComp("ja-d2-lc-denwa", "でんわ", "denwa", "telephone",
      ["body", "door", "wind"]),
    speaking("ja-d2-speak-do", "ど", "the kana 'do'"),
    listeningComp("ja-d2-lc-karada", "からだ", "karada", "body",
      ["telephone", "door", "time"]),
    speaking("ja-d2-speak-denwa-2", "でんわ", "telephone"),
    listeningComp("ja-d2-lc-doa", "どあ", "doa", "door",
      ["telephone", "body", "elephant"]),
  ],
};

// ──────────────────────────────────────────────────────────────────────
// Sub-lesson 3 — Review (cumulative + cross-module M1 review)
// ──────────────────────────────────────────────────────────────────────

export const MOCK_LESSON_JA_M2_D_3: LessonContent = {
  id: "ja-m1-d-3",
  moduleId: "m2",
  courseId: "mock-1",
  languageId: "ja",
  title: "Voiced t → d — Review",
  description: "Cumulative practice on the d-row + a spaced-review tap from M1.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    {
      id: "ja-d3-info-open",
      type: "info",
      title: "Putting it together",
      body:
        "Quick review of everything from the d-row, plus a few words from earlier rows so they stay sharp.",
      variant: "default",
    },

    wordImageMcq(ctxSub3, "ja-d3-mcq-denwa", "でんわ"),
    symbolToSound(ctxSub3, "ja-d3-s2s-de", "で", "de", "voiced て"),
    wordImageMcq(ctxSub3, "ja-d3-mcq-doa", "どあ"),

    // M1 cross-module image_mcq sprinkle.
    wordImageMcq(ctxSub3, "ja-d3-mcq-review-1", REVIEW_WORDS[0].kana),
    wordImageMcq(ctxSub3, "ja-d3-mcq-review-2", REVIEW_WORDS[1].kana),

    // Translate cluster interleaved with speaking + recognition.
    recognition(ctxSub3, "ja-d3-recog-da", "だ", "da", "voiced た"),
    translateMcq("ja-d3-translate-denwa", "telephone", "でんわ", D_WORD_POOL),
    translateMcq("ja-d3-translate-karada", "body", "からだ", D_WORD_POOL),
    speaking("ja-d3-speak-denwa", "でんわ", "telephone"),
    recognition(ctxSub3, "ja-d3-recog-do", "ど", "do", "voiced と"),
    translateMcq("ja-d3-translate-doa", "door", "どあ", D_WORD_POOL),
    translateMcq(
      "ja-d3-translate-review-1",
      REVIEW_WORDS[2].meaningEn,
      REVIEW_WORDS[2].kana,
      SUB3_TRANSLATE_POOL,
    ),
    speaking("ja-d3-speak-karada", "からだ", "body"),
    translateMcq(
      "ja-d3-translate-review-2",
      REVIEW_WORDS[3].meaningEn,
      REVIEW_WORDS[3].kana,
      SUB3_TRANSLATE_POOL,
    ),

    matchKanaToRomaji("ja-d3-match-final", [
      { symbol: "だ", romaji: "da" },
      { symbol: "で", romaji: "de" },
      { symbol: "ど", romaji: "do" },
    ]),
  ],
};
