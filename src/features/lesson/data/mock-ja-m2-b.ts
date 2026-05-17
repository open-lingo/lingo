import type { LessonContent, MultipleChoiceStep } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 voiced h → b: ば び ぶ べ ぼ (compact, NO tracing).
 *
 * Same dakuten mark on h-kana gives b. The h-row is the ONLY row that
 * accepts both dakuten (゛ → b) and handakuten (゜ → p, next lesson).
 *
 * Anchor: たべる (to eat) — 3-mora; flagged but useful (verb stem the
 * learner will see constantly).
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "ば", romaji: "ba" },
    { symbol: "び", romaji: "bi" },
    { symbol: "ぶ", romaji: "bu" },
    { symbol: "べ", romaji: "be" },
    { symbol: "ぼ", romaji: "bo" },
  ],
  words: [
    { kana: "たべる", meaningEn: "to eat", emoji: "🍽️" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "は", "ひ", "ふ", "へ", "ほ", "た", "る"],
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

export const MOCK_LESSON_JA_M2_B_1: LessonContent = {
  id: "ja-m1-b-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Voiced h → b — Intro",
  description: "Dakuten on h-kana gives b-sounds. Same mark as g/z/d — just on a new family.",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["taberu"],
  steps: [
    { id: "ja-b1-info-0", type: "info", title: "H → B",
      body: "Same dakuten on h-kana: は→ば, ひ→び, ふ→ぶ, へ→べ, ほ→ぼ. The h-row is special — it also takes the other voicing mark (゜) to make p-sounds. We'll meet those in the next lesson.",
      variant: "culture" },

    contrastMc("ja-b1-mc-ha", "は", "ha", "ば", "ba", ["び", "ぶ", "べ"]),
    contrastMc("ja-b1-mc-hi", "ひ", "hi", "び", "bi", ["ば", "ぶ", "ぼ"]),
    contrastMc("ja-b1-mc-fu", "ふ", "fu", "ぶ", "bu", ["ば", "び", "ぼ"]),
    contrastMc("ja-b1-mc-he", "へ", "he", "べ", "be", ["ば", "び", "ぼ"]),
    contrastMc("ja-b1-mc-ho", "ほ", "ho", "ぼ", "bo", ["ば", "ぶ", "べ"]),

    // Single representative row-sweep recog — the row-test covers all 5.
    recognition(ctx, "ja-b1-recog-bu", "ぶ", "bu", "voiced ふ"),
    recognition(ctx, "ja-b1-recog-bo", "ぼ", "bo", "voiced ほ"),

    wordImageMcq(ctx, "ja-b1-mcq-taberu", "たべる"),
    listeningBuild(ctx, "ja-b1-build-taberu", "たべる", "to eat"),
    speaking("ja-b1-speak-taberu", "たべる", "to eat"),

    { id: "ja-b1-info-end", type: "info", title: "Real-world win",
      body: "You can now read たべる (to eat) — your first verb! — and decode every B-fronted loanword: ベッド (bed), バス (bus), ビール (beer). One more dakuten family left — handakuten ゜ for p.",
      variant: "win" },
  ],
};
