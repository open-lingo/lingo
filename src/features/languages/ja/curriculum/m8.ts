/**
 * M8 — i-Adjectives + Kanji parallel track begins (2026-05-25).
 *
 * M8 introduces:
 *   - この/その/あの/どの (adnominal demonstratives — "this X / that X / which X")
 *   - い-adjective present affirmative (formal teaching)
 *   - い-adjective negative: 〜くない (たかい → たかくない; いい → よくない)
 *   - と (and/with — noun connector: "コーヒーとパン")
 *
 * Split into 15 sub-lessons (14 drill + 1 story).
 * Each sub-lesson has ~20 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * ID scheme: ja-m8-{n}-{sub} e.g. ja-m8-1-1, ja-m8-1-2
 * Export names: M8_1_1, M8_1_2, M8_2_1, M8_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m8-1, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
  dialogueListen,
  grammarRule,
  infoStep,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  withoutMcqBlocked,
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
} from "@/features/languages/ja/grammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/features/lesson/data/_stepAssertions";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Pool is M1-M7.
// ───────────────────────────────────────────────────────────────────────
const M8_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) => ["m1", "m2", "m3", "m4", "m5", "m6", "m7"].includes(a.fromModule),
  ),
);

// ═══════════════════════════════════════════════════════════════════════
// Grammar rules (shared across sub-lessons)
// ═══════════════════════════════════════════════════════════════════════

const RULE_KONO_SONO = grammarRule({
  id: "ja-m8-rule-kono-sono",
  title: "この / その / あの / どの — pointing at nouns",
  rule:
    "You already know これ/それ/あれ/どれ (standalone pointers). When you point at a specific NOUN, swap to この/その/あの/どの + noun. これ = 'this one' (standalone) → この + noun = 'this [noun].'",
  examples: [
    {
      ja: "この ほんは おもしろいです。",
      romaji: "kono hon wa omoshiroi desu.",
      en: "This book is interesting.",
    },
    {
      ja: "その カメラは たかいです。",
      romaji: "sono kamera wa takai desu.",
      en: "That camera is expensive.",
    },
    {
      ja: "どの ペンが いいですか。",
      romaji: "dono pen ga ii desu ka.",
      en: "Which pen is good?",
    },
  ],
  antiPattern: {
    ja: "これ ほんは おもしろいです。",
    romaji: "kore hon wa omoshiroi desu.",
    en: "(broken — これ is standalone; use この before a noun)",
    why: "これ stands alone ('this one'). Before a noun you need この ('this [noun]').",
  },
  cultureNote:
    "The こそあど system: こ = near speaker, そ = near listener, あ = far from both, ど = question.",
});

const RULE_I_ADJ = grammarRule({
  id: "ja-m8-rule-i-adj",
  title: "い-adjective conjugation",
  rule:
    "い-adjectives end in い and conjugate by replacing that い. Present affirmative: adjective + です (たかいです = 'is expensive'). Present negative: drop い, add くない (たかい → たかくない → たかくないです). Exception: いい ('good') → negative is よくない (not いくない).",
  examples: [
    {
      ja: "この りんごは おいしいです。",
      romaji: "kono ringo wa oishii desu.",
      en: "This apple is delicious.",
    },
    {
      ja: "あの みせは たかくないです。",
      romaji: "ano mise wa takaku nai desu.",
      en: "That shop (over there) isn't expensive.",
    },
    {
      ja: "この テストは よくないです。",
      romaji: "kono tesuto wa yokunai desu.",
      en: "This test isn't good.",
    },
  ],
  antiPattern: {
    ja: "いくないです。",
    romaji: "ikunai desu.",
    en: "(broken — いい is irregular; negative is よくない, not いくない)",
    why: "いい is the only い-adjective where the stem changes: いい → よくない. All others follow the regular pattern (drop い, add くない).",
  },
});

const RULE_TO = grammarRule({
  id: "ja-m8-rule-to",
  title: "と — and / with (noun connector)",
  rule:
    "と connects two nouns: A と B = 'A and B.' Unlike English 'and,' と only links nouns — you can't use it to connect sentences or adjectives.",
  examples: [
    {
      ja: "コーヒーと パンを ください。",
      romaji: "koohii to pan o kudasai.",
      en: "Coffee and bread, please.",
    },
    {
      ja: "ほんと ペンが あります。",
      romaji: "hon to pen ga arimasu.",
      en: "There's a book and a pen.",
    },
  ],
  antiPattern: {
    ja: "おいしいと たかいです。",
    romaji: "oishii to takai desu.",
    en: "(broken — と links nouns, not adjectives)",
    why: "To chain adjectives, use the て-form or くて-form — と is strictly noun-to-noun.",
  },
  cultureNote:
    "と is exhaustive — it means 'A and B (and nothing else).' For open-ended lists ('A, B, etc.') Japanese uses や.",
});

// ═══════════════════════════════════════════════════════════════════════
// M8-1-1 — "Describing things" intro
//   (この/その/あの/どの + first 4 adj: おおきい, ちいさい, たかい, やすい)
// ═══════════════════════════════════════════════════════════════════════

const M8_1_1_REVIEW = pickReviewAtoms("ja-m8-1-1-rev", M8_REVIEW_POOL, 4);

export const M8_1_1: LessonContent = {
  id: "ja-m8-1-1",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Describing things I",
  description:
    "Four size-and-price adjectives + the この/その/あの/どの pointer system for nouns.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-1-1-info-open",
      "Describing things",
      "Four adjectives — big, small, expensive, cheap — plus この/その for 'this X / that X.' You'll be describing things around you in no time.",
    ),
    RULE_KONO_SONO,
    // ── おおきい (big) — build intro ──
    build(
      "ja-m8-1-1-build-ookii",
      "Pick the Japanese word for: Big",
      "おおきい",
      ["おおきい", "ちいさい", "たかい", "やすい"],
      ["おおきい"],
    ),
    listeningCompSentence({
      id: "ja-m8-1-1-lc-ookii",
      audioText: "おおきい",
      correctMeaningEn: "big",
      distractorsEn: ["small", "expensive", "cheap"],
    }),
    // ── ちいさい (small) ──
    build(
      "ja-m8-1-1-build-chiisai",
      "Pick the Japanese word for: Small",
      "ちいさい",
      ["ちいさい", "おおきい", "たかい", "ふるい"],
      ["ちいさい"],
    ),
    vocabMcq(
      "ja-m8-1-1-mcq-chiisai",
      { kana: "ちいさい", meaningEn: "small", emoji: "🤏", fromModule: "m8" },
      M8_REVIEW_POOL,
    ),
    // ── たかい (expensive/tall) ──
    build(
      "ja-m8-1-1-build-takai",
      "Pick the Japanese word for: Expensive",
      "たかい",
      ["たかい", "やすい", "おおきい", "ちいさい"],
      ["たかい"],
    ),
    speaking("ja-m8-1-1-speak-takai", "たかい", "Expensive"),
    // ── やすい (cheap) ──
    build(
      "ja-m8-1-1-build-yasui",
      "Pick the Japanese word for: Cheap",
      "やすい",
      ["やすい", "たかい", "ちいさい", "おおきい"],
      ["やすい"],
    ),
    listeningCompSentence({
      id: "ja-m8-1-1-lc-yasui",
      audioText: "やすい",
      correctMeaningEn: "cheap",
      distractorsEn: ["expensive", "big", "small"],
    }),
    // ── この/その sentence drills ──
    build(
      "ja-m8-1-1-build-kono-kuruma",
      "Say: This car is big.",
      "この くるまは おおきいです",
      ["この", "くるま", "は", "おおきい", "です", "その", "ちいさい"],
      ["この", "くるま", "は", "おおきい", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-1-1-mcq-sono",
      prompt: "Which sentence means 'That camera is expensive.'?",
      correctKana: "その カメラは たかいです。",
      distractorsKana: [
        "この カメラは たかいです。",
        "その カメラは やすいです。",
        "あの カメラは おおきいです。",
      ],
      explanation: "その = that (near listener). たかい = expensive.",
    }),
    cloze(
      "ja-m8-1-1-cloze-ha",
      "この ペン",
      " やすいです。",
      "は",
      ["は", "が", "を", "の"],
      "This pen is cheap.",
      "この ペンは やすいです。",
      "は marks the topic — 'this pen' is what we're talking about.",
    ),
    listeningBuildSentence({
      id: "ja-m8-1-1-lb-chiisai",
      target: "この かばんは ちいさいです",
      tiles: ["この", "かばん", "は", "ちいさい", "です", "おおきい", "その"],
      correctOrder: ["この", "かばん", "は", "ちいさい", "です"],
      promptEn: "Hear it, build it: 'This bag is small.'",
    }),
    selfExplain({
      id: "ja-m8-1-1-self-explain",
      anchorLabel: "You used この in: この ペンは やすいです",
      anchorAudioText: "この ペンは やすいです",
      question: "Why この instead of これ?",
      rule: { text: "この attaches to a noun (この + ペン). これ stands alone without a noun." },
      surface: { text: "この sounds more polite than これ." },
      distractor: { text: "この is for expensive things; これ is for cheap things." },
      ruleExplanation:
        "この/その/あの/どの always need a noun after them. これ/それ/あれ/どれ stand alone.",
    }),
    speaking(
      "ja-m8-1-1-speak-kono",
      "この くるまは おおきいです",
      "This car is big.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-1-1-rev-mcq-1", M8_1_1_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-1-1-rev-lc-1",
      audioText: M8_1_1_REVIEW[1].kana,
      correctMeaningEn: M8_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_1_1_REVIEW[2].meaningEn,
        M8_1_1_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m8-1-1-rev-speak-1", M8_1_1_REVIEW[2].kana, M8_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-1-1-rev", M8_1_1_REVIEW),
    infoStep(
      "ja-m8-1-1-info-end",
      "You can now describe things as big, small, expensive, or cheap",
      "Four adjectives + この/その to point at specific nouns — おおきい, ちいさい, たかい, やすい.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_1_1.steps);
assertAnswerRotation(M8_1_1.steps, 1);
assertNoConsecutiveSame(M8_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-1-2 — "Describing things" practice
//   (drill この/その + adj, review tail from M3-M7)
// ═══════════════════════════════════════════════════════════════════════

const M8_1_2_REVIEW = pickReviewAtoms("ja-m8-1-2-rev", M8_REVIEW_POOL, 4);

export const M8_1_2: LessonContent = {
  id: "ja-m8-1-2",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Describing things II",
  description:
    "Drill この/その/あの/どの with size-and-price adjectives. Interleaved review from M3-M7.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-1-2-info-open",
      "Practice round",
      "Time to drill この/その/あの/どの with the four adjectives you just learned. Mix in some prior vocab for compounding.",
    ),
    // ── あの + adj drills ──
    build(
      "ja-m8-1-2-build-ano-ookii",
      "Say: That hotel (over there) is big.",
      "あの ホテルは おおきいです",
      ["あの", "ホテル", "は", "おおきい", "です", "この", "ちいさい"],
      ["あの", "ホテル", "は", "おおきい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m8-1-2-lc-ano-takai",
      audioText: "あの くるまは たかいです",
      correctMeaningEn: "That car (over there) is expensive.",
      distractorsEn: [
        "This car is expensive.",
        "That car is cheap.",
        "That car (over there) is big.",
      ],
    }),
    cloze(
      "ja-m8-1-2-cloze-ha-1",
      "その かばん",
      " ちいさいです。",
      "は",
      ["は", "が", "を", "に"],
      "That bag is small.",
      "その かばんは ちいさいです。",
      "は marks the topic.",
    ),
    sentenceMcq({
      id: "ja-m8-1-2-mcq-dono",
      prompt: "Which sentence means 'Which pen is cheap?'",
      correctKana: "どの ペンが やすいですか。",
      distractorsKana: [
        "この ペンが やすいですか。",
        "その ペンは やすいです。",
        "どの ペンは たかいですか。",
      ],
      explanation: "どの = which. が marks the subject in a question. やすい = cheap.",
    }),
    // ── どの drills ──
    build(
      "ja-m8-1-2-build-dono-hon",
      "Ask: Which book is interesting?",
      "どの ほんが おもしろいですか",
      ["どの", "ほん", "が", "おもしろい", "です", "か", "この", "は"],
      ["どの", "ほん", "が", "おもしろい", "です", "か"],
    ),
    cloze(
      "ja-m8-1-2-cloze-ga",
      "どの カメラ",
      " たかいですか。",
      "が",
      ["が", "は", "を", "の"],
      "Which camera is expensive?",
      "どの カメラが たかいですか。",
      "が marks the subject in a question — 'which camera' is the unknown.",
    ),
    listeningCompSentence({
      id: "ja-m8-1-2-lc-kono-yasui",
      audioText: "この ペンは やすいです",
      correctMeaningEn: "This pen is cheap.",
      distractorsEn: [
        "That pen is cheap.",
        "This pen is expensive.",
        "This pen is small.",
      ],
    }),
    speaking(
      "ja-m8-1-2-speak-ano",
      "あの ホテルは おおきいです",
      "That hotel (over there) is big.",
    ),
    build(
      "ja-m8-1-2-build-sono-yasui",
      "Say: That bag is cheap.",
      "その かばんは やすいです",
      ["その", "かばん", "は", "やすい", "です", "この", "たかい"],
      ["その", "かばん", "は", "やすい", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-1-2-mcq-kono-chiisai",
      prompt: "Which sentence means 'This car is small.'?",
      correctKana: "この くるまは ちいさいです。",
      distractorsKana: [
        "その くるまは ちいさいです。",
        "この くるまは おおきいです。",
        "あの くるまは ちいさいです。",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m8-1-2-lb-sono-takai",
      target: "その カメラは たかいです",
      tiles: ["その", "カメラ", "は", "たかい", "です", "この", "やすい"],
      correctOrder: ["その", "カメラ", "は", "たかい", "です"],
      promptEn: "Hear it, build it: 'That camera is expensive.'",
    }),
    cloze(
      "ja-m8-1-2-cloze-no",
      "わたし",
      " かばんは おおきいです。",
      "の",
      ["の", "は", "が", "を"],
      "My bag is big.",
      "わたしの かばんは おおきいです。",
      "M4 review: の marks possession — my bag.",
    ),
    selfExplain({
      id: "ja-m8-1-2-self-explain",
      anchorLabel: "You used が in: どの カメラが たかいですか",
      anchorAudioText: "どの カメラが たかいですか",
      question: "Why が instead of は here?",
      rule: { text: "が marks the subject in a question asking 'which one' — the answer is unknown." },
      surface: { text: "が is always used with adjectives." },
      distractor: { text: "が means the camera is far away." },
      ruleExplanation:
        "When asking 'which X is Y?', が marks the unknown subject. は is for topics already established.",
    }),
    speaking(
      "ja-m8-1-2-speak-dono",
      "どの ペンが やすいですか",
      "Which pen is cheap?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-1-2-rev-mcq-1", M8_1_2_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-1-2-rev-lc-1",
      audioText: M8_1_2_REVIEW[1].kana,
      correctMeaningEn: M8_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_1_2_REVIEW[2].meaningEn,
        M8_1_2_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m8-1-2-rev-speak-1", M8_1_2_REVIEW[2].kana, M8_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-1-2-rev", M8_1_2_REVIEW),
    infoStep(
      "ja-m8-1-2-info-end",
      "You can now point at things and describe their size and price",
      "この/その/あの/どの + おおきい, ちいさい, たかい, やすい — combined in real sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_1_2.steps);
assertAnswerRotation(M8_1_2.steps, 2);
assertNoConsecutiveSame(M8_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-2-1 — "Good and bad" intro
//   (いい/よい, わるい, おいしい, まずい + い-adj conjugation rule)
// ═══════════════════════════════════════════════════════════════════════

const M8_2_1_REVIEW = pickReviewAtoms("ja-m8-2-1-rev", M8_REVIEW_POOL, 4);

export const M8_2_1: LessonContent = {
  id: "ja-m8-2-1",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Good and bad I",
  description:
    "Four quality adjectives — good, bad, delicious, bad-tasting — plus the い-adjective conjugation rule.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-2-1-info-open",
      "Good, bad, delicious, disgusting",
      "Four adjectives for quality judgments. Plus: the rule for making any い-adjective negative — drop い, add くない.",
    ),
    RULE_I_ADJ,
    // ── いい (good) ──
    build(
      "ja-m8-2-1-build-ii",
      "Pick the Japanese word for: Good",
      "いい",
      ["いい", "わるい", "おいしい", "まずい"],
      ["いい"],
    ),
    listeningCompSentence({
      id: "ja-m8-2-1-lc-ii",
      audioText: "この ほんは いいです",
      correctMeaningEn: "This book is good.",
      distractorsEn: [
        "This book is bad.",
        "That book is good.",
        "This book is interesting.",
      ],
    }),
    // ── わるい (bad) ──
    build(
      "ja-m8-2-1-build-warui",
      "Pick the Japanese word for: Bad",
      "わるい",
      ["わるい", "いい", "まずい", "ふるい"],
      ["わるい"],
    ),
    vocabMcq(
      "ja-m8-2-1-mcq-warui",
      { kana: "わるい", meaningEn: "bad", emoji: "👎", fromModule: "m8" },
      M8_REVIEW_POOL,
    ),
    // ── おいしい (delicious) ──
    build(
      "ja-m8-2-1-build-oishii",
      "Pick the Japanese word for: Delicious",
      "おいしい",
      ["おいしい", "まずい", "いい", "たかい"],
      ["おいしい"],
    ),
    speaking("ja-m8-2-1-speak-oishii", "おいしい", "Delicious"),
    // ── まずい (bad-tasting) ──
    build(
      "ja-m8-2-1-build-mazui",
      "Pick the Japanese word for: Bad-tasting",
      "まずい",
      ["まずい", "おいしい", "わるい", "やすい"],
      ["まずい"],
    ),
    listeningCompSentence({
      id: "ja-m8-2-1-lc-mazui",
      audioText: "まずい",
      correctMeaningEn: "bad-tasting",
      distractorsEn: ["delicious", "bad", "cheap"],
    }),
    // ── い-adj negative drills ──
    sentenceMcq({
      id: "ja-m8-2-1-mcq-takakunai",
      prompt: "Which sentence means 'This car isn't expensive.'?",
      correctKana: "この くるまは たかくないです。",
      distractorsKana: [
        "この くるまは たかいです。",
        "その くるまは やすいです。",
        "この くるまは おおきくないです。",
      ],
      explanation: "たかい → たかくない (drop い, add くない). Not expensive.",
    }),
    build(
      "ja-m8-2-1-build-oishikunai",
      "Say: This isn't delicious.",
      "これは おいしくないです",
      ["これ", "は", "おいしくない", "です", "おいしい", "まずい"],
      ["これ", "は", "おいしくない", "です"],
    ),
    cloze(
      "ja-m8-2-1-cloze-ha",
      "この コーヒー",
      " いいです。",
      "は",
      ["は", "が", "を", "の"],
      "This coffee is good.",
      "この コーヒーは いいです。",
      "は marks the topic.",
    ),
    listeningBuildSentence({
      id: "ja-m8-2-1-lb-yokunai",
      target: "この ほんは よくないです",
      tiles: ["この", "ほん", "は", "よくない", "です", "いい", "わるい"],
      correctOrder: ["この", "ほん", "は", "よくない", "です"],
      promptEn: "Hear it, build it: 'This book isn't good.'",
    }),
    selfExplain({
      id: "ja-m8-2-1-self-explain",
      anchorLabel: "The negative of いい is よくない, not いくない",
      anchorAudioText: "よくないです",
      question: "Why is the negative of いい written よくない?",
      rule: { text: "いい is irregular — its negative stem comes from よい, so it's よくない." },
      surface: { text: "くない always replaces the last two characters." },
      distractor: { text: "よ is the polite prefix for negative adjectives." },
      ruleExplanation:
        "いい is the only irregular い-adjective. Its 'real' form is よい, so the negative follows: よい → よくない.",
    }),
    speaking(
      "ja-m8-2-1-speak-yokunai",
      "この ほんは よくないです",
      "This book isn't good.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-2-1-rev-mcq-1", M8_2_1_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-2-1-rev-lc-1",
      audioText: M8_2_1_REVIEW[1].kana,
      correctMeaningEn: M8_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_2_1_REVIEW[2].meaningEn,
        M8_2_1_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m8-2-1-rev-speak-1", M8_2_1_REVIEW[2].kana, M8_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-2-1-rev", M8_2_1_REVIEW),
    infoStep(
      "ja-m8-2-1-info-end",
      "You can now say whether things are good, bad, delicious, or disgusting",
      "いい, わるい, おいしい, まずい — plus the い → くない negative pattern. Remember: いい → よくない!",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_2_1.steps);
assertAnswerRotation(M8_2_1.steps, 1);
assertNoConsecutiveSame(M8_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-2-2 — "Good and bad" practice
//   (い-adj present/negative drill)
// ═══════════════════════════════════════════════════════════════════════

const M8_2_2_REVIEW = pickReviewAtoms("ja-m8-2-2-rev", M8_REVIEW_POOL, 4);

export const M8_2_2: LessonContent = {
  id: "ja-m8-2-2",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Good and bad II",
  description:
    "Drill い-adjective present and negative forms. Heavy rotation on the いい → よくない exception.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-2-2-info-open",
      "Positive and negative drills",
      "Time to lock in the い-adjective pattern. Positive: adjective + です. Negative: drop い, add くない. And that tricky exception: いい → よくない.",
    ),
    // ── Mixed positive/negative drills ──
    sentenceMcq({
      id: "ja-m8-2-2-mcq-warui",
      prompt: "Which sentence means 'That isn't bad.'?",
      correctKana: "それは わるくないです。",
      distractorsKana: [
        "それは わるいです。",
        "これは わるくないです。",
        "それは よくないです。",
      ],
      explanation: "わるい → わるくない. Regular pattern: drop い, add くない.",
    }),
    build(
      "ja-m8-2-2-build-mazukunai",
      "Say: This isn't bad-tasting.",
      "これは まずくないです",
      ["これ", "は", "まずくない", "です", "おいしくない", "まずい"],
      ["これ", "は", "まずくない", "です"],
    ),
    listeningCompSentence({
      id: "ja-m8-2-2-lc-oishii",
      audioText: "この ラーメンは おいしいです",
      correctMeaningEn: "This ramen is delicious.",
      distractorsEn: [
        "This ramen isn't delicious.",
        "That ramen is delicious.",
        "This ramen is bad-tasting.",
      ],
    }),
    cloze(
      "ja-m8-2-2-cloze-ha-1",
      "この すし",
      " おいしいです。",
      "は",
      ["は", "が", "を", "と"],
      "This sushi is delicious.",
      "この すしは おいしいです。",
      "は marks the topic.",
    ),
    build(
      "ja-m8-2-2-build-yokunai-test",
      "Say: This test isn't good.",
      "この テストは よくないです",
      ["この", "テスト", "は", "よくない", "です", "いい", "わるい"],
      ["この", "テスト", "は", "よくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-2-2-lb-warui",
      target: "あの みせは わるいです",
      tiles: ["あの", "みせ", "は", "わるい", "です", "いい", "この"],
      correctOrder: ["あの", "みせ", "は", "わるい", "です"],
      promptEn: "Hear it, build it: 'That shop (over there) is bad.'",
    }),
    sentenceMcq({
      id: "ja-m8-2-2-mcq-yokunai",
      prompt: "What is the negative of いいです?",
      correctKana: "よくないです",
      distractorsKana: [
        "いくないです",
        "いいくないです",
        "わるいです",
      ],
      explanation: "いい is irregular. Its negative comes from よい → よくない.",
    }),
    cloze(
      "ja-m8-2-2-cloze-no",
      "ともだち",
      " くるまは いいです。",
      "の",
      ["の", "は", "が", "を"],
      "My friend's car is good.",
      "ともだちの くるまは いいです。",
      "の marks possession — friend's car.",
    ),
    speaking(
      "ja-m8-2-2-speak-oishikunai",
      "この パンは おいしくないです",
      "This bread isn't delicious.",
    ),
    build(
      "ja-m8-2-2-build-ii-sensei",
      "Say: That teacher is good.",
      "その せんせいは いいです",
      ["その", "せんせい", "は", "いい", "です", "わるい", "この"],
      ["その", "せんせい", "は", "いい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m8-2-2-lc-yokunai-kamera",
      audioText: "この カメラは よくないです",
      correctMeaningEn: "This camera isn't good.",
      distractorsEn: [
        "This camera is good.",
        "That camera isn't good.",
        "This camera is expensive.",
      ],
    }),
    cloze(
      "ja-m8-2-2-cloze-ha-2",
      "あの ホテル",
      " よくないです。",
      "は",
      ["は", "が", "を", "の"],
      "That hotel (over there) isn't good.",
      "あの ホテルは よくないです。",
      "は marks the topic.",
    ),
    selfExplain({
      id: "ja-m8-2-2-self-explain",
      anchorLabel: "おいしい → おいしくない, but いい → よくない",
      anchorAudioText: "よくないです",
      question: "How do you form the negative of a regular い-adjective like おいしい?",
      rule: { text: "Drop the final い and add くない: おいしい → おいしくない." },
      surface: { text: "Add くない to the whole word without changing anything." },
      distractor: { text: "Replace い with ない: おいしい → おいしない." },
      ruleExplanation:
        "Regular い-adjectives: drop い, add くない. Only いい is irregular (→ よくない).",
    }),
    speaking(
      "ja-m8-2-2-speak-warukun",
      "それは わるくないです",
      "That isn't bad.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-2-2-rev-mcq-1", M8_2_2_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-2-2-rev-lc-1",
      audioText: M8_2_2_REVIEW[1].kana,
      correctMeaningEn: M8_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_2_2_REVIEW[2].meaningEn,
        M8_2_2_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[3].meaningEn,
      ],
    }),
    speaking("ja-m8-2-2-rev-speak-1", M8_2_2_REVIEW[2].kana, M8_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-2-2-rev", M8_2_2_REVIEW),
    infoStep(
      "ja-m8-2-2-info-end",
      "You can now flip any い-adjective between positive and negative",
      "おいしい → おいしくない, わるい → わるくない, and the big exception: いい → よくない.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_2_2.steps);
assertAnswerRotation(M8_2_2.steps, 2);
assertNoConsecutiveSame(M8_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-3-1 — "Hot and cold" intro
//   (あつい, さむい, つめたい, あたたかい + と particle)
// ═══════════════════════════════════════════════════════════════════════

const M8_3_1_REVIEW = pickReviewAtoms("ja-m8-3-1-rev", M8_REVIEW_POOL, 4);

export const M8_3_1: LessonContent = {
  id: "ja-m8-3-1",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Hot and cold I",
  description:
    "Four temperature adjectives plus the と particle for connecting nouns.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-3-1-info-open",
      "Temperature words + a new particle",
      "Hot, cold (weather), cold (touch), warm — plus と, the particle that connects nouns like 'and.'",
    ),
    RULE_TO,
    // ── あつい (hot) ──
    build(
      "ja-m8-3-1-build-atsui",
      "Pick the Japanese word for: Hot",
      "あつい",
      ["あつい", "さむい", "つめたい", "あたたかい"],
      ["あつい"],
    ),
    listeningCompSentence({
      id: "ja-m8-3-1-lc-atsui",
      audioText: "あつい",
      correctMeaningEn: "hot",
      distractorsEn: ["cold (weather)", "cold (touch)", "warm"],
    }),
    // ── さむい (cold-weather) ──
    build(
      "ja-m8-3-1-build-samui",
      "Pick the Japanese word for: Cold (weather)",
      "さむい",
      ["さむい", "あつい", "つめたい", "やすい"],
      ["さむい"],
    ),
    vocabMcq(
      "ja-m8-3-1-mcq-samui",
      { kana: "さむい", meaningEn: "cold (weather)", emoji: "🥶", fromModule: "m8" },
      M8_REVIEW_POOL,
    ),
    // ── つめたい (cold-touch) ──
    build(
      "ja-m8-3-1-build-tsumetai",
      "Pick the Japanese word for: Cold (to touch)",
      "つめたい",
      ["つめたい", "さむい", "あたたかい", "ちいさい"],
      ["つめたい"],
    ),
    speaking("ja-m8-3-1-speak-tsumetai", "つめたい", "Cold (to touch)"),
    // ── あたたかい (warm) ──
    build(
      "ja-m8-3-1-build-atatakai",
      "Pick the Japanese word for: Warm",
      "あたたかい",
      ["あたたかい", "あつい", "つめたい", "さむい"],
      ["あたたかい"],
    ),
    listeningCompSentence({
      id: "ja-m8-3-1-lc-atatakai",
      audioText: "あたたかい",
      correctMeaningEn: "warm",
      distractorsEn: ["hot", "cold (weather)", "cold (touch)"],
    }),
    // ── と particle drills ──
    cloze(
      "ja-m8-3-1-cloze-to",
      "コーヒー",
      " パンを ください。",
      "と",
      ["と", "は", "が", "の"],
      "Coffee and bread, please.",
      "コーヒーと パンを ください。",
      "と connects two nouns: coffee AND bread.",
    ),
    build(
      "ja-m8-3-1-build-to-hon",
      "Say: There's a book and a pen.",
      "ほんと ペンが あります",
      ["ほん", "と", "ペン", "が", "あります", "は", "の"],
      ["ほん", "と", "ペン", "が", "あります"],
    ),
    sentenceMcq({
      id: "ja-m8-3-1-mcq-atsui",
      prompt: "Which sentence means 'This coffee is hot.'?",
      correctKana: "この コーヒーは あついです。",
      distractorsKana: [
        "この コーヒーは つめたいです。",
        "その コーヒーは あついです。",
        "この コーヒーは あたたかいです。",
      ],
      explanation: "あつい = hot. この = this.",
    }),
    listeningBuildSentence({
      id: "ja-m8-3-1-lb-tsumetai",
      target: "この みずは つめたいです",
      tiles: ["この", "みず", "は", "つめたい", "です", "あつい", "あたたかい"],
      correctOrder: ["この", "みず", "は", "つめたい", "です"],
      promptEn: "Hear it, build it: 'This water is cold (to touch).'",
    }),
    selfExplain({
      id: "ja-m8-3-1-self-explain",
      anchorLabel: "You used と in: コーヒーと パンを ください",
      anchorAudioText: "コーヒーと パンを ください",
      question: "What does と do in this sentence?",
      rule: { text: "と connects two nouns — 'coffee AND bread.'" },
      surface: { text: "と makes the sentence polite." },
      distractor: { text: "と marks the object of the verb." },
      ruleExplanation:
        "と is the noun connector — A と B = 'A and B.' It only connects nouns, not adjectives or sentences.",
    }),
    speaking(
      "ja-m8-3-1-speak-atsui",
      "この コーヒーは あついです",
      "This coffee is hot.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-3-1-rev-mcq-1", M8_3_1_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-3-1-rev-lc-1",
      audioText: M8_3_1_REVIEW[1].kana,
      correctMeaningEn: M8_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_3_1_REVIEW[2].meaningEn,
        M8_3_1_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m8-3-1-rev-speak-1", M8_3_1_REVIEW[2].kana, M8_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-3-1-rev", M8_3_1_REVIEW),
    infoStep(
      "ja-m8-3-1-info-end",
      "You can now describe temperature and connect nouns with と",
      "あつい, さむい, つめたい, あたたかい — plus と for 'A and B.'",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_3_1.steps);
assertAnswerRotation(M8_3_1.steps, 1);
assertNoConsecutiveSame(M8_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-3-2 — "Hot and cold" practice
//   (と connector drill + adj review)
// ═══════════════════════════════════════════════════════════════════════

const M8_3_2_REVIEW = pickReviewAtoms("ja-m8-3-2-rev", M8_REVIEW_POOL, 4);

export const M8_3_2: LessonContent = {
  id: "ja-m8-3-2",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Hot and cold II",
  description:
    "Drill the と connector and temperature adjectives in mixed sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-3-2-info-open",
      "Mix and match",
      "と to connect nouns, temperature adjectives to describe them. Let's combine everything.",
    ),
    build(
      "ja-m8-3-2-build-to-sushi",
      "Say: Sushi and ramen, please.",
      "すしと ラーメンを ください",
      ["すし", "と", "ラーメン", "を", "ください", "パン", "は"],
      ["すし", "と", "ラーメン", "を", "ください"],
    ),
    cloze(
      "ja-m8-3-2-cloze-to-1",
      "おちゃ",
      " みずを ください。",
      "と",
      ["と", "は", "が", "の"],
      "Tea and water, please.",
      "おちゃと みずを ください。",
      "と connects tea AND water.",
    ),
    sentenceMcq({
      id: "ja-m8-3-2-mcq-samui",
      prompt: "Which sentence means 'Today is cold (weather).'?",
      correctKana: "きょうは さむいです。",
      distractorsKana: [
        "きょうは あついです。",
        "きょうは つめたいです。",
        "きょうは あたたかいです。",
      ],
      explanation: "さむい = cold (weather). つめたい is cold to the touch, not weather.",
    }),
    listeningCompSentence({
      id: "ja-m8-3-2-lc-atatakai",
      audioText: "この おちゃは あたたかいです",
      correctMeaningEn: "This tea is warm.",
      distractorsEn: [
        "This tea is hot.",
        "This tea is cold.",
        "That tea is warm.",
      ],
    }),
    build(
      "ja-m8-3-2-build-samukunai",
      "Say: Today isn't cold.",
      "きょうは さむくないです",
      ["きょう", "は", "さむくない", "です", "さむい", "あつい"],
      ["きょう", "は", "さむくない", "です"],
    ),
    cloze(
      "ja-m8-3-2-cloze-ha",
      "この みず",
      " つめたいです。",
      "は",
      ["は", "と", "が", "を"],
      "This water is cold (to touch).",
      "この みずは つめたいです。",
      "は marks the topic.",
    ),
    listeningBuildSentence({
      id: "ja-m8-3-2-lb-atsui",
      target: "この ラーメンは あついです",
      tiles: ["この", "ラーメン", "は", "あつい", "です", "つめたい", "おいしい"],
      correctOrder: ["この", "ラーメン", "は", "あつい", "です"],
      promptEn: "Hear it, build it: 'This ramen is hot.'",
    }),
    speaking(
      "ja-m8-3-2-speak-atatakai",
      "この おちゃは あたたかいです",
      "This tea is warm.",
    ),
    sentenceMcq({
      id: "ja-m8-3-2-mcq-tsumetakunai",
      prompt: "Which sentence means 'This water isn't cold.'?",
      correctKana: "この みずは つめたくないです。",
      distractorsKana: [
        "この みずは つめたいです。",
        "この みずは あついです。",
        "その みずは つめたくないです。",
      ],
      explanation: "つめたい → つめたくない. Regular い-adjective negative pattern.",
    }),
    build(
      "ja-m8-3-2-build-to-juice",
      "Say: Coffee and juice.",
      "コーヒーと ジュース",
      ["コーヒー", "と", "ジュース", "みず", "おちゃ", "は"],
      ["コーヒー", "と", "ジュース"],
    ),
    cloze(
      "ja-m8-3-2-cloze-to-2",
      "ペン",
      " ほんが あります。",
      "と",
      ["と", "は", "の", "が"],
      "There's a pen and a book.",
      "ペンと ほんが あります。",
      "と connects pen AND book.",
    ),
    listeningCompSentence({
      id: "ja-m8-3-2-lc-atsukunai",
      audioText: "この コーヒーは あつくないです",
      correctMeaningEn: "This coffee isn't hot.",
      distractorsEn: [
        "This coffee is hot.",
        "This coffee isn't cold.",
        "That coffee isn't hot.",
      ],
    }),
    selfExplain({
      id: "ja-m8-3-2-self-explain",
      anchorLabel: "さむい is weather-cold, つめたい is touch-cold",
      anchorAudioText: "さむいです",
      question: "When would you use さむい instead of つめたい?",
      rule: { text: "さむい describes the weather or air temperature. つめたい describes a cold object you can feel." },
      surface: { text: "さむい is more formal than つめたい." },
      distractor: { text: "さむい is for drinks; つめたい is for food." },
      ruleExplanation:
        "さむい = atmospheric cold (weather). つめたい = tactile cold (cold water, cold hands).",
    }),
    speaking(
      "ja-m8-3-2-speak-to",
      "コーヒーと パンを ください",
      "Coffee and bread, please.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-3-2-rev-mcq-1", M8_3_2_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-3-2-rev-lc-1",
      audioText: M8_3_2_REVIEW[1].kana,
      correctMeaningEn: M8_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_3_2_REVIEW[2].meaningEn,
        M8_3_2_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m8-3-2-rev-speak-1", M8_3_2_REVIEW[2].kana, M8_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-3-2-rev", M8_3_2_REVIEW),
    infoStep(
      "ja-m8-3-2-info-end",
      "You can now talk about temperature and order multiple things with と",
      "さむい vs つめたい, あつい vs あたたかい — and A と B for 'A and B.'",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_3_2.steps);
assertAnswerRotation(M8_3_2.steps, 2);
assertNoConsecutiveSame(M8_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-4-1 — "Long and short" intro
//   (ながい, みじかい, おもしろい, つまらない)
// ═══════════════════════════════════════════════════════════════════════

const M8_4_1_REVIEW = pickReviewAtoms("ja-m8-4-1-rev", M8_REVIEW_POOL, 4);

export const M8_4_1: LessonContent = {
  id: "ja-m8-4-1",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Long and short I",
  description:
    "Four new adjectives — long, short, interesting, boring — in context with この/その.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-4-1-info-open",
      "Length and interest",
      "Two pairs of opposites: ながい/みじかい (long/short) and おもしろい/つまらない (interesting/boring).",
    ),
    // ── ながい (long) ──
    build(
      "ja-m8-4-1-build-nagai",
      "Pick the Japanese word for: Long",
      "ながい",
      ["ながい", "みじかい", "おもしろい", "つまらない"],
      ["ながい"],
    ),
    listeningCompSentence({
      id: "ja-m8-4-1-lc-nagai",
      audioText: "ながい",
      correctMeaningEn: "long",
      distractorsEn: ["short", "interesting", "boring"],
    }),
    // ── みじかい (short) ──
    build(
      "ja-m8-4-1-build-mijikai",
      "Pick the Japanese word for: Short",
      "みじかい",
      ["みじかい", "ながい", "ちいさい", "おそい"],
      ["みじかい"],
    ),
    vocabMcq(
      "ja-m8-4-1-mcq-mijikai",
      { kana: "みじかい", meaningEn: "short", emoji: "📏", fromModule: "m8" },
      M8_REVIEW_POOL,
    ),
    // ── おもしろい (interesting) ──
    build(
      "ja-m8-4-1-build-omoshiroi",
      "Pick the Japanese word for: Interesting",
      "おもしろい",
      ["おもしろい", "つまらない", "ながい", "いい"],
      ["おもしろい"],
    ),
    speaking("ja-m8-4-1-speak-omoshiroi", "おもしろい", "Interesting"),
    // ── つまらない (boring) ──
    build(
      "ja-m8-4-1-build-tsumaranai",
      "Pick the Japanese word for: Boring",
      "つまらない",
      ["つまらない", "おもしろい", "みじかい", "まずい"],
      ["つまらない"],
    ),
    listeningCompSentence({
      id: "ja-m8-4-1-lc-tsumaranai",
      audioText: "つまらない",
      correctMeaningEn: "boring",
      distractorsEn: ["interesting", "long", "short"],
    }),
    // ── Sentence drills ──
    build(
      "ja-m8-4-1-build-kono-nagai",
      "Say: This movie is long.",
      "この えいがは ながいです",
      ["この", "えいが", "は", "ながい", "です", "みじかい", "その"],
      ["この", "えいが", "は", "ながい", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-4-1-mcq-omoshiroi",
      prompt: "Which sentence means 'That book is interesting.'?",
      correctKana: "その ほんは おもしろいです。",
      distractorsKana: [
        "その ほんは つまらないです。",
        "この ほんは おもしろいです。",
        "その ほんは ながいです。",
      ],
      explanation: "その = that. おもしろい = interesting.",
    }),
    cloze(
      "ja-m8-4-1-cloze-ha",
      "あの えいが",
      " つまらないです。",
      "は",
      ["は", "が", "を", "と"],
      "That movie (over there) is boring.",
      "あの えいがは つまらないです。",
      "は marks the topic.",
    ),
    listeningCompSentence({
      id: "ja-m8-4-1-lc-mijikai-sentence",
      audioText: "この しんぶんは みじかいです",
      correctMeaningEn: "This newspaper is short.",
      distractorsEn: [
        "This newspaper is long.",
        "That newspaper is short.",
        "This newspaper is interesting.",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m8-4-1-lb-omoshiroi",
      target: "この ほんは おもしろいです",
      tiles: ["この", "ほん", "は", "おもしろい", "です", "つまらない", "ながい"],
      correctOrder: ["この", "ほん", "は", "おもしろい", "です"],
      promptEn: "Hear it, build it: 'This book is interesting.'",
    }),
    selfExplain({
      id: "ja-m8-4-1-self-explain",
      anchorLabel: "つまらない ends in ない — is it already negative?",
      anchorAudioText: "つまらないです",
      question: "Is つまらない the negative form of another adjective?",
      rule: { text: "No — つまらない is its own adjective meaning 'boring.' The ない is part of the word, not a negation." },
      surface: { text: "Yes — つまらない is the negative of つまる." },
      distractor: { text: "つまらない is the negative of おもしろい." },
      ruleExplanation:
        "つまらない looks like a negative form, but it's a standalone い-adjective. Its own negative would be つまらなくない ('not boring').",
    }),
    speaking(
      "ja-m8-4-1-speak-tsumaranai",
      "あの えいがは つまらないです",
      "That movie (over there) is boring.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-4-1-rev-mcq-1", M8_4_1_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-4-1-rev-lc-1",
      audioText: M8_4_1_REVIEW[1].kana,
      correctMeaningEn: M8_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_4_1_REVIEW[2].meaningEn,
        M8_4_1_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m8-4-1-rev-speak-1", M8_4_1_REVIEW[2].kana, M8_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-4-1-rev", M8_4_1_REVIEW),
    infoStep(
      "ja-m8-4-1-info-end",
      "You can now describe length and how interesting things are",
      "ながい, みじかい, おもしろい, つまらない — used with この/その in real sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_4_1.steps);
assertAnswerRotation(M8_4_1.steps, 1);
assertNoConsecutiveSame(M8_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-4-2 — "Long and short" practice
//   (mixed adj + この/その drill)
// ═══════════════════════════════════════════════════════════════════════

const M8_4_2_REVIEW = pickReviewAtoms("ja-m8-4-2-rev", M8_REVIEW_POOL, 4);

export const M8_4_2: LessonContent = {
  id: "ja-m8-4-2",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Long and short II",
  description:
    "Mixed adjective drill combining length, interest, size, and price with demonstratives.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-4-2-info-open",
      "Mix it all together",
      "Eight adjectives so far — let's interleave them with この/その/あの/どの. Can you keep them straight?",
    ),
    sentenceMcq({
      id: "ja-m8-4-2-mcq-nagakunai",
      prompt: "Which sentence means 'This movie isn't long.'?",
      correctKana: "この えいがは ながくないです。",
      distractorsKana: [
        "この えいがは ながいです。",
        "その えいがは みじかいです。",
        "この えいがは つまらないです。",
      ],
      explanation: "ながい → ながくない. Regular い-adjective negative.",
    }),
    build(
      "ja-m8-4-2-build-omoshiroku",
      "Say: That book isn't interesting.",
      "その ほんは おもしろくないです",
      ["その", "ほん", "は", "おもしろくない", "です", "おもしろい", "この"],
      ["その", "ほん", "は", "おもしろくない", "です"],
    ),
    listeningCompSentence({
      id: "ja-m8-4-2-lc-chiisai-kaban",
      audioText: "あの かばんは ちいさいです",
      correctMeaningEn: "That bag (over there) is small.",
      distractorsEn: [
        "This bag is small.",
        "That bag (over there) is big.",
        "That bag is cheap.",
      ],
    }),
    cloze(
      "ja-m8-4-2-cloze-ha-1",
      "どの ほん",
      " おもしろいですか。",
      "が",
      ["が", "は", "を", "と"],
      "Which book is interesting?",
      "どの ほんが おもしろいですか。",
      "が marks the unknown subject in a 'which' question.",
    ),
    build(
      "ja-m8-4-2-build-takai-hotel",
      "Say: That hotel is expensive.",
      "あの ホテルは たかいです",
      ["あの", "ホテル", "は", "たかい", "です", "やすい", "この"],
      ["あの", "ホテル", "は", "たかい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-4-2-lb-mijikai-shinbun",
      target: "この しんぶんは みじかいです",
      tiles: ["この", "しんぶん", "は", "みじかい", "です", "ながい", "その"],
      correctOrder: ["この", "しんぶん", "は", "みじかい", "です"],
      promptEn: "Hear it, build it: 'This newspaper is short.'",
    }),
    sentenceMcq({
      id: "ja-m8-4-2-mcq-tsumaranai-movie",
      prompt: "Which sentence means 'Which movie is boring?'",
      correctKana: "どの えいがが つまらないですか。",
      distractorsKana: [
        "この えいがが つまらないですか。",
        "どの えいがは おもしろいですか。",
        "あの えいがが つまらないです。",
      ],
      explanation: "どの = which. つまらない = boring. が for the unknown subject + か for question.",
    }),
    cloze(
      "ja-m8-4-2-cloze-to",
      "ほん",
      " しんぶんが あります。",
      "と",
      ["と", "は", "の", "が"],
      "There's a book and a newspaper.",
      "ほんと しんぶんが あります。",
      "と connects book AND newspaper.",
    ),
    listeningCompSentence({
      id: "ja-m8-4-2-lc-yasui-pen",
      audioText: "この ペンは やすいです",
      correctMeaningEn: "This pen is cheap.",
      distractorsEn: [
        "This pen is expensive.",
        "That pen is cheap.",
        "This pen is short.",
      ],
    }),
    speaking(
      "ja-m8-4-2-speak-nagakunai",
      "この えいがは ながくないです",
      "This movie isn't long.",
    ),
    build(
      "ja-m8-4-2-build-dono-yasui",
      "Ask: Which camera is cheap?",
      "どの カメラが やすいですか",
      ["どの", "カメラ", "が", "やすい", "です", "か", "は", "この"],
      ["どの", "カメラ", "が", "やすい", "です", "か"],
    ),
    cloze(
      "ja-m8-4-2-cloze-ha-2",
      "その しんぶん",
      " ながいです。",
      "は",
      ["は", "が", "と", "の"],
      "That newspaper is long.",
      "その しんぶんは ながいです。",
      "は marks the topic.",
    ),
    selfExplain({
      id: "ja-m8-4-2-self-explain",
      anchorLabel: "ながい → ながくない, おもしろい → おもしろくない",
      anchorAudioText: "ながくないです",
      question: "What's the pattern for making い-adjective negatives?",
      rule: { text: "Drop the final い and add くない." },
      surface: { text: "Add ない after the whole adjective." },
      distractor: { text: "Change い to じゃない." },
      ruleExplanation:
        "For all regular い-adjectives: drop い, add くない. ながい → ながくない, おもしろい → おもしろくない.",
    }),
    speaking(
      "ja-m8-4-2-speak-omoshiroi",
      "この ほんは おもしろいです",
      "This book is interesting.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-4-2-rev-mcq-1", M8_4_2_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-4-2-rev-lc-1",
      audioText: M8_4_2_REVIEW[1].kana,
      correctMeaningEn: M8_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_4_2_REVIEW[2].meaningEn,
        M8_4_2_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[7].meaningEn,
      ],
    }),
    speaking("ja-m8-4-2-rev-speak-1", M8_4_2_REVIEW[2].kana, M8_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-4-2-rev", M8_4_2_REVIEW),
    infoStep(
      "ja-m8-4-2-info-end",
      "You can now mix eight adjectives with four demonstratives",
      "Size, price, quality, temperature, length, interest — all working with この/その/あの/どの.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_4_2.steps);
assertAnswerRotation(M8_4_2.steps, 2);
assertNoConsecutiveSame(M8_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-5-1 — "Hard and easy" intro
//   (むずかしい, やさしい, はやい, おそい)
// ═══════════════════════════════════════════════════════════════════════

const M8_5_1_REVIEW = pickReviewAtoms("ja-m8-5-1-rev", M8_REVIEW_POOL, 4);

export const M8_5_1: LessonContent = {
  id: "ja-m8-5-1",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Hard and easy I",
  description:
    "Four difficulty-and-speed adjectives — difficult, easy/kind, fast/early, slow/late.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-5-1-info-open",
      "Difficulty and speed",
      "むずかしい (difficult), やさしい (easy/kind), はやい (fast/early), おそい (slow/late). Two pairs of opposites.",
    ),
    // ── むずかしい (difficult) ──
    build(
      "ja-m8-5-1-build-muzukashii",
      "Pick the Japanese word for: Difficult",
      "むずかしい",
      ["むずかしい", "やさしい", "はやい", "おそい"],
      ["むずかしい"],
    ),
    listeningCompSentence({
      id: "ja-m8-5-1-lc-muzukashii",
      audioText: "むずかしい",
      correctMeaningEn: "difficult",
      distractorsEn: ["easy", "fast", "slow"],
    }),
    // ── やさしい (easy/kind) ──
    build(
      "ja-m8-5-1-build-yasashii",
      "Pick the Japanese word for: Easy / Kind",
      "やさしい",
      ["やさしい", "むずかしい", "やすい", "いい"],
      ["やさしい"],
    ),
    vocabMcq(
      "ja-m8-5-1-mcq-yasashii",
      { kana: "やさしい", meaningEn: "easy/kind", emoji: "😊", fromModule: "m8" },
      M8_REVIEW_POOL,
    ),
    // ── はやい (fast/early) ──
    build(
      "ja-m8-5-1-build-hayai",
      "Pick the Japanese word for: Fast / Early",
      "はやい",
      ["はやい", "おそい", "ながい", "みじかい"],
      ["はやい"],
    ),
    speaking("ja-m8-5-1-speak-hayai", "はやい", "Fast / Early"),
    // ── おそい (slow/late) ──
    build(
      "ja-m8-5-1-build-osoi",
      "Pick the Japanese word for: Slow / Late",
      "おそい",
      ["おそい", "はやい", "おおきい", "ふるい"],
      ["おそい"],
    ),
    listeningCompSentence({
      id: "ja-m8-5-1-lc-osoi",
      audioText: "おそい",
      correctMeaningEn: "slow / late",
      distractorsEn: ["fast / early", "difficult", "easy"],
    }),
    // ── Sentence drills ──
    build(
      "ja-m8-5-1-build-kono-test",
      "Say: This test is difficult.",
      "この テストは むずかしいです",
      ["この", "テスト", "は", "むずかしい", "です", "やさしい", "その"],
      ["この", "テスト", "は", "むずかしい", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-5-1-mcq-yasashii-sensei",
      prompt: "Which sentence means 'That teacher is kind.'?",
      correctKana: "その せんせいは やさしいです。",
      distractorsKana: [
        "この せんせいは やさしいです。",
        "その せんせいは むずかしいです。",
        "その せんせいは いいです。",
      ],
      explanation: "やさしい can mean 'easy' or 'kind' depending on context. For a person, it's 'kind.'",
    }),
    cloze(
      "ja-m8-5-1-cloze-ha",
      "この でんしゃ",
      " はやいです。",
      "は",
      ["は", "が", "を", "の"],
      "This train is fast.",
      "この でんしゃは はやいです。",
      "は marks the topic.",
    ),
    listeningCompSentence({
      id: "ja-m8-5-1-lc-osoi-bus",
      audioText: "この バスは おそいです",
      correctMeaningEn: "This bus is slow.",
      distractorsEn: [
        "This bus is fast.",
        "That bus is slow.",
        "This bus is late.",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m8-5-1-lb-muzukashii",
      target: "この テストは むずかしいです",
      tiles: ["この", "テスト", "は", "むずかしい", "です", "やさしい", "その"],
      correctOrder: ["この", "テスト", "は", "むずかしい", "です"],
      promptEn: "Hear it, build it: 'This test is difficult.'",
    }),
    selfExplain({
      id: "ja-m8-5-1-self-explain",
      anchorLabel: "やさしい means both 'easy' and 'kind'",
      anchorAudioText: "やさしいです",
      question: "How do you know which meaning of やさしい applies?",
      rule: { text: "Context: with a person it means 'kind'; with a task or test it means 'easy.'" },
      surface: { text: "The pronunciation changes depending on meaning." },
      distractor: { text: "Easy is やさしい; kind is a different word." },
      ruleExplanation:
        "やさしい is one word with two senses. Describing a person → kind. Describing a task → easy.",
    }),
    speaking(
      "ja-m8-5-1-speak-muzukashii",
      "この テストは むずかしいです",
      "This test is difficult.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-5-1-rev-mcq-1", M8_5_1_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-5-1-rev-lc-1",
      audioText: M8_5_1_REVIEW[1].kana,
      correctMeaningEn: M8_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_5_1_REVIEW[2].meaningEn,
        M8_5_1_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m8-5-1-rev-speak-1", M8_5_1_REVIEW[2].kana, M8_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-5-1-rev", M8_5_1_REVIEW),
    infoStep(
      "ja-m8-5-1-info-end",
      "You can now describe difficulty and speed",
      "むずかしい, やさしい, はやい, おそい — used naturally with この/その in context.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_5_1.steps);
assertAnswerRotation(M8_5_1.steps, 1);
assertNoConsecutiveSame(M8_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-5-2 — "Hard and easy" practice
//   (interleaved adj negative + と)
// ═══════════════════════════════════════════════════════════════════════

const M8_5_2_REVIEW = pickReviewAtoms("ja-m8-5-2-rev", M8_REVIEW_POOL, 4);

export const M8_5_2: LessonContent = {
  id: "ja-m8-5-2",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Hard and easy II",
  description:
    "Interleaved drill of い-adjective negatives with difficulty/speed vocab, plus と connector review.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-5-2-info-open",
      "Negative forms + と combos",
      "Make difficulty and speed adjectives negative, then mix in と for noun combinations.",
    ),
    sentenceMcq({
      id: "ja-m8-5-2-mcq-muzukashikunai",
      prompt: "Which sentence means 'This test isn't difficult.'?",
      correctKana: "この テストは むずかしくないです。",
      distractorsKana: [
        "この テストは むずかしいです。",
        "この テストは やさしいです。",
        "その テストは むずかしくないです。",
      ],
      explanation: "むずかしい → むずかしくない. Drop い, add くない.",
    }),
    build(
      "ja-m8-5-2-build-hayakunai",
      "Say: This train isn't fast.",
      "この でんしゃは はやくないです",
      ["この", "でんしゃ", "は", "はやくない", "です", "はやい", "おそい"],
      ["この", "でんしゃ", "は", "はやくない", "です"],
    ),
    listeningCompSentence({
      id: "ja-m8-5-2-lc-osokunai",
      audioText: "この バスは おそくないです",
      correctMeaningEn: "This bus isn't slow.",
      distractorsEn: [
        "This bus is slow.",
        "This bus isn't fast.",
        "That bus isn't slow.",
      ],
    }),
    cloze(
      "ja-m8-5-2-cloze-to-1",
      "テスト",
      " しんぶんが あります。",
      "と",
      ["と", "は", "の", "が"],
      "There's a test and a newspaper.",
      "テストと しんぶんが あります。",
      "と connects test AND newspaper.",
    ),
    build(
      "ja-m8-5-2-build-yasashikunai",
      "Say: This test isn't easy.",
      "この テストは やさしくないです",
      ["この", "テスト", "は", "やさしくない", "です", "むずかしい", "やさしい"],
      ["この", "テスト", "は", "やさしくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-5-2-lb-hayai-densha",
      target: "あの でんしゃは はやいです",
      tiles: ["あの", "でんしゃ", "は", "はやい", "です", "おそい", "この"],
      correctOrder: ["あの", "でんしゃ", "は", "はやい", "です"],
      promptEn: "Hear it, build it: 'That train (over there) is fast.'",
    }),
    cloze(
      "ja-m8-5-2-cloze-ha",
      "あの バス",
      " おそいです。",
      "は",
      ["は", "と", "が", "を"],
      "That bus (over there) is slow.",
      "あの バスは おそいです。",
      "は marks the topic.",
    ),
    sentenceMcq({
      id: "ja-m8-5-2-mcq-yasashii-test",
      prompt: "Which sentence means 'Which test is easy?'",
      correctKana: "どの テストが やさしいですか。",
      distractorsKana: [
        "この テストが やさしいですか。",
        "どの テストは むずかしいですか。",
        "どの テストが むずかしいですか。",
      ],
      explanation: "どの = which. やさしい = easy (for a test). が for the unknown subject.",
    }),
    speaking(
      "ja-m8-5-2-speak-hayakunai",
      "この でんしゃは はやくないです",
      "This train isn't fast.",
    ),
    build(
      "ja-m8-5-2-build-to-coffee",
      "Say: Coffee and tea, please.",
      "コーヒーと おちゃを ください",
      ["コーヒー", "と", "おちゃ", "を", "ください", "みず", "は"],
      ["コーヒー", "と", "おちゃ", "を", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m8-5-2-lc-muzukashii-hon",
      audioText: "あの ほんは むずかしいです",
      correctMeaningEn: "That book (over there) is difficult.",
      distractorsEn: [
        "This book is difficult.",
        "That book is easy.",
        "That book (over there) is interesting.",
      ],
    }),
    cloze(
      "ja-m8-5-2-cloze-no",
      "せんせい",
      " テストは むずかしいです。",
      "の",
      ["の", "は", "と", "が"],
      "The teacher's test is difficult.",
      "せんせいの テストは むずかしいです。",
      "の marks possession — the teacher's test.",
    ),
    selfExplain({
      id: "ja-m8-5-2-self-explain",
      anchorLabel: "むずかしい → むずかしくない, はやい → はやくない",
      anchorAudioText: "むずかしくないです",
      question: "Does the negative pattern change for longer adjectives?",
      rule: { text: "No — all regular い-adjectives follow the same rule: drop い, add くない, regardless of length." },
      surface: { text: "Longer adjectives use a different negative ending." },
      distractor: { text: "Adjectives with 4+ syllables don't have negative forms." },
      ruleExplanation:
        "The pattern is universal for regular い-adjectives. むずかしい (5 syllables) and はやい (3 syllables) both use the same drop-い-add-くない rule.",
    }),
    speaking(
      "ja-m8-5-2-speak-yasashii",
      "その せんせいは やさしいです",
      "That teacher is kind.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-5-2-rev-mcq-1", M8_5_2_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-5-2-rev-lc-1",
      audioText: M8_5_2_REVIEW[1].kana,
      correctMeaningEn: M8_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_5_2_REVIEW[2].meaningEn,
        M8_5_2_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[9].meaningEn,
      ],
    }),
    speaking("ja-m8-5-2-rev-speak-1", M8_5_2_REVIEW[2].kana, M8_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-5-2-rev", M8_5_2_REVIEW),
    infoStep(
      "ja-m8-5-2-info-end",
      "You can now negate difficulty and speed adjectives fluently",
      "むずかしくない, やさしくない, はやくない, おそくない — and と for noun combos.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_5_2.steps);
assertAnswerRotation(M8_5_2.steps, 2);
assertNoConsecutiveSame(M8_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-6-1 — "Near and far" intro
//   (ちかい, とおい, ひろい, せまい)
// ═══════════════════════════════════════════════════════════════════════

const M8_6_1_REVIEW = pickReviewAtoms("ja-m8-6-1-rev", M8_REVIEW_POOL, 4);

export const M8_6_1: LessonContent = {
  id: "ja-m8-6-1",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Near and far I",
  description:
    "Four spatial adjectives — near, far, wide, narrow — completing the adjective set.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-6-1-info-open",
      "Space and distance",
      "Last four adjectives: ちかい (near), とおい (far), ひろい (wide/spacious), せまい (narrow/cramped).",
    ),
    // ── ちかい (near) ──
    build(
      "ja-m8-6-1-build-chikai",
      "Pick the Japanese word for: Near",
      "ちかい",
      ["ちかい", "とおい", "ひろい", "せまい"],
      ["ちかい"],
    ),
    listeningCompSentence({
      id: "ja-m8-6-1-lc-chikai",
      audioText: "ちかい",
      correctMeaningEn: "near",
      distractorsEn: ["far", "wide", "narrow"],
    }),
    // ── とおい (far) ──
    build(
      "ja-m8-6-1-build-tooi",
      "Pick the Japanese word for: Far",
      "とおい",
      ["とおい", "ちかい", "ながい", "おおきい"],
      ["とおい"],
    ),
    vocabMcq(
      "ja-m8-6-1-mcq-tooi",
      { kana: "とおい", meaningEn: "far", emoji: "🔭", fromModule: "m8" },
      M8_REVIEW_POOL,
    ),
    // ── ひろい (wide/spacious) ──
    build(
      "ja-m8-6-1-build-hiroi",
      "Pick the Japanese word for: Wide / Spacious",
      "ひろい",
      ["ひろい", "せまい", "おおきい", "ながい"],
      ["ひろい"],
    ),
    speaking("ja-m8-6-1-speak-hiroi", "ひろい", "Wide / Spacious"),
    // ── せまい (narrow/cramped) ──
    build(
      "ja-m8-6-1-build-semai",
      "Pick the Japanese word for: Narrow / Cramped",
      "せまい",
      ["せまい", "ひろい", "ちいさい", "みじかい"],
      ["せまい"],
    ),
    listeningCompSentence({
      id: "ja-m8-6-1-lc-semai",
      audioText: "せまい",
      correctMeaningEn: "narrow / cramped",
      distractorsEn: ["wide / spacious", "near", "far"],
    }),
    // ── Sentence drills ──
    build(
      "ja-m8-6-1-build-kono-eki",
      "Say: This station is near.",
      "この えきは ちかいです",
      ["この", "えき", "は", "ちかい", "です", "とおい", "その"],
      ["この", "えき", "は", "ちかい", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-6-1-mcq-tooi-gakkou",
      prompt: "Which sentence means 'That school is far.'?",
      correctKana: "その がっこうは とおいです。",
      distractorsKana: [
        "その がっこうは ちかいです。",
        "この がっこうは とおいです。",
        "あの がっこうは ひろいです。",
      ],
      explanation: "とおい = far. その = that (near listener).",
    }),
    cloze(
      "ja-m8-6-1-cloze-ha",
      "この へや",
      " ひろいです。",
      "は",
      ["は", "が", "を", "と"],
      "This room is spacious.",
      "この へやは ひろいです。",
      "は marks the topic.",
    ),
    listeningCompSentence({
      id: "ja-m8-6-1-lc-semai-heya",
      audioText: "あの へやは せまいです",
      correctMeaningEn: "That room (over there) is cramped.",
      distractorsEn: [
        "That room is spacious.",
        "This room is cramped.",
        "That room (over there) is narrow.",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m8-6-1-lb-chikai",
      target: "コンビニは ちかいです",
      tiles: ["コンビニ", "は", "ちかい", "です", "とおい", "この", "えき"],
      correctOrder: ["コンビニ", "は", "ちかい", "です"],
      promptEn: "Hear it, build it: 'The convenience store is near.'",
    }),
    selfExplain({
      id: "ja-m8-6-1-self-explain",
      anchorLabel: "ひろい = wide/spacious, せまい = narrow/cramped",
      anchorAudioText: "ひろいです",
      question: "When describing a room, what does ひろい mean?",
      rule: { text: "ひろい means 'spacious' — the room has a lot of open space." },
      surface: { text: "ひろい means the room is tall." },
      distractor: { text: "ひろい means the room is clean." },
      ruleExplanation:
        "ひろい = wide/spacious (physical extent). せまい = its opposite — narrow/cramped.",
    }),
    speaking(
      "ja-m8-6-1-speak-tooi",
      "その がっこうは とおいです",
      "That school is far.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-6-1-rev-mcq-1", M8_6_1_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-6-1-rev-lc-1",
      audioText: M8_6_1_REVIEW[1].kana,
      correctMeaningEn: M8_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_6_1_REVIEW[2].meaningEn,
        M8_6_1_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[10].meaningEn,
      ],
    }),
    speaking("ja-m8-6-1-rev-speak-1", M8_6_1_REVIEW[2].kana, M8_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-6-1-rev", M8_6_1_REVIEW),
    infoStep(
      "ja-m8-6-1-info-end",
      "You can now describe distance and size of spaces",
      "ちかい, とおい, ひろい, せまい — near, far, wide, narrow.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_6_1.steps);
assertAnswerRotation(M8_6_1.steps, 1);
assertNoConsecutiveSame(M8_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-6-2 — "Near and far" practice
//   (full adj system drill)
// ═══════════════════════════════════════════════════════════════════════

const M8_6_2_REVIEW = pickReviewAtoms("ja-m8-6-2-rev", M8_REVIEW_POOL, 4);

export const M8_6_2: LessonContent = {
  id: "ja-m8-6-2",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Near and far II",
  description:
    "Full adjective system drill — all spatial adjectives mixed with prior adj + demonstratives.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-6-2-info-open",
      "Full spatial drill",
      "All four spatial adjectives + negatives. Mix in demonstratives and と for a comprehensive practice.",
    ),
    sentenceMcq({
      id: "ja-m8-6-2-mcq-chikakunai",
      prompt: "Which sentence means 'That station isn't near.'?",
      correctKana: "その えきは ちかくないです。",
      distractorsKana: [
        "その えきは ちかいです。",
        "この えきは ちかくないです。",
        "その えきは とおいです。",
      ],
      explanation: "ちかい → ちかくない. Drop い, add くない.",
    }),
    build(
      "ja-m8-6-2-build-tookunai",
      "Say: The school isn't far.",
      "がっこうは とおくないです",
      ["がっこう", "は", "とおくない", "です", "とおい", "ちかい"],
      ["がっこう", "は", "とおくない", "です"],
    ),
    listeningCompSentence({
      id: "ja-m8-6-2-lc-hiroi-kouen",
      audioText: "この こうえんは ひろいです",
      correctMeaningEn: "This park is spacious.",
      distractorsEn: [
        "This park is narrow.",
        "That park is spacious.",
        "This park is near.",
      ],
    }),
    cloze(
      "ja-m8-6-2-cloze-ha-1",
      "あの みせ",
      " せまいです。",
      "は",
      ["は", "が", "を", "と"],
      "That shop (over there) is cramped.",
      "あの みせは せまいです。",
      "は marks the topic.",
    ),
    build(
      "ja-m8-6-2-build-hirokunai",
      "Say: This room isn't spacious.",
      "この へやは ひろくないです",
      ["この", "へや", "は", "ひろくない", "です", "ひろい", "せまい"],
      ["この", "へや", "は", "ひろくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-6-2-lb-semai-heya",
      target: "あの へやは せまいです",
      tiles: ["あの", "へや", "は", "せまい", "です", "ひろい", "この"],
      correctOrder: ["あの", "へや", "は", "せまい", "です"],
      promptEn: "Hear it, build it: 'That room (over there) is cramped.'",
    }),
    sentenceMcq({
      id: "ja-m8-6-2-mcq-dono-chikai",
      prompt: "Which sentence means 'Which store is near?'",
      correctKana: "どの みせが ちかいですか。",
      distractorsKana: [
        "この みせが ちかいですか。",
        "どの みせは とおいですか。",
        "あの みせが ちかいです。",
      ],
      explanation: "どの = which. が for the unknown subject. か for question.",
    }),
    cloze(
      "ja-m8-6-2-cloze-to",
      "こうえん",
      " がっこうは ちかいです。",
      "と",
      ["と", "は", "の", "が"],
      "The park and the school are near.",
      "こうえんと がっこうは ちかいです。",
      "と connects park AND school.",
    ),
    speaking(
      "ja-m8-6-2-speak-semai",
      "この へやは せまいです",
      "This room is cramped.",
    ),
    listeningCompSentence({
      id: "ja-m8-6-2-lc-tookunai",
      audioText: "コンビニは とおくないです",
      correctMeaningEn: "The convenience store isn't far.",
      distractorsEn: [
        "The convenience store is far.",
        "The convenience store is near.",
        "The school isn't far.",
      ],
    }),
    build(
      "ja-m8-6-2-build-dono-hiroi",
      "Ask: Which room is spacious?",
      "どの へやが ひろいですか",
      ["どの", "へや", "が", "ひろい", "です", "か", "この", "は"],
      ["どの", "へや", "が", "ひろい", "です", "か"],
    ),
    cloze(
      "ja-m8-6-2-cloze-ha-2",
      "この まち",
      " ひろいです。",
      "は",
      ["は", "が", "と", "の"],
      "This town is spacious.",
      "この まちは ひろいです。",
      "は marks the topic — this town.",
    ),
    selfExplain({
      id: "ja-m8-6-2-self-explain",
      anchorLabel: "ちかい → ちかくない, とおい → とおくない",
      anchorAudioText: "ちかくないです",
      question: "What is the negative of ひろい?",
      rule: { text: "ひろくない — drop い, add くない." },
      surface: { text: "ひろいない — add ない after the adjective." },
      distractor: { text: "せまい — use the opposite adjective instead." },
      ruleExplanation:
        "All regular い-adjectives negate the same way: drop い, add くない. ひろい → ひろくない.",
    }),
    speaking(
      "ja-m8-6-2-speak-chikai",
      "この えきは ちかいです",
      "This station is near.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-6-2-rev-mcq-1", M8_6_2_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-6-2-rev-lc-1",
      audioText: M8_6_2_REVIEW[1].kana,
      correctMeaningEn: M8_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_6_2_REVIEW[2].meaningEn,
        M8_6_2_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[11].meaningEn,
      ],
    }),
    speaking("ja-m8-6-2-rev-speak-1", M8_6_2_REVIEW[2].kana, M8_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-6-2-rev", M8_6_2_REVIEW),
    infoStep(
      "ja-m8-6-2-info-end",
      "You can now describe how near, far, wide, or narrow things are",
      "ちかい, とおい, ひろい, せまい — plus negatives, demonstratives, and と. Full spatial toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_6_2.steps);
assertAnswerRotation(M8_6_2.steps, 2);
assertNoConsecutiveSame(M8_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-STORY — Shopping scene with adjectives
// ═══════════════════════════════════════════════════════════════════════

export const M8_STORY: LessonContent = {
  id: "ja-m8-story",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Shopping for a camera",
  description:
    "Listen to two friends compare items in a shop using adjectives and demonstratives.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m8-story-info-open",
      "Story time — Shopping",
      "ゆき and たけし are in an electronics shop, looking at cameras and bags. Listen as they describe what they see.",
    ),
    dialogueListen({
      id: "ja-m8-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "この カメラは たかいですね。" },
        { speaker: "たけし", kana: "そうですね。でも、あの カメラは やすいですよ。" },
        { speaker: "ゆき", kana: "あの カメラは いいですか。" },
        { speaker: "たけし", kana: "はい、あの カメラは いいです。おおきくないですが、いいです。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What does ゆき say about この カメラ?",
          correctText: "It's expensive.",
          distractors: ["It's cheap.", "It's good.", "It's big."],
          explanation: "ゆき says この カメラは たかいですね = 'This camera is expensive, isn't it.'",
        },
        {
          id: "s1-q2",
          prompt: "What does たけし say about あの カメラ?",
          correctText: "It's cheap and good, but not big.",
          distractors: ["It's expensive but good.", "It's big and cheap.", "It's bad."],
          explanation: "たけし says あの カメラ is やすい (cheap), いい (good), and おおきくない (not big).",
        },
      ],
    }),
    build(
      "ja-m8-story-build-takai",
      "Say: This camera is expensive.",
      "この カメラは たかいです",
      ["この", "カメラ", "は", "たかい", "です", "やすい", "あの"],
      ["この", "カメラ", "は", "たかい", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-story-mcq-yasui",
      prompt: "Which sentence means 'That camera (over there) is cheap.'?",
      correctKana: "あの カメラは やすいです。",
      distractorsKana: [
        "この カメラは やすいです。",
        "あの カメラは たかいです。",
        "その カメラは やすいです。",
      ],
      explanation: "あの = that (over there). やすい = cheap.",
    }),
    dialogueListen({
      id: "ja-m8-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "この かばんと あの かばん、どちらが いいですか。" },
        { speaker: "たけし", kana: "この かばんは おおきいですが、あの かばんは ちいさいです。" },
        { speaker: "ゆき", kana: "ちいさい かばんは やすいですか。" },
        { speaker: "たけし", kana: "はい、やすいです。あたらしいですよ。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "What does たけし say about この かばん?",
          correctText: "It's big.",
          distractors: ["It's small.", "It's new.", "It's cheap."],
          explanation: "たけし says この かばんは おおきいです = 'This bag is big.'",
        },
        {
          id: "s2-q2",
          prompt: "Is the small bag cheap?",
          correctText: "Yes, and it's new.",
          distractors: ["No, it's expensive.", "Yes, but it's old.", "It isn't said."],
          explanation: "たけし confirms はい、やすいです。あたらしいですよ = 'Yes, cheap. And it's new!'",
        },
      ],
    }),
    cloze(
      "ja-m8-story-cloze-to",
      "この カメラ",
      " あの かばんを ください。",
      "と",
      ["と", "は", "が", "の"],
      "This camera and that bag, please.",
      "この カメラと あの かばんを ください。",
      "と connects the camera AND the bag.",
    ),
    listeningBuildSentence({
      id: "ja-m8-story-lb-chiisai",
      target: "ちいさい かばんは やすいです",
      tiles: ["ちいさい", "かばん", "は", "やすい", "です", "おおきい", "たかい"],
      correctOrder: ["ちいさい", "かばん", "は", "やすい", "です"],
      promptEn: "Hear it, build it: 'The small bag is cheap.'",
    }),
    listeningCompSentence({
      id: "ja-m8-story-lc-ookikunai",
      audioText: "あの カメラは おおきくないです",
      correctMeaningEn: "That camera (over there) isn't big.",
      distractorsEn: [
        "That camera is big.",
        "This camera isn't big.",
        "That camera isn't expensive.",
      ],
    }),
    speaking(
      "ja-m8-story-speak-takai",
      "この カメラは たかいです",
      "This camera is expensive.",
    ),
    sentenceMcq({
      id: "ja-m8-story-mcq-summary",
      prompt: "In the story, which item did たけし describe as あたらしい?",
      correctKana: "ちいさい かばん",
      distractorsKana: ["おおきい かばん", "この カメラ", "あの カメラ"],
      explanation: "たけし said the small bag is やすい and あたらしい (new).",
    }),
    speaking(
      "ja-m8-story-speak-yasui",
      "あの カメラは やすいです",
      "That camera (over there) is cheap.",
    ),
    infoStep(
      "ja-m8-story-info-end",
      "You can now follow a shopping conversation using adjectives",
      "You used たかい, やすい, おおきい, ちいさい, and あたらしい to compare items — plus この/あの and と in a real shopping scene.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M8_STORY.steps);
assertPassiveCardsHaveFollowup(M8_STORY.steps);
assertNoExplanationOnPassive(M8_STORY.steps);
assertExplanationDoesntLeakAnswer(M8_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-7-1 — "Mixed drill"
//   (all adj + この/その/あの/どの + と)
// ═══════════════════════════════════════════════════════════════════════

const M8_7_1_REVIEW = pickReviewAtoms("ja-m8-7-1-rev", M8_REVIEW_POOL, 4);

export const M8_7_1: LessonContent = {
  id: "ja-m8-7-1",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill",
  description:
    "All adjectives + demonstratives + と in a comprehensive review drill.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m8-7-1-info-open",
      "Full system review",
      "Every adjective, every demonstrative, and と. One big drill to tie it all together.",
    ),
    sentenceMcq({
      id: "ja-m8-7-1-mcq-ookii-machi",
      prompt: "Which sentence means 'This town is big.'?",
      correctKana: "この まちは おおきいです。",
      distractorsKana: [
        "この まちは ちいさいです。",
        "その まちは おおきいです。",
        "この まちは ひろいです。",
      ],
      explanation: "おおきい = big. この = this.",
    }),
    build(
      "ja-m8-7-1-build-atarashii",
      "Say: That newspaper is new.",
      "その しんぶんは あたらしいです",
      ["その", "しんぶん", "は", "あたらしい", "です", "ふるい", "この"],
      ["その", "しんぶん", "は", "あたらしい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m8-7-1-lc-furui-kuruma",
      audioText: "あの くるまは ふるいです",
      correctMeaningEn: "That car (over there) is old.",
      distractorsEn: [
        "That car is new.",
        "This car is old.",
        "That car (over there) is expensive.",
      ],
    }),
    cloze(
      "ja-m8-7-1-cloze-to",
      "おちゃ",
      " コーヒーを ください。",
      "と",
      ["と", "は", "が", "の"],
      "Tea and coffee, please.",
      "おちゃと コーヒーを ください。",
      "と connects tea AND coffee.",
    ),
    build(
      "ja-m8-7-1-build-yokunai-mise",
      "Say: That shop isn't good.",
      "その みせは よくないです",
      ["その", "みせ", "は", "よくない", "です", "いい", "わるい"],
      ["その", "みせ", "は", "よくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-7-1-lb-oishii-ramen",
      target: "この ラーメンは おいしいです",
      tiles: ["この", "ラーメン", "は", "おいしい", "です", "まずい", "あつい"],
      correctOrder: ["この", "ラーメン", "は", "おいしい", "です"],
      promptEn: "Hear it, build it: 'This ramen is delicious.'",
    }),
    sentenceMcq({
      id: "ja-m8-7-1-mcq-samui",
      prompt: "Which sentence means 'Today isn't cold.'?",
      correctKana: "きょうは さむくないです。",
      distractorsKana: [
        "きょうは さむいです。",
        "きょうは あついです。",
        "きょうは あたたかいです。",
      ],
      explanation: "さむい → さむくない. Not cold.",
    }),
    cloze(
      "ja-m8-7-1-cloze-ha",
      "どの テスト",
      " むずかしいですか。",
      "が",
      ["が", "は", "と", "を"],
      "Which test is difficult?",
      "どの テストが むずかしいですか。",
      "が marks the unknown subject in a question.",
    ),
    speaking(
      "ja-m8-7-1-speak-oishikunai",
      "この パンは おいしくないです",
      "This bread isn't delicious.",
    ),
    listeningCompSentence({
      id: "ja-m8-7-1-lc-hayai-densha",
      audioText: "あの でんしゃは はやいです",
      correctMeaningEn: "That train (over there) is fast.",
      distractorsEn: [
        "This train is fast.",
        "That train is slow.",
        "That train (over there) is near.",
      ],
    }),
    build(
      "ja-m8-7-1-build-semai-heya",
      "Say: This room is cramped.",
      "この へやは せまいです",
      ["この", "へや", "は", "せまい", "です", "ひろい", "あの"],
      ["この", "へや", "は", "せまい", "です"],
    ),
    cloze(
      "ja-m8-7-1-cloze-no",
      "せんせい",
      " テストは やさしいです。",
      "の",
      ["の", "は", "が", "と"],
      "The teacher's test is easy.",
      "せんせいの テストは やさしいです。",
      "の marks possession — the teacher's test.",
    ),
    selfExplain({
      id: "ja-m8-7-1-self-explain",
      anchorLabel: "いい → よくない (exception), たかい → たかくない (regular)",
      anchorAudioText: "よくないです",
      question: "Why is いい the only adjective that changes its stem in the negative?",
      rule: { text: "いい is a contracted form of よい. All conjugations use the よ- stem, so the negative is よくない." },
      surface: { text: "いい is actually a な-adjective, so it follows different rules." },
      distractor: { text: "いい has two negatives — both いくない and よくない are correct." },
      ruleExplanation:
        "いい derives from よい. In all forms except the plain positive, the stem reverts to よ-: よくない, よかった, etc.",
    }),
    speaking(
      "ja-m8-7-1-speak-tooi",
      "あの がっこうは とおいです",
      "That school (over there) is far.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-7-1-rev-mcq-1", M8_7_1_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-7-1-rev-lc-1",
      audioText: M8_7_1_REVIEW[1].kana,
      correctMeaningEn: M8_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_7_1_REVIEW[2].meaningEn,
        M8_7_1_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[12].meaningEn,
      ],
    }),
    speaking("ja-m8-7-1-rev-speak-1", M8_7_1_REVIEW[2].kana, M8_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-7-1-rev", M8_7_1_REVIEW),
    infoStep(
      "ja-m8-7-1-info-end",
      "You can now describe almost anything with 20+ adjectives",
      "Size, price, quality, taste, temperature, length, interest, difficulty, speed, distance, space — all in positive and negative forms.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_7_1.steps);
assertAnswerRotation(M8_7_1.steps, 2);
assertNoConsecutiveSame(M8_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-7-2 — "Production"
//   (translate + build + speaking heavy)
// ═══════════════════════════════════════════════════════════════════════

const M8_7_2_REVIEW = pickReviewAtoms("ja-m8-7-2-rev", M8_REVIEW_POOL, 5);

export const M8_7_2: LessonContent = {
  id: "ja-m8-7-2",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "Production",
  description:
    "Heavy production practice — translate, build, and speak with all M8 grammar.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m8-7-2-info-open",
      "Show what you know",
      "Production round — you'll translate, build, and speak full sentences using everything from M8. Time to prove you own it.",
    ),
    build(
      "ja-m8-7-2-build-1",
      "Say: This coffee is delicious.",
      "この コーヒーは おいしいです",
      ["この", "コーヒー", "は", "おいしい", "です", "まずい", "その"],
      ["この", "コーヒー", "は", "おいしい", "です"],
    ),
    speaking(
      "ja-m8-7-2-speak-1",
      "この コーヒーは おいしいです",
      "This coffee is delicious.",
    ),
    listeningCompSentence({
      id: "ja-m8-7-2-lc-1",
      audioText: "あの まちは おおきいです",
      correctMeaningEn: "That town (over there) is big.",
      distractorsEn: [
        "This town is big.",
        "That town is small.",
        "That town (over there) is wide.",
      ],
    }),
    build(
      "ja-m8-7-2-build-2",
      "Say: That test isn't difficult.",
      "その テストは むずかしくないです",
      ["その", "テスト", "は", "むずかしくない", "です", "むずかしい", "この"],
      ["その", "テスト", "は", "むずかしくない", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-7-2-mcq-1",
      prompt: "Which sentence means 'Which hotel is cheap?'",
      correctKana: "どの ホテルが やすいですか。",
      distractorsKana: [
        "この ホテルが やすいですか。",
        "どの ホテルは たかいですか。",
        "あの ホテルが やすいです。",
      ],
      explanation: "どの = which. が for unknown subject. やすい = cheap.",
    }),
    speaking(
      "ja-m8-7-2-speak-2",
      "その テストは むずかしくないです",
      "That test isn't difficult.",
    ),
    build(
      "ja-m8-7-2-build-3",
      "Say: Ramen and bread, please.",
      "ラーメンと パンを ください",
      ["ラーメン", "と", "パン", "を", "ください", "コーヒー", "は"],
      ["ラーメン", "と", "パン", "を", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m8-7-2-lb-1",
      target: "この へやは ひろいです",
      tiles: ["この", "へや", "は", "ひろい", "です", "せまい", "あの"],
      correctOrder: ["この", "へや", "は", "ひろい", "です"],
      promptEn: "Hear it, build it: 'This room is spacious.'",
    }),
    cloze(
      "ja-m8-7-2-cloze-to",
      "すし",
      " ラーメンは おいしいです。",
      "と",
      ["と", "は", "が", "の"],
      "Sushi and ramen are delicious.",
      "すしと ラーメンは おいしいです。",
      "と connects sushi AND ramen.",
    ),
    speaking(
      "ja-m8-7-2-speak-3",
      "この えきは ちかいです",
      "This station is near.",
    ),
    build(
      "ja-m8-7-2-build-4",
      "Say: This book isn't good.",
      "この ほんは よくないです",
      ["この", "ほん", "は", "よくない", "です", "いい", "わるい"],
      ["この", "ほん", "は", "よくない", "です"],
    ),
    listeningCompSentence({
      id: "ja-m8-7-2-lc-2",
      audioText: "あの でんしゃは おそくないです",
      correctMeaningEn: "That train (over there) isn't slow.",
      distractorsEn: [
        "That train is slow.",
        "This train isn't slow.",
        "That train (over there) isn't fast.",
      ],
    }),
    cloze(
      "ja-m8-7-2-cloze-ha",
      "この しんぶん",
      " ながいです。",
      "は",
      ["は", "と", "が", "の"],
      "This newspaper is long.",
      "この しんぶんは ながいです。",
      "は marks the topic.",
    ),
    selfExplain({
      id: "ja-m8-7-2-self-explain",
      anchorLabel: "You've used 20+ adjectives in positive and negative forms",
      anchorAudioText: "おおきくないです",
      question: "To negate たかい, you say...?",
      rule: { text: "たかくない — drop い, add くない." },
      surface: { text: "たかいじゃない — add じゃない after it." },
      distractor: { text: "たかいくない — add くない after the full adjective." },
      ruleExplanation:
        "Drop the final い, then add くない: たかい → たかくない. Never add くない to the whole adjective.",
    }),
    speaking(
      "ja-m8-7-2-speak-4",
      "あの カメラは やすいですよ",
      "That camera (over there) is cheap, you know!",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-7-2-rev-mcq-1", M8_7_2_REVIEW[0], M8_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m8-7-2-rev-lc-1",
      audioText: M8_7_2_REVIEW[1].kana,
      correctMeaningEn: M8_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M8_7_2_REVIEW[2].meaningEn,
        M8_7_2_REVIEW[3].meaningEn,
        M8_REVIEW_POOL[13].meaningEn,
      ],
    }),
    speaking("ja-m8-7-2-rev-speak-1", M8_7_2_REVIEW[2].kana, M8_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-7-2-rev", M8_7_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m8-7-2-info-end",
      "You can now describe, compare, and negate adjectives across every category",
      "All M8 grammar mastered: い-adjectives (positive + negative), この/その/あの/どの, and と — in full production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M8_7_2.steps);
assertAnswerRotation(M8_7_2.steps, 2);
assertNoConsecutiveSame(M8_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M8 = [
  M8_1_1, M8_1_2, M8_2_1, M8_2_2, M8_3_1, M8_3_2,
  M8_4_1, M8_4_2, M8_5_1, M8_5_2, M8_6_1, M8_6_2,
  M8_STORY, M8_7_1, M8_7_2,
];

assertNoSameAnswerCluster(ALL_M8.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M8) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
