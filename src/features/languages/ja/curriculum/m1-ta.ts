import type { LessonContent } from "@/features/lesson/types";
import {
  type RowContext,
  symbolIntro, traceTwice, recognition, symbolToSound,
  wordImageMcq, listeningBuild, speaking, listeningComp,
  priorRowReviewTail,
} from "@/features/lesson/data/_consonantRowHelpers";

/**
 * Ta-row: た ち つ て と — three sub-lessons + auto row-test (~13 min).
 * Quirks: ち = 'chi', つ = 'tsu'. た, て, と follow the pattern.
 * Words: うた (song), つき (moon), とけい (clock).
 * Speaking targets: うた, つき, とけい — all 2-3 mora, Whisper-friendly.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "た", romaji: "ta" },
    { symbol: "ち", romaji: "chi" },
    { symbol: "つ", romaji: "tsu" },
    { symbol: "て", romaji: "te" },
    { symbol: "と", romaji: "to" },
  ],
  words: [
    { kana: "うた",   meaningEn: "song",  emoji: "🎵" },
    { kana: "つき",   meaningEn: "moon",  emoji: "🌙" },
    { kana: "とけい", meaningEn: "clock", emoji: "⏰" },
  ],
  tileBankPool: [
    "あ", "い", "う", "え", "お",
    "か", "き", "く", "け", "こ",
    "さ", "し", "す", "せ", "そ",
  ],
};

export const MOCK_LESSON_JA_M1_TA_1: LessonContent = {
  id: "ja-m1-ta-1",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ta-row — Intro 1",
  description: "Meet た and ち (pronounced 'chi'). Build song.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["uta"],
  steps: [
    { id: "ja-ta1-info-0", type: "info", title: "T-sounds, part 1",
      body: "Two new kana: た and ち. Trace them, build a song, then on to つ + て.",
      variant: "culture" },

    symbolIntro("ja-ta1-intro-ta", "た", "ta", "/ta/", "like 'ta' in 'taco'", "うた (song)"),
    traceTwice("ja-ta1-trace-ta", "た", "ta", "like 'ta' in 'taco'"),
    recognition(ctx, "ja-ta1-recog-ta", "た", "ta", "like 'ta' in 'taco'"),

    symbolIntro("ja-ta1-intro-chi", "ち", "chi", "/tɕi/", "like 'chee' in 'cheese'", "うた (song)",
      "Pronounced 'chi', not 'ki'."),
    traceTwice("ja-ta1-trace-chi", "ち", "chi", "like 'chee' in 'cheese'"),
    recognition(ctx, "ja-ta1-recog-chi", "ち", "chi", "like 'chee' in 'cheese'"),

    wordImageMcq(ctx, "ja-ta1-mcq-uta", "うた"),
    listeningBuild(ctx, "ja-ta1-build-uta", "うた", "song"),

    symbolToSound(ctx, "ja-ta1-sts-ta", "た", "ta", "like 'ta'"),
    symbolToSound(ctx, "ja-ta1-sts-chi", "ち", "chi", "like 'chee'"),

    { id: "ja-ta1-info-end", type: "info", title: "Two down",
      body: "た and ち are yours. Next: つ and て.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_TA_2: LessonContent = {
  id: "ja-m1-ta-2",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ta-row — Intro 2",
  description: "Add つ ('tsu') and て. Build moon.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["tsuki"],
  steps: [
    { id: "ja-ta2-info-0", type: "info", title: "T-sounds, part 2",
      body: "つ is the tricky one — 'ts' + 'oo', no exact English equivalent. て is straightforward.",
      variant: "default" },

    symbolIntro("ja-ta2-intro-tsu", "つ", "tsu", "/tsɯ/", "'ts' as in 'cats' + 'oo'", "つき (moon)",
      "Closest English: 'tsoo'. Listen and mimic — your mouth learns faster than your eye."),
    traceTwice("ja-ta2-trace-tsu", "つ", "tsu", "like 'tsoo'"),
    recognition(ctx, "ja-ta2-recog-tsu", "つ", "tsu", "like 'tsoo'"),

    symbolIntro("ja-ta2-intro-te", "て", "te", "/te/", "like 'te' in 'ten'", ""),
    traceTwice("ja-ta2-trace-te", "て", "te", "like 'te' in 'ten'"),
    recognition(ctx, "ja-ta2-recog-te", "て", "te", "like 'te' in 'ten'"),

    wordImageMcq(ctx, "ja-ta2-mcq-tsuki", "つき"),
    listeningBuild(ctx, "ja-ta2-build-tsuki", "つき", "moon"),

    listeningComp("ja-ta2-lc-uta", "うた", "uta", "song",
      ["moon", "shell", "morning"]),
    listeningComp("ja-ta2-lc-tsuki", "つき", "tsuki", "moon",
      ["song", "clock", "sky"]),

    symbolToSound(ctx, "ja-ta2-sts-tsu", "つ", "tsu", "like 'tsoo'"),
    symbolToSound(ctx, "ja-ta2-sts-te", "て", "te", "like 'ten'"),

    { id: "ja-ta2-info-end", type: "info", title: "Four down",
      body: "Just と left — and a full-row review with mic practice.", variant: "default" },
  ],
};

export const MOCK_LESSON_JA_M1_TA_3: LessonContent = {
  id: "ja-m1-ta-3",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ta-row — Review",
  description: "Last kana (と), one more word, then sweep + speak.",
  estimatedMinutes: 5, xpReward: 12,
  introducesVocabIds: ["tokei"],
  steps: [
    { id: "ja-ta3-info-0", type: "info", title: "T-sounds, finale",
      body: "Meet と, learn one more word, then check the whole row — recognition, vocab, and your voice.",
      variant: "default" },

    symbolIntro("ja-ta3-intro-to", "と", "to", "/to/", "like 'to' in 'toe'", "とけい (clock)"),
    traceTwice("ja-ta3-trace-to", "と", "to", "like 'to' in 'toe'"),
    recognition(ctx, "ja-ta3-recog-to", "と", "to", "like 'to' in 'toe'"),

    wordImageMcq(ctx, "ja-ta3-mcq-tokei", "とけい"),
    listeningBuild(ctx, "ja-ta3-build-tokei", "とけい", "clock"),

    // Single representative row-sweep recog — the row-test that follows
    // covers the full 5-kana sweep.
    recognition(ctx, "ja-ta3-rev-chi", "ち", "chi", "like 'chee'"),

    wordImageMcq(ctx, "ja-ta3-mcq-rev-tsuki", "つき"),

    { id: "ja-ta3-info-speak", type: "info", title: "Your turn to speak",
      body: "Tap the mic and say each word. Short words = lenient scoring.", variant: "tip" },
    speaking("ja-ta3-speak-uta",   "うた",   "song"),
    speaking("ja-ta3-speak-tsuki", "つき",   "moon"),
    listeningComp("ja-ta3-lc-uta", "うた", "uta", "song",
      ["moon", "clock", "sushi"]),
    speaking("ja-ta3-speak-tokei", "とけい", "clock"),

    // ─── Sentence sprinkle (M1 desu/ka — Spencer 2026-05-17) ───
    {
      id: "ja-ta3-build-tsuki-desu",
      type: "build_sentence",
      prompt: "Build: 'It's the moon.'",
      targetSentence: "つき です",
      tiles: ["つき", "です", "うた", "ですか"],
      correctOrder: ["つき", "です"],
      granularity: "word",
      audioKey: "つき です",
      targetAnnotation: [{ surface: "つき です", reading: "つき です" }],
    },
    speaking("ja-ta3-speak-tsuki-desu", "つき です", "It's the moon."),

    // R2-defer-F prior-row review tail — vowels + ka + sa pool.
    ...priorRowReviewTail("ta"),

    { id: "ja-ta3-info-end", type: "info", title: "Real-world win",
      body: "You can now read うた (song), つき (moon) — and spot タカ (hawk) on falconry signs at any Japanese shrine. Up next — na row.",
      variant: "win" },
  ],
};
