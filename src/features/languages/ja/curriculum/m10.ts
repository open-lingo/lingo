/**
 * M10 — Past tense (polite forms only).
 *
 * M10 introduces:
 *   - ました (polite past affirmative for verbs: たべました, のみました)
 *   - でした / じゃなかったです (was / wasn't — copula past)
 *   - い-adj past: たかかった / たかくなかった
 *   - な-adj past: きれいでした / きれいじゃなかったです
 *
 * IMPORTANT: NO た-form (plain past) here. Only polite past forms.
 * The plain past (た-form) shares formation rules with て-form and is
 * taught at M14 as a derivative. M10 sticks to regular polite conjugation
 * which has no sound changes.
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has ~20 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * ID scheme: ja-m10-{n}-{sub} e.g. ja-m10-1-1, ja-m10-1-2
 * Export names: M10_1_1, M10_1_2, M10_2_1, M10_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m10-1, etc.
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
// Per-sub-lesson review-atom draws. Pool is M3-M7 (same as M8/M9).
// ───────────────────────────────────────────────────────────────────────
const M10_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) =>
      a.fromModule === "m3" ||
      a.fromModule === "m4" ||
      a.fromModule === "m5" ||
      a.fromModule === "m6" ||
      a.fromModule === "m7",
  ),
);
const M10_REVIEW_M3_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
);
const M10_REVIEW_M4_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m4"),
);
const M10_REVIEW_M5_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m5"),
);
const M10_REVIEW_M6_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m6"),
);
const M10_REVIEW_M7_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m7"),
);

// ═══════════════════════════════════════════════════════════════════════
// M10-1-1 — "What did you do?" intro (ました form + きのう, おととい + 3 daily verbs)
// ═══════════════════════════════════════════════════════════════════════

const RULE_MASHITA = grammarRule({
  id: "ja-m10-1-1-rule-mashita",
  title: "ました — polite past tense for verbs",
  rule:
    "To say you DID something (past), swap ます → ました. That's it — no sound changes, no exceptions. たべます → たべました (ate). のみます → のみました (drank). ません → ませんでした for the negative past (didn't).",
  examples: [
    {
      ja: "きのう すしを たべました。",
      romaji: "kinō sushi o tabemashita.",
      en: "I ate sushi yesterday.",
    },
    {
      ja: "コーヒーを のみました。",
      romaji: "kōhī o nomimashita.",
      en: "I drank coffee.",
    },
    {
      ja: "えいがを みませんでした。",
      romaji: "eiga o mimasendeshita.",
      en: "I didn't watch the movie.",
    },
  ],
  antiPattern: {
    ja: "きのう すしを たべます。",
    romaji: "kinō sushi o tabemasu.",
    en: "(broken — present tense with a past-time word)",
    why: "きのう (yesterday) signals the past. You need ました, not ます. Present + past-time word is contradictory.",
  },
  cultureNote:
    "The polite past ました is perfectly regular — no sound changes at all. The tricky part (た-form / plain past) comes later at M14.",
});

const M10_1_1_REVIEW = pickReviewAtoms("ja-m10-1-1-rev", M10_REVIEW_M7_POOL, 4);

export const M10_1_1: LessonContent = {
  id: "ja-m10-1-1",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "What did you do? (intro)",
  description:
    "The polite past ました form, plus きのう (yesterday) and おととい (day before yesterday). Three daily verbs in past tense.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-1-1-info-open",
      "Past tense — the polite way",
      "Swap ます → ました and you can talk about anything you did. Three verbs, two time words, zero exceptions.",
    ),
    RULE_MASHITA,
    // ── きのう (yesterday) — build from tiles ──
    build(
      "ja-m10-1-1-build-kinou",
      "Pick the Japanese word for: Yesterday",
      "きのう",
      ["きのう", "きょう", "あした", "おととい"],
      ["きのう"],
    ),
    listeningCompSentence({
      id: "ja-m10-1-1-lc-kinou",
      audioText: "きのう",
      correctMeaningEn: "yesterday",
      distractorsEn: ["today", "tomorrow", "day before yesterday"],
    }),
    // ── おととい (day before yesterday) ──
    build(
      "ja-m10-1-1-build-ototoi",
      "Pick the Japanese word for: Day before yesterday",
      "おととい",
      ["おととい", "きのう", "きょう", "せんしゅう"],
      ["おととい"],
    ),
    // ── First ました sentence: たべました ──
    build(
      "ja-m10-1-1-build-tabemashita",
      "Say: I ate sushi yesterday.",
      "きのう すしを たべました",
      ["きのう", "すし", "を", "たべました", "のみました", "みました", "きょう"],
      ["きのう", "すし", "を", "たべました"],
    ),
    listeningCompSentence({
      id: "ja-m10-1-1-lc-tabemashita",
      audioText: "きのう すしを たべました",
      correctMeaningEn: "I ate sushi yesterday.",
      distractorsEn: [
        "I eat sushi today.",
        "I drank coffee yesterday.",
        "I will eat sushi tomorrow.",
      ],
    }),
    // ── のみました ──
    build(
      "ja-m10-1-1-build-nomimashita",
      "Say: I drank coffee.",
      "コーヒーを のみました",
      ["コーヒー", "を", "のみました", "たべました", "みました", "すし"],
      ["コーヒー", "を", "のみました"],
    ),
    sentenceMcq({
      id: "ja-m10-1-1-mcq-mashita",
      prompt: "Which sentence means 'I watched a movie yesterday'?",
      correctKana: "きのう えいがを みました。",
      distractorsKana: [
        "きのう えいがを みます。",
        "きのう すしを たべました。",
        "きのう コーヒーを のみました。",
      ],
      explanation: "みました = watched (past of みます). えいが = movie.",
    }),
    cloze(
      "ja-m10-1-1-cloze-wo",
      "きのう コーヒー",
      " のみました。",
      "を",
      ["を", "は", "が", "に"],
      "I drank coffee yesterday.",
      "きのう コーヒーを のみました。",
      "を marks the direct object — the thing you drank.",
    ),
    // ── みました ──
    build(
      "ja-m10-1-1-build-mimashita",
      "Say: I watched a movie the day before yesterday.",
      "おととい えいがを みました",
      ["おととい", "えいが", "を", "みました", "たべました", "きのう", "すし"],
      ["おととい", "えいが", "を", "みました"],
    ),
    cloze(
      "ja-m10-1-1-cloze-mashita",
      "おととい すしを たべ",
      "。",
      "ました",
      ["ました", "ます", "ません", "でした"],
      "I ate sushi the day before yesterday.",
      "おととい すしを たべました。",
      "Past tense of たべます → たべました. Just swap ます → ました.",
    ),
    listeningBuildSentence({
      id: "ja-m10-1-1-lb-nomi",
      target: "きのう コーヒーを のみました",
      tiles: ["きのう", "コーヒー", "を", "のみました", "たべました", "おととい"],
      correctOrder: ["きのう", "コーヒー", "を", "のみました"],
      promptEn: "Hear it, build it: 'I drank coffee yesterday.'",
    }),
    speaking(
      "ja-m10-1-1-speak-tabemashita",
      "きのう すしを たべました",
      "I ate sushi yesterday.",
    ),
    selfExplain({
      id: "ja-m10-1-1-self-mashita",
      anchorLabel: "You picked ました in: たべ＿",
      anchorAudioText: "たべました",
      question: "Why is ました the correct ending here?",
      rule: {
        text: "ました is the polite past — swap ます → ました to say you DID something.",
      },
      surface: {
        text: "ました sounds like the verb stem plus a past marker.",
      },
      distractor: {
        text: "ました is the present tense polite form of the verb.",
      },
      ruleExplanation:
        "ます = polite present, ました = polite past. The swap is mechanical — no sound changes.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-1-1-rev-mcq-1", M10_1_1_REVIEW[0], M10_REVIEW_M7_POOL),
    speaking("ja-m10-1-1-rev-speak-1", M10_1_1_REVIEW[1].kana, M10_1_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-1-1-rev-lc-1",
      audioText: M10_1_1_REVIEW[2].kana,
      correctMeaningEn: M10_1_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_1_1_REVIEW[3].meaningEn,
        M10_1_1_REVIEW[0].meaningEn,
        M10_REVIEW_M7_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-1-1-rev", M10_1_1_REVIEW),
    infoStep(
      "ja-m10-1-1-info-end",
      "You can now say what you did yesterday",
      "たべました, のみました, みました — the polite past is as simple as swapping ます → ました. きのう and おととい set the time.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_1_1.steps);
assertAnswerRotation(M10_1_1.steps, 2);
assertNoConsecutiveSame(M10_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-1-2 — "What did you do?" practice (ました drill, review tail)
// ═══════════════════════════════════════════════════════════════════════

const M10_1_2_REVIEW = pickReviewAtoms("ja-m10-1-2-rev", M10_REVIEW_M6_POOL, 4);

export const M10_1_2: LessonContent = {
  id: "ja-m10-1-2",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "What did you do? (practice)",
  description:
    "Drill the polite past ました with more verbs and sentence variations.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-1-2-info-open",
      "Past tense drill",
      "Mix and match verbs with ました. Can you say what you read, wrote, and went to yesterday?",
    ),
    // ── よみました (read — past) ──
    build(
      "ja-m10-1-2-build-yomimashita",
      "Say: I read a book yesterday.",
      "きのう ほんを よみました",
      ["きのう", "ほん", "を", "よみました", "かきました", "たべました", "きょう"],
      ["きのう", "ほん", "を", "よみました"],
    ),
    listeningCompSentence({
      id: "ja-m10-1-2-lc-yomimashita",
      audioText: "きのう ほんを よみました",
      correctMeaningEn: "I read a book yesterday.",
      distractorsEn: [
        "I wrote a book yesterday.",
        "I read a book today.",
        "I ate bread yesterday.",
      ],
    }),
    // ── かきました (wrote) ──
    build(
      "ja-m10-1-2-build-kakimashita",
      "Say: I wrote a letter.",
      "てがみを かきました",
      ["てがみ", "を", "かきました", "よみました", "ほん", "みました"],
      ["てがみ", "を", "かきました"],
    ),
    cloze(
      "ja-m10-1-2-cloze-wo-kaki",
      "てがみ",
      " かきました。",
      "を",
      ["を", "は", "が", "に"],
      "I wrote a letter.",
      "てがみを かきました。",
      "を marks the object — the letter you wrote.",
    ),
    // ── いきました (went) ──
    build(
      "ja-m10-1-2-build-ikimashita",
      "Say: I went to school yesterday.",
      "きのう がっこうに いきました",
      ["きのう", "がっこう", "に", "いきました", "を", "みました", "うち"],
      ["きのう", "がっこう", "に", "いきました"],
    ),
    cloze(
      "ja-m10-1-2-cloze-ni-iki",
      "きのう がっこう",
      " いきました。",
      "に",
      ["に", "を", "は", "で"],
      "I went to school yesterday.",
      "きのう がっこうに いきました。",
      "に marks the destination — where you went.",
    ),
    sentenceMcq({
      id: "ja-m10-1-2-mcq-mashita-drill",
      prompt: "Which sentence means 'I went to the park the day before yesterday'?",
      correctKana: "おととい こうえんに いきました。",
      distractorsKana: [
        "おととい こうえんに いきます。",
        "きのう がっこうに いきました。",
        "おととい ほんを よみました。",
      ],
      explanation: "いきました = went (past of いきます). こうえん = park. に = to (destination).",
    }),
    listeningBuildSentence({
      id: "ja-m10-1-2-lb-kakimashita",
      target: "きのう てがみを かきました",
      tiles: ["きのう", "てがみ", "を", "かきました", "よみました", "おととい"],
      correctOrder: ["きのう", "てがみ", "を", "かきました"],
      promptEn: "Hear it, build it: 'I wrote a letter yesterday.'",
    }),
    // ── Negative past: ませんでした ──
    build(
      "ja-m10-1-2-build-masendeshita",
      "Say: I didn't read the book.",
      "ほんを よみませんでした",
      ["ほん", "を", "よみませんでした", "よみました", "たべました", "てがみ"],
      ["ほん", "を", "よみませんでした"],
    ),
    listeningCompSentence({
      id: "ja-m10-1-2-lc-masendeshita",
      audioText: "えいがを みませんでした",
      correctMeaningEn: "I didn't watch the movie.",
      distractorsEn: [
        "I watched the movie.",
        "I don't watch movies.",
        "I didn't read the book.",
      ],
    }),
    cloze(
      "ja-m10-1-2-cloze-masen",
      "きのう えいがを み",
      "。",
      "ませんでした",
      ["ませんでした", "ました", "ます", "ません"],
      "I didn't watch the movie yesterday.",
      "きのう えいがを みませんでした。",
      "Negative past: ます → ませんでした (didn't do).",
    ),
    sentenceMcq({
      id: "ja-m10-1-2-mcq-neg-past",
      prompt: "Which sentence means 'I didn't drink juice'?",
      correctKana: "ジュースを のみませんでした。",
      distractorsKana: [
        "ジュースを のみました。",
        "ジュースを のみません。",
        "コーヒーを のみませんでした。",
      ],
      explanation: "のみませんでした = didn't drink (negative past). ジュース = juice.",
    }),
    speaking(
      "ja-m10-1-2-speak-ikimashita",
      "きのう がっこうに いきました",
      "I went to school yesterday.",
    ),
    selfExplain({
      id: "ja-m10-1-2-self-neg-past",
      anchorLabel: "You picked ませんでした in: みません＿",
      anchorAudioText: "みませんでした",
      question: "How is the negative past formed?",
      rule: {
        text: "ます → ませんでした — add でした to the negative stem ません.",
      },
      surface: {
        text: "ませんでした sounds like the negative plus past.",
      },
      distractor: {
        text: "ませんでした is the polite present negative form.",
      },
      ruleExplanation:
        "Positive past: ます → ました. Negative past: ません → ませんでした. Both are mechanical swaps.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-1-2-rev-mcq-1", M10_1_2_REVIEW[0], M10_REVIEW_M6_POOL),
    speaking("ja-m10-1-2-rev-speak-1", M10_1_2_REVIEW[1].kana, M10_1_2_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-1-2-rev-lc-1",
      audioText: M10_1_2_REVIEW[2].kana,
      correctMeaningEn: M10_1_2_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_1_2_REVIEW[3].meaningEn,
        M10_1_2_REVIEW[0].meaningEn,
        M10_REVIEW_M6_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-1-2-rev", M10_1_2_REVIEW),
    infoStep(
      "ja-m10-1-2-info-end",
      "You can now talk about what you did and didn't do",
      "ました for positive past, ませんでした for negative past. よみました, かきました, いきました — your past-tense verb toolkit is growing.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_1_2.steps);
assertAnswerRotation(M10_1_2.steps, 2);
assertNoConsecutiveSame(M10_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-2-1 — "Morning routine" intro (おきる, ねる, あるく + けさ, ゆうべ)
// ═══════════════════════════════════════════════════════════════════════

const M10_2_1_REVIEW = pickReviewAtoms("ja-m10-2-1-rev", M10_REVIEW_M5_POOL, 4);

export const M10_2_1: LessonContent = {
  id: "ja-m10-2-1",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "Morning routine (intro)",
  description:
    "New verbs: おきます (wake up), ねます (sleep), あるきます (walk). Time words: けさ (this morning), ゆうべ (last night).",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-2-1-info-open",
      "Morning routines in the past",
      "Three daily verbs + two time words. By the end you'll describe what you did this morning and last night.",
    ),
    // ── けさ (this morning) ──
    build(
      "ja-m10-2-1-build-kesa",
      "Pick the Japanese word for: This morning",
      "けさ",
      ["けさ", "ゆうべ", "きのう", "あした"],
      ["けさ"],
    ),
    listeningCompSentence({
      id: "ja-m10-2-1-lc-kesa",
      audioText: "けさ",
      correctMeaningEn: "this morning",
      distractorsEn: ["last night", "yesterday", "tomorrow"],
    }),
    // ── ゆうべ (last night) ──
    build(
      "ja-m10-2-1-build-yuube",
      "Pick the Japanese word for: Last night",
      "ゆうべ",
      ["ゆうべ", "けさ", "きのう", "おととい"],
      ["ゆうべ"],
    ),
    // ── おきます → おきました (woke up) ──
    build(
      "ja-m10-2-1-build-okimashita",
      "Say: I woke up this morning.",
      "けさ おきました",
      ["けさ", "おきました", "ねました", "ゆうべ", "あるきました"],
      ["けさ", "おきました"],
    ),
    listeningCompSentence({
      id: "ja-m10-2-1-lc-okimashita",
      audioText: "けさ おきました",
      correctMeaningEn: "I woke up this morning.",
      distractorsEn: [
        "I slept this morning.",
        "I woke up last night.",
        "I walked this morning.",
      ],
    }),
    vocabMcq(
      "ja-m10-2-1-mcq-kesa",
      { kana: "けさ", meaningEn: "this morning", emoji: "🌅", fromModule: "m10" },
      M10_REVIEW_M5_POOL,
    ),
    // ── ねます → ねました (slept) ──
    build(
      "ja-m10-2-1-build-nemashita",
      "Say: I slept last night.",
      "ゆうべ ねました",
      ["ゆうべ", "ねました", "おきました", "けさ", "あるきました"],
      ["ゆうべ", "ねました"],
    ),
    cloze(
      "ja-m10-2-1-cloze-yuube",
      "",
      " ねました。",
      "ゆうべ",
      ["ゆうべ", "けさ", "きのう", "あした"],
      "I slept last night.",
      "ゆうべ ねました。",
      "ゆうべ = last night. It goes at the start to set the time frame.",
    ),
    // ── あるきます → あるきました (walked) ──
    build(
      "ja-m10-2-1-build-arukimashita",
      "Say: I walked this morning.",
      "けさ あるきました",
      ["けさ", "あるきました", "おきました", "ねました", "ゆうべ"],
      ["けさ", "あるきました"],
    ),
    sentenceMcq({
      id: "ja-m10-2-1-mcq-routine",
      prompt: "Which sentence means 'I slept last night'?",
      correctKana: "ゆうべ ねました。",
      distractorsKana: [
        "けさ ねました。",
        "ゆうべ おきました。",
        "きのう あるきました。",
      ],
      explanation: "ゆうべ = last night. ねました = slept (past of ねます).",
    }),
    cloze(
      "ja-m10-2-1-cloze-mashita-oki",
      "けさ おき",
      "。",
      "ました",
      ["ました", "ます", "ません", "ませんでした"],
      "I woke up this morning.",
      "けさ おきました。",
      "Past tense: おきます → おきました.",
    ),
    listeningBuildSentence({
      id: "ja-m10-2-1-lb-aruki",
      target: "けさ あるきました",
      tiles: ["けさ", "あるきました", "ゆうべ", "ねました", "おきました"],
      correctOrder: ["けさ", "あるきました"],
      promptEn: "Hear it, build it: 'I walked this morning.'",
    }),
    speaking(
      "ja-m10-2-1-speak-nemashita",
      "ゆうべ ねました",
      "I slept last night.",
    ),
    selfExplain({
      id: "ja-m10-2-1-self-time",
      anchorLabel: "You picked けさ in: ＿ おきました。",
      anchorAudioText: "けさ おきました",
      question: "Why does the time word come at the start of the sentence?",
      rule: {
        text: "Japanese time words go at the beginning to set the frame for the whole sentence.",
      },
      surface: {
        text: "けさ must be at the start because it modifies おきました.",
      },
      distractor: {
        text: "Time words always come right before the verb in Japanese.",
      },
      ruleExplanation:
        "Time words like けさ, ゆうべ, きのう typically open the sentence — they set the temporal frame before the event.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-2-1-rev-mcq-1", M10_2_1_REVIEW[0], M10_REVIEW_M5_POOL),
    speaking("ja-m10-2-1-rev-speak-1", M10_2_1_REVIEW[1].kana, M10_2_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-2-1-rev-lc-1",
      audioText: M10_2_1_REVIEW[2].kana,
      correctMeaningEn: M10_2_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_2_1_REVIEW[3].meaningEn,
        M10_2_1_REVIEW[0].meaningEn,
        M10_REVIEW_M5_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-2-1-rev", M10_2_1_REVIEW),
    infoStep(
      "ja-m10-2-1-info-end",
      "You can now describe your morning and night routine",
      "おきました, ねました, あるきました — morning and night activities using けさ and ゆうべ.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_2_1.steps);
assertAnswerRotation(M10_2_1.steps, 2);
assertNoConsecutiveSame(M10_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-2-2 — "Morning routine" practice (ました with time words)
// ═══════════════════════════════════════════════════════════════════════

const M10_2_2_REVIEW = pickReviewAtoms("ja-m10-2-2-rev", M10_REVIEW_M4_POOL, 4);

export const M10_2_2: LessonContent = {
  id: "ja-m10-2-2",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "Morning routine (practice)",
  description:
    "More drill with daily verbs in past tense: はしりました (ran), およぎました (swam), あそびました (played).",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-2-2-info-open",
      "More daily verbs in the past",
      "Three more things you might have done: ran, swam, played. Same ました pattern — still no exceptions.",
    ),
    // ── はしりました (ran) ──
    build(
      "ja-m10-2-2-build-hashirimashita",
      "Say: I ran this morning.",
      "けさ はしりました",
      ["けさ", "はしりました", "あるきました", "おきました", "ゆうべ"],
      ["けさ", "はしりました"],
    ),
    listeningCompSentence({
      id: "ja-m10-2-2-lc-hashiri",
      audioText: "けさ はしりました",
      correctMeaningEn: "I ran this morning.",
      distractorsEn: [
        "I walked this morning.",
        "I ran last night.",
        "I swam this morning.",
      ],
    }),
    // ── およぎました (swam) ──
    build(
      "ja-m10-2-2-build-oyogimashita",
      "Say: I swam yesterday.",
      "きのう およぎました",
      ["きのう", "およぎました", "はしりました", "あるきました", "けさ"],
      ["きのう", "およぎました"],
    ),
    cloze(
      "ja-m10-2-2-cloze-kinou-oyogi",
      "",
      " およぎました。",
      "きのう",
      ["きのう", "けさ", "ゆうべ", "あした"],
      "I swam yesterday.",
      "きのう およぎました。",
      "きのう = yesterday. Sets the past time frame.",
    ),
    // ── あそびました (played) ──
    build(
      "ja-m10-2-2-build-asobimashita",
      "Say: I played last night.",
      "ゆうべ あそびました",
      ["ゆうべ", "あそびました", "およぎました", "はしりました", "けさ"],
      ["ゆうべ", "あそびました"],
    ),
    sentenceMcq({
      id: "ja-m10-2-2-mcq-asobi",
      prompt: "Which sentence means 'I played last night'?",
      correctKana: "ゆうべ あそびました。",
      distractorsKana: [
        "けさ あそびました。",
        "ゆうべ はしりました。",
        "きのう およぎました。",
      ],
      explanation: "ゆうべ = last night. あそびました = played (past of あそびます).",
    }),
    cloze(
      "ja-m10-2-2-cloze-mashita-hashiri",
      "けさ はしり",
      "。",
      "ました",
      ["ました", "ます", "ません", "ませんでした"],
      "I ran this morning.",
      "けさ はしりました。",
      "Past tense: はしります → はしりました.",
    ),
    listeningBuildSentence({
      id: "ja-m10-2-2-lb-oyogi",
      target: "きのう およぎました",
      tiles: ["きのう", "およぎました", "はしりました", "あそびました", "ゆうべ"],
      correctOrder: ["きのう", "およぎました"],
      promptEn: "Hear it, build it: 'I swam yesterday.'",
    }),
    // ── Mixed drill across all daily verbs ──
    sentenceMcq({
      id: "ja-m10-2-2-mcq-mixed",
      prompt: "Which sentence means 'I didn't run yesterday'?",
      correctKana: "きのう はしりませんでした。",
      distractorsKana: [
        "きのう はしりました。",
        "けさ はしりませんでした。",
        "きのう あるきませんでした。",
      ],
      explanation: "はしりませんでした = didn't run (negative past of はしります).",
    }),
    listeningCompSentence({
      id: "ja-m10-2-2-lc-asobi",
      audioText: "ゆうべ あそびました",
      correctMeaningEn: "I played last night.",
      distractorsEn: [
        "I played this morning.",
        "I swam last night.",
        "I slept last night.",
      ],
    }),
    build(
      "ja-m10-2-2-build-neg-oyogi",
      "Say: I didn't swim the day before yesterday.",
      "おととい およぎませんでした",
      ["おととい", "およぎませんでした", "およぎました", "きのう", "はしりませんでした"],
      ["おととい", "およぎませんでした"],
    ),
    speaking(
      "ja-m10-2-2-speak-hashiri",
      "けさ はしりました",
      "I ran this morning.",
    ),
    selfExplain({
      id: "ja-m10-2-2-self-mashita-pattern",
      anchorLabel: "You built: きのう およぎました。",
      anchorAudioText: "きのう およぎました",
      question: "What's the rule for making the polite past?",
      rule: {
        text: "Replace ます with ました — the stem stays the same, no sound changes.",
      },
      surface: {
        text: "およぎました ends in ました because it's a past action.",
      },
      distractor: {
        text: "The verb stem changes form before adding ました.",
      },
      ruleExplanation:
        "Polite past is mechanical: およぎます → およぎました. The stem (およぎ) never changes. Sound changes only happen with the plain past た-form (M14).",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-2-2-rev-mcq-1", M10_2_2_REVIEW[0], M10_REVIEW_M4_POOL),
    speaking("ja-m10-2-2-rev-speak-1", M10_2_2_REVIEW[1].kana, M10_2_2_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-2-2-rev-lc-1",
      audioText: M10_2_2_REVIEW[2].kana,
      correctMeaningEn: M10_2_2_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_2_2_REVIEW[3].meaningEn,
        M10_2_2_REVIEW[0].meaningEn,
        M10_REVIEW_M4_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-2-2-rev", M10_2_2_REVIEW),
    infoStep(
      "ja-m10-2-2-info-end",
      "You can now describe daily activities in the past",
      "はしりました, およぎました, あそびました — six past-tense verbs and counting. Time words slot right in at the start.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_2_2.steps);
assertAnswerRotation(M10_2_2.steps, 2);
assertNoConsecutiveSame(M10_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-3-1 — "It was..." intro (でした / じゃなかったです + past copula)
// ═══════════════════════════════════════════════════════════════════════

const RULE_DESHITA = grammarRule({
  id: "ja-m10-3-1-rule-deshita",
  title: "でした / じゃなかったです — past copula",
  rule:
    "です → でした (was). じゃないです → じゃなかったです (wasn't). Use these to say what something WAS or WASN'T. Same slot as です — sentence-final copula, just past tense.",
  examples: [
    {
      ja: "きのう やすみでした。",
      romaji: "kinō yasumi deshita.",
      en: "Yesterday was a day off.",
    },
    {
      ja: "がくせいでした。",
      romaji: "gakusei deshita.",
      en: "I was a student.",
    },
    {
      ja: "せんせいじゃなかったです。",
      romaji: "sensei ja nakatta desu.",
      en: "I wasn't a teacher.",
    },
  ],
  antiPattern: {
    ja: "きのう やすみです。",
    romaji: "kinō yasumi desu.",
    en: "(broken — present copula with past-time word)",
    why: "きのう signals the past. です should become でした. Present + past-time word contradicts.",
  },
  cultureNote:
    "じゃなかったです is slightly informal but standard in polite speech. The ultra-formal version is ではありませんでした — you'll encounter it in formal writing.",
});

const M10_3_1_REVIEW = pickReviewAtoms("ja-m10-3-1-rev", M10_REVIEW_M3_POOL, 4);

export const M10_3_1: LessonContent = {
  id: "ja-m10-3-1",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "It was... (intro)",
  description:
    "Past copula: でした (was) and じゃなかったです (wasn't). Say what things were and weren't.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-3-1-info-open",
      "What was it?",
      "です → でした. That's how you say something WAS. And じゃなかったです for what it WASN'T.",
    ),
    RULE_DESHITA,
    // ── でした (was) ──
    build(
      "ja-m10-3-1-build-gakusei-deshita",
      "Say: I was a student.",
      "がくせいでした",
      ["がくせい", "でした", "です", "せんせい", "じゃなかったです"],
      ["がくせい", "でした"],
    ),
    listeningCompSentence({
      id: "ja-m10-3-1-lc-gakusei-deshita",
      audioText: "がくせいでした",
      correctMeaningEn: "I was a student.",
      distractorsEn: [
        "I am a student.",
        "I wasn't a student.",
        "I was a teacher.",
      ],
    }),
    build(
      "ja-m10-3-1-build-sensei-deshita",
      "Say: He was a teacher.",
      "せんせいでした",
      ["せんせい", "でした", "がくせい", "です", "じゃなかったです"],
      ["せんせい", "でした"],
    ),
    cloze(
      "ja-m10-3-1-cloze-deshita",
      "きのう やすみ",
      "。",
      "でした",
      ["でした", "です", "ました", "じゃなかったです"],
      "Yesterday was a day off.",
      "きのう やすみでした。",
      "Past copula: です → でした.",
    ),
    // ── じゃなかったです (wasn't) ──
    build(
      "ja-m10-3-1-build-janakatta",
      "Say: I wasn't a teacher.",
      "せんせいじゃなかったです",
      ["せんせい", "じゃなかったです", "でした", "がくせい", "です"],
      ["せんせい", "じゃなかったです"],
    ),
    listeningCompSentence({
      id: "ja-m10-3-1-lc-janakatta",
      audioText: "せんせいじゃなかったです",
      correctMeaningEn: "I wasn't a teacher.",
      distractorsEn: [
        "I was a teacher.",
        "I'm not a teacher.",
        "I wasn't a student.",
      ],
    }),
    sentenceMcq({
      id: "ja-m10-3-1-mcq-deshita-vs-janakatta",
      prompt: "Which sentence means 'I wasn't a student'?",
      correctKana: "がくせいじゃなかったです。",
      distractorsKana: [
        "がくせいでした。",
        "がくせいじゃないです。",
        "せんせいじゃなかったです。",
      ],
      explanation: "じゃなかったです = wasn't. がくせい = student.",
    }),
    cloze(
      "ja-m10-3-1-cloze-janakatta",
      "がくせい",
      "。",
      "じゃなかったです",
      ["じゃなかったです", "でした", "です", "じゃないです"],
      "I wasn't a student.",
      "がくせいじゃなかったです。",
      "Negative past copula: じゃないです → じゃなかったです.",
    ),
    build(
      "ja-m10-3-1-build-yasumi-deshita",
      "Say: Yesterday was a day off.",
      "きのう やすみでした",
      ["きのう", "やすみ", "でした", "じゃなかったです", "おととい", "です"],
      ["きのう", "やすみ", "でした"],
    ),
    listeningBuildSentence({
      id: "ja-m10-3-1-lb-janakatta",
      target: "せんせいじゃなかったです",
      tiles: ["せんせい", "じゃなかったです", "でした", "がくせい", "です"],
      correctOrder: ["せんせい", "じゃなかったです"],
      promptEn: "Hear it, build it: 'I wasn't a teacher.'",
    }),
    speaking(
      "ja-m10-3-1-speak-deshita",
      "がくせいでした",
      "I was a student.",
    ),
    selfExplain({
      id: "ja-m10-3-1-self-copula-past",
      anchorLabel: "You picked でした in: がくせい＿",
      anchorAudioText: "がくせいでした",
      question: "What's the difference between です and でした?",
      rule: {
        text: "です = is (present). でした = was (past). Same copula slot, different tense.",
      },
      surface: {
        text: "でした has an extra し sound after で.",
      },
      distractor: {
        text: "でした is the polite form of です — both mean 'is.'",
      },
      ruleExplanation:
        "です marks present identity (X is Y). でした marks past identity (X was Y). The shift is purely tense, not politeness.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-3-1-rev-mcq-1", M10_3_1_REVIEW[0], M10_REVIEW_M3_POOL),
    speaking("ja-m10-3-1-rev-speak-1", M10_3_1_REVIEW[1].kana, M10_3_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-3-1-rev-lc-1",
      audioText: M10_3_1_REVIEW[2].kana,
      correctMeaningEn: M10_3_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_3_1_REVIEW[3].meaningEn,
        M10_3_1_REVIEW[0].meaningEn,
        M10_REVIEW_M3_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-3-1-rev", M10_3_1_REVIEW),
    infoStep(
      "ja-m10-3-1-info-end",
      "You can now say what things were and weren't",
      "でした (was) and じゃなかったです (wasn't) — the past copula is unlocked.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_3_1.steps);
assertAnswerRotation(M10_3_1.steps, 2);
assertNoConsecutiveSame(M10_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-3-2 — "It was..." practice (です past + adj past copula)
// ═══════════════════════════════════════════════════════════════════════

const M10_3_2_REVIEW = pickReviewAtoms("ja-m10-3-2-rev", M10_REVIEW_M7_POOL, 4);

export const M10_3_2: LessonContent = {
  id: "ja-m10-3-2",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "It was... (practice)",
  description:
    "More drill with でした / じゃなかったです in varied sentence contexts.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-3-2-info-open",
      "Past copula drill",
      "Was it a day off? Was she a student? Drill でした and じゃなかったです in different scenarios.",
    ),
    // ── Mixed でした/じゃなかったです drill ──
    build(
      "ja-m10-3-2-build-tomodachi-deshita",
      "Say: She was a friend.",
      "ともだちでした",
      ["ともだち", "でした", "じゃなかったです", "がくせい", "です"],
      ["ともだち", "でした"],
    ),
    cloze(
      "ja-m10-3-2-cloze-deshita-tomodachi",
      "ともだち",
      "。",
      "でした",
      ["でした", "です", "じゃなかったです", "ました"],
      "She was a friend.",
      "ともだちでした。",
      "Past copula: です → でした.",
    ),
    listeningCompSentence({
      id: "ja-m10-3-2-lc-tomodachi",
      audioText: "ともだちでした",
      correctMeaningEn: "She was a friend.",
      distractorsEn: [
        "She is a friend.",
        "She wasn't a friend.",
        "He was a teacher.",
      ],
    }),
    build(
      "ja-m10-3-2-build-janakatta-gakusei",
      "Say: He wasn't a student.",
      "がくせいじゃなかったです",
      ["がくせい", "じゃなかったです", "でした", "せんせい", "ともだち"],
      ["がくせい", "じゃなかったです"],
    ),
    sentenceMcq({
      id: "ja-m10-3-2-mcq-was-wasnt",
      prompt: "Which sentence means 'She was a teacher'?",
      correctKana: "せんせいでした。",
      distractorsKana: [
        "せんせいじゃなかったです。",
        "がくせいでした。",
        "せんせいです。",
      ],
      explanation: "でした = was. せんせい = teacher.",
    }),
    cloze(
      "ja-m10-3-2-cloze-janakatta-tomodachi",
      "ともだち",
      "。",
      "じゃなかったです",
      ["じゃなかったです", "でした", "じゃないです", "です"],
      "She wasn't a friend.",
      "ともだちじゃなかったです。",
      "Negative past: じゃないです → じゃなかったです.",
    ),
    // ── Time expressions + copula ──
    build(
      "ja-m10-3-2-build-kinou-yasumi",
      "Say: Yesterday wasn't a day off.",
      "きのう やすみじゃなかったです",
      ["きのう", "やすみ", "じゃなかったです", "でした", "おととい", "です"],
      ["きのう", "やすみ", "じゃなかったです"],
    ),
    listeningCompSentence({
      id: "ja-m10-3-2-lc-yasumi-janakatta",
      audioText: "きのう やすみじゃなかったです",
      correctMeaningEn: "Yesterday wasn't a day off.",
      distractorsEn: [
        "Yesterday was a day off.",
        "Today isn't a day off.",
        "The day before yesterday was a day off.",
      ],
    }),
    sentenceMcq({
      id: "ja-m10-3-2-mcq-neg-past-copula",
      prompt: "Which sentence means 'The day before yesterday was a day off'?",
      correctKana: "おととい やすみでした。",
      distractorsKana: [
        "おととい やすみじゃなかったです。",
        "きのう やすみでした。",
        "おととい やすみです。",
      ],
      explanation: "おととい = day before yesterday. でした = was.",
    }),
    listeningBuildSentence({
      id: "ja-m10-3-2-lb-janakatta",
      target: "きのう やすみじゃなかったです",
      tiles: ["きのう", "やすみ", "じゃなかったです", "でした", "おととい"],
      correctOrder: ["きのう", "やすみ", "じゃなかったです"],
      promptEn: "Hear it, build it: 'Yesterday wasn't a day off.'",
    }),
    build(
      "ja-m10-3-2-build-ototoi-deshita",
      "Say: The day before yesterday was a day off.",
      "おととい やすみでした",
      ["おととい", "やすみ", "でした", "じゃなかったです", "きのう"],
      ["おととい", "やすみ", "でした"],
    ),
    cloze(
      "ja-m10-3-2-cloze-wa-topic",
      "きのう",
      " やすみでした。",
      "は",
      ["は", "が", "を", "に"],
      "Yesterday was a day off.",
      "きのうは やすみでした。",
      "は marks きのう as the topic — 'As for yesterday, it was a day off.'",
    ),
    speaking(
      "ja-m10-3-2-speak-janakatta",
      "せんせいじゃなかったです",
      "I wasn't a teacher.",
    ),
    selfExplain({
      id: "ja-m10-3-2-self-janakatta",
      anchorLabel: "You picked じゃなかったです in: がくせい＿。",
      anchorAudioText: "がくせいじゃなかったです",
      question: "How is じゃなかったです formed?",
      rule: {
        text: "じゃないです → replace ない with なかった → じゃなかったです.",
      },
      surface: {
        text: "じゃなかったです is the opposite of でした.",
      },
      distractor: {
        text: "じゃなかったです is formed by adding た to じゃないです.",
      },
      ruleExplanation:
        "The negative copula じゃないです has its ない part conjugated to past: ない → なかった, giving じゃなかったです.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-3-2-rev-mcq-1", M10_3_2_REVIEW[0], M10_REVIEW_M7_POOL),
    speaking("ja-m10-3-2-rev-speak-1", M10_3_2_REVIEW[1].kana, M10_3_2_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-3-2-rev-lc-1",
      audioText: M10_3_2_REVIEW[2].kana,
      correctMeaningEn: M10_3_2_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_3_2_REVIEW[3].meaningEn,
        M10_3_2_REVIEW[0].meaningEn,
        M10_REVIEW_M7_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-3-2-rev", M10_3_2_REVIEW),
    infoStep(
      "ja-m10-3-2-info-end",
      "You can now describe what things were and weren't in varied contexts",
      "でした and じゃなかったです — past and negative past copula in time-framed sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_3_2.steps);
assertAnswerRotation(M10_3_2.steps, 2);
assertNoConsecutiveSame(M10_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-4-1 — "It was expensive" intro (i-adj past: たかかった / たかくなかった)
// ═══════════════════════════════════════════════════════════════════════

const RULE_I_ADJ_PAST = grammarRule({
  id: "ja-m10-4-1-rule-i-adj-past",
  title: "い-adjective past tense",
  rule:
    "Drop the final い, add かった (was) or くなかった (wasn't). たかい → たかかった (was expensive) / たかくなかった (wasn't expensive). Add です at the end to keep it polite: たかかったです / たかくなかったです. EXCEPTION: いい → よかった (not いかった) — the same よ- root as the negative いい → よくない.",
  examples: [
    {
      ja: "たかかったです。",
      romaji: "takakatta desu.",
      en: "It was expensive.",
    },
    {
      ja: "おいしくなかったです。",
      romaji: "oishikunakatta desu.",
      en: "It wasn't delicious.",
    },
    {
      ja: "よかったです。",
      romaji: "yokatta desu.",
      en: "It was good.",
    },
  ],
  antiPattern: {
    ja: "いかったです。",
    romaji: "ikatta desu.",
    en: "(broken — いい doesn't conjugate as いかった)",
    why: "いい has an irregular root よ-. The past form is よかった, not いかった. Same irregularity as the negative よくない.",
  },
  cultureNote:
    "よかった！ is one of the most common Japanese exclamations — 'That's great!' / 'I'm glad!' You'll hear it constantly.",
});

const M10_4_1_REVIEW = pickReviewAtoms("ja-m10-4-1-rev", M10_REVIEW_M6_POOL, 4);

export const M10_4_1: LessonContent = {
  id: "ja-m10-4-1",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "It was expensive (intro)",
  description:
    "い-adjective past tense: たかかった (was expensive), おいしかった (was delicious), よかった (was good — irregular).",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-4-1-info-open",
      "Adjectives go past tense too",
      "Drop い, add かった. One exception: いい → よかった. Two patterns, and you're describing everything in the past.",
    ),
    RULE_I_ADJ_PAST,
    // ── たかかったです (was expensive) ──
    build(
      "ja-m10-4-1-build-takakatta",
      "Say: It was expensive.",
      "たかかったです",
      ["たかかった", "です", "たかい", "たかくなかった", "でした"],
      ["たかかった", "です"],
    ),
    listeningCompSentence({
      id: "ja-m10-4-1-lc-takakatta",
      audioText: "たかかったです",
      correctMeaningEn: "It was expensive.",
      distractorsEn: [
        "It is expensive.",
        "It wasn't expensive.",
        "It was cheap.",
      ],
    }),
    // ── おいしかったです (was delicious) ──
    build(
      "ja-m10-4-1-build-oishikatta",
      "Say: It was delicious.",
      "おいしかったです",
      ["おいしかった", "です", "おいしい", "おいしくなかった", "たかかった"],
      ["おいしかった", "です"],
    ),
    cloze(
      "ja-m10-4-1-cloze-oishikatta",
      "すしは おいし",
      "です。",
      "かった",
      ["かった", "い", "くない", "くなかった"],
      "The sushi was delicious.",
      "すしは おいしかったです。",
      "い-adj past: drop い, add かった. おいしい → おいしかった.",
    ),
    sentenceMcq({
      id: "ja-m10-4-1-mcq-i-adj-past",
      prompt: "Which sentence means 'It wasn't expensive'?",
      correctKana: "たかくなかったです。",
      distractorsKana: [
        "たかかったです。",
        "たかくないです。",
        "たかいです。",
      ],
      explanation: "たかくなかった = wasn't expensive (negative past). Drop い, add くなかった.",
    }),
    // ── たかくなかったです (wasn't expensive) ──
    build(
      "ja-m10-4-1-build-takakunakatta",
      "Say: It wasn't expensive.",
      "たかくなかったです",
      ["たかくなかった", "です", "たかかった", "たかい", "たかくない"],
      ["たかくなかった", "です"],
    ),
    listeningCompSentence({
      id: "ja-m10-4-1-lc-takakunakatta",
      audioText: "たかくなかったです",
      correctMeaningEn: "It wasn't expensive.",
      distractorsEn: [
        "It was expensive.",
        "It isn't expensive.",
        "It wasn't delicious.",
      ],
    }),
    // ── よかったです (was good — irregular) ──
    build(
      "ja-m10-4-1-build-yokatta",
      "Say: It was good.",
      "よかったです",
      ["よかった", "です", "いかった", "いい", "よくなかった"],
      ["よかった", "です"],
    ),
    cloze(
      "ja-m10-4-1-cloze-yokatta",
      "えいがは ",
      "です。",
      "よかった",
      ["よかった", "いかった", "いい", "よくない"],
      "The movie was good.",
      "えいがは よかったです。",
      "いい → よかった (irregular). NOT いかった — the root changes to よ.",
    ),
    listeningBuildSentence({
      id: "ja-m10-4-1-lb-takakatta",
      target: "たかかったです",
      tiles: ["たかかった", "です", "たかくなかった", "おいしかった", "よかった"],
      correctOrder: ["たかかった", "です"],
      promptEn: "Hear it, build it: 'It was expensive.'",
    }),
    sentenceMcq({
      id: "ja-m10-4-1-mcq-yokatta",
      prompt: "Which sentence means 'The movie was good'?",
      correctKana: "えいがは よかったです。",
      distractorsKana: [
        "えいがは いかったです。",
        "えいがは よくなかったです。",
        "えいがは いいです。",
      ],
      explanation: "いい is irregular: past = よかった, not いかった.",
    }),
    speaking(
      "ja-m10-4-1-speak-yokatta",
      "よかったです",
      "It was good.",
    ),
    selfExplain({
      id: "ja-m10-4-1-self-yokatta",
      anchorLabel: "You picked よかった in: えいがは ＿です。",
      anchorAudioText: "えいがは よかったです",
      question: "Why is the past of いい written as よかった, not いかった?",
      rule: {
        text: "いい has an irregular root よ- that appears in all conjugated forms (よくない, よかった).",
      },
      surface: {
        text: "よかった sounds more natural than いかった.",
      },
      distractor: {
        text: "いい drops its final い and adds a よ prefix before かった.",
      },
      ruleExplanation:
        "いい is historically from よい. All conjugated forms use the よ- root: negative よくない, past よかった. Only the dictionary form stays いい.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-4-1-rev-mcq-1", M10_4_1_REVIEW[0], M10_REVIEW_M6_POOL),
    speaking("ja-m10-4-1-rev-speak-1", M10_4_1_REVIEW[1].kana, M10_4_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-4-1-rev-lc-1",
      audioText: M10_4_1_REVIEW[2].kana,
      correctMeaningEn: M10_4_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_4_1_REVIEW[3].meaningEn,
        M10_4_1_REVIEW[0].meaningEn,
        M10_REVIEW_M6_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-4-1-rev", M10_4_1_REVIEW),
    infoStep(
      "ja-m10-4-1-info-end",
      "You can now describe things in the past with adjectives",
      "たかかった, おいしかった, よかった — い-adjective past is drop-い + かった. The いい → よかった exception is locked in.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_4_1.steps);
assertAnswerRotation(M10_4_1.steps, 2);
assertNoConsecutiveSame(M10_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-4-2 — "It was expensive" practice (i-adj past drill + review)
// ═══════════════════════════════════════════════════════════════════════

const M10_4_2_REVIEW = pickReviewAtoms("ja-m10-4-2-rev", M10_REVIEW_M5_POOL, 4);

export const M10_4_2: LessonContent = {
  id: "ja-m10-4-2",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "It was expensive (practice)",
  description:
    "Drill い-adjective past forms: positive and negative, plus the いい exception.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-4-2-info-open",
      "い-adjective past drill",
      "Mix positive and negative past: かった and くなかった. Watch out for よかった.",
    ),
    // ── おおきかったです (was big) ──
    build(
      "ja-m10-4-2-build-ookikatta",
      "Say: The room was big.",
      "へやは おおきかったです",
      ["へや", "は", "おおきかった", "です", "おおきい", "ちいさかった"],
      ["へや", "は", "おおきかった", "です"],
    ),
    listeningCompSentence({
      id: "ja-m10-4-2-lc-ookikatta",
      audioText: "へやは おおきかったです",
      correctMeaningEn: "The room was big.",
      distractorsEn: [
        "The room is big.",
        "The room was small.",
        "The room wasn't big.",
      ],
    }),
    // ── ちいさくなかったです (wasn't small) ──
    cloze(
      "ja-m10-4-2-cloze-chiisaku",
      "へやは ちいさ",
      "です。",
      "くなかった",
      ["くなかった", "かった", "い", "くない"],
      "The room wasn't small.",
      "へやは ちいさくなかったです。",
      "Negative past: drop い, add くなかった.",
    ),
    build(
      "ja-m10-4-2-build-chiisaku",
      "Say: The room wasn't small.",
      "へやは ちいさくなかったです",
      ["へや", "は", "ちいさくなかった", "です", "ちいさかった", "おおきかった"],
      ["へや", "は", "ちいさくなかった", "です"],
    ),
    // ── あつかったです (was hot) ──
    build(
      "ja-m10-4-2-build-atsukatta",
      "Say: Yesterday was hot.",
      "きのうは あつかったです",
      ["きのう", "は", "あつかった", "です", "さむかった", "あつい"],
      ["きのう", "は", "あつかった", "です"],
    ),
    sentenceMcq({
      id: "ja-m10-4-2-mcq-atsui-samui",
      prompt: "Which sentence means 'Yesterday was cold'?",
      correctKana: "きのうは さむかったです。",
      distractorsKana: [
        "きのうは あつかったです。",
        "きのうは さむいです。",
        "きのうは さむくなかったです。",
      ],
      explanation: "さむい → さむかった (was cold). Drop い, add かった.",
    }),
    cloze(
      "ja-m10-4-2-cloze-samuku",
      "きのうは さむ",
      "です。",
      "くなかった",
      ["くなかった", "かった", "い", "くない"],
      "Yesterday wasn't cold.",
      "きのうは さむくなかったです。",
      "Negative past: さむい → さむくなかった.",
    ),
    // ── よくなかったです (wasn't good — irregular neg past) ──
    build(
      "ja-m10-4-2-build-yokunakatta",
      "Say: The movie wasn't good.",
      "えいがは よくなかったです",
      ["えいが", "は", "よくなかった", "です", "よかった", "いくなかった"],
      ["えいが", "は", "よくなかった", "です"],
    ),
    listeningCompSentence({
      id: "ja-m10-4-2-lc-yokunakatta",
      audioText: "えいがは よくなかったです",
      correctMeaningEn: "The movie wasn't good.",
      distractorsEn: [
        "The movie was good.",
        "The movie isn't good.",
        "The movie wasn't big.",
      ],
    }),
    sentenceMcq({
      id: "ja-m10-4-2-mcq-yokunakatta",
      prompt: "Which is the correct negative past of いい?",
      correctKana: "よくなかったです。",
      distractorsKana: [
        "いくなかったです。",
        "よくないです。",
        "いかったです。",
      ],
      explanation: "いい → root よ-: negative past よくなかった. Never いくなかった.",
    }),
    listeningBuildSentence({
      id: "ja-m10-4-2-lb-yokatta",
      target: "よかったです",
      tiles: ["よかった", "です", "いかった", "よくなかった", "いい"],
      correctOrder: ["よかった", "です"],
      promptEn: "Hear it, build it: 'It was good.'",
    }),
    build(
      "ja-m10-4-2-build-oishikatta-sushi",
      "Say: The sushi was delicious.",
      "すしは おいしかったです",
      ["すし", "は", "おいしかった", "です", "たかかった", "おいしくなかった"],
      ["すし", "は", "おいしかった", "です"],
    ),
    speaking(
      "ja-m10-4-2-speak-takakatta",
      "たかかったです",
      "It was expensive.",
    ),
    selfExplain({
      id: "ja-m10-4-2-self-i-adj-rule",
      anchorLabel: "You built: きのうは さむくなかったです。",
      anchorAudioText: "きのうは さむくなかったです",
      question: "What's the rule for negative past い-adjectives?",
      rule: {
        text: "Drop い, add くなかった — then add です for politeness.",
      },
      surface: {
        text: "くなかった comes from combining くない (negative) with the past.",
      },
      distractor: {
        text: "Add ませんでした to the adjective stem for negative past.",
      },
      ruleExplanation:
        "い-adjectives conjugate on their own: positive past (かった), negative past (くなかった). They never use ませんでした — that's for verbs.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-4-2-rev-mcq-1", M10_4_2_REVIEW[0], M10_REVIEW_M5_POOL),
    speaking("ja-m10-4-2-rev-speak-1", M10_4_2_REVIEW[1].kana, M10_4_2_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-4-2-rev-lc-1",
      audioText: M10_4_2_REVIEW[2].kana,
      correctMeaningEn: M10_4_2_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_4_2_REVIEW[3].meaningEn,
        M10_4_2_REVIEW[0].meaningEn,
        M10_REVIEW_M5_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-4-2-rev", M10_4_2_REVIEW),
    infoStep(
      "ja-m10-4-2-info-end",
      "You can now describe past qualities with い-adjectives",
      "かった (was), くなかった (wasn't), and the いい → よかった / よくなかった exception. い-adjectives never use ませんでした.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_4_2.steps);
assertAnswerRotation(M10_4_2.steps, 1);
assertNoConsecutiveSame(M10_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-5-1 — "It was pretty" intro (na-adj past: きれいでした / きれいじゃなかったです)
// ═══════════════════════════════════════════════════════════════════════

const RULE_NA_ADJ_PAST = grammarRule({
  id: "ja-m10-5-1-rule-na-adj-past",
  title: "な-adjective past tense",
  rule:
    "な-adjectives use the SAME past forms as nouns: stem + でした (was pretty) / stem + じゃなかったです (wasn't pretty). Because な-adjectives behave like nouns for conjugation, they never change their own form — only the copula after them changes. Contrast with い-adjectives which conjugate internally.",
  examples: [
    {
      ja: "きれいでした。",
      romaji: "kirei deshita.",
      en: "It was pretty.",
    },
    {
      ja: "しずかでした。",
      romaji: "shizuka deshita.",
      en: "It was quiet.",
    },
    {
      ja: "きれいじゃなかったです。",
      romaji: "kirei ja nakatta desu.",
      en: "It wasn't pretty.",
    },
  ],
  antiPattern: {
    ja: "きれいかったです。",
    romaji: "kirei katta desu.",
    en: "(broken — な-adjectives don't conjugate with かった)",
    why: "きれい is a な-adjective, not い-adjective. It uses でした (was) not かった. Only TRUE い-adjectives (たかい, おいしい) use かった.",
  },
  cultureNote:
    "The key tell: if the word ends in い but uses な before nouns (きれいな), it's a な-adjective and uses でした. If it ends in い and directly modifies nouns (たかいもの), it's an い-adjective and uses かった.",
});

const M10_5_1_REVIEW = pickReviewAtoms("ja-m10-5-1-rev", M10_REVIEW_M4_POOL, 4);

export const M10_5_1: LessonContent = {
  id: "ja-m10-5-1",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "It was pretty (intro)",
  description:
    "な-adjective past: きれいでした (was pretty), しずかでした (was quiet). Contrast with い-adjective past.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-5-1-info-open",
      "な-adjectives in the past",
      "きれい → きれいでした, NOT きれいかった. な-adjectives use the noun pattern: stem + でした.",
    ),
    RULE_NA_ADJ_PAST,
    // ── きれいでした (was pretty) ──
    build(
      "ja-m10-5-1-build-kirei-deshita",
      "Say: It was pretty.",
      "きれいでした",
      ["きれい", "でした", "かった", "です", "じゃなかったです"],
      ["きれい", "でした"],
    ),
    listeningCompSentence({
      id: "ja-m10-5-1-lc-kirei-deshita",
      audioText: "きれいでした",
      correctMeaningEn: "It was pretty.",
      distractorsEn: [
        "It is pretty.",
        "It wasn't pretty.",
        "It was quiet.",
      ],
    }),
    // ── しずかでした (was quiet) ──
    build(
      "ja-m10-5-1-build-shizuka-deshita",
      "Say: It was quiet.",
      "しずかでした",
      ["しずか", "でした", "です", "かった", "きれい"],
      ["しずか", "でした"],
    ),
    cloze(
      "ja-m10-5-1-cloze-deshita-shizuka",
      "こうえんは しずか",
      "。",
      "でした",
      ["でした", "かった", "です", "くなかった"],
      "The park was quiet.",
      "こうえんは しずかでした。",
      "な-adjective past = stem + でした. NOT かった — that's for い-adjectives.",
    ),
    sentenceMcq({
      id: "ja-m10-5-1-mcq-na-vs-i",
      prompt: "Which is the correct past form of きれい (pretty)?",
      correctKana: "きれいでした。",
      distractorsKana: [
        "きれいかったです。",
        "きれいじゃないです。",
        "きれいくなかったです。",
      ],
      explanation: "きれい is a な-adjective → past form uses でした, not かった.",
    }),
    // ── きれいじゃなかったです (wasn't pretty) ──
    build(
      "ja-m10-5-1-build-kirei-janakatta",
      "Say: It wasn't pretty.",
      "きれいじゃなかったです",
      ["きれい", "じゃなかったです", "でした", "かった", "くなかった"],
      ["きれい", "じゃなかったです"],
    ),
    listeningCompSentence({
      id: "ja-m10-5-1-lc-kirei-janakatta",
      audioText: "きれいじゃなかったです",
      correctMeaningEn: "It wasn't pretty.",
      distractorsEn: [
        "It was pretty.",
        "It isn't pretty.",
        "It wasn't quiet.",
      ],
    }),
    cloze(
      "ja-m10-5-1-cloze-janakatta-shizuka",
      "こうえんは しずか",
      "。",
      "じゃなかったです",
      ["じゃなかったです", "でした", "くなかった", "かった"],
      "The park wasn't quiet.",
      "こうえんは しずかじゃなかったです。",
      "な-adjective negative past = stem + じゃなかったです.",
    ),
    // ── Contrast: i-adj vs na-adj ──
    sentenceMcq({
      id: "ja-m10-5-1-mcq-contrast",
      prompt: "Which pair correctly shows 'was expensive' and 'was pretty'?",
      correctKana: "たかかったです / きれいでした",
      distractorsKana: [
        "たかでした / きれいかったです",
        "たかかったです / きれいかったです",
        "たかくなかったです / きれいじゃなかったです",
      ],
      explanation: "い-adj: たかい → たかかった. な-adj: きれい → きれいでした. Different patterns.",
    }),
    build(
      "ja-m10-5-1-build-shizuka-janakatta",
      "Say: It wasn't quiet.",
      "しずかじゃなかったです",
      ["しずか", "じゃなかったです", "でした", "くなかった", "きれい"],
      ["しずか", "じゃなかったです"],
    ),
    listeningBuildSentence({
      id: "ja-m10-5-1-lb-kirei",
      target: "きれいでした",
      tiles: ["きれい", "でした", "じゃなかったです", "しずか", "かった"],
      correctOrder: ["きれい", "でした"],
      promptEn: "Hear it, build it: 'It was pretty.'",
    }),
    speaking(
      "ja-m10-5-1-speak-kirei",
      "きれいでした",
      "It was pretty.",
    ),
    selfExplain({
      id: "ja-m10-5-1-self-na-adj",
      anchorLabel: "You picked でした in: きれい＿。",
      anchorAudioText: "きれいでした",
      question: "Why does きれい use でした, not かった?",
      rule: {
        text: "きれい is a な-adjective — it uses the noun conjugation pattern (stem + でした).",
      },
      surface: {
        text: "きれい ends in い but it's actually a な-adjective.",
      },
      distractor: {
        text: "All adjectives ending in い use でした for the past.",
      },
      ruleExplanation:
        "きれい looks like it ends in い, but it's a な-adjective (きれいな + noun). な-adjectives use noun-style copula past: でした / じゃなかったです.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-5-1-rev-mcq-1", M10_5_1_REVIEW[0], M10_REVIEW_M4_POOL),
    speaking("ja-m10-5-1-rev-speak-1", M10_5_1_REVIEW[1].kana, M10_5_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-5-1-rev-lc-1",
      audioText: M10_5_1_REVIEW[2].kana,
      correctMeaningEn: M10_5_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_5_1_REVIEW[3].meaningEn,
        M10_5_1_REVIEW[0].meaningEn,
        M10_REVIEW_M4_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-5-1-rev", M10_5_1_REVIEW),
    infoStep(
      "ja-m10-5-1-info-end",
      "You can now describe past qualities with な-adjectives",
      "きれいでした, しずかでした — な-adjectives use the noun pattern. Never かった for な-adjectives.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_5_1.steps);
assertAnswerRotation(M10_5_1.steps, 2);
assertNoConsecutiveSame(M10_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-5-2 — "It was pretty" practice (na-adj past + mixed i/na discrimination)
// ═══════════════════════════════════════════════════════════════════════

const M10_5_2_REVIEW = pickReviewAtoms("ja-m10-5-2-rev", M10_REVIEW_M3_POOL, 4);

export const M10_5_2: LessonContent = {
  id: "ja-m10-5-2",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "It was pretty (practice)",
  description:
    "Drill na-adj past + discrimination between い-adj and な-adj past forms.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-5-2-info-open",
      "い vs な — past tense discrimination",
      "The real skill: telling い-adjectives from な-adjectives and conjugating each one correctly in the past.",
    ),
    // ── にぎやかでした (was lively — な-adj) ──
    build(
      "ja-m10-5-2-build-nigiyaka",
      "Say: The city was lively.",
      "まちは にぎやかでした",
      ["まち", "は", "にぎやか", "でした", "かった", "です"],
      ["まち", "は", "にぎやか", "でした"],
    ),
    listeningCompSentence({
      id: "ja-m10-5-2-lc-nigiyaka",
      audioText: "まちは にぎやかでした",
      correctMeaningEn: "The city was lively.",
      distractorsEn: [
        "The city is lively.",
        "The city was quiet.",
        "The city wasn't lively.",
      ],
    }),
    // ── Discrimination: na-adj vs i-adj ──
    sentenceMcq({
      id: "ja-m10-5-2-mcq-discrim-1",
      prompt: "Which is correct for 'The hotel was quiet'?",
      correctKana: "ホテルは しずかでした。",
      distractorsKana: [
        "ホテルは しずかかったです。",
        "ホテルは しずかくなかったです。",
        "ホテルは しずかましたです。",
      ],
      explanation: "しずか = な-adjective → past = しずかでした (noun pattern, not かった).",
    }),
    cloze(
      "ja-m10-5-2-cloze-taka-katta",
      "ラーメンは たか",
      "です。",
      "かった",
      ["かった", "でした", "くなかった", "じゃなかったです"],
      "The ramen was expensive.",
      "ラーメンは たかかったです。",
      "たかい = い-adjective → past = drop い, add かった.",
    ),
    cloze(
      "ja-m10-5-2-cloze-kirei-deshita",
      "はなは きれい",
      "。",
      "でした",
      ["でした", "かった", "ました", "くなかった"],
      "The flowers were pretty.",
      "はなは きれいでした。",
      "きれい = な-adjective → past = きれいでした (not きれいかった).",
    ),
    build(
      "ja-m10-5-2-build-mixed-i",
      "Say: The sushi was delicious.",
      "すしは おいしかったです",
      ["すし", "は", "おいしかった", "です", "おいしでした", "でした"],
      ["すし", "は", "おいしかった", "です"],
    ),
    build(
      "ja-m10-5-2-build-mixed-na",
      "Say: The park was pretty.",
      "こうえんは きれいでした",
      ["こうえん", "は", "きれい", "でした", "かった", "です"],
      ["こうえん", "は", "きれい", "でした"],
    ),
    sentenceMcq({
      id: "ja-m10-5-2-mcq-discrim-2",
      prompt: "Which pair shows correct past forms?",
      correctKana: "おいしかった (i-adj) / しずかでした (na-adj)",
      distractorsKana: [
        "おいしでした / しずかかった",
        "おいしかった / しずかかった",
        "おいしでした / しずかでした",
      ],
      explanation: "い-adj → かった. な-adj → でした. Never mix the patterns.",
    }),
    listeningCompSentence({
      id: "ja-m10-5-2-lc-mixed",
      audioText: "こうえんは きれいでした",
      correctMeaningEn: "The park was pretty.",
      distractorsEn: [
        "The park was quiet.",
        "The park is pretty.",
        "The park wasn't pretty.",
      ],
    }),
    // ── Negative contrast ──
    build(
      "ja-m10-5-2-build-neg-na",
      "Say: The city wasn't lively.",
      "まちは にぎやかじゃなかったです",
      ["まち", "は", "にぎやか", "じゃなかったです", "でした", "くなかった"],
      ["まち", "は", "にぎやか", "じゃなかったです"],
    ),
    listeningBuildSentence({
      id: "ja-m10-5-2-lb-shizuka",
      target: "ホテルは しずかでした",
      tiles: ["ホテル", "は", "しずか", "でした", "かった", "じゃなかったです"],
      correctOrder: ["ホテル", "は", "しずか", "でした"],
      promptEn: "Hear it, build it: 'The hotel was quiet.'",
    }),
    speaking(
      "ja-m10-5-2-speak-nigiyaka",
      "まちは にぎやかでした",
      "The city was lively.",
    ),
    selfExplain({
      id: "ja-m10-5-2-self-discrim",
      anchorLabel: "You picked でした for きれい but かった for たかい.",
      anchorAudioText: "きれいでした",
      question: "What distinguishes い-adjective past from な-adjective past?",
      rule: {
        text: "い-adjectives conjugate internally (drop い + かった). な-adjectives use the copula (stem + でした).",
      },
      surface: {
        text: "な-adjectives end in でした because they can't conjugate on their own.",
      },
      distractor: {
        text: "Both types use でした, but い-adjectives optionally allow かった too.",
      },
      ruleExplanation:
        "The rule is strict: い-adj → drop い + かった (internal conjugation). な-adj → stem + でした (copula conjugation). They never overlap.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-5-2-rev-mcq-1", M10_5_2_REVIEW[0], M10_REVIEW_M3_POOL),
    speaking("ja-m10-5-2-rev-speak-1", M10_5_2_REVIEW[1].kana, M10_5_2_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-5-2-rev-lc-1",
      audioText: M10_5_2_REVIEW[2].kana,
      correctMeaningEn: M10_5_2_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_5_2_REVIEW[3].meaningEn,
        M10_5_2_REVIEW[0].meaningEn,
        M10_REVIEW_M3_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-5-2-rev", M10_5_2_REVIEW),
    infoStep(
      "ja-m10-5-2-info-end",
      "You can now tell い and な adjectives apart in the past",
      "い-adj: かった / くなかった. な-adj: でした / じゃなかったです. The discrimination is locked in.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_5_2.steps);
assertAnswerRotation(M10_5_2.steps, 2);
assertNoConsecutiveSame(M10_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-6-1 — "Last week" intro (せんしゅう, せんげつ, きょねん + time + past)
// ═══════════════════════════════════════════════════════════════════════

const M10_6_1_REVIEW = pickReviewAtoms("ja-m10-6-1-rev", M10_REVIEW_M7_POOL, 4);

export const M10_6_1: LessonContent = {
  id: "ja-m10-6-1",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "Last week (intro)",
  description:
    "New time words: せんしゅう (last week), せんげつ (last month), きょねん (last year). Past tense sentences with longer time frames.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-6-1-info-open",
      "Bigger time frames",
      "Last week, last month, last year. Same past tense forms, bigger stories.",
    ),
    // ── せんしゅう (last week) ──
    build(
      "ja-m10-6-1-build-senshuu",
      "Pick the Japanese word for: Last week",
      "せんしゅう",
      ["せんしゅう", "せんげつ", "きょねん", "きのう"],
      ["せんしゅう"],
    ),
    listeningCompSentence({
      id: "ja-m10-6-1-lc-senshuu",
      audioText: "せんしゅう",
      correctMeaningEn: "last week",
      distractorsEn: ["last month", "last year", "yesterday"],
    }),
    // ── せんげつ (last month) ──
    build(
      "ja-m10-6-1-build-sengetsu",
      "Pick the Japanese word for: Last month",
      "せんげつ",
      ["せんげつ", "せんしゅう", "きょねん", "おととし"],
      ["せんげつ"],
    ),
    // ── きょねん (last year) ──
    build(
      "ja-m10-6-1-build-kyonen",
      "Pick the Japanese word for: Last year",
      "きょねん",
      ["きょねん", "せんしゅう", "せんげつ", "おととし"],
      ["きょねん"],
    ),
    vocabMcq(
      "ja-m10-6-1-mcq-kyonen",
      { kana: "きょねん", meaningEn: "last year", emoji: "📅", fromModule: "m10" },
      M10_REVIEW_M5_POOL,
    ),
    // ── Sentences with new time words ──
    build(
      "ja-m10-6-1-build-senshuu-oyogi",
      "Say: I swam last week.",
      "せんしゅう およぎました",
      ["せんしゅう", "およぎました", "はしりました", "せんげつ", "きのう"],
      ["せんしゅう", "およぎました"],
    ),
    cloze(
      "ja-m10-6-1-cloze-sengetsu",
      "",
      " にほんに いきました。",
      "せんげつ",
      ["せんげつ", "せんしゅう", "きょねん", "きのう"],
      "I went to Japan last month.",
      "せんげつ にほんに いきました。",
      "せんげつ = last month. Time words open the sentence.",
    ),
    sentenceMcq({
      id: "ja-m10-6-1-mcq-kyonen-sentence",
      prompt: "Which sentence means 'I studied last year'?",
      correctKana: "きょねん べんきょうしました。",
      distractorsKana: [
        "せんしゅう べんきょうしました。",
        "きょねん べんきょうします。",
        "きのう べんきょうしました。",
      ],
      explanation: "きょねん = last year. べんきょうしました = studied (past of べんきょうします).",
    }),
    build(
      "ja-m10-6-1-build-kyonen-hataraki",
      "Say: I worked last year.",
      "きょねん はたらきました",
      ["きょねん", "はたらきました", "べんきょうしました", "せんしゅう", "あそびました"],
      ["きょねん", "はたらきました"],
    ),
    listeningCompSentence({
      id: "ja-m10-6-1-lc-sengetsu-nihon",
      audioText: "せんげつ にほんに いきました",
      correctMeaningEn: "I went to Japan last month.",
      distractorsEn: [
        "I went to Japan last week.",
        "I go to Japan last month.",
        "I went to America last month.",
      ],
    }),
    cloze(
      "ja-m10-6-1-cloze-ni-nihon",
      "きょねん にほん",
      " いきました。",
      "に",
      ["に", "を", "で", "は"],
      "I went to Japan last year.",
      "きょねん にほんに いきました。",
      "に marks the destination — where you went.",
    ),
    listeningBuildSentence({
      id: "ja-m10-6-1-lb-senshuu",
      target: "せんしゅう およぎました",
      tiles: ["せんしゅう", "およぎました", "はしりました", "きょねん", "せんげつ"],
      correctOrder: ["せんしゅう", "およぎました"],
      promptEn: "Hear it, build it: 'I swam last week.'",
    }),
    speaking(
      "ja-m10-6-1-speak-kyonen",
      "きょねん にほんに いきました",
      "I went to Japan last year.",
    ),
    selfExplain({
      id: "ja-m10-6-1-self-time-words",
      anchorLabel: "You built: せんげつ にほんに いきました。",
      anchorAudioText: "せんげつ にほんに いきました",
      question: "How do you know which time word to use?",
      rule: {
        text: "せんしゅう = last week, せんげつ = last month, きょねん = last year — each names a specific past time frame.",
      },
      surface: {
        text: "They all start with せん because せん means 'previous.'",
      },
      distractor: {
        text: "All three words are interchangeable — they all mean 'in the past.'",
      },
      ruleExplanation:
        "Each word names a distinct time frame. せんしゅう (last week) and せんげつ (last month) share the prefix せん (previous). きょねん (last year) uses a different root.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-6-1-rev-mcq-1", M10_6_1_REVIEW[0], M10_REVIEW_M7_POOL),
    speaking("ja-m10-6-1-rev-speak-1", M10_6_1_REVIEW[1].kana, M10_6_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-6-1-rev-lc-1",
      audioText: M10_6_1_REVIEW[2].kana,
      correctMeaningEn: M10_6_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_6_1_REVIEW[3].meaningEn,
        M10_6_1_REVIEW[0].meaningEn,
        M10_REVIEW_M7_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-6-1-rev", M10_6_1_REVIEW),
    infoStep(
      "ja-m10-6-1-info-end",
      "You can now talk about what happened last week, month, and year",
      "せんしゅう, せんげつ, きょねん — bigger time frames with the same ました past.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_6_1.steps);
assertAnswerRotation(M10_6_1.steps, 2);
assertNoConsecutiveSame(M10_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-6-2 — "Last week" practice (time expressions with past forms)
// ═══════════════════════════════════════════════════════════════════════

const M10_6_2_REVIEW = pickReviewAtoms("ja-m10-6-2-rev", M10_REVIEW_M6_POOL, 4);

export const M10_6_2: LessonContent = {
  id: "ja-m10-6-2",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "Last week (practice)",
  description:
    "More verbs: べんきょうする (study), はたらく (work), でかける (go out). Mixed time expressions with past forms.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m10-6-2-info-open",
      "Past tense + time combos",
      "Study, work, go out — three new verbs paired with all the time words you know.",
    ),
    // ── べんきょうしました (studied) ──
    build(
      "ja-m10-6-2-build-benkyou",
      "Say: I studied last week.",
      "せんしゅう べんきょうしました",
      ["せんしゅう", "べんきょうしました", "はたらきました", "でかけました", "きのう"],
      ["せんしゅう", "べんきょうしました"],
    ),
    listeningCompSentence({
      id: "ja-m10-6-2-lc-benkyou",
      audioText: "せんしゅう べんきょうしました",
      correctMeaningEn: "I studied last week.",
      distractorsEn: [
        "I worked last week.",
        "I studied last month.",
        "I study every week.",
      ],
    }),
    // ── はたらきました (worked) ──
    build(
      "ja-m10-6-2-build-hataraki",
      "Say: I worked last month.",
      "せんげつ はたらきました",
      ["せんげつ", "はたらきました", "べんきょうしました", "せんしゅう", "でかけました"],
      ["せんげつ", "はたらきました"],
    ),
    cloze(
      "ja-m10-6-2-cloze-sengetsu-hataraki",
      "",
      " はたらきました。",
      "せんげつ",
      ["せんげつ", "せんしゅう", "きのう", "けさ"],
      "I worked last month.",
      "せんげつ はたらきました。",
      "せんげつ = last month.",
    ),
    // ── でかけました (went out) ──
    build(
      "ja-m10-6-2-build-dekake",
      "Say: I went out yesterday.",
      "きのう でかけました",
      ["きのう", "でかけました", "はたらきました", "べんきょうしました", "ゆうべ"],
      ["きのう", "でかけました"],
    ),
    sentenceMcq({
      id: "ja-m10-6-2-mcq-dekake",
      prompt: "Which sentence means 'I went out last night'?",
      correctKana: "ゆうべ でかけました。",
      distractorsKana: [
        "きのう でかけました。",
        "ゆうべ はたらきました。",
        "ゆうべ でかけます。",
      ],
      explanation: "ゆうべ = last night. でかけました = went out (past of でかけます).",
    }),
    // ── おととし (year before last) ──
    build(
      "ja-m10-6-2-build-ototoshi",
      "Pick the Japanese word for: Year before last",
      "おととし",
      ["おととし", "きょねん", "おととい", "せんげつ"],
      ["おととし"],
    ),
    cloze(
      "ja-m10-6-2-cloze-ototoshi",
      "",
      " にほんに いきました。",
      "おととし",
      ["おととし", "きょねん", "せんげつ", "せんしゅう"],
      "I went to Japan the year before last.",
      "おととし にほんに いきました。",
      "おととし = the year before last — two years ago.",
    ),
    // ── Mixed time + verb drill ──
    listeningCompSentence({
      id: "ja-m10-6-2-lc-ototoshi",
      audioText: "おととし はたらきました",
      correctMeaningEn: "I worked the year before last.",
      distractorsEn: [
        "I worked last year.",
        "I studied the year before last.",
        "I went out the year before last.",
      ],
    }),
    build(
      "ja-m10-6-2-build-neg-benkyou",
      "Say: I didn't study last week.",
      "せんしゅう べんきょうしませんでした",
      ["せんしゅう", "べんきょうしませんでした", "べんきょうしました", "きのう", "はたらきました"],
      ["せんしゅう", "べんきょうしませんでした"],
    ),
    listeningBuildSentence({
      id: "ja-m10-6-2-lb-hataraki",
      target: "きょねん はたらきました",
      tiles: ["きょねん", "はたらきました", "べんきょうしました", "せんげつ", "でかけました"],
      correctOrder: ["きょねん", "はたらきました"],
      promptEn: "Hear it, build it: 'I worked last year.'",
    }),
    sentenceMcq({
      id: "ja-m10-6-2-mcq-neg-hataraki",
      prompt: "Which sentence means 'I didn't work last month'?",
      correctKana: "せんげつ はたらきませんでした。",
      distractorsKana: [
        "せんげつ はたらきました。",
        "せんしゅう はたらきませんでした。",
        "せんげつ べんきょうしませんでした。",
      ],
      explanation: "はたらきませんでした = didn't work (negative past of はたらきます).",
    }),
    speaking(
      "ja-m10-6-2-speak-dekake",
      "きのう でかけました",
      "I went out yesterday.",
    ),
    selfExplain({
      id: "ja-m10-6-2-self-suru-mashita",
      anchorLabel: "You built: せんしゅう べんきょうしました。",
      anchorAudioText: "せんしゅう べんきょうしました",
      question: "How does べんきょうする become べんきょうしました?",
      rule: {
        text: "する verbs: する → します (polite) → しました (polite past). The します → しました swap is the same ます → ました rule.",
      },
      surface: {
        text: "べんきょうしました keeps the べんきょう part and changes the ending.",
      },
      distractor: {
        text: "べんきょう is a separate word from しました — they just happen to be next to each other.",
      },
      ruleExplanation:
        "べんきょうする is a compound verb: noun べんきょう + verb する. In polite form: する → します → しました. The noun part never changes.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-6-2-rev-mcq-1", M10_6_2_REVIEW[0], M10_REVIEW_M6_POOL),
    speaking("ja-m10-6-2-rev-speak-1", M10_6_2_REVIEW[1].kana, M10_6_2_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-6-2-rev-lc-1",
      audioText: M10_6_2_REVIEW[2].kana,
      correctMeaningEn: M10_6_2_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_6_2_REVIEW[3].meaningEn,
        M10_6_2_REVIEW[0].meaningEn,
        M10_REVIEW_M6_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-6-2-rev", M10_6_2_REVIEW),
    infoStep(
      "ja-m10-6-2-info-end",
      "You can now pair any time expression with past tense",
      "べんきょうしました, はたらきました, でかけました + おととし. Your past-tense vocabulary spans yesterday to two years ago.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_6_2.steps);
assertAnswerRotation(M10_6_2.steps, 2);
assertNoConsecutiveSame(M10_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-STORY — Dialogue: "What did you do yesterday?"
// ═══════════════════════════════════════════════════════════════════════

export const M10_STORY: LessonContent = {
  id: "ja-m10-story",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — What did you do yesterday?",
  description:
    "Listen to two friends talk about what they did yesterday. Answer questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m10-story-info-open",
      "Story time — What did you do yesterday?",
      "ゆき and たけし are catching up after the weekend. Listen as they talk about what they did.",
    ),
    dialogueListen({
      id: "ja-m10-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "きのう なにを しましたか。" },
        { speaker: "たけし", kana: "ともだちと えいがを みました。" },
        { speaker: "ゆき", kana: "どうでしたか。" },
        { speaker: "たけし", kana: "とても おもしろかったです。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What did たけし do yesterday?",
          correctText: "Watched a movie with a friend",
          distractors: [
            "Went to a park with a friend",
            "Read a book alone",
            "Studied at school",
          ],
          explanation:
            "ともだちと えいがを みました = watched a movie with a friend.",
        },
        {
          id: "s1-q2",
          prompt: "How was the movie?",
          correctText: "Very interesting",
          distractors: [
            "Not very good",
            "A little boring",
            "Pretty expensive",
          ],
          explanation:
            "とても おもしろかったです = It was very interesting.",
        },
      ],
    }),
    build(
      "ja-m10-story-build-mimashita",
      "Say: I watched a movie with a friend.",
      "ともだちと えいがを みました",
      ["ともだち", "と", "えいが", "を", "みました", "たべました", "きのう"],
      ["ともだち", "と", "えいが", "を", "みました"],
    ),
    sentenceMcq({
      id: "ja-m10-story-mcq-omoshiro",
      prompt: "Which sentence means 'It was very interesting'?",
      correctKana: "とても おもしろかったです。",
      distractorsKana: [
        "とても おもしろいです。",
        "あまり おもしろくなかったです。",
        "とても たかかったです。",
      ],
      explanation:
        "おもしろかった = was interesting (past of おもしろい). とても = very.",
    }),
    dialogueListen({
      id: "ja-m10-story-scene-2",
      lines: [
        { speaker: "たけし", kana: "ゆきは きのう なにを しましたか。" },
        { speaker: "ゆき", kana: "こうえんで あるきました。" },
        { speaker: "たけし", kana: "いいですね。てんきは どうでしたか。" },
        { speaker: "ゆき", kana: "とても よかったです。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "What did ゆき do yesterday?",
          correctText: "Walked in the park",
          distractors: [
            "Watched a movie",
            "Ran in the park",
            "Went to a store",
          ],
          explanation: "こうえんで あるきました = walked in the park.",
        },
        {
          id: "s2-q2",
          prompt: "How was the weather?",
          correctText: "Very good",
          distractors: [
            "Not very good",
            "A little cold",
            "Very hot",
          ],
          explanation: "とても よかったです = It was very good.",
        },
      ],
    }),
    cloze(
      "ja-m10-story-cloze-de",
      "こうえん",
      " あるきました。",
      "で",
      ["で", "に", "を", "は"],
      "I walked in the park.",
      "こうえんで あるきました。",
      "で marks where the action happens — walking took place IN the park.",
    ),
    listeningBuildSentence({
      id: "ja-m10-story-lb-yokatta",
      target: "とても よかったです",
      tiles: ["とても", "よかった", "です", "いかった", "おもしろかった"],
      correctOrder: ["とても", "よかった", "です"],
      promptEn: "Hear it, build it: 'It was very good.'",
    }),
    listeningCompSentence({
      id: "ja-m10-story-lc-nani",
      audioText: "きのう なにを しましたか",
      correctMeaningEn: "What did you do yesterday?",
      distractorsEn: [
        "What are you doing today?",
        "What will you do tomorrow?",
        "Where did you go yesterday?",
      ],
    }),
    speaking(
      "ja-m10-story-speak-nani",
      "きのう なにを しましたか",
      "What did you do yesterday?",
    ),
    sentenceMcq({
      id: "ja-m10-story-mcq-summary",
      prompt: "In the story, what did both friends do?",
      correctKana: "They both enjoyed outdoor/leisure activities",
      distractorsKana: [
        "They both watched movies",
        "They both studied at school",
        "They both went to a restaurant",
      ],
      explanation:
        "たけし watched a movie with a friend. ゆき walked in the park. Both did leisure activities.",
    }),
    speaking(
      "ja-m10-story-speak-omoshiro",
      "とても おもしろかったです",
      "It was very interesting.",
    ),
    infoStep(
      "ja-m10-story-info-end",
      "You followed a real past-tense conversation between friends",
      "なにを しましたか, えいがを みました, おもしろかったです, よかったです — you can now chat about what happened yesterday.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M10_STORY.steps);
assertPassiveCardsHaveFollowup(M10_STORY.steps);
assertNoExplanationOnPassive(M10_STORY.steps);
assertExplanationDoesntLeakAnswer(M10_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-7-1 — "Mixed past drill" (all past forms interleaved)
// ═══════════════════════════════════════════════════════════════════════

const M10_7_1_REVIEW = pickReviewAtoms("ja-m10-7-1-rev", M10_REVIEW_POOL, 5);

export const M10_7_1: LessonContent = {
  id: "ja-m10-7-1",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed past drill",
  description:
    "All four past forms interleaved: ました, でした, い-adj かった, な-adj でした. Discrimination drill.",
  estimatedMinutes: 10,
  xpReward: 25,
  steps: [
    infoStep(
      "ja-m10-7-1-info-open",
      "Everything past — mixed drill",
      "Verbs, copula, い-adj, な-adj — all in past tense. Can you tell them apart and conjugate each one?",
    ),
    // ── ました (verb) ──
    cloze(
      "ja-m10-7-1-cloze-mashita",
      "きのう すしを たべ",
      "。",
      "ました",
      ["ました", "でした", "かった", "ます"],
      "I ate sushi yesterday.",
      "きのう すしを たべました。",
      "Verb past: ます → ました.",
    ),
    // ── でした (na-adj) ──
    cloze(
      "ja-m10-7-1-cloze-deshita-na",
      "こうえんは しずか",
      "。",
      "でした",
      ["でした", "かった", "ました", "じゃなかったです"],
      "The park was quiet.",
      "こうえんは しずかでした。",
      "な-adjective past: stem + でした.",
    ),
    // ── かった (i-adj) ──
    cloze(
      "ja-m10-7-1-cloze-katta",
      "えいがは おもしろ",
      "です。",
      "かった",
      ["かった", "でした", "ました", "くなかった"],
      "The movie was interesting.",
      "えいがは おもしろかったです。",
      "い-adjective past: drop い, add かった.",
    ),
    build(
      "ja-m10-7-1-build-mixed-verb",
      "Say: I went to the library last week.",
      "せんしゅう としょかんに いきました",
      ["せんしゅう", "としょかん", "に", "いきました", "でした", "かった", "を"],
      ["せんしゅう", "としょかん", "に", "いきました"],
    ),
    sentenceMcq({
      id: "ja-m10-7-1-mcq-mixed-1",
      prompt: "Which is the correct past form? 'The hotel was pretty.'",
      correctKana: "ホテルは きれいでした。",
      distractorsKana: [
        "ホテルは きれいかったです。",
        "ホテルは きれいました。",
        "ホテルは きれいくなかったです。",
      ],
      explanation: "きれい is な-adjective → past = でした (not かった).",
    }),
    build(
      "ja-m10-7-1-build-mixed-i-adj",
      "Say: The ramen was delicious.",
      "ラーメンは おいしかったです",
      ["ラーメン", "は", "おいしかった", "です", "おいしでした", "でした"],
      ["ラーメン", "は", "おいしかった", "です"],
    ),
    listeningCompSentence({
      id: "ja-m10-7-1-lc-mixed-copula",
      audioText: "がくせいでした",
      correctMeaningEn: "I was a student.",
      distractorsEn: [
        "I am a student.",
        "I wasn't a student.",
        "I was a teacher.",
      ],
    }),
    // ── Negative forms mixed ──
    cloze(
      "ja-m10-7-1-cloze-neg-verb",
      "ほんを よみ",
      "。",
      "ませんでした",
      ["ませんでした", "ました", "でした", "じゃなかったです"],
      "I didn't read the book.",
      "ほんを よみませんでした。",
      "Verb negative past: ません → ませんでした.",
    ),
    cloze(
      "ja-m10-7-1-cloze-neg-i-adj",
      "きのうは さむ",
      "です。",
      "くなかった",
      ["くなかった", "かった", "じゃなかったです", "ませんでした"],
      "Yesterday wasn't cold.",
      "きのうは さむくなかったです。",
      "い-adj negative past: drop い, add くなかった.",
    ),
    sentenceMcq({
      id: "ja-m10-7-1-mcq-neg-na",
      prompt: "Which means 'It wasn't pretty'?",
      correctKana: "きれいじゃなかったです。",
      distractorsKana: [
        "きれいくなかったです。",
        "きれいませんでした。",
        "きれいでした。",
      ],
      explanation: "な-adj negative past = stem + じゃなかったです.",
    }),
    build(
      "ja-m10-7-1-build-yokatta",
      "Say: The weather was good.",
      "てんきは よかったです",
      ["てんき", "は", "よかった", "です", "いかった", "でした"],
      ["てんき", "は", "よかった", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m10-7-1-lb-mixed",
      target: "きのう えいがを みました",
      tiles: ["きのう", "えいが", "を", "みました", "でした", "かった"],
      correctOrder: ["きのう", "えいが", "を", "みました"],
      promptEn: "Hear it, build it: 'I watched a movie yesterday.'",
    }),
    speaking(
      "ja-m10-7-1-speak-mixed",
      "ラーメンは おいしかったです",
      "The ramen was delicious.",
    ),
    selfExplain({
      id: "ja-m10-7-1-self-four-forms",
      anchorLabel: "Four past forms: ました / でした / かった / じゃなかったです",
      anchorAudioText: "たべました",
      question: "Which past form do verbs use?",
      rule: {
        text: "Verbs use ました (swap ます → ました). でした is for nouns/な-adj. かった is for い-adj.",
      },
      surface: {
        text: "ました has a ま sound because it comes from ます.",
      },
      distractor: {
        text: "Verbs can use either ました or でした depending on formality.",
      },
      ruleExplanation:
        "Each word class has its own past form: verb → ました, noun/な-adj → でした, い-adj → かった. They never cross over.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m10-7-1-rev-mcq-1", M10_7_1_REVIEW[0], M10_REVIEW_POOL),
    speaking("ja-m10-7-1-rev-speak-1", M10_7_1_REVIEW[1].kana, M10_7_1_REVIEW[1].meaningEn),
    listeningCompSentence({
      id: "ja-m10-7-1-rev-lc-1",
      audioText: M10_7_1_REVIEW[2].kana,
      correctMeaningEn: M10_7_1_REVIEW[2].meaningEn,
      distractorsEn: [
        M10_7_1_REVIEW[3].meaningEn,
        M10_7_1_REVIEW[4].meaningEn,
        M10_REVIEW_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-7-1-rev", M10_7_1_REVIEW),
    infoStep(
      "ja-m10-7-1-info-end",
      "You can now discriminate all four past tense patterns",
      "Verb ました, noun/な-adj でした, い-adj かった — plus their negatives. Four patterns, zero confusion.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_7_1.steps);
assertAnswerRotation(M10_7_1.steps, 2);
assertNoConsecutiveSame(M10_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M10-7-2 — "Past tense production" (translate + speaking heavy)
// ═══════════════════════════════════════════════════════════════════════

const M10_7_2_REVIEW = pickReviewAtoms("ja-m10-7-2-rev", M10_REVIEW_POOL, 5);

export const M10_7_2: LessonContent = {
  id: "ja-m10-7-2",
  moduleId: "m10",
  courseId: COURSE,
  languageId: LANG,
  title: "Past tense production",
  description:
    "Production-heavy: build, speak, and listen — all past tense forms combined for fluency.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m10-7-2-info-open",
      "Production time — past tense fluency",
      "Build, speak, and listen your way through every past tense pattern. This is the final drill.",
    ),
    // ── Production: verb past ──
    build(
      "ja-m10-7-2-build-1",
      "Say: I studied at the library last month.",
      "せんげつ としょかんで べんきょうしました",
      ["せんげつ", "としょかん", "で", "べんきょうしました", "に", "はたらきました", "きょねん"],
      ["せんげつ", "としょかん", "で", "べんきょうしました"],
    ),
    speaking(
      "ja-m10-7-2-speak-1",
      "せんげつ としょかんで べんきょうしました",
      "I studied at the library last month.",
    ),
    // ── Production: i-adj past ──
    build(
      "ja-m10-7-2-build-2",
      "Say: The coffee was hot.",
      "コーヒーは あつかったです",
      ["コーヒー", "は", "あつかった", "です", "あつい", "でした", "おいしかった"],
      ["コーヒー", "は", "あつかった", "です"],
    ),
    listeningCompSentence({
      id: "ja-m10-7-2-lc-1",
      audioText: "コーヒーは あつかったです",
      correctMeaningEn: "The coffee was hot.",
      distractorsEn: [
        "The coffee is hot.",
        "The coffee wasn't hot.",
        "The coffee was delicious.",
      ],
    }),
    // ── Production: na-adj past ──
    build(
      "ja-m10-7-2-build-3",
      "Say: The city was lively.",
      "まちは にぎやかでした",
      ["まち", "は", "にぎやか", "でした", "かった", "しずか", "です"],
      ["まち", "は", "にぎやか", "でした"],
    ),
    speaking(
      "ja-m10-7-2-speak-3",
      "まちは にぎやかでした",
      "The city was lively.",
    ),
    // ── Production: copula past ──
    build(
      "ja-m10-7-2-build-4",
      "Say: I was a student last year.",
      "きょねん がくせいでした",
      ["きょねん", "がくせい", "でした", "です", "ました", "せんせい"],
      ["きょねん", "がくせい", "でした"],
    ),
    // ── Negative production ──
    build(
      "ja-m10-7-2-build-5",
      "Say: The ramen wasn't delicious.",
      "ラーメンは おいしくなかったです",
      ["ラーメン", "は", "おいしくなかった", "です", "おいしかった", "でした"],
      ["ラーメン", "は", "おいしくなかった", "です"],
    ),
    sentenceMcq({
      id: "ja-m10-7-2-mcq-1",
      prompt: "Which means 'The park wasn't quiet'?",
      correctKana: "こうえんは しずかじゃなかったです。",
      distractorsKana: [
        "こうえんは しずかくなかったです。",
        "こうえんは しずかでした。",
        "こうえんは しずかませんでした。",
      ],
      explanation: "しずか = な-adj → negative past = しずかじゃなかったです.",
    }),
    listeningBuildSentence({
      id: "ja-m10-7-2-lb-1",
      target: "きのう ともだちと あそびました",
      tiles: ["きのう", "ともだち", "と", "あそびました", "はたらきました", "けさ"],
      correctOrder: ["きのう", "ともだち", "と", "あそびました"],
      promptEn: "Hear it, build it: 'I played with a friend yesterday.'",
    }),
    build(
      "ja-m10-7-2-build-6",
      "Say: It wasn't good.",
      "よくなかったです",
      ["よくなかった", "です", "よかった", "いくなかった", "いい"],
      ["よくなかった", "です"],
    ),
    cloze(
      "ja-m10-7-2-cloze-mixed",
      "せんしゅう こうえんで はしり",
      "。",
      "ました",
      ["ました", "でした", "かった", "ます"],
      "I ran in the park last week.",
      "せんしゅう こうえんで はしりました。",
      "Verb past: はしります → はしりました.",
    ),
    speaking(
      "ja-m10-7-2-speak-yokatta",
      "とても よかったです",
      "It was very good.",
    ),
    selfExplain({
      id: "ja-m10-7-2-self-production",
      anchorLabel: "Past tense production drill complete.",
      anchorAudioText: "よかったです",
      question: "Why is よかった correct (not いかった)?",
      rule: {
        text: "いい has an irregular root よ-. All conjugated forms use よ-: よくない, よかった, よくなかった.",
      },
      surface: {
        text: "よかった is a fixed expression that doesn't follow normal rules.",
      },
      distractor: {
        text: "いい can conjugate as either いかった or よかった — both are accepted.",
      },
      ruleExplanation:
        "いい (good) is historically from よい. Only the dictionary form stays いい — every other conjugation uses the よ- root. Never いかった.",
    }),
    // ── Review tail ──
    vocabMcq(
      "ja-m10-7-2-rev-mcq-1",
      M10_7_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!,
      M10_REVIEW_POOL,
    ),
    speaking("ja-m10-7-2-rev-speak-1", M10_7_2_REVIEW[1].kana, M10_7_2_REVIEW[1].meaningEn),
    vocabMcq(
      "ja-m10-7-2-rev-mcq-2",
      M10_7_2_REVIEW.filter((a) => Boolean(a.emoji))[1]!,
      M10_REVIEW_POOL,
    ),
    listeningCompSentence({
      id: "ja-m10-7-2-rev-lc-1",
      audioText: M10_7_2_REVIEW[3].kana,
      correctMeaningEn: M10_7_2_REVIEW[3].meaningEn,
      distractorsEn: [
        M10_7_2_REVIEW[4].meaningEn,
        M10_7_2_REVIEW[0].meaningEn,
        M10_REVIEW_POOL[0].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m10-7-2-rev", M10_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m10-7-2-info-end",
      "You can now produce all four past tense forms fluently",
      "Verb ました, noun/な-adj でした, い-adj かった, いい → よかった — the entire polite past tense system is yours.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M10_7_2.steps);
assertAnswerRotation(M10_7_2.steps, 1);
assertNoConsecutiveSame(M10_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M10_1_1.steps,
  ...M10_1_2.steps,
  ...M10_2_1.steps,
  ...M10_2_2.steps,
  ...M10_3_1.steps,
  ...M10_3_2.steps,
  ...M10_4_1.steps,
  ...M10_4_2.steps,
  ...M10_5_1.steps,
  ...M10_5_2.steps,
  ...M10_6_1.steps,
  ...M10_6_2.steps,
  ...M10_7_1.steps,
  ...M10_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M10_1_1, M10_1_2, M10_2_1, M10_2_2, M10_3_1, M10_3_2,
  M10_4_1, M10_4_2, M10_5_1, M10_5_2, M10_STORY, M10_6_1, M10_6_2,
  M10_7_1, M10_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
