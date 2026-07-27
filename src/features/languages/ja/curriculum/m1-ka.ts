import type { LessonContent } from "@/features/lesson/types";
import {
  type RowContext,
  symbolIntro, traceTwice, recognition, symbolToSound,
  wordImageMcq, listeningBuild, speaking, listeningComp,
  priorRowReviewTail,
} from "@/features/languages/ja/curriculum/_consonantRowHelpers";

/**
 * Ka-row: か き く け こ — three sub-lessons (~13 min).
 *
 * Refactored 2026-05-16 from the older 5+2+test (3 dots) layout to the
 * standard 2+2+1 pattern shared by every other consonant
 * row. Each sub-lesson introduces ~2 kana plus 1 anchor word:
 *
 *   1/3 — か + き + かい (shell)
 *   2/3 — く + け + いけ (pond)
 *   3/3 — こ + こえ (voice) + full-row review + speaking
 *
 * The row's other two anchor words (かお, えき) stay in the row-level
 * anchor pool for the recap queue and surface in this file as cumulative
 * wordImageMcq / listening_comp / speaking targets within sub-3 — they
 * just don't get a dedicated build step.
 *
 * Anchor words are all PURE ka+vowel — the user never sees an
 * unintroduced kana on a word card.
 *
 * Speaking targets (2-mora each, fits Whisper's short-tier 30/15
 * threshold per moraTiers.ts): かお, いけ, こえ.
 */

const ctx: RowContext = {
  allKana: [
    { symbol: "か", romaji: "ka" },
    { symbol: "き", romaji: "ki" },
    { symbol: "く", romaji: "ku" },
    { symbol: "け", romaji: "ke" },
    { symbol: "こ", romaji: "ko" },
  ],
  words: [
    { kana: "かい", meaningEn: "shell",   emoji: "🐚" },
    // BUG-C 2026-05-18: no emoji for "pond". Word stays for build /
    // listening / lc steps; visual MCQ helpers skip it via the optional
    // `emoji?` path.
    { kana: "いけ", meaningEn: "pond" },
    { kana: "かお", meaningEn: "face",    emoji: "😀" },
    { kana: "こえ", meaningEn: "voice",   emoji: "🗣️" },
    { kana: "えき", meaningEn: "station", emoji: "🚉" },
  ],
  // ka is the first consonant row — only vowels and the ka-kana
  // themselves are available as tile decoys.
  tileBankPool: [
    "あ", "い", "う", "え", "お",
  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 1/4 — meet か + き, build かい (shell)
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_KA_1: LessonContent = {
  id: "ja-m1-ka-1",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ka-row — Intro 1",
  description: "Meet か and き. Build shell — your first consonant word.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["kai"],
  steps: [

    symbolIntro("ja-ka1-intro-ka", "か", "ka", "/ka/", "like 'ka' in 'car'", "かい (shell)"),
    traceTwice("ja-ka1-trace-ka", "か", "ka", "like 'ka' in 'car'"),
    recognition(ctx, "ja-ka1-recog-ka", "か", "ka", "like 'ka' in 'car'"),

    symbolIntro("ja-ka1-intro-ki", "き", "ki", "/ki/", "like 'kee' in 'key'", "かい (shell)"),
    traceTwice("ja-ka1-trace-ki", "き", "ki", "like 'kee' in 'key'"),
    recognition(ctx, "ja-ka1-recog-ki", "き", "ki", "like 'kee' in 'key'"),

    wordImageMcq(ctx, "ja-ka1-mcq-kai", "かい"),
    listeningBuild(ctx, "ja-ka1-build-kai", "かい", "shell"),

    symbolToSound(ctx, "ja-ka1-sts-ka", "か", "ka", "like 'ka'"),
    symbolToSound(ctx, "ja-ka1-sts-ki", "き", "ki", "like 'kee'"),

    // Review tail — two retrieval reps from the vowels row (kana has no
    // SRS; in-lesson interleave is its only look-back channel). Mirrors
    // the generated rows' tails in lessonBuilder.
    recognition(ctx, "ja-ka1-rev-a", "あ", "a", "like 'a' in 'father'"),
    recognition(ctx, "ja-ka1-rev-i", "い", "i", "like 'ee' in 'see'"),
    recognition(ctx, "ja-ka1-rev-e", "え", "e", "like 'e' in 'egg'"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 2/4 — meet く + け, build いけ (pond)
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_KA_2: LessonContent = {
  id: "ja-m1-ka-2",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ka-row — Intro 2",
  description: "Add く and け. Build pond.",
  estimatedMinutes: 4, xpReward: 10,
  introducesVocabIds: ["ike"],
  steps: [

    symbolIntro("ja-ka2-intro-ku", "く", "ku", "/kɯ/", "like 'koo' in 'cuckoo'", "いけ (pond)"),
    traceTwice("ja-ka2-trace-ku", "く", "ku", "like 'koo' in 'cuckoo'"),
    recognition(ctx, "ja-ka2-recog-ku", "く", "ku", "like 'koo' in 'cuckoo'"),

    symbolIntro("ja-ka2-intro-ke", "け", "ke", "/ke/", "like 'ke' in 'kept'", "いけ (pond)"),
    traceTwice("ja-ka2-trace-ke", "け", "ke", "like 'ke' in 'kept'"),
    recognition(ctx, "ja-ka2-recog-ke", "け", "ke", "like 'ke' in 'kept'"),

    // いけ has no usable image (BUG-C) — introduce via listening-comp
    // primer (audio → meaning, same pattern as こえ in sub-3) BEFORE the
    // build so the learner never spells an unintroduced word.
    listeningComp("ja-ka2-lc-ike", "いけ", "ike", "pond",
      ["shell", "station", "face"]),
    listeningBuild(ctx, "ja-ka2-build-ike", "いけ", "pond"),

    listeningComp("ja-ka2-lc-kai", "かい", "kai", "shell",
      ["pond", "face", "voice"]),

    symbolToSound(ctx, "ja-ka2-sts-ku", "く", "ku", "like 'koo'"),
    symbolToSound(ctx, "ja-ka2-sts-ke", "け", "ke", "like 'kept'"),

    // Review tail — vowels + earlier ka kana (see ka-1 note).
    recognition(ctx, "ja-ka2-rev-u", "う", "u", "like 'oo' in 'food'"),
    symbolToSound(ctx, "ja-ka2-rev-ka", "か", "ka", "like 'ka'"),
    symbolToSound(ctx, "ja-ka2-rev-ki", "き", "ki", "like 'kee'"),

  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 3/4 — meet こ, build こえ, sweep + speak
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_KA_3: LessonContent = {
  id: "ja-m1-ka-3",
  moduleId: "m1", courseId: "mock-1", languageId: "ja",
  title: "Ka-row — Review",
  description:
    "Last kana (こ), build voice, then sweep the whole row — recognition, vocab, and your voice.",
  estimatedMinutes: 5, xpReward: 12,
  introducesVocabIds: ["koe"],
  steps: [

    symbolIntro("ja-ka3-intro-ko", "こ", "ko", "/ko/", "like 'ko' in 'koala'", "こえ (voice)"),
    traceTwice("ja-ka3-trace-ko", "こ", "ko", "like 'ko' in 'koala'"),
    recognition(ctx, "ja-ka3-recog-ko", "こ", "ko", "like 'ko' in 'koala'"),

    // 2026-05-18 audit: こえ ("voice") is image-blocked — 🗣️ reads as
    // "shout/speech," not the abstract "voice." Replaced with a listening
    // comp primer (audio → meaning), then immediate listeningBuild keeps
    // the encode → apply rhythm without leaning on a misleading icon.
    listeningComp("ja-ka3-mcq-koe", "こえ", "koe", "voice",
      ["face", "shell", "pond"]),
    listeningBuild(ctx, "ja-ka3-build-koe", "こえ", "voice"),

    // Single representative row-sweep recog (け). The remaining four
    // row-kana get re-encountered in the module recap.
    recognition(ctx, "ja-ka3-rev-ke", "け", "ke", "like 'kept'"),

    // Cumulative vocab — surface えき (the row anchor without a dedicated
    // build sub-lesson). かお is left for the module recap.
    wordImageMcq(ctx, "ja-ka3-mcq-eki", "えき"),

    listeningComp("ja-ka3-lc-koe", "こえ", "koe", "voice",
      ["face", "station", "shell"]),

    speaking("ja-ka3-speak-kao", "かお", "face"),
    speaking("ja-ka3-speak-koe", "こえ", "voice"),

    // ─── First-of-type です + か info card (M1 sentence sprinkle, 2026-05-17).
    // Spencer: "introduce desu and ka in the plain hiragana module 1 …
    // dont explain desu and ka much but let them know its there".
    { id: "ja-ka3-info-desu-ka", type: "grammar_rule", title: "です + か — your first sentence",
      rule: "です means 'is/am'. Adding か at the end turns a statement into a question. Just notice them for now — no need to memorize yet.",
      examples: [
        { ja: "かお です", romaji: "kao desu", en: "It's a face." },
        { ja: "かお ですか", romaji: "kao desu ka", en: "Is it a face?" },
      ] },

    // Build a sentence: かお です = "it's a face".
    {
      id: "ja-ka3-build-kao-desu",
      type: "build_sentence",
      prompt: "Build: 'It's a face.'",
      targetSentence: "かお です",
      tiles: ["かお", "です", "こえ", "ですか"],
      correctOrder: ["かお", "です"],
      granularity: "word",
      audioKey: "かお です",
      targetAnnotation: [{ surface: "かお です", reading: "かお です" }],
    },
    // Speak it out loud.
    speaking("ja-ka3-speak-kao-desu", "かお です", "It's a face."),

    // R2-defer-F prior-row review tail — vowels only at this point.
    // Interleaved kana + word retrieval before the closing win card so
    // the learner's last working interaction is recall, not exposition.
    ...priorRowReviewTail("ka"),

  ],
};
