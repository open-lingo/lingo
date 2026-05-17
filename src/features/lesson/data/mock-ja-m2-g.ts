import type { LessonContent, MultipleChoiceStep } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 voiced k → g: が ぎ ぐ げ ご (compact, NO tracing).
 *
 * Per curriculum-design-v2 (2026-05-16): dakuten kana share their shape
 * with a previously-learned unvoiced kana, so we drop tracing and the
 * full 5-row M1 template. Pattern: info (dakuten rule) → per-kana
 * か→? contrast MC → recognition rotation → anchor-word MCQ + build +
 * speaking → recap info.
 *
 * Anchor: かぎ (key) — 2-mora, pure-known kana (か from M1 ka-row, ぎ
 * the new voiced kana). Fits Whisper's short-tier threshold cleanly.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "が", romaji: "ga" },
    { symbol: "ぎ", romaji: "gi" },
    { symbol: "ぐ", romaji: "gu" },
    { symbol: "げ", romaji: "ge" },
    { symbol: "ご", romaji: "go" },
  ],
  words: [
    { kana: "かぎ", meaningEn: "key", emoji: "🔑" },
  ],
  // Decoys for tile banks — vowels + a few ka-row kana the learner met in M1.
  tileBankPool: ["あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ"],
};

/**
 * Contrast MC: prompt = "What's [unvoiced] + dakuten?". Options show 4
 * voiced kana; the correct one is the dakuten partner of the prompt kana.
 * Tests the rule (゛ voices), not the kana itself.
 */
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
    explanation: `${unvoiced} + ゛ = ${correctVoiced} (${correctRomaji}). The dakuten voices the consonant.`,
    optionsHideRomaji: true,
  };
}

export const MOCK_LESSON_JA_M2_G_1: LessonContent = {
  id: "ja-m1-g-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Voiced k → g — Intro",
  description: "Dakuten voices k into g. Five new kana, one anchor word.",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["kagi"],
  steps: [
    { id: "ja-g1-info-0", type: "info", title: "Dakuten — the voicing mark",
      body: "The two strokes ゛ in the top right are called dakuten. On k-kana they voice the consonant: か→が, き→ぎ, く→ぐ, け→げ, こ→ご. Same shapes you already know — just a new sound.",
      variant: "culture" },

    contrastMc("ja-g1-mc-ka", "か", "ka", "が", "ga", ["き", "ぐ", "げ"]),
    contrastMc("ja-g1-mc-ki", "き", "ki", "ぎ", "gi", ["が", "ぐ", "ご"]),
    contrastMc("ja-g1-mc-ku", "く", "ku", "ぐ", "gu", ["が", "ぎ", "ご"]),
    contrastMc("ja-g1-mc-ke", "け", "ke", "げ", "ge", ["が", "ぎ", "ご"]),
    contrastMc("ja-g1-mc-ko", "こ", "ko", "ご", "go", ["が", "ぐ", "げ"]),

    // Single representative row-sweep recog — the row-test covers all 5.
    recognition(ctx, "ja-g1-recog-gi", "ぎ", "gi", "voiced き"),
    recognition(ctx, "ja-g1-recog-go", "ご", "go", "voiced こ"),

    wordImageMcq(ctx, "ja-g1-mcq-kagi", "かぎ"),
    listeningBuild(ctx, "ja-g1-build-kagi", "かぎ", "key"),
    speaking("ja-g1-speak-kagi", "かぎ", "key"),

    { id: "ja-g1-info-end", type: "info", title: "Real-world win",
      body: "You can now read かぎ (key) — and decode がっこう (school), the word every NHK news segment on education uses. Dakuten unlocks half of everyday vocabulary.",
      variant: "win" },
  ],
};
