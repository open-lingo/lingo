/**
 * M8 — i-Adjectives + Kanji parallel track begins (2026-05-25).
 *
 * M8 introduces:
 *   - この/その/あの/どの (adnominal demonstratives — "this X / that X / which X")
 *   - い-adjective present affirmative (formal teaching)
 *   - い-adjective negative: 〜くない (たかい → たかくない; いい → よくない)
 *   - と (and/with — noun connector: "コーヒーとパン")
 *
 * Split into 15 sub-lessons (14 drill + 1 story), plus 2 exported-but-
 * unregistered sub-lessons (M8_8_1 / M8_8_2 — こちら/そちら/あちら/どちら
 * + どうですか; see the sentence-variety reauthor report for registration).
 * Each sub-lesson has ~20 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * 2026-06-12 sentence-variety reauthor: review-particle cloze thinned to
 * ≤25%, no sentence repeated >3x module-wide, practice sub-lessons use
 * fresh sentences, build tile banks scrambled, story converted to the
 * storyComprehension() factory (§13.13 locked template).
 *
 * ID scheme: ja-m8-{n}-{sub} e.g. ja-m8-1-1, ja-m8-1-2
 * Export names: M8_1_1, M8_1_2, M8_2_1, M8_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m8-1, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
  grammarRule,
  listeningBuildSentence,
  listeningCompSentence,
  M3_M7_REVIEW_POOL,
  withoutMcqBlocked,
  pickReviewAtoms,
  reviewMatchPairs,
  selfExplain,
  sentenceMcq,
  speaking,
  storyComprehension,
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
} from "@/features/languages/ja/grammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "@/shared/lessonAuthoring/curriculumAssertions";

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
  grammarPointId: "kono-sono-ano-dono",
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
  grammarPointId: "i-adj-present",
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
  grammarPointId: "to-and",
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

const M8_1_1_REVIEW = pickReviewAtoms("ja-m8-1-1-rev", M8_REVIEW_POOL, 6);

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
    RULE_KONO_SONO,
    // ── おおきい (big) — build intro ──
    build(
      "ja-m8-1-1-build-ookii",
      "Pick the Japanese word for: Big",
      "おおきい",
      ["たかい", "ちいさい", "おおきい", "やすい"],
      ["おおきい"],
    ),
    listeningCompSentence({
      id: "ja-m8-1-1-lc-ookii",
      audioText: "この いぬは おおきいです",
      correctMeaningEn: "This dog is big.",
      distractorsEn: [
        "This dog is small.",
        "This cat is big.",
        "That dog (over there) is big.",
      ],
    }),
    // ── ちいさい (small) ──
    build(
      "ja-m8-1-1-build-chiisai",
      "Pick the Japanese word for: Small",
      "ちいさい",
      ["おおきい", "たかい", "ふるい", "ちいさい"],
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
      ["おおきい", "たかい", "ちいさい", "やすい"],
      ["たかい"],
    ),
    speaking("ja-m8-1-1-speak-takai", "たかい", "Expensive"),
    // ── やすい (cheap) ──
    build(
      "ja-m8-1-1-build-yasui",
      "Pick the Japanese word for: Cheap",
      "やすい",
      ["たかい", "おおきい", "やすい", "ちいさい"],
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
      ["です", "この", "は", "その", "ちいさい", "くるま", "おおきい"],
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
    build(
      "ja-m8-1-1-build-kono-hana",
      "Say: This flower is cheap.",
      "この はなは やすいです",
      ["やすい", "この", "は", "たかい", "はな", "です", "その"],
      ["この", "はな", "は", "やすい", "です"],
    ),
    // ── Katakana interleave (rollout M8 ハ row → バス is now base-readable).
    //    Same adjective pattern on a fresh, readable noun. ──
    speaking(
      "ja-m8-1-1-speak-basu-yasui",
      "バスは やすいです",
      "The bus is cheap.",
      ["バス"],
    ),
    listeningBuildSentence({
      id: "ja-m8-1-1-lb-chiisai",
      target: "この かばんは ちいさいです",
      tiles: ["おおきい", "この", "かばん", "は", "ちいさい", "です", "その"],
      correctOrder: ["この", "かばん", "は", "ちいさい", "です"],
      promptEn: "Hear it, build it: 'This bag is small.'",
    }),
    selfExplain({
      id: "ja-m8-1-1-self-explain",
      anchorLabel: "You used この in: この はなは やすいです",
      anchorAudioText: "この はなは やすいです",
      question: "Why この instead of これ?",
      rule: { text: "この attaches to a noun (この + ペン). これ stands alone without a noun." },
      surface: { text: "この sounds more polite than これ." },
      distractor: { text: "この is for expensive things; これ is for cheap things." },
      ruleExplanation:
        "この/その/あの/どの always need a noun after them. これ/それ/あれ/どれ stand alone.",
    }),
    speaking(
      "ja-m8-1-1-speak-ano-yama",
      "あの やまは おおきいです",
      "That mountain (over there) is big.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-1-1-rev-mcq-1", M8_1_1_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of さんぽ (M2 walk/stroll) in a の carrier.
    listeningCompSentence({
      id: "ja-m8-1-1-rev-lc-1",
      audioText: "こうえんの さんぽです",
      correctMeaningEn: "It's a walk in the park.",
      distractorsEn: [
        "It's a walk in the mountains.",
        "It's a meal in the park.",
        "It's a photo of the park.",
      ],
    }),
    speaking("ja-m8-1-1-rev-speak-1", M8_1_1_REVIEW[2].kana, M8_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-1-1-rev", M8_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_1_1.steps);
assertAnswerRotation(M8_1_1.steps, 1);
assertNoConsecutiveSame(M8_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-1-2 — "Describing things" practice
//   (drill この/その + adj, review tail from M3-M7)
// ═══════════════════════════════════════════════════════════════════════

const M8_1_2_REVIEW = pickReviewAtoms("ja-m8-1-2-rev", M8_REVIEW_POOL, 6);

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
    // ── あの + adj drills ──
    build(
      "ja-m8-1-2-build-ano-ookii",
      "Say: That hotel (over there) is big.",
      "あの ホテルは おおきいです",
      ["です", "ホテル", "おおきい", "この", "あの", "ちいさい", "は"],
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
    build(
      "ja-m8-1-2-build-sono-shatsu",
      "Say: That shirt is small.",
      "その シャツは ちいさいです",
      ["です", "シャツ", "ちいさい", "は", "その", "この", "おおきい"],
      ["その", "シャツ", "は", "ちいさい", "です"],
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
      ["ほん", "は", "おもしろい", "が", "です", "か", "どの", "この"],
      ["どの", "ほん", "が", "おもしろい", "です", "か"],
    ),
    speaking(
      "ja-m8-1-2-speak-dono-kamera",
      "どの カメラが たかいですか",
      "Which camera is expensive?",
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
      "あの びょういんは おおきいです",
      "That hospital (over there) is big.",
    ),
    build(
      "ja-m8-1-2-build-sono-yasui",
      "Say: That bag is cheap.",
      "その かばんは やすいです",
      ["この", "たかい", "は", "やすい", "かばん", "です", "その"],
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
      target: "その じしょは たかいです",
      tiles: ["たかい", "じしょ", "その", "です", "は", "やすい", "この"],
      correctOrder: ["その", "じしょ", "は", "たかい", "です"],
      promptEn: "Hear it, build it: 'That dictionary is expensive.'",
    }),
    build(
      "ja-m8-1-2-build-tomodachi-kuruma",
      "Say: My friend's car is big.",
      "ともだちの くるまは おおきいです",
      ["です", "くるま", "ともだち", "ちいさい", "は", "おおきい", "の"],
      ["ともだち", "の", "くるま", "は", "おおきい", "です"],
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
      "どの かばんが やすいですか",
      "Which bag is cheap?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-1-2-rev-mcq-1", M8_1_2_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of みず (M3 water) with this lesson's adjective.
    listeningCompSentence({
      id: "ja-m8-1-2-rev-lc-1",
      audioText: "この みずは やすいです",
      correctMeaningEn: "This water is cheap.",
      distractorsEn: [
        "This water is expensive.",
        "This juice is cheap.",
        "That water (over there) is cheap.",
      ],
    }),
    speaking("ja-m8-1-2-rev-speak-1", M8_1_2_REVIEW[2].kana, M8_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-1-2-rev", M8_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_1_2.steps);
assertAnswerRotation(M8_1_2.steps, 2);
assertNoConsecutiveSame(M8_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-2-1 — "Good and bad" intro
//   (いい/よい, わるい, おいしい, まずい + い-adj conjugation rule)
// ═══════════════════════════════════════════════════════════════════════

const M8_2_1_REVIEW = pickReviewAtoms("ja-m8-2-1-rev", M8_REVIEW_POOL, 6);

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
    RULE_I_ADJ,
    // ── いい (good) ──
    build(
      "ja-m8-2-1-build-ii",
      "Pick the Japanese word for: Good",
      "いい",
      ["わるい", "まずい", "いい", "おいしい"],
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
      ["いい", "まずい", "わるい", "ふるい"],
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
      ["いい", "おいしい", "たかい", "まずい"],
      ["おいしい"],
    ),
    speaking("ja-m8-2-1-speak-oishii", "おいしい", "Delicious"),
    // ── Katakana interleave (rollout M8 ハ row → コーヒー finally fully
    //    readable). い-adjective + the module's own adjective theme. ──
    listeningBuildSentence({
      id: "ja-m8-2-1-lb-koohii-oishii",
      target: "コーヒーは おいしいです",
      tiles: ["コーヒー", "は", "おいしい", "です", "まずい"],
      correctOrder: ["コーヒー", "は", "おいしい", "です"],
      promptEn: "Hear it, build it: 'The coffee is delicious.'",
      exercisedAtomKanas: ["コーヒー"],
    }),
    // ── まずい (bad-tasting) ──
    build(
      "ja-m8-2-1-build-mazui",
      "Pick the Japanese word for: Bad-tasting",
      "まずい",
      ["わるい", "まずい", "おいしい", "やすい"],
      ["まずい"],
    ),
    listeningCompSentence({
      id: "ja-m8-2-1-lc-mazui",
      audioText: "この コーヒーは まずいです",
      correctMeaningEn: "This coffee is bad-tasting.",
      distractorsEn: [
        "This coffee is delicious.",
        "This ramen is bad-tasting.",
        "That coffee (over there) is bad-tasting.",
      ],
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
      ["まずい", "です", "これ", "おいしい", "おいしくない", "は"],
      ["これ", "は", "おいしくない", "です"],
    ),
    speaking(
      "ja-m8-2-1-speak-ii-camera",
      "あなたの カメラは いいです",
      "Your camera is good.",
    ),
    listeningBuildSentence({
      id: "ja-m8-2-1-lb-yokunai",
      target: "この ほんは よくないです",
      tiles: ["です", "いい", "は", "わるい", "ほん", "この", "よくない"],
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
      "あの みせは よくないです",
      "That shop (over there) isn't good.",
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
  ],
};

assertNoSameAnswerCluster(M8_2_1.steps);
assertAnswerRotation(M8_2_1.steps, 1);
assertNoConsecutiveSame(M8_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-2-2 — "Good and bad" practice
//   (い-adj present/negative drill)
// ═══════════════════════════════════════════════════════════════════════

const M8_2_2_REVIEW = pickReviewAtoms("ja-m8-2-2-rev", M8_REVIEW_POOL, 6);

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
      ["おいしくない", "です", "は", "これ", "まずい", "まずくない"],
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
    build(
      "ja-m8-2-2-build-haha-ryouri",
      "Say: Mother's cooking is delicious.",
      "ははの りょうりは おいしいです",
      ["は", "おいしい", "はは", "まずい", "りょうり", "の", "です"],
      ["はは", "の", "りょうり", "は", "おいしい", "です"],
    ),
    build(
      "ja-m8-2-2-build-yokunai-test",
      "Say: This test isn't good.",
      "この テストは よくないです",
      ["テスト", "よくない", "は", "この", "わるい", "です", "いい"],
      ["この", "テスト", "は", "よくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-2-2-lb-warui",
      target: "あの みせは わるいです",
      tiles: ["です", "は", "みせ", "この", "わるい", "あの", "いい"],
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
    listeningCompSentence({
      id: "ja-m8-2-2-lc-ane-inu",
      audioText: "あねの いぬは おおきいです",
      correctMeaningEn: "My older sister's dog is big.",
      distractorsEn: [
        "My older brother's dog is big.",
        "My older sister's cat is big.",
        "My older sister's dog is small.",
      ],
    }),
    speaking(
      "ja-m8-2-2-speak-oishikunai",
      "この パンは おいしくないです",
      "This bread isn't delicious.",
    ),
    build(
      "ja-m8-2-2-build-ii-sensei",
      "Say: That teacher is good.",
      "その せんせいは いいです",
      ["です", "その", "わるい", "せんせい", "は", "この", "いい"],
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
    listeningCompSentence({
      id: "ja-m8-2-2-lc-warui-hotel",
      audioText: "あの ホテルは よくないです",
      correctMeaningEn: "That hotel (over there) isn't good.",
      distractorsEn: [
        "That hotel is good.",
        "This hotel isn't good.",
        "That hotel (over there) is bad.",
      ],
    }),
    selfExplain({
      id: "ja-m8-2-2-self-explain",
      anchorLabel: "おいしい → おいしくない, but いい → よくない",
      anchorAudioText: "おいしくないです",
      question: "How do you form the negative of a regular い-adjective like おいしい?",
      rule: { text: "Drop the final い and add くない: おいしい → おいしくない." },
      surface: { text: "Add くない to the whole word without changing anything." },
      distractor: { text: "Replace い with ない: おいしい → おいしない." },
      ruleExplanation:
        "Regular い-adjectives: drop い, add くない. Only いい is irregular (→ よくない).",
    }),
    speaking(
      "ja-m8-2-2-speak-warukun",
      "あの ホテルは わるくないです",
      "That hotel (over there) isn't bad.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-2-2-rev-mcq-1", M8_2_2_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of じゅう (M5) — countdown run.
    listeningCompSentence({
      id: "ja-m8-2-2-rev-lc-1",
      audioText: "じゅう、きゅう、はち",
      correctMeaningEn: "10, 9, 8",
      distractorsEn: ["8, 9, 10", "10, 8, 6", "9, 8, 7"],
    }),
    speaking("ja-m8-2-2-rev-speak-1", M8_2_2_REVIEW[2].kana, M8_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-2-2-rev", M8_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_2_2.steps);
assertAnswerRotation(M8_2_2.steps, 2);
assertNoConsecutiveSame(M8_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-3-1 — "Hot and cold" intro
//   (あつい, さむい, つめたい, あたたかい + と particle)
// ═══════════════════════════════════════════════════════════════════════

const M8_3_1_REVIEW = pickReviewAtoms("ja-m8-3-1-rev", M8_REVIEW_POOL, 6);

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
    RULE_TO,
    // ── あつい (hot) ──
    build(
      "ja-m8-3-1-build-atsui",
      "Pick the Japanese word for: Hot",
      "あつい",
      ["あたたかい", "さむい", "つめたい", "あつい"],
      ["あつい"],
    ),
    listeningCompSentence({
      id: "ja-m8-3-1-lc-atsui",
      audioText: "この ごはんは あついです",
      correctMeaningEn: "This rice is hot.",
      distractorsEn: [
        "This rice is cold.",
        "This bread is hot.",
        "This rice is delicious.",
      ],
    }),
    // ── さむい (cold-weather) ──
    build(
      "ja-m8-3-1-build-samui",
      "Pick the Japanese word for: Cold (weather)",
      "さむい",
      ["あつい", "さむい", "つめたい", "やすい"],
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
      ["さむい", "あたたかい", "ちいさい", "つめたい"],
      ["つめたい"],
    ),
    speaking("ja-m8-3-1-speak-tsumetai", "つめたい", "Cold (to touch)"),
    // ── あたたかい (warm) ──
    build(
      "ja-m8-3-1-build-atatakai",
      "Pick the Japanese word for: Warm",
      "あたたかい",
      ["あつい", "さむい", "つめたい", "あたたかい"],
      ["あたたかい"],
    ),
    listeningCompSentence({
      id: "ja-m8-3-1-lc-atatakai",
      audioText: "この へやは あたたかいです",
      correctMeaningEn: "This room is warm.",
      distractorsEn: [
        "This room is hot.",
        "This room is cold.",
        "That room (over there) is warm.",
      ],
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
      ["と", "は", "ほん", "の", "が", "ペン", "あります"],
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
      tiles: ["です", "つめたい", "この", "あつい", "あたたかい", "みず", "は"],
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
      "この おちゃは あついです",
      "This tea is hot.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-3-1-rev-mcq-1", M8_3_1_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of ねこ (M1) with an M8-1 adjective.
    listeningCompSentence({
      id: "ja-m8-3-1-rev-lc-1",
      audioText: "この ねこは おおきいです",
      correctMeaningEn: "This cat is big.",
      distractorsEn: [
        "This cat is small.",
        "This dog is big.",
        "That cat (over there) is big.",
      ],
    }),
    speaking("ja-m8-3-1-rev-speak-1", M8_3_1_REVIEW[2].kana, M8_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-3-1-rev", M8_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_3_1.steps);
assertAnswerRotation(M8_3_1.steps, 1);
assertNoConsecutiveSame(M8_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-3-2 — "Hot and cold" practice
//   (と connector drill + adj review)
// ═══════════════════════════════════════════════════════════════════════

const M8_3_2_REVIEW = pickReviewAtoms("ja-m8-3-2-rev", M8_REVIEW_POOL, 6);

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
    build(
      "ja-m8-3-2-build-to-sushi",
      "Say: Sushi and ramen, please.",
      "すしと ラーメンを ください",
      ["パン", "ください", "ラーメン", "は", "と", "を", "すし"],
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
      ["あつい", "です", "きょう", "さむい", "さむくない", "は"],
      ["きょう", "は", "さむくない", "です"],
    ),
    build(
      "ja-m8-3-2-build-umi-tsumetai",
      "Say: The sea's water is cold (to touch).",
      "うみの みずは つめたいです",
      ["みず", "つめたい", "うみ", "は", "の", "です", "あつい"],
      ["うみ", "の", "みず", "は", "つめたい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-3-2-lb-atsui",
      target: "この ラーメンは あついです",
      tiles: ["おいしい", "です", "この", "ラーメン", "は", "つめたい", "あつい"],
      correctOrder: ["この", "ラーメン", "は", "あつい", "です"],
      promptEn: "Hear it, build it: 'This ramen is hot.'",
    }),
    speaking(
      "ja-m8-3-2-speak-atatakai",
      "きょうは あたたかいです",
      "Today is warm.",
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
      ["おちゃ", "は", "ジュース", "コーヒー", "と", "みず"],
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
      "ぎゅうにゅうと パンを ください",
      "Milk and bread, please.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-3-2-rev-mcq-1", M8_3_2_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of じてんしゃ (M4) with an M8-1 adjective.
    listeningCompSentence({
      id: "ja-m8-3-2-rev-lc-1",
      audioText: "この じてんしゃは たかいです",
      correctMeaningEn: "This bicycle is expensive.",
      distractorsEn: [
        "This bicycle is cheap.",
        "This car is expensive.",
        "That bicycle (over there) is expensive.",
      ],
    }),
    speaking("ja-m8-3-2-rev-speak-1", M8_3_2_REVIEW[2].kana, M8_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-3-2-rev", M8_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_3_2.steps);
assertAnswerRotation(M8_3_2.steps, 2);
assertNoConsecutiveSame(M8_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-4-1 — "Long and short" intro
//   (ながい, みじかい, おもしろい, つまらない)
// ═══════════════════════════════════════════════════════════════════════

const M8_4_1_REVIEW = pickReviewAtoms("ja-m8-4-1-rev", M8_REVIEW_POOL, 6);

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
    // ── ながい (long) ──
    build(
      "ja-m8-4-1-build-nagai",
      "Pick the Japanese word for: Long",
      "ながい",
      ["みじかい", "おもしろい", "ながい", "つまらない"],
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
      ["ながい", "ちいさい", "みじかい", "おそい"],
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
      ["いい", "ながい", "おもしろい", "つまらない"],
      ["おもしろい"],
    ),
    speaking("ja-m8-4-1-speak-omoshiroi", "おもしろい", "Interesting"),
    // ── つまらない (boring) ──
    build(
      "ja-m8-4-1-build-tsumaranai",
      "Pick the Japanese word for: Boring",
      "つまらない",
      ["おもしろい", "まずい", "みじかい", "つまらない"],
      ["つまらない"],
    ),
    listeningCompSentence({
      id: "ja-m8-4-1-lc-tsumaranai",
      audioText: "この ほんは つまらないです",
      correctMeaningEn: "This book is boring.",
      distractorsEn: [
        "This book is interesting.",
        "This book is long.",
        "That book is boring.",
      ],
    }),
    // ── Sentence drills ──
    build(
      "ja-m8-4-1-build-kono-nagai",
      "Say: This movie is long.",
      "この えいがは ながいです",
      ["です", "その", "は", "えいが", "ながい", "みじかい", "この"],
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
    speaking(
      "ja-m8-4-1-speak-mijikai-eiga",
      "その えいがは みじかいです",
      "That movie is short.",
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
      tiles: ["おもしろい", "ほん", "です", "つまらない", "は", "この", "ながい"],
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
    // Sentence-level review of うた (M1 song) with an M8-2 adjective.
    listeningCompSentence({
      id: "ja-m8-4-1-rev-lc-1",
      audioText: "この うたは いいです",
      correctMeaningEn: "This song is good.",
      distractorsEn: [
        "This song isn't good.",
        "This movie is good.",
        "That song is good.",
      ],
    }),
    speaking("ja-m8-4-1-rev-speak-1", M8_4_1_REVIEW[2].kana, M8_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-4-1-rev", M8_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_4_1.steps);
assertAnswerRotation(M8_4_1.steps, 1);
assertNoConsecutiveSame(M8_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-4-2 — "Long and short" practice
//   (mixed adj + この/その drill)
// ═══════════════════════════════════════════════════════════════════════

const M8_4_2_REVIEW = pickReviewAtoms("ja-m8-4-2-rev", M8_REVIEW_POOL, 6);

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
      ["おもしろい", "ほん", "おもしろくない", "その", "は", "です", "この"],
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
      ["この", "あの", "やすい", "たかい", "は", "です", "ホテル"],
      ["あの", "ホテル", "は", "たかい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-4-2-lb-mijikai-tegami",
      target: "ともだちの てがみは みじかいです",
      tiles: ["てがみ", "ともだち", "みじかい", "の", "は", "です", "ながい"],
      correctOrder: ["ともだち", "の", "てがみ", "は", "みじかい", "です"],
      promptEn: "Hear it, build it: 'My friend's letter is short.'",
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
      id: "ja-m8-4-2-lc-yasui-tokei",
      audioText: "あの とけいは やすいです",
      correctMeaningEn: "That watch (over there) is cheap.",
      distractorsEn: [
        "That watch (over there) is expensive.",
        "This watch is cheap.",
        "That watch (over there) is small.",
      ],
    }),
    speaking(
      "ja-m8-4-2-speak-nagakunai",
      "この ほんは ながくないです",
      "This book isn't long.",
    ),
    build(
      "ja-m8-4-2-build-dono-yasui",
      "Ask: Which camera is cheap?",
      "どの カメラが やすいですか",
      ["この", "やすい", "は", "か", "どの", "が", "カメラ", "です"],
      ["どの", "カメラ", "が", "やすい", "です", "か"],
    ),
    build(
      "ja-m8-4-2-build-toshokan-hon",
      "Say: The library's books are interesting.",
      "としょかんの ほんは おもしろいです",
      ["つまらない", "としょかん", "は", "の", "ほん", "おもしろい", "です"],
      ["としょかん", "の", "ほん", "は", "おもしろい", "です"],
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
      "その しんぶんは おもしろいです",
      "That newspaper is interesting.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-4-2-rev-mcq-1", M8_4_2_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of たべます (M7) combined with this module's と.
    listeningCompSentence({
      id: "ja-m8-4-2-rev-lc-1",
      audioText: "パンと ごはんを たべます",
      correctMeaningEn: "I eat bread and rice.",
      distractorsEn: [
        "I eat bread and sushi.",
        "I drink bread and rice.",
        "Bread and rice, please.",
      ],
    }),
    speaking("ja-m8-4-2-rev-speak-1", M8_4_2_REVIEW[2].kana, M8_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-4-2-rev", M8_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_4_2.steps);
assertAnswerRotation(M8_4_2.steps, 2);
assertNoConsecutiveSame(M8_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-5-1 — "Hard and easy" intro
//   (むずかしい, やさしい, はやい, おそい)
// ═══════════════════════════════════════════════════════════════════════

const M8_5_1_REVIEW = pickReviewAtoms("ja-m8-5-1-rev", M8_REVIEW_POOL, 6);

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
    // ── むずかしい (difficult) ──
    build(
      "ja-m8-5-1-build-muzukashii",
      "Pick the Japanese word for: Difficult",
      "むずかしい",
      ["やさしい", "はやい", "おそい", "むずかしい"],
      ["むずかしい"],
    ),
    listeningCompSentence({
      id: "ja-m8-5-1-lc-muzukashii",
      audioText: "この ほんは むずかしいです",
      correctMeaningEn: "This book is difficult.",
      distractorsEn: [
        "This book is easy.",
        "That book is difficult.",
        "This book is interesting.",
      ],
    }),
    // ── やさしい (easy/kind) ──
    build(
      "ja-m8-5-1-build-yasashii",
      "Pick the Japanese word for: Easy / Kind",
      "やさしい",
      ["むずかしい", "やすい", "いい", "やさしい"],
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
      ["みじかい", "ながい", "おそい", "はやい"],
      ["はやい"],
    ),
    speaking("ja-m8-5-1-speak-hayai", "はやい", "Fast / Early"),
    // ── おそい (slow/late) ──
    build(
      "ja-m8-5-1-build-osoi",
      "Pick the Japanese word for: Slow / Late",
      "おそい",
      ["はやい", "おおきい", "おそい", "ふるい"],
      ["おそい"],
    ),
    listeningCompSentence({
      id: "ja-m8-5-1-lc-osoi",
      audioText: "この でんしゃは おそいです",
      correctMeaningEn: "This train is slow.",
      distractorsEn: [
        "This train is fast.",
        "This bus is slow.",
        "That train (over there) is slow.",
      ],
    }),
    // ── Sentence drills ──
    build(
      "ja-m8-5-1-build-kono-test",
      "Say: This test is difficult.",
      "この テストは むずかしいです",
      ["は", "テスト", "むずかしい", "その", "やさしい", "です", "この"],
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
    build(
      "ja-m8-5-1-build-nihon-densha",
      "Say: Japanese trains are fast.",
      "にほんの でんしゃは はやいです",
      ["はやい", "おそい", "にほん", "の", "でんしゃ", "です", "は"],
      ["にほん", "の", "でんしゃ", "は", "はやい", "です"],
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
      target: "この じしょは むずかしいです",
      tiles: ["むずかしい", "この", "じしょ", "です", "は", "やさしい", "その"],
      correctOrder: ["この", "じしょ", "は", "むずかしい", "です"],
      promptEn: "Hear it, build it: 'This dictionary is difficult.'",
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
      "その ほんは むずかしいです",
      "That book is difficult.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-5-1-rev-mcq-1", M8_5_1_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of ラーメン (M7) with an M8-1 adjective.
    listeningCompSentence({
      id: "ja-m8-5-1-rev-lc-1",
      audioText: "この ラーメンは やすいです",
      correctMeaningEn: "This ramen is cheap.",
      distractorsEn: [
        "This ramen is expensive.",
        "This sushi is cheap.",
        "That ramen (over there) is cheap.",
      ],
    }),
    speaking("ja-m8-5-1-rev-speak-1", M8_5_1_REVIEW[2].kana, M8_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-5-1-rev", M8_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_5_1.steps);
assertAnswerRotation(M8_5_1.steps, 1);
assertNoConsecutiveSame(M8_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-5-2 — "Hard and easy" practice
//   (interleaved adj negative + と)
// ═══════════════════════════════════════════════════════════════════════

const M8_5_2_REVIEW = pickReviewAtoms("ja-m8-5-2-rev", M8_REVIEW_POOL, 6);

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
      ["はやくない", "です", "でんしゃ", "おそい", "はやい", "この", "は"],
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
      ["やさしい", "この", "です", "は", "テスト", "むずかしい", "やさしくない"],
      ["この", "テスト", "は", "やさしくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-5-2-lb-hayai-densha",
      target: "あの でんしゃは はやいです",
      tiles: ["おそい", "あの", "です", "はやい", "でんしゃ", "この", "は"],
      correctOrder: ["あの", "でんしゃ", "は", "はやい", "です"],
      promptEn: "Hear it, build it: 'That train (over there) is fast.'",
    }),
    listeningBuildSentence({
      id: "ja-m8-5-2-lb-osoi-bus",
      target: "あの バスは おそいです",
      tiles: ["です", "バス", "はやい", "おそい", "あの", "は", "この"],
      correctOrder: ["あの", "バス", "は", "おそい", "です"],
      promptEn: "Hear it, build it: 'That bus (over there) is slow.'",
    }),
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
      "この バスは はやくないです",
      "This bus isn't fast.",
    ),
    build(
      "ja-m8-5-2-build-to-coffee",
      "Say: Coffee and tea, please.",
      "コーヒーと おちゃを ください",
      ["は", "コーヒー", "おちゃ", "と", "ください", "を", "みず"],
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
    sentenceMcq({
      id: "ja-m8-5-2-mcq-sensei-test",
      prompt: "Which sentence means 'The teacher's test is difficult.'?",
      correctKana: "せんせいの テストは むずかしいです。",
      distractorsKana: [
        "せんせいは テストは むずかしいです。",
        "せんせいの テストは やさしいです。",
        "がくせいの テストは むずかしいです。",
      ],
      explanation: "の marks possession — the teacher's test. むずかしい = difficult.",
    }),
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
      "わたしの せんせいは やさしいです",
      "My teacher is kind.",
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
  ],
};

assertNoSameAnswerCluster(M8_5_2.steps);
assertAnswerRotation(M8_5_2.steps, 2);
assertNoConsecutiveSame(M8_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-6-1 — "Near and far" intro
//   (ちかい, とおい, ひろい, せまい)
// ═══════════════════════════════════════════════════════════════════════

const M8_6_1_REVIEW = pickReviewAtoms("ja-m8-6-1-rev", M8_REVIEW_POOL, 6);

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
    // ── ちかい (near) ──
    build(
      "ja-m8-6-1-build-chikai",
      "Pick the Japanese word for: Near",
      "ちかい",
      ["とおい", "ひろい", "ちかい", "せまい"],
      ["ちかい"],
    ),
    listeningCompSentence({
      id: "ja-m8-6-1-lc-chikai",
      audioText: "がっこうは ちかいです",
      correctMeaningEn: "The school is near.",
      distractorsEn: [
        "The school is far.",
        "The station is near.",
        "The school is big.",
      ],
    }),
    // ── とおい (far) ──
    build(
      "ja-m8-6-1-build-tooi",
      "Pick the Japanese word for: Far",
      "とおい",
      ["ながい", "おおきい", "とおい", "ちかい"],
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
      ["おおきい", "ひろい", "せまい", "ながい"],
      ["ひろい"],
    ),
    speaking("ja-m8-6-1-speak-hiroi", "ひろい", "Wide / Spacious"),
    // ── せまい (narrow/cramped) ──
    build(
      "ja-m8-6-1-build-semai",
      "Pick the Japanese word for: Narrow / Cramped",
      "せまい",
      ["ひろい", "みじかい", "せまい", "ちいさい"],
      ["せまい"],
    ),
    listeningCompSentence({
      id: "ja-m8-6-1-lc-semai",
      audioText: "わたしの へやは せまいです",
      correctMeaningEn: "My room is cramped.",
      distractorsEn: [
        "My room is spacious.",
        "My house is cramped.",
        "My room is new.",
      ],
    }),
    // ── Sentence drills ──
    build(
      "ja-m8-6-1-build-kono-eki",
      "Say: This station is near.",
      "この えきは ちかいです",
      ["えき", "その", "ちかい", "は", "この", "です", "とおい"],
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
    build(
      "ja-m8-6-1-build-gakkou-hiroi",
      "Say: That school is spacious.",
      "あの がっこうは ひろいです",
      ["がっこう", "は", "この", "あの", "ひろい", "せまい", "です"],
      ["あの", "がっこう", "は", "ひろい", "です"],
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
      tiles: ["は", "です", "ちかい", "とおい", "この", "えき", "コンビニ"],
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
      "あの やまは とおいです",
      "That mountain (over there) is far.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-6-1-rev-mcq-1", M8_6_1_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of なな (M5) — odd-numbers counting run.
    listeningCompSentence({
      id: "ja-m8-6-1-rev-lc-1",
      audioText: "いち、さん、ご、なな",
      correctMeaningEn: "1, 3, 5, 7",
      distractorsEn: ["1, 2, 3, 4", "2, 4, 6, 8", "7, 5, 3, 1"],
    }),
    speaking("ja-m8-6-1-rev-speak-1", M8_6_1_REVIEW[2].kana, M8_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-6-1-rev", M8_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_6_1.steps);
assertAnswerRotation(M8_6_1.steps, 1);
assertNoConsecutiveSame(M8_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-6-2 — "Near and far" practice
//   (full adj system drill)
// ═══════════════════════════════════════════════════════════════════════

const M8_6_2_REVIEW = pickReviewAtoms("ja-m8-6-2-rev", M8_REVIEW_POOL, 6);

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
      ["は", "がっこう", "です", "とおい", "とおくない", "ちかい"],
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
    speaking(
      "ja-m8-6-2-speak-semai-mise",
      "あの みせは せまいです",
      "That shop (over there) is cramped.",
    ),
    build(
      "ja-m8-6-2-build-hirokunai",
      "Say: This room isn't spacious.",
      "この へやは ひろくないです",
      ["せまい", "この", "は", "ひろい", "です", "ひろくない", "へや"],
      ["この", "へや", "は", "ひろくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-6-2-lb-semai-ie",
      target: "この いえは せまいです",
      tiles: ["です", "ひろい", "せまい", "は", "あの", "この", "いえ"],
      correctOrder: ["この", "いえ", "は", "せまい", "です"],
      promptEn: "Hear it, build it: 'This house is cramped.'",
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
      ["です", "は", "へや", "が", "か", "どの", "この", "ひろい"],
      ["どの", "へや", "が", "ひろい", "です", "か"],
    ),
    build(
      "ja-m8-6-2-build-eki-semai",
      "Say: The station's toilet is cramped.",
      "えきの トイレは せまいです",
      ["の", "は", "せまい", "です", "えき", "トイレ", "ひろい"],
      ["えき", "の", "トイレ", "は", "せまい", "です"],
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
      "ぎんこうは ちかいです",
      "The bank is near.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-6-2-rev-mcq-1", M8_6_2_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of コンビニ (M6) with this lesson's adjective.
    listeningCompSentence({
      id: "ja-m8-6-2-rev-lc-1",
      audioText: "あの コンビニは ちかいです",
      correctMeaningEn: "That convenience store (over there) is near.",
      distractorsEn: [
        "That convenience store (over there) is far.",
        "This convenience store is near.",
        "That shop (over there) is near.",
      ],
    }),
    speaking("ja-m8-6-2-rev-speak-1", M8_6_2_REVIEW[2].kana, M8_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-6-2-rev", M8_6_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_6_2.steps);
assertAnswerRotation(M8_6_2.steps, 2);
assertNoConsecutiveSame(M8_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-8-1 / M8-8-2 — "This way, please" (polite direction demonstratives)
//
// Backlog weave (2026-06-12): completes the こそあど paradigm with the
// polite direction series こちら/そちら/あちら/どちら, plus どう(ですか)
// — the natural question word for an adjectives module.
//
// ⚠️ EXPORTED BUT NOT REGISTERED. Registration (mockLessons.ts) + atom
// registry updates (courseAtoms.ts: fromModule/introducedByLessonId for
// kochira/sochira/achira/dochira/dou) are central changes — see the
// reauthor report. Recommended position: between ja-m8-6-2 and ja-m8-story.
// ═══════════════════════════════════════════════════════════════════════

const RULE_KOCHIRA = grammarRule({
  id: "ja-m8-rule-kochira",
  title: "こちら / そちら / あちら / どちら — polite directions",
  rule:
    "The last こそあど set: こちら (this way, near me), そちら (that way, near you), あちら (over there, far from both), どちら (which way?). They're the polite cousins of ここ/そこ/あそこ/どこ — staff and strangers use them constantly.",
  examples: [
    {
      ja: "トイレは こちらです。",
      romaji: "toire wa kochira desu.",
      en: "The bathroom is this way.",
    },
    {
      ja: "えきは あちらです。",
      romaji: "eki wa achira desu.",
      en: "The station is over there.",
    },
    {
      ja: "としょかんは どちらですか。",
      romaji: "toshokan wa dochira desu ka.",
      en: "Which way is the library?",
    },
  ],
  antiPattern: {
    ja: "こちら ほんは おもしろいです。",
    romaji: "kochira hon wa omoshiroi desu.",
    en: "(broken — こちら stands alone; before a noun use この)",
    why: "こちら works like これ/ここ — it never attaches to a noun. 'This book' is この ほん.",
  },
  cultureNote:
    "Shop staff greet you with こちらへ どうぞ ('this way, please'). どちら is also the extra-polite way to ask where someone is from: どちらからですか.",
});

const M8_8_1_REVIEW = pickReviewAtoms("ja-m8-8-1-rev", M8_REVIEW_POOL, 6);

export const M8_8_1: LessonContent = {
  id: "ja-m8-8-1",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "This way, please I",
  description:
    "The polite direction series こちら/そちら/あちら/どちら — pointing the way like shop staff do.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_KOCHIRA,
    // ── こちら (this way) ──
    build(
      "ja-m8-8-1-build-kochira",
      "Pick the Japanese word for: This way (polite)",
      "こちら",
      ["そちら", "こちら", "あちら", "どちら"],
      ["こちら"],
    ),
    listeningCompSentence({
      id: "ja-m8-8-1-lc-kochira",
      audioText: "トイレは こちらです",
      correctMeaningEn: "The bathroom is this way.",
      distractorsEn: [
        "The bathroom is over there.",
        "Which way is the bathroom?",
        "The bathroom is that way (near you).",
      ],
    }),
    // ── そちら (that way, near you) ──
    build(
      "ja-m8-8-1-build-sochira",
      "Pick the Japanese word for: That way, near you (polite)",
      "そちら",
      ["あちら", "そちら", "どちら", "こちら"],
      ["そちら"],
    ),
    speaking("ja-m8-8-1-speak-sochira", "そちら", "That way (near you)"),
    // ── あちら (over there) ──
    build(
      "ja-m8-8-1-build-achira",
      "Pick the Japanese word for: Over there (polite)",
      "あちら",
      ["こちら", "そちら", "あちら", "どちら"],
      ["あちら"],
    ),
    listeningCompSentence({
      id: "ja-m8-8-1-lc-achira",
      audioText: "こうえんは あちらです",
      correctMeaningEn: "The park is over there.",
      distractorsEn: [
        "The park is this way.",
        "The park is that way (near you).",
        "The station is over there.",
      ],
    }),
    // ── どちら (which way?) ──
    build(
      "ja-m8-8-1-build-dochira",
      "Pick the Japanese word for: Which way? (polite)",
      "どちら",
      ["あちら", "こちら", "そちら", "どちら"],
      ["どちら"],
    ),
    // ── Sentence drills ──
    build(
      "ja-m8-8-1-build-ginkou",
      "Say: The bank is this way.",
      "ぎんこうは こちらです",
      ["こちら", "ぎんこう", "は", "です", "あちら", "そちら"],
      ["ぎんこう", "は", "こちら", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-8-1-mcq-achira",
      prompt: "Which sentence means 'The hospital is over there.'?",
      correctKana: "びょういんは あちらです。",
      distractorsKana: [
        "びょういんは こちらです。",
        "びょういんは そちらです。",
        "えきは あちらです。",
      ],
      explanation: "あちら = over there, far from both speaker and listener.",
    }),
    build(
      "ja-m8-8-1-build-toshokan",
      "Ask: Which way is the library?",
      "としょかんは どちらですか",
      ["どちら", "としょかん", "は", "です", "か", "こちら"],
      ["としょかん", "は", "どちら", "です", "か"],
    ),
    listeningBuildSentence({
      id: "ja-m8-8-1-lb-sochira",
      target: "えきは そちらです",
      tiles: ["そちら", "えき", "は", "です", "あちら"],
      correctOrder: ["えき", "は", "そちら", "です"],
      promptEn: "Hear it, build it: 'The station is that way (near you).'",
    }),
    selfExplain({
      id: "ja-m8-8-1-self-explain",
      anchorLabel: "You used こちら in: ぎんこうは こちらです",
      anchorAudioText: "ぎんこうは こちらです",
      question: "How is こちら different from ここ?",
      rule: {
        text: "こちら is the polite version — it points at a direction or side, and is what you'd use with strangers or customers.",
      },
      surface: { text: "こちら is the casual version of ここ." },
      distractor: { text: "こちら means 'far away'; ここ means 'near.'" },
      ruleExplanation:
        "こ/そ/あ/ど + ちら is the polite direction series. Staff and strangers say こちら/そちら/あちら where friends might say ここ/そこ/あそこ.",
    }),
    speaking(
      "ja-m8-8-1-speak-dochira",
      "トイレは どちらですか",
      "Which way is the bathroom?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-8-1-rev-mcq-1", M8_8_1_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of さん (M5) — the classic counting run.
    listeningCompSentence({
      id: "ja-m8-8-1-rev-lc-1",
      audioText: "いち、に、さん",
      correctMeaningEn: "1, 2, 3",
      distractorsEn: ["3, 2, 1", "2, 3, 4", "1, 3, 5"],
    }),
    speaking("ja-m8-8-1-rev-speak-1", M8_8_1_REVIEW[2].kana, M8_8_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-8-1-rev", M8_8_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_8_1.steps);
assertAnswerRotation(M8_8_1.steps, 1);
assertNoConsecutiveSame(M8_8_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-8-2 — "This way, please" practice + どうですか
// ═══════════════════════════════════════════════════════════════════════

const RULE_DOU = grammarRule({
  id: "ja-m8-rule-dou",
  title: "どうですか — how is it?",
  rule:
    "どう asks 'how?'. [topic]は どうですか = 'How is [topic]?' — and the natural answer is one of your new adjectives: おいしいです, むずかしいです, いいです.",
  examples: [
    {
      ja: "この ほんは どうですか。",
      romaji: "kono hon wa dou desu ka.",
      en: "How is this book?",
    },
    {
      ja: "がっこうは どうですか。",
      romaji: "gakkou wa dou desu ka.",
      en: "How is school?",
    },
  ],
  antiPattern: {
    ja: "トイレは どうですか。",
    romaji: "toire wa dou desu ka.",
    en: "(odd when asking for directions — this asks 'how is the toilet?', not 'where is it?')",
    why: "どう asks for a description. To ask the way, use どちら (or どこ): トイレは どちらですか.",
  },
});

const M8_8_2_REVIEW = pickReviewAtoms("ja-m8-8-2-rev", M8_REVIEW_POOL, 6);

export const M8_8_2: LessonContent = {
  id: "ja-m8-8-2",
  moduleId: "m8",
  courseId: COURSE,
  languageId: LANG,
  title: "This way, please II",
  description:
    "Drill the polite direction series, plus どうですか — the question your adjectives were made to answer.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_DOU,
    build(
      "ja-m8-8-2-build-dou-hon",
      "Ask: How is this book?",
      "この ほんは どうですか",
      ["どう", "この", "ほん", "は", "です", "か", "どちら"],
      ["この", "ほん", "は", "どう", "です", "か"],
    ),
    sentenceMcq({
      id: "ja-m8-8-2-mcq-dou-reply",
      prompt: "Someone asks: この ラーメンは どうですか。 Which reply makes sense?",
      correctKana: "おいしいです。",
      distractorsKana: ["こちらです。", "ラーメンです。", "ください。"],
      explanation:
        "どうですか asks for a description, so you answer with an adjective.",
    }),
    listeningCompSentence({
      id: "ja-m8-8-2-lc-dou-kamera",
      audioText: "その カメラは どうですか",
      correctMeaningEn: "How is that camera?",
      distractorsEn: [
        "Which way is that camera?",
        "Which camera is good?",
        "That camera is good.",
      ],
    }),
    build(
      "ja-m8-8-2-build-mise-achira",
      "Say: The shop is over there.",
      "みせは あちらです",
      ["あちら", "みせ", "は", "です", "こちら", "どちら"],
      ["みせ", "は", "あちら", "です"],
    ),
    speaking(
      "ja-m8-8-2-speak-konbini",
      "コンビニは どちらですか",
      "Which way is the convenience store?",
    ),
    listeningBuildSentence({
      id: "ja-m8-8-2-lb-hoteru",
      target: "ホテルは そちらです",
      tiles: ["そちら", "ホテル", "は", "です", "どちら"],
      correctOrder: ["ホテル", "は", "そちら", "です"],
      promptEn: "Hear it, build it: 'The hotel is that way (near you).'",
    }),
    sentenceMcq({
      id: "ja-m8-8-2-mcq-dou-gakkou",
      prompt: "Which question asks 'How is school?'",
      correctKana: "がっこうは どうですか。",
      distractorsKana: [
        "がっこうは どちらですか。",
        "がっこうは どこですか。",
        "がっこうは いいですか。",
      ],
      explanation:
        "どう = how. どちら = which way, どこ = where — different questions.",
    }),
    build(
      "ja-m8-8-2-build-heya-kochira",
      "Say: My friend's room is this way.",
      "ともだちの へやは こちらです",
      ["へや", "ともだち", "こちら", "の", "は", "です", "あちら"],
      ["ともだち", "の", "へや", "は", "こちら", "です"],
    ),
    selfExplain({
      id: "ja-m8-8-2-self-explain",
      anchorLabel: "You asked: がっこうは どうですか",
      anchorAudioText: "がっこうは どうですか",
      question: "What kind of answer does どうですか expect?",
      rule: {
        text: "A description — usually an adjective sentence, like おもしろいです or むずかしいです.",
      },
      surface: { text: "A yes-or-no answer." },
      distractor: { text: "A place name — どうですか asks where something is." },
      ruleExplanation:
        "どう asks 'how?', so the natural reply is an adjective. どちら asks 'which way?', どこ asks 'where?' — keep the three apart.",
    }),
    speaking(
      "ja-m8-8-2-speak-dou",
      "あの みせは どうですか",
      "How is that shop (over there)?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m8-8-2-rev-mcq-1", M8_8_2_REVIEW[0], M8_REVIEW_POOL),
    // Sentence-level review of みせ (M6) with this lesson's どちら question.
    listeningCompSentence({
      id: "ja-m8-8-2-rev-lc-1",
      audioText: "みせは どちらですか",
      correctMeaningEn: "Which way is the shop?",
      distractorsEn: [
        "Which way is the station?",
        "The shop is this way.",
        "How is the shop?",
      ],
    }),
    speaking("ja-m8-8-2-rev-speak-1", M8_8_2_REVIEW[2].kana, M8_8_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-8-2-rev", M8_8_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_8_2.steps);
assertAnswerRotation(M8_8_2.steps, 1);
assertNoConsecutiveSame(M8_8_2.steps);

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
    "Follow a narrated shopping trip — cameras and watches described with adjectives and demonstratives — and reply with your own sentences.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m8-story-s1",
      narrative: [
        { kana: "きょう、ともだちと カメラの みせに いきます。" },
        { kana: "その みせは ひろいです。" },
        { kana: "みせに カメラと とけいが あります。" },
        { kana: "あたらしい カメラは たかいです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "Where does the narrator go today?",
          correctText: "To a camera shop, with a friend.",
          distractors: [
            "To the station, with a friend.",
            "To a camera shop, alone.",
            "To the library, with a teacher.",
          ],
          explanation:
            "ともだちと カメラの みせに いきます = 'I go to the camera shop with a friend.'",
        },
        {
          id: "s1-q2",
          prompt: "What is in the shop?",
          correctText: "Cameras and watches.",
          distractors: [
            "Cameras and bags.",
            "Watches and pens.",
            "Cameras and books.",
          ],
          explanation: "カメラと とけいが あります — と joins the two nouns.",
        },
      ],
      responseBuild: {
        target: "どの とけいが やすいですか",
        tiles: ["とけい", "やすい", "どの", "です", "が", "か", "この"],
        correctOrder: ["どの", "とけい", "が", "やすい", "です", "か"],
        promptEn: "Ask the shop staff: 'Which watch is cheap?'",
      },
    }),
    sentenceMcq({
      id: "ja-m8-story-mcq-atarashii",
      prompt: "How did the story describe the new cameras?",
      correctKana: "あたらしい カメラは たかいです。",
      distractorsKana: [
        "あたらしい カメラは やすいです。",
        "ふるい カメラは たかいです。",
        "あたらしい カメラは おおきいです。",
      ],
    }),
    ...storyComprehension({
      idPrefix: "ja-m8-story-s2",
      narrative: [
        { kana: "ふるい カメラは やすいです。" },
        { kana: "ちいさい とけいも やすいです。" },
        { kana: "その ちいさい とけいは あたらしいです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "Are the old cameras expensive?",
          correctText: "No — they're cheap.",
          distractors: [
            "Yes — they're expensive.",
            "The story doesn't say.",
            "They're sold out.",
          ],
          explanation: "ふるい カメラは やすいです = 'The old cameras are cheap.'",
        },
        {
          id: "s2-q2",
          prompt: "What does the story say about the small watch?",
          correctText: "It's cheap and new.",
          distractors: [
            "It's expensive but new.",
            "It's cheap but old.",
            "It's big and cheap.",
          ],
          explanation:
            "ちいさい とけいも やすいです (cheap too) + あたらしいです (new).",
        },
      ],
      responseBuild: {
        target: "この とけいと あの カメラを ください",
        tiles: ["と", "この", "カメラ", "とけい", "ください", "あの", "を", "その"],
        correctOrder: ["この", "とけい", "と", "あの", "カメラ", "を", "ください"],
        promptEn:
          "Tell the staff what you want: 'This watch and that camera (over there), please.'",
      },
    }),
    cloze(
      "ja-m8-story-cloze-to",
      "みせに カメラ",
      " とけいが あります。",
      "と",
      ["と", "は", "が", "の"],
      "There are cameras and watches in the shop.",
      "みせに カメラと とけいが あります。",
      "と joins the two nouns — cameras AND watches.",
    ),
    listeningBuildSentence({
      id: "ja-m8-story-lb-furui",
      target: "ふるい カメラは やすいです",
      tiles: ["カメラ", "ふるい", "やすい", "は", "です", "あたらしい", "たかい"],
      correctOrder: ["ふるい", "カメラ", "は", "やすい", "です"],
      promptEn: "Hear it, build it: 'The old cameras are cheap.'",
    }),
    speaking(
      "ja-m8-story-speak-mo",
      "ちいさい とけいも やすいです",
      "The small watches are cheap too.",
    ),
    sentenceMcq({
      id: "ja-m8-story-mcq-summary",
      prompt: "In the story, which item was both cheap AND new?",
      correctKana: "ちいさい とけい",
      distractorsKana: ["ふるい カメラ", "あたらしい カメラ", "おおきい とけい"],
      explanation: "The small watch was やすい (cheap) and あたらしい (new).",
    }),
    speaking(
      "ja-m8-story-speak-kudasai",
      "この とけいと あの カメラを ください",
      "This watch and that camera (over there), please.",
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

const M8_7_1_REVIEW = pickReviewAtoms("ja-m8-7-1-rev", M8_REVIEW_POOL, 6);

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
      ["しんぶん", "は", "です", "あたらしい", "ふるい", "その", "この"],
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
      ["みせ", "は", "わるい", "よくない", "その", "です", "いい"],
      ["その", "みせ", "は", "よくない", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m8-7-1-lb-oishii-ramen",
      target: "この ラーメンは おいしいです",
      tiles: ["まずい", "あつい", "は", "おいしい", "です", "この", "ラーメン"],
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
      ["あの", "ひろい", "この", "へや", "は", "です", "せまい"],
      ["この", "へや", "は", "せまい", "です"],
    ),
    sentenceMcq({
      id: "ja-m8-7-1-mcq-ane-heya",
      prompt: "Which sentence means 'My older sister's room is spacious.'?",
      correctKana: "あねの へやは ひろいです。",
      distractorsKana: [
        "あにの へやは ひろいです。",
        "あねの へやは せまいです。",
        "わたしの へやは ひろいです。",
      ],
      explanation: "の marks possession, and あね = older sister. ひろい = spacious.",
    }),
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
    // Sentence-level review of コンビニ (M6) with an M8 carrier adjective.
    listeningCompSentence({
      id: "ja-m8-7-1-rev-lc-1",
      audioText: "この コンビニは あたらしいです",
      correctMeaningEn: "This convenience store is new.",
      distractorsEn: [
        "This convenience store is old.",
        "This shop is new.",
        "That convenience store (over there) is new.",
      ],
    }),
    speaking("ja-m8-7-1-rev-speak-1", M8_7_1_REVIEW[2].kana, M8_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-7-1-rev", M8_7_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M8_7_1.steps);
assertAnswerRotation(M8_7_1.steps, 2);
assertNoConsecutiveSame(M8_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M8-7-2 — "Production"
//   (translate + build + speaking heavy)
// ═══════════════════════════════════════════════════════════════════════

const M8_7_2_REVIEW = pickReviewAtoms("ja-m8-7-2-rev", M8_REVIEW_POOL, 6);

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
    build(
      "ja-m8-7-2-build-1",
      "Say: This coffee is delicious.",
      "この コーヒーは おいしいです",
      ["おいしい", "まずい", "は", "この", "です", "その", "コーヒー"],
      ["この", "コーヒー", "は", "おいしい", "です"],
    ),
    speaking(
      "ja-m8-7-2-speak-1",
      "この おちゃは おいしいです",
      "This tea is delicious.",
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
      ["は", "です", "むずかしくない", "この", "むずかしい", "その", "テスト"],
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
      "せんせいの テストは むずかしくないです",
      "The teacher's test isn't difficult.",
    ),
    build(
      "ja-m8-7-2-build-3",
      "Say: Ramen and bread, please.",
      "ラーメンと パンを ください",
      ["は", "ラーメン", "を", "パン", "ください", "と", "コーヒー"],
      ["ラーメン", "と", "パン", "を", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m8-7-2-lb-1",
      target: "あつい コーヒーを のみます",
      tiles: ["コーヒー", "あつい", "のみます", "を", "つめたい", "おちゃ"],
      correctOrder: ["あつい", "コーヒー", "を", "のみます"],
      promptEn: "Hear it, build it: 'I drink hot coffee.'",
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
      "ともだちの いえは ちかいです",
      "My friend's house is near.",
    ),
    build(
      "ja-m8-7-2-build-4",
      "Say: This book isn't good.",
      "この ほんは よくないです",
      ["ほん", "わるい", "この", "は", "よくない", "いい", "です"],
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
    build(
      "ja-m8-7-2-build-chichi-kuruma",
      "Say: Father's car is old.",
      "ちちの くるまは ふるいです",
      ["くるま", "です", "は", "あたらしい", "の", "ちち", "ふるい"],
      ["ちち", "の", "くるま", "は", "ふるい", "です"],
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
    // Sentence-level review of ください (M5) with a prenominal M8 adjective.
    listeningCompSentence({
      id: "ja-m8-7-2-rev-lc-1",
      audioText: "つめたい みずを ください",
      correctMeaningEn: "Cold water, please.",
      distractorsEn: [
        "Hot water, please.",
        "Cold juice, please.",
        "I drink cold water.",
      ],
    }),
    speaking("ja-m8-7-2-rev-speak-1", M8_7_2_REVIEW[2].kana, M8_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m8-7-2-rev", M8_7_2_REVIEW),
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
  // M8_8_1 / M8_8_2 are exported but not yet registered (see header note);
  // they're included here so the import-time lint still covers them.
  M8_8_1, M8_8_2,
  M8_STORY, M8_7_1, M8_7_2,
];

assertNoSameAnswerCluster(ALL_M8.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M8) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
