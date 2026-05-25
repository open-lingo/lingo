import type { LessonContent, LessonStep } from "../types";
import { getTtsUrl } from "@/shared/japanese/tts";
import { correctSlot, listeningComp, speaking } from "./_consonantRowHelpers";
import { assertNoConsecutiveSame } from "./_jaGrammarHelpers";

/**
 * Vowels: あ い う え お — three sub-lessons (~18 steps each, ~15 minutes total).
 *
 * Structure (2026-05-24 R4 — expanded to 3 sub-lessons):
 *   1/3 — Introduce あ い う: symbolIntro → traceTwice → immediate retrieval
 *         per kana. Build first words: あい (love), いう (to say). Speaking
 *         on あい, listening comprehension, win card.
 *   2/3 — Introduce え お: symbolIntro → traceTwice → retrieval per kana.
 *         Light review of あ い う (recognition MCQs). Build words using
 *         all 5: いえ (house), あおい (blue), うえ (above). Speaking on いえ,
 *         win card.
 *   3/3 — Full review: NO new introductions. Pure retrieval + production
 *         across all 5 vowels and all learned words. symbolToSound for all
 *         5, listeningBuild, wordImageMcq, listeningComp, speaking on あおい
 *         and いいえ, reviewMatchPairs for all 5 vowels. Fast-paced,
 *         varied, confidence-building. Identity-anchored win card.
 *
 * Conventions:
 *   - All symbol_to_sound + symbol_recognition use the 2026-05-16 revamp:
 *     buttons preview their OWN audio on tap, separate Check button.
 *   - Tile bank for listening_build is vowel-only.
 *   - IDs `ja-m1-l1-1` / `ja-m1-l1-2` / `ja-m1-l1-3` match the row-cluster
 *     pattern so they group visually as one row with three progress dots.
 *     Review-tail augmentation is gated by checking the rowId is a real
 *     curriculum row (see `mockLessons.ts`), so these don't accidentally
 *     pick up a tail for the non-existent "l1" row.
 *   - assertNoConsecutiveSame at file bottom guards against monotony
 *     spikes (max 2 consecutive of any watched type).
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

/**
 * Closed-set vocab pool for word_image_mcq distractors in the vowel
 * lessons. Per user direction (2026-05-16): every word_image_mcq option
 * is drawn from this set, so by the end of the three sub-lessons the user
 * has seen each of the 5 vowel-words multiple times across MCQ + build steps.
 *
 * Noto Emoji choices:
 *   あい  → ❤️   heart
 *   いえ  → 🏠   house
 *   うえ  → ⬆️   up arrow (the "above" sense — directional)
 *   あおい → 🔵   blue circle (color swatch, unambiguous)
 *   いいえ → 🙅   person gesturing "no" (chose over ❌ to avoid the
 *                 "wrong answer" connotation in a learning UI)
 *   いう  → 🗣️   speaking (the "to say" sense)
 */
type VowelWord = {
  kana: string;
  meaningEn: string;
  emoji: string;
};

const VOWEL_WORDS: VowelWord[] = [
  { kana: "あい",   meaningEn: "love",  emoji: "❤️" },
  { kana: "いえ",   meaningEn: "house", emoji: "🏠" },
  { kana: "うえ",   meaningEn: "above", emoji: "⬆️" },
  { kana: "あおい", meaningEn: "blue",  emoji: "🔵" },
  { kana: "いいえ", meaningEn: "no",    emoji: "🙅" },
  { kana: "いう",   meaningEn: "to say", emoji: "🗣️" },
];

function pickThreeDistractors(symbol: string) {
  return ALL_VOWELS.filter((v) => v.symbol !== symbol).slice(0, 3);
}

// `correctSlot` imported from _consonantRowHelpers — shared FNV-1a +
// Murmur3 finalizer keeps the slot-rotation hash well-distributed for
// the long-shared-prefix lesson-id patterns (per 2026-05-18 audit).

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

/**
 * word_image_mcq — 2×2 grid of word options. User reads "What is the
 * word for 'X'?", taps to preview audio + see kana, commits with Check.
 * Distractors are 3 other vowel-lesson words (closed set).
 *
 * Slot placement is deterministic by id hash so the same lesson always
 * renders the answer in the same position — easier to debug, and avoids
 * shuffling each remount during dev.
 */
function wordImageMcq(id: string, correctKana: string): LessonStep {
  const correct = VOWEL_WORDS.find((w) => w.kana === correctKana);
  if (!correct) {
    throw new Error(`wordImageMcq: unknown vowel word ${correctKana}`);
  }
  const distractors = VOWEL_WORDS.filter((w) => w.kana !== correctKana).slice(
    0,
    3,
  );
  const slot = correctSlot(id);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: correct.kana, emoji: correct.emoji });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, word: d.kana, emoji: d.emoji });
    }
  }
  return {
    id,
    type: "word_image_mcq",
    meaningEn: correct.meaningEn,
    options,
    correctOptionId: "correct",
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

/**
 * Vowel-specific match_pairs step — matches kana to romaji. Unlike the
 * grammar-spine `reviewMatchPairs` which maps kana→meaningEn, this maps
 * each vowel symbol to its romanization for kana literacy drilling.
 */
function vowelMatchPairs(id: string): LessonStep {
  return {
    id,
    type: "match_pairs",
    prompt: "Match each kana to its sound",
    playAudioOnSelect: true,
    pairs: ALL_VOWELS.map((v, i) => ({
      id: `p-${i}`,
      source: v.symbol,
      target: v.romaji,
      sourceAnnotation: [{ surface: v.symbol, reading: v.symbol }],
    })),
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 1/3 — Introduce あ い う, first words, speaking + listening.
 *                  ~18 steps.
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_L1A: LessonContent = {
  id: "ja-m1-l1-1",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Vowels — あ い う",
  description:
    "Meet the first three Japanese vowels and your first words: love, to say.",
  estimatedMinutes: 5,
  xpReward: 12,
  introducesVocabIds: ["ai", "iu"],
  steps: [
    // 1. Welcome
    {
      id: "ja-vowel-1-info-0",
      type: "info",
      title: "Welcome to Japanese!",
      body:
        "You'll learn the five vowels — あ い う え お — across three short lessons. These are the same characters you see in anime subtitles and manga speech bubbles. Let's start with the first three: あ, い, う.",
      variant: "culture",
    },

    // 2-4. あ (a): intro → trace × 2 → recognition
    symbolIntro("ja-vowel-1-intro-a", "あ", "a", "/a/", "like 'a' in 'father'", "あい (love)"),
    traceTwice("ja-vowel-1-trace-a", "あ", "a", "like 'a' in 'father'"),
    recognition("ja-vowel-1-recog-a", "あ", "a", "like 'a' in 'father'"),

    // 5-7. い (i): intro → trace × 2 → wordImageMcq (uses あい to preview)
    symbolIntro("ja-vowel-1-intro-i", "い", "i", "/i/", "like 'ee' in 'see'", "いう (to say)"),
    traceTwice("ja-vowel-1-trace-i", "い", "i", "like 'ee' in 'see'"),
    wordImageMcq("ja-vowel-1-mcq-ai", "あい"),

    // 8-10. う (u): intro → trace × 2 → recognition
    symbolIntro("ja-vowel-1-intro-u", "う", "u", "/ɯ/", "like 'oo' in 'food', lips unrounded", "うえ (above)"),
    traceTwice("ja-vowel-1-trace-u", "う", "u", "like 'oo' in 'food'"),
    recognition("ja-vowel-1-recog-u", "う", "u", "like 'oo' in 'food'"),

    // 11-12. Build first words: あい (love), いう (to say)
    listeningBuild("ja-vowel-1-build-ai", "あい", "love", VOWEL_TILES),
    listeningBuild("ja-vowel-1-build-iu", "いう", "to say", VOWEL_TILES),

    // 13. Speaking: あい
    speaking("ja-vowel-1-speak-ai", "あい", "love"),

    // 14-15. Listening comprehension
    listeningComp("ja-vowel-1-lc-ai", "あい", "ai", "love", ["to say", "house", "above"]),
    listeningComp("ja-vowel-1-lc-iu", "いう", "iu", "to say", ["love", "house", "blue"]),

    // 16. MCQ on いう
    wordImageMcq("ja-vowel-1-mcq-iu", "いう"),

    // 17. Recognition recall あ
    recognition("ja-vowel-1-recog-a2", "あ", "a", "like 'a' in 'father'"),

    // 18. Win card
    {
      id: "ja-vowel-1-info-end",
      type: "info",
      title: "Three down, two to go!",
      body:
        "You've learned あ, い, う — and built your first words: あい (love) and いう (to say). Fun fact: あい (love) appears in countless anime titles — you can now spot it in the wild. Next up: え and お.",
      variant: "win",
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 2/3 — Introduce え お, light review of あ い う, build words
 *                  with all 5 vowels. ~18 steps.
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_L1B: LessonContent = {
  id: "ja-m1-l1-2",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Vowels — え お",
  description:
    "Meet the last two vowels and build words using all five: house, blue, above.",
  estimatedMinutes: 5,
  xpReward: 12,
  introducesVocabIds: ["ie", "aoi", "ue"],
  steps: [
    // 1. Intro
    {
      id: "ja-vowel-2-info-0",
      type: "info",
      title: "Two more vowels",
      body:
        "You already know あ, い, う. Let's add え and お — then you'll have the full set of five Japanese vowels.",
      variant: "default",
    },

    // 2-4. え (e): intro → trace × 2 → recognition
    symbolIntro("ja-vowel-2-intro-e", "え", "e", "/e/", "like 'e' in 'bed'", "いえ (house)"),
    traceTwice("ja-vowel-2-trace-e", "え", "e", "like 'e' in 'bed'"),
    recognition("ja-vowel-2-recog-e", "え", "e", "like 'e' in 'bed'"),

    // 5-7. お (o): intro → trace × 2 → symbolToSound
    symbolIntro("ja-vowel-2-intro-o", "お", "o", "/o/", "like 'o' in 'or'", "あおい (blue)"),
    traceTwice("ja-vowel-2-trace-o", "お", "o", "like 'o' in 'or'"),
    symbolToSound("ja-vowel-2-sts-o", "お", "o", "like 'o' in 'or'"),

    // 8-10. Light review of あ い う — interleaved with a word MCQ to
    // avoid 3 consecutive recognition steps.
    recognition("ja-vowel-2-recog-a", "あ", "a", "like 'a' in 'father'"),
    recognition("ja-vowel-2-recog-i", "い", "i", "like 'ee' in 'see'"),
    wordImageMcq("ja-vowel-2-mcq-ie", "いえ"),
    recognition("ja-vowel-2-recog-u", "う", "u", "like 'oo' in 'food'"),

    // 11. Build いえ (house)
    listeningBuild("ja-vowel-2-build-ie", "いえ", "house", VOWEL_TILES),

    // 13-14. Build あおい (blue)
    wordImageMcq("ja-vowel-2-mcq-aoi", "あおい"),
    listeningBuild("ja-vowel-2-build-aoi", "あおい", "blue", VOWEL_TILES),

    // 15. Build うえ (above)
    listeningBuild("ja-vowel-2-build-ue", "うえ", "above", VOWEL_TILES),

    // 16. Speaking: いえ
    speaking("ja-vowel-2-speak-ie", "いえ", "house"),

    // 17. Listening comprehension on あおい
    listeningComp("ja-vowel-2-lc-aoi", "あおい", "aoi", "blue", ["love", "house", "above"]),

    // 18. Win card
    {
      id: "ja-vowel-2-info-end",
      type: "info",
      title: "All five vowels learned!",
      body:
        "あ い う え お — you've met them all! Plus three new words: いえ (house), あおい (blue), うえ (above). One more lesson to lock them in.",
      variant: "win",
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 3/3 — Full Review. NO new introductions — pure retrieval
 *                  and production. Fast-paced, varied, confidence-building.
 *                  ~18 steps.
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_JA_M1_L1C: LessonContent = {
  id: "ja-m1-l1-3",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ja",
  title: "Vowels — Full Review",
  description:
    "Lock in all 5 vowels and every word you've learned — no new material, just mastery.",
  estimatedMinutes: 5,
  xpReward: 15,
  introducesVocabIds: ["iie"],
  steps: [
    // 1. Intro
    {
      id: "ja-vowel-3-info-0",
      type: "info",
      title: "Show what you know",
      body:
        "No new kana this time — just speed drills on all five vowels and every word you've built. Let's go!",
      variant: "default",
    },

    // 2-6. symbolToSound (see kana → pick romaji) for all 5 vowels
    symbolToSound("ja-vowel-3-sts-a", "あ", "a", "like 'a' in 'father'"),
    symbolToSound("ja-vowel-3-sts-i", "い", "i", "like 'ee' in 'see'"),
    wordImageMcq("ja-vowel-3-mcq-ai", "あい"),
    symbolToSound("ja-vowel-3-sts-u", "う", "u", "like 'oo' in 'food'"),
    symbolToSound("ja-vowel-3-sts-e", "え", "e", "like 'e' in 'bed'"),

    // 7-8. listeningBuild: あい, いえ
    listeningBuild("ja-vowel-3-build-ai", "あい", "love", VOWEL_TILES),
    listeningBuild("ja-vowel-3-build-ie", "いえ", "house", VOWEL_TILES),

    // 9. symbolToSound for お
    symbolToSound("ja-vowel-3-sts-o", "お", "o", "like 'o' in 'or'"),

    // 10. wordImageMcq on うえ
    wordImageMcq("ja-vowel-3-mcq-ue", "うえ"),

    // 11. listeningBuild: あおい
    listeningBuild("ja-vowel-3-build-aoi", "あおい", "blue", VOWEL_TILES),

    // 12-13. Listening comprehension
    listeningComp("ja-vowel-3-lc-ie", "いえ", "ie", "house", ["love", "blue", "above"]),
    listeningComp("ja-vowel-3-lc-aoi", "あおい", "aoi", "blue", ["no", "house", "love"]),

    // 14. Speaking: あおい
    speaking("ja-vowel-3-speak-aoi", "あおい", "blue"),

    // 15. Build いいえ (no) — capstone word
    wordImageMcq("ja-vowel-3-mcq-iie", "いいえ"),
    listeningBuild("ja-vowel-3-build-iie", "いいえ", "no", VOWEL_TILES_WITH_DOUBLE_I),

    // 17. Speaking: いいえ
    speaking("ja-vowel-3-speak-iie", "いいえ", "no"),

    // 18. reviewMatchPairs: all 5 vowels (kana → romaji)
    vowelMatchPairs("ja-vowel-3-match"),

    // 19. Identity-anchored win card
    {
      id: "ja-vowel-3-info-end",
      type: "info",
      title: "You can read all 5 Japanese vowels!",
      body:
        "あ い う え お — you can read them, write them, hear them, and say them. Six words down: あい, いう, いえ, うえ, あおい, いいえ. You can already pick out vowel kana on anime title cards and manga covers. Next: your first consonants.",
      variant: "win",
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Build-time monotony guard — fails at import if any watched step type
 * appears 3+ times in a row. Uses the M3-M7 standard watch set expanded
 * for M1 kana step types.
 * ──────────────────────────────────────────────────────────────────────── */
const M1_WATCH: ReadonlyArray<LessonStep["type"]> = [
  "symbol_trace",
  "symbol_recognition",
  "symbol_to_sound",
  "word_image_mcq",
  "listening_build",
  "listening_comprehension",
];
assertNoConsecutiveSame(MOCK_LESSON_JA_M1_L1A.steps, 2, M1_WATCH);
assertNoConsecutiveSame(MOCK_LESSON_JA_M1_L1B.steps, 2, M1_WATCH);
assertNoConsecutiveSame(MOCK_LESSON_JA_M1_L1C.steps, 2, M1_WATCH);
