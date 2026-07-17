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
 * Split into 14 sub-lessons + 1 story = 15 registered exports, plus an
 * UNREGISTERED expansion pair (M23_8_1 / M23_8_2) teaching 〜ができます
 * (can do) and できる (dictionary form) — backlog weave; recommended
 * registration position: directly after ja-m23-1-2.
 * Each sub-lesson has 18-22 steps.
 *
 * 2026-06-12 sentence-variety reauthor: no sentence repeated >3x module-wide
 * (fresh activities per potential/volitional slot), review-particle cloze
 * ≤25%, build tile banks scrambled (no answer-first / answer-order leaks),
 * review tails widened to 6-pair match, M23_8_1/M23_8_2 (〜ができます /
 * できる) authored as the promised unregistered expansion pair.
 *
 * ID scheme: ja-m23-{n}-{sub} e.g. ja-m23-1-1, ja-m23-1-2
 * Export names: M23_1_1, M23_1_2, M23_2_1, M23_2_2, etc.
 */
import type { LessonContent } from "@/features/lesson/types";
import {
  build,
  cloze,
  dialogueListen,
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
  title: "〜がじょうずです / へたです — good at / bad at",
  rule:
    "To say someone is good or bad at something, mark the skill with が: ダンスが じょうずです (good at dance), りょうりが へたです (bad at cooking). If the skill is a VERB phrase, nominalize it with の first: ピアノを ひくのが じょうずです (good at playing the piano). Nouns take が directly — only verbs need のが.",
  examples: [
    {
      ja: "たけしさんは ダンスが じょうずです。",
      romaji: "Takeshi-san wa dansu ga jouzu desu.",
      en: "Takeshi is good at dance.",
    },
    {
      ja: "わたしは りょうりが へたです。",
      romaji: "watashi wa ryouri ga heta desu.",
      en: "I'm bad at cooking.",
    },
    {
      ja: "ゆきさんは ピアノを ひくのが じょうずです。",
      romaji: "Yuki-san wa piano o hiku no ga jouzu desu.",
      en: "Yuki is good at playing the piano.",
    },
  ],
  antiPattern: {
    ja: "ゆきさんは うたうが じょうずです。",
    romaji: "Yuki-san wa utau ga jouzu desu.",
    en: "(broken — a verb can't take が directly)",
    why: "Verbs must be nominalized with の before が: うたうのが じょうずです. Nouns (ダンス, りょうり, すいえい) take が directly — no の.",
  },
  cultureNote:
    "Japanese modesty: don't say じょうず about yourself. Say とくい (strong at) or まあまあ (so-so) instead. じょうず is for complimenting others.",
});

const RULE_MASHOU = grammarRule({
  id: "ja-m23-rule-mashou",
  grammarPointId: "mashou",
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
  grammarPointId: "masenka",
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

const M23_1_1_REVIEW = pickReviewAtoms("ja-m23-1-1-rev", M23_REVIEW_POOL, 6);

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
    // ── うんてん (driving) ──
    build(
      "ja-m23-1-1-build-unten",
      "Pick the Japanese word for: Driving",
      "うんてん",
      ["ダンス", "うんてん", "ピアノ", "すいえい"],
      ["うんてん"],
    ),
    listeningCompSentence({
      id: "ja-m23-1-1-lc-unten",
      audioText: "わたしは うんてんが すきです",
      correctMeaningEn: "I like driving.",
      distractorsEn: [
        "I like swimming.",
        "I dislike driving.",
        "I'm good at driving.",
      ],
    }),
    // ── ダンス (dance) ──
    build(
      "ja-m23-1-1-build-dansu",
      "Pick the Japanese word for: Dance",
      "ダンス",
      ["うんてん", "ピアノ", "ダンス", "すいえい"],
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
      ["ダンス", "うんてん", "すいえい", "ピアノ"],
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
      ["ピアノ", "すいえい", "ダンス", "うんてん"],
      ["すいえい"],
    ),
    speaking("ja-m23-1-1-speak-suiei", "すいえい", "Swimming"),
    // ── じょうず / へた ──
    build(
      "ja-m23-1-1-build-jouzu",
      "Pick the Japanese word for: Skillful / Good at",
      "じょうず",
      ["へた", "すき", "じょうず", "きらい"],
      ["じょうず"],
    ),
    build(
      "ja-m23-1-1-build-heta",
      "Pick the Japanese word for: Unskillful / Bad at",
      "へた",
      ["じょうず", "へた", "きらい", "すき"],
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
      anchorLabel: "ピアノが じょうずです",
      anchorAudioText: "ピアノが じょうずです",
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
      audioText: "まいにち ほんを よみます",
      correctMeaningEn: "I read a book every day.",
      distractorsEn: [
        "I write a letter every day.",
        "I watch TV every day.",
        "I read a book sometimes.",
      ],
    }),
    speaking("ja-m23-1-1-rev-speak-1", M23_1_1_REVIEW[2].kana, M23_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-1-1-rev", M23_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_1_1.steps);
assertAnswerRotation(M23_1_1.steps, 1);
assertNoConsecutiveSame(M23_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-1-2 — Capability vocab practice
//   (drill じょうず/へた + うたう, おどる, ひく)
// ═══════════════════════════════════════════════════════════════════════

const M23_1_2_REVIEW = pickReviewAtoms("ja-m23-1-2-rev", M23_REVIEW_POOL, 6);

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
    // ── うたう (sing) ──
    build(
      "ja-m23-1-2-build-utau",
      "Pick the Japanese word for: Sing",
      "うたう",
      ["おどる", "うたう", "ひく", "すいえい"],
      ["うたう"],
    ),
    listeningCompSentence({
      id: "ja-m23-1-2-lc-utau",
      audioText: "ともだちと うたう",
      correctMeaningEn: "sing with a friend",
      distractorsEn: [
        "dance with a friend",
        "talk with a friend",
        "sing at home",
      ],
    }),
    // ── おどる (dance-verb) ──
    build(
      "ja-m23-1-2-build-odoru",
      "Pick the Japanese word for: Dance (verb)",
      "おどる",
      ["うたう", "ひく", "おどる", "うんてん"],
      ["おどる"],
    ),
    speaking("ja-m23-1-2-speak-odoru", "おどる", "Dance (verb)"),
    // ── ひく (play instrument) ──
    build(
      "ja-m23-1-2-build-hiku",
      "Pick the Japanese word for: Play (instrument)",
      "ひく",
      ["うたう", "おどる", "すいえい", "ひく"],
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
      ["うたう", "かのじょ", "じょうず", "は", "の", "が", "へた", "です"],
      ["かのじょ", "は", "うたう", "の", "が", "じょうず", "です"],
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
      ["うんてん", "わたし", "へた", "は", "が", "じょうず", "です"],
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
  ],
};

assertNoSameAnswerCluster(M23_1_2.steps);
assertAnswerRotation(M23_1_2.steps, 1);
assertNoConsecutiveSame(M23_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-2-1 — "Let's do" intro
//   (〜ましょう + activity vocab)
// ═══════════════════════════════════════════════════════════════════════

const M23_2_1_REVIEW = pickReviewAtoms("ja-m23-2-1-rev", M23_REVIEW_POOL, 6);

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
    RULE_MASHOU,
    // ── いっしょに (together) ──
    build(
      "ja-m23-2-1-build-issho",
      "Pick the Japanese word for: Together",
      "いっしょに",
      ["さんぽ", "いっしょに", "かいもの", "パーティー"],
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
      ["いっしょに", "かいもの", "さんぽ", "うんてん"],
      ["さんぽ"],
    ),
    speaking("ja-m23-2-1-speak-sanpo", "さんぽ", "Walk / Stroll"),
    // ── かいもの (shopping) ──
    build(
      "ja-m23-2-1-build-kaimono",
      "Pick the Japanese word for: Shopping",
      "かいもの",
      ["さんぽ", "パーティー", "えいが", "かいもの"],
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
      ["いきます", "いっしょに", "いきましょう", "いきませんか", "ください"],
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
      ["べんきょうしましょう", "にほんご", "を", "べんきょうします", "べんきょうしません"],
      ["にほんご", "を", "べんきょうしましょう"],
    ),
    listeningBuildSentence({
      id: "ja-m23-2-1-lb-mashou",
      target: "こうえんに いきましょう",
      tiles: ["いきましょう", "こうえん", "に", "いきませんか", "がっこう"],
      correctOrder: ["こうえん", "に", "いきましょう"],
      promptEn: "Hear it, build it: 'Let's go to the park.'",
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
      "いっしょに かいものに いきましょう",
      "Let's go shopping together.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-2-1-rev-mcq-1", M23_2_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-2-1-rev-lc-1",
      audioText: "トイレは どこですか",
      correctMeaningEn: "Where is the toilet?",
      distractorsEn: [
        "Where is the station?",
        "There is a toilet over there.",
        "Is this the toilet?",
      ],
    }),
    speaking("ja-m23-2-1-rev-speak-1", M23_2_1_REVIEW[2].kana, M23_2_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-2-1-rev", M23_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_2_1.steps);
assertAnswerRotation(M23_2_1.steps, 1);
assertNoConsecutiveSame(M23_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-2-2 — "Let's do" practice
//   (drill ましょう + パーティー, やくそく)
// ═══════════════════════════════════════════════════════════════════════

const M23_2_2_REVIEW = pickReviewAtoms("ja-m23-2-2-rev", M23_REVIEW_POOL, 6);

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
    // ── パーティー (party) ──
    build(
      "ja-m23-2-2-build-paatii",
      "Pick the Japanese word for: Party",
      "パーティー",
      ["やくそく", "パーティー", "さんぽ", "かいもの"],
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
      ["パーティー", "さんぽ", "やくそく", "かいもの"],
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
      ["を", "しましょう", "パーティー", "します", "しません"],
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
      ["かえります", "かえりましょう", "かえりません", "かえりました"],
      ["かえりましょう"],
    ),
    listeningBuildSentence({
      id: "ja-m23-2-2-lb-mashou",
      target: "がっこうで べんきょうしましょう",
      tiles: ["べんきょうしましょう", "がっこう", "で", "べんきょうしませんか", "えき"],
      correctOrder: ["がっこう", "で", "べんきょうしましょう"],
      promptEn: "Hear it, build it: 'Let's study at school.'",
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
      promptEn: "Let's study at the library.",
      acceptedAnswers: [
        "としょかんで べんきょうしましょう",
        "としょかんで べんきょうしましょう。",
      ],
      audioText: "としょかんで べんきょうしましょう",
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
      audioText: "じてんしゃで がっこうに いきます",
      correctMeaningEn: "I go to school by bicycle.",
      distractorsEn: [
        "I go to school by car.",
        "I go to the park by bicycle.",
        "I walk to school.",
      ],
    }),
    vocabMcq("ja-m23-2-2-rev-mcq-1", M23_2_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M23_REVIEW_POOL),
    reviewMatchPairs("ja-m23-2-2-rev", M23_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_2_2.steps);
assertAnswerRotation(M23_2_2.steps, 1);
assertNoConsecutiveSame(M23_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-3-1 — "Shall we?" intro
//   (〜ませんか + えいが, しゅうまつ, ひま)
// ═══════════════════════════════════════════════════════════════════════

const M23_3_1_REVIEW = pickReviewAtoms("ja-m23-3-1-rev", M23_REVIEW_POOL, 6);

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
    RULE_MASENKA,
    // ── えいが (movie) ──
    build(
      "ja-m23-3-1-build-eiga",
      "Pick the Japanese word for: Movie",
      "えいが",
      ["しゅうまつ", "えいが", "ひま", "パーティー"],
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
      ["にちようび", "どようび", "しゅうまつ", "えいが"],
      ["しゅうまつ"],
    ),
    listeningCompSentence({
      id: "ja-m23-3-1-lc-shuumatsu",
      audioText: "しゅうまつに かいものを します",
      correctMeaningEn: "I go shopping on the weekend.",
      distractorsEn: [
        "I go shopping on Sunday.",
        "I watch a movie on the weekend.",
        "I take a walk on the weekend.",
      ],
    }),
    // ── ひま (free time) ──
    build(
      "ja-m23-3-1-build-hima",
      "Pick the Japanese word for: Free time / Not busy",
      "ひま",
      ["いそがしい", "しゅうまつ", "ひま", "えいが"],
      ["ひま"],
    ),
    speaking("ja-m23-3-1-speak-hima", "ひま", "Free time / Not busy"),
    // ── ませんか drills ──
    build(
      "ja-m23-3-1-build-masenka-eiga",
      "Ask: Won't you watch a movie?",
      "えいがを みませんか",
      ["みませんか", "えいが", "を", "みましょう", "みます"],
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
      target: "しゅうまつに いっしょに さんぽしませんか",
      tiles: ["いっしょに", "さんぽしませんか", "しゅうまつ", "に", "さんぽしましょう"],
      correctOrder: ["しゅうまつ", "に", "いっしょに", "さんぽしませんか"],
      promptEn: "Hear it, build it: 'Won't you take a walk together on the weekend?'",
    }),
    build(
      "ja-m23-3-1-build-masenka-kaimono",
      "Ask: Won't you go shopping on the weekend?",
      "しゅうまつに かいものしませんか",
      ["かいものしませんか", "しゅうまつ", "に", "かいものしましょう", "かいものします"],
      ["しゅうまつ", "に", "かいものしませんか"],
    ),
    selfExplain({
      id: "ja-m23-3-1-self-explain",
      anchorLabel: "しゅうまつに かいものしませんか",
      anchorAudioText: "しゅうまつに かいものしませんか",
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
      audioText: "うちで テレビを みます",
      correctMeaningEn: "I watch TV at home.",
      distractorsEn: [
        "I watch TV at school.",
        "I read a book at home.",
        "I buy a TV at the store.",
      ],
    }),
    speaking("ja-m23-3-1-rev-speak-1", M23_3_1_REVIEW[2].kana, M23_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-3-1-rev", M23_3_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_3_1.steps);
assertAnswerRotation(M23_3_1.steps, 1);
assertNoConsecutiveSame(M23_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-3-2 — "Shall we?" practice
//   (drill ませんか + にちようび, どようび, いそがしい)
// ═══════════════════════════════════════════════════════════════════════

const M23_3_2_REVIEW = pickReviewAtoms("ja-m23-3-2-rev", M23_REVIEW_POOL, 6);

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
    // ── にちようび (Sunday) ──
    build(
      "ja-m23-3-2-build-nichiyoubi",
      "Pick the Japanese word for: Sunday",
      "にちようび",
      ["どようび", "にちようび", "しゅうまつ", "ひま"],
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
      ["にちようび", "しゅうまつ", "どようび", "えいが"],
      ["どようび"],
    ),
    speaking("ja-m23-3-2-speak-doyoubi", "どようび", "Saturday"),
    // ── いそがしい (busy) ──
    build(
      "ja-m23-3-2-build-isogashii",
      "Pick the Japanese word for: Busy",
      "いそがしい",
      ["ひま", "たのしい", "いそがしい", "だいじょうぶ"],
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
      ["えいが", "にちようび", "みませんか", "に", "を", "みましょう"],
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
      ["ひま", "にちようび", "は", "いそがしい", "です"],
      ["にちようび", "は", "ひま", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m23-3-2-lb-masenka-doyou",
      target: "どようびに パーティーに きませんか",
      tiles: ["パーティー", "どようび", "に", "きませんか", "に", "きましょう"],
      correctOrder: ["どようび", "に", "パーティー", "に", "きませんか"],
      promptEn: "Hear it, build it: 'Won't you come to the party on Saturday?'",
    }),
    translateStep({
      id: "ja-m23-3-2-translate",
      promptEn: "Won't you watch a movie on Saturday?",
      acceptedAnswers: [
        "どようびに えいがを みませんか",
        "どようびに えいがを みませんか。",
      ],
      audioText: "どようびに えいがを みませんか",
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
      "いいですね。いきましょう",
      "Sounds good — let's go!",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-3-2-rev-mcq-1", M23_3_2_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-3-2-rev-lc-1",
      audioText: "コーヒーを のみませんか",
      correctMeaningEn: "Won't you have some coffee?",
      distractorsEn: [
        "Let's drink some tea.",
        "I drink coffee every day.",
        "I don't drink coffee.",
      ],
    }),
    speaking("ja-m23-3-2-rev-speak-1", M23_3_2_REVIEW[2].kana, M23_3_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-3-2-rev", M23_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_3_2.steps);
assertAnswerRotation(M23_3_2.steps, 1);
assertNoConsecutiveSame(M23_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-4-1 — ましょう vs ませんか interleave
// ═══════════════════════════════════════════════════════════════════════

const M23_4_1_REVIEW = pickReviewAtoms("ja-m23-4-1-rev", M23_REVIEW_POOL, 6);

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
    // ── だいじょうぶ (okay/fine) ──
    build(
      "ja-m23-4-1-build-daijoubu",
      "Pick the Japanese word for: Okay / Fine",
      "だいじょうぶ",
      ["ぜひ", "だいじょうぶ", "ひま", "いそがしい"],
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
      ["だいじょうぶ", "きっと", "ぜひ", "たのしい"],
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
      ["かえりませんか", "かえります", "かえりましょう", "かえりました"],
      ["かえりましょう"],
    ),
    listeningCompSentence({
      id: "ja-m23-4-1-lc-masenka-eiga",
      audioText: "こうえんに いきませんか",
      correctMeaningEn: "Won't you go to the park?",
      distractorsEn: [
        "Let's go to the park.",
        "I go to the park.",
        "Won't you go to the station?",
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
      ["いきましょう", "ぜひ", "いきませんか", "いきます"],
      ["ぜひ", "いきましょう"],
    ),
    listeningBuildSentence({
      id: "ja-m23-4-1-lb-masenka",
      target: "しゅうまつに さんぽしませんか",
      tiles: ["さんぽしませんか", "しゅうまつ", "に", "さんぽしましょう", "さんぽします"],
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
      promptEn: "Won't you come to my house on Saturday?",
      acceptedAnswers: [
        "どようびに わたしの いえに きませんか",
        "どようびに わたしの いえに きませんか。",
      ],
      audioText: "どようびに わたしの いえに きませんか",
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
      audioText: "さんじに えきで あいましょう",
      correctMeaningEn: "Let's meet at the station at 3 o'clock.",
      distractorsEn: [
        "Let's meet at the station at 5 o'clock.",
        "Let's meet at the school at 3 o'clock.",
        "I went to the station at 3 o'clock.",
      ],
    }),
    speaking("ja-m23-4-1-rev-speak-1", M23_4_1_REVIEW[2].kana, M23_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-4-1-rev", M23_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_4_1.steps);
assertAnswerRotation(M23_4_1.steps, 1);
assertNoConsecutiveSame(M23_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-4-2 — Interleave II (all patterns)
// ═══════════════════════════════════════════════════════════════════════

const M23_4_2_REVIEW = pickReviewAtoms("ja-m23-4-2-rev", M23_REVIEW_POOL, 6);

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
    // ── きっと (surely) ──
    build(
      "ja-m23-4-2-build-kitto",
      "Pick the Japanese word for: Surely / Definitely",
      "きっと",
      ["ぜひ", "きっと", "だいじょうぶ", "たのしい"],
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
      ["きっと", "ぜひ", "たのしい", "いそがしい"],
      ["たのしい"],
    ),
    speaking("ja-m23-4-2-speak-tanoshii", "たのしい", "Fun / Enjoyable"),
    // ── たのしみ (looking forward to) ──
    build(
      "ja-m23-4-2-build-tanoshimi",
      "Pick the Japanese word for: Looking forward to",
      "たのしみ",
      ["たのしい", "やくそく", "たのしみ", "ぜひ"],
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
      ["うたいませんか", "いっしょに", "うたいましょう", "うたいます"],
      ["いっしょに", "うたいませんか"],
    ),
    listeningBuildSentence({
      id: "ja-m23-4-2-lb-jouzu",
      target: "ゆきさんは ピアノを ひくのが じょうずです",
      tiles: ["ピアノ", "ゆきさん", "ひくのが", "は", "を", "へた", "じょうず", "です"],
      correctOrder: ["ゆきさん", "は", "ピアノ", "を", "ひくのが", "じょうず", "です"],
      promptEn: "Hear it, build it: 'Yuki is good at playing the piano.'",
    }),
    cloze(
      "ja-m23-4-2-cloze-noga",
      "うたう",
      " へたです。",
      "のが",
      ["のが", "が", "は", "を"],
      "Bad at singing.",
      "うたうのが へたです。",
      "うたう is a verb — verbs need のが to become the subject of へた.",
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
      promptEn: "My father is good at driving.",
      acceptedAnswers: [
        "ちちは うんてんが じょうずです",
        "ちちは うんてんが じょうずです。",
      ],
      audioText: "ちちは うんてんが じょうずです",
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
      audioText: "いすが みっつ あります",
      correctMeaningEn: "There are three chairs.",
      distractorsEn: [
        "There are three desks.",
        "There are two chairs.",
        "The chair is big.",
      ],
    }),
    vocabMcq("ja-m23-4-2-rev-mcq-1", M23_4_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M23_REVIEW_POOL),
    reviewMatchPairs("ja-m23-4-2-rev", M23_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_4_2.steps);
assertAnswerRotation(M23_4_2.steps, 1);
assertNoConsecutiveSame(M23_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-5-1 — Full interleave drill I
// ═══════════════════════════════════════════════════════════════════════

const M23_5_1_REVIEW = pickReviewAtoms("ja-m23-5-1-rev", M23_REVIEW_POOL, 6);

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
      ["きましょう", "パーティー", "きませんか", "に", "きます"],
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
      "かれは すいえいが じょうずです",
      ["すいえい", "かれ", "を", "は", "じょうず", "の", "が", "です"],
      ["かれ", "は", "すいえい", "が", "じょうず", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m23-5-1-lb-masenka",
      target: "しゅうまつに えいがを みませんか",
      tiles: ["えいが", "しゅうまつ", "みませんか", "に", "を", "みましょう", "みます"],
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
      ["りょうり", "わたし", "へた", "は", "が", "じょうず", "です"],
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
      anchorAudioText: "うんてんが へたです",
      question: "Can you use じょうず with ましょう in one sentence?",
      rule: { text: "Yes — e.g., 'He's good at swimming, so let's go swimming.' They serve different functions: じょうず describes ability, ましょう suggests an action." },
      surface: { text: "No — じょうず and ましょう are the same grammar pattern and can't combine." },
      distractor: { text: "Yes — じょうずましょう is a combined form meaning 'let's be good at.'" },
      ruleExplanation:
        "じょうず/へた describe ability. ましょう/ませんか suggest or invite. They can appear in the same conversation but serve different roles.",
    }),
    speaking(
      "ja-m23-5-1-speak-full",
      "かれは すいえいが じょうずです",
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
  ],
};

assertNoSameAnswerCluster(M23_5_1.steps);
assertAnswerRotation(M23_5_1.steps, 1);
assertNoConsecutiveSame(M23_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-5-2 — Full interleave drill II
// ═══════════════════════════════════════════════════════════════════════

const M23_5_2_REVIEW = pickReviewAtoms("ja-m23-5-2-rev", M23_REVIEW_POOL, 6);

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
    build(
      "ja-m23-5-2-build-jouzu",
      "Say: Yuki is good at dancing.",
      "ゆきさんは おどるのが じょうずです",
      ["おどるのが", "ゆきさん", "じょうず", "は", "へた", "です"],
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
      "どようびに こうえんに いきませんか",
      "Won't you go to the park on Saturday?",
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
      ["おどりましょう", "いっしょに", "おどりませんか", "おどります"],
      ["いっしょに", "おどりませんか"],
    ),
    listeningCompSentence({
      id: "ja-m23-5-2-lc-kitto",
      audioText: "きっと だいじょうぶです",
      correctMeaningEn: "It's surely okay.",
      distractorsEn: [
        "It's surely fun.",
        "I'm looking forward to it.",
        "By all means.",
      ],
    }),
    cloze(
      "ja-m23-5-2-cloze-noga",
      "えいがを みる",
      " すきです。",
      "のが",
      ["のが", "が", "は", "を"],
      "I like watching movies.",
      "えいがを みるのが すきです。",
      "のが nominalizes the verb phrase — the same pattern works with すき.",
    ),
    build(
      "ja-m23-5-2-build-tanoshimi",
      "Say: I'm looking forward to the party.",
      "パーティーが たのしみです",
      ["たのしみ", "パーティー", "が", "たのしい", "は", "です"],
      ["パーティー", "が", "たのしみ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m23-5-2-lb-heta",
      target: "わたしは りょうりが へたです",
      tiles: ["りょうり", "わたし", "へた", "は", "が", "じょうず", "です"],
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
      promptEn: "My friend is good at playing the piano.",
      acceptedAnswers: [
        "ともだちは ピアノを ひくのが じょうずです",
        "ともだちは ピアノを ひくのが じょうずです。",
      ],
      audioText: "ともだちは ピアノを ひくのが じょうずです",
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
      audioText: "あさは パンを たべます",
      correctMeaningEn: "In the morning I eat bread.",
      distractorsEn: [
        "In the evening I eat bread.",
        "In the morning I drink coffee.",
        "I make bread every morning.",
      ],
    }),
    speaking("ja-m23-5-2-rev-speak-1", M23_5_2_REVIEW[2].kana, M23_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-5-2-rev", M23_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_5_2.steps);
assertAnswerRotation(M23_5_2.steps, 1);
assertNoConsecutiveSame(M23_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-6-1 — Production I
// ═══════════════════════════════════════════════════════════════════════

const M23_6_1_REVIEW = pickReviewAtoms("ja-m23-6-1-rev", M23_REVIEW_POOL, 6);

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
    build(
      "ja-m23-6-1-build-1",
      "Say: She is good at swimming.",
      "かのじょは すいえいが じょうずです",
      ["すいえい", "かのじょ", "じょうず", "は", "が", "の", "を", "へた", "です"],
      ["かのじょ", "は", "すいえい", "が", "じょうず", "です"],
    ),
    speaking(
      "ja-m23-6-1-speak-1",
      "いっしょに うみに いきましょう",
      "Let's go to the sea together.",
    ),
    build(
      "ja-m23-6-1-build-2",
      "Ask: Won't you come to the party on Sunday?",
      "にちようびに パーティーに きませんか",
      ["パーティー", "にちようび", "に", "きませんか", "に", "きましょう"],
      ["にちようび", "に", "パーティー", "に", "きませんか"],
    ),
    listeningBuildSentence({
      id: "ja-m23-6-1-lb-1",
      target: "うたうのが じょうずです",
      tiles: ["じょうず", "うたう", "の", "が", "へた", "を", "です"],
      correctOrder: ["うたう", "の", "が", "じょうず", "です"],
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
      ["おどるのが", "わたし", "へた", "は", "じょうず", "です"],
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
      ["にほんご", "いっしょに", "べんきょうしましょう", "を", "べんきょうしませんか"],
      ["いっしょに", "にほんご", "を", "べんきょうしましょう"],
    ),
    translateStep({
      id: "ja-m23-6-1-translate-1",
      promptEn: "I'm bad at singing.",
      acceptedAnswers: [
        "わたしは うたうのが へたです",
        "わたしは うたうのが へたです。",
        "うたうのが へたです",
        "うたうのが へたです。",
      ],
      audioText: "わたしは うたうのが へたです",
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
      "Say: The party will surely be fun.",
      "パーティーは きっと たのしいです",
      ["きっと", "パーティー", "たのしい", "は", "たのしみ", "です"],
      ["パーティー", "は", "きっと", "たのしい", "です"],
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
      audioText: "これは わたしの けいたいです",
      correctMeaningEn: "This is my mobile phone.",
      distractorsEn: [
        "This is my friend's mobile phone.",
        "That is my camera.",
        "Where is my mobile phone?",
      ],
    }),
    speaking("ja-m23-6-1-rev-speak-1", M23_6_1_REVIEW[2].kana, M23_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-6-1-rev", M23_6_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_6_1.steps);
assertAnswerRotation(M23_6_1.steps, 1);
assertNoConsecutiveSame(M23_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-6-2 — Production II
// ═══════════════════════════════════════════════════════════════════════

const M23_6_2_REVIEW = pickReviewAtoms("ja-m23-6-2-rev", M23_REVIEW_POOL, 6);

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
    build(
      "ja-m23-6-2-build-1",
      "Say: My older sister is good at dance.",
      "あねは ダンスが じょうずです",
      ["ダンス", "あね", "じょうず", "は", "が", "の", "を", "です"],
      ["あね", "は", "ダンス", "が", "じょうず", "です"],
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
      "すいえいが へたですが、すきです",
      ["へた", "すいえい", "が", "です", "じょうず", "が", "すき", "です"],
      ["すいえい", "が", "へた", "です", "が", "すき", "です"],
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
      ["パーティー", "しゅうまつ", "を", "に", "しましょう", "しませんか"],
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
      "うんてん is a noun — nouns take が directly. のが is only for verb phrases.",
    ),
    speaking(
      "ja-m23-6-2-speak-2",
      "たけしさんは ピアノを ひくのが じょうずです",
      "Takeshi is good at playing the piano.",
    ),
    listeningBuildSentence({
      id: "ja-m23-6-2-lb-1",
      target: "こうえんで さんぽしましょう",
      tiles: ["さんぽしましょう", "こうえん", "で", "さんぽしませんか", "えき"],
      correctOrder: ["こうえん", "で", "さんぽしましょう"],
      promptEn: "Hear it, build it: 'Let's take a walk in the park.'",
    }),
    translateStep({
      id: "ja-m23-6-2-translate",
      promptEn: "Won't you go shopping on Sunday?",
      acceptedAnswers: [
        "にちようびに かいものに いきませんか",
        "にちようびに かいものに いきませんか。",
      ],
      audioText: "にちようびに かいものに いきませんか",
    }),
    selfExplain({
      id: "ja-m23-6-2-self-explain",
      anchorLabel: "M23 production mastery",
      anchorAudioText: "しゅうまつに パーティーを しましょう",
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
      audioText: "これは ちちの カメラです",
      correctMeaningEn: "This is my father's camera.",
      distractorsEn: [
        "This is my father's mobile phone.",
        "This is my mother's camera.",
        "My father is taking a photo.",
      ],
    }),
    vocabMcq("ja-m23-6-2-rev-mcq-1", M23_6_2_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M23_REVIEW_POOL),
    reviewMatchPairs("ja-m23-6-2-rev", M23_6_2_REVIEW),
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
    ...storyComprehension({
      idPrefix: "ja-m23-story-scene-1",
      narrative: [
        { kana: "わたしは うたうのが すきです。" },
        { kana: "でも、おどるのが へたです。" },
        { kana: "ともだちの ゆきさんは ダンスが じょうずです。" },
        { kana: "どようびに パーティーが あります。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "What is Takeshi bad at?",
          correctText: "Dancing.",
          distractors: ["Singing.", "Piano.", "Swimming."],
          explanation: "おどるのが へたです = bad at dancing.",
        },
        {
          id: "s1-q2",
          prompt: "Who is good at dance?",
          correctText: "Yuki.",
          distractors: ["Takeshi.", "Both of them.", "Neither of them."],
          explanation: "ゆきさんは ダンスが じょうずです = Yuki is good at dance.",
        },
      ],
      responseBuild: {
        target: "パーティーで いっしょに うたいませんか",
        tiles: ["うたいませんか", "パーティー", "いっしょに", "で", "うたいましょう", "うたいます"],
        correctOrder: ["パーティー", "で", "いっしょに", "うたいませんか"],
        promptEn: "Invite him: 'Won't you sing together at the party?'",
      },
    }),
    sentenceMcq({
      id: "ja-m23-story-mcq-1",
      prompt: "Why might Takeshi not dance at the party?",
      correctKana: "He is bad at dancing.",
      distractorsKana: [
        "He is busy on Saturday.",
        "He doesn't like parties.",
        "Yuki is bad at dancing.",
      ],
      explanation: "おどるのが へたです — he says he's bad at dancing.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m23-story-scene-2",
      narrative: [
        { kana: "にちようびは ひまです。" },
        { kana: "ゆきさんと えいがを みます。" },
        { kana: "かいものも します。" },
        { kana: "きっと たのしいです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "Is Takeshi free on Sunday?",
          correctText: "Yes, he's free.",
          distractors: ["No, he's busy.", "He has an appointment.", "He doesn't say."],
          explanation: "にちようびは ひまです = Sunday is free.",
        },
        {
          id: "s2-q2",
          prompt: "What will Takeshi do on Sunday?",
          correctText: "Watch a movie and go shopping with Yuki.",
          distractors: [
            "Go to a party with Yuki.",
            "Take a walk alone.",
            "Practice the piano.",
          ],
          explanation: "えいがを みます + かいものも します = movie, and shopping too.",
        },
      ],
      responseBuild: {
        target: "わたしも にちようびは ひまです",
        tiles: ["にちようび", "わたし", "ひま", "も", "は", "です", "いそがしい"],
        correctOrder: ["わたし", "も", "にちようび", "は", "ひま", "です"],
        promptEn: "Reply: 'I'm also free on Sunday.'",
      },
    }),
    cloze(
      "ja-m23-story-cloze-1",
      "いっしょに えいがを み",
      "。",
      "ましょう",
      ["ましょう", "ませんか", "ます", "ました"],
      "Let's watch a movie together.",
      "いっしょに えいがを みましょう。",
      "ましょう = let's — the confirmed plan.",
    ),
    listeningBuildSentence({
      id: "ja-m23-story-lb-1",
      target: "ゆきさんは ダンスが じょうずです",
      tiles: ["ダンス", "ゆきさん", "じょうず", "は", "が", "の", "を", "へた", "です"],
      correctOrder: ["ゆきさん", "は", "ダンス", "が", "じょうず", "です"],
      promptEn: "Hear it, build it: 'Yuki is good at dance.'",
    }),
    listeningCompSentence({
      id: "ja-m23-story-lc-1",
      audioText: "ゆきさんと えいがを みます",
      correctMeaningEn: "I'll watch a movie with Yuki.",
      distractorsEn: [
        "Won't you watch a movie with Yuki?",
        "Yuki watches movies alone.",
        "Let's watch a movie with Yuki.",
      ],
    }),
    speaking(
      "ja-m23-story-speak-1",
      "いっしょに いきましょう",
      "Let's go together.",
    ),
    sentenceMcq({
      id: "ja-m23-story-mcq-summary",
      prompt: "What is Takeshi's weekend like?",
      correctKana: "A party on Saturday, then a movie and shopping on Sunday.",
      distractorsKana: [
        "A movie on Saturday, a party on Sunday.",
        "He's busy both days.",
        "He's staying home all weekend.",
      ],
      explanation: "どようびに パーティー + にちようびに えいがと かいもの.",
    }),
    speaking(
      "ja-m23-story-speak-2",
      "きっと たのしいです",
      "It'll surely be fun.",
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

const M23_7_1_REVIEW = pickReviewAtoms("ja-m23-7-1-rev", M23_REVIEW_POOL, 6);

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
    dialogueListen({
      id: "ja-m23-7-1-dialogue",
      lines: [
        { speaker: "ゆき", kana: "たけしさんは すいえいが じょうずですね。どようびに いっしょに いきませんか。" },
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
      ["やくそく", "すみません", "どようび", "が", "は", "ありません", "あります"],
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
      ["いきましょう", "にちようび", "に", "いきませんか", "いきます"],
      ["にちようび", "に", "いきましょう"],
    ),
    speaking(
      "ja-m23-7-1-speak-1",
      "すみません、どようびは やくそくが あります",
      "Sorry, I have an appointment on Saturday.",
    ),
    listeningBuildSentence({
      id: "ja-m23-7-1-lb-1",
      target: "にちようびに うみに いきましょう",
      tiles: ["うみ", "にちようび", "いきましょう", "に", "に", "いきませんか"],
      correctOrder: ["にちようび", "に", "うみ", "に", "いきましょう"],
      promptEn: "Hear it, build it: 'Let's go to the sea on Sunday.'",
    }),
    cloze(
      "ja-m23-7-1-cloze-2",
      "すいえい",
      " じょうずです。",
      "が",
      ["が", "のが", "は", "を"],
      "Good at swimming.",
      "すいえいが じょうずです。",
      "すいえい is a noun — nouns take が directly; only verb phrases need のが.",
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
      audioText: "あの みせで コーヒーを のみませんか",
      correctMeaningEn: "Won't you have coffee at that shop?",
      distractorsEn: [
        "Let's have tea at that shop.",
        "I drink coffee at that shop every day.",
        "That shop's coffee is delicious.",
      ],
    }),
    speaking("ja-m23-7-1-rev-speak-1", M23_7_1_REVIEW[2].kana, M23_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-7-1-rev", M23_7_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_7_1.steps);
assertAnswerRotation(M23_7_1.steps, 1);
assertNoConsecutiveSame(M23_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-7-2 — Final mixed drill
// ═══════════════════════════════════════════════════════════════════════

const M23_7_2_REVIEW = pickReviewAtoms("ja-m23-7-2-rev", M23_REVIEW_POOL, 6);

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
    build(
      "ja-m23-7-2-build-1",
      "Say: Yuki is good at driving.",
      "ゆきさんは うんてんが じょうずです",
      ["うんてん", "ゆきさん", "じょうず", "は", "が", "の", "を", "です"],
      ["ゆきさん", "は", "うんてん", "が", "じょうず", "です"],
    ),
    cloze(
      "ja-m23-7-2-cloze-1",
      "ともだちと こうえんに いき",
      "。",
      "ましょう",
      ["ましょう", "ませんか", "ます", "ません"],
      "Let's go to the park with a friend.",
      "ともだちと こうえんに いきましょう。",
      "ましょう = confident suggestion.",
    ),
    speaking(
      "ja-m23-7-2-speak-1",
      "おちゃを のみませんか",
      "Won't you have some tea?",
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
      ["うたいましょう", "うたいませんか", "いっしょに", "うたいます"],
      ["いっしょに", "うたいませんか"],
    ),
    listeningBuildSentence({
      id: "ja-m23-7-2-lb-1",
      target: "ぜひ いっしょに うたいましょう",
      tiles: ["いっしょに", "ぜひ", "うたいましょう", "うたいませんか", "きっと"],
      correctOrder: ["ぜひ", "いっしょに", "うたいましょう"],
      promptEn: "Hear it, build it: 'By all means — let's sing together!'",
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
      ["たのしみ", "しゅうまつ", "です", "が", "たのしい", "は"],
      ["しゅうまつ", "が", "たのしみ", "です"],
    ),
    speaking(
      "ja-m23-7-2-speak-2",
      "かのじょは すいえいが じょうずです",
      "She is good at swimming.",
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
      ["べんきょうしませんか", "いっしょに", "べんきょうしましょう", "べんきょうします"],
      ["いっしょに", "べんきょうしましょう"],
    ),
    translateStep({
      id: "ja-m23-7-2-translate",
      promptEn: "Yuki is good at singing.",
      acceptedAnswers: [
        "ゆきさんは うたうのが じょうずです",
        "ゆきさんは うたうのが じょうずです。",
      ],
      audioText: "ゆきさんは うたうのが じょうずです",
    }),
    selfExplain({
      id: "ja-m23-7-2-self-explain",
      anchorLabel: "All M23 patterns mastered",
      anchorAudioText: "いっしょに べんきょうしましょう",
      question: "Name the four patterns you learned in M23.",
      rule: { text: "1) のがじょうず (good at). 2) のがへた (bad at). 3) ましょう (let's). 4) ませんか (shall we? — invitation)." },
      surface: { text: "じょうず, ましょう, ませんか, and たのしい — four grammar forms." },
      distractor: { text: "うたう, おどる, ひく, すいえい — four activity verbs." },
      ruleExplanation:
        "M23 grammar: のがじょうず/へた (ability), ましょう (suggestion), ませんか (invitation). Vocab supports these patterns.",
    }),
    speaking(
      "ja-m23-7-2-speak-3",
      "いっしょに うみに いきましょう",
      "Let's go to the sea together.",
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
    reviewMatchPairs("ja-m23-7-2-rev", M23_7_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_7_2.steps);
assertAnswerRotation(M23_7_2.steps, 1);
assertNoConsecutiveSame(M23_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M23-8-1 / M23-8-2 — UNREGISTERED expansion pair: 〜ができます / できる
//   (backlog weave — register in mockLessons.ts directly after ja-m23-1-2)
// ═══════════════════════════════════════════════════════════════════════

const RULE_DEKIMASU = grammarRule({
  id: "ja-m23-rule-dekimasu",
  title: "〜ができます — can do",
  rule:
    "To say you CAN do something, mark the skill with が and add できます: にほんごが できます (I can speak Japanese). The ability target always takes が — never を. できます is about ability (yes/no); じょうずです is about skill quality (how well).",
  examples: [
    {
      ja: "にほんごが できます。",
      romaji: "nihongo ga dekimasu.",
      en: "I can speak Japanese.",
    },
    {
      ja: "うんてんが できます。",
      romaji: "unten ga dekimasu.",
      en: "I can drive.",
    },
    {
      ja: "かのじょは りょうりが できます。",
      romaji: "kanojo wa ryouri ga dekimasu.",
      en: "She can cook.",
    },
  ],
  antiPattern: {
    ja: "にほんごを できます。",
    romaji: "nihongo o dekimasu.",
    en: "(broken — できます takes が, not を)",
    why: "できます is a potential expression: the thing you are able to do is marked with が. を marks direct objects of action verbs, not ability targets.",
  },
  cultureNote:
    "にほんごが できます is the standard way to say you can speak a language — no separate verb for 'speak' is needed.",
});

const M23_8_1_REVIEW = pickReviewAtoms("ja-m23-8-1-rev", M23_REVIEW_POOL, 6);

export const M23_8_1: LessonContent = {
  id: "ja-m23-8-1",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Can do (intro)",
  description:
    "Ability with 〜ができます: say what you can and can't do, and how it differs from じょうず.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_DEKIMASU,
    build(
      "ja-m23-8-1-build-dekimasu",
      "Say: I can speak Japanese.",
      "にほんごが できます",
      ["できます", "にほんご", "が", "を", "できません"],
      ["にほんご", "が", "できます"],
    ),
    listeningCompSentence({
      id: "ja-m23-8-1-lc-dansu",
      audioText: "ダンスが できます",
      correctMeaningEn: "I can dance.",
      distractorsEn: [
        "I can't dance.",
        "I'm good at dance.",
        "Let's dance.",
      ],
    }),
    sentenceMcq({
      id: "ja-m23-8-1-mcq-ryouri",
      prompt: "Which means 'She can cook.'?",
      correctKana: "かのじょは りょうりが できます。",
      distractorsKana: [
        "かのじょは りょうりが できません。",
        "かのじょは りょうりが じょうずです。",
        "かのじょは りょうりを します。",
      ],
      explanation: "りょうりが できます = can cook (ability). じょうず would mean she's good at it.",
    }),
    cloze(
      "ja-m23-8-1-cloze-ga",
      "すいえい",
      " できます。",
      "が",
      ["が", "を", "は", "のが"],
      "I can swim.",
      "すいえいが できます。",
      "The ability target of できます takes the subject marker, never を.",
    ),
    build(
      "ja-m23-8-1-build-dekimasen",
      "Say: I can't drive.",
      "うんてんが できません",
      ["できません", "うんてん", "できます", "が", "を"],
      ["うんてん", "が", "できません"],
    ),
    listeningBuildSentence({
      id: "ja-m23-8-1-lb-piano",
      target: "ピアノが できますか",
      tiles: ["できますか", "ピアノ", "が", "できません", "を"],
      correctOrder: ["ピアノ", "が", "できますか"],
      promptEn: "Hear it, build it: 'Can you play the piano?'",
    }),
    sentenceMcq({
      id: "ja-m23-8-1-mcq-dekiru-vs-jouzu",
      prompt: "Which means 'I CAN swim.' (ability — not skill level)?",
      correctKana: "すいえいが できます。",
      distractorsKana: [
        "すいえいが じょうずです。",
        "すいえいが すきです。",
        "すいえいを します。",
      ],
      explanation: "できます = can (ability). じょうず = good at (quality). すき = like.",
    }),
    selfExplain({
      id: "ja-m23-8-1-self-explain",
      anchorLabel: "うんてんが できます",
      anchorAudioText: "うんてんが できます",
      question: "What's the difference between できます and じょうずです?",
      rule: { text: "できます = CAN you do it (yes/no ability). じょうずです = how WELL you do it (skill). You can do something without being good at it." },
      surface: { text: "They mean the same — both say you're good at something." },
      distractor: { text: "できます is the past tense of じょうずです." },
      ruleExplanation:
        "できます answers 'can you?' じょうず answers 'are you good?' うんてんが できますが、へたです — I can drive, but badly.",
    }),
    speaking(
      "ja-m23-8-1-speak-dekimasu",
      "にほんごが できます",
      "I can speak Japanese.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m23-8-1-rev-mcq-1", M23_8_1_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-8-1-rev-lc-1",
      audioText: M23_8_1_REVIEW[1].kana,
      correctMeaningEn: M23_8_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M23_8_1_REVIEW[2].meaningEn,
        M23_8_1_REVIEW[3].meaningEn,
        M23_REVIEW_POOL[14].meaningEn,
      ],
    }),
    speaking("ja-m23-8-1-rev-speak-1", M23_8_1_REVIEW[2].kana, M23_8_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-8-1-rev", M23_8_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_8_1.steps);
assertAnswerRotation(M23_8_1.steps, 1);
assertNoConsecutiveSame(M23_8_1.steps);

const RULE_DEKIRU = grammarRule({
  id: "ja-m23-rule-dekiru",
  title: "できる — the dictionary form",
  rule:
    "できる is the plain (dictionary) form of できます. You'll meet it in dictionaries, casual speech, and inside larger grammar patterns later. In polite です/ます speech, keep using できます.",
  examples: [
    {
      ja: "ダンスが できる。",
      romaji: "dansu ga dekiru.",
      en: "I can dance. (casual)",
    },
    {
      ja: "うんてんが できますか。",
      romaji: "unten ga dekimasu ka.",
      en: "Can you drive? (polite question)",
    },
    {
      ja: "はい、できます。",
      romaji: "hai, dekimasu.",
      en: "Yes, I can.",
    },
  ],
  antiPattern: {
    ja: "ダンスが できるです。",
    romaji: "dansu ga dekiru desu.",
    en: "(broken — don't attach です to できる)",
    why: "できる is already a complete plain-form verb. The polite equivalent is できます — not できる + です.",
  },
  cultureNote:
    "[skill]が できますか is a natural getting-to-know-you (and job interview) question in Japan.",
});

const M23_8_2_REVIEW = pickReviewAtoms("ja-m23-8-2-rev", M23_REVIEW_POOL, 6);

export const M23_8_2: LessonContent = {
  id: "ja-m23-8-2",
  moduleId: "m23",
  courseId: COURSE,
  languageId: LANG,
  title: "Can do (practice)",
  description:
    "Drill できます questions and answers, and meet できる — the dictionary form.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    RULE_DEKIRU,
    build(
      "ja-m23-8-2-build-dekiru",
      "Pick the dictionary form of できます.",
      "できる",
      ["いく", "できる", "のむ", "はしる"],
      ["できる"],
    ),
    listeningCompSentence({
      id: "ja-m23-8-2-lc-dekiru",
      audioText: "ダンスが できる",
      correctMeaningEn: "I can dance. (casual)",
      distractorsEn: [
        "I can dance. (polite)",
        "I can't dance.",
        "I'm good at dance.",
      ],
    }),
    build(
      "ja-m23-8-2-build-question",
      "Ask: Can you drive?",
      "うんてんが できますか",
      ["できます", "うんてん", "できますか", "が", "を"],
      ["うんてん", "が", "できますか"],
    ),
    sentenceMcq({
      id: "ja-m23-8-2-mcq-answer",
      prompt: "Someone asks if you can drive and you CAN. How do you answer?",
      correctKana: "はい、できます。",
      distractorsKana: [
        "いいえ、できません。",
        "はい、へたです。",
        "はい、できますか。",
      ],
      explanation: "はい、できます = yes, I can. You don't need to repeat うんてんが.",
    }),
    cloze(
      "ja-m23-8-2-cloze-masen",
      "ダンスが でき",
      "。",
      "ません",
      ["ません", "ます", "ましょう", "ませんか"],
      "I can't dance.",
      "ダンスが できません。",
      "The polite negative ending turns 'can do' into 'cannot do.'",
    ),
    listeningBuildSentence({
      id: "ja-m23-8-2-lb-mo",
      target: "ピアノも できます",
      tiles: ["できます", "ピアノ", "も", "できません", "が"],
      correctOrder: ["ピアノ", "も", "できます"],
      promptEn: "Hear it, build it: 'I can play the piano, too.'",
    }),
    sentenceMcq({
      id: "ja-m23-8-2-mcq-casual",
      prompt: "Which is the CASUAL way to say 'I can cook.'?",
      correctKana: "りょうりが できる。",
      distractorsKana: [
        "りょうりが できます。",
        "りょうりが できません。",
        "りょうりが じょうずです。",
      ],
      explanation: "できる is the plain/casual form; できます is polite.",
    }),
    selfExplain({
      id: "ja-m23-8-2-self-explain",
      anchorLabel: "りょうりが できる",
      anchorAudioText: "りょうりが できる",
      question: "When would you use できる instead of できます?",
      rule: { text: "In casual speech with friends, and in plain-form writing. In polite です/ます conversation, stick with できます." },
      surface: { text: "できる is MORE polite than できます — use it with your boss." },
      distractor: { text: "できる is the past tense of できます." },
      ruleExplanation:
        "できる (plain) and できます (polite) mean the same thing — the choice is register, not meaning.",
    }),
    speaking(
      "ja-m23-8-2-speak-question",
      "ダンスが できますか",
      "Can you dance?",
    ),
    translateStep({
      id: "ja-m23-8-2-translate",
      promptEn: "Can you speak Japanese?",
      acceptedAnswers: [
        "にほんごが できますか",
        "にほんごが できますか。",
      ],
      audioText: "にほんごが できますか",
    }),
    // ── Review tail ──
    vocabMcq("ja-m23-8-2-rev-mcq-1", M23_8_2_REVIEW[0], M23_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m23-8-2-rev-lc-1",
      audioText: "なまえは なんですか",
      correctMeaningEn: "What is your name?",
      distractorsEn: [
        "What is this?",
        "How old are you?",
        "Where are you from?",
      ],
    }),
    speaking("ja-m23-8-2-rev-speak-1", M23_8_2_REVIEW[2].kana, M23_8_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m23-8-2-rev", M23_8_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M23_8_2.steps);
assertAnswerRotation(M23_8_2.steps, 1);
assertNoConsecutiveSame(M23_8_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

const ALL_M23 = [
  M23_1_1, M23_1_2, M23_2_1, M23_2_2, M23_3_1, M23_3_2,
  M23_4_1, M23_4_2, M23_5_1, M23_5_2, M23_6_1, M23_6_2,
  M23_STORY, M23_7_1, M23_7_2,
  // Unregistered expansion pair — still linted at import time:
  M23_8_1, M23_8_2,
];

assertNoSameAnswerCluster(ALL_M23.flatMap((l) => l.steps));

// Passive-card lint
for (const lesson of ALL_M23) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
