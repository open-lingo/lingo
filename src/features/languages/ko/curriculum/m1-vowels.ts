import type { LessonContent, LessonStep } from "@/features/lesson/types";

/**
 * Korean basic vowels — ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ, taught as blocks with the
 * silent placeholder ㅇ (아 어 오 우 으 이). Two sub-lessons mirroring
 * the JA vowel lessons in shape:
 *
 *   1/2 — meet ㅏ ㅓ ㅗ (3 most common); trace + recognize; build the
 *         first real word 아이 (child).
 *   2/2 — meet ㅜ ㅡ ㅣ; reinforce all 6; build 오이 (cucumber); pick
 *         meanings via listening_comprehension.
 *
 * Why split 3+3 instead of 6+review like JA's 5+review: without bundled
 * stroke-order data for Hangul, trace steps fall back to system-font
 * reference and don't carry the same intra-lesson novelty. Splitting
 * vowels evenly across two lessons keeps each one varied.
 *
 * Conventions:
 *   - scriptId: "hangul" (no glyph data yet — renderer falls back to
 *     system font; trace steps still render, just without numbered guides).
 *   - hasStrokeOrder: false — when Hangul stroke JSON lands, flip globally.
 *   - audioKey omitted from symbol_recognition (no ko TTS manifest yet).
 *     The renderer treats missing audio gracefully; once we generate
 *     ko TTS the recognition prompts get audio for free.
 *
 * Vocab note: 아이 (ai, child) and 오이 (oi, cucumber) are the two
 * canonical "vowels-only" Korean words. We also surface 오 (o, five) and
 * 이 (i, two) as one-block bonus vocab so the learner reads numerals
 * before they ever see a consonant.
 */

const BLOCKS = ["아", "어", "오", "우", "으", "이"];
const BLOCKS_WITH_REPEAT_I = ["아", "어", "오", "우", "으", "이", "이"];

type VowelBlock = {
  /** The vowel jamo on its own (ㅏ). */
  jamo: string;
  /** The vowel + silent ㅇ as a syllable block (아). */
  block: string;
  /** Revised Romanization. */
  romaji: string;
  ipa: string;
  hint: string;
};

const ALL_VOWELS: VowelBlock[] = [
  { jamo: "ㅏ", block: "아", romaji: "a",  ipa: "/a/",  hint: "like 'a' in 'father'" },
  { jamo: "ㅓ", block: "어", romaji: "eo", ipa: "/ʌ/",  hint: "like 'u' in 'sun'" },
  { jamo: "ㅗ", block: "오", romaji: "o",  ipa: "/o/",  hint: "like 'o' in 'so'" },
  { jamo: "ㅜ", block: "우", romaji: "u",  ipa: "/u/",  hint: "like 'oo' in 'food'" },
  { jamo: "ㅡ", block: "으", romaji: "eu", ipa: "/ɯ/",  hint: "like 'eu' in 'put' (unrounded)" },
  { jamo: "ㅣ", block: "이", romaji: "i",  ipa: "/i/",  hint: "like 'ee' in 'see'" },
];

type VowelWord = {
  /** The whole word as syllable blocks. */
  word: string;
  meaningEn: string;
  emoji: string;
};

const VOWEL_WORDS: VowelWord[] = [
  { word: "아이", meaningEn: "child",    emoji: "👶" },
  { word: "오이", meaningEn: "cucumber", emoji: "🥒" },
  { word: "오",   meaningEn: "five",     emoji: "5️⃣" },
  { word: "이",   meaningEn: "two",      emoji: "2️⃣" },
];

function findVowel(block: string): VowelBlock {
  const v = ALL_VOWELS.find((x) => x.block === block);
  if (!v) throw new Error(`Unknown vowel block ${block}`);
  return v;
}

function pickThreeDistractors(block: string): VowelBlock[] {
  return ALL_VOWELS.filter((v) => v.block !== block).slice(0, 3);
}

function correctSlot(id: string, slots = 4): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % slots;
}

function symbolIntro(
  id: string,
  block: string,
  example: string,
): LessonStep {
  const v = findVowel(block);
  return {
    id,
    type: "symbol_intro",
    payload: {
      symbol: block,
      romanization: v.romaji,
      ipa: v.ipa,
      hint: v.hint,
      example,
      scriptId: "hangul",
      hasStrokeOrder: false,
    },
  };
}

function traceTwice(id: string, block: string): LessonStep {
  const v = findVowel(block);
  return {
    id,
    type: "symbol_trace",
    payload: {
      symbol: block,
      romanization: v.romaji,
      ipa: "",
      hint: v.hint,
      scriptId: "hangul",
      hasStrokeOrder: false,
    },
    showGuide: true,
    minCorrectAttempts: 2,
  };
}

function traceOnce(id: string, block: string): LessonStep {
  const v = findVowel(block);
  return {
    id,
    type: "symbol_trace",
    payload: {
      symbol: block,
      romanization: v.romaji,
      ipa: "",
      hint: v.hint,
      scriptId: "hangul",
      hasStrokeOrder: false,
    },
    showGuide: true,
    minCorrectAttempts: 1,
  };
}

function recognition(id: string, block: string): LessonStep {
  const v = findVowel(block);
  const distractors = pickThreeDistractors(block);
  const slot = correctSlot(id);
  const options: { id: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) options.push({ id: "correct", symbol: block });
    else options.push({ id: `opt-${i}`, symbol: distractors[di++].block });
  }
  return {
    id,
    type: "symbol_recognition",
    payload: {
      symbol: block,
      romanization: v.romaji,
      ipa: "",
      hint: v.hint,
      scriptId: "hangul",
      hasStrokeOrder: false,
    },
    options,
    correctOptionId: "correct",
  };
}

function symbolToSound(id: string, block: string): LessonStep {
  const correct = findVowel(block);
  const distractors = pickThreeDistractors(block);
  const slot = correctSlot(id);
  const options: { id: string; text: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", text: correct.romaji, symbol: correct.block });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, text: d.romaji, symbol: d.block });
    }
  }
  return {
    id,
    type: "symbol_to_sound",
    payload: {
      symbol: block,
      romanization: correct.romaji,
      ipa: "",
      hint: correct.hint,
      scriptId: "hangul",
      hasStrokeOrder: false,
    },
    options,
    correctOptionId: "correct",
  };
}

function wordImageMcq(id: string, correctWord: string): LessonStep {
  const correct = VOWEL_WORDS.find((w) => w.word === correctWord);
  if (!correct) throw new Error(`Unknown vowel word ${correctWord}`);
  const distractors = VOWEL_WORDS.filter((w) => w.word !== correctWord).slice(0, 3);
  const slot = correctSlot(id);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: correct.word, emoji: correct.emoji });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, word: d.word, emoji: d.emoji });
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
  };
}

function listeningComp(
  id: string,
  word: string,
  correctMeaning: string,
  decoys: [string, string, string],
): LessonStep {
  const items = [
    { id: "correct", text: correctMeaning },
    { id: "opt-1", text: decoys[0] },
    { id: "opt-2", text: decoys[1] },
    { id: "opt-3", text: decoys[2] },
  ];
  const slot = correctSlot(id);
  const correct = items.shift()!;
  items.splice(slot, 0, correct);
  return {
    id,
    type: "listening_comprehension",
    audioKey: word,
    transcript: word,
    question: "What does this word mean?",
    options: items,
    correctOptionId: "correct",
  };
}

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 1/2 — ㅏ ㅓ ㅗ + silent ㅇ + first real word: 아이 (child)
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_KO_M1_V1: LessonContent = {
  id: "ko-m1-v-1",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ko",
  title: "Vowels — Intro 1",
  description:
    "Three vowels (ㅏ ㅓ ㅗ), the silent placeholder ㅇ, and your first word: 아이 (child).",
  estimatedMinutes: 5,
  xpReward: 12,
  introducesVocabIds: ["ko-ai"],
  steps: [
    {
      id: "ko-v1-info-0",
      type: "info",
      title: "Three vowels + a silent friend",
      body:
        "Meet ㅏ (a), ㅓ (eo), ㅗ (o). On their own a vowel can't be a block — so we slot ㅇ on the left as a silent placeholder: 아 어 오. Same sound; legal block. You'll trace each, hear it, and recognize it.",
      variant: "culture",
    },

    // ㅏ → 아
    symbolIntro("ko-v1-intro-a", "아", "아이 (child)"),
    traceTwice("ko-v1-trace-a", "아"),
    recognition("ko-v1-recog-a", "아"),

    // ㅓ → 어
    symbolIntro("ko-v1-intro-eo", "어", "어머니 (mother)"),
    traceTwice("ko-v1-trace-eo", "어"),
    recognition("ko-v1-recog-eo", "어"),

    // ㅗ → 오
    symbolIntro("ko-v1-intro-o", "오", "오 (five)"),
    traceTwice("ko-v1-trace-o", "오"),
    recognition("ko-v1-recog-o", "오"),

    // First real word: 아이 (child). MCQ first (emoji-anchored meaning),
    // then build it tile-by-tile.
    {
      id: "ko-v1-info-ai",
      type: "info",
      title: "Your first Korean word",
      body:
        "아 + 이 = 아이 (ai), 'child'. Two blocks, two syllables, zero consonants — pure vowel reading. You haven't met ㅣ yet but you can recognize it from the prompt; we'll drill it properly in lesson 2.",
      variant: "win",
    },
    wordImageMcq("ko-v1-mcq-ai", "아이"),
    listeningBuild("ko-v1-build-ai", "아이", "child", BLOCKS),

    // Bonus: 오 (five) — single-block read, anchors ㅗ as a numeral.
    wordImageMcq("ko-v1-mcq-o", "오"),

    // Final round — harder direction (block → romaji) for the three taught vowels.
    symbolToSound("ko-v1-sts-a", "아"),
    symbolToSound("ko-v1-sts-eo", "어"),
    symbolToSound("ko-v1-sts-o", "오"),

    {
      id: "ko-v1-info-end",
      type: "info",
      title: "Half the vowels",
      body:
        "Three down — ㅏ ㅓ ㅗ. Next lesson: ㅜ ㅡ ㅣ, then we lock in all six and you read your second real word.",
      variant: "default",
    },
  ],
};

/* ────────────────────────────────────────────────────────────────────────
 * Sub-lesson 2/2 — ㅜ ㅡ ㅣ + reinforce all 6 + 오이 (cucumber), 이 (two)
 * ──────────────────────────────────────────────────────────────────────── */

export const MOCK_LESSON_KO_M1_V2: LessonContent = {
  id: "ko-m1-v-2",
  moduleId: "m1",
  courseId: "mock-1",
  languageId: "ko",
  title: "Vowels — Intro 2",
  description:
    "Three more vowels (ㅜ ㅡ ㅣ), all six together, and 오이 (cucumber).",
  estimatedMinutes: 6,
  xpReward: 12,
  introducesVocabIds: ["ko-oi", "ko-i-two"],
  steps: [
    {
      id: "ko-v2-info-0",
      type: "info",
      title: "The other three",
      body:
        "ㅜ (u), ㅡ (eu — like 'put' but unrounded), ㅣ (i, like 'ee'). Same silent-ㅇ trick: 우 으 이. After this, all six basic vowels are yours.",
      variant: "default",
    },

    // ㅜ → 우
    symbolIntro("ko-v2-intro-u", "우", "우유 (milk)"),
    traceTwice("ko-v2-trace-u", "우"),
    recognition("ko-v2-recog-u", "우"),

    // ㅡ → 으
    symbolIntro("ko-v2-intro-eu", "으", "스 (s sound)"),
    traceTwice("ko-v2-trace-eu", "으"),
    recognition("ko-v2-recog-eu", "으"),

    // ㅣ → 이
    symbolIntro("ko-v2-intro-i", "이", "이 (two / tooth)"),
    traceTwice("ko-v2-trace-i", "이"),
    recognition("ko-v2-recog-i", "이"),

    // Reinforce earlier 3 with one trace pass each
    traceOnce("ko-v2-trace-a", "아"),
    traceOnce("ko-v2-trace-eo", "어"),
    traceOnce("ko-v2-trace-o", "오"),

    // Word work — 오이 (cucumber) and 이 (two)
    wordImageMcq("ko-v2-mcq-oi", "오이"),
    listeningBuild("ko-v2-build-oi", "오이", "cucumber", BLOCKS),

    wordImageMcq("ko-v2-mcq-i", "이"),

    // Listening comprehension — hear, pick meaning
    listeningComp("ko-v2-lc-ai", "아이", "child",    ["cucumber", "five", "two"]),
    listeningComp("ko-v2-lc-oi", "오이", "cucumber", ["child",    "two",  "five"]),
    listeningComp("ko-v2-lc-i",  "이",   "two",      ["child",    "five", "cucumber"]),

    // Final round — all 6 vowels, block → romaji
    symbolToSound("ko-v2-sts-a",  "아"),
    symbolToSound("ko-v2-sts-eo", "어"),
    symbolToSound("ko-v2-sts-o",  "오"),
    symbolToSound("ko-v2-sts-u",  "우"),
    symbolToSound("ko-v2-sts-eu", "으"),
    symbolToSound("ko-v2-sts-i",  "이"),

    // Build a 2-syllable word with a repeat block: 이이 is not a word, so
    // use 아이 again to lock in the read direction. (Tile bank includes
    // a duplicate 이 so the user has to read, not pattern-match.)
    listeningBuild("ko-v2-build-ai-again", "아이", "child", BLOCKS_WITH_REPEAT_I),

    {
      id: "ko-v2-info-end",
      type: "info",
      title: "All six vowels — yours",
      body:
        "ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ. You read your first words from pure vowels. Next module section: consonants. We'll start with ㄱ (g/k) and build words like 가 (go), 고기 (meat), and 아기 (baby).",
      variant: "win",
    },
  ],
};
