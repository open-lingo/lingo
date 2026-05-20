/**
 * Shared step-builder helpers for Korean consonant rows.
 * Mirrors `_consonantRowHelpers.ts` (the Japanese equivalent) but for
 * Hangul — each consonant pairs with the 6 basic vowels (ㅏ ㅓ ㅗ ㅜ ㅡ ㅣ)
 * via the silent ㅇ-less rule (ㄱ + ㅏ = 가, no ㅇ needed because the
 * consonant occupies the left slot).
 *
 * Notable Korean-specific decisions:
 *   - scriptId is "hangul" (no glyph data yet; renderer falls back to
 *     system font). flip `hasStrokeOrder` to true once `data/hangul.json`
 *     ships.
 *   - Tiles for build steps are SYLLABLE BLOCKS, not jamo. A Korean
 *     word like 고기 is two cognitive units (고, 기), not four (ㄱ,
 *     ㅗ, ㄱ, ㅣ). The block IS the mora.
 *   - audioKey on listening_build = the word itself; the renderer looks
 *     up TTS via the ko manifest (none yet — fails silently and renders
 *     a play-button stub).
 */
import type { LessonStep } from "../types";
import { getTtsUrl } from "@/shared/japanese/tts";

export type SyllableEntry = {
  /** A standalone Korean syllable block, e.g. 가 */
  block: string;
  /** Revised Romanization, e.g. "ga" */
  romaji: string;
  ipa?: string;
  hint?: string;
};

export type RowWord = {
  /** Word as syllable blocks, e.g. 고기 */
  word: string;
  meaningEn: string;
  /** Required for word_image_mcq. Omit when no clean unicode emoji exists;
   *  caller must then use listeningBuild/listeningComp instead. */
  emoji?: string;
};

export type KoRowContext = {
  /** The 6 syllables of THIS consonant row (consonant × 6 vowels). */
  allBlocks: SyllableEntry[];
  /** Anchor words for this row. */
  words: RowWord[];
  /** Block pool used as build-step tile decoys (drawn from prior rows). */
  tileBankPool: string[];
};

/** Deterministic slot per id (FNV-1a) — same pattern as _consonantRowHelpers. */
export function correctSlot(id: string, slots = 4): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % slots;
}

function pickThreeBlockDistractors(ctx: KoRowContext, block: string): SyllableEntry[] {
  const fromRow = ctx.allBlocks.filter((b) => b.block !== block);
  if (fromRow.length >= 3) return fromRow.slice(0, 3);
  const filler = ctx.tileBankPool
    .filter((s) => s !== block && !fromRow.some((b) => b.block === s))
    .map((b) => ({ block: b, romaji: "" }));
  return [...fromRow, ...filler].slice(0, 3);
}

function buildTileBank(ctx: KoRowContext, required: string[]): string[] {
  const extras = ctx.tileBankPool.filter((t) => !required.includes(t));
  return [...required, ...extras.slice(0, 3)];
}

// ─── Step factories ──────────────────────────────────────────────────────

export function symbolIntro(
  id: string,
  block: string,
  romaji: string,
  ipa: string,
  hint: string,
  example: string,
  note?: string,
): LessonStep {
  return {
    id,
    type: "symbol_intro",
    payload: {
      symbol: block,
      romanization: romaji,
      ipa,
      hint,
      example,
      note,
      scriptId: "hangul",
      hasStrokeOrder: false,
    },
  };
}

export function traceTwice(
  id: string,
  block: string,
  romaji: string,
  hint: string,
): LessonStep {
  return {
    id,
    type: "symbol_trace",
    payload: {
      symbol: block,
      romanization: romaji,
      ipa: "",
      hint,
      scriptId: "hangul",
      hasStrokeOrder: false,
    },
    showGuide: true,
    minCorrectAttempts: 2,
  };
}

export function recognition(
  ctx: KoRowContext,
  id: string,
  block: string,
  romaji: string,
  hint: string,
): LessonStep {
  const distractors = pickThreeBlockDistractors(ctx, block);
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
      romanization: romaji,
      ipa: "",
      hint,
      scriptId: "hangul",
      hasStrokeOrder: false,
      audioKey: getTtsUrl(block, "ko") ?? undefined,
    },
    options,
    correctOptionId: "correct",
  };
}

export function symbolToSound(
  ctx: KoRowContext,
  id: string,
  block: string,
  romaji: string,
  hint: string,
): LessonStep {
  const correct = ctx.allBlocks.find((b) => b.block === block)!;
  const distractors = pickThreeBlockDistractors(ctx, block);
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
      romanization: romaji,
      ipa: "",
      hint,
      scriptId: "hangul",
      hasStrokeOrder: false,
    },
    options,
    correctOptionId: "correct",
  };
}

const FALLBACK_PADDING_WORDS: RowWord[] = [
  { word: "아이", meaningEn: "child",    emoji: "👶" },
  { word: "오이", meaningEn: "cucumber", emoji: "🥒" },
  { word: "오",   meaningEn: "five",     emoji: "5️⃣" },
];

export function wordImageMcq(
  ctx: KoRowContext,
  id: string,
  correctWord: string,
): LessonStep {
  const correct = ctx.words.find((w) => w.word === correctWord);
  if (!correct) {
    throw new Error(`wordImageMcq: ${correctWord} not in row word pool`);
  }
  if (!correct.emoji) {
    throw new Error(
      `wordImageMcq: ${correctWord} has no emoji — use listeningBuild or listeningComp instead`,
    );
  }
  const others = ctx.words.filter((w) => w.word !== correctWord && Boolean(w.emoji));
  const padding = FALLBACK_PADDING_WORDS.filter(
    (w) => w.word !== correctWord && !ctx.words.some((cw) => cw.word === w.word),
  );
  const distractors = [...others, ...padding].slice(0, 3);
  const slot = correctSlot(id);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: correct.word, emoji: correct.emoji });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, word: d.word, emoji: d.emoji! });
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

/**
 * Tokenize a Korean word into syllable blocks. Korean blocks are
 * pre-composed in Unicode (each block is one codepoint in the AC00–D7A3
 * range), so Array.from is sufficient.
 */
function blockTilesFor(word: string): string[] {
  return Array.from(word);
}

export function listeningBuild(
  ctx: KoRowContext,
  id: string,
  word: string,
  meaning: string,
): LessonStep {
  const blocks = blockTilesFor(word);
  return {
    id,
    type: "listening_build",
    audioKey: word,
    prompt: `Listen and build the word for '${meaning}'`,
    targetSentence: word,
    tiles: buildTileBank(ctx, blocks),
    correctOrder: blocks,
    granularity: "character",
  };
}

export function speaking(id: string, word: string, meaning: string): LessonStep {
  return {
    id,
    type: "speaking",
    targetPhrase: word,
    translation: meaning,
    // 2026-05-19: Korean STT not yet wired (Whisper supports it but the
    // mora/normalization pipeline is JA-specific). Stub for now — flips
    // to false once the Korean grader lands.
    stubbed: true,
  };
}

export function listeningComp(
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

export function matchBlocksToRomaji(
  id: string,
  pairs: SyllableEntry[],
  prompt: string = "Match each block to its sound",
): LessonStep {
  return {
    id,
    type: "match_pairs",
    prompt,
    playAudioOnSelect: true,
    pairs: pairs.map((p, i) => ({
      id: `p-${i}`,
      source: p.block,
      target: p.romaji,
    })),
  };
}
