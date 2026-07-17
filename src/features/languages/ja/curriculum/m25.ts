/**
 * M25 — Plans & Intentions (2026-05-25).
 *
 * M25 introduces:
 *   - つもりです (intend to / plan to)
 *   - 〜にいく (go to do — purpose of movement)
 *   - 〜ことがあります (have experienced / have done before)
 *   - 〜とき (when / at the time of)
 *
 * Vocab (~25): よてい (plan), けいかく (plan/planning), しゅっぱつ (departure),
 *   とうちゃく (arrival), りょこう (travel), がいこく (foreign country),
 *   おんせん (hot spring), まつり (festival), はなび (fireworks),
 *   けっこん (marriage), そつぎょう (graduation),
 *   はじめて (for the first time), ええ (yes — casual), りゅうがくせい (exchange student)
 *
 * 2026-06-12 sentence-variety reauthor: backlog words はじめて + ええ introduced
 * in ja-m25-4-2, りゅうがくせい in ja-m25-5-2. Story lesson converted to the
 * storyComprehension() factory (§13.13 narrative).
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * Story: Yuki's trips to Japan — storyComprehension() narrative
 * (past experiences with ことがあります + next-year plans with つもりです).
 *
 * ID scheme: ja-m25-{n}-{sub} e.g. ja-m25-1-1, ja-m25-1-2
 * Export names: M25_1_1, M25_1_2, M25_2_1, M25_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m25-1, etc.
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
const M25_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_TSUMORI = grammarRule({
  id: "ja-m25-rule-tsumori",
  grammarPointId: "tsumori-desu",
  title: "〜つもりです — intend to / plan to",
  rule:
    "To express an intention or plan, use: dictionary-form verb + つもりです. For the negative ('don't intend to'), use: ない-form + つもりです. つもり communicates a personal decision or intention — stronger than 'maybe,' weaker than a promise.",
  examples: [
    {
      ja: "にほんに いく つもりです。",
      romaji: "nihon ni iku tsumori desu.",
      en: "I intend to go to Japan.",
    },
    {
      ja: "あした べんきょうする つもりです。",
      romaji: "ashita benkyou suru tsumori desu.",
      en: "I plan to study tomorrow.",
    },
    {
      ja: "おさけを のまない つもりです。",
      romaji: "osake o nomanai tsumori desu.",
      en: "I don't intend to drink alcohol.",
    },
  ],
  antiPattern: {
    ja: "にほんに いきます つもりです。",
    romaji: "nihon ni ikimasu tsumori desu.",
    en: "(broken — use dictionary form before つもり, not ます-form)",
    why: "つもり attaches to the plain dictionary form (いく), not the polite ます-form (いきます).",
  },
  cultureNote:
    "つもり is a personal intention. For shared or official plans, よてい (schedule/plan) is more natural.",
});

const RULE_NI_IKU = grammarRule({
  id: "ja-m25-rule-ni-iku",
  grammarPointId: "ni-iku",
  title: "〜にいく — go to do (purpose of movement)",
  rule:
    "To express the purpose of going somewhere, use: verb-stem (ます-form minus ます) + にいく. This pattern works with いく (go), くる (come), and かえる (return). The に marks the purpose.",
  examples: [
    {
      ja: "えいがを みに いきます。",
      romaji: "eiga o mi ni ikimasu.",
      en: "I'll go to watch a movie.",
    },
    {
      ja: "ひるごはんを たべに いきましょう。",
      romaji: "hirugohan o tabe ni ikimashou.",
      en: "Let's go eat lunch.",
    },
    {
      ja: "ともだちに あいに いきました。",
      romaji: "tomodachi ni ai ni ikimashita.",
      en: "I went to meet a friend.",
    },
  ],
  antiPattern: {
    ja: "えいがを みるに いきます。",
    romaji: "eiga o miru ni ikimasu.",
    en: "(broken — use the ます-stem, not dictionary form, before にいく)",
    why: "Before にいく, use the verb stem (み, not みる). Think of it as the short form that pairs with ます → み + にいく.",
  },
  cultureNote:
    "This pattern is extremely common for daily activities: かいものにいく (go shopping), あそびにいく (go hang out).",
});

const RULE_KOTO_GA_ARU = grammarRule({
  id: "ja-m25-rule-koto-ga-aru",
  grammarPointId: "koto-ga-aru",
  title: "〜ことがあります — have experienced",
  rule:
    "To say you've had an experience ('I have done X before'), use: た-form + ことがあります. The negative ('I have never done X') is: た-form + ことがありません. This is about lifetime experience, not recent past.",
  examples: [
    {
      ja: "にほんに いった ことが あります。",
      romaji: "nihon ni itta koto ga arimasu.",
      en: "I have been to Japan (before).",
    },
    {
      ja: "すしを たべた ことが あります。",
      romaji: "sushi o tabeta koto ga arimasu.",
      en: "I have eaten sushi (before).",
    },
    {
      ja: "おんせんに はいった ことが ありません。",
      romaji: "onsen ni haitta koto ga arimasen.",
      en: "I have never been in a hot spring.",
    },
  ],
  antiPattern: {
    ja: "にほんに いく ことが あります。",
    romaji: "nihon ni iku koto ga arimasu.",
    en: "(broken — experience uses た-form, not dictionary form)",
    why: "ことがある with dictionary form means 'it sometimes happens.' For past experience, you need the た-form (いった, not いく).",
  },
  cultureNote:
    "This pattern is a conversation starter — Japanese speakers often ask about travel and food experiences when getting to know someone.",
});

const RULE_TOKI = grammarRule({
  id: "ja-m25-rule-toki",
  grammarPointId: "toki",
  title: "〜とき — when / at the time of",
  rule:
    "とき means 'when' or 'at the time of.' Before とき: verbs use plain form (dictionary or た-form), い-adjectives stay as-is, な-adjectives add な, nouns add の. Dictionary form + とき = 'when I do X.' た-form + とき = 'when I did X / after doing X.'",
  examples: [
    {
      ja: "にほんに いく とき、パスポートが いります。",
      romaji: "nihon ni iku toki, pasupooto ga irimasu.",
      en: "When going to Japan, you need a passport.",
    },
    {
      ja: "がっこうに いった とき、ともだちに あいました。",
      romaji: "gakkou ni itta toki, tomodachi ni aimashita.",
      en: "When I went to school, I met a friend.",
    },
    {
      ja: "ひまな とき、えいがを みます。",
      romaji: "hima na toki, eiga o mimasu.",
      en: "When I'm free, I watch movies.",
    },
  ],
  antiPattern: {
    ja: "にほんに いきます とき",
    romaji: "nihon ni ikimasu toki",
    en: "(broken — use plain form before とき, not ます-form)",
    why: "とき takes the plain form of the verb (いく / いった), not the polite form (いきます).",
  },
  cultureNote:
    "The tense BEFORE とき matters: dictionary form = the action hasn't happened yet; た-form = it already happened. にほんに いくとき (before going) vs にほんに いったとき (after arriving).",
});

// ═══════════════════════════════════════════════════════════════════════
// M25-1-1 — Vocab intro: plans & travel (first batch)
// ═══════════════════════════════════════════════════════════════════════

const M25_1_1_REVIEW = pickReviewAtoms("ja-m25-1-1-rev", M25_REVIEW_POOL, 6);

export const M25_1_1: LessonContent = {
  id: "ja-m25-1-1",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Plans & travel vocab I",
  description:
    "Learn key vocab for talking about plans: よてい, けいかく, しゅっぱつ, とうちゃく, りょこう.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── よてい (plan/schedule) ──
    build(
      "ja-m25-1-1-build-yotei",
      "Pick the Japanese word for: Plan / Schedule",
      "よてい",
      ["りょこう", "けいかく", "よてい", "しゅっぱつ"],
      ["よてい"],
    ),
    listeningCompSentence({
      id: "ja-m25-1-1-lc-yotei",
      audioText: "あしたの よていは なんですか",
      correctMeaningEn: "What are your plans for tomorrow?",
      distractorsEn: [
        "What did you do yesterday?",
        "What time is it now?",
        "Where are you going tomorrow?",
      ],
    }),
    // ── けいかく (plan/planning) ──
    build(
      "ja-m25-1-1-build-keikaku",
      "Pick the Japanese word for: Planning",
      "けいかく",
      ["しゅっぱつ", "とうちゃく", "よてい", "けいかく"],
      ["けいかく"],
    ),
    vocabMcq(
      "ja-m25-1-1-mcq-keikaku",
      { kana: "けいかく", meaningEn: "planning", emoji: "📋", fromModule: "m25" },
      M25_REVIEW_POOL,
    ),
    // ── しゅっぱつ (departure) ──
    build(
      "ja-m25-1-1-build-shuppatsu",
      "Pick the Japanese word for: Departure",
      "しゅっぱつ",
      ["よてい", "しゅっぱつ", "りょこう", "とうちゃく"],
      ["しゅっぱつ"],
    ),
    speaking("ja-m25-1-1-speak-shuppatsu", "しゅっぱつ", "Departure"),
    // ── とうちゃく (arrival) ──
    build(
      "ja-m25-1-1-build-touchaku",
      "Pick the Japanese word for: Arrival",
      "とうちゃく",
      ["けいかく", "しゅっぱつ", "よてい", "とうちゃく"],
      ["とうちゃく"],
    ),
    listeningCompSentence({
      id: "ja-m25-1-1-lc-touchaku",
      audioText: "とうちゃく",
      correctMeaningEn: "arrival",
      distractorsEn: ["departure", "plan", "travel"],
    }),
    // ── りょこう (travel) ──
    build(
      "ja-m25-1-1-build-ryokou",
      "Pick the Japanese word for: Travel / Trip",
      "りょこう",
      ["しゅっぱつ", "とうちゃく", "りょこう", "けいかく"],
      ["りょこう"],
    ),
    vocabMcq(
      "ja-m25-1-1-mcq-ryokou",
      { kana: "りょこう", meaningEn: "travel / trip", emoji: "✈️", fromModule: "m25" },
      M25_REVIEW_POOL,
    ),
    // ── Sentence drills with new vocab ──
    sentenceMcq({
      id: "ja-m25-1-1-mcq-sentence",
      prompt: "Which sentence means 'The departure is at 9 o'clock.'?",
      correctKana: "しゅっぱつは くじです。",
      distractorsKana: [
        "とうちゃくは くじです。",
        "しゅっぱつは じゅうじです。",
        "よていは くじです。",
      ],
      explanation: "しゅっぱつ = departure. くじ = 9 o'clock.",
    }),
    build(
      "ja-m25-1-1-build-ryokou-sent",
      "Say: Travel is fun.",
      "りょこうは たのしいです",
      ["は", "たのしい", "りょこう", "けいかく", "です", "おもしろい"],
      ["りょこう", "は", "たのしい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m25-1-1-lb-yotei",
      target: "あしたの よていは なんですか",
      tiles: ["よてい", "だれ", "の", "ですか", "あした", "けいかく", "なん", "は"],
      correctOrder: ["あした", "の", "よてい", "は", "なん", "ですか"],
      promptEn: "Hear it, build it: 'What is tomorrow's plan?'",
    }),
    selfExplain({
      id: "ja-m25-1-1-self-explain",
      anchorLabel: "しゅっぱつ and とうちゃく",
      anchorAudioText: "しゅっぱつは くじです",
      question: "What's the difference between しゅっぱつ and とうちゃく?",
      rule: { text: "しゅっぱつ = departure (leaving). とうちゃく = arrival (reaching the destination). They are opposites." },
      surface: { text: "They mean the same thing — both refer to a trip." },
      distractor: { text: "しゅっぱつ is formal and とうちゃく is casual — both mean departure." },
      ruleExplanation:
        "しゅっぱつ (出発) = departure and とうちゃく (到着) = arrival. Opposite ends of a journey.",
    }),
    speaking(
      "ja-m25-1-1-speak-ryokou",
      "りょこうは たのしいです",
      "Travel is fun.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-1-1-rev-mcq-1", M25_1_1_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-1-1-rev-lc-1",
      audioText: "その ペンは だれのですか",
      correctMeaningEn: "Whose pen is that?",
      distractorsEn: [
        "Whose book is that?",
        "Where is my pen?",
        "That pen is mine.",
      ],
    }),
    speaking("ja-m25-1-1-rev-speak-1", M25_1_1_REVIEW[2].kana, M25_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-1-1-rev", M25_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_1_1.steps);
assertAnswerRotation(M25_1_1.steps, 1);
assertNoConsecutiveSame(M25_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-1-2 — Vocab intro: events & milestones
// ═══════════════════════════════════════════════════════════════════════

const M25_1_2_REVIEW = pickReviewAtoms("ja-m25-1-2-rev", M25_REVIEW_POOL, 6);

export const M25_1_2: LessonContent = {
  id: "ja-m25-1-2",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Events & milestones vocab",
  description:
    "Learn vocab for life events: がいこく, おんせん, まつり, はなび, けっこん, そつぎょう.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── がいこく (foreign country) ──
    build(
      "ja-m25-1-2-build-gaikoku",
      "Pick the Japanese word for: Foreign country",
      "がいこく",
      ["まつり", "はなび", "おんせん", "がいこく"],
      ["がいこく"],
    ),
    listeningCompSentence({
      id: "ja-m25-1-2-lc-gaikoku",
      audioText: "がいこく",
      correctMeaningEn: "foreign country",
      distractorsEn: ["festival", "hot spring", "graduation"],
    }),
    // ── おんせん (hot spring) ──
    build(
      "ja-m25-1-2-build-onsen",
      "Pick the Japanese word for: Hot spring",
      "おんせん",
      ["がいこく", "まつり", "おんせん", "けっこん"],
      ["おんせん"],
    ),
    vocabMcq(
      "ja-m25-1-2-mcq-onsen",
      { kana: "おんせん", meaningEn: "hot spring", emoji: "♨️", fromModule: "m25" },
      M25_REVIEW_POOL,
    ),
    // ── まつり (festival) ──
    build(
      "ja-m25-1-2-build-matsuri",
      "Pick the Japanese word for: Festival",
      "まつり",
      ["そつぎょう", "まつり", "おんせん", "はなび"],
      ["まつり"],
    ),
    speaking("ja-m25-1-2-speak-matsuri", "まつり", "Festival"),
    // ── はなび (fireworks) ──
    build(
      "ja-m25-1-2-build-hanabi",
      "Pick the Japanese word for: Fireworks",
      "はなび",
      ["がいこく", "はなび", "けっこん", "まつり"],
      ["はなび"],
    ),
    vocabMcq(
      "ja-m25-1-2-mcq-hanabi",
      { kana: "はなび", meaningEn: "fireworks", emoji: "🎆", fromModule: "m25" },
      M25_REVIEW_POOL,
    ),
    // ── けっこん (marriage) ──
    build(
      "ja-m25-1-2-build-kekkon",
      "Pick the Japanese word for: Marriage",
      "けっこん",
      ["まつり", "はなび", "そつぎょう", "けっこん"],
      ["けっこん"],
    ),
    listeningCompSentence({
      id: "ja-m25-1-2-lc-kekkon",
      audioText: "けっこんの よていが あります",
      correctMeaningEn: "I have plans to get married.",
      distractorsEn: [
        "I have plans to graduate.",
        "I got married last year.",
        "I have no plans.",
      ],
    }),
    // ── そつぎょう (graduation) ──
    build(
      "ja-m25-1-2-build-sotsugyou",
      "Pick the Japanese word for: Graduation",
      "そつぎょう",
      ["けっこん", "がいこく", "そつぎょう", "おんせん"],
      ["そつぎょう"],
    ),
    speaking("ja-m25-1-2-speak-sotsugyou", "そつぎょう", "Graduation"),
    // ── Sentence drills ──
    sentenceMcq({
      id: "ja-m25-1-2-mcq-sentence",
      prompt: "Which sentence means 'The festival is fun.'?",
      correctKana: "まつりは たのしいです。",
      distractorsKana: [
        "はなびは たのしいです。",
        "まつりは おもしろいです。",
        "けっこんは たのしいです。",
      ],
      explanation: "まつり = festival. たのしい = fun.",
    }),
    build(
      "ja-m25-1-2-build-gaikoku-sent",
      "Say: I want to go to a foreign country.",
      "がいこくに いきたいです",
      ["に", "いきたい", "です", "がいこく", "おんせん", "みたい"],
      ["がいこく", "に", "いきたい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m25-1-2-lb-onsen",
      target: "おんせんに はいりたいです",
      tiles: ["です", "いきたい", "おんせん", "に", "はいりたい", "まつり"],
      correctOrder: ["おんせん", "に", "はいりたい", "です"],
      promptEn: "Hear it, build it: 'I want to enter a hot spring.'",
    }),
    selfExplain({
      id: "ja-m25-1-2-self-explain",
      anchorLabel: "まつり and はなび",
      anchorAudioText: "まつりで はなびを みます",
      question: "What's the relationship between まつり and はなび?",
      rule: { text: "まつり = festival (the event). はなび = fireworks (often part of one). Different things — one's an event, the other a spectacle." },
      surface: { text: "They mean the same thing — both refer to celebrations." },
      distractor: { text: "はなび is a type of まつり — all fireworks are festivals." },
      ruleExplanation:
        "まつり (祭り) = festival. はなび (花火) = fireworks. Fireworks are common AT festivals but they're not the same word.",
    }),
    speaking(
      "ja-m25-1-2-speak-gaikoku",
      "がいこくに いきたいです",
      "I want to go to a foreign country.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-1-2-rev-mcq-1", M25_1_2_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-1-2-rev-lc-1",
      audioText: "こうえんに ふたり います",
      correctMeaningEn: "There are two people in the park.",
      distractorsEn: [
        "There are two people at the station.",
        "There is one person in the park.",
        "There are two dogs in the park.",
      ],
    }),
    speaking("ja-m25-1-2-rev-speak-1", M25_1_2_REVIEW[2].kana, M25_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-1-2-rev", M25_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_1_2.steps);
assertAnswerRotation(M25_1_2.steps, 1);
assertNoConsecutiveSame(M25_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-2-1 — Grammar: つもりです (intend to) + drill
// ═══════════════════════════════════════════════════════════════════════

const M25_2_1_REVIEW = pickReviewAtoms("ja-m25-2-1-rev", M25_REVIEW_POOL, 6);

export const M25_2_1: LessonContent = {
  id: "ja-m25-2-1",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Intend to — つもりです",
  description:
    "Learn to express intentions with dictionary-form + つもりです.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_TSUMORI,
    // ── Drills: つもりです ──
    cloze(
      "ja-m25-2-1-cloze-1",
      "にほんに いく",
      "です。",
      "つもり",
      ["つもり", "こと", "とき", "ため"],
      "I intend to go to Japan.",
      "にほんに いく つもりです。",
      "つもり after dictionary form = intend to.",
    ),
    sentenceMcq({
      id: "ja-m25-2-1-mcq-1",
      prompt: "Which sentence means 'I plan to study tomorrow.'?",
      correctKana: "あした べんきょうする つもりです。",
      distractorsKana: [
        "あした べんきょうした つもりです。",
        "あした べんきょうします つもりです。",
        "あした べんきょうの つもりです。",
      ],
      explanation: "Dictionary form (する) + つもりです = plan to do.",
    }),
    build(
      "ja-m25-2-1-build-tsumori-1",
      "Say: I intend to travel next year.",
      "らいねん りょこうする つもりです",
      ["する", "けいかく", "つもり", "です", "りょこう", "した", "らいねん"],
      ["らいねん", "りょこう", "する", "つもり", "です"],
    ),
    listeningCompSentence({
      id: "ja-m25-2-1-lc-1",
      audioText: "なつやすみに がいこくに いく つもりです",
      correctMeaningEn: "I intend to go abroad during summer break.",
      distractorsEn: [
        "I went abroad during summer break.",
        "I intend to study during summer break.",
        "I went to a festival during summer break.",
      ],
    }),
    cloze(
      "ja-m25-2-1-cloze-2",
      "おさけを のまない",
      "です。",
      "つもり",
      ["つもり", "こと", "よてい", "ため"],
      "I don't intend to drink alcohol.",
      "おさけを のまない つもりです。",
      "ない-form + つもり = don't intend to.",
    ),
    speaking(
      "ja-m25-2-1-speak-1",
      "にほんごを べんきょうする つもりです",
      "I plan to study Japanese.",
    ),
    cloze(
      "ja-m25-2-1-cloze-3",
      "あした はやく おきる",
      "です。",
      "つもり",
      ["つもり", "とき", "こと", "まえ"],
      "I intend to wake up early tomorrow.",
      "あした はやく おきる つもりです。",
      "Dictionary form おきる + つもり = intend to wake up.",
    ),
    listeningBuildSentence({
      id: "ja-m25-2-1-lb-1",
      target: "けっこんする つもりです",
      tiles: ["する", "です", "した", "こと", "つもり", "けっこん"],
      correctOrder: ["けっこん", "する", "つもり", "です"],
      promptEn: "Hear it, build it: 'I intend to get married.'",
    }),
    sentenceMcq({
      id: "ja-m25-2-1-mcq-2",
      prompt: "Which sentence means 'I don't plan to go.'?",
      correctKana: "いかない つもりです。",
      distractorsKana: [
        "いく つもりです。",
        "いった つもりです。",
        "いきません つもりです。",
      ],
      explanation: "ない-form (いかない) + つもり = don't plan to.",
    }),
    translateStep({
      id: "ja-m25-2-1-translate",
      promptEn: "I intend to go to a hot spring.",
      acceptedAnswers: [
        "おんせんに いく つもりです",
        "おんせんに いく つもりです。",
      ],
      audioText: "おんせんに いく つもりです",
    }),
    selfExplain({
      id: "ja-m25-2-1-self-explain",
      anchorLabel: "いく つもりです vs いきます つもりです",
      anchorAudioText: "にほんに いく つもりです",
      question: "Why いく (dictionary form) and not いきます before つもり?",
      rule: { text: "つもり always attaches to the plain dictionary form. ます-form before つもり is incorrect." },
      surface: { text: "Both いく and いきます work before つもり — pick whichever sounds better." },
      distractor: { text: "いきます つもり is the formal version, いく つもり is casual." },
      ruleExplanation:
        "つもり requires the plain form: いく つもりです (correct), not いきます つもりです (incorrect).",
    }),
    speaking(
      "ja-m25-2-1-speak-2",
      "ともだちと まつりに いく つもりです",
      "I plan to go to a festival with a friend.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-2-1-rev-mcq-1", M25_2_1_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-2-1-rev-lc-1",
      audioText: "ジュースを ふたつ ください",
      correctMeaningEn: "Two juices, please.",
      distractorsEn: [
        "Two coffees, please.",
        "Three juices, please.",
        "I drank two juices.",
      ],
    }),
    speaking("ja-m25-2-1-rev-speak-1", M25_2_1_REVIEW[2].kana, M25_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-2-1-rev", M25_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_2_1.steps);
assertAnswerRotation(M25_2_1.steps, 1);
assertNoConsecutiveSame(M25_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-2-2 — More つもりです + vocab in context
// ═══════════════════════════════════════════════════════════════════════

const M25_2_2_REVIEW = pickReviewAtoms("ja-m25-2-2-rev", M25_REVIEW_POOL, 6);

export const M25_2_2: LessonContent = {
  id: "ja-m25-2-2",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Intentions in context",
  description:
    "Combine つもりです with M25 travel and event vocab in realistic sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    build(
      "ja-m25-2-2-build-1",
      "Say: I intend to watch fireworks.",
      "はなびを みる つもりです",
      ["みた", "はなび", "つもり", "こと", "みる", "です", "を"],
      ["はなび", "を", "みる", "つもり", "です"],
    ),
    cloze(
      "ja-m25-2-2-cloze-1",
      "まつりに いく",
      "です。",
      "つもり",
      ["つもり", "こと", "とき", "ため"],
      "I intend to go to the festival.",
      "まつりに いく つもりです。",
      "Dictionary form + つもり = intention.",
    ),
    listeningCompSentence({
      id: "ja-m25-2-2-lc-1",
      audioText: "そつぎょうしてから りょこうする つもりです",
      correctMeaningEn: "I intend to travel after graduating.",
      distractorsEn: [
        "I traveled after graduating.",
        "I intend to graduate after traveling.",
        "I graduated and then traveled.",
      ],
    }),
    sentenceMcq({
      id: "ja-m25-2-2-mcq-1",
      prompt: "Which sentence means 'I plan to go to a foreign country next month.'?",
      correctKana: "らいげつ がいこくに いく つもりです。",
      distractorsKana: [
        "らいげつ がいこくに いった つもりです。",
        "らいげつ がいこくに いきます つもりです。",
        "らいねん がいこくに いく つもりです。",
      ],
      explanation: "らいげつ = next month. Dictionary form + つもりです.",
    }),
    build(
      "ja-m25-2-2-build-2",
      "Say: I don't intend to get married yet.",
      "まだ けっこんしない つもりです",
      ["つもり", "けっこん", "まだ", "です", "する", "よてい", "しない"],
      ["まだ", "けっこん", "しない", "つもり", "です"],
    ),
    speaking(
      "ja-m25-2-2-speak-1",
      "はなびを みる つもりです",
      "I intend to watch fireworks.",
    ),
    cloze(
      "ja-m25-2-2-cloze-2",
      "おんせんに はいる",
      "です。",
      "つもり",
      ["つもり", "こと", "よてい", "まえ"],
      "I intend to go to a hot spring.",
      "おんせんに はいる つもりです。",
      "はいる (enter/bathe) + つもり = intend to bathe.",
    ),
    listeningBuildSentence({
      id: "ja-m25-2-2-lb-1",
      target: "やまに いく つもりです",
      tiles: ["いく", "に", "やま", "いった", "つもり", "こと", "です"],
      correctOrder: ["やま", "に", "いく", "つもり", "です"],
      promptEn: "Hear it, build it: 'I intend to go to the mountains.'",
    }),
    build(
      "ja-m25-2-2-build-shuppatsu",
      "Ask: What time is the departure?",
      "しゅっぱつは なんじですか",
      ["なんじ", "しゅっぱつ", "は", "ですか", "とうちゃく", "の"],
      ["しゅっぱつ", "は", "なんじ", "ですか"],
    ),
    sentenceMcq({
      id: "ja-m25-2-2-mcq-2",
      prompt: "Which sentence means 'I don't plan to travel this year.'?",
      correctKana: "ことし りょこうしない つもりです。",
      distractorsKana: [
        "ことし りょこうする つもりです。",
        "ことし りょこうした つもりです。",
        "ことし りょこうしません つもりです。",
      ],
      explanation: "ない-form (しない) + つもり = don't plan to.",
    }),
    translateStep({
      id: "ja-m25-2-2-translate",
      promptEn: "I plan to take photos at the festival.",
      acceptedAnswers: [
        "まつりで しゃしんを とる つもりです",
        "まつりで しゃしんを とる つもりです。",
      ],
      audioText: "まつりで しゃしんを とる つもりです",
    }),
    selfExplain({
      id: "ja-m25-2-2-self-explain",
      anchorLabel: "けっこんしない つもりです",
      anchorAudioText: "まだ けっこんしない つもりです",
      question: "How do you say you DON'T intend to do something?",
      rule: { text: "Use ない-form + つもりです: しない つもりです = don't intend to do." },
      surface: { text: "Add ません after つもり: する つもりません." },
      distractor: { text: "Add じゃない after つもり: する つもりじゃないです." },
      ruleExplanation:
        "Negative intention: ない-form verb + つもりです. The negation goes on the VERB, not on つもり.",
    }),
    speaking(
      "ja-m25-2-2-speak-2",
      "まだ けっこんしない つもりです",
      "I don't intend to get married yet.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-2-2-rev-mcq-1", M25_2_2_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-2-2-rev-lc-1",
      audioText: "かさは どこに ありますか",
      correctMeaningEn: "Where is the umbrella?",
      distractorsEn: [
        "Where is the bag?",
        "Is there an umbrella?",
        "The umbrella is in my bag.",
      ],
    }),
    speaking("ja-m25-2-2-rev-speak-1", M25_2_2_REVIEW[2].kana, M25_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-2-2-rev", M25_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_2_2.steps);
assertAnswerRotation(M25_2_2.steps, 1);
assertNoConsecutiveSame(M25_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-3-1 — Grammar: 〜にいく (go to do) + drill
// ═══════════════════════════════════════════════════════════════════════

const M25_3_1_REVIEW = pickReviewAtoms("ja-m25-3-1-rev", M25_REVIEW_POOL, 6);

export const M25_3_1: LessonContent = {
  id: "ja-m25-3-1",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Go to do — 〜にいく",
  description:
    "Express the purpose of going somewhere: verb-stem + にいく.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_NI_IKU,
    // ── Drills: にいく ──
    cloze(
      "ja-m25-3-1-cloze-1",
      "えいがを み",
      "いきます。",
      "に",
      ["に", "を", "で", "は"],
      "I'll go to watch a movie.",
      "えいがを みに いきます。",
      "に marks the purpose — going IN ORDER TO watch.",
    ),
    build(
      "ja-m25-3-1-build-1",
      "Say: Let's go eat lunch.",
      "ひるごはんを たべに いきましょう",
      ["を", "ひるごはん", "いきましょう", "たべる", "いきます", "たべ", "に"],
      ["ひるごはん", "を", "たべ", "に", "いきましょう"],
    ),
    listeningCompSentence({
      id: "ja-m25-3-1-lc-1",
      audioText: "ともだちに あいに いきました",
      correctMeaningEn: "I went to meet a friend.",
      distractorsEn: [
        "I went with a friend.",
        "A friend came to meet me.",
        "I met a friend at home.",
      ],
    }),
    sentenceMcq({
      id: "ja-m25-3-1-mcq-1",
      prompt: "Which sentence means 'I'll go shopping.'?",
      correctKana: "かいものに いきます。",
      distractorsKana: [
        "かいものを いきます。",
        "かいものに いきました。",
        "かいものは いきます。",
      ],
      explanation: "かいもの + に いきます = go shopping (purpose).",
    }),
    cloze(
      "ja-m25-3-1-cloze-2",
      "はなびを み",
      "いきましょう。",
      "に",
      ["に", "は", "が", "と"],
      "Let's go watch fireworks.",
      "はなびを みに いきましょう。",
      "に marks the purpose of going.",
    ),
    speaking(
      "ja-m25-3-1-speak-1",
      "パンを かいに いきます",
      "I'll go to buy bread.",
    ),
    build(
      "ja-m25-3-1-build-2",
      "Say: I went to buy a souvenir.",
      "おみやげを かいに いきました",
      ["いきます", "を", "かう", "おみやげ", "いきました", "かい", "に"],
      ["おみやげ", "を", "かい", "に", "いきました"],
    ),
    cloze(
      "ja-m25-3-1-cloze-3",
      "おんせんに はいり",
      "いきたいです。",
      "に",
      ["に", "で", "を", "と"],
      "I want to go bathe in a hot spring.",
      "おんせんに はいりに いきたいです。",
      "に marks purpose — going in order to bathe.",
    ),
    listeningBuildSentence({
      id: "ja-m25-3-1-lb-1",
      target: "まつりを みに いきましょう",
      tiles: ["み", "いきます", "いきましょう", "を", "みる", "まつり", "に"],
      correctOrder: ["まつり", "を", "み", "に", "いきましょう"],
      promptEn: "Hear it, build it: 'Let's go watch the festival.'",
    }),
    translateStep({
      id: "ja-m25-3-1-translate",
      promptEn: "I'll go to eat sushi.",
      acceptedAnswers: [
        "すしを たべに いきます",
        "すしを たべに いきます。",
      ],
      audioText: "すしを たべに いきます",
    }),
    selfExplain({
      id: "ja-m25-3-1-self-explain",
      anchorLabel: "みに いきます vs みるに いきます",
      anchorAudioText: "えいがを みに いきます",
      question: "Why み (verb stem) and not みる (dictionary form) before にいく?",
      rule: { text: "Before にいく, use the ます-stem (み from みます). The dictionary form (みる) doesn't attach to にいく." },
      surface: { text: "Either み or みる works — they're interchangeable before にいく." },
      distractor: { text: "みる is used for casual speech, み for formal." },
      ruleExplanation:
        "The ます-stem (e.g., み from みます, たべ from たべます) connects to にいく. Dictionary form before にいく is incorrect.",
    }),
    speaking(
      "ja-m25-3-1-speak-2",
      "コーヒーを のみに いきましょう",
      "Let's go drink coffee.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-3-1-rev-mcq-1", M25_3_1_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-3-1-rev-lc-1",
      audioText: "ぎんこうは どこですか",
      correctMeaningEn: "Where is the bank?",
      distractorsEn: [
        "Where is the station?",
        "The bank is over there.",
        "Is there a bank near here?",
      ],
    }),
    speaking("ja-m25-3-1-rev-speak-1", M25_3_1_REVIEW[2].kana, M25_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-3-1-rev", M25_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_3_1.steps);
assertAnswerRotation(M25_3_1.steps, 1);
assertNoConsecutiveSame(M25_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-3-2 — にいく in context + つもり interleave
// ═══════════════════════════════════════════════════════════════════════

const M25_3_2_REVIEW = pickReviewAtoms("ja-m25-3-2-rev", M25_REVIEW_POOL, 6);

export const M25_3_2: LessonContent = {
  id: "ja-m25-3-2",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Purpose + intentions interleave",
  description:
    "Mix にいく (purpose) with つもりです (intention) for richer plan-talk.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    build(
      "ja-m25-3-2-build-1",
      "Say: I plan to go watch fireworks.",
      "はなびを みに いく つもりです",
      ["に", "つもり", "み", "みる", "を", "いく", "はなび", "です"],
      ["はなび", "を", "み", "に", "いく", "つもり", "です"],
    ),
    cloze(
      "ja-m25-3-2-cloze-1",
      "おんせんに はいり",
      "いく つもりです。",
      "に",
      ["に", "を", "で", "は"],
      "I plan to go bathe in a hot spring.",
      "おんせんに はいりに いく つもりです。",
      "に marks the purpose of going.",
    ),
    listeningCompSentence({
      id: "ja-m25-3-2-lc-1",
      audioText: "まつりに あそびに いく つもりです",
      correctMeaningEn: "I plan to go hang out at the festival.",
      distractorsEn: [
        "I went to the festival.",
        "I plan to go to the hot spring.",
        "I plan to watch the festival.",
      ],
    }),
    sentenceMcq({
      id: "ja-m25-3-2-mcq-1",
      prompt: "Which sentence means 'I plan to go buy a souvenir.'?",
      correctKana: "おみやげを かいに いく つもりです。",
      distractorsKana: [
        "おみやげを かいに いきました。",
        "おみやげを かう つもりです。",
        "おみやげを かいに いきます。",
      ],
      explanation: "かい (buy stem) + にいく + つもりです = plan to go buy.",
    }),
    cloze(
      "ja-m25-3-2-cloze-2",
      "りょこうする",
      "です。",
      "つもり",
      ["つもり", "こと", "とき", "まえ"],
      "I intend to travel.",
      "りょこうする つもりです。",
      "つもり after dictionary form = intention.",
    ),
    speaking(
      "ja-m25-3-2-speak-1",
      "ともだちに あいに いく つもりです",
      "I plan to go meet a friend.",
    ),
    build(
      "ja-m25-3-2-build-2",
      "Say: I want to go to see the graduation ceremony.",
      "そつぎょうしきを みに いきたいです",
      ["いきたい", "いく", "です", "に", "み", "みる", "そつぎょうしき", "を"],
      ["そつぎょうしき", "を", "み", "に", "いきたい", "です"],
    ),
    cloze(
      "ja-m25-3-2-cloze-3",
      "ともだちと えいがを み",
      "いきました。",
      "に",
      ["に", "と", "で", "は"],
      "I went with a friend to watch a movie.",
      "ともだちと えいがを みに いきました。",
      "に marks the purpose — going to watch.",
    ),
    listeningBuildSentence({
      id: "ja-m25-3-2-lb-1",
      target: "すしを たべに いく つもりです",
      tiles: ["を", "いく", "すし", "つもり", "に", "たべ", "たべる", "です"],
      correctOrder: ["すし", "を", "たべ", "に", "いく", "つもり", "です"],
      promptEn: "Hear it, build it: 'I plan to go eat sushi.'",
    }),
    sentenceMcq({
      id: "ja-m25-3-2-mcq-2",
      prompt: "Which sentence means 'Let's go swim.'?",
      correctKana: "およぎに いきましょう。",
      distractorsKana: [
        "およぐに いきましょう。",
        "およぎを いきましょう。",
        "およいで いきましょう。",
      ],
      explanation: "およぎ (swim stem from およぐ/およぎます) + にいく = go to swim.",
    }),
    translateStep({
      id: "ja-m25-3-2-translate",
      promptEn: "I plan to go to a foreign country.",
      acceptedAnswers: [
        "がいこくに いく つもりです",
        "がいこくに いく つもりです。",
      ],
      audioText: "がいこくに いく つもりです",
    }),
    selfExplain({
      id: "ja-m25-3-2-self-explain",
      anchorLabel: "はなびを みに いく つもりです",
      anchorAudioText: "はなびを みに いく つもりです",
      question: "In this sentence, what do にいく and つもり each contribute?",
      rule: { text: "にいく = purpose of movement (going to watch). つもり = personal intention (I plan to). Together: 'I plan to go [in order to] watch.'" },
      surface: { text: "にいく and つもり mean the same thing — they're both about plans." },
      distractor: { text: "にいく is the main verb and つもり is just a politeness marker like です." },
      ruleExplanation:
        "にいく expresses purpose ('go to do X'). つもり expresses intention ('I plan to'). Stacking them = 'I intend to go for the purpose of…'",
    }),
    speaking(
      "ja-m25-3-2-speak-2",
      "おんせんに はいりに いく つもりです",
      "I plan to go bathe in a hot spring.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-3-2-rev-mcq-1", M25_3_2_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-3-2-rev-lc-1",
      audioText: "この とけいは いくらですか",
      correctMeaningEn: "How much is this watch?",
      distractorsEn: [
        "How much is this camera?",
        "Whose watch is this?",
        "This watch is expensive.",
      ],
    }),
    speaking("ja-m25-3-2-rev-speak-1", M25_3_2_REVIEW[2].kana, M25_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-3-2-rev", M25_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_3_2.steps);
assertAnswerRotation(M25_3_2.steps, 1);
assertNoConsecutiveSame(M25_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-4-1 — Grammar: ことがあります (experience) + drill
// ═══════════════════════════════════════════════════════════════════════

const M25_4_1_REVIEW = pickReviewAtoms("ja-m25-4-1-rev", M25_REVIEW_POOL, 6);

export const M25_4_1: LessonContent = {
  id: "ja-m25-4-1",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Have you ever — ことがあります",
  description:
    "Talk about past experiences with た-form + ことがあります.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_KOTO_GA_ARU,
    // ── Drills: ことがあります ──
    cloze(
      "ja-m25-4-1-cloze-1",
      "にほんに いった",
      "が あります。",
      "こと",
      ["こと", "つもり", "とき", "ため"],
      "I have been to Japan.",
      "にほんに いった ことが あります。",
      "た-form + ことがある = have experienced.",
    ),
    sentenceMcq({
      id: "ja-m25-4-1-mcq-1",
      prompt: "Which sentence means 'I have eaten sushi before.'?",
      correctKana: "すしを たべた ことが あります。",
      distractorsKana: [
        "すしを たべる ことが あります。",
        "すしを たべた つもりです。",
        "すしを たべます ことが あります。",
      ],
      explanation: "た-form (たべた) + ことがあります = have done before.",
    }),
    build(
      "ja-m25-4-1-build-1",
      "Say: I have been to a hot spring before.",
      "おんせんに はいった ことが あります",
      ["はいった", "はいる", "おんせん", "つもり", "に", "あります", "が", "こと"],
      ["おんせん", "に", "はいった", "こと", "が", "あります"],
    ),
    listeningCompSentence({
      id: "ja-m25-4-1-lc-1",
      audioText: "がいこくに いった ことが ありません",
      correctMeaningEn: "I have never been to a foreign country.",
      distractorsEn: [
        "I have been to a foreign country.",
        "I went to a foreign country.",
        "I don't want to go abroad.",
      ],
    }),
    cloze(
      "ja-m25-4-1-cloze-2",
      "はなびを みた",
      "が あります。",
      "こと",
      ["こと", "つもり", "よてい", "とき"],
      "I have seen fireworks before.",
      "はなびを みた ことが あります。",
      "た-form + ことが = experience marker.",
    ),
    speaking(
      "ja-m25-4-1-speak-1",
      "まつりで しゃしんを とった ことが あります",
      "I have taken photos at a festival before.",
    ),
    build(
      "ja-m25-4-1-build-2",
      "Say: I have never been to a festival.",
      "まつりに いった ことが ありません",
      ["あります", "に", "いく", "ありません", "が", "まつり", "こと", "いった"],
      ["まつり", "に", "いった", "こと", "が", "ありません"],
    ),
    cloze(
      "ja-m25-4-1-cloze-3",
      "けっこんしきに いった こと",
      " ありません。",
      "が",
      ["が", "は", "を", "に"],
      "I have never been to a wedding.",
      "けっこんしきに いった ことが ありません。",
      "が marks こと as the subject of あります/ありません.",
    ),
    listeningBuildSentence({
      id: "ja-m25-4-1-lb-1",
      target: "がいこくで まつりを みた ことが あります",
      tiles: ["まつり", "がいこく", "で", "を", "みた", "こと", "が", "あります", "ありません"],
      correctOrder: ["がいこく", "で", "まつり", "を", "みた", "こと", "が", "あります"],
      promptEn: "Hear it, build it: 'I have seen a festival abroad before.'",
    }),
    sentenceMcq({
      id: "ja-m25-4-1-mcq-2",
      prompt: "Which sentence means 'I have never graduated.'?",
      correctKana: "そつぎょうした ことが ありません。",
      distractorsKana: [
        "そつぎょうした ことが あります。",
        "そつぎょうする つもりです。",
        "そつぎょうする ことが ありません。",
      ],
      explanation: "した (た-form) + ことがありません = have never done.",
    }),
    translateStep({
      id: "ja-m25-4-1-translate",
      promptEn: "I have written a letter in Japanese before.",
      acceptedAnswers: [
        "にほんごで てがみを かいた ことが あります",
        "にほんごで てがみを かいた ことが あります。",
        "にほんごで てがみを かいたことが あります",
        "にほんごで てがみを かいたことがあります",
      ],
      audioText: "にほんごで てがみを かいた ことが あります",
    }),
    selfExplain({
      id: "ja-m25-4-1-self-explain",
      anchorLabel: "いった ことがあります vs いく ことがあります",
      anchorAudioText: "にほんに いった ことが あります",
      question: "Why いった (た-form) and not いく (dictionary form) before ことがある?",
      rule: { text: "For past experience, you need the た-form (いった). Dictionary form + ことがある means 'it sometimes happens' — a different meaning." },
      surface: { text: "Both forms work — た-form is just more common." },
      distractor: { text: "いく ことがある is for questions; いった ことがある is for statements." },
      ruleExplanation:
        "た-form + ことがある = lifetime experience. Dictionary form + ことがある = 'sometimes happens.' Different tenses, different meanings.",
    }),
    speaking(
      "ja-m25-4-1-speak-2",
      "やまで キャンプを した ことが あります",
      "I have camped in the mountains before.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-4-1-rev-mcq-1", M25_4_1_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-4-1-rev-lc-1",
      audioText: "みずを のみたいです",
      correctMeaningEn: "I want to drink water.",
      distractorsEn: [
        "I want to drink juice.",
        "I drank some water.",
        "The water is cold.",
      ],
    }),
    speaking("ja-m25-4-1-rev-speak-1", M25_4_1_REVIEW[2].kana, M25_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-4-1-rev", M25_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_4_1.steps);
assertAnswerRotation(M25_4_1.steps, 1);
assertNoConsecutiveSame(M25_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-4-2 — ことがある in context + prior grammar interleave
// ═══════════════════════════════════════════════════════════════════════

const M25_4_2_REVIEW = pickReviewAtoms("ja-m25-4-2-rev", M25_REVIEW_POOL, 6);

export const M25_4_2: LessonContent = {
  id: "ja-m25-4-2",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Experiences + intentions interleave",
  description:
    "Mix ことがあります with つもりです and にいく in realistic conversations.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    // ── はじめて (for the first time) — pairs naturally with experiences ──
    build(
      "ja-m25-4-2-build-hajimete",
      "Pick the Japanese word for: For the first time",
      "はじめて",
      ["ときどき", "あまり", "よく", "はじめて"],
      ["はじめて"],
    ),
    listeningCompSentence({
      id: "ja-m25-4-2-lc-hajimete",
      audioText: "はじめて すしを たべました",
      correctMeaningEn: "I ate sushi for the first time.",
      distractorsEn: [
        "I have eaten sushi before.",
        "I sometimes eat sushi.",
        "I want to eat sushi.",
      ],
    }),
    build(
      "ja-m25-4-2-build-1",
      "Say: I have traveled abroad before.",
      "がいこくに りょこうした ことが あります",
      ["あります", "りょこうする", "に", "が", "つもり", "こと", "りょこうした", "がいこく"],
      ["がいこく", "に", "りょこうした", "こと", "が", "あります"],
    ),
    cloze(
      "ja-m25-4-2-cloze-1",
      "まつりに いった",
      "が あります。",
      "こと",
      ["こと", "つもり", "とき", "ため"],
      "I have been to a festival before.",
      "まつりに いった ことが あります。",
      "た-form + ことが = experience.",
    ),
    listeningCompSentence({
      id: "ja-m25-4-2-lc-1",
      audioText: "おんせんに はいった ことが ありません。こんど はいりに いきたいです",
      correctMeaningEn: "I've never been to a hot spring. I want to go try one.",
      distractorsEn: [
        "I've been to a hot spring and I want to go again.",
        "I don't like hot springs.",
        "I went to a hot spring yesterday.",
      ],
    }),
    sentenceMcq({
      id: "ja-m25-4-2-mcq-1",
      prompt: "Which sentence means 'Have you ever been to Japan?'?",
      correctKana: "にほんに いった ことが ありますか。",
      distractorsKana: [
        "にほんに いく ことが ありますか。",
        "にほんに いった つもりですか。",
        "にほんに いきましたか。",
      ],
      explanation: "た-form + ことがありますか = 'Have you ever…?'",
    }),
    cloze(
      "ja-m25-4-2-cloze-2",
      "こんど まつりを みに いく",
      "です。",
      "つもり",
      ["つもり", "こと", "とき", "ため"],
      "I plan to go watch the festival next time.",
      "こんど まつりを みに いく つもりです。",
      "つもり = intention/plan.",
    ),
    speaking(
      "ja-m25-4-2-speak-1",
      "はじめて おんせんに はいりました",
      "I went into a hot spring for the first time.",
    ),
    build(
      "ja-m25-4-2-build-2",
      "Say: I have never seen fireworks. I want to see them.",
      "はなびを みた ことが ありません",
      ["こと", "みる", "はなび", "ありません", "を", "が", "みた", "あります"],
      ["はなび", "を", "みた", "こと", "が", "ありません"],
    ),
    listeningBuildSentence({
      id: "ja-m25-4-2-lb-1",
      target: "おんせんに いった ことが ありますか",
      tiles: ["こと", "おんせん", "に", "いった", "が", "ありますか", "ありません", "いく"],
      correctOrder: ["おんせん", "に", "いった", "こと", "が", "ありますか"],
      promptEn: "Hear it, build it: 'Have you been to a hot spring before?'",
    }),
    build(
      "ja-m25-4-2-build-kekkon",
      "Ask: Have you ever been married?",
      "けっこんした ことが ありますか",
      ["こと", "けっこん", "した", "が", "ありますか", "ありません", "する"],
      ["けっこん", "した", "こと", "が", "ありますか"],
    ),
    sentenceMcq({
      id: "ja-m25-4-2-mcq-2",
      prompt: "Which sentence means 'I have tried natto before.'?",
      correctKana: "なっとうを たべた ことが あります。",
      distractorsKana: [
        "なっとうを たべる つもりです。",
        "なっとうを たべた ことが ありません。",
        "なっとうを たべに いきました。",
      ],
      explanation: "たべた + ことがあります = have eaten (experienced) before.",
    }),
    // ── ええ (yes — casual) — the natural reply to ことがありますか ──
    build(
      "ja-m25-4-2-build-ee",
      "Pick the casual Japanese word for: Yes (friendly agreement)",
      "ええ",
      ["いいえ", "あの", "ええ", "はい"],
      ["ええ"],
    ),
    listeningCompSentence({
      id: "ja-m25-4-2-lc-ee",
      audioText: "ええ、いった ことが あります",
      correctMeaningEn: "Yes, I've been there before.",
      distractorsEn: [
        "No, I've never been.",
        "Yes, I plan to go.",
        "Well, I don't know.",
      ],
    }),
    translateStep({
      id: "ja-m25-4-2-translate",
      promptEn: "Have you ever been to a festival?",
      acceptedAnswers: [
        "まつりに いった ことが ありますか",
        "まつりに いった ことが ありますか。",
      ],
      audioText: "まつりに いった ことが ありますか",
    }),
    selfExplain({
      id: "ja-m25-4-2-self-explain",
      anchorLabel: "ことがあります vs つもりです",
      anchorAudioText: "まつりに いった ことが あります",
      question: "What's the difference between ことがあります and つもりです?",
      rule: { text: "ことがあります = past experience (have done before). つもりです = future intention (plan to do). Different time directions." },
      surface: { text: "They mean the same thing — both talk about doing something." },
      distractor: { text: "ことがあります is casual and つもりです is formal — same meaning." },
      ruleExplanation:
        "ことがある looks backward (experience). つもり looks forward (intention). They naturally pair in conversation: 'I've been before — I plan to go again.'",
    }),
    speaking(
      "ja-m25-4-2-speak-2",
      "にほんに いった ことが ありますか",
      "Have you been to Japan before?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-4-2-rev-mcq-1", M25_4_2_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-4-2-rev-lc-1",
      audioText: "みずが ありますか",
      correctMeaningEn: "Is there any water?",
      distractorsEn: [
        "Is there any bread?",
        "Where is the water?",
        "The water is delicious.",
      ],
    }),
    reviewMatchPairs("ja-m25-4-2-rev", M25_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_4_2.steps);
assertAnswerRotation(M25_4_2.steps, 1);
assertNoConsecutiveSame(M25_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-5-1 — Grammar: 〜とき (when) + drill
// ═══════════════════════════════════════════════════════════════════════

const M25_5_1_REVIEW = pickReviewAtoms("ja-m25-5-1-rev", M25_REVIEW_POOL, 6);

export const M25_5_1: LessonContent = {
  id: "ja-m25-5-1",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "When — とき",
  description:
    "Express 'when' clauses with plain form / na-adj な / noun の + とき.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    RULE_TOKI,
    // ── Drills: とき ──
    cloze(
      "ja-m25-5-1-cloze-1",
      "にほんに いく",
      "、パスポートが いります。",
      "とき",
      ["とき", "つもり", "こと", "から"],
      "When going to Japan, you need a passport.",
      "にほんに いく とき、パスポートが いります。",
      "Dictionary form + とき = when (action hasn't happened yet).",
    ),
    sentenceMcq({
      id: "ja-m25-5-1-mcq-1",
      prompt: "Which sentence means 'When I'm free, I watch movies.'?",
      correctKana: "ひまな とき、えいがを みます。",
      distractorsKana: [
        "ひまの とき、えいがを みます。",
        "ひまな つもり、えいがを みます。",
        "ひまだ とき、えいがを みます。",
      ],
      explanation: "な-adjective (ひま) + な + とき. Not の or だ.",
    }),
    build(
      "ja-m25-5-1-build-1",
      "Say: When I went to school, I met a friend.",
      "がっこうに いった とき ともだちに あいました",
      ["ともだち", "いく", "がっこう", "とき", "いった", "に", "あう", "あいました", "に"],
      ["がっこう", "に", "いった", "とき", "ともだち", "に", "あいました"],
    ),
    listeningCompSentence({
      id: "ja-m25-5-1-lc-1",
      audioText: "こどもの とき にほんに すんでいました",
      correctMeaningEn: "When I was a child, I lived in Japan.",
      distractorsEn: [
        "When I was a child, I visited Japan.",
        "My child lives in Japan.",
        "I plan to live in Japan.",
      ],
    }),
    cloze(
      "ja-m25-5-1-cloze-2",
      "こどもの",
      "、よく あそびました。",
      "とき",
      ["とき", "こと", "つもり", "ため"],
      "When I was a child, I played a lot.",
      "こどもの とき、よく あそびました。",
      "Noun (こども) + の + とき.",
    ),
    speaking(
      "ja-m25-5-1-speak-1",
      "にほんに いく とき パスポートが いります",
      "When going to Japan, you need a passport.",
    ),
    build(
      "ja-m25-5-1-build-2",
      "Say: When I'm sad, I listen to music.",
      "かなしい とき おんがくを ききます",
      ["みます", "とき", "かなしくない", "ききます", "おんがく", "かなしい", "を"],
      ["かなしい", "とき", "おんがく", "を", "ききます"],
    ),
    cloze(
      "ja-m25-5-1-cloze-3",
      "りょこうする",
      "、カメラを もっていきます。",
      "とき",
      ["とき", "つもり", "こと", "から"],
      "When I travel, I take a camera.",
      "りょこうする とき、カメラを もっていきます。",
      "Dictionary form + とき = when doing.",
    ),
    listeningBuildSentence({
      id: "ja-m25-5-1-lb-1",
      target: "ひまな とき ざっしを よみます",
      tiles: ["ざっし", "ひまな", "とき", "を", "よみます", "ひまの", "ききます"],
      correctOrder: ["ひまな", "とき", "ざっし", "を", "よみます"],
      promptEn: "Hear it, build it: 'When I'm free, I read magazines.'",
    }),
    sentenceMcq({
      id: "ja-m25-5-1-mcq-2",
      prompt: "Which sentence means 'When I was a student, I studied a lot.'?",
      correctKana: "がくせいの とき、よく べんきょうしました。",
      distractorsKana: [
        "がくせいな とき、よく べんきょうしました。",
        "がくせいの つもり、よく べんきょうしました。",
        "がくせいの こと、よく べんきょうしました。",
      ],
      explanation: "Noun (がくせい) + の + とき.",
    }),
    translateStep({
      id: "ja-m25-5-1-translate",
      promptEn: "When I'm free, I read manga.",
      acceptedAnswers: [
        "ひまな とき まんがを よみます",
        "ひまな とき、まんがを よみます",
        "ひまな とき、まんがを よみます。",
        "ひまなとき まんがをよみます",
      ],
      audioText: "ひまな とき まんがを よみます",
    }),
    selfExplain({
      id: "ja-m25-5-1-self-explain",
      anchorLabel: "ひまな とき vs こどもの とき",
      anchorAudioText: "ひまな とき えいがを みます",
      question: "Why ひまな とき (with な) but こどもの とき (with の)?",
      rule: { text: "ひま (な-adj) takes な before とき. こども (noun) takes の before とき. Each word class has its own connector." },
      surface: { text: "な and の are interchangeable — either works with any word." },
      distractor: { text: "な is for people and の is for things." },
      ruleExplanation:
        "Before とき: な-adjectives use な (ひまな とき), nouns use の (こどもの とき), い-adjectives stay as-is (さむい とき), verbs use plain form (いく とき).",
    }),
    speaking(
      "ja-m25-5-1-speak-2",
      "こどもの とき よく テレビを みました",
      "When I was a child, I often watched TV.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-5-1-rev-mcq-1", M25_5_1_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-5-1-rev-lc-1",
      audioText: "アメリカに よんかい いきました",
      correctMeaningEn: "I went to America four times.",
      distractorsEn: [
        "I went to America twice.",
        "I live in America.",
        "I want to go to America.",
      ],
    }),
    speaking("ja-m25-5-1-rev-speak-1", M25_5_1_REVIEW[2].kana, M25_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-5-1-rev", M25_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_5_1.steps);
assertAnswerRotation(M25_5_1.steps, 1);
assertNoConsecutiveSame(M25_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-5-2 — とき in context + all-grammar interleave
// ═══════════════════════════════════════════════════════════════════════

const M25_5_2_REVIEW = pickReviewAtoms("ja-m25-5-2-rev", M25_REVIEW_POOL, 6);

export const M25_5_2: LessonContent = {
  id: "ja-m25-5-2",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "When + all grammar interleave",
  description:
    "Combine とき with つもり, にいく, and ことがある for complex plan-talk.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    // ── りゅうがくせい (exchange student) — pairs with のとき ──
    build(
      "ja-m25-5-2-build-ryuugakusei",
      "Pick the Japanese word for: Exchange student",
      "りゅうがくせい",
      ["がくせい", "りゅうがくせい", "ともだち", "せんせい"],
      ["りゅうがくせい"],
    ),
    listeningCompSentence({
      id: "ja-m25-5-2-lc-ryuugakusei",
      audioText: "りゅうがくせいの とき にほんに すんでいました",
      correctMeaningEn: "When I was an exchange student, I lived in Japan.",
      distractorsEn: [
        "When I was a child, I lived in Japan.",
        "I plan to study abroad in Japan.",
        "The exchange student went to Japan.",
      ],
    }),
    build(
      "ja-m25-5-2-build-1",
      "Say: When I traveled, I went to a hot spring.",
      "りょこうした とき おんせんに いきました",
      ["に", "とき", "いく", "りょこうする", "いきました", "りょこうした", "おんせん"],
      ["りょこうした", "とき", "おんせん", "に", "いきました"],
    ),
    cloze(
      "ja-m25-5-2-cloze-1",
      "にほんに いった",
      "、おんせんに はいりました。",
      "とき",
      ["とき", "つもり", "こと", "から"],
      "When I went to Japan, I went to a hot spring.",
      "にほんに いった とき、おんせんに はいりました。",
      "た-form + とき = when I did.",
    ),
    listeningCompSentence({
      id: "ja-m25-5-2-lc-1",
      audioText: "がいこくに いく とき パスポートを もっていきます",
      correctMeaningEn: "When going abroad, I take my passport.",
      distractorsEn: [
        "When I went abroad, I forgot my passport.",
        "I plan to go abroad with my passport.",
        "I have been abroad before.",
      ],
    }),
    sentenceMcq({
      id: "ja-m25-5-2-mcq-1",
      prompt: "Which sentence means 'When I was a student, I went to a festival.'?",
      correctKana: "がくせいの とき、まつりに いきました。",
      distractorsKana: [
        "がくせいな とき、まつりに いきました。",
        "がくせいの つもり、まつりに いきました。",
        "がくせいの こと、まつりに いきました。",
      ],
      explanation: "Noun (がくせい) + の + とき.",
    }),
    cloze(
      "ja-m25-5-2-cloze-2",
      "そつぎょうした",
      "、りょこうする つもりです。",
      "とき",
      ["とき", "こと", "つもり", "から"],
      "When I graduate, I plan to travel.",
      "そつぎょうした とき、りょこうする つもりです。",
      "とき clause + つもり for future plans triggered by events.",
    ),
    speaking(
      "ja-m25-5-2-speak-1",
      "りゅうがくせいの とき まつりに いきました",
      "When I was an exchange student, I went to festivals.",
    ),
    build(
      "ja-m25-5-2-build-2",
      "Say: When I go to Japan, I plan to eat sushi.",
      "にほんに いく とき すしを たべる つもりです",
      ["たべる", "にほん", "たべた", "です", "いく", "とき", "に", "を", "つもり", "すし"],
      ["にほん", "に", "いく", "とき", "すし", "を", "たべる", "つもり", "です"],
    ),
    cloze(
      "ja-m25-5-2-cloze-3",
      "おみやげを かいに いく",
      "です。",
      "つもり",
      ["つもり", "こと", "とき", "ため"],
      "I plan to go buy souvenirs.",
      "おみやげを かいに いく つもりです。",
      "にいく + つもり = plan to go do.",
    ),
    listeningBuildSentence({
      id: "ja-m25-5-2-lb-1",
      target: "にほんに いった とき まつりを みました",
      tiles: ["いく", "みました", "にほん", "まつり", "に", "とき", "いった", "を", "みる"],
      correctOrder: ["にほん", "に", "いった", "とき", "まつり", "を", "みました"],
      promptEn: "Hear it, build it: 'When I went to Japan, I saw a festival.'",
    }),
    sentenceMcq({
      id: "ja-m25-5-2-mcq-2",
      prompt: "Which means 'I have been to a hot spring when traveling.'?",
      correctKana: "りょこうした とき、おんせんに はいった ことが あります。",
      distractorsKana: [
        "りょこうする とき、おんせんに はいる つもりです。",
        "りょこうした こと、おんせんに はいりました。",
        "りょこうした とき、おんせんに はいります。",
      ],
      explanation: "とき + ことがある = experienced something when…",
    }),
    translateStep({
      id: "ja-m25-5-2-translate",
      promptEn: "When I go to Japan, I plan to go to a festival.",
      acceptedAnswers: [
        "にほんに いく とき まつりに いく つもりです",
        "にほんに いく とき、まつりに いく つもりです",
        "にほんに いく とき、まつりに いく つもりです。",
      ],
      audioText: "にほんに いく とき まつりに いく つもりです",
    }),
    selfExplain({
      id: "ja-m25-5-2-self-explain",
      anchorLabel: "いく とき vs いった とき",
      anchorAudioText: "にほんに いく とき",
      question: "What's the difference between いく とき and いった とき?",
      rule: { text: "いく とき = when going (before you go). いった とき = when you went (after arriving). The tense before とき matters." },
      surface: { text: "They mean the same thing — both mean 'when going to Japan.'" },
      distractor: { text: "いく とき is casual, いった とき is formal." },
      ruleExplanation:
        "Dictionary form + とき = the action hasn't happened yet. た-form + とき = the action is complete. This changes the timing of the 'when.'",
    }),
    speaking(
      "ja-m25-5-2-speak-2",
      "にほんに いく とき すしを たべる つもりです",
      "When I go to Japan, I plan to eat sushi.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-5-2-rev-mcq-1", M25_5_2_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-5-2-rev-lc-1",
      audioText: "あした ぎんこうに いきます",
      correctMeaningEn: "I'm going to the bank tomorrow.",
      distractorsEn: [
        "I'm going to the station tomorrow.",
        "I went to the bank yesterday.",
        "The bank is closed tomorrow.",
      ],
    }),
    speaking("ja-m25-5-2-rev-speak-1", M25_5_2_REVIEW[2].kana, M25_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-5-2-rev", M25_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_5_2.steps);
assertAnswerRotation(M25_5_2.steps, 1);
assertNoConsecutiveSame(M25_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-6-1 — Interleaved drill (all four grammar points)
// ═══════════════════════════════════════════════════════════════════════

const M25_6_1_REVIEW = pickReviewAtoms("ja-m25-6-1-rev", M25_REVIEW_POOL, 6);

export const M25_6_1: LessonContent = {
  id: "ja-m25-6-1",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill — all patterns",
  description:
    "Interleave つもり, にいく, ことがある, and とき in rapid-fire drills.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    cloze(
      "ja-m25-6-1-cloze-1",
      "あした としょかんで べんきょうする",
      "です。",
      "つもり",
      ["つもり", "こと", "とき", "ため"],
      "I plan to study at the library tomorrow.",
      "あした としょかんで べんきょうする つもりです。",
      "Dictionary form + つもり = intention.",
    ),
    sentenceMcq({
      id: "ja-m25-6-1-mcq-1",
      prompt: "Which means 'I went to eat sushi.'?",
      correctKana: "すしを たべに いきました。",
      distractorsKana: [
        "すしを たべた ことが あります。",
        "すしを たべる つもりです。",
        "すしを たべる とき いきました。",
      ],
      explanation: "たべ (stem) + にいく = go to eat. Past tense = いきました.",
    }),
    cloze(
      "ja-m25-6-1-cloze-2",
      "おんせんに はいった",
      "が あります。",
      "こと",
      ["こと", "つもり", "とき", "ため"],
      "I have been to a hot spring before.",
      "おんせんに はいった ことが あります。",
      "た-form + ことが = experience.",
    ),
    build(
      "ja-m25-6-1-build-1",
      "Say: When I'm free, I go to the park.",
      "ひまな とき こうえんに いきます",
      ["ひまの", "とき", "いきました", "ひまな", "こうえん", "に", "いきます"],
      ["ひまな", "とき", "こうえん", "に", "いきます"],
    ),
    cloze(
      "ja-m25-6-1-cloze-3",
      "がいこくに いった",
      "、おみやげを かいました。",
      "とき",
      ["とき", "つもり", "こと", "から"],
      "When I went abroad, I bought souvenirs.",
      "がいこくに いった とき、おみやげを かいました。",
      "た-form + とき = when I did.",
    ),
    listeningCompSentence({
      id: "ja-m25-6-1-lc-1",
      audioText: "うみに およぎに いく つもりです",
      correctMeaningEn: "I plan to go swimming at the sea.",
      distractorsEn: [
        "I went swimming at the sea.",
        "I have swum at the sea before.",
        "I plan to go to a hot spring.",
      ],
    }),
    speaking(
      "ja-m25-6-1-speak-1",
      "がいこくに にかい いった ことが あります",
      "I have been abroad twice.",
    ),
    cloze(
      "ja-m25-6-1-cloze-4",
      "えいがを み",
      "いきましょう。",
      "に",
      ["に", "を", "で", "と"],
      "Let's go watch a movie.",
      "えいがを みに いきましょう。",
      "に marks purpose — going to watch.",
    ),
    build(
      "ja-m25-6-1-build-2",
      "Say: I plan to study when I go home.",
      "うちに かえった とき べんきょうする つもりです",
      ["です", "うち", "つもり", "べんきょう", "とき", "かえる", "する", "かえった", "に"],
      ["うち", "に", "かえった", "とき", "べんきょう", "する", "つもり", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m25-6-1-lb-1",
      target: "まつりに いった ことが あります",
      tiles: ["に", "いった", "ありません", "まつり", "あります", "こと", "が", "いく"],
      correctOrder: ["まつり", "に", "いった", "こと", "が", "あります"],
      promptEn: "Hear it, build it: 'I have been to a festival before.'",
    }),
    build(
      "ja-m25-6-1-build-3",
      "Ask: Have you ever seen Japanese fireworks?",
      "にほんの はなびを みた ことが ありますか",
      ["はなび", "にほん", "の", "を", "みた", "こと", "が", "ありますか", "ありません"],
      ["にほん", "の", "はなび", "を", "みた", "こと", "が", "ありますか"],
    ),
    translateStep({
      id: "ja-m25-6-1-translate",
      promptEn: "When I go abroad, I plan to go to a hot spring.",
      acceptedAnswers: [
        "がいこくに いく とき おんせんに いく つもりです",
        "がいこくに いく とき、おんせんに いく つもりです",
        "がいこくに いく とき、おんせんに いく つもりです。",
      ],
      audioText: "がいこくに いく とき おんせんに いく つもりです",
    }),
    selfExplain({
      id: "ja-m25-6-1-self-explain",
      anchorLabel: "Four patterns: つもり / にいく / ことがある / とき",
      anchorAudioText: "あした としょかんで べんきょうする つもりです",
      question: "Which pattern talks about PAST experience, not future plans?",
      rule: { text: "ことがあります — it uses the た-form and means 'have done before.' The others (つもり, にいく, とき) can be about the future." },
      surface: { text: "つもりです — it means 'I intended to' (past)." },
      distractor: { text: "とき — it always refers to past time." },
      ruleExplanation:
        "ことがある is uniquely about past experience. つもり = intention (future). にいく = purpose (future or past). とき = when (either).",
    }),
    speaking(
      "ja-m25-6-1-speak-2",
      "ひまな とき ともだちに あいに いきます",
      "When I'm free, I go to meet friends.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-6-1-rev-mcq-1", M25_6_1_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-6-1-rev-lc-1",
      audioText: "あなたの かさは どれですか",
      correctMeaningEn: "Which one is your umbrella?",
      distractorsEn: [
        "Where is your umbrella?",
        "Whose umbrella is this?",
        "Is this your umbrella?",
      ],
    }),
    speaking("ja-m25-6-1-rev-speak-1", M25_6_1_REVIEW[2].kana, M25_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-6-1-rev", M25_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_6_1.steps);
assertAnswerRotation(M25_6_1.steps, 1);
assertNoConsecutiveSame(M25_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-6-2 — Production drill (build + speak + translate heavy)
// ═══════════════════════════════════════════════════════════════════════

const M25_6_2_REVIEW = pickReviewAtoms("ja-m25-6-2-rev", M25_REVIEW_POOL, 6);

export const M25_6_2: LessonContent = {
  id: "ja-m25-6-2",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — plans & experiences",
  description:
    "Heavy production practice — build, speak, and translate with all M25 grammar.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m25-6-2-build-1",
      "Say: I plan to go to a foreign country next year.",
      "らいねん がいこくに いく つもりです",
      ["いく", "がいこく", "こと", "です", "に", "つもり", "いった", "らいねん"],
      ["らいねん", "がいこく", "に", "いく", "つもり", "です"],
    ),
    speaking(
      "ja-m25-6-2-speak-1",
      "ともだちと いっしょに がいこくに いく つもりです",
      "I plan to go abroad together with a friend.",
    ),
    listeningCompSentence({
      id: "ja-m25-6-2-lc-1",
      audioText: "まつりで はなびを みた ことが あります",
      correctMeaningEn: "I have seen fireworks at a festival before.",
      distractorsEn: [
        "I plan to see fireworks at a festival.",
        "When I went to a festival, I saw fireworks.",
        "I want to go see fireworks.",
      ],
    }),
    build(
      "ja-m25-6-2-build-2",
      "Say: When I went to Japan, I ate sushi.",
      "にほんに いった とき すしを たべました",
      ["すし", "いく", "いった", "たべました", "に", "にほん", "とき", "を", "たべる"],
      ["にほん", "に", "いった", "とき", "すし", "を", "たべました"],
    ),
    sentenceMcq({
      id: "ja-m25-6-2-mcq-1",
      prompt: "Which means 'I went to buy a souvenir.'?",
      correctKana: "おみやげを かいに いきました。",
      distractorsKana: [
        "おみやげを かった ことが あります。",
        "おみやげを かう つもりです。",
        "おみやげを かう とき いきました。",
      ],
      explanation: "かい (buy stem) + にいきました = went to buy.",
    }),
    speaking(
      "ja-m25-6-2-speak-2",
      "にほんに いった とき ともだちに あいました",
      "When I went to Japan, I met a friend.",
    ),
    build(
      "ja-m25-6-2-build-3",
      "Say: Let's go watch the festival.",
      "まつりを みに いきましょう",
      ["に", "いきましょう", "を", "いきます", "まつり", "みる", "み"],
      ["まつり", "を", "み", "に", "いきましょう"],
    ),
    listeningBuildSentence({
      id: "ja-m25-6-2-lb-1",
      target: "なつやすみに りょこうする つもりです",
      tiles: ["りょこう", "なつやすみ", "に", "する", "つもり", "です", "した", "こと"],
      correctOrder: ["なつやすみ", "に", "りょこう", "する", "つもり", "です"],
      promptEn: "Hear it, build it: 'I plan to travel during summer break.'",
    }),
    cloze(
      "ja-m25-6-2-cloze-1",
      "りょこうした",
      "、いろいろな ところに いきました。",
      "とき",
      ["とき", "つもり", "こと", "から"],
      "When I traveled, I went to various places.",
      "りょこうした とき、いろいろな ところに いきました。",
      "た-form + とき = when (completed action).",
    ),
    speaking(
      "ja-m25-6-2-speak-3",
      "いっしょに まつりに いきましょう",
      "Let's go to the festival together.",
    ),
    build(
      "ja-m25-6-2-build-4",
      "Say: I have never been abroad.",
      "がいこくに いった ことが ありません",
      ["あります", "こと", "いった", "に", "ありません", "が", "いく", "がいこく"],
      ["がいこく", "に", "いった", "こと", "が", "ありません"],
    ),
    cloze(
      "ja-m25-6-2-cloze-2",
      "おんせんに はいり",
      "いきたいです。",
      "に",
      ["に", "を", "で", "と"],
      "I want to go bathe in a hot spring.",
      "おんせんに はいりに いきたいです。",
      "に marks purpose.",
    ),
    selfExplain({
      id: "ja-m25-6-2-self-explain",
      anchorLabel: "All four patterns in production",
      anchorAudioText: "まつりで はなびを みた ことが あります",
      question: "If you want to say 'I plan to go eat,' which pattern(s) do you combine?",
      rule: { text: "にいく (purpose: go to eat) + つもり (intention: I plan to). Combined: たべに いく つもりです." },
      surface: { text: "Just つもり is enough — たべる つもりです means the same thing." },
      distractor: { text: "ことがある + つもり — to show you've eaten before and plan to again." },
      ruleExplanation:
        "にいく adds the 'going to do' layer. つもり adds the 'I intend to' layer. Together they stack: たべに いく つもりです = 'I plan to go eat.'",
    }),
    speaking(
      "ja-m25-6-2-speak-4",
      "おんせんに はいった ことが ありません",
      "I have never been in a hot spring.",
    ),
    translateStep({
      id: "ja-m25-6-2-translate",
      promptEn: "I have been to Japan twice.",
      acceptedAnswers: [
        "にほんに にかい いった ことが あります",
        "にほんに にかい いった ことが あります。",
        "にほんに にかい いったことがあります",
      ],
      audioText: "にほんに にかい いった ことが あります",
    }),
    // ── Review tail ──
    vocabMcq("ja-m25-6-2-rev-mcq-1", M25_6_2_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-6-2-rev-lc-1",
      audioText: "いま じゅうじです",
      correctMeaningEn: "It's 10 o'clock now.",
      distractorsEn: [
        "It's 1 o'clock now.",
        "It's 10:30 now.",
        "We meet at 10 o'clock.",
      ],
    }),
    speaking("ja-m25-6-2-rev-speak-1", M25_6_2_REVIEW[2].kana, M25_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-6-2-rev", M25_6_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M25_6_2.steps);
assertAnswerRotation(M25_6_2.steps, 1);
assertNoConsecutiveSame(M25_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-STORY — Planning a trip to Japan
// ═══════════════════════════════════════════════════════════════════════

export const M25_STORY: LessonContent = {
  id: "ja-m25-story",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Yuki's trips to Japan",
  description:
    "Listen to ゆき talk about her trips to Japan and her plans for next year. Answer comprehension questions and build your replies.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m25-story-scene-1",
      narrative: [
        { kana: "わたしは にほんに にかい いった ことが あります。" },
        { kana: "はじめて いった とき、おんせんに はいりました。" },
        { kana: "にほんで まつりを みた ことも あります。" },
        { kana: "らいねんも にほんに いく つもりです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "How many times has Yuki been to Japan?",
          correctText: "Twice.",
          distractors: ["Once.", "Three times.", "Never."],
          explanation: "にかい いった ことが あります = has been twice.",
        },
        {
          id: "s1-q2",
          prompt: "What did Yuki do on her first trip?",
          correctText: "She went into a hot spring.",
          distractors: [
            "She watched fireworks.",
            "She bought souvenirs.",
            "She went to a wedding.",
          ],
          explanation:
            "はじめて いった とき、おんせんに はいりました = on her first trip, she bathed in a hot spring.",
        },
      ],
      responseBuild: {
        target: "わたしは にほんに いった ことが ありません",
        tiles: ["いった", "にほん", "わたし", "は", "に", "こと", "が", "ありません", "あります"],
        correctOrder: ["わたし", "は", "にほん", "に", "いった", "こと", "が", "ありません"],
        promptEn: "Reply to ゆき: 'I have never been to Japan.'",
      },
    }),
    sentenceMcq({
      id: "ja-m25-story-mcq-1",
      prompt: "Which line from the story means 'I plan to go to Japan next year too'?",
      correctKana: "らいねんも にほんに いく つもりです。",
      distractorsKana: [
        "きょねん にほんに いきました。",
        "ことし にほんに いく よていです。",
        "らいねん にほんに いく ことが あります。",
      ],
      explanation: "らいねんも = next year too. Dictionary form + つもりです = plan to.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m25-story-scene-2",
      narrative: [
        { kana: "らいねんの なつは ともだちと いく よていです。" },
        { kana: "ともだちは にほんに いった ことが ありません。" },
        { kana: "いっしょに はなびを みに いく つもりです。" },
        { kana: "まつりで おみやげを かいたいです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "Who is Yuki going to Japan with next year?",
          correctText: "A friend.",
          distractors: ["Her teacher.", "An exchange student.", "She's going alone."],
          explanation: "ともだちと いく よていです = the plan is to go with a friend.",
        },
        {
          id: "s2-q2",
          prompt: "What do they plan to go see together?",
          correctText: "Fireworks.",
          distractors: ["A hot spring.", "A graduation ceremony.", "A wedding."],
          explanation: "はなびを みに いく = go (in order) to watch fireworks.",
        },
      ],
      responseBuild: {
        target: "わたしも はなびを みたいです",
        tiles: ["はなび", "みたいです", "わたし", "も", "を", "みた"],
        correctOrder: ["わたし", "も", "はなび", "を", "みたいです"],
        promptEn: "Reply to ゆき: 'I want to see fireworks too.'",
      },
    }),
    listeningCompSentence({
      id: "ja-m25-story-lc-1",
      audioText: "ともだちは にほんに いった ことが ありません",
      correctMeaningEn: "My friend has never been to Japan.",
      distractorsEn: [
        "My friend has been to Japan twice.",
        "My friend plans to go to Japan.",
        "I have never been to Japan.",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m25-story-lb-1",
      target: "いっしょに はなびを みに いく つもりです",
      tiles: ["はなび", "み", "いっしょに", "を", "に", "いく", "です", "つもり", "みた"],
      correctOrder: ["いっしょに", "はなび", "を", "み", "に", "いく", "つもり", "です"],
      promptEn: "Hear it, build it: 'We plan to go watch fireworks together.'",
    }),
    speaking(
      "ja-m25-story-speak-1",
      "わたしは にほんに にかい いった ことが あります",
      "I have been to Japan twice.",
    ),
    sentenceMcq({
      id: "ja-m25-story-mcq-summary",
      prompt: "What is Yuki's plan for next summer?",
      correctKana: "Go to Japan with a friend and watch fireworks.",
      distractorsKana: [
        "Go to a hot spring alone.",
        "Move to Japan as an exchange student.",
        "Watch fireworks in her own country.",
      ],
      explanation: "She's going with a friend and they plan to watch fireworks together.",
    }),
    speaking(
      "ja-m25-story-speak-2",
      "いっしょに はなびを みに いきましょう",
      "Let's go watch fireworks together.",
    ),
  ],
};

assertNoConsecutiveSame(M25_STORY.steps);
assertPassiveCardsHaveFollowup(M25_STORY.steps);
assertNoExplanationOnPassive(M25_STORY.steps);
assertExplanationDoesntLeakAnswer(M25_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-7-1 — Mixed drill (all patterns, comprehension focus)
// ═══════════════════════════════════════════════════════════════════════

const M25_7_1_REVIEW = pickReviewAtoms("ja-m25-7-1-rev", M25_REVIEW_POOL, 6);

export const M25_7_1: LessonContent = {
  id: "ja-m25-7-1",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Comprehension drill — all patterns",
  description:
    "Listening + reading comprehension with all M25 grammar and vocab.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    listeningCompSentence({
      id: "ja-m25-7-1-lc-1",
      audioText: "らいねん にほんに いく つもりです",
      correctMeaningEn: "I plan to go to Japan next year.",
      distractorsEn: [
        "I went to Japan last year.",
        "I have been to Japan before.",
        "When I go to Japan, I'll study.",
      ],
    }),
    sentenceMcq({
      id: "ja-m25-7-1-mcq-1",
      prompt: "Which means 'I went to meet a friend.'?",
      correctKana: "ともだちに あいに いきました。",
      distractorsKana: [
        "ともだちと いきました。",
        "ともだちに あう つもりです。",
        "ともだちに あった ことが あります。",
      ],
      explanation: "あい (stem of あう) + にいきました = went to meet.",
    }),
    cloze(
      "ja-m25-7-1-cloze-1",
      "けっこんした",
      "が ありますか。",
      "こと",
      ["こと", "つもり", "とき", "ため"],
      "Have you ever been married?",
      "けっこんした ことが ありますか。",
      "た-form + こと = experience.",
    ),
    build(
      "ja-m25-7-1-build-1",
      "Say: When traveling, I take photos.",
      "りょこうする とき しゃしんを とります",
      ["を", "した", "とき", "りょこう", "とりました", "とります", "する", "しゃしん"],
      ["りょこう", "する", "とき", "しゃしん", "を", "とります"],
    ),
    listeningCompSentence({
      id: "ja-m25-7-1-lc-2",
      audioText: "そつぎょうしてから がいこくに いく つもりです",
      correctMeaningEn: "After I graduate, I plan to go abroad.",
      distractorsEn: [
        "I graduated and went abroad.",
        "I have graduated before.",
        "When I graduated, I went abroad.",
      ],
    }),
    cloze(
      "ja-m25-7-1-cloze-2",
      "はなびを み",
      "いきましょう。",
      "に",
      ["に", "を", "で", "と"],
      "Let's go watch fireworks.",
      "はなびを みに いきましょう。",
      "に marks purpose.",
    ),
    speaking(
      "ja-m25-7-1-speak-1",
      "りょこうする とき おみやげを かいます",
      "When traveling, I buy souvenirs.",
    ),
    sentenceMcq({
      id: "ja-m25-7-1-mcq-2",
      prompt: "Which means 'When I was a child, I went to a festival.'?",
      correctKana: "こどもの とき、まつりに いきました。",
      distractorsKana: [
        "こどもな とき、まつりに いきました。",
        "こどもの こと、まつりに いきました。",
        "こどもの つもり、まつりに いきました。",
      ],
      explanation: "Noun + の + とき = when (as a child).",
    }),
    build(
      "ja-m25-7-1-build-2",
      "Say: I have eaten ramen in Japan before.",
      "にほんで ラーメンを たべた ことが あります",
      ["ラーメン", "こと", "あります", "を", "たべた", "が", "で", "ありません", "にほん"],
      ["にほん", "で", "ラーメン", "を", "たべた", "こと", "が", "あります"],
    ),
    cloze(
      "ja-m25-7-1-cloze-3",
      "あした りょこうする",
      "です。",
      "つもり",
      ["つもり", "こと", "とき", "から"],
      "I plan to travel tomorrow.",
      "あした りょこうする つもりです。",
      "Dictionary form + つもり = intention.",
    ),
    listeningBuildSentence({
      id: "ja-m25-7-1-lb-1",
      target: "おんせんに はいりに いきたいです",
      tiles: ["はいり", "に", "いきたい", "です", "おんせん", "いく", "に", "はいる"],
      correctOrder: ["おんせん", "に", "はいり", "に", "いきたい", "です"],
      promptEn: "Hear it, build it: 'I want to go bathe in a hot spring.'",
    }),
    selfExplain({
      id: "ja-m25-7-1-self-explain",
      anchorLabel: "にほんに いく とき vs にほんに いった とき",
      anchorAudioText: "にほんに いく とき",
      question: "If someone says にほんに いく とき, have they left yet?",
      rule: { text: "No — dictionary form (いく) + とき means the action hasn't happened yet. They haven't gone to Japan yet." },
      surface: { text: "Yes — いく とき means they're currently going." },
      distractor: { text: "It's ambiguous — both interpretations are equally valid." },
      ruleExplanation:
        "Dictionary form + とき = before the action. た-form + とき = after. いく とき = before going. いった とき = after arriving.",
    }),
    speaking(
      "ja-m25-7-1-speak-2",
      "りゅうがくせいの とき はじめて おんせんに はいりました",
      "When I was an exchange student, I went into a hot spring for the first time.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m25-7-1-rev-mcq-1", M25_7_1_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-7-1-rev-lc-1",
      audioText: "この いすは おおきいです",
      correctMeaningEn: "This chair is big.",
      distractorsEn: [
        "This desk is big.",
        "This chair is small.",
        "That chair is over there.",
      ],
    }),
    speaking("ja-m25-7-1-rev-speak-1", M25_7_1_REVIEW[2].kana, M25_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-7-1-rev", M25_7_1_REVIEW),
    // Coverage backfill — full-spine atom re-exposure gate (retrospective §4 Gate 4).
    speaking("ja-m25-7-1-cov-au", "あう", "to meet"),
    speaking("ja-m25-7-1-cov-ee", "ええ、そうです", "Yes, that's right."),
  ],
};

assertNoSameAnswerCluster(M25_7_1.steps);
assertAnswerRotation(M25_7_1.steps, 1);
assertNoConsecutiveSame(M25_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M25-7-2 — Production (translate + build + speaking heavy)
// ═══════════════════════════════════════════════════════════════════════

const M25_7_2_REVIEW = pickReviewAtoms("ja-m25-7-2-rev", M25_REVIEW_POOL, 6);

export const M25_7_2: LessonContent = {
  id: "ja-m25-7-2",
  moduleId: "m25",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — full M25",
  description:
    "Heavy production practice — translate, build, and speak with all M25 grammar.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m25-7-2-build-1",
      "Say: I plan to go see a festival.",
      "まつりを みに いく つもりです",
      ["を", "つもり", "こと", "みる", "み", "に", "まつり", "です", "いく"],
      ["まつり", "を", "み", "に", "いく", "つもり", "です"],
    ),
    speaking(
      "ja-m25-7-2-speak-1",
      "らいげつ おんせんに いく つもりです",
      "I plan to go to a hot spring next month.",
    ),
    listeningCompSentence({
      id: "ja-m25-7-2-lc-1",
      audioText: "がいこくに りょこうした ことが あります",
      correctMeaningEn: "I have traveled abroad before.",
      distractorsEn: [
        "I plan to travel abroad.",
        "I went abroad yesterday.",
        "When I traveled, I went abroad.",
      ],
    }),
    build(
      "ja-m25-7-2-build-2",
      "Say: When I go abroad, I plan to go to a hot spring.",
      "がいこくに いく とき おんせんに いく つもりです",
      ["いった", "つもり", "とき", "に", "おんせん", "いく", "です", "に", "いく", "がいこく"],
      ["がいこく", "に", "いく", "とき", "おんせん", "に", "いく", "つもり", "です"],
    ),
    sentenceMcq({
      id: "ja-m25-7-2-mcq-1",
      prompt: "Which means 'I have never seen fireworks.'?",
      correctKana: "はなびを みた ことが ありません。",
      distractorsKana: [
        "はなびを みる つもりです。",
        "はなびを みた ことが あります。",
        "はなびを みに いきました。",
      ],
      explanation: "みた + ことがありません = have never seen.",
    }),
    speaking(
      "ja-m25-7-2-speak-2",
      "こどもの とき はなびを みました",
      "When I was a child, I saw fireworks.",
    ),
    build(
      "ja-m25-7-2-build-3",
      "Say: Let's go eat lunch.",
      "ひるごはんを たべに いきましょう",
      ["たべ", "いきます", "たべる", "を", "に", "いきましょう", "ひるごはん"],
      ["ひるごはん", "を", "たべ", "に", "いきましょう"],
    ),
    listeningBuildSentence({
      id: "ja-m25-7-2-lb-1",
      target: "こどもの とき おんせんに いきました",
      tiles: ["の", "いきました", "に", "いく", "とき", "こどもな", "こども", "おんせん"],
      correctOrder: ["こども", "の", "とき", "おんせん", "に", "いきました"],
      promptEn: "Hear it, build it: 'When I was a child, I went to a hot spring.'",
    }),
    cloze(
      "ja-m25-7-2-cloze-1",
      "けっこんする",
      "です。",
      "つもり",
      ["つもり", "こと", "とき", "ため"],
      "I intend to get married.",
      "けっこんする つもりです。",
      "Dictionary form + つもり = intention.",
    ),
    speaking(
      "ja-m25-7-2-speak-3",
      "ばんごはんを たべに いきましょう",
      "Let's go eat dinner.",
    ),
    build(
      "ja-m25-7-2-build-4",
      "Say: I have been to a graduation ceremony before.",
      "そつぎょうしきに いった ことが あります",
      ["に", "ありません", "そつぎょうしき", "が", "いく", "こと", "いった", "あります"],
      ["そつぎょうしき", "に", "いった", "こと", "が", "あります"],
    ),
    listeningCompSentence({
      id: "ja-m25-7-2-lc-2",
      audioText: "りょこうする とき カメラを もっていきます",
      correctMeaningEn: "When I travel, I bring a camera.",
      distractorsEn: [
        "I plan to travel with a camera.",
        "I have traveled with a camera before.",
        "I went to buy a camera.",
      ],
    }),
    cloze(
      "ja-m25-7-2-cloze-2",
      "おんせんに はいった こと",
      " あります。",
      "が",
      ["が", "は", "を", "に"],
      "I have been to a hot spring before.",
      "おんせんに はいった ことが あります。",
      "が marks こと as subject.",
    ),
    selfExplain({
      id: "ja-m25-7-2-self-explain",
      anchorLabel: "All four M25 patterns mastered",
      anchorAudioText: "けっこんする つもりです",
      question: "You want to say 'When I traveled, I went to see a festival.' Which patterns do you use?",
      rule: { text: "とき (when) + にいく (go to see). りょこうした とき、まつりを みに いきました." },
      surface: { text: "つもり (plan) + ことがある (experience). りょこうする つもりで、まつりの ことが あります." },
      distractor: { text: "Just とき is enough. りょこうした とき、まつりを みました." },
      ruleExplanation:
        "とき = when. にいく = purpose of going. Combined: りょこうした とき、まつりを みに いきました = 'When I traveled, I went to see a festival.'",
    }),
    speaking(
      "ja-m25-7-2-speak-4",
      "けっこんしきに いった ことが あります",
      "I have been to a wedding before.",
    ),
    translateStep({
      id: "ja-m25-7-2-translate",
      promptEn: "I plan to go watch a movie.",
      acceptedAnswers: [
        "えいがを みに いく つもりです",
        "えいがを みに いく つもりです。",
      ],
      audioText: "えいがを みに いく つもりです",
    }),
    // ── Review tail ──
    vocabMcq("ja-m25-7-2-rev-mcq-1", M25_7_2_REVIEW[0], M25_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m25-7-2-rev-lc-1",
      audioText: "みせに ふたり います",
      correctMeaningEn: "There are two people in the shop.",
      distractorsEn: [
        "There are two people in the park.",
        "There is one person in the shop.",
        "There are two chairs in the shop.",
      ],
    }),
    speaking("ja-m25-7-2-rev-speak-1", M25_7_2_REVIEW[2].kana, M25_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m25-7-2-rev", M25_7_2_REVIEW),
    // Coverage backfill — full-spine atom re-exposure gate (retrospective §4 Gate 4).
    speaking("ja-m25-7-2-cov-au", "あう", "to meet"),
  ],
};

assertNoSameAnswerCluster(M25_7_2.steps);
assertAnswerRotation(M25_7_2.steps, 1);
assertNoConsecutiveSame(M25_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M25_1_1.steps,
  ...M25_1_2.steps,
  ...M25_2_1.steps,
  ...M25_2_2.steps,
  ...M25_3_1.steps,
  ...M25_3_2.steps,
  ...M25_4_1.steps,
  ...M25_4_2.steps,
  ...M25_5_1.steps,
  ...M25_5_2.steps,
  ...M25_6_1.steps,
  ...M25_6_2.steps,
  ...M25_7_1.steps,
  ...M25_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M25_1_1, M25_1_2, M25_2_1, M25_2_2, M25_3_1, M25_3_2,
  M25_4_1, M25_4_2, M25_5_1, M25_5_2, M25_6_1, M25_6_2,
  M25_STORY, M25_7_1, M25_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
