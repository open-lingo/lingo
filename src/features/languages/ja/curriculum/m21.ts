/**
 * M21 — Food & Restaurants (expanded).
 *
 * M21 introduces:
 *   - と (quotation): 「いただきます」といいます ("they say 'itadakimasu'")
 *   - や (incomplete list): パンやたまごをかいます (bread AND eggs, among other things)
 *   - Counter 〜はい/ぱい/ばい (cups/glasses) — irregular: いっぱい, さんばい, etc.
 *
 * Vocab (~23 new atoms):
 *   Food:      たまご, にく, とりにく, さかな, やさい, くだもの, パン, ごはん, おべんとう,
 *              りんご, みかん, バナナ
 *   Drinks:    ぎゅうにゅう, ジュース, おさけ
 *   Utensils:  おさら, ちゃわん, はし, スプーン, フォーク, ナイフ, コップ, カップ
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * ID scheme: ja-m21-{n}-{sub} e.g. ja-m21-1-1, ja-m21-1-2
 * Export names: M21_1_1, M21_1_2, M21_2_1, M21_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m21-1, etc.
 *
 * 2026-06-12 sentence-variety reauthor: review-particle cloze thinned to
 * ≤25% (excess を clozes converted to production builds), no sentence
 * repeated >3x module-wide, build tile banks scrambled, story converted to
 * the storyComprehension() factory (§13.13 locked template). Backlog
 * dining-politeness words woven in: どうぞ (M21-4-1), どうも (M21-4-2),
 * いかが + けっこう (M21-6-2), ほか (M21-7-1), ちょうど (M21-7-2);
 * たくさん (taught M20) reused in carriers.
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
const M21_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_YA = grammarRule({
  id: "ja-m21-rule-ya",
  grammarPointId: "ya-incomplete-list",
  title: "や — incomplete list ('A and B, among other things')",
  rule:
    "や connects nouns to make an OPEN list: A や B = 'A and B (and other things).' Unlike と (exhaustive: A and B only), や implies there are more items not mentioned.",
  examples: [
    {
      ja: "パンや たまごを かいます。",
      romaji: "pan ya tamago o kaimasu.",
      en: "I'll buy bread and eggs (among other things).",
    },
    {
      ja: "りんごや バナナが あります。",
      romaji: "ringo ya banana ga arimasu.",
      en: "There are apples and bananas (and other fruit).",
    },
    {
      ja: "にくや さかなを たべます。",
      romaji: "niku ya sakana o tabemasu.",
      en: "I eat meat and fish (among other things).",
    },
  ],
  antiPattern: {
    ja: "パンと たまごを かいます。",
    romaji: "pan to tamago o kaimasu.",
    en: "I'll buy bread and eggs (only those two).",
    why: "と is exhaustive — it means 'A and B and nothing else.' If you're buying more than just bread and eggs, use や.",
  },
  cultureNote:
    "Japanese speakers often use や in grocery/restaurant contexts because the full list is rarely stated. と sounds oddly precise in casual food talk.",
});

const RULE_TO_QUOTATION = grammarRule({
  id: "ja-m21-rule-to-quotation",
  grammarPointId: "to-quotation",
  title: "と (quotation) — 'they say...' / 'it is called...'",
  rule:
    "と after a quoted phrase marks what someone says or what something is called. 「X」と いいます = 'They say X' / 'X is said.' The quoted phrase goes before と; the verb of saying follows.",
  examples: [
    {
      ja: "「いただきます」と いいます。",
      romaji: "'itadakimasu' to iimasu.",
      en: "They say 'itadakimasu.'",
    },
    {
      ja: "にほんごで 「ありがとう」と いいます。",
      romaji: "nihongo de 'arigatou' to iimasu.",
      en: "In Japanese, they say 'arigatou.'",
    },
    {
      ja: "これは にほんごで なんと いいますか。",
      romaji: "kore wa nihongo de nan to iimasu ka.",
      en: "What do you call this in Japanese?",
    },
  ],
  antiPattern: {
    ja: "「いただきます」は いいます。",
    romaji: "'itadakimasu' wa iimasu.",
    en: "(broken — は marks a topic, not a quote; use と after the quoted phrase)",
    why: "Direct/indirect quotes attach with と, not は. は marks the topic; と marks what is said.",
  },
  cultureNote:
    "「いただきます」 is said before eating — it literally means 'I humbly receive.' 「ごちそうさまでした」 is said after eating ('It was a feast').",
});

const RULE_HAI_COUNTER = grammarRule({
  id: "ja-m21-rule-hai-counter",
  grammarPointId: "counter-hai",
  title: "〜はい/ぱい/ばい — counter for cups and glasses",
  rule:
    "The counter for cups, glasses, and bowls of liquid is 〜はい. It has irregular sound changes: いっぱい (1), にはい (2), さんばい (3), よんはい (4), ごはい (5), ろっぱい (6), ななはい (7), はっぱい (8), きゅうはい (9), じゅっぱい (10). Pattern: 1/6/8/10 → っぱい, 3 → ばい, rest → はい.",
  examples: [
    {
      ja: "コーヒーを いっぱい ください。",
      romaji: "koohii o ippai kudasai.",
      en: "One cup of coffee, please.",
    },
    {
      ja: "みずを さんばい のみました。",
      romaji: "mizu o sanbai nomimashita.",
      en: "I drank three glasses of water.",
    },
    {
      ja: "ジュースを にはい ください。",
      romaji: "juusu o nihai kudasai.",
      en: "Two glasses of juice, please.",
    },
  ],
  antiPattern: {
    ja: "コーヒーを いちはい ください。",
    romaji: "koohii o ichihai kudasai.",
    en: "(broken — 1 cup is いっぱい, not いちはい)",
    why: "1 cup uses the irregular reading いっぱい (geminate consonant + p). The regular form いちはい is not used.",
  },
  cultureNote:
    "Counters are essential in Japanese. The はい counter is one of the most common — you'll use it every time you order drinks.",
});

// ═══════════════════════════════════════════════════════════════════════
// M21-1-1 — "At the table" intro
//   (food vocab: たまご, にく, さかな, やさい + emoji MCQ)
// ═══════════════════════════════════════════════════════════════════════

const M21_1_1_REVIEW = pickReviewAtoms("ja-m21-1-1-rev", M21_REVIEW_POOL, 6);

export const M21_1_1: LessonContent = {
  id: "ja-m21-1-1",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "At the table I",
  description:
    "Four essential food words — egg, meat, fish, vegetables — plus ordering basics.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── たまご (egg) — image MCQ intro ──
    vocabMcq(
      "ja-m21-1-1-mcq-tamago",
      { kana: "たまご", meaningEn: "egg", emoji: "🥚", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    speaking("ja-m21-1-1-speak-tamago", "たまご", "Egg"),
    // ── にく (meat) ──
    vocabMcq(
      "ja-m21-1-1-mcq-niku",
      { kana: "にく", meaningEn: "meat", emoji: "🥩", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m21-1-1-lc-niku",
      audioText: "にくを たべます",
      correctMeaningEn: "I eat meat.",
      distractorsEn: ["I eat fish.", "I eat eggs.", "I eat vegetables."],
    }),
    // ── さかな (fish) ──
    vocabMcq(
      "ja-m21-1-1-mcq-sakana",
      { kana: "さかな", meaningEn: "fish", emoji: "🐟", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    speaking("ja-m21-1-1-speak-sakana", "さかな", "Fish"),
    // ── やさい (vegetables) ──
    vocabMcq(
      "ja-m21-1-1-mcq-yasai",
      { kana: "やさい", meaningEn: "vegetables", emoji: "🥕", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m21-1-1-lc-yasai",
      audioText: "やさいを ください",
      correctMeaningEn: "Vegetables, please.",
      distractorsEn: ["Meat, please.", "Fish, please.", "Eggs, please."],
    }),
    // ── Sentence drills ──
    build(
      "ja-m21-1-1-build-tamago",
      "Say: I eat eggs.",
      "たまごを たべます",
      ["たべます", "たまご", "にく", "のみます", "を"],
      ["たまご", "を", "たべます"],
    ),
    sentenceMcq({
      id: "ja-m21-1-1-mcq-sakana-taberu",
      prompt: "Which sentence means 'I eat fish.'?",
      correctKana: "さかなを たべます。",
      distractorsKana: [
        "にくを たべます。",
        "さかなを のみます。",
        "やさいを たべます。",
      ],
      explanation: "さかな = fish. たべます = eat.",
    }),
    build(
      "ja-m21-1-1-build-niku-wo",
      "Say: I eat meat.",
      "にくを たべます",
      ["たべます", "やさい", "にく", "を", "のみます"],
      ["にく", "を", "たべます"],
    ),
    listeningBuildSentence({
      id: "ja-m21-1-1-lb-yasai",
      target: "やさいを たべます",
      tiles: ["たべます", "を", "のみます", "さかな", "やさい"],
      correctOrder: ["やさい", "を", "たべます"],
      promptEn: "Hear it, build it: 'I eat vegetables.'",
    }),
    selfExplain({
      id: "ja-m21-1-1-self-explain",
      anchorLabel: "You used を in: にくを たべます",
      anchorAudioText: "にくを たべます",
      question: "Why を here?",
      rule: { text: "を marks the direct object — meat is the thing being eaten." },
      surface: { text: "を is always used with food words." },
      distractor: { text: "を marks the location where you eat." },
      ruleExplanation:
        "を marks the direct object of the verb. にく (meat) is what you eat (たべます), so it takes を.",
    }),
    speaking(
      "ja-m21-1-1-speak-sakana",
      "さかなを たべます",
      "I eat fish.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-1-1-rev-mcq-1", M21_1_1_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-1-1-rev-lc-1",
      audioText: M21_1_1_REVIEW[1].kana,
      correctMeaningEn: M21_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M21_1_1_REVIEW[2].meaningEn,
        M21_1_1_REVIEW[3].meaningEn,
        M21_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m21-1-1-rev-speak-1", M21_1_1_REVIEW[2].kana, M21_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-1-1-rev", M21_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_1_1.steps);
assertAnswerRotation(M21_1_1.steps, 1);
assertNoConsecutiveSame(M21_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-1-2 — "At the table" practice
//   (drill たまご, にく, さかな, やさい in sentences + ごはん, おべんとう, とりにく)
// ═══════════════════════════════════════════════════════════════════════

const M21_1_2_REVIEW = pickReviewAtoms("ja-m21-1-2-rev", M21_REVIEW_POOL, 6);

export const M21_1_2: LessonContent = {
  id: "ja-m21-1-2",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "At the table II",
  description:
    "Drill core food vocab in sentences, plus chicken, rice, and lunch box.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── とりにく (chicken) ──
    vocabMcq(
      "ja-m21-1-2-mcq-toriniku",
      { kana: "とりにく", meaningEn: "chicken", emoji: "🍗", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    speaking("ja-m21-1-2-speak-toriniku", "とりにく", "Chicken"),
    // ── ごはん (cooked rice) ──
    build(
      "ja-m21-1-2-build-gohan",
      "Pick the Japanese word for: Cooked rice / meal",
      "ごはん",
      ["にく", "パン", "ごはん", "さかな"],
      ["ごはん"],
    ),
    vocabMcq(
      "ja-m21-1-2-mcq-gohan",
      { kana: "ごはん", meaningEn: "cooked rice", emoji: "🍚", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    // ── おべんとう (lunch box) ──
    vocabMcq(
      "ja-m21-1-2-mcq-obentou",
      { kana: "おべんとう", meaningEn: "lunch box", emoji: "🍱", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m21-1-2-lc-obentou",
      audioText: "おべんとうを たべます",
      correctMeaningEn: "I eat a lunch box.",
      distractorsEn: ["I eat rice.", "I eat chicken.", "I buy a lunch box."],
    }),
    // ── Sentence drills mixing old + new ──
    build(
      "ja-m21-1-2-build-toriniku",
      "Say: I eat chicken.",
      "とりにくを たべます",
      ["を", "のみます", "さかな", "とりにく", "たべます"],
      ["とりにく", "を", "たべます"],
    ),
    sentenceMcq({
      id: "ja-m21-1-2-mcq-gohan-sent",
      prompt: "Which sentence means 'I eat a lunch box.'?",
      correctKana: "おべんとうを たべます。",
      distractorsKana: [
        "ごはんを たべます。",
        "おべんとうを かいます。",
        "とりにくを たべます。",
      ],
      explanation: "おべんとう = lunch box. たべます = eat.",
    }),
    build(
      "ja-m21-1-2-build-gohan-sakana",
      "Say: I eat rice and fish.",
      "ごはんと さかなを たべます",
      ["さかな", "を", "ごはん", "たべます", "と", "のみます"],
      ["ごはん", "と", "さかな", "を", "たべます"],
    ),
    listeningBuildSentence({
      id: "ja-m21-1-2-lb-gohan",
      target: "ごはんを たべます",
      tiles: ["を", "のみます", "にく", "ごはん", "たべます"],
      correctOrder: ["ごはん", "を", "たべます"],
      promptEn: "Hear it, build it: 'I eat rice.'",
    }),
    cloze(
      "ja-m21-1-2-cloze-ha",
      "さかな",
      " おいしいです。",
      "は",
      ["は", "を", "が", "に"],
      "Fish is delicious.",
      "さかなは おいしいです。",
      "は marks the topic — fish is what we're describing.",
    ),
    translateStep({
      id: "ja-m21-1-2-translate",
      promptEn: "I eat chicken.",
      acceptedAnswers: [
        "とりにくを たべます",
        "とりにくを たべます。",
      ],
      audioText: "とりにくを たべます",
    }),
    selfExplain({
      id: "ja-m21-1-2-self-explain",
      anchorLabel: "You said: さかなは おいしいです",
      anchorAudioText: "さかなは おいしいです",
      question: "Why は instead of を here?",
      rule: { text: "は marks the topic for a description. We're talking ABOUT fish (it's delicious), not eating it." },
      surface: { text: "は is always used with food words." },
      distractor: { text: "は means the fish is expensive." },
      ruleExplanation:
        "を marks a direct object (what you eat/buy). は marks the topic when you're describing something: さかなは おいしい = 'Fish IS delicious.'",
    }),
    speaking(
      "ja-m21-1-2-speak-gohan",
      "ごはんを たべます",
      "I eat rice.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-1-2-rev-mcq-1", M21_1_2_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-1-2-rev-lc-1",
      audioText: "よる じゅうじに ねます",
      correctMeaningEn: "I go to bed at ten at night.",
      distractorsEn: [
        "I go to bed at nine at night.",
        "I get up at ten in the morning.",
        "I eat dinner at six.",
      ],
      exercisedAtomKanas: ["じゅう"],
    }),
    speaking("ja-m21-1-2-rev-speak-1", M21_1_2_REVIEW[2].kana, M21_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-1-2-rev", M21_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_1_2.steps);
assertAnswerRotation(M21_1_2.steps, 1);
assertNoConsecutiveSame(M21_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-2-1 — "Fruits & drinks" intro
//   (くだもの, りんご, バナナ, ぎゅうにゅう, ジュース)
// ═══════════════════════════════════════════════════════════════════════

const M21_2_1_REVIEW = pickReviewAtoms("ja-m21-2-1-rev", M21_REVIEW_POOL, 6);

export const M21_2_1: LessonContent = {
  id: "ja-m21-2-1",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Fruits & drinks I",
  description:
    "Five new words — fruit, apple, banana, milk, juice — plus ordering drinks.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── くだもの (fruit) ──
    vocabMcq(
      "ja-m21-2-1-mcq-kudamono",
      { kana: "くだもの", meaningEn: "fruit", emoji: "🍎", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    speaking("ja-m21-2-1-speak-kudamono", "くだもの", "Fruit"),
    // ── りんご (apple) ──
    build(
      "ja-m21-2-1-build-ringo",
      "Pick the Japanese word for: Apple",
      "りんご",
      ["みかん", "りんご", "バナナ", "くだもの"],
      ["りんご"],
    ),
    listeningCompSentence({
      id: "ja-m21-2-1-lc-ringo",
      audioText: "りんごを たべます",
      correctMeaningEn: "I eat an apple.",
      distractorsEn: ["I eat a banana.", "I buy an apple.", "I eat fruit."],
    }),
    // ── バナナ (banana) ──
    build(
      "ja-m21-2-1-build-banana",
      "Pick the Japanese word for: Banana",
      "バナナ",
      ["みかん", "くだもの", "りんご", "バナナ"],
      ["バナナ"],
    ),
    speaking("ja-m21-2-1-speak-banana", "バナナ", "Banana"),
    // ── ぎゅうにゅう (milk) ──
    build(
      "ja-m21-2-1-build-gyuunyuu",
      "Pick the Japanese word for: Milk",
      "ぎゅうにゅう",
      ["おさけ", "ぎゅうにゅう", "ジュース", "みず"],
      ["ぎゅうにゅう"],
    ),
    listeningCompSentence({
      id: "ja-m21-2-1-lc-gyuunyuu",
      audioText: "ぎゅうにゅうを のみます",
      correctMeaningEn: "I drink milk.",
      distractorsEn: ["I drink juice.", "I eat milk.", "I drink water."],
    }),
    // ── ジュース (juice) ──
    build(
      "ja-m21-2-1-build-juusu",
      "Pick the Japanese word for: Juice",
      "ジュース",
      ["おちゃ", "ぎゅうにゅう", "コーヒー", "ジュース"],
      ["ジュース"],
    ),
    vocabMcq(
      "ja-m21-2-1-mcq-juusu",
      { kana: "ジュース", meaningEn: "juice", emoji: "🧃", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    // ── Sentence drills ──
    build(
      "ja-m21-2-1-build-juusu-nomu",
      "Say: I drink juice.",
      "ジュースを のみます",
      ["のみます", "ぎゅうにゅう", "ジュース", "を", "たべます"],
      ["ジュース", "を", "のみます"],
    ),
    sentenceMcq({
      id: "ja-m21-2-1-mcq-gyuunyuu-sent",
      prompt: "Which sentence means 'I drink milk.'?",
      correctKana: "ぎゅうにゅうを のみます。",
      distractorsKana: [
        "ジュースを のみます。",
        "ぎゅうにゅうを たべます。",
        "おちゃを のみます。",
      ],
      explanation: "ぎゅうにゅう = milk. のみます = drink.",
    }),
    build(
      "ja-m21-2-1-build-ringo-taberu",
      "Say: I eat an apple.",
      "りんごを たべます",
      ["のみます", "バナナ", "を", "たべます", "りんご"],
      ["りんご", "を", "たべます"],
    ),
    selfExplain({
      id: "ja-m21-2-1-self-explain",
      anchorLabel: "You used を in: ジュースを のみます",
      anchorAudioText: "ジュースを のみます",
      question: "Why を with のみます?",
      rule: { text: "を marks the direct object — juice is what you drink." },
      surface: { text: "を is only used with drinks, not food." },
      distractor: { text: "を means you want more juice." },
      ruleExplanation:
        "を marks the direct object of any verb. たべます (eat) and のみます (drink) both take を for what you consume.",
    }),
    speaking(
      "ja-m21-2-1-speak-juusu",
      "ジュースを のみます",
      "I drink juice.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-2-1-rev-mcq-1", M21_2_1_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-2-1-rev-lc-1",
      audioText: "えきは どこですか",
      correctMeaningEn: "Where is the station?",
      distractorsEn: [
        "Where is the bank?",
        "Is this the station?",
        "The station is big.",
      ],
      exercisedAtomKanas: ["えき"],
    }),
    speaking("ja-m21-2-1-rev-speak-1", M21_2_1_REVIEW[2].kana, M21_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-2-1-rev", M21_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_2_1.steps);
assertAnswerRotation(M21_2_1.steps, 1);
assertNoConsecutiveSame(M21_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-2-2 — "Fruits & drinks" drill
//   (みかん, おさけ + パン review + sentence variety)
// ═══════════════════════════════════════════════════════════════════════

const M21_2_2_REVIEW = pickReviewAtoms("ja-m21-2-2-rev", M21_REVIEW_POOL, 6);

export const M21_2_2: LessonContent = {
  id: "ja-m21-2-2",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Fruits & drinks II",
  description:
    "Mandarin, bread, and alcohol join the menu. Drill all food and drink vocab in sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── みかん (mandarin) ──
    build(
      "ja-m21-2-2-build-mikan",
      "Pick the Japanese word for: Mandarin orange",
      "みかん",
      ["りんご", "くだもの", "みかん", "バナナ"],
      ["みかん"],
    ),
    listeningCompSentence({
      id: "ja-m21-2-2-lc-mikan",
      audioText: "みかんを たべます",
      correctMeaningEn: "I eat a mandarin.",
      distractorsEn: ["I eat an apple.", "I eat a banana.", "I buy a mandarin."],
    }),
    // ── パン (bread) ──
    vocabMcq(
      "ja-m21-2-2-mcq-pan",
      { kana: "パン", meaningEn: "bread", emoji: "🍞", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    speaking("ja-m21-2-2-speak-pan", "パン", "Bread"),
    // ── おさけ (alcohol) ──
    build(
      "ja-m21-2-2-build-osake",
      "Pick the Japanese word for: Alcohol / sake",
      "おさけ",
      ["おちゃ", "おさけ", "ジュース", "ぎゅうにゅう"],
      ["おさけ"],
    ),
    listeningCompSentence({
      id: "ja-m21-2-2-lc-osake",
      audioText: "おさけを のみます",
      correctMeaningEn: "I drink alcohol.",
      distractorsEn: ["I drink juice.", "I drink milk.", "I eat sake."],
    }),
    // ── Sentence drills ──
    build(
      "ja-m21-2-2-build-pan-taberu",
      "Say: I eat bread.",
      "パンを たべます",
      ["たべます", "パン", "を", "ごはん", "のみます"],
      ["パン", "を", "たべます"],
    ),
    listeningBuildSentence({
      id: "ja-m21-2-2-lb-osake",
      target: "おさけを のみます",
      tiles: ["のみます", "おちゃ", "おさけ", "を", "たべます"],
      correctOrder: ["おさけ", "を", "のみます"],
      promptEn: "Hear it, build it: 'I drink alcohol.'",
    }),
    sentenceMcq({
      id: "ja-m21-2-2-mcq-mikan",
      prompt: "Which sentence means 'I eat a mandarin.'?",
      correctKana: "みかんを たべます。",
      distractorsKana: [
        "りんごを たべます。",
        "みかんを のみます。",
        "バナナを たべます。",
      ],
      explanation: "みかん = mandarin. たべます = eat.",
    }),
    listeningBuildSentence({
      id: "ja-m21-2-2-lb-pan",
      target: "パンを たべます",
      tiles: ["たべます", "パン", "を", "ごはん", "のみます"],
      correctOrder: ["パン", "を", "たべます"],
      promptEn: "Hear it, build it: 'I eat bread.'",
    }),
    cloze(
      "ja-m21-2-2-cloze-ha",
      "りんご",
      " おいしいです。",
      "は",
      ["は", "を", "が", "に"],
      "Apples are delicious.",
      "りんごは おいしいです。",
      "は marks the topic — apples are what we're describing.",
    ),
    translateStep({
      id: "ja-m21-2-2-translate",
      promptEn: "I drink milk.",
      acceptedAnswers: [
        "ぎゅうにゅうを のみます",
        "ぎゅうにゅうを のみます。",
      ],
      audioText: "ぎゅうにゅうを のみます",
    }),
    selfExplain({
      id: "ja-m21-2-2-self-explain",
      anchorLabel: "You said: りんごは おいしいです",
      anchorAudioText: "りんごは おいしいです",
      question: "Could you say りんごを おいしいです?",
      rule: { text: "No — は marks the topic for a description. を would need an action verb like たべます." },
      surface: { text: "Yes — を and は are interchangeable with food." },
      distractor: { text: "Yes — を is always correct with food words." },
      ruleExplanation:
        "は marks the topic for descriptions (おいしい); を marks what you DO to something (たべます). りんごは おいしい = 'Apples ARE delicious'; りんごを たべます = 'I EAT apples.'",
    }),
    speaking(
      "ja-m21-2-2-speak-mikan",
      "みかんを たべます",
      "I eat a mandarin.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-2-2-rev-mcq-1", M21_2_2_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-2-2-rev-lc-1",
      audioText: "アメリカに いきたいです",
      correctMeaningEn: "I want to go to America.",
      distractorsEn: [
        "I want to go to Japan.",
        "I went to America.",
        "I am from America.",
      ],
      exercisedAtomKanas: ["アメリカ"],
    }),
    speaking("ja-m21-2-2-rev-speak-1", M21_2_2_REVIEW[2].kana, M21_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-2-2-rev", M21_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_2_2.steps);
assertAnswerRotation(M21_2_2.steps, 1);
assertNoConsecutiveSame(M21_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-3-1 — "Things like..." intro
//   (や incomplete list: パンやたまご)
// ═══════════════════════════════════════════════════════════════════════

const M21_3_1_REVIEW = pickReviewAtoms("ja-m21-3-1-rev", M21_REVIEW_POOL, 6);

export const M21_3_1: LessonContent = {
  id: "ja-m21-3-1",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Things like... I",
  description:
    "The や particle for open-ended lists — bread and eggs (among other things).",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_YA,
    // ── や drill sentences ──
    build(
      "ja-m21-3-1-build-pan-ya-tamago",
      "Say: I buy bread and eggs (among other things).",
      "パンや たまごを かいます",
      ["と", "たまご", "や", "かいます", "を", "パン", "のみます"],
      ["パン", "や", "たまご", "を", "かいます"],
    ),
    listeningCompSentence({
      id: "ja-m21-3-1-lc-ya-1",
      audioText: "にくや さかなを たべます",
      correctMeaningEn: "I eat meat and fish (among other things).",
      distractorsEn: [
        "I eat only meat and fish.",
        "I eat meat or fish.",
        "I eat fish, not meat.",
      ],
    }),
    cloze(
      "ja-m21-3-1-cloze-ya-1",
      "りんご",
      " バナナを かいます。",
      "や",
      ["や", "と", "は", "が"],
      "I buy apples and bananas (among other things).",
      "りんごや バナナを かいます。",
      "や makes an open list — there are more items not mentioned.",
    ),
    sentenceMcq({
      id: "ja-m21-3-1-mcq-ya-vs-to",
      prompt: "Which particle means 'and (among other things)'?",
      correctKana: "くだものや パンを かいます。",
      distractorsKana: [
        "くだものと パンを かいます。",
        "くだものは パンを かいます。",
        "くだものを パンを かいます。",
      ],
      explanation: "や = and (open list, implying more). と = and (only those two).",
    }),
    build(
      "ja-m21-3-1-build-niku-ya-yasai",
      "Say: I eat meat and vegetables (among other things).",
      "にくや やさいを たべます",
      ["かいます", "や", "にく", "と", "を", "たべます", "やさい"],
      ["にく", "や", "やさい", "を", "たべます"],
    ),
    listeningBuildSentence({
      id: "ja-m21-3-1-lb-ya",
      target: "さかなや やさいを かいます",
      tiles: ["と", "さかな", "かいます", "や", "やさい", "たべます", "を"],
      correctOrder: ["さかな", "や", "やさい", "を", "かいます"],
      promptEn: "Hear it, build it: 'I buy fish and vegetables (among other things).'",
    }),
    cloze(
      "ja-m21-3-1-cloze-ya-2",
      "ぎゅうにゅう",
      " ジュースを のみます。",
      "や",
      ["や", "と", "は", "を"],
      "I drink milk and juice (among other things).",
      "ぎゅうにゅうや ジュースを のみます。",
      "や for an incomplete list of drinks.",
    ),
    speaking(
      "ja-m21-3-1-speak-ya-1",
      "たまごや ぎゅうにゅうを かいます",
      "I buy eggs and milk (among other things).",
    ),
    build(
      "ja-m21-3-1-build-niku-sakana",
      "Say: I eat meat and fish (among other things).",
      "にくや さかなを たべます",
      ["さかな", "を", "にく", "たべます", "や", "と"],
      ["にく", "や", "さかな", "を", "たべます"],
    ),
    sentenceMcq({
      id: "ja-m21-3-1-mcq-ya-meaning",
      prompt: "What does りんごや バナナを かいます mean?",
      correctKana: "I buy apples and bananas (among other things).",
      distractorsKana: [
        "I buy only apples and bananas.",
        "I buy apples or bananas.",
        "I buy bananas, not apples.",
      ],
      explanation: "や = incomplete list. There may be more items besides apples and bananas.",
    }),
    translateStep({
      id: "ja-m21-3-1-translate",
      promptEn: "I eat vegetables and fruit (among other things).",
      acceptedAnswers: [
        "やさいや くだものを たべます",
        "やさいや くだものを たべます。",
      ],
      audioText: "やさいや くだものを たべます",
    }),
    selfExplain({
      id: "ja-m21-3-1-self-explain",
      anchorLabel: "You used や in: パンや たまごを かいます",
      anchorAudioText: "パンや たまごを かいます",
      question: "Why や instead of と here?",
      rule: { text: "や makes an open list — bread, eggs, and other things. と would mean ONLY bread and eggs." },
      surface: { text: "や sounds softer than と." },
      distractor: { text: "や is used with food; と is used with objects." },
      ruleExplanation:
        "や = A and B, possibly more. と = A and B, nothing else. Grocery lists favor や since you're likely buying more than two items.",
    }),
    speaking(
      "ja-m21-3-1-speak-ya-2",
      "りんごや バナナを かいます",
      "I buy apples and bananas (among other things).",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-3-1-rev-mcq-1", M21_3_1_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-3-1-rev-lc-1",
      audioText: "ぎんこうは どこに ありますか",
      correctMeaningEn: "Where is the bank?",
      distractorsEn: [
        "Where is the library?",
        "Is there a bank near the station?",
        "The bank is closed today.",
      ],
      exercisedAtomKanas: ["ぎんこう"],
    }),
    speaking("ja-m21-3-1-rev-speak-1", M21_3_1_REVIEW[2].kana, M21_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-3-1-rev", M21_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_3_1.steps);
assertAnswerRotation(M21_3_1.steps, 1);
assertNoConsecutiveSame(M21_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-3-2 — "Things like..." drill
//   (や vs と contrast drill)
// ═══════════════════════════════════════════════════════════════════════

const M21_3_2_REVIEW = pickReviewAtoms("ja-m21-3-2-rev", M21_REVIEW_POOL, 6);

export const M21_3_2: LessonContent = {
  id: "ja-m21-3-2",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Things like... II",
  description:
    "Drill the や vs と contrast — open lists vs exhaustive lists.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── Contrast drills ──
    cloze(
      "ja-m21-3-2-cloze-ya-1",
      "たまご",
      " にくを かいます。(and other things)",
      "や",
      ["や", "と", "は", "を"],
      "I buy eggs and meat (among other things).",
      "たまごや にくを かいます。",
      "や = incomplete list — there's more to buy.",
    ),
    build(
      "ja-m21-3-2-build-to",
      "Say: Coffee and tea, please. (only those two)",
      "コーヒーと おちゃを ください",
      ["や", "は", "コーヒー", "ください", "おちゃ", "を", "と"],
      ["コーヒー", "と", "おちゃ", "を", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m21-3-2-lc-ya",
      audioText: "くだものや やさいを たくさん たべます",
      correctMeaningEn: "I eat lots of fruit and vegetables (among other things).",
      distractorsEn: [
        "I eat a little fruit and vegetables.",
        "I eat only fruit and vegetables.",
        "I buy lots of fruit and vegetables.",
      ],
    }),
    cloze(
      "ja-m21-3-2-cloze-to",
      "ごはん",
      " にくを たべます。(only those two)",
      "と",
      ["と", "や", "は", "が"],
      "I eat rice and meat (just those two).",
      "ごはんと にくを たべます。",
      "と = exhaustive list — only rice and meat.",
    ),
    sentenceMcq({
      id: "ja-m21-3-2-mcq-ya-vs-to",
      prompt: "You're at a store buying lots of things. Which sounds natural?",
      correctKana: "パンや ぎゅうにゅうを かいます。",
      distractorsKana: [
        "パンと ぎゅうにゅうを かいます。",
        "パンは ぎゅうにゅうを かいます。",
        "パンを ぎゅうにゅうや かいます。",
      ],
      explanation: "Shopping for lots of things → や (open list) is natural.",
    }),
    build(
      "ja-m21-3-2-build-ya-fruit",
      "Say: I eat apples and bananas (among other things).",
      "りんごや バナナを たべます",
      ["や", "りんご", "たべます", "を", "バナナ", "かいます", "と"],
      ["りんご", "や", "バナナ", "を", "たべます"],
    ),
    listeningBuildSentence({
      id: "ja-m21-3-2-lb-to",
      target: "たまごと パンを ください",
      tiles: ["を", "たまご", "と", "パン", "かいます", "や", "ください"],
      correctOrder: ["たまご", "と", "パン", "を", "ください"],
      promptEn: "Hear it, build it: 'Eggs and bread, please.' (only those two)",
    }),
    cloze(
      "ja-m21-3-2-cloze-ya-2",
      "ジュース",
      " ぎゅうにゅうを のみます。(and other drinks)",
      "や",
      ["や", "と", "は", "を"],
      "I drink juice and milk (among other things).",
      "ジュースや ぎゅうにゅうを のみます。",
      "や for an open list of drinks.",
    ),
    speaking(
      "ja-m21-3-2-speak-ya",
      "とりにくや たまごを たべます",
      "I eat chicken and eggs (among other things).",
    ),
    listeningCompSentence({
      id: "ja-m21-3-2-lc-to",
      audioText: "コーヒーと ジュースを ください",
      correctMeaningEn: "Coffee and juice, please.",
      distractorsEn: [
        "Coffee and juice (among other things), please.",
        "Coffee or juice, please.",
        "I drink coffee and juice.",
      ],
    }),
    build(
      "ja-m21-3-2-build-yasai-kudamono",
      "Say: I buy vegetables and fruit (among other things).",
      "やさいや くだものを かいます",
      ["くだもの", "を", "かいます", "やさい", "や", "と"],
      ["やさい", "や", "くだもの", "を", "かいます"],
    ),
    sentenceMcq({
      id: "ja-m21-3-2-mcq-meaning",
      prompt: "What does さかなや にくを たべます mean?",
      correctKana: "I eat fish and meat (among other things).",
      distractorsKana: [
        "I eat only fish and meat.",
        "I eat fish or meat.",
        "I buy fish and meat.",
      ],
      explanation: "や = open list. There may be more foods besides fish and meat.",
    }),
    translateStep({
      id: "ja-m21-3-2-translate",
      promptEn: "I drink juice and milk (among other things).",
      acceptedAnswers: [
        "ジュースや ぎゅうにゅうを のみます",
        "ジュースや ぎゅうにゅうを のみます。",
      ],
      audioText: "ジュースや ぎゅうにゅうを のみます",
    }),
    selfExplain({
      id: "ja-m21-3-2-self-explain",
      anchorLabel: "You used both や and と in this lesson",
      anchorAudioText: "たまごや にくを かいます",
      question: "When do you use や instead of と?",
      rule: { text: "や when the list is incomplete — there are more items. と when the list is complete." },
      surface: { text: "や for food; と for everything else." },
      distractor: { text: "や for questions; と for statements." },
      ruleExplanation:
        "や = open list (A, B, etc.). と = closed list (A and B only). The choice depends on whether you're listing everything or just examples.",
    }),
    speaking(
      "ja-m21-3-2-speak-to",
      "コーヒーと おちゃを ください",
      "Coffee and tea, please.",
    ),
    // ── など (etc.) — new word; makes the や open-list explicit ──
    build(
      "ja-m21-3-2-build-nado",
      "Pick the Japanese for: etc. / and so on",
      "など",
      ["でも", "など", "まで", "から"],
      ["など"],
    ),
    listeningCompSentence({
      id: "ja-m21-3-2-lc-nado",
      audioText: "パンや たまごなどを かいます",
      correctMeaningEn: "I buy bread, eggs, and so on.",
      distractorsEn: [
        "I buy only bread and eggs.",
        "I buy bread or eggs.",
        "I eat bread, eggs, and so on.",
      ],
    }),
    speaking(
      "ja-m21-3-2-speak-nado",
      "やさいや にくなどを たべます",
      "I eat vegetables, meat, and so on.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-3-2-rev-mcq-1", M21_3_2_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-3-2-rev-lc-1",
      audioText: M21_3_2_REVIEW[1].kana,
      correctMeaningEn: M21_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M21_3_2_REVIEW[2].meaningEn,
        M21_3_2_REVIEW[3].meaningEn,
        M21_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m21-3-2-rev-speak-1", M21_3_2_REVIEW[2].kana, M21_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-3-2-rev", M21_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_3_2.steps);
assertAnswerRotation(M21_3_2.steps, 1);
assertNoConsecutiveSame(M21_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-4-1 — "Utensils" intro
//   (おさら, はし, スプーン, フォーク, ナイフ, コップ)
// ═══════════════════════════════════════════════════════════════════════

const M21_4_1_REVIEW = pickReviewAtoms("ja-m21-4-1-rev", M21_REVIEW_POOL, 6);

export const M21_4_1: LessonContent = {
  id: "ja-m21-4-1",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Utensils I",
  description:
    "Six utensil words — plate, chopsticks, spoon, fork, knife, glass.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── おさら (plate) ──
    vocabMcq(
      "ja-m21-4-1-mcq-osara",
      { kana: "おさら", meaningEn: "plate", emoji: "🍽️", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    speaking("ja-m21-4-1-speak-osara", "おさら", "Plate"),
    // ── はし (chopsticks) ──
    vocabMcq(
      "ja-m21-4-1-mcq-hashi",
      { kana: "はし", meaningEn: "chopsticks", emoji: "🥢", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m21-4-1-lc-hashi",
      audioText: "はしを ください",
      correctMeaningEn: "Chopsticks, please.",
      distractorsEn: ["A spoon, please.", "A plate, please.", "A fork, please."],
    }),
    // ── どうぞ (here you are / go ahead) — dining-politeness backlog ──
    build(
      "ja-m21-4-1-build-douzo",
      "Pick the Japanese phrase for: 'here you are / go ahead' (handing something over)",
      "どうぞ",
      ["ください", "どうぞ", "おねがいします", "すみません"],
      ["どうぞ"],
    ),
    listeningCompSentence({
      id: "ja-m21-4-1-lc-douzo",
      audioText: "はい、どうぞ",
      correctMeaningEn: "Here you are. (handing something over)",
      distractorsEn: [
        "Please give me that.",
        "Excuse me.",
        "Yes, please help me.",
      ],
    }),
    // ── スプーン (spoon) ──
    vocabMcq(
      "ja-m21-4-1-mcq-supuun",
      { kana: "スプーン", meaningEn: "spoon", emoji: "🥄", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    speaking("ja-m21-4-1-speak-supuun", "スプーン", "Spoon"),
    // ── フォーク (fork) ──
    build(
      "ja-m21-4-1-build-fooku",
      "Pick the Japanese word for: Fork",
      "フォーク",
      ["はし", "ナイフ", "スプーン", "フォーク"],
      ["フォーク"],
    ),
    listeningCompSentence({
      id: "ja-m21-4-1-lc-fooku",
      audioText: "フォークを ください",
      correctMeaningEn: "A fork, please.",
      distractorsEn: ["A spoon, please.", "A knife, please.", "Chopsticks, please."],
    }),
    // ── ナイフ (knife) ──
    build(
      "ja-m21-4-1-build-naifu",
      "Pick the Japanese word for: Knife",
      "ナイフ",
      ["フォーク", "はし", "スプーン", "ナイフ"],
      ["ナイフ"],
    ),
    speaking("ja-m21-4-1-speak-naifu", "ナイフ", "Knife"),
    // ── コップ (glass) ──
    vocabMcq(
      "ja-m21-4-1-mcq-koppu",
      { kana: "コップ", meaningEn: "glass", emoji: "🥛", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    // ── Drills ──
    build(
      "ja-m21-4-1-build-hashi-kudasai",
      "Say: Chopsticks, please.",
      "はしを ください",
      ["ください", "はし", "スプーン", "を", "は"],
      ["はし", "を", "ください"],
    ),
    sentenceMcq({
      id: "ja-m21-4-1-mcq-supuun-sent",
      prompt: "Which sentence means 'A spoon, please.'?",
      correctKana: "スプーンを ください。",
      distractorsKana: [
        "フォークを ください。",
        "ナイフを ください。",
        "はしを ください。",
      ],
      explanation: "スプーン = spoon. を ください = please give me.",
    }),
    build(
      "ja-m21-4-1-build-fooku-kudasai",
      "Say: A fork, please.",
      "フォークを ください",
      ["ください", "ナイフ", "フォーク", "を"],
      ["フォーク", "を", "ください"],
    ),
    selfExplain({
      id: "ja-m21-4-1-self-explain",
      anchorLabel: "You asked for: フォークを ください",
      anchorAudioText: "フォークを ください",
      question: "Why を before ください?",
      rule: { text: "を marks the thing you're requesting — the fork is the direct object of ください." },
      surface: { text: "を is always used before ください." },
      distractor: { text: "を means 'one' fork." },
      ruleExplanation:
        "ください means 'please give.' を marks what you want: [thing]を ください = '[thing], please.'",
    }),
    speaking(
      "ja-m21-4-1-speak-koppu",
      "コップを ください",
      "A glass, please.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-4-1-rev-mcq-1", M21_4_1_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-4-1-rev-lc-1",
      audioText: "その じしょは だれのですか",
      correctMeaningEn: "Whose dictionary is that?",
      distractorsEn: [
        "Whose bag is that?",
        "Where is the dictionary?",
        "That dictionary is mine.",
      ],
      exercisedAtomKanas: ["じしょ"],
    }),
    speaking("ja-m21-4-1-rev-speak-1", M21_4_1_REVIEW[2].kana, M21_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-4-1-rev", M21_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_4_1.steps);
assertAnswerRotation(M21_4_1.steps, 1);
assertNoConsecutiveSame(M21_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-4-2 — "Utensils" drill
//   (ちゃわん, カップ + utensil drill with や)
// ═══════════════════════════════════════════════════════════════════════

const M21_4_2_REVIEW = pickReviewAtoms("ja-m21-4-2-rev", M21_REVIEW_POOL, 6);

export const M21_4_2: LessonContent = {
  id: "ja-m21-4-2",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Utensils II",
  description:
    "Rice bowl and cup join the set. Drill all utensils with や lists.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── ちゃわん (rice bowl) ──
    vocabMcq(
      "ja-m21-4-2-mcq-chawan",
      { kana: "ちゃわん", meaningEn: "rice bowl", emoji: "🍚", fromModule: "m21" },
      M21_REVIEW_POOL,
    ),
    speaking("ja-m21-4-2-speak-chawan", "ちゃわん", "Rice bowl"),
    // ── カップ (cup) ──
    build(
      "ja-m21-4-2-build-kappu",
      "Pick the Japanese word for: Cup",
      "カップ",
      ["コップ", "ちゃわん", "カップ", "おさら"],
      ["カップ"],
    ),
    listeningCompSentence({
      id: "ja-m21-4-2-lc-kappu",
      audioText: "カップを ください",
      correctMeaningEn: "A cup, please.",
      distractorsEn: ["A glass, please.", "A bowl, please.", "A plate, please."],
    }),
    // ── どうも (casual thanks) — dining-politeness backlog ──
    build(
      "ja-m21-4-2-build-doumo",
      "Someone hands you a cup and says どうぞ. Pick the natural reply: 'thanks (casual)'",
      "どうも",
      ["どうぞ", "ありがとう", "どうも", "すみません"],
      ["どうも"],
    ),
    listeningCompSentence({
      id: "ja-m21-4-2-lc-doumo",
      audioText: "どうも",
      correctMeaningEn: "Thanks. (casual)",
      distractorsEn: [
        "Here you are.",
        "Excuse me.",
        "You're welcome.",
      ],
    }),
    // ── Drill with や ──
    build(
      "ja-m21-4-2-build-hashi-ya-supuun",
      "Say: Chopsticks and a spoon (among other things), please.",
      "はしや スプーンを ください",
      ["と", "や", "を", "はし", "ください", "フォーク", "スプーン"],
      ["はし", "や", "スプーン", "を", "ください"],
    ),
    cloze(
      "ja-m21-4-2-cloze-ya",
      "おさら",
      " コップを ください。(and other things)",
      "や",
      ["や", "と", "は", "が"],
      "A plate and a glass (among other things), please.",
      "おさらや コップを ください。",
      "や = open list of utensils you need.",
    ),
    sentenceMcq({
      id: "ja-m21-4-2-mcq-chawan",
      prompt: "Which sentence means 'A rice bowl, please.'?",
      correctKana: "ちゃわんを ください。",
      distractorsKana: [
        "おさらを ください。",
        "カップを ください。",
        "コップを ください。",
      ],
      explanation: "ちゃわん = rice bowl. を ください = please give me.",
    }),
    listeningCompSentence({
      id: "ja-m21-4-2-lc-hashi-ya",
      audioText: "はしや フォークを ください",
      correctMeaningEn: "Chopsticks and a fork (among other things), please.",
      distractorsEn: [
        "Chopsticks and a fork, please. (only those)",
        "A spoon and a fork, please.",
        "Chopsticks and a knife, please.",
      ],
    }),
    build(
      "ja-m21-4-2-build-chawan-kudasai",
      "Say: A rice bowl and a plate, please. (only those)",
      "ちゃわんと おさらを ください",
      ["を", "おさら", "コップ", "や", "と", "ください", "ちゃわん"],
      ["ちゃわん", "と", "おさら", "を", "ください"],
    ),
    cloze(
      "ja-m21-4-2-cloze-to",
      "ナイフ",
      " フォークを ください。(only those two)",
      "と",
      ["と", "や", "は", "を"],
      "A knife and a fork, please.",
      "ナイフと フォークを ください。",
      "と = exhaustive — just a knife and a fork.",
    ),
    listeningBuildSentence({
      id: "ja-m21-4-2-lb-kappu",
      target: "カップを ください",
      tiles: ["は", "ください", "カップ", "を", "コップ"],
      correctOrder: ["カップ", "を", "ください"],
      promptEn: "Hear it, build it: 'A cup, please.'",
    }),
    translateStep({
      id: "ja-m21-4-2-translate",
      promptEn: "Chopsticks and a spoon (among other things), please.",
      acceptedAnswers: [
        "はしや スプーンを ください",
        "はしや スプーンを ください。",
      ],
      audioText: "はしや スプーンを ください",
    }),
    selfExplain({
      id: "ja-m21-4-2-self-explain",
      anchorLabel: "You used や in: おさらや コップを ください",
      anchorAudioText: "おさらや コップを ください",
      question: "What does や imply about the list?",
      rule: { text: "The list is incomplete — you probably need more than just a plate and glass." },
      surface: { text: "や is the polite way to list utensils." },
      distractor: { text: "や means you want one plate OR one glass, not both." },
      ruleExplanation:
        "や signals an open-ended list: 'a plate, a glass, and possibly other things.' と would mean exactly those two and nothing more.",
    }),
    speaking(
      "ja-m21-4-2-speak-naifu-fooku",
      "ナイフと フォークを ください",
      "A knife and a fork, please.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-4-2-rev-mcq-1", M21_4_2_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-4-2-rev-lc-1",
      audioText: "タクシーで ホテルに いきます",
      correctMeaningEn: "I go to the hotel by taxi.",
      distractorsEn: [
        "I go to the hotel by bus.",
        "I go to the station by taxi.",
        "I walk to the hotel.",
      ],
      exercisedAtomKanas: ["タクシー"],
    }),
    speaking("ja-m21-4-2-rev-speak-1", M21_4_2_REVIEW[2].kana, M21_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-4-2-rev", M21_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_4_2.steps);
assertAnswerRotation(M21_4_2.steps, 1);
assertNoConsecutiveSame(M21_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-5-1 — "Cups of..." intro
//   (counter はい/ぱい/ばい + irregular readings drill)
// ═══════════════════════════════════════════════════════════════════════

const M21_5_1_REVIEW = pickReviewAtoms("ja-m21-5-1-rev", M21_REVIEW_POOL, 6);

export const M21_5_1: LessonContent = {
  id: "ja-m21-5-1",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Cups of... I",
  description:
    "The cup/glass counter はい — including the tricky irregular forms いっぱい, さんばい, ろっぱい.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_HAI_COUNTER,
    // ── いっぱい (1 cup) — irregular ──
    build(
      "ja-m21-5-1-build-ippai",
      "Pick the counter for: 1 cup",
      "いっぱい",
      ["さんばい", "いっぱい", "にはい", "いちはい"],
      ["いっぱい"],
    ),
    listeningCompSentence({
      id: "ja-m21-5-1-lc-ippai",
      audioText: "コーヒーを いっぱい ください",
      correctMeaningEn: "One cup of coffee, please.",
      distractorsEn: ["Two cups of coffee, please.", "Three cups of coffee, please.", "One glass of juice, please."],
    }),
    // ── にはい (2 cups) ──
    build(
      "ja-m21-5-1-build-nihai",
      "Pick the counter for: 2 cups",
      "にはい",
      ["にっぱい", "さんばい", "にはい", "いっぱい"],
      ["にはい"],
    ),
    speaking("ja-m21-5-1-speak-nihai", "ジュースを にはい ください", "Two glasses of juice, please."),
    // ── さんばい (3 cups) — irregular ──
    build(
      "ja-m21-5-1-build-sanbai",
      "Pick the counter for: 3 cups",
      "さんばい",
      ["さんはい", "さんばい", "にはい", "よんはい"],
      ["さんばい"],
    ),
    listeningCompSentence({
      id: "ja-m21-5-1-lc-sanbai",
      audioText: "おちゃを さんばい ください",
      correctMeaningEn: "Three cups of tea, please.",
      distractorsEn: ["Two cups of tea, please.", "One cup of tea, please.", "Three cups of coffee, please."],
    }),
    // ── Drill the irregular pattern ──
    sentenceMcq({
      id: "ja-m21-5-1-mcq-ippai",
      prompt: "How do you say '1 glass of water, please'?",
      correctKana: "みずを いっぱい ください。",
      distractorsKana: [
        "みずを いちはい ください。",
        "みずを にはい ください。",
        "みずを さんばい ください。",
      ],
      explanation: "1 cup = いっぱい (irregular). NOT いちはい.",
    }),
    build(
      "ja-m21-5-1-build-ocha-sanbai",
      "Say: Three cups of tea, please.",
      "おちゃを さんばい ください",
      ["ください", "おちゃ", "さんはい", "を", "さんばい", "にはい"],
      ["おちゃ", "を", "さんばい", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m21-5-1-lb-ippai",
      target: "ジュースを いっぱい ください",
      tiles: ["いっぱい", "ください", "ジュース", "を", "にはい"],
      correctOrder: ["ジュース", "を", "いっぱい", "ください"],
      promptEn: "Hear it, build it: 'One glass of juice, please.'",
    }),
    build(
      "ja-m21-5-1-build-nihai-gyuunyuu",
      "Say: Two glasses of milk, please.",
      "ぎゅうにゅうを にはい ください",
      ["にはい", "ください", "ぎゅうにゅう", "を", "いっぱい"],
      ["ぎゅうにゅう", "を", "にはい", "ください"],
    ),
    cloze(
      "ja-m21-5-1-cloze-wo-2",
      "ジュース",
      " さんばい のみます。",
      "を",
      ["を", "は", "が", "と"],
      "I drink three glasses of juice.",
      "ジュースを さんばい のみます。",
      "を marks what you drink.",
    ),
    selfExplain({
      id: "ja-m21-5-1-self-explain",
      anchorLabel: "You used いっぱい, not いちはい",
      anchorAudioText: "みずを いっぱい ください",
      question: "Why いっぱい and not いちはい for 1 cup?",
      rule: { text: "1, 6, 8, and 10 use the irregular っぱい form. 3 uses ばい. The rest use はい." },
      surface: { text: "いっぱい sounds more polite than いちはい." },
      distractor: { text: "いっぱい is only for coffee; いちはい is for other drinks." },
      ruleExplanation:
        "Sound changes: 1→いっぱい, 3→さんばい, 6→ろっぱい, 8→はっぱい, 10→じゅっぱい. 2,4,5,7,9→regular はい.",
    }),
    speaking(
      "ja-m21-5-1-speak-ippai",
      "コーヒーを いっぱい ください",
      "One cup of coffee, please.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-5-1-rev-mcq-1", M21_5_1_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-5-1-rev-lc-1",
      audioText: "これは いくらですか",
      correctMeaningEn: "How much is this?",
      distractorsEn: [
        "What is this?",
        "How much is that over there?",
        "Is this yours?",
      ],
      exercisedAtomKanas: ["これ"],
    }),
    speaking("ja-m21-5-1-rev-speak-1", M21_5_1_REVIEW[2].kana, M21_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-5-1-rev", M21_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_5_1.steps);
assertAnswerRotation(M21_5_1.steps, 1);
assertNoConsecutiveSame(M21_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-5-2 — "Cups of..." drill
//   (よんはい, ごはい, ろっぱい + mixed counter practice)
// ═══════════════════════════════════════════════════════════════════════

const M21_5_2_REVIEW = pickReviewAtoms("ja-m21-5-2-rev", M21_REVIEW_POOL, 6);

export const M21_5_2: LessonContent = {
  id: "ja-m21-5-2",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Cups of... II",
  description:
    "More cup-counter practice — 4, 5, 6 cups with both regular and irregular forms.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── よんはい (4 cups) — regular ──
    build(
      "ja-m21-5-2-build-yonhai",
      "Pick the counter for: 4 cups",
      "よんはい",
      ["さんばい", "よんはい", "よっぱい", "ごはい"],
      ["よんはい"],
    ),
    listeningCompSentence({
      id: "ja-m21-5-2-lc-yonhai",
      audioText: "おちゃを よんはい ください",
      correctMeaningEn: "Four cups of tea, please.",
      distractorsEn: ["Five cups of tea, please.", "Three cups of tea, please.", "Four glasses of juice, please."],
    }),
    // ── ごはい (5 cups) — regular ──
    build(
      "ja-m21-5-2-build-gohai",
      "Pick the counter for: 5 cups",
      "ごはい",
      ["ろっぱい", "よんはい", "ごはい", "ごっぱい"],
      ["ごはい"],
    ),
    speaking("ja-m21-5-2-speak-gohai", "みずを ごはい ください", "Five glasses of water, please."),
    // ── ろっぱい (6 cups) — irregular ──
    build(
      "ja-m21-5-2-build-roppai",
      "Pick the counter for: 6 cups",
      "ろっぱい",
      ["ななはい", "ごはい", "ろくはい", "ろっぱい"],
      ["ろっぱい"],
    ),
    listeningCompSentence({
      id: "ja-m21-5-2-lc-roppai",
      audioText: "ジュースを ろっぱい のみました",
      correctMeaningEn: "I drank six glasses of juice.",
      distractorsEn: ["I drank five glasses of juice.", "I drank six cups of tea.", "I drank seven glasses of juice."],
    }),
    // ── Mixed drill ──
    sentenceMcq({
      id: "ja-m21-5-2-mcq-roppai",
      prompt: "How do you say '6 cups'?",
      correctKana: "ろっぱい",
      distractorsKana: ["ろくはい", "ろくばい", "ごはい"],
      explanation: "6 = ろっぱい (irregular — っぱい pattern like いっぱい).",
    }),
    build(
      "ja-m21-5-2-build-mixed",
      "Say: Two cups of coffee, please.",
      "コーヒーを にはい ください",
      ["ください", "さんばい", "にはい", "を", "いっぱい", "コーヒー"],
      ["コーヒー", "を", "にはい", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m21-5-2-lb-sanbai",
      target: "ぎゅうにゅうを さんばい のみます",
      tiles: ["のみます", "を", "にはい", "ぎゅうにゅう", "さんはい", "さんばい"],
      correctOrder: ["ぎゅうにゅう", "を", "さんばい", "のみます"],
      promptEn: "Hear it, build it: 'I drink three glasses of milk.'",
    }),
    build(
      "ja-m21-5-2-build-yonhai-ocha",
      "Say: I drank four cups of tea.",
      "おちゃを よんはい のみました",
      ["よんはい", "のみました", "おちゃ", "を", "ごはい"],
      ["おちゃ", "を", "よんはい", "のみました"],
    ),
    sentenceMcq({
      id: "ja-m21-5-2-mcq-yonhai",
      prompt: "Which is the correct counter for 4 cups?",
      correctKana: "よんはい",
      distractorsKana: ["よっぱい", "よんばい", "しはい"],
      explanation: "4 = よんはい (regular form — no sound change).",
    }),
    translateStep({
      id: "ja-m21-5-2-translate",
      promptEn: "One cup of tea, please.",
      acceptedAnswers: [
        "おちゃを いっぱい ください",
        "おちゃを いっぱい ください。",
      ],
      audioText: "おちゃを いっぱい ください",
    }),
    selfExplain({
      id: "ja-m21-5-2-self-explain",
      anchorLabel: "You used ろっぱい for 6 cups",
      anchorAudioText: "ジュースを ろっぱい のみました",
      question: "Which numbers get the irregular っぱい reading?",
      rule: { text: "1 (いっぱい), 6 (ろっぱい), 8 (はっぱい), and 10 (じゅっぱい)." },
      surface: { text: "Only 1 and 6 are irregular." },
      distractor: { text: "All even numbers use っぱい." },
      ruleExplanation:
        "The っぱい pattern hits 1, 6, 8, 10. さんばい (3) is also irregular (ばい instead of はい). All others are regular はい.",
    }),
    speaking(
      "ja-m21-5-2-speak-roppai",
      "ジュースを ろっぱい ください",
      "Six glasses of juice, please.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-5-2-rev-mcq-1", M21_5_2_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-5-2-rev-lc-1",
      audioText: "コンビニで パンを かいます",
      correctMeaningEn: "I buy bread at the convenience store.",
      distractorsEn: [
        "I buy juice at the convenience store.",
        "I buy bread at the station.",
        "I eat bread at home.",
      ],
      exercisedAtomKanas: ["コンビニ"],
    }),
    speaking("ja-m21-5-2-rev-speak-1", M21_5_2_REVIEW[2].kana, M21_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-5-2-rev", M21_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_5_2.steps);
assertAnswerRotation(M21_5_2.steps, 1);
assertNoConsecutiveSame(M21_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-6-1 — "Quoting" intro
//   (と quotation: 「いただきます」といいます)
// ═══════════════════════════════════════════════════════════════════════

const M21_6_1_REVIEW = pickReviewAtoms("ja-m21-6-1-rev", M21_REVIEW_POOL, 6);

export const M21_6_1: LessonContent = {
  id: "ja-m21-6-1",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Quoting I",
  description:
    "The quotation particle と — 'they say いただきます' and 'what do you call this?'",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_TO_QUOTATION,
    // ── 「いただきます」と いいます ──
    build(
      "ja-m21-6-1-build-itadakimasu",
      "Say: They say 'itadakimasu.'",
      "「いただきます」と いいます",
      ["と", "は", "を", "「いただきます」", "いいます"],
      ["「いただきます」", "と", "いいます"],
    ),
    listeningCompSentence({
      id: "ja-m21-6-1-lc-itadakimasu",
      audioText: "「ありがとう」と いいます",
      correctMeaningEn: "They say 'arigatou.'",
      distractorsEn: [
        "They say 'sumimasen.'",
        "They write 'arigatou.'",
        "They say 'itadakimasu.'",
      ],
    }),
    // ── 「ごちそうさまでした」と いいます ──
    build(
      "ja-m21-6-1-build-gochisousama",
      "Say: They say 'gochisousama deshita.'",
      "「ごちそうさまでした」と いいます",
      ["は", "「ごちそうさまでした」", "いいます", "を", "と"],
      ["「ごちそうさまでした」", "と", "いいます"],
    ),
    sentenceMcq({
      id: "ja-m21-6-1-mcq-to-quote",
      prompt: "Which sentence means 'They say arigatou gozaimasu.'?",
      correctKana: "「ありがとうございます」と いいます。",
      distractorsKana: [
        "「ありがとうございます」は いいます。",
        "「ありがとうございます」を いいます。",
        "「ありがとうございます」が いいます。",
      ],
      explanation: "と marks the quoted phrase — what someone says.",
    }),
    cloze(
      "ja-m21-6-1-cloze-to-1",
      "「おねがいします」",
      " いいます。",
      "と",
      ["と", "は", "を", "が"],
      "They say 'onegai shimasu.'",
      "「おねがいします」と いいます。",
      "と marks the quotation — the words someone says.",
    ),
    // ── なんと いいますか (what do you call it?) ──
    build(
      "ja-m21-6-1-build-nanto",
      "Ask: What do you call this in Japanese?",
      "これは にほんごで なんと いいますか",
      ["か", "にほんご", "と", "これ", "いいます", "は", "なん", "で"],
      ["これ", "は", "にほんご", "で", "なん", "と", "いいます", "か"],
    ),
    listeningCompSentence({
      id: "ja-m21-6-1-lc-nanto",
      audioText: "これは にほんごで なんと いいますか",
      correctMeaningEn: "What do you call this in Japanese?",
      distractorsEn: [
        "What is this in English?",
        "How do you eat this?",
        "What does this mean?",
      ],
    }),
    cloze(
      "ja-m21-6-1-cloze-to-2",
      "にほんごで なん",
      " いいますか。",
      "と",
      ["と", "は", "を", "に"],
      "What do you call it in Japanese?",
      "にほんごで なんと いいますか。",
      "なんと = 'what' + quotation と.",
    ),
    listeningBuildSentence({
      id: "ja-m21-6-1-lb-arigatou",
      target: "「ありがとうございます」と いいます",
      tiles: ["と", "いいます", "「ありがとうございます」", "は", "を"],
      correctOrder: ["「ありがとうございます」", "と", "いいます"],
      promptEn: "Hear it, build it: 'They say arigatou gozaimasu.'",
    }),
    sentenceMcq({
      id: "ja-m21-6-1-mcq-nanto",
      prompt: "How do you ask 'What do you call that in Japanese?'",
      correctKana: "それは にほんごで なんと いいますか。",
      distractorsKana: [
        "それは にほんごで なにを いいますか。",
        "それは にほんごで なんは いいますか。",
        "それは にほんごで なにが いいますか。",
      ],
      explanation: "なんと いいますか = 'What is it called?' なん + と (quotation).",
    }),
    selfExplain({
      id: "ja-m21-6-1-self-explain",
      anchorLabel: "You used と in: 「いただきます」と いいます",
      anchorAudioText: "「いただきます」と いいます",
      question: "Why と after the quoted phrase?",
      rule: { text: "と marks what someone says or what something is called — it attaches the quote to the verb いいます." },
      surface: { text: "と always comes before いいます." },
      distractor: { text: "と means 'and' — itadakimasu AND iimasu." },
      ruleExplanation:
        "The quotation と is different from the 'and' と. Here, と connects a quoted phrase to the verb of saying: [quote]と いいます = 'they say [quote].'",
    }),
    speaking(
      "ja-m21-6-1-speak-douzo",
      "「どうぞ」と いいます",
      "They say 'douzo' (here you are).",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-6-1-rev-mcq-1", M21_6_1_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-6-1-rev-lc-1",
      audioText: M21_6_1_REVIEW[1].kana,
      correctMeaningEn: M21_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M21_6_1_REVIEW[2].meaningEn,
        M21_6_1_REVIEW[3].meaningEn,
        M21_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m21-6-1-rev-speak-1", M21_6_1_REVIEW[2].kana, M21_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-6-1-rev", M21_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_6_1.steps);
assertAnswerRotation(M21_6_1.steps, 1);
assertNoConsecutiveSame(M21_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-6-2 — "Quoting" drill
//   (と quotation in context: ordering, culture phrases)
// ═══════════════════════════════════════════════════════════════════════

const M21_6_2_REVIEW = pickReviewAtoms("ja-m21-6-2-rev", M21_REVIEW_POOL, 6);

export const M21_6_2: LessonContent = {
  id: "ja-m21-6-2",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Quoting II",
  description:
    "Drill the quotation と in food contexts — saying phrases, asking what things are called.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    // ── Mixed quoting drills ──
    build(
      "ja-m21-6-2-build-sumimasen",
      "Say: They say 'sumimasen' (to call the waiter).",
      "「すみません」と いいます",
      ["と", "いいます", "「すみません」", "は", "を"],
      ["「すみません」", "と", "いいます"],
    ),
    cloze(
      "ja-m21-6-2-cloze-to-1",
      "「どうぞ」",
      " いいます。",
      "と",
      ["と", "は", "を", "が"],
      "They say 'douzo' (here you are).",
      "「どうぞ」と いいます。",
      "と marks the quoted phrase.",
    ),
    listeningCompSentence({
      id: "ja-m21-6-2-lc-sumimasen",
      audioText: "「すみません」と いいます",
      correctMeaningEn: "They say 'sumimasen.'",
      distractorsEn: [
        "They say 'itadakimasu.'",
        "Sumimasen is delicious.",
        "They eat sumimasen.",
      ],
    }),
    sentenceMcq({
      id: "ja-m21-6-2-mcq-gochisousama",
      prompt: "Which sentence means 'They say gochisousama deshita (after eating).'?",
      correctKana: "「ごちそうさまでした」と いいます。",
      distractorsKana: [
        "「ごちそうさまでした」は いいます。",
        "「いただきます」と いいます。",
        "「ごちそうさまでした」を いいます。",
      ],
      explanation: "と marks the quote. ごちそうさまでした is said after eating.",
    }),
    build(
      "ja-m21-6-2-build-nanto-tabemono",
      "Ask: What do you call this food in Japanese?",
      "この たべものは にほんごで なんと いいますか",
      ["は", "で", "なん", "いいます", "この", "か", "たべもの", "と", "にほんご"],
      ["この", "たべもの", "は", "にほんご", "で", "なん", "と", "いいます", "か"],
    ),
    cloze(
      "ja-m21-6-2-cloze-de",
      "にほんご",
      " なんと いいますか。",
      "で",
      ["で", "と", "は", "に"],
      "What do you call it in Japanese?",
      "にほんごで なんと いいますか。",
      "で marks the language — 'in Japanese.'",
    ),
    listeningBuildSentence({
      id: "ja-m21-6-2-lb-doumo",
      target: "「どうも」と いいます",
      tiles: ["と", "「どうも」", "いいます", "は", "を", "「どうぞ」"],
      correctOrder: ["「どうも」", "と", "いいます"],
      promptEn: "Hear it, build it: 'They say doumo (casual thanks).'",
    }),
    speaking(
      "ja-m21-6-2-speak-arigatou",
      "「ありがとうございます」と いいます",
      "They say 'arigatou gozaimasu.'",
    ),
    cloze(
      "ja-m21-6-2-cloze-to-2",
      "「すみません」",
      " いいます。",
      "と",
      ["と", "は", "を", "で"],
      "They say 'sumimasen.'",
      "「すみません」と いいます。",
      "と attaches the quoted phrase to the verb.",
    ),
    sentenceMcq({
      id: "ja-m21-6-2-mcq-nanto",
      prompt: "You want to ask 'What is this called?' Which is correct?",
      correctKana: "これは なんと いいますか。",
      distractorsKana: [
        "これは なにを いいますか。",
        "これは なんが いいますか。",
        "これは なんは いいますか。",
      ],
      explanation: "なんと = 'what' + quotation と. いいますか = 'is it called?'",
    }),
    // ── いかが + けっこう (polite offer + polite refusal) — backlog ──
    build(
      "ja-m21-6-2-build-ikaga",
      "Pick the Japanese word for: 'how about…?' (polite offer)",
      "いかが",
      ["いくら", "いかが", "どこ", "なに"],
      ["いかが"],
    ),
    listeningCompSentence({
      id: "ja-m21-6-2-lc-ikaga",
      audioText: "おちゃは いかがですか",
      correctMeaningEn: "How about some tea? (polite offer)",
      distractorsEn: [
        "How much is the tea?",
        "Where is the tea?",
        "Is the tea delicious?",
      ],
    }),
    build(
      "ja-m21-6-2-build-kekkou",
      "Pick the polite refusal: 'no thank you, I'm fine'",
      "けっこうです",
      ["ください", "けっこうです", "おねがいします", "どうぞ"],
      ["けっこうです"],
    ),
    listeningCompSentence({
      id: "ja-m21-6-2-lc-kekkou",
      audioText: "いいえ、けっこうです",
      correctMeaningEn: "No thank you, I'm fine.",
      distractorsEn: [
        "Yes, please.",
        "One more cup, please.",
        "It's delicious.",
      ],
    }),
    translateStep({
      id: "ja-m21-6-2-translate",
      promptEn: "They say 'arigatou.'",
      acceptedAnswers: [
        "「ありがとう」と いいます",
        "「ありがとう」と いいます。",
        "ありがとうと いいます",
        "ありがとうと いいます。",
      ],
      audioText: "「ありがとう」と いいます",
    }),
    selfExplain({
      id: "ja-m21-6-2-self-explain",
      anchorLabel: "You used で in: にほんごで なんと いいますか",
      anchorAudioText: "にほんごで なんと いいますか",
      question: "What role does で play here?",
      rule: { text: "で marks the means or context — 'in (the medium of) Japanese.'" },
      surface: { text: "で is always used before なんと." },
      distractor: { text: "で marks the place where Japanese is spoken." },
      ruleExplanation:
        "で marks the means/method/language: にほんごで = 'in Japanese.' This is the same で as in でんしゃで いきます (go by train).",
    }),
    speaking(
      "ja-m21-6-2-speak-nanto",
      "この たべものは にほんごで なんと いいますか",
      "What do you call this food in Japanese?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m21-6-2-rev-mcq-1", M21_6_2_REVIEW[0], M21_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m21-6-2-rev-lc-1",
      audioText: "かばんに おかねが あります",
      correctMeaningEn: "There is money in the bag.",
      distractorsEn: [
        "There is money in the room.",
        "There is no money in the bag.",
        "There is a key in the bag.",
      ],
      exercisedAtomKanas: ["おかね"],
    }),
    speaking("ja-m21-6-2-rev-speak-1", M21_6_2_REVIEW[2].kana, M21_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-6-2-rev", M21_6_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M21_6_2.steps);
assertAnswerRotation(M21_6_2.steps, 1);
assertNoConsecutiveSame(M21_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-STORY — ゆき's restaurant lunch (storyComprehension factory, §13.13)
//   Single-voice narrative + comprehension MCQs + response build.
//   Only previously-taught material (M21 + earlier modules).
// ═══════════════════════════════════════════════════════════════════════

export const M21_STORY: LessonContent = {
  id: "ja-m21-story",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — ゆき's restaurant lunch",
  description:
    "Listen to ゆき tell the story of her lunch at a restaurant — what she ate, drank, and said. Answer questions and reply to her.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m21-story",
      narrative: [
        { kana: "きのう、ともだちと レストランに いきました。" },
        { kana: "さかなや やさいを たべました。" },
        { kana: "おちゃを にはい のみました。" },
        { kana: "たべるまえに、「いただきます」と いいました。" },
        { kana: "ごはんは とても おいしかったです。" },
        { kana: "「ごちそうさまでした」と いいました。" },
        { kana: "また レストランに いきたいです。" },
      ],
      comprehensionQuestions: [
        {
          id: "q1",
          prompt: "What did ゆき eat?",
          correctText: "Fish and vegetables (among other things).",
          distractors: [
            "Meat and rice.",
            "Chicken and eggs.",
            "Only fish.",
          ],
          explanation:
            "さかなや やさいを たべました — や means the list is open (and other things).",
        },
        {
          id: "q2",
          prompt: "How many cups of tea did she drink?",
          correctText: "Two.",
          distractors: ["One.", "Three.", "Six."],
          explanation: "にはい = two cups. おちゃを にはい のみました.",
        },
        {
          id: "q3",
          prompt: "What did ゆき say after the meal?",
          correctText: "Gochisousama deshita.",
          distractors: ["Itadakimasu.", "Sumimasen.", "Onegai shimasu."],
          explanation:
            "「ごちそうさまでした」と いいました — said after eating ('It was a feast').",
        },
      ],
      responseBuild: {
        target: "わたしも いきたいです",
        tiles: ["いきたいです", "わたし", "たべたいです", "も"],
        correctOrder: ["わたし", "も", "いきたいです"],
        promptEn: "Reply to ゆき: 'I want to go too.'",
      },
      exercisedAtomKanas: ["さかな", "やさい", "おちゃ", "レストラン"],
    }),
    sentenceMcq({
      id: "ja-m21-story-mcq-summary",
      prompt: "In the story, what did ゆき say before eating?",
      correctKana: "いただきます",
      distractorsKana: ["ごちそうさまでした", "すみません", "おねがいします"],
      explanation: "いただきます is said before eating — 'I humbly receive.'",
    }),
    cloze(
      "ja-m21-story-cloze-ya",
      "さかな",
      " やさいを たべました。",
      "や",
      ["や", "と", "は", "を"],
      "I ate fish and vegetables (among other things).",
      "さかなや やさいを たべました。",
      "や — ゆき ate more than just fish and vegetables.",
    ),
    listeningCompSentence({
      id: "ja-m21-story-lc-oishii",
      audioText: "ごはんは とても おいしかったです",
      correctMeaningEn: "The meal was very delicious.",
      distractorsEn: [
        "The meal was very expensive.",
        "The meal is delicious. (now)",
        "The rice was a little cold.",
      ],
    }),
    speaking(
      "ja-m21-story-speak-mata",
      "また レストランに いきたいです",
      "I want to go to the restaurant again.",
    ),
  ],
};

assertNoConsecutiveSame(M21_STORY.steps);
assertPassiveCardsHaveFollowup(M21_STORY.steps);
assertNoExplanationOnPassive(M21_STORY.steps);
assertExplanationDoesntLeakAnswer(M21_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-7-1 — Mixed drill
//   (food + utensils + counters + や)
// ═══════════════════════════════════════════════════════════════════════

const M21_7_1_REVIEW = pickReviewAtoms("ja-m21-7-1-rev", M21_REVIEW_POOL, 6);

export const M21_7_1: LessonContent = {
  id: "ja-m21-7-1",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill",
  description:
    "All M21 grammar and vocab in one drill — food, utensils, counters, や, and と quotation.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    // ── Food + や ──
    cloze(
      "ja-m21-7-1-cloze-ya",
      "にく",
      " やさいを かいます。",
      "や",
      ["や", "と", "は", "を"],
      "I buy meat and vegetables (among other things).",
      "にくや やさいを かいます。",
      "や for an open list.",
    ),
    build(
      "ja-m21-7-1-build-sakana-ya",
      "Say: I eat fish and eggs (among other things).",
      "さかなや たまごを たべます",
      ["たべます", "かいます", "たまご", "と", "を", "さかな", "や"],
      ["さかな", "や", "たまご", "を", "たべます"],
    ),
    // ── Utensils ──
    sentenceMcq({
      id: "ja-m21-7-1-mcq-hashi",
      prompt: "Which sentence means 'Chopsticks and a fork, please.'?",
      correctKana: "はしと フォークを ください。",
      distractorsKana: [
        "はしや フォークを ください。",
        "スプーンと ナイフを ください。",
        "はしと フォークは ください。",
      ],
      explanation: "と for an exact list (just chopsticks and a fork). を ください = please give me.",
    }),
    listeningCompSentence({
      id: "ja-m21-7-1-lc-chawan",
      audioText: "ちゃわんを ください",
      correctMeaningEn: "A rice bowl, please.",
      distractorsEn: ["A plate, please.", "A cup, please.", "A glass, please."],
    }),
    // ── ほか (other / something else) — dining backlog ──
    build(
      "ja-m21-7-1-build-hoka",
      "Pick the Japanese word for: 'other / something else'",
      "ほか",
      ["これ", "ほか", "なに", "どこ"],
      ["ほか"],
    ),
    listeningCompSentence({
      id: "ja-m21-7-1-lc-hoka",
      audioText: "ほかに のみものは ありますか",
      correctMeaningEn: "Do you have any other drinks?",
      distractorsEn: [
        "Do you have any other food?",
        "How much is this drink?",
        "What is this drink called?",
      ],
    }),
    // ── Counter ──
    build(
      "ja-m21-7-1-build-ippai",
      "Say: Two cups of coffee, please.",
      "コーヒーを にはい ください",
      ["ください", "さんばい", "にはい", "を", "いっぱい", "コーヒー"],
      ["コーヒー", "を", "にはい", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m21-7-1-lb-sanbai",
      target: "ジュースを さんばい のみます",
      tiles: ["さんばい", "のみます", "ジュース", "を", "にはい"],
      correctOrder: ["ジュース", "を", "さんばい", "のみます"],
      promptEn: "Hear it, build it: 'I drink three glasses of juice.'",
    }),
    // ── Quotation ──
    build(
      "ja-m21-7-1-build-onegai",
      "Say: They say 'onegai shimasu.'",
      "「おねがいします」と いいます",
      ["と", "「おねがいします」", "いいます", "は", "を"],
      ["「おねがいします」", "と", "いいます"],
    ),
    cloze(
      "ja-m21-7-1-cloze-to",
      "「どうも」",
      " いいます。",
      "と",
      ["と", "は", "を", "が"],
      "They say 'doumo' (casual thanks).",
      "「どうも」と いいます。",
      "と marks the quotation.",
    ),
    // ── Mixed production ──
    listeningBuildSentence({
      id: "ja-m21-7-1-lb-pan-ya",
      target: "パンや くだものを かいます",
      tiles: ["くだもの", "や", "を", "かいます", "たべます", "と", "パン"],
      correctOrder: ["パン", "や", "くだもの", "を", "かいます"],
      promptEn: "Hear it, build it: 'I buy bread and fruit (among other things).'",
    }),
    speaking(
      "ja-m21-7-1-speak-order",
      "にくや さかなを ください",
      "Meat and fish (among other things), please.",
    ),
    sentenceMcq({
      id: "ja-m21-7-1-mcq-counter",
      prompt: "How do you say 'Three cups of tea, please.'?",
      correctKana: "おちゃを さんばい ください。",
      distractorsKana: [
        "おちゃを さんはい ください。",
        "おちゃを にはい ください。",
        "おちゃを いっぱい ください。",
      ],
      explanation: "3 cups = さんばい (irregular — ばい, not はい).",
    }),
    listeningCompSentence({
      id: "ja-m21-7-1-lc-banana-ya",
      audioText: "りんごや バナナを たべます",
      correctMeaningEn: "I eat apples and bananas (among other things).",
      distractorsEn: [
        "I eat only apples and bananas.",
        "I buy apples and bananas.",
        "I eat apples or bananas.",
      ],
    }),
    selfExplain({
      id: "ja-m21-7-1-self-explain",
      anchorLabel: "You used や, と, and the cup counter in this lesson",
      anchorAudioText: "にくや やさいを かいます",
      question: "When buying a mix of groceries, which fits better: や or と?",
      rule: { text: "や — because you're probably buying more than just the listed items." },
      surface: { text: "と — because you're combining two items." },
      distractor: { text: "They're always interchangeable." },
      ruleExplanation:
        "や = open list (and more). と = closed list (only these). Shopping naturally implies more items, so や is the better fit.",
    }),
    translateStep({
      id: "ja-m21-7-1-translate",
      promptEn: "Four cups of tea, please.",
      acceptedAnswers: [
        "おちゃを よんはい ください",
        "おちゃを よんはい ください。",
      ],
      audioText: "おちゃを よんはい ください",
    }),
    speaking(
      "ja-m21-7-1-speak-quote",
      "これは なんと いいますか",
      "What is this called?",
    ),
    // ── Review tail ──
    vocabMcq(
      "ja-m21-7-1-rev-mcq-1",
      M21_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!,
      M21_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m21-7-1-rev-lc-1",
      audioText: "コーヒーを さんばい のみました",
      correctMeaningEn: "I drank three cups of coffee.",
      distractorsEn: [
        "I drank two cups of coffee.",
        "I drank three cups of tea.",
        "I ate three apples.",
      ],
      exercisedAtomKanas: ["さん"],
    }),
    reviewMatchPairs("ja-m21-7-1-rev", M21_7_1_REVIEW),
    // Coverage backfill — full-spine atom re-exposure gate (retrospective §4 Gate 4).
    speaking("ja-m21-7-1-cov-nomimono", "つめたい のみもの", "a cold drink"),
    speaking("ja-m21-7-1-cov-hoka", "ほかの ひと", "another person"),
  ],
};

assertNoSameAnswerCluster(M21_7_1.steps);
assertAnswerRotation(M21_7_1.steps, 1);
assertNoConsecutiveSame(M21_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M21-7-2 — Food production
//   (translate + speaking heavy)
// ═══════════════════════════════════════════════════════════════════════

const M21_7_2_REVIEW = pickReviewAtoms("ja-m21-7-2-rev", M21_REVIEW_POOL, 6);

export const M21_7_2: LessonContent = {
  id: "ja-m21-7-2",
  moduleId: "m21",
  courseId: COURSE,
  languageId: LANG,
  title: "Production",
  description:
    "Heavy production practice — translate, build, and speak with all M21 food and restaurant grammar.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    build(
      "ja-m21-7-2-build-1",
      "Say: I buy lunch boxes and bread (among other things).",
      "おべんとうや パンを かいます",
      ["パン", "かいます", "おべんとう", "や", "を", "と"],
      ["おべんとう", "や", "パン", "を", "かいます"],
    ),
    speaking(
      "ja-m21-7-2-speak-1",
      "やさいや ごはんを たべます",
      "I eat vegetables and rice (among other things).",
    ),
    listeningCompSentence({
      id: "ja-m21-7-2-lc-1",
      audioText: "おちゃを さんばい のみました",
      correctMeaningEn: "I drank three cups of tea.",
      distractorsEn: [
        "I drank two cups of tea.",
        "I drank three glasses of juice.",
        "I drank one cup of tea.",
      ],
    }),
    build(
      "ja-m21-7-2-build-2",
      "Say: A spoon and chopsticks, please.",
      "スプーンと はしを ください",
      ["はし", "スプーン", "ください", "と", "を", "や", "フォーク"],
      ["スプーン", "と", "はし", "を", "ください"],
    ),
    sentenceMcq({
      id: "ja-m21-7-2-mcq-1",
      prompt: "Which sentence means 'I buy eggs and bread (among other things).'?",
      correctKana: "たまごや パンを かいます。",
      distractorsKana: [
        "たまごと パンを かいます。",
        "たまごや パンを たべます。",
        "にくや パンを かいます。",
      ],
      explanation: "や = open list. かいます = buy.",
    }),
    speaking(
      "ja-m21-7-2-speak-2",
      "コーヒーは いかがですか",
      "How about some coffee?",
    ),
    build(
      "ja-m21-7-2-build-3",
      "Say: They say 'gochisousama deshita.'",
      "「ごちそうさまでした」と いいます",
      ["は", "「ごちそうさまでした」", "いいます", "を", "と"],
      ["「ごちそうさまでした」", "と", "いいます"],
    ),
    listeningBuildSentence({
      id: "ja-m21-7-2-lb-1",
      target: "はしや スプーンを ください",
      tiles: ["と", "や", "を", "はし", "ください", "フォーク", "スプーン"],
      correctOrder: ["はし", "や", "スプーン", "を", "ください"],
      promptEn: "Hear it, build it: 'Chopsticks and a spoon (among other things), please.'",
    }),
    cloze(
      "ja-m21-7-2-cloze-ya",
      "くだもの",
      " やさいを かいます。",
      "や",
      ["や", "と", "は", "を"],
      "I buy fruit and vegetables (among other things).",
      "くだものや やさいを かいます。",
      "や for an open list.",
    ),
    speaking(
      "ja-m21-7-2-speak-3",
      "「おねがいします」と いいます",
      "They say 'onegai shimasu.'",
    ),
    build(
      "ja-m21-7-2-build-4",
      "Say: Two cups of milk, please.",
      "ぎゅうにゅうを にはい ください",
      ["いっぱい", "ください", "ぎゅうにゅう", "を", "さんばい", "にはい"],
      ["ぎゅうにゅう", "を", "にはい", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m21-7-2-lc-2",
      audioText: "りんごや みかんを たべます",
      correctMeaningEn: "I eat apples and mandarins (among other things).",
      distractorsEn: [
        "I eat only apples and mandarins.",
        "I buy apples and mandarins.",
        "I eat apples or mandarins.",
      ],
    }),
    // ── ちょうど (exactly) — dining backlog ──
    build(
      "ja-m21-7-2-build-choudo",
      "Pick the Japanese word for: 'exactly / just'",
      "ちょうど",
      ["とても", "ちょうど", "たくさん", "すこし"],
      ["ちょうど"],
    ),
    listeningCompSentence({
      id: "ja-m21-7-2-lc-choudo",
      audioText: "ちょうど せんえんです",
      correctMeaningEn: "It's exactly 1,000 yen.",
      distractorsEn: [
        "It's about 1,000 yen.",
        "It's exactly 100 yen.",
        "It's 3,000 yen.",
      ],
    }),
    cloze(
      "ja-m21-7-2-cloze-to",
      "「ありがとう」",
      " いいます。",
      "と",
      ["と", "は", "を", "が"],
      "They say 'arigatou.'",
      "「ありがとう」と いいます。",
      "と marks the quoted phrase.",
    ),
    selfExplain({
      id: "ja-m21-7-2-self-explain",
      anchorLabel: "You've used や, と (quotation and listing), counters, and food vocab",
      anchorAudioText: "おべんとうや パンを かいます",
      question: "The と in 「いただきます」と いいます — is it the same と as in パンと にく?",
      rule: { text: "No — the first と is quotation ('they say…'); the second と means 'and' (listing two items)." },
      surface: { text: "Yes — both mean 'and.'" },
      distractor: { text: "No — the first と is a particle; the second と is a conjunction." },
      ruleExplanation:
        "Japanese と has multiple uses. Quotation と connects a phrase to a verb of saying. Listing と connects nouns exhaustively. Same particle, different function.",
    }),
    translateStep({
      id: "ja-m21-7-2-translate",
      promptEn: "Bread and eggs (among other things), please.",
      acceptedAnswers: [
        "パンや たまごを ください",
        "パンや たまごを ください。",
      ],
      audioText: "パンや たまごを ください",
    }),
    speaking(
      "ja-m21-7-2-speak-4",
      "ナイフと フォークを ください",
      "A knife and a fork, please.",
    ),
    // ── Review tail ──
    vocabMcq(
      "ja-m21-7-2-rev-mcq-1",
      M21_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!,
      M21_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m21-7-2-rev-lc-1",
      audioText: M21_7_2_REVIEW[1].kana,
      correctMeaningEn: M21_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M21_7_2_REVIEW[2].meaningEn,
        M21_7_2_REVIEW[3].meaningEn,
        M21_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m21-7-2-rev-speak-1", M21_7_2_REVIEW[2].kana, M21_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m21-7-2-rev", M21_7_2_REVIEW),
    // Coverage backfill — full-spine atom re-exposure gate (retrospective §4 Gate 4).
    speaking("ja-m21-7-2-cov-choudo", "ちょうど いいです", "It is just right."),
    speaking("ja-m21-7-2-cov-kekkou", "けっこう たかいです", "It is quite expensive."),
  ],
};

assertNoSameAnswerCluster(M21_7_2.steps);
assertAnswerRotation(M21_7_2.steps, 1);
assertNoConsecutiveSame(M21_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M21 = [
  M21_1_1, M21_1_2, M21_2_1, M21_2_2, M21_3_1, M21_3_2,
  M21_4_1, M21_4_2, M21_5_1, M21_5_2, M21_6_1, M21_6_2,
  M21_STORY, M21_7_1, M21_7_2,
];

assertNoSameAnswerCluster(ALL_M21.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M21) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
