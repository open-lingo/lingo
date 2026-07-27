import type { LessonContent } from "@/features/lesson/types";
import {
  type RowContext,
  symbolIntro, traceTwice, recognition, symbolToSound,
  wordImageMcq, listeningBuild, speaking, listeningComp,
  priorRowReviewTail,
} from "@/features/languages/ja/curriculum/_consonantRowHelpers";

/**
 * Ra-row: ら り る れ ろ — three sub-lessons (~13 min).
 * The 'r' is a tap — close to a Spanish 'r' or American English 'tt' in
 * 'butter'. Not the English rolled 'r'. Words: さくら, これ, いろ.
 *
 * Note: this row LANDS after ya-row in the curriculum order. Since
 * ya-row is still on the auto-builder structure as of 2026-05-16, the
 * learner sees old-style ya then new-style ra. Will resolve when ya/wa
 * get the same 2+2+1 treatment in a follow-up pass.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "ら", romaji: "ra" },
    { symbol: "り", romaji: "ri" },
    { symbol: "る", romaji: "ru" },
    { symbol: "れ", romaji: "re" },
    { symbol: "ろ", romaji: "ro" },
  ],
  words: [
    { kana: "さくら", meaningEn: "cherry blossom", emoji: "🌸" },
    { kana: "これ",   meaningEn: "this",           emoji: "👉" },
    { kana: "いろ",   meaningEn: "color",          emoji: "🌈" },
  ],
  tileBankPool: [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
    "ま", "み", "む", "め", "も",
    "や", "ゆ", "よ",
  ],
};

export const MOCK_LESSON_JA_M1_RA_1: LessonContent = {
  id: "ja-m1-ra-1",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ra-row — Intro 1",
  description: "Meet ら and り. Build cherry blossom.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["sakura"],
  steps: [

    symbolIntro("ja-ra1-intro-ra", "ら", "ra", "/ɾa/", "tongue tap — 'la' and 'ra' sit between", "さくら (cherry blossom)"),
    traceTwice("ja-ra1-trace-ra", "ら", "ra", "soft tap, between 'la' and 'ra'"),
    recognition(ctx, "ja-ra1-recog-ra", "ら", "ra", "tongue tap 'ra'"),

    symbolIntro("ja-ra1-intro-ri", "り", "ri", "/ɾi/", "like a tapped 'ri' — soft", "さくら (cherry blossom)"),
    traceTwice("ja-ra1-trace-ri", "り", "ri", "soft tap 'ri'"),
    recognition(ctx, "ja-ra1-recog-ri", "り", "ri", "soft tap 'ri'"),

    wordImageMcq(ctx, "ja-ra1-mcq-sakura", "さくら"),
    listeningBuild(ctx, "ja-ra1-build-sakura", "さくら", "cherry blossom"),

    symbolToSound(ctx, "ja-ra1-sts-ra", "ら", "ra", "tongue tap"),
    symbolToSound(ctx, "ja-ra1-sts-ri", "り", "ri", "tongue tap"),

  ],
};

export const MOCK_LESSON_JA_M1_RA_2: LessonContent = {
  id: "ja-m1-ra-2",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ra-row — Intro 2",
  description: "Add る and れ. Build 'this' — your first pointing word.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["kore"],
  steps: [

    symbolIntro("ja-ra2-intro-ru", "る", "ru", "/ɾɯ/", "tapped 'ru' — soft", ""),
    traceTwice("ja-ra2-trace-ru", "る", "ru", "tap 'ru'"),
    recognition(ctx, "ja-ra2-recog-ru", "る", "ru", "tap 'ru'"),

    symbolIntro("ja-ra2-intro-re", "れ", "re", "/ɾe/", "tapped 're' — soft", "これ (this)"),
    traceTwice("ja-ra2-trace-re", "れ", "re", "tap 're'"),
    recognition(ctx, "ja-ra2-recog-re", "れ", "re", "tap 're'"),

    wordImageMcq(ctx, "ja-ra2-mcq-kore", "これ"),
    listeningBuild(ctx, "ja-ra2-build-kore", "これ", "this"),

    listeningComp("ja-ra2-lc-kore",   "これ",   "kore",   "this",
      ["color", "boat", "cat"]),

    symbolToSound(ctx, "ja-ra2-sts-ru", "る", "ru", "tap 'ru'"),
    symbolToSound(ctx, "ja-ra2-sts-re", "れ", "re", "tap 're'"),

    // Survival callout — これ is half a phrasebook in itself.

  ],
};

export const MOCK_LESSON_JA_M1_RA_3: LessonContent = {
  id: "ja-m1-ra-3",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ra-row — Review",
  description: "Last kana (ろ), build color, sweep + speak.",
  estimatedMinutes: 5, xpReward: 12,
  introducesVocabIds: ["iro"],
  steps: [

    symbolIntro("ja-ra3-intro-ro", "ろ", "ro", "/ɾo/", "tapped 'ro' — soft", "いろ (color)"),
    traceTwice("ja-ra3-trace-ro", "ろ", "ro", "tap 'ro'"),
    recognition(ctx, "ja-ra3-recog-ro", "ろ", "ro", "tap 'ro'"),

    wordImageMcq(ctx, "ja-ra3-mcq-iro", "いろ"),
    listeningBuild(ctx, "ja-ra3-build-iro", "いろ", "color"),

    // Single representative row-sweep recog — the module recap covers
    // the full 5-kana sweep.
    recognition(ctx, "ja-ra3-rev-ri", "り", "ri", "tap 'ri'"),

    wordImageMcq(ctx, "ja-ra3-mcq-rev-kore", "これ"),

    speaking("ja-ra3-speak-sakura", "さくら", "cherry blossom"),
    speaking("ja-ra3-speak-kore",   "これ",   "this"),
    listeningComp("ja-ra3-lc-sakura", "さくら", "sakura", "cherry blossom",
      ["this", "color", "mountain"]),
    speaking("ja-ra3-speak-iro",    "いろ",   "color"),

    // R2-defer-F prior-row review tail — vowels through ya pool.
    ...priorRowReviewTail("ra"),

  ],
};
