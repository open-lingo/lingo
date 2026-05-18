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

/**
 * Small kana / sokuon / long-vowel mark — must NEVER appear as a
 * standalone tile in a build step. These attach to the preceding
 * kana to form one mora (じゅ, きょ, きっ, おー). Defensive filter
 * on tile pools so authors can't accidentally seed a bare small
 * kana decoy.
 */
const SMALL_KANA_OR_MARK = new Set([
  "ゃ", "ゅ", "ょ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ",
  "ャ", "ュ", "ョ", "ァ", "ィ", "ゥ", "ェ", "ォ",
  "っ", "ッ", "ー",
]);

/**
 * Mora-tokenize a kana string for tile generation. Returns one token
 * per mora — yōon (じゅ), small vowels (ぁ..ぉ), sokuon (っ), and
 * long-vowel mark (ー) all collapse onto the preceding kana.
 *
 *   "じゅう"     → ["じゅ", "う"]
 *   "きょう"     → ["きょ", "う"]
 *   "がっこう"   → ["が", "っこ"? — no: ["が", "っ", "こ", "う"]]
 *
 * Sokuon (っ) is a phonological mora of its own (a beat of silence /
 * geminated consonant), so it stays standalone — that's the only
 * "small" character that does NOT glue. We keep ー and small vowels
 * glued (long-vowel + yōon both render as one visual mora).
 *
 * Actually no: per Spencer's rule "small kana should never be
 * separated", glue ALL of these to the preceding kana. The user-
 * facing rule is visual: never show a bare small kana as a tile.
 */
function moraTilesFor(word: string): string[] {
  const chars = Array.from(word);
  const out: string[] = [];
  for (const ch of chars) {
    if (SMALL_KANA_OR_MARK.has(ch) && out.length > 0) {
      out[out.length - 1] = out[out.length - 1] + ch;
    } else {
      out.push(ch);
    }
  }
  return out;
}

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
 *
 * 2026-05-17 (Marcus audit): the old `sum(charCodeAt) % 4` produced 39%
 * slot-2 bias across 31 g-row steps and clustered every sub-1 alphabet
 * drill at slot 2 (the 4 ids `ja-g1-recog-gi / -s2s-ga / -s2s-gu /
 * -s2s-gi` all hashed to 2). Swapped to a multiplicative FNV-style mix
 * that diffuses the seed across slots and uses the FULL id (not just
 * char sum), so suffix variations actually move the slot.
 */
export function correctSlot(id: string, slots = 4): number {
  let h = 2166136261; // FNV-1a 32-bit offset basis
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h % slots;
}

function pickThreeKanaDistractors(ctx: RowContext, symbol: string) {
  const fromRow = ctx.allKana.filter((v) => v.symbol !== symbol);
  if (fromRow.length >= 3) return fromRow.slice(0, 3);
  const filler = ctx.tileBankPool
    .filter((s) => s !== symbol && !fromRow.some((v) => v.symbol === s))
    .map((symbol) => ({ symbol, romaji: "" }));
  return [...fromRow, ...filler].slice(0, 3);
}

/**
 * Per user direction (2026-05-16): tile bank should include required
 * kana + ~3 random extras, NOT every prior-known kana. Prevents pattern-
 * memorization while keeping the visual scan light.
 *
 * Defensive filter: drop any bare small kana / sokuon / long-vowel mark
 * from the extras pool. A standalone ゅ tile would make a yōon build
 * step ambiguous (split-glyph instead of compound tile).
 */
function buildTileBank(ctx: RowContext, required: string[]): string[] {
  const extras = ctx.tileBankPool
    .filter((t) => !required.includes(t))
    .filter((t) => !(Array.from(t).length === 1 && SMALL_KANA_OR_MARK.has(t)));
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
  // Mora-tokenize so yōon (じゅ), sokuon (っ), and long-vowel marks
  // form single tiles. Splitting by codepoint would emit bare small
  // kana, which violates the "small kana never separated" rule and
  // marks correct answers wrong.
  const mora = moraTilesFor(word);
  const required = Array.from(new Set(mora));
  return {
    id,
    type: "listening_build",
    audioKey: word,
    prompt: `Listen and build the word for '${meaning}'`,
    targetSentence: word,
    tiles: buildTileBank(ctx, required),
    correctOrder: mora,
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
    // 2026-05-17 R1.3a: Whisper-small is the default STT engine with
    // English-token suppression + mora tiers + kuroshiro normalization
    // shipped. Flip to non-stubbed so M1/M2/M3+ consonant-row speaking
    // steps grade through the real pipeline (2-attempt + reward-the-try
    // flow lives in SpeakingStepView).
    stubbed: false,
    targetAnnotation: [{ surface: word, reading: word }],
  };
}

/**
 * translateMcq — "How do you say <X> in Japanese?" → 4 kana options
 * with romaji forced above each option. Replaces the typing `translate`
 * step in M2 since there's no IME-input grading layer yet (2026-05-17
 * Spencer feedback: typing "megane" rejected even though romaji is
 * the only sane input on a non-JA keyboard).
 *
 * Distractor pool is row-only by default — cross-row foils make this
 * too easy to guess by elimination. Caller passes the row's word pool
 * (typically 4 words including the correct answer); we shuffle the slot
 * deterministically per step.id.
 */
export function translateMcq(
  id: string,
  meaningEn: string,
  correctKana: string,
  pool: { kana: string; meaningEn: string }[],
): LessonStep {
  const correct = pool.find((p) => p.kana === correctKana);
  if (!correct) {
    throw new Error(`translateMcq: ${correctKana} not in pool`);
  }
  // 2026-05-17 R2.2: when every in-pool distractor has a different mora-
  // count from the correct answer, mora-length alone gives the answer
  // away (e.g. かぎ is 2-mora, all other g-row words are 3-mora). Pad
  // one distractor slot from M1_REVIEW_POOL with a same-length word so
  // the learner can't pick by counting tiles.
  //
  // No-op when the pool already contains a same-length foil (sub-3's
  // SUB3_TRANSLATE_POOL mixes M1 + g-row → variety already present).
  const correctMora = moraTilesFor(correctKana).length;
  const inPool = pool.filter((p) => p.kana !== correctKana);
  const sameLenInPool = inPool.filter(
    (p) => moraTilesFor(p.kana).length === correctMora,
  );
  let others = inPool.slice(0, 3);
  if (sameLenInPool.length === 0 && others.length >= 1) {
    const lenPadCandidates = M1_REVIEW_POOL.filter(
      (w) =>
        moraTilesFor(w.kana).length === correctMora &&
        w.kana !== correctKana &&
        !pool.some((p) => p.kana === w.kana),
    );
    if (lenPadCandidates.length > 0) {
      // Deterministic pick via correctSlot variant so different
      // translateMcq calls land on different M1 words.
      const padIdx = correctSlot(id + "::lenpad", lenPadCandidates.length);
      const pad = lenPadCandidates[padIdx];
      // Swap the LAST distractor slot so the first 2 stay as in-row
      // foils (preserves row-category challenge).
      others = [...others.slice(0, others.length - 1), { kana: pad.kana, meaningEn: pad.meaningEn }];
    }
    // If no same-length M1 word exists, fall through with original
    // distractors — accepted edge case given M1_REVIEW_POOL variety.
  }
  const slot = correctSlot(id);
  const options: { id: string; text: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) options.push({ id: "correct", text: correct.kana });
    else options.push({ id: `opt-${i}`, text: others[di++].kana });
  }
  return {
    id,
    type: "multiple_choice",
    prompt: `How do you say "${meaningEn}" in Japanese?`,
    options,
    correctOptionId: "correct",
    // Romaji hidden by default; reveals on the option the learner taps
    // (and hides again on deselect). Prevents the 4-romaji-at-once skim
    // that Marcus/Sarah/Aiden all exploited in the original implementation.
    optionsRevealRomajiOnSelect: true,
  };
}

/**
 * Cumulative M1 review pool — top traveler-useful nouns the learner has
 * seen in M1. Used by sub-3 review lessons to sprinkle FSRS-style
 * "least-recently-used" recall steps. Hand-curated for now; replace
 * with real FSRS scheduling later if/when vocab graduation tracks
 * lesson-context exposure (it currently tracks kana-level mastery).
 */
export const M1_REVIEW_POOL: RowWord[] = [
  { kana: "やま", meaningEn: "mountain", emoji: "⛰️" },
  { kana: "かわ", meaningEn: "river", emoji: "🏞️" },
  { kana: "ねこ", meaningEn: "cat", emoji: "🐈" },
  { kana: "いぬ", meaningEn: "dog", emoji: "🐕" },
  { kana: "そら", meaningEn: "sky", emoji: "☁️" },
  { kana: "ほし", meaningEn: "star", emoji: "⭐" },
  { kana: "つき", meaningEn: "moon", emoji: "🌙" },
  { kana: "はな", meaningEn: "flower", emoji: "🌸" },
  { kana: "き", meaningEn: "tree", emoji: "🌳" },
  { kana: "て", meaningEn: "hand", emoji: "✋" },
  { kana: "め", meaningEn: "eye", emoji: "👁️" },
  { kana: "うみ", meaningEn: "sea", emoji: "🌊" },
];

/**
 * Pick `count` review words from M1_REVIEW_POOL deterministically by
 * seed (typically the lesson id). Different lessons surface different
 * subsets so the learner sees rotating cumulative review across rows.
 */
export function pickReviewWords(seed: string, count: number): RowWord[] {
  const out = [...M1_REVIEW_POOL];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 16807) % 2147483647;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, count);
}

/**
 * match_pairs — kana ↔ romaji recall grid. Kana on the source (left)
 * side, romaji on the target (right) side. Tap the kana to hear its
 * TTS (playAudioOnSelect: true). Columns shuffle independently per
 * step.id so positions never line up.
 */
export function matchKanaToRomaji(
  id: string,
  pairs: KanaEntry[],
  prompt: string = "Match the kana to their sounds",
): LessonStep {
  return {
    id,
    type: "match_pairs",
    prompt,
    playAudioOnSelect: true,
    pairs: pairs.map((p, i) => ({
      id: `p-${i}`,
      source: p.symbol,
      target: p.romaji,
    })),
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
  // Shuffle the correct option's slot deterministically by step id —
  // pre-fix the correct answer was always position "a" (the first
  // option), so Marcus could tap-first and score 3/3 across g-2 without
  // listening. Bugfix 2026-05-17.
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
    romaji,
    question: "What does this word mean?",
    options: items,
    correctOptionId: "correct",
    transcriptAnnotation: [{ surface: word, reading: word }],
  };
}
