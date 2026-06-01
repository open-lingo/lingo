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
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
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
} from "@/features/lesson/data/_stepAssertions";

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

const M18_1_1_REVIEW = pickReviewAtoms("ja-m18-1-1-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-1-1-info-open",
      "What's the weather?",
      "Six words that let you talk about weather — the most universal conversation starter in any language.",
    ),
    // ── てんき (weather) ──
    build(
      "ja-m18-1-1-build-tenki",
      "Pick the Japanese word for: Weather",
      "てんき",
      ["てんき", "はれ", "あめ", "かぜ"],
      ["てんき"],
    ),
    listeningCompSentence({
      id: "ja-m18-1-1-lc-tenki",
      audioText: "てんき",
      correctMeaningEn: "weather",
      distractorsEn: ["clear skies", "rain", "wind"],
    }),
    // ── はれ (clear weather / sunny) ──
    build(
      "ja-m18-1-1-build-hare",
      "Pick the Japanese word for: Clear weather / Sunny",
      "はれ",
      ["はれ", "くもり", "あめ", "ゆき"],
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
      ["くもり", "はれ", "あめ", "かぜ"],
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
      ["あめ", "ゆき", "はれ", "くもり"],
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
      ["ゆき", "あめ", "かぜ", "くもり"],
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
      ["かぜ", "あめ", "ゆき", "はれ"],
      ["かぜ"],
    ),
    speaking("ja-m18-1-1-speak-kaze", "かぜ", "Wind"),
    // ── Weather sentence drills ──
    build(
      "ja-m18-1-1-build-tenki-ii",
      "Say: The weather is nice today.",
      "きょうは てんきが いいです",
      ["きょう", "は", "てんき", "が", "いい", "です", "わるい", "あめ"],
      ["きょう", "は", "てんき", "が", "いい", "です"],
    ),
    sentenceMcq({
      id: "ja-m18-1-1-mcq-ame",
      prompt: "Which sentence means 'It's raining today.'?",
      correctKana: "きょうは あめです。",
      distractorsKana: [
        "きょうは はれです。",
        "きょうは ゆきです。",
        "きょうは くもりです。",
      ],
      explanation: "あめ = rain. きょうは あめです = today is rain (it's raining).",
    }),
    listeningBuildSentence({
      id: "ja-m18-1-1-lb-hare",
      target: "あしたは はれです",
      tiles: ["あした", "は", "はれ", "です", "くもり", "あめ"],
      correctOrder: ["あした", "は", "はれ", "です"],
      promptEn: "Hear it, build it: 'Tomorrow is sunny.'",
    }),
    selfExplain({
      id: "ja-m18-1-1-self-explain",
      anchorLabel: "きょうは あめです / きょうは てんきが いいです",
      anchorAudioText: "きょうは てんきが いいです",
      question: "Why が after てんき but not after あめ?",
      rule: { text: "てんきが いい is a set expression — 'the weather is good.' てんき is the subject (が) of the adjective いい. あめです is a copula sentence — 'it is rain.' Different structures." },
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
      audioText: M18_1_1_REVIEW[1].kana,
      correctMeaningEn: M18_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_1_1_REVIEW[2].meaningEn,
        M18_1_1_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m18-1-1-rev", M18_1_1_REVIEW),
    infoStep(
      "ja-m18-1-1-info-end",
      "You can now name six weather conditions in Japanese",
      "てんき, はれ, くもり, あめ, ゆき, かぜ — the full weather report vocabulary.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_1_1.steps);
assertAnswerRotation(M18_1_1.steps, 1);
assertNoConsecutiveSame(M18_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-1-2 — "Weather words" drill
// ═══════════════════════════════════════════════════════════════════════

const M18_1_2_REVIEW = pickReviewAtoms("ja-m18-1-2-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-1-2-info-open",
      "Weather drill",
      "Put your weather words to work — describe today's weather, ask about tomorrow's.",
    ),
    build(
      "ja-m18-1-2-build-1",
      "Say: Tomorrow is cloudy.",
      "あしたは くもりです",
      ["あした", "は", "くもり", "です", "はれ", "あめ"],
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
        "きょうは あめです。",
        "あしたは はれです。",
      ],
      explanation: "はれ = clear/sunny. きょう = today.",
    }),
    build(
      "ja-m18-1-2-build-2",
      "Say: The wind is strong today.",
      "きょうは かぜが つよいです",
      ["きょう", "は", "かぜ", "が", "つよい", "です", "よわい", "おおきい"],
      ["きょう", "は", "かぜ", "が", "つよい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m18-1-2-lb-1",
      target: "あしたは ゆきです",
      tiles: ["あした", "は", "ゆき", "です", "あめ", "はれ"],
      correctOrder: ["あした", "は", "ゆき", "です"],
      promptEn: "Hear it, build it: 'Tomorrow is snowy.'",
    }),
    speaking(
      "ja-m18-1-2-speak-1",
      "きょうは てんきが いいです",
      "The weather is nice today.",
    ),
    cloze(
      "ja-m18-1-2-cloze-ha",
      "あした",
      " あめです。",
      "は",
      ["は", "が", "に", "で"],
      "It will rain tomorrow.",
      "あしたは あめです。",
      "は marks あした as the topic.",
    ),
    translateStep({
      id: "ja-m18-1-2-translate-1",
      promptEn: "It's raining today.",
      acceptedAnswers: [
        "きょうは あめです",
        "きょうは あめです。",
      ],
      audioText: "きょうは あめです",
    }),
    build(
      "ja-m18-1-2-build-3",
      "Ask: How's the weather tomorrow?",
      "あしたの てんきは どうですか",
      ["あした", "の", "てんき", "は", "どう", "です", "か", "なん"],
      ["あした", "の", "てんき", "は", "どう", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m18-1-2-lc-2",
      audioText: "きょうは かぜが つよいです",
      correctMeaningEn: "The wind is strong today.",
      distractorsEn: [
        "The wind is weak today.",
        "It's windy tomorrow.",
        "It's raining and windy.",
      ],
    }),
    sentenceMcq({
      id: "ja-m18-1-2-mcq-tenki",
      prompt: "Which is the correct way to ask about tomorrow's weather?",
      correctKana: "あしたの てんきは どうですか。",
      distractorsKana: [
        "あしたの てんきが どうですか。",
        "あしたは てんきの どうですか。",
        "あしたで てんきは どうですか。",
      ],
      explanation: "あしたの てんきは = as for tomorrow's weather. どうですか = how is it?",
    }),
    selfExplain({
      id: "ja-m18-1-2-self-explain",
      anchorLabel: "Weather patterns: copula vs adjective",
      anchorAudioText: "きょうは あめです",
      question: "Why きょうは あめです but きょうは てんきが いいです?",
      rule: { text: "あめです is a copula — 'it IS rain.' てんきが いい is an adjective predicate — 'the weather IS GOOD.' Different sentence structures for different weather expressions." },
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
      audioText: M18_1_2_REVIEW[1].kana,
      correctMeaningEn: M18_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_1_2_REVIEW[2].meaningEn,
        M18_1_2_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m18-1-2-rev-speak-1", M18_1_2_REVIEW[2].kana, M18_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-1-2-rev", M18_1_2_REVIEW),
    infoStep(
      "ja-m18-1-2-info-end",
      "You can now talk about the weather in Japanese",
      "Weather vocab drilled — rain, snow, sun, clouds, wind, and how to ask about it.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_1_2.steps);
assertAnswerRotation(M18_1_2.steps, 1);
assertNoConsecutiveSame(M18_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-2-1 — "Probably" (でしょう intro)
// ═══════════════════════════════════════════════════════════════════════

const M18_2_1_REVIEW = pickReviewAtoms("ja-m18-2-1-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-2-1-info-open",
      "Probably…",
      "でしょう turns any statement into a prediction. Weather forecasters live on this word.",
    ),
    RULE_DESHOU,
    // ── あたたかい (warm) ──
    build(
      "ja-m18-2-1-build-atatakai",
      "Pick the Japanese word for: Warm",
      "あたたかい",
      ["あたたかい", "すずしい", "あつい", "さむい"],
      ["あたたかい"],
    ),
    listeningCompSentence({
      id: "ja-m18-2-1-lc-atatakai",
      audioText: "あたたかい",
      correctMeaningEn: "warm",
      distractorsEn: ["cool", "hot", "cold"],
    }),
    // ── すずしい (cool) ──
    build(
      "ja-m18-2-1-build-suzushii",
      "Pick the Japanese word for: Cool (temperature)",
      "すずしい",
      ["すずしい", "あたたかい", "さむい", "あつい"],
      ["すずしい"],
    ),
    speaking("ja-m18-2-1-speak-suzushii", "すずしい", "Cool"),
    // ── むしあつい (humid/muggy) ──
    build(
      "ja-m18-2-1-build-mushiatsui",
      "Pick the Japanese word for: Humid / Muggy",
      "むしあつい",
      ["むしあつい", "あたたかい", "すずしい", "つめたい"],
      ["むしあつい"],
    ),
    listeningCompSentence({
      id: "ja-m18-2-1-lc-mushiatsui",
      audioText: "むしあつい",
      correctMeaningEn: "humid / muggy",
      distractorsEn: ["warm", "cool", "cold"],
    }),
    // ── でしょう drills ──
    build(
      "ja-m18-2-1-build-deshou-ame",
      "Say: It will probably rain tomorrow.",
      "あしたは あめでしょう",
      ["あした", "は", "あめ", "でしょう", "です", "はれ"],
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
    listeningBuildSentence({
      id: "ja-m18-2-1-lb-deshou",
      target: "あしたは あめでしょう",
      tiles: ["あした", "は", "あめ", "でしょう", "です", "ゆき"],
      correctOrder: ["あした", "は", "あめ", "でしょう"],
      promptEn: "Hear it, build it: 'It will probably rain tomorrow.'",
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
      anchorLabel: "あしたは あめでしょう / あしたは あたたかいでしょう",
      anchorAudioText: "あしたは あめでしょう",
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
    infoStep(
      "ja-m18-2-1-info-end",
      "You can now make weather predictions in Japanese",
      "でしょう turns facts into forecasts — three temperature adjectives + weather prediction mastered.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_2_1.steps);
assertAnswerRotation(M18_2_1.steps, 1);
assertNoConsecutiveSame(M18_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-2-2 — "Probably" practice
// ═══════════════════════════════════════════════════════════════════════

const M18_2_2_REVIEW = pickReviewAtoms("ja-m18-2-2-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-2-2-info-open",
      "Forecast drill",
      "More でしょう practice — predict the weather, describe temperatures, build forecast sentences.",
    ),
    build(
      "ja-m18-2-2-build-1",
      "Say: It will probably snow tomorrow.",
      "あしたは ゆきでしょう",
      ["あした", "は", "ゆき", "でしょう", "です", "あめ"],
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
      ["あした", "は", "かぜ", "が", "つよい", "でしょう", "よわい", "です"],
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
      target: "らいしゅうは さむいでしょう",
      tiles: ["らいしゅう", "は", "さむい", "でしょう", "です", "あつい"],
      correctOrder: ["らいしゅう", "は", "さむい", "でしょう"],
      promptEn: "Hear it, build it: 'Next week will probably be cold.'",
    }),
    speaking(
      "ja-m18-2-2-speak-1",
      "あしたは ゆきでしょう",
      "It will probably snow tomorrow.",
    ),
    translateStep({
      id: "ja-m18-2-2-translate-1",
      promptEn: "Tomorrow will probably be sunny.",
      acceptedAnswers: [
        "あしたは はれでしょう",
        "あしたは はれでしょう。",
      ],
      audioText: "あしたは はれでしょう",
    }),
    build(
      "ja-m18-2-2-build-3",
      "Say: This summer will probably be muggy.",
      "ことしの なつは むしあついでしょう",
      ["ことし", "の", "なつ", "は", "むしあつい", "でしょう", "すずしい", "です"],
      ["ことし", "の", "なつ", "は", "むしあつい", "でしょう"],
    ),
    listeningCompSentence({
      id: "ja-m18-2-2-lc-2",
      audioText: "あしたは あたたかいでしょう",
      correctMeaningEn: "Tomorrow will probably be warm.",
      distractorsEn: [
        "Tomorrow is warm.",
        "Tomorrow will probably be cool.",
        "Today is warm.",
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
      audioText: M18_2_2_REVIEW[1].kana,
      correctMeaningEn: M18_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_2_2_REVIEW[2].meaningEn,
        M18_2_2_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[3].meaningEn,
      ],
    }),
    speaking("ja-m18-2-2-rev-speak-1", M18_2_2_REVIEW[2].kana, M18_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-2-2-rev", M18_2_2_REVIEW),
    infoStep(
      "ja-m18-2-2-info-end",
      "You can now give weather forecasts like a Japanese newscaster",
      "でしょう mastered — warm, cool, muggy, rain, snow, all with probability.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_2_2.steps);
assertAnswerRotation(M18_2_2.steps, 1);
assertNoConsecutiveSame(M18_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-3-1 — "I think that" (とおもいます intro)
// ═══════════════════════════════════════════════════════════════════════

const M18_3_1_REVIEW = pickReviewAtoms("ja-m18-3-1-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-3-1-info-open",
      "I think…",
      "Express your opinion with とおもいます. Plus four season words — spring, summer, autumn, winter.",
    ),
    RULE_TO_OMOIMASU,
    // ── はる (spring) ──
    build(
      "ja-m18-3-1-build-haru",
      "Pick the Japanese word for: Spring",
      "はる",
      ["はる", "なつ", "あき", "ふゆ"],
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
      ["なつ", "はる", "ふゆ", "あき"],
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
      ["あき", "なつ", "はる", "ふゆ"],
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
      ["ふゆ", "あき", "はる", "なつ"],
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
      ["あした", "は", "さむい", "と", "おもいます", "でしょう", "だ"],
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
      tiles: ["あめ", "だ", "と", "おもいます", "です", "でしょう"],
      correctOrder: ["あめ", "だ", "と", "おもいます"],
      promptEn: "Hear it, build it: 'I think it will rain.'",
    }),
    selfExplain({
      id: "ja-m18-3-1-self-explain",
      anchorLabel: "さむいと おもいます vs あめだと おもいます",
      anchorAudioText: "さむいと おもいます",
      question: "Why さむいと (no だ) but あめだと (with だ)?",
      rule: { text: "い-adjectives are already in plain form — さむい + と. Nouns need だ to make the plain form — あめ + だ + と. Different word types, different connectors." },
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
      audioText: M18_3_1_REVIEW[1].kana,
      correctMeaningEn: M18_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_3_1_REVIEW[2].meaningEn,
        M18_3_1_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m18-3-1-rev-speak-1", M18_3_1_REVIEW[2].kana, M18_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-3-1-rev", M18_3_1_REVIEW),
    infoStep(
      "ja-m18-3-1-info-end",
      "You can now express your opinions about seasons and weather",
      "とおもいます for opinions + はる, なつ, あき, ふゆ — seasons of Japan.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_3_1.steps);
assertAnswerRotation(M18_3_1.steps, 1);
assertNoConsecutiveSame(M18_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-3-2 — "I think that" practice
// ═══════════════════════════════════════════════════════════════════════

const M18_3_2_REVIEW = pickReviewAtoms("ja-m18-3-2-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-3-2-info-open",
      "Opinion drill",
      "Express opinions and predictions — when do you use でしょう vs とおもいます?",
    ),
    build(
      "ja-m18-3-2-build-1",
      "Say: I think summer is muggy.",
      "なつは むしあついと おもいます",
      ["なつ", "は", "むしあつい", "と", "おもいます", "でしょう", "です"],
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
      ["あした", "は", "くもり", "だ", "と", "おもいます", "でしょう"],
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
      target: "なつは むしあついと おもいます",
      tiles: ["なつ", "は", "むしあつい", "と", "おもいます", "でしょう", "です"],
      correctOrder: ["なつ", "は", "むしあつい", "と", "おもいます"],
      promptEn: "Hear it, build it: 'I think summer is muggy.'",
    }),
    speaking(
      "ja-m18-3-2-speak-1",
      "ふゆは さむいと おもいます",
      "I think winter is cold.",
    ),
    translateStep({
      id: "ja-m18-3-2-translate-1",
      promptEn: "I think it will rain.",
      acceptedAnswers: [
        "あめだと おもいます",
        "あめだと おもいます。",
        "あめだとおもいます",
        "あめだとおもいます。",
      ],
      audioText: "あめだと おもいます",
    }),
    build(
      "ja-m18-3-2-build-3",
      "Say: I think spring is the best season.",
      "はるが いちばん いい きせつだと おもいます",
      ["はる", "が", "いちばん", "いい", "きせつ", "だ", "と", "おもいます", "なつ"],
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
      anchorAudioText: "あめだと おもいます",
      question: "When would you use あめでしょう vs あめだと おもいます?",
      rule: { text: "あめでしょう = general prediction (like a weather forecast). あめだと おもいます = personal opinion ('I personally think it will rain'). でしょう is objective; とおもいます is subjective." },
      surface: { text: "They're interchangeable — use whichever sounds better." },
      distractor: { text: "でしょう is only for weather; とおもいます is for everything else." },
      ruleExplanation:
        "でしょう = prediction based on evidence. とおもいます = personal belief. A forecaster uses でしょう; you use とおもいます when giving your own take.",
    }),
    speaking(
      "ja-m18-3-2-speak-2",
      "あきは すずしいと おもいます",
      "I think autumn is cool.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m18-3-2-rev-mcq-1", M18_3_2_REVIEW[0], M18_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m18-3-2-rev-lc-1",
      audioText: M18_3_2_REVIEW[1].kana,
      correctMeaningEn: M18_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_3_2_REVIEW[2].meaningEn,
        M18_3_2_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m18-3-2-rev-speak-1", M18_3_2_REVIEW[2].kana, M18_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-3-2-rev", M18_3_2_REVIEW),
    infoStep(
      "ja-m18-3-2-info-end",
      "You can now share personal opinions in Japanese",
      "でしょう for forecasts, とおもいます for opinions — two tools for expressing what you believe.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_3_2.steps);
assertAnswerRotation(M18_3_2.steps, 1);
assertNoConsecutiveSame(M18_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-4-1 — "Nature words" vocab (やま, かわ, うみ, そら, はな, き)
// ═══════════════════════════════════════════════════════════════════════

const M18_4_1_REVIEW = pickReviewAtoms("ja-m18-4-1-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-4-1-info-open",
      "The natural world",
      "Mountains, rivers, the sea — six words that open up the Japanese countryside.",
    ),
    // ── やま (mountain) ──
    build(
      "ja-m18-4-1-build-yama",
      "Pick the Japanese word for: Mountain",
      "やま",
      ["やま", "かわ", "うみ", "もり"],
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
      ["かわ", "うみ", "やま", "はな"],
      ["かわ"],
    ),
    listeningCompSentence({
      id: "ja-m18-4-1-lc-kawa",
      audioText: "かわ",
      correctMeaningEn: "river",
      distractorsEn: ["mountain", "sea", "sky"],
    }),
    // ── うみ (sea) ──
    build(
      "ja-m18-4-1-build-umi",
      "Pick the Japanese word for: Sea / Ocean",
      "うみ",
      ["うみ", "かわ", "そら", "やま"],
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
      ["そら", "うみ", "やま", "き"],
      ["そら"],
    ),
    speaking("ja-m18-4-1-speak-sora", "そら", "Sky"),
    // ── はな (flower) ──
    build(
      "ja-m18-4-1-build-hana",
      "Pick the Japanese word for: Flower",
      "はな",
      ["はな", "き", "もり", "にわ"],
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
      ["き", "はな", "もり", "にわ"],
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
      ["やま", "は", "きれい", "です", "おおきい", "うみ"],
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
      audioText: M18_4_1_REVIEW[1].kana,
      correctMeaningEn: M18_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_4_1_REVIEW[2].meaningEn,
        M18_4_1_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m18-4-1-rev-speak-1", M18_4_1_REVIEW[2].kana, M18_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-4-1-rev", M18_4_1_REVIEW),
    infoStep(
      "ja-m18-4-1-info-end",
      "You can now name the natural world around you",
      "やま, かわ, うみ, そら, はな, き — mountains to flowers, all in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_4_1.steps);
assertAnswerRotation(M18_4_1.steps, 1);
assertNoConsecutiveSame(M18_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-4-2 — "Nature words" drill + adjective modification
//   (もり, にわ + adj+noun review)
// ═══════════════════════════════════════════════════════════════════════

const M18_4_2_REVIEW = pickReviewAtoms("ja-m18-4-2-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-4-2-info-open",
      "Forest and garden",
      "Two more nature words — plus a review of how adjectives modify nouns. Big mountain or beautiful flower?",
    ),
    RULE_ADJ_NOUN_MOD,
    // ── もり (forest) ──
    build(
      "ja-m18-4-2-build-mori",
      "Pick the Japanese word for: Forest",
      "もり",
      ["もり", "にわ", "やま", "き"],
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
      ["にわ", "もり", "はな", "き"],
      ["にわ"],
    ),
    speaking("ja-m18-4-2-speak-niwa", "にわ", "Garden"),
    // ── Adjective+noun modification drills ──
    build(
      "ja-m18-4-2-build-ookii-yama",
      "Say: A big mountain.",
      "おおきい やま",
      ["おおきい", "やま", "おおきな", "うみ", "ちいさい"],
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
      ["にわ", "に", "きれい", "な", "はな", "が", "さいて", "います", "おおきい"],
      ["にわ", "に", "きれい", "な", "はな", "が", "さいて", "います"],
    ),
    cloze(
      "ja-m18-4-2-cloze-i-adj",
      "すずしい",
      "が ふいています。",
      " かぜ",
      [" かぜ", "な かぜ", " やま", "な うみ"],
      "A cool breeze is blowing.",
      "すずしい かぜが ふいています。",
      "い-adjective directly modifies the noun — no な.",
    ),
    listeningBuildSentence({
      id: "ja-m18-4-2-lb-1",
      target: "おおきい もりが あります",
      tiles: ["おおきい", "もり", "が", "あります", "おおきな", "にわ"],
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
      rule: { text: "おおきい is an い-adjective — it modifies nouns directly. きれい is a な-adjective — it needs な before the noun. The adjective type determines the connection." },
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
      audioText: M18_4_2_REVIEW[1].kana,
      correctMeaningEn: M18_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_4_2_REVIEW[2].meaningEn,
        M18_4_2_REVIEW[3].meaningEn,
        M18_REVIEW_POOL[7].meaningEn,
      ],
    }),
    speaking("ja-m18-4-2-rev-speak-1", M18_4_2_REVIEW[2].kana, M18_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-4-2-rev", M18_4_2_REVIEW),
    infoStep(
      "ja-m18-4-2-info-end",
      "You can now describe nature using adjective-noun pairs",
      "もり and にわ added — plus い-adj direct modification vs な-adj + な. Describe any landscape.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_4_2.steps);
assertAnswerRotation(M18_4_2.steps, 1);
assertNoConsecutiveSame(M18_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-5-1 — Interleaved drill (でしょう + とおもいます + adj-mod)
// ═══════════════════════════════════════════════════════════════════════

const M18_5_1_REVIEW = pickReviewAtoms("ja-m18-5-1-rev", M18_REVIEW_POOL, 4);

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
    infoStep(
      "ja-m18-5-1-info-open",
      "Mixed drill",
      "Predictions, opinions, and descriptions — every M18 grammar point in one session.",
    ),
    cloze(
      "ja-m18-5-1-cloze-deshou",
      "あしたは はれ",
      "。",
      "でしょう",
      ["でしょう", "です", "だ", "ます"],
      "Tomorrow will probably be sunny.",
      "あしたは はれでしょう。",
      "でしょう = probability.",
    ),
    cloze(
      "ja-m18-5-1-cloze-to",
      "さむいだ",
      " おもいます。",
      "と",
      ["と", "は", "が", "を"],
      "I think it will be cold.",
      "さむいだと おもいます。",
      "...wait — さむい is an い-adj, so no だ! But this cloze tests と placement.",
    ),
    build(
      "ja-m18-5-1-build-1",
      "Say: I think tomorrow will be warm.",
      "あしたは あたたかいと おもいます",
      ["あした", "は", "あたたかい", "と", "おもいます", "でしょう", "だ"],
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
      ["あした", "は", "むしあつい", "でしょう", "です", "すずしい"],
      ["あした", "は", "むしあつい", "でしょう"],
    ),
    listeningBuildSentence({
      id: "ja-m18-5-1-lb-1",
      target: "ふゆは さむいと おもいます",
      tiles: ["ふゆ", "は", "さむい", "と", "おもいます", "でしょう", "だ"],
      correctOrder: ["ふゆ", "は", "さむい", "と", "おもいます"],
      promptEn: "Hear it, build it: 'I think winter is cold.'",
    }),
    speaking(
      "ja-m18-5-1-speak-1",
      "あしたは あめでしょう",
      "It will probably rain tomorrow.",
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
      ["にわ", "に", "きれい", "な", "はな", "が", "ある", "と", "おもいます", "です"],
      ["にわ", "に", "きれい", "な", "はな", "が", "ある", "と", "おもいます"],
    ),
    translateStep({
      id: "ja-m18-5-1-translate-1",
      promptEn: "It will probably rain tomorrow.",
      acceptedAnswers: [
        "あしたは あめでしょう",
        "あしたは あめでしょう。",
      ],
      audioText: "あしたは あめでしょう",
    }),
    listeningCompSentence({
      id: "ja-m18-5-1-lc-2",
      audioText: "はるは あたたかいと おもいます",
      correctMeaningEn: "I think spring is warm.",
      distractorsEn: [
        "Spring will probably be warm.",
        "Spring is warm.",
        "I think spring is cool.",
      ],
    }),
    selfExplain({
      id: "ja-m18-5-1-self-explain",
      anchorLabel: "Three M18 patterns mixed",
      anchorAudioText: "あしたは はれでしょう",
      question: "For a な-adjective like きれい, how do you form とおもいます?",
      rule: { text: "きれい + だ + と おもいます. な-adjectives and nouns need だ before と. い-adjectives connect directly (さむいと おもいます)." },
      surface: { text: "きれい + と おもいます — no だ needed for any adjective." },
      distractor: { text: "きれいな + と おもいます — use な before と." },
      ruleExplanation:
        "Before と おもいます: い-adj → plain (さむいと). な-adj/noun → + だ (きれいだと, あめだと). Don't confuse な (noun modification) with だ (plain copula).",
    }),
    speaking(
      "ja-m18-5-1-speak-2",
      "この やまは きれいだと おもいます",
      "I think this mountain is beautiful.",
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
    infoStep(
      "ja-m18-5-1-info-end",
      "You can mix predictions, opinions, and descriptions in one sentence",
      "でしょう + とおもいます + adjective modification — three grammar tools combined.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_5_1.steps);
assertAnswerRotation(M18_5_1.steps, 1);
assertNoConsecutiveSame(M18_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-5-2 — Interleaved drill II (production-heavy)
// ═══════════════════════════════════════════════════════════════════════

const M18_5_2_REVIEW = pickReviewAtoms("ja-m18-5-2-rev", M18_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m18-5-2-info-open",
      "Production round",
      "Build, translate, and speak — every M18 pattern in production direction.",
    ),
    build(
      "ja-m18-5-2-build-1",
      "Say: I think tomorrow will be sunny.",
      "あしたは はれだと おもいます",
      ["あした", "は", "はれ", "だ", "と", "おもいます", "でしょう"],
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
      "Say: Beautiful flowers are blooming.",
      "きれいな はなが さいています",
      ["きれい", "な", "はな", "が", "さいて", "います", "おおきい"],
      ["きれい", "な", "はな", "が", "さいて", "います"],
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
      "きれいな はなが さいています",
      "Beautiful flowers are blooming.",
    ),
    build(
      "ja-m18-5-2-build-3",
      "Say: I think this river is beautiful.",
      "この かわは きれいだと おもいます",
      ["この", "かわ", "は", "きれい", "だ", "と", "おもいます", "です"],
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
      ["やま", "の", "ちかく", "に", "おおきい", "もり", "が", "あります", "きれいな"],
      ["やま", "の", "ちかく", "に", "おおきい", "もり", "が", "あります"],
    ),
    listeningBuildSentence({
      id: "ja-m18-5-2-lb-1",
      target: "あしたは あめでしょう",
      tiles: ["あした", "は", "あめ", "でしょう", "です", "ゆき"],
      correctOrder: ["あした", "は", "あめ", "でしょう"],
      promptEn: "Hear it, build it: 'It will probably rain tomorrow.'",
    }),
    speaking(
      "ja-m18-5-2-speak-3",
      "やまの ちかくに おおきい もりが あります",
      "There's a big forest near the mountain.",
    ),
    cloze(
      "ja-m18-5-2-cloze-da",
      "あめ",
      "と おもいます。",
      "だ",
      ["だ", "な", "の", "は"],
      "I think it will rain.",
      "あめだと おもいます。",
      "Nouns need だ before と おもいます.",
    ),
    selfExplain({
      id: "ja-m18-5-2-self-explain",
      anchorLabel: "Full M18 production",
      anchorAudioText: "この かわは きれいだと おもいます",
      question: "Three grammar tools in M18 — when would you use each?",
      rule: { text: "でしょう = general prediction (weather forecast). とおもいます = personal opinion. adj+noun modification = describing specific things. Different contexts, different tools." },
      surface: { text: "Use でしょう for formal situations and とおもいます for casual ones." },
      distractor: { text: "でしょう and とおもいます are interchangeable — pick whichever you like." },
      ruleExplanation:
        "でしょう = evidence-based prediction. とおもいます = personal belief. adj+noun = descriptive modification. Each has its lane.",
    }),
    speaking(
      "ja-m18-5-2-speak-4",
      "この かわは きれいだと おもいます",
      "I think this river is beautiful.",
    ),
    // ── Review tail ──
    speaking("ja-m18-5-2-rev-speak-1", M18_5_2_REVIEW[0].kana, M18_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m18-5-2-rev-lc-1",
      audioText: M18_5_2_REVIEW[1].kana,
      correctMeaningEn: M18_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_5_2_REVIEW[2].meaningEn,
        M18_5_2_REVIEW[3].meaningEn,
        M18_5_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m18-5-2-rev-mcq-1", M18_5_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    speaking("ja-m18-5-2-rev-speak-2", M18_5_2_REVIEW[2].kana, M18_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-5-2-rev", M18_5_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m18-5-2-info-end",
      "You can produce every M18 pattern from memory",
      "Weather, nature, predictions, opinions, and adjective modification — all in production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_5_2.steps);
assertAnswerRotation(M18_5_2.steps, 1);
assertNoConsecutiveSame(M18_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-6-1 — Seasons and weather (compound practice)
// ═══════════════════════════════════════════════════════════════════════

const M18_6_1_REVIEW = pickReviewAtoms("ja-m18-6-1-rev", M18_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m18-6-1-info-open",
      "Japan's four seasons",
      "Describe each season's weather — what's spring like? What do you think about winter? Use every M18 tool.",
    ),
    build(
      "ja-m18-6-1-build-1",
      "Say: I think spring is warm.",
      "はるは あたたかいと おもいます",
      ["はる", "は", "あたたかい", "と", "おもいます", "でしょう", "だ"],
      ["はる", "は", "あたたかい", "と", "おもいます"],
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
      ["なつ", "は", "むしあつい", "でしょう", "です", "すずしい"],
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
      tiles: ["はる", "は", "あたたかい", "でしょう", "です", "さむい"],
      correctOrder: ["はる", "は", "あたたかい", "でしょう"],
      promptEn: "Hear it, build it: 'Spring will probably be warm.'",
    }),
    speaking(
      "ja-m18-6-1-speak-1",
      "なつは むしあついでしょう",
      "Summer will probably be muggy.",
    ),
    build(
      "ja-m18-6-1-build-3",
      "Say: I think winter has a lot of snow.",
      "ふゆは ゆきが おおいと おもいます",
      ["ふゆ", "は", "ゆき", "が", "おおい", "と", "おもいます", "でしょう"],
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
      audioText: "あきは すずしいと おもいます",
      correctMeaningEn: "I think autumn is cool.",
      distractorsEn: [
        "Autumn will probably be cool.",
        "Autumn is cool.",
        "I think autumn is warm.",
      ],
    }),
    build(
      "ja-m18-6-1-build-4",
      "Say: Beautiful flowers bloom in spring.",
      "はるに きれいな はなが さきます",
      ["はる", "に", "きれい", "な", "はな", "が", "さきます", "で"],
      ["はる", "に", "きれい", "な", "はな", "が", "さきます"],
    ),
    selfExplain({
      id: "ja-m18-6-1-self-explain",
      anchorLabel: "Season descriptions with でしょう and とおもいます",
      anchorAudioText: "なつは あついでしょう",
      question: "A weather forecaster says なつは あついでしょう. How would YOU say you think summer is hot?",
      rule: { text: "なつは あついと おもいます. The forecaster uses でしょう (objective prediction). You use とおもいます (personal opinion)." },
      surface: { text: "You'd say the same thing — でしょう works for personal opinions too." },
      distractor: { text: "You'd say なつは あついだと おもいます — adding だ after い-adjectives for emphasis." },
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
      audioText: M18_6_1_REVIEW[1].kana,
      correctMeaningEn: M18_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_6_1_REVIEW[2].meaningEn,
        M18_6_1_REVIEW[3].meaningEn,
        M18_6_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m18-6-1-rev-mcq-1", M18_6_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    reviewMatchPairs("ja-m18-6-1-rev", M18_6_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m18-6-1-info-end",
      "You can now describe every season's weather and scenery",
      "Warm springs, muggy summers, cool autumns, cold winters — predicted and opined in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_6_1.steps);
assertAnswerRotation(M18_6_1.steps, 1);
assertNoConsecutiveSame(M18_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-6-2 — Compound production
// ═══════════════════════════════════════════════════════════════════════

const M18_6_2_REVIEW = pickReviewAtoms("ja-m18-6-2-rev", M18_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m18-6-2-info-open",
      "Full production",
      "Build and speak complex sentences — weather forecasts, seasonal opinions, nature descriptions.",
    ),
    build(
      "ja-m18-6-2-build-1",
      "Say: I think this sea is beautiful.",
      "この うみは きれいだと おもいます",
      ["この", "うみ", "は", "きれい", "だ", "と", "おもいます", "な"],
      ["この", "うみ", "は", "きれい", "だ", "と", "おもいます"],
    ),
    speaking(
      "ja-m18-6-2-speak-1",
      "この うみは きれいだと おもいます",
      "I think this sea is beautiful.",
    ),
    translateStep({
      id: "ja-m18-6-2-translate-1",
      promptEn: "I think summer is muggy.",
      acceptedAnswers: [
        "なつは むしあついと おもいます",
        "なつは むしあついと おもいます。",
      ],
      audioText: "なつは むしあついと おもいます",
    }),
    build(
      "ja-m18-6-2-build-2",
      "Say: The sky will probably be clear tomorrow.",
      "あしたは そらが はれでしょう",
      ["あした", "は", "そら", "が", "はれ", "でしょう", "くもり", "です"],
      ["あした", "は", "そら", "が", "はれ", "でしょう"],
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
      "あしたは はれでしょう",
      "Tomorrow will probably be sunny.",
    ),
    build(
      "ja-m18-6-2-build-3",
      "Say: I think there are beautiful mountains in autumn.",
      "あきは きれいな やまが あると おもいます",
      ["あき", "は", "きれい", "な", "やま", "が", "ある", "と", "おもいます", "です"],
      ["あき", "は", "きれい", "な", "やま", "が", "ある", "と", "おもいます"],
    ),
    translateStep({
      id: "ja-m18-6-2-translate-2",
      promptEn: "Tomorrow will probably be warm.",
      acceptedAnswers: [
        "あしたは あたたかいでしょう",
        "あしたは あたたかいでしょう。",
      ],
      audioText: "あしたは あたたかいでしょう",
    }),
    sentenceMcq({
      id: "ja-m18-6-2-mcq-1",
      prompt: "Which means 'A cool breeze is blowing.'?",
      correctKana: "すずしい かぜが ふいています。",
      distractorsKana: [
        "つよい かぜが ふいています。",
        "すずしいな かぜが ふいています。",
        "すずしい うみが みえます。",
      ],
      explanation: "すずしい = cool (い-adj). かぜ = wind. ふいています = is blowing.",
    }),
    build(
      "ja-m18-6-2-build-4",
      "Say: There's a big river near the forest.",
      "もりの ちかくに おおきい かわが あります",
      ["もり", "の", "ちかく", "に", "おおきい", "かわ", "が", "あります", "やま"],
      ["もり", "の", "ちかく", "に", "おおきい", "かわ", "が", "あります"],
    ),
    listeningBuildSentence({
      id: "ja-m18-6-2-lb-1",
      target: "ふゆは さむいでしょう",
      tiles: ["ふゆ", "は", "さむい", "でしょう", "です", "あつい"],
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
      "あきは きれいな やまが あると おもいます",
      "I think autumn has beautiful mountains.",
    ),
    // ── Review tail ──
    speaking("ja-m18-6-2-rev-speak-1", M18_6_2_REVIEW[0].kana, M18_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m18-6-2-rev-lc-1",
      audioText: M18_6_2_REVIEW[1].kana,
      correctMeaningEn: M18_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_6_2_REVIEW[2].meaningEn,
        M18_6_2_REVIEW[3].meaningEn,
        M18_6_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m18-6-2-rev-mcq-1", M18_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    speaking("ja-m18-6-2-rev-speak-2", M18_6_2_REVIEW[2].kana, M18_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-6-2-rev", M18_6_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m18-6-2-info-end",
      "You can produce every M18 pattern in complex sentences",
      "Weather, nature, seasons, predictions, and opinions — all produced from memory.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_6_2.steps);
assertAnswerRotation(M18_6_2.steps, 1);
assertNoConsecutiveSame(M18_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18_STORY — Planning outdoor activities based on weather
// ═══════════════════════════════════════════════════════════════════════

export const M18_STORY: LessonContent = {
  id: "ja-m18-story",
  moduleId: "m18",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Weekend plans",
  description:
    "Listen to two friends plan outdoor activities based on the weather forecast. Answer questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m18-story-info-open",
      "Story time — Weekend plans",
      "ゆき and たけし are planning what to do this weekend. The weather will decide.",
    ),
    dialogueListen({
      id: "ja-m18-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "あしたの てんきは どうですか。" },
        { speaker: "たけし", kana: "あしたは はれでしょう。あたたかいと おもいます。" },
        { speaker: "ゆき", kana: "じゃあ、やまに いきましょうか。" },
        { speaker: "たけし", kana: "いいですね。はるだから はなが きれいでしょう。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What's the weather forecast for tomorrow?",
          correctText: "Probably sunny and warm.",
          distractors: ["Rainy and cold.", "Cloudy but warm.", "Snowy."],
          explanation: "はれでしょう = probably sunny. あたたかいと おもいます = I think it'll be warm.",
        },
        {
          id: "s1-q2",
          prompt: "Where do they plan to go?",
          correctText: "To the mountains.",
          distractors: ["To the sea.", "To a park.", "To a river."],
          explanation: "やまに いきましょうか = shall we go to the mountains?",
        },
      ],
    }),
    build(
      "ja-m18-story-build-1",
      "Say: Tomorrow will probably be sunny.",
      "あしたは はれでしょう",
      ["あした", "は", "はれ", "でしょう", "です", "くもり"],
      ["あした", "は", "はれ", "でしょう"],
    ),
    sentenceMcq({
      id: "ja-m18-story-mcq-1",
      prompt: "Why does たけし think the flowers will be beautiful?",
      correctKana: "Because it's spring.",
      distractorsKana: [
        "Because it's warm.",
        "Because of the rain.",
        "Because they're in the mountains.",
      ],
      explanation: "はるだから = because it's spring.",
    }),
    dialogueListen({
      id: "ja-m18-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "でも、あさってはどうですか。" },
        { speaker: "たけし", kana: "あさっては くもりでしょう。かぜも つよいと おもいます。" },
        { speaker: "ゆき", kana: "じゃあ、あさっては うみに いかないほうが いいですね。" },
        { speaker: "たけし", kana: "そうですね。にわで はなを みましょう。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "What's the forecast for the day after tomorrow?",
          correctText: "Cloudy with strong wind.",
          distractors: ["Sunny and warm.", "Rainy.", "Snowy and cold."],
          explanation: "くもりでしょう = probably cloudy. かぜも つよい = wind is also strong.",
        },
        {
          id: "s2-q2",
          prompt: "What do they decide to do instead of going to the sea?",
          correctText: "Look at flowers in the garden.",
          distractors: ["Go to the mountains.", "Stay home.", "Go to a river."],
          explanation: "にわで はなを みましょう = let's look at flowers in the garden.",
        },
      ],
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
      target: "あしたは はれでしょう",
      tiles: ["あした", "は", "はれ", "でしょう", "です", "あめ"],
      correctOrder: ["あした", "は", "はれ", "でしょう"],
      promptEn: "Hear it, build it: 'Tomorrow will probably be sunny.'",
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
      "あしたは はれでしょう",
      "Tomorrow will probably be sunny.",
    ),
    sentenceMcq({
      id: "ja-m18-story-mcq-summary",
      prompt: "What's their full weekend plan?",
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
    infoStep(
      "ja-m18-story-info-end",
      "You followed a real weather-based planning conversation",
      "Forecasts with でしょう, opinions with とおもいます, and nature vocab — all in a natural weekend planning chat.",
      "win",
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

const M18_7_1_REVIEW = pickReviewAtoms("ja-m18-7-1-rev", M18_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m18-7-1-info-open",
      "Full weather & nature",
      "Everything from M18 — weather, seasons, nature, predictions, opinions. The final mix.",
    ),
    build(
      "ja-m18-7-1-build-1",
      "Say: I think this forest is big.",
      "この もりは おおきいと おもいます",
      ["この", "もり", "は", "おおきい", "と", "おもいます", "でしょう", "だ"],
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
      ["きょう", "は", "そら", "が", "はれて", "います", "くもって", "です"],
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
      target: "あきは すずしいでしょう",
      tiles: ["あき", "は", "すずしい", "でしょう", "です", "あたたかい"],
      correctOrder: ["あき", "は", "すずしい", "でしょう"],
      promptEn: "Hear it, build it: 'Autumn will probably be cool.'",
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
      ["やま", "の", "ちかく", "に", "きれい", "な", "うみ", "が", "あります", "かわ"],
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
      audioText: "はるは あたたかいでしょう",
      correctMeaningEn: "Spring will probably be warm.",
      distractorsEn: [
        "I think spring is warm.",
        "Spring is warm.",
        "Spring will probably be cool.",
      ],
    }),
    selfExplain({
      id: "ja-m18-7-1-self-explain",
      anchorLabel: "Full M18 grammar — でしょう, とおもいます, adj+noun",
      anchorAudioText: "あしたは あめでしょう",
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
      audioText: M18_7_1_REVIEW[1].kana,
      correctMeaningEn: M18_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_7_1_REVIEW[2].meaningEn,
        M18_7_1_REVIEW[3].meaningEn,
        M18_7_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m18-7-1-rev-mcq-1", M18_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    speaking("ja-m18-7-1-rev-speak-2", M18_7_1_REVIEW[2].kana, M18_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-7-1-rev", M18_7_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m18-7-1-info-end",
      "You can now discuss weather, nature, and opinions fluently",
      "Weather, nature, seasons, でしょう, とおもいます, and adjective modification — the full M18 toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M18_7_1.steps);
assertAnswerRotation(M18_7_1.steps, 1);
assertNoConsecutiveSame(M18_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M18-7-2 — Production
// ═══════════════════════════════════════════════════════════════════════

const M18_7_2_REVIEW = pickReviewAtoms("ja-m18-7-2-rev", M18_REVIEW_POOL, 5);

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
    infoStep(
      "ja-m18-7-2-info-open",
      "Full production wrap-up",
      "Build, translate, and speak: every M18 pattern in production direction.",
    ),
    build(
      "ja-m18-7-2-build-1",
      "Say: It will probably rain tomorrow.",
      "あしたは あめでしょう",
      ["あした", "は", "あめ", "でしょう", "です", "ゆき"],
      ["あした", "は", "あめ", "でしょう"],
    ),
    speaking(
      "ja-m18-7-2-speak-1",
      "あしたは あめでしょう",
      "It will probably rain tomorrow.",
    ),
    translateStep({
      id: "ja-m18-7-2-translate-1",
      promptEn: "I think spring is warm.",
      acceptedAnswers: [
        "はるは あたたかいと おもいます",
        "はるは あたたかいと おもいます。",
      ],
      audioText: "はるは あたたかいと おもいます",
    }),
    build(
      "ja-m18-7-2-build-2",
      "Say: Beautiful flowers are blooming in the garden.",
      "にわに きれいな はなが さいています",
      ["にわ", "に", "きれい", "な", "はな", "が", "さいて", "います", "おおきい"],
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
      ["この", "かわ", "は", "きれい", "だ", "と", "おもいます", "な"],
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
      ["なつ", "は", "むしあつい", "でしょう", "です", "すずしい"],
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
      tiles: ["はる", "に", "きれい", "な", "はな", "が", "さきます", "おおきい"],
      correctOrder: ["はる", "に", "きれい", "な", "はな", "が", "さきます"],
      promptEn: "Hear it, build it: 'Beautiful flowers bloom in spring.'",
    }),
    cloze(
      "ja-m18-7-2-cloze-da",
      "この やまは きれい",
      "と おもいます。",
      "だ",
      ["だ", "な", "の", "は"],
      "I think this mountain is beautiful.",
      "この やまは きれいだと おもいます。",
      "な-adj + だ + と おもいます.",
    ),
    selfExplain({
      id: "ja-m18-7-2-self-explain",
      anchorLabel: "Full M18 production mastery",
      anchorAudioText: "にわに きれいな はなが さいています",
      question: "In this sentence, why な after きれい but not い after おおきい?",
      rule: { text: "きれい is a な-adjective — it needs な to modify a noun (きれいな はな). おおきい is an い-adjective — it modifies directly (おおきい もり). Check the adjective type to decide." },
      surface: { text: "おおきい ends in い, which is like な. So they both connect the same way." },
      distractor: { text: "おおきい can also use な — おおきな is an alternative form." },
      ruleExplanation:
        "い-adj: direct modification (おおきい + noun). な-adj: needs な (きれいな + noun). Note: おおきな exists as a special prenominal adjective, but the standard い-adj rule applies to all others.",
    }),
    speaking(
      "ja-m18-7-2-speak-4",
      "はるに きれいな はなが さきます",
      "Beautiful flowers bloom in spring.",
    ),
    // ── Review tail ──
    speaking("ja-m18-7-2-rev-speak-1", M18_7_2_REVIEW[0].kana, M18_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m18-7-2-rev-lc-1",
      audioText: M18_7_2_REVIEW[1].kana,
      correctMeaningEn: M18_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M18_7_2_REVIEW[2].meaningEn,
        M18_7_2_REVIEW[3].meaningEn,
        M18_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m18-7-2-rev-mcq-1", M18_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M18_REVIEW_POOL),
    speaking("ja-m18-7-2-rev-speak-2", M18_7_2_REVIEW[2].kana, M18_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m18-7-2-rev", M18_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m18-7-2-info-end",
      "You can produce every M18 weather and nature pattern from memory",
      "Weather, nature, seasons, predictions, opinions, and adjective modification — all produced. M18 complete.",
      "win",
    ),
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
