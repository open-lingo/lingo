/**
 * M4 — Things & people (sub-lesson split rebuild 2026-05-24).
 *
 * M4 introduces:
 *   - の (possession + "kind of" particle)
 *   - これ / それ / あれ / どれ (the こそあど pointer system)
 *
 * Split into 14 sub-lessons (2 per original lesson, M4_8 mastery test deleted).
 * Each sub-lesson has ~18 steps. All vocab introductions use build() steps
 * where the learner assembles the word from tiles (figuroutable pattern).
 *
 * ID scheme: ja-m4-{original}-{sub} e.g. ja-m4-1-1, ja-m4-1-2
 * Export names: M4_1_1, M4_1_2, M4_2_1, M4_2_2, etc.
 * Clustering regex /^(ja-m\d+-.+)-(\d+|test)$/ groups under prefix ja-m4-1, etc.
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
} from "@/shared/lessonAuthoring/curriculumAssertions";

const COURSE = "mock-1";
const LANG = "ja";

// ───────────────────────────────────────────────────────────────────────
// Per-sub-lesson review-atom draws. Pool is M1 + M2 + M3.
// ───────────────────────────────────────────────────────────────────────
const M4_REVIEW_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter(
    (a) => a.fromModule === "m1" || a.fromModule === "m2" || a.fromModule === "m3",
  ),
);
const M4_REVIEW_M1_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m1"),
);
const M4_REVIEW_M2_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m2"),
);
const M4_REVIEW_M3_POOL = withoutMcqBlocked(
  M3_M7_REVIEW_POOL.filter((a) => a.fromModule === "m3"),
);

// ═══════════════════════════════════════════════════════════════════════
// M4-1-1 — Everyday objects (first 3: ペン, かばん, くるま)
// ═══════════════════════════════════════════════════════════════════════

const M4_1_1_REVIEW = pickReviewAtoms("ja-m4-1-1-rev", M4_REVIEW_M3_POOL, 4);

export const M4_1_1: LessonContent = {
  id: "ja-m4-1-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Everyday objects I",
  description:
    "Three concrete nouns — pen, bag, car. Introduced via build steps so you figure them out from context + tiles.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m4-1-1-info-open",
      "Object pool — part 1",
      "Three everyday objects. Each is introduced via a tile-build — you'll figure out the word from the English prompt and pick from the tiles. Two are katakana loanwords (ペン, カメラ later), one is native (かばん).",
    ),
    // ── ペン (pen) — katakana loanword, single-tile pick obvious from English ──
    build(
      "ja-m4-1-1-build-pen",
      "Pick the Japanese word for: Pen",
      "ペン",
      ["みず", "ほん", "かばん", "ペン"],
      ["ペン"],
    ),
    listeningCompSentence({
      id: "ja-m4-1-1-lc-pen",
      audioText: "ペン",
      correctMeaningEn: "pen",
      distractorsEn: ["book", "water", "bag"],
    }),
    vocabMcq(
      "ja-m4-1-1-mcq-pen",
      { kana: "ペン", meaningEn: "pen", emoji: "🖊️", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    // ── かばん (bag) — single-tile pick, English prompt makes it clear ──
    build(
      "ja-m4-1-1-build-kaban",
      "Pick the Japanese word for: Bag",
      "かばん",
      ["ペン", "かばん", "ねこ", "ほん"],
      ["かばん"],
    ),
    vocabMcq(
      "ja-m4-1-1-mcq-kaban",
      { kana: "かばん", meaningEn: "bag", emoji: "👜", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    speaking("ja-m4-1-1-speak-kaban", "かばん", "Bag"),
    // ── くるま (car) — single-tile pick ──
    build(
      "ja-m4-1-1-build-kuruma",
      "Pick the Japanese word for: Car",
      "くるま",
      ["いぬ", "ペン", "かばん", "くるま"],
      ["くるま"],
    ),
    listeningCompSentence({
      id: "ja-m4-1-1-lc-kuruma",
      audioText: "くるま",
      correctMeaningEn: "car",
      distractorsEn: ["bag", "pen", "dog"],
    }),
    // ── Sentence builds using M3 grammar (これは...です) — only new word is the object ──
    build(
      "ja-m4-1-1-build-kore-pen",
      "Say: This is a pen.",
      "これは ペンです",
      ["は", "かばん", "これ", "ペン", "です", "くるま"],
      ["これ", "は", "ペン", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m4-1-1-lb-kaban",
      target: "これは かばんです",
      tiles: ["ペン", "かばん", "は", "くるま", "これ", "です"],
      correctOrder: ["これ", "は", "かばん", "です"],
      promptEn: "Hear it, build it: 'This is a bag.'",
    }),
    sentenceMcq({
      id: "ja-m4-1-1-mcq-sentence",
      prompt: "Which sentence means 'This is a car.'?",
      correctKana: "これは くるまです。",
      distractorsKana: [
        "これは かばんです。",
        "これは ペンです。",
        "これは ほんです。",
      ],
      explanation: "くるま = car. The other options are bag, pen, and book.",
    }),
    build(
      "ja-m4-1-1-build-hon-q",
      "Ask: Is this a book?",
      "これは ほんですか",
      ["か", "ペン", "です", "これ", "ほん", "は"],
      ["これ", "は", "ほん", "です", "か"],
    ),
    build(
      "ja-m4-1-1-build-kaban-question",
      "Ask: Is this a bag?",
      "これは かばんですか",
      ["ペン", "か", "かばん", "これ", "くるま", "は", "です"],
      ["これ", "は", "かばん", "です", "か"],
    ),
    speaking(
      "ja-m4-1-1-speak-kuruma",
      "これは くるまです",
      "This is a car.",
    ),
    // ── Review tail ──
    speaking("ja-m4-1-1-rev-speak-1", M4_1_1_REVIEW[0].kana, M4_1_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-1-1-rev-lc-1",
      audioText: M4_1_1_REVIEW[1].kana,
      correctMeaningEn: M4_1_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_1_1_REVIEW[2].meaningEn,
        M4_1_1_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-1-1-rev-mcq-1", M4_1_1_REVIEW[2], M4_REVIEW_M3_POOL),
    speaking("ja-m4-1-1-rev-speak-2", M4_1_1_REVIEW[3].kana, M4_1_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-1-1-rev", M4_1_1_REVIEW),
    infoStep(
      "ja-m4-1-1-info-end",
      "You can now name three everyday objects",
      "ペン (pen), かばん (bag), and くるま (car) — used in これは X です sentences and yes/no questions with か.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_1_1.steps);
assertAnswerRotation(M4_1_1.steps, 2);
assertNoConsecutiveSame(M4_1_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-1-2 — Everyday objects (カメラ, けいたい + combined drills)
// ═══════════════════════════════════════════════════════════════════════

const M4_1_2_REVIEW = pickReviewAtoms("ja-m4-1-2-rev", M4_REVIEW_M3_POOL, 4);

export const M4_1_2: LessonContent = {
  id: "ja-m4-1-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Everyday objects II",
  description:
    "Two more objects — camera, mobile phone. Combined drills across all five M4 objects.",
  estimatedMinutes: 8,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m4-1-2-info-open",
      "Two more objects",
      "カメラ (camera) and けいたい (mobile phone). After these you'll drill all five objects in sentences.",
    ),
    // ── カメラ (camera) — katakana loanword, obvious from English ──
    build(
      "ja-m4-1-2-build-kamera",
      "Pick the Japanese word for: Camera",
      "カメラ",
      ["コーヒー", "カメラ", "ペン", "くるま"],
      ["カメラ"],
    ),
    speaking("ja-m4-1-2-speak-kamera", "カメラ", "Camera"),
    listeningCompSentence({
      id: "ja-m4-1-2-lc-kamera",
      audioText: "カメラ",
      correctMeaningEn: "camera",
      distractorsEn: ["pen", "car", "coffee"],
    }),
    // ── けいたい (mobile phone) — single-tile pick, English makes it clear ──
    build(
      "ja-m4-1-2-build-keitai",
      "Pick the Japanese word for: Mobile phone",
      "けいたい",
      ["カメラ", "けいたい", "タクシー", "かばん"],
      ["けいたい"],
    ),
    vocabMcq(
      "ja-m4-1-2-mcq-keitai",
      { kana: "けいたい", meaningEn: "mobile phone", emoji: "📱", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    // ── Combined drills — all five objects ──
    build(
      "ja-m4-1-2-build-keitai-sentence",
      "Say: This is a mobile phone.",
      "これは けいたいです",
      ["は", "です", "ペン", "これ", "けいたい", "カメラ"],
      ["これ", "は", "けいたい", "です"],
    ),
    sentenceMcq({
      id: "ja-m4-1-2-mcq-discriminate",
      prompt: "Which sentence means 'This is a camera.'?",
      correctKana: "これは カメラです。",
      distractorsKana: [
        "これは けいたいです。",
        "これは くるまです。",
        "それは カメラです。",
      ],
      explanation: "カメラ = camera, and これ = 'this' (not それ). The other distractors are mobile phone and car.",
    }),
    build(
      "ja-m4-1-2-build-keitai-q",
      "Ask: Is that a mobile phone?",
      "それは けいたいですか",
      ["は", "カメラ", "です", "けいたい", "それ", "か"],
      ["それ", "は", "けいたい", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m4-1-2-lc-keitai-sentence",
      audioText: "それは カメラです",
      correctMeaningEn: "That is a camera.",
      distractorsEn: [
        "That is a mobile phone.",
        "This is a camera.",
        "Is that a camera?",
      ],
    }),
    cloze(
      "ja-m4-1-2-cloze-ka",
      "これは カメラです",
      "。",
      "か",
      ["か", "は", "の", "を"],
      "Is this a camera?",
      "これは カメラですか。",
      "か at the end turns a statement into a question.",
    ),
    build(
      "ja-m4-1-2-build-kuruma-q",
      "Ask: Is this a car?",
      "これは くるまですか",
      ["は", "かばん", "くるま", "これ", "か", "です", "カメラ"],
      ["これ", "は", "くるま", "です", "か"],
    ),
    speaking(
      "ja-m4-1-2-speak-keitai",
      "あれは ペンです",
      "That over there is a pen.",
    ),
    listeningBuildSentence({
      id: "ja-m4-1-2-lb-pen",
      target: "これは ペンです",
      tiles: ["カメラ", "これ", "です", "ペン", "かばん", "は"],
      correctOrder: ["これ", "は", "ペン", "です"],
      promptEn: "Hear it, build it: 'This is a pen.'",
    }),
    // ── Review tail ──
    speaking("ja-m4-1-2-rev-speak-1", M4_1_2_REVIEW[0].kana, M4_1_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-1-2-rev-lc-1",
      audioText: M4_1_2_REVIEW[1].kana,
      correctMeaningEn: M4_1_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_1_2_REVIEW[2].meaningEn,
        M4_1_2_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-1-2-rev-mcq-1", M4_1_2_REVIEW[2], M4_REVIEW_M3_POOL),
    speaking("ja-m4-1-2-rev-speak-2", M4_1_2_REVIEW[3].kana, M4_1_2_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-1-2-rev", M4_1_2_REVIEW),
    infoStep(
      "ja-m4-1-2-info-end",
      "You can now name and ask about five everyday objects",
      "ペン, かばん, くるま, カメラ, and けいたい — all drilled in これは X です sentences and question forms with か.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_1_2.steps);
assertAnswerRotation(M4_1_2.steps, 2);
assertNoConsecutiveSame(M4_1_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-2-1 — の grammar rule + initial possession drills
// ═══════════════════════════════════════════════════════════════════════

const RULE_NO = grammarRule({
  id: "ja-m4-2-1-rule-no",
  title: "の — the possession particle",
  rule:
    "の sits between two nouns and means 'the [LEFT] kind of [RIGHT].' Most often this maps to English possessive 's (わたしのほん = my book). But the deeper pattern is broader: にほんのくるま = a Japanese car (Japan-kind-of car).",
  examples: [
    {
      ja: "わたしの ほんです。",
      romaji: "watashi no hon desu.",
      en: "It's my book. (the me-kind of book)",
    },
    {
      ja: "にほんの くるまです。",
      romaji: "nihon no kuruma desu.",
      en: "It's a Japanese car. (the Japan-kind of car)",
    },
  ],
  antiPattern: {
    ja: "わたし ほんです。",
    romaji: "watashi hon desu.",
    en: "(broken — missing の reads as 'I book')",
    why: "Without の the two nouns just sit next to each other and the relationship is ambiguous. の glues them: わたし + の + ほん = my book.",
  },
  cultureNote:
    "If you can rephrase the English as 'the X kind of Y,' の works.",
});

const M4_2_1_REVIEW = pickReviewAtoms("ja-m4-2-1-rev", M4_REVIEW_M2_POOL, 4);

export const M4_2_1: LessonContent = {
  id: "ja-m4-2-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "の — possession (intro)",
  description:
    "The particle that glues two nouns into possessive form. Grammar rule + initial drills.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m4-2-1-info-open",
      "One particle, one relationship",
      "の glues nouns. Most of the time it means possessive 's — owner + の + owned. You'll build possessive sentences from tiles, then drill the pattern with clozes.",
    ),
    RULE_NO,
    // ── Possession drills ──
    cloze(
      "ja-m4-2-1-cloze-1",
      "わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "It's my bag.",
      "わたしの かばんです。",
      "わたし + の + かばん = my bag.",
    ),
    listeningCompSentence({
      id: "ja-m4-2-1-lc-watashi-hon",
      audioText: "わたしの ほんです",
      correctMeaningEn: "It's my book.",
      distractorsEn: [
        "It's the teacher's book.",
        "Is it your book?",
        "This is a book.",
      ],
    }),
    cloze(
      "ja-m4-2-1-cloze-2",
      "せんせい",
      " ほんです。",
      "の",
      ["は", "の", "に", "を"],
      "It's the teacher's book.",
      "せんせいの ほんです。",
      "せんせい + の + ほん = teacher's book.",
    ),
    sentenceMcq({
      id: "ja-m4-2-1-mcq-discriminate",
      prompt: "Which sentence means 'My friend is a teacher.'?",
      correctKana: "ともだちは せんせいです。",
      distractorsKana: [
        "ともだちの せんせいです。",
        "ともだちは せんせいですか。",
        "ともだちの せんせいですか。",
      ],
      explanation:
        "は marks the topic. の would mean 'my friend's teacher' — a different sentence.",
    }),
    cloze(
      "ja-m4-2-1-cloze-3",
      "ともだち",
      " ペンです。",
      "の",
      ["は", "の", "を", "に"],
      "It's my friend's pen.",
      "ともだちの ペンです。",
      "ともだち + の + ペン = friend's pen.",
    ),
    // Rotate answer — M3 review は
    cloze(
      "ja-m4-2-1-cloze-ha",
      "せんせい",
      " にほんじんです。",
      "は",
      ["は", "の", "が", "を"],
      "The teacher is Japanese.",
      "せんせいは にほんじんです。",
      "M3 review: は marks the topic.",
    ),
    build(
      "ja-m4-2-1-build-watashi-pen",
      "Say: It's my pen.",
      "わたしの ペンです",
      ["せんせい", "わたし", "の", "ともだち", "です", "ペン"],
      ["わたし", "の", "ペン", "です"],
    ),
    speaking(
      "ja-m4-2-1-speak-tomodachi",
      "ともだちの ペンです",
      "It's my friend's pen.",
    ),
    build(
      "ja-m4-2-1-build-sensei-hon",
      "It's the teacher's book.",
      "せんせいの ほんです",
      ["わたし", "ともだち", "ほん", "です", "せんせい", "の"],
      ["せんせい", "の", "ほん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m4-2-1-lc-tomodachi-kuruma",
      audioText: "ともだちの くるまです",
      correctMeaningEn: "It's my friend's car.",
      distractorsEn: [
        "It's my car.",
        "It's the teacher's car.",
        "Is it my friend's car?",
      ],
    }),
    listeningBuildSentence({
      id: "ja-m4-2-1-lb-watashi-kaban",
      target: "わたしの くるまです",
      tiles: ["の", "かばん", "です", "くるま", "ペン", "わたし"],
      correctOrder: ["わたし", "の", "くるま", "です"],
      promptEn: "Hear it, build it: 'It's my car.'",
    }),
    speaking(
      "ja-m4-2-1-speak-final",
      "わたしの けいたいです",
      "It's my mobile phone.",
    ),
    // ── Review tail ──
    speaking("ja-m4-2-1-rev-speak-1", M4_2_1_REVIEW[0].kana, M4_2_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-2-1-rev-lc-1",
      audioText: M4_2_1_REVIEW[1].kana,
      correctMeaningEn: M4_2_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_2_1_REVIEW[2].meaningEn,
        M4_2_1_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-2-1-rev-mcq-1", M4_2_1_REVIEW[2], M4_REVIEW_M2_POOL),
    speaking("ja-m4-2-1-rev-speak-2", M4_2_1_REVIEW[3].kana, M4_2_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-2-1-rev", M4_2_1_REVIEW),
    infoStep(
      "ja-m4-2-1-info-end",
      "You can now say whose things are whose",
      "The possession particle の — わたしの ほん (my book), せんせいの ペン (the teacher's pen). Owner + の + thing owned.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_2_1.steps);
assertAnswerRotation(M4_2_1.steps, 2);
assertNoConsecutiveSame(M4_2_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-2-2 — の — "kind of" reading + self-explanation + production
// ═══════════════════════════════════════════════════════════════════════

const M4_2_2_REVIEW = pickReviewAtoms("ja-m4-2-2-rev", M4_REVIEW_M1_POOL, 4);

export const M4_2_2: LessonContent = {
  id: "ja-m4-2-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "の — 'kind of' reading",
  description:
    "The broader pattern: にほんの くるま = 'Japan-kind-of car.' Self-explanation + production.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m4-2-2-info-open",
      "Beyond possession",
      "の also means 'kind of' — にほんの くるま is 'a Japan-kind-of car' = a Japanese car. Same particle, broader use.",
    ),
    cloze(
      "ja-m4-2-2-cloze-1",
      "にほん",
      " くるまです。",
      "の",
      ["は", "の", "が", "に"],
      "It's a Japanese car.",
      "にほんの くるまです。",
      "'Japan-kind-of car' = Japanese car. Same particle as possession.",
    ),
    listeningCompSentence({
      id: "ja-m4-2-2-lc-nihon-kuruma",
      audioText: "アメリカの くるまです",
      correctMeaningEn: "It's an American car.",
      distractorsEn: [
        "It's a Japanese car.",
        "It's an American camera.",
        "Is it an American car?",
      ],
    }),
    cloze(
      "ja-m4-2-2-cloze-2",
      "アメリカ",
      " カメラです。",
      "の",
      ["の", "は", "が", "を"],
      "It's an American camera.",
      "アメリカの カメラです。",
      "'America-kind-of camera' = an American camera.",
    ),
    // Converted from review-は cloze (2026-06-12 sentence-variety wave):
    // production build exercising the new "kind-of" の instead.
    build(
      "ja-m4-2-2-build-america-kuruma",
      "Say: That is an American car.",
      "それは アメリカの くるまです",
      ["くるま", "それ", "カメラ", "の", "アメリカ", "です", "は", "にほん"],
      ["それ", "は", "アメリカ", "の", "くるま", "です"],
    ),
    build(
      "ja-m4-2-2-build-nihon-kamera",
      "Say: It's a Japanese camera.",
      "にほんの カメラです",
      ["アメリカ", "くるま", "です", "の", "カメラ", "にほん"],
      ["にほん", "の", "カメラ", "です"],
    ),
    sentenceMcq({
      id: "ja-m4-2-2-mcq-kind",
      prompt: "Which sentence means 'It's an American pen.'?",
      correctKana: "アメリカの ペンです。",
      distractorsKana: [
        "アメリカは ペンです。",
        "にほんの ペンです。",
        "アメリカの ペンですか。",
      ],
      explanation:
        "アメリカ + の + ペン = 'America-kind-of pen.' は would make America the topic ('as for America, it's a pen').",
    }),
    speaking(
      "ja-m4-2-2-speak-nihon",
      "せんせいの くるまです",
      "It's the teacher's car.",
    ),
    // Self-explanation — after enough commits
    selfExplain({
      id: "ja-m4-2-2-self-no",
      anchorLabel: "You picked の in: にほん＿ くるま",
      anchorAudioText: "にほんの くるま",
      question: "What's the rule that makes の correct in BOTH 'わたしの かばん' and 'にほんの くるま'?",
      rule: {
        text: "の puts the LEFT noun in a 'kind/source' relationship to the RIGHT noun.",
      },
      surface: {
        text: "の links two nouns into a single compound noun.",
      },
      distractor: {
        text: "の marks the topic of the sentence, like は does.",
      },
      ruleExplanation:
        "の sets up an L-kind-of-R relationship — possession (my bag) is just one case. It doesn't fuse nouns into a compound, and it's never the topic marker.",
    }),
    build(
      "ja-m4-2-2-build-kore-nihon",
      "This is a Japanese car.",
      "これは にほんの くるまです",
      ["の", "アメリカ", "です", "は", "くるま", "これ", "にほん", "カメラ"],
      ["これ", "は", "にほん", "の", "くるま", "です"],
    ),
    // Converted from review-か cloze: question production with の.
    build(
      "ja-m4-2-2-build-keitai-q",
      "Ask: Is it your friend's mobile phone?",
      "ともだちの けいたいですか",
      ["カメラ", "か", "けいたい", "ともだち", "わたし", "です", "の"],
      ["ともだち", "の", "けいたい", "です", "か"],
    ),
    listeningBuildSentence({
      id: "ja-m4-2-2-lb-america",
      target: "アメリカの カメラです",
      tiles: ["カメラ", "です", "アメリカ", "にほん", "の", "ペン"],
      correctOrder: ["アメリカ", "の", "カメラ", "です"],
      promptEn: "Hear it, build it: 'It's an American camera.'",
    }),
    speaking(
      "ja-m4-2-2-speak-final",
      "アメリカの コーヒーです",
      "It's American coffee.",
    ),
    build(
      "ja-m4-2-2-build-question",
      "Ask: Is it the teacher's pen?",
      "せんせいの ペンですか",
      ["ほん", "の", "か", "です", "ペン", "せんせい", "わたし"],
      ["せんせい", "の", "ペン", "です", "か"],
    ),
    // ── Review tail ──
    speaking("ja-m4-2-2-rev-speak-1", M4_2_2_REVIEW[0].kana, M4_2_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-2-2-rev-lc-1",
      audioText: M4_2_2_REVIEW[1].kana,
      correctMeaningEn: M4_2_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_2_2_REVIEW[2].meaningEn,
        M4_2_2_REVIEW[3].meaningEn,
        M4_REVIEW_M2_POOL[0].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-2-2-rev-mcq-1", M4_2_2_REVIEW[2], M4_REVIEW_M1_POOL),
    speaking("ja-m4-2-2-rev-speak-2", M4_2_2_REVIEW[3].kana, M4_2_2_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-2-2-rev", M4_2_2_REVIEW),
    infoStep(
      "ja-m4-2-2-info-end",
      "You can now use の for both possession and 'kind of'",
      "わたしの かばん (my bag) and にほんの くるま (a Japanese car) — same particle, two readings. Plus self-explanation on why の works in both.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_2_2.steps);
assertAnswerRotation(M4_2_2.steps, 2);
assertNoConsecutiveSame(M4_2_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-3-1 — More objects (かさ, じしょ, いす)
// ═══════════════════════════════════════════════════════════════════════

const M4_3_1_REVIEW = pickReviewAtoms("ja-m4-3-1-rev", M4_REVIEW_M1_POOL, 4);

export const M4_3_1: LessonContent = {
  id: "ja-m4-3-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "More objects I",
  description:
    "Three more nouns — umbrella, dictionary, chair. Each introduced via build, then used in の sentences.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m4-3-1-info-open",
      "Three new objects",
      "かさ (umbrella), じしょ (dictionary), いす (chair). You'll figure each out from the English prompt, then immediately use it in possessive sentences.",
    ),
    // ── かさ (umbrella) ──
    build(
      "ja-m4-3-1-build-kasa",
      "Pick the Japanese word for: Umbrella",
      "かさ",
      ["ほん", "ペン", "いす", "かさ"],
      ["かさ"],
    ),
    vocabMcq(
      "ja-m4-3-1-mcq-kasa",
      { kana: "かさ", meaningEn: "umbrella", emoji: "☂️", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    // ── じしょ (dictionary) ──
    build(
      "ja-m4-3-1-build-jisho",
      "Pick the Japanese word for: Dictionary",
      "じしょ",
      ["かさ", "みず", "じしょ", "ほん"],
      ["じしょ"],
    ),
    listeningCompSentence({
      id: "ja-m4-3-1-lc-jisho",
      audioText: "じしょ",
      correctMeaningEn: "dictionary",
      distractorsEn: ["book", "umbrella", "water"],
    }),
    // ── いす (chair) ──
    build(
      "ja-m4-3-1-build-isu",
      "Pick the Japanese word for: Chair",
      "いす",
      ["じしょ", "かばん", "かさ", "いす"],
      ["いす"],
    ),
    listeningCompSentence({
      id: "ja-m4-3-1-lc-isu",
      audioText: "いす",
      correctMeaningEn: "chair",
      distractorsEn: ["dictionary", "umbrella", "bag"],
    }),
    // ── の drills with new vocab ──
    cloze(
      "ja-m4-3-1-cloze-1",
      "わたし",
      " かさです。",
      "の",
      ["の", "は", "が", "を"],
      "It's my umbrella.",
      "わたしの かさです。",
      "わたし + の + かさ = my umbrella.",
    ),
    build(
      "ja-m4-3-1-build-sensei-jisho",
      "Say: It's the teacher's dictionary.",
      "せんせいの じしょです",
      ["じしょ", "の", "せんせい", "です", "かさ", "わたし"],
      ["せんせい", "の", "じしょ", "です"],
    ),
    listeningCompSentence({
      id: "ja-m4-3-1-lc-sensei-jisho",
      audioText: "せんせいの じしょです",
      correctMeaningEn: "It's the teacher's dictionary.",
      distractorsEn: [
        "It's my dictionary.",
        "It's the teacher's book.",
        "Is it the teacher's dictionary?",
      ],
    }),
    // ── も (also/too) — grammar rule + cloze drills ──
    grammarRule({
      id: "ja-m4-3-1-rule-mo",
      title: "も — also / too",
      rule: "も replaces は when you want to say 'also' or 'too.' It marks the topic as being the same as something mentioned before.",
      examples: [
        { ja: "わたしは がくせいです", romaji: "watashi wa gakusei desu", en: "I am a student" },
        { ja: "ともだちも がくせいです", romaji: "tomodachi mo gakusei desu", en: "My friend is also a student" },
        { ja: "コーヒーも おいしいです", romaji: "koohii mo oishii desu", en: "Coffee is also delicious" },
      ],
      antiPattern: { ja: "ともだちはも がくせいです", romaji: "tomodachi wa mo gakusei desu", en: "(Using は and も together)", why: "も replaces は — don't use both. Say ともだちも, not ともだちはも." },
    }),
    cloze(
      "ja-m4-3-1-cloze-mo",
      "ともだち",
      " がくせいです。",
      "も",
      ["は", "も", "が", "の"],
      "My friend is also a student.",
      "ともだちも がくせいです。",
      "も replaces は to mean 'also'.",
    ),
    cloze(
      "ja-m4-3-1-cloze-wa-vs-mo",
      "わたし",
      " せんせいです。",
      "は",
      ["は", "も", "が", "の"],
      "I am a teacher.",
      "わたしは せんせいです。",
      "は introduces a new topic; も would mean 'also'.",
    ),
    speaking("ja-m4-3-1-speak-kasa", "わたしの かさです", "It's my umbrella."),
    sentenceMcq({
      id: "ja-m4-3-1-mcq-discriminate",
      prompt: "Which sentence means 'It's my friend's chair.'?",
      correctKana: "ともだちの いすです。",
      distractorsKana: [
        "ともだちの じしょです。",
        "せんせいの いすです。",
        "ともだちは いすです。",
      ],
      explanation: "ともだち + の + いす = friend's chair.",
    }),
    build(
      "ja-m4-3-1-build-tomodachi-isu",
      "It's my friend's chair.",
      "ともだちの いすです",
      ["じしょ", "せんせい", "いす", "の", "です", "ともだち"],
      ["ともだち", "の", "いす", "です"],
    ),
    // ── Review tail ──
    speaking("ja-m4-3-1-rev-speak-1", M4_3_1_REVIEW[0].kana, M4_3_1_REVIEW[0].meaningEn),
    vocabMcq("ja-m4-3-1-rev-mcq-1", M4_3_1_REVIEW[2], M4_REVIEW_M1_POOL),
    reviewMatchPairs("ja-m4-3-1-rev", M4_3_1_REVIEW),
    infoStep(
      "ja-m4-3-1-info-end",
      "You can now talk about umbrellas, dictionaries, and chairs",
      "Three more objects — かさ (umbrella), じしょ (dictionary), いす (chair) — immediately used in possessive の sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_3_1.steps);
assertAnswerRotation(M4_3_1.steps, 2);
assertNoConsecutiveSame(M4_3_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-3-2 — More objects (てがみ, じてんしゃ) + の in full sentences
// ═══════════════════════════════════════════════════════════════════════

const M4_3_2_REVIEW = pickReviewAtoms("ja-m4-3-2-rev", M4_REVIEW_M2_POOL, 4);

export const M4_3_2: LessonContent = {
  id: "ja-m4-3-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "More objects II",
  description:
    "Letter and bicycle, plus cumulative drills combining all objects with の.",
  estimatedMinutes: 9,
  xpReward: 20,
  steps: [
    infoStep(
      "ja-m4-3-2-info-open",
      "Two more + combined drills",
      "てがみ (letter) and じてんしゃ (bicycle). Then cumulative sentences using all your new objects with の.",
    ),
    // ── てがみ (letter) ──
    build(
      "ja-m4-3-2-build-tegami",
      "Pick the Japanese word for: Letter (postal)",
      "てがみ",
      ["ほん", "てがみ", "かさ", "じしょ"],
      ["てがみ"],
    ),
    speaking("ja-m4-3-2-speak-tegami", "てがみ", "Letter"),
    listeningCompSentence({
      id: "ja-m4-3-2-lc-tegami",
      audioText: "てがみ",
      correctMeaningEn: "letter (postal)",
      distractorsEn: ["dictionary", "umbrella", "book"],
    }),
    // ── じてんしゃ (bicycle) ──
    build(
      "ja-m4-3-2-build-jitensha",
      "Pick the Japanese word for: Bicycle",
      "じてんしゃ",
      ["てがみ", "じてんしゃ", "くるま", "かばん"],
      ["じてんしゃ"],
    ),
    vocabMcq(
      "ja-m4-3-2-mcq-jitensha",
      { kana: "じてんしゃ", meaningEn: "bicycle", emoji: "🚲", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    // ── Combined drills ──
    cloze(
      "ja-m4-3-2-cloze-1",
      "ともだち",
      " じてんしゃですか。",
      "の",
      ["の", "は", "を", "が"],
      "Is it your friend's bicycle?",
      "ともだちの じてんしゃですか。",
    ),
    build(
      "ja-m4-3-2-build-friend-bike",
      "Ask: Is it your friend's bicycle?",
      "ともだちの じてんしゃですか",
      ["です", "じてんしゃ", "の", "じしょ", "か", "わたし", "ともだち"],
      ["ともだち", "の", "じてんしゃ", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m4-3-2-lc-watashi-jitensha",
      audioText: "わたしの じてんしゃです",
      correctMeaningEn: "It's my bicycle.",
      distractorsEn: [
        "It's your bicycle.",
        "Is it my friend's bicycle?",
        "It's the teacher's bicycle.",
      ],
    }),
    // Converted from review-は cloze: pointer + の production instead.
    build(
      "ja-m4-3-2-build-sensei-kasa",
      "Say: This is the teacher's umbrella.",
      "これは せんせいの かさです",
      ["かさ", "これ", "です", "は", "てがみ", "わたし", "の", "せんせい"],
      ["これ", "は", "せんせい", "の", "かさ", "です"],
    ),
    sentenceMcq({
      id: "ja-m4-3-2-mcq-discriminate",
      prompt: "Which sentence means 'It's my friend's umbrella.'?",
      correctKana: "ともだちの かさです。",
      distractorsKana: [
        "せんせいの かさです。",
        "ともだちの てがみです。",
        "ともだちは かさです。",
      ],
      explanation: "ともだち + の + かさ = friend's umbrella.",
    }),
    build(
      "ja-m4-3-2-build-friend-umbrella",
      "It's my friend's umbrella.",
      "ともだちの かさです",
      ["です", "かさ", "の", "せんせい", "ともだち", "ペン"],
      ["ともだち", "の", "かさ", "です"],
    ),
    speaking(
      "ja-m4-3-2-speak-tomodachi-tegami",
      "ともだちの てがみです",
      "It's my friend's letter.",
    ),
    // Converted from review-か cloze: listening production over の with
    // cross-module vocab (M2 ぼうし).
    listeningBuildSentence({
      id: "ja-m4-3-2-lb-boushi",
      target: "ともだちの ぼうしです",
      tiles: ["わたし", "ぼうし", "の", "かさ", "ともだち", "です"],
      correctOrder: ["ともだち", "の", "ぼうし", "です"],
      promptEn: "Hear it, build it: 'It's my friend's hat.'",
    }),
    listeningBuildSentence({
      id: "ja-m4-3-2-lb-sensei-tegami",
      target: "せんせいの てがみです",
      tiles: ["かさ", "です", "わたし", "の", "せんせい", "てがみ"],
      correctOrder: ["せんせい", "の", "てがみ", "です"],
      promptEn: "Hear it, build it: 'It's the teacher's letter.'",
    }),
    // ── Review tail ──
    speaking("ja-m4-3-2-rev-speak-1", M4_3_2_REVIEW[0].kana, M4_3_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-3-2-rev-lc-1",
      audioText: M4_3_2_REVIEW[1].kana,
      correctMeaningEn: M4_3_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_3_2_REVIEW[2].meaningEn,
        M4_3_2_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[1].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-3-2-rev-mcq-1", M4_3_2_REVIEW[2], M4_REVIEW_M2_POOL),
    speaking("ja-m4-3-2-rev-speak-2", M4_3_2_REVIEW[3].kana, M4_3_2_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-3-2-rev", M4_3_2_REVIEW),
    infoStep(
      "ja-m4-3-2-info-end",
      "You can now describe ownership of ten everyday objects",
      "てがみ (letter) and じてんしゃ (bicycle) complete the set. All ten objects drilled in possessive の sentences and question forms.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_3_2.steps);
assertAnswerRotation(M4_3_2.steps, 2);
assertNoConsecutiveSame(M4_3_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-4-1 — これ / それ / あれ / どれ (Grammar Rule + initial drills)
// ═══════════════════════════════════════════════════════════════════════

const RULE_KOSOADO = grammarRule({
  id: "ja-m4-4-1-rule-kosoado",
  title: "これ / それ / あれ / どれ — the pointer system",
  rule:
    "Four words for 'this/that.' これ = near me. それ = near you. あれ = far from both. どれ = which one (question).",
  examples: [
    {
      ja: "これは わたしの かばんです。",
      romaji: "kore wa watashi no kaban desu.",
      en: "This (near me) is my bag.",
    },
    {
      ja: "それは なんですか。",
      romaji: "sore wa nan desu ka.",
      en: "What's that (near you)?",
    },
    {
      ja: "あれは せんせいの くるまです。",
      romaji: "are wa sensei no kuruma desu.",
      en: "That (over there) is the teacher's car.",
    },
  ],
  antiPattern: {
    ja: "これは どれですか。",
    romaji: "kore wa dore desu ka.",
    en: "(broken — 'this is which?' mixes pointer and question)",
    why: "どれ is the question word — pair it with が: 'どれが あなたの ペンですか' (which is your pen?).",
  },
  cultureNote:
    "Japanese splits 'that' into two — near the listener (それ) vs far from both (あれ). English collapses them.",
});

const M4_4_1_REVIEW = pickReviewAtoms("ja-m4-4-1-rev", M4_REVIEW_M3_POOL, 4);

export const M4_4_1: LessonContent = {
  id: "ja-m4-4-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Pointers — これ / それ / あれ",
  description:
    "Three spatial pointers introduced via build. Grammar rule + drills on distance-based pointing.",
  estimatedMinutes: 9,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m4-4-1-info-open",
      "Pointing precisely",
      "English has 'this' and 'that.' Japanese has four words, split by distance. You'll learn three pointers now (これ/それ/あれ) and the question word (どれ) next.",
    ),
    RULE_KOSOADO,
    // ── これ — learner knows it from M4-1 sentences, but formally intro here ──
    build(
      "ja-m4-4-1-build-kore",
      "Pick the Japanese word for: This (near me)",
      "これ",
      ["それ", "あれ", "これ", "ほん"],
      ["これ"],
    ),
    // ── それ — single tile, English disambiguates ──
    build(
      "ja-m4-4-1-build-sore",
      "Pick the Japanese word for: That (near you)",
      "それ",
      ["これ", "それ", "あれ", "かばん"],
      ["それ"],
    ),
    // ── あれ — single tile ──
    build(
      "ja-m4-4-1-build-are",
      "Pick the Japanese word for: That (far from both of us)",
      "あれ",
      ["それ", "これ", "あれ", "くるま"],
      ["あれ"],
    ),
    // ── Drills ──
    // Converted from review-は cloze: build the question-word pointer
    // sentence from the rule card instead.
    build(
      "ja-m4-4-1-build-sore-nan",
      "Ask: What's that (near you)?",
      "それは なんですか",
      ["です", "か", "なん", "これ", "は", "どれ", "それ"],
      ["それ", "は", "なん", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m4-4-1-lc-are",
      audioText: "あれは ともだちの じてんしゃです",
      correctMeaningEn: "That over there is my friend's bicycle.",
      distractorsEn: [
        "This is my friend's bicycle.",
        "That near you is my friend's bicycle.",
        "Is that my friend's bicycle?",
      ],
    }),
    cloze(
      "ja-m4-4-1-cloze-2",
      "あれは せんせい",
      " くるまです。",
      "の",
      ["は", "の", "が", "に"],
      "That over there is the teacher's car.",
      "あれは せんせいの くるまです。",
      "Pointer + topic は + possessive の.",
    ),
    sentenceMcq({
      id: "ja-m4-4-1-mcq-pointer",
      prompt: "Which sentence means 'That over there is my friend's bag.'?",
      correctKana: "あれは ともだちの かばんです。",
      distractorsKana: [
        "これは ともだちの かばんです。",
        "それは ともだちの かばんです。",
        "あれは ともだちは かばんです。",
      ],
      explanation:
        "あれ = far from both. これ = near me; それ = near you.",
    }),
    // Converted from review-は cloze: pointer + の production with あに.
    build(
      "ja-m4-4-1-build-ani-hon",
      "Say: This is my older brother's book.",
      "これは あにの ほんです",
      ["の", "ねこ", "これ", "です", "あに", "わたし", "は", "ほん"],
      ["これ", "は", "あに", "の", "ほん", "です"],
    ),
    build(
      "ja-m4-4-1-build-kore-mybag",
      "Say: This is my bag.",
      "これは わたしの かばんです",
      ["です", "は", "わたし", "これ", "かばん", "の", "それ", "ともだち"],
      ["これ", "は", "わたし", "の", "かばん", "です"],
    ),
    speaking(
      "ja-m4-4-1-speak-are",
      "それは あにの ぼうしです",
      "That is my older brother's hat.",
    ),
    build(
      "ja-m4-4-1-build-sore-pen",
      "Is that (near you) my friend's pen?",
      "それは ともだちの ペンですか",
      ["わたし", "は", "これ", "の", "それ", "ペン", "ともだち", "か", "です"],
      ["それ", "は", "ともだち", "の", "ペン", "です", "か"],
    ),
    listeningBuildSentence({
      id: "ja-m4-4-1-lb-kore-kasa",
      target: "これは わたしの かさです",
      tiles: ["わたし", "かさ", "の", "それ", "ともだち", "は", "です", "これ"],
      correctOrder: ["これ", "は", "わたし", "の", "かさ", "です"],
      promptEn: "Hear it, build it: 'This is my umbrella.'",
    }),
    // ── Review tail ──
    speaking("ja-m4-4-1-rev-speak-1", M4_4_1_REVIEW[0].kana, M4_4_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-4-1-rev-lc-1",
      audioText: M4_4_1_REVIEW[1].kana,
      correctMeaningEn: M4_4_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_4_1_REVIEW[2].meaningEn,
        M4_4_1_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[2].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-4-1-rev-mcq-1", M4_4_1_REVIEW[2], M4_REVIEW_M3_POOL),
    speaking("ja-m4-4-1-rev-speak-2", M4_4_1_REVIEW[3].kana, M4_4_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-4-1-rev", M4_4_1_REVIEW),
    infoStep(
      "ja-m4-4-1-info-end",
      "You can now point at things by distance",
      "Three spatial pointers: これ (near me), それ (near you), あれ (far from both) — combined with は and の in full sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_4_1.steps);
assertAnswerRotation(M4_4_1.steps, 2);
assertNoConsecutiveSame(M4_4_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-4-2 — どれ (which) + self-explanation + cumulative pointer drills
// ═══════════════════════════════════════════════════════════════════════

const M4_4_2_REVIEW = pickReviewAtoms("ja-m4-4-2-rev", M4_REVIEW_M1_POOL, 4);

export const M4_4_2: LessonContent = {
  id: "ja-m4-4-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Pointers — どれ + cumulative drills",
  description:
    "The question pointer どれ (which one) + self-explanation on は vs の after pointers. Mixed pointer drills.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m4-4-2-info-open",
      "The question pointer",
      "どれ = 'which one?' — the fourth member of the こそあど system. Unlike the other three, question words take が (not は).",
    ),
    // ── どれ introduction ──
    build(
      "ja-m4-4-2-build-dore",
      "Pick the Japanese word for: Which one",
      "どれ",
      ["それ", "あれ", "どれ", "これ"],
      ["どれ"],
    ),
    vocabMcq(
      "ja-m4-4-2-mcq-dore",
      { kana: "どれ", meaningEn: "which one", emoji: "🤔", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    // どれ takes が
    cloze(
      "ja-m4-4-2-cloze-ga",
      "どれ",
      " あなたの ペンですか。",
      "が",
      ["が", "は", "の", "を"],
      "Which one is your pen?",
      "どれが あなたの ペンですか。",
      "Question words like どれ take が, not は.",
    ),
    listeningCompSentence({
      id: "ja-m4-4-2-lc-dore",
      audioText: "どれが せんせいの ほんですか",
      correctMeaningEn: "Which one is the teacher's book?",
      distractorsEn: [
        "What is the teacher's book?",
        "Is this the teacher's book?",
        "That is the teacher's book.",
      ],
    }),
    // Mixed pointer clozes
    // Converted from review-は cloze: question production over pointer + の.
    build(
      "ja-m4-4-2-build-anata-jisho",
      "Ask: Is that (near you) your dictionary?",
      "それは あなたの じしょですか",
      ["じしょ", "あなた", "です", "これ", "それ", "か", "は", "わたし", "の"],
      ["それ", "は", "あなた", "の", "じしょ", "です", "か"],
    ),
    cloze(
      "ja-m4-4-2-cloze-no",
      "あれは わたし",
      " カメラです。",
      "の",
      ["の", "は", "が", "を"],
      "That over there is my camera.",
      "あれは わたしの カメラです。",
      "Pointer (あれ) + topic は + possessive の.",
    ),
    // Self-explanation
    selfExplain({
      id: "ja-m4-4-2-self-ha-pointer",
      anchorLabel: "You picked は in: それ＿ なんですか。",
      anchorAudioText: "それは なんですか",
      question: "Why does は (not の) follow それ here?",
      rule: {
        text: "それ is the topic of the sentence — は marks the topic.",
      },
      surface: { text: "は always follows a pointer word like それ." },
      distractor: { text: "の would also work in this sentence." },
      ruleExplanation:
        "は marks what the sentence is ABOUT. の only links two nouns. There's no second noun here for の to attach to.",
    }),
    build(
      "ja-m4-4-2-build-dore-jisho",
      "Ask: Which is your dictionary?",
      "どれが あなたの じしょですか",
      ["が", "じしょ", "どれ", "わたし", "の", "か", "は", "です", "あなた"],
      ["どれ", "が", "あなた", "の", "じしょ", "です", "か"],
    ),
    sentenceMcq({
      id: "ja-m4-4-2-mcq-mixed",
      prompt: "Which sentence asks 'Is that (over there) the teacher?'?",
      correctKana: "あれは せんせいですか。",
      distractorsKana: [
        "あれの せんせいですか。",
        "それは せんせいですか。",
        "あれは せんせいです。",
      ],
      explanation:
        "あれ + は (topic) + か (question). あれの would mean 'that one's teacher' (possession).",
    }),
    speaking(
      "ja-m4-4-2-speak-dore",
      "どれが あなたの ペンですか",
      "Which one is your pen?",
    ),
    build(
      "ja-m4-4-2-build-are-kuruma",
      "That over there is my friend's car.",
      "あれは ともだちの くるまです",
      ["です", "の", "くるま", "これ", "せんせい", "あれ", "は", "ともだち"],
      ["あれ", "は", "ともだち", "の", "くるま", "です"],
    ),
    listeningCompSentence({
      id: "ja-m4-4-2-lc-sensei-kuruma",
      audioText: "せんせいの くるまです",
      correctMeaningEn: "It's the teacher's car.",
      distractorsEn: [
        "It's my car.",
        "It's the teacher's bicycle.",
        "Is it the teacher's car?",
      ],
    }),
    speaking(
      "ja-m4-4-2-speak-final",
      "これは わたしの かばんです",
      "This is my bag.",
    ),
    // ── Review tail ──
    speaking("ja-m4-4-2-rev-speak-1", M4_4_2_REVIEW[0].kana, M4_4_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-4-2-rev-lc-1",
      audioText: M4_4_2_REVIEW[1].kana,
      correctMeaningEn: M4_4_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_4_2_REVIEW[2].meaningEn,
        M4_4_2_REVIEW[3].meaningEn,
        M4_REVIEW_M2_POOL[1].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-4-2-rev-mcq-1", M4_4_2_REVIEW[2], M4_REVIEW_M1_POOL),
    speaking("ja-m4-4-2-rev-speak-2", M4_4_2_REVIEW[3].kana, M4_4_2_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-4-2-rev", M4_4_2_REVIEW),
    infoStep(
      "ja-m4-4-2-info-end",
      "You can now ask 'which one?' with the full pointer system",
      "どれ (which one) completes the set: これ/それ/あれ/どれ. Plus the rule that question words like どれ take が, not は.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_4_2.steps);
assertAnswerRotation(M4_4_2.steps, 2);
assertNoConsecutiveSame(M4_4_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-5-1 — Interleaved drill: の + pointers + は (part 1)
// ═══════════════════════════════════════════════════════════════════════

const M4_5_1_REVIEW = pickReviewAtoms("ja-m4-5-1-rev", M4_REVIEW_M2_POOL, 4);

export const M4_5_1: LessonContent = {
  id: "ja-m4-5-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill I — の + pointers + は",
  description:
    "Mixed practice: の (possession), pointers, は (topic). Rotating answers prevent fishing.",
  estimatedMinutes: 10,
  xpReward: 24,
  steps: [
    infoStep(
      "ja-m4-5-1-info-open",
      "Mix and match",
      "Each drill picks between particles. No new rules — just sorting which pattern fits. Watch the answer rotate.",
    ),
    cloze(
      "ja-m4-5-1-cloze-1",
      "わたし",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "It's my bag.",
      "わたしの かばんです。",
      "Owner + の + owned.",
    ),
    sentenceMcq({
      id: "ja-m4-5-1-mcq-bridge",
      prompt: "Which sentence means 'It's the teacher's car.'?",
      correctKana: "せんせいの くるまです。",
      distractorsKana: [
        "せんせいは くるまです。",
        "せんせいの くるまですか。",
        "せんせいは くるまですか。",
      ],
      explanation: "の glues せんせい + くるま (possession).",
    }),
    cloze(
      "ja-m4-5-1-cloze-2",
      "これ",
      " ともだちの ペンです。",
      "は",
      ["は", "の", "が", "を"],
      "This is my friend's pen.",
      "これは ともだちの ペンです。",
      "は marks the topic; の glues friend + pen.",
    ),
    listeningCompSentence({
      id: "ja-m4-5-1-lc-cat-book",
      audioText: "それは ねこの ほんです",
      correctMeaningEn: "That's the cat's book.",
      distractorsEn: [
        "This is the cat's book.",
        "That over there is the cat's book.",
        "Is that the cat's book?",
      ],
    }),
    cloze(
      "ja-m4-5-1-cloze-3",
      "それは ねこ",
      " ほんです。",
      "の",
      ["の", "は", "が", "を"],
      "That's the cat's book.",
      "それは ねこの ほんです。",
      "ねこ + の + ほん = cat's book.",
    ),
    build(
      "ja-m4-5-1-build-nihon-kuruma",
      "That is a Japanese bicycle.",
      "それは にほんの じてんしゃです",
      ["の", "それ", "です", "は", "にほん", "アメリカ", "じてんしゃ", "くるま"],
      ["それ", "は", "にほん", "の", "じてんしゃ", "です"],
    ),
    // Converted from review-は cloze: pointer + の question production.
    build(
      "ja-m4-5-1-build-isu-q",
      "Ask: Is that (over there) the teacher's chair?",
      "あれは せんせいの いすですか",
      ["これ", "せんせい", "の", "あれ", "は", "いす", "か", "です"],
      ["あれ", "は", "せんせい", "の", "いす", "です", "か"],
    ),
    speaking(
      "ja-m4-5-1-speak-sore",
      "それは せんせいの じしょです",
      "That is the teacher's dictionary.",
    ),
    listeningCompSentence({
      id: "ja-m4-5-1-lc-umbrella",
      audioText: "あなたの かさですか",
      correctMeaningEn: "Is it your umbrella?",
      distractorsEn: [
        "It's your umbrella.",
        "Is this your umbrella?",
        "Is it my umbrella?",
      ],
    }),
    cloze(
      "ja-m4-5-1-cloze-5",
      "あなた",
      " かさですか。",
      "の",
      ["の", "は", "を", "に"],
      "Is it your umbrella?",
      "あなたの かさですか。",
      "Direct possession + question.",
    ),
    build(
      "ja-m4-5-1-build-are-kamera",
      "That over there is my camera.",
      "あれは わたしの カメラです",
      ["カメラ", "これ", "わたし", "ともだち", "は", "あれ", "です", "の"],
      ["あれ", "は", "わたし", "の", "カメラ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m4-5-1-lb-sensei-kaban",
      target: "せんせいの かばんです",
      tiles: ["の", "ペン", "です", "わたし", "かばん", "せんせい"],
      correctOrder: ["せんせい", "の", "かばん", "です"],
      promptEn: "Hear it, build it: 'It's the teacher's bag.'",
    }),
    speaking(
      "ja-m4-5-1-speak-final",
      "あれは アメリカの くるまです",
      "That over there is an American car.",
    ),
    cloze(
      "ja-m4-5-1-cloze-6",
      "これは にほん",
      " くるまです。",
      "の",
      ["の", "は", "が", "を"],
      "This is a Japanese car.",
      "これは にほんの くるまです。",
      "'Kind-of' reading: Japan-kind-of car.",
    ),
    // ── Review tail ──
    speaking("ja-m4-5-1-rev-speak-1", M4_5_1_REVIEW[0].kana, M4_5_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-5-1-rev-lc-1",
      audioText: M4_5_1_REVIEW[1].kana,
      correctMeaningEn: M4_5_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_5_1_REVIEW[2].meaningEn,
        M4_5_1_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[3].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-5-1-rev-mcq-1", M4_5_1_REVIEW[2], M4_REVIEW_M2_POOL),
    speaking("ja-m4-5-1-rev-speak-2", M4_5_1_REVIEW[3].kana, M4_5_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-5-1-rev", M4_5_1_REVIEW),
    infoStep(
      "ja-m4-5-1-info-end",
      "You can now mix の, は, and pointers in one sentence",
      "Interleaved cloze drilling across possessive の, topic は, and pointer words — the correct particle rotates so you must read each sentence carefully.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_5_1.steps);
assertAnswerRotation(M4_5_1.steps, 2);
assertNoConsecutiveSame(M4_5_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-5-2 — Interleaved drill part 2: だれ + self-explanation
// ═══════════════════════════════════════════════════════════════════════

const M4_5_2_REVIEW = pickReviewAtoms("ja-m4-5-2-rev", M4_REVIEW_M3_POOL, 4);

export const M4_5_2: LessonContent = {
  id: "ja-m4-5-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Interleaved drill II — だれ + self-explanation",
  description:
    "New question word だれ (who). Self-explanation on の vs は. Production-heavy close.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m4-5-2-info-open",
      "A new question word",
      "だれ = 'who.' Pair with の and it becomes 'whose' (だれの ペン = whose pen). Like どれ, question words take が.",
    ),
    // ── だれ introduction via build ──
    build(
      "ja-m4-5-2-build-dare",
      "Pick the Japanese word for: Who",
      "だれ",
      ["なん", "どれ", "だれ", "これ"],
      ["だれ"],
    ),
    listeningCompSentence({
      id: "ja-m4-5-2-lc-dare-no",
      audioText: "だれの ペンですか",
      correctMeaningEn: "Whose pen is it?",
      distractorsEn: [
        "Which pen is it?",
        "Is it your pen?",
        "Whose car is it?",
      ],
    }),
    cloze(
      "ja-m4-5-2-cloze-ga",
      "だれ",
      " せんせいですか。",
      "が",
      ["が", "は", "の", "を"],
      "Who is the teacher?",
      "だれが せんせいですか。",
      "だれ is a question word — takes が.",
    ),
    cloze(
      "ja-m4-5-2-cloze-no-1",
      "これは だれ",
      " かばんですか。",
      "の",
      ["の", "は", "が", "を"],
      "Whose bag is this?",
      "これは だれの かばんですか。",
      "だれ + の = whose.",
    ),
    sentenceMcq({
      id: "ja-m4-5-2-mcq-dare",
      prompt: "Which sentence asks 'Who is the student?'?",
      correctKana: "だれが がくせいですか。",
      distractorsKana: [
        "だれの がくせいですか。",
        "だれは がくせいですか。",
        "どれが がくせいですか。",
      ],
      explanation: "だれ = who (question word → が). だれの = whose. どれ = which one.",
    }),
    build(
      "ja-m4-5-2-build-dare-pen",
      "Ask: Whose pen is this?",
      "これは だれの ペンですか",
      ["です", "は", "だれ", "どれ", "か", "が", "これ", "ペン", "の"],
      ["これ", "は", "だれ", "の", "ペン", "です", "か"],
    ),
    speaking(
      "ja-m4-5-2-speak-dare",
      "だれの ペンですか",
      "Whose pen is it?",
    ),
    // Self-explanation
    selfExplain({
      id: "ja-m4-5-2-self-no-vs-ha",
      anchorLabel: "You picked の in: わたし＿ かばんです。",
      anchorAudioText: "わたしの かばんです",
      question: "Why is の correct here and not は?",
      rule: {
        text: "の links owner (わたし) to thing owned (かばん) — possession.",
      },
      surface: { text: "の always comes after a pronoun like わたし." },
      distractor: { text: "は could also work and mean the same thing." },
      ruleExplanation:
        "の glues two nouns into a possessive (my bag). は would mark わたし as the TOPIC — grammatical but different meaning.",
    }),
    // Converted from review-は cloze: "kind-of" の production instead.
    build(
      "ja-m4-5-2-build-america-keitai",
      "Say: This is an American mobile phone.",
      "これは アメリカの けいたいです",
      ["アメリカ", "けいたい", "これ", "は", "カメラ", "です", "の", "にほん"],
      ["これ", "は", "アメリカ", "の", "けいたい", "です"],
    ),
    listeningCompSentence({
      id: "ja-m4-5-2-lc-friend-dict",
      audioText: "ともだちの じしょです",
      correctMeaningEn: "It's my friend's dictionary.",
      distractorsEn: [
        "It's the teacher's dictionary.",
        "It's my dictionary.",
        "Is it my friend's dictionary?",
      ],
    }),
    build(
      "ja-m4-5-2-build-nihon-kamera",
      "This is a Japanese camera.",
      "これは にほんの カメラです",
      ["の", "は", "カメラ", "アメリカ", "これ", "くるま", "にほん", "です"],
      ["これ", "は", "にほん", "の", "カメラ", "です"],
    ),
    cloze(
      "ja-m4-5-2-cloze-no-2",
      "あれは アメリカ",
      " じてんしゃです。",
      "の",
      ["の", "は", "が", "を"],
      "That over there is an American bicycle.",
      "あれは アメリカの じてんしゃです。",
      "'Kind-of' reading: アメリカ-kind-of bicycle.",
    ),
    speaking(
      "ja-m4-5-2-speak-final",
      "これは だれの カメラですか",
      "Whose camera is this?",
    ),
    // ── Review tail ──
    speaking("ja-m4-5-2-rev-speak-1", M4_5_2_REVIEW[0].kana, M4_5_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-5-2-rev-lc-1",
      audioText: M4_5_2_REVIEW[1].kana,
      correctMeaningEn: M4_5_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_5_2_REVIEW[2].meaningEn,
        M4_5_2_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-5-2-rev-mcq-1", M4_5_2_REVIEW[2], M4_REVIEW_M3_POOL),
    speaking("ja-m4-5-2-rev-speak-2", M4_5_2_REVIEW[3].kana, M4_5_2_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-5-2-rev", M4_5_2_REVIEW),
    infoStep(
      "ja-m4-5-2-info-end",
      "You can now ask 'who' and 'whose'",
      "だれ (who) takes が, だれの (whose) uses の. Plus self-explanation on why の and は serve different roles.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_5_2.steps);
assertAnswerRotation(M4_5_2.steps, 2);
assertNoConsecutiveSame(M4_5_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-STORY — Story comprehension: Whose is this?
// ═══════════════════════════════════════════════════════════════════════

export const M4_STORY: LessonContent = {
  id: "ja-m4-story",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Story — Whose is this?",
  description:
    "Listen to two classmates figure out whose things are whose. Answer questions and practice key patterns.",
  estimatedMinutes: 5,
  xpReward: 15,
  steps: [
    infoStep(
      "ja-m4-story-info-open",
      "Story time — Whose is this?",
      "ゆき and たけし are at school. Things are scattered across the desks. Listen as they figure out whose is whose.",
    ),
    dialogueListen({
      id: "ja-m4-story-scene-1",
      lines: [
        { speaker: "ゆき", kana: "すみません。これは だれの ペンですか。" },
        { speaker: "たけし", kana: "それは わたしの ペンです。" },
        { speaker: "ゆき", kana: "あれは だれの かばんですか。" },
        { speaker: "たけし", kana: "あれは せんせいの かばんです。" },
      ],
      questions: [
        {
          id: "s1-q1",
          prompt: "Whose pen is near ゆき?",
          correctText: "たけし's",
          distractors: ["ゆき's", "The teacher's", "A friend's"],
          explanation: "たけし answers それは わたしの ペンです = 'That is my pen.'",
        },
        {
          id: "s1-q2",
          prompt: "Whose bag is far away?",
          correctText: "The teacher's",
          distractors: ["たけし's", "ゆき's", "A friend's"],
          explanation: "あれは せんせいの かばんです = 'That (over there) is the teacher's bag.'",
        },
      ],
    }),
    build(
      "ja-m4-story-build-no",
      "Say: That is my pen.",
      "それは わたしの ペンです",
      ["は", "ペン", "です", "わたし", "だれ", "それ", "の"],
      ["それ", "は", "わたし", "の", "ペン", "です"],
    ),
    sentenceMcq({
      id: "ja-m4-story-mcq-dare",
      prompt: "Which sentence asks 'Whose bag is that?'",
      correctKana: "あれは だれの かばんですか。",
      distractorsKana: [
        "あれは わたしの かばんですか。",
        "これは だれの かばんですか。",
        "あれは せんせいの かばんです。",
      ],
      explanation: "だれの = whose. あれ = that (over there). か makes it a question.",
    }),
    dialogueListen({
      id: "ja-m4-story-scene-2",
      lines: [
        { speaker: "たけし", kana: "ゆきの けいたいは どれですか。" },
        { speaker: "ゆき", kana: "わたしの けいたいは それです。" },
        { speaker: "たけし", kana: "これは ゆきの かさですか。" },
        { speaker: "ゆき", kana: "はい、それは わたしの かさです。" },
      ],
      questions: [
        {
          id: "s2-q1",
          prompt: "What does たけし ask about?",
          correctText: "Which one is ゆき's phone",
          distractors: ["Whose phone is this", "Is this ゆき's umbrella", "Where is the phone"],
          explanation: "どれ = which one. ゆきの けいたいは どれですか = 'Which one is Yuki's phone?'",
        },
        {
          id: "s2-q2",
          prompt: "Is the umbrella ゆき's?",
          correctText: "Yes",
          distractors: ["No, it's たけし's", "No, it's the teacher's", "It isn't said"],
          explanation: "ゆき confirms はい、それは わたしの かさです = 'Yes, that is my umbrella.'",
        },
      ],
    }),
    cloze(
      "ja-m4-story-cloze-no",
      "わたし",
      " ペンです。 (It's my pen.)",
      "の",
      ["の", "は", "も", "か"],
      "My pen.",
      "わたしの ペンです。",
      "の connects owner + thing: わたし + の + ペン = my pen.",
    ),
    listeningBuildSentence({
      id: "ja-m4-story-lb-dore",
      target: "かばんは どれですか",
      tiles: ["か", "どれ", "かばん", "だれ", "の", "は", "です"],
      correctOrder: ["かばん", "は", "どれ", "です", "か"],
      promptEn: "Hear it, build it: 'Which one is your bag?'",
    }),
    listeningCompSentence({
      id: "ja-m4-story-lc-kasa",
      audioText: "これは ゆきの かさですか",
      correctMeaningEn: "Is this Yuki's umbrella?",
      distractorsEn: [
        "This is Yuki's umbrella.",
        "Whose umbrella is this?",
        "Is that Yuki's bag?",
      ],
    }),
    speaking(
      "ja-m4-story-speak-dare",
      "あれは だれの かばんですか",
      "Whose bag is that over there?",
    ),
    sentenceMcq({
      id: "ja-m4-story-mcq-summary",
      prompt: "In the story, which pointer word means 'which one?'",
      correctKana: "どれ",
      distractorsKana: ["これ", "それ", "あれ"],
      explanation: "どれ = which one (question). これ = this, それ = that (near you), あれ = that (far).",
    }),
    speaking(
      "ja-m4-story-speak-no",
      "それは わたしの ペンです",
      "That is my pen.",
    ),
    infoStep(
      "ja-m4-story-info-end",
      "You can now follow a conversation about whose things are whose",
      "You used の for possession, だれ for 'whose,' and これ/それ/あれ/どれ to point at things — all in a real back-and-forth dialogue.",
      "win",
    ),
  ],
};

assertNoConsecutiveSame(M4_STORY.steps);
assertPassiveCardsHaveFollowup(M4_STORY.steps);
assertNoExplanationOnPassive(M4_STORY.steps);
assertExplanationDoesntLeakAnswer(M4_STORY.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-6-1 — Sentence Build: production (part 1)
// ═══════════════════════════════════════════════════════════════════════

const M4_6_1_REVIEW = pickReviewAtoms("ja-m4-6-1-rev", M4_REVIEW_M3_POOL, 4);

export const M4_6_1: LessonContent = {
  id: "ja-m4-6-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build I — pointers + possessives",
  description:
    "Production-heavy: build, speak, and listen-build sentences combining pointers with の.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m4-6-1-info-open",
      "Production time",
      "Sentences across build, listen-build, and speaking. Each one combines M4 pointers and possessives.",
    ),
    // Converted from review-は cloze: warm up with a full production build.
    build(
      "ja-m4-6-1-warmup-build",
      "Say: This is my friend's camera.",
      "これは ともだちの カメラです",
      ["ともだち", "の", "です", "カメラ", "それ", "は", "わたし", "これ"],
      ["これ", "は", "ともだち", "の", "カメラ", "です"],
    ),
    build(
      "ja-m4-6-1-build-s1",
      "Say: This is my umbrella.",
      "これは わたしの かさです",
      ["ともだち", "それ", "です", "は", "の", "わたし", "かさ", "これ"],
      ["これ", "は", "わたし", "の", "かさ", "です"],
    ),
    speaking(
      "ja-m4-6-1-speak-s1",
      "これは わたしの かさです",
      "This is my umbrella.",
    ),
    build(
      "ja-m4-6-1-build-s2",
      "Is that your bag?",
      "それは あなたの かばんですか",
      ["です", "の", "かばん", "それ", "は", "わたし", "あなた", "これ", "か"],
      ["それ", "は", "あなた", "の", "かばん", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m4-6-1-lc-friend-bike",
      audioText: "ともだちの じてんしゃです",
      correctMeaningEn: "It's my friend's bicycle.",
      distractorsEn: [
        "It's my bicycle.",
        "It's the teacher's bicycle.",
        "Is it my friend's bicycle?",
      ],
    }),
    build(
      "ja-m4-6-1-build-s3",
      "That over there is the teacher's car.",
      "あれは せんせいの くるまです",
      ["の", "せんせい", "くるま", "これ", "です", "ともだち", "は", "あれ"],
      ["あれ", "は", "せんせい", "の", "くるま", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m4-6-1-lb-s4",
      target: "にほんの カメラです",
      tiles: ["ペン", "です", "の", "にほん", "カメラ", "わたし"],
      correctOrder: ["にほん", "の", "カメラ", "です"],
      promptEn: "Hear it, build it: 'It's a Japanese camera.'",
    }),
    speaking(
      "ja-m4-6-1-speak-s4",
      "にほんの けいたいです",
      "It's a Japanese mobile phone.",
    ),
    build(
      "ja-m4-6-1-build-s5",
      "Ask: Which is your dictionary?",
      "どれが あなたの じしょですか",
      ["あなた", "どれ", "わたし", "は", "か", "が", "です", "の", "じしょ"],
      ["どれ", "が", "あなた", "の", "じしょ", "です", "か"],
    ),
    cloze(
      "ja-m4-6-1-cloze-dare",
      "これは だれ",
      " ペンですか。",
      "の",
      ["の", "は", "が", "を"],
      "Whose pen is this?",
      "これは だれの ペンですか。",
      "だれの = whose.",
    ),
    sentenceMcq({
      id: "ja-m4-6-1-mcq-recall",
      prompt: "Which sentence asks 'Whose pen is this?'",
      correctKana: "これは だれの ペンですか。",
      distractorsKana: [
        "これは どれの ペンですか。",
        "これは なんの ペンですか。",
        "これは だれは ペンですか。",
      ],
      explanation: "だれ = who; だれの = whose.",
    }),
    speaking(
      "ja-m4-6-1-speak-dare",
      "これは だれの じしょですか",
      "Whose dictionary is this?",
    ),
    build(
      "ja-m4-6-1-build-s6",
      "That over there is the teacher's bag.",
      "あれは せんせいの かばんです",
      ["それ", "です", "の", "せんせい", "ともだち", "あれ", "かばん", "は"],
      ["あれ", "は", "せんせい", "の", "かばん", "です"],
    ),
    listeningCompSentence({
      id: "ja-m4-6-1-lc-tomodachi-kasa",
      audioText: "ともだちの かさです",
      correctMeaningEn: "It's my friend's umbrella.",
      distractorsEn: [
        "It's my umbrella.",
        "It's the teacher's umbrella.",
        "Is it my friend's umbrella?",
      ],
    }),
    // ── Review tail ──
    speaking("ja-m4-6-1-rev-speak-1", M4_6_1_REVIEW[0].kana, M4_6_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-6-1-rev-lc-1",
      audioText: M4_6_1_REVIEW[1].kana,
      correctMeaningEn: M4_6_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_6_1_REVIEW[2].meaningEn,
        M4_6_1_REVIEW[3].meaningEn,
        M4_REVIEW_M1_POOL[5].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-6-1-rev-mcq-1", M4_6_1_REVIEW[2], M4_REVIEW_M3_POOL),
    speaking("ja-m4-6-1-rev-speak-2", M4_6_1_REVIEW[3].kana, M4_6_1_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-6-1-rev", M4_6_1_REVIEW),
    infoStep(
      "ja-m4-6-1-info-end",
      "You can now produce pointer + possessive sentences from scratch",
      "Build, speak, and listen-build across all M4 patterns: pointers (これ/それ/あれ), possession (の), and question words (だれ/どれ).",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_6_1.steps);
assertAnswerRotation(M4_6_1.steps, 2);
assertNoConsecutiveSame(M4_6_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-6-2 — Sentence Build: more production + cumulative
// ═══════════════════════════════════════════════════════════════════════

const M4_6_2_REVIEW = pickReviewAtoms("ja-m4-6-2-rev", M4_REVIEW_M2_POOL, 4);

export const M4_6_2: LessonContent = {
  id: "ja-m4-6-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Sentence Build II — cumulative production",
  description:
    "More production across all M4 grammar. Harder combinations + cumulative review.",
  estimatedMinutes: 10,
  xpReward: 28,
  steps: [
    infoStep(
      "ja-m4-6-2-info-open",
      "Harder combinations",
      "Longer sentences, multiple particles, question forms. All the M4 grammar in production mode.",
    ),
    build(
      "ja-m4-6-2-build-s1",
      "That is my older brother's mobile phone.",
      "それは あにの けいたいです",
      ["あに", "です", "あれ", "それ", "けいたい", "は", "ともだち", "の"],
      ["それ", "は", "あに", "の", "けいたい", "です"],
    ),
    cloze(
      "ja-m4-6-2-cloze-ha",
      "それ",
      " だれの くるまですか。",
      "は",
      ["は", "の", "が", "を"],
      "That (near you) — whose car is it?",
      "それは だれの くるまですか。",
      "は marks the topic (that near you).",
    ),
    speaking(
      "ja-m4-6-2-speak-s1",
      "あれは せんせいの ぼうしです",
      "That over there is the teacher's hat.",
    ),
    build(
      "ja-m4-6-2-build-s2",
      "Ask: Whose bicycle is that?",
      "それは だれの じてんしゃですか",
      ["どれ", "は", "これ", "か", "じてんしゃ", "の", "だれ", "それ", "です"],
      ["それ", "は", "だれ", "の", "じてんしゃ", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m4-6-2-lc-america-pen",
      audioText: "アメリカの ペンです",
      correctMeaningEn: "It's an American pen.",
      distractorsEn: [
        "It's a Japanese pen.",
        "It's my pen.",
        "Is it an American pen?",
      ],
    }),
    build(
      "ja-m4-6-2-build-s3",
      "This is an American camera.",
      "これは アメリカの カメラです",
      ["にほん", "の", "です", "カメラ", "これ", "ペン", "アメリカ", "は"],
      ["これ", "は", "アメリカ", "の", "カメラ", "です"],
    ),
    listeningBuildSentence({
      id: "ja-m4-6-2-lb-dare-kasa",
      target: "これは だれの かさですか",
      tiles: ["だれ", "の", "は", "か", "これ", "かさ", "です", "どれ"],
      correctOrder: ["これ", "は", "だれ", "の", "かさ", "です", "か"],
      promptEn: "Hear it, build it: 'Whose umbrella is this?'",
    }),
    cloze(
      "ja-m4-6-2-cloze-no",
      "あれは ともだち",
      " てがみです。",
      "の",
      ["の", "は", "が", "を"],
      "That over there is my friend's letter.",
      "あれは ともだちの てがみです。",
      "ともだち + の + てがみ = friend's letter.",
    ),
    speaking(
      "ja-m4-6-2-speak-s3",
      "これは アメリカの カメラです",
      "This is an American camera.",
    ),
    sentenceMcq({
      id: "ja-m4-6-2-mcq-cumulative",
      prompt: "Which sentence asks 'Whose umbrella is that over there?'",
      correctKana: "あれは だれの かさですか。",
      distractorsKana: [
        "これは だれの かさですか。",
        "あれは だれの かさです。",
        "あれは どれの かさですか。",
      ],
      explanation: "あれ = over there; だれの = whose; か = question.",
    }),
    build(
      "ja-m4-6-2-build-s4",
      "Is that your friend's mobile phone?",
      "それは ともだちの けいたいですか",
      ["は", "です", "けいたい", "ともだち", "わたし", "あれ", "それ", "か", "の"],
      ["それ", "は", "ともだち", "の", "けいたい", "です", "か"],
    ),
    speaking(
      "ja-m4-6-2-speak-final",
      "それは だれの じてんしゃですか",
      "Whose bicycle is that?",
    ),
    // ── Review tail ──
    listeningCompSentence({
      id: "ja-m4-6-2-rev-lc-1",
      audioText: M4_6_2_REVIEW[0].kana,
      correctMeaningEn: M4_6_2_REVIEW[0].meaningEn,
      distractorsEn: [
        M4_6_2_REVIEW[1].meaningEn,
        M4_6_2_REVIEW[2].meaningEn,
        M4_6_2_REVIEW[3].meaningEn,
      ],
    }),
    speaking("ja-m4-6-2-rev-speak-1", M4_6_2_REVIEW[1].kana, M4_6_2_REVIEW[1].meaningEn),
    vocabMcq("ja-m4-6-2-rev-mcq-1", M4_6_2_REVIEW[2], M4_REVIEW_M2_POOL),
    speaking("ja-m4-6-2-rev-speak-2", M4_6_2_REVIEW[3].kana, M4_6_2_REVIEW[3].meaningEn),
    reviewMatchPairs("ja-m4-6-2-rev", M4_6_2_REVIEW),
    infoStep(
      "ja-m4-6-2-info-end",
      "You can now describe, ask about, or identify any object",
      "Cumulative production across build, speak, listen-build, and cloze — combining pointers, の, は, だれ, and か in longer sentences.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_6_2.steps);
assertAnswerRotation(M4_6_2.steps, 2);
assertNoConsecutiveSame(M4_6_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-7-1 — Mini-dialogue: warm-up + dialogue listen
// ═══════════════════════════════════════════════════════════════════════

const M4_7_1_REVIEW = pickReviewAtoms("ja-m4-7-1-rev", M4_REVIEW_POOL, 5);

export const M4_7_1: LessonContent = {
  id: "ja-m4-7-1",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue I — at a friend's apartment",
  description:
    "A short visit to a friend's place. Warm-up on key patterns, then a dialogue with comprehension questions.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m4-7-1-info-open",
      "Drop into the scene",
      "You're at a friend's apartment. Objects on the table, a photo on the wall — whose things are whose? Every word and grammar piece is something you know from M3 + M4.",
      "culture",
    ),
    // Warm-up taps
    listeningCompSentence({
      id: "ja-m4-7-1-lc-warmup-dare",
      audioText: "だれの ペンですか",
      correctMeaningEn: "Whose pen is it?",
      distractorsEn: [
        "Which pen is it?",
        "What kind of pen is it?",
        "Is it your pen?",
      ],
    }),
    vocabMcq(
      "ja-m4-7-1-warmup-mcq-kaban",
      { kana: "かばん", meaningEn: "bag", emoji: "👜", fromModule: "m4" },
      M4_REVIEW_M3_POOL,
    ),
    cloze(
      "ja-m4-7-1-warmup-cloze",
      "これは だれ",
      " カメラですか。",
      "の",
      ["の", "は", "が", "を"],
      "Whose camera is this?",
      "これは だれの カメラですか。",
      "だれの = whose.",
    ),
    build(
      "ja-m4-7-1-build-warmup",
      "Is that (near you) your umbrella?",
      "それは あなたの かさですか",
      ["か", "せんせい", "あれ", "かさ", "の", "は", "です", "あなた", "それ"],
      ["それ", "は", "あなた", "の", "かさ", "です", "か"],
    ),
    // ── Dialogue listen ──
    dialogueListen({
      id: "ja-m4-7-1-dialogue",
      lines: [
        {
          speaker: "Friend",
          kana: "それは あなたの かばんですか。",
          audioText: "それは あなたの かばんですか",
        },
        {
          speaker: "You",
          kana: "それは ともだちの かばんです。",
          audioText: "それは ともだちの かばんです",
        },
        {
          speaker: "Friend",
          kana: "あれは あにの カメラです。",
          audioText: "あれは あにの カメラです",
        },
        {
          speaker: "You",
          kana: "あれは にほんの カメラですか。",
          audioText: "あれは にほんの カメラですか",
        },
      ],
      questions: [
        {
          id: "ja-m4-7-1-q1",
          prompt: "Whose bag is near the listener?",
          correctText: "Their friend's bag",
          distractors: [
            "The speaker's own bag",
            "Their host friend's bag",
            "The teacher's bag",
          ],
          explanation:
            "The speaker answers 'ともだちの かばんです' — friend's bag.",
        },
        {
          id: "ja-m4-7-1-q2",
          prompt: "Whose camera is on display?",
          correctText: "The friend's older brother's camera",
          distractors: [
            "The friend's own camera",
            "The speaker's camera",
            "The teacher's camera",
          ],
          explanation:
            "あにの カメラ = older brother's camera.",
        },
        {
          id: "ja-m4-7-1-q3",
          prompt: "What does the speaker ask at the end?",
          correctText: "Whether the far-away camera is Japanese",
          distractors: [
            "Whether the bag is Japanese",
            "Whose bag it is",
            "Whether the friend has a camera",
          ],
          explanation:
            "にほんの カメラですか = 'is that a Japanese camera?' — 'kind-of' reading of の.",
        },
      ],
    }),
    // Post-dialogue production — fresh sentences, same grammar as the dialogue.
    build(
      "ja-m4-7-1-build-post",
      "Say: That's the teacher's bicycle.",
      "それは せんせいの じてんしゃです",
      ["じてんしゃ", "それ", "の", "です", "せんせい", "は", "わたし", "かばん"],
      ["それ", "は", "せんせい", "の", "じてんしゃ", "です"],
    ),
    speaking(
      "ja-m4-7-1-speak-post",
      "それは アメリカの けいたいですか",
      "Is that an American mobile phone?",
    ),
    sentenceMcq({
      id: "ja-m4-7-1-mcq-recap",
      prompt: "Which sentence says 'That's my friend's camera.'?",
      correctKana: "それは ともだちの カメラです。",
      distractorsKana: [
        "これは ともだちの カメラです。",
        "それは ともだちは カメラです。",
        "それは ともだちの カメラですか。",
      ],
      explanation:
        "それ = near you; の glues friend + camera.",
    }),
    // Converted from review-か cloze: replay the dialogue line as a
    // listening production beat instead.
    listeningBuildSentence({
      id: "ja-m4-7-1-lb-nihon-kamera-q",
      target: "あれは にほんの カメラですか",
      tiles: ["にほん", "カメラ", "アメリカ", "あれ", "です", "の", "は", "か"],
      correctOrder: ["あれ", "は", "にほん", "の", "カメラ", "です", "か"],
      promptEn: "Hear it, build it: 'Is that a Japanese camera?'",
    }),
    listeningBuildSentence({
      id: "ja-m4-7-1-lb-post",
      target: "あれは あにの くるまです",
      tiles: ["くるま", "あれ", "の", "あに", "です", "は", "ともだち", "カメラ"],
      correctOrder: ["あれ", "は", "あに", "の", "くるま", "です"],
      promptEn: "Hear it, build it: 'That over there is big brother's car.'",
    }),
    cloze(
      "ja-m4-7-1-cloze-no",
      "これは ともだち",
      " かばんです。",
      "の",
      ["の", "は", "が", "を"],
      "This is my friend's bag.",
      "これは ともだちの かばんです。",
      "ともだち + の + かばん = friend's bag.",
    ),
    build(
      "ja-m4-7-1-build-final",
      "Ask: Whose camera is that over there?",
      "あれは だれの カメラですか",
      ["です", "だれ", "の", "これ", "ともだち", "は", "か", "カメラ", "あれ"],
      ["あれ", "は", "だれ", "の", "カメラ", "です", "か"],
    ),
    listeningCompSentence({
      id: "ja-m4-7-1-lc-cumulative",
      audioText: "にほんの カメラです",
      correctMeaningEn: "It's a Japanese camera.",
      distractorsEn: [
        "It's my camera.",
        "It's a Japanese car.",
        "Is it a Japanese camera?",
      ],
    }),
    speaking(
      "ja-m4-7-1-speak-final",
      "これは ともだちの かばんです",
      "This is my friend's bag.",
    ),
    // ── Review tail ──
    speaking("ja-m4-7-1-rev-speak-1", M4_7_1_REVIEW[0].kana, M4_7_1_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-7-1-rev-lc-1",
      audioText: M4_7_1_REVIEW[1].kana,
      correctMeaningEn: M4_7_1_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_7_1_REVIEW[2].meaningEn,
        M4_7_1_REVIEW[3].meaningEn,
        M4_7_1_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq("ja-m4-7-1-rev-mcq-1", M4_7_1_REVIEW.filter((a) => Boolean(a.emoji))[0]!, M4_REVIEW_POOL),
    speaking("ja-m4-7-1-rev-speak-2", M4_7_1_REVIEW[2].kana, M4_7_1_REVIEW[2].meaningEn),
    reviewMatchPairs("ja-m4-7-1-rev", M4_7_1_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m4-7-1-info-end",
      "You can now chat about objects at a friend's place",
      "A dialogue scene at a friend's apartment: whose bag, whose camera, is it Japanese? Pointers + の + か in real conversation.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_7_1.steps);
assertAnswerRotation(M4_7_1.steps, 2);
assertNoConsecutiveSame(M4_7_1.steps);

// ═══════════════════════════════════════════════════════════════════════
// M4-7-2 — Cumulative grammar + full review
// ═══════════════════════════════════════════════════════════════════════

const M4_7_2_REVIEW = pickReviewAtoms("ja-m4-7-2-rev", M4_REVIEW_POOL, 5);

export const M4_7_2: LessonContent = {
  id: "ja-m4-7-2",
  moduleId: "m4",
  courseId: COURSE,
  languageId: LANG,
  title: "Mini-dialogue II — cumulative wrap-up",
  description:
    "Cumulative grammar check across M4 patterns. Final production + broad review tail across M1 + M2 + M3.",
  estimatedMinutes: 10,
  xpReward: 26,
  steps: [
    infoStep(
      "ja-m4-7-2-info-open",
      "Cumulative wrap-up",
      "All the M4 patterns in mixed drills + production. Then the broadest review tail (M1 + M2 + M3).",
    ),
    // ── Cumulative clozes ──
    cloze(
      "ja-m4-7-2-cloze-1",
      "あなた",
      " なまえは なんですか。",
      "の",
      ["の", "は", "が", "を"],
      "What is your name?",
      "あなたの なまえは なんですか。",
      "の links あなた + なまえ ('your name').",
    ),
    sentenceMcq({
      id: "ja-m4-7-2-mcq-recap",
      prompt: "Which sentence says 'This is my older brother's camera.'?",
      correctKana: "これは あにの カメラです。",
      distractorsKana: [
        "あれは あにの カメラです。",
        "これは あには カメラです。",
        "これは あにの カメラですか。",
      ],
      explanation: "これ = near me; の glues older brother + camera. あには would make him the topic instead.",
    }),
    cloze(
      "ja-m4-7-2-cloze-2",
      "あれは せんせい",
      " くるまですか。",
      "の",
      ["の", "は", "が", "を"],
      "Is that over there the teacher's car?",
      "あれは せんせいの くるまですか。",
    ),
    listeningCompSentence({
      id: "ja-m4-7-2-lc-nihon-kamera",
      audioText: "アメリカの くるまです",
      correctMeaningEn: "It's an American car.",
      distractorsEn: [
        "It's my car.",
        "It's an American camera.",
        "Is it an American car?",
      ],
    }),
    // Converted from review-か cloze: question production over の.
    build(
      "ja-m4-7-2-build-keitai-q",
      "Ask: Is that (near you) your mobile phone?",
      "それは あなたの けいたいですか",
      ["です", "か", "それ", "あなた", "けいたい", "わたし", "の", "は"],
      ["それ", "は", "あなた", "の", "けいたい", "です", "か"],
    ),
    // Production
    build(
      "ja-m4-7-2-build-1",
      "This is my friend's pen.",
      "これは ともだちの ペンです",
      ["です", "の", "これ", "わたし", "ともだち", "ペン", "それ", "は"],
      ["これ", "は", "ともだち", "の", "ペン", "です"],
    ),
    speaking(
      "ja-m4-7-2-speak-1",
      "それは ともだちの ペンです",
      "That's my friend's pen.",
    ),
    build(
      "ja-m4-7-2-build-2",
      "Say: That over there is my older brother's bicycle.",
      "あれは あにの じてんしゃです",
      ["これ", "は", "わたし", "あに", "です", "じてんしゃ", "あれ", "の"],
      ["あれ", "は", "あに", "の", "じてんしゃ", "です"],
    ),
    cloze(
      "ja-m4-7-2-cloze-final",
      "あれは ともだちの ペンです",
      "。",
      "か",
      ["か", "は", "の", "を"],
      "Is that over there your friend's pen?",
      "あれは ともだちの ペンですか。",
      "Full M3+M4 composite: pointer + topic + possessive + question.",
    ),
    listeningBuildSentence({
      id: "ja-m4-7-2-lb-final",
      target: "これは わたしの くるまです",
      tiles: ["の", "です", "これ", "わたし", "ともだち", "くるま", "は", "それ"],
      correctOrder: ["これ", "は", "わたし", "の", "くるま", "です"],
      promptEn: "Hear it, build it: 'This is my car.'",
    }),
    speaking(
      "ja-m4-7-2-speak-final",
      "これは ともだちの ペンです",
      "This is my friend's pen.",
    ),
    // ── Broad review tail (M1 + M2 + M3) ──
    speaking("ja-m4-7-2-rev-speak-1", M4_7_2_REVIEW[0].kana, M4_7_2_REVIEW[0].meaningEn),
    listeningCompSentence({
      id: "ja-m4-7-2-rev-lc-1",
      audioText: M4_7_2_REVIEW[1].kana,
      correctMeaningEn: M4_7_2_REVIEW[1].meaningEn,
      distractorsEn: [
        M4_7_2_REVIEW[2].meaningEn,
        M4_7_2_REVIEW[3].meaningEn,
        M4_7_2_REVIEW[4].meaningEn,
      ],
    }),
    vocabMcq(
      "ja-m4-7-2-rev-mcq-2",
      M4_7_2_REVIEW.filter((a) => Boolean(a.emoji))[1]!,
      M4_REVIEW_POOL,
    ),
    speaking("ja-m4-7-2-rev-speak-2", M4_7_2_REVIEW[2].kana, M4_7_2_REVIEW[2].meaningEn),
    listeningCompSentence({
      id: "ja-m4-7-2-rev-lc-deep",
      audioText: M4_REVIEW_M1_POOL[6].kana,
      correctMeaningEn: M4_REVIEW_M1_POOL[6].meaningEn,
      distractorsEn: [
        M4_REVIEW_M1_POOL[7].meaningEn,
        M4_REVIEW_M1_POOL[8].meaningEn,
        M4_REVIEW_M1_POOL[9].meaningEn,
      ],
    }),
    reviewMatchPairs("ja-m4-7-2-rev", M4_7_2_REVIEW.slice(0, 5)),
    infoStep(
      "ja-m4-7-2-info-end",
      "You can now identify and possess objects across four spatial distances",
      "All M4 grammar mastered: の (possession + 'kind of'), これ/それ/あれ/どれ (pointers), だれ (who), and だれの (whose) — in cumulative production.",
      "win",
    ),
  ],
};

assertNoSameAnswerCluster(M4_7_2.steps);
assertAnswerRotation(M4_7_2.steps, 2);
assertNoConsecutiveSame(M4_7_2.steps);

// ═══════════════════════════════════════════════════════════════════════
// Module-level assertions
// ═══════════════════════════════════════════════════════════════════════

assertNoSameAnswerCluster([
  ...M4_1_1.steps,
  ...M4_1_2.steps,
  ...M4_2_1.steps,
  ...M4_2_2.steps,
  ...M4_3_1.steps,
  ...M4_3_2.steps,
  ...M4_4_1.steps,
  ...M4_4_2.steps,
  ...M4_5_1.steps,
  ...M4_5_2.steps,
  ...M4_6_1.steps,
  ...M4_6_2.steps,
  ...M4_7_1.steps,
  ...M4_7_2.steps,
]);

// Passive-card lint
for (const lesson of [
  M4_1_1, M4_1_2, M4_2_1, M4_2_2, M4_3_1, M4_3_2,
  M4_4_1, M4_4_2, M4_5_1, M4_5_2, M4_STORY, M4_6_1, M4_6_2,
  M4_7_1, M4_7_2,
]) {
  assertPassiveCardsHaveFollowup(lesson.steps);
  assertNoExplanationOnPassive(lesson.steps);
  assertExplanationDoesntLeakAnswer(lesson.steps);
}
