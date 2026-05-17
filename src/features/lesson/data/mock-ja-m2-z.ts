import type { LessonContent, MultipleChoiceStep } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 voiced s → z: ざ じ ず ぜ ぞ (compact, NO tracing).
 *
 * One quirk callout: し → じ is "ji" (not "zi"). Same /dʒi/ sound as
 * the (rarely-written) ぢ. We handle the ぢ・づ note in the d-row.
 *
 * Anchor: みず (water) — 2-mora, pure-known kana (み from M1 ma-row,
 * ず new voiced kana).
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "ざ", romaji: "za" },
    { symbol: "じ", romaji: "ji" },
    { symbol: "ず", romaji: "zu" },
    { symbol: "ぜ", romaji: "ze" },
    { symbol: "ぞ", romaji: "zo" },
  ],
  words: [
    { kana: "みず", meaningEn: "water", emoji: "💧" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "さ", "し", "す", "せ", "そ", "み", "む"],
};

function contrastMc(
  id: string,
  unvoiced: string,
  unvoicedRomaji: string,
  correctVoiced: string,
  correctRomaji: string,
  distractors: [string, string, string],
): MultipleChoiceStep {
  const options = [
    { id: "correct", text: correctVoiced },
    { id: "opt-1", text: distractors[0] },
    { id: "opt-2", text: distractors[1] },
    { id: "opt-3", text: distractors[2] },
  ];
  return {
    id,
    type: "multiple_choice",
    prompt: `What is ${unvoiced} (${unvoicedRomaji}) + dakuten (゛)?`,
    promptAudioText: correctVoiced,
    options,
    correctOptionId: "correct",
    explanation: `${unvoiced} + ゛ = ${correctVoiced} (${correctRomaji}).`,
    optionsHideRomaji: true,
  };
}

export const MOCK_LESSON_JA_M2_Z_1: LessonContent = {
  id: "ja-m1-z-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Voiced s → z — Intro",
  description: "Same dakuten rule on s-kana. One quirk: し→じ is 'ji', not 'zi'.",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["mizu"],
  steps: [
    { id: "ja-z1-info-0", type: "info", title: "S → Z (with one twist)",
      body: "Same dakuten rule: さ→ざ, す→ず, せ→ぜ, そ→ぞ. The exception is し: voicing it gives じ, pronounced 'ji' (not 'zi'). It's the same sh→j change you'd hear in English 'shore' → 'jaw'.",
      variant: "culture" },

    contrastMc("ja-z1-mc-sa", "さ", "sa", "ざ", "za", ["じ", "ず", "ぜ"]),
    contrastMc("ja-z1-mc-shi", "し", "shi", "じ", "ji", ["ざ", "ず", "ぞ"]),
    contrastMc("ja-z1-mc-su", "す", "su", "ず", "zu", ["ざ", "じ", "ぞ"]),
    contrastMc("ja-z1-mc-se", "せ", "se", "ぜ", "ze", ["ざ", "じ", "ぞ"]),
    contrastMc("ja-z1-mc-so", "そ", "so", "ぞ", "zo", ["ざ", "ず", "ぜ"]),

    // Single representative row-sweep recog (the quirky じ) — the row-test
    // covers all 5.
    recognition(ctx, "ja-z1-recog-ji", "じ", "ji", "voiced し — 'ji'"),
    recognition(ctx, "ja-z1-recog-zo", "ぞ", "zo", "voiced そ"),

    wordImageMcq(ctx, "ja-z1-mcq-mizu", "みず"),
    listeningBuild(ctx, "ja-z1-build-mizu", "みず", "water"),
    speaking("ja-z1-speak-mizu", "みず", "water"),

    { id: "ja-z1-info-end", type: "info", title: "Real-world win",
      body: "You can now read みず (water) — the kanji 水 is on every drink-vending-machine in Japan — and かぞく (family), one of the first words anime characters use to introduce themselves. The し→じ quirk is the most common one; you'll see it everywhere.",
      variant: "win" },
  ],
};
