/**
 * M16 — Te-form Part 2 (Prohibition + Sequence + すき/きらい).
 *
 * M16 introduces:
 *   - 〜てはいけません (prohibition): "you must not…"
 *   - 〜ないでください (negative request): "please don't…"
 *   - 〜てから (after doing): time sequence
 *   - すき/きらい + のが (like/dislike doing)
 *
 * Prereqs: て-form (M14), ている (M15), てもいい (M15), ない-form (M11).
 *
 * Split into 14 sub-lessons + 1 story = 15 exports. The story lesson uses the
 * storyComprehension() factory (§13.13 locked template).
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * Backlog weave (2026-06-12 sentence-variety rewrite): さきに (first/before —
 * taught ja-m16-3-2, reused 6-1 + story) and この へん (this area — taught
 * ja-m16-5-2, reused 6-2 + 7-1). ところ deferred (no natural carrier here).
 *
 * Key teaching points:
 *   - てはいけません is the OPPOSITE of てもいい (M15)
 *   - ないでください uses ない-form (M11) + でください
 *   - てから = "after doing A, do B" time sequence
 *   - のがすき: nominalize with の + が marks what is liked
 *
 * ID scheme: ja-m16-{n}-{sub} e.g. ja-m16-1-1, ja-m16-1-2
 * Export names: M16_1_1, M16_1_2, M16_2_1, M16_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m16-1, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
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
const M16_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_TE_WA_IKEMASEN = grammarRule({
  id: "ja-m16-rule-te-wa-ikemasen",
  grammarPointId: "te-wa-ikemasen",
  title: "〜てはいけません — you must not",
  rule:
    "To express prohibition ('you must not'), take the て-form and add はいけません. This is the opposite of てもいいです (permission). てもいい = you may; てはいけません = you must not.",
  examples: [
    {
      ja: "ここで たばこを すってはいけません。",
      romaji: "koko de tabako o sutte wa ikemasen.",
      en: "You must not smoke here.",
    },
    {
      ja: "しゃしんを とってはいけません。",
      romaji: "shashin o totte wa ikemasen.",
      en: "You must not take photos.",
    },
    {
      ja: "ここに すわってはいけません。",
      romaji: "koko ni suwatte wa ikemasen.",
      en: "You must not sit here.",
    },
  ],
  antiPattern: {
    ja: "すわるはいけません。",
    romaji: "suwaru wa ikemasen.",
    en: "(broken — must use て-form, not dictionary form)",
    why: "The prohibition pattern requires the て-form: すわって + はいけません. Using the dictionary form すわる is ungrammatical here.",
  },
  cultureNote:
    "てもいい (you may) and てはいけません (you must not) are a pair. Signs in Japan often use てはいけません or the shorter casual form てはだめ.",
});

const RULE_NAIDE_KUDASAI = grammarRule({
  id: "ja-m16-rule-naide-kudasai",
  grammarPointId: "naide-kudasai",
  title: "〜ないでください — please don't",
  rule:
    "To make a negative request ('please don't'), take the ない-form of the verb (M11) and add でください. This is softer than てはいけません — a polite request rather than a strict prohibition.",
  examples: [
    {
      ja: "さわらないでください。",
      romaji: "sawaranaide kudasai.",
      en: "Please don't touch.",
    },
    {
      ja: "ここに くるまを とめないでください。",
      romaji: "koko ni kuruma o tomenaide kudasai.",
      en: "Please don't park your car here.",
    },
    {
      ja: "たべないでください。",
      romaji: "tabenaide kudasai.",
      en: "Please don't eat.",
    },
  ],
  antiPattern: {
    ja: "さわらないください。",
    romaji: "sawaranai kudasai.",
    en: "(broken — missing で between ない and ください)",
    why: "The pattern is ない + で + ください. The で is essential — without it the sentence is ungrammatical.",
  },
  cultureNote:
    "ないでください is a polite request. In everyday speech, friends might shorten it to ないで ('don't,' casual).",
});

const RULE_TE_KARA = grammarRule({
  id: "ja-m16-rule-te-kara",
  grammarPointId: "te-kara",
  title: "〜てから — after doing",
  rule:
    "て-form + から establishes a time sequence: 'after doing A, do B.' The first action must be completed before the second begins.",
  examples: [
    {
      ja: "しゅくだいを してから、テレビを みます。",
      romaji: "shukudai o shite kara, terebi o mimasu.",
      en: "After doing homework, I watch TV.",
    },
    {
      ja: "てを あらってから、たべます。",
      romaji: "te o aratte kara, tabemasu.",
      en: "After washing my hands, I eat.",
    },
    {
      ja: "うちに かえってから、べんきょうします。",
      romaji: "uchi ni kaette kara, benkyou shimasu.",
      en: "After going home, I study.",
    },
  ],
  antiPattern: {
    ja: "しゅくだいを するから、テレビを みます。",
    romaji: "shukudai o suru kara, terebi o mimasu.",
    en: "(wrong meaning — する + から = 'because I do homework')",
    why: "Without the て-form, から means 'because,' not 'after.' You need the て-form: して + から = 'after doing.'",
  },
  cultureNote:
    "てから emphasizes strict sequence — A must finish before B starts. For looser sequence ('and then'), て alone works.",
});

const RULE_NO_GA_SUKI = grammarRule({
  id: "ja-m16-rule-no-ga-suki",
  grammarPointId: "suki-kirai-no",
  title: "〜のがすき / きらい — like/dislike doing",
  rule:
    "To say you like or dislike DOING something, nominalize the verb with の and mark it with が: [verb dictionary form] + のが + すき/きらい + です. The の turns the verb into a noun phrase ('the act of doing').",
  examples: [
    {
      ja: "りょうりを するのが すきです。",
      romaji: "ryouri o suru no ga suki desu.",
      en: "I like cooking.",
    },
    {
      ja: "べんきょうするのが きらいです。",
      romaji: "benkyou suru no ga kirai desu.",
      en: "I dislike studying.",
    },
    {
      ja: "おんがくを きくのが すきです。",
      romaji: "ongaku o kiku no ga suki desu.",
      en: "I like listening to music.",
    },
  ],
  antiPattern: {
    ja: "りょうりを するが すきです。",
    romaji: "ryouri o suru ga suki desu.",
    en: "(broken — missing の nominalizer)",
    why: "Without の, the verb can't be the subject of すき. の turns the verb phrase into a noun: するの = 'the act of doing.'",
  },
  cultureNote:
    "すき and きらい are な-adjectives, not verbs. That's why the thing liked/disliked takes が, not を.",
});

// ═══════════════════════════════════════════════════════════════════════
// M16-1-1 — "You must not" (てはいけません intro)
// ═══════════════════════════════════════════════════════════════════════

const M16_1_1_REVIEW = pickReviewAtoms("ja-m16-1-1-rev", M16_REVIEW_POOL, 6);

export const M16_1_1: LessonContent = {
  id: "ja-m16-1-1",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "You must not (intro)",
  description:
    "Prohibition with てはいけません + vocab: すわる, さわる, すう.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m16-1-1-info-open",
      "Rules and prohibitions",
      "You know てもいい (you may). Now the opposite: てはいけません — you must not. Three new verbs set the stage.",
    ),
    RULE_TE_WA_IKEMASEN,
    // ── すわる (sit) ──
    build(
      "ja-m16-1-1-build-suwaru",
      "Pick the Japanese word for: Sit",
      "すわる",
      ["さわる", "すう", "すわる", "とめる"],
      ["すわる"],
    ),
    listeningCompSentence({
      id: "ja-m16-1-1-lc-suwaru",
      audioText: "そこに すわってはいけません",
      correctMeaningEn: "You must not sit there.",
      distractorsEn: [
        "You may sit there.",
        "Please sit there.",
        "You must not smoke there.",
      ],
    }),
    // ── さわる (touch) ──
    build(
      "ja-m16-1-1-build-sawaru",
      "Pick the Japanese word for: Touch",
      "さわる",
      ["すわる", "さわる", "すう", "かえる"],
      ["さわる"],
    ),
    speaking("ja-m16-1-1-speak-sawaru", "さわる", "Touch"),
    // ── すう (smoke/inhale) ──
    build(
      "ja-m16-1-1-build-suu",
      "Pick the Japanese word for: Smoke/Inhale",
      "すう",
      ["すわる", "すう", "さわる", "あらう"],
      ["すう"],
    ),
    listeningCompSentence({
      id: "ja-m16-1-1-lc-suu",
      audioText: "でんしゃで たばこを すってはいけません",
      correctMeaningEn: "You must not smoke on the train.",
      distractorsEn: [
        "You may smoke on the train.",
        "You must not eat on the train.",
        "Please smoke outside.",
      ],
    }),
    // ── てはいけません drills ──
    build(
      "ja-m16-1-1-build-suwatte",
      "Say: You must not sit here.",
      "ここに すわってはいけません",
      ["すわって", "てもいいです", "ここ", "はいけません", "に", "さわって"],
      ["ここ", "に", "すわって", "はいけません"],
    ),
    cloze(
      "ja-m16-1-1-cloze-1",
      "たばこを すって",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "ください", "から"],
      "You must not smoke.",
      "たばこを すってはいけません。",
      "て + はいけません = prohibition. The opposite of てもいいです.",
    ),
    sentenceMcq({
      id: "ja-m16-1-1-mcq-sawatte",
      prompt: "Which sentence means 'You must not touch.'?",
      correctKana: "さわってはいけません。",
      distractorsKana: [
        "さわってもいいです。",
        "さわってください。",
        "さわりません。",
      ],
      explanation: "さわって + はいけません = you must not touch.",
    }),
    listeningCompSentence({
      id: "ja-m16-1-1-lc-ikemasen",
      audioText: "ここで たばこを すってはいけません",
      correctMeaningEn: "You must not smoke here.",
      distractorsEn: [
        "You may smoke here.",
        "Please don't smoke here.",
        "I smoke here.",
      ],
    }),
    cloze(
      "ja-m16-1-1-cloze-2",
      "そこに ",
      "はいけません。",
      "すわって",
      ["すわって", "さわって", "すって", "とめて"],
      "You must not sit there.",
      "そこに すわってはいけません。",
      "すわる → te-form すわって + はいけません.",
    ),
    selfExplain({
      id: "ja-m16-1-1-self",
      anchorLabel: "すってはいけません (must not smoke)",
      anchorAudioText: "ここで たばこを すってはいけません",
      question: "How is てはいけません different from てもいいです?",
      rule: { text: "てもいいです grants permission ('you may'). てはいけません states prohibition ('you must not'). They are opposites built on the same て-form." },
      surface: { text: "てはいけません is the past tense of てもいいです." },
      distractor: { text: "てはいけません is for strangers; てもいいです is for friends." },
      ruleExplanation: "Permission pair: て + もいい = you may. て + はいけません = you must not. Same verb, opposite meaning.",
    }),
    speaking(
      "ja-m16-1-1-speak-ikemasen",
      "さわってはいけません",
      "You must not touch.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m16-1-1-rev-mcq-1", M16_1_1_REVIEW[0], M16_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m16-1-1-rev-lc-1",
      // Sentence-level review of たべます (M7) — 2026-07-12 listening backfill.
      audioText: "レストランで すしを たべます",
      correctMeaningEn: "I eat sushi at a restaurant.",
      distractorsEn: [
        "I make sushi at a restaurant.",
        "I eat ramen at a restaurant.",
        "I ate sushi at a restaurant.",
      ],
    }),
    speaking("ja-m16-1-1-rev-speak-1", M16_1_1_REVIEW[2].kana, M16_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m16-1-1-rev", M16_1_1_REVIEW),
    infoStep(
      "ja-m16-1-1-info-end",
      "You can now say what people must not do",
      "てはいけません — the prohibition form. すわる, さわる, すう: three verbs locked into the pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_1_1.steps);
assertAnswerRotation(M16_1_1.steps, 1);
assertNoConsecutiveSame(M16_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-1-2 — "You must not" (てはいけません drill)
// ═══════════════════════════════════════════════════════════════════════

const M16_1_2_REVIEW = pickReviewAtoms("ja-m16-1-2-rev", M16_REVIEW_POOL, 6);

export const M16_1_2: LessonContent = {
  id: "ja-m16-1-2",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "You must not (practice)",
  description:
    "Drill てはいけません with new context verbs: とめる, はいる.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m16-1-2-info-open",
      "More prohibitions",
      "Parking, entering, sitting — eight drills to make てはいけません automatic.",
    ),
    // ── とめる (stop/park) ──
    build(
      "ja-m16-1-2-build-tomeru",
      "Pick the Japanese word for: Park / Stop",
      "とめる",
      ["すわる", "とめる", "さわる", "はいる"],
      ["とめる"],
    ),
    listeningCompSentence({
      id: "ja-m16-1-2-lc-tomeru",
      audioText: "くるまを とめる",
      correctMeaningEn: "park the car",
      distractorsEn: ["touch the car", "sit in the car", "wash the car"],
    }),
    // ── Prohibition drills ──
    cloze(
      "ja-m16-1-2-cloze-1",
      "ここに くるまを とめて",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "ください", "から"],
      "You must not park your car here.",
      "ここに くるまを とめてはいけません。",
      "とめて + はいけません = prohibition on parking.",
    ),
    build(
      "ja-m16-1-2-build-hairu",
      "Pick the Japanese word for: Enter",
      "はいる",
      ["とめる", "はいる", "すわる", "かえる"],
      ["はいる"],
    ),
    sentenceMcq({
      id: "ja-m16-1-2-mcq-hairu",
      prompt: "Which sentence means 'You must not enter.'?",
      correctKana: "はいってはいけません。",
      distractorsKana: [
        "はいってもいいです。",
        "はいってください。",
        "はいらないでください。",
      ],
      explanation: "はいって + はいけません = you must not enter.",
    }),
    cloze(
      "ja-m16-1-2-cloze-2",
      "きょうしつで たべて",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "から", "ください"],
      "You must not eat in the classroom.",
      "きょうしつで たべてはいけません。",
      "て + はいけません prohibits eating in the classroom.",
    ),
    listeningBuildSentence({
      id: "ja-m16-1-2-lb-1",
      target: "えきの まえに とめてはいけません",
      tiles: ["とめて", "えき", "はいけません", "の", "まえ", "に", "もいいです"],
      correctOrder: ["えき", "の", "まえ", "に", "とめて", "はいけません"],
      promptEn: "Hear it, build it: 'You must not park in front of the station.'",
    }),
    build(
      "ja-m16-1-2-build-shashin",
      "Say: You must not take photos.",
      "しゃしんを とってはいけません",
      ["とって", "しゃしん", "はいけません", "を", "もいいです", "ください"],
      ["しゃしん", "を", "とって", "はいけません"],
    ),
    sentenceMcq({
      id: "ja-m16-1-2-mcq-discrimination",
      prompt: "Which means 'You may sit here.'? (NOT prohibition!)",
      correctKana: "ここに すわってもいいです。",
      distractorsKana: [
        "そこに すわってもいいです。",
        "ここに すわらないでください。",
        "ここに すわってください。",
      ],
      explanation: "てもいいです = you may (permission). てはいけません = you must not.",
    }),
    listeningCompSentence({
      id: "ja-m16-1-2-lc-shashin",
      audioText: "でんしゃで たべてはいけません",
      correctMeaningEn: "You must not eat on the train.",
      distractorsEn: [
        "You may eat on the train.",
        "Please eat on the train.",
        "I eat on the train.",
      ],
    }),
    cloze(
      "ja-m16-1-2-cloze-3",
      "じむしょに ",
      "はいけません。",
      "はいって",
      ["はいって", "すわって", "とめて", "さわって"],
      "You must not enter the office.",
      "じむしょに はいってはいけません。",
      "はいる → te-form はいって + はいけません.",
    ),
    translateStep({
      id: "ja-m16-1-2-translate",
      promptEn: "You must not smoke at the station.",
      acceptedAnswers: [
        "えきで たばこを すってはいけません",
        "えきで たばこを すってはいけません。",
      ],
      audioText: "えきで たばこを すってはいけません",
    }),
    selfExplain({
      id: "ja-m16-1-2-self",
      anchorLabel: "とめてはいけません (must not park)",
      anchorAudioText: "くるまを とめてはいけません",
      question: "Why do we use the て-form before はいけません?",
      rule: { text: "はいけません attaches to the て-form of a verb. The て-form acts as the connector between the verb and the prohibition ending." },
      surface: { text: "You can use any verb form before はいけません — て-form, dictionary, or ます-form." },
      distractor: { text: "はいけません contains its own verb ending so it only works with nouns, not verbs." },
      ruleExplanation: "The pattern is always [verb て-form] + はいけません. Dictionary form or ます-form before はいけません is ungrammatical.",
    }),
    speaking(
      "ja-m16-1-2-speak",
      "ここに はいってはいけません",
      "You must not enter here.",
    ),
    // ── Review tail ──
    speaking("ja-m16-1-2-rev-speak-1", M16_1_2_REVIEW[0].kana, M16_1_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m16-1-2-rev-lc-1",
      // Sentence-level review of みます (M7) — 2026-07-12 listening backfill.
      audioText: "ともだちと えいがを みます",
      correctMeaningEn: "I watch a movie with a friend.",
      distractorsEn: [
        "I watch a movie with my father.",
        "I watch TV with a friend.",
        "I watched a movie with a friend.",
      ],
    }),
    vocabMcq("ja-m16-1-2-rev-mcq-1", M16_1_2_REVIEW[2], M16_REVIEW_POOL),
    reviewMatchPairs("ja-m16-1-2-rev", M16_1_2_REVIEW),
    infoStep(
      "ja-m16-1-2-info-end",
      "You can prohibit actions confidently",
      "てはいけません is drilled — parking, entering, smoking, touching. You know the rules.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_1_2.steps);
assertAnswerRotation(M16_1_2.steps, 1);
assertNoConsecutiveSame(M16_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-2-1 — "Please don't" (ないでください intro)
// ═══════════════════════════════════════════════════════════════════════

const M16_2_1_REVIEW = pickReviewAtoms("ja-m16-2-1-rev", M16_REVIEW_POOL, 6);

export const M16_2_1: LessonContent = {
  id: "ja-m16-2-1",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Please don't (intro)",
  description:
    "Negative requests with ないでください — softer than prohibition.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m16-2-1-info-open",
      "Polite negative requests",
      "てはいけません is strict. Now the softer cousin: ないでください — 'please don't.' It uses the ない-form you learned in M11.",
    ),
    RULE_NAIDE_KUDASAI,
    // ── Drill: ないでください ──
    build(
      "ja-m16-2-1-build-sawara",
      "Say: Please don't touch.",
      "さわらないでください",
      ["ください", "さわって", "さわらないで", "はいけません"],
      ["さわらないで", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m16-2-1-lc-sawara",
      audioText: "いぬに さわらないでください",
      correctMeaningEn: "Please don't touch the dog.",
      distractorsEn: [
        "You must not touch the dog.",
        "Please touch the dog.",
        "I don't touch dogs.",
      ],
    }),
    sentenceMcq({
      id: "ja-m16-2-1-mcq-taberu",
      prompt: "Which sentence means 'Please don't eat.'?",
      correctKana: "たべないでください。",
      distractorsKana: [
        "たべてはいけません。",
        "たべてください。",
        "たべません。",
      ],
      explanation: "たべない + でください = please don't eat.",
    }),
    cloze(
      "ja-m16-2-1-cloze-1",
      "ここで たばこを すわ",
      "ください。",
      "ないで",
      ["ないで", "って", "らないで", "ないと"],
      "Please don't smoke here.",
      "ここで たばこを すわないでください。",
      "すう → ない-form すわない + でください.",
    ),
    build(
      "ja-m16-2-1-build-hairanaide",
      "Say: Please don't enter.",
      "はいらないでください",
      ["はいって", "ください", "はいらないで", "はいけません"],
      ["はいらないで", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m16-2-1-lb-sawara",
      target: "テレビを みないでください",
      tiles: ["みないで", "テレビ", "ください", "を", "みて", "はいけません"],
      correctOrder: ["テレビ", "を", "みないで", "ください"],
      promptEn: "Hear it, build it: 'Please don't watch TV.'",
    }),
    cloze(
      "ja-m16-2-1-cloze-2",
      "しゃしんを ",
      "でください。",
      "とらないで",
      ["とらないで", "とって", "さわらない", "はいらない"],
      "Please don't take photos.",
      "しゃしんを とらないでください。",
      "とる → ない-form とらない + でください.",
    ),
    sentenceMcq({
      id: "ja-m16-2-1-mcq-diff",
      prompt: "Which is a POLITE REQUEST (not a strict prohibition)?",
      correctKana: "すわらないでください。",
      distractorsKana: [
        "すわってはいけません。",
        "すわってください。",
        "すわりません。",
      ],
      explanation: "ないでください = polite request ('please don't'). てはいけません = strict prohibition ('you must not').",
    }),
    build(
      "ja-m16-2-1-build-tomenaide",
      "Say: Please don't park here.",
      "ここに とめないでください",
      ["とめて", "ここ", "ください", "に", "とめないで", "はいけません"],
      ["ここ", "に", "とめないで", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m16-2-1-lc-tomenaide",
      audioText: "ここに くるまを とめないでください",
      correctMeaningEn: "Please don't park your car here.",
      distractorsEn: [
        "You must not park here.",
        "Please park here.",
        "I don't park here.",
      ],
    }),
    cloze(
      "ja-m16-2-1-cloze-3",
      "いま はいら",
      "ください。",
      "ないで",
      ["ないで", "って", "なくて", "ないと"],
      "Please don't enter right now.",
      "いま はいらないでください。",
      "はいる → はいらない + でください.",
    ),
    selfExplain({
      id: "ja-m16-2-1-self",
      anchorLabel: "さわらないでください (please don't touch)",
      anchorAudioText: "いぬに さわらないでください",
      question: "Why ないで instead of なくて before ください?",
      rule: { text: "For negative requests, the pattern is [ない-form] + で + ください. なくて is the te-form of ない used for linking sentences — it cannot form a request." },
      surface: { text: "なくてください and ないでください mean the same thing." },
      distractor: { text: "ないで is casual and なくて is polite — both work with ください." },
      ruleExplanation: "Negative request = ないでください (fixed pattern). なくて links clauses ('without doing,' 'because not') — different function entirely.",
    }),
    speaking(
      "ja-m16-2-1-speak",
      "さわらないでください",
      "Please don't touch.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m16-2-1-rev-mcq-1", M16_2_1_REVIEW[0], M16_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m16-2-1-rev-lc-1",
      // Sentence-level review of じてんしゃ (M4) — 2026-07-12 listening backfill.
      audioText: "じてんしゃが ほしいです",
      correctMeaningEn: "I want a bicycle.",
      distractorsEn: [
        "I want a car.",
        "I have a bicycle.",
        "I bought a bicycle.",
      ],
    }),
    speaking("ja-m16-2-1-rev-speak-1", M16_2_1_REVIEW[2].kana, M16_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m16-2-1-rev", M16_2_1_REVIEW),
    infoStep(
      "ja-m16-2-1-info-end",
      "You can now make polite negative requests",
      "ないでください — please don't touch, enter, park, or take photos. Softer than てはいけません.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_2_1.steps);
assertAnswerRotation(M16_2_1.steps, 1);
assertNoConsecutiveSame(M16_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-2-2 — "Please don't" (ないでください drill)
// ═══════════════════════════════════════════════════════════════════════

const M16_2_2_REVIEW = pickReviewAtoms("ja-m16-2-2-rev", M16_REVIEW_POOL, 6);

export const M16_2_2: LessonContent = {
  id: "ja-m16-2-2",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Please don't (practice)",
  description:
    "Extended ないでください drill with prohibition contrast.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m16-2-2-info-open",
      "Don't vs must not",
      "More ないでください drills — and contrasting with てはいけません to build discrimination.",
    ),
    // ── Drill block ──
    cloze(
      "ja-m16-2-2-cloze-1",
      "ここで すわら",
      "ください。",
      "ないで",
      ["ないで", "って", "ないと", "なくて"],
      "Please don't sit here.",
      "ここで すわらないでください。",
      "すわる → すわらない + でください.",
    ),
    build(
      "ja-m16-2-2-build-1",
      "Say: Please don't eat in the classroom.",
      "きょうしつで たべないでください",
      ["たべないで", "きょうしつ", "ください", "で", "たべて", "はいけません"],
      ["きょうしつ", "で", "たべないで", "ください"],
    ),
    sentenceMcq({
      id: "ja-m16-2-2-mcq-1",
      prompt: "Which is a polite request to not smoke?",
      correctKana: "たばこを すわないでください。",
      distractorsKana: [
        "たばこを すってはいけません。",
        "たばこを すってください。",
        "たばこを すいません。",
      ],
      explanation: "ないでください = polite request. てはいけません = strict prohibition.",
    }),
    listeningCompSentence({
      id: "ja-m16-2-2-lc-1",
      audioText: "としょかんで たべないでください",
      correctMeaningEn: "Please don't eat in the library.",
      distractorsEn: [
        "You must not eat in the library.",
        "Please eat in the library.",
        "I don't eat in the library.",
      ],
    }),
    cloze(
      "ja-m16-2-2-cloze-2",
      "エレベーターで たばこを すって",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "ください", "から"],
      "You must not smoke in the elevator.",
      "エレベーターで たばこを すってはいけません。",
      "Strict prohibition context → てはいけません.",
    ),
    build(
      "ja-m16-2-2-build-2",
      "Say: Please don't touch that.",
      "それに さわらないでください",
      ["さわって", "それ", "ください", "に", "さわらないで"],
      ["それ", "に", "さわらないで", "ください"],
    ),
    listeningBuildSentence({
      id: "ja-m16-2-2-lb-1",
      target: "ここで あそばないでください",
      tiles: ["あそんで", "ここ", "ください", "で", "あそばないで", "はいけません"],
      correctOrder: ["ここ", "で", "あそばないで", "ください"],
      promptEn: "Hear it, build it: 'Please don't play here.'",
    }),
    sentenceMcq({
      id: "ja-m16-2-2-mcq-2",
      prompt: "Which expresses a STRICT RULE (prohibition)?",
      correctKana: "はいってはいけません。",
      distractorsKana: [
        "はいらないでください。",
        "はいってください。",
        "はいりません。",
      ],
      explanation: "てはいけません = strict rule / prohibition. ないでください = polite request.",
    }),
    cloze(
      "ja-m16-2-2-cloze-3",
      "わたしの コーヒーを のま",
      "ください。",
      "ないで",
      ["ないで", "って", "なくて", "ないと"],
      "Please don't drink my coffee.",
      "わたしの コーヒーを のまないでください。",
      "のむ → のまない + でください.",
    ),
    listeningCompSentence({
      id: "ja-m16-2-2-lc-2",
      audioText: "じむしょに はいらないでください",
      correctMeaningEn: "Please don't enter the office.",
      distractorsEn: [
        "You must not enter the office.",
        "Please enter the office.",
        "I didn't enter the office.",
      ],
    }),
    build(
      "ja-m16-2-2-build-3",
      "Say: You must not enter the classroom.",
      "きょうしつに はいってはいけません",
      ["はいって", "きょうしつ", "はいけません", "に", "はいらないで", "ください"],
      ["きょうしつ", "に", "はいって", "はいけません"],
    ),
    translateStep({
      id: "ja-m16-2-2-translate",
      promptEn: "Please don't drink the water.",
      acceptedAnswers: [
        "みずを のまないでください",
        "みずを のまないでください。",
      ],
      audioText: "みずを のまないでください",
    }),
    selfExplain({
      id: "ja-m16-2-2-self",
      anchorLabel: "ないでください vs てはいけません",
      anchorAudioText: "としょかんで たべないでください",
      question: "When would you use ないでください instead of てはいけません?",
      rule: { text: "ないでください is a polite request — asking someone to please refrain. てはいけません is a strict prohibition — stating a rule. Use ないでください for person-to-person requests; てはいけません for rules and signs." },
      surface: { text: "They mean the same thing — pick whichever sounds better." },
      distractor: { text: "ないでください is for negative actions; てはいけません is for positive actions." },
      ruleExplanation: "ないでください = 'please don't' (request to a person). てはいけません = 'you must not' (rule/prohibition). Different politeness and authority levels.",
    }),
    speaking(
      "ja-m16-2-2-speak",
      "たべないでください",
      "Please don't eat.",
    ),
    // ── Review tail ──
    speaking("ja-m16-2-2-rev-speak-1", M16_2_2_REVIEW[0].kana, M16_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m16-2-2-rev-lc-1",
      // Sentence-level review of みず (M3) — 2026-07-12 listening backfill.
      audioText: "つめたい みずを のみます",
      correctMeaningEn: "I drink cold water.",
      distractorsEn: [
        "I drink hot water.",
        "I drink cold tea.",
        "Please don't drink the water.",
      ],
    }),
    vocabMcq("ja-m16-2-2-rev-mcq-1", M16_2_2_REVIEW[2], M16_REVIEW_POOL),
    reviewMatchPairs("ja-m16-2-2-rev", M16_2_2_REVIEW),
    infoStep(
      "ja-m16-2-2-info-end",
      "You can distinguish polite requests from strict prohibitions",
      "ないでください (please don't) vs てはいけません (you must not) — two tools for two levels of authority.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_2_2.steps);
assertAnswerRotation(M16_2_2.steps, 1);
assertNoConsecutiveSame(M16_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-3-1 — "After doing X" (てから intro)
// ═══════════════════════════════════════════════════════════════════════

const M16_3_1_REVIEW = pickReviewAtoms("ja-m16-3-1-rev", M16_REVIEW_POOL, 6);

export const M16_3_1: LessonContent = {
  id: "ja-m16-3-1",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "After doing X (intro)",
  description:
    "Time sequences with てから + vocab: あらう, きがえる, かえる.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m16-3-1-info-open",
      "Sequencing your day",
      "After doing homework, I watch TV. After washing my hands, I eat. てから — the simplest way to sequence actions.",
    ),
    RULE_TE_KARA,
    // ── あらう (wash) ──
    build(
      "ja-m16-3-1-build-arau",
      "Pick the Japanese word for: Wash",
      "あらう",
      ["かえる", "あらう", "きがえる", "すわる"],
      ["あらう"],
    ),
    listeningCompSentence({
      id: "ja-m16-3-1-lc-arau",
      audioText: "てを あらう",
      correctMeaningEn: "wash hands",
      distractorsEn: ["return home", "change clothes", "sit down"],
    }),
    // ── きがえる (change clothes) ──
    build(
      "ja-m16-3-1-build-kigaeru",
      "Pick the Japanese word for: Change clothes",
      "きがえる",
      ["あらう", "かえる", "きがえる", "さわる"],
      ["きがえる"],
    ),
    speaking("ja-m16-3-1-speak-kigaeru", "きがえる", "Change clothes"),
    // ── かえる (return) ──
    build(
      "ja-m16-3-1-build-kaeru",
      "Pick the Japanese word for: Return / Go home",
      "かえる",
      ["きがえる", "かえる", "あらう", "はいる"],
      ["かえる"],
    ),
    listeningCompSentence({
      id: "ja-m16-3-1-lc-kaeru",
      audioText: "うちに かえる",
      correctMeaningEn: "go home",
      distractorsEn: ["change clothes", "wash", "enter"],
    }),
    // ── てから drills ──
    build(
      "ja-m16-3-1-build-tekara-1",
      "Say: After washing hands, I eat.",
      "てを あらってから たべます",
      ["あらって", "たべます", "て", "から", "を", "みます", "かえって"],
      ["て", "を", "あらって", "から", "たべます"],
    ),
    cloze(
      "ja-m16-3-1-cloze-1",
      "しゅくだいを して",
      "、テレビを みます。",
      "から",
      ["から", "はいけません", "もいいです", "ないで"],
      "After doing homework, I watch TV.",
      "しゅくだいを してから、テレビを みます。",
      "て + から = 'after doing.' Time sequence connector.",
    ),
    sentenceMcq({
      id: "ja-m16-3-1-mcq-1",
      prompt: "Which sentence means 'After going home, I study.'?",
      correctKana: "うちに かえってから、べんきょうします。",
      distractorsKana: [
        "うちに かえって、べんきょうします。",
        "うちに かえるから、べんきょうします。",
        "うちで べんきょうしてから、かえります。",
      ],
      explanation: "かえってから = after going home. The から after te-form means 'after doing.'",
    }),
    listeningCompSentence({
      id: "ja-m16-3-1-lc-tekara",
      audioText: "シャワーを あびてから ねます",
      correctMeaningEn: "After taking a shower, I go to bed.",
      distractorsEn: [
        "I take a shower because I sleep.",
        "Before showering, I go to bed.",
        "I shower and wake up.",
      ],
    }),
    cloze(
      "ja-m16-3-1-cloze-2",
      "うちに かえって",
      "、シャワーを あびます。",
      "から",
      ["から", "も", "は", "が"],
      "After going home, I take a shower.",
      "うちに かえってから、シャワーを あびます。",
      "かえって + から = 'after going home.'",
    ),
    selfExplain({
      id: "ja-m16-3-1-self",
      anchorLabel: "してから = after doing",
      anchorAudioText: "しゅくだいを してから テレビを みます",
      question: "Why してから instead of するから?",
      rule: { text: "してから (te-form + から) means 'after doing.' するから (dictionary + から) means 'because I do.' The て-form is essential for the time-sequence meaning." },
      surface: { text: "してから and するから mean the same thing — the て-form is optional." },
      distractor: { text: "してから is for past actions only; するから is for future actions." },
      ruleExplanation: "て-form + から = 'after doing' (time). Dictionary + から = 'because' (reason). Completely different meanings.",
    }),
    speaking(
      "ja-m16-3-1-speak-tekara",
      "てを あらってから たべます",
      "After washing my hands, I eat.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m16-3-1-rev-mcq-1", M16_3_1_REVIEW[0], M16_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m16-3-1-rev-lc-1",
      // Sentence-level review of おかね (M5) — 2026-07-12 listening backfill.
      audioText: "かばんに おかねが あります",
      correctMeaningEn: "There is money in my bag.",
      distractorsEn: [
        "There is money in my room.",
        "There is a ticket in my bag.",
        "There is no money in my bag.",
      ],
    }),
    speaking("ja-m16-3-1-rev-speak-1", M16_3_1_REVIEW[2].kana, M16_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m16-3-1-rev", M16_3_1_REVIEW),
    infoStep(
      "ja-m16-3-1-info-end",
      "You can now sequence actions in time",
      "てから — after doing X, do Y. Three new verbs (あらう, きがえる, かえる) wired into the sequence pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_3_1.steps);
assertAnswerRotation(M16_3_1.steps, 1);
assertNoConsecutiveSame(M16_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-3-2 — "After doing X" (てから drill)
// ═══════════════════════════════════════════════════════════════════════

const M16_3_2_REVIEW = pickReviewAtoms("ja-m16-3-2-rev", M16_REVIEW_POOL, 6);

export const M16_3_2: LessonContent = {
  id: "ja-m16-3-2",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "After doing X (practice)",
  description:
    "Extended てから drill with daily routine sequences + vocab: しゅくだい, きょうしつ.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m16-3-2-info-open",
      "Daily sequence drills",
      "Eight てから sequences — morning, school, evening. Lock in the pattern with real-life routines.",
    ),
    // ── しゅくだい (homework) ──
    build(
      "ja-m16-3-2-build-shukudai",
      "Pick the Japanese word for: Homework",
      "しゅくだい",
      ["きょうしつ", "じむしょ", "しゅくだい", "エレベーター"],
      ["しゅくだい"],
    ),
    listeningCompSentence({
      id: "ja-m16-3-2-lc-shukudai",
      audioText: "しゅくだいを してから テレビを みます",
      correctMeaningEn: "After doing my homework, I watch TV.",
      distractorsEn: [
        "Before doing my homework, I watch TV.",
        "After watching TV, I do my homework.",
        "I do my homework while watching TV.",
      ],
    }),
    // ── きょうしつ (classroom) ──
    build(
      "ja-m16-3-2-build-kyoushitsu",
      "Pick the Japanese word for: Classroom",
      "きょうしつ",
      ["しゅくだい", "きょうしつ", "じむしょ", "かいだん"],
      ["きょうしつ"],
    ),
    speaking("ja-m16-3-2-speak-kyoushitsu", "きょうしつ", "Classroom"),
    // ── てから drills ──
    cloze(
      "ja-m16-3-2-cloze-1",
      "きがえて",
      "、あさごはんを たべます。",
      "から",
      ["から", "も", "は", "ないで"],
      "After changing clothes, I eat breakfast.",
      "きがえてから、あさごはんを たべます。",
      "きがえる → きがえて + から = 'after changing clothes.'",
    ),
    build(
      "ja-m16-3-2-build-tekara-1",
      "Say: After eating breakfast, I go to school.",
      "あさごはんを たべてから がっこうに いきます",
      ["たべて", "がっこう", "あさごはん", "いきます", "を", "に", "から", "かえります"],
      ["あさごはん", "を", "たべて", "から", "がっこう", "に", "いきます"],
    ),
    sentenceMcq({
      id: "ja-m16-3-2-mcq-1",
      prompt: "Which means 'After doing homework, I play.'?",
      correctKana: "しゅくだいを してから、あそびます。",
      distractorsKana: [
        "しゅくだいを するから、あそびます。",
        "あそんでから、しゅくだいを します。",
        "しゅくだいを して、あそびません。",
      ],
      explanation: "してから = after doing. するから = because I do (wrong meaning).",
    }),
    listeningCompSentence({
      id: "ja-m16-3-2-lc-tekara",
      audioText: "あさごはんを たべてから がっこうに いきます",
      correctMeaningEn: "After eating breakfast, I go to school.",
      distractorsEn: [
        "I eat breakfast because I go to school.",
        "I go to school and eat breakfast.",
        "Before eating breakfast, I go to school.",
      ],
    }),
    cloze(
      "ja-m16-3-2-cloze-2",
      "シャワーを あびて",
      "、きがえます。",
      "から",
      ["から", "は", "も", "ないで"],
      "After showering, I change clothes.",
      "シャワーを あびてから、きがえます。",
      "あびて + から = 'after showering.'",
    ),
    build(
      "ja-m16-3-2-build-tekara-2",
      "Say: After going home, I do homework.",
      "うちに かえってから しゅくだいを します",
      ["かえって", "しゅくだい", "うち", "します", "に", "を", "から", "みます"],
      ["うち", "に", "かえって", "から", "しゅくだい", "を", "します"],
    ),
    build(
      "ja-m16-3-2-build-saki",
      "さきに means 'first / before anything else.' Say: First, I do my homework.",
      "さきに しゅくだいを します",
      ["しゅくだい", "さきに", "します", "を", "てから"],
      ["さきに", "しゅくだい", "を", "します"],
    ),
    translateStep({
      id: "ja-m16-3-2-translate",
      promptEn: "After studying, I go to bed.",
      acceptedAnswers: [
        "べんきょうしてから ねます",
        "べんきょうしてから ねます。",
        "べんきょうしてから、ねます",
        "べんきょうしてから、ねます。",
      ],
      audioText: "べんきょうしてから ねます",
    }),
    selfExplain({
      id: "ja-m16-3-2-self",
      anchorLabel: "てから sequences your day",
      anchorAudioText: "きがえてから あさごはんを たべます",
      question: "What does てから guarantee about the two actions?",
      rule: { text: "てから means the first action must be COMPLETED before the second begins. It establishes strict chronological order." },
      surface: { text: "てから means the two actions happen at the same time." },
      distractor: { text: "てから connects two actions that are happening for the same reason." },
      ruleExplanation: "てから = strict sequence. A must finish before B starts. For simultaneous actions, use ながら (future module).",
    }),
    speaking(
      "ja-m16-3-2-speak",
      "しゅくだいを してから おんがくを ききます",
      "After doing homework, I listen to music.",
    ),
    // ── Review tail ──
    speaking("ja-m16-3-2-rev-speak-1", M16_3_2_REVIEW[0].kana, M16_3_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m16-3-2-rev-lc-1",
      audioText: M16_3_2_REVIEW[1].kana,
      correctMeaningEn: M16_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M16_3_2_REVIEW[2].meaningEn,
        M16_3_2_REVIEW[3].meaningEn,
        M16_REVIEW_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m16-3-2-rev-mcq-1", M16_3_2_REVIEW[2], M16_REVIEW_POOL),
    reviewMatchPairs("ja-m16-3-2-rev", M16_3_2_REVIEW),
    infoStep(
      "ja-m16-3-2-info-end",
      "You can describe your daily routine as a sequence of events",
      "てから chains morning, school, and evening routines into clear time sequences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_3_2.steps);
assertAnswerRotation(M16_3_2.steps, 1);
assertNoConsecutiveSame(M16_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-4-1 — "I like doing..." (のがすき intro)
// ═══════════════════════════════════════════════════════════════════════

const M16_4_1_REVIEW = pickReviewAtoms("ja-m16-4-1-rev", M16_REVIEW_POOL, 6);

export const M16_4_1: LessonContent = {
  id: "ja-m16-4-1",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "I like doing... (intro)",
  description:
    "Expressing likes and dislikes with のがすき / のがきらい.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m16-4-1-info-open",
      "What you love and what you don't",
      "I like cooking. I dislike studying. のが + すき/きらい — turn any verb into something you like or dislike doing.",
    ),
    RULE_NO_GA_SUKI,
    // ── すき/きらい exposure ──
    build(
      "ja-m16-4-1-build-suki",
      "Pick the Japanese word for: Like",
      "すき",
      ["きらい", "すき", "すわる", "さわる"],
      ["すき"],
    ),
    listeningCompSentence({
      id: "ja-m16-4-1-lc-suki",
      audioText: "コーヒーが すきです",
      correctMeaningEn: "I like coffee.",
      distractorsEn: [
        "I dislike coffee.",
        "I like tea.",
        "I drink coffee every day.",
      ],
    }),
    build(
      "ja-m16-4-1-build-kirai",
      "Pick the Japanese word for: Dislike",
      "きらい",
      ["すき", "かえる", "きらい", "あらう"],
      ["きらい"],
    ),
    speaking("ja-m16-4-1-speak-kirai", "きらい", "Dislike"),
    // ── のがすき drills ──
    build(
      "ja-m16-4-1-build-ryouri",
      "Say: I like cooking.",
      "りょうりを するのが すきです",
      ["するのが", "りょうり", "です", "を", "きらい", "すき"],
      ["りょうり", "を", "するのが", "すき", "です"],
    ),
    cloze(
      "ja-m16-4-1-cloze-1",
      "おんがくを きく",
      " すきです。",
      "のが",
      ["のが", "のを", "のに", "のは"],
      "I like listening to music.",
      "おんがくを きくのが すきです。",
      "の nominalizes the verb; が marks what is liked.",
    ),
    sentenceMcq({
      id: "ja-m16-4-1-mcq-1",
      prompt: "Which sentence means 'I dislike studying.'?",
      correctKana: "べんきょうするのが きらいです。",
      distractorsKana: [
        "べんきょうするのが すきです。",
        "べんきょうするのを きらいです。",
        "べんきょうするが きらいです。",
      ],
      explanation: "するのが + きらいです = dislike doing. の is essential for nominalization.",
    }),
    listeningCompSentence({
      id: "ja-m16-4-1-lc-ryouri",
      audioText: "えいがを みるのが すきです",
      correctMeaningEn: "I like watching movies.",
      distractorsEn: [
        "I dislike watching movies.",
        "I'm watching a movie.",
        "I like making movies.",
      ],
    }),
    cloze(
      "ja-m16-4-1-cloze-2",
      "ほんを よむ",
      " すきです。",
      "のが",
      ["のが", "のを", "のに", "のは"],
      "I like reading books.",
      "ほんを よむのが すきです。",
      "よむ + のが + すき = like reading.",
    ),
    build(
      "ja-m16-4-1-build-kirai-souji",
      "Say: I dislike cleaning.",
      "そうじを するのが きらいです",
      ["するのが", "そうじ", "きらい", "を", "です", "すき"],
      ["そうじ", "を", "するのが", "きらい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m16-4-1-lb-1",
      target: "にほんごを べんきょうするのが すきです",
      tiles: ["べんきょうするのが", "にほんご", "すき", "を", "です", "きらい"],
      correctOrder: ["にほんご", "を", "べんきょうするのが", "すき", "です"],
      promptEn: "Hear it, build it: 'I like studying Japanese.'",
    }),
    selfExplain({
      id: "ja-m16-4-1-self",
      anchorLabel: "きくのが すきです (I like listening)",
      anchorAudioText: "おんがくを きくのが すきです",
      question: "Why のが and not のを before すき?",
      rule: { text: "すき and きらい are な-adjectives, not verbs. The thing liked/disliked is the subject, marked with が. を marks objects of verbs." },
      surface: { text: "のが and のを are interchangeable — both work with すき." },
      distractor: { text: "のが is for things you like; のを is for things you dislike." },
      ruleExplanation: "すき/きらい take が because they describe the subject's quality. The liked/disliked activity IS the subject: [activity]のが すき.",
    }),
    speaking(
      "ja-m16-4-1-speak-suki",
      "はしるのが すきです",
      "I like running.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m16-4-1-rev-mcq-1", M16_4_1_REVIEW[0], M16_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m16-4-1-rev-lc-1",
      audioText: M16_4_1_REVIEW[1].kana,
      correctMeaningEn: M16_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M16_4_1_REVIEW[2].meaningEn,
        M16_4_1_REVIEW[3].meaningEn,
        M16_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m16-4-1-rev-speak-1", M16_4_1_REVIEW[2].kana, M16_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m16-4-1-rev", M16_4_1_REVIEW),
    infoStep(
      "ja-m16-4-1-info-end",
      "You can now say what you like and dislike doing",
      "のがすき / のがきらい — cooking, studying, reading, listening. Turn any verb into a preference.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_4_1.steps);
assertAnswerRotation(M16_4_1.steps, 1);
assertNoConsecutiveSame(M16_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-4-2 — "I like doing..." (のがすき/きらい drill)
// ═══════════════════════════════════════════════════════════════════════

const M16_4_2_REVIEW = pickReviewAtoms("ja-m16-4-2-rev", M16_REVIEW_POOL, 6);

export const M16_4_2: LessonContent = {
  id: "ja-m16-4-2",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "I like doing... (practice)",
  description:
    "Extended のがすき/きらい drill with more verb contexts.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m16-4-2-info-open",
      "More likes and dislikes",
      "Swimming, running, writing — expand your のがすき vocabulary with more verbs.",
    ),
    // ── Drill block ──
    cloze(
      "ja-m16-4-2-cloze-1",
      "およぐ",
      " すきです。",
      "のが",
      ["のが", "のを", "のに", "のは"],
      "I like swimming.",
      "およぐのが すきです。",
      "およぐ + のが + すき = like swimming.",
    ),
    build(
      "ja-m16-4-2-build-1",
      "Say: I dislike running.",
      "はしるのが きらいです",
      ["きらい", "はしる", "です", "の", "が", "すき"],
      ["はしる", "の", "が", "きらい", "です"],
    ),
    sentenceMcq({
      id: "ja-m16-4-2-mcq-1",
      prompt: "Which sentence means 'I like writing.'?",
      correctKana: "かくのが すきです。",
      distractorsKana: [
        "かくのが きらいです。",
        "かくのを すきです。",
        "かくが すきです。",
      ],
      explanation: "かく + のが + すき = like writing. の is the nominalizer; が marks the subject.",
    }),
    listeningCompSentence({
      id: "ja-m16-4-2-lc-1",
      audioText: "そうじを するのが きらいです",
      correctMeaningEn: "I dislike cleaning.",
      distractorsEn: [
        "I like cleaning.",
        "I'm cleaning.",
        "I dislike laundry.",
      ],
    }),
    cloze(
      "ja-m16-4-2-cloze-2",
      "えいがを みる",
      " すきです。",
      "のが",
      ["のが", "のを", "のに", "のは"],
      "I like watching movies.",
      "えいがを みるのが すきです。",
      "みる + のが + すき = like watching.",
    ),
    build(
      "ja-m16-4-2-build-2",
      "Say: I like drinking coffee.",
      "コーヒーを のむのが すきです",
      ["のむのが", "コーヒー", "すき", "を", "です", "きらい"],
      ["コーヒー", "を", "のむのが", "すき", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m16-4-2-lb-1",
      target: "テレビを みるのが すきです",
      tiles: ["みるのが", "テレビ", "すき", "を", "です", "はしる"],
      correctOrder: ["テレビ", "を", "みるのが", "すき", "です"],
      promptEn: "Hear it, build it: 'I like watching TV.'",
    }),
    sentenceMcq({
      id: "ja-m16-4-2-mcq-2",
      prompt: "Which sentence means 'I dislike cooking.'?",
      correctKana: "りょうりを するのが きらいです。",
      distractorsKana: [
        "りょうりを するのを きらいです。",
        "りょうりを しないのが きらいです。",
        "りょうりを するが きらいです。",
      ],
      explanation: "するのが + きらいです = dislike doing. の nominalizes the verb.",
    }),
    cloze(
      "ja-m16-4-2-cloze-3",
      "にほんごを べんきょうする",
      " すきです。",
      "のが",
      ["のが", "のを", "のに", "のは"],
      "I like studying Japanese.",
      "にほんごを べんきょうするのが すきです。",
      "する + のが + すき = like studying.",
    ),
    build(
      "ja-m16-4-2-build-3",
      "Say: I dislike waking up early.",
      "はやく おきるのが きらいです",
      ["おきる", "きらい", "はやく", "です", "の", "が", "すき"],
      ["はやく", "おきる", "の", "が", "きらい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m16-4-2-lc-2",
      audioText: "にほんごを べんきょうするのが すきです",
      correctMeaningEn: "I like studying Japanese.",
      distractorsEn: [
        "I dislike studying Japanese.",
        "I study Japanese.",
        "I'm good at Japanese.",
      ],
    }),
    translateStep({
      id: "ja-m16-4-2-translate",
      promptEn: "I like reading books.",
      acceptedAnswers: [
        "ほんを よむのが すきです",
        "ほんを よむのが すきです。",
        "ほんをよむのがすきです",
        "ほんをよむのがすきです。",
      ],
      audioText: "ほんを よむのが すきです",
    }),
    selfExplain({
      id: "ja-m16-4-2-self",
      anchorLabel: "のが pairs with すき/きらい",
      anchorAudioText: "およぐのが すきです",
      question: "Can you use のが with verbs other than すき and きらい?",
      rule: { text: "のが also works with じょうず (skilled at) and へた (bad at): およぐのが じょうずです = 'I'm good at swimming.' The の nominalizer + が subject marker pattern extends beyond すき/きらい." },
      surface: { text: "のが is a special particle that only works with すき and きらい — no other words." },
      distractor: { text: "のが can replace を in any sentence — it's a universal object marker." },
      ruleExplanation: "の nominalizes verbs; が marks the resulting noun as subject. This works with any predicate that takes a が-marked subject: すき, きらい, じょうず, へた, etc.",
    }),
    speaking(
      "ja-m16-4-2-speak",
      "てがみを かくのが すきです",
      "I like writing letters.",
    ),
    // ── Review tail ──
    speaking("ja-m16-4-2-rev-speak-1", M16_4_2_REVIEW[0].kana, M16_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m16-4-2-rev-lc-1",
      // Sentence-level review of いくら (M5) — 2026-07-12 listening backfill.
      audioText: "この カメラは いくらですか",
      correctMeaningEn: "How much is this camera?",
      distractorsEn: [
        "How much is this mobile phone?",
        "Where is this camera?",
        "This camera is 10,000 yen.",
      ],
    }),
    vocabMcq("ja-m16-4-2-rev-mcq-1", M16_4_2_REVIEW[2], M16_REVIEW_POOL),
    reviewMatchPairs("ja-m16-4-2-rev", M16_4_2_REVIEW),
    infoStep(
      "ja-m16-4-2-info-end",
      "You can talk about what you love and what you hate doing",
      "のがすき and のがきらい with swimming, running, writing, cooking, studying — your personality in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_4_2.steps);
assertAnswerRotation(M16_4_2.steps, 1);
assertNoConsecutiveSame(M16_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-5-1 — "Rules" (てもいい vs てはいけない discrimination)
// ═══════════════════════════════════════════════════════════════════════

const M16_5_1_REVIEW = pickReviewAtoms("ja-m16-5-1-rev", M16_REVIEW_POOL, 6);

export const M16_5_1: LessonContent = {
  id: "ja-m16-5-1",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Rules (permission vs prohibition)",
  description:
    "Discriminating てもいいです from てはいけません + vocab: じむしょ, エレベーター, かいだん.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m16-5-1-info-open",
      "What you may and must not do",
      "Permission and prohibition side by side. てもいい = you may. てはいけません = you must not. Three location words for context.",
    ),
    // ── じむしょ (office) ──
    build(
      "ja-m16-5-1-build-jimusho",
      "Pick the Japanese word for: Office",
      "じむしょ",
      ["きょうしつ", "じむしょ", "エレベーター", "かいだん"],
      ["じむしょ"],
    ),
    listeningCompSentence({
      id: "ja-m16-5-1-lc-jimusho",
      audioText: "じむしょに はいってもいいですか",
      correctMeaningEn: "May I enter the office?",
      distractorsEn: [
        "You must not enter the office.",
        "May I use the elevator?",
        "Please enter the office.",
      ],
    }),
    // ── エレベーター (elevator) ──
    build(
      "ja-m16-5-1-build-elevator",
      "Pick the Japanese word for: Elevator",
      "エレベーター",
      ["じむしょ", "かいだん", "エレベーター", "きょうしつ"],
      ["エレベーター"],
    ),
    speaking("ja-m16-5-1-speak-elevator", "エレベーター", "Elevator"),
    // ── かいだん (stairs) ──
    build(
      "ja-m16-5-1-build-kaidan",
      "Pick the Japanese word for: Stairs",
      "かいだん",
      ["エレベーター", "かいだん", "じむしょ", "きょうしつ"],
      ["かいだん"],
    ),
    listeningCompSentence({
      id: "ja-m16-5-1-lc-kaidan",
      audioText: "かいだんは あそこに あります",
      correctMeaningEn: "The stairs are over there.",
      distractorsEn: [
        "The elevator is over there.",
        "The stairs are here.",
        "The office is over there.",
      ],
    }),
    // ── Permission vs prohibition drills ──
    cloze(
      "ja-m16-5-1-cloze-1",
      "エレベーターを つかって",
      "です。",
      "もいい",
      ["もいい", "はいけません", "から", "ないで"],
      "You may use the elevator.",
      "エレベーターを つかってもいいです。",
      "てもいい = permission. 'You may use it.'",
    ),
    sentenceMcq({
      id: "ja-m16-5-1-mcq-1",
      prompt: "Which sentence means 'You must not run in the hallway (ろうか)'?",
      correctKana: "ろうかで はしってはいけません。",
      distractorsKana: [
        "ろうかで はしってもいいです。",
        "ろうかで はしらないでください。",
        "ろうかで はしってください。",
      ],
      explanation: "はしって + はいけません = prohibition on running.",
    }),
    cloze(
      "ja-m16-5-1-cloze-2",
      "じむしょで たべて",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "ください", "から"],
      "You must not eat in the office.",
      "じむしょで たべてはいけません。",
      "て + はいけません = prohibition.",
    ),
    build(
      "ja-m16-5-1-build-moii",
      "Say: You may sit here.",
      "ここに すわってもいいです",
      ["すわって", "ここ", "もいいです", "に", "はいけません", "ないでください"],
      ["ここ", "に", "すわって", "もいいです"],
    ),
    listeningCompSentence({
      id: "ja-m16-5-1-lc-discrimination",
      audioText: "かいだんで はしってはいけません",
      correctMeaningEn: "You must not run on the stairs.",
      distractorsEn: [
        "You may run on the stairs.",
        "Please run on the stairs.",
        "I don't run on the stairs.",
      ],
    }),
    sentenceMcq({
      id: "ja-m16-5-1-mcq-2",
      prompt: "Which means 'You may take photos.'?",
      correctKana: "しゃしんを とってもいいです。",
      distractorsKana: [
        "しゃしんを とるのが すきです。",
        "しゃしんを とらないでください。",
        "しゃしんを とってください。",
      ],
      explanation: "とって + もいいです = you may take (photos).",
    }),
    cloze(
      "ja-m16-5-1-cloze-3",
      "きょうしつで のんで",
      "です。",
      "もいい",
      ["もいい", "はいけません", "から", "ないで"],
      "You may drink in the classroom.",
      "きょうしつで のんでもいいです。",
      "て + もいい = permission.",
    ),
    selfExplain({
      id: "ja-m16-5-1-self",
      anchorLabel: "てもいい vs てはいけません",
      anchorAudioText: "すわってもいいです",
      question: "Both てもいい and てはいけません use the て-form. What changes?",
      rule: { text: "After the て-form, もいい grants permission ('you may') while はいけません states prohibition ('you must not'). The particle after て determines the meaning." },
      surface: { text: "もいい is for questions and はいけません is for statements." },
      distractor: { text: "もいい is formal and はいけません is casual — they both express permission." },
      ruleExplanation: "Same verb, same て-form — different suffix: もいい = permission, はいけません = prohibition. Opposites.",
    }),
    speaking(
      "ja-m16-5-1-speak",
      "エレベーターを つかってもいいです",
      "You may use the elevator.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m16-5-1-rev-mcq-1", M16_5_1_REVIEW[0], M16_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m16-5-1-rev-lc-1",
      audioText: M16_5_1_REVIEW[1].kana,
      correctMeaningEn: M16_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M16_5_1_REVIEW[2].meaningEn,
        M16_5_1_REVIEW[3].meaningEn,
        M16_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m16-5-1-rev-speak-1", M16_5_1_REVIEW[2].kana, M16_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m16-5-1-rev", M16_5_1_REVIEW),
    infoStep(
      "ja-m16-5-1-info-end",
      "You can state rules — what's allowed and what's forbidden",
      "てもいい and てはいけません as a pair. Office, elevator, stairs — real-world settings for real rules.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_5_1.steps);
assertAnswerRotation(M16_5_1.steps, 1);
assertNoConsecutiveSame(M16_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-5-2 — "Rules" (permission vs prohibition extended drill)
// ═══════════════════════════════════════════════════════════════════════

const M16_5_2_REVIEW = pickReviewAtoms("ja-m16-5-2-rev", M16_REVIEW_POOL, 6);

export const M16_5_2: LessonContent = {
  id: "ja-m16-5-2",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Rules (extended drill)",
  description:
    "Mixed てもいい / てはいけません / ないでください discrimination.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m16-5-2-info-open",
      "Three-way discrimination",
      "Permission, prohibition, polite request — all three in one drill. Pick the right ending every time.",
    ),
    // ── Mixed drills ──
    sentenceMcq({
      id: "ja-m16-5-2-mcq-1",
      prompt: "A sign says 'No smoking.' Which form?",
      correctKana: "たばこを すってはいけません。",
      distractorsKana: [
        "たばこを すわないでください。",
        "たばこを すってもいいです。",
        "たばこを すってください。",
      ],
      explanation: "Signs use てはいけません for strict prohibition.",
    }),
    cloze(
      "ja-m16-5-2-cloze-1",
      "ここで しゃしんを とって",
      "です。",
      "もいい",
      ["もいい", "はいけません", "から", "ないで"],
      "You may take photos here.",
      "ここで しゃしんを とってもいいです。",
      "て + もいい = permission.",
    ),
    build(
      "ja-m16-5-2-build-1",
      "Say: Please don't run.",
      "はしらないでください",
      ["はしって", "ください", "はしらないで", "はいけません"],
      ["はしらないで", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m16-5-2-lc-1",
      audioText: "ここで すわってもいいですか",
      correctMeaningEn: "May I sit here?",
      distractorsEn: [
        "Must I sit here?",
        "Please don't sit here.",
        "You must not sit here.",
      ],
    }),
    cloze(
      "ja-m16-5-2-cloze-2",
      "きょうしつで のんで",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "ください", "から"],
      "You must not drink in the classroom.",
      "きょうしつで のんではいけません。",
      "て + はいけません = prohibition.",
    ),
    sentenceMcq({
      id: "ja-m16-5-2-mcq-2",
      prompt: "Your friend is about to touch a painting. Politely stop them:",
      correctKana: "それに さわらないでください。",
      distractorsKana: [
        "それに さわってはいけません。",
        "それに さわってもいいです。",
        "それに さわってください。",
      ],
      explanation: "ないでください = polite request to a person. てはいけません = a rule/prohibition.",
    }),
    build(
      "ja-m16-5-2-build-hen",
      "この へん means 'this area / around here.' Say: You must not park around here.",
      "この へんに とめてはいけません",
      ["とめて", "この", "はいけません", "へん", "に", "もいいです"],
      ["この", "へん", "に", "とめて", "はいけません"],
    ),
    listeningBuildSentence({
      id: "ja-m16-5-2-lb-1",
      target: "びょういんで はしってはいけません",
      tiles: ["はしって", "びょういん", "はいけません", "で", "もいいです", "はしらないで"],
      correctOrder: ["びょういん", "で", "はしって", "はいけません"],
      promptEn: "Hear it, build it: 'You must not run in the hospital.'",
    }),
    cloze(
      "ja-m16-5-2-cloze-3",
      "エレベーターの まえに とめ",
      "ください。",
      "ないで",
      ["ないで", "って", "なくて", "ないと"],
      "Please don't park in front of the elevator.",
      "エレベーターの まえに とめないでください。",
      "とめる → とめない + でください = polite negative request.",
    ),
    listeningCompSentence({
      id: "ja-m16-5-2-lc-2",
      audioText: "かいだんで はしらないでください",
      correctMeaningEn: "Please don't run on the stairs.",
      distractorsEn: [
        "You must not run on the stairs.",
        "You may run on the stairs.",
        "Please run on the stairs.",
      ],
    }),
    translateStep({
      id: "ja-m16-5-2-translate",
      promptEn: "You may use the elevator.",
      acceptedAnswers: [
        "エレベーターを つかってもいいです",
        "エレベーターを つかってもいいです。",
      ],
      audioText: "エレベーターを つかってもいいです",
    }),
    sentenceMcq({
      id: "ja-m16-5-2-mcq-3",
      prompt: "Which is the QUESTION form: 'May I park here?'",
      correctKana: "ここに とめてもいいですか。",
      distractorsKana: [
        "ここに とめてはいけません。",
        "ここに とめないでください。",
        "ここに とめてください。",
      ],
      explanation: "てもいいですか = 'May I…?' Question form of permission.",
    }),
    selfExplain({
      id: "ja-m16-5-2-self",
      anchorLabel: "Three forms: てもいい / てはいけません / ないでください",
      anchorAudioText: "すわってもいいですか",
      question: "When would you use ないでください instead of てはいけません?",
      rule: { text: "ないでください is a polite request from one person to another. てはいけません is a rule or prohibition — impersonal, like a sign. Use ないでください when personally asking someone." },
      surface: { text: "ないでください is more informal than てはいけません." },
      distractor: { text: "ないでください is for actions you can't do; てはいけません is for actions you shouldn't do." },
      ruleExplanation: "Personal request → ないでください. Impersonal rule → てはいけません. Both mean 'don't,' but the social context differs.",
    }),
    speaking(
      "ja-m16-5-2-speak",
      "ここに すわってもいいですか",
      "May I sit here?",
    ),
    // ── Review tail ──
    speaking("ja-m16-5-2-rev-speak-1", M16_5_2_REVIEW[0].kana, M16_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m16-5-2-rev-lc-1",
      // Sentence-level review of ホテル (M11) — 2026-07-12 listening backfill.
      audioText: "ホテルで たばこを すってはいけません",
      correctMeaningEn: "You must not smoke in the hotel.",
      distractorsEn: [
        "You may smoke in the hotel.",
        "You must not smoke in the office.",
        "You must not eat in the hotel.",
      ],
    }),
    vocabMcq("ja-m16-5-2-rev-mcq-1", M16_5_2_REVIEW[2], M16_REVIEW_POOL),
    reviewMatchPairs("ja-m16-5-2-rev", M16_5_2_REVIEW),
    infoStep(
      "ja-m16-5-2-info-end",
      "You can handle permission, prohibition, and polite requests",
      "Three forms — てもいい, てはいけません, ないでください — deployed in real-world scenarios. Full rule toolkit.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_5_2.steps);
assertAnswerRotation(M16_5_2.steps, 1);
assertNoConsecutiveSame(M16_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-6-1 — "Sequences and routines" (てから + daily routine)
// ═══════════════════════════════════════════════════════════════════════

const M16_6_1_REVIEW = pickReviewAtoms("ja-m16-6-1-rev", M16_REVIEW_POOL, 6);

export const M16_6_1: LessonContent = {
  id: "ja-m16-6-1",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Sequences and routines I",
  description:
    "てから + のがすき combined: describe your daily routine and what you like about it.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m16-6-1-info-open",
      "Your routine in sequence",
      "Combine てから (after doing) with のがすき (I like doing) to talk about your routines and preferences.",
    ),
    // ── Sequence + preference drills ──
    build(
      "ja-m16-6-1-build-1",
      "Say: After going home, I cook.",
      "うちに かえってから りょうりを します",
      ["かえって", "りょうり", "うち", "します", "に", "を", "から", "たべます"],
      ["うち", "に", "かえって", "から", "りょうり", "を", "します"],
    ),
    cloze(
      "ja-m16-6-1-cloze-1",
      "こうえんで はしる",
      " すきです。",
      "のが",
      ["のが", "のを", "のに", "のは"],
      "I like running in the park.",
      "こうえんで はしるのが すきです。",
      "のが nominalizes the verb for すき.",
    ),
    sentenceMcq({
      id: "ja-m16-6-1-mcq-1",
      prompt: "Which means 'After eating, I study.'?",
      correctKana: "たべてから、べんきょうします。",
      distractorsKana: [
        "たべるから、べんきょうします。",
        "べんきょうしてから、たべます。",
        "たべて、べんきょうしません。",
      ],
      explanation: "たべてから = after eating. The sequence is eat first, then study.",
    }),
    listeningCompSentence({
      id: "ja-m16-6-1-lc-1",
      audioText: "シャワーを あびてから きがえます",
      correctMeaningEn: "After showering, I change clothes.",
      distractorsEn: [
        "I change clothes because of the shower.",
        "I shower and don't change clothes.",
        "Before showering, I change clothes.",
      ],
    }),
    cloze(
      "ja-m16-6-1-cloze-2",
      "あさごはんを たべて",
      "、がっこうに いきます。",
      "から",
      ["から", "は", "も", "ないで"],
      "After eating breakfast, I go to school.",
      "あさごはんを たべてから、がっこうに いきます。",
      "たべて + から = 'after eating.'",
    ),
    build(
      "ja-m16-6-1-build-2",
      "Say: I like running.",
      "はしるのが すきです",
      ["すき", "はしる", "です", "の", "が", "きらい"],
      ["はしる", "の", "が", "すき", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m16-6-1-lb-1",
      target: "うちに かえってから シャワーを あびます",
      tiles: ["かえって", "シャワー", "うち", "あびます", "に", "を", "から", "きがえます"],
      correctOrder: ["うち", "に", "かえって", "から", "シャワー", "を", "あびます"],
      promptEn: "Hear it, build it: 'After going home, I take a shower.'",
    }),
    sentenceMcq({
      id: "ja-m16-6-1-mcq-2",
      prompt: "Which means 'I dislike waking up early.'?",
      correctKana: "はやく おきるのが きらいです。",
      distractorsKana: [
        "はやく おきるのが すきです。",
        "はやく おきるのを きらいです。",
        "はやく おきてから きらいです。",
      ],
      explanation: "おきるのが + きらい = dislike waking up. のが not のを.",
    }),
    cloze(
      "ja-m16-6-1-cloze-3",
      "そうじを して",
      "、せんたくを します。",
      "から",
      ["から", "も", "は", "ないで"],
      "After cleaning, I do laundry.",
      "そうじを してから、せんたくを します。",
      "して + から = 'after doing (cleaning).'",
    ),
    build(
      "ja-m16-6-1-build-3",
      "Say: After changing clothes, I eat breakfast.",
      "きがえてから あさごはんを たべます",
      ["あさごはん", "きがえて", "たべます", "から", "を", "のみます"],
      ["きがえて", "から", "あさごはん", "を", "たべます"],
    ),
    listeningCompSentence({
      id: "ja-m16-6-1-lc-2",
      audioText: "そうじを するのが きらいです",
      correctMeaningEn: "I dislike cleaning.",
      distractorsEn: [
        "I like cleaning.",
        "I'm cleaning.",
        "After cleaning, I do laundry.",
      ],
    }),
    // ── じぶん (oneself) — routines you do by yourself ──
    build(
      "ja-m16-6-1-build-jibun",
      "Routines are often solo. Pick the word for: oneself / myself",
      "じぶん",
      ["わたし", "じぶん", "ともだち", "あなた"],
      ["じぶん"],
    ),
    listeningCompSentence({
      id: "ja-m16-6-1-lc-jibun",
      audioText: "じぶんで りょうりを します",
      correctMeaningEn: "I cook by myself.",
      distractorsEn: [
        "I cook with a friend.",
        "I like cooking.",
        "I cook at home.",
      ],
    }),
    build(
      "ja-m16-6-1-build-jibun-2",
      "Say: I like cooking by myself.",
      "じぶんで りょうりを するのが すきです",
      ["する", "りょうり", "じぶん", "すき", "の", "が", "で", "を", "です", "きらい"],
      ["じぶん", "で", "りょうり", "を", "する", "の", "が", "すき", "です"],
    ),
    translateStep({
      id: "ja-m16-6-1-translate",
      promptEn: "After taking a shower, I go to bed.",
      acceptedAnswers: [
        "シャワーを あびてから ねます",
        "シャワーを あびてから ねます。",
        "シャワーを あびてから、ねます",
        "シャワーを あびてから、ねます。",
      ],
      audioText: "シャワーを あびてから ねます",
    }),
    selfExplain({
      id: "ja-m16-6-1-self",
      anchorLabel: "てから for sequences, のが for preferences",
      anchorAudioText: "かえってから りょうりを します",
      question: "Can てから and のがすき appear in the same sentence?",
      rule: { text: "Yes. You can combine them: かえってから りょうりを するのが すきです = 'I like cooking after going home.' てから sequences the actions; のがすき expresses preference about the whole sequence." },
      surface: { text: "No — てから and のがすき are different grammar points that cannot be combined." },
      distractor: { text: "てから replaces のが — you choose one or the other." },
      ruleExplanation: "Grammar points stack in Japanese. てから sequences; のがすき expresses likes. Combined: [A てから B するのが すき] = 'I like doing B after A.'",
    }),
    speaking(
      "ja-m16-6-1-speak",
      "さきに しゅくだいを してから あそびます",
      "First I do my homework, then I play.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m16-6-1-rev-mcq-1", M16_6_1_REVIEW[0], M16_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m16-6-1-rev-lc-1",
      // Sentence-level review of コーヒー (M8) — 2026-07-12 listening backfill.
      audioText: "コーヒーを のんでから しごとを します",
      correctMeaningEn: "After drinking coffee, I work.",
      distractorsEn: [
        "Before drinking coffee, I work.",
        "After drinking tea, I work.",
        "After working, I drink coffee.",
      ],
    }),
    speaking("ja-m16-6-1-rev-speak-1", M16_6_1_REVIEW[2].kana, M16_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m16-6-1-rev", M16_6_1_REVIEW),
    infoStep(
      "ja-m16-6-1-info-end",
      "You can describe your routines and what you enjoy about them",
      "てから sequences your day; のがすき/きらい colors it with preferences. Routine + personality.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_6_1.steps);
assertAnswerRotation(M16_6_1.steps, 1);
assertNoConsecutiveSame(M16_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-6-2 — "Sequences and routines" (combined drill)
// ═══════════════════════════════════════════════════════════════════════

const M16_6_2_REVIEW = pickReviewAtoms("ja-m16-6-2-rev", M16_REVIEW_POOL, 6);

export const M16_6_2: LessonContent = {
  id: "ja-m16-6-2",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Sequences and routines II",
  description:
    "All four grammar points mixed: てはいけません, ないでください, てから, のがすき.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m16-6-2-info-open",
      "Everything together",
      "Prohibition, negative requests, sequences, and likes — all four grammar points in one drill.",
    ),
    // ── Mixed four-way drills ──
    cloze(
      "ja-m16-6-2-cloze-1",
      "ほんを よんで",
      "、ねます。",
      "から",
      ["から", "はいけません", "もいいです", "ないで"],
      "After reading a book, I go to bed.",
      "ほんを よんでから、ねます。",
      "て + から = time sequence.",
    ),
    sentenceMcq({
      id: "ja-m16-6-2-mcq-1",
      prompt: "Which means 'You must not smoke at the station.'?",
      correctKana: "えきで たばこを すってはいけません。",
      distractorsKana: [
        "えきで たばこを すわないでください。",
        "えきで たばこを すってもいいです。",
        "えきで たばこを すってから のみます。",
      ],
      explanation: "すって + はいけません = strict prohibition.",
    }),
    build(
      "ja-m16-6-2-build-1",
      "Say: Please don't wait here.",
      "ここで またないでください",
      ["まって", "ここ", "ください", "で", "またないで"],
      ["ここ", "で", "またないで", "ください"],
    ),
    listeningCompSentence({
      id: "ja-m16-6-2-lc-1",
      audioText: "コーヒーを のむのが すきです",
      correctMeaningEn: "I like drinking coffee.",
      distractorsEn: [
        "I dislike drinking coffee.",
        "I drink coffee.",
        "After drinking coffee, I study.",
      ],
    }),
    cloze(
      "ja-m16-6-2-cloze-2",
      "てがみを かく",
      " すきです。",
      "のが",
      ["のが", "から", "のを", "って"],
      "I like writing letters.",
      "てがみを かくのが すきです。",
      "のが nominalizes for すき.",
    ),
    build(
      "ja-m16-6-2-build-2",
      "Say: You must not enter the office.",
      "じむしょに はいってはいけません",
      ["はいって", "じむしょ", "はいけません", "に", "もいいです", "ないでください"],
      ["じむしょ", "に", "はいって", "はいけません"],
    ),
    sentenceMcq({
      id: "ja-m16-6-2-mcq-2",
      prompt: "Which means 'After going home, I study.'?",
      correctKana: "うちに かえってから、べんきょうします。",
      distractorsKana: [
        "うちに かえるから、べんきょうします。",
        "うちに かえっても、べんきょうします。",
        "うちに かえってはいけません。",
      ],
      explanation: "かえってから = after going home (time sequence).",
    }),
    listeningBuildSentence({
      id: "ja-m16-6-2-lb-1",
      target: "しゅくだいを してから あそびます",
      tiles: ["して", "あそびます", "しゅくだい", "から", "を", "べんきょうします", "はいけません"],
      correctOrder: ["しゅくだい", "を", "して", "から", "あそびます"],
      promptEn: "Hear it, build it: 'After doing homework, I play.'",
    }),
    cloze(
      "ja-m16-6-2-cloze-3",
      "この へんで たばこを すって",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "から", "の", "が"],
      "You must not smoke around here.",
      "この へんで たばこを すってはいけません。",
      "て + はいけません = prohibition. この へん = this area.",
    ),
    listeningCompSentence({
      id: "ja-m16-6-2-lc-2",
      audioText: "はしらないでください",
      correctMeaningEn: "Please don't run.",
      distractorsEn: [
        "You must not run.",
        "Please run.",
        "I don't run.",
      ],
    }),
    build(
      "ja-m16-6-2-build-3",
      "Say: I like swimming.",
      "およぐのが すきです",
      ["すき", "およぐ", "です", "の", "が", "きらい"],
      ["およぐ", "の", "が", "すき", "です"],
    ),
    cloze(
      "ja-m16-6-2-cloze-4",
      "ここで およが",
      "ください。",
      "ないで",
      ["ないで", "って", "なくて", "から"],
      "Please don't swim here.",
      "ここで およがないでください。",
      "およぐ → およがない + でください.",
    ),
    selfExplain({
      id: "ja-m16-6-2-self",
      anchorLabel: "Four grammar points in action",
      anchorAudioText: "すってはいけません",
      question: "What makes てはいけません different from ないでください?",
      rule: { text: "てはいけません states an impersonal rule or prohibition (like a sign). ないでください is a personal, polite request from one person to another." },
      surface: { text: "They are identical — both are prohibitions with no difference in use." },
      distractor: { text: "てはいけません is for present tense; ないでください is for future actions only." },
      ruleExplanation: "Authority level: てはいけません = rule/sign (impersonal). ないでください = person-to-person request (polite).",
    }),
    speaking(
      "ja-m16-6-2-speak",
      "そうじを してから せんたくを します",
      "After cleaning, I do laundry.",
    ),
    // ── Review tail ──
    speaking("ja-m16-6-2-rev-speak-1", M16_6_2_REVIEW[0].kana, M16_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m16-6-2-rev-lc-1",
      // Sentence-level review of わたし (M4) — 2026-07-12 listening backfill.
      audioText: "わたしは よる シャワーを あびます",
      correctMeaningEn: "I take a shower at night.",
      distractorsEn: [
        "I take a shower in the morning.",
        "I take a bath at night.",
        "My friend takes a shower at night.",
      ],
    }),
    vocabMcq("ja-m16-6-2-rev-mcq-1", M16_6_2_REVIEW[2], M16_REVIEW_POOL),
    reviewMatchPairs("ja-m16-6-2-rev", M16_6_2_REVIEW),
    infoStep(
      "ja-m16-6-2-info-end",
      "You can handle all four te-form extensions at once",
      "てはいけません, ないでください, てから, のがすき — four patterns deployed together. Te-form mastery continues.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_6_2.steps);
assertAnswerRotation(M16_6_2.steps, 1);
assertNoConsecutiveSame(M16_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-STORY — Narrated story: a day of rules and routines
//   (storyComprehension factory per authoring guide §13.13)
// ═══════════════════════════════════════════════════════════════════════

export const M16_STORY: LessonContent = {
  id: "ja-m16-story",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Library day",
  description:
    "Follow a narrated day — library rules, homework first, then music — and reply with your own sentences.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m16-story-info-open",
      "Story time — Library day",
      "Listen to a short story about a day at the library and the evening routine that follows. Answer the questions between chunks, then reply yourself.",
    ),
    ...storyComprehension({
      idPrefix: "ja-m16-story-s1",
      narrative: [
        { kana: "きょうは ともだちと としょかんに いきます。" },
        { kana: "としょかんで たべてはいけません。" },
        { kana: "でも、ここで ほんを よんでもいいです。" },
        { kana: "わたしは としょかんで べんきょうするのが すきです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "Where does the narrator go today?",
          correctText: "To the library, with a friend.",
          distractors: [
            "To school, with a friend.",
            "To the library, alone.",
            "To the office, with a teacher.",
          ],
          explanation:
            "ともだちと としょかんに いきます = 'I go to the library with a friend.'",
        },
        {
          id: "s1-q2",
          prompt: "What must you NOT do in the library?",
          correctText: "Eat.",
          distractors: ["Read books.", "Study.", "Enter."],
          explanation: "たべてはいけません = you must not eat.",
        },
      ],
      responseBuild: {
        target: "ここで しゃしんを とってもいいですか",
        tiles: ["とって", "ここ", "もいいです", "しゃしん", "で", "か", "を"],
        correctOrder: ["ここ", "で", "しゃしん", "を", "とって", "もいいです", "か"],
        promptEn: "Ask the librarian: 'May I take photos here?'",
      },
    }),
    sentenceMcq({
      id: "ja-m16-story-mcq-1",
      prompt: "Which rule did the story state?",
      correctKana: "としょかんで たべてはいけません。",
      distractorsKana: [
        "としょかんで たべてもいいです。",
        "としょかんで よんではいけません。",
        "としょかんで たべてください。",
      ],
      explanation: "たべて + はいけません = eating is prohibited.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m16-story-s2",
      narrative: [
        { kana: "うちに かえってから、さきに しゅくだいを します。" },
        { kana: "しゅくだいを してから、おんがくを ききます。" },
        { kana: "よる じゅうじに ねます。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "What does the narrator do FIRST after going home?",
          correctText: "Homework.",
          distractors: ["Listen to music.", "Watch TV.", "Take a shower."],
          explanation: "さきに しゅくだいを します = I do homework first.",
        },
        {
          id: "s2-q2",
          prompt: "When does the narrator go to bed?",
          correctText: "At 10 at night.",
          distractors: ["At 9 at night.", "At 10 in the morning.", "Right after homework."],
          explanation: "よる じゅうじに ねます = I go to bed at 10 at night.",
        },
      ],
      responseBuild: {
        target: "わたしは ほんを よむのが すきです",
        tiles: ["よむのが", "わたし", "ほん", "は", "すき", "を", "です"],
        correctOrder: ["わたし", "は", "ほん", "を", "よむのが", "すき", "です"],
        promptEn: "Reply with your own preference: 'I like reading books.'",
      },
    }),
    cloze(
      "ja-m16-story-cloze-1",
      "うちに かえって",
      "、しゅくだいを します。",
      "から",
      ["から", "はいけません", "もいいです", "ないで"],
      "After going home, I do homework.",
      "うちに かえってから、しゅくだいを します。",
      "てから = after doing (going home first, then homework).",
    ),
    listeningBuildSentence({
      id: "ja-m16-story-lb-1",
      target: "としょかんで たべてはいけません",
      tiles: ["たべて", "としょかん", "はいけません", "で", "もいいです", "ください"],
      correctOrder: ["としょかん", "で", "たべて", "はいけません"],
      promptEn: "Hear it, build it: 'You must not eat in the library.'",
    }),
    listeningCompSentence({
      id: "ja-m16-story-lc-1",
      audioText: "しゅくだいを してから おんがくを ききます",
      correctMeaningEn: "After doing homework, I listen to music.",
      distractorsEn: [
        "I do homework because of the music.",
        "Before doing homework, I listen to music.",
        "After listening to music, I do homework.",
      ],
    }),
    speaking(
      "ja-m16-story-speak-1",
      "ここで ほんを よんでもいいです",
      "You may read books here.",
    ),
    sentenceMcq({
      id: "ja-m16-story-mcq-summary",
      prompt: "What is the narrator's evening order?",
      correctKana: "Homework first, then music, bed at ten.",
      distractorsKana: [
        "Music first, then homework, bed at ten.",
        "Homework first, then TV, bed at nine.",
        "Shower first, then homework, then music.",
      ],
      explanation: "さきに しゅくだい → おんがく → よる じゅうじに ねます.",
    }),
    speaking(
      "ja-m16-story-speak-2",
      "さきに しゅくだいを します",
      "First, I do my homework.",
    ),
    infoStep(
      "ja-m16-story-info-end",
      "You followed a narrated day of rules and routines",
      "Library rules, homework before play, and your own preferences — prohibition, sequence, and のがすき all in one story.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M16_STORY.steps);
assertPassiveCardsHaveFollowup(M16_STORY.steps);
assertNoExplanationOnPassive(M16_STORY.steps);
assertExplanationDoesntLeakAnswer(M16_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-7-1 — Mixed drill (all te-form applications)
// ═══════════════════════════════════════════════════════════════════════

const M16_7_1_REVIEW = pickReviewAtoms("ja-m16-7-1-rev", M16_REVIEW_POOL, 6);

export const M16_7_1: LessonContent = {
  id: "ja-m16-7-1",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed te-form drill",
  description:
    "All four M16 grammar points + てもいい from M15 — mixed and interleaved.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m16-7-1-info-open",
      "Everything at once",
      "Prohibition, negative request, sequence, and preference — all mixed together. Every answer requires choosing the right grammar ending.",
    ),
    // ── Mixed discrimination ──
    sentenceMcq({
      id: "ja-m16-7-1-mcq-1",
      prompt: "Museum sign: 'No photography.' Which form?",
      correctKana: "しゃしんを とってはいけません。",
      distractorsKana: [
        "しゃしんを とらないでください。",
        "しゃしんを とってもいいです。",
        "しゃしんを とってから。",
      ],
      explanation: "Signs use てはいけません for strict prohibition.",
    }),
    cloze(
      "ja-m16-7-1-cloze-1",
      "シャワーを あびて",
      "、ねます。",
      "から",
      ["から", "はいけません", "もいいです", "の", "が"],
      "After taking a shower, I go to bed.",
      "シャワーを あびてから、ねます。",
      "て + から = time sequence.",
    ),
    build(
      "ja-m16-7-1-build-1",
      "Say: I like reading books.",
      "ほんを よむのが すきです",
      ["よむ", "すき", "ほん", "の", "が", "を", "です", "きらい"],
      ["ほん", "を", "よむ", "の", "が", "すき", "です"],
    ),
    listeningCompSentence({
      id: "ja-m16-7-1-lc-1",
      audioText: "この へんに えきが ありますか",
      correctMeaningEn: "Is there a station around here?",
      distractorsEn: [
        "Is there a station in front of here?",
        "Is the station far from here?",
        "Is there a classroom around here?",
      ],
    }),
    sentenceMcq({
      id: "ja-m16-7-1-mcq-2",
      prompt: "Asking a friend: 'May I use the elevator?'",
      correctKana: "エレベーターを つかってもいいですか。",
      distractorsKana: [
        "エレベーターを つかってはいけません。",
        "エレベーターを つかわないでください。",
        "エレベーターを つかってから。",
      ],
      explanation: "てもいいですか = 'May I…?' Question form.",
    }),
    cloze(
      "ja-m16-7-1-cloze-2",
      "でんしゃで たべて",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "から", "の", "が"],
      "You must not eat on the train.",
      "でんしゃで たべてはいけません。",
      "て + はいけません = prohibition.",
    ),
    build(
      "ja-m16-7-1-build-2",
      "Say: After playing with my friend, I go home.",
      "ともだちと あそんでから うちに かえります",
      ["あそんで", "ともだち", "かえります", "と", "うち", "から", "に"],
      ["ともだち", "と", "あそんで", "から", "うち", "に", "かえります"],
    ),
    listeningBuildSentence({
      id: "ja-m16-7-1-lb-1",
      target: "その ほんを よまないでください",
      tiles: ["よまないで", "その", "ください", "ほん", "を", "よんで"],
      correctOrder: ["その", "ほん", "を", "よまないで", "ください"],
      promptEn: "Hear it, build it: 'Please don't read that book.'",
    }),
    cloze(
      "ja-m16-7-1-cloze-3",
      "ともだちと あそぶ",
      " すきです。",
      "のが",
      ["のが", "から", "のを", "って"],
      "I like playing with friends.",
      "ともだちと あそぶのが すきです。",
      "の nominalizes; が marks the subject of すき.",
    ),
    sentenceMcq({
      id: "ja-m16-7-1-mcq-3",
      prompt: "Which means 'After going home, I cook.'?",
      correctKana: "うちに かえってから、りょうりを します。",
      distractorsKana: [
        "うちに かえるから、りょうりを します。",
        "うちに かえってはいけません。",
        "うちに かえってもいいです。",
      ],
      explanation: "かえってから = after going home. するから = because I do (wrong).",
    }),
    build(
      "ja-m16-7-1-build-3",
      "Say: You must not park here.",
      "ここに くるまを とめてはいけません",
      ["とめて", "くるま", "ここ", "はいけません", "に", "を", "もいいです"],
      ["ここ", "に", "くるま", "を", "とめて", "はいけません"],
    ),
    listeningCompSentence({
      id: "ja-m16-7-1-lc-2",
      audioText: "べんきょうするのが きらいです",
      correctMeaningEn: "I dislike studying.",
      distractorsEn: [
        "I like studying.",
        "I study.",
        "After studying, I do it.",
      ],
    }),
    cloze(
      "ja-m16-7-1-cloze-4",
      "ここで しゃしんを とら",
      "ください。",
      "ないで",
      ["ないで", "って", "なくて", "から"],
      "Please don't take photos here.",
      "ここで しゃしんを とらないでください。",
      "とる → とらない + でください.",
    ),
    selfExplain({
      id: "ja-m16-7-1-self",
      anchorLabel: "Four suffixes after て-form verbs",
      anchorAudioText: "すわってはいけません",
      question: "List what comes after the て-form:",
      rule: { text: "After て-form: もいい (permission), はいけません (prohibition), から (after doing), ください (please do). After ない-form: でください (please don't)." },
      surface: { text: "Only もいい and はいけません come after て-form. から and ください are unrelated." },
      distractor: { text: "All four suffixes also work after the ない-form with the same meaning." },
      ruleExplanation: "て-form connects to もいい, はいけません, から, ください. ない-form connects to でください. Different base, different meaning.",
    }),
    speaking(
      "ja-m16-7-1-speak",
      "ここに すわってはいけません",
      "You must not sit here.",
    ),
    // ── Review tail ──
    speaking("ja-m16-7-1-rev-speak-1", M16_7_1_REVIEW[0].kana, M16_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m16-7-1-rev-lc-1",
      audioText: M16_7_1_REVIEW[1].kana,
      correctMeaningEn: M16_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M16_7_1_REVIEW[2].meaningEn,
        M16_7_1_REVIEW[3].meaningEn,
        M16_7_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m16-7-1-rev-mcq-1", M16_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M16_REVIEW_POOL),
    speaking("ja-m16-7-1-rev-speak-2", M16_7_1_REVIEW[2].kana, M16_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m16-7-1-rev", M16_7_1_REVIEW),
    infoStep(
      "ja-m16-7-1-info-end",
      "You can deploy every te-form pattern on demand",
      "Permission, prohibition, negative request, sequence, preference — the full te-form toolkit mixed and mastered.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_7_1.steps);
assertAnswerRotation(M16_7_1.steps, 1);
assertNoConsecutiveSame(M16_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M16-7-2 — Production (translate + speaking)
// ═══════════════════════════════════════════════════════════════════════

const M16_7_2_REVIEW = pickReviewAtoms("ja-m16-7-2-rev", M16_REVIEW_POOL, 6);

export const M16_7_2: LessonContent = {
  id: "ja-m16-7-2",
  moduleId: "m16",
  courseId: COURSE,
  languageId: LANG,
  title: "Te-form production",
  description:
    "Production-heavy: translate, build, and speak all M16 patterns.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m16-7-2-info-open",
      "Full production wrap-up",
      "Build, translate, and speak: every M16 pattern in production direction.",
    ),
    // ── Production drills ──
    build(
      "ja-m16-7-2-build-1",
      "Say: You must not smoke in the park.",
      "こうえんで たばこを すってはいけません",
      ["すって", "たばこ", "こうえん", "はいけません", "で", "を", "もいいです"],
      ["こうえん", "で", "たばこ", "を", "すって", "はいけません"],
    ),
    speaking(
      "ja-m16-7-2-speak-1",
      "こうえんで たばこを すってはいけません",
      "You must not smoke in the park.",
    ),
    translateStep({
      id: "ja-m16-7-2-translate-1",
      promptEn: "Please don't take photos here.",
      acceptedAnswers: [
        "ここで しゃしんを とらないでください",
        "ここで しゃしんを とらないでください。",
      ],
      audioText: "ここで しゃしんを とらないでください",
    }),
    build(
      "ja-m16-7-2-build-2",
      "Say: After going home, I write a letter.",
      "うちに かえってから てがみを かきます",
      ["かえって", "てがみ", "うち", "かきます", "に", "を", "から"],
      ["うち", "に", "かえって", "から", "てがみ", "を", "かきます"],
    ),
    speaking(
      "ja-m16-7-2-speak-2",
      "うちに かえってから てがみを かきます",
      "After going home, I write a letter.",
    ),
    sentenceMcq({
      id: "ja-m16-7-2-mcq-1",
      prompt: "Which sentence means 'I like cooking.'?",
      correctKana: "りょうりを するのが すきです。",
      distractorsKana: [
        "りょうりを するのが きらいです。",
        "りょうりを するのを すきです。",
        "りょうりを してから すきです。",
      ],
      explanation: "するのが + すき = like doing.",
    }),
    build(
      "ja-m16-7-2-build-3",
      "Say: I dislike running.",
      "はしるのが きらいです",
      ["きらい", "はしる", "です", "の", "が", "すき"],
      ["はしる", "の", "が", "きらい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m16-7-2-lb-1",
      target: "きょうしつで ねてはいけません",
      tiles: ["ねて", "きょうしつ", "はいけません", "で", "もいいです", "おきて"],
      correctOrder: ["きょうしつ", "で", "ねて", "はいけません"],
      promptEn: "Hear it, build it: 'You must not sleep in the classroom.'",
    }),
    translateStep({
      id: "ja-m16-7-2-translate-2",
      promptEn: "After doing homework, I play.",
      acceptedAnswers: [
        "しゅくだいを してから あそびます",
        "しゅくだいを してから あそびます。",
        "しゅくだいを してから、あそびます",
        "しゅくだいを してから、あそびます。",
      ],
      audioText: "しゅくだいを してから あそびます",
    }),
    build(
      "ja-m16-7-2-build-4",
      "Say: Please don't enter the office.",
      "じむしょに はいらないでください",
      ["はいって", "じむしょ", "ください", "に", "はいらないで", "はいけません"],
      ["じむしょ", "に", "はいらないで", "ください"],
    ),
    speaking(
      "ja-m16-7-2-speak-3",
      "じむしょに はいらないでください",
      "Please don't enter the office.",
    ),
    listeningCompSentence({
      id: "ja-m16-7-2-lc-1",
      audioText: "うちに かえってから テレビを みます",
      correctMeaningEn: "After going home, I watch TV.",
      distractorsEn: [
        "I go home because of the TV.",
        "I watch TV and then go home.",
        "Before going home, I watch TV.",
      ],
    }),
    build(
      "ja-m16-7-2-build-5",
      "Say: I like watching TV.",
      "テレビを みるのが すきです",
      ["みるのが", "テレビ", "すき", "を", "です", "きらい"],
      ["テレビ", "を", "みるのが", "すき", "です"],
    ),
    cloze(
      "ja-m16-7-2-cloze-1",
      "かいだんで はしって",
      "。",
      "はいけません",
      ["はいけません", "もいいです", "から", "の", "が"],
      "You must not run on the stairs.",
      "かいだんで はしってはいけません。",
      "て + はいけません = prohibition on running on stairs.",
    ),
    selfExplain({
      id: "ja-m16-7-2-self",
      anchorLabel: "M16 patterns in production",
      anchorAudioText: "のまないでください",
      question: "What base form does ないでください use?",
      rule: { text: "ないでください uses the ない-form (plain negative) of the verb. さわる → さわらない → さわらないでください. The ない-form was taught in M11." },
      surface: { text: "ないでください uses the て-form, just like てはいけません." },
      distractor: { text: "ないでください uses the ます-form: さわります → さわりないでください." },
      ruleExplanation: "ないでください = [ない-form] + でください. てはいけません = [て-form] + はいけません. Different verb bases.",
    }),
    speaking(
      "ja-m16-7-2-speak-4",
      "こうえんで はしるのが すきです",
      "I like running in the park.",
    ),
    // ── Review tail ──
    speaking("ja-m16-7-2-rev-speak-1", M16_7_2_REVIEW[0].kana, M16_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m16-7-2-rev-lc-1",
      audioText: M16_7_2_REVIEW[1].kana,
      correctMeaningEn: M16_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M16_7_2_REVIEW[2].meaningEn,
        M16_7_2_REVIEW[3].meaningEn,
        M16_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m16-7-2-rev-mcq-1", M16_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M16_REVIEW_POOL),
    speaking("ja-m16-7-2-rev-speak-2", M16_7_2_REVIEW[2].kana, M16_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m16-7-2-rev", M16_7_2_REVIEW),
    infoStep(
      "ja-m16-7-2-info-end",
      "You can produce every te-form pattern from memory",
      "Prohibition, negative requests, time sequences, and preference — all in production. Te-form Part 2 complete.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M16_7_2.steps);
assertAnswerRotation(M16_7_2.steps, 1);
assertNoConsecutiveSame(M16_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M16_1_1.steps,
  ...M16_1_2.steps,
  ...M16_2_1.steps,
  ...M16_2_2.steps,
  ...M16_3_1.steps,
  ...M16_3_2.steps,
  ...M16_4_1.steps,
  ...M16_4_2.steps,
  ...M16_5_1.steps,
  ...M16_5_2.steps,
  ...M16_6_1.steps,
  ...M16_6_2.steps,
  ...M16_7_1.steps,
  ...M16_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M16_1_1, M16_1_2, M16_2_1, M16_2_2, M16_3_1, M16_3_2,
  M16_4_1, M16_4_2, M16_5_1, M16_5_2, M16_6_1, M16_6_2,
  M16_STORY, M16_7_1, M16_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
