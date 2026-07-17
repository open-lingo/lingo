/**
 * M18 — Weather & Nature + でしょう (2026-05-25).
 *
 * M18 introduces:
 *   - でしょう (probably / I expect)
 *   - 〜とおもいます (I think that…)
 *   - adjective+noun modification review (consolidated from M8+)
 *
 * Prereqs: い-adjective (M8), な-adjective (M9+), ます-form verbs (M9+).
 *
 * Split into 14 sub-lessons + 1 story = 15 exports. The story lesson uses the
 * storyComprehension() factory (§13.13 locked template).
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * Backlog weave (2026-06-12 sentence-variety rewrite): あつい (hot — kana
 * taught in M8; weather sense woven here in 2-2 / 5-1 / 5-2 / 6-1 / 6-2).
 * だんだん deferred — it needs 〜くなります (not taught until M27).
 *
 * Vocab (~25): てんき, はれ, くもり, あめ, ゆき, かぜ,
 *   あたたかい, すずしい, むしあつい, やま, かわ, うみ, そら, はな, き,
 *   もり, にわ, はる, なつ, あき, ふゆ
 *
 * ID scheme: ja-m18-{n}-{sub} e.g. ja-m18-1-1, ja-m18-1-2
 * Export names: M18_1_1, M18_1_2, M18_2_1, M18_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m18-1, etc.
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
  translateStep,
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
// Per-sub-lesson review-atom draws. Pool is M3-M7.
// ───────────────────────────────────────────────────────────────────────
const M18_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) =>
      a.fromModule === "m3" ||
      a.fromModule === "m4" ||
      a.fromModule === "m5" ||
      a.fromModule === "m6" ||
      a.fromModule === "m7",
  ),
);

// ═══════════════════════════════════════════════════════════════════════
// Grammar rules (defined once, reused across sub-lessons)
// ═══════════════════════════════════════════════════════════════════════

const RULE_DESHOU = grammarRule({
  id: "ja-m18-rule-deshou",
  grammarPointId: "deshou",
  title: "でしょう — probably / I expect",
  rule:
    "でしょう expresses probability or an educated guess. Attach it after a plain form (adjective, noun, or verb): あめでしょう = 'it will probably rain.' With a rising tone (でしょう？) it seeks confirmation: 'right?'",
  examples: [
    {
      ja: "あしたは あめでしょう。",
      romaji: "ashita wa ame deshou.",
      en: "It will probably rain tomorrow.",
    },
    {
      ja: "あしたは あたたかいでしょう。",
      romaji: "ashita wa atatakai deshou.",
      en: "Tomorrow will probably be warm.",
    },
    {
      ja: "この えいがは おもしろいでしょう。",
      romaji: "kono eiga wa omoshiroi deshou.",
      en: "This movie is probably interesting.",
    },
  ],
  antiPattern: {
    ja: "あしたは あめですでしょう。",
    romaji: "ashita wa ame desu deshou.",
    en: "(broken — don't stack です before でしょう with nouns/な-adj)",
    why: "でしょう replaces です — don't use both. あめです → あめでしょう. あたたかいです → あたたかいでしょう.",
  },
  cultureNote:
    "Weather forecasters in Japan use でしょう constantly: あしたは はれでしょう ('It will probably be clear tomorrow.'). It sounds natural and non-committal.",
});

const RULE_TO_OMOIMASU = grammarRule({
  id: "ja-m18-rule-to-omoimasu",
  grammarPointId: "to-omoimasu",
  title: "〜とおもいます — I think that…",
  rule:
    "To express your opinion, put the plain form before と おもいます: あめだと おもいます = 'I think it will rain.' For い-adjectives, the plain form goes directly: さむいと おもいます. For nouns/な-adj, add だ: あめだと おもいます.",
  examples: [
    {
      ja: "あしたは さむいと おもいます。",
      romaji: "ashita wa samui to omoimasu.",
      en: "I think tomorrow will be cold.",
    },
    {
      ja: "あめだと おもいます。",
      romaji: "ame da to omoimasu.",
      en: "I think it will rain.",
    },
    {
      ja: "この やまは きれいだと おもいます。",
      romaji: "kono yama wa kirei da to omoimasu.",
      en: "I think this mountain is beautiful.",
    },
  ],
  antiPattern: {
    ja: "さむいだと おもいます。",
    romaji: "samui da to omoimasu.",
    en: "(broken — い-adjectives don't take だ before と)",
    why: "い-adjectives are already in plain form: さむい + と おもいます. Only nouns and な-adjectives need だ: あめ + だ + と おもいます.",
  },
  cultureNote:
    "と おもいます softens your statement — it's less assertive than stating something as fact. Japanese speakers use it frequently to express personal views politely.",
});

const RULE_ADJ_NOUN_MOD = grammarRule({
  id: "ja-m18-rule-adj-noun-mod",
  title: "Adjective + noun modification (review)",
  rule:
    "い-adjectives modify nouns directly: あたたかい ひ = 'a warm day.' な-adjectives need な before the noun: きれいな やま = 'a beautiful mountain.' This is the same pattern from M8-M9, now applied to weather and nature.",
  examples: [
    {
      ja: "あたたかい ひです。",
      romaji: "atatakai hi desu.",
      en: "It's a warm day.",
    },
    {
      ja: "すずしい かぜが ふいています。",
      romaji: "suzushii kaze ga fuite imasu.",
      en: "A cool breeze is blowing.",
    },
    {
      ja: "きれいな はなが さいています。",
      romaji: "kirei na hana ga saite imasu.",
      en: "Beautiful flowers are blooming.",
    },
  ],
  antiPattern: {
    ja: "あたたかいな ひです。",
    romaji: "atatakai na hi desu.",
    en: "(broken — い-adjectives don't take な)",
    why: "い-adjectives modify directly (あたたかい ひ). Only な-adjectives use な (きれいな やま). Don't mix the patterns.",
  },
});

// ═══════════════════════════════════════════════════════════════════════
// M18-1-1 — "Weather words" vocab intro
//   (てんき, はれ, くもり, あめ, ゆき, かぜ)
// ═══════════════════════════════════════════════════════════════════════

const M18_1_1_REVIEW = pickReviewAtoms("ja-m18-1-1-rev", M18_REVIEW_POOL, 6);

export const M18_1_1: LessonContent = {
  id: "ja-m18-1-1",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Weather words I",
  description:
    "Six core weather words: weather, clear, cloudy, rain, snow, wind.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── てんき (weather) ──
    build(
      "ja-m18-1-1-build-tenki",
      "Pick the Japanese word for: Weather",
      "てんき",
      ["はれ", "てんき", "あめ", "かぜ"],
      ["てんき"],
    ),
    listeningCompSentence({
      id: "ja-m18-1-1-lc-tenki",
      audioText: "きょうは いい てんきですね",
      correctMeaningEn: "Nice weather today, isn't it?",
      distractorsEn: [
        "The weather is bad today.",
        "It will rain tomorrow.",
        "It was cold yesterday.",
      ],
    }),
    // ── はれ (clear weather / sunny) ──
    build(
      "ja-m18-1-1-build-hare",
      "Pick the Japanese word for: Clear weather / Sunny",
      "はれ",
      ["くもり", "あめ", "はれ", "ゆき"],
      ["はれ"],
    ),
    vocabMcq(
      "ja-m18-1-1-mcq-hare",
      { kana: "はれ", meaningEn: "clear / sunny", emoji: "☀️", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── くもり (cloudy) ──
    build(
      "ja-m18-1-1-build-kumori",
      "Pick the Japanese word for: Cloudy",
      "くもり",
      ["はれ", "くもり", "あめ", "かぜ"],
      ["くもり"],
    ),
    vocabMcq(
      "ja-m18-1-1-mcq-kumori",
      { kana: "くもり", meaningEn: "cloudy", emoji: "☁️", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── あめ (rain) ──
    build(
      "ja-m18-1-1-build-ame",
      "Pick the Japanese word for: Rain",
      "あめ",
      ["ゆき", "はれ", "あめ", "くもり"],
      ["あめ"],
    ),
    vocabMcq(
      "ja-m18-1-1-mcq-ame",
      { kana: "あめ", meaningEn: "rain", emoji: "🌧️", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── ゆき (snow) ──
    build(
      "ja-m18-1-1-build-yuki",
      "Pick the Japanese word for: Snow",
      "ゆき",
      ["あめ", "ゆき", "かぜ", "くもり"],
      ["ゆき"],
    ),
    vocabMcq(
      "ja-m18-1-1-mcq-yuki",
      { kana: "ゆき", meaningEn: "snow", emoji: "❄️", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── かぜ (wind) ──
    build(
      "ja-m18-1-1-build-kaze",
      "Pick the Japanese word for: Wind",
      "かぜ",
      ["あめ", "かぜ", "ゆき", "はれ"],
      ["かぜ"],
    ),
    speaking("ja-m18-1-1-speak-kaze", "かぜ", "Wind"),
    // ── Weather sentence drills ──
    build(
      "ja-m18-1-1-build-tenki-ii",
      "Say: The weather is nice today.",
      "きょうは てんきが いいです",
      ["てんき", "きょう", "いい", "は", "が", "です", "わるい", "あめ"],
      ["きょう", "は", "てんき", "が", "いい", "です"],
    ),
    sentenceMcq({
      id: "ja-m18-1-1-mcq-ame",
      prompt: "Which sentence means 'It's raining today.'?",
      correctKana: "きょうは あめです。",
      distractorsKana: [
        "きょうは はれです。",
        "きょうは ゆきです。",
        "あしたは あめです。",
      ],
      explanation: "あめ = rain. きょうは あめです = today is rain (it's raining).",
    }),
    listeningBuildSentence({
      id: "ja-m18-1-1-lb-hare",
      target: "あしたは はれです",
      tiles: ["はれ", "あした", "です", "は", "くもり", "あめ"],
      correctOrder: ["あした", "は", "はれ", "です"],
      promptEn: "Hear it, build it: 'Tomorrow is sunny.'",
    }),
    selfExplain({
      id: "ja-m18-1-1-self-explain",
      anchorLabel: "きょうは あめです / きょうは てんきが いいです",
      anchorAudioText: "きょうは てんきが いいです",
      question: "Why が after てんき but not after あめ?",
      rule: { text: "てんきが いい is a set phrase — てんき is the subject (が) of いい. あめです is just a copula sentence — 'it is rain.' Different structures." },
      surface: { text: "You always use が with weather words and は with rain words." },
      distractor: { text: "Both sentences use は — the が in てんきが is actually optional." },
      ruleExplanation:
        "てんきが いい/わるい = set phrase (weather is good/bad). あめ/はれ/ゆき/くもり + です = copula (it IS rain/clear/etc).",
    }),
    speaking(
      "ja-m18-1-1-speak-ame",
      "きょうは あめです",
      "It's raining today.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-1-1-rev-mcq-1", M18_1_1_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-1-1-rev-lc-1",
      audioText: "パンを さんこ ください",
      correctMeaningEn: "Three pieces of bread, please.",
      distractorsEn: [
        "Two pieces of bread, please.",
        "Three cups of tea, please.",
        "How much is the bread?",
      ],
      exercisedAtomKanas: ["さん"],
    }),
    reviewMatchPairs("ja-m18-1-1-rev", M18_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_1_1.steps);
assertAnswerRotation(M18_1_1.steps, 1);
assertNoConsecutiveSame(M18_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-1-2 — "Weather words" drill
// ═══════════════════════════════════════════════════════════════════════

const M18_1_2_REVIEW = pickReviewAtoms("ja-m18-1-2-rev", M18_REVIEW_POOL, 6);

export const M18_1_2: LessonContent = {
  id: "ja-m18-1-2",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Weather words II",
  description:
    "Drill weather vocab in sentences. Talk about today's and tomorrow's weather.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    build(
      "ja-m18-1-2-build-1",
      "Say: Tomorrow is cloudy.",
      "あしたは くもりです",
      ["くもり", "あした", "です", "は", "はれ", "あめ"],
      ["あした", "は", "くもり", "です"],
    ),
    listeningCompSentence({
      id: "ja-m18-1-2-lc-1",
      audioText: "きょうは ゆきです",
      correctMeaningEn: "It's snowing today.",
      distractorsEn: [
        "It's raining today.",
        "It's sunny today.",
        "It's windy today.",
      ],
    }),
    cloze(
      "ja-m18-1-2-cloze-ga",
      "きょうは てんき",
      " わるいです。",
      "が",
      ["が", "は", "を", "に"],
      "The weather is bad today.",
      "きょうは てんきが わるいです。",
      "が marks てんき as the subject of the adjective わるい.",
    ),
    sentenceMcq({
      id: "ja-m18-1-2-mcq-hare",
      prompt: "Which sentence means 'It's sunny today.'?",
      correctKana: "きょうは はれです。",
      distractorsKana: [
        "きょうは くもりです。",
        "きょうは ゆきです。",
        "あしたは はれです。",
      ],
      explanation: "はれ = clear/sunny. きょう = today.",
    }),
    build(
      "ja-m18-1-2-build-2",
      "Say: The wind is strong today.",
      "きょうは かぜが つよいです",
      ["かぜ", "きょう", "つよい", "は", "が", "です", "よわい"],
      ["きょう", "は", "かぜ", "が", "つよい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m18-1-2-lb-1",
      target: "あしたは ゆきです",
      tiles: ["ゆき", "あした", "です", "は", "あめ", "はれ"],
      correctOrder: ["あした", "は", "ゆき", "です"],
      promptEn: "Hear it, build it: 'Tomorrow is snowy.'",
    }),
    speaking(
      "ja-m18-1-2-speak-1",
      "きょうは てんきが いいです",
      "The weather is nice today.",
    ),
    build(
      "ja-m18-1-2-build-ame",
      "Say: It will rain tomorrow.",
      "あしたは あめです",
      ["あめ", "あした", "です", "は", "ゆき", "きょう"],
      ["あした", "は", "あめ", "です"],
    ),
    translateStep({
      id: "ja-m18-1-2-translate-1",
      promptEn: "It's cloudy today.",
      acceptedAnswers: [
        "きょうは くもりです",
        "きょうは くもりです。",
      ],
      audioText: "きょうは くもりです",
    }),
    build(
      "ja-m18-1-2-build-3",
      "Ask: How's the weather tomorrow?",
      "あしたの てんきは どうですか",
      ["てんき", "あした", "どう", "の", "は", "です", "か", "なん"],
      ["あした", "の", "てんき", "は", "どう", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m18-1-2-lc-2",
      audioText: "あしたは てんきが いいです",
      correctMeaningEn: "The weather will be nice tomorrow.",
      distractorsEn: [
        "The weather is bad tomorrow.",
        "The weather is nice today.",
        "It's raining tomorrow.",
      ],
    }),
    sentenceMcq({
      id: "ja-m18-1-2-mcq-tenki",
      prompt: "Which is the correct way to ask about today's weather?",
      correctKana: "きょうの てんきは どうですか。",
      distractorsKana: [
        "きょうの てんきが どうですか。",
        "きょうは てんきの どうですか。",
        "きょうで てんきは どうですか。",
      ],
      explanation: "きょうの てんきは = as for today's weather. どうですか = how is it?",
    }),
    selfExplain({
      id: "ja-m18-1-2-self-explain",
      anchorLabel: "Weather patterns: copula vs adjective",
      anchorAudioText: "きょうは あめです",
      question: "Why きょうは あめです but きょうは てんきが いいです?",
      rule: { text: "あめです is a copula — 'it IS rain.' てんきが いい is an adjective predicate — 'the weather IS GOOD.' Different structures." },
      surface: { text: "あめ is a noun so it uses です. てんき is also a noun but it means something different." },
      distractor: { text: "You can say あめが いいです too — it means the same thing." },
      ruleExplanation:
        "Copula (noun + です): あめ/はれ/くもり/ゆき + です. Adjective predicate: てんきが + adj + です. Two distinct patterns.",
    }),
    speaking(
      "ja-m18-1-2-speak-2",
      "あしたの てんきは どうですか",
      "How's the weather tomorrow?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-1-2-rev-mcq-1", M18_1_2_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-1-2-rev-lc-1",
      audioText: "あさ おちゃを のみます",
      correctMeaningEn: "I drink green tea in the morning.",
      distractorsEn: [
        "I drink coffee in the morning.",
        "I drink green tea at night.",
        "I eat bread in the morning.",
      ],
      exercisedAtomKanas: ["おちゃ"],
    }),
    speaking("ja-m18-1-2-rev-speak-1", M18_1_2_REVIEW[2].kana, M18_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-1-2-rev", M18_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_1_2.steps);
assertAnswerRotation(M18_1_2.steps, 1);
assertNoConsecutiveSame(M18_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-2-1 — "Probably" (でしょう intro)
// ═══════════════════════════════════════════════════════════════════════

const M18_2_1_REVIEW = pickReviewAtoms("ja-m18-2-1-rev", M18_REVIEW_POOL, 6);

export const M18_2_1: LessonContent = {
  id: "ja-m18-2-1",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Probably (intro)",
  description:
    "でしょう for probability — weather forecasts and predictions. Temperature adjectives.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_DESHOU,
    // ── あたたかい (warm) ──
    build(
      "ja-m18-2-1-build-atatakai",
      "Pick the Japanese word for: Warm",
      "あたたかい",
      ["すずしい", "あたたかい", "あつい", "さむい"],
      ["あたたかい"],
    ),
    listeningCompSentence({
      id: "ja-m18-2-1-lc-atatakai",
      audioText: "きょうは とても あたたかいです",
      correctMeaningEn: "It's very warm today.",
      distractorsEn: [
        "It's very cool today.",
        "It's a little cold today.",
        "It will probably be hot tomorrow.",
      ],
    }),
    // ── すずしい (cool) ──
    build(
      "ja-m18-2-1-build-suzushii",
      "Pick the Japanese word for: Cool (temperature)",
      "すずしい",
      ["あたたかい", "さむい", "すずしい", "あつい"],
      ["すずしい"],
    ),
    speaking("ja-m18-2-1-speak-suzushii", "すずしい", "Cool"),
    // ── むしあつい (humid/muggy) ──
    build(
      "ja-m18-2-1-build-mushiatsui",
      "Pick the Japanese word for: Humid / Muggy",
      "むしあつい",
      ["あたたかい", "むしあつい", "すずしい", "つめたい"],
      ["むしあつい"],
    ),
    listeningCompSentence({
      id: "ja-m18-2-1-lc-mushiatsui",
      audioText: "きょうは むしあついですね",
      correctMeaningEn: "It's muggy today, isn't it?",
      distractorsEn: [
        "It's warm today, isn't it?",
        "It's cool today, isn't it?",
        "It will snow tomorrow.",
      ],
    }),
    // ── でしょう drills ──
    build(
      "ja-m18-2-1-build-deshou-ame",
      "Say: It will probably rain tomorrow.",
      "あしたは あめでしょう",
      ["あめ", "あした", "でしょう", "は", "です", "はれ"],
      ["あした", "は", "あめ", "でしょう"],
    ),
    cloze(
      "ja-m18-2-1-cloze-deshou-1",
      "あしたは はれ",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "ます"],
      "Tomorrow will probably be sunny.",
      "あしたは はれでしょう。",
      "でしょう expresses probability — 'probably sunny.'",
    ),
    sentenceMcq({
      id: "ja-m18-2-1-mcq-deshou",
      prompt: "Which sentence means 'Tomorrow will probably be warm.'?",
      correctKana: "あしたは あたたかいでしょう。",
      distractorsKana: [
        "あしたは あたたかいです。",
        "あしたは すずしいでしょう。",
        "あしたは あたたかいですか。",
      ],
      explanation: "でしょう = probably. あたたかい = warm.",
    }),
    // ── たぶん (probably) — build intro ──
    build(
      "ja-m18-2-1-build-tabun",
      "Pick the Japanese word for: Probably",
      "たぶん",
      ["ときどき", "たぶん", "いつも", "とても"],
      ["たぶん"],
    ),
    listeningCompSentence({
      id: "ja-m18-2-1-lc-tabun",
      audioText: "たぶん きょうは あめでしょう",
      correctMeaningEn: "It will probably rain today.",
      distractorsEn: [
        "It will probably snow today.",
        "It will definitely rain today.",
        "It rained yesterday.",
      ],
    }),
    build(
      "ja-m18-2-1-build-tabun-samui",
      "Say: It will probably be cold tomorrow.",
      "たぶん あしたは さむいでしょう",
      ["さむい", "あした", "たぶん", "でしょう", "は", "あつい"],
      ["たぶん", "あした", "は", "さむい", "でしょう"],
    ),
    listeningBuildSentence({
      id: "ja-m18-2-1-lb-deshou",
      target: "きょうは くもりでしょう",
      tiles: ["くもり", "きょう", "でしょう", "は", "です", "はれ"],
      correctOrder: ["きょう", "は", "くもり", "でしょう"],
      promptEn: "Hear it, build it: 'Today is probably cloudy.'",
    }),
    cloze(
      "ja-m18-2-1-cloze-deshou-2",
      "あしたは すずしい",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "ません"],
      "Tomorrow will probably be cool.",
      "あしたは すずしいでしょう。",
      "い-adjective + でしょう = probably [adjective].",
    ),
    listeningCompSentence({
      id: "ja-m18-2-1-lc-deshou",
      audioText: "あしたは ゆきでしょう",
      correctMeaningEn: "It will probably snow tomorrow.",
      distractorsEn: [
        "It's snowing today.",
        "Tomorrow will be sunny.",
        "It will probably rain tomorrow.",
      ],
    }),
    selfExplain({
      id: "ja-m18-2-1-self-explain",
      anchorLabel: "あめでしょう / あたたかいでしょう",
      anchorAudioText: "らいしゅうは あめでしょう",
      question: "How does でしょう change the meaning compared to です?",
      rule: { text: "です = is (certain). でしょう = probably is (prediction/guess). でしょう replaces です to express uncertainty or probability." },
      surface: { text: "でしょう is just a polite version of です — they mean the same thing." },
      distractor: { text: "でしょう is only used in questions — it can't make statements." },
      ruleExplanation:
        "です = definite statement. でしょう = probability/prediction. Same sentence structure, different certainty level.",
    }),
    speaking(
      "ja-m18-2-1-speak-deshou",
      "あしたは あたたかいでしょう",
      "Tomorrow will probably be warm.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-2-1-rev-mcq-1", M18_2_1_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-2-1-rev-lc-1",
      audioText: M18_2_1_REVIEW[1].kana,
      correctMeaningEn: M18_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_2_1_REVIEW[2].meaningEn,
        M18_2_1_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m18-2-1-rev-speak-1", M18_2_1_REVIEW[2].kana, M18_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-2-1-rev", M18_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_2_1.steps);
assertAnswerRotation(M18_2_1.steps, 1);
assertNoConsecutiveSame(M18_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-2-2 — "Probably" practice
// ═══════════════════════════════════════════════════════════════════════

const M18_2_2_REVIEW = pickReviewAtoms("ja-m18-2-2-rev", M18_REVIEW_POOL, 6);

export const M18_2_2: LessonContent = {
  id: "ja-m18-2-2",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Probably (practice)",
  description:
    "Drill でしょう with weather and temperature vocab. Production practice.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    build(
      "ja-m18-2-2-build-1",
      "Say: It will probably snow tomorrow.",
      "あしたは ゆきでしょう",
      ["ゆき", "あした", "でしょう", "は", "です", "あめ"],
      ["あした", "は", "ゆき", "でしょう"],
    ),
    listeningCompSentence({
      id: "ja-m18-2-2-lc-1",
      audioText: "あしたは むしあついでしょう",
      correctMeaningEn: "Tomorrow will probably be muggy.",
      distractorsEn: [
        "Tomorrow will probably be cool.",
        "It's muggy today.",
        "Tomorrow will probably be warm.",
      ],
    }),
    cloze(
      "ja-m18-2-2-cloze-deshou-1",
      "らいしゅうは さむい",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "ます"],
      "Next week will probably be cold.",
      "らいしゅうは さむいでしょう。",
      "でしょう after い-adjective = probably [adjective].",
    ),
    sentenceMcq({
      id: "ja-m18-2-2-mcq-1",
      prompt: "Which sentence means 'Today is probably cloudy.'?",
      correctKana: "きょうは くもりでしょう。",
      distractorsKana: [
        "きょうは くもりです。",
        "あしたは くもりでしょう。",
        "きょうは はれでしょう。",
      ],
      explanation: "くもり = cloudy. でしょう = probably.",
    }),
    build(
      "ja-m18-2-2-build-2",
      "Say: The wind will probably be strong tomorrow.",
      "あしたは かぜが つよいでしょう",
      ["かぜ", "あした", "つよい", "は", "が", "でしょう", "です"],
      ["あした", "は", "かぜ", "が", "つよい", "でしょう"],
    ),
    cloze(
      "ja-m18-2-2-cloze-deshou-2",
      "あしたは くもり",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "ません"],
      "Tomorrow will probably be cloudy.",
      "あしたは くもりでしょう。",
      "Noun + でしょう = probably [noun].",
    ),
    listeningBuildSentence({
      id: "ja-m18-2-2-lb-1",
      target: "あきは すずしいでしょう",
      tiles: ["すずしい", "あき", "でしょう", "は", "です", "あたたかい"],
      correctOrder: ["あき", "は", "すずしい", "でしょう"],
      promptEn: "Hear it, build it: 'Autumn will probably be cool.'",
    }),
    speaking(
      "ja-m18-2-2-speak-1",
      "なつは あついでしょう",
      "Summer will probably be hot.",
    ),
    translateStep({
      id: "ja-m18-2-2-translate-1",
      promptEn: "It will probably snow next week.",
      acceptedAnswers: [
        "らいしゅうは ゆきでしょう",
        "らいしゅうは ゆきでしょう。",
      ],
      audioText: "らいしゅうは ゆきでしょう",
    }),
    build(
      "ja-m18-2-2-build-3",
      "Say: This summer will probably be muggy.",
      "ことしの なつは むしあついでしょう",
      ["なつ", "ことし", "むしあつい", "の", "は", "でしょう", "すずしい", "です"],
      ["ことし", "の", "なつ", "は", "むしあつい", "でしょう"],
    ),
    listeningCompSentence({
      id: "ja-m18-2-2-lc-2",
      audioText: "あしたは すずしいでしょう",
      correctMeaningEn: "Tomorrow will probably be cool.",
      distractorsEn: [
        "Tomorrow is cool.",
        "Tomorrow will probably be warm.",
        "Today is cool.",
      ],
    }),
    sentenceMcq({
      id: "ja-m18-2-2-mcq-2",
      prompt: "What's the difference between あめです and あめでしょう?",
      correctKana: "です = it IS raining. でしょう = it PROBABLY is/will rain.",
      distractorsKana: [
        "です is casual; でしょう is formal.",
        "です is present; でしょう is past.",
        "They mean the same thing.",
      ],
      explanation: "です = certainty. でしょう = probability/prediction.",
    }),
    selfExplain({
      id: "ja-m18-2-2-self-explain",
      anchorLabel: "でしょう replaces です for predictions",
      anchorAudioText: "あしたは はれでしょう",
      question: "Can you say あめですでしょう?",
      rule: { text: "No — でしょう replaces です, not stacks on top. あめです → あめでしょう. Never あめですでしょう." },
      surface: { text: "Yes — ですでしょう is the extra-polite form of でしょう." },
      distractor: { text: "ですでしょう is only wrong with nouns — with adjectives it's fine." },
      ruleExplanation:
        "でしょう directly replaces です. Noun: あめ + でしょう. い-adj: さむい + でしょう. Never stack です + でしょう.",
    }),
    speaking(
      "ja-m18-2-2-speak-2",
      "あしたは かぜが つよいでしょう",
      "The wind will probably be strong tomorrow.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-2-2-rev-mcq-1", M18_2_2_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-2-2-rev-lc-1",
      audioText: "なまえは なんですか",
      correctMeaningEn: "What is your name?",
      distractorsEn: [
        "How old are you?",
        "Where are you from?",
        "What time is it now?",
      ],
      exercisedAtomKanas: ["なまえ"],
    }),
    speaking("ja-m18-2-2-rev-speak-1", M18_2_2_REVIEW[2].kana, M18_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-2-2-rev", M18_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_2_2.steps);
assertAnswerRotation(M18_2_2.steps, 1);
assertNoConsecutiveSame(M18_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-3-1 — "I think that" (とおもいます intro)
// ═══════════════════════════════════════════════════════════════════════

const M18_3_1_REVIEW = pickReviewAtoms("ja-m18-3-1-rev", M18_REVIEW_POOL, 6);

export const M18_3_1: LessonContent = {
  id: "ja-m18-3-1",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "I think that… (intro)",
  description:
    "とおもいます for opinions. Seasons vocab: はる, なつ, あき, ふゆ.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_TO_OMOIMASU,
    // ── はる (spring) ──
    build(
      "ja-m18-3-1-build-haru",
      "Pick the Japanese word for: Spring",
      "はる",
      ["なつ", "はる", "あき", "ふゆ"],
      ["はる"],
    ),
    vocabMcq(
      "ja-m18-3-1-mcq-haru",
      { kana: "はる", meaningEn: "spring", emoji: "🌸", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── なつ (summer) ──
    build(
      "ja-m18-3-1-build-natsu",
      "Pick the Japanese word for: Summer",
      "なつ",
      ["はる", "ふゆ", "なつ", "あき"],
      ["なつ"],
    ),
    vocabMcq(
      "ja-m18-3-1-mcq-natsu",
      { kana: "なつ", meaningEn: "summer", emoji: "☀️", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── あき (autumn) ──
    build(
      "ja-m18-3-1-build-aki",
      "Pick the Japanese word for: Autumn",
      "あき",
      ["なつ", "あき", "はる", "ふゆ"],
      ["あき"],
    ),
    vocabMcq(
      "ja-m18-3-1-mcq-aki",
      { kana: "あき", meaningEn: "autumn", emoji: "🍂", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── ふゆ (winter) ──
    build(
      "ja-m18-3-1-build-fuyu",
      "Pick the Japanese word for: Winter",
      "ふゆ",
      ["あき", "ふゆ", "はる", "なつ"],
      ["ふゆ"],
    ),
    vocabMcq(
      "ja-m18-3-1-mcq-fuyu",
      { kana: "ふゆ", meaningEn: "winter", emoji: "⛄", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── とおもいます drills ──
    build(
      "ja-m18-3-1-build-omoimasu-1",
      "Say: I think tomorrow will be cold.",
      "あしたは さむいと おもいます",
      ["さむい", "あした", "おもいます", "は", "と", "でしょう", "だ"],
      ["あした", "は", "さむい", "と", "おもいます"],
    ),
    cloze(
      "ja-m18-3-1-cloze-to-1",
      "あめだ",
      " おもいます。",
      "と",
      ["と", "は", "が", "を"],
      "I think it will rain.",
      "あめだと おもいます。",
      "と marks the quoted thought before おもいます.",
    ),
    sentenceMcq({
      id: "ja-m18-3-1-mcq-omoimasu",
      prompt: "Which sentence means 'I think spring is warm.'?",
      correctKana: "はるは あたたかいと おもいます。",
      distractorsKana: [
        "はるは あたたかいです。",
        "はるは あたたかいでしょう。",
        "はるは さむいと おもいます。",
      ],
      explanation: "あたたかいと おもいます = I think it's warm.",
    }),
    listeningBuildSentence({
      id: "ja-m18-3-1-lb-omoimasu",
      target: "あめだと おもいます",
      tiles: ["おもいます", "あめ", "と", "だ", "です", "でしょう"],
      correctOrder: ["あめ", "だ", "と", "おもいます"],
      promptEn: "Hear it, build it: 'I think it will rain.'",
    }),
    selfExplain({
      id: "ja-m18-3-1-self-explain",
      anchorLabel: "さむいと おもいます vs あめだと おもいます",
      anchorAudioText: "さむいと おもいます",
      question: "Why さむいと (no だ) but あめだと (with だ)?",
      rule: { text: "い-adjectives are already plain — さむい + と. Nouns need だ for plain form — あめ + だ + と. Different word types, different connectors." },
      surface: { text: "You always add だ before と — さむいだと is the correct form." },
      distractor: { text: "だ is optional — both さむいと and さむいだと are correct." },
      ruleExplanation:
        "Plain form before と: い-adj → as-is (さむいと). Noun → + だ (あめだと). な-adj → + だ (しずかだと).",
    }),
    speaking(
      "ja-m18-3-1-speak-omoimasu",
      "はるは あたたかいと おもいます",
      "I think spring is warm.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-3-1-rev-mcq-1", M18_3_1_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-3-1-rev-lc-1",
      audioText: "よる テレビを みます",
      correctMeaningEn: "I watch TV at night.",
      distractorsEn: [
        "I read books at night.",
        "I watch TV in the morning.",
        "I listen to music at night.",
      ],
      exercisedAtomKanas: ["みます"],
    }),
    speaking("ja-m18-3-1-rev-speak-1", M18_3_1_REVIEW[2].kana, M18_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-3-1-rev", M18_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_3_1.steps);
assertAnswerRotation(M18_3_1.steps, 1);
assertNoConsecutiveSame(M18_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-3-2 — "I think that" practice
// ═══════════════════════════════════════════════════════════════════════

const M18_3_2_REVIEW = pickReviewAtoms("ja-m18-3-2-rev", M18_REVIEW_POOL, 6);

export const M18_3_2: LessonContent = {
  id: "ja-m18-3-2",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "I think that… (practice)",
  description:
    "Drill とおもいます with weather, seasons, and でしょう contrast.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    build(
      "ja-m18-3-2-build-1",
      "Say: I think summer is muggy.",
      "なつは むしあついと おもいます",
      ["むしあつい", "なつ", "おもいます", "は", "と", "でしょう", "です"],
      ["なつ", "は", "むしあつい", "と", "おもいます"],
    ),
    listeningCompSentence({
      id: "ja-m18-3-2-lc-1",
      audioText: "ふゆは さむいと おもいます",
      correctMeaningEn: "I think winter is cold.",
      distractorsEn: [
        "Winter is cold.",
        "Winter will probably be cold.",
        "I think winter is warm.",
      ],
    }),
    cloze(
      "ja-m18-3-2-cloze-to-1",
      "はれだ",
      " おもいます。",
      "と",
      ["と", "は", "が", "を"],
      "I think it's sunny.",
      "はれだと おもいます。",
      "と marks the quoted thought.",
    ),
    sentenceMcq({
      id: "ja-m18-3-2-mcq-1",
      prompt: "Which sentence means 'I think autumn is cool.'?",
      correctKana: "あきは すずしいと おもいます。",
      distractorsKana: [
        "あきは すずしいでしょう。",
        "あきは すずしいです。",
        "あきは あたたかいと おもいます。",
      ],
      explanation: "すずしいと おもいます = I think it's cool.",
    }),
    build(
      "ja-m18-3-2-build-2",
      "Say: I think tomorrow will be cloudy.",
      "あしたは くもりだと おもいます",
      ["くもり", "あした", "おもいます", "は", "だ", "と", "でしょう"],
      ["あした", "は", "くもり", "だ", "と", "おもいます"],
    ),
    cloze(
      "ja-m18-3-2-cloze-da",
      "ゆき",
      "と おもいます。",
      "だ",
      ["だ", "は", "の", "が"],
      "I think it will snow.",
      "ゆきだと おもいます。",
      "Nouns need だ before と — ゆき + だ + と.",
    ),
    listeningBuildSentence({
      id: "ja-m18-3-2-lb-1",
      target: "ふゆは ゆきが おおいと おもいます",
      tiles: ["ゆき", "ふゆ", "おおい", "は", "が", "と", "おもいます", "でしょう"],
      correctOrder: ["ふゆ", "は", "ゆき", "が", "おおい", "と", "おもいます"],
      promptEn: "Hear it, build it: 'I think winter has a lot of snow.'",
    }),
    speaking(
      "ja-m18-3-2-speak-1",
      "ふゆは さむいと おもいます",
      "I think winter is cold.",
    ),
    translateStep({
      id: "ja-m18-3-2-translate-1",
      promptEn: "I think it's cloudy.",
      acceptedAnswers: [
        "くもりだと おもいます",
        "くもりだと おもいます。",
        "くもりだとおもいます",
        "くもりだとおもいます。",
      ],
      audioText: "くもりだと おもいます",
    }),
    build(
      "ja-m18-3-2-build-3",
      "Say: I think spring is the best season.",
      "はるが いちばん いい きせつだと おもいます",
      ["いちばん", "はる", "いい", "が", "きせつ", "おもいます", "だ", "と", "なつ"],
      ["はる", "が", "いちばん", "いい", "きせつ", "だ", "と", "おもいます"],
    ),
    listeningCompSentence({
      id: "ja-m18-3-2-lc-2",
      audioText: "あしたは くもりだと おもいます",
      correctMeaningEn: "I think tomorrow will be cloudy.",
      distractorsEn: [
        "Tomorrow will probably be cloudy.",
        "Tomorrow is cloudy.",
        "I think tomorrow will be sunny.",
      ],
    }),
    sentenceMcq({
      id: "ja-m18-3-2-mcq-deshou-vs-omoimasu",
      prompt: "What's the difference between でしょう and とおもいます?",
      correctKana: "でしょう = general prediction. とおもいます = personal opinion.",
      distractorsKana: [
        "でしょう is casual; とおもいます is formal.",
        "They mean exactly the same thing.",
        "でしょう is for weather; とおもいます is for everything else.",
      ],
      explanation: "でしょう = objective probability. とおもいます = subjective opinion ('I think').",
    }),
    selfExplain({
      id: "ja-m18-3-2-self-explain",
      anchorLabel: "でしょう vs とおもいます",
      anchorAudioText: "ゆきだと おもいます",
      question: "When would you use あめでしょう vs あめだと おもいます?",
      rule: { text: "あめでしょう = general prediction (like a weather forecast). あめだと おもいます = personal opinion ('I personally think it will rain'). でしょう is objective; とおもいます is subjective." },
      surface: { text: "They're interchangeable — use whichever sounds better." },
      distractor: { text: "でしょう is only for weather; とおもいます is for everything else." },
      ruleExplanation:
        "でしょう = prediction based on evidence. とおもいます = personal belief. A forecaster uses でしょう; you use とおもいます when giving your own take.",
    }),
    speaking(
      "ja-m18-3-2-speak-2",
      "はるが いちばん いい きせつだと おもいます",
      "I think spring is the best season.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-3-2-rev-mcq-1", M18_3_2_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-3-2-rev-lc-1",
      audioText: "あした こうえんに いきます",
      correctMeaningEn: "I'm going to the park tomorrow.",
      distractorsEn: [
        "I'm going to the station tomorrow.",
        "I went to the park yesterday.",
        "There is a park over there.",
      ],
      exercisedAtomKanas: ["こうえん"],
    }),
    speaking("ja-m18-3-2-rev-speak-1", M18_3_2_REVIEW[2].kana, M18_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-3-2-rev", M18_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_3_2.steps);
assertAnswerRotation(M18_3_2.steps, 1);
assertNoConsecutiveSame(M18_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-4-1 — "Nature words" vocab (やま, かわ, うみ, そら, はな, き)
// ═══════════════════════════════════════════════════════════════════════

const M18_4_1_REVIEW = pickReviewAtoms("ja-m18-4-1-rev", M18_REVIEW_POOL, 6);

export const M18_4_1: LessonContent = {
  id: "ja-m18-4-1",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Nature words I",
  description:
    "Six nature words: mountain, river, sea, sky, flower, tree.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── やま (mountain) ──
    build(
      "ja-m18-4-1-build-yama",
      "Pick the Japanese word for: Mountain",
      "やま",
      ["かわ", "やま", "うみ", "もり"],
      ["やま"],
    ),
    vocabMcq(
      "ja-m18-4-1-mcq-yama",
      { kana: "やま", meaningEn: "mountain", emoji: "🏔️", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── かわ (river) ──
    build(
      "ja-m18-4-1-build-kawa",
      "Pick the Japanese word for: River",
      "かわ",
      ["うみ", "かわ", "やま", "はな"],
      ["かわ"],
    ),
    listeningCompSentence({
      id: "ja-m18-4-1-lc-kawa",
      audioText: "この かわは きれいです",
      correctMeaningEn: "This river is beautiful.",
      distractorsEn: [
        "This mountain is beautiful.",
        "This river is big.",
        "The sea is beautiful.",
      ],
    }),
    // ── うみ (sea) ──
    build(
      "ja-m18-4-1-build-umi",
      "Pick the Japanese word for: Sea / Ocean",
      "うみ",
      ["かわ", "そら", "うみ", "やま"],
      ["うみ"],
    ),
    vocabMcq(
      "ja-m18-4-1-mcq-umi",
      { kana: "うみ", meaningEn: "sea / ocean", emoji: "🌊", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── そら (sky) ──
    build(
      "ja-m18-4-1-build-sora",
      "Pick the Japanese word for: Sky",
      "そら",
      ["うみ", "そら", "やま", "き"],
      ["そら"],
    ),
    speaking("ja-m18-4-1-speak-sora", "そら", "Sky"),
    // ── はな (flower) ──
    build(
      "ja-m18-4-1-build-hana",
      "Pick the Japanese word for: Flower",
      "はな",
      ["き", "はな", "もり", "にわ"],
      ["はな"],
    ),
    vocabMcq(
      "ja-m18-4-1-mcq-hana",
      { kana: "はな", meaningEn: "flower", emoji: "🌸", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── き (tree) ──
    build(
      "ja-m18-4-1-build-ki",
      "Pick the Japanese word for: Tree",
      "き",
      ["はな", "もり", "き", "にわ"],
      ["き"],
    ),
    vocabMcq(
      "ja-m18-4-1-mcq-ki",
      { kana: "き", meaningEn: "tree", emoji: "🌳", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── Nature sentence drills ──
    build(
      "ja-m18-4-1-build-yama-kirei",
      "Say: The mountain is beautiful.",
      "やまは きれいです",
      ["きれい", "やま", "です", "は", "おおきい", "うみ"],
      ["やま", "は", "きれい", "です"],
    ),
    sentenceMcq({
      id: "ja-m18-4-1-mcq-umi",
      prompt: "Which sentence means 'The sea is big.'?",
      correctKana: "うみは おおきいです。",
      distractorsKana: [
        "やまは おおきいです。",
        "うみは きれいです。",
        "かわは おおきいです。",
      ],
      explanation: "うみ = sea. おおきい = big.",
    }),
    selfExplain({
      id: "ja-m18-4-1-self-explain",
      anchorLabel: "やまは きれいです",
      anchorAudioText: "やまは きれいです",
      question: "きれい is a な-adjective. Why no な before です?",
      rule: { text: "な-adjectives only use な when modifying a NOUN (きれいな やま). Before です, they stand alone (きれいです). The な is for noun modification, not predication." },
      surface: { text: "きれい is actually an い-adjective — that's why there's no な." },
      distractor: { text: "You need な before です too — きれいなです is the correct form." },
      ruleExplanation:
        "な-adj as predicate: きれいです. な-adj modifying noun: きれいな + noun. The な only appears before nouns.",
    }),
    speaking(
      "ja-m18-4-1-speak-yama",
      "やまは きれいです",
      "The mountain is beautiful.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-4-1-rev-mcq-1", M18_4_1_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-4-1-rev-lc-1",
      audioText: "すみません、ビールを ください",
      correctMeaningEn: "Excuse me, a beer please.",
      distractorsEn: [
        "Excuse me, a coffee please.",
        "Excuse me, some water please.",
        "How much is the beer?",
      ],
      exercisedAtomKanas: ["ビール"],
    }),
    speaking("ja-m18-4-1-rev-speak-1", M18_4_1_REVIEW[2].kana, M18_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-4-1-rev", M18_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_4_1.steps);
assertAnswerRotation(M18_4_1.steps, 1);
assertNoConsecutiveSame(M18_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-4-2 — "Nature words" drill + adjective modification
//   (もり, にわ + adj+noun review)
// ═══════════════════════════════════════════════════════════════════════

const M18_4_2_REVIEW = pickReviewAtoms("ja-m18-4-2-rev", M18_REVIEW_POOL, 6);

export const M18_4_2: LessonContent = {
  id: "ja-m18-4-2",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Nature words II",
  description:
    "Two more nature words (もり, にわ) + adjective-noun modification review.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_ADJ_NOUN_MOD,
    // ── もり (forest) ──
    build(
      "ja-m18-4-2-build-mori",
      "Pick the Japanese word for: Forest",
      "もり",
      ["にわ", "もり", "やま", "き"],
      ["もり"],
    ),
    vocabMcq(
      "ja-m18-4-2-mcq-mori",
      { kana: "もり", meaningEn: "forest", emoji: "🌲", fromModule: "m18" },
      M18_REVIEW_POOL,
    ),
    // ── にわ (garden) ──
    build(
      "ja-m18-4-2-build-niwa",
      "Pick the Japanese word for: Garden",
      "にわ",
      ["もり", "はな", "にわ", "き"],
      ["にわ"],
    ),
    speaking("ja-m18-4-2-speak-niwa", "にわ", "Garden"),
    // ── Adjective+noun modification drills ──
    build(
      "ja-m18-4-2-build-ookii-yama",
      "Say: A big mountain.",
      "おおきい やま",
      ["やま", "おおきな", "おおきい", "うみ", "ちいさい"],
      ["おおきい", "やま"],
    ),
    listeningCompSentence({
      id: "ja-m18-4-2-lc-1",
      audioText: "きれいな はな",
      correctMeaningEn: "a beautiful flower",
      distractorsEn: ["a big flower", "a beautiful mountain", "a small flower"],
    }),
    cloze(
      "ja-m18-4-2-cloze-na",
      "きれい",
      " うみが みえます。",
      "な",
      ["な", "の", "に", "い"],
      "A beautiful sea is visible.",
      "きれいな うみが みえます。",
      "な-adjective + な + noun: きれいな うみ.",
    ),
    sentenceMcq({
      id: "ja-m18-4-2-mcq-adj-mod",
      prompt: "Which is correct: 'a warm day'?",
      correctKana: "あたたかい ひ",
      distractorsKana: [
        "あたたかいな ひ",
        "あたたかい の ひ",
        "あたたかく ひ",
      ],
      explanation: "い-adjective modifies directly — あたたかい ひ. No な needed.",
    }),
    build(
      "ja-m18-4-2-build-kirei-hana",
      "Say: Beautiful flowers are blooming in the garden.",
      "にわに きれいな はなが さいています",
      ["きれい", "にわ", "はな", "に", "な", "が", "さいて", "います", "おおきい"],
      ["にわ", "に", "きれい", "な", "はな", "が", "さいて", "います"],
    ),
    build(
      "ja-m18-4-2-build-kaze",
      "Say: A strong wind is blowing.",
      "つよい かぜが ふいています",
      ["かぜ", "つよい", "ふいて", "が", "います", "すずしい"],
      ["つよい", "かぜ", "が", "ふいて", "います"],
    ),
    listeningBuildSentence({
      id: "ja-m18-4-2-lb-1",
      target: "おおきい もりが あります",
      tiles: ["もり", "おおきい", "あります", "が", "おおきな", "にわ"],
      correctOrder: ["おおきい", "もり", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a big forest.'",
    }),
    speaking(
      "ja-m18-4-2-speak-kirei-hana",
      "きれいな はなが さいています",
      "Beautiful flowers are blooming.",
    ),
    translateStep({
      id: "ja-m18-4-2-translate-1",
      promptEn: "A big mountain.",
      acceptedAnswers: [
        "おおきい やま",
        "おおきいやま",
      ],
      audioText: "おおきい やま",
    }),
    selfExplain({
      id: "ja-m18-4-2-self-explain",
      anchorLabel: "おおきい やま vs きれいな はな",
      anchorAudioText: "きれいな はな",
      question: "Why おおきい やま but きれいな はな?",
      rule: { text: "おおきい (い-adj) modifies nouns directly. きれい (な-adj) needs な before the noun. The adjective type determines the connection." },
      surface: { text: "おおきい is short, so it doesn't need な. きれい is long, so it does." },
      distractor: { text: "Both types can use either form — おおきな やま and きれいい はな both work." },
      ruleExplanation:
        "い-adj → direct modification (おおきい やま). な-adj → な + noun (きれいな はな). Check the ending: い = い-adj; others = な-adj (with exceptions like きれい).",
    }),
    speaking(
      "ja-m18-4-2-speak-mori",
      "おおきい もりが あります",
      "There's a big forest.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-4-2-rev-mcq-1", M18_4_2_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-4-2-rev-lc-1",
      audioText: "あつい おちゃが すきです",
      correctMeaningEn: "I like hot tea.",
      distractorsEn: [
        "I like cold water.",
        "I don't like tea.",
        "The tea is expensive.",
      ],
      exercisedAtomKanas: ["おちゃ"],
    }),
    speaking("ja-m18-4-2-rev-speak-1", M18_4_2_REVIEW[2].kana, M18_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-4-2-rev", M18_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_4_2.steps);
assertAnswerRotation(M18_4_2.steps, 1);
assertNoConsecutiveSame(M18_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-5-1 — Interleaved drill (でしょう + とおもいます + adj-mod)
// ═══════════════════════════════════════════════════════════════════════

const M18_5_1_REVIEW = pickReviewAtoms("ja-m18-5-1-rev", M18_REVIEW_POOL, 6);

export const M18_5_1: LessonContent = {
  id: "ja-m18-5-1",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "All together I",
  description:
    "Interleaved drill: でしょう, とおもいます, adjective modification — all mixed.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    cloze(
      "ja-m18-5-1-cloze-deshou",
      "らいしゅうは はれ",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "ます"],
      "Next week will probably be sunny.",
      "らいしゅうは はれでしょう。",
      "でしょう = probability.",
    ),
    cloze(
      "ja-m18-5-1-cloze-to",
      "この もりは しずかだ",
      " おもいます。",
      "と",
      ["と", "は", "が", "を"],
      "I think this forest is quiet.",
      "この もりは しずかだと おもいます。",
      "な-adjective + だ + と marks the quoted thought before おもいます.",
    ),
    build(
      "ja-m18-5-1-build-1",
      "Say: I think tomorrow will be warm.",
      "あしたは あたたかいと おもいます",
      ["あたたかい", "あした", "おもいます", "は", "と", "でしょう", "だ"],
      ["あした", "は", "あたたかい", "と", "おもいます"],
    ),
    listeningCompSentence({
      id: "ja-m18-5-1-lc-1",
      audioText: "きれいな やまが みえます",
      correctMeaningEn: "A beautiful mountain is visible.",
      distractorsEn: [
        "A big mountain is visible.",
        "A beautiful river is visible.",
        "The mountain is beautiful.",
      ],
    }),
    cloze(
      "ja-m18-5-1-cloze-na",
      "きれい",
      " はなが さいています。",
      "な",
      ["な", "の", "に", "い"],
      "Beautiful flowers are blooming.",
      "きれいな はなが さいています。",
      "な-adj + な + noun: きれいな はな.",
    ),
    sentenceMcq({
      id: "ja-m18-5-1-mcq-1",
      prompt: "Which means 'I think this mountain is beautiful.'?",
      correctKana: "この やまは きれいだと おもいます。",
      distractorsKana: [
        "この やまは きれいでしょう。",
        "この やまは きれいです。",
        "この やまは きれいと おもいます。",
      ],
      explanation: "きれい is な-adj → きれいだと おもいます (need だ before と).",
    }),
    build(
      "ja-m18-5-1-build-2",
      "Say: Tomorrow will probably be muggy.",
      "あしたは むしあついでしょう",
      ["むしあつい", "あした", "でしょう", "は", "です", "すずしい"],
      ["あした", "は", "むしあつい", "でしょう"],
    ),
    listeningBuildSentence({
      id: "ja-m18-5-1-lb-1",
      target: "そらが きれいだと おもいます",
      tiles: ["きれい", "そら", "だ", "が", "と", "おもいます", "でしょう"],
      correctOrder: ["そら", "が", "きれい", "だ", "と", "おもいます"],
      promptEn: "Hear it, build it: 'I think the sky is beautiful.'",
    }),
    speaking(
      "ja-m18-5-1-speak-1",
      "らいしゅうは あめでしょう",
      "It will probably rain next week.",
    ),
    cloze(
      "ja-m18-5-1-cloze-deshou-2",
      "らいしゅうは ゆき",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "ます"],
      "Next week it will probably snow.",
      "らいしゅうは ゆきでしょう。",
      "Noun + でしょう.",
    ),
    build(
      "ja-m18-5-1-build-3",
      "Say: I think there are beautiful flowers in the garden.",
      "にわに きれいな はなが あると おもいます",
      ["きれい", "にわ", "はな", "に", "な", "ある", "が", "と", "おもいます", "です"],
      ["にわ", "に", "きれい", "な", "はな", "が", "ある", "と", "おもいます"],
    ),
    translateStep({
      id: "ja-m18-5-1-translate-1",
      promptEn: "Next week will probably be hot.",
      acceptedAnswers: [
        "らいしゅうは あついでしょう",
        "らいしゅうは あついでしょう。",
      ],
      audioText: "らいしゅうは あついでしょう",
    }),
    listeningCompSentence({
      id: "ja-m18-5-1-lc-2",
      audioText: "なつは あついと おもいます",
      correctMeaningEn: "I think summer is hot.",
      distractorsEn: [
        "Summer will probably be hot.",
        "Summer is hot.",
        "I think summer is cool.",
      ],
    }),
    selfExplain({
      id: "ja-m18-5-1-self-explain",
      anchorLabel: "Three M18 patterns mixed",
      anchorAudioText: "らいしゅうは はれでしょう",
      question: "For a な-adjective like きれい, how do you form とおもいます?",
      rule: { text: "きれい + だ + と おもいます. な-adjectives and nouns need だ before と. い-adjectives connect directly (さむいと おもいます)." },
      surface: { text: "きれい + と おもいます — no だ needed for any adjective." },
      distractor: { text: "きれいな + と おもいます — use な before と." },
      ruleExplanation:
        "Before と おもいます: い-adj → plain (さむいと). な-adj/noun → + だ (きれいだと, あめだと). Don't confuse な (noun modification) with だ (plain copula).",
    }),
    speaking(
      "ja-m18-5-1-speak-2",
      "この もりは しずかだと おもいます",
      "I think this forest is quiet.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-5-1-rev-mcq-1", M18_5_1_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-5-1-rev-lc-1",
      audioText: M18_5_1_REVIEW[1].kana,
      correctMeaningEn: M18_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_5_1_REVIEW[2].meaningEn,
        M18_5_1_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m18-5-1-rev-speak-1", M18_5_1_REVIEW[2].kana, M18_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-5-1-rev", M18_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_5_1.steps);
assertAnswerRotation(M18_5_1.steps, 1);
assertNoConsecutiveSame(M18_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-5-2 — Interleaved drill II (production-heavy)
// ═══════════════════════════════════════════════════════════════════════

const M18_5_2_REVIEW = pickReviewAtoms("ja-m18-5-2-rev", M18_REVIEW_POOL, 6);

export const M18_5_2: LessonContent = {
  id: "ja-m18-5-2",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "All together II",
  description:
    "Production-heavy interleave: translate, build, speak with all M18 grammar.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m18-5-2-build-1",
      "Say: I think tomorrow will be sunny.",
      "あしたは はれだと おもいます",
      ["はれ", "あした", "おもいます", "は", "だ", "と", "でしょう"],
      ["あした", "は", "はれ", "だ", "と", "おもいます"],
    ),
    speaking(
      "ja-m18-5-2-speak-1",
      "あしたは はれだと おもいます",
      "I think tomorrow will be sunny.",
    ),
    translateStep({
      id: "ja-m18-5-2-translate-1",
      promptEn: "Tomorrow will probably be cold.",
      acceptedAnswers: [
        "あしたは さむいでしょう",
        "あしたは さむいでしょう。",
      ],
      audioText: "あしたは さむいでしょう",
    }),
    build(
      "ja-m18-5-2-build-2",
      "Say: I drink cold water.",
      "つめたい みずを のみます",
      ["みず", "つめたい", "のみます", "を", "あつい"],
      ["つめたい", "みず", "を", "のみます"],
    ),
    listeningCompSentence({
      id: "ja-m18-5-2-lc-1",
      audioText: "なつは むしあついと おもいます",
      correctMeaningEn: "I think summer is muggy.",
      distractorsEn: [
        "Summer will probably be muggy.",
        "Summer is muggy.",
        "I think summer is cool.",
      ],
    }),
    speaking(
      "ja-m18-5-2-speak-2",
      "つめたい みずを のみます",
      "I drink cold water.",
    ),
    build(
      "ja-m18-5-2-build-3",
      "Say: I think this river is beautiful.",
      "この かわは きれいだと おもいます",
      ["かわ", "きれい", "この", "は", "だ", "と", "おもいます", "です"],
      ["この", "かわ", "は", "きれい", "だ", "と", "おもいます"],
    ),
    translateStep({
      id: "ja-m18-5-2-translate-2",
      promptEn: "I think autumn is cool.",
      acceptedAnswers: [
        "あきは すずしいと おもいます",
        "あきは すずしいと おもいます。",
        "あきはすずしいとおもいます",
        "あきはすずしいとおもいます。",
      ],
      audioText: "あきは すずしいと おもいます",
    }),
    sentenceMcq({
      id: "ja-m18-5-2-mcq-1",
      prompt: "Which means 'A cool breeze is blowing.'?",
      correctKana: "すずしい かぜが ふいています。",
      distractorsKana: [
        "すずしいな かぜが ふいています。",
        "つよい かぜが ふいています。",
        "すずしい うみが みえます。",
      ],
      explanation: "い-adj modifies directly — すずしい かぜ (no な).",
    }),
    build(
      "ja-m18-5-2-build-4",
      "Say: There's a big forest near the mountain.",
      "やまの ちかくに おおきい もりが あります",
      ["ちかく", "やま", "おおきい", "の", "に", "もり", "あります", "が", "きれいな"],
      ["やま", "の", "ちかく", "に", "おおきい", "もり", "が", "あります"],
    ),
    listeningBuildSentence({
      id: "ja-m18-5-2-lb-1",
      target: "なつは あついでしょう",
      tiles: ["あつい", "なつ", "でしょう", "は", "です", "すずしい"],
      correctOrder: ["なつ", "は", "あつい", "でしょう"],
      promptEn: "Hear it, build it: 'Summer will probably be hot.'",
    }),
    speaking(
      "ja-m18-5-2-speak-3",
      "やまの ちかくに おおきい もりが あります",
      "There's a big forest near the mountain.",
    ),
    cloze(
      "ja-m18-5-2-cloze-da",
      "くもり",
      "と おもいます。",
      "だ",
      ["だ", "な", "の", "は"],
      "I think it's cloudy.",
      "くもりだと おもいます。",
      "Nouns need だ before と おもいます.",
    ),
    selfExplain({
      id: "ja-m18-5-2-self-explain",
      anchorLabel: "Full M18 production",
      anchorAudioText: "この もりは しずかだと おもいます",
      question: "Three grammar tools in M18 — when would you use each?",
      rule: { text: "でしょう = general prediction (weather forecast). とおもいます = personal opinion. adj+noun modification = describing specific things. Different contexts, different tools." },
      surface: { text: "Use でしょう for formal situations and とおもいます for casual ones." },
      distractor: { text: "でしょう and とおもいます are interchangeable — pick whichever you like." },
      ruleExplanation:
        "でしょう = evidence-based prediction. とおもいます = personal belief. adj+noun = descriptive modification. Each has its lane.",
    }),
    speaking(
      "ja-m18-5-2-speak-4",
      "そらが きれいだと おもいます",
      "I think the sky is beautiful.",
    ),
    // ── Review tail ──
    speaking("ja-m18-5-2-rev-speak-1", M18_5_2_REVIEW[0].kana, M18_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m18-5-2-rev-lc-1",
      audioText: "くるまで うちに かえります",
      correctMeaningEn: "I go home by car.",
      distractorsEn: [
        "I go home by bus.",
        "I go to the station by car.",
        "I walk to school.",
      ],
      exercisedAtomKanas: ["くるま"],
    }),
    vocabMcq("ja-m18-5-2-rev-mcq-1", M18_5_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    speaking("ja-m18-5-2-rev-speak-2", M18_5_2_REVIEW[2].kana, M18_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-5-2-rev", M18_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_5_2.steps);
assertAnswerRotation(M18_5_2.steps, 1);
assertNoConsecutiveSame(M18_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-6-1 — Seasons and weather (compound practice)
// ═══════════════════════════════════════════════════════════════════════

const M18_6_1_REVIEW = pickReviewAtoms("ja-m18-6-1-rev", M18_REVIEW_POOL, 6);

export const M18_6_1: LessonContent = {
  id: "ja-m18-6-1",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Seasons and weather",
  description:
    "Compound practice: describe each season's weather using でしょう and とおもいます.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m18-6-1-build-1",
      "Say: I think the weather is nice in spring.",
      "はるは てんきが いいと おもいます",
      ["てんき", "はる", "いい", "は", "が", "と", "おもいます", "でしょう"],
      ["はる", "は", "てんき", "が", "いい", "と", "おもいます"],
    ),
    listeningCompSentence({
      id: "ja-m18-6-1-lc-1",
      audioText: "なつは あついでしょう",
      correctMeaningEn: "Summer will probably be hot.",
      distractorsEn: [
        "Summer is hot.",
        "I think summer is hot.",
        "Summer will probably be cool.",
      ],
    }),
    cloze(
      "ja-m18-6-1-cloze-deshou",
      "ふゆは さむい",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "と"],
      "Winter will probably be cold.",
      "ふゆは さむいでしょう。",
      "でしょう = prediction.",
    ),
    sentenceMcq({
      id: "ja-m18-6-1-mcq-1",
      prompt: "Which means 'I think autumn has beautiful mountains.'?",
      correctKana: "あきは きれいな やまが あると おもいます。",
      distractorsKana: [
        "あきは きれいな やまでしょう。",
        "あきは おおきい やまが あると おもいます。",
        "あきは きれいな はなが あると おもいます。",
      ],
      explanation: "きれいな やま = beautiful mountains. あると おもいます = I think there are.",
    }),
    build(
      "ja-m18-6-1-build-2",
      "Say: Summer is probably muggy.",
      "なつは むしあついでしょう",
      ["むしあつい", "なつ", "でしょう", "は", "です", "すずしい"],
      ["なつ", "は", "むしあつい", "でしょう"],
    ),
    cloze(
      "ja-m18-6-1-cloze-to",
      "あきは すずしい",
      " おもいます。",
      "と",
      ["と", "は", "が", "を"],
      "I think autumn is cool.",
      "あきは すずしいと おもいます。",
      "と marks the quoted thought.",
    ),
    listeningBuildSentence({
      id: "ja-m18-6-1-lb-1",
      target: "はるは あたたかいでしょう",
      tiles: ["あたたかい", "はる", "でしょう", "は", "です", "さむい"],
      correctOrder: ["はる", "は", "あたたかい", "でしょう"],
      promptEn: "Hear it, build it: 'Spring will probably be warm.'",
    }),
    speaking(
      "ja-m18-6-1-speak-1",
      "なつは あついと おもいます",
      "I think summer is hot.",
    ),
    build(
      "ja-m18-6-1-build-3",
      "Say: I think winter has a lot of snow.",
      "ふゆは ゆきが おおいと おもいます",
      ["ゆき", "おおい", "ふゆ", "は", "が", "おもいます", "と", "でしょう"],
      ["ふゆ", "は", "ゆき", "が", "おおい", "と", "おもいます"],
    ),
    translateStep({
      id: "ja-m18-6-1-translate-1",
      promptEn: "I think spring is warm.",
      acceptedAnswers: [
        "はるは あたたかいと おもいます",
        "はるは あたたかいと おもいます。",
      ],
      audioText: "はるは あたたかいと おもいます",
    }),
    listeningCompSentence({
      id: "ja-m18-6-1-lc-2",
      audioText: "あきは すずしいでしょう",
      correctMeaningEn: "Autumn will probably be cool.",
      distractorsEn: [
        "I think autumn is cool.",
        "Autumn is cool.",
        "Autumn will probably be warm.",
      ],
    }),
    build(
      "ja-m18-6-1-build-4",
      "Say: Beautiful flowers bloom in spring.",
      "はるに きれいな はなが さきます",
      ["きれい", "はる", "はな", "に", "な", "さきます", "が", "で"],
      ["はる", "に", "きれい", "な", "はな", "が", "さきます"],
    ),
    selfExplain({
      id: "ja-m18-6-1-self-explain",
      anchorLabel: "Season descriptions with でしょう and とおもいます",
      anchorAudioText: "ふゆは さむいでしょう",
      question: "A weather forecaster says ふゆは さむいでしょう. How would YOU say you think winter is cold?",
      rule: { text: "ふゆは さむいと おもいます. The forecaster uses でしょう (objective prediction). You use とおもいます (personal opinion)." },
      surface: { text: "You'd say the same thing — でしょう works for personal opinions too." },
      distractor: { text: "You'd say ふゆは さむいだと おもいます — adding だ after い-adjectives for emphasis." },
      ruleExplanation:
        "Forecaster: でしょう (evidence-based). Personal opinion: とおもいます (I think). い-adj never takes だ before と.",
    }),
    speaking(
      "ja-m18-6-1-speak-2",
      "はるに きれいな はなが さきます",
      "Beautiful flowers bloom in spring.",
    ),
    // ── Review tail ──
    speaking("ja-m18-6-1-rev-speak-1", M18_6_1_REVIEW[0].kana, M18_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m18-6-1-rev-lc-1",
      audioText: "これは なんですか",
      correctMeaningEn: "What is this?",
      distractorsEn: [
        "Who is that?",
        "Where is the toilet?",
        "How much is this?",
      ],
      exercisedAtomKanas: ["これ"],
    }),
    vocabMcq("ja-m18-6-1-rev-mcq-1", M18_6_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    reviewMatchPairs("ja-m18-6-1-rev", M18_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_6_1.steps);
assertAnswerRotation(M18_6_1.steps, 1);
assertNoConsecutiveSame(M18_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-6-2 — Compound production
// ═══════════════════════════════════════════════════════════════════════

const M18_6_2_REVIEW = pickReviewAtoms("ja-m18-6-2-rev", M18_REVIEW_POOL, 6);

export const M18_6_2: LessonContent = {
  id: "ja-m18-6-2",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Compound production",
  description:
    "Production-heavy: combine weather, nature, seasons with でしょう and とおもいます.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m18-6-2-build-1",
      "Say: I think this sea is beautiful.",
      "この うみは きれいだと おもいます",
      ["うみ", "きれい", "この", "は", "だ", "と", "おもいます", "な"],
      ["この", "うみ", "は", "きれい", "だ", "と", "おもいます"],
    ),
    speaking(
      "ja-m18-6-2-speak-1",
      "この うみは きれいだと おもいます",
      "I think this sea is beautiful.",
    ),
    translateStep({
      id: "ja-m18-6-2-translate-1",
      promptEn: "I think summer is hot.",
      acceptedAnswers: [
        "なつは あついと おもいます",
        "なつは あついと おもいます。",
      ],
      audioText: "なつは あついと おもいます",
    }),
    build(
      "ja-m18-6-2-build-2",
      "Say: The sky will probably be beautiful tomorrow.",
      "あしたは そらが きれいでしょう",
      ["そら", "あした", "きれい", "は", "が", "でしょう", "くもり", "です"],
      ["あした", "は", "そら", "が", "きれい", "でしょう"],
    ),
    listeningCompSentence({
      id: "ja-m18-6-2-lc-1",
      audioText: "にわに おおきい きが あります",
      correctMeaningEn: "There's a big tree in the garden.",
      distractorsEn: [
        "There's a big flower in the garden.",
        "There's a big forest near the garden.",
        "There's a small tree in the garden.",
      ],
    }),
    speaking(
      "ja-m18-6-2-speak-2",
      "あしたは てんきが いいでしょう",
      "The weather will probably be nice tomorrow.",
    ),
    build(
      "ja-m18-6-2-build-3",
      "Say: I think there are beautiful mountains in autumn.",
      "あきは きれいな やまが あると おもいます",
      ["きれい", "あき", "やま", "は", "な", "ある", "が", "と", "おもいます", "です"],
      ["あき", "は", "きれい", "な", "やま", "が", "ある", "と", "おもいます"],
    ),
    translateStep({
      id: "ja-m18-6-2-translate-2",
      promptEn: "Spring will probably be warm.",
      acceptedAnswers: [
        "はるは あたたかいでしょう",
        "はるは あたたかいでしょう。",
      ],
      audioText: "はるは あたたかいでしょう",
    }),
    sentenceMcq({
      id: "ja-m18-6-2-mcq-1",
      prompt: "Which means 'A cold wind is blowing.'?",
      correctKana: "つめたい かぜが ふいています。",
      distractorsKana: [
        "つよい かぜが ふいています。",
        "つめたいな かぜが ふいています。",
        "つめたい みずが あります。",
      ],
      explanation: "つめたい = cold (い-adj). かぜ = wind. ふいています = is blowing.",
    }),
    build(
      "ja-m18-6-2-build-4",
      "Say: There's a big river near the forest.",
      "もりの ちかくに おおきい かわが あります",
      ["ちかく", "もり", "おおきい", "の", "に", "かわ", "あります", "が", "やま"],
      ["もり", "の", "ちかく", "に", "おおきい", "かわ", "が", "あります"],
    ),
    listeningBuildSentence({
      id: "ja-m18-6-2-lb-1",
      target: "ふゆは さむいでしょう",
      tiles: ["さむい", "ふゆ", "でしょう", "は", "です", "あつい"],
      correctOrder: ["ふゆ", "は", "さむい", "でしょう"],
      promptEn: "Hear it, build it: 'Winter will probably be cold.'",
    }),
    speaking(
      "ja-m18-6-2-speak-3",
      "もりの ちかくに おおきい かわが あります",
      "There's a big river near the forest.",
    ),
    cloze(
      "ja-m18-6-2-cloze-to",
      "うみは きれいだ",
      " おもいます。",
      "と",
      ["と", "は", "が", "の"],
      "I think the sea is beautiful.",
      "うみは きれいだと おもいます。",
      "と marks the quoted thought before おもいます.",
    ),
    selfExplain({
      id: "ja-m18-6-2-self-explain",
      anchorLabel: "Complex M18 sentences",
      anchorAudioText: "あきは きれいな やまが あると おもいます",
      question: "In this sentence, what form does ある take before と?",
      rule: { text: "ある is the dictionary (plain) form of あります. Before と おもいます, you use the plain form: ある + と, not あります + と." },
      surface: { text: "あります + と is the correct form — always use ます-form before と." },
      distractor: { text: "Both ある + と and あります + と are correct in all contexts." },
      ruleExplanation:
        "Before と おもいます, use plain form: ある (not あります), さむい (not さむいです), あめだ (not あめです).",
    }),
    speaking(
      "ja-m18-6-2-speak-4",
      "にわに おおきい きが あります",
      "There's a big tree in the garden.",
    ),
    // ── Review tail ──
    speaking("ja-m18-6-2-rev-speak-1", M18_6_2_REVIEW[0].kana, M18_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m18-6-2-rev-lc-1",
      audioText: "わたしは がくせいです",
      correctMeaningEn: "I am a student.",
      distractorsEn: [
        "I am a teacher.",
        "You are a student.",
        "My friend is a student.",
      ],
      exercisedAtomKanas: ["わたし"],
    }),
    vocabMcq("ja-m18-6-2-rev-mcq-1", M18_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    speaking("ja-m18-6-2-rev-speak-2", M18_6_2_REVIEW[2].kana, M18_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-6-2-rev", M18_6_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_6_2.steps);
assertAnswerRotation(M18_6_2.steps, 1);
assertNoConsecutiveSame(M18_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18_STORY — Narrated story: weekend plans around the weather
//   (storyComprehension factory per authoring guide §13.13)
// ═══════════════════════════════════════════════════════════════════════

export const M18_STORY: LessonContent = {
  id: "ja-m18-story",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Weekend plans",
  description:
    "Follow a narrated weekend plan built around the weather forecast — and reply with your own sentences.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m18-story-s1",
      narrative: [
        { kana: "あしたは はれでしょう。" },
        { kana: "あたたかいと おもいます。" },
        { kana: "ともだちと やまに いきます。" },
        { kana: "やまに きれいな はなが さいています。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "What's the weather forecast for tomorrow?",
          correctText: "Probably sunny and warm.",
          distractors: ["Rainy and cold.", "Cloudy but warm.", "Snowy."],
          explanation:
            "はれでしょう = probably sunny. あたたかいと おもいます = I think it'll be warm.",
        },
        {
          id: "s1-q2",
          prompt: "Where will the narrator go?",
          correctText: "To the mountains, with a friend.",
          distractors: ["To the sea, alone.", "To a park, with a friend.", "To a river."],
          explanation: "ともだちと やまに いきます = I'll go to the mountains with a friend.",
        },
      ],
      responseBuild: {
        target: "あしたの てんきは どうですか",
        tiles: ["てんき", "あした", "どう", "の", "は", "です", "か"],
        correctOrder: ["あした", "の", "てんき", "は", "どう", "です", "か"],
        promptEn: "Ask about the forecast yourself: 'How's the weather tomorrow?'",
      },
    }),
    sentenceMcq({
      id: "ja-m18-story-mcq-1",
      prompt: "Which part was the narrator's personal OPINION (not a forecast)?",
      correctKana: "I think it will be warm.",
      distractorsKana: [
        "It will probably be sunny.",
        "We go to the mountains.",
        "Flowers are blooming.",
      ],
      explanation: "あたたかいと おもいます = opinion (とおもいます). はれでしょう = forecast (でしょう).",
    }),
    ...storyComprehension({
      idPrefix: "ja-m18-story-s2",
      narrative: [
        { kana: "でも、あさっては くもりでしょう。" },
        { kana: "かぜも つよいと おもいます。" },
        { kana: "あさっては うみに いきません。" },
        { kana: "にわで はなを みます。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "What's the forecast for the day after tomorrow?",
          correctText: "Cloudy with strong wind.",
          distractors: ["Sunny and warm.", "Rainy.", "Snowy and cold."],
          explanation: "くもりでしょう = probably cloudy. かぜも つよい = wind is also strong.",
        },
        {
          id: "s2-q2",
          prompt: "What will the narrator do instead of going to the sea?",
          correctText: "Look at flowers in the garden.",
          distractors: ["Go to the mountains.", "Stay home and watch TV.", "Go to a river."],
          explanation: "にわで はなを みます = I'll look at flowers in the garden.",
        },
      ],
      responseBuild: {
        target: "にわで はなを みましょう",
        tiles: ["はな", "にわ", "みましょう", "で", "を", "やま"],
        correctOrder: ["にわ", "で", "はな", "を", "みましょう"],
        promptEn: "Suggest the backup plan: 'Let's look at flowers in the garden.'",
      },
    }),
    cloze(
      "ja-m18-story-cloze-1",
      "あさっては くもり",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "ます"],
      "The day after tomorrow will probably be cloudy.",
      "あさっては くもりでしょう。",
      "でしょう = prediction / probably.",
    ),
    listeningBuildSentence({
      id: "ja-m18-story-lb-1",
      target: "かぜも つよいと おもいます",
      tiles: ["つよい", "かぜ", "おもいます", "も", "と", "でしょう"],
      correctOrder: ["かぜ", "も", "つよい", "と", "おもいます"],
      promptEn: "Hear it, build it: 'I think the wind will be strong too.'",
    }),
    listeningCompSentence({
      id: "ja-m18-story-lc-1",
      audioText: "かぜが つよいと おもいます",
      correctMeaningEn: "I think the wind is strong.",
      distractorsEn: [
        "The wind will probably be strong.",
        "The wind is strong.",
        "I think the wind is weak.",
      ],
    }),
    speaking(
      "ja-m18-story-speak-1",
      "やまに きれいな はなが さいています",
      "Beautiful flowers are blooming in the mountains.",
    ),
    sentenceMcq({
      id: "ja-m18-story-mcq-summary",
      prompt: "What's the full weekend plan?",
      correctKana: "Tomorrow: mountains (sunny). Day after: garden flowers (cloudy/windy).",
      distractorsKana: [
        "Tomorrow: sea. Day after: mountains.",
        "Both days: stay home.",
        "Tomorrow: garden. Day after: mountains.",
      ],
      explanation: "Tomorrow = sunny → mountains. Day after = cloudy/windy → garden flowers instead of sea.",
    }),
    speaking(
      "ja-m18-story-speak-2",
      "にわで はなを みましょう",
      "Let's look at flowers in the garden.",
    ),
  ],
};

assertNoConsecutiveSame(M18_STORY.steps);
assertPassiveCardsHaveFollowup(M18_STORY.steps);
assertNoExplanationOnPassive(M18_STORY.steps);
assertExplanationDoesntLeakAnswer(M18_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-7-1 — Comprehension closer (all M18 grammar)
// ═══════════════════════════════════════════════════════════════════════

const M18_7_1_REVIEW = pickReviewAtoms("ja-m18-7-1-rev", M18_REVIEW_POOL, 6);

export const M18_7_1: LessonContent = {
  id: "ja-m18-7-1",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Weather & nature mix",
  description:
    "Mixed drill: でしょう, とおもいます, adjective modification with all M18 vocab.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m18-7-1-build-1",
      "Say: I think this forest is big.",
      "この もりは おおきいと おもいます",
      ["もり", "おおきい", "この", "は", "と", "おもいます", "でしょう", "だ"],
      ["この", "もり", "は", "おおきい", "と", "おもいます"],
    ),
    cloze(
      "ja-m18-7-1-cloze-deshou",
      "あしたは あめ",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "と"],
      "It will probably rain tomorrow.",
      "あしたは あめでしょう。",
      "でしょう = prediction.",
    ),
    listeningCompSentence({
      id: "ja-m18-7-1-lc-1",
      audioText: "やまの ちかくに きれいな かわが あります",
      correctMeaningEn: "There's a beautiful river near the mountain.",
      distractorsEn: [
        "There's a big river near the mountain.",
        "There's a beautiful mountain near the river.",
        "The mountain is near a beautiful garden.",
      ],
    }),
    sentenceMcq({
      id: "ja-m18-7-1-mcq-1",
      prompt: "Which means 'I think winter has a lot of snow.'?",
      correctKana: "ふゆは ゆきが おおいと おもいます。",
      distractorsKana: [
        "ふゆは ゆきが おおいでしょう。",
        "ふゆは ゆきが おおいです。",
        "なつは ゆきが おおいと おもいます。",
      ],
      explanation: "おおいと おもいます = I think there's a lot.",
    }),
    build(
      "ja-m18-7-1-build-2",
      "Say: The sky is clear today.",
      "きょうは そらが はれています",
      ["そら", "きょう", "はれて", "は", "が", "います", "くもって", "です"],
      ["きょう", "は", "そら", "が", "はれて", "います"],
    ),
    cloze(
      "ja-m18-7-1-cloze-to",
      "この やまは きれいだ",
      " おもいます。",
      "と",
      ["と", "は", "が", "を"],
      "I think this mountain is beautiful.",
      "この やまは きれいだと おもいます。",
      "な-adj + だ + と おもいます.",
    ),
    listeningBuildSentence({
      id: "ja-m18-7-1-lb-1",
      target: "あしたは そらが きれいでしょう",
      tiles: ["そら", "きれい", "あした", "は", "が", "でしょう", "です"],
      correctOrder: ["あした", "は", "そら", "が", "きれい", "でしょう"],
      promptEn: "Hear it, build it: 'The sky will probably be beautiful tomorrow.'",
    }),
    speaking(
      "ja-m18-7-1-speak-1",
      "この もりは おおきいと おもいます",
      "I think this forest is big.",
    ),
    cloze(
      "ja-m18-7-1-cloze-na",
      "きれい",
      " はなが さきます。",
      "な",
      ["な", "の", "に", "い"],
      "Beautiful flowers bloom.",
      "きれいな はなが さきます。",
      "な-adj + な + noun.",
    ),
    build(
      "ja-m18-7-1-build-3",
      "Say: There's a beautiful sea near the mountain.",
      "やまの ちかくに きれいな うみが あります",
      ["ちかく", "やま", "きれい", "の", "に", "な", "うみ", "あります", "が", "かわ"],
      ["やま", "の", "ちかく", "に", "きれい", "な", "うみ", "が", "あります"],
    ),
    translateStep({
      id: "ja-m18-7-1-translate-1",
      promptEn: "I think the mountain is beautiful.",
      acceptedAnswers: [
        "やまは きれいだと おもいます",
        "やまは きれいだと おもいます。",
      ],
      audioText: "やまは きれいだと おもいます",
    }),
    listeningCompSentence({
      id: "ja-m18-7-1-lc-2",
      audioText: "なつは むしあついでしょう",
      correctMeaningEn: "Summer will probably be muggy.",
      distractorsEn: [
        "I think summer is muggy.",
        "Summer is muggy.",
        "Summer will probably be cool.",
      ],
    }),
    selfExplain({
      id: "ja-m18-7-1-self-explain",
      anchorLabel: "Full M18 grammar — でしょう, とおもいます, adj+noun",
      anchorAudioText: "あしたは あめだと おもいます",
      question: "List three ways to express 'tomorrow will be rainy':",
      rule: { text: "1. あしたは あめです (fact). 2. あしたは あめでしょう (prediction). 3. あしたは あめだと おもいます (personal opinion). Three levels of certainty." },
      surface: { text: "There's only one way — あしたは あめです. でしょう and とおもいます add nothing." },
      distractor: { text: "あめでしょう and あめだと おもいます mean exactly the same thing." },
      ruleExplanation:
        "です = certain. でしょう = objective prediction. とおもいます = personal opinion. Three distinct certainty levels.",
    }),
    speaking(
      "ja-m18-7-1-speak-2",
      "やまの ちかくに きれいな うみが あります",
      "There's a beautiful sea near the mountain.",
    ),
    // ── Review tail ──
    speaking("ja-m18-7-1-rev-speak-1", M18_7_1_REVIEW[0].kana, M18_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m18-7-1-rev-lc-1",
      audioText: "この かばんは わたしのです",
      correctMeaningEn: "This bag is mine.",
      distractorsEn: [
        "That bag is yours.",
        "This bag is expensive.",
        "My bag is at home.",
      ],
      exercisedAtomKanas: ["かばん"],
    }),
    vocabMcq("ja-m18-7-1-rev-mcq-1", M18_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    speaking("ja-m18-7-1-rev-speak-2", M18_7_1_REVIEW[2].kana, M18_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-7-1-rev", M18_7_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_7_1.steps);
assertAnswerRotation(M18_7_1.steps, 1);
assertNoConsecutiveSame(M18_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-7-2 — Production
// ═══════════════════════════════════════════════════════════════════════

const M18_7_2_REVIEW = pickReviewAtoms("ja-m18-7-2-rev", M18_REVIEW_POOL, 6);

export const M18_7_2: LessonContent = {
  id: "ja-m18-7-2",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Weather & nature production",
  description:
    "Production-heavy: translate, build, and speak all M18 patterns.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m18-7-2-build-1",
      "Say: Winter will probably have a lot of snow.",
      "ふゆは ゆきが おおいでしょう",
      ["ゆき", "ふゆ", "おおい", "は", "が", "でしょう", "おもいます"],
      ["ふゆ", "は", "ゆき", "が", "おおい", "でしょう"],
    ),
    speaking(
      "ja-m18-7-2-speak-1",
      "ふゆは ゆきが おおいでしょう",
      "Winter will probably have a lot of snow.",
    ),
    translateStep({
      id: "ja-m18-7-2-translate-1",
      promptEn: "I think this sea is beautiful.",
      acceptedAnswers: [
        "この うみは きれいだと おもいます",
        "この うみは きれいだと おもいます。",
      ],
      audioText: "この うみは きれいだと おもいます",
    }),
    build(
      "ja-m18-7-2-build-2",
      "Say: Beautiful flowers are blooming in the garden.",
      "にわに きれいな はなが さいています",
      ["きれい", "にわ", "はな", "に", "な", "さいて", "が", "います", "おおきい"],
      ["にわ", "に", "きれい", "な", "はな", "が", "さいて", "います"],
    ),
    speaking(
      "ja-m18-7-2-speak-2",
      "にわに きれいな はなが さいています",
      "Beautiful flowers are blooming in the garden.",
    ),
    listeningCompSentence({
      id: "ja-m18-7-2-lc-1",
      audioText: "ふゆは さむいと おもいます",
      correctMeaningEn: "I think winter is cold.",
      distractorsEn: [
        "Winter will probably be cold.",
        "Winter is cold.",
        "I think winter is warm.",
      ],
    }),
    build(
      "ja-m18-7-2-build-3",
      "Say: I think this river is beautiful.",
      "この かわは きれいだと おもいます",
      ["かわ", "きれい", "この", "だ", "は", "と", "おもいます", "な"],
      ["この", "かわ", "は", "きれい", "だ", "と", "おもいます"],
    ),
    sentenceMcq({
      id: "ja-m18-7-2-mcq-1",
      prompt: "Which sentence means 'There's a big forest near the mountain.'?",
      correctKana: "やまの ちかくに おおきい もりが あります。",
      distractorsKana: [
        "やまの となりに おおきい もりが あります。",
        "もりの ちかくに おおきい やまが あります。",
        "やまの ちかくに きれいな もりが あります。",
      ],
      explanation: "やまの ちかくに = near the mountain. おおきい もり = big forest.",
    }),
    speaking(
      "ja-m18-7-2-speak-3",
      "この かわは きれいだと おもいます",
      "I think this river is beautiful.",
    ),
    build(
      "ja-m18-7-2-build-4",
      "Say: Summer will probably be muggy.",
      "なつは むしあついでしょう",
      ["むしあつい", "でしょう", "なつ", "は", "です", "すずしい"],
      ["なつ", "は", "むしあつい", "でしょう"],
    ),
    translateStep({
      id: "ja-m18-7-2-translate-2",
      promptEn: "Tomorrow will probably be snowy.",
      acceptedAnswers: [
        "あしたは ゆきでしょう",
        "あしたは ゆきでしょう。",
      ],
      audioText: "あしたは ゆきでしょう",
    }),
    listeningBuildSentence({
      id: "ja-m18-7-2-lb-1",
      target: "はるに きれいな はなが さきます",
      tiles: ["きれい", "はる", "はな", "に", "な", "さきます", "が", "おおきい"],
      correctOrder: ["はる", "に", "きれい", "な", "はな", "が", "さきます"],
      promptEn: "Hear it, build it: 'Beautiful flowers bloom in spring.'",
    }),
    cloze(
      "ja-m18-7-2-cloze-da",
      "この もりは きれい",
      "と おもいます。",
      "だ",
      ["だ", "な", "の", "は"],
      "I think this forest is beautiful.",
      "この もりは きれいだと おもいます。",
      "な-adj + だ + と おもいます.",
    ),
    selfExplain({
      id: "ja-m18-7-2-self-explain",
      anchorLabel: "Full M18 production mastery",
      anchorAudioText: "おおきい もりが あります",
      question: "In this sentence, why な after きれい but not い after おおきい?",
      rule: { text: "きれい (な-adj) needs な to modify a noun (きれいな はな). おおきい (い-adj) modifies directly (おおきい もり). Check the type first." },
      surface: { text: "おおきい ends in い, which is like な. So they both connect the same way." },
      distractor: { text: "おおきい can also use な — おおきな is an alternative form." },
      ruleExplanation:
        "い-adj: direct modification (おおきい + noun). な-adj: needs な (きれいな + noun). Note: おおきな exists as a special prenominal adjective, but the standard い-adj rule applies to all others.",
    }),
    speaking(
      "ja-m18-7-2-speak-4",
      "はるが いちばん いい きせつだと おもいます",
      "I think spring is the best season.",
    ),
    // ── Review tail ──
    speaking("ja-m18-7-2-rev-speak-1", M18_7_2_REVIEW[0].kana, M18_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m18-7-2-rev-lc-1",
      audioText: "つめたい みずが のみたいです",
      correctMeaningEn: "I want to drink cold water.",
      distractorsEn: [
        "I want to drink hot tea.",
        "I drank cold water.",
        "The water is cold.",
      ],
      exercisedAtomKanas: ["みず"],
    }),
    vocabMcq("ja-m18-7-2-rev-mcq-1", M18_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    speaking("ja-m18-7-2-rev-speak-2", M18_7_2_REVIEW[2].kana, M18_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-7-2-rev", M18_7_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M18_7_2.steps);
assertAnswerRotation(M18_7_2.steps, 1);
assertNoConsecutiveSame(M18_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M18_1_1.steps,
  ...M18_1_2.steps,
  ...M18_2_1.steps,
  ...M18_2_2.steps,
  ...M18_3_1.steps,
  ...M18_3_2.steps,
  ...M18_4_1.steps,
  ...M18_4_2.steps,
  ...M18_5_1.steps,
  ...M18_5_2.steps,
  ...M18_6_1.steps,
  ...M18_6_2.steps,
  ...M18_7_1.steps,
  ...M18_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M18_1_1, M18_1_2, M18_2_1, M18_2_2, M18_3_1, M18_3_2,
  M18_4_1, M18_4_2, M18_5_1, M18_5_2, M18_6_1, M18_6_2,
  M18_STORY, M18_7_1, M18_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
