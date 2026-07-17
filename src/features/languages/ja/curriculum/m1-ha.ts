import type { LessonContent } from "@/features/lesson/types";
import {
  type RowContext,
  symbolIntro, traceTwice, recognition, symbolToSound,
  wordImageMcq, listeningBuild, speaking, listeningComp,
  priorRowReviewTail,
} from "@/features/languages/ja/curriculum/_consonantRowHelpers";

/**
 * Ha-row: は ひ ふ へ ほ — three sub-lessons + auto row-test (~13 min).
 * Words: ひと (person), ふね (boat), ほし (star).
 * Quirk to remember (not surfaced here): は is pronounced 'wa' when it's
 * the topic particle. We treat it as 'ha' for now since particles arrive
 * in a later grammar module.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "は", romaji: "ha" },
    { symbol: "ひ", romaji: "hi" },
    { symbol: "ふ", romaji: "fu" },
    { symbol: "へ", romaji: "he" },
    { symbol: "ほ", romaji: "ho" },
  ],
  words: [
    { kana: "ひと", meaningEn: "person", emoji: "👤" },
    { kana: "ふね", meaningEn: "boat",   emoji: "🚢" },
    { kana: "ほし", meaningEn: "star",   emoji: "⭐" },
  ],
  tileBankPool: [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
  ],
};

export const MOCK_LESSON_JA_M1_HA_1: LessonContent = {
  id: "ja-m1-ha-1",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ha-row — Intro 1",
  description: "Meet は and ひ. Build person.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["hito"],
  steps: [

    symbolIntro("ja-ha1-intro-ha", "は", "ha", "/ha/", "like 'ha' in 'hot'", ""),
    traceTwice("ja-ha1-trace-ha", "は", "ha", "like 'ha' in 'hot'"),
    recognition(ctx, "ja-ha1-recog-ha", "は", "ha", "like 'ha'"),

    symbolIntro("ja-ha1-intro-hi", "ひ", "hi", "/çi/", "like 'hee' in 'heat'", "ひと (person)"),
    traceTwice("ja-ha1-trace-hi", "ひ", "hi", "like 'hee'"),
    recognition(ctx, "ja-ha1-recog-hi", "ひ", "hi", "like 'hee'"),

    wordImageMcq(ctx, "ja-ha1-mcq-hito", "ひと"),
    listeningBuild(ctx, "ja-ha1-build-hito", "ひと", "person"),

    symbolToSound(ctx, "ja-ha1-sts-ha", "は", "ha", "like 'ha'"),
    symbolToSound(ctx, "ja-ha1-sts-hi", "ひ", "hi", "like 'hee'"),

  ],
};

export const MOCK_LESSON_JA_M1_HA_2: LessonContent = {
  id: "ja-m1-ha-2",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ha-row — Intro 2",
  description: "Add ふ ('fu', soft) and へ. Build boat.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["fune"],
  steps: [

    symbolIntro("ja-ha2-intro-fu", "ふ", "fu", "/ɸɯ/", "soft 'foo' — almost a whisper", "ふね (boat)",
      "Top teeth do NOT touch your bottom lip. It's a blown puff, not an English 'f'."),
    traceTwice("ja-ha2-trace-fu", "ふ", "fu", "soft 'foo'"),
    recognition(ctx, "ja-ha2-recog-fu", "ふ", "fu", "soft 'foo'"),

    symbolIntro("ja-ha2-intro-he", "へ", "he", "/he/", "like 'he' in 'help'", ""),
    traceTwice("ja-ha2-trace-he", "へ", "he", "like 'he' in 'help'"),
    recognition(ctx, "ja-ha2-recog-he", "へ", "he", "like 'help'"),

    wordImageMcq(ctx, "ja-ha2-mcq-fune", "ふね"),
    listeningBuild(ctx, "ja-ha2-build-fune", "ふね", "boat"),

    listeningComp("ja-ha2-lc-hito", "ひと", "hito", "person",
      ["boat", "cat", "moon"]),
    listeningComp("ja-ha2-lc-fune", "ふね", "fune", "boat",
      ["person", "star", "song"]),

    symbolToSound(ctx, "ja-ha2-sts-fu", "ふ", "fu", "soft 'foo'"),
    symbolToSound(ctx, "ja-ha2-sts-he", "へ", "he", "like 'help'"),

  ],
};

export const MOCK_LESSON_JA_M1_HA_3: LessonContent = {
  id: "ja-m1-ha-3",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ha-row — Review",
  description: "Last kana (ほ), build star, sweep + speak.",
  estimatedMinutes: 5, xpReward: 12,
  introducesVocabIds: ["hoshi"],
  steps: [

    symbolIntro("ja-ha3-intro-ho", "ほ", "ho", "/ho/", "like 'ho' in 'hope'", "ほし (star)"),
    traceTwice("ja-ha3-trace-ho", "ほ", "ho", "like 'ho' in 'hope'"),
    recognition(ctx, "ja-ha3-recog-ho", "ほ", "ho", "like 'ho'"),

    wordImageMcq(ctx, "ja-ha3-mcq-hoshi", "ほし"),
    listeningBuild(ctx, "ja-ha3-build-hoshi", "ほし", "star"),

    // Single representative row-sweep recog — the row-test that follows
    // covers the full 5-kana sweep.
    recognition(ctx, "ja-ha3-rev-fu", "ふ", "fu", "soft 'foo'"),

    wordImageMcq(ctx, "ja-ha3-mcq-rev-fune", "ふね"),

    speaking("ja-ha3-speak-hito",  "ひと", "person"),
    speaking("ja-ha3-speak-fune",  "ふね", "boat"),
    listeningComp("ja-ha3-lc-hito", "ひと", "hito", "person",
      ["boat", "star", "cat"]),
    speaking("ja-ha3-speak-hoshi", "ほし", "star"),

    // ─── Sentence sprinkle (M1 desu/ka — Spencer 2026-05-17) ───
    {
      id: "ja-ha3-build-hoshi-desu",
      type: "build_sentence",
      prompt: "Build: 'It's a star.'",
      targetSentence: "ほし です",
      tiles: ["ほし", "です", "ひと", "ですか"],
      correctOrder: ["ほし", "です"],
      granularity: "word",
      audioKey: "ほし です",
      targetAnnotation: [{ surface: "ほし です", reading: "ほし です" }],
    },
    speaking("ja-ha3-speak-hoshi-desu", "ほし です", "It's a star."),

    // R2-defer-F prior-row review tail — vowels + ka + sa + ta + na pool.
    ...priorRowReviewTail("ha"),

  ],
};
