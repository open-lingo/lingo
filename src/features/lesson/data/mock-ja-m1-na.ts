import type { LessonContent } from "../types";
import {
  type RowContext,
  symbolIntro, traceTwice, recognition, symbolToSound,
  wordImageMcq, listeningBuild, speaking, listeningComp,
} from "./_consonantRowHelpers";

/**
 * Na-row: な に ぬ ね の — three sub-lessons + auto row-test (~13 min).
 * No phonetic quirks. Words: なに (what), ねこ (cat), きのこ (mushroom).
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "な", romaji: "na" },
    { symbol: "に", romaji: "ni" },
    { symbol: "ぬ", romaji: "nu" },
    { symbol: "ね", romaji: "ne" },
    { symbol: "の", romaji: "no" },
  ],
  words: [
    { kana: "なに",   meaningEn: "what",     emoji: "🤷" },
    { kana: "ねこ",   meaningEn: "cat",      emoji: "🐱" },
    { kana: "きのこ", meaningEn: "mushroom", emoji: "🍄" },
  ],
  tileBankPool: [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
    "た", "ち", "つ", "て", "と",
  ],
};

export const MOCK_LESSON_JA_M1_NA_1: LessonContent = {
  id: "ja-m1-na-1",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Na-row — Intro 1",
  description: "Meet な and に. Build 'what' — your first question word.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["nani"],
  steps: [
    { id: "ja-na1-info-0", type: "info", title: "N-sounds, part 1",
      body: "Two kana that look related: な and に. Build なに (what?) — useful any time you don't catch something.",
      variant: "culture" },

    symbolIntro("ja-na1-intro-na", "な", "na", "/na/", "like 'na' in 'nacho'", "なに (what)"),
    traceTwice("ja-na1-trace-na", "な", "na", "like 'na' in 'nacho'"),
    recognition(ctx, "ja-na1-recog-na", "な", "na", "like 'na'"),

    symbolIntro("ja-na1-intro-ni", "に", "ni", "/ɲi/", "like 'nee' in 'knee'", "なに (what)"),
    traceTwice("ja-na1-trace-ni", "に", "ni", "like 'nee' in 'knee'"),
    recognition(ctx, "ja-na1-recog-ni", "に", "ni", "like 'nee'"),

    wordImageMcq(ctx, "ja-na1-mcq-nani", "なに"),
    listeningBuild(ctx, "ja-na1-build-nani", "なに", "what"),

    symbolToSound(ctx, "ja-na1-sts-na", "な", "na", "like 'na'"),
    symbolToSound(ctx, "ja-na1-sts-ni", "に", "ni", "like 'nee'"),

    { id: "ja-na1-info-end", type: "info", title: "Two down",
      body: "な and に — and you can already ask a question with なに. Next: ぬ and ね.",
      variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_NA_2: LessonContent = {
  id: "ja-m1-na-2",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Na-row — Intro 2",
  description: "Add ぬ and ね. Build cat.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["neko"],
  steps: [
    { id: "ja-na2-info-0", type: "info", title: "N-sounds, part 2",
      body: "ぬ (rare in modern usage but you'll see it) and ね. The cat is on its way.",
      variant: "default" },

    symbolIntro("ja-na2-intro-nu", "ぬ", "nu", "/nɯ/", "like 'noo' (slightly clipped)", ""),
    traceTwice("ja-na2-trace-nu", "ぬ", "nu", "like 'noo'"),
    recognition(ctx, "ja-na2-recog-nu", "ぬ", "nu", "like 'noo'"),

    symbolIntro("ja-na2-intro-ne", "ね", "ne", "/ne/", "like 'ne' in 'net'", "ねこ (cat)"),
    traceTwice("ja-na2-trace-ne", "ね", "ne", "like 'ne' in 'net'"),
    recognition(ctx, "ja-na2-recog-ne", "ね", "ne", "like 'net'"),

    wordImageMcq(ctx, "ja-na2-mcq-neko", "ねこ"),
    listeningBuild(ctx, "ja-na2-build-neko", "ねこ", "cat"),

    listeningComp("ja-na2-lc-nani", "なに", "nani", "what",
      ["cat", "song", "clock"]),
    listeningComp("ja-na2-lc-neko", "ねこ", "neko", "cat",
      ["mushroom", "what", "moon"]),

    symbolToSound(ctx, "ja-na2-sts-nu", "ぬ", "nu", "like 'noo'"),
    symbolToSound(ctx, "ja-na2-sts-ne", "ね", "ne", "like 'net'"),

    { id: "ja-na2-info-end", type: "info", title: "Four down",
      body: "Just の left — and a full-row review with mic practice.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_NA_3: LessonContent = {
  id: "ja-m1-na-3",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Na-row — Review",
  description: "Last kana (の), build mushroom, sweep + speak.",
  estimatedMinutes: 5, xpReward: 12,
  introducesVocabIds: ["kinoko"],
  steps: [
    { id: "ja-na3-info-0", type: "info", title: "N-sounds, finale",
      body: "Meet の (you'll see it everywhere — Japanese has a particle pronounced 'no' that owns half the language). Then sweep the row.",
      variant: "default" },

    symbolIntro("ja-na3-intro-no", "の", "no", "/no/", "like 'no' in 'note'", "きのこ (mushroom)"),
    traceTwice("ja-na3-trace-no", "の", "no", "like 'no' in 'note'"),
    recognition(ctx, "ja-na3-recog-no", "の", "no", "like 'no'"),

    wordImageMcq(ctx, "ja-na3-mcq-kinoko", "きのこ"),
    listeningBuild(ctx, "ja-na3-build-kinoko", "きのこ", "mushroom"),

    // Single representative row-sweep recog — the row-test that follows
    // covers the full 5-kana sweep.
    recognition(ctx, "ja-na3-rev-ne", "ね", "ne", "like 'net'"),

    wordImageMcq(ctx, "ja-na3-mcq-rev-neko", "ねこ"),

    { id: "ja-na3-info-speak", type: "info", title: "Your turn to speak",
      body: "Tap the mic and say each word. Short words = lenient scoring.", variant: "tip" },
    speaking("ja-na3-speak-nani",   "なに",   "what"),
    speaking("ja-na3-speak-neko",   "ねこ",   "cat"),
    speaking("ja-na3-speak-kinoko", "きのこ", "mushroom"),

    // ─── Sentence sprinkle (M1 desu/ka — Spencer 2026-05-17) ───
    // Question form this time: ねこ ですか = "Is it a cat?"
    {
      id: "ja-na3-build-neko-desu-ka",
      type: "build_sentence",
      prompt: "Build the question: 'Is it a cat?'",
      targetSentence: "ねこ ですか",
      tiles: ["ねこ", "ですか", "です", "なに"],
      correctOrder: ["ねこ", "ですか"],
      granularity: "word",
      audioKey: "ねこ ですか",
      targetAnnotation: [{ surface: "ねこ ですか", reading: "ねこ ですか" }],
    },
    speaking("ja-na3-speak-neko-desu-ka", "ねこ ですか", "Is it a cat?"),

    { id: "ja-na3-info-end", type: "info", title: "Real-world win",
      body: "You can now read ねこ (cat), なに (what) — and spot ナマエ ('name') in the name-field on every Japanese form. Up next — ha row.",
      variant: "win" },
  ],
};
