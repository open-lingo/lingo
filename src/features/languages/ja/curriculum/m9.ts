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
 * Split into 14 sub-lessons + 1 storyComprehension() story = 15 exports.
 * Backlog weave: こんな (this kind of) introduced context-heavy in M9-6-2.
 * Each sub-lesson has 18-22 steps. All vocab introductions use build() or
 * vocabMcq (image-MCQ-as-intro for concrete nouns). All drill uses factory
 * helpers from _jaGrammarHelpers.
 *
 * ID scheme: ja-m9-{n}-{sub} e.g. ja-m9-1-1, ja-m9-1-2
 * Export names: M9_1_1, M9_1_2, etc.
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

const M9_1_1_REVIEW = pickReviewAtoms("ja-m9-1-1-rev", M9_REVIEW_M7, 6);

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
    grammarRule({
      id: "ja-m9-1-1-rule-na-adj",
      grammarPointId: "na-adj-present",
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
      ["しずか", "きれい", "おおきい", "あつい"],
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
      { kana: "きれい", meaningEn: "pretty/clean", emoji: "✨", fromModule: "m9" },
      M9_REVIEW_M7,
    ),
    // ── しずか (quiet) — build intro ──
    build(
      "ja-m9-1-1-build-shizuka",
      "Pick the Japanese word for: Quiet",
      "しずか",
      ["にぎやか", "きれい", "しずか", "ちいさい"],
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
      ["です", "しずか", "きれい", "な"],
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
      ["としょかん", "きれい", "な", "しずか", "の"],
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
      target: "この へやは しずかです",
      tiles: ["へや", "は", "しずか", "です", "この", "きれい", "な"],
      correctOrder: ["この", "へや", "は", "しずか", "です"],
      promptEn: "Hear it, build it: 'This room is quiet.'",
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
      "ja-m9-1-1-speak-kirei-umi",
      "きれいな うみ",
      "A pretty sea",
    ),
    // ── Review tail ──
    vocabMcq("ja-m9-1-1-rev-mcq-1", M9_1_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-1-1-rev-lc-1",
      audioText: "ほんを よみます",
      correctMeaningEn: "I read a book.",
      distractorsEn: [
        "I write a letter.",
        "I drink green tea.",
        "I watch television.",
      ],
    }),
    speaking("ja-m9-1-1-rev-speak-1", M9_1_1_REVIEW[2].kana, M9_1_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-1-1-rev", M9_1_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_1_1.steps);
assertAnswerRotation(M9_1_1.steps, 2);
assertNoConsecutiveSame(M9_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-1-2 — "Pretty and quiet" practice (な-adj present + な before nouns)
// ═══════════════════════════════════════════════════════════════════════

const M9_1_2_REVIEW = pickReviewAtoms("ja-m9-1-2-rev", M9_REVIEW_M6, 6);

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
      ["まち", "きれい", "です", "な", "しずか", "の"],
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
      "ja-m9-1-2-build-kirei-na-yama",
      "Say: A pretty mountain",
      "きれいな やま",
      ["やま", "しずか", "な", "きれい", "の"],
      ["きれい", "な", "やま"],
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
      tiles: ["はな", "きれい", "この", "です", "は", "な", "しずか"],
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
      ["まち", "きれい", "は", "この", "しずか", "です", "な"],
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
    // ── ところ (place) — build intro ──
    build(
      "ja-m9-1-2-build-tokoro",
      "Pick the Japanese word for: Place",
      "ところ",
      ["まち", "ところ", "へや", "こうえん"],
      ["ところ"],
    ),
    listeningCompSentence({
      id: "ja-m9-1-2-lc-tokoro",
      audioText: "ここは きれいな ところです",
      correctMeaningEn: "This is a pretty place.",
      distractorsEn: [
        "This is a quiet place.",
        "This is a pretty room.",
        "This is a pretty town.",
      ],
    }),
    speaking(
      "ja-m9-1-2-speak-tokoro",
      "しずかな ところ",
      "A quiet place",
    ),
    build(
      "ja-m9-1-2-build-toshokan",
      "Say: The library is quiet.",
      "としょかんは しずかです",
      ["しずか", "としょかん", "です", "は", "な"],
      ["としょかん", "は", "しずか", "です"],
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
      audioText: "ぎんこうに いきます",
      correctMeaningEn: "I go to the bank.",
      distractorsEn: [
        "I go to the station.",
        "The bank is quiet.",
        "There is a bank over there.",
      ],
    }),
    speaking("ja-m9-1-2-rev-speak-1", M9_1_2_REVIEW[2].kana, M9_1_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-1-2-rev", M9_1_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_1_2.steps);
assertAnswerRotation(M9_1_2.steps, 2);
assertNoConsecutiveSame(M9_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-2-1 — "Like and dislike" intro (すき, きらい + Xが すきです pattern)
// ═══════════════════════════════════════════════════════════════════════

const M9_2_1_REVIEW = pickReviewAtoms("ja-m9-2-1-rev", M9_REVIEW_M5, 6);

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
      ["きらい", "すき", "すこし", "おおきい"],
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
      ["すき", "きらい", "きれい", "つまらない"],
      ["きらい"],
    ),
    speaking("ja-m9-2-1-speak-kirai", "きらいです", "I dislike (it)."),
    // ── Xが すきです sentence builds ──
    build(
      "ja-m9-2-1-build-coffee-suki",
      "Say: I like coffee.",
      "コーヒーが すきです",
      ["すき", "を", "コーヒー", "です", "が", "きらい"],
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
      id: "ja-m9-2-1-lb-hon-suki",
      target: "ほんが すきです",
      tiles: ["きらい", "すき", "ほん", "です", "が", "を"],
      correctOrder: ["ほん", "が", "すき", "です"],
      promptEn: "Hear it, build it: 'I like books.'",
    }),
    build(
      "ja-m9-2-1-build-nihongo-suki",
      "Say: I like Japanese.",
      "にほんごが すきです",
      ["すき", "にほんご", "です", "が", "を", "きらい"],
      ["にほんご", "が", "すき", "です"],
    ),
    build(
      "ja-m9-2-1-build-kirai-sentence",
      "Say: I dislike hot weather.",
      "あつい てんきが きらいです",
      ["てんき", "きらい", "あつい", "です", "が", "すき", "は"],
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
      "ja-m9-2-1-speak-yama-suki",
      "やまが すきです",
      "I like mountains.",
    ),
    // ── Review tail ──
    vocabMcq("ja-m9-2-1-rev-mcq-1", M9_2_1_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-2-1-rev-lc-1",
      audioText: "ともだちが ふたり います",
      correctMeaningEn: "There are two friends.",
      distractorsEn: [
        "There are two cats.",
        "There are three friends.",
        "My friend is a student.",
      ],
    }),
    speaking("ja-m9-2-1-rev-speak-1", M9_2_1_REVIEW[3].kana, M9_2_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m9-2-1-rev", M9_2_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_2_1.steps);
assertAnswerRotation(M9_2_1.steps, 2);
assertNoConsecutiveSame(M9_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-2-2 — "Like and dislike" practice (すき/きらい drill with が)
// ═══════════════════════════════════════════════════════════════════════

const M9_2_2_REVIEW = pickReviewAtoms("ja-m9-2-2-rev", M9_REVIEW_M4, 6);

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
      ["すき", "いぬ", "です", "を", "が", "きらい"],
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
      ["きらい", "さかな", "です", "が", "すき", "は"],
      ["さかな", "が", "きらい", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m9-2-2-lb-suki",
      target: "おちゃが すきです",
      tiles: ["きらい", "すき", "おちゃ", "が", "です", "を"],
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
      ["たべもの", "きらい", "な", "すき", "の"],
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
      anchorAudioText: "おんがくが すきです",
      question: "Why does すき use が while たべます uses を?",
      rule: { text: "すき is an adjective (a state) → liked thing is the subject (が). たべます is a verb (an action) → eaten thing is the object (を)." },
      surface: { text: "が and を are interchangeable in all sentences." },
      distractor: { text: "が is used because すき originally comes from a verb meaning 'to prefer.'" },
      ruleExplanation:
        "This is one of the key insights: Japanese treats 'like' as a description (adj + が) rather than an action (verb + を). Different grammar, same meaning.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-2-2-rev-mcq-1", M9_2_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-2-2-rev-lc-1",
      audioText: "これは わたしの カメラです",
      correctMeaningEn: "This is my camera.",
      distractorsEn: [
        "That is my camera.",
        "This is my dictionary.",
        "This camera is pretty.",
      ],
    }),
    speaking("ja-m9-2-2-rev-speak-1", M9_2_2_REVIEW[2].kana, M9_2_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-2-2-rev", M9_2_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_2_2.steps);
assertAnswerRotation(M9_2_2.steps, 2);
assertNoConsecutiveSame(M9_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-3-1 — "Good at, bad at" intro (じょうず, へた + contrasting i-adj)
// ═══════════════════════════════════════════════════════════════════════

const M9_3_1_REVIEW = pickReviewAtoms("ja-m9-3-1-rev", M9_REVIEW_M3, 6);

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
    // ── じょうず (skilled) — build intro ──
    build(
      "ja-m9-3-1-build-jouzu",
      "Pick the Japanese word for: Skilled / Good at",
      "じょうず",
      ["へた", "じょうず", "すき", "じょうぶ"],
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
      ["じょうず", "へた", "きらい", "ひま"],
      ["へた"],
    ),
    speaking("ja-m9-3-1-speak-heta", "へたです", "I'm bad at it."),
    // ── Sentence builds ──
    build(
      "ja-m9-3-1-build-jouzu-sent",
      "Say: You're good at Japanese.",
      "にほんごが じょうずです",
      ["じょうず", "にほんご", "を", "です", "が", "へた"],
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
      id: "ja-m9-3-1-lb-eigo-jouzu",
      target: "えいごが じょうずです",
      tiles: ["じょうず", "えいご", "です", "へた", "が", "を"],
      correctOrder: ["えいご", "が", "じょうず", "です"],
      promptEn: "Hear it, build it: 'You're good at English.'",
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
      ["ひと", "じょうず", "りょうり", "な", "が", "の", "へた"],
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
  ],
};

assertNoSameAnswerCluster(M9_3_1.steps);
assertAnswerRotation(M9_3_1.steps, 2);
assertNoConsecutiveSame(M9_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-3-2 — "Good at, bad at" practice (i-adj vs na-adj discrimination)
// ═══════════════════════════════════════════════════════════════════════

const M9_3_2_REVIEW = pickReviewAtoms("ja-m9-3-2-rev", M9_REVIEW_M6, 6);

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
      "ja-m9-3-2-cloze-na-suki",
      "すき",
      " のみもの (a favorite drink)",
      "な",
      ["な", "い", "の", "く"],
      "A favorite drink",
      "すきな のみもの",
      "すき is a な-adjective — use な before the noun it describes.",
    ),
    build(
      "ja-m9-3-2-build-ookii",
      "Say: A big dog (い-adjective)",
      "おおきい いぬ",
      ["いぬ", "な", "おおきい", "おおきな"],
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
      ["へた", "ひと", "スポーツ", "な", "が", "い", "の"],
      ["スポーツ", "が", "へた", "な", "ひと"],
    ),
    listeningBuildSentence({
      id: "ja-m9-3-2-lb-kirai-na",
      target: "きらいな たべもの",
      tiles: ["たべもの", "すき", "な", "きらい", "い", "の"],
      correctOrder: ["きらい", "な", "たべもの"],
      promptEn: "Hear it, build it: 'A disliked food'",
    }),
    cloze(
      "ja-m9-3-2-cloze-na-kirei",
      "きれい",
      " みせ (a pretty shop)",
      "な",
      ["な", "い", "く", "に"],
      "A pretty shop",
      "きれいな みせ",
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
      "ja-m9-3-2-speak-tomodachi-jouzu",
      "ともだちは りょうりが じょうずです",
      "My friend is good at cooking.",
    ),
    build(
      "ja-m9-3-2-build-kirei-heya",
      "Say: A pretty room",
      "きれいな へや",
      ["へや", "しずか", "な", "きれい", "い", "の"],
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
      anchorAudioText: "きれいな みせ",
      question: "Why isn't きれい an い-adjective even though it ends in い?",
      rule: { text: "きれい's い is part of its stem (from kanji 綺麗), not a conjugatable い-adjective ending — true い-adjectives can drop the い." },
      surface: { text: "Words ending in い are always い-adjectives." },
      distractor: { text: "きれい was originally a な-adjective but recently became an い-adjective." },
      ruleExplanation:
        "Test: remove the い — is the stem real? おおきい → おおき works; きれい → きれ doesn't. That's why きれい is な-class.",
    }),
    // ── Review tail ──
    vocabMcq("ja-m9-3-2-rev-mcq-1", M9_3_2_REVIEW[0], M9_REVIEW_POOL),
    listeningCompSentence({
      id: "ja-m9-3-2-rev-lc-1",
      audioText: "バスで えきに いきます",
      correctMeaningEn: "I go to the station by bus.",
      distractorsEn: [
        "I go to the station by train.",
        "I go to school by bus.",
        "There is a bus at the station.",
      ],
    }),
    speaking("ja-m9-3-2-rev-speak-1", M9_3_2_REVIEW[3].kana, M9_3_2_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m9-3-2-rev", M9_3_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_3_2.steps);
assertAnswerRotation(M9_3_2.steps, 2);
assertNoConsecutiveSame(M9_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-4-1 — "How are you?" intro (げんき, ひま, たいへん, だいじょうぶ + よ)
// ═══════════════════════════════════════════════════════════════════════

const M9_4_1_REVIEW = pickReviewAtoms("ja-m9-4-1-rev", M9_REVIEW_M7, 6);

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
    // ── げんき (healthy/energetic) ──
    build(
      "ja-m9-4-1-build-genki",
      "Pick the Japanese word for: Healthy / Energetic",
      "げんき",
      ["ひま", "げんき", "たいへん", "だいじょうぶ"],
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
      ["たいへん", "ひま", "げんき", "しずか"],
      ["ひま"],
    ),
    vocabMcq(
      "ja-m9-4-1-mcq-hima",
      { kana: "ひま", meaningEn: "free/not busy", emoji: "😴", fromModule: "m9" },
      M9_REVIEW_M7,
    ),
    // ── たいへん (tough/terrible) ──
    build(
      "ja-m9-4-1-build-taihen",
      "Pick the Japanese word for: Tough / Terrible",
      "たいへん",
      ["だいじょうぶ", "たいへん", "げんき", "ひま"],
      ["たいへん"],
    ),
    speaking("ja-m9-4-1-speak-taihen", "たいへんです", "It's tough."),
    // ── だいじょうぶ (okay/alright) ──
    build(
      "ja-m9-4-1-build-daijoubu",
      "Pick the Japanese word for: Okay / Alright",
      "だいじょうぶ",
      ["げんき", "だいじょうぶ", "たいへん", "きれい"],
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
      grammarPointId: "yo-emphasis",
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
      ["よ", "ね", "げんき", "です", "か"],
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
    build(
      "ja-m9-4-1-build-kyou-hima",
      "Say: Today I'm free.",
      "きょうは ひまです",
      ["ひま", "きょう", "です", "は", "げんき"],
      ["きょう", "は", "ひま", "です"],
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
      tiles: ["か", "です", "だいじょうぶ", "ね", "よ"],
      correctOrder: ["だいじょうぶ", "です", "よ"],
      promptEn: "Hear it, build it: 'It's okay, I promise!'",
    }),
    speaking(
      "ja-m9-4-1-speak-ocha-atsui-yo",
      "この おちゃは あついですよ",
      "This tea is hot, you know!",
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
      audioText: "てがみを かきます",
      correctMeaningEn: "I write a letter.",
      distractorsEn: [
        "I read a letter.",
        "I write a book.",
        "I drink coffee.",
      ],
    }),
    speaking("ja-m9-4-1-rev-speak-1", M9_4_1_REVIEW[2].kana, M9_4_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-4-1-rev", M9_4_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_4_1.steps);
assertAnswerRotation(M9_4_1.steps, 1);
assertNoConsecutiveSame(M9_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-4-2 — "How are you?" practice (よ/ね sentence-finals in context)
// ═══════════════════════════════════════════════════════════════════════

const M9_4_2_REVIEW = pickReviewAtoms("ja-m9-4-2-rev", M9_REVIEW_M5, 6);

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
    grammarRule({
      id: "ja-m9-4-2-rule-ne",
      grammarPointId: "ne-agreement",
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
      ["あつい", "きょう", "ね", "です", "は", "よ", "か"],
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
      audioText: "この えきは きれいですね",
      correctMeaningEn: "This station is clean, isn't it?",
      distractorsEn: [
        "This station is clean, I tell you!",
        "Is this station clean?",
        "This station is not clean.",
      ],
    }),
    cloze(
      "ja-m9-4-2-cloze-yo-1",
      "この パンは おいしいです",
      "。 (This bread is delicious, you know!)",
      "よ",
      ["よ", "ね", "か", "は"],
      "This bread is delicious, you know!",
      "この パンは おいしいですよ。",
      "よ adds conviction — recommending the bread to someone who hasn't tried it.",
    ),
    build(
      "ja-m9-4-2-build-shizuka-ne",
      "Say: It's quiet, isn't it?",
      "しずかですね",
      ["ね", "しずか", "か", "です", "よ"],
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
      tiles: ["です", "ね", "げんき", "よ", "か"],
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
      ["ね", "です", "たいへん", "か", "よ"],
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
      audioText: "がくせいは きゅうにんです",
      correctMeaningEn: "There are nine students.",
      distractorsEn: [
        "There are six students.",
        "There are nine teachers.",
        "The students are over there.",
      ],
    }),
    speaking("ja-m9-4-2-rev-speak-1", M9_4_2_REVIEW[2].kana, M9_4_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-4-2-rev", M9_4_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_4_2.steps);
assertAnswerRotation(M9_4_2.steps, 2);
assertNoConsecutiveSame(M9_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-5-1 — "Convenient or not" intro (べんり, ふべん, かんたん + negative)
// ═══════════════════════════════════════════════════════════════════════

const M9_5_1_REVIEW = pickReviewAtoms("ja-m9-5-1-rev", M9_REVIEW_M4, 6);

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
    // ── べんり (convenient) ──
    build(
      "ja-m9-5-1-build-benri",
      "Pick the Japanese word for: Convenient",
      "べんり",
      ["ふべん", "べんり", "かんたん", "きれい"],
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
      ["べんり", "ふべん", "たいへん", "ひま"],
      ["ふべん"],
    ),
    speaking("ja-m9-5-1-speak-fuben", "ふべんです", "It's inconvenient."),
    // ── かんたん (simple/easy) ──
    build(
      "ja-m9-5-1-build-kantan",
      "Pick the Japanese word for: Simple / Easy",
      "かんたん",
      ["たいへん", "かんたん", "べんり", "じょうず"],
      ["かんたん"],
    ),
    vocabMcq(
      "ja-m9-5-1-mcq-kantan",
      { kana: "かんたん", meaningEn: "simple/easy", emoji: "👌", fromModule: "m9" },
      M9_REVIEW_M7,
    ),
    // ── な-adjective negative: じゃないです ──
    grammarRule({
      id: "ja-m9-5-1-rule-neg",
      grammarPointId: "na-adj-negative",
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
      ["じゃないです", "くないです", "しずか", "です", "な"],
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
      target: "この こうえんは きれいじゃないです",
      tiles: ["こうえん", "は", "きれい", "じゃないです", "この", "くないです"],
      correctOrder: ["この", "こうえん", "は", "きれい", "じゃないです"],
      promptEn: "Hear it, build it: 'This park is not pretty.'",
    }),
    build(
      "ja-m9-5-1-build-fuben-sent",
      "Say: This town is not convenient.",
      "この まちは べんりじゃないです",
      ["まち", "べんり", "じゃないです", "この", "は", "くないです", "です"],
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
      audioText: "わたしは がくせいです",
      correctMeaningEn: "I am a student.",
      distractorsEn: [
        "I am a teacher.",
        "You are a student.",
        "The student is my friend.",
      ],
    }),
    speaking("ja-m9-5-1-rev-speak-1", M9_5_1_REVIEW[3].kana, M9_5_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m9-5-1-rev", M9_5_1_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_5_1.steps);
assertAnswerRotation(M9_5_1.steps, 2);
assertNoConsecutiveSame(M9_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-5-2 — "Convenient or not" practice (な-adj negative drill)
// ═══════════════════════════════════════════════════════════════════════

const M9_5_2_REVIEW = pickReviewAtoms("ja-m9-5-2-rev", M9_REVIEW_M3, 6);

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
      ["じゃないです", "ひま", "くないです", "です"],
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
      audioText: "たいへんじゃないです",
      correctMeaningEn: "It's not tough",
      distractorsEn: ["It's tough", "It's not quiet", "It's not okay"],
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
      ["じょうず", "じゃないです", "にほんご", "くないです", "が", "を"],
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
      target: "さかなが すきじゃないです",
      tiles: ["さかな", "が", "すき", "じゃないです", "を", "くないです"],
      correctOrder: ["さかな", "が", "すき", "じゃないです"],
      promptEn: "Hear it, build it: 'I don't like fish.'",
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
      ["じゃないです", "くないです", "きらい", "です"],
      ["きらい", "じゃないです"],
    ),
    speaking(
      "ja-m9-5-2-speak-hima-neg",
      "きょうは ひまじゃないです",
      "I'm not free today.",
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
      audioText: "ホテルは あそこです",
      correctMeaningEn: "The hotel is over there.",
      distractorsEn: [
        "The hotel is here.",
        "The bank is over there.",
        "The hotel is quiet.",
      ],
    }),
    speaking("ja-m9-5-2-rev-speak-1", M9_5_2_REVIEW[2].kana, M9_5_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-5-2-rev", M9_5_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_5_2.steps);
assertAnswerRotation(M9_5_2.steps, 2);
assertNoConsecutiveSame(M9_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-6-1 — "Famous and lively" intro (ゆうめい, にぎやか + とても/すこし/ちょっと)
// ═══════════════════════════════════════════════════════════════════════

const M9_6_1_REVIEW = pickReviewAtoms("ja-m9-6-1-rev", M9_REVIEW_M6, 6);

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
    // ── ゆうめい (famous) ──
    build(
      "ja-m9-6-1-build-yuumei",
      "Pick the Japanese word for: Famous",
      "ゆうめい",
      ["にぎやか", "ゆうめい", "きれい", "しずか"],
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
      ["しずか", "にぎやか", "ゆうめい", "げんき"],
      ["にぎやか"],
    ),
    speaking("ja-m9-6-1-speak-nigiyaka", "にぎやかです", "It's lively."),
    // ── Degree adverbs: とても, すこし, ちょっと ──
    build(
      "ja-m9-6-1-build-totemo",
      "Pick the Japanese word for: Very",
      "とても",
      ["すこし", "とても", "ちょっと", "たくさん"],
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
      ["ちょっと", "すこし", "とても", "おおきい"],
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
      ["とても", "ちょっと", "すこし", "ちかい"],
      ["ちょっと"],
    ),
    // ── Sentence builds with degree adverbs ──
    build(
      "ja-m9-6-1-build-totemo-yuumei",
      "Say: This temple is very famous.",
      "この おてらは とても ゆうめいです",
      ["おてら", "ゆうめい", "この", "とても", "は", "すこし", "です"],
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
      tiles: ["きれい", "すこし", "とても", "です", "な"],
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
        "Like きれい/きらい, ゆうめい's い comes from the kanji reading, not the adjective system. Can you drop い and conjugate? No → な-adjective.",
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
  ],
};

assertNoSameAnswerCluster(M9_6_1.steps);
assertAnswerRotation(M9_6_1.steps, 2);
assertNoConsecutiveSame(M9_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-6-2 — "Famous and lively" practice (degree adverbs + adj)
// ═══════════════════════════════════════════════════════════════════════

const M9_6_2_REVIEW = pickReviewAtoms("ja-m9-6-2-rev", M9_REVIEW_M7, 6);

export const M9_6_2: LessonContent = {
  id: "ja-m9-6-2",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Famous and lively — practice",
  description:
    "Drill degree adverbs with な-adjectives. Mix とても, すこし, ちょっと across contexts — plus こんな (this kind of).",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
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
      ["ふべん", "とても", "です", "すこし", "べんり"],
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
    // ── こんな (this kind of) — context-heavy intro ──
    build(
      "ja-m9-6-2-build-konna",
      "Pick the Japanese word for: This kind of / Like this",
      "こんな",
      ["この", "こんな", "その", "どの"],
      ["こんな"],
    ),
    build(
      "ja-m9-6-2-build-konna-machi",
      "Say: I like lively towns like this.",
      "こんな にぎやかな まちが すきです",
      ["まち", "にぎやか", "こんな", "が", "な", "すき", "です", "しずか"],
      ["こんな", "にぎやか", "な", "まち", "が", "すき", "です"],
    ),
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
      ["みせ", "とても", "この", "ゆうめい", "は", "です", "よ", "ね"],
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
      tiles: ["にぎやか", "とても", "すこし", "です", "しずか"],
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
      ["たいへん", "すこし", "ちょっと", "です", "とても"],
      ["ちょっと", "たいへん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m9-6-2-lc-konna",
      audioText: "こんな みせは べんりですね",
      correctMeaningEn: "Shops like this are convenient, aren't they?",
      distractorsEn: [
        "This shop is inconvenient, isn't it?",
        "Which shop is convenient?",
        "That shop is famous, you know!",
      ],
    }),
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
      audioText: "なまえを かきます",
      correctMeaningEn: "I write my name.",
      distractorsEn: [
        "I write a letter.",
        "I say my name.",
        "I read the name.",
      ],
    }),
    speaking("ja-m9-6-2-rev-speak-1", M9_6_2_REVIEW[2].kana, M9_6_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-6-2-rev", M9_6_2_REVIEW),
  ],
};

assertNoSameAnswerCluster(M9_6_2.steps);
assertAnswerRotation(M9_6_2.steps, 2);
assertNoConsecutiveSame(M9_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9_STORY — Narrated visit to a friend's town (storyComprehension closer)
// ═══════════════════════════════════════════════════════════════════════

export const M9_STORY: LessonContent = {
  id: "ja-m9-story",
  moduleId: "m9",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — My friend's town",
  description:
    "Follow a narrated visit to a friend's quiet town — na-adjectives, degree words, こんな, and よ/ね in a real story. Reply with your own sentences.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    ...storyComprehension({
      idPrefix: "ja-m9-story-s1",
      narrative: [
        { kana: "きょう、ともだちの まちに いきます。" },
        { kana: "この まちは とても しずかです。" },
        { kana: "まちに きれいな こうえんが あります。" },
        { kana: "その こうえんは ゆうめいですよ。" },
      ],
      comprehensionQuestions: [
        {
          id: "s1-q1",
          prompt: "Where does the narrator go today?",
          correctText: "To a friend's town.",
          distractors: [
            "To a friend's school.",
            "To a famous library.",
            "To the station with a teacher.",
          ],
          explanation: "ともだちの まちに いきます = 'I go to my friend's town.'",
        },
        {
          id: "s1-q2",
          prompt: "How does the narrator describe the town?",
          correctText: "Very quiet.",
          distractors: [
            "Very lively.",
            "A little inconvenient.",
            "Famous and big.",
          ],
          explanation: "とても しずかです = 'It's very quiet.'",
        },
      ],
      responseBuild: {
        target: "きれいな こうえんですね",
        tiles: ["こうえん", "です", "きれい", "ね", "な", "よ", "しずか"],
        correctOrder: ["きれい", "な", "こうえん", "です", "ね"],
        promptEn: "Agree with your friend: 'It's a pretty park, isn't it?'",
      },
    }),
    sentenceMcq({
      id: "ja-m9-story-mcq-kouen",
      prompt: "What did the story say about the park?",
      correctKana: "その こうえんは ゆうめいです。",
      distractorsKana: [
        "その こうえんは にぎやかです。",
        "その こうえんは ふべんです。",
        "その こうえんは きれいじゃないです。",
      ],
      explanation: "ゆうめいですよ — the narrator tells us the park is famous.",
    }),
    ...storyComprehension({
      idPrefix: "ja-m9-story-s2",
      narrative: [
        { kana: "ともだちと ゆうめいな レストランに いきます。" },
        { kana: "りょうりは とても おいしいですよ。" },
        { kana: "でも、すこし にぎやかです。" },
        { kana: "わたしは こんな まちが すきです。" },
      ],
      comprehensionQuestions: [
        {
          id: "s2-q1",
          prompt: "What is the restaurant like?",
          correctText: "Famous, with very delicious food.",
          distractors: [
            "Quiet, with cheap food.",
            "New, but the food is bad.",
            "Convenient, but a bit far.",
          ],
          explanation: "ゆうめいな レストラン — and りょうりは とても おいしいです.",
        },
        {
          id: "s2-q2",
          prompt: "How does the narrator feel about the town?",
          correctText: "They like towns like this.",
          distractors: [
            "They dislike towns like this.",
            "They think it is too inconvenient.",
            "They want a livelier town.",
          ],
          explanation: "こんな まちが すきです = 'I like towns like this.'",
        },
      ],
      responseBuild: {
        target: "とても おいしいですね",
        tiles: ["おいしい", "です", "とても", "ね", "よ", "か"],
        correctOrder: ["とても", "おいしい", "です", "ね"],
        promptEn: "You're both eating — agree: 'It's very delicious, isn't it?'",
      },
    }),
    cloze(
      "ja-m9-story-cloze-ga",
      "わたしは こんな まち",
      " すきです。",
      "が",
      ["が", "を", "は", "の"],
      "I like towns like this.",
      "わたしは こんな まちが すきです。",
      "The liked thing takes が with すき — even with こんな in front.",
    ),
    listeningBuildSentence({
      id: "ja-m9-story-lb-shizuka",
      target: "この まちは とても しずかです",
      tiles: ["まち", "しずか", "とても", "この", "は", "です", "にぎやか"],
      correctOrder: ["この", "まち", "は", "とても", "しずか", "です"],
      promptEn: "Hear a line from the story, build it: 'This town is very quiet.'",
    }),
    speaking(
      "ja-m9-story-speak-konna",
      "こんな まちが すきです",
      "I like towns like this.",
    ),
    sentenceMcq({
      id: "ja-m9-story-mcq-summary",
      prompt: "You want to agree with your friend about the food. Which ending?",
      correctKana: "おいしいですね (shared experience)",
      distractorsKana: [
        "おいしいですよ (new information)",
        "おいしいですか (question)",
        "おいしくないです (negative)",
      ],
      explanation: "You're both tasting it — ね invites shared agreement.",
    }),
    speaking(
      "ja-m9-story-speak-resutoran",
      "ゆうめいな レストランですね",
      "It's a famous restaurant, isn't it?",
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

const M9_7_1_REVIEW = pickReviewAtoms("ja-m9-7-1-rev", M9_REVIEW_M5, 6);

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
      ["たべもの", "きらい", "い", "な", "の"],
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
      ["ねこ", "おおきな", "おおきい", "な"],
      ["おおきい", "ねこ"],
    ),
    sentenceMcq({
      id: "ja-m9-7-1-mcq-nigiyaka-neg",
      prompt: "Negative of にぎやか (lively)?",
      correctKana: "にぎやかじゃないです",
      distractorsKana: [
        "にぎやかくないです",
        "にぎやかいくないです",
        "にぎやかないです",
      ],
      explanation: "にぎやか is a な-adjective → にぎやかじゃないです.",
    }),
    listeningBuildSentence({
      id: "ja-m9-7-1-lb-kirei-na",
      target: "きれいな えき",
      tiles: ["えき", "しずか", "な", "きれい", "の", "い"],
      correctOrder: ["きれい", "な", "えき"],
      promptEn: "Hear it, build it: 'A clean station'",
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
      "ja-m9-7-1-build-yuumei-neg",
      "Say: This shop is not famous.",
      "この みせは ゆうめいじゃないです",
      ["みせ", "ゆうめい", "じゃないです", "この", "は", "くないです"],
      ["この", "みせ", "は", "ゆうめい", "じゃないです"],
    ),
    speaking(
      "ja-m9-7-1-speak-heta-neg",
      "へたじゃないです",
      "I'm not bad at it.",
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
      rule: { text: "Remove the final い and try conjugating. Stem conjugates (おおき → おおきくない)? い-adj. Doesn't (きれ)? な-adj." },
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
  ],
};

assertNoSameAnswerCluster(M9_7_1.steps);
assertAnswerRotation(M9_7_1.steps, 2);
assertNoConsecutiveSame(M9_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M9-7-2 — "Production" (translate + speaking heavy, よ/ね in sentences)
// ═══════════════════════════════════════════════════════════════════════

const M9_7_2_REVIEW = pickReviewAtoms("ja-m9-7-2-rev", M9_REVIEW_POOL, 6);

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
    build(
      "ja-m9-7-2-build-totemo-kirei-ne",
      "Say: This flower is very pretty, isn't it?",
      "この はなは とても きれいですね",
      ["はな", "きれい", "とても", "この", "です", "は", "よ", "ね"],
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
      ["じょうず", "とても", "りょうり", "です", "が", "ね", "を", "よ"],
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
      ["ふべん", "とても", "です", "ちょっと", "よ", "ね"],
      ["ちょっと", "ふべん", "です", "よ"],
    ),
    speaking(
      "ja-m9-7-2-speak-eki-benri-yo",
      "この えきは べんりですよ",
      "This station is convenient, you know!",
    ),
    listeningBuildSentence({
      id: "ja-m9-7-2-lb-sukina",
      target: "すきな たべものは ラーメンです",
      tiles: ["たべもの", "ラーメン", "な", "すき", "は", "きらい", "です"],
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
      "この レストランは ゆうめいです",
      "。 (This restaurant is famous, you know!)",
      "よ",
      ["よ", "ね", "か", "な"],
      "This restaurant is famous, you know!",
      "この レストランは ゆうめいですよ。",
      "よ — telling someone information they don't know yet.",
    ),
    build(
      "ja-m9-7-2-build-taihen-neg",
      "Say: It's not tough.",
      "たいへんじゃないです",
      ["じゃないです", "たいへん", "くないです", "です"],
      ["たいへん", "じゃないです"],
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
      ["たべもの", "なん", "すき", "な", "は", "きらい", "です", "か"],
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
      audioText: "あの バスは あたらしいです",
      correctMeaningEn: "That bus over there is new.",
      distractorsEn: [
        "That bus over there is old.",
        "This bus is new.",
        "That train over there is new.",
      ],
    }),
    speaking("ja-m9-7-2-rev-speak-1", M9_7_2_REVIEW[2].kana, M9_7_2_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m9-7-2-rev", M9_7_2_REVIEW),
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
