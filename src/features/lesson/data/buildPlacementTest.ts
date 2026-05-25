/**
 * Placement test builder for the JA course.
 *
 * Generates a ~20-step diagnostic lesson covering M1 (hiragana),
 * M2 (dakuten + yoon), and M3 (basic grammar). Each step is tagged
 * with a `section` key so `computePlacementResult` can score per-module
 * mastery independently.
 *
 * Uses ONLY existing step factories from `_jaGrammarHelpers.ts` and the
 * core lesson types — no new step types invented.
 */
import type { LessonContent, LessonStep, MultipleChoiceStep } from "../types";
import {
  cloze,
  infoStep,
  slotFor,
} from "./_jaGrammarHelpers";

// ---------------------------------------------------------------------------
// Section tags — attached to step ids so the result scorer can bucket them.
//   "hiragana"  → M1 content
//   "katakana"  → M3 content (katakana intro lives in M3)
//   "dakuten"   → M2 content
//   "grammar"   → M3 content (particle clozes)
// ---------------------------------------------------------------------------

export type PlacementSection = "hiragana" | "katakana" | "dakuten" | "grammar";

/**
 * Map from step id → section. Exported so `computePlacementResult` can
 * bucket correctness results.
 */
export const PLACEMENT_STEP_SECTIONS: Record<string, PlacementSection> = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a kana-recognition MCQ: see the kana, pick the correct romaji. */
function kanaRecognitionMcq(
  id: string,
  kana: string,
  correctRomaji: string,
  distractors: [string, string, string],
): MultipleChoiceStep {
  const items = [
    { id: "correct", text: correctRomaji },
    { id: "opt-1", text: distractors[0] },
    { id: "opt-2", text: distractors[1] },
    { id: "opt-3", text: distractors[2] },
  ];
  const slot = slotFor(id, 4);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id,
    type: "multiple_choice",
    prompt: `What is ${kana} in romaji?`,
    options: items,
    correctOptionId: "correct",
    optionsHideRomaji: true,
  };
}

function tag(id: string, section: PlacementSection): void {
  PLACEMENT_STEP_SECTIONS[id] = section;
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildPlacementTest(): LessonContent {
  const steps: LessonStep[] = [];

  // ── Intro info ──────────────────────────────────────────────────────────
  steps.push(
    infoStep(
      "ja-placement-intro",
      "Placement test",
      "This short diagnostic checks what you already know. Answer honestly — there is no penalty for wrong answers. Based on your results, we will skip the modules you have already mastered.",
      "default",
    ),
  );

  // ── Section 1: Hiragana recognition (8 steps) ──────────────────────────
  // Covers vowels (a, i, u, e, o), ka-row, sa-row, ta-row, na-row,
  // ha-row, ma-row, ra-row — one representative kana per row plus
  // a couple of extras for the vowel row.
  const hiraganaSteps: { id: string; kana: string; romaji: string; d: [string, string, string] }[] = [
    { id: "ja-placement-h1", kana: "あ", romaji: "a",   d: ["o", "u", "e"] },
    { id: "ja-placement-h2", kana: "い", romaji: "i",   d: ["e", "u", "a"] },
    { id: "ja-placement-h3", kana: "か", romaji: "ka",  d: ["sa", "ta", "na"] },
    { id: "ja-placement-h4", kana: "し", romaji: "shi", d: ["chi", "tsu", "su"] },
    { id: "ja-placement-h5", kana: "つ", romaji: "tsu", d: ["su", "shi", "chi"] },
    { id: "ja-placement-h6", kana: "な", romaji: "na",  d: ["ma", "ra", "ha"] },
    { id: "ja-placement-h7", kana: "ほ", romaji: "ho",  d: ["ha", "he", "hi"] },
    { id: "ja-placement-h8", kana: "る", romaji: "ru",  d: ["ri", "re", "ra"] },
  ];
  for (const h of hiraganaSteps) {
    tag(h.id, "hiragana");
    steps.push(kanaRecognitionMcq(h.id, h.kana, h.romaji, h.d));
  }

  // ── Section 2: Katakana recognition (4 steps) ──────────────────────────
  // Common loanwords written in katakana — the learner sees the katakana
  // and picks the correct romaji reading.
  const katakanaSteps: { id: string; kana: string; romaji: string; d: [string, string, string] }[] = [
    { id: "ja-placement-k1", kana: "コ", romaji: "ko", d: ["ku", "ka", "ki"] },
    { id: "ja-placement-k2", kana: "ラ", romaji: "ra", d: ["ri", "ru", "re"] },
    { id: "ja-placement-k3", kana: "ン", romaji: "n",  d: ["so", "shi", "tsu"] },
    { id: "ja-placement-k4", kana: "ビ", romaji: "bi", d: ["pi", "gi", "di"] },
  ];
  for (const k of katakanaSteps) {
    tag(k.id, "katakana");
    steps.push(kanaRecognitionMcq(k.id, k.kana, k.romaji, k.d));
  }

  // ── Section 3: Dakuten / Yoon recognition (4 steps) ────────────────────
  const dakutenSteps: { id: string; kana: string; romaji: string; d: [string, string, string] }[] = [
    { id: "ja-placement-d1", kana: "が", romaji: "ga",  d: ["ka", "da", "ba"] },
    { id: "ja-placement-d2", kana: "ぞ", romaji: "zo",  d: ["so", "do", "bo"] },
    { id: "ja-placement-d3", kana: "きゃ", romaji: "kya", d: ["kyu", "sha", "cha"] },
    { id: "ja-placement-d4", kana: "ぴ", romaji: "pi",  d: ["bi", "hi", "gi"] },
  ];
  for (const d of dakutenSteps) {
    tag(d.id, "dakuten");
    steps.push(kanaRecognitionMcq(d.id, d.kana, d.romaji, d.d));
  }

  // ── Section 4: Grammar — particle clozes (4 steps) ─────────────────────
  // Tests は, か, の, を — the four particles covered in M3-M4.

  const g1Id = "ja-placement-g1";
  tag(g1Id, "grammar");
  steps.push(
    cloze(
      g1Id,
      "わたし",
      "がくせい です",
      "は",
      ["は", "か", "の", "を"],
      "I am a student.",
      "わたしは がくせい です",
      "は marks the topic — 'As for me, (I am) a student.'",
    ),
  );

  const g2Id = "ja-placement-g2";
  tag(g2Id, "grammar");
  steps.push(
    cloze(
      g2Id,
      "これは なん です",
      "",
      "か",
      ["か", "は", "の", "を"],
      "What is this?",
      "これは なん ですか",
      "か at the end of a sentence makes it a question.",
    ),
  );

  const g3Id = "ja-placement-g3";
  tag(g3Id, "grammar");
  steps.push(
    cloze(
      g3Id,
      "わたし",
      "ほん",
      "の",
      ["の", "は", "か", "を"],
      "My book.",
      "わたしの ほん",
      "の links owner to owned — 'my book.'",
    ),
  );

  const g4Id = "ja-placement-g4";
  tag(g4Id, "grammar");
  steps.push(
    cloze(
      g4Id,
      "みず",
      "のみます",
      "を",
      ["を", "は", "か", "の"],
      "I drink water.",
      "みずを のみます",
      "を marks the direct object — the thing being acted on.",
    ),
  );

  // ── Wrap-up info ────────────────────────────────────────────────────────
  steps.push(
    infoStep(
      "ja-placement-done",
      "All done!",
      "Your results are being calculated. Tap continue to see how you did.",
      "win",
    ),
  );

  return {
    id: "ja-placement",
    moduleId: "placement",
    courseId: "mock-1",
    languageId: "ja",
    title: "Placement Test",
    description: "Diagnostic test to determine your starting point in the Japanese course.",
    estimatedMinutes: 5,
    xpReward: 0,
    introducesVocabIds: [],
    steps,
  };
}
