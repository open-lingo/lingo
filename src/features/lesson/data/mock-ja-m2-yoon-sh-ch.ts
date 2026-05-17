import type { LessonContent } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 yōon sh + ch families: しゃ・しゅ・しょ + ちゃ・ちゅ・ちょ.
 *
 * The two most common yōon families. Same rule as yoon-intro — small
 * ゃゅょ on a consonant kana. Note: し + small ゃ pronounces as 'sha'
 * (not 'sya'), matching the し → 'shi' (not 'si') quirk.
 *
 * Anchor: おちゃ (tea) — 3-mora (o-cha is technically 2-mora since the
 * yōon counts as one), uses M1 お + new ちゃ.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "しゃ", romaji: "sha" },
    { symbol: "しゅ", romaji: "shu" },
    { symbol: "しょ", romaji: "sho" },
    { symbol: "ちゃ", romaji: "cha" },
    { symbol: "ちゅ", romaji: "chu" },
    { symbol: "ちょ", romaji: "cho" },
  ],
  words: [
    { kana: "おちゃ", meaningEn: "tea", emoji: "🍵" },
  ],
  tileBankPool: ["しゃ", "しゅ", "しょ", "ちゃ", "ちゅ", "ちょ", "あ", "い", "う", "え", "お"],
};

export const MOCK_LESSON_JA_M2_YOON_SH_CH_1: LessonContent = {
  id: "ja-m1-yoon-sh-ch-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Yōon sh + ch — Intro",
  description: "The two most common yōon families. し→しゃ pronounces 'sha' (not 'sya').",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["ocha"],
  steps: [
    { id: "ja-ysc1-info-0", type: "info", title: "sh and ch yōon",
      body: "Same small-ゃゅょ rule, two new families. し + ゃ = しゃ (sha). ち + ゃ = ちゃ (cha). The 'sh' and 'ch' carry over from し ('shi') and ち ('chi') — not 'sya' / 'tya'.",
      variant: "culture" },

    recognition(ctx, "ja-ysc1-recog-sha", "しゃ", "sha", "shi + small ya"),
    recognition(ctx, "ja-ysc1-recog-shu", "しゅ", "shu", "shi + small yu"),
    recognition(ctx, "ja-ysc1-recog-sho", "しょ", "sho", "shi + small yo"),
    recognition(ctx, "ja-ysc1-recog-cha", "ちゃ", "cha", "chi + small ya"),
    recognition(ctx, "ja-ysc1-recog-chu", "ちゅ", "chu", "chi + small yu"),
    recognition(ctx, "ja-ysc1-recog-cho", "ちょ", "cho", "chi + small yo"),

    wordImageMcq(ctx, "ja-ysc1-mcq-ocha", "おちゃ"),
    listeningBuild(ctx, "ja-ysc1-build-ocha", "おちゃ", "tea"),
    speaking("ja-ysc1-speak-ocha", "おちゃ", "tea"),

    { id: "ja-ysc1-info-end", type: "info", title: "Real-world win",
      body: "You can now read おちゃ (tea) — and decode しゃしん (photo) on every camera-shop sign, ちょっと (a little) in every polite refusal you'll hear. Voiced yōon next — same rule on ぎ・じ・び・ぴ.",
      variant: "win" },
  ],
};
