import type { LessonContent, LessonStep } from "../types";
import { getTtsUrl } from "@/shared/japanese/tts";

/**
 * Vowels: あ い う え お — two sub-lessons (~10 minutes total).
 *
 * Structure (2026-05-16 R2):
 *   1/2 — per vowel: intro → trace (min 2 passes, one card) → recognition
 *         (audio→kana, preview-on-tap kana buttons). Interleaved with
 *         listening_build word introductions (あい, いえ, あおい, うえ).
 *         Final round: symbol_to_sound (kana→romaji) per vowel — harder
 *         direction, comes after recognition is solid.
 *   2/2 — one trace per vowel, recognition pass-through, listening_build
 *         for the four vowel-only words (incl いいえ), listening_comp on
 *         meanings, final symbol_to_sound round.
 *
 * Why this order: easier progression. Audio→kana (recognition) is more
 * concrete because the user hears the target. Kana→romaji (symbol_to_sound)
 * forces recall from a visual prompt — push it later when the kana is
 * familiar.
 *
 * Conventions:
 *   - All symbol_to_sound + symbol_recognition use the 2026-05-16 revamp:
 *     buttons preview their OWN audio on tap, separate Check button.
 *   - Tile bank for listening_build is vowel-only.
 *   - IDs `ja-m1-l1-1` / `ja-m1-l1-2` match the row-cluster pattern so
 *     they group visually as one row with two progress dots. Review-tail
 *     augmentation is gated by checking the rowId is a real curriculum
 *     row (see `mockLessons.ts`), so these don't accidentally pick up a
 *     tail for the non-existent "l1" row.
 */

const VOWEL_TILES = ["あ", "い", "う", "え", "お"];
const VOWEL_TILES_WITH_DOUBLE_I = ["あ", "い", "い", "う", "え", "お"];

const ALL_VOWELS = [
  { symbol: "あ", romaji: "a" },
  { symbol: "い", romaji: "i" },
  { symbol: "う", romaji: "u" },
  { symbol: "え", romaji: "e" },
  { symbol: "お", romaji: "o" },
];

function pickThreeDistractors(symbol: string) {
  return ALL_VOWELS.filter((v) => v.symbol !== symbol).slice(0, 3);
}

/** Deterministic slot for the correct answer based on id hash. */
function correctSlot(id: string, slots = 4): number {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % slots;
}

/**
 * symbol_to_sound (kana → romaji). User sees kana, taps romaji buttons
 * that preview their OWN kana audio. Harder direction.
 */
function symbolToSound(
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  const correct = ALL_VOWELS.find((v) => v.symbol === symbol)!;
  const distractors = pickThreeDistractors(symbol);
  const slot = correctSlot(id);
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

/**
 * symbol_recognition (audio → kana). User hears the target + sees a
 * romaji prompt, taps kana buttons (each plays its own audio for
 * comparison). Easier direction; comes first.
 */
function recognition(
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  const distractors = pickThreeDistractors(symbol);
  const slot = correctSlot(id);
  const options: { id: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", symbol });
    } else {
      options.push({ id: `opt-${i}`, symbol: distractors[di++].symbol });
    }
  }
  return {
    id,
    type: "symbol_recognition",
    payload: {
      symbol,
      romanization,
      ipa: "",
      hint,
      scriptId: "hiragana",
      hasStrokeOrder: true,
      audioKey: getTtsUrl(symbol) ?? undefined,
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

/**
 * One trace card with minCorrectAttempts=2 — shows "1/2" then "2/2"
 * progress instead of two separate identical cards.
 */
function traceTwice(
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
    minCorrectAttempts: 2,
  };
}

function traceOnce(
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
 * Sub-lesson 1/2 — intro+trace+recognition per vowel, build words inline,
 *                  final symbol_to_sound round.
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_L1A: LessonContent = {
  id: "ja-m1-l1-1",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Vowels — Intro 1",
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

    // a + i pair, then build love
    symbolIntro("ja-l1a-intro-a", "あ", "a", "/a/", "like 'a' in 'father'", "あい (love)"),
    traceTwice("ja-l1a-trace-a", "あ", "a", "like 'a' in 'father'"),
    recognition("ja-l1a-recog-a", "あ", "a", "like 'a' in 'father'"),

    symbolIntro("ja-l1a-intro-i", "い", "i", "/i/", "like 'ee' in 'see'", "いえ (house)"),
    traceTwice("ja-l1a-trace-i", "い", "i", "like 'ee' in 'see'"),
    recognition("ja-l1a-recog-i", "い", "i", "like 'ee' in 'see'"),

    listeningBuild("ja-l1a-build-ai", "あい", "love", VOWEL_TILES),

    // u + e pair, then build house
    symbolIntro("ja-l1a-intro-u", "う", "u", "/ɯ/", "like 'oo' in 'food', lips unrounded", "うえ (above)"),
    traceTwice("ja-l1a-trace-u", "う", "u", "like 'oo' in 'food'"),
    recognition("ja-l1a-recog-u", "う", "u", "like 'oo' in 'food'"),

    symbolIntro("ja-l1a-intro-e", "え", "e", "/e/", "like 'e' in 'bed'", "いえ (house)"),
    traceTwice("ja-l1a-trace-e", "え", "e", "like 'e' in 'bed'"),
    recognition("ja-l1a-recog-e", "え", "e", "like 'e' in 'bed'"),

    listeningBuild("ja-l1a-build-ie", "いえ", "house", VOWEL_TILES),

    // o, then build blue + above
    symbolIntro("ja-l1a-intro-o", "お", "o", "/o/", "like 'o' in 'or'", "あおい (blue)"),
    traceTwice("ja-l1a-trace-o", "お", "o", "like 'o' in 'or'"),
    recognition("ja-l1a-recog-o", "お", "o", "like 'o' in 'or'"),

    listeningBuild("ja-l1a-build-aoi", "あおい", "blue", VOWEL_TILES),
    listeningBuild("ja-l1a-build-ue", "うえ", "above", VOWEL_TILES),

    // Final round — harder direction (kana → romaji). They've drilled
    // recognition all lesson; now flip the prompt.
    symbolToSound("ja-l1a-sts-a", "あ", "a", "like 'a' in 'father'"),
    symbolToSound("ja-l1a-sts-i", "い", "i", "like 'ee' in 'see'"),
    symbolToSound("ja-l1a-sts-u", "う", "u", "like 'oo' in 'food'"),
    symbolToSound("ja-l1a-sts-e", "え", "e", "like 'e' in 'bed'"),
    symbolToSound("ja-l1a-sts-o", "お", "o", "like 'o' in 'or'"),

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
 * Sub-lesson 2/2 — one trace pass, recognition pass, listening_builds
 *                  (adds いいえ), listening_comp, final symbol_to_sound.
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_L1B: LessonContent = {
  id: "ja-m1-l1-2",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Vowels — Intro 2",
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
    traceOnce("ja-l1b-trace-a", "あ", "a", "like 'a' in 'father'"),
    traceOnce("ja-l1b-trace-i", "い", "i", "like 'ee' in 'see'"),
    traceOnce("ja-l1b-trace-u", "う", "u", "like 'oo' in 'food'"),
    traceOnce("ja-l1b-trace-e", "え", "e", "like 'e' in 'bed'"),
    traceOnce("ja-l1b-trace-o", "お", "o", "like 'o' in 'or'"),

    // Recognition pass-through (audio → kana, easier direction first)
    recognition("ja-l1b-recog-a", "あ", "a", "like 'a' in 'father'"),
    recognition("ja-l1b-recog-i", "い", "i", "like 'ee' in 'see'"),
    recognition("ja-l1b-recog-u", "う", "u", "like 'oo' in 'food'"),
    recognition("ja-l1b-recog-e", "え", "e", "like 'e' in 'bed'"),
    recognition("ja-l1b-recog-o", "お", "o", "like 'o' in 'or'"),

    // Four vowel-only word builds (adds いいえ = "no")
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

    // Final symbol_to_sound round — harder direction, kana → romaji
    symbolToSound("ja-l1b-sts-a", "あ", "a", "like 'a' in 'father'"),
    symbolToSound("ja-l1b-sts-i", "い", "i", "like 'ee' in 'see'"),
    symbolToSound("ja-l1b-sts-u", "う", "u", "like 'oo' in 'food'"),
    symbolToSound("ja-l1b-sts-e", "え", "e", "like 'e' in 'bed'"),
    symbolToSound("ja-l1b-sts-o", "お", "o", "like 'o' in 'or'"),

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
