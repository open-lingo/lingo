import type { LessonContent } from "@/features/lesson/types";
import {
  type RowContext,
  symbolIntro, traceTwice, recognition, symbolToSound,
  wordImageMcq, listeningBuild, speaking, listeningComp,
  priorRowReviewTail,
} from "@/features/languages/ja/curriculum/_consonantRowHelpers";

/**
 * Ma-row: ま み む め も — three sub-lessons + auto row-test (~13 min).
 * No quirks. Words: うま (horse), かめ (turtle), もも (peach).
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "ま", romaji: "ma" },
    { symbol: "み", romaji: "mi" },
    { symbol: "む", romaji: "mu" },
    { symbol: "め", romaji: "me" },
    { symbol: "も", romaji: "mo" },
  ],
  words: [
    { kana: "うま", meaningEn: "horse",  emoji: "🐴" },
    { kana: "かめ", meaningEn: "turtle", emoji: "🐢" },
    { kana: "もも", meaningEn: "peach",  emoji: "🍑" },
  ],
  tileBankPool: [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
    "な", "に", "ぬ", "ね", "の",
    "は", "ひ", "ふ", "へ", "ほ",
  ],
};

export const MOCK_LESSON_JA_M1_MA_1: LessonContent = {
  id: "ja-m1-ma-1",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ma-row — Intro 1",
  description: "Meet ま and み. Build horse.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["uma"],
  steps: [
    { id: "ja-ma1-info-0", type: "info", title: "M-sounds, part 1",
      body: "Two clean kana: ま and み. Nothing tricky here.",
      variant: "culture" },

    symbolIntro("ja-ma1-intro-ma", "ま", "ma", "/ma/", "like 'ma' in 'mama'", "うま (horse)"),
    traceTwice("ja-ma1-trace-ma", "ま", "ma", "like 'ma' in 'mama'"),
    recognition(ctx, "ja-ma1-recog-ma", "ま", "ma", "like 'ma'"),

    symbolIntro("ja-ma1-intro-mi", "み", "mi", "/mi/", "like 'mee' in 'meet'", ""),
    traceTwice("ja-ma1-trace-mi", "み", "mi", "like 'mee' in 'meet'"),
    recognition(ctx, "ja-ma1-recog-mi", "み", "mi", "like 'mee'"),

    wordImageMcq(ctx, "ja-ma1-mcq-uma", "うま"),
    listeningBuild(ctx, "ja-ma1-build-uma", "うま", "horse"),

    symbolToSound(ctx, "ja-ma1-sts-ma", "ま", "ma", "like 'ma'"),
    symbolToSound(ctx, "ja-ma1-sts-mi", "み", "mi", "like 'mee'"),

    { id: "ja-ma1-info-end", type: "info", title: "Two down",
      body: "ま and み. Next: む and め.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_MA_2: LessonContent = {
  id: "ja-m1-ma-2",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ma-row — Intro 2",
  description: "Add む and め. Build turtle.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["kame"],
  steps: [
    { id: "ja-ma2-info-0", type: "info", title: "M-sounds, part 2",
      body: "む (like 'moo' but clipped) and め. Then the turtle.",
      variant: "default" },

    symbolIntro("ja-ma2-intro-mu", "む", "mu", "/mɯ/", "like 'moo' (clipped)", ""),
    traceTwice("ja-ma2-trace-mu", "む", "mu", "like 'moo'"),
    recognition(ctx, "ja-ma2-recog-mu", "む", "mu", "like 'moo'"),

    symbolIntro("ja-ma2-intro-me", "め", "me", "/me/", "like 'me' in 'met'", "かめ (turtle)"),
    traceTwice("ja-ma2-trace-me", "め", "me", "like 'me' in 'met'"),
    recognition(ctx, "ja-ma2-recog-me", "め", "me", "like 'met'"),

    wordImageMcq(ctx, "ja-ma2-mcq-kame", "かめ"),
    listeningBuild(ctx, "ja-ma2-build-kame", "かめ", "turtle"),

    listeningComp("ja-ma2-lc-uma",  "うま", "uma",  "horse",
      ["cat", "boat", "mushroom"]),
    listeningComp("ja-ma2-lc-kame", "かめ", "kame", "turtle",
      ["horse", "person", "moon"]),

    symbolToSound(ctx, "ja-ma2-sts-mu", "む", "mu", "like 'moo'"),
    symbolToSound(ctx, "ja-ma2-sts-me", "め", "me", "like 'met'"),

    { id: "ja-ma2-info-end", type: "info", title: "Four down",
      body: "Just も left — and a full-row review with mic practice.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_MA_3: LessonContent = {
  id: "ja-m1-ma-3",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ma-row — Review",
  description: "Last kana (も), build peach, sweep + speak.",
  estimatedMinutes: 5, xpReward: 12,
  introducesVocabIds: ["momo"],
  steps: [
    { id: "ja-ma3-info-0", type: "info", title: "M-sounds, finale",
      body: "Meet も, build a peach, then sweep the row.", variant: "default" },

    symbolIntro("ja-ma3-intro-mo", "も", "mo", "/mo/", "like 'mo' in 'more'", "もも (peach)"),
    traceTwice("ja-ma3-trace-mo", "も", "mo", "like 'mo' in 'more'"),
    recognition(ctx, "ja-ma3-recog-mo", "も", "mo", "like 'mo'"),

    wordImageMcq(ctx, "ja-ma3-mcq-momo", "もも"),
    listeningBuild(ctx, "ja-ma3-build-momo", "もも", "peach"),

    // Single representative row-sweep recog — the row-test that follows
    // covers the full 5-kana sweep.
    recognition(ctx, "ja-ma3-rev-mi", "み", "mi", "like 'mee'"),

    wordImageMcq(ctx, "ja-ma3-mcq-rev-kame", "かめ"),

    { id: "ja-ma3-info-speak", type: "info", title: "Your turn to speak",
      body: "Tap the mic and say each word. Short words = lenient scoring.", variant: "tip" },
    speaking("ja-ma3-speak-uma",  "うま", "horse"),
    speaking("ja-ma3-speak-kame", "かめ", "turtle"),
    wordImageMcq(ctx, "ja-ma3-mcq-rev-momo", "もも"),
    speaking("ja-ma3-speak-momo", "もも", "peach"),

    // ─── Sentence sprinkle (M1 desu/ka — Spencer 2026-05-17) ───
    // Question form again to vary it.
    {
      id: "ja-ma3-build-uma-desu-ka",
      type: "build_sentence",
      prompt: "Build the question: 'Is it a horse?'",
      targetSentence: "うま ですか",
      tiles: ["うま", "ですか", "もも", "です"],
      correctOrder: ["うま", "ですか"],
      granularity: "word",
      audioKey: "うま ですか",
      targetAnnotation: [{ surface: "うま ですか", reading: "うま ですか" }],
    },
    speaking("ja-ma3-speak-uma-desu-ka", "うま ですか", "Is it a horse?"),

    // R2-defer-F prior-row review tail — vowels through ha pool.
    ...priorRowReviewTail("ma"),

    { id: "ja-ma3-info-end", type: "info", title: "Real-world win",
      body: "You can now read もも (peach), うま (horse) — and spot ヤマ ('mountain') in mountain names like Fujiyama, Yamanote, Yokoyama. Halfway through hiragana — nice.",
      variant: "win" },
  ],
};
