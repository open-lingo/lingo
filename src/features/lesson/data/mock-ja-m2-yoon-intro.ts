import type { LessonContent } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 yōon intro: きゃ・きゅ・きょ (compact, NO tracing).
 *
 * Worked example for the small-ゃ/ゅ/ょ rule. A consonant kana with an
 * /i/ vowel (き, し, ち, etc.) followed by a *small* や/ゆ/よ contracts
 * into a single mora. き + small ゃ → きゃ (kya) — one syllable, not two.
 *
 * Anchor: きょう (today) — 2-mora (kyou), uses M1 う + new きょ.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "きゃ", romaji: "kya" },
    { symbol: "きゅ", romaji: "kyu" },
    { symbol: "きょ", romaji: "kyo" },
  ],
  words: [
    { kana: "きょう", meaningEn: "today", emoji: "📅" },
  ],
  tileBankPool: ["きゃ", "きゅ", "きょ", "あ", "い", "う", "え", "お", "か", "き"],
};

export const MOCK_LESSON_JA_M2_YOON_INTRO_1: LessonContent = {
  id: "ja-m1-yoon-intro-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Yōon — Intro",
  description: "Small ゃゅょ glued to a consonant = one syllable. Worked example with き.",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["kyou"],
  steps: [
    { id: "ja-yi1-info-0", type: "info", title: "Yōon — the contraction rule",
      body: "When a consonant kana (き, し, ち, etc.) is followed by a SMALL ゃ・ゅ・ょ, the two write together but pronounce as ONE syllable. き + small ゃ = きゃ ('kya', not 'ki-ya'). Size matters: full-size や/ゆ/よ stays a separate syllable.",
      variant: "culture" },

    { id: "ja-yi1-info-recog", type: "info", title: "Meet the k-yōon",
      body: "き + ゃ → きゃ (kya). き + ゅ → きゅ (kyu). き + ょ → きょ (kyo).",
      variant: "tip" },
    recognition(ctx, "ja-yi1-recog-kya", "きゃ", "kya", "ki + small ya — one syllable"),
    recognition(ctx, "ja-yi1-recog-kyu", "きゅ", "kyu", "ki + small yu — one syllable"),
    recognition(ctx, "ja-yi1-recog-kyo", "きょ", "kyo", "ki + small yo — one syllable"),

    wordImageMcq(ctx, "ja-yi1-mcq-kyou", "きょう"),
    listeningBuild(ctx, "ja-yi1-build-kyou", "きょう", "today"),
    speaking("ja-yi1-speak-kyou", "きょう", "today"),

    { id: "ja-yi1-info-end", type: "info", title: "Real-world win",
      body: "You can now read きょう (today) — the first word in countless Japanese diary entries and date headers. The small-ゃゅょ trick applies to every consonant family. The remaining lessons will fly by — you already know the rule.",
      variant: "win" },
  ],
};
