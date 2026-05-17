import type { LessonContent } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 yōon voiced: ぎゃ・じゃ・びゃ・ぴゃ families (g/j/b/p) — 12 kana.
 *
 * Same small-ゃゅょ rule, voiced consonant onsets. The rule has landed
 * by now (yoon-intro + sh-ch); this lesson is the wide sweep across the
 * remaining common-family voiced yōon.
 *
 * Anchor: じゅう (ten) — 2-mora, uses M1 う + new じゅ. High-utility
 * number word the learner will see constantly.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "ぎゃ", romaji: "gya" },
    { symbol: "ぎゅ", romaji: "gyu" },
    { symbol: "ぎょ", romaji: "gyo" },
    { symbol: "じゃ", romaji: "ja" },
    { symbol: "じゅ", romaji: "ju" },
    { symbol: "じょ", romaji: "jo" },
    { symbol: "びゃ", romaji: "bya" },
    { symbol: "びゅ", romaji: "byu" },
    { symbol: "びょ", romaji: "byo" },
    { symbol: "ぴゃ", romaji: "pya" },
    { symbol: "ぴゅ", romaji: "pyu" },
    { symbol: "ぴょ", romaji: "pyo" },
  ],
  words: [
    { kana: "じゅう", meaningEn: "ten", emoji: "🔟" },
  ],
  tileBankPool: ["じゃ", "じゅ", "じょ", "ぎゃ", "ぎゅ", "ぎょ", "う", "あ", "い", "え", "お"],
};

export const MOCK_LESSON_JA_M2_YOON_VOICED_1: LessonContent = {
  id: "ja-m1-yoon-voiced-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Yōon voiced — Intro",
  description: "Same rule on voiced consonants. ぎ・じ・び・ぴ + small ゃゅょ. 12 kana, one number word.",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["juu"],
  steps: [
    { id: "ja-yv1-info-0", type: "info", title: "Voiced yōon",
      body: "Same small-ゃゅょ rule, voiced consonants. ぎ・じ・び・ぴ each pair with ゃ・ゅ・ょ to give 12 new kana. Note: じゃ・じゅ・じょ use 'j' (not 'zy') — same logic as じ being 'ji'.",
      variant: "culture" },

    // 1 recognition per family (the row test will exercise every kana).
    // Wide sweep without bloating the lesson past 3 min.
    recognition(ctx, "ja-yv1-recog-gya", "ぎゃ", "gya", "gi + small ya"),
    recognition(ctx, "ja-yv1-recog-ju", "じゅ", "ju", "ji + small yu"),
    recognition(ctx, "ja-yv1-recog-jo", "じょ", "jo", "ji + small yo"),
    recognition(ctx, "ja-yv1-recog-byo", "びょ", "byo", "bi + small yo"),
    recognition(ctx, "ja-yv1-recog-pyo", "ぴょ", "pyo", "pi + small yo"),

    wordImageMcq(ctx, "ja-yv1-mcq-juu", "じゅう"),
    listeningBuild(ctx, "ja-yv1-build-juu", "じゅう", "ten"),
    speaking("ja-yv1-speak-juu", "じゅう", "ten"),

    { id: "ja-yv1-info-end", type: "info", title: "Real-world win",
      body: "You can now read じゅう (ten) — the number you'll hear in every price, phone number, and clock-time reading. じゅぎょう (class), ぎょうざ (dumplings), びょういん (hospital) are all unlocked. One sweep left — the rare families (n/h/m/r).",
      variant: "win" },
  ],
};
