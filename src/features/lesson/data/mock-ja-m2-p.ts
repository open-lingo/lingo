import type { LessonContent, MultipleChoiceStep } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 handakuten p-row: ぱ ぴ ぷ ぺ ぽ (compact, NO tracing).
 *
 * The ONLY family that uses the handakuten mark (゜) — a tiny circle in
 * the same top-right slot the dakuten lives. Only the h-row accepts it.
 *
 * Anchor: ぱん (bread, from Portuguese pão) — 2-mora, perfect for
 * Whisper's short tier. Cultural note: ぱん is your first handakuten
 * word AND a loanword the learner already knows in English.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "ぱ", romaji: "pa" },
    { symbol: "ぴ", romaji: "pi" },
    { symbol: "ぷ", romaji: "pu" },
    { symbol: "ぺ", romaji: "pe" },
    { symbol: "ぽ", romaji: "po" },
  ],
  words: [
    { kana: "ぱん", meaningEn: "bread", emoji: "🍞" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "は", "ひ", "ふ", "へ", "ほ", "ん"],
};

function handakutenMc(
  id: string,
  unvoiced: string,
  unvoicedRomaji: string,
  correctP: string,
  correctRomaji: string,
  distractors: [string, string, string],
): MultipleChoiceStep {
  const options = [
    { id: "correct", text: correctP },
    { id: "opt-1", text: distractors[0] },
    { id: "opt-2", text: distractors[1] },
    { id: "opt-3", text: distractors[2] },
  ];
  return {
    id,
    type: "multiple_choice",
    prompt: `What is ${unvoiced} (${unvoicedRomaji}) + handakuten (゜)?`,
    promptAudioText: correctP,
    options,
    correctOptionId: "correct",
    explanation: `${unvoiced} + ゜ = ${correctP} (${correctRomaji}). Only the h-row takes the small circle.`,
    optionsHideRomaji: true,
  };
}

export const MOCK_LESSON_JA_M2_P_1: LessonContent = {
  id: "ja-m1-p-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Handakuten p-row — Intro",
  description: "The tiny circle (゜) only appears on h-kana, turning them into p. Your first handakuten word is bread.",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["pan"],
  steps: [
    { id: "ja-p1-info-0", type: "info", title: "Handakuten — the little circle",
      body: "゜ (handakuten) only ever sits on h-kana, turning them into p-sounds: は→ぱ, ひ→ぴ, ふ→ぷ, へ→ぺ, ほ→ぽ. Same slot as dakuten, but a circle instead of two strokes. Your first p-word is ぱん — Japanese for bread, borrowed from Portuguese pão centuries ago.",
      variant: "culture" },

    handakutenMc("ja-p1-mc-ha", "は", "ha", "ぱ", "pa", ["ぴ", "ぷ", "ぺ"]),
    handakutenMc("ja-p1-mc-hi", "ひ", "hi", "ぴ", "pi", ["ぱ", "ぷ", "ぽ"]),
    handakutenMc("ja-p1-mc-fu", "ふ", "fu", "ぷ", "pu", ["ぱ", "ぴ", "ぽ"]),
    handakutenMc("ja-p1-mc-he", "へ", "he", "ぺ", "pe", ["ぱ", "ぴ", "ぽ"]),
    handakutenMc("ja-p1-mc-ho", "ほ", "ho", "ぽ", "po", ["ぱ", "ぷ", "ぺ"]),

    // Single representative row-sweep recog — the row-test covers all 5.
    recognition(ctx, "ja-p1-recog-pi", "ぴ", "pi", "ひ + ゜"),
    recognition(ctx, "ja-p1-recog-po", "ぽ", "po", "ほ + ゜"),

    wordImageMcq(ctx, "ja-p1-mcq-pan", "ぱん"),
    listeningBuild(ctx, "ja-p1-build-pan", "ぱん", "bread"),
    speaking("ja-p1-speak-pan", "ぱん", "bread"),

    { id: "ja-p1-info-end", type: "info", title: "Real-world win — voicing complete",
      body: "Every voiced and semi-voiced kana, done. ぱん (bread) on the bakery sign, ピザ on the menu, ポップ in the music section — handakuten unlocks Japan's enormous loanword vocabulary. Next: yōon — small ゃ・ゅ・ょ glued to a consonant.",
      variant: "win" },
  ],
};
