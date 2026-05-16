/**
 * Shared step-builder helpers for hand-authored consonant rows
 * (ka, sa, ta, na, ha, ma, ra and friends). Replaces the per-file
 * duplication that grew while we iterated on ka + sa.
 *
 * Each row file imports these helpers and supplies its own `RowContext`
 * (kana list, word list, tile-bank pool). The factories return fully-
 * typed LessonStep instances ready to drop into a `LessonContent.steps`
 * array.
 *
 * NOT shared with vowels (ja-m1-l1) or the auto-builder — vowels are
 * frozen and the auto-builder has its own preset/density logic.
 */
import type { LessonStep } from "../types";
import { getTtsUrl } from "@/shared/japanese/tts";

export type KanaEntry = { symbol: string; romaji: string };
export type RowWord = { kana: string; meaningEn: string; emoji: string };

export type RowContext = {
  /** The 5 kana of THIS row. Used for distractor pools in recognition
   *  + symbol_to_sound + as the recognition rotation in sub-3. */
  allKana: KanaEntry[];
  /** Anchor words for this row (typically 3 — one per sub-lesson). */
  words: RowWord[];
  /** Kana pool used to populate tile banks. Required tiles from the
   *  build word are merged in automatically; this just supplies the
   *  "random extras" per user direction (2026-05-16). */
  tileBankPool: string[];
};

/**
 * Deterministic slot for the correct answer based on id hash. Keeps the
 * answer position stable across remounts so debug builds don't shuffle
 * mid-session.
 */
export function correctSlot(id: string, slots = 4): number {
  return id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % slots;
}

function pickThreeKanaDistractors(ctx: RowContext, symbol: string) {
  return ctx.allKana.filter((v) => v.symbol !== symbol).slice(0, 3);
}

/**
 * Per user direction (2026-05-16): tile bank should include required
 * kana + ~3 random extras, NOT every prior-known kana. Prevents pattern-
 * memorization while keeping the visual scan light.
 */
function buildTileBank(ctx: RowContext, required: string[]): string[] {
  const extras = ctx.tileBankPool.filter((t) => !required.includes(t));
  return [...required, ...extras.slice(0, 3)];
}

// ─── Step factories ───────────────────────────────────────────────────

export function symbolIntro(
  id: string,
  symbol: string,
  romanization: string,
  ipa: string,
  hint: string,
  example: string,
  note?: string,
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
      note,
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
  };
}

export function traceTwice(
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

export function recognition(
  ctx: RowContext,
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  const distractors = pickThreeKanaDistractors(ctx, symbol);
  const slot = correctSlot(id);
  const options: { id: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) options.push({ id: "correct", symbol });
    else options.push({ id: `opt-${i}`, symbol: distractors[di++].symbol });
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

export function symbolToSound(
  ctx: RowContext,
  id: string,
  symbol: string,
  romanization: string,
  hint: string,
): LessonStep {
  const correct = ctx.allKana.find((v) => v.symbol === symbol)!;
  const distractors = pickThreeKanaDistractors(ctx, symbol);
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
 * word_image_mcq — 2×2 grid pulling from the row's word pool. Pads with
 * vowel-lesson words if the row only has 3 words (so 4 slots stay full).
 */
const FALLBACK_PADDING_WORDS: RowWord[] = [
  { kana: "あい", meaningEn: "love",  emoji: "❤️" },
  { kana: "いえ", meaningEn: "house", emoji: "🏠" },
  { kana: "うえ", meaningEn: "above", emoji: "⬆️" },
];

export function wordImageMcq(
  ctx: RowContext,
  id: string,
  correctKana: string,
): LessonStep {
  const correct = ctx.words.find((w) => w.kana === correctKana);
  if (!correct) {
    throw new Error(`wordImageMcq: ${correctKana} not in row word pool`);
  }
  const others = ctx.words.filter((w) => w.kana !== correctKana);
  const padding = FALLBACK_PADDING_WORDS.filter(
    (w) => w.kana !== correctKana && !ctx.words.some((cw) => cw.kana === w.kana),
  );
  const distractors = [...others, ...padding].slice(0, 3);
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

export function listeningBuild(
  ctx: RowContext,
  id: string,
  word: string,
  meaning: string,
): LessonStep {
  const required = Array.from(new Set(Array.from(word)));
  return {
    id,
    type: "listening_build",
    audioKey: word,
    prompt: `Listen and build the word for '${meaning}'`,
    targetSentence: word,
    tiles: buildTileBank(ctx, required),
    correctOrder: Array.from(word),
    granularity: "character",
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

export function speaking(id: string, word: string, meaning: string): LessonStep {
  return {
    id,
    type: "speaking",
    targetPhrase: word,
    translation: meaning,
    stubbed: true,
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

/**
 * listening_comprehension — hear a word, pick its English meaning from
 * 4 options. Decoys are 3 short English strings supplied by the caller.
 */
export function listeningComp(
  id: string,
  word: string,
  romaji: string,
  correctMeaning: string,
  decoys: [string, string, string],
): LessonStep {
  return {
    id,
    type: "listening_comprehension",
    audioKey: word,
    transcript: word,
    romaji,
    question: "What does this word mean?",
    options: [
      { id: "a", text: correctMeaning },
      { id: "b", text: decoys[0] },
      { id: "c", text: decoys[1] },
      { id: "d", text: decoys[2] },
    ],
    correctOptionId: "a",
    transcriptAnnotation: [{ surface: word, reading: word }],
  };
}
