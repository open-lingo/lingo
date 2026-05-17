import type { LessonContent, BuildSentenceStep } from "../types";

/**
 * M3-8 — Sentence Build: assemble M3 grammar into real sentences.
 *
 * Five sentences. Each uses vocabulary + grammar introduced in M3-1
 * through M3-7. Tiles are word-granular (not character) so the user
 * arranges meaning blocks, not kana — the kana-level practice already
 * happened in M1/M2.
 *
 * Sentences chosen for plausibility — each one is something a 32yo
 * traveler would actually say in Japan:
 *   1. "I am American." (intro setup)
 *   2. "What's your name?" (most-used opener)
 *   3. "I go to school by bicycle." (combines particle types)
 *   4. "Is this your bag?" (lost-and-found at the station)
 *   5. "Two coffees, please." (counter + loanword)
 */

function build(
  id: string,
  prompt: string,
  target: string,
  tiles: string[],
  correctOrder: string[],
): BuildSentenceStep {
  return {
    id,
    type: "build_sentence",
    prompt,
    targetSentence: target,
    tiles,
    correctOrder,
    granularity: "word",
    audioKey: target,
    targetAnnotation: [{ surface: target, reading: target }],
  };
}

export const MOCK_LESSON_JA_M3_8: LessonContent = {
  id: "ja-m3-8",
  moduleId: "m3",
  courseId: "mock-1",
  languageId: "ja",
  title: "Sentence Build — putting it together",
  description:
    "Assemble five real sentences from M3 vocab + grammar.",
  estimatedMinutes: 6,
  xpReward: 18,
  steps: [
    {
      id: "ja-m3-8-info-open",
      type: "info",
      title: "Production time",
      body:
        "You've met every piece. Now arrange them. Tap the tiles in the right order — the audio plays the assembled sentence when you check.",
      variant: "default",
    },

    build(
      "ja-m3-8-s1",
      "Say: I am American.",
      "わたしは アメリカじんです",
      ["わたしは", "アメリカじんです", "がくせいです", "にほんじんです"],
      ["わたしは", "アメリカじんです"],
    ),

    build(
      "ja-m3-8-s2",
      "Ask: What is your name?",
      "なまえは なんですか",
      ["なまえは", "なんですか", "どこですか", "だれですか"],
      ["なまえは", "なんですか"],
    ),

    build(
      "ja-m3-8-s3",
      "Say: I go to school by bicycle.",
      "じてんしゃで がっこうに いきます",
      ["じてんしゃで", "がっこうに", "いきます", "うちで", "コンビニに"],
      ["じてんしゃで", "がっこうに", "いきます"],
    ),

    build(
      "ja-m3-8-s4",
      "Ask: Is this your bag?",
      "これは あなたの かばんですか",
      ["これは", "あなたの", "かばんですか", "それは", "わたしの"],
      ["これは", "あなたの", "かばんですか"],
    ),

    build(
      "ja-m3-8-s5",
      "Order: Two coffees, please.",
      "コーヒー にこ ください",
      ["コーヒー", "にこ", "ください", "ビール", "いちこ", "ですか"],
      ["コーヒー", "にこ", "ください"],
    ),

    {
      id: "ja-m3-8-info-end",
      type: "info",
      title: "You're producing language",
      body:
        "Five sentences from scratch. You can now introduce yourself, ask someone's name, describe your commute, identify lost items, and order at a café. That's a real day in Japan handled.",
      variant: "win",
    },
  ],
};
