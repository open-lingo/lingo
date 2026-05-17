import type { LessonContent, MultipleChoiceStep } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 voiced t → d: だ ぢ づ で ど (compact, NO tracing).
 *
 * Pedagogy callout: ぢ and づ are functionally rare. In modern Japanese,
 * the same sounds are written じ・ず in nearly every word. We introduce
 * ぢ・づ for chart-completeness (so they aren't a surprise in the wild)
 * but the contrast MCs + speaking target focus on the high-utility だでど.
 *
 * Anchor: でんわ (telephone) — 3-mora; flagged but acceptable since the
 * mora-aware Whisper tier handles 3-mora words with a slightly longer
 * threshold and ん is a clean nasal that lands cleanly in ASR.
 */

const ctx: RowContext = {
  // Distractor pool for recognition keeps the full d-row so the test
  // surface mirrors the chart, but ぢ・づ are not directly drilled.
  allKana: [
    { symbol: "だ", romaji: "da" },
    { symbol: "ぢ", romaji: "ji" },
    { symbol: "づ", romaji: "zu" },
    { symbol: "で", romaji: "de" },
    { symbol: "ど", romaji: "do" },
  ],
  words: [
    { kana: "でんわ", meaningEn: "telephone", emoji: "📞" },
  ],
  tileBankPool: ["あ", "い", "う", "え", "お", "た", "ち", "つ", "て", "と", "ん", "わ"],
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

export const MOCK_LESSON_JA_M2_D_1: LessonContent = {
  id: "ja-m1-d-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Voiced t → d — Intro",
  description: "Dakuten on t-kana gives d. ぢ and づ exist but are rarely written — じ・ず are used instead.",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["denwa"],
  steps: [
    { id: "ja-d1-info-0", type: "info", title: "T → D (with two ghosts)",
      body: "Dakuten on t-kana voices them: た→だ, て→で, と→ど. ち and つ also take dakuten — ぢ・づ — but modern Japanese almost always writes those sounds as じ・ず instead. Recognize ぢ・づ when you see them; you'll rarely need to write them.",
      variant: "culture" },

    contrastMc("ja-d1-mc-ta", "た", "ta", "だ", "da", ["で", "ど", "ば"]),
    contrastMc("ja-d1-mc-te", "て", "te", "で", "de", ["だ", "ど", "び"]),
    contrastMc("ja-d1-mc-to", "と", "to", "ど", "do", ["だ", "で", "ぼ"]),

    { id: "ja-d1-info-recog", type: "info", title: "Quick row sweep",
      body: "Audio → pick the kana. ぢ・づ are in the pool so you can identify them, even though you'll mostly write じ・ず.",
      variant: "tip" },
    recognition(ctx, "ja-d1-recog-da", "だ", "da", "voiced た"),
    recognition(ctx, "ja-d1-recog-de", "で", "de", "voiced て"),
    recognition(ctx, "ja-d1-recog-do", "ど", "do", "voiced と"),

    wordImageMcq(ctx, "ja-d1-mcq-denwa", "でんわ"),
    listeningBuild(ctx, "ja-d1-build-denwa", "でんわ", "telephone"),
    speaking("ja-d1-speak-denwa", "でんわ", "telephone"),

    { id: "ja-d1-info-end", type: "info", title: "Real-world win",
      body: "You can now read でんわ (telephone) — the word on every cellphone shop in Japan — and start spotting だれ ('who'), どこ ('where'), どう ('how') in the question words you'll meet next. ぢ・づ stay on the chart but rarely appear in writing.",
      variant: "win" },
  ],
};
