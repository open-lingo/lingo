/**
 * M26 — Explanatory & Excess (2026-05-25).
 *
 * M26 introduces:
 *   - 〜んです (explanatory の/ん: どうしたんですか — "what happened?")
 *   - 〜すぎる (too much: たべすぎた — "ate too much")
 *
 * Vocab (~20): つかれる (get tired), こまる (be troubled), おくれる (be late),
 *   まちがえる (make mistake), わすれる (forget), だから (so/therefore),
 *   でも (but), しかし (however), それで (and then), そして (and)
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * Story: Explaining why you're late / feeling unwell.
 *
 * ID scheme: ja-m26-{n}-{sub} e.g. ja-m26-1-1, ja-m26-1-2
 * Export names: M26_1_1, M26_1_2, M26_2_1, M26_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m26-1, etc.
 */
import type { LessonContent } from "../types";
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
} from "./_jaGrammarHelpers";
import {
  assertExplanationDoesntLeakAnswer,
  assertNoExplanationOnPassive,
  assertPassiveCardsHaveFollowup,
} from "./_stepAssertions";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Pool is M3-M7.
// ───────────────────────────────────────────────────────────────────────
const M26_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_N_DESU = grammarRule({
  id: "ja-m26-rule-n-desu",
  title: "〜んです — explanatory tone (giving/seeking reasons)",
  rule:
    "んです (casual: んだ) adds an explanatory or emotional tone. It signals 'the reason is…' or 'the thing is…' Before んです: verbs/い-adjectives use plain form; な-adjectives add な; nouns add な. For questions: どうしたんですか = 'What happened?' (asking for explanation).",
  examples: [
    {
      ja: "どうしたんですか。",
      romaji: "dou shitan desu ka.",
      en: "What happened? (What's the matter?)",
    },
    {
      ja: "きのう ねむれなかったんです。",
      romaji: "kinou nemurenakattan desu.",
      en: "The thing is, I couldn't sleep yesterday.",
    },
    {
      ja: "あたまが いたいんです。",
      romaji: "atama ga itain desu.",
      en: "It's that my head hurts. (explaining why)",
    },
  ],
  antiPattern: {
    ja: "あたまが いたいです。",
    romaji: "atama ga itai desu.",
    en: "(plain statement — no explanatory nuance)",
    why: "Without んです, it's a plain statement 'My head hurts.' With んです it implies 'The reason I look unwell is that my head hurts.' — an explanation.",
  },
  cultureNote:
    "んです is extremely common in everyday Japanese. It's softer than a bare statement and shows you're explaining context. Questions with んですか sound caring — 'What happened? Tell me about it.'",
});

const RULE_SUGIRU = grammarRule({
  id: "ja-m26-rule-sugiru",
  title: "〜すぎる — too much / excessively",
  rule:
    "To express 'too much' or 'excessively,' add すぎる to the verb stem or adjective stem. Verbs: ます-stem + すぎる (たべ + すぎる = たべすぎる). い-adjectives: drop い, add すぎる (たかい → たかすぎる). な-adjectives: stem + すぎる (しずか → しずかすぎる). すぎる itself conjugates like a regular る-verb.",
  examples: [
    {
      ja: "たべすぎました。",
      romaji: "tabesugimashita.",
      en: "I ate too much.",
    },
    {
      ja: "このかばんは たかすぎます。",
      romaji: "kono kaban wa takasugimasu.",
      en: "This bag is too expensive.",
    },
    {
      ja: "ゆうべ のみすぎて、あたまが いたいです。",
      romaji: "yuube nomisugite, atama ga itai desu.",
      en: "I drank too much last night, and my head hurts.",
    },
  ],
  antiPattern: {
    ja: "たべるすぎました。",
    romaji: "taberusugimashita.",
    en: "(broken — use the ます-stem, not dictionary form, before すぎる)",
    why: "すぎる attaches to the ます-stem (たべ, not たべる). Same rule as にいく.",
  },
  cultureNote:
    "すぎる is a go-to complaint pattern: 'too hot,' 'too expensive,' 'too tired.' Very useful for everyday grumbling.",
});

// ═══════════════════════════════════════════════════════════════════════
// M26-1-1 — Vocab intro: trouble verbs (first batch)
// ═══════════════════════════════════════════════════════════════════════

const M26_1_1_REVIEW = pickReviewAtoms("ja-m26-1-1-rev", M26_REVIEW_POOL, 4);

export const M26_1_1: LessonContent = {
  id: "ja-m26-1-1",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Trouble verbs I",
  description:
    "Learn verbs for everyday mishaps: つかれる, こまる, おくれる, まちがえる, わすれる.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m26-1-1-info-open",
      "When things go wrong",
      "Five verbs for the rough days — tired, troubled, late, wrong, forgotten. You'll need these to explain yourself.",
    ),
    // ── つかれる (get tired) ──
    build(
      "ja-m26-1-1-build-tsukareru",
      "Pick the Japanese word for: Get tired",
      "つかれる",
      ["つかれる", "こまる", "おくれる", "わすれる"],
      ["つかれる"],
    ),
    listeningCompSentence({
      id: "ja-m26-1-1-lc-tsukareru",
      audioText: "つかれる",
      correctMeaningEn: "get tired",
      distractorsEn: ["be late", "forget", "make a mistake"],
    }),
    // ── こまる (be troubled) ──
    build(
      "ja-m26-1-1-build-komaru",
      "Pick the Japanese word for: Be troubled / Be in difficulty",
      "こまる",
      ["こまる", "つかれる", "まちがえる", "おくれる"],
      ["こまる"],
    ),
    vocabMcq(
      "ja-m26-1-1-mcq-komaru",
      { kana: "こまる", meaningEn: "be troubled", emoji: "😰", fromModule: "m26" },
      M26_REVIEW_POOL,
    ),
    // ── おくれる (be late) ──
    build(
      "ja-m26-1-1-build-okureru",
      "Pick the Japanese word for: Be late",
      "おくれる",
      ["おくれる", "わすれる", "つかれる", "こまる"],
      ["おくれる"],
    ),
    speaking("ja-m26-1-1-speak-okureru", "おくれる", "Be late"),
    // ── まちがえる (make a mistake) ──
    build(
      "ja-m26-1-1-build-machigaeru",
      "Pick the Japanese word for: Make a mistake",
      "まちがえる",
      ["まちがえる", "おくれる", "わすれる", "つかれる"],
      ["まちがえる"],
    ),
    listeningCompSentence({
      id: "ja-m26-1-1-lc-machigaeru",
      audioText: "まちがえる",
      correctMeaningEn: "make a mistake",
      distractorsEn: ["be late", "get tired", "forget"],
    }),
    // ── わすれる (forget) ──
    build(
      "ja-m26-1-1-build-wasureru",
      "Pick the Japanese word for: Forget",
      "わすれる",
      ["わすれる", "まちがえる", "こまる", "おくれる"],
      ["わすれる"],
    ),
    vocabMcq(
      "ja-m26-1-1-mcq-wasureru",
      { kana: "わすれる", meaningEn: "forget", emoji: "🤔", fromModule: "m26" },
      M26_REVIEW_POOL,
    ),
    // ── Sentence drills with new vocab ──
    sentenceMcq({
      id: "ja-m26-1-1-mcq-sentence",
      prompt: "Which sentence means 'I was late.'?",
      correctKana: "おくれました。",
      distractorsKana: [
        "つかれました。",
        "わすれました。",
        "まちがえました。",
      ],
      explanation: "おくれる → おくれました = was late.",
    }),
    build(
      "ja-m26-1-1-build-tsukareta-sent",
      "Say: I'm tired today.",
      "きょうは つかれました",
      ["きょう", "は", "つかれました", "つかれる", "こまりました", "おくれました"],
      ["きょう", "は", "つかれました"],
    ),
    listeningBuildSentence({
      id: "ja-m26-1-1-lb-wasureru",
      target: "かさを わすれました",
      tiles: ["かさ", "を", "わすれました", "まちがえました", "おくれました", "つかれました"],
      correctOrder: ["かさ", "を", "わすれました"],
      promptEn: "Hear it, build it: 'I forgot my umbrella.'",
    }),
    selfExplain({
      id: "ja-m26-1-1-self-explain",
      anchorLabel: "おくれる vs わすれる",
      anchorAudioText: "おくれました",
      question: "What's the difference between おくれる and わすれる?",
      rule: { text: "おくれる = be late (time-related). わすれる = forget (memory-related). Different problems, different verbs." },
      surface: { text: "They mean the same thing — both relate to forgetting." },
      distractor: { text: "おくれる is the past tense of わすれる." },
      ruleExplanation:
        "おくれる (遅れる) = be late/delayed. わすれる (忘れる) = forget. Completely different meanings despite similar structure.",
    }),
    speaking(
      "ja-m26-1-1-speak-wasureru",
      "かさを わすれました",
      "I forgot my umbrella.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-1-1-rev-mcq-1", M26_1_1_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-1-1-rev-lc-1",
      audioText: M26_1_1_REVIEW[1].kana,
      correctMeaningEn: M26_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_1_1_REVIEW[2].meaningEn,
        M26_1_1_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m26-1-1-rev-speak-1", M26_1_1_REVIEW[2].kana, M26_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-1-1-rev", M26_1_1_REVIEW),
    infoStep(
      "ja-m26-1-1-info-end",
      "You can now describe everyday mishaps — tired, troubled, late, wrong, forgotten",
      "Five trouble verbs: つかれる, こまる, おくれる, まちがえる, わすれる.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_1_1.steps);
assertAnswerRotation(M26_1_1.steps, 1);
assertNoConsecutiveSame(M26_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-1-2 — Vocab intro: conjunctions (だから, でも, しかし, それで, そして)
// ═══════════════════════════════════════════════════════════════════════

const M26_1_2_REVIEW = pickReviewAtoms("ja-m26-1-2-rev", M26_REVIEW_POOL, 4);

export const M26_1_2: LessonContent = {
  id: "ja-m26-1-2",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Conjunctions — linking sentences",
  description:
    "Learn five conjunctions: だから, でも, しかし, それで, そして.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m26-1-2-info-open",
      "Connecting your thoughts",
      "Five words to link sentences together — so, but, however, and then, and. Your Japanese gets longer and richer.",
    ),
    // ── だから (so / therefore) ──
    build(
      "ja-m26-1-2-build-dakara",
      "Pick the Japanese word for: So / Therefore",
      "だから",
      ["だから", "でも", "しかし", "そして"],
      ["だから"],
    ),
    listeningCompSentence({
      id: "ja-m26-1-2-lc-dakara",
      audioText: "だから",
      correctMeaningEn: "so / therefore",
      distractorsEn: ["but", "however", "and then"],
    }),
    // ── でも (but) ──
    build(
      "ja-m26-1-2-build-demo",
      "Pick the Japanese word for: But",
      "でも",
      ["でも", "だから", "それで", "そして"],
      ["でも"],
    ),
    vocabMcq(
      "ja-m26-1-2-mcq-demo",
      { kana: "でも", meaningEn: "but", emoji: "🔄", fromModule: "m26" },
      M26_REVIEW_POOL,
    ),
    // ── しかし (however) ──
    build(
      "ja-m26-1-2-build-shikashi",
      "Pick the Japanese word for: However",
      "しかし",
      ["しかし", "でも", "だから", "それで"],
      ["しかし"],
    ),
    speaking("ja-m26-1-2-speak-shikashi", "しかし", "However"),
    // ── それで (and then / so) ──
    build(
      "ja-m26-1-2-build-sorede",
      "Pick the Japanese word for: And then / So",
      "それで",
      ["それで", "そして", "だから", "しかし"],
      ["それで"],
    ),
    listeningCompSentence({
      id: "ja-m26-1-2-lc-sorede",
      audioText: "それで",
      correctMeaningEn: "and then / so",
      distractorsEn: ["but", "therefore", "and"],
    }),
    // ── そして (and / and then) ──
    build(
      "ja-m26-1-2-build-soshite",
      "Pick the Japanese word for: And / And then",
      "そして",
      ["そして", "それで", "しかし", "でも"],
      ["そして"],
    ),
    speaking("ja-m26-1-2-speak-soshite", "そして", "And / And then"),
    // ── Sentence drills ──
    sentenceMcq({
      id: "ja-m26-1-2-mcq-sentence",
      prompt: "Which sentence means 'I'm tired. So I'll rest.'?",
      correctKana: "つかれました。だから やすみます。",
      distractorsKana: [
        "つかれました。でも やすみます。",
        "つかれました。しかし やすみます。",
        "つかれました。そして やすみます。",
      ],
      explanation: "だから = so/therefore (cause-effect). Tired → therefore rest.",
    }),
    build(
      "ja-m26-1-2-build-demo-sent",
      "Say: I was late. But the teacher wasn't angry.",
      "おくれました。でも せんせいは おこりませんでした",
      ["おくれました", "でも", "せんせい", "は", "おこりませんでした", "だから", "しかし"],
      ["おくれました", "でも", "せんせい", "は", "おこりませんでした"],
    ),
    listeningBuildSentence({
      id: "ja-m26-1-2-lb-soshite",
      target: "べんきょうしました。そして テストを うけました",
      tiles: ["べんきょうしました", "そして", "テスト", "を", "うけました", "だから", "でも"],
      correctOrder: ["べんきょうしました", "そして", "テスト", "を", "うけました"],
      promptEn: "Hear it, build it: 'I studied. And then I took the test.'",
    }),
    selfExplain({
      id: "ja-m26-1-2-self-explain",
      anchorLabel: "だから vs でも",
      anchorAudioText: "つかれました。だから やすみます",
      question: "What's the difference between だから and でも?",
      rule: { text: "だから = so/therefore (the next sentence FOLLOWS from the first). でも = but (the next sentence CONTRASTS the first)." },
      surface: { text: "They're interchangeable — both connect two sentences." },
      distractor: { text: "だから is formal and でも is casual — same meaning." },
      ruleExplanation:
        "だから (therefore) shows cause→effect. でも (but) shows contrast. Tired → therefore rest (だから). Late → but not angry (でも).",
    }),
    speaking(
      "ja-m26-1-2-speak-dakara",
      "つかれました。だから やすみます",
      "I'm tired. So I'll rest.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-1-2-rev-mcq-1", M26_1_2_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-1-2-rev-lc-1",
      audioText: M26_1_2_REVIEW[1].kana,
      correctMeaningEn: M26_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_1_2_REVIEW[2].meaningEn,
        M26_1_2_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m26-1-2-rev-speak-1", M26_1_2_REVIEW[2].kana, M26_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-1-2-rev", M26_1_2_REVIEW),
    infoStep(
      "ja-m26-1-2-info-end",
      "You can now connect sentences — cause, contrast, sequence, addition",
      "Five conjunctions: だから, でも, しかし, それで, そして.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_1_2.steps);
assertAnswerRotation(M26_1_2.steps, 1);
assertNoConsecutiveSame(M26_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-2-1 — Grammar: 〜んです (explanatory) + drill
// ═══════════════════════════════════════════════════════════════════════

const M26_2_1_REVIEW = pickReviewAtoms("ja-m26-2-1-rev", M26_REVIEW_POOL, 4);

export const M26_2_1: LessonContent = {
  id: "ja-m26-2-1",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Explaining — んです",
  description:
    "Add explanatory nuance with んです. Ask 'What happened?' and explain why.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m26-2-1-info-open",
      "What happened?",
      "One pattern — んです — turns a plain statement into an explanation. 'My head hurts' becomes 'The thing is, my head hurts.'",
    ),
    RULE_N_DESU,
    // ── Drills: んです ──
    cloze(
      "ja-m26-2-1-cloze-1",
      "あたまが いたい",
      "です。",
      "ん",
      ["ん", "の", "な", "と"],
      "It's that my head hurts. (explaining)",
      "あたまが いたいんです。",
      "い-adjective plain form + んです = explanatory.",
    ),
    sentenceMcq({
      id: "ja-m26-2-1-mcq-1",
      prompt: "Which sentence asks 'What happened?' (seeking explanation)?",
      correctKana: "どうしたんですか。",
      distractorsKana: [
        "どうしましたか。",
        "どうしたですか。",
        "どうするんですか。",
      ],
      explanation: "どうした + んですか = What happened? (explanatory question).",
    }),
    build(
      "ja-m26-2-1-build-1",
      "Say: The thing is, I couldn't sleep.",
      "ねむれなかったんです",
      ["ねむれなかった", "ん", "です", "ねむれない", "の", "ます"],
      ["ねむれなかった", "ん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m26-2-1-lc-1",
      audioText: "きのう ねむれなかったんです",
      correctMeaningEn: "The thing is, I couldn't sleep yesterday.",
      distractorsEn: [
        "I slept well yesterday.",
        "I couldn't sleep yesterday. (plain statement)",
        "I plan to sleep tonight.",
      ],
    }),
    cloze(
      "ja-m26-2-1-cloze-2",
      "おくれた",
      "です。すみません。",
      "ん",
      ["ん", "の", "こと", "と"],
      "The thing is, I was late. Sorry.",
      "おくれたんです。すみません。",
      "た-form + んです = explaining past event.",
    ),
    speaking(
      "ja-m26-2-1-speak-1",
      "どうしたんですか",
      "What happened?",
    ),
    build(
      "ja-m26-2-1-build-2",
      "Say: The thing is, I forgot my homework.",
      "しゅくだいを わすれたんです",
      ["しゅくだい", "を", "わすれた", "ん", "です", "わすれる", "こと"],
      ["しゅくだい", "を", "わすれた", "ん", "です"],
    ),
    cloze(
      "ja-m26-2-1-cloze-3",
      "でんしゃが おくれた",
      "です。",
      "ん",
      ["ん", "の", "つもり", "こと"],
      "The thing is, the train was late.",
      "でんしゃが おくれたんです。",
      "Explaining the reason: the train was delayed.",
    ),
    listeningBuildSentence({
      id: "ja-m26-2-1-lb-1",
      target: "あたまが いたいんです",
      tiles: ["あたま", "が", "いたい", "ん", "です", "いたくない", "の"],
      correctOrder: ["あたま", "が", "いたい", "ん", "です"],
      promptEn: "Hear it, build it: 'The thing is, my head hurts.'",
    }),
    sentenceMcq({
      id: "ja-m26-2-1-mcq-2",
      prompt: "Which sentence means 'The thing is, I'm in trouble.'?",
      correctKana: "こまっているんです。",
      distractorsKana: [
        "こまっています。",
        "こまるんです。",
        "こまったんです。",
      ],
      explanation: "ている form + んです = currently troubled (explanatory).",
    }),
    translateStep({
      id: "ja-m26-2-1-translate",
      promptEn: "What happened? (explanatory)",
      acceptedAnswers: [
        "どうしたんですか",
        "どうしたんですか。",
      ],
      audioText: "どうしたんですか",
    }),
    selfExplain({
      id: "ja-m26-2-1-self-explain",
      anchorLabel: "あたまが いたいです vs あたまが いたいんです",
      anchorAudioText: "あたまが いたいんです",
      question: "What does んです add that plain です doesn't?",
      rule: { text: "んです adds explanatory nuance — 'the reason is…' or 'the thing is…' It implies you're explaining a situation, not just stating a fact." },
      surface: { text: "んです is just a more polite version of です." },
      distractor: { text: "んです makes the sentence past tense." },
      ruleExplanation:
        "Plain: 'My head hurts' (neutral fact). With んです: 'The thing is, my head hurts' (explaining why you look unwell, why you need to leave, etc.).",
    }),
    speaking(
      "ja-m26-2-1-speak-2",
      "しゅくだいを わすれたんです",
      "The thing is, I forgot my homework.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-2-1-rev-mcq-1", M26_2_1_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-2-1-rev-lc-1",
      audioText: M26_2_1_REVIEW[1].kana,
      correctMeaningEn: M26_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_2_1_REVIEW[2].meaningEn,
        M26_2_1_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m26-2-1-rev-speak-1", M26_2_1_REVIEW[2].kana, M26_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-2-1-rev", M26_2_1_REVIEW),
    infoStep(
      "ja-m26-2-1-info-end",
      "You can now explain why things happened — not just state facts",
      "んです turns 'my head hurts' into 'the thing is, my head hurts.' Explanatory tone unlocked.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_2_1.steps);
assertAnswerRotation(M26_2_1.steps, 1);
assertNoConsecutiveSame(M26_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-2-2 — んです in context + conjunctions
// ═══════════════════════════════════════════════════════════════════════

const M26_2_2_REVIEW = pickReviewAtoms("ja-m26-2-2-rev", M26_REVIEW_POOL, 4);

export const M26_2_2: LessonContent = {
  id: "ja-m26-2-2",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Explaining with context",
  description:
    "Combine んです with conjunctions for natural explanations: 'The train was late. So I was late too.'",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m26-2-2-info-open",
      "Explanations in context",
      "Combine んです with だから, でも, and the trouble verbs — real excuse-making in Japanese.",
    ),
    build(
      "ja-m26-2-2-build-1",
      "Say: The train was late. So I was also late.",
      "でんしゃが おくれたんです。だから おくれました",
      ["でんしゃ", "が", "おくれた", "ん", "です", "だから", "おくれました", "でも"],
      ["でんしゃ", "が", "おくれた", "ん", "です", "だから", "おくれました"],
    ),
    cloze(
      "ja-m26-2-2-cloze-1",
      "つかれた",
      "です。だから はやく ねます。",
      "ん",
      ["ん", "の", "こと", "と"],
      "The thing is, I'm tired. So I'll sleep early.",
      "つかれたんです。だから はやく ねます。",
      "んです explains; だから gives the consequence.",
    ),
    listeningCompSentence({
      id: "ja-m26-2-2-lc-1",
      audioText: "まちがえたんです。でも だいじょうぶです",
      correctMeaningEn: "The thing is, I made a mistake. But it's okay.",
      distractorsEn: [
        "I made a mistake and it's a problem.",
        "I didn't make a mistake.",
        "I forgot but it's okay.",
      ],
    }),
    sentenceMcq({
      id: "ja-m26-2-2-mcq-1",
      prompt: "Which means 'I forgot my wallet. So I can't buy it.'?",
      correctKana: "さいふを わすれたんです。だから かえません。",
      distractorsKana: [
        "さいふを わすれたんです。でも かえません。",
        "さいふを わすれました。そして かいました。",
        "さいふを わすれたんです。しかし かいました。",
      ],
      explanation: "わすれた + んです (explaining) + だから (so) + can't buy.",
    }),
    cloze(
      "ja-m26-2-2-cloze-2",
      "こまっている",
      "です。たすけてください。",
      "ん",
      ["ん", "の", "つもり", "こと"],
      "The thing is, I'm in trouble. Please help.",
      "こまっているんです。たすけてください。",
      "ている + んです = explaining current state.",
    ),
    speaking(
      "ja-m26-2-2-speak-1",
      "でんしゃが おくれたんです",
      "The thing is, the train was late.",
    ),
    build(
      "ja-m26-2-2-build-2",
      "Say: I forgot my homework. However, the teacher was kind.",
      "しゅくだいを わすれたんです。しかし せんせいは やさしかったです",
      ["しゅくだい", "を", "わすれた", "ん", "です", "しかし", "せんせい", "は", "やさしかった", "です", "でも"],
      ["しゅくだい", "を", "わすれた", "ん", "です", "しかし", "せんせい", "は", "やさしかった", "です"],
    ),
    cloze(
      "ja-m26-2-2-cloze-3",
      "おくれたんです。",
      " だいじょうぶでした。",
      "でも",
      ["でも", "だから", "そして", "それで"],
      "I was late (explaining). But it was okay.",
      "おくれたんです。でも だいじょうぶでした。",
      "でも = but (contrast: late → but okay).",
    ),
    listeningBuildSentence({
      id: "ja-m26-2-2-lb-1",
      target: "つかれたんです。だから やすみます",
      tiles: ["つかれた", "ん", "です", "だから", "やすみます", "でも", "やすみません"],
      correctOrder: ["つかれた", "ん", "です", "だから", "やすみます"],
      promptEn: "Hear it, build it: 'I'm tired. So I'll rest.'",
    }),
    sentenceMcq({
      id: "ja-m26-2-2-mcq-2",
      prompt: "Which means 'What happened? Are you okay?'?",
      correctKana: "どうしたんですか。だいじょうぶですか。",
      distractorsKana: [
        "どうしましたか。だいじょうぶですか。",
        "どうしたんです。だいじょうぶです。",
        "どうするんですか。だいじょうぶですか。",
      ],
      explanation: "どうしたんですか (explanatory question) + concern follow-up.",
    }),
    translateStep({
      id: "ja-m26-2-2-translate",
      promptEn: "I'm tired. So I'll rest.",
      acceptedAnswers: [
        "つかれたんです。だから やすみます",
        "つかれたんです。だから やすみます。",
      ],
      audioText: "つかれたんです。だから やすみます",
    }),
    selfExplain({
      id: "ja-m26-2-2-self-explain",
      anchorLabel: "んです + だから",
      anchorAudioText: "でんしゃが おくれたんです。だから おくれました",
      question: "Why use んです before だから instead of just plain past?",
      rule: { text: "んです signals 'I'm explaining the reason.' Without it, だから still works but the explanation feels abrupt. んです + だから = smooth cause-to-effect." },
      surface: { text: "You always need んです before だから — it's a grammar rule." },
      distractor: { text: "んです makes the sentence past tense, which だから requires." },
      ruleExplanation:
        "んです isn't required before だから, but it adds the explanatory nuance — 'The thing is, the train was late. That's why I was late.' More natural.",
    }),
    speaking(
      "ja-m26-2-2-speak-2",
      "こまっているんです。たすけてください",
      "I'm in trouble. Please help.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-2-2-rev-mcq-1", M26_2_2_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-2-2-rev-lc-1",
      audioText: M26_2_2_REVIEW[1].kana,
      correctMeaningEn: M26_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_2_2_REVIEW[2].meaningEn,
        M26_2_2_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[3].meaningEn,
      ],
    }),
    speaking("ja-m26-2-2-rev-speak-1", M26_2_2_REVIEW[2].kana, M26_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-2-2-rev", M26_2_2_REVIEW),
    infoStep(
      "ja-m26-2-2-info-end",
      "You can now explain situations and link cause-and-effect naturally",
      "んです + conjunctions = smooth Japanese explanations.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_2_2.steps);
assertAnswerRotation(M26_2_2.steps, 1);
assertNoConsecutiveSame(M26_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-3-1 — Grammar: 〜すぎる (too much) + drill
// ═══════════════════════════════════════════════════════════════════════

const M26_3_1_REVIEW = pickReviewAtoms("ja-m26-3-1-rev", M26_REVIEW_POOL, 4);

export const M26_3_1: LessonContent = {
  id: "ja-m26-3-1",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Too much — すぎる",
  description:
    "Express excess with verb-stem / adjective-stem + すぎる.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m26-3-1-info-open",
      "Too much of everything",
      "One suffix — すぎる — turns any verb or adjective into 'too much.' Ate too much, too expensive, too tired.",
    ),
    RULE_SUGIRU,
    // ── Drills: すぎる ──
    cloze(
      "ja-m26-3-1-cloze-1",
      "たべ",
      "ました。",
      "すぎ",
      ["すぎ", "たい", "ない", "ます"],
      "I ate too much.",
      "たべすぎました。",
      "ます-stem (たべ) + すぎる → すぎました.",
    ),
    sentenceMcq({
      id: "ja-m26-3-1-mcq-1",
      prompt: "Which sentence means 'This is too expensive.'?",
      correctKana: "これは たかすぎます。",
      distractorsKana: [
        "これは たかいすぎます。",
        "これは たかすぎるです。",
        "これは たかいです。",
      ],
      explanation: "い-adjective: drop い, add すぎる. たかい → たかすぎる → たかすぎます.",
    }),
    build(
      "ja-m26-3-1-build-1",
      "Say: I drank too much.",
      "のみすぎました",
      ["のみ", "すぎ", "ました", "のむ", "すぎる", "ます"],
      ["のみ", "すぎ", "ました"],
    ),
    listeningCompSentence({
      id: "ja-m26-3-1-lc-1",
      audioText: "ゆうべ のみすぎました",
      correctMeaningEn: "I drank too much last night.",
      distractorsEn: [
        "I didn't drink last night.",
        "I drank a little last night.",
        "I want to drink tonight.",
      ],
    }),
    cloze(
      "ja-m26-3-1-cloze-2",
      "この へやは せま",
      "ます。",
      "すぎ",
      ["すぎ", "い", "くない", "たい"],
      "This room is too small/cramped.",
      "この へやは せますぎます。",
      "い-adj: drop い, add すぎる. せまい → せますぎる.",
    ),
    speaking(
      "ja-m26-3-1-speak-1",
      "たべすぎました",
      "I ate too much.",
    ),
    build(
      "ja-m26-3-1-build-2",
      "Say: This test is too difficult.",
      "この テストは むずかしすぎます",
      ["この", "テスト", "は", "むずかし", "すぎます", "むずかしい", "すぎる"],
      ["この", "テスト", "は", "むずかし", "すぎます"],
    ),
    cloze(
      "ja-m26-3-1-cloze-3",
      "はたらき",
      "て、つかれました。",
      "すぎ",
      ["すぎ", "たい", "ます", "ない"],
      "I worked too much and got tired.",
      "はたらきすぎて、つかれました。",
      "すぎる conjugates like a る-verb: すぎて (te-form).",
    ),
    listeningBuildSentence({
      id: "ja-m26-3-1-lb-1",
      target: "のみすぎて あたまが いたいです",
      tiles: ["のみ", "すぎて", "あたま", "が", "いたい", "です", "のんで", "すぎ"],
      correctOrder: ["のみ", "すぎて", "あたま", "が", "いたい", "です"],
      promptEn: "Hear it, build it: 'I drank too much and my head hurts.'",
    }),
    sentenceMcq({
      id: "ja-m26-3-1-mcq-2",
      prompt: "Which means 'I studied too much.'?",
      correctKana: "べんきょうしすぎました。",
      distractorsKana: [
        "べんきょうするすぎました。",
        "べんきょうすぎました。",
        "べんきょうをすぎました。",
      ],
      explanation: "する → し (ます-stem) + すぎる = しすぎる → しすぎました.",
    }),
    translateStep({
      id: "ja-m26-3-1-translate",
      promptEn: "I ate too much.",
      acceptedAnswers: [
        "たべすぎました",
        "たべすぎました。",
      ],
      audioText: "たべすぎました",
    }),
    selfExplain({
      id: "ja-m26-3-1-self-explain",
      anchorLabel: "たかい → たかすぎる (not たかいすぎる)",
      anchorAudioText: "これは たかすぎます",
      question: "Why たかすぎる and not たかいすぎる?",
      rule: { text: "For い-adjectives, drop the い before adding すぎる. たかい → たか + すぎる = たかすぎる." },
      surface: { text: "Both たかすぎる and たかいすぎる are correct." },
      distractor: { text: "たかい is special — most adjectives keep the い." },
      ruleExplanation:
        "All い-adjectives drop the final い: たかい→たかすぎる, おおきい→おおきすぎる, さむい→さむすぎる.",
    }),
    speaking(
      "ja-m26-3-1-speak-2",
      "この テストは むずかしすぎます",
      "This test is too difficult.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-3-1-rev-mcq-1", M26_3_1_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-3-1-rev-lc-1",
      audioText: M26_3_1_REVIEW[1].kana,
      correctMeaningEn: M26_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_3_1_REVIEW[2].meaningEn,
        M26_3_1_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m26-3-1-rev-speak-1", M26_3_1_REVIEW[2].kana, M26_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-3-1-rev", M26_3_1_REVIEW),
    infoStep(
      "ja-m26-3-1-info-end",
      "You can now complain about anything being too much — too expensive, too difficult, ate too much",
      "Verb stem / adj stem + すぎる = too much. Universal complaint pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_3_1.steps);
assertAnswerRotation(M26_3_1.steps, 1);
assertNoConsecutiveSame(M26_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-3-2 — すぎる in context + んです interleave
// ═══════════════════════════════════════════════════════════════════════

const M26_3_2_REVIEW = pickReviewAtoms("ja-m26-3-2-rev", M26_REVIEW_POOL, 4);

export const M26_3_2: LessonContent = {
  id: "ja-m26-3-2",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Too much + explaining",
  description:
    "Mix すぎる with んです for natural complaint-explanations: 'The thing is, I ate too much.'",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m26-3-2-info-open",
      "Explaining excess",
      "Combine すぎる and んです — 'The thing is, I drank too much. So my head hurts.'",
    ),
    build(
      "ja-m26-3-2-build-1",
      "Say: The thing is, I ate too much.",
      "たべすぎたんです",
      ["たべ", "すぎた", "ん", "です", "すぎる", "の", "ました"],
      ["たべ", "すぎた", "ん", "です"],
    ),
    cloze(
      "ja-m26-3-2-cloze-1",
      "のみすぎた",
      "です。だから あたまが いたいです。",
      "ん",
      ["ん", "の", "こと", "すぎ"],
      "The thing is, I drank too much. So my head hurts.",
      "のみすぎたんです。だから あたまが いたいです。",
      "すぎた + んです = explaining the excess.",
    ),
    listeningCompSentence({
      id: "ja-m26-3-2-lc-1",
      audioText: "はたらきすぎたんです。だから つかれました",
      correctMeaningEn: "The thing is, I worked too much. So I'm tired.",
      distractorsEn: [
        "I worked hard. So I'm happy.",
        "I didn't work enough. So I'm tired.",
        "I'm working. So I can't go.",
      ],
    }),
    sentenceMcq({
      id: "ja-m26-3-2-mcq-1",
      prompt: "Which means 'The thing is, this bag is too expensive.'?",
      correctKana: "この かばんは たかすぎるんです。",
      distractorsKana: [
        "この かばんは たかいんです。",
        "この かばんは たかすぎます。",
        "この かばんは たかいすぎるんです。",
      ],
      explanation: "たかすぎる + んです = explaining that it's too expensive.",
    }),
    cloze(
      "ja-m26-3-2-cloze-2",
      "べんきょうし",
      "て、つかれたんです。",
      "すぎ",
      ["すぎ", "たい", "ます", "ない"],
      "I studied too much and got tired. (explaining)",
      "べんきょうしすぎて、つかれたんです。",
      "すぎて (te-form) chains to つかれた.",
    ),
    speaking(
      "ja-m26-3-2-speak-1",
      "たべすぎたんです",
      "The thing is, I ate too much.",
    ),
    build(
      "ja-m26-3-2-build-2",
      "Say: The thing is, the room is too small.",
      "へやが せますぎるんです",
      ["へや", "が", "せま", "すぎる", "ん", "です", "せまい", "すぎ"],
      ["へや", "が", "せま", "すぎる", "ん", "です"],
    ),
    cloze(
      "ja-m26-3-2-cloze-3",
      "おくれたんです。",
      " のみすぎたんです。",
      "それで",
      ["それで", "だから", "でも", "そして"],
      "I was late. And then I drank too much. (explaining)",
      "おくれたんです。それで のみすぎたんです。",
      "それで = and then / and so (connecting events).",
    ),
    listeningBuildSentence({
      id: "ja-m26-3-2-lb-1",
      target: "のみすぎたんです。だから あたまが いたいです",
      tiles: ["のみ", "すぎた", "ん", "です", "だから", "あたま", "が", "いたい", "です", "でも"],
      correctOrder: ["のみ", "すぎた", "ん", "です", "だから", "あたま", "が", "いたい", "です"],
      promptEn: "Hear it, build it: 'I drank too much. So my head hurts.'",
    }),
    sentenceMcq({
      id: "ja-m26-3-2-mcq-2",
      prompt: "Which means 'I played too much. But I had fun.'?",
      correctKana: "あそびすぎました。でも たのしかったです。",
      distractorsKana: [
        "あそびすぎました。だから たのしかったです。",
        "あそぶすぎました。でも たのしかったです。",
        "あそびすぎました。そして たのしかったです。",
      ],
      explanation: "あそび (stem) + すぎる. でも = but (contrast).",
    }),
    translateStep({
      id: "ja-m26-3-2-translate",
      promptEn: "The thing is, I drank too much.",
      acceptedAnswers: [
        "のみすぎたんです",
        "のみすぎたんです。",
      ],
      audioText: "のみすぎたんです",
    }),
    selfExplain({
      id: "ja-m26-3-2-self-explain",
      anchorLabel: "たべすぎたんです vs たべすぎました",
      anchorAudioText: "たべすぎたんです",
      question: "What's the difference between たべすぎたんです and たべすぎました?",
      rule: { text: "たべすぎました = plain past statement ('I ate too much'). たべすぎたんです = explanatory ('The thing is, I ate too much' — explaining why I feel sick, etc.)." },
      surface: { text: "たべすぎたんです is more casual than たべすぎました." },
      distractor: { text: "たべすぎたんです means 'I want to eat too much.'" },
      ruleExplanation:
        "ました = polite past (statement of fact). た + んです = explanatory past (giving a reason or context).",
    }),
    speaking(
      "ja-m26-3-2-speak-2",
      "のみすぎたんです。だから あたまが いたいです",
      "I drank too much. So my head hurts.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-3-2-rev-mcq-1", M26_3_2_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-3-2-rev-lc-1",
      audioText: M26_3_2_REVIEW[1].kana,
      correctMeaningEn: M26_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_3_2_REVIEW[2].meaningEn,
        M26_3_2_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m26-3-2-rev-speak-1", M26_3_2_REVIEW[2].kana, M26_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-3-2-rev", M26_3_2_REVIEW),
    infoStep(
      "ja-m26-3-2-info-end",
      "You can now explain excessive situations — complaints with context",
      "すぎる + んです + conjunctions = natural Japanese grumbling.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_3_2.steps);
assertAnswerRotation(M26_3_2.steps, 1);
assertNoConsecutiveSame(M26_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-4-1 — Interleaved drill (んです + すぎる + conjunctions)
// ═══════════════════════════════════════════════════════════════════════

const M26_4_1_REVIEW = pickReviewAtoms("ja-m26-4-1-rev", M26_REVIEW_POOL, 4);

export const M26_4_1: LessonContent = {
  id: "ja-m26-4-1",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill — explain & excess",
  description:
    "Rapid-fire interleave of んです, すぎる, and conjunctions.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m26-4-1-info-open",
      "Pattern discrimination",
      "Every answer could be ん, すぎ, だから, or でも. Choose the right one.",
    ),
    cloze(
      "ja-m26-4-1-cloze-1",
      "おくれた",
      "です。すみません。",
      "ん",
      ["ん", "すぎ", "こと", "の"],
      "The thing is, I was late. Sorry.",
      "おくれたんです。すみません。",
      "んです = explaining the situation.",
    ),
    sentenceMcq({
      id: "ja-m26-4-1-mcq-1",
      prompt: "Which means 'I ate too much.'?",
      correctKana: "たべすぎました。",
      distractorsKana: [
        "たべたんです。",
        "たべるすぎました。",
        "たべないんです。",
      ],
      explanation: "たべ (stem) + すぎ + ました = ate too much.",
    }),
    cloze(
      "ja-m26-4-1-cloze-2",
      "のみ",
      "て、きぶんが わるいんです。",
      "すぎ",
      ["すぎ", "たい", "ん", "ます"],
      "I drank too much and feel sick.",
      "のみすぎて、きぶんが わるいんです。",
      "すぎて chains to the result; んです explains.",
    ),
    build(
      "ja-m26-4-1-build-1",
      "Say: I was late. But it was okay.",
      "おくれたんです。でも だいじょうぶでした",
      ["おくれた", "ん", "です", "でも", "だいじょうぶ", "でした", "だから", "しかし"],
      ["おくれた", "ん", "です", "でも", "だいじょうぶ", "でした"],
    ),
    listeningCompSentence({
      id: "ja-m26-4-1-lc-1",
      audioText: "わすれたんです。だから こまっています",
      correctMeaningEn: "The thing is, I forgot. So I'm in trouble.",
      distractorsEn: [
        "I forgot. But I'm not in trouble.",
        "I forgot too much.",
        "I'm troubled. So I forgot.",
      ],
    }),
    cloze(
      "ja-m26-4-1-cloze-3",
      "はたらき",
      "て、つかれました。",
      "すぎ",
      ["すぎ", "ん", "たい", "ます"],
      "I worked too much and got tired.",
      "はたらきすぎて、つかれました。",
      "すぎて = too much, chaining to result.",
    ),
    speaking(
      "ja-m26-4-1-speak-1",
      "わすれたんです。だから こまっています",
      "I forgot. So I'm in trouble.",
    ),
    build(
      "ja-m26-4-1-build-2",
      "Say: This is too big. I'm troubled.",
      "これは おおきすぎます。こまっています",
      ["これ", "は", "おおき", "すぎます", "こまっています", "おおきい", "すぎる"],
      ["これ", "は", "おおき", "すぎます", "こまっています"],
    ),
    cloze(
      "ja-m26-4-1-cloze-4",
      "まちがえた",
      "です。すみません。",
      "ん",
      ["ん", "すぎ", "の", "こと"],
      "The thing is, I made a mistake. Sorry.",
      "まちがえたんです。すみません。",
      "んです = explanation.",
    ),
    listeningBuildSentence({
      id: "ja-m26-4-1-lb-1",
      target: "たかすぎるんです。かえません",
      tiles: ["たか", "すぎる", "ん", "です", "かえません", "たかい", "かいます"],
      correctOrder: ["たか", "すぎる", "ん", "です", "かえません"],
      promptEn: "Hear it, build it: 'It's too expensive. I can't buy it.'",
    }),
    sentenceMcq({
      id: "ja-m26-4-1-mcq-2",
      prompt: "Which means 'I'm tired. However, I'll keep working.'?",
      correctKana: "つかれました。しかし はたらきます。",
      distractorsKana: [
        "つかれました。だから はたらきます。",
        "つかれました。そして はたらきます。",
        "つかれました。それで はたらきます。",
      ],
      explanation: "しかし = however (formal contrast). Tired → yet continuing.",
    }),
    translateStep({
      id: "ja-m26-4-1-translate",
      promptEn: "This is too expensive.",
      acceptedAnswers: [
        "これは たかすぎます",
        "これは たかすぎます。",
        "たかすぎます",
      ],
      audioText: "これは たかすぎます",
    }),
    selfExplain({
      id: "ja-m26-4-1-self-explain",
      anchorLabel: "んです vs すぎる — different jobs",
      anchorAudioText: "のみすぎたんです",
      question: "In のみすぎたんです, what does すぎ contribute vs ん?",
      rule: { text: "すぎ = 'too much' (excess). ん = 'the thing is…' (explanation). Together: 'The thing is, I drank too much.'" },
      surface: { text: "すぎ and ん both mean 'too much' — they reinforce each other." },
      distractor: { text: "すぎ makes it past tense and ん makes it present." },
      ruleExplanation:
        "すぎる marks excess (too much). んです marks explanation (giving a reason). They stack: のみすぎたんです = 'The explanation is that I drank too much.'",
    }),
    speaking(
      "ja-m26-4-1-speak-2",
      "これは たかすぎます",
      "This is too expensive.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-4-1-rev-mcq-1", M26_4_1_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-4-1-rev-lc-1",
      audioText: M26_4_1_REVIEW[1].kana,
      correctMeaningEn: M26_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_4_1_REVIEW[2].meaningEn,
        M26_4_1_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m26-4-1-rev-speak-1", M26_4_1_REVIEW[2].kana, M26_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-4-1-rev", M26_4_1_REVIEW),
    infoStep(
      "ja-m26-4-1-info-end",
      "You can now discriminate between explanatory and excess patterns on the fly",
      "んです for explanations. すぎる for excess. Conjunctions to link them.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_4_1.steps);
assertAnswerRotation(M26_4_1.steps, 1);
assertNoConsecutiveSame(M26_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-4-2 — More interleaved drill + harder sentences
// ═══════════════════════════════════════════════════════════════════════

const M26_4_2_REVIEW = pickReviewAtoms("ja-m26-4-2-rev", M26_REVIEW_POOL, 4);

export const M26_4_2: LessonContent = {
  id: "ja-m26-4-2",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Complex explanations",
  description:
    "Longer sentences combining んです, すぎる, trouble verbs, and conjunctions.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m26-4-2-info-open",
      "Longer explanations",
      "Time for multi-clause explanations. 'I worked too much, so I'm tired. That's why I want to rest.'",
    ),
    build(
      "ja-m26-4-2-build-1",
      "Say: I made a mistake. I'm in trouble.",
      "まちがえたんです。こまっています",
      ["まちがえた", "ん", "です", "こまっています", "こまりました", "まちがえる"],
      ["まちがえた", "ん", "です", "こまっています"],
    ),
    cloze(
      "ja-m26-4-2-cloze-1",
      "かいもの",
      "て、おかねが ありません。",
      "しすぎ",
      ["しすぎ", "した", "する", "しない"],
      "I shopped too much and have no money.",
      "かいものしすぎて、おかねが ありません。",
      "し (ます-stem of する) + すぎて = did too much.",
    ),
    listeningCompSentence({
      id: "ja-m26-4-2-lc-1",
      audioText: "どうしたんですか。つかれたんですか",
      correctMeaningEn: "What happened? Are you tired? (explaining)",
      distractorsEn: [
        "What did you do? Did you sleep?",
        "How are you? I'm fine.",
        "What happened? I ate too much.",
      ],
    }),
    sentenceMcq({
      id: "ja-m26-4-2-mcq-1",
      prompt: "Which means 'I forgot my key. So I can't enter.'?",
      correctKana: "かぎを わすれたんです。だから はいれません。",
      distractorsKana: [
        "かぎを わすれたんです。でも はいれません。",
        "かぎを わすれました。そして はいります。",
        "かぎを わすれたんです。しかし はいりました。",
      ],
      explanation: "わすれた + んです (explaining) + だから (therefore) + can't enter.",
    }),
    cloze(
      "ja-m26-4-2-cloze-2",
      "ゆうべ ねむれなかった",
      "です。",
      "ん",
      ["ん", "すぎ", "の", "こと"],
      "The thing is, I couldn't sleep last night.",
      "ゆうべ ねむれなかったんです。",
      "ない past (なかった) + んです = explaining.",
    ),
    speaking(
      "ja-m26-4-2-speak-1",
      "まちがえたんです。こまっています",
      "I made a mistake. I'm in trouble.",
    ),
    build(
      "ja-m26-4-2-build-2",
      "Say: I slept too much. So I was late.",
      "ねすぎたんです。だから おくれました",
      ["ね", "すぎた", "ん", "です", "だから", "おくれました", "でも", "おくれたんです"],
      ["ね", "すぎた", "ん", "です", "だから", "おくれました"],
    ),
    cloze(
      "ja-m26-4-2-cloze-3",
      "この ラーメンは から",
      "ます。",
      "すぎ",
      ["すぎ", "い", "ん", "くない"],
      "This ramen is too spicy.",
      "この ラーメンは からすぎます。",
      "い-adj: からい → から + すぎる.",
    ),
    listeningBuildSentence({
      id: "ja-m26-4-2-lb-1",
      target: "わすれたんです。だから こまっています",
      tiles: ["わすれた", "ん", "です", "だから", "こまっています", "でも", "こまりました"],
      correctOrder: ["わすれた", "ん", "です", "だから", "こまっています"],
      promptEn: "Hear it, build it: 'I forgot. So I'm in trouble.'",
    }),
    sentenceMcq({
      id: "ja-m26-4-2-mcq-2",
      prompt: "Which means 'I studied too much and got a headache.'?",
      correctKana: "べんきょうしすぎて、あたまが いたいです。",
      distractorsKana: [
        "べんきょうしたんです。あたまが いたいです。",
        "べんきょうするすぎて、あたまが いたいです。",
        "べんきょうしすぎた ことが あります。",
      ],
      explanation: "しすぎて (too much, chaining) + result (headache).",
    }),
    translateStep({
      id: "ja-m26-4-2-translate",
      promptEn: "The thing is, I made a mistake. Sorry.",
      acceptedAnswers: [
        "まちがえたんです。すみません",
        "まちがえたんです。すみません。",
      ],
      audioText: "まちがえたんです。すみません",
    }),
    selfExplain({
      id: "ja-m26-4-2-self-explain",
      anchorLabel: "ねすぎたんです。だから おくれました",
      anchorAudioText: "ねすぎたんです",
      question: "This sentence stacks THREE patterns. What are they?",
      rule: { text: "すぎる (excess: slept too much) + んです (explaining: the thing is…) + だから (conjunction: therefore). Three layers in one natural excuse." },
      surface: { text: "Only two patterns: すぎる and んです. だから is just a regular word." },
      distractor: { text: "Only んです matters — the rest is normal grammar." },
      ruleExplanation:
        "すぎる = excess. んです = explanation. だから = cause-effect conjunction. All three combine for a complete excuse: 'The thing is I overslept, so I was late.'",
    }),
    speaking(
      "ja-m26-4-2-speak-2",
      "ねすぎたんです。だから おくれました",
      "I slept too much. So I was late.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-4-2-rev-mcq-1", M26_4_2_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-4-2-rev-lc-1",
      audioText: M26_4_2_REVIEW[1].kana,
      correctMeaningEn: M26_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_4_2_REVIEW[2].meaningEn,
        M26_4_2_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[7].meaningEn,
      ],
    }),
    speaking("ja-m26-4-2-rev-speak-1", M26_4_2_REVIEW[2].kana, M26_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-4-2-rev", M26_4_2_REVIEW),
    infoStep(
      "ja-m26-4-2-info-end",
      "You can now build multi-clause explanations that sound natural",
      "すぎる + んです + conjunctions stacking = real Japanese excuse-making.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_4_2.steps);
assertAnswerRotation(M26_4_2.steps, 1);
assertNoConsecutiveSame(M26_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-5-1 — Questioning with んですか + responding
// ═══════════════════════════════════════════════════════════════════════

const M26_5_1_REVIEW = pickReviewAtoms("ja-m26-5-1-rev", M26_REVIEW_POOL, 4);

export const M26_5_1: LessonContent = {
  id: "ja-m26-5-1",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Asking for explanations",
  description:
    "Use んですか to ask caring questions and respond with んです.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m26-5-1-info-open",
      "Caring questions",
      "んですか questions sound caring — 'What happened?' instead of just 'What did you do?'",
    ),
    build(
      "ja-m26-5-1-build-1",
      "Say: Are you tired? (caring)",
      "つかれたんですか",
      ["つかれた", "ん", "ですか", "つかれました", "つかれる", "か"],
      ["つかれた", "ん", "ですか"],
    ),
    cloze(
      "ja-m26-5-1-cloze-1",
      "どうした",
      "ですか。",
      "ん",
      ["ん", "の", "すぎ", "こと"],
      "What happened?",
      "どうしたんですか。",
      "どうした + んですか = asking for explanation.",
    ),
    listeningCompSentence({
      id: "ja-m26-5-1-lc-1",
      audioText: "おくれたんですか。だいじょうぶですか",
      correctMeaningEn: "Were you late? Are you okay?",
      distractorsEn: [
        "You were late. That's not okay.",
        "Are you late? Hurry up.",
        "I was late. I'm sorry.",
      ],
    }),
    sentenceMcq({
      id: "ja-m26-5-1-mcq-1",
      prompt: "Which is the caring way to ask 'Are you in trouble?'?",
      correctKana: "こまっているんですか。",
      distractorsKana: [
        "こまっていますか。",
        "こまるんですか。",
        "こまったですか。",
      ],
      explanation: "ている + んですか = caring explanatory question.",
    }),
    build(
      "ja-m26-5-1-build-2",
      "Say: Did you forget something? (caring)",
      "なにか わすれたんですか",
      ["なにか", "わすれた", "ん", "ですか", "わすれました", "わすれる", "か"],
      ["なにか", "わすれた", "ん", "ですか"],
    ),
    cloze(
      "ja-m26-5-1-cloze-2",
      "あたまが いたい",
      "ですか。",
      "ん",
      ["ん", "の", "すぎ", "こと"],
      "Does your head hurt? (caring)",
      "あたまが いたいんですか。",
      "い-adj + んですか = caring question.",
    ),
    speaking(
      "ja-m26-5-1-speak-1",
      "どうしたんですか",
      "What happened?",
    ),
    listeningBuildSentence({
      id: "ja-m26-5-1-lb-1",
      target: "つかれたんですか。やすんでください",
      tiles: ["つかれた", "ん", "ですか", "やすんで", "ください", "つかれました", "やすみます"],
      correctOrder: ["つかれた", "ん", "ですか", "やすんで", "ください"],
      promptEn: "Hear it, build it: 'Are you tired? Please rest.'",
    }),
    cloze(
      "ja-m26-5-1-cloze-3",
      "たべ",
      "たんですか。",
      "すぎ",
      ["すぎ", "ない", "たい", "ん"],
      "Did you eat too much? (caring)",
      "たべすぎたんですか。",
      "すぎた + んですか = asking about excess (caring).",
    ),
    sentenceMcq({
      id: "ja-m26-5-1-mcq-2",
      prompt: "Which response fits 'どうしたんですか。'?",
      correctKana: "あたまが いたいんです。",
      distractorsKana: [
        "あたまが いたいです。",
        "あたまが いたいんですか。",
        "あたまが いたくないです。",
      ],
      explanation: "Responding to んですか with んです = matching explanatory tone.",
    }),
    translateStep({
      id: "ja-m26-5-1-translate",
      promptEn: "Are you tired? (caring)",
      acceptedAnswers: [
        "つかれたんですか",
        "つかれたんですか。",
      ],
      audioText: "つかれたんですか",
    }),
    selfExplain({
      id: "ja-m26-5-1-self-explain",
      anchorLabel: "つかれましたか vs つかれたんですか",
      anchorAudioText: "つかれたんですか",
      question: "Why does つかれたんですか sound more caring?",
      rule: { text: "んですか shows you've noticed something and are asking for the explanation — it carries empathy. Plain ましたか is neutral/factual." },
      surface: { text: "んですか is just a more polite version — no emotional difference." },
      distractor: { text: "つかれたんですか is actually less caring because ん is casual." },
      ruleExplanation:
        "んですか = 'I notice something seems wrong — tell me about it.' It invites explanation and shows concern. ましたか = neutral factual question.",
    }),
    speaking(
      "ja-m26-5-1-speak-2",
      "なにか わすれたんですか",
      "Did you forget something?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-5-1-rev-mcq-1", M26_5_1_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-5-1-rev-lc-1",
      audioText: M26_5_1_REVIEW[1].kana,
      correctMeaningEn: M26_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_5_1_REVIEW[2].meaningEn,
        M26_5_1_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m26-5-1-rev-speak-1", M26_5_1_REVIEW[2].kana, M26_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-5-1-rev", M26_5_1_REVIEW),
    infoStep(
      "ja-m26-5-1-info-end",
      "You can now ask caring questions and give explanations in return",
      "んですか for caring questions. んです for caring answers.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_5_1.steps);
assertAnswerRotation(M26_5_1.steps, 1);
assertNoConsecutiveSame(M26_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-5-2 — Full pattern interleave + production
// ═══════════════════════════════════════════════════════════════════════

const M26_5_2_REVIEW = pickReviewAtoms("ja-m26-5-2-rev", M26_REVIEW_POOL, 4);

export const M26_5_2: LessonContent = {
  id: "ja-m26-5-2",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Everything interleaved",
  description:
    "All M26 patterns in varied contexts — explanations, excess, conjunctions, questions.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m26-5-2-info-open",
      "All patterns at once",
      "んです, すぎる, conjunctions, trouble verbs — everything mixed together.",
    ),
    cloze(
      "ja-m26-5-2-cloze-1",
      "のみ",
      "たんです。",
      "すぎ",
      ["すぎ", "ん", "たい", "ます"],
      "The thing is, I drank too much.",
      "のみすぎたんです。",
      "すぎた + んです = explaining excess.",
    ),
    sentenceMcq({
      id: "ja-m26-5-2-mcq-1",
      prompt: "Which means 'I was late. And then I made a mistake.'?",
      correctKana: "おくれました。そして まちがえました。",
      distractorsKana: [
        "おくれました。だから まちがえました。",
        "おくれました。でも まちがえました。",
        "おくれました。しかし まちがえました。",
      ],
      explanation: "そして = and/and then (sequence without cause-effect).",
    }),
    build(
      "ja-m26-5-2-build-1",
      "Say: What happened? Did you eat too much?",
      "どうしたんですか。たべすぎたんですか",
      ["どうした", "ん", "ですか", "たべ", "すぎた", "ん", "ですか", "どうしました"],
      ["どうした", "ん", "ですか", "たべ", "すぎた", "ん", "ですか"],
    ),
    cloze(
      "ja-m26-5-2-cloze-2",
      "わすれた",
      "です。すみません。",
      "ん",
      ["ん", "すぎ", "の", "こと"],
      "The thing is, I forgot. Sorry.",
      "わすれたんです。すみません。",
      "んです = explanation.",
    ),
    listeningCompSentence({
      id: "ja-m26-5-2-lc-1",
      audioText: "この テストは むずかしすぎるんです",
      correctMeaningEn: "The thing is, this test is too difficult.",
      distractorsEn: [
        "This test is difficult.",
        "This test was too easy.",
        "I forgot the test.",
      ],
    }),
    speaking(
      "ja-m26-5-2-speak-1",
      "どうしたんですか。たべすぎたんですか",
      "What happened? Did you eat too much?",
    ),
    cloze(
      "ja-m26-5-2-cloze-3",
      "つかれました。",
      " やすみたいです。",
      "だから",
      ["だから", "でも", "しかし", "そして"],
      "I'm tired. So I want to rest.",
      "つかれました。だから やすみたいです。",
      "だから = so/therefore (cause-effect).",
    ),
    build(
      "ja-m26-5-2-build-2",
      "Say: I worked too much. However, it was fun.",
      "はたらきすぎました。しかし たのしかったです",
      ["はたらき", "すぎました", "しかし", "たのしかった", "です", "でも", "つかれました"],
      ["はたらき", "すぎました", "しかし", "たのしかった", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m26-5-2-lb-1",
      target: "まちがえたんです。でも だいじょうぶです",
      tiles: ["まちがえた", "ん", "です", "でも", "だいじょうぶ", "です", "だから", "こまっています"],
      correctOrder: ["まちがえた", "ん", "です", "でも", "だいじょうぶ", "です"],
      promptEn: "Hear it, build it: 'I made a mistake. But it's okay.'",
    }),
    sentenceMcq({
      id: "ja-m26-5-2-mcq-2",
      prompt: "Which means 'This room is too small. I'm troubled.'?",
      correctKana: "この へやは せますぎます。こまっています。",
      distractorsKana: [
        "この へやは せまいんです。こまっています。",
        "この へやは せますぎます。でも だいじょうぶです。",
        "この へやは せまいすぎます。こまっています。",
      ],
      explanation: "せま + すぎる = too small. こまる = troubled.",
    }),
    translateStep({
      id: "ja-m26-5-2-translate",
      promptEn: "I worked too much. So I'm tired.",
      acceptedAnswers: [
        "はたらきすぎたんです。だから つかれました",
        "はたらきすぎたんです。だから つかれました。",
        "はたらきすぎました。だから つかれました",
      ],
      audioText: "はたらきすぎたんです。だから つかれました",
    }),
    selfExplain({
      id: "ja-m26-5-2-self-explain",
      anchorLabel: "でも vs しかし",
      anchorAudioText: "おくれました。でも だいじょうぶでした",
      question: "What's the difference between でも and しかし?",
      rule: { text: "Both mean 'but/however.' しかし is more formal and used in writing/speeches. でも is everyday conversation. Same meaning, different register." },
      surface: { text: "しかし is stronger than でも — it means 'absolutely not.'" },
      distractor: { text: "でも connects sentences and しかし connects words within a sentence." },
      ruleExplanation:
        "でも = but (casual/spoken). しかし = however (formal/written). Both show contrast. Choose based on formality.",
    }),
    speaking(
      "ja-m26-5-2-speak-2",
      "はたらきすぎました。しかし たのしかったです",
      "I worked too much. However, it was fun.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-5-2-rev-mcq-1", M26_5_2_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-5-2-rev-lc-1",
      audioText: M26_5_2_REVIEW[1].kana,
      correctMeaningEn: M26_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_5_2_REVIEW[2].meaningEn,
        M26_5_2_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[9].meaningEn,
      ],
    }),
    speaking("ja-m26-5-2-rev-speak-1", M26_5_2_REVIEW[2].kana, M26_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-5-2-rev", M26_5_2_REVIEW),
    infoStep(
      "ja-m26-5-2-info-end",
      "You can handle explanations, complaints, and linking — all in natural conversation",
      "All M26 patterns working together.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_5_2.steps);
assertAnswerRotation(M26_5_2.steps, 1);
assertNoConsecutiveSame(M26_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-6-1 — Production drill (build + speak + translate heavy)
// ═══════════════════════════════════════════════════════════════════════

const M26_6_1_REVIEW = pickReviewAtoms("ja-m26-6-1-rev", M26_REVIEW_POOL, 4);

export const M26_6_1: LessonContent = {
  id: "ja-m26-6-1",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — explain & complain",
  description:
    "Heavy production with all M26 grammar and vocab.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m26-6-1-info-open",
      "Show what you know",
      "Build, speak, and translate — produce M26 patterns from memory.",
    ),
    build(
      "ja-m26-6-1-build-1",
      "Say: The thing is, I'm late. The train was delayed.",
      "おくれたんです。でんしゃが おくれたんです",
      ["おくれた", "ん", "です", "でんしゃ", "が", "おくれた", "ん", "です", "おくれました"],
      ["おくれた", "ん", "です", "でんしゃ", "が", "おくれた", "ん", "です"],
    ),
    speaking(
      "ja-m26-6-1-speak-1",
      "おくれたんです。でんしゃが おくれたんです",
      "I'm late. The train was delayed.",
    ),
    listeningCompSentence({
      id: "ja-m26-6-1-lc-1",
      audioText: "たべすぎて おなかが いたいんです",
      correctMeaningEn: "I ate too much and my stomach hurts.",
      distractorsEn: [
        "I'm hungry.",
        "I didn't eat enough.",
        "I want to eat more.",
      ],
    }),
    build(
      "ja-m26-6-1-build-2",
      "Say: I drank too much. So I feel sick.",
      "のみすぎたんです。だから きぶんが わるいです",
      ["のみ", "すぎた", "ん", "です", "だから", "きぶん", "が", "わるい", "です", "でも"],
      ["のみ", "すぎた", "ん", "です", "だから", "きぶん", "が", "わるい", "です"],
    ),
    sentenceMcq({
      id: "ja-m26-6-1-mcq-1",
      prompt: "Which means 'What happened? Are you in trouble?'?",
      correctKana: "どうしたんですか。こまっているんですか。",
      distractorsKana: [
        "どうしましたか。こまっていますか。",
        "どうしたんですか。こまりましたか。",
        "どうするんですか。こまるんですか。",
      ],
      explanation: "Both questions use んですか = caring explanatory tone.",
    }),
    speaking(
      "ja-m26-6-1-speak-2",
      "のみすぎたんです。だから きぶんが わるいです",
      "I drank too much. So I feel sick.",
    ),
    build(
      "ja-m26-6-1-build-3",
      "Say: This coffee is too hot.",
      "この コーヒーは あつすぎます",
      ["この", "コーヒー", "は", "あつ", "すぎます", "あつい", "すぎる"],
      ["この", "コーヒー", "は", "あつ", "すぎます"],
    ),
    listeningBuildSentence({
      id: "ja-m26-6-1-lb-1",
      target: "かさを わすれたんです。こまっています",
      tiles: ["かさ", "を", "わすれた", "ん", "です", "こまっています", "だから", "わすれました"],
      correctOrder: ["かさ", "を", "わすれた", "ん", "です", "こまっています"],
      promptEn: "Hear it, build it: 'I forgot my umbrella. I'm in trouble.'",
    }),
    cloze(
      "ja-m26-6-1-cloze-1",
      "ねすぎた",
      "です。だから おくれました。",
      "ん",
      ["ん", "すぎ", "の", "こと"],
      "I slept too much. So I was late.",
      "ねすぎたんです。だから おくれました。",
      "すぎた + んです = explaining excess.",
    ),
    speaking(
      "ja-m26-6-1-speak-3",
      "この コーヒーは あつすぎます",
      "This coffee is too hot.",
    ),
    build(
      "ja-m26-6-1-build-4",
      "Say: I made a mistake. But it's okay.",
      "まちがえたんです。でも だいじょうぶです",
      ["まちがえた", "ん", "です", "でも", "だいじょうぶ", "です", "だから", "しかし"],
      ["まちがえた", "ん", "です", "でも", "だいじょうぶ", "です"],
    ),
    selfExplain({
      id: "ja-m26-6-1-self-explain",
      anchorLabel: "Full M26 production",
      anchorAudioText: "たべすぎたんです",
      question: "How do you turn 'I ate' into 'The thing is, I ate too much'?",
      rule: { text: "Start with the ます-stem (たべ), add すぎた (too much, past), add んです (explaining). たべすぎたんです." },
      surface: { text: "Just add んです to たべました: たべましたんです." },
      distractor: { text: "Add すぎる before the verb: すぎるたべたんです." },
      ruleExplanation:
        "Step by step: たべ (stem) + すぎる (too much) → たべすぎる. Past: たべすぎた. Explaining: たべすぎたんです.",
    }),
    speaking(
      "ja-m26-6-1-speak-4",
      "まちがえたんです。でも だいじょうぶです",
      "I made a mistake. But it's okay.",
    ),
    translateStep({
      id: "ja-m26-6-1-translate",
      promptEn: "I forgot my umbrella.",
      acceptedAnswers: [
        "かさを わすれました",
        "かさを わすれました。",
        "かさを わすれたんです",
        "かさを わすれたんです。",
      ],
      audioText: "かさを わすれました",
    }),
    // ── Review tail ──
    vocabMcq("ja-m26-6-1-rev-mcq-1", M26_6_1_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-6-1-rev-lc-1",
      audioText: M26_6_1_REVIEW[1].kana,
      correctMeaningEn: M26_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_6_1_REVIEW[2].meaningEn,
        M26_6_1_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[10].meaningEn,
      ],
    }),
    speaking("ja-m26-6-1-rev-speak-1", M26_6_1_REVIEW[2].kana, M26_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-6-1-rev", M26_6_1_REVIEW),
    infoStep(
      "ja-m26-6-1-info-end",
      "You can now produce explanations and complaints from memory",
      "All M26 patterns in production mode — explain, complain, connect.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_6_1.steps);
assertAnswerRotation(M26_6_1.steps, 1);
assertNoConsecutiveSame(M26_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-6-2 — Advanced production + conjunctions mastery
// ═══════════════════════════════════════════════════════════════════════

const M26_6_2_REVIEW = pickReviewAtoms("ja-m26-6-2-rev", M26_REVIEW_POOL, 5);

export const M26_6_2: LessonContent = {
  id: "ja-m26-6-2",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Advanced production",
  description:
    "Multi-sentence production with conjunctions, んです, and すぎる.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m26-6-2-info-open",
      "Everything together",
      "Multi-sentence production — explain, complain, link, and connect.",
    ),
    build(
      "ja-m26-6-2-build-1",
      "Say: I studied too much. And I'm tired.",
      "べんきょうしすぎました。そして つかれました",
      ["べんきょう", "しすぎました", "そして", "つかれました", "だから", "でも"],
      ["べんきょう", "しすぎました", "そして", "つかれました"],
    ),
    speaking(
      "ja-m26-6-2-speak-1",
      "べんきょうしすぎました。そして つかれました",
      "I studied too much. And I'm tired.",
    ),
    cloze(
      "ja-m26-6-2-cloze-1",
      "おくれたんです。",
      " せんせいは やさしかったです。",
      "しかし",
      ["しかし", "だから", "そして", "それで"],
      "I was late. However, the teacher was kind.",
      "おくれたんです。しかし せんせいは やさしかったです。",
      "しかし = however (formal contrast).",
    ),
    listeningCompSentence({
      id: "ja-m26-6-2-lc-1",
      audioText: "さいふを わすれたんです。それで かえりました",
      correctMeaningEn: "I forgot my wallet. And so I went home.",
      distractorsEn: [
        "I forgot my wallet. But I stayed.",
        "I lost my wallet. So I called the police.",
        "I forgot my wallet. However, I bought it.",
      ],
    }),
    build(
      "ja-m26-6-2-build-2",
      "Say: I'm in trouble. I made a mistake.",
      "こまっているんです。まちがえたんです",
      ["こまっている", "ん", "です", "まちがえた", "ん", "です", "こまりました"],
      ["こまっている", "ん", "です", "まちがえた", "ん", "です"],
    ),
    sentenceMcq({
      id: "ja-m26-6-2-mcq-1",
      prompt: "Which means 'I ate ramen. And then I ate dessert too.'?",
      correctKana: "ラーメンを たべました。そして デザートも たべました。",
      distractorsKana: [
        "ラーメンを たべました。だから デザートも たべました。",
        "ラーメンを たべました。でも デザートも たべました。",
        "ラーメンを たべました。しかし デザートも たべました。",
      ],
      explanation: "そして = and then (additive sequence).",
    }),
    speaking(
      "ja-m26-6-2-speak-2",
      "こまっているんです。まちがえたんです",
      "I'm in trouble. I made a mistake.",
    ),
    build(
      "ja-m26-6-2-build-3",
      "Say: This is too expensive. But I want it.",
      "たかすぎます。でも ほしいです",
      ["たか", "すぎます", "でも", "ほしい", "です", "だから", "しかし"],
      ["たか", "すぎます", "でも", "ほしい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m26-6-2-lb-1",
      target: "ねすぎたんです。それで おくれました",
      tiles: ["ね", "すぎた", "ん", "です", "それで", "おくれました", "だから", "おくれたんです"],
      correctOrder: ["ね", "すぎた", "ん", "です", "それで", "おくれました"],
      promptEn: "Hear it, build it: 'I slept too much. And so I was late.'",
    }),
    cloze(
      "ja-m26-6-2-cloze-2",
      "はたらき",
      "て、びょうきに なりました。",
      "すぎ",
      ["すぎ", "ん", "たい", "ます"],
      "I worked too much and got sick.",
      "はたらきすぎて、びょうきに なりました。",
      "すぎて (te-form) chains to the result.",
    ),
    sentenceMcq({
      id: "ja-m26-6-2-mcq-2",
      prompt: "Which means 'I forgot. And then I was in trouble.'?",
      correctKana: "わすれました。それで こまりました。",
      distractorsKana: [
        "わすれました。でも こまりました。",
        "わすれました。しかし こまりました。",
        "わすれました。そして こまりません。",
      ],
      explanation: "それで = and then/and so (event leads to result).",
    }),
    translateStep({
      id: "ja-m26-6-2-translate",
      promptEn: "I slept too much. So I was late.",
      acceptedAnswers: [
        "ねすぎたんです。だから おくれました",
        "ねすぎたんです。だから おくれました。",
        "ねすぎました。だから おくれました",
      ],
      audioText: "ねすぎたんです。だから おくれました",
    }),
    selfExplain({
      id: "ja-m26-6-2-self-explain",
      anchorLabel: "それで vs そして vs だから",
      anchorAudioText: "わすれました。それで こまりました",
      question: "How do それで, そして, and だから differ?",
      rule: { text: "だから = therefore (strong cause→effect). それで = and so (event→natural consequence). そして = and/and then (additive sequence, no strong cause). Different strengths of connection." },
      surface: { text: "They all mean the same thing — interchangeable." },
      distractor: { text: "だから is for positive outcomes, それで for negative, そして for neutral." },
      ruleExplanation:
        "だから = because of that → result. それで = and so → what happened next. そして = and also → adding information. Choose by the logical connection.",
    }),
    speaking(
      "ja-m26-6-2-speak-3",
      "たかすぎます。でも ほしいです",
      "It's too expensive. But I want it.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m26-6-2-rev-mcq-1", M26_6_2_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-6-2-rev-lc-1",
      audioText: M26_6_2_REVIEW[1].kana,
      correctMeaningEn: M26_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_6_2_REVIEW[2].meaningEn,
        M26_6_2_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[11].meaningEn,
      ],
    }),
    speaking("ja-m26-6-2-rev-speak-1", M26_6_2_REVIEW[2].kana, M26_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-6-2-rev", M26_6_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m26-6-2-info-end",
      "You can produce multi-sentence explanations with the right conjunctions",
      "だから, でも, しかし, それで, そして — each with its own job. M26 production mastered.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_6_2.steps);
assertAnswerRotation(M26_6_2.steps, 1);
assertNoConsecutiveSame(M26_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-STORY — Explaining why you're late / feeling unwell
// ═══════════════════════════════════════════════════════════════════════

export const M26_STORY: LessonContent = {
  id: "ja-m26-story",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Why I'm late",
  description:
    "Listen to someone explain why they're late and feeling unwell. Answer questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m26-story-info-open",
      "Story time — Why I'm late",
      "たけし arrives late to meet ゆき. Listen to him explain what happened.",
    ),
    dialogueListen({
      id: "ja-m26-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "たけしさん、おくれましたね。どうしたんですか。" },
        { speaker: "たけし", kana: "すみません。ねすぎたんです。" },
        { speaker: "ゆき", kana: "ねすぎたんですか。ゆうべ なにを したんですか。" },
        { speaker: "たけし", kana: "ともだちと のみすぎたんです。だから あたまも いたいです。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "Why was たけし late?",
          correctText: "He overslept.",
          distractors: ["The train was late.", "He forgot the time.", "He was sick."],
          explanation: "ねすぎたんです = I slept too much (explaining).",
        },
        {
          id: "s1-q2",
          prompt: "What did たけし do last night?",
          correctText: "He drank too much with friends.",
          distractors: ["He studied too much.", "He worked late.", "He ate too much."],
          explanation: "ともだちと のみすぎたんです = drank too much with friends.",
        },
      ],
    }),
    build(
      "ja-m26-story-build-1",
      "Say: I slept too much. (explaining)",
      "ねすぎたんです",
      ["ね", "すぎた", "ん", "です", "すぎる", "ました"],
      ["ね", "すぎた", "ん", "です"],
    ),
    sentenceMcq({
      id: "ja-m26-story-mcq-1",
      prompt: "How did ゆき ask what happened?",
      correctKana: "どうしたんですか。",
      distractorsKana: [
        "どうしましたか。",
        "なにを しましたか。",
        "だいじょうぶですか。",
      ],
      explanation: "どうしたんですか = What happened? (caring/explanatory).",
    }),
    dialogueListen({
      id: "ja-m26-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "だいじょうぶですか。きぶんは わるくないですか。" },
        { speaker: "たけし", kana: "すこし きぶんが わるいんです。でも だいじょうぶです。" },
        { speaker: "ゆき", kana: "そうですか。じゃあ、コーヒーを のみましょう。" },
        { speaker: "たけし", kana: "ありがとうございます。のみすぎないように します。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "How does たけし feel?",
          correctText: "A little unwell, but okay.",
          distractors: ["Very sick.", "Perfectly fine.", "Extremely tired."],
          explanation: "すこし きぶんが わるいんです。でも だいじょうぶです。",
        },
        {
          id: "s2-q2",
          prompt: "What does ゆき suggest?",
          correctText: "Let's drink coffee.",
          distractors: ["Let's go home.", "Let's go to the hospital.", "Let's eat something."],
          explanation: "コーヒーを のみましょう = Let's drink coffee.",
        },
      ],
    }),
    cloze(
      "ja-m26-story-cloze-1",
      "きぶんが わるい",
      "です。",
      "ん",
      ["ん", "すぎ", "の", "こと"],
      "The thing is, I feel unwell.",
      "きぶんが わるいんです。",
      "い-adj + んです = explaining state.",
    ),
    listeningBuildSentence({
      id: "ja-m26-story-lb-1",
      target: "ともだちと のみすぎたんです",
      tiles: ["ともだち", "と", "のみ", "すぎた", "ん", "です", "のんだ", "すぎる"],
      correctOrder: ["ともだち", "と", "のみ", "すぎた", "ん", "です"],
      promptEn: "Hear it, build it: 'I drank too much with friends.'",
    }),
    listeningCompSentence({
      id: "ja-m26-story-lc-1",
      audioText: "のみすぎないように します",
      correctMeaningEn: "I'll try not to drink too much.",
      distractorsEn: [
        "I'll drink more.",
        "I didn't drink too much.",
        "I don't want to drink.",
      ],
    }),
    speaking(
      "ja-m26-story-speak-1",
      "ねすぎたんです",
      "I slept too much. (explaining)",
    ),
    sentenceMcq({
      id: "ja-m26-story-mcq-summary",
      prompt: "Which M26 patterns appeared in the story?",
      correctKana: "Both んです and すぎる — plus conjunctions だから and でも.",
      distractorsKana: [
        "Only んです.",
        "Only すぎる.",
        "Only conjunctions.",
      ],
      explanation: "Both grammar patterns + multiple conjunctions = full M26 in context.",
    }),
    speaking(
      "ja-m26-story-speak-2",
      "どうしたんですか",
      "What happened?",
    ),
    infoStep(
      "ja-m26-story-info-end",
      "You followed a real conversation about being late and feeling unwell",
      "Explanations, excess, and conjunctions — all in one natural conversation. You'd fit right in.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M26_STORY.steps);
assertPassiveCardsHaveFollowup(M26_STORY.steps);
assertNoExplanationOnPassive(M26_STORY.steps);
assertExplanationDoesntLeakAnswer(M26_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-7-1 — Comprehension drill
// ═══════════════════════════════════════════════════════════════════════

const M26_7_1_REVIEW = pickReviewAtoms("ja-m26-7-1-rev", M26_REVIEW_POOL, 4);

export const M26_7_1: LessonContent = {
  id: "ja-m26-7-1",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Comprehension drill",
  description:
    "Listening + reading comprehension with all M26 patterns.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m26-7-1-info-open",
      "Listen and understand",
      "Can you understand explanations and complaints when you hear them?",
    ),
    listeningCompSentence({
      id: "ja-m26-7-1-lc-1",
      audioText: "たべすぎたんです。だから おなかが いたいです",
      correctMeaningEn: "I ate too much. So my stomach hurts.",
      distractorsEn: [
        "I'm hungry. So I want to eat.",
        "I ate too much. But I'm fine.",
        "I didn't eat. So I'm hungry.",
      ],
    }),
    sentenceMcq({
      id: "ja-m26-7-1-mcq-1",
      prompt: "Which means 'I was late. However, the meeting hadn't started.'?",
      correctKana: "おくれたんです。しかし かいぎは はじまっていませんでした。",
      distractorsKana: [
        "おくれたんです。だから かいぎは はじまっていませんでした。",
        "おくれたんです。そして かいぎは はじまりました。",
        "おくれました。それで かいぎは おわりました。",
      ],
      explanation: "しかし = however (contrast: late → but meeting hadn't started).",
    }),
    cloze(
      "ja-m26-7-1-cloze-1",
      "あつ",
      "て、のめません。",
      "すぎ",
      ["すぎ", "い", "ん", "くない"],
      "It's too hot and I can't drink it.",
      "あつすぎて、のめません。",
      "あつい → あつ + すぎて.",
    ),
    build(
      "ja-m26-7-1-build-1",
      "Say: What happened? Did you forget something?",
      "どうしたんですか。なにか わすれたんですか",
      ["どうした", "ん", "ですか", "なにか", "わすれた", "ん", "ですか", "どうしました"],
      ["どうした", "ん", "ですか", "なにか", "わすれた", "ん", "ですか"],
    ),
    listeningCompSentence({
      id: "ja-m26-7-1-lc-2",
      audioText: "こまっているんです。たすけてください",
      correctMeaningEn: "I'm in trouble. Please help.",
      distractorsEn: [
        "I'm not in trouble.",
        "I'm troubled but don't need help.",
        "Please don't help me.",
      ],
    }),
    cloze(
      "ja-m26-7-1-cloze-2",
      "わすれた",
      "です。すみません。",
      "ん",
      ["ん", "すぎ", "の", "こと"],
      "I forgot. Sorry. (explaining)",
      "わすれたんです。すみません。",
      "んです = explanatory tone.",
    ),
    speaking(
      "ja-m26-7-1-speak-1",
      "こまっているんです。たすけてください",
      "I'm in trouble. Please help.",
    ),
    sentenceMcq({
      id: "ja-m26-7-1-mcq-2",
      prompt: "Which means 'This bag is too heavy.'?",
      correctKana: "この かばんは おもすぎます。",
      distractorsKana: [
        "この かばんは おもいんです。",
        "この かばんは おもいすぎます。",
        "この かばんは おもくないです。",
      ],
      explanation: "おもい → おも + すぎる = too heavy.",
    }),
    build(
      "ja-m26-7-1-build-2",
      "Say: I made a mistake. And then I was in trouble.",
      "まちがえました。それで こまりました",
      ["まちがえました", "それで", "こまりました", "だから", "でも", "こまっています"],
      ["まちがえました", "それで", "こまりました"],
    ),
    listeningBuildSentence({
      id: "ja-m26-7-1-lb-1",
      target: "おくれたんです。すみません",
      tiles: ["おくれた", "ん", "です", "すみません", "おくれました", "ごめんなさい"],
      correctOrder: ["おくれた", "ん", "です", "すみません"],
      promptEn: "Hear it, build it: 'I'm late. Sorry. (explaining)'",
    }),
    cloze(
      "ja-m26-7-1-cloze-3",
      "のみ",
      "て、きもちが わるいです。",
      "すぎ",
      ["すぎ", "たい", "ん", "ます"],
      "I drank too much and feel nauseous.",
      "のみすぎて、きもちが わるいです。",
      "すぎて chains to the result.",
    ),
    selfExplain({
      id: "ja-m26-7-1-self-explain",
      anchorLabel: "んです pattern recognition",
      anchorAudioText: "おくれたんです",
      question: "When should you use んです instead of ました?",
      rule: { text: "Use んです when you're explaining a situation or giving a reason — 'The thing is…' When someone asks どうしたんですか, respond with んです." },
      surface: { text: "Always use んです — it's more polite than ました." },
      distractor: { text: "Use んです only for negative events and ました for positive ones." },
      ruleExplanation:
        "んです = explaining/giving context. ました = simple past statement. The choice depends on whether you're providing an explanation, not on politeness or positive/negative.",
    }),
    speaking(
      "ja-m26-7-1-speak-2",
      "まちがえました。それで こまりました",
      "I made a mistake. And then I was in trouble.",
    ),
    translateStep({
      id: "ja-m26-7-1-translate",
      promptEn: "The thing is, I was late. Sorry.",
      acceptedAnswers: [
        "おくれたんです。すみません",
        "おくれたんです。すみません。",
      ],
      audioText: "おくれたんです。すみません",
    }),
    // ── Review tail ──
    vocabMcq("ja-m26-7-1-rev-mcq-1", M26_7_1_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-7-1-rev-lc-1",
      audioText: M26_7_1_REVIEW[1].kana,
      correctMeaningEn: M26_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_7_1_REVIEW[2].meaningEn,
        M26_7_1_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[12].meaningEn,
      ],
    }),
    speaking("ja-m26-7-1-rev-speak-1", M26_7_1_REVIEW[2].kana, M26_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-7-1-rev", M26_7_1_REVIEW),
    infoStep(
      "ja-m26-7-1-info-end",
      "You can understand explanations and complaints in natural Japanese",
      "んです and すぎる comprehension — solid.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_7_1.steps);
assertAnswerRotation(M26_7_1.steps, 1);
assertNoConsecutiveSame(M26_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M26-7-2 — Final production
// ═══════════════════════════════════════════════════════════════════════

const M26_7_2_REVIEW = pickReviewAtoms("ja-m26-7-2-rev", M26_REVIEW_POOL, 5);

export const M26_7_2: LessonContent = {
  id: "ja-m26-7-2",
  moduleId: "m26",
  courseId: COURSE,
  languageId: LANG,
  title: "Final production — M26",
  description:
    "Full production with all M26 grammar, vocab, and conjunctions.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m26-7-2-info-open",
      "Final round",
      "Everything from M26 in production — show you can explain, complain, and connect naturally.",
    ),
    build(
      "ja-m26-7-2-build-1",
      "Say: What happened? Are you okay?",
      "どうしたんですか。だいじょうぶですか",
      ["どうした", "ん", "ですか", "だいじょうぶ", "ですか", "どうしました", "です"],
      ["どうした", "ん", "ですか", "だいじょうぶ", "ですか"],
    ),
    speaking(
      "ja-m26-7-2-speak-1",
      "どうしたんですか。だいじょうぶですか",
      "What happened? Are you okay?",
    ),
    listeningCompSentence({
      id: "ja-m26-7-2-lc-1",
      audioText: "ねすぎたんです。それで おくれました",
      correctMeaningEn: "I slept too much. And so I was late.",
      distractorsEn: [
        "I slept well. So I'm early.",
        "I overslept. But I wasn't late.",
        "I couldn't sleep. So I'm tired.",
      ],
    }),
    build(
      "ja-m26-7-2-build-2",
      "Say: I drank too much and my head hurts.",
      "のみすぎて あたまが いたいんです",
      ["のみ", "すぎて", "あたま", "が", "いたい", "ん", "です", "のんで", "いたくない"],
      ["のみ", "すぎて", "あたま", "が", "いたい", "ん", "です"],
    ),
    sentenceMcq({
      id: "ja-m26-7-2-mcq-1",
      prompt: "Which means 'I forgot my key. So I can't go in.'?",
      correctKana: "かぎを わすれたんです。だから はいれません。",
      distractorsKana: [
        "かぎを わすれたんです。でも はいれません。",
        "かぎを わすれました。そして はいりました。",
        "かぎを わすれたんです。しかし はいりました。",
      ],
      explanation: "わすれた + んです (explaining) + だから (so) + can't enter.",
    }),
    speaking(
      "ja-m26-7-2-speak-2",
      "のみすぎて あたまが いたいんです",
      "I drank too much and my head hurts.",
    ),
    build(
      "ja-m26-7-2-build-3",
      "Say: This is too spicy. I'm in trouble.",
      "からすぎます。こまっています",
      ["から", "すぎます", "こまっています", "からい", "すぎる", "こまりました"],
      ["から", "すぎます", "こまっています"],
    ),
    listeningBuildSentence({
      id: "ja-m26-7-2-lb-1",
      target: "まちがえたんです。でも だいじょうぶです",
      tiles: ["まちがえた", "ん", "です", "でも", "だいじょうぶ", "です", "だから", "すみません"],
      correctOrder: ["まちがえた", "ん", "です", "でも", "だいじょうぶ", "です"],
      promptEn: "Hear it, build it: 'I made a mistake. But it's okay.'",
    }),
    cloze(
      "ja-m26-7-2-cloze-1",
      "はたらきすぎた",
      "です。",
      "ん",
      ["ん", "すぎ", "の", "こと"],
      "The thing is, I worked too much.",
      "はたらきすぎたんです。",
      "すぎた + んです = explaining excess.",
    ),
    speaking(
      "ja-m26-7-2-speak-3",
      "からすぎます。こまっています",
      "It's too spicy. I'm in trouble.",
    ),
    build(
      "ja-m26-7-2-build-4",
      "Say: I forgot my umbrella. And then it rained.",
      "かさを わすれました。そして あめが ふりました",
      ["かさ", "を", "わすれました", "そして", "あめ", "が", "ふりました", "だから", "でも"],
      ["かさ", "を", "わすれました", "そして", "あめ", "が", "ふりました"],
    ),
    cloze(
      "ja-m26-7-2-cloze-2",
      "この テストは むずかし",
      "ます。",
      "すぎ",
      ["すぎ", "い", "ん", "くない"],
      "This test is too difficult.",
      "この テストは むずかしすぎます。",
      "むずかしい → むずかし + すぎる.",
    ),
    selfExplain({
      id: "ja-m26-7-2-self-explain",
      anchorLabel: "Full M26 mastery",
      anchorAudioText: "のみすぎたんです",
      question: "What makes M26's patterns so useful for everyday conversation?",
      rule: { text: "んです lets you explain WHY something happened (not just state it). すぎる lets you say something is TOO MUCH. Together with conjunctions, you can give complete explanations." },
      surface: { text: "They're only useful for formal situations like business meetings." },
      distractor: { text: "They're only for complaints — you can't use them for positive things." },
      ruleExplanation:
        "んです = context/explanation. すぎる = excess/complaint. Conjunctions = linking. These patterns power most everyday excuse-making, storytelling, and conversation.",
    }),
    speaking(
      "ja-m26-7-2-speak-4",
      "かさを わすれました。そして あめが ふりました",
      "I forgot my umbrella. And then it rained.",
    ),
    translateStep({
      id: "ja-m26-7-2-translate",
      promptEn: "I drank too much. So my head hurts.",
      acceptedAnswers: [
        "のみすぎたんです。だから あたまが いたいです",
        "のみすぎたんです。だから あたまが いたいです。",
        "のみすぎました。だから あたまが いたいです",
      ],
      audioText: "のみすぎたんです。だから あたまが いたいです",
    }),
    // ── Review tail ──
    vocabMcq("ja-m26-7-2-rev-mcq-1", M26_7_2_REVIEW[0], M26_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m26-7-2-rev-lc-1",
      audioText: M26_7_2_REVIEW[1].kana,
      correctMeaningEn: M26_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M26_7_2_REVIEW[2].meaningEn,
        M26_7_2_REVIEW[3].meaningEn,
        M26_REVIEW_POOL[13].meaningEn,
      ],
    }),
    speaking("ja-m26-7-2-rev-speak-1", M26_7_2_REVIEW[2].kana, M26_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m26-7-2-rev", M26_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m26-7-2-info-end",
      "You can now explain, complain, ask caring questions, and link sentences naturally",
      "All M26 grammar mastered: んです, すぎる, and five conjunctions — in full production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M26_7_2.steps);
assertAnswerRotation(M26_7_2.steps, 1);
assertNoConsecutiveSame(M26_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M26_1_1.steps,
  ...M26_1_2.steps,
  ...M26_2_1.steps,
  ...M26_2_2.steps,
  ...M26_3_1.steps,
  ...M26_3_2.steps,
  ...M26_4_1.steps,
  ...M26_4_2.steps,
  ...M26_5_1.steps,
  ...M26_5_2.steps,
  ...M26_6_1.steps,
  ...M26_6_2.steps,
  ...M26_7_1.steps,
  ...M26_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M26_1_1, M26_1_2, M26_2_1, M26_2_2, M26_3_1, M26_3_2,
  M26_4_1, M26_4_2, M26_5_1, M26_5_2, M26_6_1, M26_6_2,
  M26_STORY, M26_7_1, M26_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
