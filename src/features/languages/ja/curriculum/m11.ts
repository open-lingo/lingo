/**
 * M11 — Negation (ません, ない-form, まだ/もう).
 *
 * M11 introduces:
 *   - ます negative: たべません (polite negative present)
 *   - ます past negative: たべませんでした (polite negative past)
 *   - ない-form intro: たべない, のまない (casual/plain negative)
 *   - まだ + もう (aspect markers: still/not yet, already)
 *
 * Prereqs: polite past (M10), adjective conjugation (M8-M9), verbs (M7).
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * Key teaching point: あまり and ぜんぜん REQUIRE negative predicates.
 *
 * ID scheme: ja-m11-{n}-{sub} e.g. ja-m11-1-1, ja-m11-1-2
 * Export names: M11_1_1, M11_1_2, M11_2_1, M11_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m11-1, etc.
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
  translateStep,
  vocabMcq,
  assertNoSameAnswerCluster,
  assertAnswerRotation,
  assertNoConsecutiveSame,
  storyComprehension,
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
const M11_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) =>
      a.fromModule === "m3" ||
      a.fromModule === "m4" ||
      a.fromModule === "m5" ||
      a.fromModule === "m6" ||
      a.fromModule === "m7",
  ),
);
const M11_REVIEW_M3_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
);
const M11_REVIEW_M4_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m4"),
);
const M11_REVIEW_M5_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m5"),
);
const M11_REVIEW_M6_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m6"),
);
const M11_REVIEW_M7_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m7"),
);

// ═══════════════════════════════════════════════════════════════════════
// Grammar rules (defined once, reused across sub-lessons)
// ═══════════════════════════════════════════════════════════════════════

const RULE_MASEN = grammarRule({
  id: "ja-m11-1-1-rule-masen",
  grammarPointId: "masu-negative",
  title: "ません — polite negative present",
  rule:
    "To negate a ます-form verb, replace ます with ません. This is the polite present-tense negative: 'I don't [verb].'",
  examples: [
    {
      ja: "たべません。",
      romaji: "tabemasen.",
      en: "I don't eat (it).",
    },
    {
      ja: "のみません。",
      romaji: "nomimasen.",
      en: "I don't drink (it).",
    },
    {
      ja: "いきません。",
      romaji: "ikimasen.",
      en: "I don't go.",
    },
  ],
  antiPattern: {
    ja: "たべますない。",
    romaji: "tabemasu nai.",
    en: "(broken — mixing polite ます with plain ない)",
    why: "Polite negation replaces the entire ます ending with ません. Don't add ない after ます.",
  },
  cultureNote:
    "ません is the polite form used in most daily conversations with people you don't know well.",
});

const RULE_MASEN_DESHITA = grammarRule({
  id: "ja-m11-2-1-rule-masen-deshita",
  grammarPointId: "masu-past-negative",
  title: "ませんでした — polite negative past",
  rule:
    "To say 'didn't [verb]' in polite form, replace ます with ませんでした. This is the polite past-tense negative.",
  examples: [
    {
      ja: "たべませんでした。",
      romaji: "tabemasen deshita.",
      en: "I didn't eat (it).",
    },
    {
      ja: "いきませんでした。",
      romaji: "ikimasen deshita.",
      en: "I didn't go.",
    },
  ],
  antiPattern: {
    ja: "たべましたません。",
    romaji: "tabemashita masen.",
    en: "(broken — stacking past + negative in wrong order)",
    why: "ませんでした is a single unit: ません + でした. Don't mix ました with ません.",
  },
  cultureNote:
    "The four polite forms: たべます (affirmative), たべません (negative), たべました (past), たべませんでした (past negative).",
});

const RULE_AMARI_ZENZEN = grammarRule({
  id: "ja-m11-3-1-rule-amari-zenzen",
  title: "あまり / ぜんぜん + negative",
  rule:
    "あまり (not much) and ぜんぜん (not at all) ALWAYS pair with a negative verb. These adverbs inherently expect negation — using them with a positive verb is ungrammatical.",
  examples: [
    {
      ja: "あまり たべません。",
      romaji: "amari tabemasen.",
      en: "I don't eat much.",
    },
    {
      ja: "ぜんぜん わかりません。",
      romaji: "zenzen wakarimasen.",
      en: "I don't understand at all.",
    },
  ],
  antiPattern: {
    ja: "ぜんぜん たべます。",
    romaji: "zenzen tabemasu.",
    en: "(broken — ぜんぜん with positive verb)",
    why: "ぜんぜん requires a negative. It means 'not at all' — it can't modify a positive predicate.",
  },
  cultureNote:
    "In very casual modern speech, ぜんぜん + positive (ぜんぜん おいしい = 'totally delicious') exists as slang, but this is non-standard. In N5-level polite Japanese, always pair with a negative.",
});

const RULE_NAI_FORM = grammarRule({
  id: "ja-m11-4-1-rule-nai",
  grammarPointId: "nai-form",
  title: "ない-form — plain negative",
  rule:
    "The ない-form is the casual/plain negative. Rules: (1) Ichidan (ru-verbs): drop る, add ない → たべる→たべない. (2) Godan (u-verbs): change the u-row kana to its a-row counterpart, add ない → のむ→のまない, いく→いかない. (3) Irregular: する→しない, くる→こない. (4) Special: ある→ない (NOT あらない).",
  examples: [
    {
      ja: "たべない。",
      romaji: "tabenai.",
      en: "I don't eat. (casual)",
    },
    {
      ja: "のまない。",
      romaji: "nomanai.",
      en: "I don't drink. (casual)",
    },
    {
      ja: "しない。",
      romaji: "shinai.",
      en: "I don't do (it). (casual)",
    },
  ],
  antiPattern: {
    ja: "あらない。",
    romaji: "aranai.",
    en: "(broken — ある is irregular in ない-form)",
    why: "ある is a special exception: its negative is simply ない, not あらない. This is one of the three irregular ない-forms you must memorize.",
  },
  cultureNote:
    "The ない-form is used with close friends and family. In formal situations, stick with ません.",
});

const RULE_MADA_MOU = grammarRule({
  id: "ja-m11-5-1-rule-mada-mou",
  grammarPointId: "mada-mou",
  title: "まだ (still / not yet) + もう (already)",
  rule:
    "まだ means 'still' or 'not yet' — it pairs with negative verbs to express 'haven't done yet.' もう means 'already' — it pairs with past-tense verbs to express 'already did.' When answering もう questions negatively, say まだです (not yet).",
  examples: [
    {
      ja: "まだ たべていません。",
      romaji: "mada tabete imasen.",
      en: "I haven't eaten yet.",
    },
    {
      ja: "もう たべました。",
      romaji: "mou tabemashita.",
      en: "I already ate.",
    },
    {
      ja: "まだです。",
      romaji: "mada desu.",
      en: "Not yet.",
    },
  ],
  antiPattern: {
    ja: "もう たべません。",
    romaji: "mou tabemasen.",
    en: "(unnatural — this would mean 'I won't eat anymore' not 'I already ate')",
    why: "もう + negative = 'no longer / not anymore' — a different meaning. For 'already did,' use もう + past tense.",
  },
  cultureNote:
    "まだです is the polite short answer to もう questions. Very natural and commonly heard.",
});

// ═══════════════════════════════════════════════════════════════════════
// M11-1-1 — "I don't..." intro (ません form + いつも, よく, ときどき)
// ═══════════════════════════════════════════════════════════════════════

const M11_1_1_REVIEW = pickReviewAtoms("ja-m11-1-1-rev", M11_REVIEW_M7_POOL, 4);

export const M11_1_1: LessonContent = {
  id: "ja-m11-1-1",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "I don't... (intro)",
  description:
    "Polite negative ません + frequency adverbs: いつも, よく, ときどき.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-1-1-info-open",
      "Saying what you don't do",
      "You can already say what you do. Now flip it: ます → ません. Three frequency adverbs set the scene — always, often, sometimes.",
    ),
    // ── ません intro ──
    RULE_MASEN,
    // ── いつも (always) ──
    build(
      "ja-m11-1-1-build-itsumo",
      "Pick the Japanese word for: Always",
      "いつも",
      ["ときどき", "よく", "いつも", "まいにち"],
      ["いつも"],
    ),
    listeningCompSentence({
      id: "ja-m11-1-1-lc-itsumo",
      audioText: "いつも コーヒーを のみます",
      correctMeaningEn: "I always drink coffee.",
      distractorsEn: [
        "I sometimes drink coffee.",
        "I don't drink coffee.",
        "I often drink tea.",
      ],
    }),
    // ── よく (often) ──
    build(
      "ja-m11-1-1-build-yoku",
      "Pick the Japanese word for: Often",
      "よく",
      ["たいてい", "ときどき", "よく", "いつも"],
      ["よく"],
    ),
    vocabMcq(
      "ja-m11-1-1-mcq-yoku",
      { kana: "よく", meaningEn: "often", emoji: "🔄", fromModule: "m11" },
      M11_REVIEW_M7_POOL,
    ),
    // ── ときどき (sometimes) ──
    build(
      "ja-m11-1-1-build-tokidoki",
      "Pick the Japanese word for: Sometimes",
      "ときどき",
      ["よく", "たいてい", "いつも", "ときどき"],
      ["ときどき"],
    ),
    speaking("ja-m11-1-1-speak-tokidoki", "ときどき", "Sometimes"),
    // ── ません drills ──
    build(
      "ja-m11-1-1-build-tabemasen",
      "Say: I don't eat.",
      "たべません",
      ["のみません", "たべます", "たべません", "のみます"],
      ["たべません"],
    ),
    cloze(
      "ja-m11-1-1-cloze-masen-1",
      "よく ",
      "。",
      "のみません",
      ["のみません", "のみます", "たべません", "いきません"],
      "I don't often drink (it).",
      "よく のみません。",
      "よく + negative = 'don't often.' ません replaces ます for negation.",
    ),
    sentenceMcq({
      id: "ja-m11-1-1-mcq-masen",
      prompt: "Which sentence means 'I sometimes don't go.'?",
      correctKana: "ときどき いきません。",
      distractorsKana: [
        "いつも いきません。",
        "ときどき いきます。",
        "よく いきません。",
      ],
      explanation: "ときどき = sometimes; いきません = don't go.",
    }),
    listeningCompSentence({
      id: "ja-m11-1-1-lc-masen",
      audioText: "いつも たべません",
      correctMeaningEn: "I never eat (it). (lit: always don't eat)",
      distractorsEn: [
        "I always eat (it).",
        "I sometimes don't eat.",
        "I didn't eat.",
      ],
    }),
    build(
      "ja-m11-1-1-build-itsumo-masen",
      "Say: I always drink water.",
      "いつも みずを のみます",
      ["のみます", "を", "みず", "たべます", "いつも", "のみません"],
      ["いつも", "みず", "を", "のみます"],
    ),
    cloze(
      "ja-m11-1-1-cloze-masen-2",
      "ときどき コーヒーを ",
      "。",
      "のみます",
      ["のみます", "のみません", "たべます", "たべません"],
      "I sometimes drink coffee.",
      "ときどき コーヒーを のみます。",
      "ときどき works with both positive and negative. Here it's positive.",
    ),
    selfExplain({
      id: "ja-m11-1-1-self-masen",
      anchorLabel: "You picked ません in: たべません",
      anchorAudioText: "たべません",
      question: "Why does ます become ません for negation?",
      rule: { text: "ません replaces the entire ます ending to form the polite negative." },
      surface: { text: "You add ません after ます to double-negate." },
      distractor: { text: "ません is the casual form — ます is already negative in formal speech." },
      ruleExplanation: "ます → ません is a direct replacement, not an addition. たべます → たべません.",
    }),
    speaking(
      "ja-m11-1-1-speak-masen",
      "よく たべません",
      "I don't often eat (it).",
    ),
    // ── Review tail ──
    speaking("ja-m11-1-1-rev-speak-1", M11_1_1_REVIEW[0].kana, M11_1_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-1-1-rev-lc-1",
      audioText: "ときどき すしを たべます",
      correctMeaningEn: "I sometimes eat sushi.",
      distractorsEn: [
        "I often eat sushi.",
        "I always eat sushi.",
        "I sometimes eat bread.",
      ],
    }),
    vocabMcq("ja-m11-1-1-rev-mcq-1", M11_1_1_REVIEW[2], M11_REVIEW_M7_POOL),
    reviewMatchPairs("ja-m11-1-1-rev", M11_1_1_REVIEW),
    infoStep(
      "ja-m11-1-1-info-end",
      "You can now say what you don't do",
      "ます → ません flips any polite verb to its negative. Combined with いつも, よく, and ときどき, you can describe your habits.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_1_1.steps);
assertAnswerRotation(M11_1_1.steps, 2);
assertNoConsecutiveSame(M11_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-1-2 — "I don't..." practice (ません drill with frequency adverbs)
// ═══════════════════════════════════════════════════════════════════════

const M11_1_2_REVIEW = pickReviewAtoms("ja-m11-1-2-rev", M11_REVIEW_M6_POOL, 4);

export const M11_1_2: LessonContent = {
  id: "ja-m11-1-2",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "I don't... (practice)",
  description:
    "Drill ません with frequency adverbs across multiple verbs.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-1-2-info-open",
      "Negation drill",
      "Mix and match: six verbs you know, three frequency words, and the ません ending. Production time.",
    ),
    // ── Drill: affirmative vs negative discrimination ──
    sentenceMcq({
      id: "ja-m11-1-2-mcq-discrim-1",
      prompt: "Which sentence means 'I don't read.'?",
      correctKana: "よみません。",
      distractorsKana: [
        "よみます。",
        "よみました。",
        "かきません。",
      ],
      explanation: "よみません = don't read. よみます = read (positive).",
    }),
    cloze(
      "ja-m11-1-2-cloze-1",
      "いつも ほんを ",
      "。",
      "よみます",
      ["よみます", "よみません", "かきます", "みます"],
      "I always read books.",
      "いつも ほんを よみます。",
      "いつも + positive = 'I always do X.'",
    ),
    build(
      "ja-m11-1-2-build-1",
      "Say: I don't often watch.",
      "よく みません",
      ["みません", "ときどき", "いつも", "よく", "みます"],
      ["よく", "みません"],
    ),
    listeningCompSentence({
      id: "ja-m11-1-2-lc-1",
      audioText: "ときどき かきます",
      correctMeaningEn: "I sometimes write.",
      distractorsEn: [
        "I sometimes don't write.",
        "I always write.",
        "I don't write.",
      ],
    }),
    cloze(
      "ja-m11-1-2-cloze-2",
      "よく ",
      "。",
      "いきません",
      ["いきません", "いきます", "みません", "たべません"],
      "I don't often go.",
      "よく いきません。",
      "よく + ません = 'don't often.'",
    ),
    build(
      "ja-m11-1-2-build-2",
      "Say: I sometimes drink juice.",
      "ときどき ジュースを のみます",
      ["を", "ときどき", "いつも", "のみます", "のみません", "ジュース"],
      ["ときどき", "ジュース", "を", "のみます"],
    ),
    sentenceMcq({
      id: "ja-m11-1-2-mcq-discrim-2",
      prompt: "Which sentence means 'I don't always eat bread.'?",
      correctKana: "いつも パンを たべません。",
      distractorsKana: [
        "いつも パンを たべます。",
        "ときどき パンを たべません。",
        "いつも パンを たべました。",
      ],
      explanation: "いつも + negative = 'always don't' / 'never.'",
    }),
    listeningBuildSentence({
      id: "ja-m11-1-2-lb-1",
      target: "よく テレビを みません",
      tiles: ["いつも", "テレビ", "を", "みません", "みます", "よく"],
      correctOrder: ["よく", "テレビ", "を", "みません"],
      promptEn: "Hear it, build it: 'I don't often watch TV.'",
    }),
    cloze(
      "ja-m11-1-2-cloze-3",
      "ときどき すしを ",
      "。",
      "たべます",
      ["たべます", "たべません", "のみます", "よみます"],
      "I sometimes eat sushi.",
      "ときどき すしを たべます。",
      "ときどき with positive verb — no negation required.",
    ),
    build(
      "ja-m11-1-2-build-3",
      "Say: I always write.",
      "いつも かきます",
      ["よみます", "かきます", "よく", "かきません", "いつも"],
      ["いつも", "かきます"],
    ),
    listeningCompSentence({
      id: "ja-m11-1-2-lc-2",
      audioText: "いつも コーヒーを のみません",
      correctMeaningEn: "I never drink coffee.",
      distractorsEn: [
        "I always drink coffee.",
        "I sometimes drink coffee.",
        "I didn't drink coffee.",
      ],
    }),
    translateStep({
      id: "ja-m11-1-2-translate",
      promptEn: "I don't often eat ramen.",
      acceptedAnswers: [
        "よく ラーメンを たべません",
        "よく ラーメンを たべません。",
      ],
      audioText: "よく ラーメンを たべません",
    }),
    selfExplain({
      id: "ja-m11-1-2-self",
      anchorLabel: "You picked のみません in: よく のみません",
      anchorAudioText: "よく のみません",
      question: "Why is よく used with a negative verb here?",
      rule: { text: "よく + negative = 'not often.' The adverb modifies frequency, and the negative verb completes the meaning." },
      surface: { text: "よく means 'well,' so よく のみません means 'I don't drink well.'" },
      distractor: { text: "よく always requires a negative verb — it can't be used with positive verbs." },
      ruleExplanation: "よく means 'often' (or 'well'). With negative verbs it means 'not often.' With positive verbs it means 'often' — it works both ways.",
    }),
    speaking(
      "ja-m11-1-2-speak",
      "ときどき ラーメンを たべません",
      "I sometimes don't eat ramen.",
    ),
    // ── Review tail ──
    speaking("ja-m11-1-2-rev-speak-1", M11_1_2_REVIEW[0].kana, M11_1_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-1-2-rev-lc-1",
      audioText: "いつも バスで いきます",
      correctMeaningEn: "I always go by bus.",
      distractorsEn: [
        "I sometimes go by bus.",
        "I always go by train.",
        "I don't go by bus much.",
      ],
    }),
    vocabMcq("ja-m11-1-2-rev-mcq-1", M11_1_2_REVIEW[2], M11_REVIEW_M6_POOL),
    reviewMatchPairs("ja-m11-1-2-rev", M11_1_2_REVIEW),
    infoStep(
      "ja-m11-1-2-info-end",
      "You can now say what you don't do and how often",
      "Six verbs in negative form plus three frequency adverbs — your negation toolkit is growing.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_1_2.steps);
assertAnswerRotation(M11_1_2.steps, 2);
assertNoConsecutiveSame(M11_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-2-1 — "I didn't..." intro (ませんでした + たいてい)
// ═══════════════════════════════════════════════════════════════════════

const M11_2_1_REVIEW = pickReviewAtoms("ja-m11-2-1-rev", M11_REVIEW_M5_POOL, 4);

export const M11_2_1: LessonContent = {
  id: "ja-m11-2-1",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "I didn't... (intro)",
  description:
    "Polite past negative ませんでした + the adverb たいてい (usually).",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-2-1-info-open",
      "What you didn't do",
      "You know ません (don't). Add でした to get ませんでした (didn't). Plus a new adverb: たいてい (usually).",
    ),
    // ── ませんでした intro ──
    RULE_MASEN_DESHITA,
    // ── たいてい (usually) ──
    build(
      "ja-m11-2-1-build-taitei",
      "Pick the Japanese word for: Usually",
      "たいてい",
      ["よく", "いつも", "ときどき", "たいてい"],
      ["たいてい"],
    ),
    listeningCompSentence({
      id: "ja-m11-2-1-lc-taitei",
      audioText: "たいてい コーヒーを のみます",
      correctMeaningEn: "I usually drink coffee.",
      distractorsEn: [
        "I always drink coffee.",
        "I sometimes drink coffee.",
        "I didn't drink coffee.",
      ],
    }),
    speaking("ja-m11-2-1-speak-taitei", "たいてい", "Usually"),
    // ── ませんでした drills ──
    build(
      "ja-m11-2-1-build-masen-deshita",
      "Say: I didn't eat.",
      "たべませんでした",
      ["たべません", "たべませんでした", "たべます", "たべました"],
      ["たべませんでした"],
    ),
    cloze(
      "ja-m11-2-1-cloze-1",
      "きのう ラーメンを ",
      "。",
      "たべませんでした",
      ["たべませんでした", "たべません", "たべました", "たべます"],
      "I didn't eat ramen yesterday.",
      "きのう ラーメンを たべませんでした。",
      "きのう (yesterday) + ませんでした = past negative.",
    ),
    sentenceMcq({
      id: "ja-m11-2-1-mcq-1",
      prompt: "Which sentence means 'I didn't go.'?",
      correctKana: "いきませんでした。",
      distractorsKana: [
        "いきません。",
        "いきました。",
        "いきます。",
      ],
      explanation: "いきませんでした = didn't go. いきません = don't go (present).",
    }),
    listeningCompSentence({
      id: "ja-m11-2-1-lc-masen-deshita",
      audioText: "のみませんでした",
      correctMeaningEn: "I didn't drink (it).",
      distractorsEn: [
        "I don't drink (it).",
        "I drank (it).",
        "I drink (it).",
      ],
    }),
    build(
      "ja-m11-2-1-build-taitei-neg",
      "Say: I usually didn't go.",
      "たいてい いきませんでした",
      ["いきませんでした", "いつも", "たいてい", "いきました", "いきません"],
      ["たいてい", "いきませんでした"],
    ),
    cloze(
      "ja-m11-2-1-cloze-2",
      "たいてい コーヒーを ",
      "。",
      "のみません",
      ["のみません", "のみませんでした", "のみます", "のみました"],
      "I usually don't drink coffee.",
      "たいてい コーヒーを のみません。",
      "Present negative — たいてい works with both tenses.",
    ),
    listeningBuildSentence({
      id: "ja-m11-2-1-lb-1",
      target: "きのう えいがを みませんでした",
      tiles: ["えいが", "を", "みませんでした", "きのう", "みました", "よく"],
      correctOrder: ["きのう", "えいが", "を", "みませんでした"],
      promptEn: "Hear it, build it: 'I didn't watch the movie yesterday.'",
    }),
    sentenceMcq({
      id: "ja-m11-2-1-mcq-2",
      prompt: "Which sentence means 'I usually don't write.'?",
      correctKana: "たいてい かきません。",
      distractorsKana: [
        "たいてい かきませんでした。",
        "たいてい かきます。",
        "いつも かきません。",
      ],
      explanation: "たいてい = usually; かきません = don't write (present negative).",
    }),
    selfExplain({
      id: "ja-m11-2-1-self",
      anchorLabel: "You picked ませんでした: たべませんでした",
      anchorAudioText: "たべませんでした",
      question: "How does ませんでした differ from ません?",
      rule: { text: "ません is present negative ('don't'); ませんでした is past negative ('didn't'). The でした adds past tense to the negation." },
      surface: { text: "ませんでした is the extra-polite version of ません — both mean present tense." },
      distractor: { text: "ませんでした negates the action and also implies the speaker regrets it." },
      ruleExplanation: "ません = 'don't [verb]' (present). ませんでした = 'didn't [verb]' (past). でした is the past tense marker attached to the negative.",
    }),
    speaking(
      "ja-m11-2-1-speak-masen-deshita",
      "きのう たべませんでした",
      "I didn't eat yesterday.",
    ),
    // ── Review tail ──
    speaking("ja-m11-2-1-rev-speak-1", M11_2_1_REVIEW[0].kana, M11_2_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-2-1-rev-lc-1",
      audioText: "がくせいは ろくにんです",
      correctMeaningEn: "There are six students.",
      distractorsEn: [
        "There are nine students.",
        "There are six teachers.",
        "There are three students.",
      ],
    }),
    vocabMcq("ja-m11-2-1-rev-mcq-1", M11_2_1_REVIEW[2], M11_REVIEW_M5_POOL),
    reviewMatchPairs("ja-m11-2-1-rev", M11_2_1_REVIEW),
    infoStep(
      "ja-m11-2-1-info-end",
      "You can now say what you didn't do",
      "ませんでした gives you the past negative — paired with たいてい, you can say 'I usually didn't go.'",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_2_1.steps);
assertAnswerRotation(M11_2_1.steps, 2);
assertNoConsecutiveSame(M11_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-2-2 — "I didn't..." practice (ません vs ませんでした discrimination)
// ═══════════════════════════════════════════════════════════════════════

const M11_2_2_REVIEW = pickReviewAtoms("ja-m11-2-2-rev", M11_REVIEW_M4_POOL, 4);

export const M11_2_2: LessonContent = {
  id: "ja-m11-2-2",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "I didn't... (practice)",
  description:
    "Discrimination drill: ません (don't) vs ませんでした (didn't).",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-2-2-info-open",
      "Present vs past negative",
      "Two negatives, one tense difference. Can you tell them apart and produce them on demand?",
    ),
    // ── Discrimination drills ──
    sentenceMcq({
      id: "ja-m11-2-2-mcq-1",
      prompt: "Which sentence means 'I didn't drink coffee yesterday.'?",
      correctKana: "きのう コーヒーを のみませんでした。",
      distractorsKana: [
        "きのう コーヒーを のみません。",
        "きのう コーヒーを のみました。",
        "いつも コーヒーを のみません。",
      ],
      explanation: "きのう (yesterday) requires past tense: のみませんでした.",
    }),
    cloze(
      "ja-m11-2-2-cloze-1",
      "まいにち ほんを ",
      "。",
      "よみません",
      ["よみません", "よみませんでした", "よみます", "よみました"],
      "I don't read books every day.",
      "まいにち ほんを よみません。",
      "まいにち (every day) is habitual = present tense negative.",
    ),
    listeningCompSentence({
      id: "ja-m11-2-2-lc-1",
      audioText: "きのう かきませんでした",
      correctMeaningEn: "I didn't write yesterday.",
      distractorsEn: [
        "I don't write every day.",
        "I wrote yesterday.",
        "I don't usually write.",
      ],
    }),
    build(
      "ja-m11-2-2-build-1",
      "Say: I didn't watch TV yesterday.",
      "きのう テレビを みませんでした",
      ["みません", "きのう", "みませんでした", "を", "みました", "テレビ"],
      ["きのう", "テレビ", "を", "みませんでした"],
    ),
    cloze(
      "ja-m11-2-2-cloze-2",
      "きのう すしを ",
      "。",
      "たべませんでした",
      ["たべませんでした", "たべません", "たべました", "たべます"],
      "I didn't eat sushi yesterday.",
      "きのう すしを たべませんでした。",
      "きのう = yesterday → past negative ませんでした.",
    ),
    sentenceMcq({
      id: "ja-m11-2-2-mcq-2",
      prompt: "Which sentence means 'I usually don't go.'?",
      correctKana: "たいてい いきません。",
      distractorsKana: [
        "たいてい いきませんでした。",
        "いつも いきます。",
        "きのう いきませんでした。",
      ],
      explanation: "たいてい = usually. Present habitual → ません, not ませんでした.",
    }),
    build(
      "ja-m11-2-2-build-2",
      "Say: I don't usually drink juice.",
      "たいてい ジュースを のみません",
      ["いつも", "を", "のみませんでした", "たいてい", "ジュース", "のみません"],
      ["たいてい", "ジュース", "を", "のみません"],
    ),
    listeningBuildSentence({
      id: "ja-m11-2-2-lb-1",
      target: "きのう がっこうに いきませんでした",
      tiles: ["がっこう", "に", "いきませんでした", "きのう", "いきました", "たいてい"],
      correctOrder: ["きのう", "がっこう", "に", "いきませんでした"],
      promptEn: "Hear it, build it: 'I didn't go to school yesterday.'",
    }),
    listeningCompSentence({
      id: "ja-m11-2-2-lc-2",
      audioText: "たいてい みません",
      correctMeaningEn: "I usually don't watch.",
      distractorsEn: [
        "I didn't usually watch.",
        "I usually watch.",
        "I sometimes don't watch.",
      ],
    }),
    cloze(
      "ja-m11-2-2-cloze-3",
      "よく ラーメンを ",
      "。",
      "たべます",
      ["たべます", "たべません", "たべました", "たべませんでした"],
      "I often eat ramen.",
      "よく ラーメンを たべます。",
      "Positive — よく works with affirmative too.",
    ),
    build(
      "ja-m11-2-2-build-3",
      "Say: I didn't read books yesterday.",
      "きのう ほんを よみませんでした",
      ["まいにち", "よみませんでした", "きのう", "を", "ほん", "よみません"],
      ["きのう", "ほん", "を", "よみませんでした"],
    ),
    translateStep({
      id: "ja-m11-2-2-translate",
      promptEn: "I didn't write a letter yesterday.",
      acceptedAnswers: [
        "きのう てがみを かきませんでした",
        "きのう てがみを かきませんでした。",
      ],
      audioText: "きのう てがみを かきませんでした",
    }),
    selfExplain({
      id: "ja-m11-2-2-self",
      anchorLabel: "きのう → ませんでした, まいにち → ません",
      anchorAudioText: "きのう たべませんでした",
      question: "Why does きのう take ませんでした but まいにち takes ません?",
      rule: { text: "きのう (yesterday) refers to a completed past event, requiring past negative ませんでした. まいにち (every day) describes a habitual present, requiring present negative ません." },
      surface: { text: "きのう is a longer word so it needs the longer negative ending." },
      distractor: { text: "ませんでした is more polite than ません — use it when the situation is more serious." },
      ruleExplanation: "Tense is determined by the time context: past events → ませんでした; present habits → ません.",
    }),
    speaking(
      "ja-m11-2-2-speak",
      "おととい いきませんでした",
      "I didn't go the day before yesterday.",
    ),
    // ── Review tail ──
    speaking("ja-m11-2-2-rev-speak-1", M11_2_2_REVIEW[0].kana, M11_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-2-2-rev-lc-1",
      audioText: "わたしは コーヒーを のみません",
      correctMeaningEn: "I don't drink coffee.",
      distractorsEn: [
        "I drink coffee.",
        "I don't drink tea.",
        "I didn't drink coffee.",
      ],
    }),
    vocabMcq("ja-m11-2-2-rev-mcq-1", M11_2_2_REVIEW[2], M11_REVIEW_M4_POOL),
    reviewMatchPairs("ja-m11-2-2-rev", M11_2_2_REVIEW),
    infoStep(
      "ja-m11-2-2-info-end",
      "You can tell apart 'I don't' and 'I didn't'",
      "ません = present negative; ませんでした = past negative. Time words like きのう and まいにち guide your choice.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_2_2.steps);
assertAnswerRotation(M11_2_2.steps, 2);
assertNoConsecutiveSame(M11_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-3-1 — "Not much, not at all" intro (あまり + ぜんぜん)
// ═══════════════════════════════════════════════════════════════════════

const M11_3_1_REVIEW = pickReviewAtoms("ja-m11-3-1-rev", M11_REVIEW_M3_POOL, 4);

export const M11_3_1: LessonContent = {
  id: "ja-m11-3-1",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Not much, not at all (intro)",
  description:
    "あまり (not much) and ぜんぜん (not at all) — adverbs that REQUIRE negative predicates.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m11-3-1-info-open",
      "Two adverbs with a rule",
      "あまり and ぜんぜん only work with negatives. They're the most important pattern in this module.",
    ),
    // ── Rule ──
    RULE_AMARI_ZENZEN,
    // ── あまり (not much) ──
    build(
      "ja-m11-3-1-build-amari",
      "Pick the Japanese word for: Not much / not very",
      "あまり",
      ["よく", "あまり", "ぜんぜん", "いつも"],
      ["あまり"],
    ),
    listeningCompSentence({
      id: "ja-m11-3-1-lc-amari",
      audioText: "あまり たべません",
      correctMeaningEn: "I don't eat much.",
      distractorsEn: [
        "I always eat.",
        "I don't eat at all.",
        "I eat a lot.",
      ],
    }),
    // ── ぜんぜん (not at all) ──
    build(
      "ja-m11-3-1-build-zenzen",
      "Pick the Japanese word for: Not at all",
      "ぜんぜん",
      ["あまり", "ぜんぜん", "ときどき", "たいてい"],
      ["ぜんぜん"],
    ),
    speaking("ja-m11-3-1-speak-zenzen", "ぜんぜん", "Not at all"),
    // ── わかる (understand) — new verb ──
    build(
      "ja-m11-3-1-build-wakarimasen",
      "Say: I don't understand.",
      "わかりません",
      ["のみません", "しりません", "わかります", "わかりません"],
      ["わかりません"],
    ),
    listeningCompSentence({
      id: "ja-m11-3-1-lc-zenzen",
      audioText: "ぜんぜん わかりません",
      correctMeaningEn: "I don't understand at all.",
      distractorsEn: [
        "I understand completely.",
        "I don't understand much.",
        "I understand a little.",
      ],
    }),
    // ── Drills: あまり/ぜんぜん + negative ──
    cloze(
      "ja-m11-3-1-cloze-1",
      "あまり コーヒーを ",
      "。",
      "のみません",
      ["のみません", "のみます", "のみました", "のみませんでした"],
      "I don't drink much coffee.",
      "あまり コーヒーを のみません。",
      "あまり requires a negative verb — のみません.",
    ),
    sentenceMcq({
      id: "ja-m11-3-1-mcq-1",
      prompt: "Which sentence is grammatically correct?",
      correctKana: "ぜんぜん たべません。",
      distractorsKana: [
        "ぜんぜん たべます。",
        "ぜんぜん たべました。",
        "ぜんぜん たべましょう。",
      ],
      explanation: "ぜんぜん requires a negative verb. Only たべません is negative.",
    }),
    build(
      "ja-m11-3-1-build-amari-sentence",
      "Say: I don't read much.",
      "あまり よみません",
      ["よみません", "あまり", "かきません", "よみます", "ぜんぜん"],
      ["あまり", "よみません"],
    ),
    cloze(
      "ja-m11-3-1-cloze-2",
      "ぜんぜん ",
      "。",
      "いきません",
      ["いきません", "いきます", "たべません", "のみません"],
      "I don't go at all.",
      "ぜんぜん いきません。",
      "ぜんぜん + いきません = 'don't go at all.'",
    ),
    listeningBuildSentence({
      id: "ja-m11-3-1-lb-1",
      target: "にほんごが あまり わかりません",
      tiles: ["にほんご", "が", "あまり", "わかりません", "ぜんぜん", "わかります"],
      correctOrder: ["にほんご", "が", "あまり", "わかりません"],
      promptEn: "Hear it, build it: 'I don't understand Japanese much.'",
    }),
    sentenceMcq({
      id: "ja-m11-3-1-mcq-2",
      prompt: "What does あまり たべません mean?",
      correctKana: "I don't eat much.",
      distractorsKana: [
        "I don't eat at all.",
        "I eat a lot.",
        "I sometimes eat.",
      ],
      explanation: "あまり = not much (lesser degree). ぜんぜん = not at all (total negation).",
    }),
    selfExplain({
      id: "ja-m11-3-1-self",
      anchorLabel: "ぜんぜん たべません (correct) vs ぜんぜん たべます (broken)",
      anchorAudioText: "ぜんぜん たべません",
      question: "Why can't you say ぜんぜん たべます?",
      rule: { text: "ぜんぜん inherently means 'not at all' — it requires a negative verb to complete its meaning. Pairing it with a positive verb is ungrammatical." },
      surface: { text: "ぜんぜん just means 'completely' and works with any verb form." },
      distractor: { text: "ぜんぜん たべます is correct in casual speech — it means 'I totally eat.'" },
      ruleExplanation: "ぜんぜん and あまり are negative-polarity adverbs. They MUST be paired with negative predicates in standard Japanese.",
    }),
    speaking(
      "ja-m11-3-1-speak-amari",
      "あまり たべません",
      "I don't eat much.",
    ),
    // ── Review tail ──
    speaking("ja-m11-3-1-rev-speak-1", M11_3_1_REVIEW[0].kana, M11_3_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-3-1-rev-lc-1",
      audioText: "タクシーで ホテルに いきました",
      correctMeaningEn: "I went to the hotel by taxi.",
      distractorsEn: [
        "I went to the hotel by bus.",
        "I go to the hotel by taxi.",
        "I went to the station by taxi.",
      ],
    }),
    vocabMcq("ja-m11-3-1-rev-mcq-1", M11_3_1_REVIEW[2], M11_REVIEW_M3_POOL),
    reviewMatchPairs("ja-m11-3-1-rev", M11_3_1_REVIEW),
    infoStep(
      "ja-m11-3-1-info-end",
      "You know the golden rule: あまり/ぜんぜん + negative only",
      "あまり = not much; ぜんぜん = not at all. Both demand a negative verb. This is the #1 rule of this module.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_3_1.steps);
assertAnswerRotation(M11_3_1.steps, 2);
assertNoConsecutiveSame(M11_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-3-2 — "Not much, not at all" practice (あまり〜ません, ぜんぜん〜ません)
// ═══════════════════════════════════════════════════════════════════════

const M11_3_2_REVIEW = pickReviewAtoms("ja-m11-3-2-rev", M11_REVIEW_M7_POOL, 4);

export const M11_3_2: LessonContent = {
  id: "ja-m11-3-2",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Not much, not at all (practice)",
  description:
    "Heavy drill on あまり〜ません and ぜんぜん〜ません patterns. Plus ほんとう (really) for reacting.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-3-2-info-open",
      "Negative-polarity drill",
      "あまり and ぜんぜん — eight drills to lock in the pattern. Every answer needs a negative verb.",
    ),
    // ── Drill block ──
    cloze(
      "ja-m11-3-2-cloze-1",
      "にほんごが ぜんぜん ",
      "。",
      "わかりません",
      ["わかりません", "わかります", "よみません", "かきません"],
      "I don't understand Japanese at all.",
      "にほんごが ぜんぜん わかりません。",
      "ぜんぜん + negative = 'not at all.' わかります takes が, not を.",
    ),
    build(
      "ja-m11-3-2-build-1",
      "Say: I don't drink much beer.",
      "あまり ビールを のみません",
      ["ぜんぜん", "のみません", "あまり", "ビール", "を", "のみます"],
      ["あまり", "ビール", "を", "のみません"],
    ),
    sentenceMcq({
      id: "ja-m11-3-2-mcq-1",
      prompt: "Which is correct: 'I don't go at all.'?",
      correctKana: "ぜんぜん いきません。",
      distractorsKana: [
        "ぜんぜん いきます。",
        "あまり いきます。",
        "ぜんぜん いきました。",
      ],
      explanation: "ぜんぜん + negative only. いきません is the negative.",
    }),
    listeningCompSentence({
      id: "ja-m11-3-2-lc-1",
      audioText: "あまり みません",
      correctMeaningEn: "I don't watch much.",
      distractorsEn: [
        "I don't watch at all.",
        "I watch a lot.",
        "I sometimes watch.",
      ],
    }),
    cloze(
      "ja-m11-3-2-cloze-2",
      "あまり パンを ",
      "。",
      "たべません",
      ["たべません", "たべます", "のみません", "よみません"],
      "I don't eat much bread.",
      "あまり パンを たべません。",
      "あまり = not much → negative verb required.",
    ),
    build(
      "ja-m11-3-2-build-2",
      "Say: I don't understand at all.",
      "ぜんぜん わかりません",
      ["わかります", "のみません", "わかりません", "あまり", "ぜんぜん"],
      ["ぜんぜん", "わかりません"],
    ),
    listeningBuildSentence({
      id: "ja-m11-3-2-lb-1",
      target: "ぜんぜん おちゃを のみません",
      tiles: ["おちゃ", "を", "のみません", "ぜんぜん", "あまり", "のみます"],
      correctOrder: ["ぜんぜん", "おちゃ", "を", "のみません"],
      promptEn: "Hear it, build it: 'I don't drink green tea at all.'",
    }),
    sentenceMcq({
      id: "ja-m11-3-2-mcq-2",
      prompt: "Which adverb means 'not much' (lesser degree)?",
      correctKana: "あまり",
      distractorsKana: [
        "ぜんぜん",
        "いつも",
        "よく",
      ],
      explanation: "あまり = not much. ぜんぜん = not at all (stronger negation).",
    }),
    // ── ほんとう (really / true) — the natural reaction word ──
    build(
      "ja-m11-3-2-build-hontou",
      "Pick the Japanese word for: Really / true",
      "ほんとう",
      ["あまり", "とても", "ぜんぜん", "ほんとう"],
      ["ほんとう"],
    ),
    listeningCompSentence({
      id: "ja-m11-3-2-lc-hontou",
      audioText: "ほんとうですか",
      correctMeaningEn: "Really? / Is that true?",
      distractorsEn: ["Not at all.", "Not yet.", "Is it good?"],
    }),
    sentenceMcq({
      id: "ja-m11-3-2-mcq-hontou",
      prompt:
        "Your friend says ぜんぜん テレビを みません. You're surprised. What's the natural reaction?",
      correctKana: "ほんとうですか。",
      distractorsKana: [
        "まだです。",
        "ぜんぜんです。",
        "あまりです。",
      ],
      explanation:
        "ほんとうですか = 'Really?' — the go-to surprised reaction. あまり and ぜんぜん can't stand alone like this.",
    }),
    cloze(
      "ja-m11-3-2-cloze-3",
      "ぜんぜん ほんを ",
      "。",
      "よみません",
      ["よみません", "よみます", "かきません", "わかりません"],
      "I don't read books at all.",
      "ぜんぜん ほんを よみません。",
      "ぜんぜん demands negative: よみません.",
    ),
    build(
      "ja-m11-3-2-build-3",
      "Say: I don't write much.",
      "あまり かきません",
      ["かきます", "かきません", "あまり", "よみません", "ぜんぜん"],
      ["あまり", "かきません"],
    ),
    listeningCompSentence({
      id: "ja-m11-3-2-lc-2",
      audioText: "ぜんぜん かきませんでした",
      correctMeaningEn: "I didn't write at all.",
      distractorsEn: [
        "I didn't write much.",
        "I always write.",
        "I wrote a lot.",
      ],
    }),
    translateStep({
      id: "ja-m11-3-2-translate",
      promptEn: "I don't drink water at all.",
      acceptedAnswers: [
        "ぜんぜん みずを のみません",
        "ぜんぜん みずを のみません。",
        "みずは ぜんぜん のみません",
        "みずは ぜんぜん のみません。",
      ],
      audioText: "ぜんぜん みずを のみません",
    }),
    selfExplain({
      id: "ja-m11-3-2-self",
      anchorLabel: "あまり たべません vs ぜんぜん たべません",
      anchorAudioText: "あまり たべません",
      question: "What is the difference between あまり and ぜんぜん?",
      rule: { text: "Both require negative verbs, but あまり means 'not much' (partial negation) while ぜんぜん means 'not at all' (complete negation)." },
      surface: { text: "あまり is polite and ぜんぜん is casual — they mean the same thing." },
      distractor: { text: "あまり pairs with past negative only, while ぜんぜん pairs with present negative only." },
      ruleExplanation: "Degree of negation: あまり (lesser — 'not much') < ぜんぜん (total — 'not at all'). Both always take negative predicates.",
    }),
    speaking(
      "ja-m11-3-2-speak",
      "あまり テレビを みません",
      "I don't watch TV much.",
    ),
    // ── Review tail ──
    speaking("ja-m11-3-2-rev-speak-1", M11_3_2_REVIEW[0].kana, M11_3_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-3-2-rev-lc-1",
      audioText: "よく みずを のみます",
      correctMeaningEn: "I often drink water.",
      distractorsEn: [
        "I don't drink water much.",
        "I often drink tea.",
        "I sometimes drink water.",
      ],
    }),
    vocabMcq("ja-m11-3-2-rev-mcq-1", M11_3_2_REVIEW[2], M11_REVIEW_M7_POOL),
    reviewMatchPairs("ja-m11-3-2-rev", M11_3_2_REVIEW),
    infoStep(
      "ja-m11-3-2-info-end",
      "You can express degrees of negation — and react to them",
      "あまり (not much), ぜんぜん (not at all), and ほんとうですか (really?) when someone's habits surprise you.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_3_2.steps);
assertAnswerRotation(M11_3_2.steps, 2);
assertNoConsecutiveSame(M11_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-4-1 — "Plain negative" intro (ない-form rules)
// ═══════════════════════════════════════════════════════════════════════

const M11_4_1_REVIEW = pickReviewAtoms("ja-m11-4-1-rev", M11_REVIEW_M6_POOL, 4);

export const M11_4_1: LessonContent = {
  id: "ja-m11-4-1",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Plain negative (intro)",
  description:
    "ない-form: the casual negative. Ichidan, godan, and irregular rules.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m11-4-1-info-open",
      "Casual negation — the ない-form",
      "ません is polite. ない is casual. Three conjugation patterns to learn: ichidan (easy), godan (vowel shift), and irregulars.",
    ),
    // ── Rule ──
    RULE_NAI_FORM,
    // ── Ichidan (ru-verbs): たべる → たべない ──
    build(
      "ja-m11-4-1-build-tabenai",
      "Make the casual negative of たべる (eat):",
      "たべない",
      ["のまない", "しない", "たべません", "たべない"],
      ["たべない"],
    ),
    listeningCompSentence({
      id: "ja-m11-4-1-lc-tabenai",
      audioText: "パンを たべない",
      correctMeaningEn: "I don't eat bread. (casual)",
      distractorsEn: [
        "I don't eat bread. (polite)",
        "I don't drink. (casual)",
        "I ate bread. (casual)",
      ],
    }),
    sentenceMcq({
      id: "ja-m11-4-1-mcq-ichidan",
      prompt: "What is the ない-form of みる (watch)?",
      correctKana: "みない",
      distractorsKana: [
        "みません",
        "みらない",
        "まない",
      ],
      explanation: "Ichidan: drop る, add ない. みる → み + ない = みない.",
    }),
    // ── Godan (u-verbs): のむ → のまない, いく → いかない ──
    build(
      "ja-m11-4-1-build-nomanai",
      "Make the casual negative of のむ (drink):",
      "のまない",
      ["のみない", "たべない", "のまない", "のむない"],
      ["のまない"],
    ),
    cloze(
      "ja-m11-4-1-cloze-godan",
      "いく → いか",
      " (casual negative of 'go')",
      "ない",
      ["ない", "ません", "なかった", "る"],
      "いかない = don't go (casual)",
      "いく → いかない",
      "Godan: change u-row (く) to a-row (か), add ない.",
    ),
    listeningCompSentence({
      id: "ja-m11-4-1-lc-nomanai",
      audioText: "コーヒーを のまない",
      correctMeaningEn: "I don't drink coffee. (casual)",
      distractorsEn: [
        "I don't drink coffee. (polite)",
        "I don't eat. (casual)",
        "I drank coffee. (casual)",
      ],
    }),
    sentenceMcq({
      id: "ja-m11-4-1-mcq-godan",
      prompt: "What is the ない-form of よむ (read)?",
      correctKana: "よまない",
      distractorsKana: [
        "よみない",
        "よむない",
        "よません",
      ],
      explanation: "Godan: む → ま (u-row → a-row) + ない = よまない.",
    }),
    // ── Irregular: する → しない, くる → こない ──
    build(
      "ja-m11-4-1-build-shinai",
      "Make the casual negative of する (do):",
      "しない",
      ["すない", "こない", "しない", "さない"],
      ["しない"],
    ),
    build(
      "ja-m11-4-1-build-konai",
      "Make the casual negative of くる (come):",
      "こない",
      ["くない", "きない", "こない", "しない"],
      ["こない"],
    ),
    // ── Special: ある → ない ──
    sentenceMcq({
      id: "ja-m11-4-1-mcq-aru",
      prompt: "What is the ない-form of ある (to exist)?",
      correctKana: "ない",
      distractorsKana: [
        "あらない",
        "ありない",
        "あない",
      ],
      explanation: "ある is special: its negative is simply ない, not あらない. Memorize this exception.",
    }),
    // ── いる (animate existence) — the regular partner of ある ──
    build(
      "ja-m11-4-1-build-iru",
      "ある is for things. Pick the dictionary form of います (to exist — people, animals):",
      "いる",
      ["ある", "います", "いる", "くる"],
      ["いる"],
    ),
    cloze(
      "ja-m11-4-1-cloze-iru",
      "いる → い",
      " (casual negative of 'to exist, animate')",
      "ない",
      ["ない", "る", "ません", "らない"],
      "いない = isn't there (animate, casual)",
      "いる → いない",
      "いる is a regular group-2 (ichidan) verb: drop る, add ない. Unlike its partner ある → ない.",
    ),
    listeningCompSentence({
      id: "ja-m11-4-1-lc-iru",
      audioText: "ねこは いない",
      correctMeaningEn: "The cat isn't there. (casual)",
      distractorsEn: [
        "There's a cat. (casual)",
        "The cat isn't there. (polite)",
        "The dog isn't there. (casual)",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m11-4-1-lb-1",
      target: "テレビを みない",
      tiles: ["テレビ", "を", "みない", "みません", "たべない"],
      correctOrder: ["テレビ", "を", "みない"],
      promptEn: "Hear it, build it: 'I don't watch TV. (casual)'",
    }),
    selfExplain({
      id: "ja-m11-4-1-self",
      anchorLabel: "ある → ない (not あらない)",
      anchorAudioText: "ない",
      question: "Why is ある's negative ない and not あらない?",
      rule: { text: "ある is an irregular exception. Its negative is simply ない — the entire word is replaced, not conjugated by rule." },
      surface: { text: "ある follows the regular godan pattern: あ-row + ない = あらない. ない is just a shortening." },
      distractor: { text: "ある has no negative — Japanese uses a completely different verb for 'not exist.'" },
      ruleExplanation: "ある → ない is one of three irregular ない-forms (with する → しない and くる → こない). It must be memorized.",
    }),
    speaking(
      "ja-m11-4-1-speak",
      "よまない",
      "Don't read (casual).",
    ),
    // ── Review tail ──
    speaking("ja-m11-4-1-rev-speak-1", M11_4_1_REVIEW[0].kana, M11_4_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-4-1-rev-lc-1",
      audioText: "うちに ねこが います",
      correctMeaningEn: "There's a cat at home.",
      distractorsEn: [
        "There's a dog at home.",
        "The cat isn't at home.",
        "There's a cat at school.",
      ],
    }),
    vocabMcq("ja-m11-4-1-rev-mcq-1", M11_4_1_REVIEW[2], M11_REVIEW_M6_POOL),
    reviewMatchPairs("ja-m11-4-1-rev", M11_4_1_REVIEW),
    infoStep(
      "ja-m11-4-1-info-end",
      "You can now form the plain negative of any verb",
      "Ichidan: drop る, add ない (いる→いない). Godan: u→a shift + ない. Irregular: する→しない, くる→こない, ある→ない.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_4_1.steps);
assertAnswerRotation(M11_4_1.steps, 1);
assertNoConsecutiveSame(M11_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-4-2 — "Plain negative" practice (ない-form conjugation drill)
// ═══════════════════════════════════════════════════════════════════════

const M11_4_2_REVIEW = pickReviewAtoms("ja-m11-4-2-rev", M11_REVIEW_M5_POOL, 4);

export const M11_4_2: LessonContent = {
  id: "ja-m11-4-2",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Plain negative (practice)",
  description:
    "ない-form conjugation drill across ichidan, godan, and irregulars.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-4-2-info-open",
      "ない-form production",
      "Conjugate, discriminate, and produce: the casual negative across all three verb classes.",
    ),
    // ── Conjugation drills ──
    sentenceMcq({
      id: "ja-m11-4-2-mcq-1",
      prompt: "What is the ない-form of かく (write)?",
      correctKana: "かかない",
      distractorsKana: [
        "かきない",
        "かくない",
        "かません",
      ],
      explanation: "Godan: く → か (u→a shift) + ない = かかない.",
    }),
    build(
      "ja-m11-4-2-build-1",
      "Make the casual negative of あそぶ (play):",
      "あそばない",
      ["あそびない", "あそぶない", "かかない", "あそばない"],
      ["あそばない"],
    ),
    cloze(
      "ja-m11-4-2-cloze-1",
      "みる → み",
      " (casual negative)",
      "ない",
      ["ない", "ません", "た", "る"],
      "みない = don't watch (casual)",
      "みる → みない",
      "Ichidan: drop る, add ない. Simple.",
    ),
    listeningCompSentence({
      id: "ja-m11-4-2-lc-1",
      audioText: "きょうは べんきょうしない",
      correctMeaningEn: "I'm not studying today. (casual)",
      distractorsEn: [
        "I'm not studying today. (polite)",
        "I studied today. (casual)",
        "I'm not coming today. (casual)",
      ],
    }),
    sentenceMcq({
      id: "ja-m11-4-2-mcq-2",
      prompt: "What is the ない-form of いく (go)?",
      correctKana: "いかない",
      distractorsKana: [
        "いきない",
        "いくない",
        "いきません",
      ],
      explanation: "Godan: く → か + ない = いかない.",
    }),
    build(
      "ja-m11-4-2-build-2",
      "Make the casual negative of べんきょうする (study):",
      "べんきょうしない",
      ["べんきょうしません", "べんきょうさない", "べんきょうすない", "べんきょうしない"],
      ["べんきょうしない"],
    ),
    cloze(
      "ja-m11-4-2-cloze-2",
      "くる → ",
      " (casual negative)",
      "こない",
      ["こない", "くない", "きない", "しない"],
      "こない = don't come (casual)",
      "くる → こない",
      "Irregular: くる → こない. The こ stem is unique to this form.",
    ),
    build(
      "ja-m11-4-2-build-3",
      "Say: I don't write. (casual)",
      "かかない",
      ["かくない", "かかない", "かきない", "かきません"],
      ["かかない"],
    ),
    listeningBuildSentence({
      id: "ja-m11-4-2-lb-1",
      target: "ビールを のまない",
      tiles: ["ビール", "を", "のまない", "のみない", "のみません"],
      correctOrder: ["ビール", "を", "のまない"],
      promptEn: "Hear it, build it: 'I don't drink beer. (casual)'",
    }),
    sentenceMcq({
      id: "ja-m11-4-2-mcq-3",
      prompt: "Which is correct: ない-form of ある?",
      correctKana: "ない",
      distractorsKana: [
        "あらない",
        "ありない",
        "あません",
      ],
      explanation: "ある → ない. Special exception — the whole word is replaced.",
    }),
    listeningCompSentence({
      id: "ja-m11-4-2-lc-2",
      audioText: "がっこうに いかない",
      correctMeaningEn: "I don't go to school. (casual)",
      distractorsEn: [
        "I don't go to school. (polite)",
        "I went to school. (casual)",
        "I don't come to school. (casual)",
      ],
    }),
    // ── いる → いない (the regular partner of ある → ない) ──
    sentenceMcq({
      id: "ja-m11-4-2-mcq-iru",
      prompt: "What is the ない-form of いる (to exist — people, animals)?",
      correctKana: "いない",
      distractorsKana: [
        "いらない",
        "いりない",
        "いません",
      ],
      explanation: "いる is ichidan: drop る + ない = いない. Regular — don't confuse it with ある → ない.",
    }),
    listeningCompSentence({
      id: "ja-m11-4-2-lc-iru",
      audioText: "いぬが いる",
      correctMeaningEn: "There's a dog. (casual)",
      distractorsEn: [
        "The dog isn't there. (casual)",
        "There's a cat. (casual)",
        "There's a dog. (polite)",
      ],
    }),
    build(
      "ja-m11-4-2-build-4",
      "Make the casual negative of おきる (wake up):",
      "おきない",
      ["おきません", "おきらない", "おかない", "おきない"],
      ["おきない"],
    ),
    translateStep({
      id: "ja-m11-4-2-translate",
      promptEn: "I don't sleep. (casual)",
      acceptedAnswers: [
        "ねない",
        "ねない。",
      ],
      audioText: "ねない",
    }),
    selfExplain({
      id: "ja-m11-4-2-self",
      anchorLabel: "する → しない, くる → こない",
      anchorAudioText: "しない",
      question: "Why can't you apply the regular godan rule to する?",
      rule: { text: "する and くる are irregular verbs. Their ない-forms (しない, こない) must be memorized — no u→a shift rule applies." },
      surface: { text: "する follows the ichidan pattern: drop る, add ない = すない." },
      distractor: { text: "する is actually a godan verb: す → さ + ない = さない. しない is slang." },
      ruleExplanation: "Japanese has exactly two irregular verbs: する (do) and くる (come). Their conjugations across all forms are unique and must be memorized.",
    }),
    speaking(
      "ja-m11-4-2-speak",
      "あそばない",
      "Don't play (casual).",
    ),
    // ── Review tail ──
    speaking("ja-m11-4-2-rev-speak-1", M11_4_2_REVIEW[0].kana, M11_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-4-2-rev-lc-1",
      audioText: M11_4_2_REVIEW[1].kana,
      correctMeaningEn: M11_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M11_4_2_REVIEW[2].meaningEn,
        M11_4_2_REVIEW[3].meaningEn,
        M11_REVIEW_M5_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m11-4-2-rev-mcq-1", M11_4_2_REVIEW[2], M11_REVIEW_M5_POOL),
    reviewMatchPairs("ja-m11-4-2-rev", M11_4_2_REVIEW),
    infoStep(
      "ja-m11-4-2-info-end",
      "You can conjugate any verb into its casual negative",
      "Ichidan, godan, する, くる, ある — all drilled. The ない-form is your foundation for casual speech.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_4_2.steps);
assertAnswerRotation(M11_4_2.steps, 2);
assertNoConsecutiveSame(M11_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-5-1 — "Still and already" intro (まだ + もう)
// ═══════════════════════════════════════════════════════════════════════

const M11_5_1_REVIEW = pickReviewAtoms("ja-m11-5-1-rev", M11_REVIEW_M4_POOL, 4);

export const M11_5_1: LessonContent = {
  id: "ja-m11-5-1",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Still and already (intro)",
  description:
    "まだ (still / not yet) + もう (already). Paired with past and negative verbs.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m11-5-1-info-open",
      "Timing words — まだ and もう",
      "まだ = 'not yet' (with negative). もう = 'already' (with past). A natural pair for asking about progress.",
    ),
    // ── Rule ──
    RULE_MADA_MOU,
    // ── まだ intro ──
    build(
      "ja-m11-5-1-build-mada",
      "Pick the Japanese word for: Not yet / still",
      "まだ",
      ["よく", "もう", "いつも", "まだ"],
      ["まだ"],
    ),
    listeningCompSentence({
      id: "ja-m11-5-1-lc-mada",
      audioText: "まだ たべていません",
      correctMeaningEn: "I haven't eaten yet.",
      distractorsEn: [
        "I already ate.",
        "I don't eat.",
        "I'm still eating.",
      ],
    }),
    // ── もう intro ──
    build(
      "ja-m11-5-1-build-mou",
      "Pick the Japanese word for: Already",
      "もう",
      ["たいてい", "もう", "まだ", "ときどき"],
      ["もう"],
    ),
    speaking("ja-m11-5-1-speak-mou", "もう", "Already"),
    // ── Paired drills ──
    build(
      "ja-m11-5-1-build-mou-tabemashita",
      "Say: I already ate.",
      "もう たべました",
      ["たべていません", "まだ", "たべません", "たべました", "もう"],
      ["もう", "たべました"],
    ),
    cloze(
      "ja-m11-5-1-cloze-mada",
      "",
      " たべていません。",
      "まだ",
      ["まだ", "もう", "よく", "いつも"],
      "I haven't eaten yet.",
      "まだ たべていません。",
      "まだ + negative = 'haven't yet.'",
    ),
    sentenceMcq({
      id: "ja-m11-5-1-mcq-1",
      prompt: "Which sentence means 'I already drank.'?",
      correctKana: "もう のみました。",
      distractorsKana: [
        "まだ のみません。",
        "もう のみません。",
        "まだ のんでいません。",
      ],
      explanation: "もう + past = 'already.' のみました = drank.",
    }),
    listeningCompSentence({
      id: "ja-m11-5-1-lc-mou",
      audioText: "もう いきました",
      correctMeaningEn: "I already went.",
      distractorsEn: [
        "I haven't gone yet.",
        "I don't go.",
        "I'm going now.",
      ],
    }),
    // ── まだです pattern ──
    build(
      "ja-m11-5-1-build-mada-desu",
      "Say: Not yet. (short polite answer)",
      "まだです",
      ["いいえです", "まだです", "もうです", "はいです"],
      ["まだです"],
    ),
    cloze(
      "ja-m11-5-1-cloze-mou",
      "",
      " たべました。",
      "もう",
      ["もう", "まだ", "いつも", "ぜんぜん"],
      "I already ate.",
      "もう たべました。",
      "もう + past affirmative = 'already did.'",
    ),
    // ── Katakana interleave (rollout M11 ラ row → ビール is now
    //    base-readable). まだ + negative with a real object. ──
    build(
      "ja-m11-5-1-build-mada-biiru",
      "Say: I haven't drunk the beer yet.",
      "まだ ビールを のんでいません",
      ["まだ", "ビール", "を", "のんでいません", "もう"],
      ["まだ", "ビール", "を", "のんでいません"],
      ["ビール"],
    ),
    listeningBuildSentence({
      id: "ja-m11-5-1-lb-1",
      target: "まだ コーヒーを のんでいません",
      tiles: ["コーヒー", "を", "のんでいません", "まだ", "もう", "のみました"],
      correctOrder: ["まだ", "コーヒー", "を", "のんでいません"],
      promptEn: "Hear it, build it: 'I haven't drunk the coffee yet.'",
    }),
    sentenceMcq({
      id: "ja-m11-5-1-mcq-2",
      prompt: "Someone asks もう たべましたか. You haven't eaten. What do you say?",
      correctKana: "まだです。",
      distractorsKana: [
        "もうです。",
        "いいえ、たべます。",
        "はい、たべません。",
      ],
      explanation: "まだです = 'Not yet.' The natural short answer to a もう question.",
    }),
    selfExplain({
      id: "ja-m11-5-1-self",
      anchorLabel: "もう たべました vs まだ たべていません",
      anchorAudioText: "もう たべました",
      question: "Why does もう pair with past tense but まだ with negative?",
      rule: { text: "もう ('already') reports a completed action → past tense. まだ ('not yet') reports an uncompleted action → negative. They are aspect markers indicating completion status." },
      surface: { text: "もう is more formal than まだ — the tense choice is about politeness level." },
      distractor: { text: "もう can pair with any tense — もう たべません means 'I already don't eat' which is grammatically fine." },
      ruleExplanation: "もう + past = 'already did.' まだ + negative = 'haven't yet.' もう + negative does exist but means 'no longer / not anymore' — a different meaning.",
    }),
    speaking(
      "ja-m11-5-1-speak-mada",
      "まだ のんでいません",
      "I haven't drunk it yet.",
    ),
    // ── Review tail ──
    speaking("ja-m11-5-1-rev-speak-1", M11_5_1_REVIEW[0].kana, M11_5_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-5-1-rev-lc-1",
      audioText: "じてんしゃで こうえんに いきます",
      correctMeaningEn: "I go to the park by bicycle.",
      distractorsEn: [
        "I go to the park by bus.",
        "I went to the park by bicycle.",
        "I walk to the park.",
      ],
    }),
    vocabMcq("ja-m11-5-1-rev-mcq-1", M11_5_1_REVIEW[2], M11_REVIEW_M4_POOL),
    reviewMatchPairs("ja-m11-5-1-rev", M11_5_1_REVIEW),
    infoStep(
      "ja-m11-5-1-info-end",
      "You can now talk about what you've done and haven't done yet",
      "もう = already (+ past). まだ = not yet (+ negative). まだです = the polite 'not yet.'",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_5_1.steps);
assertAnswerRotation(M11_5_1.steps, 2);
assertNoConsecutiveSame(M11_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-5-2 — "Still and already" practice (まだ/もう with past/negative)
// ═══════════════════════════════════════════════════════════════════════

const M11_5_2_REVIEW = pickReviewAtoms("ja-m11-5-2-rev", M11_REVIEW_M3_POOL, 4);

export const M11_5_2: LessonContent = {
  id: "ja-m11-5-2",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Still and already (practice)",
  description:
    "Drill まだ/もう across verbs and contexts, plus もういちど (one more time). Discrimination and production.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-5-2-info-open",
      "まだ/もう production",
      "Mix and match: もう + past, まだ + negative. Who already did what? Who hasn't yet?",
    ),
    // ── Drill block ──
    sentenceMcq({
      id: "ja-m11-5-2-mcq-1",
      prompt: "Which sentence means 'I haven't read it yet.'?",
      correctKana: "まだ よんでいません。",
      distractorsKana: [
        "もう よみました。",
        "まだ よみます。",
        "もう よんでいません。",
      ],
      explanation: "まだ + negative = 'haven't yet.' よんでいません = haven't read.",
    }),
    build(
      "ja-m11-5-2-build-1",
      "Say: I already went.",
      "もう いきました",
      ["いきません", "いっていません", "まだ", "いきました", "もう"],
      ["もう", "いきました"],
    ),
    cloze(
      "ja-m11-5-2-cloze-1",
      "",
      " のみました。",
      "もう",
      ["もう", "まだ", "ぜんぜん", "あまり"],
      "I already drank.",
      "もう のみました。",
      "もう + past affirmative = 'already did.'",
    ),
    listeningCompSentence({
      id: "ja-m11-5-2-lc-1",
      audioText: "まだです",
      correctMeaningEn: "Not yet.",
      distractorsEn: [
        "Already.",
        "I don't know.",
        "That's right.",
      ],
    }),
    build(
      "ja-m11-5-2-build-2",
      "Say: I haven't written yet.",
      "まだ かいていません",
      ["かきません", "かきました", "かいていません", "まだ", "もう"],
      ["まだ", "かいていません"],
    ),
    cloze(
      "ja-m11-5-2-cloze-2",
      "",
      " みました。",
      "もう",
      ["もう", "まだ", "いつも", "よく"],
      "I already watched.",
      "もう みました。",
      "もう + past = 'already watched.'",
    ),
    sentenceMcq({
      id: "ja-m11-5-2-mcq-2",
      prompt: "もう ごはんを たべましたか. What does this ask?",
      correctKana: "Have you already eaten?",
      distractorsKana: [
        "Do you eat every day?",
        "Haven't you eaten yet?",
        "Will you eat?",
      ],
      explanation: "もう + past question = 'Have you already...?'",
    }),
    listeningBuildSentence({
      id: "ja-m11-5-2-lb-1",
      target: "もう ごはんを たべました",
      tiles: ["ごはん", "を", "たべました", "もう", "まだ", "たべていません"],
      correctOrder: ["もう", "ごはん", "を", "たべました"],
      promptEn: "Hear it, build it: 'I already ate the meal.'",
    }),
    build(
      "ja-m11-5-2-build-3",
      "Say: I haven't drunk it yet.",
      "まだ のんでいません",
      ["のみました", "のみません", "のんでいません", "もう", "まだ"],
      ["まだ", "のんでいません"],
    ),
    listeningCompSentence({
      id: "ja-m11-5-2-lc-2",
      audioText: "もう コーヒーを のみましたか",
      correctMeaningEn: "Have you already drunk coffee?",
      distractorsEn: [
        "Do you drink coffee?",
        "Haven't you drunk coffee yet?",
        "Don't you drink coffee?",
      ],
    }),
    // ── もういちど (one more time) — builds on もう ──
    build(
      "ja-m11-5-2-build-mouichido",
      "Pick the Japanese word for: One more time",
      "もういちど",
      ["ときどき", "もう", "もういちど", "まだ"],
      ["もういちど"],
    ),
    listeningCompSentence({
      id: "ja-m11-5-2-lc-mouichido",
      audioText: "もういちど みました",
      correctMeaningEn: "I watched it one more time.",
      distractorsEn: [
        "I already watched it.",
        "I haven't watched it yet.",
        "I watch it every day.",
      ],
    }),
    build(
      "ja-m11-5-2-build-mouichido-sentence",
      "Say: I read the book one more time.",
      "もういちど ほんを よみました",
      ["を", "もういちど", "よみません", "もう", "よみました", "ほん"],
      ["もういちど", "ほん", "を", "よみました"],
    ),
    cloze(
      "ja-m11-5-2-cloze-3",
      "",
      " たべていません。",
      "まだ",
      ["まだ", "もう", "ぜんぜん", "あまり"],
      "I haven't eaten yet.",
      "まだ たべていません。",
      "まだ + negative = 'haven't yet.'",
    ),
    translateStep({
      id: "ja-m11-5-2-translate",
      promptEn: "I already ate.",
      acceptedAnswers: [
        "もう たべました",
        "もう たべました。",
      ],
      audioText: "もう たべました",
    }),
    selfExplain({
      id: "ja-m11-5-2-self",
      anchorLabel: "もう たべましたか → まだです",
      anchorAudioText: "まだです",
      question: "Why is まだです the natural answer to もう questions?",
      rule: { text: "まだです is a short polite form meaning 'not yet.' It directly answers the もう question's implication of 'have you completed this?'" },
      surface: { text: "まだです means 'still doing it' — it's about ongoing actions only." },
      distractor: { text: "まだです is casual slang — in polite speech you must say いいえ、たべませんでした." },
      ruleExplanation: "まだです = 'Not yet.' A clean, polite short answer. No need for a full negative sentence.",
    }),
    speaking(
      "ja-m11-5-2-speak",
      "もう てがみを かきました",
      "I already wrote the letter.",
    ),
    // ── ひるごはん — carrier restored after the variety rewrite dropped
    //    its original sentence ──
    build(
      "ja-m11-5-2-build-hirugohan",
      "Pick the Japanese for: lunch (midday meal)",
      "ひるごはん",
      ["ごはん", "ひるごはん", "おちゃ", "ぎゅうにゅう"],
      ["ひるごはん"],
    ),
    listeningCompSentence({
      id: "ja-m11-5-2-lc-hirugohan",
      audioText: "ひるごはんは まだ たべていません",
      correctMeaningEn: "I haven't eaten lunch yet.",
      distractorsEn: [
        "I already ate lunch.",
        "I don't eat breakfast.",
        "I'm eating lunch now.",
      ],
    }),
    // ── Review tail ──
    speaking("ja-m11-5-2-rev-speak-1", M11_5_2_REVIEW[0].kana, M11_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-5-2-rev-lc-1",
      audioText: "あの ホテルは たかいです",
      correctMeaningEn: "That hotel is expensive.",
      distractorsEn: [
        "That hotel is cheap.",
        "This hotel is expensive.",
        "That hotel was expensive.",
      ],
    }),
    vocabMcq("ja-m11-5-2-rev-mcq-1", M11_5_2_REVIEW[2], M11_REVIEW_M3_POOL),
    reviewMatchPairs("ja-m11-5-2-rev", M11_5_2_REVIEW),
    infoStep(
      "ja-m11-5-2-info-end",
      "You can ask and answer 'Have you already...?' and 'Not yet'",
      "もう + past = already. まだ + negative = not yet. もういちど = one more time. まだです = the polite short answer.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_5_2.steps);
assertAnswerRotation(M11_5_2.steps, 2);
assertNoConsecutiveSame(M11_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-6-1 — "Every day" intro (まいにち, まいしゅう, まいつき, まいとし)
// ═══════════════════════════════════════════════════════════════════════

const M11_6_1_REVIEW = pickReviewAtoms("ja-m11-6-1-rev", M11_REVIEW_M6_POOL, 4);

export const M11_6_1: LessonContent = {
  id: "ja-m11-6-1",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Every day, every week... (intro)",
  description:
    "Time frequency words: まいにち, まいしゅう, まいつき, まいとし.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-6-1-info-open",
      "Regular intervals — まい-words",
      "Four words starting with まい (every): day, week, month, year. They all work the same way in sentences.",
    ),
    // ── まいにち (every day) ──
    build(
      "ja-m11-6-1-build-mainichi",
      "Pick the Japanese word for: Every day",
      "まいにち",
      ["まいとし", "まいにち", "まいしゅう", "まいつき"],
      ["まいにち"],
    ),
    listeningCompSentence({
      id: "ja-m11-6-1-lc-mainichi",
      audioText: "まいにち コーヒーを のみます",
      correctMeaningEn: "I drink coffee every day.",
      distractorsEn: [
        "I drink coffee every week.",
        "I always drink coffee.",
        "I don't drink coffee every day.",
      ],
    }),
    // ── まいしゅう (every week) ──
    build(
      "ja-m11-6-1-build-maishuu",
      "Pick the Japanese word for: Every week",
      "まいしゅう",
      ["まいとし", "まいつき", "まいしゅう", "まいにち"],
      ["まいしゅう"],
    ),
    vocabMcq(
      "ja-m11-6-1-mcq-maishuu",
      { kana: "まいしゅう", meaningEn: "every week", emoji: "📅", fromModule: "m11" },
      M11_REVIEW_M7_POOL,
    ),
    // ── まいつき (every month) ──
    build(
      "ja-m11-6-1-build-maitsuki",
      "Pick the Japanese word for: Every month",
      "まいつき",
      ["まいしゅう", "まいとし", "まいつき", "まいにち"],
      ["まいつき"],
    ),
    speaking("ja-m11-6-1-speak-maitsuki", "まいつき", "Every month"),
    // ── まいとし (every year) ──
    build(
      "ja-m11-6-1-build-maitoshi",
      "Pick the Japanese word for: Every year",
      "まいとし",
      ["まいにち", "まいしゅう", "まいとし", "まいつき"],
      ["まいとし"],
    ),
    listeningCompSentence({
      id: "ja-m11-6-1-lc-maitoshi",
      audioText: "まいとし にほんに いきます",
      correctMeaningEn: "I go to Japan every year.",
      distractorsEn: [
        "I go to Japan every month.",
        "I went to Japan.",
        "I don't go to Japan.",
      ],
    }),
    // ── Sentence drills ──
    cloze(
      "ja-m11-6-1-cloze-1",
      "",
      " ほんを よみます。",
      "まいにち",
      ["まいにち", "まいしゅう", "まいつき", "まいとし"],
      "I read books every day.",
      "まいにち ほんを よみます。",
      "まいにち = every day. The most frequent of the まい-words.",
    ),
    build(
      "ja-m11-6-1-build-sentence-1",
      "Say: I go to the park every week.",
      "まいしゅう こうえんに いきます",
      ["に", "こうえん", "まいしゅう", "いきます", "いきません", "まいにち"],
      ["まいしゅう", "こうえん", "に", "いきます"],
    ),
    sentenceMcq({
      id: "ja-m11-6-1-mcq-discrim",
      prompt: "Which sentence means 'I eat ramen every month.'?",
      correctKana: "まいつき ラーメンを たべます。",
      distractorsKana: [
        "まいにち ラーメンを たべます。",
        "まいしゅう ラーメンを たべます。",
        "まいとし ラーメンを たべます。",
      ],
      explanation: "まいつき = every month.",
    }),
    cloze(
      "ja-m11-6-1-cloze-2",
      "",
      " にほんに いきます。",
      "まいとし",
      ["まいとし", "まいにち", "まいしゅう", "まいつき"],
      "I go to Japan every year.",
      "まいとし にほんに いきます。",
      "まいとし = every year. The least frequent まい-word.",
    ),
    // ── Katakana interleave (rollout M11 ラ row → テレビ is now
    //    base-readable). Frequency word + readable loanword object. ──
    build(
      "ja-m11-6-1-build-terebi",
      "Say: I watch TV every day.",
      "まいにち テレビを みます",
      ["まいにち", "テレビ", "を", "みます", "みません"],
      ["まいにち", "テレビ", "を", "みます"],
      ["テレビ"],
    ),
    listeningBuildSentence({
      id: "ja-m11-6-1-lb-1",
      target: "まいにち しんぶんを よみます",
      tiles: ["まいしゅう", "を", "よみます", "のみます", "しんぶん", "まいにち"],
      correctOrder: ["まいにち", "しんぶん", "を", "よみます"],
      promptEn: "Hear it, build it: 'I read the newspaper every day.'",
    }),
    selfExplain({
      id: "ja-m11-6-1-self",
      anchorLabel: "まいにち, まいしゅう, まいつき, まいとし",
      anchorAudioText: "まいにち",
      question: "What pattern connects all four まい-words?",
      rule: { text: "まい (every) + time unit: にち (day), しゅう (week), つき (month), とし (year). The まい prefix is consistent across all four." },
      surface: { text: "They are all frequency adverbs — their meanings are unrelated to each other." },
      distractor: { text: "まい means 'before' — まいにち literally means 'before the day.'" },
      ruleExplanation: "まい = every. Attach any time unit. The pattern is productive and easy to remember once you see まい as the shared prefix.",
    }),
    speaking(
      "ja-m11-6-1-speak-mainichi",
      "まいにち おちゃを のみます",
      "I drink tea every day.",
    ),
    // ── Review tail ──
    speaking("ja-m11-6-1-rev-speak-1", M11_6_1_REVIEW[0].kana, M11_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-6-1-rev-lc-1",
      audioText: M11_6_1_REVIEW[1].kana,
      correctMeaningEn: M11_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M11_6_1_REVIEW[2].meaningEn,
        M11_6_1_REVIEW[3].meaningEn,
        M11_REVIEW_M6_POOL[0].meaningEn,
      ],
    }),
    // ── Katakana interleave (rollout M11 ラ row → ホテル + トイレ both
    //    readable). M6 existence grammar as a review beat. ──
    listeningBuildSentence({
      id: "ja-m11-6-1-lb-hoteru",
      target: "ホテルに トイレが あります",
      tiles: ["ホテル", "に", "トイレ", "が", "あります", "います"],
      correctOrder: ["ホテル", "に", "トイレ", "が", "あります"],
      promptEn: "Hear it, build it: 'There's a toilet in the hotel.'",
      exercisedAtomKanas: ["ホテル", "トイレ"],
    }),
    vocabMcq("ja-m11-6-1-rev-mcq-1", M11_6_1_REVIEW[2], M11_REVIEW_M6_POOL),
    reviewMatchPairs("ja-m11-6-1-rev", M11_6_1_REVIEW),
    infoStep(
      "ja-m11-6-1-info-end",
      "You can now talk about regular habits",
      "まいにち (every day), まいしゅう (every week), まいつき (every month), まいとし (every year) — all follow the まい pattern.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_6_1.steps);
assertAnswerRotation(M11_6_1.steps, 2);
assertNoConsecutiveSame(M11_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-6-2 — "Every day" practice (frequency + negation combined)
// ═══════════════════════════════════════════════════════════════════════

const M11_6_2_REVIEW = pickReviewAtoms("ja-m11-6-2-rev", M11_REVIEW_M5_POOL, 4);

export const M11_6_2: LessonContent = {
  id: "ja-m11-6-2",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Every day (practice)",
  description:
    "Combine まい-words with negation, plus また (again) — and don't mix it up with まだ.",
  estimatedMinutes: 9,
  xpReward: 22,
  steps: [
    infoStep(
      "ja-m11-6-2-info-open",
      "Frequency + negation",
      "What you DON'T do every day, every week, every month. Combine まい-words with ません.",
    ),
    // ── Combined drills ──
    sentenceMcq({
      id: "ja-m11-6-2-mcq-1",
      prompt: "Which sentence means 'I don't eat bread every day.'?",
      correctKana: "まいにち パンを たべません。",
      distractorsKana: [
        "まいにち パンを たべます。",
        "まいしゅう パンを たべません。",
        "まいにち パンを たべました。",
      ],
      explanation: "まいにち + たべません = 'don't eat every day.'",
    }),
    build(
      "ja-m11-6-2-build-1",
      "Say: I don't go to the library every week.",
      "まいしゅう としょかんに いきません",
      ["としょかん", "いきます", "に", "いきません", "まいしゅう", "まいにち"],
      ["まいしゅう", "としょかん", "に", "いきません"],
    ),
    cloze(
      "ja-m11-6-2-cloze-1",
      "まいにち コーヒーを ",
      "。",
      "のみません",
      ["のみません", "のみます", "たべません", "のみました"],
      "I don't drink coffee every day.",
      "まいにち コーヒーを のみません。",
      "まいにち + negative = habitual negation.",
    ),
    listeningCompSentence({
      id: "ja-m11-6-2-lc-1",
      audioText: "まいしゅう およぎません",
      correctMeaningEn: "I don't swim every week.",
      distractorsEn: [
        "I swim every week.",
        "I don't swim every day.",
        "I didn't swim last week.",
      ],
    }),
    build(
      "ja-m11-6-2-build-2",
      "Say: I don't read newspapers every month.",
      "まいつき しんぶんを よみません",
      ["よみません", "まいつき", "よみます", "を", "しんぶん", "まいしゅう"],
      ["まいつき", "しんぶん", "を", "よみません"],
    ),
    cloze(
      "ja-m11-6-2-cloze-2",
      "まいとし にほんに ",
      "。",
      "いきます",
      ["いきます", "いきません", "いきました", "いきませんでした"],
      "I go to Japan every year.",
      "まいとし にほんに いきます。",
      "Positive — not everything is negated!",
    ),
    sentenceMcq({
      id: "ja-m11-6-2-mcq-2",
      prompt: "Which sentence means 'I don't watch TV every day.'?",
      correctKana: "まいにち テレビを みません。",
      distractorsKana: [
        "まいにち テレビを みます。",
        "まいしゅう テレビを みません。",
        "まいにち テレビを みました。",
      ],
      explanation: "まいにち + みません = 'don't watch every day.'",
    }),
    // ── また (again) — contrast with まだ ──
    build(
      "ja-m11-6-2-build-mata",
      "Pick the Japanese word for: Again",
      "また",
      ["もう", "まいにち", "また", "まだ"],
      ["また"],
    ),
    listeningCompSentence({
      id: "ja-m11-6-2-lc-mata",
      audioText: "また こうえんに いきました",
      correctMeaningEn: "I went to the park again.",
      distractorsEn: [
        "I haven't gone to the park yet.",
        "I go to the park every day.",
        "I went to the park for the first time.",
      ],
    }),
    build(
      "ja-m11-6-2-build-mata-sentence",
      "Say: I ate ramen again yesterday.",
      "きのう また ラーメンを たべました",
      ["まだ", "ラーメン", "を", "たべました", "また", "きのう"],
      ["きのう", "また", "ラーメン", "を", "たべました"],
    ),
    listeningBuildSentence({
      id: "ja-m11-6-2-lb-1",
      target: "まいにち ほんを よみません",
      tiles: ["を", "まいしゅう", "まいにち", "よみます", "ほん", "よみません"],
      correctOrder: ["まいにち", "ほん", "を", "よみません"],
      promptEn: "Hear it, build it: 'I don't read books every day.'",
    }),
    // ── Combining with あまり/ぜんぜん ──
    build(
      "ja-m11-6-2-build-3",
      "Say: I don't eat much every day.",
      "まいにち あまり たべません",
      ["ぜんぜん", "あまり", "たべません", "まいにち", "たべます"],
      ["まいにち", "あまり", "たべません"],
    ),
    cloze(
      "ja-m11-6-2-cloze-3",
      "まいしゅう ぜんぜん ",
      "。",
      "いきません",
      ["いきません", "いきます", "のみません", "たべません"],
      "I don't go at all every week.",
      "まいしゅう ぜんぜん いきません。",
      "まい-word + ぜんぜん + negative = compound negation.",
    ),
    listeningCompSentence({
      id: "ja-m11-6-2-lc-2",
      audioText: "まいにち あまり のみません",
      correctMeaningEn: "I don't drink much every day.",
      distractorsEn: [
        "I drink a lot every day.",
        "I don't drink at all every day.",
        "I drink every day.",
      ],
    }),
    translateStep({
      id: "ja-m11-6-2-translate",
      promptEn: "I don't drink beer every day.",
      acceptedAnswers: [
        "まいにち ビールを のみません",
        "まいにち ビールを のみません。",
      ],
      audioText: "まいにち ビールを のみません",
    }),
    selfExplain({
      id: "ja-m11-6-2-self",
      anchorLabel: "まいにち あまり たべません",
      anchorAudioText: "まいにち あまり たべません",
      question: "Can まい-words combine with あまり/ぜんぜん?",
      rule: { text: "Yes. まい-words set the time frame; あまり/ぜんぜん set the degree. Both can coexist in one sentence as long as the verb is negative." },
      surface: { text: "No — you can only use one frequency word per sentence." },
      distractor: { text: "まい-words replace あまり/ぜんぜん — they serve the same function." },
      ruleExplanation: "まいにち = when (every day). あまり = how much (not much). They answer different questions and stack naturally.",
    }),
    speaking(
      "ja-m11-6-2-speak",
      "まいしゅう あまり いきません",
      "I don't go much every week.",
    ),
    // ── Review tail ──
    speaking("ja-m11-6-2-rev-speak-1", M11_6_2_REVIEW[0].kana, M11_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-6-2-rev-lc-1",
      audioText: "ともだちが ななにん います",
      correctMeaningEn: "There are seven friends.",
      distractorsEn: [
        "There are two friends.",
        "There are seven cats.",
        "There are ten friends.",
      ],
    }),
    vocabMcq("ja-m11-6-2-rev-mcq-1", M11_6_2_REVIEW[2], M11_REVIEW_M5_POOL),
    reviewMatchPairs("ja-m11-6-2-rev", M11_6_2_REVIEW),
    infoStep(
      "ja-m11-6-2-info-end",
      "You can describe habits you don't have",
      "まいにち / まいしゅう / まいつき / まいとし with ません and あまり/ぜんぜん — plus また (again) vs まだ (not yet) locked in.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_6_2.steps);
assertAnswerRotation(M11_6_2.steps, 2);
assertNoConsecutiveSame(M11_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-STORY — Narrative story (storyComprehension factory, §13.13 closer):
// たけし describes his daily habits — negation grammar + cumulative vocab.
// ═══════════════════════════════════════════════════════════════════════

const M11_STORY_REVIEW = pickReviewAtoms("ja-m11-story-rev", M11_REVIEW_POOL, 4);

export const M11_STORY: LessonContent = {
  id: "ja-m11-story",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Takeshi's habits",
  description:
    "Listen to たけし describe what he does — and doesn't do — every day. Answer questions, then reply with your own habit sentence.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    infoStep(
      "ja-m11-story-info-open",
      "Story time — たけしさんの まいにち",
      "たけし tells you about his daily habits: what he does every day, what he never does, and what he hasn't done yet today.",
    ),
    build(
      "ja-m11-story-warmup-build",
      "Warm up — say: I don't eat much. (polite)",
      "あまり たべません",
      ["たべません", "ぜんぜん", "たべます", "あまり"],
      ["あまり", "たべません"],
    ),
    sentenceMcq({
      id: "ja-m11-story-warmup-mcq",
      prompt: "Warm up — which question asks 'Have you already eaten?'",
      correctKana: "もう たべましたか。",
      distractorsKana: [
        "まだ たべていませんか。",
        "もう たべませんか。",
        "まだ たべますか。",
      ],
      explanation: "もう + past + か = 'Have you already...?'",
    }),
    ...storyComprehension({
      idPrefix: "ja-m11-story",
      narrative: [
        { kana: "たけしさんは まいにち こうえんで はしります。" },
        { kana: "ビールは ぜんぜん のみません。" },
        { kana: "テレビは あまり みません。" },
        { kana: "まいしゅう としょかんに いきます。" },
        { kana: "きょうは まだ ひるごはんを たべていません。" },
        { kana: "もう おちゃを のみました。" },
      ],
      comprehensionQuestions: [
        {
          id: "q1",
          prompt: "Does たけし drink beer?",
          correctText: "No — not at all",
          distractors: ["Yes, every day", "Sometimes", "Only at the library"],
          explanation: "ぜんぜん のみません = doesn't drink it at all.",
        },
        {
          id: "q2",
          prompt: "How often does たけし go to the library?",
          correctText: "Every week",
          distractors: ["Every day", "Every month", "Not at all"],
          explanation: "まいしゅう としょかんに いきます = goes to the library every week.",
        },
        {
          id: "q3",
          prompt: "Has たけし eaten today?",
          correctText: "Not yet",
          distractors: ["Yes, already", "He never eats", "He ate yesterday"],
          explanation: "まだ ひるごはんを たべていません = hasn't eaten lunch yet.",
        },
      ],
      responseBuild: {
        target: "まいにち ほんを よみます",
        tiles: ["まいにち", "ほん", "を", "よみます", "よみません", "まだ"],
        correctOrder: ["まいにち", "ほん", "を", "よみます"],
        promptEn:
          "Now たけし asks YOU: まいにち なにを しますか。 Reply: 'I read books every day.'",
      },
    }),
    cloze(
      "ja-m11-story-cloze-zenzen",
      "ビールは ",
      " のみません。",
      "ぜんぜん",
      ["ぜんぜん", "あまり", "まだ", "もう"],
      "I don't drink beer at all.",
      "ビールは ぜんぜん のみません。",
      "ぜんぜん = total negation — たけし never drinks beer.",
    ),
    listeningBuildSentence({
      id: "ja-m11-story-lb-mada",
      target: "きょうは まだ ひるごはんを たべていません",
      tiles: ["ひるごはん", "きょうは", "たべていません", "を", "まだ", "たべました", "もう"],
      correctOrder: ["きょうは", "まだ", "ひるごはん", "を", "たべていません"],
      promptEn: "Hear it, build it: 'I haven't eaten yet today.'",
    }),
    listeningCompSentence({
      id: "ja-m11-story-lc-mou",
      audioText: "もう おちゃを のみました",
      correctMeaningEn: "I already drank tea.",
      distractorsEn: [
        "I haven't drunk tea yet.",
        "I don't drink tea at all.",
        "I drink tea every day.",
      ],
    }),
    speaking(
      "ja-m11-story-speak-amari",
      "テレビは あまり みません",
      "I don't watch TV much.",
    ),
    sentenceMcq({
      id: "ja-m11-story-mcq-summary",
      prompt: "Which describes たけし's day so far?",
      correctKana: "He hasn't eaten yet, but he already drank tea",
      distractorsKana: [
        "He already ate and drank tea",
        "He hasn't eaten or drunk anything",
        "He ate, but hasn't drunk tea yet",
      ],
      explanation: "まだ たべていません (not yet) + もう のみました (already).",
    }),
    reviewMatchPairs("ja-m11-story-rev", M11_STORY_REVIEW),
    infoStep(
      "ja-m11-story-info-end",
      "You followed a whole routine told through negation",
      "ぜんぜん のみません, あまり みません, まだ たべていません, もう のみました — you can follow real talk about habits now.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M11_STORY.steps);
assertPassiveCardsHaveFollowup(M11_STORY.steps);
assertNoExplanationOnPassive(M11_STORY.steps);
assertExplanationDoesntLeakAnswer(M11_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-7-1 — Mixed negation drill (ません vs ない, affirmative vs negative)
// ═══════════════════════════════════════════════════════════════════════

const M11_7_1_REVIEW = pickReviewAtoms("ja-m11-7-1-rev", M11_REVIEW_POOL, 5);

export const M11_7_1: LessonContent = {
  id: "ja-m11-7-1",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed negation drill",
  description:
    "ません vs ない, affirmative vs negative, present vs past — all mixed together.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m11-7-1-info-open",
      "Everything at once",
      "Polite negative (ません), casual negative (ない), past negative (ませんでした), frequency adverbs — mixed and interleaved.",
    ),
    // ── Mixed discrimination ──
    sentenceMcq({
      id: "ja-m11-7-1-mcq-1",
      prompt: "Which is the CASUAL negative of 'eat'?",
      correctKana: "たべない",
      distractorsKana: [
        "たべません",
        "たべませんでした",
        "たべました",
      ],
      explanation: "たべない = casual/plain negative. たべません = polite negative.",
    }),
    cloze(
      "ja-m11-7-1-cloze-1",
      "ぜんぜん ",
      "。",
      "わかりません",
      ["わかりません", "わかります", "わからない", "わかりました"],
      "I don't understand at all. (polite)",
      "ぜんぜん わかりません。",
      "ぜんぜん + polite negative.",
    ),
    build(
      "ja-m11-7-1-build-1",
      "Make the casual negative of はしる (run):",
      "はしらない",
      ["はしるない", "はしりない", "はしりません", "はしらない"],
      ["はしらない"],
    ),
    listeningCompSentence({
      id: "ja-m11-7-1-lc-1",
      audioText: "きのう たべませんでした",
      correctMeaningEn: "I didn't eat yesterday.",
      distractorsEn: [
        "I don't eat.",
        "I ate yesterday.",
        "I didn't eat. (casual)",
      ],
    }),
    sentenceMcq({
      id: "ja-m11-7-1-mcq-2",
      prompt: "Which sentence means 'I don't go. (casual)'?",
      correctKana: "いかない。",
      distractorsKana: [
        "いきません。",
        "いきませんでした。",
        "いきました。",
      ],
      explanation: "いかない = casual negative. いきません = polite negative.",
    }),
    cloze(
      "ja-m11-7-1-cloze-2",
      "あまり コーヒーを ",
      "。",
      "のみません",
      ["のみません", "のまない", "のみます", "のみました"],
      "I don't drink much coffee. (polite)",
      "あまり コーヒーを のみません。",
      "Polite form used in conversation with acquaintances.",
    ),
    build(
      "ja-m11-7-1-build-2",
      "Say: I don't do it. (casual)",
      "しない",
      ["さない", "しない", "こない", "しません"],
      ["しない"],
    ),
    listeningBuildSentence({
      id: "ja-m11-7-1-lb-1",
      target: "まだ てがみを かいていません",
      tiles: ["てがみ", "を", "かいていません", "まだ", "もう", "かきました"],
      correctOrder: ["まだ", "てがみ", "を", "かいていません"],
      promptEn: "Hear it, build it: 'I haven't written the letter yet.'",
    }),
    cloze(
      "ja-m11-7-1-cloze-3",
      "もう ",
      "。",
      "みました",
      ["みました", "みません", "みない", "みませんでした"],
      "I already watched.",
      "もう みました。",
      "もう + past affirmative = 'already.'",
    ),
    sentenceMcq({
      id: "ja-m11-7-1-mcq-3",
      prompt: "Which is correct: 'I don't come. (casual)'?",
      correctKana: "こない。",
      distractorsKana: [
        "くない。",
        "きません。",
        "きない。",
      ],
      explanation: "くる → こない. Irregular — memorize the こ stem.",
    }),
    build(
      "ja-m11-7-1-build-3",
      "Say: I already wrote.",
      "もう かきました",
      ["かかない", "まだ", "かきました", "かきません", "もう"],
      ["もう", "かきました"],
    ),
    listeningCompSentence({
      id: "ja-m11-7-1-lc-2",
      audioText: "ぜんぜん しない",
      correctMeaningEn: "I don't do it at all. (casual)",
      distractorsEn: [
        "I don't do it at all. (polite)",
        "I always do it.",
        "I didn't do it.",
      ],
    }),
    cloze(
      "ja-m11-7-1-cloze-4",
      "まいしゅう あまり ",
      "。",
      "たべません",
      ["たべません", "たべない", "たべます", "たべました"],
      "I don't eat much every week. (polite)",
      "まいしゅう あまり たべません。",
      "Layered: time + degree + polite negative.",
    ),
    selfExplain({
      id: "ja-m11-7-1-self",
      anchorLabel: "たべません (polite) vs たべない (casual)",
      anchorAudioText: "たべません",
      question: "When would you use たべません vs たべない?",
      rule: { text: "たべません is the polite negative for acquaintances, strangers, and formal situations. たべない is the casual/plain negative for close friends and family." },
      surface: { text: "たべません is for negative statements; たべない is for negative questions." },
      distractor: { text: "たべない is the written form; たべません is only used in speech." },
      ruleExplanation: "Politeness level: ません = polite register; ない = casual/plain register. Same meaning, different social context.",
    }),
    speaking(
      "ja-m11-7-1-speak",
      "ぜんぜん わかりません",
      "I don't understand at all.",
    ),
    // ── Review tail ──
    speaking("ja-m11-7-1-rev-speak-1", M11_7_1_REVIEW[0].kana, M11_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-7-1-rev-lc-1",
      audioText: "まいにち しんぶんを よみます",
      correctMeaningEn: "I read the newspaper every day.",
      distractorsEn: [
        "I read the newspaper every week.",
        "I read a book every day.",
        "I don't read the newspaper much.",
      ],
    }),
    vocabMcq("ja-m11-7-1-rev-mcq-1", M11_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M11_REVIEW_POOL),
    speaking("ja-m11-7-1-rev-speak-2", M11_7_1_REVIEW[2].kana, M11_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m11-7-1-rev", M11_7_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m11-7-1-info-end",
      "You can switch between polite and casual negation fluently",
      "ません, ない, ませんでした — mixed with frequency adverbs and aspect markers. Full negation toolkit deployed.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_7_1.steps);
assertAnswerRotation(M11_7_1.steps, 2);
assertNoConsecutiveSame(M11_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M11-7-2 — Negation production (translate + speaking)
// ═══════════════════════════════════════════════════════════════════════

const M11_7_2_REVIEW = pickReviewAtoms("ja-m11-7-2-rev", M11_REVIEW_POOL, 5);

export const M11_7_2: LessonContent = {
  id: "ja-m11-7-2",
  moduleId: "m11",
  courseId: COURSE,
  languageId: LANG,
  title: "Negation production",
  description:
    "Production-heavy: translate, build, and speak negation sentences across all M11 patterns.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m11-7-2-info-open",
      "Full production wrap-up",
      "Build, translate, and speak: every negation pattern from M11 in production direction.",
    ),
    // ── Production drills ──
    build(
      "ja-m11-7-2-build-1",
      "Say: I don't eat much bread. (polite)",
      "あまり パンを たべません",
      ["たべない", "あまり", "ぜんぜん", "を", "たべません", "パン"],
      ["あまり", "パン", "を", "たべません"],
    ),
    speaking(
      "ja-m11-7-2-speak-1",
      "あまり パンを たべません",
      "I don't eat much bread.",
    ),
    translateStep({
      id: "ja-m11-7-2-translate-1",
      promptEn: "I don't watch TV at all.",
      acceptedAnswers: [
        "ぜんぜん テレビを みません",
        "ぜんぜん テレビを みません。",
        "テレビは ぜんぜん みません",
        "テレビは ぜんぜん みません。",
      ],
      audioText: "ぜんぜん テレビを みません",
    }),
    build(
      "ja-m11-7-2-build-2",
      "Say: I didn't go yesterday. (polite)",
      "きのう いきませんでした",
      ["いきません", "まいにち", "いきました", "いきませんでした", "きのう"],
      ["きのう", "いきませんでした"],
    ),
    speaking(
      "ja-m11-7-2-speak-2",
      "せんしゅう でかけませんでした",
      "I didn't go out last week.",
    ),
    sentenceMcq({
      id: "ja-m11-7-2-mcq-1",
      prompt: "Which sentence means 'I already drank coffee.'?",
      correctKana: "もう コーヒーを のみました。",
      distractorsKana: [
        "まだ コーヒーを のんでいません。",
        "ぜんぜん コーヒーを のみません。",
        "もう コーヒーを のみません。",
      ],
      explanation: "もう + のみました (past) = 'already drank.'",
    }),
    build(
      "ja-m11-7-2-build-3",
      "Say: I haven't written it yet.",
      "まだ かいていません",
      ["かきません", "かいていません", "かきました", "もう", "まだ"],
      ["まだ", "かいていません"],
    ),
    listeningBuildSentence({
      id: "ja-m11-7-2-lb-1",
      target: "ビールは ぜんぜん のみません",
      tiles: ["ビール", "は", "ぜんぜん", "のみません", "あまり", "のみます"],
      correctOrder: ["ビール", "は", "ぜんぜん", "のみません"],
      promptEn: "Hear it, build it: 'I don't drink beer at all.'",
    }),
    translateStep({
      id: "ja-m11-7-2-translate-2",
      promptEn: "I already ate.",
      acceptedAnswers: [
        "もう たべました",
        "もう たべました。",
      ],
      audioText: "もう たべました",
    }),
    build(
      "ja-m11-7-2-build-4",
      "Say: I don't read. (casual)",
      "よまない",
      ["よみない", "よみません", "かかない", "よまない"],
      ["よまない"],
    ),
    speaking(
      "ja-m11-7-2-speak-3",
      "おきない",
      "I don't wake up. (casual)",
    ),
    listeningCompSentence({
      id: "ja-m11-7-2-lc-1",
      audioText: "まいにち あまり のみません",
      correctMeaningEn: "I don't drink much every day.",
      distractorsEn: [
        "I drink a lot every day.",
        "I didn't drink every day.",
        "I don't drink at all every day.",
      ],
    }),
    build(
      "ja-m11-7-2-build-5",
      "Say: I don't sleep. (casual)",
      "ねない",
      ["ねません", "こない", "ねらない", "ねない"],
      ["ねない"],
    ),
    cloze(
      "ja-m11-7-2-cloze-1",
      "まいしゅう ぜんぜん ",
      "。",
      "いきません",
      ["いきません", "いきます", "いかない", "いきました"],
      "I don't go at all every week.",
      "まいしゅう ぜんぜん いきません。",
      "Time + degree + polite negative = full compound.",
    ),
    selfExplain({
      id: "ja-m11-7-2-self",
      anchorLabel: "あまり/ぜんぜん require negative — but いつも/よく/ときどき don't",
      anchorAudioText: "あまり たべません",
      question: "Why can いつも work with positive verbs but ぜんぜん can't?",
      rule: { text: "いつも/よく/ときどき are neutral frequency adverbs — they work with both positive and negative. あまり/ぜんぜん are negative-polarity items — they inherently express negation and require negative verb forms." },
      surface: { text: "All frequency adverbs work with both positive and negative — there is no restriction." },
      distractor: { text: "いつも is formally positive and ぜんぜん is formally negative — they are antonyms and can never appear in the same sentence." },
      ruleExplanation: "Neutral adverbs (いつも, よく, ときどき, たいてい) work with any polarity. Negative-polarity adverbs (あまり, ぜんぜん) require negative predicates.",
    }),
    speaking(
      "ja-m11-7-2-speak-4",
      "あまり わかりません",
      "I don't understand much.",
    ),
    // ── Review tail ──
    speaking("ja-m11-7-2-rev-speak-1", M11_7_2_REVIEW[0].kana, M11_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m11-7-2-rev-lc-1",
      audioText: M11_7_2_REVIEW[1].kana,
      correctMeaningEn: M11_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M11_7_2_REVIEW[2].meaningEn,
        M11_7_2_REVIEW[3].meaningEn,
        M11_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m11-7-2-rev-mcq-1", M11_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M11_REVIEW_POOL),
    speaking("ja-m11-7-2-rev-speak-2", M11_7_2_REVIEW[2].kana, M11_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m11-7-2-rev", M11_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m11-7-2-info-end",
      "You can negate any verb in any register and describe what you don't do",
      "Polite negative, casual negative, past negative, frequency adverbs, aspect markers — the full negation toolkit. You're ready for anything.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M11_7_2.steps);
assertAnswerRotation(M11_7_2.steps, 1);
assertNoConsecutiveSame(M11_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M11_1_1.steps,
  ...M11_1_2.steps,
  ...M11_2_1.steps,
  ...M11_2_2.steps,
  ...M11_3_1.steps,
  ...M11_3_2.steps,
  ...M11_4_1.steps,
  ...M11_4_2.steps,
  ...M11_5_1.steps,
  ...M11_5_2.steps,
  ...M11_6_1.steps,
  ...M11_6_2.steps,
  ...M11_7_1.steps,
  ...M11_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M11_1_1, M11_1_2, M11_2_1, M11_2_2, M11_3_1, M11_3_2,
  M11_4_1, M11_4_2, M11_5_1, M11_5_2, M11_6_1, M11_6_2,
  M11_STORY, M11_7_1, M11_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
