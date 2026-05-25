/**
 * M9 — na-Adjectives + Sentence-final particles (よ/ね).
 *
 * M9 introduces:
 *   - な-adjective present predicate: きれいです, しずかです
 *   - な-adjective attributive: きれいな はな (な before noun)
 *   - な-adjective negative: きれいじゃないです
 *   - Sentence-final よ (emphasis/conviction)
 *   - Sentence-final ね (agreement-seeking)
 *
 * Key teaching point: い-adj vs な-adj discrimination. きれい/きらい/ゆうめい
 * look like they end in い but they are な-adjectives.
 *
 * Split into 14 sub-lessons + 1 story = 15 exports.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() or
 * vocabMcq (image-MCQ-as-intro for concrete nouns). All drill uses factory
 * helpers from _jaGrammarHelpers.
 *
 * ID scheme: ja-m9-{n}-{sub} e.g. ja-m9-1-1, ja-m9-1-2
 * Export names: M9_1_1, M9_1_2, etc.
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
// Per-sub-lesson review-atom draws. Pool covers M1-M7 (M8 atoms are NOT
// in M3_M7_REVIEW_POOL yet; M9 draws from the M3-M7 pool only).
// ───────────────────────────────────────────────────────────────────────
const M9_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) =>
      ["m1", "m2", "m3", "m4", "m5", "m6", "m7"].includes(a.fromModule),
  ),
);
const M9_REVIEW_M1 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
);
const M9_REVIEW_M3 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
);
const M9_REVIEW_M4 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m4"),
);
const M9_REVIEW_M5 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m5"),
);
const M9_REVIEW_M6 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m6"),
);
const M9_REVIEW_M7 = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m7"),
);

// ═══════════════════════════════════════════════════════════════════════
// M9-1-1 — "Pretty and quiet" intro (きれい, しずか + grammarRule for な-adj)
// ═══════════════════════════════════════════════════════════════════════

const M9_1_1_REVIEW = pickReviewAtoms("ja-m9-1-1-rev", M9_REVIEW_M7, 4);

export const M9_1_1: LessonContent = {
  id: "ja-m9-1-1",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Pretty and quiet — intro",
  description:
    "Two na-adjectives (きれい, しずか) and the grammar rule that makes them different from i-adjectives.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-1-1-info-open",
      "A new kind of adjective",
      "Japanese has TWO adjective families. You already know い-adjectives (おおきい, あつい). Now meet な-adjectives — they look different and conjugate differently.",
    ),
    grammarRule({
      id: "ja-m9-1-1-rule-na-adj",
      title: "な-adjectives — the basics",
      rule: "な-adjectives use です for present ('きれいです') and add な before nouns ('きれいな はな'). They do NOT conjugate like い-adjectives.",
      examples: [
        { ja: "きれいです", romaji: "kirei desu", en: "It's pretty / It's clean" },
        { ja: "しずかです", romaji: "shizuka desu", en: "It's quiet" },
        { ja: "きれいな はな", romaji: "kirei na hana", en: "A pretty flower" },
      ],
      antiPattern: {
        ja: "きれいくないです",
        romaji: "kirei kunai desu",
        en: "(Treating きれい like an い-adjective)",
        why: "きれい is a な-adjective. The negative is きれいじゃないです, NOT きれいくないです.",
      },
      cultureNote:
        "Trap: きれい ends in い but it's a な-adjective! Same with きらい (dislike) and ゆうめい (famous). The い is part of the kanji reading, not an adjective ending.",
    }),
    // ── きれい (pretty/clean) — build intro ──
    build(
      "ja-m9-1-1-build-kirei",
      "Pick the Japanese word for: Pretty / Clean",
      "きれい",
      ["きれい", "しずか", "おおきい", "あつい"],
      ["きれい"],
    ),
    listeningCompSentence({
      id: "ja-m9-1-1-lc-kirei",
      audioText: "きれいです",
      correctMeaningEn: "It's pretty / It's clean",
      distractorsEn: ["It's quiet", "It's big", "It's hot"],
    }),
    vocabMcq(
      "ja-m9-1-1-mcq-kirei",
      { kana: "きれい", meaningEn: "pretty/clean", emoji: "✨", fromModule: "m7" },
      M9_REVIEW_M7,
    ),
    // ── しずか (quiet) — build intro ──
    build(
      "ja-m9-1-1-build-shizuka",
      "Pick the Japanese word for: Quiet",
      "しずか",
      ["しずか", "きれい", "にぎやか", "ちいさい"],
      ["しずか"],
    ),
    speaking("ja-m9-1-1-speak-shizuka", "しずかです", "It's quiet."),
    listeningCompSentence({
      id: "ja-m9-1-1-lc-shizuka",
      audioText: "しずかです",
      correctMeaningEn: "It's quiet",
      distractorsEn: ["It's pretty", "It's lively", "It's famous"],
    }),
    // ── Sentence builds using きれい/しずか + です ──
    build(
      "ja-m9-1-1-build-kirei-desu",
      "Say: It's pretty.",
      "きれいです",
      ["きれい", "です", "しずか", "な"],
      ["きれい", "です"],
    ),
    sentenceMcq({
      id: "ja-m9-1-1-mcq-kirei-na",
      prompt: "Which phrase means 'a pretty flower'?",
      correctKana: "きれいな はな",
      distractorsKana: [
        "きれいの はな",
        "きれい はな",
        "きれいい はな",
      ],
      explanation: "な-adjectives add な before a noun: きれいな はな.",
    }),
    build(
      "ja-m9-1-1-build-shizuka-na",
      "Say: A quiet library",
      "しずかな としょかん",
      ["しずか", "な", "としょかん", "きれい", "の"],
      ["しずか", "な", "としょかん"],
    ),
    cloze(
      "ja-m9-1-1-cloze-na",
      "きれい",
      " はな (a pretty flower)",
      "な",
      ["な", "の", "は", "い"],
      "A pretty flower",
      "きれいな はな",
      "な-adjectives use な (not の or い) before a noun.",
    ),
    listeningBuildSentence({
      id: "ja-m9-1-1-lb-shizuka",
      target: "しずかです",
      tiles: ["しずか", "です", "きれい", "な"],
      correctOrder: ["しずか", "です"],
      promptEn: "Hear it, build it: 'It's quiet.'",
    }),
    cloze(
      "ja-m9-1-1-cloze-ha",
      "この こうえん",
      " きれいです。 (This park is pretty.)",
      "は",
      ["は", "な", "が", "の"],
      "This park is pretty.",
      "この こうえんは きれいです。",
      "は marks the topic. The な-adjective きれい goes before です in the predicate.",
    ),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-1-1-se",
      anchorLabel: "You picked な in: きれい＿ はな (a pretty flower)",
      anchorAudioText: "きれいな はな",
      question: "Why is な correct between きれい and はな?",
      rule: { text: "な-adjectives add な before a noun they modify." },
      surface: { text: "な is always needed between any two Japanese words." },
      distractor: { text: "な is the topic marker for adjective sentences." },
      ruleExplanation:
        "きれい is a な-adjective. When it modifies a noun, it takes な: きれいな はな. い-adjectives don't use な (おおきい ねこ, not おおきいな ねこ).",
    }),
    speaking(
      "ja-m9-1-1-speak-kirei-na",
      "きれいな はな",
      "A pretty flower",
    ),
    // ── Review tail ──
    vocabMcq("ja-m9-1-1-rev-mcq-1", M9_1_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-1-1-rev-lc-1",
      audioText: M9_1_1_REVIEW[1].kana,
      correctMeaningEn: M9_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_1_1_REVIEW[2].meaningEn,
        M9_1_1_REVIEW[3].meaningEn,
        M9_REVIEW_M1[0].meaningEn,
      ],
    }),
    speaking("ja-m9-1-1-rev-speak-1", M9_1_1_REVIEW[2].kana, M9_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-1-1-rev", M9_1_1_REVIEW),
    infoStep(
      "ja-m9-1-1-info-end",
      "You can now describe things as pretty or quiet using な-adjectives",
      "きれいです (it's pretty), しずかです (it's quiet), and the な connector before nouns — a whole new adjective family.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_1_1.steps);
assertAnswerRotation(M9_1_1.steps, 2);
assertNoConsecutiveSame(M9_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-1-2 — "Pretty and quiet" practice (な-adj present + な before nouns)
// ═══════════════════════════════════════════════════════════════════════

const M9_1_2_REVIEW = pickReviewAtoms("ja-m9-1-2-rev", M9_REVIEW_M6, 4);

export const M9_1_2: LessonContent = {
  id: "ja-m9-1-2",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Pretty and quiet — practice",
  description:
    "Drill きれい and しずか in predicate and attributive positions. Rotate な with other particles.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-1-2-info-open",
      "Drill time — な in action",
      "You know きれい and しずか. Now use them in real sentences — both as predicates (きれいです) and before nouns (きれいな...).",
    ),
    // ── Predicate + attributive drills ──
    cloze(
      "ja-m9-1-2-cloze-na-1",
      "しずか",
      " まち (a quiet town)",
      "な",
      ["な", "の", "は", "に"],
      "A quiet town",
      "しずかな まち",
      "な-adjectives take な before a noun.",
    ),
    sentenceMcq({
      id: "ja-m9-1-2-mcq-pred",
      prompt: "Which sentence means 'The park is pretty.'?",
      correctKana: "こうえんは きれいです。",
      distractorsKana: [
        "こうえんは しずかです。",
        "こうえんは きれいな です。",
        "こうえんは きれいくないです。",
      ],
      explanation: "Predicate use: topic は + な-adj + です. No な before です.",
    }),
    build(
      "ja-m9-1-2-build-shizuka-machi",
      "Say: It's a quiet town.",
      "しずかな まちです",
      ["しずか", "な", "まち", "です", "きれい", "の"],
      ["しずか", "な", "まち", "です"],
    ),
    listeningCompSentence({
      id: "ja-m9-1-2-lc-kirei-pred",
      audioText: "この こうえんは きれいです",
      correctMeaningEn: "This park is pretty.",
      distractorsEn: ["This park is quiet.", "This park is famous.", "This park is lively."],
    }),
    cloze(
      "ja-m9-1-2-cloze-ha",
      "この へや",
      " しずかです。",
      "は",
      ["は", "な", "が", "を"],
      "This room is quiet.",
      "この へやは しずかです。",
      "は marks the topic. な only appears between a な-adj and a noun it modifies, not before です.",
    ),
    build(
      "ja-m9-1-2-build-kirei-na-hana",
      "Say: A pretty flower",
      "きれいな はな",
      ["きれい", "な", "はな", "の", "しずか"],
      ["きれい", "な", "はな"],
    ),
    sentenceMcq({
      id: "ja-m9-1-2-mcq-attr",
      prompt: "Which means 'a quiet room'?",
      correctKana: "しずかな へや",
      distractorsKana: [
        "しずかの へや",
        "しずかい へや",
        "しずか へや",
      ],
      explanation: "な-adjective + な + noun. Never の or い for な-adjectives.",
    }),
    cloze(
      "ja-m9-1-2-cloze-na-2",
      "きれい",
      " こうえん (a pretty park)",
      "な",
      ["な", "に", "で", "は"],
      "A pretty park",
      "きれいな こうえん",
      "な connects the な-adjective to the noun it modifies.",
    ),
    listeningBuildSentence({
      id: "ja-m9-1-2-lb-kirei-desu",
      target: "この はなは きれいです",
      tiles: ["この", "はな", "は", "きれい", "です", "しずか", "な"],
      correctOrder: ["この", "はな", "は", "きれい", "です"],
      promptEn: "Hear it, build it: 'This flower is pretty.'",
    }),
    speaking(
      "ja-m9-1-2-speak-shizuka-heya",
      "しずかな へや",
      "A quiet room",
    ),
    build(
      "ja-m9-1-2-build-kono-machi",
      "Say: This town is quiet.",
      "この まちは しずかです",
      ["この", "まち", "は", "しずか", "です", "きれい", "な"],
      ["この", "まち", "は", "しずか", "です"],
    ),
    sentenceMcq({
      id: "ja-m9-1-2-mcq-trap",
      prompt: "きれい is a な-adjective. How do you say 'a pretty park'?",
      correctKana: "きれいな こうえん",
      distractorsKana: [
        "きれいい こうえん",
        "きれいくない こうえん",
        "きれいの こうえん",
      ],
      explanation: "Even though きれい ends in い, it's a な-adjective: きれいな こうえん.",
    }),
    cloze(
      "ja-m9-1-2-cloze-ha-2",
      "としょかん",
      " しずかです。",
      "は",
      ["は", "な", "の", "が"],
      "The library is quiet.",
      "としょかんは しずかです。",
      "は marks the topic. しずかです is the predicate — no な needed here.",
    ),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-1-2-se",
      anchorLabel: "You said: この へやは しずかです (This room is quiet.)",
      anchorAudioText: "この へやは しずかです",
      question: "Why is there no な between しずか and です?",
      rule: { text: "な only appears when a な-adjective modifies a noun — not before です in the predicate." },
      surface: { text: "な is optional and can be dropped in casual speech." },
      distractor: { text: "です already contains the な sound, so it's combined." },
      ruleExplanation:
        "きれいな はな = な before a noun (attributive). きれいです = no な before です (predicate). Two different positions, two different rules.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-1-2-rev-mcq-1", M9_1_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-1-2-rev-lc-1",
      audioText: M9_1_2_REVIEW[1].kana,
      correctMeaningEn: M9_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_1_2_REVIEW[2].meaningEn,
        M9_1_2_REVIEW[3].meaningEn,
        M9_REVIEW_M1[1].meaningEn,
      ],
    }),
    speaking("ja-m9-1-2-rev-speak-1", M9_1_2_REVIEW[2].kana, M9_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-1-2-rev", M9_1_2_REVIEW),
    infoStep(
      "ja-m9-1-2-info-end",
      "You can now use な-adjectives as predicates AND before nouns",
      "きれいです (predicate) vs きれいな はな (before noun) — two positions, one adjective family. The な connector is the key.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_1_2.steps);
assertAnswerRotation(M9_1_2.steps, 2);
assertNoConsecutiveSame(M9_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-2-1 — "Like and dislike" intro (すき, きらい + Xが すきです pattern)
// ═══════════════════════════════════════════════════════════════════════

const M9_2_1_REVIEW = pickReviewAtoms("ja-m9-2-1-rev", M9_REVIEW_M5, 4);

export const M9_2_1: LessonContent = {
  id: "ja-m9-2-1",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Like and dislike — intro",
  description:
    "Two essential な-adjectives: すき (like) and きらい (dislike). Introduces the Xが すきです pattern.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-2-1-info-open",
      "What do you like?",
      "すき (like) and きらい (dislike) are な-adjectives — yes, even きらい which ends in い! The pattern: Xが すきです = 'I like X.'",
    ),
    grammarRule({
      id: "ja-m9-2-1-rule-suki",
      title: "Xが すきです — the 'like' pattern",
      rule: "In Japanese, 'like' is a な-adjective, not a verb. The thing you like takes が (not を): コーヒーが すきです = 'I like coffee.' (lit. 'Coffee is liked.')",
      examples: [
        { ja: "コーヒーが すきです", romaji: "koohii ga suki desu", en: "I like coffee" },
        { ja: "ねこが すきです", romaji: "neko ga suki desu", en: "I like cats" },
        { ja: "にほんごが すきです", romaji: "nihongo ga suki desu", en: "I like Japanese (the language)" },
      ],
      antiPattern: {
        ja: "コーヒーを すきです",
        romaji: "koohii wo suki desu",
        en: "(Using を instead of が with すき)",
        why: "すき is an adjective, not a verb. The liked thing is marked with が, not を.",
      },
      cultureNote:
        "Trap: きらい ends in い but it's a な-adjective! きらいな たべもの (disliked food), NOT きらいい.",
    }),
    // ── すき (like) — build intro ──
    build(
      "ja-m9-2-1-build-suki",
      "Pick the Japanese word for: Like",
      "すき",
      ["すき", "きらい", "すこし", "おおきい"],
      ["すき"],
    ),
    listeningCompSentence({
      id: "ja-m9-2-1-lc-suki",
      audioText: "すきです",
      correctMeaningEn: "I like (it) / (It's) liked",
      distractorsEn: ["I dislike (it)", "It's pretty", "It's quiet"],
    }),
    // ── きらい (dislike) — build intro ──
    build(
      "ja-m9-2-1-build-kirai",
      "Pick the Japanese word for: Dislike",
      "きらい",
      ["きらい", "すき", "きれい", "つまらない"],
      ["きらい"],
    ),
    speaking("ja-m9-2-1-speak-kirai", "きらいです", "I dislike (it)."),
    // ── Xが すきです sentence builds ──
    build(
      "ja-m9-2-1-build-coffee-suki",
      "Say: I like coffee.",
      "コーヒーが すきです",
      ["コーヒー", "が", "すき", "です", "を", "きらい"],
      ["コーヒー", "が", "すき", "です"],
    ),
    cloze(
      "ja-m9-2-1-cloze-ga-1",
      "ねこ",
      " すきです。 (I like cats.)",
      "が",
      ["が", "を", "は", "の"],
      "I like cats.",
      "ねこが すきです。",
      "With すき/きらい, the liked/disliked thing takes が.",
    ),
    sentenceMcq({
      id: "ja-m9-2-1-mcq-kirai",
      prompt: "Which sentence means 'I dislike fish.'?",
      correctKana: "さかなが きらいです。",
      distractorsKana: [
        "さかなが すきです。",
        "さかなを きらいです。",
        "さかなは きれいです。",
      ],
      explanation: "きらいです = dislike. The disliked thing takes が.",
    }),
    listeningBuildSentence({
      id: "ja-m9-2-1-lb-suki",
      target: "コーヒーが すきです",
      tiles: ["コーヒー", "が", "すき", "です", "を", "きらい"],
      correctOrder: ["コーヒー", "が", "すき", "です"],
      promptEn: "Hear it, build it: 'I like coffee.'",
    }),
    cloze(
      "ja-m9-2-1-cloze-ga-2",
      "にほんごが すき",
      "。",
      "です",
      ["です", "な", "は", "か"],
      "I like Japanese.",
      "にほんごが すきです。",
      "です completes the predicate in polite form.",
    ),
    build(
      "ja-m9-2-1-build-kirai-sentence",
      "Say: I dislike hot weather.",
      "あつい てんきが きらいです",
      ["あつい", "てんき", "が", "きらい", "です", "すき", "は"],
      ["あつい", "てんき", "が", "きらい", "です"],
    ),
    sentenceMcq({
      id: "ja-m9-2-1-mcq-suki-na",
      prompt: "How do you say 'a liked food' (favorite food)?",
      correctKana: "すきな たべもの",
      distractorsKana: [
        "すきい たべもの",
        "すきの たべもの",
        "すき たべもの",
      ],
      explanation: "すき is a な-adjective: すきな たべもの. NOT すきい.",
    }),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-2-1-se",
      anchorLabel: "You picked が in: ねこ＿ すきです (I like cats.)",
      anchorAudioText: "ねこが すきです",
      question: "Why does the liked thing take が, not を?",
      rule: { text: "すき/きらい are adjectives, not verbs. The thing liked/disliked is the grammatical subject (が), not the object (を)." },
      surface: { text: "が is always used after nouns in any sentence." },
      distractor: { text: "を only works with motion verbs like いきます." },
      ruleExplanation:
        "Japanese 'like' (すき) is a feeling-adjective, not an action. The thing you like is the subject of that feeling, so it takes が.",
    }),
    speaking(
      "ja-m9-2-1-speak-suki",
      "コーヒーが すきです",
      "I like coffee.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m9-2-1-rev-mcq-1", M9_2_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-2-1-rev-lc-1",
      audioText: M9_2_1_REVIEW[1].kana,
      correctMeaningEn: M9_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_2_1_REVIEW[2].meaningEn,
        M9_2_1_REVIEW[3].meaningEn,
        M9_REVIEW_M1[2].meaningEn,
      ],
    }),
    speaking("ja-m9-2-1-rev-speak-1", M9_2_1_REVIEW[3].kana, M9_2_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m9-2-1-rev", M9_2_1_REVIEW),
    infoStep(
      "ja-m9-2-1-info-end",
      "You can now say what you like and dislike in Japanese",
      "コーヒーが すきです (I like coffee), さかなが きらいです (I dislike fish). The が particle marks what you like — because すき and きらい are adjectives, not verbs.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_2_1.steps);
assertAnswerRotation(M9_2_1.steps, 2);
assertNoConsecutiveSame(M9_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-2-2 — "Like and dislike" practice (すき/きらい drill with が)
// ═══════════════════════════════════════════════════════════════════════

const M9_2_2_REVIEW = pickReviewAtoms("ja-m9-2-2-rev", M9_REVIEW_M4, 4);

export const M9_2_2: LessonContent = {
  id: "ja-m9-2-2",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Like and dislike — practice",
  description:
    "Drill すき and きらい with が in varied contexts. Discriminate between が and を.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-2-2-info-open",
      "What do YOU like?",
      "Drill すき and きらい with が across different topics — food, animals, places. The pattern stays the same: Xが すきです.",
    ),
    cloze(
      "ja-m9-2-2-cloze-ga-1",
      "ラーメン",
      " すきです。",
      "が",
      ["が", "を", "は", "で"],
      "I like ramen.",
      "ラーメンが すきです。",
      "The liked thing takes が with すき.",
    ),
    build(
      "ja-m9-2-2-build-inu-suki",
      "Say: I like dogs.",
      "いぬが すきです",
      ["いぬ", "が", "すき", "です", "を", "きらい"],
      ["いぬ", "が", "すき", "です"],
    ),
    sentenceMcq({
      id: "ja-m9-2-2-mcq-kirai-1",
      prompt: "Which means 'I dislike mornings.'?",
      correctKana: "あさが きらいです。",
      distractorsKana: [
        "あさが すきです。",
        "あさを きらいです。",
        "あさは きれいです。",
      ],
      explanation: "きらいです = dislike. あさ = morning. が marks what's disliked.",
    }),
    listeningCompSentence({
      id: "ja-m9-2-2-lc-suki",
      audioText: "すしが すきです",
      correctMeaningEn: "I like sushi.",
      distractorsEn: ["I dislike sushi.", "I eat sushi.", "Sushi is pretty."],
    }),
    cloze(
      "ja-m9-2-2-cloze-ga-2",
      "にほん",
      " すきです。",
      "が",
      ["が", "を", "に", "の"],
      "I like Japan.",
      "にほんが すきです。",
      "が with すき — Japan is the thing liked.",
    ),
    build(
      "ja-m9-2-2-build-kirai-sakana",
      "Say: I dislike fish.",
      "さかなが きらいです",
      ["さかな", "が", "きらい", "です", "すき", "は"],
      ["さかな", "が", "きらい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m9-2-2-lb-suki",
      target: "おちゃが すきです",
      tiles: ["おちゃ", "が", "すき", "です", "を", "きらい"],
      correctOrder: ["おちゃ", "が", "すき", "です"],
      promptEn: "Hear it, build it: 'I like green tea.'",
    }),
    sentenceMcq({
      id: "ja-m9-2-2-mcq-suki-vs-kirai",
      prompt: "すきな のみもの means...",
      correctKana: "A liked drink (favorite drink)",
      distractorsKana: [
        "A disliked drink",
        "A pretty drink",
        "A quiet drink",
      ],
      explanation: "すきな = liked/favorite (な-adj before noun). のみもの = drink.",
    }),
    cloze(
      "ja-m9-2-2-cloze-wo",
      "ラーメン",
      " たべます。 (I eat ramen.)",
      "を",
      ["を", "が", "は", "な"],
      "I eat ramen.",
      "ラーメンを たべます。",
      "Contrast: with the verb たべます, the direct object takes を. With すき (adjective), use が.",
    ),
    speaking(
      "ja-m9-2-2-speak-suki",
      "にほんが すきです",
      "I like Japan.",
    ),
    build(
      "ja-m9-2-2-build-sukina",
      "Say: My favorite food",
      "すきな たべもの",
      ["すき", "な", "たべもの", "の", "きらい"],
      ["すき", "な", "たべもの"],
    ),
    sentenceMcq({
      id: "ja-m9-2-2-mcq-disc",
      prompt: "Which particle goes with すきです: が or を?",
      correctKana: "が — because すき is an adjective, not a verb",
      distractorsKana: [
        "を — because the liked thing is a direct object",
        "は — because the liked thing is always the topic",
        "に — because すき expresses direction",
      ],
      explanation: "すき/きらい are な-adjectives. The liked/disliked thing is the subject → が.",
    }),
    cloze(
      "ja-m9-2-2-cloze-ga-3",
      "おんがく",
      " すきです。",
      "が",
      ["が", "を", "で", "に"],
      "I like music.",
      "おんがくが すきです。",
      "The liked thing takes が — consistent with all すき sentences.",
    ),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-2-2-se",
      anchorLabel: "You used が with すき, but を with たべます.",
      anchorAudioText: "コーヒーが すきです",
      question: "Why does すき use が while たべます uses を?",
      rule: { text: "すき is an adjective (describes a state), so the 'liked thing' is the subject (が). たべます is a verb (describes an action), so the eaten thing is the object (を)." },
      surface: { text: "が and を are interchangeable in all sentences." },
      distractor: { text: "が is used because すき originally comes from a verb meaning 'to prefer.'" },
      ruleExplanation:
        "This is one of the key insights: Japanese treats 'like' as a description (adj + が) rather than an action (verb + を). Different grammar, same meaning.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-2-2-rev-mcq-1", M9_2_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-2-2-rev-lc-1",
      audioText: M9_2_2_REVIEW[1].kana,
      correctMeaningEn: M9_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_2_2_REVIEW[2].meaningEn,
        M9_2_2_REVIEW[3].meaningEn,
        M9_REVIEW_M1[3].meaningEn,
      ],
    }),
    speaking("ja-m9-2-2-rev-speak-1", M9_2_2_REVIEW[2].kana, M9_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-2-2-rev", M9_2_2_REVIEW),
    infoStep(
      "ja-m9-2-2-info-end",
      "You can now express your likes and dislikes naturally in Japanese",
      "Xが すきです and Xが きらいです — with が, not を. You also know すきな たべもの (favorite food) uses な before a noun.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_2_2.steps);
assertAnswerRotation(M9_2_2.steps, 2);
assertNoConsecutiveSame(M9_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-3-1 — "Good at, bad at" intro (じょうず, へた + contrasting i-adj)
// ═══════════════════════════════════════════════════════════════════════

const M9_3_1_REVIEW = pickReviewAtoms("ja-m9-3-1-rev", M9_REVIEW_M3, 4);

export const M9_3_1: LessonContent = {
  id: "ja-m9-3-1",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Good at, bad at — intro",
  description:
    "Skill adjectives じょうず (skilled) and へた (unskilled). Same が pattern as すき/きらい.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-3-1-info-open",
      "Skills — good at this, bad at that",
      "じょうず (skilled/good at) and へた (unskilled/bad at) are な-adjectives. They use the same Xが pattern as すき: にほんごが じょうずです.",
    ),
    // ── じょうず (skilled) — build intro ──
    build(
      "ja-m9-3-1-build-jouzu",
      "Pick the Japanese word for: Skilled / Good at",
      "じょうず",
      ["じょうず", "へた", "すき", "じょうぶ"],
      ["じょうず"],
    ),
    listeningCompSentence({
      id: "ja-m9-3-1-lc-jouzu",
      audioText: "じょうずです",
      correctMeaningEn: "You're good at it / Skilled",
      distractorsEn: ["You're bad at it", "You like it", "It's quiet"],
    }),
    // ── へた (unskilled) — build intro ──
    build(
      "ja-m9-3-1-build-heta",
      "Pick the Japanese word for: Unskilled / Bad at",
      "へた",
      ["へた", "じょうず", "きらい", "ひま"],
      ["へた"],
    ),
    speaking("ja-m9-3-1-speak-heta", "へたです", "I'm bad at it."),
    // ── Sentence builds ──
    build(
      "ja-m9-3-1-build-jouzu-sent",
      "Say: You're good at Japanese.",
      "にほんごが じょうずです",
      ["にほんご", "が", "じょうず", "です", "へた", "を"],
      ["にほんご", "が", "じょうず", "です"],
    ),
    cloze(
      "ja-m9-3-1-cloze-ga-jouzu",
      "りょうり",
      " じょうずです。",
      "が",
      ["が", "を", "は", "で"],
      "You're good at cooking.",
      "りょうりが じょうずです。",
      "じょうず uses が for the skill — same pattern as すき.",
    ),
    sentenceMcq({
      id: "ja-m9-3-1-mcq-heta",
      prompt: "Which means 'I'm bad at singing.'?",
      correctKana: "うたが へたです。",
      distractorsKana: [
        "うたが じょうずです。",
        "うたを へたです。",
        "うたは すきです。",
      ],
      explanation: "へた = bad at/unskilled. うた = song/singing. が marks the skill.",
    }),
    listeningBuildSentence({
      id: "ja-m9-3-1-lb-jouzu",
      target: "にほんごが じょうずです",
      tiles: ["にほんご", "が", "じょうず", "です", "へた", "を"],
      correctOrder: ["にほんご", "が", "じょうず", "です"],
      promptEn: "Hear it, build it: 'You're good at Japanese.'",
    }),
    cloze(
      "ja-m9-3-1-cloze-na-jouzu",
      "じょうず",
      " ひと (a skilled person)",
      "な",
      ["な", "の", "い", "が"],
      "A skilled person",
      "じょうずな ひと",
      "じょうず is a な-adjective: じょうずな ひと (before nouns, use な).",
    ),
    build(
      "ja-m9-3-1-build-jouzu-na",
      "Say: A skilled cook (a person who's good at cooking)",
      "りょうりが じょうずな ひと",
      ["りょうり", "が", "じょうず", "な", "ひと", "の", "へた"],
      ["りょうり", "が", "じょうず", "な", "ひと"],
    ),
    sentenceMcq({
      id: "ja-m9-3-1-mcq-jouzu-na",
      prompt: "じょうず is a な-adjective. How do you say 'a skilled person'?",
      correctKana: "じょうずな ひと",
      distractorsKana: [
        "じょうずい ひと",
        "じょうずの ひと",
        "じょうず ひと",
      ],
      explanation: "な-adjective + な + noun: じょうずな ひと.",
    }),
    listeningCompSentence({
      id: "ja-m9-3-1-lc-heta-sent",
      audioText: "スポーツが へたです",
      correctMeaningEn: "I'm bad at sports.",
      distractorsEn: ["I'm good at sports.", "I like sports.", "I dislike sports."],
    }),
    speaking(
      "ja-m9-3-1-speak-jouzu",
      "にほんごが じょうずです",
      "You're good at Japanese.",
    ),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-3-1-se",
      anchorLabel: "じょうず and へた both use が — just like すき and きらい.",
      anchorAudioText: "りょうりが じょうずです",
      question: "Why do all four (すき, きらい, じょうず, へた) use が?",
      rule: { text: "They're all な-adjectives describing a state about a topic — the topic of the feeling/skill takes が." },
      surface: { text: "が is just more common than を in Japanese." },
      distractor: { text: "が is used because these words are all borrowed from Chinese." },
      ruleExplanation:
        "All four are stative な-adjectives. The thing you like/dislike/are-good-at/are-bad-at is the subject of a state — hence が.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-3-1-rev-mcq-1", M9_3_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-3-1-rev-lc-1",
      audioText: M9_3_1_REVIEW[1].kana,
      correctMeaningEn: M9_3_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_3_1_REVIEW[2].meaningEn,
        M9_3_1_REVIEW[3].meaningEn,
        M9_REVIEW_M1[4].meaningEn,
      ],
    }),
    speaking("ja-m9-3-1-rev-speak-1", M9_3_1_REVIEW[2].kana, M9_3_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-3-1-rev", M9_3_1_REVIEW),
    infoStep(
      "ja-m9-3-1-info-end",
      "You can now talk about skills — what you're good at and bad at",
      "にほんごが じょうずです (good at Japanese), りょうりが へたです (bad at cooking). Same が pattern as すき/きらい.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_3_1.steps);
assertAnswerRotation(M9_3_1.steps, 2);
assertNoConsecutiveSame(M9_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-3-2 — "Good at, bad at" practice (i-adj vs na-adj discrimination)
// ═══════════════════════════════════════════════════════════════════════

const M9_3_2_REVIEW = pickReviewAtoms("ja-m9-3-2-rev", M9_REVIEW_M6, 4);

export const M9_3_2: LessonContent = {
  id: "ja-m9-3-2",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Good at, bad at — practice",
  description:
    "Mixed drills contrasting い-adjectives and な-adjectives. Start seeing the difference in conjugation.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-3-2-info-open",
      "Spot the difference: い vs な",
      "You know both kinds now. い-adjectives (おおきい) and な-adjectives (じょうず). They look different before nouns and in negatives.",
    ),
    sentenceMcq({
      id: "ja-m9-3-2-mcq-type-1",
      prompt: "きれい is a...",
      correctKana: "な-adjective (きれいな はな, NOT きれいい はな)",
      distractorsKana: [
        "い-adjective (it ends in い)",
        "Verb (it describes an action)",
        "Noun (it names a thing)",
      ],
      explanation: "きれい LOOKS like it ends in い, but it's a な-adjective. The い is part of the kanji reading (綺麗).",
    }),
    cloze(
      "ja-m9-3-2-cloze-na-jouzu",
      "じょうず",
      " ひと (a skilled person)",
      "な",
      ["な", "い", "の", "く"],
      "A skilled person",
      "じょうずな ひと",
      "じょうず is a な-adjective: じょうずな ひと.",
    ),
    build(
      "ja-m9-3-2-build-ookii",
      "Say: A big dog (い-adjective)",
      "おおきい いぬ",
      ["おおきい", "いぬ", "な", "おおきな"],
      ["おおきい", "いぬ"],
    ),
    listeningCompSentence({
      id: "ja-m9-3-2-lc-jouzu",
      audioText: "りょうりが じょうずです",
      correctMeaningEn: "You're good at cooking.",
      distractorsEn: ["You're bad at cooking.", "You like cooking.", "Cooking is pretty."],
    }),
    sentenceMcq({
      id: "ja-m9-3-2-mcq-type-2",
      prompt: "きらい is a...",
      correctKana: "な-adjective (きらいな たべもの)",
      distractorsKana: [
        "い-adjective (it ends in い)",
        "Verb (it describes an action)",
        "Noun (it's a thing you feel)",
      ],
      explanation: "きらい ends in い but it's a な-adjective. きらいな たべもの, NOT きらいい.",
    }),
    cloze(
      "ja-m9-3-2-cloze-i-adj",
      "おおき",
      " ねこ (a big cat)",
      "い",
      ["い", "な", "の", "く"],
      "A big cat",
      "おおきい ねこ",
      "おおきい is an い-adjective — it keeps its い before a noun.",
    ),
    build(
      "ja-m9-3-2-build-heta-na",
      "Say: A person bad at sports",
      "スポーツが へたな ひと",
      ["スポーツ", "が", "へた", "な", "ひと", "い", "の"],
      ["スポーツ", "が", "へた", "な", "ひと"],
    ),
    listeningBuildSentence({
      id: "ja-m9-3-2-lb-kirai-na",
      target: "きらいな たべもの",
      tiles: ["きらい", "な", "たべもの", "い", "の", "すき"],
      correctOrder: ["きらい", "な", "たべもの"],
      promptEn: "Hear it, build it: 'A disliked food'",
    }),
    cloze(
      "ja-m9-3-2-cloze-na-kirei",
      "きれい",
      " はな (a pretty flower)",
      "な",
      ["な", "い", "く", "に"],
      "A pretty flower",
      "きれいな はな",
      "きれい is a な-adjective even though it ends in い.",
    ),
    sentenceMcq({
      id: "ja-m9-3-2-mcq-disc",
      prompt: "おおきい before a noun: おおきい ねこ. しずか before a noun: しずか___としょかん. Fill in ___.",
      correctKana: "な (しずかな としょかん)",
      distractorsKana: [
        "い (しずかい としょかん)",
        "の (しずかの としょかん)",
        "Nothing (しずか としょかん)",
      ],
      explanation: "い-adj keeps い before nouns. な-adj adds な before nouns.",
    }),
    speaking(
      "ja-m9-3-2-speak-jouzu",
      "りょうりが じょうずです",
      "You're good at cooking.",
    ),
    build(
      "ja-m9-3-2-build-kirei-heya",
      "Say: A pretty room",
      "きれいな へや",
      ["きれい", "な", "へや", "い", "の", "しずか"],
      ["きれい", "な", "へや"],
    ),
    listeningCompSentence({
      id: "ja-m9-3-2-lc-heta",
      audioText: "えいごが へたです",
      correctMeaningEn: "I'm bad at English.",
      distractorsEn: ["I'm good at English.", "I like English.", "English is famous."],
    }),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-3-2-se",
      anchorLabel: "きれい ends in い but takes な before nouns, not い.",
      anchorAudioText: "きれいな はな",
      question: "Why isn't きれい an い-adjective even though it ends in い?",
      rule: { text: "The い in きれい is part of the word's stem (from kanji 綺麗), not the adjective-class い ending. True い-adjectives have い as a removable suffix." },
      surface: { text: "Words ending in い are always い-adjectives." },
      distractor: { text: "きれい was originally a な-adjective but recently became an い-adjective." },
      ruleExplanation:
        "The test: can you remove the い and still have a real stem? おおきい → おおき (valid stem for conjugation). きれい → きれ (not how it conjugates). That's why きれい is na-class.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-3-2-rev-mcq-1", M9_3_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-3-2-rev-lc-1",
      audioText: M9_3_2_REVIEW[1].kana,
      correctMeaningEn: M9_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_3_2_REVIEW[2].meaningEn,
        M9_3_2_REVIEW[3].meaningEn,
        M9_REVIEW_M1[5].meaningEn,
      ],
    }),
    speaking("ja-m9-3-2-rev-speak-1", M9_3_2_REVIEW[3].kana, M9_3_2_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m9-3-2-rev", M9_3_2_REVIEW),
    infoStep(
      "ja-m9-3-2-info-end",
      "You can now tell い-adjectives from な-adjectives — even the tricky ones",
      "おおきい いぬ (い stays) vs きれいな はな (な added). The endings look similar but the grammar is different. You won't fall for the きれい trap again.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_3_2.steps);
assertAnswerRotation(M9_3_2.steps, 2);
assertNoConsecutiveSame(M9_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-4-1 — "How are you?" intro (げんき, ひま, たいへん, だいじょうぶ + よ)
// ═══════════════════════════════════════════════════════════════════════

const M9_4_1_REVIEW = pickReviewAtoms("ja-m9-4-1-rev", M9_REVIEW_M7, 4);

export const M9_4_1: LessonContent = {
  id: "ja-m9-4-1",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "How are you? — intro",
  description:
    "Four everyday な-adjectives (げんき, ひま, たいへん, だいじょうぶ) plus the sentence-final particle よ for emphasis.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-4-1-info-open",
      "Everyday feelings — and how to emphasize them",
      "Four words for daily life: げんき (energetic/well), ひま (free/not busy), たいへん (tough), だいじょうぶ (okay). Plus よ — a sentence-ender that adds punch.",
    ),
    // ── げんき (healthy/energetic) ──
    build(
      "ja-m9-4-1-build-genki",
      "Pick the Japanese word for: Healthy / Energetic",
      "げんき",
      ["げんき", "ひま", "たいへん", "だいじょうぶ"],
      ["げんき"],
    ),
    listeningCompSentence({
      id: "ja-m9-4-1-lc-genki",
      audioText: "げんきです",
      correctMeaningEn: "I'm well / I'm energetic",
      distractorsEn: ["I'm free (not busy)", "I'm in trouble", "I'm okay"],
    }),
    // ── ひま (free/not busy) ──
    build(
      "ja-m9-4-1-build-hima",
      "Pick the Japanese word for: Free / Not busy",
      "ひま",
      ["ひま", "げんき", "たいへん", "しずか"],
      ["ひま"],
    ),
    vocabMcq(
      "ja-m9-4-1-mcq-hima",
      { kana: "ひま", meaningEn: "free/not busy", emoji: "😴", fromModule: "m7" },
      M9_REVIEW_M7,
    ),
    // ── たいへん (tough/terrible) ──
    build(
      "ja-m9-4-1-build-taihen",
      "Pick the Japanese word for: Tough / Terrible",
      "たいへん",
      ["たいへん", "だいじょうぶ", "げんき", "ひま"],
      ["たいへん"],
    ),
    speaking("ja-m9-4-1-speak-taihen", "たいへんです", "It's tough."),
    // ── だいじょうぶ (okay/alright) ──
    build(
      "ja-m9-4-1-build-daijoubu",
      "Pick the Japanese word for: Okay / Alright",
      "だいじょうぶ",
      ["だいじょうぶ", "たいへん", "げんき", "きれい"],
      ["だいじょうぶ"],
    ),
    listeningCompSentence({
      id: "ja-m9-4-1-lc-daijoubu",
      audioText: "だいじょうぶです",
      correctMeaningEn: "It's okay / I'm alright",
      distractorsEn: ["It's tough", "I'm energetic", "I'm free"],
    }),
    // ── よ (sentence-final emphasis) ── grammar rule ──
    grammarRule({
      id: "ja-m9-4-1-rule-yo",
      title: "よ — telling someone something with conviction",
      rule: "よ goes at the very end of a sentence (after です/ます) to add emphasis — 'I'm telling you!' or 'Trust me!'. Use it when sharing information the listener might not know.",
      examples: [
        { ja: "げんきですよ", romaji: "genki desu yo", en: "I'm fine, really!" },
        { ja: "だいじょうぶですよ", romaji: "daijoubu desu yo", en: "It's okay, I promise!" },
        { ja: "おいしいですよ", romaji: "oishii desu yo", en: "It's delicious, you know!" },
      ],
      cultureNote:
        "Don't overuse よ — one per sentence max. Too many よ sounds pushy or condescending.",
    }),
    build(
      "ja-m9-4-1-build-genki-yo",
      "Say: I'm fine, really!",
      "げんきですよ",
      ["げんき", "です", "よ", "ね", "か"],
      ["げんき", "です", "よ"],
    ),
    sentenceMcq({
      id: "ja-m9-4-1-mcq-yo",
      prompt: "だいじょうぶですよ means...",
      correctKana: "It's okay, I tell you! (emphasis)",
      distractorsKana: [
        "Is it okay? (question)",
        "It's not okay.",
        "It's okay, right? (seeking agreement)",
      ],
      explanation: "よ adds emphasis/conviction. 'I'm telling you it's okay!'",
    }),
    cloze(
      "ja-m9-4-1-cloze-ha",
      "きょう",
      " ひまです。 (Today I'm free.)",
      "は",
      ["は", "が", "な", "も"],
      "Today I'm free.",
      "きょうは ひまです。",
      "は marks the topic (today). ひま is a な-adjective meaning free/not busy.",
    ),
    cloze(
      "ja-m9-4-1-cloze-yo",
      "たいへんです",
      "。 (It's tough, I tell you!)",
      "よ",
      ["よ", "ね", "か", "な"],
      "It's tough, I tell you!",
      "たいへんですよ。",
      "よ at the end adds emphasis — telling the listener something they should know.",
    ),
    listeningBuildSentence({
      id: "ja-m9-4-1-lb-daijoubu-yo",
      target: "だいじょうぶですよ",
      tiles: ["だいじょうぶ", "です", "よ", "ね", "か"],
      correctOrder: ["だいじょうぶ", "です", "よ"],
      promptEn: "Hear it, build it: 'It's okay, I promise!'",
    }),
    speaking(
      "ja-m9-4-1-speak-daijoubu-yo",
      "だいじょうぶですよ",
      "It's okay, I promise!",
    ),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-4-1-se",
      anchorLabel: "You said: たいへんですよ (It's tough, I tell you!)",
      anchorAudioText: "たいへんですよ",
      question: "What does よ do at the end of a sentence?",
      rule: { text: "よ adds emphasis — the speaker is informing the listener of something with conviction." },
      surface: { text: "よ is just a politeness marker like です." },
      distractor: { text: "よ turns the sentence into a question." },
      ruleExplanation:
        "よ = 'I'm telling you!' It's not a question (that's か), not agreement-seeking (that's ね). It's the speaker asserting something the listener should know.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-4-1-rev-mcq-1", M9_4_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-4-1-rev-lc-1",
      audioText: M9_4_1_REVIEW[1].kana,
      correctMeaningEn: M9_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_4_1_REVIEW[2].meaningEn,
        M9_4_1_REVIEW[3].meaningEn,
        M9_REVIEW_M1[6].meaningEn,
      ],
    }),
    speaking("ja-m9-4-1-rev-speak-1", M9_4_1_REVIEW[2].kana, M9_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-4-1-rev", M9_4_1_REVIEW),
    infoStep(
      "ja-m9-4-1-info-end",
      "You can now describe how you feel — and say it with conviction",
      "げんきですよ (I'm well, really!), たいへんです (it's tough), だいじょうぶですよ (it's okay, trust me). よ adds that extra punch.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_4_1.steps);
assertAnswerRotation(M9_4_1.steps, 1);
assertNoConsecutiveSame(M9_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-4-2 — "How are you?" practice (よ/ね sentence-finals in context)
// ═══════════════════════════════════════════════════════════════════════

const M9_4_2_REVIEW = pickReviewAtoms("ja-m9-4-2-rev", M9_REVIEW_M5, 4);

export const M9_4_2: LessonContent = {
  id: "ja-m9-4-2",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "How are you? — practice",
  description:
    "Drill よ (emphasis) and introduce ね (agreement-seeking). Discriminate between the two sentence-final particles.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-4-2-info-open",
      "Two sentence-enders — one asserts, one invites",
      "You know よ (emphasis). Now meet ね — it seeks agreement. 'きれいですね' = 'It's pretty, isn't it?' Both go after です/ます.",
    ),
    grammarRule({
      id: "ja-m9-4-2-rule-ne",
      title: "ね — seeking agreement, inviting confirmation",
      rule: "ね goes at the end of a sentence to seek agreement or invite shared feeling — 'right?', 'isn't it?', 'don't you think?' Use it when you expect the listener to agree.",
      examples: [
        { ja: "きれいですね", romaji: "kirei desu ne", en: "It's pretty, isn't it?" },
        { ja: "きょうは あついですね", romaji: "kyou wa atsui desu ne", en: "It's hot today, right?" },
        { ja: "おいしいですね", romaji: "oishii desu ne", en: "It's delicious, don't you think?" },
      ],
      cultureNote:
        "ね is very common in daily Japanese. It builds rapport — showing you're on the same page. よ tells, ね asks to share.",
    }),
    cloze(
      "ja-m9-4-2-cloze-ne-1",
      "きれいです",
      "。 (It's pretty, isn't it?)",
      "ね",
      ["ね", "よ", "か", "な"],
      "It's pretty, isn't it?",
      "きれいですね。",
      "ね seeks agreement — 'don't you think so too?'",
    ),
    build(
      "ja-m9-4-2-build-atsui-ne",
      "Say: It's hot today, right?",
      "きょうは あついですね",
      ["きょう", "は", "あつい", "です", "ね", "よ", "か"],
      ["きょう", "は", "あつい", "です", "ね"],
    ),
    sentenceMcq({
      id: "ja-m9-4-2-mcq-yo-vs-ne",
      prompt: "You're telling a friend about a restaurant they haven't tried: 'It's delicious, you know!' Which ending?",
      correctKana: "おいしいですよ (sharing new info with emphasis)",
      distractorsKana: [
        "おいしいですね (seeking agreement about shared experience)",
        "おいしいですか (asking a question)",
        "おいしいです (neutral statement)",
      ],
      explanation: "よ = 'I'm telling you something new.' ね = 'We both know this, right?' Here you're informing → よ.",
    }),
    listeningCompSentence({
      id: "ja-m9-4-2-lc-ne",
      audioText: "この まちは しずかですね",
      correctMeaningEn: "This town is quiet, isn't it?",
      distractorsEn: [
        "This town is quiet, I tell you!",
        "Is this town quiet?",
        "This town is not quiet.",
      ],
    }),
    cloze(
      "ja-m9-4-2-cloze-yo-1",
      "げんきです",
      "。 (I'm fine, really!)",
      "よ",
      ["よ", "ね", "か", "は"],
      "I'm fine, really!",
      "げんきですよ。",
      "よ adds conviction — 'I'm telling you I'm fine!'",
    ),
    build(
      "ja-m9-4-2-build-shizuka-ne",
      "Say: It's quiet, isn't it?",
      "しずかですね",
      ["しずか", "です", "ね", "よ", "か"],
      ["しずか", "です", "ね"],
    ),
    sentenceMcq({
      id: "ja-m9-4-2-mcq-ne-context",
      prompt: "You and a friend are both looking at a beautiful sunset. Which ending fits?",
      correctKana: "きれいですね (shared experience, seeking agreement)",
      distractorsKana: [
        "きれいですよ (telling someone something new)",
        "きれいですか (asking if it's pretty)",
        "きれいです (flat statement)",
      ],
      explanation: "You're both experiencing it → ね (shared feeling). よ would be for informing someone who hasn't seen it.",
    }),
    listeningBuildSentence({
      id: "ja-m9-4-2-lb-genki-yo",
      target: "げんきですよ",
      tiles: ["げんき", "です", "よ", "ね", "か"],
      correctOrder: ["げんき", "です", "よ"],
      promptEn: "Hear it, build it: 'I'm fine, really!'",
    }),
    cloze(
      "ja-m9-4-2-cloze-ne-2",
      "にほんごが じょうずです",
      "。 (You're good at Japanese, aren't you?)",
      "ね",
      ["ね", "よ", "が", "は"],
      "You're good at Japanese, aren't you?",
      "にほんごが じょうずですね。",
      "ね invites agreement — complimenting with a shared observation.",
    ),
    speaking(
      "ja-m9-4-2-speak-kirei-ne",
      "きれいですね",
      "It's pretty, isn't it?",
    ),
    build(
      "ja-m9-4-2-build-taihen-yo",
      "Say: It's tough, I tell you!",
      "たいへんですよ",
      ["たいへん", "です", "よ", "ね", "か"],
      ["たいへん", "です", "よ"],
    ),
    listeningCompSentence({
      id: "ja-m9-4-2-lc-yo",
      audioText: "だいじょうぶですよ",
      correctMeaningEn: "It's okay, I promise!",
      distractorsEn: [
        "Is it okay?",
        "It's okay, right?",
        "It's not okay.",
      ],
    }),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-4-2-se",
      anchorLabel: "よ vs ね — both go after です but do different things.",
      anchorAudioText: "きれいですね",
      question: "What's the difference between よ and ね?",
      rule: { text: "よ asserts something the listener might not know (informing). ね invites agreement about something shared (confirming)." },
      surface: { text: "よ is for men and ね is for women." },
      distractor: { text: "よ makes a sentence formal and ね makes it casual." },
      ruleExplanation:
        "Both are gender-neutral. よ = 'I'm telling you!' (new info). ね = 'Right?' (shared experience). The distinction is about whether you're informing or confirming.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-4-2-rev-mcq-1", M9_4_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-4-2-rev-lc-1",
      audioText: M9_4_2_REVIEW[1].kana,
      correctMeaningEn: M9_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_4_2_REVIEW[2].meaningEn,
        M9_4_2_REVIEW[3].meaningEn,
        M9_REVIEW_M1[7].meaningEn,
      ],
    }),
    speaking("ja-m9-4-2-rev-speak-1", M9_4_2_REVIEW[2].kana, M9_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-4-2-rev", M9_4_2_REVIEW),
    infoStep(
      "ja-m9-4-2-info-end",
      "You can now emphasize with よ and invite agreement with ね",
      "だいじょうぶですよ (It's okay, trust me!) vs きれいですね (It's pretty, isn't it?). Two tiny particles that transform how your sentences feel.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_4_2.steps);
assertAnswerRotation(M9_4_2.steps, 2);
assertNoConsecutiveSame(M9_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-5-1 — "Convenient or not" intro (べんり, ふべん, かんたん + negative)
// ═══════════════════════════════════════════════════════════════════════

const M9_5_1_REVIEW = pickReviewAtoms("ja-m9-5-1-rev", M9_REVIEW_M4, 4);

export const M9_5_1: LessonContent = {
  id: "ja-m9-5-1",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Convenient or not — intro",
  description:
    "Three な-adjectives about utility (べんり, ふべん, かんたん) plus the な-adjective negative: じゃないです.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-5-1-info-open",
      "Useful or not? Simple or not?",
      "べんり (convenient), ふべん (inconvenient), かんたん (simple/easy). Plus the big one: how to say 'NOT' with な-adjectives.",
    ),
    // ── べんり (convenient) ──
    build(
      "ja-m9-5-1-build-benri",
      "Pick the Japanese word for: Convenient",
      "べんり",
      ["べんり", "ふべん", "かんたん", "きれい"],
      ["べんり"],
    ),
    listeningCompSentence({
      id: "ja-m9-5-1-lc-benri",
      audioText: "べんりです",
      correctMeaningEn: "It's convenient",
      distractorsEn: ["It's inconvenient", "It's simple", "It's pretty"],
    }),
    // ── ふべん (inconvenient) ──
    build(
      "ja-m9-5-1-build-fuben",
      "Pick the Japanese word for: Inconvenient",
      "ふべん",
      ["ふべん", "べんり", "たいへん", "ひま"],
      ["ふべん"],
    ),
    speaking("ja-m9-5-1-speak-fuben", "ふべんです", "It's inconvenient."),
    // ── かんたん (simple/easy) ──
    build(
      "ja-m9-5-1-build-kantan",
      "Pick the Japanese word for: Simple / Easy",
      "かんたん",
      ["かんたん", "たいへん", "べんり", "じょうず"],
      ["かんたん"],
    ),
    vocabMcq(
      "ja-m9-5-1-mcq-kantan",
      { kana: "かんたん", meaningEn: "simple/easy", emoji: "👌", fromModule: "m7" },
      M9_REVIEW_M7,
    ),
    // ── な-adjective negative: じゃないです ──
    grammarRule({
      id: "ja-m9-5-1-rule-neg",
      title: "な-adjective negative: じゃないです",
      rule: "To negate a な-adjective, replace です with じゃないです. きれいです → きれいじゃないです. Do NOT use くないです — that's for い-adjectives only.",
      examples: [
        { ja: "べんりじゃないです", romaji: "benri ja nai desu", en: "It's not convenient" },
        { ja: "しずかじゃないです", romaji: "shizuka ja nai desu", en: "It's not quiet" },
        { ja: "かんたんじゃないです", romaji: "kantan ja nai desu", en: "It's not simple" },
      ],
      antiPattern: {
        ja: "きれいくないです",
        romaji: "kirei kunai desu",
        en: "(Treating きれい as an い-adjective in the negative)",
        why: "きれい is a な-adjective. Negative = きれいじゃないです, NOT きれいくないです (that pattern is for い-adjectives like おおきくないです).",
      },
    }),
    sentenceMcq({
      id: "ja-m9-5-1-mcq-neg-1",
      prompt: "How do you say 'It's not convenient'?",
      correctKana: "べんりじゃないです",
      distractorsKana: [
        "べんりくないです",
        "べんりないです",
        "べんりじゃありません",
      ],
      explanation: "な-adjective negative: stem + じゃないです. NOT くないです.",
    }),
    build(
      "ja-m9-5-1-build-shizuka-neg",
      "Say: It's not quiet.",
      "しずかじゃないです",
      ["しずか", "じゃないです", "くないです", "です", "な"],
      ["しずか", "じゃないです"],
    ),
    cloze(
      "ja-m9-5-1-cloze-ha",
      "この まち",
      " べんりです。 (This town is convenient.)",
      "は",
      ["は", "が", "な", "の"],
      "This town is convenient.",
      "この まちは べんりです。",
      "は marks the topic. べんり is a な-adjective: べんりです in the predicate.",
    ),
    cloze(
      "ja-m9-5-1-cloze-neg",
      "かんたん",
      "。 (It's not simple.)",
      "じゃないです",
      ["じゃないです", "くないです", "です", "な"],
      "It's not simple.",
      "かんたんじゃないです。",
      "な-adjective negative pattern: stem + じゃないです.",
    ),
    listeningCompSentence({
      id: "ja-m9-5-1-lc-neg",
      audioText: "べんりじゃないです",
      correctMeaningEn: "It's not convenient",
      distractorsEn: ["It's convenient", "It's not simple", "It's inconvenient"],
    }),
    listeningBuildSentence({
      id: "ja-m9-5-1-lb-neg",
      target: "きれいじゃないです",
      tiles: ["きれい", "じゃないです", "くないです", "です", "な"],
      correctOrder: ["きれい", "じゃないです"],
      promptEn: "Hear it, build it: 'It's not pretty.'",
    }),
    build(
      "ja-m9-5-1-build-fuben-sent",
      "Say: This town is not convenient.",
      "この まちは べんりじゃないです",
      ["この", "まち", "は", "べんり", "じゃないです", "くないです", "です"],
      ["この", "まち", "は", "べんり", "じゃないです"],
    ),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-5-1-se",
      anchorLabel: "You said: きれいじゃないです (It's not pretty.)",
      anchorAudioText: "きれいじゃないです",
      question: "Why is it じゃないです and not くないです for きれい?",
      rule: { text: "きれい is a な-adjective. な-adj negative = stem + じゃないです. くないです is for い-adjectives only." },
      surface: { text: "じゃないです and くないです are interchangeable." },
      distractor: { text: "くないです is more formal; じゃないです is casual." },
      ruleExplanation:
        "Two families, two negative patterns. い-adj: おおきい → おおきくないです (remove い, add くないです). な-adj: きれい → きれいじゃないです (keep stem, add じゃないです).",
    }),
    speaking(
      "ja-m9-5-1-speak-kantan-neg",
      "かんたんじゃないです",
      "It's not simple.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m9-5-1-rev-mcq-1", M9_5_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-5-1-rev-lc-1",
      audioText: M9_5_1_REVIEW[1].kana,
      correctMeaningEn: M9_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_5_1_REVIEW[2].meaningEn,
        M9_5_1_REVIEW[3].meaningEn,
        M9_REVIEW_M1[8].meaningEn,
      ],
    }),
    speaking("ja-m9-5-1-rev-speak-1", M9_5_1_REVIEW[3].kana, M9_5_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m9-5-1-rev", M9_5_1_REVIEW),
    infoStep(
      "ja-m9-5-1-info-end",
      "You can now say what's convenient, simple, and — crucially — what's NOT",
      "べんりです (convenient) → べんりじゃないです (not convenient). The negative is completely different from い-adjectives. No more くないです confusion.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_5_1.steps);
assertAnswerRotation(M9_5_1.steps, 2);
assertNoConsecutiveSame(M9_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-5-2 — "Convenient or not" practice (な-adj negative drill)
// ═══════════════════════════════════════════════════════════════════════

const M9_5_2_REVIEW = pickReviewAtoms("ja-m9-5-2-rev", M9_REVIEW_M3, 4);

export const M9_5_2: LessonContent = {
  id: "ja-m9-5-2",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Convenient or not — practice",
  description:
    "Drill な-adjective negatives with じゃないです across multiple adjectives. Contrast with い-adj negatives.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-5-2-info-open",
      "Negative drill — な-style only",
      "Practice saying things are NOT something using な-adjective negatives. Every one uses じゃないです, never くないです.",
    ),
    cloze(
      "ja-m9-5-2-cloze-neg-1",
      "げんき",
      "。 (I'm not well.)",
      "じゃないです",
      ["じゃないです", "くないです", "です", "ではないです"],
      "I'm not well.",
      "げんきじゃないです。",
      "げんき is a な-adjective → じゃないです.",
    ),
    build(
      "ja-m9-5-2-build-hima-neg",
      "Say: I'm not free (I'm busy).",
      "ひまじゃないです",
      ["ひま", "じゃないです", "くないです", "です"],
      ["ひま", "じゃないです"],
    ),
    sentenceMcq({
      id: "ja-m9-5-2-mcq-neg-1",
      prompt: "How do you say 'It's not okay'?",
      correctKana: "だいじょうぶじゃないです",
      distractorsKana: [
        "だいじょうぶくないです",
        "だいじょうぶないです",
        "だいじょうぶではないです",
      ],
      explanation: "だいじょうぶ is a な-adjective → だいじょうぶじゃないです.",
    }),
    listeningCompSentence({
      id: "ja-m9-5-2-lc-neg-1",
      audioText: "しずかじゃないです",
      correctMeaningEn: "It's not quiet",
      distractorsEn: ["It's quiet", "It's not pretty", "It's not convenient"],
    }),
    cloze(
      "ja-m9-5-2-cloze-ga",
      "コーヒー",
      " すきじゃないです。 (I don't like coffee.)",
      "が",
      ["が", "を", "は", "の"],
      "I don't like coffee.",
      "コーヒーが すきじゃないです。",
      "Even in the negative, すき uses が for the liked thing.",
    ),
    build(
      "ja-m9-5-2-build-jouzu-neg",
      "Say: I'm not good at Japanese.",
      "にほんごが じょうずじゃないです",
      ["にほんご", "が", "じょうず", "じゃないです", "くないです", "を"],
      ["にほんご", "が", "じょうず", "じゃないです"],
    ),
    sentenceMcq({
      id: "ja-m9-5-2-mcq-contrast",
      prompt: "い-adjective negative: おおきい → おおきくないです. How about な-adjective しずか?",
      correctKana: "しずかじゃないです",
      distractorsKana: [
        "しずかくないです",
        "しずかいくないです",
        "しずかないです",
      ],
      explanation: "Two different negative patterns: い-adj → くないです, な-adj → じゃないです.",
    }),
    listeningBuildSentence({
      id: "ja-m9-5-2-lb-neg",
      target: "すきじゃないです",
      tiles: ["すき", "じゃないです", "くないです", "です", "が"],
      correctOrder: ["すき", "じゃないです"],
      promptEn: "Hear it, build it: 'I don't like it.'",
    }),
    cloze(
      "ja-m9-5-2-cloze-neg-3",
      "きれい",
      "。 (It's not pretty.)",
      "じゃないです",
      ["じゃないです", "くないです", "な", "です"],
      "It's not pretty.",
      "きれいじゃないです。",
      "きれい is a な-adjective (despite ending in い) → じゃないです.",
    ),
    build(
      "ja-m9-5-2-build-kirai-neg",
      "Say: I don't dislike it.",
      "きらいじゃないです",
      ["きらい", "じゃないです", "くないです", "です"],
      ["きらい", "じゃないです"],
    ),
    speaking(
      "ja-m9-5-2-speak-genki-neg",
      "げんきじゃないです",
      "I'm not well.",
    ),
    listeningCompSentence({
      id: "ja-m9-5-2-lc-neg-2",
      audioText: "べんりじゃないです",
      correctMeaningEn: "It's not convenient",
      distractorsEn: ["It's convenient", "It's not quiet", "It's not simple"],
    }),
    sentenceMcq({
      id: "ja-m9-5-2-mcq-neg-2",
      prompt: "Which is correct for 'It's not famous'?",
      correctKana: "ゆうめいじゃないです",
      distractorsKana: [
        "ゆうめいくないです",
        "ゆうめいないです",
        "ゆうめいな じゃないです",
      ],
      explanation: "ゆうめい is a な-adjective → ゆうめいじゃないです.",
    }),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-5-2-se",
      anchorLabel: "きれいじゃないです, but おおきくないです — two different negatives.",
      anchorAudioText: "きれいじゃないです",
      question: "How do you remember which negative pattern to use?",
      rule: { text: "Check the adjective class: い-adj (stem ends in い that conjugates) → くないです. な-adj (needs な before nouns) → じゃないです." },
      surface: { text: "Always use じゃないです for any Japanese adjective." },
      distractor: { text: "Use くないです for short adjectives and じゃないです for long ones." },
      ruleExplanation:
        "The class determines the pattern. い-adj: drop い, add くないです. な-adj: keep the whole word, add じゃないです. The trick words (きれい, きらい) are な-class despite ending in い.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-5-2-rev-mcq-1", M9_5_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-5-2-rev-lc-1",
      audioText: M9_5_2_REVIEW[1].kana,
      correctMeaningEn: M9_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_5_2_REVIEW[2].meaningEn,
        M9_5_2_REVIEW[3].meaningEn,
        M9_REVIEW_M1[9].meaningEn,
      ],
    }),
    speaking("ja-m9-5-2-rev-speak-1", M9_5_2_REVIEW[2].kana, M9_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-5-2-rev", M9_5_2_REVIEW),
    infoStep(
      "ja-m9-5-2-info-end",
      "You can now negate any な-adjective cleanly",
      "すきじゃないです, きれいじゃないです, げんきじゃないです — all the same pattern. You'll never confuse it with the い-adjective くないです again.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_5_2.steps);
assertAnswerRotation(M9_5_2.steps, 2);
assertNoConsecutiveSame(M9_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-6-1 — "Famous and lively" intro (ゆうめい, にぎやか + とても/すこし/ちょっと)
// ═══════════════════════════════════════════════════════════════════════

const M9_6_1_REVIEW = pickReviewAtoms("ja-m9-6-1-rev", M9_REVIEW_M6, 4);

export const M9_6_1: LessonContent = {
  id: "ja-m9-6-1",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Famous and lively — intro",
  description:
    "Two more な-adjectives (ゆうめい, にぎやか) plus degree adverbs: とても (very), すこし (a little), ちょっと (a bit).",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-6-1-info-open",
      "How famous? How lively? Degree words.",
      "ゆうめい (famous) and にぎやか (lively/bustling). Plus three degree words: とても (very), すこし (a little), ちょっと (a bit — casual).",
    ),
    // ── ゆうめい (famous) ──
    build(
      "ja-m9-6-1-build-yuumei",
      "Pick the Japanese word for: Famous",
      "ゆうめい",
      ["ゆうめい", "にぎやか", "きれい", "しずか"],
      ["ゆうめい"],
    ),
    listeningCompSentence({
      id: "ja-m9-6-1-lc-yuumei",
      audioText: "ゆうめいです",
      correctMeaningEn: "It's famous",
      distractorsEn: ["It's lively", "It's pretty", "It's quiet"],
    }),
    // ── にぎやか (lively/bustling) ──
    build(
      "ja-m9-6-1-build-nigiyaka",
      "Pick the Japanese word for: Lively / Bustling",
      "にぎやか",
      ["にぎやか", "しずか", "ゆうめい", "げんき"],
      ["にぎやか"],
    ),
    speaking("ja-m9-6-1-speak-nigiyaka", "にぎやかです", "It's lively."),
    // ── Degree adverbs: とても, すこし, ちょっと ──
    build(
      "ja-m9-6-1-build-totemo",
      "Pick the Japanese word for: Very",
      "とても",
      ["とても", "すこし", "ちょっと", "たくさん"],
      ["とても"],
    ),
    sentenceMcq({
      id: "ja-m9-6-1-mcq-totemo",
      prompt: "とても ゆうめいです means...",
      correctKana: "It's very famous",
      distractorsKana: [
        "It's a little famous",
        "It's not famous",
        "Is it famous?",
      ],
      explanation: "とても = very. とても + adjective = very [adjective].",
    }),
    build(
      "ja-m9-6-1-build-sukoshi",
      "Pick the Japanese word for: A little",
      "すこし",
      ["すこし", "とても", "ちょっと", "おおきい"],
      ["すこし"],
    ),
    listeningCompSentence({
      id: "ja-m9-6-1-lc-sukoshi",
      audioText: "すこし しずかです",
      correctMeaningEn: "It's a little quiet",
      distractorsEn: ["It's very quiet", "It's not quiet", "It's quiet, right?"],
    }),
    build(
      "ja-m9-6-1-build-chotto",
      "Pick the Japanese word for: A bit (casual)",
      "ちょっと",
      ["ちょっと", "すこし", "とても", "ちかい"],
      ["ちょっと"],
    ),
    // ── Sentence builds with degree adverbs ──
    build(
      "ja-m9-6-1-build-totemo-yuumei",
      "Say: This temple is very famous.",
      "この おてらは とても ゆうめいです",
      ["この", "おてら", "は", "とても", "ゆうめい", "です", "すこし"],
      ["この", "おてら", "は", "とても", "ゆうめい", "です"],
    ),
    cloze(
      "ja-m9-6-1-cloze-totemo",
      "",
      " にぎやかです。 (It's very lively.)",
      "とても",
      ["とても", "すこし", "ちょっと", "あまり"],
      "It's very lively.",
      "とても にぎやかです。",
      "とても = very. Placed before the adjective.",
    ),
    sentenceMcq({
      id: "ja-m9-6-1-mcq-sukoshi",
      prompt: "すこし ふべんです means...",
      correctKana: "It's a little inconvenient",
      distractorsKana: [
        "It's very inconvenient",
        "It's not inconvenient",
        "It's convenient",
      ],
      explanation: "すこし = a little. すこし + ふべん = a little inconvenient.",
    }),
    listeningBuildSentence({
      id: "ja-m9-6-1-lb-totemo",
      target: "とても きれいです",
      tiles: ["とても", "きれい", "です", "すこし", "な"],
      correctOrder: ["とても", "きれい", "です"],
      promptEn: "Hear it, build it: 'It's very pretty.'",
    }),
    cloze(
      "ja-m9-6-1-cloze-na-yuumei",
      "ゆうめい",
      " ひと (a famous person)",
      "な",
      ["な", "の", "い", "で"],
      "A famous person",
      "ゆうめいな ひと",
      "ゆうめい is a な-adjective: ゆうめいな ひと.",
    ),
    speaking(
      "ja-m9-6-1-speak-totemo-kirei",
      "とても きれいですね",
      "It's very pretty, isn't it?",
    ),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-6-1-se",
      anchorLabel: "ゆうめい ends in い — but you put な before a noun.",
      anchorAudioText: "ゆうめいな ひと",
      question: "Why is ゆうめい a な-adjective?",
      rule: { text: "The い in ゆうめい is part of the kanji stem (有名), not a conjugatable adjective ending. It needs な before nouns." },
      surface: { text: "Any word ending in い is an い-adjective." },
      distractor: { text: "ゆうめい is both an い-adjective and a な-adjective." },
      ruleExplanation:
        "Like きれい and きらい, ゆうめい has an い that comes from the Chinese-derived reading, not from the Japanese adjective system. Test: can you drop the い and conjugate? No → な-adjective.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-6-1-rev-mcq-1", M9_6_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-6-1-rev-lc-1",
      audioText: M9_6_1_REVIEW[1].kana,
      correctMeaningEn: M9_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_6_1_REVIEW[2].meaningEn,
        M9_6_1_REVIEW[3].meaningEn,
        M9_REVIEW_M1[10].meaningEn,
      ],
    }),
    speaking("ja-m9-6-1-rev-speak-1", M9_6_1_REVIEW[2].kana, M9_6_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-6-1-rev", M9_6_1_REVIEW),
    infoStep(
      "ja-m9-6-1-info-end",
      "You can now describe HOW much — very famous, a little quiet, a bit inconvenient",
      "とても ゆうめいです (very famous), すこし しずかです (a little quiet), ちょっと ふべんです (a bit inconvenient). Degree words slot right before the adjective.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_6_1.steps);
assertAnswerRotation(M9_6_1.steps, 2);
assertNoConsecutiveSame(M9_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-6-2 — "Famous and lively" practice (degree adverbs + adj)
// ═══════════════════════════════════════════════════════════════════════

const M9_6_2_REVIEW = pickReviewAtoms("ja-m9-6-2-rev", M9_REVIEW_M7, 4);

export const M9_6_2: LessonContent = {
  id: "ja-m9-6-2",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Famous and lively — practice",
  description:
    "Drill degree adverbs with な-adjectives. Mix とても, すこし, ちょっと across contexts.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-6-2-info-open",
      "Dial it up or down",
      "Mix degree adverbs freely: とても (very), すこし (a little), ちょっと (a bit). All slot right before the adjective.",
    ),
    cloze(
      "ja-m9-6-2-cloze-totemo",
      "",
      " にぎやかですね。 (It's very lively, isn't it?)",
      "とても",
      ["とても", "すこし", "ちょっと", "あまり"],
      "It's very lively, isn't it?",
      "とても にぎやかですね。",
      "とても = very. ね invites agreement.",
    ),
    build(
      "ja-m9-6-2-build-sukoshi-fuben",
      "Say: It's a little inconvenient.",
      "すこし ふべんです",
      ["すこし", "ふべん", "です", "とても", "べんり"],
      ["すこし", "ふべん", "です"],
    ),
    sentenceMcq({
      id: "ja-m9-6-2-mcq-chotto",
      prompt: "ちょっと たいへんです means...",
      correctKana: "It's a bit tough",
      distractorsKana: [
        "It's very tough",
        "It's not tough",
        "It's tough, right?",
      ],
      explanation: "ちょっと = a bit (casual tone). ちょっと たいへんです = it's a bit tough.",
    }),
    listeningCompSentence({
      id: "ja-m9-6-2-lc-totemo-kirei",
      audioText: "この こうえんは とても きれいです",
      correctMeaningEn: "This park is very pretty.",
      distractorsEn: ["This park is a little pretty.", "This park is not pretty.", "This park is famous."],
    }),
    cloze(
      "ja-m9-6-2-cloze-sukoshi",
      "",
      " しずかです。 (It's a little quiet.)",
      "すこし",
      ["すこし", "とても", "ちょっと", "あまり"],
      "It's a little quiet.",
      "すこし しずかです。",
      "すこし = a little (neutral/polite). Placed before the adjective.",
    ),
    build(
      "ja-m9-6-2-build-totemo-yuumei-ne",
      "Say: This restaurant is very famous, isn't it?",
      "この みせは とても ゆうめいですね",
      ["この", "みせ", "は", "とても", "ゆうめい", "です", "ね", "よ"],
      ["この", "みせ", "は", "とても", "ゆうめい", "です", "ね"],
    ),
    sentenceMcq({
      id: "ja-m9-6-2-mcq-degree-disc",
      prompt: "Rank these from most to least: とても, ちょっと, すこし",
      correctKana: "とても > すこし = ちょっと (very > a little = a bit)",
      distractorsKana: [
        "ちょっと > すこし > とても",
        "すこし > とても > ちょっと",
        "All three mean the same thing",
      ],
      explanation: "とても = very (high degree). すこし/ちょっと = a little/a bit (low degree, ちょっと is more casual).",
    }),
    listeningBuildSentence({
      id: "ja-m9-6-2-lb-sukoshi",
      target: "すこし にぎやかです",
      tiles: ["すこし", "にぎやか", "です", "とても", "しずか"],
      correctOrder: ["すこし", "にぎやか", "です"],
      promptEn: "Hear it, build it: 'It's a little lively.'",
    }),
    cloze(
      "ja-m9-6-2-cloze-chotto",
      "",
      " ふべんですよ。 (It's a bit inconvenient, I tell you!)",
      "ちょっと",
      ["ちょっと", "とても", "すこし", "あまり"],
      "It's a bit inconvenient, I tell you!",
      "ちょっと ふべんですよ。",
      "ちょっと = a bit (casual). よ adds emphasis.",
    ),
    build(
      "ja-m9-6-2-build-chotto-taihen",
      "Say: It's a bit tough.",
      "ちょっと たいへんです",
      ["ちょっと", "たいへん", "です", "とても", "すこし"],
      ["ちょっと", "たいへん", "です"],
    ),
    speaking(
      "ja-m9-6-2-speak-totemo-nigiyaka",
      "とても にぎやかですね",
      "It's very lively, isn't it?",
    ),
    sentenceMcq({
      id: "ja-m9-6-2-mcq-mixed",
      prompt: "Which means 'This town is very quiet'?",
      correctKana: "この まちは とても しずかです",
      distractorsKana: [
        "この まちは すこし しずかです",
        "この まちは しずかじゃないです",
        "この まちは にぎやかです",
      ],
      explanation: "とても = very. この まちは とても しずかです = This town is very quiet.",
    }),
    listeningCompSentence({
      id: "ja-m9-6-2-lc-chotto",
      audioText: "ちょっと ひまです",
      correctMeaningEn: "I'm a bit free (not busy).",
      distractorsEn: ["I'm very busy.", "I'm not free.", "I'm a bit tough."],
    }),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-6-2-se",
      anchorLabel: "You used とても, すこし, and ちょっと before adjectives.",
      anchorAudioText: "とても きれいですね",
      question: "Where do degree adverbs go in a Japanese sentence?",
      rule: { text: "Degree adverbs go directly before the adjective they modify — never after it or at the end." },
      surface: { text: "Degree adverbs can go anywhere in the sentence." },
      distractor: { text: "Degree adverbs go at the end, just before です." },
      ruleExplanation:
        "Japanese adverbs precede what they modify: とても きれいです (very pretty). This is consistent — adverbs always sit before their target.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-6-2-rev-mcq-1", M9_6_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-6-2-rev-lc-1",
      audioText: M9_6_2_REVIEW[1].kana,
      correctMeaningEn: M9_6_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_6_2_REVIEW[2].meaningEn,
        M9_6_2_REVIEW[3].meaningEn,
        M9_REVIEW_M1[11].meaningEn,
      ],
    }),
    speaking("ja-m9-6-2-rev-speak-1", M9_6_2_REVIEW[2].kana, M9_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-6-2-rev", M9_6_2_REVIEW),
    infoStep(
      "ja-m9-6-2-info-end",
      "You can now express degrees — from 'a bit' to 'very' with any adjective",
      "とても (very), すこし (a little), ちょっと (a bit) — all slot before the adjective and stack with よ/ね naturally.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_6_2.steps);
assertAnswerRotation(M9_6_2.steps, 2);
assertNoConsecutiveSame(M9_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9_STORY — Dialogue: visiting a friend's neighborhood
// ═══════════════════════════════════════════════════════════════════════

export const M9_STORY: LessonContent = {
  id: "ja-m9-story",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — My neighborhood",
  description:
    "Listen to two friends talk about a neighborhood. Comprehension questions and production practice with na-adjectives.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m9-story-info-open",
      "Story time — visiting a friend's town",
      "ゆき is visiting たけし's neighborhood for the first time. Listen as they walk around and describe what they see.",
    ),
    dialogueListen({
      id: "ja-m9-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "この まちは しずかですね。" },
        { speaker: "たけし", kana: "うん、とても しずかですよ。でも ちょっと ふべんです。" },
        { speaker: "ゆき", kana: "そうですか。この こうえんは きれいですね。" },
        { speaker: "たけし", kana: "ここは ゆうめいな こうえんですよ。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "How does たけし describe his town?",
          correctText: "Very quiet but a bit inconvenient",
          distractors: [
            "Very lively and convenient",
            "A little quiet and famous",
            "Pretty but not convenient",
          ],
          explanation: "とても しずかですよ。でも ちょっと ふべんです = Very quiet. But a bit inconvenient.",
        },
        {
          id: "s1-q2",
          prompt: "What does たけし say about the park?",
          correctText: "It's a famous park",
          distractors: [
            "It's a quiet park",
            "It's a pretty park",
            "It's a new park",
          ],
          explanation: "ゆうめいな こうえんですよ = It's a famous park, I tell you!",
        },
      ],
    }),
    build(
      "ja-m9-story-build-shizuka",
      "Say: This town is quiet, isn't it?",
      "この まちは しずかですね",
      ["この", "まち", "は", "しずか", "です", "ね", "よ", "きれい"],
      ["この", "まち", "は", "しずか", "です", "ね"],
    ),
    sentenceMcq({
      id: "ja-m9-story-mcq-fuben",
      prompt: "In the story, what is ちょっと ふべん about?",
      correctKana: "たけし's town (a bit inconvenient)",
      distractorsKana: [
        "The park (a bit inconvenient)",
        "ゆき's house (a bit inconvenient)",
        "The library (a bit inconvenient)",
      ],
      explanation: "たけし says: でも ちょっと ふべんです — his town is quiet but a bit inconvenient.",
    }),
    dialogueListen({
      id: "ja-m9-story-scene-2",
      lines: [
        { speaker: "ゆき", kana: "としょかんは ありますか。" },
        { speaker: "たけし", kana: "はい。すこし とおいですが、とても しずかな としょかんですよ。" },
        { speaker: "ゆき", kana: "いいですね。にほんごが じょうずですね、たけしさん。" },
        { speaker: "たけし", kana: "いいえ、まだ へたですよ。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "What does たけし say about the library?",
          correctText: "It's a bit far but very quiet",
          distractors: [
            "It's close and very pretty",
            "It's famous and convenient",
            "There is no library",
          ],
          explanation: "すこし とおいですが、とても しずかな としょかんです = A bit far, but a very quiet library.",
        },
        {
          id: "s2-q2",
          prompt: "How does たけし respond to the compliment about his Japanese?",
          correctText: "No, I'm still bad at it (modestly)",
          distractors: [
            "Thank you, I practice every day",
            "Yes, I'm very good",
            "I don't like Japanese",
          ],
          explanation: "いいえ、まだ へたですよ = No, I'm still unskilled. Japanese humility pattern.",
        },
      ],
    }),
    cloze(
      "ja-m9-story-cloze-ne",
      "きれいです",
      "。 (It's pretty, isn't it?)",
      "ね",
      ["ね", "よ", "か", "は"],
      "It's pretty, isn't it?",
      "きれいですね。",
      "ね seeks agreement — ゆき is sharing an observation with たけし.",
    ),
    listeningBuildSentence({
      id: "ja-m9-story-lb-yuumei",
      target: "ゆうめいな こうえんですよ",
      tiles: ["ゆうめい", "な", "こうえん", "です", "よ", "ね", "の"],
      correctOrder: ["ゆうめい", "な", "こうえん", "です", "よ"],
      promptEn: "Hear it, build it: 'It's a famous park, you know!'",
    }),
    listeningCompSentence({
      id: "ja-m9-story-lc-shizuka-na",
      audioText: "しずかな としょかん",
      correctMeaningEn: "A quiet library",
      distractorsEn: [
        "A pretty library",
        "A famous library",
        "A lively library",
      ],
    }),
    speaking(
      "ja-m9-story-speak-shizuka-ne",
      "この まちは しずかですね",
      "This town is quiet, isn't it?",
    ),
    sentenceMcq({
      id: "ja-m9-story-mcq-summary",
      prompt: "In the whole story, which sentence-ender did both ゆき and たけし use most?",
      correctKana: "ね and よ (agreement-seeking and emphasis)",
      distractorsKana: [
        "か (question marker)",
        "の (possessive particle)",
        "を (direct object marker)",
      ],
      explanation: "The conversation is full of ね (seeking shared feeling) and よ (emphasizing information).",
    }),
    speaking(
      "ja-m9-story-speak-jouzu",
      "にほんごが じょうずですね",
      "You're good at Japanese, aren't you?",
    ),
    infoStep(
      "ja-m9-story-info-end",
      "You just followed a real conversation about a neighborhood",
      "しずか, きれい, ゆうめい, ふべん, じょうず, へた — all used naturally with とても, すこし, ちょっと, and the sentence-final ね/よ. That's real Japanese.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M9_STORY.steps);
assertPassiveCardsHaveFollowup(M9_STORY.steps);
assertNoExplanationOnPassive(M9_STORY.steps);
assertExplanationDoesntLeakAnswer(M9_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-7-1 — "i vs na discrimination" (mixed drill)
// ═══════════════════════════════════════════════════════════════════════

const M9_7_1_REVIEW = pickReviewAtoms("ja-m9-7-1-rev", M9_REVIEW_M5, 5);

export const M9_7_1: LessonContent = {
  id: "ja-m9-7-1",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "i vs na discrimination",
  description:
    "Mixed drill — can you tell which adjectives are い-class and which are な-class? Especially the tricky ones.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-7-1-info-open",
      "The ultimate test — い or な?",
      "Some adjectives end in い but are な-adjectives (きれい, きらい, ゆうめい). Others truly are い-adjectives (おおきい, あつい). Can you tell them apart?",
    ),
    sentenceMcq({
      id: "ja-m9-7-1-mcq-kirei-class",
      prompt: "きれい (pretty) — which class?",
      correctKana: "な-adjective → きれいな (before noun), きれいじゃないです (negative)",
      distractorsKana: [
        "い-adjective → きれいい (before noun), きれいくないです (negative)",
        "Both classes → can use either な or い",
        "Neither — きれい is a noun",
      ],
      explanation: "きれい is a な-adjective despite ending in い. きれいな はな, きれいじゃないです.",
    }),
    cloze(
      "ja-m9-7-1-cloze-i-1",
      "おおき",
      " いぬ (a big dog)",
      "い",
      ["い", "な", "く", "の"],
      "A big dog",
      "おおきい いぬ",
      "おおきい is a TRUE い-adjective — keeps い before nouns.",
    ),
    build(
      "ja-m9-7-1-build-kirai-na",
      "Say: Disliked food (food one dislikes)",
      "きらいな たべもの",
      ["きらい", "な", "たべもの", "い", "の"],
      ["きらい", "な", "たべもの"],
    ),
    sentenceMcq({
      id: "ja-m9-7-1-mcq-atsui-class",
      prompt: "あつい (hot) — which class?",
      correctKana: "い-adjective → あつい ひ (hot day), あつくないです (negative)",
      distractorsKana: [
        "な-adjective → あつな ひ (hot day), あつじゃないです (negative)",
        "Both classes",
        "Neither — it's a verb",
      ],
      explanation: "あつい is a genuine い-adjective. あつい ひ, あつくないです.",
    }),
    listeningCompSentence({
      id: "ja-m9-7-1-lc-yuumei-na",
      audioText: "ゆうめいな レストラン",
      correctMeaningEn: "A famous restaurant",
      distractorsEn: ["A quiet restaurant", "A pretty restaurant", "A convenient restaurant"],
    }),
    cloze(
      "ja-m9-7-1-cloze-na-1",
      "きれい",
      " こうえん (a pretty park)",
      "な",
      ["な", "い", "の", "く"],
      "A pretty park",
      "きれいな こうえん",
      "きれい → な-adjective. きれいな こうえん.",
    ),
    build(
      "ja-m9-7-1-build-ookii-neko",
      "Say: A big cat (い-adjective — no な!)",
      "おおきい ねこ",
      ["おおきい", "ねこ", "な", "おおきな"],
      ["おおきい", "ねこ"],
    ),
    sentenceMcq({
      id: "ja-m9-7-1-mcq-shizuka-neg",
      prompt: "Negative of しずか (quiet)?",
      correctKana: "しずかじゃないです",
      distractorsKana: [
        "しずかくないです",
        "しずかいくないです",
        "しずかないです",
      ],
      explanation: "しずか is a な-adjective → しずかじゃないです.",
    }),
    listeningBuildSentence({
      id: "ja-m9-7-1-lb-kirei-na",
      target: "きれいな はな",
      tiles: ["きれい", "な", "はな", "い", "の"],
      correctOrder: ["きれい", "な", "はな"],
      promptEn: "Hear it, build it: 'A pretty flower'",
    }),
    cloze(
      "ja-m9-7-1-cloze-i-neg",
      "おおき",
      "です。 (It's not big.)",
      "くない",
      ["くない", "じゃない", "ない", "な"],
      "It's not big.",
      "おおきくないです。",
      "い-adjective negative: drop い, add くないです.",
    ),
    sentenceMcq({
      id: "ja-m9-7-1-mcq-yuumei-class",
      prompt: "ゆうめい (famous) — which class?",
      correctKana: "な-adjective → ゆうめいな (before noun), ゆうめいじゃないです (negative)",
      distractorsKana: [
        "い-adjective → ゆうめいい (before noun), ゆうめいくないです (negative)",
        "Both → use either form",
        "Noun — it can't modify things directly",
      ],
      explanation: "ゆうめい is a な-adjective. ゆうめいな ひと, ゆうめいじゃないです.",
    }),
    build(
      "ja-m9-7-1-build-shizuka-neg",
      "Say: It's not quiet.",
      "しずかじゃないです",
      ["しずか", "じゃないです", "くないです", "です", "な"],
      ["しずか", "じゃないです"],
    ),
    speaking(
      "ja-m9-7-1-speak-kirei-neg",
      "きれいじゃないです",
      "It's not pretty.",
    ),
    listeningCompSentence({
      id: "ja-m9-7-1-lc-ookiku",
      audioText: "おおきくないです",
      correctMeaningEn: "It's not big",
      distractorsEn: ["It's big", "It's not pretty", "It's not quiet"],
    }),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-7-1-se",
      anchorLabel: "きれいな はな (な-adj) vs おおきい ねこ (い-adj) — both end in い.",
      anchorAudioText: "きれいな はな",
      question: "What's the fastest way to check if an い-ending word is い-adj or な-adj?",
      rule: { text: "Try removing the final い and conjugating. If the remaining stem conjugates (おおき → おおきくない), it's an い-adj. If not (きれ doesn't work), it's a な-adj." },
      surface: { text: "If it ends in い, it's always an い-adjective." },
      distractor: { text: "Count the syllables — short words are い-adj, long words are な-adj." },
      ruleExplanation:
        "The conjugation test is definitive. おおきい → おおきくない (works). きれい → きれくない (doesn't work — it's きれいじゃない). Three main traps: きれい, きらい, ゆうめい.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-7-1-rev-mcq-1", M9_7_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-7-1-rev-lc-1",
      audioText: M9_7_1_REVIEW[1].kana,
      correctMeaningEn: M9_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_7_1_REVIEW[2].meaningEn,
        M9_7_1_REVIEW[3].meaningEn,
        M9_7_1_REVIEW[4].meaningEn,
      ],
    }),
    speaking("ja-m9-7-1-rev-speak-1", M9_7_1_REVIEW[3].kana, M9_7_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m9-7-1-rev", M9_7_1_REVIEW),
    infoStep(
      "ja-m9-7-1-info-end",
      "You can now classify any adjective as い or な — even the sneaky ones",
      "The conjugation test: can you drop the い and add くない? If yes → い-adj. If no → な-adj. きれい, きらい, ゆうめい = all な-adj traps conquered.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_7_1.steps);
assertAnswerRotation(M9_7_1.steps, 2);
assertNoConsecutiveSame(M9_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-7-2 — "Production" (translate + speaking heavy, よ/ね in sentences)
// ═══════════════════════════════════════════════════════════════════════

const M9_7_2_REVIEW = pickReviewAtoms("ja-m9-7-2-rev", M9_REVIEW_POOL, 5);

export const M9_7_2: LessonContent = {
  id: "ja-m9-7-2",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Production — full sentences",
  description:
    "Heavy production practice: build full sentences with な-adjectives, degree adverbs, and よ/ね. Speaking emphasis.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m9-7-2-info-open",
      "Put it all together",
      "Everything from M9 in full production: な-adjectives, じゃないです negatives, とても/すこし/ちょっと, and よ/ね. Time to speak.",
    ),
    build(
      "ja-m9-7-2-build-totemo-kirei-ne",
      "Say: This flower is very pretty, isn't it?",
      "この はなは とても きれいですね",
      ["この", "はな", "は", "とても", "きれい", "です", "ね", "よ"],
      ["この", "はな", "は", "とても", "きれい", "です", "ね"],
    ),
    speaking(
      "ja-m9-7-2-speak-kirei-ne",
      "この はなは とても きれいですね",
      "This flower is very pretty, isn't it?",
    ),
    sentenceMcq({
      id: "ja-m9-7-2-mcq-neg",
      prompt: "Which means 'I don't like mornings'?",
      correctKana: "あさが すきじゃないです",
      distractorsKana: [
        "あさが すきくないです",
        "あさを すきじゃないです",
        "あさが きらいくないです",
      ],
      explanation: "すき is a な-adj → じゃないです. The subject takes が.",
    }),
    build(
      "ja-m9-7-2-build-jouzu-ne",
      "Say: You're very good at cooking, aren't you?",
      "りょうりが とても じょうずですね",
      ["りょうり", "が", "とても", "じょうず", "です", "ね", "よ", "を"],
      ["りょうり", "が", "とても", "じょうず", "です", "ね"],
    ),
    listeningCompSentence({
      id: "ja-m9-7-2-lc-shizuka-yo",
      audioText: "とても しずかですよ",
      correctMeaningEn: "It's very quiet, I tell you!",
      distractorsEn: [
        "It's very quiet, right?",
        "Is it very quiet?",
        "It's not quiet.",
      ],
    }),
    cloze(
      "ja-m9-7-2-cloze-ne",
      "にぎやかです",
      "。 (It's lively, isn't it?)",
      "ね",
      ["ね", "よ", "か", "は"],
      "It's lively, isn't it?",
      "にぎやかですね。",
      "ね = seeking agreement.",
    ),
    build(
      "ja-m9-7-2-build-fuben-yo",
      "Say: It's a bit inconvenient, you know!",
      "ちょっと ふべんですよ",
      ["ちょっと", "ふべん", "です", "よ", "ね", "とても"],
      ["ちょっと", "ふべん", "です", "よ"],
    ),
    speaking(
      "ja-m9-7-2-speak-daijoubu-yo",
      "だいじょうぶですよ",
      "It's okay, I promise!",
    ),
    listeningBuildSentence({
      id: "ja-m9-7-2-lb-sukina",
      target: "すきな たべものは ラーメンです",
      tiles: ["すき", "な", "たべもの", "は", "ラーメン", "です", "きらい"],
      correctOrder: ["すき", "な", "たべもの", "は", "ラーメン", "です"],
      promptEn: "Hear it, build it: 'My favorite food is ramen.'",
    }),
    sentenceMcq({
      id: "ja-m9-7-2-mcq-yo-ne",
      prompt: "You're telling someone who's never been: 'This park is very pretty!' Which ending?",
      correctKana: "とても きれいですよ (sharing info they don't know)",
      distractorsKana: [
        "とても きれいですね (assuming they agree)",
        "とても きれいですか (asking a question)",
        "とても きれいです (neutral, no emphasis)",
      ],
      explanation: "Sharing NEW info → よ. If you were both looking at it → ね.",
    }),
    cloze(
      "ja-m9-7-2-cloze-yo",
      "げんきです",
      "。 (I'm well, really!)",
      "よ",
      ["よ", "ね", "か", "な"],
      "I'm well, really!",
      "げんきですよ。",
      "よ adds emphasis — assuring the listener.",
    ),
    build(
      "ja-m9-7-2-build-kirai-neg",
      "Say: I don't dislike it.",
      "きらいじゃないです",
      ["きらい", "じゃないです", "くないです", "です"],
      ["きらい", "じゃないです"],
    ),
    speaking(
      "ja-m9-7-2-speak-totemo-shizuka",
      "この まちは とても しずかですね",
      "This town is very quiet, isn't it?",
    ),
    listeningCompSentence({
      id: "ja-m9-7-2-lc-genki-neg",
      audioText: "げんきじゃないです",
      correctMeaningEn: "I'm not well.",
      distractorsEn: ["I'm well.", "I'm okay.", "I'm not free."],
    }),
    build(
      "ja-m9-7-2-build-sukina-tabemono",
      "Say: What's your favorite food?",
      "すきな たべものは なんですか",
      ["すき", "な", "たべもの", "は", "なん", "です", "か", "きらい"],
      ["すき", "な", "たべもの", "は", "なん", "です", "か"],
    ),
    // ── selfExplain at N-1 ──
    selfExplain({
      id: "ja-m9-7-2-se",
      anchorLabel: "You built full sentences with な-adj + degree adverbs + よ/ね.",
      anchorAudioText: "とても きれいですね",
      question: "In とても きれいですね, what does each part do?",
      rule: { text: "とても = degree (very), きれい = な-adjective (pretty), です = polite copula, ね = seeks agreement." },
      surface: { text: "ですね is a single unit meaning 'isn't it.'" },
      distractor: { text: "とても is a politeness prefix for です." },
      ruleExplanation:
        "Each piece has a role: [degree adverb] + [adjective] + [copula] + [sentence-final particle]. They stack cleanly in this order.",
    }),
    speaking(
      "ja-m9-7-2-speak-sukina",
      "すきな たべものは なんですか",
      "What's your favorite food?",
    ),
    // ── Broad review tail ──
    vocabMcq("ja-m9-7-2-rev-mcq-1", M9_7_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-7-2-rev-lc-1",
      audioText: M9_7_2_REVIEW[1].kana,
      correctMeaningEn: M9_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M9_7_2_REVIEW[2].meaningEn,
        M9_7_2_REVIEW[3].meaningEn,
        M9_7_2_REVIEW[4].meaningEn,
      ],
    }),
    speaking("ja-m9-7-2-rev-speak-1", M9_7_2_REVIEW[2].kana, M9_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-7-2-rev", M9_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m9-7-2-info-end",
      "You can now produce full Japanese sentences with な-adjectives, degree words, and natural sentence-final particles",
      "From きれいですね (pretty, right?) to すきな たべものは なんですか (What's your favorite food?) — you're speaking real, natural Japanese.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M9_7_2.steps);
assertAnswerRotation(M9_7_2.steps, 2);
assertNoConsecutiveSame(M9_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M9_1_1.steps,
  ...M9_1_2.steps,
  ...M9_2_1.steps,
  ...M9_2_2.steps,
  ...M9_3_1.steps,
  ...M9_3_2.steps,
  ...M9_4_1.steps,
  ...M9_4_2.steps,
  ...M9_5_1.steps,
  ...M9_5_2.steps,
  ...M9_6_1.steps,
  ...M9_6_2.steps,
  ...M9_7_1.steps,
  ...M9_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M9_1_1, M9_1_2, M9_2_1, M9_2_2, M9_3_1, M9_3_2,
  M9_4_1, M9_4_2, M9_5_1, M9_5_2, M9_STORY, M9_6_1, M9_6_2,
  M9_7_1, M9_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
