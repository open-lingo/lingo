import type { LessonContent } from "../types";
import {
  type RowContext,
  recognition, wordImageMcq, listeningBuild, speaking,
} from "./_consonantRowHelpers";

/**
 * M2 yōon rare: にゃ・ひゃ・みゃ・りゃ families (n/h/m/r) — 12 kana.
 *
 * Recognition-only for most. The high-utility ones are ひゃく (hundred,
 * the anchor), りゅう (dragon), りょこう (trip). にゃ-family is
 * essentially cat onomatopoeia; mostly chart-completeness.
 *
 * Anchor: ひゃく (hundred) — 3-mora (hya-ku = 2 syllables since the
 * yōon counts as one mora), high-utility counting word.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "にゃ", romaji: "nya" },
    { symbol: "にゅ", romaji: "nyu" },
    { symbol: "にょ", romaji: "nyo" },
    { symbol: "ひゃ", romaji: "hya" },
    { symbol: "ひゅ", romaji: "hyu" },
    { symbol: "ひょ", romaji: "hyo" },
    { symbol: "みゃ", romaji: "mya" },
    { symbol: "みゅ", romaji: "myu" },
    { symbol: "みょ", romaji: "myo" },
    { symbol: "りゃ", romaji: "rya" },
    { symbol: "りゅ", romaji: "ryu" },
    { symbol: "りょ", romaji: "ryo" },
  ],
  words: [
    { kana: "ひゃく", meaningEn: "hundred", emoji: "💯" },
  ],
  tileBankPool: ["ひゃ", "ひゅ", "ひょ", "りゃ", "りゅ", "りょ", "く", "あ", "い", "う", "え", "お"],
};

export const MOCK_LESSON_JA_M2_YOON_RARE_1: LessonContent = {
  id: "ja-m1-yoon-rare-1",
  moduleId: "m2", courseId: "mock-1", languageId: "ja",
  title: "Yōon rare — Intro",
  description: "The last yōon families. Few daily-use words; high-utility ones are ひゃく (hundred) and りょこう (trip).",
  estimatedMinutes: 3, xpReward: 10,
  introducesVocabIds: ["hyaku"],
  steps: [
    { id: "ja-yr1-info-0", type: "info", title: "Rare yōon — recognition focus",
      body: "n/h/m/r yōon round out the chart. Most are uncommon in everyday text — recognize them when they show up, but don't sweat memorizing every one. The wins here are ひゃく (100), りゅう (dragon), りょこう (trip).",
      variant: "culture" },

    // 1 recognition per family (test exercises every kana).
    recognition(ctx, "ja-yr1-recog-nya", "にゃ", "nya", "ni + small ya"),
    recognition(ctx, "ja-yr1-recog-hya", "ひゃ", "hya", "hi + small ya"),
    recognition(ctx, "ja-yr1-recog-myo", "みょ", "myo", "mi + small yo"),
    recognition(ctx, "ja-yr1-recog-ryu", "りゅ", "ryu", "ri + small yu"),
    recognition(ctx, "ja-yr1-recog-ryo", "りょ", "ryo", "ri + small yo"),

    wordImageMcq(ctx, "ja-yr1-mcq-hyaku", "ひゃく"),
    listeningBuild(ctx, "ja-yr1-build-hyaku", "ひゃく", "hundred"),
    speaking("ja-yr1-speak-hyaku", "ひゃく", "hundred"),

    { id: "ja-yr1-info-end", type: "info", title: "Real-world win — yōon complete",
      body: "Every yōon family, met. ひゃく (hundred) on price tags, りょこう (trip) on travel ads, りゅう (dragon) in fantasy manga titles. The yōon capstone test sweeps across every yōon — one last check before katakana lands in M3.",
      variant: "win" },
  ],
};
