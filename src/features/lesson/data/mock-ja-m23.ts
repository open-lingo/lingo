/**
 * M23 — Capability & Suggestions (2026-05-25).
 *
 * M23 introduces:
 *   - 〜のがじょうずです (good at doing): "She is good at swimming."
 *   - 〜のがへたです (bad at doing): "I am bad at cooking."
 *   - 〜ましょう (let's do): "Let's go together."
 *   - 〜ませんか (shall we? — invitation): "Won't you come with us?"
 *
 * Vocab (~25): うんてん (driving), ダンス (dance), ピアノ (piano), すいえい (swimming),
 *   うたう (sing), おどる (dance-verb), ひく (play instrument), パーティー,
 *   やくそく (promise/appointment), じょうず (skillful), へた (unskillful),
 *   いっしょに (together), さんぽ (walk/stroll), かいもの (shopping),
 *   えいが (movie), しゅうまつ (weekend), にちようび (Sunday),
 *   どようび (Saturday), ひま (free time), いそがしい (busy),
 *   だいじょうぶ (okay/fine), ぜひ (by all means), きっと (surely),
 *   たのしい (fun), たのしみ (looking forward to)
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps.
 *
 * ID scheme: ja-m23-{n}-{sub} e.g. ja-m23-1-1, ja-m23-1-2
 * Export names: M23_1_1, M23_1_2, M23_2_1, M23_2_2, etc.
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
const M23_REVIEW_POOL = withoutMcqBlocked(
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

const RULE_JOUZU = grammarRule({
  id: "ja-m23-rule-jouzu",
  title: "〜のがじょうずです / へたです — good at / bad at",
  rule:
    "To say someone is good or bad at DOING something, nominalize the verb with の and add がじょうずです (good at) or がへたです (bad at): [verb dictionary form] + のが + じょうず/へた + です. Note: Don't use じょうず about yourself — it sounds boastful. Use とくいです (strong at) instead for yourself.",
  examples: [
    {
      ja: "たけしさんは すいえいのが じょうずです。",
      romaji: "Takeshi-san wa suiei no ga jouzu desu.",
      en: "Takeshi is good at swimming.",
    },
    {
      ja: "わたしは りょうりのが へたです。",
      romaji: "watashi wa ryouri no ga heta desu.",
      en: "I'm bad at cooking.",
    },
    {
      ja: "ゆきさんは ピアノを ひくのが じょうずです。",
      romaji: "Yuki-san wa piano o hiku no ga jouzu desu.",
      en: "Yuki is good at playing the piano.",
    },
  ],
  antiPattern: {
    ja: "わたしは すいえいが じょうずです。",
    romaji: "watashi wa suiei ga jouzu desu.",
    en: "(incomplete — without の, the nominalization is missing for verb phrases)",
    why: "For verb phrases ('doing X'), you need の to nominalize: すいえいの. For simple noun subjects (すいえい alone as a skill), が directly works, but the verb-phrase pattern always needs の.",
  },
  cultureNote:
    "Japanese modesty: don't say じょうず about yourself. Say とくい (strong at) or まあまあ (so-so) instead. じょうず is for complimenting others.",
});

const RULE_MASHOU = grammarRule({
  id: "ja-m23-rule-mashou",
  title: "〜ましょう — let's do",
  rule:
    "To suggest doing something together, replace ます with ましょう: いきます → いきましょう (let's go). This is a direct suggestion — the speaker assumes the listener will join.",
  examples: [
    {
      ja: "いっしょに いきましょう。",
      romaji: "issho ni ikimashou.",
      en: "Let's go together.",
    },
    {
      ja: "ひるごはんを たべましょう。",
      romaji: "hirugohan o tabemashou.",
      en: "Let's eat lunch.",
    },
    {
      ja: "にほんごを べんきょうしましょう。",
      romaji: "nihongo o benkyou shimashou.",
      en: "Let's study Japanese.",
    },
  ],
  antiPattern: {
    ja: "いきますしょう。",
    romaji: "ikimasu shou.",
    en: "(broken — replace ます entirely, don't add しょう after it)",
    why: "ましょう replaces ます. いきます → drop ます → いき → add ましょう → いきましょう.",
  },
  cultureNote:
    "ましょう is a confident suggestion. For a softer, more tentative invitation, use ませんか (shall we? / won't you?).",
});

const RULE_MASENKA = grammarRule({
  id: "ja-m23-rule-masenka",
  title: "〜ませんか — shall we? / won't you?",
  rule:
    "To make a polite invitation, replace ます with ませんか: いきます → いきませんか (won't you go? / shall we go?). Softer than ましょう — it gives the listener room to decline.",
  examples: [
    {
      ja: "えいがを みませんか。",
      romaji: "eiga o mimasen ka.",
      en: "Won't you watch a movie? / Shall we watch a movie?",
    },
    {
      ja: "いっしょに さんぽしませんか。",
      romaji: "issho ni sanpo shimasen ka.",
      en: "Shall we take a walk together?",
    },
    {
      ja: "パーティーに きませんか。",
      romaji: "paatii ni kimasen ka.",
      en: "Won't you come to the party?",
    },
  ],
  antiPattern: {
    ja: "えいがを みますか。",
    romaji: "eiga o mimasu ka.",
    en: "(not an invitation — this is just 'Do you watch movies?' as a yes/no question)",
    why: "ますか = plain yes/no question. ませんか = polite invitation / suggestion. The negative form paradoxically creates the invitation.",
  },
  cultureNote:
    "ませんか is more tentative and polite than ましょう. Use ませんか when inviting someone you're not close to; ましょう with friends.",
});

// ═══════════════════════════════════════════════════════════════════════
// M23-1-1 — Capability vocab intro
//   (うんてん, ダンス, ピアノ, すいえい + じょうず, へた)
// ═══════════════════════════════════════════════════════════════════════

const M23_1_1_REVIEW = pickReviewAtoms("ja-m23-1-1-rev", M23_REVIEW_POOL, 4);

export const M23_1_1: LessonContent = {
  id: "ja-m23-1-1",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Skills and abilities I",
  description:
    "Four activity words — driving, dance, piano, swimming — plus じょうず and へた.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-1-1-info-open",
      "What are you good at?",
      "Four activities and two judgment words — good at, bad at. By the end you'll be rating skills.",
    ),
    // ── うんてん (driving) ──
    build(
      "ja-m23-1-1-build-unten",
      "Pick the Japanese word for: Driving",
      "うんてん",
      ["うんてん", "ダンス", "ピアノ", "すいえい"],
      ["うんてん"],
    ),
    listeningCompSentence({
      id: "ja-m23-1-1-lc-unten",
      audioText: "うんてん",
      correctMeaningEn: "driving",
      distractorsEn: ["dance", "piano", "swimming"],
    }),
    // ── ダンス (dance) ──
    build(
      "ja-m23-1-1-build-dansu",
      "Pick the Japanese word for: Dance",
      "ダンス",
      ["ダンス", "うんてん", "ピアノ", "すいえい"],
      ["ダンス"],
    ),
    vocabMcq(
      "ja-m23-1-1-mcq-dansu",
      { kana: "ダンス", meaningEn: "dance", emoji: "💃", fromModule: "m23" },
      M23_REVIEW_POOL,
    ),
    // ── ピアノ (piano) ──
    build(
      "ja-m23-1-1-build-piano",
      "Pick the Japanese word for: Piano",
      "ピアノ",
      ["ピアノ", "ダンス", "うんてん", "すいえい"],
      ["ピアノ"],
    ),
    vocabMcq(
      "ja-m23-1-1-mcq-piano",
      { kana: "ピアノ", meaningEn: "piano", emoji: "🎹", fromModule: "m23" },
      M23_REVIEW_POOL,
    ),
    // ── すいえい (swimming) ──
    build(
      "ja-m23-1-1-build-suiei",
      "Pick the Japanese word for: Swimming",
      "すいえい",
      ["すいえい", "ピアノ", "ダンス", "うんてん"],
      ["すいえい"],
    ),
    speaking("ja-m23-1-1-speak-suiei", "すいえい", "Swimming"),
    // ── じょうず / へた ──
    build(
      "ja-m23-1-1-build-jouzu",
      "Pick the Japanese word for: Skillful / Good at",
      "じょうず",
      ["じょうず", "へた", "すき", "きらい"],
      ["じょうず"],
    ),
    build(
      "ja-m23-1-1-build-heta",
      "Pick the Japanese word for: Unskillful / Bad at",
      "へた",
      ["へた", "じょうず", "きらい", "すき"],
      ["へた"],
    ),
    sentenceMcq({
      id: "ja-m23-1-1-mcq-jouzu",
      prompt: "Which means 'He is good at swimming.'?",
      correctKana: "かれは すいえいが じょうずです。",
      distractorsKana: [
        "かれは すいえいが へたです。",
        "かれは すいえいが すきです。",
        "かれは すいえいが きらいです。",
      ],
      explanation: "じょうず = good at / skillful.",
    }),
    listeningCompSentence({
      id: "ja-m23-1-1-lc-heta",
      audioText: "わたしは うんてんが へたです",
      correctMeaningEn: "I'm bad at driving.",
      distractorsEn: [
        "I'm good at driving.",
        "I like driving.",
        "I dislike driving.",
      ],
    }),
    cloze(
      "ja-m23-1-1-cloze-ga",
      "ダンス",
      " じょうずです。",
      "が",
      ["が", "は", "を", "の"],
      "Good at dance.",
      "ダンスが じょうずです。",
      "が marks the skill that someone is good at.",
    ),
    selfExplain({
      id: "ja-m23-1-1-self-explain",
      anchorLabel: "すいえいが じょうずです",
      anchorAudioText: "すいえいが じょうずです",
      question: "Why shouldn't you say わたしは〜がじょうずです about yourself?",
      rule: { text: "じょうず is used to compliment others. Using it about yourself sounds boastful in Japanese culture. Use とくい (strong at) instead for yourself." },
      surface: { text: "じょうず is only for activities you do professionally." },
      distractor: { text: "じょうず is a question word — it can't be used in statements." },
      ruleExplanation:
        "Cultural rule: じょうず = complimenting someone else. For yourself, use とくいです (I'm good at) or まあまあです (I'm so-so).",
    }),
    speaking(
      "ja-m23-1-1-speak-jouzu",
      "ピアノが じょうずです",
      "Good at piano.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-1-1-rev-mcq-1", M23_1_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-1-1-rev-lc-1",
      audioText: M23_1_1_REVIEW[1].kana,
      correctMeaningEn: M23_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_1_1_REVIEW[2].meaningEn,
        M23_1_1_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[0].meaningEn,
      ],
    }),
    speaking("ja-m23-1-1-rev-speak-1", M23_1_1_REVIEW[2].kana, M23_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-1-1-rev", M23_1_1_REVIEW),
    infoStep(
      "ja-m23-1-1-info-end",
      "You can now rate someone's skills in four activities",
      "じょうず and へた with うんてん, ダンス, ピアノ, すいえい — skill judgments unlocked.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_1_1.steps);
assertAnswerRotation(M23_1_1.steps, 1);
assertNoConsecutiveSame(M23_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-1-2 — Capability vocab practice
//   (drill じょうず/へた + うたう, おどる, ひく)
// ═══════════════════════════════════════════════════════════════════════

const M23_1_2_REVIEW = pickReviewAtoms("ja-m23-1-2-rev", M23_REVIEW_POOL, 4);

export const M23_1_2: LessonContent = {
  id: "ja-m23-1-2",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Skills and abilities II",
  description:
    "Three action verbs — sing, dance, play — and drill じょうず/へた in sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-1-2-info-open",
      "More skill verbs",
      "Sing, dance, play an instrument — three verbs to pair with じょうず and へた.",
    ),
    // ── うたう (sing) ──
    build(
      "ja-m23-1-2-build-utau",
      "Pick the Japanese word for: Sing",
      "うたう",
      ["うたう", "おどる", "ひく", "すいえい"],
      ["うたう"],
    ),
    listeningCompSentence({
      id: "ja-m23-1-2-lc-utau",
      audioText: "うたう",
      correctMeaningEn: "sing",
      distractorsEn: ["dance", "play", "swim"],
    }),
    // ── おどる (dance-verb) ──
    build(
      "ja-m23-1-2-build-odoru",
      "Pick the Japanese word for: Dance (verb)",
      "おどる",
      ["おどる", "うたう", "ひく", "うんてん"],
      ["おどる"],
    ),
    speaking("ja-m23-1-2-speak-odoru", "おどる", "Dance (verb)"),
    // ── ひく (play instrument) ──
    build(
      "ja-m23-1-2-build-hiku",
      "Pick the Japanese word for: Play (instrument)",
      "ひく",
      ["ひく", "うたう", "おどる", "すいえい"],
      ["ひく"],
    ),
    listeningCompSentence({
      id: "ja-m23-1-2-lc-hiku",
      audioText: "ピアノを ひく",
      correctMeaningEn: "play the piano",
      distractorsEn: ["sing a song", "do a dance", "go swimming"],
    }),
    // ── のがじょうず / のがへた drills ──
    RULE_JOUZU,
    build(
      "ja-m23-1-2-build-jouzu",
      "Say: She is good at singing.",
      "かのじょは うたうのが じょうずです",
      ["かのじょ", "は", "うたう", "のが", "じょうず", "です", "へた"],
      ["かのじょ", "は", "うたう", "のが", "じょうず", "です"],
    ),
    sentenceMcq({
      id: "ja-m23-1-2-mcq-heta",
      prompt: "Which means 'I'm bad at dancing.'?",
      correctKana: "わたしは おどるのが へたです。",
      distractorsKana: [
        "わたしは おどるのが じょうずです。",
        "わたしは おどるのが すきです。",
        "わたしは おどりませんか。",
      ],
      explanation: "おどるのが へたです = bad at dancing.",
    }),
    cloze(
      "ja-m23-1-2-cloze-noga",
      "ピアノを ひく",
      " じょうずです。",
      "のが",
      ["のが", "が", "は", "を"],
      "Good at playing the piano.",
      "ピアノを ひくのが じょうずです。",
      "のが nominalizes the verb phrase — 'the act of playing piano.'",
    ),
    listeningCompSentence({
      id: "ja-m23-1-2-lc-jouzu-utau",
      audioText: "たけしさんは うたうのが じょうずです",
      correctMeaningEn: "Takeshi is good at singing.",
      distractorsEn: [
        "Takeshi is bad at singing.",
        "Takeshi likes singing.",
        "Takeshi is singing.",
      ],
    }),
    build(
      "ja-m23-1-2-build-heta-unten",
      "Say: I'm bad at driving.",
      "わたしは うんてんが へたです",
      ["わたし", "は", "うんてん", "が", "へた", "です", "じょうず"],
      ["わたし", "は", "うんてん", "が", "へた", "です"],
    ),
    cloze(
      "ja-m23-1-2-cloze-ga",
      "おどるのが ",
      "です。",
      "へた",
      ["へた", "じょうず", "すき", "きらい"],
      "Bad at dancing.",
      "おどるのが へたです。",
      "へた = unskillful / bad at.",
    ),
    selfExplain({
      id: "ja-m23-1-2-self-explain",
      anchorLabel: "ピアノを ひくのが じょうずです",
      anchorAudioText: "ピアノを ひくのが じょうずです",
      question: "What does の do in ひくのが?",
      rule: { text: "の nominalizes the verb — it turns 'play' into 'the act of playing.' Without の, the verb can't be the subject of じょうず." },
      surface: { text: "の is the possession marker — 'piano's playing.'" },
      distractor: { text: "の is optional — you can drop it and say ひくが じょうずです." },
      ruleExplanation:
        "Verb + のが creates a noun phrase: 'doing X.' Same pattern as のがすき (like doing). The の is essential.",
    }),
    speaking(
      "ja-m23-1-2-speak-jouzu",
      "うたうのが じょうずです",
      "Good at singing.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-1-2-rev-mcq-1", M23_1_2_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-1-2-rev-lc-1",
      audioText: M23_1_2_REVIEW[1].kana,
      correctMeaningEn: M23_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_1_2_REVIEW[2].meaningEn,
        M23_1_2_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[1].meaningEn,
      ],
    }),
    speaking("ja-m23-1-2-rev-speak-1", M23_1_2_REVIEW[2].kana, M23_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-1-2-rev", M23_1_2_REVIEW),
    infoStep(
      "ja-m23-1-2-info-end",
      "You can now say what someone is good or bad at doing",
      "のがじょうず / のがへた — with うたう, おどる, ひく.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_1_2.steps);
assertAnswerRotation(M23_1_2.steps, 1);
assertNoConsecutiveSame(M23_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-2-1 — "Let's do" intro
//   (〜ましょう + activity vocab)
// ═══════════════════════════════════════════════════════════════════════

const M23_2_1_REVIEW = pickReviewAtoms("ja-m23-2-1-rev", M23_REVIEW_POOL, 4);

export const M23_2_1: LessonContent = {
  id: "ja-m23-2-1",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Let's do (intro)",
  description:
    "Suggesting activities with ましょう + さんぽ, かいもの, いっしょに.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-2-1-info-open",
      "Making suggestions",
      "You know ます-form verbs. Now swap ます for ましょう and you can suggest anything: 'Let's do X.'",
    ),
    RULE_MASHOU,
    // ── いっしょに (together) ──
    build(
      "ja-m23-2-1-build-issho",
      "Pick the Japanese word for: Together",
      "いっしょに",
      ["いっしょに", "さんぽ", "かいもの", "パーティー"],
      ["いっしょに"],
    ),
    listeningCompSentence({
      id: "ja-m23-2-1-lc-issho",
      audioText: "いっしょに",
      correctMeaningEn: "together",
      distractorsEn: ["walk", "shopping", "party"],
    }),
    // ── さんぽ (walk/stroll) ──
    build(
      "ja-m23-2-1-build-sanpo",
      "Pick the Japanese word for: Walk / Stroll",
      "さんぽ",
      ["さんぽ", "いっしょに", "かいもの", "うんてん"],
      ["さんぽ"],
    ),
    speaking("ja-m23-2-1-speak-sanpo", "さんぽ", "Walk / Stroll"),
    // ── かいもの (shopping) ──
    build(
      "ja-m23-2-1-build-kaimono",
      "Pick the Japanese word for: Shopping",
      "かいもの",
      ["かいもの", "さんぽ", "パーティー", "えいが"],
      ["かいもの"],
    ),
    vocabMcq(
      "ja-m23-2-1-mcq-kaimono",
      { kana: "かいもの", meaningEn: "shopping", emoji: "🛒", fromModule: "m23" },
      M23_REVIEW_POOL,
    ),
    // ── ましょう drills ──
    build(
      "ja-m23-2-1-build-mashou-iki",
      "Say: Let's go together.",
      "いっしょに いきましょう",
      ["いっしょに", "いきましょう", "いきます", "いきませんか", "ください"],
      ["いっしょに", "いきましょう"],
    ),
    sentenceMcq({
      id: "ja-m23-2-1-mcq-mashou",
      prompt: "Which means 'Let's eat lunch.'?",
      correctKana: "ひるごはんを たべましょう。",
      distractorsKana: [
        "ひるごはんを たべます。",
        "ひるごはんを たべませんか。",
        "ひるごはんを たべました。",
      ],
      explanation: "たべます → たべましょう = let's eat.",
    }),
    cloze(
      "ja-m23-2-1-cloze-mashou",
      "いっしょに さんぽし",
      "。",
      "ましょう",
      ["ましょう", "ます", "ません", "ました"],
      "Let's take a walk together.",
      "いっしょに さんぽしましょう。",
      "ましょう replaces ます to suggest doing something together.",
    ),
    listeningCompSentence({
      id: "ja-m23-2-1-lc-mashou",
      audioText: "いっしょに かいものしましょう",
      correctMeaningEn: "Let's go shopping together.",
      distractorsEn: [
        "I go shopping.",
        "Shall we go shopping?",
        "I went shopping.",
      ],
    }),
    build(
      "ja-m23-2-1-build-mashou-benkyou",
      "Say: Let's study Japanese.",
      "にほんごを べんきょうしましょう",
      ["にほんご", "を", "べんきょうしましょう", "べんきょうします", "べんきょうしません"],
      ["にほんご", "を", "べんきょうしましょう"],
    ),
    listeningBuildSentence({
      id: "ja-m23-2-1-lb-mashou",
      target: "いっしょに いきましょう",
      tiles: ["いっしょに", "いきましょう", "いきます", "いきませんか", "ください"],
      correctOrder: ["いっしょに", "いきましょう"],
      promptEn: "Hear it, build it: 'Let's go together.'",
    }),
    selfExplain({
      id: "ja-m23-2-1-self-explain",
      anchorLabel: "いっしょに さんぽしましょう",
      anchorAudioText: "いっしょに さんぽしましょう",
      question: "How do you form ましょう from a ます verb?",
      rule: { text: "Drop ます and add ましょう. いきます → いき + ましょう → いきましょう." },
      surface: { text: "Add しょう after ます: いきますしょう." },
      distractor: { text: "ましょう is a separate word that comes after the dictionary form." },
      ruleExplanation:
        "ます → ましょう is a direct replacement. The verb stem stays the same: たべ・ます → たべ・ましょう.",
    }),
    speaking(
      "ja-m23-2-1-speak-mashou",
      "いっしょに さんぽしましょう",
      "Let's take a walk together.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-2-1-rev-mcq-1", M23_2_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-2-1-rev-lc-1",
      audioText: M23_2_1_REVIEW[1].kana,
      correctMeaningEn: M23_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_2_1_REVIEW[2].meaningEn,
        M23_2_1_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[2].meaningEn,
      ],
    }),
    speaking("ja-m23-2-1-rev-speak-1", M23_2_1_REVIEW[2].kana, M23_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-2-1-rev", M23_2_1_REVIEW),
    infoStep(
      "ja-m23-2-1-info-end",
      "You can now suggest activities using ましょう",
      "ましょう — the confident suggestion. さんぽ, かいもの, いっしょに — three new words in action.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_2_1.steps);
assertAnswerRotation(M23_2_1.steps, 1);
assertNoConsecutiveSame(M23_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-2-2 — "Let's do" practice
//   (drill ましょう + パーティー, やくそく)
// ═══════════════════════════════════════════════════════════════════════

const M23_2_2_REVIEW = pickReviewAtoms("ja-m23-2-2-rev", M23_REVIEW_POOL, 4);

export const M23_2_2: LessonContent = {
  id: "ja-m23-2-2",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Let's do (practice)",
  description:
    "Drill ましょう with party and appointment context. Introduce パーティー, やくそく.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-2-2-info-open",
      "More suggestions",
      "Parties, appointments, activities — ましょう in real contexts.",
    ),
    // ── パーティー (party) ──
    build(
      "ja-m23-2-2-build-paatii",
      "Pick the Japanese word for: Party",
      "パーティー",
      ["パーティー", "やくそく", "さんぽ", "かいもの"],
      ["パーティー"],
    ),
    vocabMcq(
      "ja-m23-2-2-mcq-paatii",
      { kana: "パーティー", meaningEn: "party", emoji: "🎉", fromModule: "m23" },
      M23_REVIEW_POOL,
    ),
    // ── やくそく (promise/appointment) ──
    build(
      "ja-m23-2-2-build-yakusoku",
      "Pick the Japanese word for: Promise / Appointment",
      "やくそく",
      ["やくそく", "パーティー", "さんぽ", "かいもの"],
      ["やくそく"],
    ),
    listeningCompSentence({
      id: "ja-m23-2-2-lc-yakusoku",
      audioText: "やくそく",
      correctMeaningEn: "promise / appointment",
      distractorsEn: ["party", "walk", "shopping"],
    }),
    // ── ましょう drills ──
    build(
      "ja-m23-2-2-build-mashou-party",
      "Say: Let's have a party.",
      "パーティーを しましょう",
      ["パーティー", "を", "しましょう", "します", "しません"],
      ["パーティー", "を", "しましょう"],
    ),
    sentenceMcq({
      id: "ja-m23-2-2-mcq-mashou-nomi",
      prompt: "Which means 'Let's drink coffee.'?",
      correctKana: "コーヒーを のみましょう。",
      distractorsKana: [
        "コーヒーを のみます。",
        "コーヒーを のみませんか。",
        "コーヒーを のみました。",
      ],
      explanation: "のみます → のみましょう = let's drink.",
    }),
    cloze(
      "ja-m23-2-2-cloze-mashou",
      "えいがを み",
      "。",
      "ましょう",
      ["ましょう", "ます", "ません", "ました"],
      "Let's watch a movie.",
      "えいがを みましょう。",
      "ましょう = let's.",
    ),
    listeningCompSentence({
      id: "ja-m23-2-2-lc-mashou-tabe",
      audioText: "いっしょに ばんごはんを たべましょう",
      correctMeaningEn: "Let's eat dinner together.",
      distractorsEn: [
        "I eat dinner.",
        "Shall we eat dinner?",
        "I ate dinner together.",
      ],
    }),
    build(
      "ja-m23-2-2-build-mashou-kaeri",
      "Say: Let's go home.",
      "かえりましょう",
      ["かえりましょう", "かえります", "かえりません", "かえりました"],
      ["かえりましょう"],
    ),
    listeningBuildSentence({
      id: "ja-m23-2-2-lb-mashou",
      target: "パーティーを しましょう",
      tiles: ["パーティー", "を", "しましょう", "します", "しませんか"],
      correctOrder: ["パーティー", "を", "しましょう"],
      promptEn: "Hear it, build it: 'Let's have a party.'",
    }),
    sentenceMcq({
      id: "ja-m23-2-2-mcq-discrimination",
      prompt: "Which is a SUGGESTION, not a statement?",
      correctKana: "にほんごを べんきょうしましょう。",
      distractorsKana: [
        "にほんごを べんきょうします。",
        "にほんごを べんきょうしました。",
        "にほんごを べんきょうしません。",
      ],
      explanation: "ましょう = let's (suggestion). ます = I do (statement).",
    }),
    translateStep({
      id: "ja-m23-2-2-translate",
      promptEn: "Let's go shopping together.",
      acceptedAnswers: [
        "いっしょに かいものしましょう",
        "いっしょに かいものしましょう。",
        "いっしょに かいものを しましょう",
        "いっしょに かいものを しましょう。",
      ],
      audioText: "いっしょに かいものしましょう",
    }),
    selfExplain({
      id: "ja-m23-2-2-self-explain",
      anchorLabel: "パーティーを しましょう",
      anchorAudioText: "パーティーを しましょう",
      question: "Is ましょう a question or a suggestion?",
      rule: { text: "A suggestion — the speaker confidently proposes doing something together. It's 'let's do X,' not 'should we do X?'" },
      surface: { text: "A question — ましょう always asks for permission." },
      distractor: { text: "A command — ましょう orders someone to do something." },
      ruleExplanation:
        "ましょう = 'let's.' It assumes agreement. For a tentative invitation (giving room to decline), use ませんか.",
    }),
    speaking(
      "ja-m23-2-2-speak-mashou",
      "いっしょに パーティーを しましょう",
      "Let's have a party together.",
    ),
    // ── Review tail ──
    speaking("ja-m23-2-2-rev-speak-1", M23_2_2_REVIEW[0].kana, M23_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m23-2-2-rev-lc-1",
      audioText: M23_2_2_REVIEW[1].kana,
      correctMeaningEn: M23_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_2_2_REVIEW[2].meaningEn,
        M23_2_2_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m23-2-2-rev-mcq-1", M23_2_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M23_REVIEW_POOL),
    reviewMatchPairs("ja-m23-2-2-rev", M23_2_2_REVIEW),
    infoStep(
      "ja-m23-2-2-info-end",
      "You can now confidently suggest activities at parties and events",
      "ましょう drilled — パーティー, やくそく, and everyday activities.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_2_2.steps);
assertAnswerRotation(M23_2_2.steps, 1);
assertNoConsecutiveSame(M23_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-3-1 — "Shall we?" intro
//   (〜ませんか + えいが, しゅうまつ, ひま)
// ═══════════════════════════════════════════════════════════════════════

const M23_3_1_REVIEW = pickReviewAtoms("ja-m23-3-1-rev", M23_REVIEW_POOL, 4);

export const M23_3_1: LessonContent = {
  id: "ja-m23-3-1",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Shall we? (intro)",
  description:
    "Polite invitations with ませんか + えいが, しゅうまつ, ひま.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-3-1-info-open",
      "Polite invitations",
      "ましょう is confident. Now the softer version: ませんか — 'won't you...?' Three new words for making weekend plans.",
    ),
    RULE_MASENKA,
    // ── えいが (movie) ──
    build(
      "ja-m23-3-1-build-eiga",
      "Pick the Japanese word for: Movie",
      "えいが",
      ["えいが", "しゅうまつ", "ひま", "パーティー"],
      ["えいが"],
    ),
    vocabMcq(
      "ja-m23-3-1-mcq-eiga",
      { kana: "えいが", meaningEn: "movie", emoji: "🎬", fromModule: "m23" },
      M23_REVIEW_POOL,
    ),
    // ── しゅうまつ (weekend) ──
    build(
      "ja-m23-3-1-build-shuumatsu",
      "Pick the Japanese word for: Weekend",
      "しゅうまつ",
      ["しゅうまつ", "にちようび", "どようび", "えいが"],
      ["しゅうまつ"],
    ),
    listeningCompSentence({
      id: "ja-m23-3-1-lc-shuumatsu",
      audioText: "しゅうまつ",
      correctMeaningEn: "weekend",
      distractorsEn: ["Sunday", "Saturday", "movie"],
    }),
    // ── ひま (free time) ──
    build(
      "ja-m23-3-1-build-hima",
      "Pick the Japanese word for: Free time / Not busy",
      "ひま",
      ["ひま", "いそがしい", "しゅうまつ", "えいが"],
      ["ひま"],
    ),
    speaking("ja-m23-3-1-speak-hima", "ひま", "Free time / Not busy"),
    // ── ませんか drills ──
    build(
      "ja-m23-3-1-build-masenka-eiga",
      "Ask: Won't you watch a movie?",
      "えいがを みませんか",
      ["えいが", "を", "みませんか", "みましょう", "みます"],
      ["えいが", "を", "みませんか"],
    ),
    sentenceMcq({
      id: "ja-m23-3-1-mcq-masenka",
      prompt: "Which is a polite invitation to take a walk?",
      correctKana: "さんぽしませんか。",
      distractorsKana: [
        "さんぽしましょう。",
        "さんぽします。",
        "さんぽしました。",
      ],
      explanation: "ませんか = won't you? — a polite invitation (softer than ましょう).",
    }),
    cloze(
      "ja-m23-3-1-cloze-masenka",
      "パーティーに き",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ました"],
      "Won't you come to the party?",
      "パーティーに きませんか。",
      "ませんか = polite invitation. Softer than ましょう.",
    ),
    listeningCompSentence({
      id: "ja-m23-3-1-lc-masenka",
      audioText: "しゅうまつに えいがを みませんか",
      correctMeaningEn: "Shall we watch a movie on the weekend?",
      distractorsEn: [
        "I watch movies on weekends.",
        "Let's watch a movie.",
        "Did you watch a movie?",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m23-3-1-lb-masenka",
      target: "いっしょに さんぽしませんか",
      tiles: ["いっしょに", "さんぽしませんか", "さんぽしましょう", "さんぽします"],
      correctOrder: ["いっしょに", "さんぽしませんか"],
      promptEn: "Hear it, build it: 'Shall we take a walk together?'",
    }),
    build(
      "ja-m23-3-1-build-masenka-kaimono",
      "Ask: Won't you go shopping on the weekend?",
      "しゅうまつに かいものしませんか",
      ["しゅうまつ", "に", "かいものしませんか", "かいものしましょう", "かいものします"],
      ["しゅうまつ", "に", "かいものしませんか"],
    ),
    selfExplain({
      id: "ja-m23-3-1-self-explain",
      anchorLabel: "えいがを みませんか",
      anchorAudioText: "えいがを みませんか",
      question: "How is ませんか different from ましょう?",
      rule: { text: "ませんか is a polite invitation that gives room to decline. ましょう is a confident suggestion that assumes agreement." },
      surface: { text: "ませんか is negative — it means 'let's not do it.'" },
      distractor: { text: "ませんか is for strangers only; ましょう is for everyone." },
      ruleExplanation:
        "Both suggest doing something, but ませんか (won't you?) is softer and more tentative than ましょう (let's).",
    }),
    speaking(
      "ja-m23-3-1-speak-masenka",
      "えいがを みませんか",
      "Won't you watch a movie?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-3-1-rev-mcq-1", M23_3_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-3-1-rev-lc-1",
      audioText: M23_3_1_REVIEW[1].kana,
      correctMeaningEn: M23_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_3_1_REVIEW[2].meaningEn,
        M23_3_1_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[4].meaningEn,
      ],
    }),
    speaking("ja-m23-3-1-rev-speak-1", M23_3_1_REVIEW[2].kana, M23_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-3-1-rev", M23_3_1_REVIEW),
    infoStep(
      "ja-m23-3-1-info-end",
      "You can now politely invite someone to weekend activities",
      "ませんか — the soft invitation. えいが, しゅうまつ, ひま — weekend planning vocab.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_3_1.steps);
assertAnswerRotation(M23_3_1.steps, 1);
assertNoConsecutiveSame(M23_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-3-2 — "Shall we?" practice
//   (drill ませんか + にちようび, どようび, いそがしい)
// ═══════════════════════════════════════════════════════════════════════

const M23_3_2_REVIEW = pickReviewAtoms("ja-m23-3-2-rev", M23_REVIEW_POOL, 4);

export const M23_3_2: LessonContent = {
  id: "ja-m23-3-2",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Shall we? (practice)",
  description:
    "Drill ませんか with day-of-week context. Introduce にちようび, どようび, いそがしい.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-3-2-info-open",
      "Weekend invitations",
      "Saturday, Sunday, and busy — three words that make weekend plans happen (or not).",
    ),
    // ── にちようび (Sunday) ──
    build(
      "ja-m23-3-2-build-nichiyoubi",
      "Pick the Japanese word for: Sunday",
      "にちようび",
      ["にちようび", "どようび", "しゅうまつ", "ひま"],
      ["にちようび"],
    ),
    listeningCompSentence({
      id: "ja-m23-3-2-lc-nichiyoubi",
      audioText: "にちようび",
      correctMeaningEn: "Sunday",
      distractorsEn: ["Saturday", "weekend", "free time"],
    }),
    // ── どようび (Saturday) ──
    build(
      "ja-m23-3-2-build-doyoubi",
      "Pick the Japanese word for: Saturday",
      "どようび",
      ["どようび", "にちようび", "しゅうまつ", "えいが"],
      ["どようび"],
    ),
    speaking("ja-m23-3-2-speak-doyoubi", "どようび", "Saturday"),
    // ── いそがしい (busy) ──
    build(
      "ja-m23-3-2-build-isogashii",
      "Pick the Japanese word for: Busy",
      "いそがしい",
      ["いそがしい", "ひま", "たのしい", "だいじょうぶ"],
      ["いそがしい"],
    ),
    listeningCompSentence({
      id: "ja-m23-3-2-lc-isogashii",
      audioText: "どようびは いそがしいです",
      correctMeaningEn: "Saturday is busy.",
      distractorsEn: [
        "Saturday is free.",
        "Saturday is fun.",
        "Sunday is busy.",
      ],
    }),
    // ── ませんか drills with days ──
    build(
      "ja-m23-3-2-build-masenka-nichiyou",
      "Ask: Won't you go to a movie on Sunday?",
      "にちようびに えいがを みませんか",
      ["にちようび", "に", "えいが", "を", "みませんか", "みましょう"],
      ["にちようび", "に", "えいが", "を", "みませんか"],
    ),
    sentenceMcq({
      id: "ja-m23-3-2-mcq-busy",
      prompt: "Someone invites you, but you're busy. What do you say?",
      correctKana: "すみません、どようびは いそがしいです。",
      distractorsKana: [
        "どようびは ひまです。",
        "どようびに いきましょう。",
        "どようびは たのしいです。",
      ],
      explanation: "いそがしいです = I'm busy. A polite way to decline.",
    }),
    cloze(
      "ja-m23-3-2-cloze-masenka",
      "どようびに かいものし",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ました"],
      "Won't you go shopping on Saturday?",
      "どようびに かいものしませんか。",
      "ませんか = polite invitation.",
    ),
    listeningCompSentence({
      id: "ja-m23-3-2-lc-decline",
      audioText: "すみません、にちようびは いそがしいです",
      correctMeaningEn: "Sorry, I'm busy on Sunday.",
      distractorsEn: [
        "I'm free on Sunday.",
        "Let's go on Sunday.",
        "Sunday is fun.",
      ],
    }),
    build(
      "ja-m23-3-2-build-hima",
      "Say: I'm free on Sunday.",
      "にちようびは ひまです",
      ["にちようび", "は", "ひま", "です", "いそがしい"],
      ["にちようび", "は", "ひま", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m23-3-2-lb-masenka-doyou",
      target: "どようびに パーティーに きませんか",
      tiles: ["どようび", "に", "パーティー", "に", "きませんか", "きましょう"],
      correctOrder: ["どようび", "に", "パーティー", "に", "きませんか"],
      promptEn: "Hear it, build it: 'Won't you come to the party on Saturday?'",
    }),
    translateStep({
      id: "ja-m23-3-2-translate",
      promptEn: "Shall we watch a movie on Sunday?",
      acceptedAnswers: [
        "にちようびに えいがを みませんか",
        "にちようびに えいがを みませんか。",
      ],
      audioText: "にちようびに えいがを みませんか",
    }),
    selfExplain({
      id: "ja-m23-3-2-self-explain",
      anchorLabel: "どようびに かいものしませんか",
      anchorAudioText: "どようびに かいものしませんか",
      question: "If someone says ませんか and you want to accept, what might you say?",
      rule: { text: "ぜひ or いいですね — enthusiastic acceptance. Then you might follow with ましょう to confirm the plan." },
      surface: { text: "Repeat ませんか back to confirm — 'Won't we?'" },
      distractor: { text: "Say はい、ません to agree with the negative." },
      ruleExplanation:
        "ませんか invites. To accept: ぜひ (by all means), いいですね (sounds good), はい、いきましょう (yes, let's go).",
    }),
    speaking(
      "ja-m23-3-2-speak-accept",
      "ぜひ いきましょう",
      "By all means, let's go!",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-3-2-rev-mcq-1", M23_3_2_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-3-2-rev-lc-1",
      audioText: M23_3_2_REVIEW[1].kana,
      correctMeaningEn: M23_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_3_2_REVIEW[2].meaningEn,
        M23_3_2_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[5].meaningEn,
      ],
    }),
    speaking("ja-m23-3-2-rev-speak-1", M23_3_2_REVIEW[2].kana, M23_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-3-2-rev", M23_3_2_REVIEW),
    infoStep(
      "ja-m23-3-2-info-end",
      "You can now invite friends to weekend plans and handle busy schedules",
      "ませんか with にちようび, どようび, いそがしい — real weekend planning.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_3_2.steps);
assertAnswerRotation(M23_3_2.steps, 1);
assertNoConsecutiveSame(M23_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-4-1 — ましょう vs ませんか interleave
// ═══════════════════════════════════════════════════════════════════════

const M23_4_1_REVIEW = pickReviewAtoms("ja-m23-4-1-rev", M23_REVIEW_POOL, 4);

export const M23_4_1: LessonContent = {
  id: "ja-m23-4-1",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Suggest vs invite I",
  description:
    "Interleave ましょう (confident) vs ませんか (tentative). Introduce だいじょうぶ, ぜひ.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-4-1-info-open",
      "Confident vs tentative",
      "ましょう assumes agreement. ませんか gives room to decline. Can you pick the right one?",
    ),
    // ── だいじょうぶ (okay/fine) ──
    build(
      "ja-m23-4-1-build-daijoubu",
      "Pick the Japanese word for: Okay / Fine",
      "だいじょうぶ",
      ["だいじょうぶ", "ぜひ", "ひま", "いそがしい"],
      ["だいじょうぶ"],
    ),
    listeningCompSentence({
      id: "ja-m23-4-1-lc-daijoubu",
      audioText: "だいじょうぶです",
      correctMeaningEn: "It's okay / I'm fine.",
      distractorsEn: ["I'm busy.", "By all means.", "I'm free."],
    }),
    // ── ぜひ (by all means) ──
    build(
      "ja-m23-4-1-build-zehi",
      "Pick the Japanese word for: By all means",
      "ぜひ",
      ["ぜひ", "だいじょうぶ", "きっと", "たのしい"],
      ["ぜひ"],
    ),
    speaking("ja-m23-4-1-speak-zehi", "ぜひ", "By all means"),
    // ── Discrimination drills ──
    sentenceMcq({
      id: "ja-m23-4-1-mcq-mashou-vs-masenka",
      prompt: "You're with close friends. Which is most natural for 'Let's eat'?",
      correctKana: "たべましょう。",
      distractorsKana: [
        "たべませんか。",
        "たべます。",
        "たべません。",
      ],
      explanation: "ましょう is confident — natural with friends. ませんか is softer (for acquaintances).",
    }),
    cloze(
      "ja-m23-4-1-cloze-masenka",
      "いっしょに コーヒーを のみ",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ません"],
      "Won't you have coffee with me? (polite)",
      "いっしょに コーヒーを のみませんか。",
      "ませんか = polite invitation to someone you want to give room to decline.",
    ),
    build(
      "ja-m23-4-1-build-mashou-kaeri",
      "Your friend is tired. Suggest: Let's go home.",
      "かえりましょう",
      ["かえりましょう", "かえりませんか", "かえります", "かえりました"],
      ["かえりましょう"],
    ),
    listeningCompSentence({
      id: "ja-m23-4-1-lc-masenka-eiga",
      audioText: "えいがを みませんか",
      correctMeaningEn: "Shall we watch a movie?",
      distractorsEn: [
        "Let's watch a movie.",
        "I watch movies.",
        "I don't watch movies.",
      ],
    }),
    cloze(
      "ja-m23-4-1-cloze-mashou",
      "はやく いき",
      "。",
      "ましょう",
      ["ましょう", "ませんか", "ます", "ません"],
      "Let's go quickly.",
      "はやく いきましょう。",
      "ましょう = confident suggestion with friends.",
    ),
    build(
      "ja-m23-4-1-build-accept",
      "Accept an invitation: By all means, let's go.",
      "ぜひ いきましょう",
      ["ぜひ", "いきましょう", "いきませんか", "いきます"],
      ["ぜひ", "いきましょう"],
    ),
    listeningBuildSentence({
      id: "ja-m23-4-1-lb-masenka",
      target: "しゅうまつに さんぽしませんか",
      tiles: ["しゅうまつ", "に", "さんぽしませんか", "さんぽしましょう", "さんぽします"],
      correctOrder: ["しゅうまつ", "に", "さんぽしませんか"],
      promptEn: "Hear it, build it: 'Shall we take a walk on the weekend?'",
    }),
    sentenceMcq({
      id: "ja-m23-4-1-mcq-context",
      prompt: "A coworker you don't know well invites you. Which response works?",
      correctKana: "ぜひ、いきましょう。",
      distractorsKana: [
        "ぜひ、いきます。",
        "だいじょうぶ。",
        "ません。",
      ],
      explanation: "ぜひ + ましょう = enthusiastic acceptance. いきます alone is just a statement.",
    }),
    translateStep({
      id: "ja-m23-4-1-translate",
      promptEn: "Won't you come to the party on Saturday?",
      acceptedAnswers: [
        "どようびに パーティーに きませんか",
        "どようびに パーティーに きませんか。",
      ],
      audioText: "どようびに パーティーに きませんか",
    }),
    selfExplain({
      id: "ja-m23-4-1-self-explain",
      anchorLabel: "ましょう vs ませんか — confidence level",
      anchorAudioText: "いきましょう",
      question: "You're inviting your boss to lunch. Which form is better?",
      rule: { text: "ませんか — it's more polite and tentative, giving your boss room to decline without pressure." },
      surface: { text: "ましょう — it shows you're confident about the plan." },
      distractor: { text: "Either works — Japanese doesn't distinguish formality levels in suggestions." },
      ruleExplanation:
        "ませんか is softer and more appropriate for people you should be polite to. ましょう is for friends/equals.",
    }),
    speaking(
      "ja-m23-4-1-speak-masenka",
      "いっしょに ひるごはんを たべませんか",
      "Won't you have lunch with me?",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-4-1-rev-mcq-1", M23_4_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-4-1-rev-lc-1",
      audioText: M23_4_1_REVIEW[1].kana,
      correctMeaningEn: M23_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_4_1_REVIEW[2].meaningEn,
        M23_4_1_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[6].meaningEn,
      ],
    }),
    speaking("ja-m23-4-1-rev-speak-1", M23_4_1_REVIEW[2].kana, M23_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-4-1-rev", M23_4_1_REVIEW),
    infoStep(
      "ja-m23-4-1-info-end",
      "You can now choose between confident suggestions and polite invitations",
      "ましょう vs ませんか — social register mastered.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_4_1.steps);
assertAnswerRotation(M23_4_1.steps, 1);
assertNoConsecutiveSame(M23_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-4-2 — Interleave II (all patterns)
// ═══════════════════════════════════════════════════════════════════════

const M23_4_2_REVIEW = pickReviewAtoms("ja-m23-4-2-rev", M23_REVIEW_POOL, 4);

export const M23_4_2: LessonContent = {
  id: "ja-m23-4-2",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Suggest vs invite II",
  description:
    "Full interleave: じょうず/へた + ましょう/ませんか with きっと, たのしい, たのしみ.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-4-2-info-open",
      "All patterns combined",
      "Skills, suggestions, and invitations — all four M23 grammar points in one lesson. Three new words to enrich the conversation.",
    ),
    // ── きっと (surely) ──
    build(
      "ja-m23-4-2-build-kitto",
      "Pick the Japanese word for: Surely / Definitely",
      "きっと",
      ["きっと", "ぜひ", "だいじょうぶ", "たのしい"],
      ["きっと"],
    ),
    listeningCompSentence({
      id: "ja-m23-4-2-lc-kitto",
      audioText: "きっと たのしいです",
      correctMeaningEn: "It's surely fun.",
      distractorsEn: ["It's not fun.", "It's okay.", "By all means."],
    }),
    // ── たのしい (fun) ──
    build(
      "ja-m23-4-2-build-tanoshii",
      "Pick the Japanese word for: Fun / Enjoyable",
      "たのしい",
      ["たのしい", "きっと", "ぜひ", "いそがしい"],
      ["たのしい"],
    ),
    speaking("ja-m23-4-2-speak-tanoshii", "たのしい", "Fun / Enjoyable"),
    // ── たのしみ (looking forward to) ──
    build(
      "ja-m23-4-2-build-tanoshimi",
      "Pick the Japanese word for: Looking forward to",
      "たのしみ",
      ["たのしみ", "たのしい", "やくそく", "ぜひ"],
      ["たのしみ"],
    ),
    listeningCompSentence({
      id: "ja-m23-4-2-lc-tanoshimi",
      audioText: "たのしみです",
      correctMeaningEn: "I'm looking forward to it.",
      distractorsEn: ["It's fun.", "I'm busy.", "It's okay."],
    }),
    // ── Mixed drills ──
    sentenceMcq({
      id: "ja-m23-4-2-mcq-jouzu",
      prompt: "Which means 'Takeshi is good at driving.'?",
      correctKana: "たけしさんは うんてんが じょうずです。",
      distractorsKana: [
        "たけしさんは うんてんが へたです。",
        "たけしさんは うんてんしましょう。",
        "たけしさんは うんてんしませんか。",
      ],
      explanation: "うんてんが じょうずです = good at driving.",
    }),
    cloze(
      "ja-m23-4-2-cloze-mashou",
      "いっしょに おどり",
      "。",
      "ましょう",
      ["ましょう", "ませんか", "ます", "ません"],
      "Let's dance together.",
      "いっしょに おどりましょう。",
      "ましょう = let's (confident).",
    ),
    build(
      "ja-m23-4-2-build-masenka-utai",
      "Ask: Won't you sing with me?",
      "いっしょに うたいませんか",
      ["いっしょに", "うたいませんか", "うたいましょう", "うたいます"],
      ["いっしょに", "うたいませんか"],
    ),
    listeningBuildSentence({
      id: "ja-m23-4-2-lb-jouzu",
      target: "ゆきさんは ピアノを ひくのが じょうずです",
      tiles: ["ゆきさん", "は", "ピアノ", "を", "ひくのが", "じょうず", "です", "へた"],
      correctOrder: ["ゆきさん", "は", "ピアノ", "を", "ひくのが", "じょうず", "です"],
      promptEn: "Hear it, build it: 'Yuki is good at playing the piano.'",
    }),
    cloze(
      "ja-m23-4-2-cloze-noga",
      "すいえい",
      " へたです。",
      "のが",
      ["のが", "が", "は", "を"],
      "Bad at swimming.",
      "すいえいのが へたです。",
      "のが nominalizes — 'the act of swimming.'",
    ),
    sentenceMcq({
      id: "ja-m23-4-2-mcq-tanoshimi",
      prompt: "Someone invites you and you accept happily. Which response?",
      correctKana: "ぜひ! たのしみです。",
      distractorsKana: [
        "すみません、いそがしいです。",
        "だいじょうぶです。",
        "きっと へたです。",
      ],
      explanation: "ぜひ = by all means. たのしみです = I'm looking forward to it.",
    }),
    translateStep({
      id: "ja-m23-4-2-translate",
      promptEn: "She is good at singing.",
      acceptedAnswers: [
        "かのじょは うたうのが じょうずです",
        "かのじょは うたうのが じょうずです。",
      ],
      audioText: "かのじょは うたうのが じょうずです",
    }),
    selfExplain({
      id: "ja-m23-4-2-self-explain",
      anchorLabel: "Four M23 patterns interleaved",
      anchorAudioText: "いっしょに おどりましょう",
      question: "How are のがじょうず and のがすき similar?",
      rule: { text: "Both use のが to nominalize a verb. のがじょうず = good at doing. のがすき = like doing. Same の-nominalization pattern, different adjective." },
      surface: { text: "They mean the same thing — じょうず and すき are synonyms." },
      distractor: { text: "のがすき uses a different の than のがじょうず." },
      ruleExplanation:
        "のが pattern: verb + のが + な-adjective + です. Works with すき, きらい, じょうず, へた.",
    }),
    speaking(
      "ja-m23-4-2-speak-tanoshimi",
      "たのしみです",
      "I'm looking forward to it.",
    ),
    // ── Review tail ──
    speaking("ja-m23-4-2-rev-speak-1", M23_4_2_REVIEW[0].kana, M23_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m23-4-2-rev-lc-1",
      audioText: M23_4_2_REVIEW[1].kana,
      correctMeaningEn: M23_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_4_2_REVIEW[2].meaningEn,
        M23_4_2_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[7].meaningEn,
      ],
    }),
    vocabMcq("ja-m23-4-2-rev-mcq-1", M23_4_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M23_REVIEW_POOL),
    reviewMatchPairs("ja-m23-4-2-rev", M23_4_2_REVIEW),
    infoStep(
      "ja-m23-4-2-info-end",
      "You can now talk about skills, make suggestions, and respond to invitations",
      "All four M23 patterns interleaved — じょうず/へた + ましょう/ませんか with real conversation vocab.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_4_2.steps);
assertAnswerRotation(M23_4_2.steps, 1);
assertNoConsecutiveSame(M23_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-5-1 — Full interleave drill I
// ═══════════════════════════════════════════════════════════════════════

const M23_5_1_REVIEW = pickReviewAtoms("ja-m23-5-1-rev", M23_REVIEW_POOL, 4);

export const M23_5_1: LessonContent = {
  id: "ja-m23-5-1",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill I",
  description:
    "Rotate all four M23 patterns: skills + suggestions + invitations in production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-5-1-info-open",
      "Full rotation",
      "All four patterns mixed: talk about skills, suggest activities, invite politely. Production-heavy.",
    ),
    cloze(
      "ja-m23-5-1-cloze-noga",
      "おどる",
      " じょうずです。",
      "のが",
      ["のが", "が", "は", "を"],
      "Good at dancing.",
      "おどるのが じょうずです。",
      "のが nominalizes the verb.",
    ),
    build(
      "ja-m23-5-1-build-masenka",
      "Ask: Won't you come to the party?",
      "パーティーに きませんか",
      ["パーティー", "に", "きませんか", "きましょう", "きます"],
      ["パーティー", "に", "きませんか"],
    ),
    sentenceMcq({
      id: "ja-m23-5-1-mcq-heta",
      prompt: "Which means 'I'm bad at playing piano.'?",
      correctKana: "わたしは ピアノを ひくのが へたです。",
      distractorsKana: [
        "わたしは ピアノを ひくのが じょうずです。",
        "わたしは ピアノを ひきましょう。",
        "わたしは ピアノを ひきませんか。",
      ],
      explanation: "ひくのが へたです = bad at playing.",
    }),
    listeningCompSentence({
      id: "ja-m23-5-1-lc-mashou",
      audioText: "いっしょに えいがを みましょう",
      correctMeaningEn: "Let's watch a movie together.",
      distractorsEn: [
        "Shall we watch a movie?",
        "I watch movies.",
        "I don't watch movies.",
      ],
    }),
    cloze(
      "ja-m23-5-1-cloze-mashou",
      "はやく たべ",
      "。",
      "ましょう",
      ["ましょう", "ませんか", "ます", "ました"],
      "Let's eat quickly.",
      "はやく たべましょう。",
      "ましょう = let's (confident suggestion).",
    ),
    build(
      "ja-m23-5-1-build-jouzu-suiei",
      "Say: He is good at swimming.",
      "かれは すいえいのが じょうずです",
      ["かれ", "は", "すいえい", "のが", "じょうず", "です", "へた"],
      ["かれ", "は", "すいえい", "のが", "じょうず", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m23-5-1-lb-masenka",
      target: "しゅうまつに えいがを みませんか",
      tiles: ["しゅうまつ", "に", "えいが", "を", "みませんか", "みましょう", "みます"],
      correctOrder: ["しゅうまつ", "に", "えいが", "を", "みませんか"],
      promptEn: "Hear it, build it: 'Shall we watch a movie on the weekend?'",
    }),
    sentenceMcq({
      id: "ja-m23-5-1-mcq-mashou-vs",
      prompt: "Which is a tentative invitation?",
      correctKana: "いっしょに たべませんか。",
      distractorsKana: [
        "いっしょに たべましょう。",
        "いっしょに たべます。",
        "いっしょに たべました。",
      ],
      explanation: "ませんか is tentative. ましょう is confident.",
    }),
    cloze(
      "ja-m23-5-1-cloze-masenka",
      "にちようびに さんぽし",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ました"],
      "Shall we take a walk on Sunday?",
      "にちようびに さんぽしませんか。",
      "ませんか = polite invitation.",
    ),
    build(
      "ja-m23-5-1-build-heta-ryouri",
      "Say: I'm bad at cooking.",
      "わたしは りょうりが へたです",
      ["わたし", "は", "りょうり", "が", "へた", "です", "じょうず"],
      ["わたし", "は", "りょうり", "が", "へた", "です"],
    ),
    listeningCompSentence({
      id: "ja-m23-5-1-lc-jouzu-utau",
      audioText: "かのじょは うたうのが じょうずです",
      correctMeaningEn: "She is good at singing.",
      distractorsEn: [
        "She is bad at singing.",
        "She likes singing.",
        "She sings a lot.",
      ],
    }),
    translateStep({
      id: "ja-m23-5-1-translate",
      promptEn: "Let's go to the party together.",
      acceptedAnswers: [
        "いっしょに パーティーに いきましょう",
        "いっしょに パーティーに いきましょう。",
      ],
      audioText: "いっしょに パーティーに いきましょう",
    }),
    selfExplain({
      id: "ja-m23-5-1-self-explain",
      anchorLabel: "じょうず/へた + ましょう/ませんか",
      anchorAudioText: "すいえいのが じょうずです",
      question: "Can you use じょうず with ましょう in one sentence?",
      rule: { text: "Yes — e.g., 'He's good at swimming, so let's go swimming.' They serve different functions: じょうず describes ability, ましょう suggests an action." },
      surface: { text: "No — じょうず and ましょう are the same grammar pattern and can't combine." },
      distractor: { text: "Yes — じょうずましょう is a combined form meaning 'let's be good at.'" },
      ruleExplanation:
        "じょうず/へた describe ability. ましょう/ませんか suggest or invite. They can appear in the same conversation but serve different roles.",
    }),
    speaking(
      "ja-m23-5-1-speak-full",
      "かれは すいえいのが じょうずです",
      "He is good at swimming.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-5-1-rev-mcq-1", M23_5_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-5-1-rev-lc-1",
      audioText: M23_5_1_REVIEW[1].kana,
      correctMeaningEn: M23_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_5_1_REVIEW[2].meaningEn,
        M23_5_1_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[8].meaningEn,
      ],
    }),
    speaking("ja-m23-5-1-rev-speak-1", M23_5_1_REVIEW[2].kana, M23_5_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-5-1-rev", M23_5_1_REVIEW),
    infoStep(
      "ja-m23-5-1-info-end",
      "You can now mix skill talk with suggestions and invitations",
      "Four patterns rotating smoothly — skills + proposals in conversation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_5_1.steps);
assertAnswerRotation(M23_5_1.steps, 1);
assertNoConsecutiveSame(M23_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-5-2 — Full interleave drill II
// ═══════════════════════════════════════════════════════════════════════

const M23_5_2_REVIEW = pickReviewAtoms("ja-m23-5-2-rev", M23_REVIEW_POOL, 4);

export const M23_5_2: LessonContent = {
  id: "ja-m23-5-2",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Mixed drill II",
  description:
    "Production-heavy rotation of all M23 grammar in real conversation contexts.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-5-2-info-open",
      "Full production rotation",
      "All M23 patterns at production level — build, speak, translate.",
    ),
    build(
      "ja-m23-5-2-build-jouzu",
      "Say: Yuki is good at dancing.",
      "ゆきさんは おどるのが じょうずです",
      ["ゆきさん", "は", "おどるのが", "じょうず", "です", "へた"],
      ["ゆきさん", "は", "おどるのが", "じょうず", "です"],
    ),
    cloze(
      "ja-m23-5-2-cloze-mashou",
      "いっしょに うたい",
      "。",
      "ましょう",
      ["ましょう", "ませんか", "ます", "ません"],
      "Let's sing together.",
      "いっしょに うたいましょう。",
      "ましょう = let's (confident).",
    ),
    speaking(
      "ja-m23-5-2-speak-masenka",
      "どようびに えいがを みませんか",
      "Shall we watch a movie on Saturday?",
    ),
    sentenceMcq({
      id: "ja-m23-5-2-mcq-heta",
      prompt: "Which means 'I'm bad at driving.'?",
      correctKana: "わたしは うんてんが へたです。",
      distractorsKana: [
        "わたしは うんてんが じょうずです。",
        "わたしは うんてんしましょう。",
        "わたしは うんてんします。",
      ],
      explanation: "うんてんが へたです = bad at driving.",
    }),
    build(
      "ja-m23-5-2-build-masenka-odori",
      "Ask: Won't you dance together?",
      "いっしょに おどりませんか",
      ["いっしょに", "おどりませんか", "おどりましょう", "おどります"],
      ["いっしょに", "おどりませんか"],
    ),
    listeningCompSentence({
      id: "ja-m23-5-2-lc-kitto",
      audioText: "きっと たのしいです",
      correctMeaningEn: "It's surely fun.",
      distractorsEn: [
        "It's not fun.",
        "I'm looking forward to it.",
        "It's okay.",
      ],
    }),
    cloze(
      "ja-m23-5-2-cloze-noga",
      "ピアノを ひく",
      " じょうずです。",
      "のが",
      ["のが", "が", "は", "を"],
      "Good at playing piano.",
      "ピアノを ひくのが じょうずです。",
      "のが nominalizes the verb phrase.",
    ),
    build(
      "ja-m23-5-2-build-tanoshimi",
      "Say: I'm looking forward to the party.",
      "パーティーが たのしみです",
      ["パーティー", "が", "たのしみ", "です", "たのしい", "は"],
      ["パーティー", "が", "たのしみ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m23-5-2-lb-heta",
      target: "わたしは りょうりが へたです",
      tiles: ["わたし", "は", "りょうり", "が", "へた", "です", "じょうず"],
      correctOrder: ["わたし", "は", "りょうり", "が", "へた", "です"],
      promptEn: "Hear it, build it: 'I'm bad at cooking.'",
    }),
    sentenceMcq({
      id: "ja-m23-5-2-mcq-accept",
      prompt: "Someone says えいがを みませんか. You want to accept. What do you say?",
      correctKana: "ぜひ、みましょう!",
      distractorsKana: [
        "みません。",
        "みます。",
        "みませんか。",
      ],
      explanation: "ぜひ + ましょう = enthusiastic acceptance.",
    }),
    cloze(
      "ja-m23-5-2-cloze-masenka",
      "いっしょに ひるごはんを たべ",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ません"],
      "Won't you have lunch together?",
      "いっしょに ひるごはんを たべませんか。",
      "ませんか = polite invitation.",
    ),
    translateStep({
      id: "ja-m23-5-2-translate",
      promptEn: "Yuki is good at playing the piano.",
      acceptedAnswers: [
        "ゆきさんは ピアノを ひくのが じょうずです",
        "ゆきさんは ピアノを ひくのが じょうずです。",
      ],
      audioText: "ゆきさんは ピアノを ひくのが じょうずです",
    }),
    selfExplain({
      id: "ja-m23-5-2-self-explain",
      anchorLabel: "All M23 patterns in production",
      anchorAudioText: "おどるのが じょうずです",
      question: "Which response word signals enthusiastic agreement to an invitation?",
      rule: { text: "ぜひ — it means 'by all means' and shows genuine enthusiasm for accepting." },
      surface: { text: "だいじょうぶ — it means 'okay' and shows agreement." },
      distractor: { text: "きっと — it means 'surely' and confirms the plan." },
      ruleExplanation:
        "ぜひ = by all means (enthusiastic yes). だいじょうぶ = it's fine (neutral). きっと = surely (prediction, not acceptance).",
    }),
    speaking(
      "ja-m23-5-2-speak-jouzu",
      "ゆきさんは おどるのが じょうずです",
      "Yuki is good at dancing.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-5-2-rev-mcq-1", M23_5_2_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-5-2-rev-lc-1",
      audioText: M23_5_2_REVIEW[1].kana,
      correctMeaningEn: M23_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_5_2_REVIEW[2].meaningEn,
        M23_5_2_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[9].meaningEn,
      ],
    }),
    speaking("ja-m23-5-2-rev-speak-1", M23_5_2_REVIEW[2].kana, M23_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-5-2-rev", M23_5_2_REVIEW),
    infoStep(
      "ja-m23-5-2-info-end",
      "You own every M23 pattern in production",
      "Skills, suggestions, invitations — all in rotation and ready for conversation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_5_2.steps);
assertAnswerRotation(M23_5_2.steps, 1);
assertNoConsecutiveSame(M23_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-6-1 — Production I
// ═══════════════════════════════════════════════════════════════════════

const M23_6_1_REVIEW = pickReviewAtoms("ja-m23-6-1-rev", M23_REVIEW_POOL, 4);

export const M23_6_1: LessonContent = {
  id: "ja-m23-6-1",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Capability production I",
  description:
    "Production-heavy: build and speak all M23 patterns from English prompts.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-6-1-info-open",
      "Full production",
      "Build, speak, and translate everything from M23 — no recognition crutches.",
    ),
    build(
      "ja-m23-6-1-build-1",
      "Say: She is good at swimming.",
      "かのじょは すいえいのが じょうずです",
      ["かのじょ", "は", "すいえい", "のが", "じょうず", "です", "へた"],
      ["かのじょ", "は", "すいえい", "のが", "じょうず", "です"],
    ),
    speaking(
      "ja-m23-6-1-speak-1",
      "いっしょに かいものしましょう",
      "Let's go shopping together.",
    ),
    build(
      "ja-m23-6-1-build-2",
      "Ask: Won't you come to the party on Sunday?",
      "にちようびに パーティーに きませんか",
      ["にちようび", "に", "パーティー", "に", "きませんか", "きましょう"],
      ["にちようび", "に", "パーティー", "に", "きませんか"],
    ),
    listeningBuildSentence({
      id: "ja-m23-6-1-lb-1",
      target: "うたうのが じょうずです",
      tiles: ["うたう", "のが", "じょうず", "です", "へた", "が"],
      correctOrder: ["うたう", "のが", "じょうず", "です"],
      promptEn: "Hear it, build it: 'Good at singing.'",
    }),
    speaking(
      "ja-m23-6-1-speak-2",
      "しゅうまつに えいがを みませんか",
      "Shall we watch a movie on the weekend?",
    ),
    build(
      "ja-m23-6-1-build-3",
      "Say: I'm bad at dancing.",
      "わたしは おどるのが へたです",
      ["わたし", "は", "おどるのが", "へた", "です", "じょうず"],
      ["わたし", "は", "おどるのが", "へた", "です"],
    ),
    sentenceMcq({
      id: "ja-m23-6-1-mcq-1",
      prompt: "How do you enthusiastically accept ませんか?",
      correctKana: "ぜひ! たのしみです。",
      distractorsKana: [
        "だいじょうぶです。",
        "いそがしいです。",
        "ません。",
      ],
      explanation: "ぜひ + たのしみです = by all means, I'm looking forward to it.",
    }),
    build(
      "ja-m23-6-1-build-4",
      "Say: Let's study Japanese together.",
      "いっしょに にほんごを べんきょうしましょう",
      ["いっしょに", "にほんご", "を", "べんきょうしましょう", "べんきょうしませんか"],
      ["いっしょに", "にほんご", "を", "べんきょうしましょう"],
    ),
    translateStep({
      id: "ja-m23-6-1-translate-1",
      promptEn: "I'm bad at cooking.",
      acceptedAnswers: [
        "わたしは りょうりが へたです",
        "わたしは りょうりが へたです。",
        "りょうりが へたです",
        "りょうりが へたです。",
      ],
      audioText: "わたしは りょうりが へたです",
    }),
    speaking(
      "ja-m23-6-1-speak-3",
      "ぜひ いきましょう",
      "By all means, let's go!",
    ),
    listeningCompSentence({
      id: "ja-m23-6-1-lc-1",
      audioText: "きっと たのしいですよ",
      correctMeaningEn: "It's surely going to be fun!",
      distractorsEn: [
        "It's not fun.",
        "I'm busy.",
        "I'm looking forward to it.",
      ],
    }),
    build(
      "ja-m23-6-1-build-5",
      "Say: It'll surely be fun. I'm looking forward to it.",
      "きっと たのしいです。たのしみです",
      ["きっと", "たのしい", "です", "たのしみ", "です"],
      ["きっと", "たのしい", "です"],
    ),
    selfExplain({
      id: "ja-m23-6-1-self-explain",
      anchorLabel: "Production mastery",
      anchorAudioText: "ぜひ いきましょう",
      question: "If you're asked ませんか but are busy, what's a polite decline?",
      rule: { text: "すみません、[day]は いそがしいです — apologize and explain you're busy. Don't just say いいえ." },
      surface: { text: "Say ません to agree with the negative question." },
      distractor: { text: "Say だいじょうぶ to decline politely." },
      ruleExplanation:
        "Polite decline: すみません + reason (いそがしいです / やくそくが あります). Never a bare 'no.'",
    }),
    speaking(
      "ja-m23-6-1-speak-4",
      "すみません、にちようびは いそがしいです",
      "Sorry, I'm busy on Sunday.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-6-1-rev-mcq-1", M23_6_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-6-1-rev-lc-1",
      audioText: M23_6_1_REVIEW[1].kana,
      correctMeaningEn: M23_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_6_1_REVIEW[2].meaningEn,
        M23_6_1_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[10].meaningEn,
      ],
    }),
    speaking("ja-m23-6-1-rev-speak-1", M23_6_1_REVIEW[2].kana, M23_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-6-1-rev", M23_6_1_REVIEW),
    infoStep(
      "ja-m23-6-1-info-end",
      "You can produce all M23 patterns from English prompts",
      "Skills, suggestions, invitations, and responses — all in full production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_6_1.steps);
assertAnswerRotation(M23_6_1.steps, 1);
assertNoConsecutiveSame(M23_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-6-2 — Production II
// ═══════════════════════════════════════════════════════════════════════

const M23_6_2_REVIEW = pickReviewAtoms("ja-m23-6-2-rev", M23_REVIEW_POOL, 4);

export const M23_6_2: LessonContent = {
  id: "ja-m23-6-2",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Capability production II",
  description:
    "Final production drill — every M23 pattern in conversation context.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-6-2-info-open",
      "Final production",
      "Last production round. Every M23 pattern — skills, suggestions, invitations — in flowing conversation.",
    ),
    build(
      "ja-m23-6-2-build-1",
      "Say: Takeshi is good at singing and dancing.",
      "たけしさんは うたうのが じょうずです",
      ["たけしさん", "は", "うたう", "のが", "じょうず", "です", "へた"],
      ["たけしさん", "は", "うたう", "のが", "じょうず", "です"],
    ),
    speaking(
      "ja-m23-6-2-speak-1",
      "いっしょに おどりましょう",
      "Let's dance together.",
    ),
    cloze(
      "ja-m23-6-2-cloze-masenka",
      "どようびに さんぽし",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ません"],
      "Won't you take a walk on Saturday?",
      "どようびに さんぽしませんか。",
      "ませんか = polite invitation.",
    ),
    build(
      "ja-m23-6-2-build-2",
      "Say: I'm bad at swimming, but I like it.",
      "すいえいのが へたですが、すきです",
      ["すいえい", "のが", "へた", "です", "が", "すき", "です"],
      ["すいえい", "のが", "へた", "です", "が", "すき", "です"],
    ),
    listeningCompSentence({
      id: "ja-m23-6-2-lc-1",
      audioText: "パーティーが たのしみです",
      correctMeaningEn: "I'm looking forward to the party.",
      distractorsEn: [
        "The party is fun.",
        "I'm busy at the party.",
        "Let's have a party.",
      ],
    }),
    sentenceMcq({
      id: "ja-m23-6-2-mcq-1",
      prompt: "Which politely invites someone to go shopping?",
      correctKana: "いっしょに かいものしませんか。",
      distractorsKana: [
        "いっしょに かいものしましょう。",
        "いっしょに かいものします。",
        "いっしょに かいものしました。",
      ],
      explanation: "ませんか is the polite invitation form.",
    }),
    build(
      "ja-m23-6-2-build-3",
      "Say: Let's have a party on the weekend.",
      "しゅうまつに パーティーを しましょう",
      ["しゅうまつ", "に", "パーティー", "を", "しましょう", "しませんか"],
      ["しゅうまつ", "に", "パーティー", "を", "しましょう"],
    ),
    cloze(
      "ja-m23-6-2-cloze-noga",
      "うんてん",
      " へたです。",
      "が",
      ["が", "は", "を", "のが"],
      "Bad at driving.",
      "うんてんが へたです。",
      "が marks the skill.",
    ),
    speaking(
      "ja-m23-6-2-speak-2",
      "たけしさんは ピアノを ひくのが じょうずです",
      "Takeshi is good at playing the piano.",
    ),
    listeningBuildSentence({
      id: "ja-m23-6-2-lb-1",
      target: "ぜひ いきましょう。たのしみです",
      tiles: ["ぜひ", "いきましょう", "たのしみ", "です", "いきませんか"],
      correctOrder: ["ぜひ", "いきましょう"],
      promptEn: "Hear it, build it: 'By all means, let's go!'",
    }),
    translateStep({
      id: "ja-m23-6-2-translate",
      promptEn: "Won't you come to the party on Saturday?",
      acceptedAnswers: [
        "どようびに パーティーに きませんか",
        "どようびに パーティーに きませんか。",
      ],
      audioText: "どようびに パーティーに きませんか",
    }),
    selfExplain({
      id: "ja-m23-6-2-self-explain",
      anchorLabel: "M23 production mastery",
      anchorAudioText: "いっしょに おどりましょう",
      question: "You've learned four patterns this module. Which two are invitation/suggestion forms?",
      rule: { text: "ましょう (let's — confident) and ませんか (shall we? — polite). Both replace ます to suggest doing something." },
      surface: { text: "じょうず and へた — they invite someone to practice a skill." },
      distractor: { text: "のが and ましょう — のが creates the suggestion." },
      ruleExplanation:
        "ましょう = let's (confident suggestion). ませんか = shall we? (polite invitation). じょうず/へた are ability descriptions, not invitations.",
    }),
    speaking(
      "ja-m23-6-2-speak-3",
      "きっと たのしいですよ",
      "It'll surely be fun!",
    ),
    // ── Review tail ──
    speaking("ja-m23-6-2-rev-speak-1", M23_6_2_REVIEW[0].kana, M23_6_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m23-6-2-rev-lc-1",
      audioText: M23_6_2_REVIEW[1].kana,
      correctMeaningEn: M23_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_6_2_REVIEW[2].meaningEn,
        M23_6_2_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[11].meaningEn,
      ],
    }),
    vocabMcq("ja-m23-6-2-rev-mcq-1", M23_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M23_REVIEW_POOL),
    reviewMatchPairs("ja-m23-6-2-rev", M23_6_2_REVIEW),
    infoStep(
      "ja-m23-6-2-info-end",
      "You can now talk about skills, suggest activities, and respond to invitations",
      "All M23 patterns in production — じょうず/へた, ましょう, ませんか, and real conversation responses.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_6_2.steps);
assertAnswerRotation(M23_6_2.steps, 1);
assertNoConsecutiveSame(M23_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-STORY — Inviting friends to activities
// ═══════════════════════════════════════════════════════════════════════

export const M23_STORY: LessonContent = {
  id: "ja-m23-story",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Weekend plans",
  description:
    "Listen to friends discuss their skills and plan weekend activities. Answer comprehension questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m23-story-info-open",
      "Story time — Weekend plans",
      "ゆき and たけし are making plans for the weekend. They talk about what they're good at and invite each other to activities.",
    ),
    dialogueListen({
      id: "ja-m23-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "たけしさんは ピアノを ひくのが じょうずですね。" },
        { speaker: "たけし", kana: "ありがとうございます。でも、おどるのは へたです。" },
        { speaker: "ゆき", kana: "しゅうまつに パーティーが ありますよ。いっしょに いきませんか。" },
        { speaker: "たけし", kana: "ぜひ! たのしみです。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "What is Takeshi good at?",
          correctText: "Playing the piano.",
          distractors: ["Dancing.", "Singing.", "Swimming."],
          explanation: "ピアノを ひくのが じょうずです = good at playing piano.",
        },
        {
          id: "s1-q2",
          prompt: "How does Takeshi respond to the invitation?",
          correctText: "He enthusiastically accepts.",
          distractors: ["He declines.", "He says he's busy.", "He says maybe."],
          explanation: "ぜひ! たのしみです = by all means! I'm looking forward to it.",
        },
      ],
    }),
    build(
      "ja-m23-story-build-1",
      "Say: He is good at playing the piano.",
      "ピアノを ひくのが じょうずです",
      ["ピアノ", "を", "ひくのが", "じょうず", "です", "へた"],
      ["ピアノ", "を", "ひくのが", "じょうず", "です"],
    ),
    sentenceMcq({
      id: "ja-m23-story-mcq-1",
      prompt: "What is Takeshi bad at?",
      correctKana: "Dancing.",
      distractorsKana: ["Piano.", "Singing.", "Swimming."],
      explanation: "おどるのは へたです = bad at dancing.",
    }),
    dialogueListen({
      id: "ja-m23-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "にちようびは ひまですか。" },
        { speaker: "たけし", kana: "はい、ひまです。なにを しますか。" },
        { speaker: "ゆき", kana: "えいがを みませんか。きっと たのしいですよ。" },
        { speaker: "たけし", kana: "いいですね! いっしょに いきましょう。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "Is Takeshi free on Sunday?",
          correctText: "Yes, he's free.",
          distractors: ["No, he's busy.", "He has an appointment.", "He doesn't say."],
          explanation: "はい、ひまです = yes, I'm free.",
        },
        {
          id: "s2-q2",
          prompt: "What does Yuki suggest?",
          correctText: "Watching a movie.",
          distractors: ["Going shopping.", "Taking a walk.", "Having a party."],
          explanation: "えいがを みませんか = shall we watch a movie?",
        },
      ],
    }),
    cloze(
      "ja-m23-story-cloze-1",
      "えいがを み",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ました"],
      "Shall we watch a movie?",
      "えいがを みませんか。",
      "ませんか = polite invitation.",
    ),
    listeningBuildSentence({
      id: "ja-m23-story-lb-1",
      target: "いっしょに いきましょう",
      tiles: ["いっしょに", "いきましょう", "いきませんか", "いきます"],
      correctOrder: ["いっしょに", "いきましょう"],
      promptEn: "Hear it, build it: 'Let's go together.'",
    }),
    listeningCompSentence({
      id: "ja-m23-story-lc-1",
      audioText: "きっと たのしいですよ",
      correctMeaningEn: "It'll surely be fun!",
      distractorsEn: [
        "It's not fun.",
        "I'm busy.",
        "It's okay.",
      ],
    }),
    speaking(
      "ja-m23-story-speak-1",
      "ぜひ いきましょう",
      "By all means, let's go!",
    ),
    sentenceMcq({
      id: "ja-m23-story-mcq-summary",
      prompt: "What are Yuki and Takeshi doing on Sunday?",
      correctKana: "Watching a movie together.",
      distractorsKana: ["Going to a party.", "Going shopping.", "Taking a walk."],
      explanation: "They agreed on えいがを みませんか → いっしょに いきましょう.",
    }),
    speaking(
      "ja-m23-story-speak-2",
      "えいがを みませんか",
      "Shall we watch a movie?",
    ),
    infoStep(
      "ja-m23-story-info-end",
      "You can follow a conversation about skills and weekend plans",
      "You understood じょうず/へた, ましょう/ませんか, and real invitation responses in a natural conversation.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M23_STORY.steps);
assertPassiveCardsHaveFollowup(M23_STORY.steps);
assertNoExplanationOnPassive(M23_STORY.steps);
assertExplanationDoesntLeakAnswer(M23_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-7-1 — Comprehension closer
// ═══════════════════════════════════════════════════════════════════════

const M23_7_1_REVIEW = pickReviewAtoms("ja-m23-7-1-rev", M23_REVIEW_POOL, 4);

export const M23_7_1: LessonContent = {
  id: "ja-m23-7-1",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Activity planning closer I",
  description:
    "Dialogue closer — follow friends planning activities and produce key sentences.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-7-1-info-open",
      "Planning activities",
      "A longer conversation about skills and weekend plans. Listen, answer, and produce.",
    ),
    dialogueListen({
      id: "ja-m23-7-1-dialogue",
      lines: [
        { speaker: "ゆき", kana: "たけしさんは すいえいのが じょうずですね。どようびに いっしょに いきませんか。" },
        { speaker: "たけし", kana: "すみません、どようびは やくそくが あります。にちようびは だいじょうぶです。" },
        { speaker: "ゆき", kana: "じゃあ、にちようびに いきましょう。" },
        { speaker: "たけし", kana: "いいですね! たのしみです。" },
      ],
      questions: [
        {
          id: "d-q1",
          prompt: "Why can't Takeshi go on Saturday?",
          correctText: "He has an appointment.",
          distractors: ["He's bad at swimming.", "He's busy with work.", "He doesn't like swimming."],
          explanation: "やくそくが あります = I have an appointment/commitment.",
        },
        {
          id: "d-q2",
          prompt: "When will they go swimming?",
          correctText: "Sunday.",
          distractors: ["Saturday.", "The weekend.", "Next week."],
          explanation: "にちようびに いきましょう = let's go on Sunday.",
        },
      ],
    }),
    build(
      "ja-m23-7-1-build-1",
      "Say: Sorry, I have an appointment on Saturday.",
      "すみません、どようびは やくそくが あります",
      ["すみません", "どようび", "は", "やくそく", "が", "あります", "ありません"],
      ["すみません", "どようび", "は", "やくそく", "が", "あります"],
    ),
    sentenceMcq({
      id: "ja-m23-7-1-mcq-1",
      prompt: "How does ゆき invite たけし to swim?",
      correctKana: "Using ませんか (polite invitation).",
      distractorsKana: ["Using ましょう.", "Using ます.", "Using ません."],
      explanation: "いっしょに いきませんか = won't you go together? (polite invitation).",
    }),
    listeningCompSentence({
      id: "ja-m23-7-1-lc-1",
      audioText: "にちようびは だいじょうぶです",
      correctMeaningEn: "Sunday is fine / okay.",
      distractorsEn: [
        "Sunday is busy.",
        "Sunday is fun.",
        "Sunday has an appointment.",
      ],
    }),
    cloze(
      "ja-m23-7-1-cloze-1",
      "いっしょに いき",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ました"],
      "Won't you go together?",
      "いっしょに いきませんか。",
      "ませんか = polite invitation.",
    ),
    build(
      "ja-m23-7-1-build-2",
      "Confirm the plan: Let's go on Sunday.",
      "にちようびに いきましょう",
      ["にちようび", "に", "いきましょう", "いきませんか", "いきます"],
      ["にちようび", "に", "いきましょう"],
    ),
    speaking(
      "ja-m23-7-1-speak-1",
      "すみません、どようびは やくそくが あります",
      "Sorry, I have an appointment on Saturday.",
    ),
    listeningBuildSentence({
      id: "ja-m23-7-1-lb-1",
      target: "にちようびに いきましょう",
      tiles: ["にちようび", "に", "いきましょう", "いきませんか", "いきます"],
      correctOrder: ["にちようび", "に", "いきましょう"],
      promptEn: "Hear it, build it: 'Let's go on Sunday.'",
    }),
    cloze(
      "ja-m23-7-1-cloze-2",
      "すいえい",
      " じょうずです。",
      "のが",
      ["のが", "が", "は", "を"],
      "Good at swimming.",
      "すいえいのが じょうずです。",
      "のが nominalizes — 'the act of swimming.'",
    ),
    translateStep({
      id: "ja-m23-7-1-translate",
      promptEn: "Won't you go swimming together on Sunday?",
      acceptedAnswers: [
        "にちようびに いっしょに すいえいに いきませんか",
        "にちようびに いっしょに すいえいに いきませんか。",
      ],
      audioText: "にちようびに いっしょに すいえいに いきませんか",
    }),
    selfExplain({
      id: "ja-m23-7-1-self-explain",
      anchorLabel: "にちようびに いきましょう",
      anchorAudioText: "にちようびに いきましょう",
      question: "ゆき used ませんか first, then たけし responded. Then ゆき switched to ましょう. Why?",
      rule: { text: "ませんか is for the initial invitation (polite, tentative). After acceptance, ましょう confirms the plan (confident agreement)." },
      surface: { text: "ましょう and ませんか are random choices — they mean the same thing." },
      distractor: { text: "ましょう is only used on Sundays; ませんか is for Saturdays." },
      ruleExplanation:
        "Natural flow: ませんか (invite) → acceptance → ましょう (confirm). The formality shifts from tentative to confirmed.",
    }),
    speaking(
      "ja-m23-7-1-speak-2",
      "たのしみです",
      "I'm looking forward to it.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-7-1-rev-mcq-1", M23_7_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-7-1-rev-lc-1",
      audioText: M23_7_1_REVIEW[1].kana,
      correctMeaningEn: M23_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_7_1_REVIEW[2].meaningEn,
        M23_7_1_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[12].meaningEn,
      ],
    }),
    speaking("ja-m23-7-1-rev-speak-1", M23_7_1_REVIEW[2].kana, M23_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-7-1-rev", M23_7_1_REVIEW),
    infoStep(
      "ja-m23-7-1-info-end",
      "You can now navigate a full invitation conversation with accept and decline",
      "ませんか → acceptance → ましょう — the natural flow of making plans in Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_7_1.steps);
assertAnswerRotation(M23_7_1.steps, 1);
assertNoConsecutiveSame(M23_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-7-2 — Final mixed drill
// ═══════════════════════════════════════════════════════════════════════

const M23_7_2_REVIEW = pickReviewAtoms("ja-m23-7-2-rev", M23_REVIEW_POOL, 5);

export const M23_7_2: LessonContent = {
  id: "ja-m23-7-2",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Activity planning closer II",
  description:
    "Final mixed drill — all M23 grammar + vocab in full production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m23-7-2-info-open",
      "Final M23 drill",
      "Everything from M23 mixed together. Prove you own every pattern.",
    ),
    build(
      "ja-m23-7-2-build-1",
      "Say: She is good at swimming.",
      "かのじょは すいえいのが じょうずです",
      ["かのじょ", "は", "すいえい", "のが", "じょうず", "です", "へた"],
      ["かのじょ", "は", "すいえい", "のが", "じょうず", "です"],
    ),
    cloze(
      "ja-m23-7-2-cloze-1",
      "いっしょに かいものし",
      "。",
      "ましょう",
      ["ましょう", "ませんか", "ます", "ません"],
      "Let's go shopping together.",
      "いっしょに かいものしましょう。",
      "ましょう = confident suggestion.",
    ),
    speaking(
      "ja-m23-7-2-speak-1",
      "えいがを みませんか",
      "Shall we watch a movie?",
    ),
    sentenceMcq({
      id: "ja-m23-7-2-mcq-1",
      prompt: "Which means 'I'm bad at cooking but I like it.'?",
      correctKana: "りょうりが へたですが、すきです。",
      distractorsKana: [
        "りょうりが じょうずですが、きらいです。",
        "りょうりを しましょう。",
        "りょうりしませんか。",
      ],
      explanation: "へたですが、すきです = bad at it, but like it.",
    }),
    build(
      "ja-m23-7-2-build-2",
      "Ask: Won't you sing together?",
      "いっしょに うたいませんか",
      ["いっしょに", "うたいませんか", "うたいましょう", "うたいます"],
      ["いっしょに", "うたいませんか"],
    ),
    listeningBuildSentence({
      id: "ja-m23-7-2-lb-1",
      target: "ぜひ! たのしみです",
      tiles: ["ぜひ", "たのしみ", "です", "たのしい", "きっと"],
      correctOrder: ["ぜひ"],
      promptEn: "Hear it, build the first word: 'By all means!'",
    }),
    listeningCompSentence({
      id: "ja-m23-7-2-lc-1",
      audioText: "たけしさんは おどるのが じょうずです",
      correctMeaningEn: "Takeshi is good at dancing.",
      distractorsEn: [
        "Takeshi is bad at dancing.",
        "Takeshi likes dancing.",
        "Takeshi dances.",
      ],
    }),
    cloze(
      "ja-m23-7-2-cloze-2",
      "にちようびに えいがを み",
      "。",
      "ませんか",
      ["ませんか", "ましょう", "ます", "ません"],
      "Shall we watch a movie on Sunday?",
      "にちようびに えいがを みませんか。",
      "ませんか = polite invitation.",
    ),
    build(
      "ja-m23-7-2-build-3",
      "Say: I'm looking forward to the weekend.",
      "しゅうまつが たのしみです",
      ["しゅうまつ", "が", "たのしみ", "です", "たのしい", "は"],
      ["しゅうまつ", "が", "たのしみ", "です"],
    ),
    speaking(
      "ja-m23-7-2-speak-2",
      "すいえいのが じょうずです",
      "Good at swimming.",
    ),
    sentenceMcq({
      id: "ja-m23-7-2-mcq-2",
      prompt: "A polite way to decline an invitation?",
      correctKana: "すみません、どようびは いそがしいです。",
      distractorsKana: [
        "いいえ、いきません。",
        "ません。",
        "だいじょうぶ。",
      ],
      explanation: "すみません + reason = polite decline.",
    }),
    build(
      "ja-m23-7-2-build-4",
      "Say: Let's study together.",
      "いっしょに べんきょうしましょう",
      ["いっしょに", "べんきょうしましょう", "べんきょうしませんか", "べんきょうします"],
      ["いっしょに", "べんきょうしましょう"],
    ),
    translateStep({
      id: "ja-m23-7-2-translate",
      promptEn: "Takeshi is good at playing the piano.",
      acceptedAnswers: [
        "たけしさんは ピアノを ひくのが じょうずです",
        "たけしさんは ピアノを ひくのが じょうずです。",
      ],
      audioText: "たけしさんは ピアノを ひくのが じょうずです",
    }),
    selfExplain({
      id: "ja-m23-7-2-self-explain",
      anchorLabel: "All M23 patterns mastered",
      anchorAudioText: "いっしょに いきましょう",
      question: "Name the four patterns you learned in M23.",
      rule: { text: "1) のがじょうず (good at). 2) のがへた (bad at). 3) ましょう (let's). 4) ませんか (shall we? — invitation)." },
      surface: { text: "じょうず, ましょう, ませんか, and たのしい — four grammar forms." },
      distractor: { text: "うたう, おどる, ひく, すいえい — four activity verbs." },
      ruleExplanation:
        "M23 grammar: のがじょうず/へた (ability), ましょう (suggestion), ませんか (invitation). Vocab supports these patterns.",
    }),
    speaking(
      "ja-m23-7-2-speak-3",
      "いっしょに パーティーに いきましょう",
      "Let's go to the party together.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-7-2-rev-mcq-1", M23_7_2_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-7-2-rev-lc-1",
      audioText: M23_7_2_REVIEW[1].kana,
      correctMeaningEn: M23_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_7_2_REVIEW[2].meaningEn,
        M23_7_2_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[13].meaningEn,
      ],
    }),
    speaking("ja-m23-7-2-rev-speak-1", M23_7_2_REVIEW[2].kana, M23_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-7-2-rev", M23_7_2_REVIEW.slice(0, 4)),
    infoStep(
      "ja-m23-7-2-info-end",
      "You can now talk about skills, suggest plans, invite friends, and respond naturally",
      "All M23 grammar mastered: のがじょうず/へた, ましょう, ませんか — in full production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M23_7_2.steps);
assertAnswerRotation(M23_7_2.steps, 1);
assertNoConsecutiveSame(M23_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M23 = [
  M23_1_1, M23_1_2, M23_2_1, M23_2_2, M23_3_1, M23_3_2,
  M23_4_1, M23_4_2, M23_5_1, M23_5_2, M23_6_1, M23_6_2,
  M23_STORY, M23_7_1, M23_7_2,
];

assertNoSameAnswerCluster(ALL_M23.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M23) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
