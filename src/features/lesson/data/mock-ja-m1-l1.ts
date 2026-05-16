import type { LessonContent, LessonStep } from "../types";

/**
 * Vowels: あ い う え お — two sub-lessons (~10 minutes total).
 *
 * Restructured per Spencer's 2026-05-16 spec:
 *   1/2 — intro + trace + symbol_to_sound for each vowel, interleaved
 *         with listening_build word introductions (あい, いえ, あおい,
 *         うえ) and a final symbol_to_sound pass for each vowel.
 *   2/2 — one trace per vowel, symbol_to_sound pass-through, listening_build
 *         for the four vowel-only words (あおい, いえ, うえ, いいえ),
 *         listening_comprehension on those meanings, and a final
 *         symbol_to_sound round.
 *
 * Conventions:
 *   - All symbol_to_sound use the 2026-05-16 revamp: the displayed kana
 *     has no Play button; buttons preview their OWN kana audio on tap.
 *     Each option carries `symbol` so the renderer can play TTS.
 *   - listening_build uses a vowel-only tile bank (5 tiles, or 6 for
 *     いいえ which needs a duplicate い).
 *   - We keep IDs `ja-m1-l1a` / `ja-m1-l1b` distinct from the row pattern
 *     (`ja-m1-{row}-{suffix}`) so the rowIdOf regex doesn't append a
 *     review tail to them — these are root-of-curriculum lessons.
 */

const VOWEL_TILES = ["あ", "い", "う", "え", "お"];
const VOWEL_TILES_WITH_DOUBLE_I = ["あ", "い", "い", "う", "え", "お"];

function symbolToSound(
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  // 2x2 grid; correct + 3 vowel distractors.
  const allVowels = [
    { symbol: "あ", romaji: "a" },
    { symbol: "い", romaji: "i" },
    { symbol: "う", romaji: "u" },
    { symbol: "え", romaji: "e" },
    { symbol: "お", romaji: "o" },
  ];
  const correct = allVowels.find((v) => v.symbol === symbol)!;
  // Pick three distractors deterministically so distractor placement is
  // stable across resumes / pathway visits.
  const distractors = allVowels.filter((v) => v.symbol !== symbol).slice(0, 3);
  // Seeded placement: rotate correct into a deterministic slot via id-hash.
  const slot =
    (id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 4);
  const options: { id: string; text: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", text: correct.romaji, symbol: correct.symbol });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, text: d.romaji, symbol: d.symbol });
    }
  }
  return {
    id,
    type: "symbol_to_sound",
    payload: {
      symbol,
      romanization,
      ipa: "",
      hint,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
    options,
    correctOptionId: "correct",
  };
}

function symbolIntro(
  id: string,
  symbol: string,
  romanization: string,
  ipa: string,
  hint: string,
  example: string,
): LessonStep {
  return {
    id,
    type: "symbol_intro",
    payload: {
      symbol,
      romanization,
      ipa,
      hint,
      example,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
  };
}

function trace(
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  return {
    id,
    type: "symbol_trace",
    payload: {
      symbol,
      romanization,
      ipa: "",
      hint,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
    showGuide: true,
    minCorrectAttempts: 1,
  };
}

function listeningBuild(
  id: string,
  word: string,
  meaning: string,
  tiles: string[],
): LessonStep {
  return {
    id,
    type: "listening_build",
    audioKey: word,
    prompt: `Listen and build the word for '${meaning}'`,
    targetSentence: word,
    tiles,
    correctOrder: Array.from(word),
    granularity: "character",
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 1/2 — a/i, build love, u/e, build house, o, build blue/above,
 *                  final symbol_to_sound round per vowel.
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_L1A: LessonContent = {
  id: "ja-m1-l1a",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Vowels 1 of 2: あ い う え お",
  description:
    "Meet the five Japanese vowels and your first words: love, house, blue, above.",
  estimatedMinutes: 5,
  xpReward: 12,
  introducesVocabIds: ["ai", "ie", "ue", "aoi"],
  steps: [
    {
      id: "ja-l1a-info-0",
      type: "info",
      title: "Welcome to Japanese!",
      body:
        "You'll learn the five vowels — あ い う え お — and your first four words built from them. Trace each kana, find its sound, then assemble words you hear.",
      variant: "culture",
    },

    // a + i pair
    symbolIntro("ja-l1a-intro-a", "あ", "a", "/a/", "like 'a' in 'father'", "あい (love)"),
    trace("ja-l1a-trace-a-1", "あ", "a", "like 'a' in 'father'"),
    trace("ja-l1a-trace-a-2", "あ", "a", "like 'a' in 'father'"),
    symbolToSound("ja-l1a-sts-a-1", "あ", "a", "like 'a' in 'father'"),

    symbolIntro("ja-l1a-intro-i", "い", "i", "/i/", "like 'ee' in 'see'", "いえ (house)"),
    trace("ja-l1a-trace-i-1", "い", "i", "like 'ee' in 'see'"),
    trace("ja-l1a-trace-i-2", "い", "i", "like 'ee' in 'see'"),
    symbolToSound("ja-l1a-sts-i-1", "い", "i", "like 'ee' in 'see'"),

    listeningBuild("ja-l1a-build-ai", "あい", "love", VOWEL_TILES),

    // u + e pair
    symbolIntro("ja-l1a-intro-u", "う", "u", "/ɯ/", "like 'oo' in 'food', lips unrounded", "うえ (above)"),
    trace("ja-l1a-trace-u-1", "う", "u", "like 'oo' in 'food'"),
    trace("ja-l1a-trace-u-2", "う", "u", "like 'oo' in 'food'"),
    symbolToSound("ja-l1a-sts-u-1", "う", "u", "like 'oo' in 'food'"),

    symbolIntro("ja-l1a-intro-e", "え", "e", "/e/", "like 'e' in 'bed'", "いえ (house)"),
    trace("ja-l1a-trace-e-1", "え", "e", "like 'e' in 'bed'"),
    trace("ja-l1a-trace-e-2", "え", "e", "like 'e' in 'bed'"),
    symbolToSound("ja-l1a-sts-e-1", "え", "e", "like 'e' in 'bed'"),

    listeningBuild("ja-l1a-build-ie", "いえ", "house", VOWEL_TILES),

    // o solo + the two o-anchored words
    symbolIntro("ja-l1a-intro-o", "お", "o", "/o/", "like 'o' in 'or'", "あおい (blue)"),
    trace("ja-l1a-trace-o-1", "お", "o", "like 'o' in 'or'"),
    trace("ja-l1a-trace-o-2", "お", "o", "like 'o' in 'or'"),
    symbolToSound("ja-l1a-sts-o-1", "お", "o", "like 'o' in 'or'"),

    listeningBuild("ja-l1a-build-aoi", "あおい", "blue", VOWEL_TILES),
    listeningBuild("ja-l1a-build-ue", "うえ", "above", VOWEL_TILES),

    // Final symbol_to_sound round — one more for each vowel
    symbolToSound("ja-l1a-sts-a-2", "あ", "a", "like 'a' in 'father'"),
    symbolToSound("ja-l1a-sts-i-2", "い", "i", "like 'ee' in 'see'"),
    symbolToSound("ja-l1a-sts-u-2", "う", "u", "like 'oo' in 'food'"),
    symbolToSound("ja-l1a-sts-e-2", "え", "e", "like 'e' in 'bed'"),
    symbolToSound("ja-l1a-sts-o-2", "お", "o", "like 'o' in 'or'"),

    {
      id: "ja-l1a-info-end",
      type: "info",
      title: "Halfway through vowels",
      body:
        "Nice — you've met all five vowels and built four words. The next sub-lesson reinforces them.",
      variant: "default",
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 2/2 — one trace + MC pass per vowel, listening_build for
 *                  the four vowel-only words (adding いいえ), listening_comp
 *                  on meanings, and a final symbol_to_sound round.
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_L1B: LessonContent = {
  id: "ja-m1-l1b",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Vowels 2 of 2: reinforce",
  description:
    "Trace each vowel one more time, build four vowel-only words, and lock in the meanings.",
  estimatedMinutes: 5,
  xpReward: 12,
  introducesVocabIds: ["iie"],
  steps: [
    {
      id: "ja-l1b-info-0",
      type: "info",
      title: "Vowels — round 2",
      body:
        "One more pass through each vowel, then four words to build: 'blue', 'house', 'above', and 'no'.",
      variant: "default",
    },

    // One trace per vowel
    trace("ja-l1b-trace-a", "あ", "a", "like 'a' in 'father'"),
    trace("ja-l1b-trace-i", "い", "i", "like 'ee' in 'see'"),
    trace("ja-l1b-trace-u", "う", "u", "like 'oo' in 'food'"),
    trace("ja-l1b-trace-e", "え", "e", "like 'e' in 'bed'"),
    trace("ja-l1b-trace-o", "お", "o", "like 'o' in 'or'"),

    // Symbol_to_sound pass-through
    symbolToSound("ja-l1b-sts-a-1", "あ", "a", "like 'a' in 'father'"),
    symbolToSound("ja-l1b-sts-i-1", "い", "i", "like 'ee' in 'see'"),
    symbolToSound("ja-l1b-sts-u-1", "う", "u", "like 'oo' in 'food'"),
    symbolToSound("ja-l1b-sts-e-1", "え", "e", "like 'e' in 'bed'"),
    symbolToSound("ja-l1b-sts-o-1", "お", "o", "like 'o' in 'or'"),

    // Four vowel-only word builds (adds いいえ = "no" — vowel-only, no verbs)
    listeningBuild("ja-l1b-build-aoi", "あおい", "blue", VOWEL_TILES),
    listeningBuild("ja-l1b-build-ie", "いえ", "house", VOWEL_TILES),
    listeningBuild("ja-l1b-build-ue", "うえ", "above", VOWEL_TILES),
    listeningBuild("ja-l1b-build-iie", "いいえ", "no", VOWEL_TILES_WITH_DOUBLE_I),

    // Listening comprehension — hear the word, pick its meaning
    {
      id: "ja-l1b-lc-aoi",
      type: "listening_comprehension",
      audioKey: "あおい",
      transcript: "あおい",
      romaji: "aoi",
      question: "What does this word mean?",
      options: [
        { id: "a", text: "blue" },
        { id: "b", text: "love" },
        { id: "c", text: "house" },
        { id: "d", text: "above" },
      ],
      correctOptionId: "a",
      transcriptAnnotation: [{ surface: "あおい", reading: "あおい" }],
    },
    {
      id: "ja-l1b-lc-ie",
      type: "listening_comprehension",
      audioKey: "いえ",
      transcript: "いえ",
      romaji: "ie",
      question: "What does this word mean?",
      options: [
        { id: "a", text: "house" },
        { id: "b", text: "above" },
        { id: "c", text: "blue" },
        { id: "d", text: "no" },
      ],
      correctOptionId: "a",
      transcriptAnnotation: [{ surface: "いえ", reading: "いえ" }],
    },
    {
      id: "ja-l1b-lc-ue",
      type: "listening_comprehension",
      audioKey: "うえ",
      transcript: "うえ",
      romaji: "ue",
      question: "What does this word mean?",
      options: [
        { id: "a", text: "above" },
        { id: "b", text: "house" },
        { id: "c", text: "love" },
        { id: "d", text: "blue" },
      ],
      correctOptionId: "a",
      transcriptAnnotation: [{ surface: "うえ", reading: "うえ" }],
    },
    {
      id: "ja-l1b-lc-iie",
      type: "listening_comprehension",
      audioKey: "いいえ",
      transcript: "いいえ",
      romaji: "iie",
      question: "What does this word mean?",
      options: [
        { id: "a", text: "no" },
        { id: "b", text: "house" },
        { id: "c", text: "blue" },
        { id: "d", text: "love" },
      ],
      correctOptionId: "a",
      transcriptAnnotation: [{ surface: "いいえ", reading: "いいえ" }],
    },

    // Final symbol_to_sound round — pick X one last time
    symbolToSound("ja-l1b-sts-a-final", "あ", "a", "like 'a' in 'father'"),
    symbolToSound("ja-l1b-sts-i-final", "い", "i", "like 'ee' in 'see'"),
    symbolToSound("ja-l1b-sts-u-final", "う", "u", "like 'oo' in 'food'"),
    symbolToSound("ja-l1b-sts-e-final", "え", "e", "like 'e' in 'bed'"),
    symbolToSound("ja-l1b-sts-o-final", "お", "o", "like 'o' in 'or'"),

    {
      id: "ja-l1b-info-end",
      type: "info",
      title: "Vowels complete!",
      body:
        "Five vowels mastered. Five words: あい, いえ, うえ, あおい, いいえ. Next: consonants.",
      variant: "default",
    },
  ],
};
