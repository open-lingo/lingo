import type {
  LessonContent,
  RowTestItem,
  RowTestStep,
  MultipleChoiceStep,
  BuildSentenceStep,
  MatchPairsStep,
} from "../types";

/**
 * M3-10 — Row Test (mastery ★).
 *
 * Cumulative test across M3-1 → M3-9. Uses the same TestRunner machinery
 * the M1/M2 row tests use:
 *   - review-tail mechanics (#84): wrong answers re-queue, no fail
 *   - passThreshold 0.70, maxRetries 3
 *
 * Item mix (~15 items):
 *   - 5 MC particle-choice items (は/が/の/に/で)
 *   - 1 match_pairs over 6 vocab → meaning
 *   - 1 build_sentence (cumulative)
 *
 * Particle items here use `multiple_choice` (not the new `particle_cloze`
 * type) so the existing TestRunner adapters render them. The cloze
 * metaphor is in the standalone lessons; the test re-tests the underlying
 * knowledge through the runner-native MC kind.
 */

function particleMc(
  id: string,
  prompt: string,
  audioText: string,
  correct: string,
  distractors: [string, string, string],
  explanation: string,
): MultipleChoiceStep {
  const options = [
    { id: "correct", text: correct },
    { id: "opt-1", text: distractors[0] },
    { id: "opt-2", text: distractors[1] },
    { id: "opt-3", text: distractors[2] },
  ];
  return {
    id,
    type: "multiple_choice",
    prompt,
    promptAudioText: audioText,
    options,
    correctOptionId: "correct",
    explanation,
    optionsHideRomaji: true,
  };
}

const ITEMS: RowTestItem[] = [
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-10-mc-1",
      "わたし___ がくせいです。 (I am a student.)",
      "わたしは がくせいです",
      "は",
      ["が", "の", "を"],
      "Self-introduction — 'as for me, student.' は marks the topic.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-10-mc-2",
      "だれ___ せんせいですか。 (Who is the teacher?)",
      "だれが せんせいですか",
      "が",
      ["は", "に", "の"],
      "Question words (だれ/なに/どこ/いつ) always take が — they ARE the new information.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-10-mc-3",
      "わたし___ ほんです。 (It's my book.)",
      "わたしの ほんです",
      "の",
      ["は", "が", "を"],
      "の glues two nouns: me-kind-of book = my book.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-10-mc-4",
      "がっこう___ いきます。 (I go to school.)",
      "がっこうに いきます",
      "に",
      ["で", "は", "を"],
      "Movement verbs (いく/くる/かえる) take に for the destination point.",
    ),
  },
  {
    kind: "mc",
    payload: particleMc(
      "ja-m3-10-mc-5",
      "うち___ べんきょうします。 (I study at home.)",
      "うちで べんきょうします",
      "で",
      ["に", "は", "の"],
      "Studying is an action happening at a setting — で marks the place of action.",
    ),
  },
  {
    kind: "match",
    payload: {
      id: "ja-m3-10-match",
      type: "match_pairs",
      prompt: "Match each Japanese word to its meaning",
      pairs: [
        {
          id: "p1",
          source: "コーヒー",
          target: "coffee",
          sourceAnnotation: [{ surface: "コーヒー", reading: "コーヒー" }],
        },
        {
          id: "p2",
          source: "がくせい",
          target: "student",
          sourceAnnotation: [{ surface: "がくせい", reading: "がくせい" }],
        },
        {
          id: "p3",
          source: "えき",
          target: "station",
          sourceAnnotation: [{ surface: "えき", reading: "えき" }],
        },
        {
          id: "p4",
          source: "ともだち",
          target: "friend",
          sourceAnnotation: [{ surface: "ともだち", reading: "ともだち" }],
        },
        {
          id: "p5",
          source: "ホテル",
          target: "hotel",
          sourceAnnotation: [{ surface: "ホテル", reading: "ホテル" }],
        },
        {
          id: "p6",
          source: "じてんしゃ",
          target: "bicycle",
          sourceAnnotation: [{ surface: "じてんしゃ", reading: "じてんしゃ" }],
        },
      ],
    } as MatchPairsStep,
  },
  {
    kind: "build",
    payload: {
      id: "ja-m3-10-build",
      type: "build_sentence",
      prompt: "Ask: What is your name?",
      targetSentence: "なまえは なんですか",
      tiles: ["なまえは", "なんですか", "どこですか", "わたしは"],
      correctOrder: ["なまえは", "なんですか"],
      granularity: "word",
      audioKey: "なまえは なんですか",
      targetAnnotation: [
        { surface: "なまえは なんですか", reading: "なまえは なんですか" },
      ],
    } as BuildSentenceStep,
  },
];

const ROW_TEST: RowTestStep = {
  id: "ja-m3-10-test",
  type: "row_test",
  rowId: "m3",
  items: ITEMS,
  passThreshold: 0.7,
  maxRetries: 3,
};

export const MOCK_LESSON_JA_M3_10: LessonContent = {
  id: "ja-m3-10",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "M3 Mastery Test",
  description:
    "Cumulative test of M3 grammar + vocab. Wrong answers re-queue — no fail.",
  estimatedMinutes: 6,
  xpReward: 30,
  steps: [
    {
      id: "ja-m3-10-info-open",
      type: "info",
      title: "Module 3 mastery",
      body:
        "Twelve cumulative items across particles, vocab, and sentence-building. Missed items re-queue at the back. Pass once and Module 3 is mastered.",
      variant: "default",
    },

    ROW_TEST,

    {
      id: "ja-m3-10-info-end",
      type: "info",
      title: "Module 3 complete",
      body:
        "You've cleared the cliff that ends most language apps. You can introduce yourself, ask and answer basic questions, point at things, count, describe locations and means, and order at a café. M4 deepens this with more verbs and the first conjugation patterns.",
      variant: "win",
    },
  ],
};
