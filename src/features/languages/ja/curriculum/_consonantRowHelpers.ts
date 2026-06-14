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
import type { LessonStep } from "@/features/lesson/types";
import { getTtsUrl } from "@/shared/tts";
import { KANA_ROMAJI } from "@/shared/japanese/kanaTable";
import { CONFUSABLES } from "@/features/lesson/data/hiraganaCurriculum";
import { WORD_IMAGE_MCQ_BLOCKLIST } from "@/features/languages/ja/grammarHelpers";

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
export type RowWord = {
  kana: string;
  meaningEn: string;
  /**
   * Optional. Omit when no Unicode emoji unambiguously represents the
   * word (e.g. いけ "pond"). Words without an emoji are still taught
   * via audio/build/text steps, but are excluded from any visual MCQ
   * (`wordImageMcq` / `priorWordMcq`) where the emoji is the cue.
   */
  emoji?: string;
};

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
    h = Math.imul(h, 16777619);
  }
  // Murmur3 finalizer — 2026-05-18 audit found that the prior naked FNV
  // collapse-via-`% slots` skewed ~55% of word_image_mcq to slot 0
  // because low bits weren't well-mixed for the long-shared-prefix lesson
  // ids. Finalizer fixes the low-bit bias.
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) % slots;
}

function pickThreeKanaDistractors(ctx: RowContext, symbol: string) {
  // Visually-confusable kana first (ね/れ/わ, ぬ/め, た/な — CONFUSABLES
  // map) when already known (this row or the prior-kana pool). The
  // hand-authored rows previously drew row-local only, so the classic
  // confusion pairs were never co-presented (2026-06-13 m1 audit). Cap
  // at 2 so at least one row-mate keeps the in-row contrast.
  const known = new Set([
    ...ctx.allKana.map((v) => v.symbol),
    ...ctx.tileBankPool,
  ]);
  const out: { symbol: string; romaji: string }[] = [];
  for (const c of CONFUSABLES[symbol] ?? []) {
    if (out.length >= 2) break;
    if (c !== symbol && known.has(c) && !out.some((o) => o.symbol === c)) {
      // romaji MUST be populated: `symbol_to_sound` renders it as the
      // button label. Leaving it "" shipped blank buttons (ja-m1-ta-1
      // ち had 2 blank confusable options, 2026-06-13). `symbol_recognition`
      // ignores romaji (glyph-only), so the gap went unnoticed.
      out.push({ symbol: c, romaji: KANA_ROMAJI[c] ?? "" });
    }
  }
  const fromRow = ctx.allKana.filter(
    (v) => v.symbol !== symbol && !out.some((o) => o.symbol === v.symbol),
  );
  const filler = ctx.tileBankPool
    .filter(
      (s) =>
        s !== symbol &&
        !out.some((o) => o.symbol === s) &&
        !fromRow.some((v) => v.symbol === s),
    )
    .map((sym) => ({ symbol: sym, romaji: KANA_ROMAJI[sym] ?? "" }));
  return [...out, ...fromRow, ...filler].slice(0, 3);
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
  // BUG-C 2026-05-18: words without a usable emoji are excluded from
  // visual MCQ — the entire step is emoji-based, so a missing image is
  // unsolvable. Caller must pick a different word OR a different step
  // type (build / listening_comp work without emoji).
  if (!correct.emoji) {
    throw new Error(
      `wordImageMcq: ${correctKana} has no emoji — use listeningBuild or listeningComp instead`,
    );
  }
  // 2026-05-18 audit: words on the blocklist have either a misleading
  // emoji or only weak-correlation custom art. Authors pick a different
  // step type (see docs/emoji-blocked-words-2026-05-18.md).
  if (WORD_IMAGE_MCQ_BLOCKLIST.has(correctKana)) {
    throw new Error(
      `wordImageMcq: ${correctKana} is image-blocked — use listeningBuild / listeningComp / build_sentence instead`,
    );
  }
  const others = ctx.words.filter(
    (w) =>
      w.kana !== correctKana &&
      Boolean(w.emoji) &&
      !WORD_IMAGE_MCQ_BLOCKLIST.has(w.kana),
  );
  const padding = FALLBACK_PADDING_WORDS.filter(
    (w) =>
      w.kana !== correctKana &&
      !ctx.words.some((cw) => cw.kana === w.kana) &&
      !WORD_IMAGE_MCQ_BLOCKLIST.has(w.kana),
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
      options.push({ id: `opt-${i}`, word: d.kana, emoji: d.emoji! });
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
  // BUG-B fix 2026-05-18: don't dedupe required mora. Tester screenshot
  // showed "peach" (もも) rendering one も + 3 distractors — unsolvable.
  // Words with repeated mora (もも, ちち, はは, etc.) need each occurrence
  // as its own tile so the build queue can accept both clicks.
  const required = mora;
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
  { kana: "はな", meaningEn: "flower", emoji: "🌷" },
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
 * Backfill a match_pairs entry list to `targetCount` by drawing additional
 * pairs from `M1_REVIEW_POOL`, skipping any kana already present. Per
 * Spencer's M2 sub-lesson-1 walkthrough (2026-05-18): match-pairs grids
 * with empty slots are wasted review surface — backfill cross-module so
 * the grid is always full AND the empty slots double as review.
 *
 * Deterministic by `seed` so the same lesson always draws the same pad
 * (avoids surprises across reloads).
 */
export function padMatchPairsToTarget<T extends { kana: string; meaning: string }>(
  seed: string,
  base: T[],
  targetCount = 4,
): Array<{ kana: string; meaning: string }> {
  if (base.length >= targetCount) return base;
  const have = new Set(base.map((b) => b.kana));
  const candidates = M1_REVIEW_POOL.filter((w) => !have.has(w.kana));
  const need = targetCount - base.length;
  // Seeded shuffle — same logic as pickReviewWords.
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const shuffled = [...candidates];
  for (let i = shuffled.length - 1; i > 0; i--) {
    h = (h * 16807) % 2147483647;
    const j = Math.abs(h) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const pad = shuffled
    .slice(0, need)
    .map((w) => ({ kana: w.kana, meaning: w.meaningEn }));
  return [...base, ...pad];
}

/* ────────────────────────────────────────────────────────────────────────
 * M1 prior-row review (R2-defer-F, 2026-05-18)
 *
 * Each M1 non-vowel row's LAST sub-lesson appends a 4-item review tail
 * drawn STRICTLY from previously-introduced rows — kana the learner has
 * already met + words assembled from those kana. Pulls retrieval forward
 * (Bjork desirable difficulty) and gives every row final lesson a
 * spacing beat across the M1 chain.
 *
 * Pools below are the source of truth for "what's prior to row X":
 *   - PRIOR_KANA: chained per-row. ka can review only vowels; sa can
 *     review vowels + ka; ta can review vowels + ka + sa; … wa can
 *     review every prior row. NEVER seed a glyph from the current row.
 *   - PRIOR_WORDS: the anchor + secondary words taught in earlier rows.
 *     Reused (no new vocab introduced for the tail per spec).
 *
 * Vowels (`l1`) are intentionally excluded — they have no prior row to
 * review. The helpers throw if called for an unknown row.
 *
 * Each prior-pool entry needs an emoji (RowWord shape) so word_image_mcq
 * can render the visual prompt. Emojis match the source row file's
 * anchor definitions.
 * ──────────────────────────────────────────────────────────────────────── */

const VOWEL_KANA: KanaEntry[] = [
  { symbol: "あ", romaji: "a" },
  { symbol: "い", romaji: "i" },
  { symbol: "う", romaji: "u" },
  { symbol: "え", romaji: "e" },
  { symbol: "お", romaji: "o" },
];
const KA_KANA: KanaEntry[] = [
  { symbol: "か", romaji: "ka" },
  { symbol: "き", romaji: "ki" },
  { symbol: "く", romaji: "ku" },
  { symbol: "け", romaji: "ke" },
  { symbol: "こ", romaji: "ko" },
];
const SA_KANA: KanaEntry[] = [
  { symbol: "さ", romaji: "sa" },
  { symbol: "し", romaji: "shi" },
  { symbol: "す", romaji: "su" },
  { symbol: "せ", romaji: "se" },
  { symbol: "そ", romaji: "so" },
];
const TA_KANA: KanaEntry[] = [
  { symbol: "た", romaji: "ta" },
  { symbol: "ち", romaji: "chi" },
  { symbol: "つ", romaji: "tsu" },
  { symbol: "て", romaji: "te" },
  { symbol: "と", romaji: "to" },
];
const NA_KANA: KanaEntry[] = [
  { symbol: "な", romaji: "na" },
  { symbol: "に", romaji: "ni" },
  { symbol: "ぬ", romaji: "nu" },
  { symbol: "ね", romaji: "ne" },
  { symbol: "の", romaji: "no" },
];
const HA_KANA: KanaEntry[] = [
  { symbol: "は", romaji: "ha" },
  { symbol: "ひ", romaji: "hi" },
  { symbol: "ふ", romaji: "fu" },
  { symbol: "へ", romaji: "he" },
  { symbol: "ほ", romaji: "ho" },
];
const MA_KANA: KanaEntry[] = [
  { symbol: "ま", romaji: "ma" },
  { symbol: "み", romaji: "mi" },
  { symbol: "む", romaji: "mu" },
  { symbol: "め", romaji: "me" },
  { symbol: "も", romaji: "mo" },
];
const YA_KANA: KanaEntry[] = [
  { symbol: "や", romaji: "ya" },
  { symbol: "ゆ", romaji: "yu" },
  { symbol: "よ", romaji: "yo" },
];
const RA_KANA: KanaEntry[] = [
  { symbol: "ら", romaji: "ra" },
  { symbol: "り", romaji: "ri" },
  { symbol: "る", romaji: "ru" },
  { symbol: "れ", romaji: "re" },
  { symbol: "ろ", romaji: "ro" },
];

const VOWEL_WORDS: RowWord[] = [
  { kana: "あい",   meaningEn: "love",  emoji: "❤️" },
  { kana: "いえ",   meaningEn: "house", emoji: "🏠" },
  { kana: "うえ",   meaningEn: "above", emoji: "⬆️" },
  { kana: "あおい", meaningEn: "blue",  emoji: "🔵" },
  { kana: "いいえ", meaningEn: "no",    emoji: "🙅" },
];
const KA_WORDS: RowWord[] = [
  { kana: "かい", meaningEn: "shell",   emoji: "🐚" },
  // BUG-C 2026-05-18: no emoji for "pond" (lotus 🪷 misleads, water
  // collides with other words). Word stays — taught via build/listening;
  // visual MCQ helpers skip it via the `emoji?` optional path.
  { kana: "いけ", meaningEn: "pond" },
  { kana: "かお", meaningEn: "face",    emoji: "😀" },
  { kana: "こえ", meaningEn: "voice",   emoji: "🗣️" },
  { kana: "えき", meaningEn: "station", emoji: "🚉" },
];
const SA_WORDS: RowWord[] = [
  { kana: "あさ", meaningEn: "morning", emoji: "🌅" },
  { kana: "すし", meaningEn: "sushi",   emoji: "🍣" },
  { kana: "そら", meaningEn: "sky",     emoji: "☁️" },
];
const TA_WORDS: RowWord[] = [
  { kana: "うた",   meaningEn: "song",  emoji: "🎵" },
  { kana: "つき",   meaningEn: "moon",  emoji: "🌙" },
  { kana: "とけい", meaningEn: "clock", emoji: "⏰" },
];
const NA_WORDS: RowWord[] = [
  { kana: "なに",   meaningEn: "what",     emoji: "❓" },
  { kana: "ねこ",   meaningEn: "cat",      emoji: "🐱" },
  { kana: "きのこ", meaningEn: "mushroom", emoji: "🍄" },
];
const HA_WORDS: RowWord[] = [
  { kana: "ひと", meaningEn: "person", emoji: "👤" },
  { kana: "ふね", meaningEn: "boat",   emoji: "🚢" },
  { kana: "ほし", meaningEn: "star",   emoji: "⭐" },
];
const MA_WORDS: RowWord[] = [
  { kana: "うま", meaningEn: "horse",  emoji: "🐴" },
  { kana: "かめ", meaningEn: "turtle", emoji: "🐢" },
  { kana: "もも", meaningEn: "peach",  emoji: "🍑" },
];
const YA_WORDS: RowWord[] = [
  { kana: "やま", meaningEn: "mountain", emoji: "⛰️" },
  { kana: "ゆき", meaningEn: "snow",     emoji: "❄️" },
  { kana: "よむ", meaningEn: "to read",  emoji: "📚" },
];
const RA_WORDS: RowWord[] = [
  { kana: "さくら", meaningEn: "cherry blossom", emoji: "🌸" },
  { kana: "これ",   meaningEn: "this",           emoji: "👉" },
  { kana: "いろ",   meaningEn: "color",          emoji: "🌈" },
];

/** Prior-row kana pool — what each row's review tail can draw from. */
export const M1_PRIOR_KANA_POOL: Record<string, KanaEntry[]> = {
  ka: [...VOWEL_KANA],
  sa: [...VOWEL_KANA, ...KA_KANA],
  ta: [...VOWEL_KANA, ...KA_KANA, ...SA_KANA],
  na: [...VOWEL_KANA, ...KA_KANA, ...SA_KANA, ...TA_KANA],
  ha: [...VOWEL_KANA, ...KA_KANA, ...SA_KANA, ...TA_KANA, ...NA_KANA],
  ma: [...VOWEL_KANA, ...KA_KANA, ...SA_KANA, ...TA_KANA, ...NA_KANA, ...HA_KANA],
  ya: [...VOWEL_KANA, ...KA_KANA, ...SA_KANA, ...TA_KANA, ...NA_KANA, ...HA_KANA, ...MA_KANA],
  ra: [...VOWEL_KANA, ...KA_KANA, ...SA_KANA, ...TA_KANA, ...NA_KANA, ...HA_KANA, ...MA_KANA, ...YA_KANA],
  wa: [...VOWEL_KANA, ...KA_KANA, ...SA_KANA, ...TA_KANA, ...NA_KANA, ...HA_KANA, ...MA_KANA, ...YA_KANA, ...RA_KANA],
};

/** Prior-row word pool — anchor + secondary vocab from earlier rows. */
export const M1_PRIOR_WORDS_POOL: Record<string, RowWord[]> = {
  ka: [...VOWEL_WORDS],
  sa: [...VOWEL_WORDS, ...KA_WORDS],
  ta: [...VOWEL_WORDS, ...KA_WORDS, ...SA_WORDS],
  na: [...VOWEL_WORDS, ...KA_WORDS, ...SA_WORDS, ...TA_WORDS],
  ha: [...VOWEL_WORDS, ...KA_WORDS, ...SA_WORDS, ...TA_WORDS, ...NA_WORDS],
  ma: [...VOWEL_WORDS, ...KA_WORDS, ...SA_WORDS, ...TA_WORDS, ...NA_WORDS, ...HA_WORDS],
  ya: [...VOWEL_WORDS, ...KA_WORDS, ...SA_WORDS, ...TA_WORDS, ...NA_WORDS, ...HA_WORDS, ...MA_WORDS],
  ra: [...VOWEL_WORDS, ...KA_WORDS, ...SA_WORDS, ...TA_WORDS, ...NA_WORDS, ...HA_WORDS, ...MA_WORDS, ...YA_WORDS],
  wa: [...VOWEL_WORDS, ...KA_WORDS, ...SA_WORDS, ...TA_WORDS, ...NA_WORDS, ...HA_WORDS, ...MA_WORDS, ...YA_WORDS, ...RA_WORDS],
};

/**
 * Pick `count` items from `pool` deterministically by `seed`. Same
 * shuffle algorithm as `pickReviewWords` so tail item selection rotates
 * across re-runs of the same lesson without thrashing on re-renders.
 */
function pickFromPool<T>(pool: readonly T[], seed: string, count: number): T[] {
  const out = pool.slice();
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 16807) % 2147483647;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, count);
}

function priorKanaFor(rowId: string): KanaEntry[] {
  const pool = M1_PRIOR_KANA_POOL[rowId];
  if (!pool) throw new Error(`priorKanaFor: no prior-kana pool for row ${rowId}`);
  return pool;
}

function priorWordsFor(rowId: string): RowWord[] {
  const pool = M1_PRIOR_WORDS_POOL[rowId];
  if (!pool) throw new Error(`priorWordsFor: no prior-words pool for row ${rowId}`);
  return pool;
}

/**
 * Prior-row `symbol_recognition` — picks a deterministic prior kana
 * (seeded by `${rowId}-rev-${suffix}`) and builds a 4-option recognition
 * step. Distractors are drawn from the SAME prior pool so the learner
 * isn't given "tap the one you haven't seen" as a tell.
 */
export function priorKanaRecognition(rowId: string, suffix: string): LessonStep {
  const pool = priorKanaFor(rowId);
  const seed = `${rowId}-rev-${suffix}`;
  const [target, ...rest] = pickFromPool(pool, seed, 4);
  const distractors = rest.slice(0, 3);
  const slot = correctSlot(`${rowId}-rev-kana-${suffix}`);
  const options: { id: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) options.push({ id: "correct", symbol: target.symbol });
    else options.push({ id: `opt-${i}`, symbol: distractors[di++].symbol });
  }
  return {
    id: `m1-${rowId}-3-rev-recog-${suffix}`,
    type: "symbol_recognition",
    payload: {
      symbol: target.symbol,
      romanization: target.romaji,
      ipa: "",
      hint: "Review — earlier row.",
      scriptId: "hiragana",
      hasStrokeOrder: true,
      audioKey: getTtsUrl(target.symbol) ?? undefined,
    },
    options,
    correctOptionId: "correct",
  };
}

/**
 * Prior-row `symbol_to_sound` — kana → romaji on a previously-introduced
 * glyph. Pulls from the same pool as `priorKanaRecognition` with a
 * different seed suffix so a tail using both never duplicates the kana
 * across the two steps.
 */
export function priorKanaSymbolToSound(rowId: string, suffix: string): LessonStep {
  const pool = priorKanaFor(rowId);
  const seed = `${rowId}-rev-s2s-${suffix}`;
  const [target, ...rest] = pickFromPool(pool, seed, 4);
  const distractors = rest.slice(0, 3);
  const slot = correctSlot(`${rowId}-rev-s2s-${suffix}`);
  const options: { id: string; text: string; symbol: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", text: target.romaji, symbol: target.symbol });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, text: d.romaji, symbol: d.symbol });
    }
  }
  return {
    id: `m1-${rowId}-3-rev-s2s-${suffix}`,
    type: "symbol_to_sound",
    payload: {
      symbol: target.symbol,
      romanization: target.romaji,
      ipa: "",
      hint: "Review — earlier row.",
      scriptId: "hiragana",
      hasStrokeOrder: true,
    },
    options,
    correctOptionId: "correct",
  };
}

/**
 * Prior-row `word_image_mcq` — picks a word from an earlier row and
 * builds a 2×2 emoji grid. Distractors come from the same prior pool;
 * pads with the row's earliest siblings if the pool is short (ka can
 * only pull vowel words — exactly 5, fits 4 slots without padding).
 */
export function priorWordMcq(rowId: string, suffix: string): LessonStep {
  // BUG-C 2026-05-18: emoji-less words can't surface in visual MCQ —
  // both target and distractor pools restricted to emoji-having entries.
  // 2026-05-18 audit: also drop image-blocklisted words (e.g. こえ) —
  // they stay on the row pool for listening/build helpers but never
  // surface as a visual-MCQ target or distractor.
  const pool = priorWordsFor(rowId).filter(
    (w) => Boolean(w.emoji) && !WORD_IMAGE_MCQ_BLOCKLIST.has(w.kana),
  );
  const seed = `${rowId}-rev-word-${suffix}`;
  const [target, ...rest] = pickFromPool(pool, seed, 4);
  const distractors = rest.slice(0, 3);
  const slot = correctSlot(`${rowId}-rev-word-${suffix}`);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: target.kana, emoji: target.emoji! });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, word: d.kana, emoji: d.emoji! });
    }
  }
  return {
    id: `m1-${rowId}-3-rev-word-${suffix}`,
    type: "word_image_mcq",
    meaningEn: target.meaningEn,
    options,
    correctOptionId: "correct",
  };
}

/**
 * Prior-row `build_sentence` — picks a multi-mora word from an earlier
 * row and asks the learner to assemble it. Only 2+ mora words qualify
 * (a 1-mora word like "き" makes a degenerate single-tile build). Tile
 * bank = mora tokens + 1 prior-row decoy so the bank isn't a giveaway.
 */
export function priorWordBuildSentence(rowId: string, suffix: string): LessonStep {
  const pool = priorWordsFor(rowId);
  // Filter to 2+ mora so the build step is meaningful — a 1-tile
  // build_sentence is just a tap-to-confirm.
  const multiMora = pool.filter((w) => moraTilesFor(w.kana).length >= 2);
  if (multiMora.length === 0) {
    throw new Error(`priorWordBuildSentence: no multi-mora prior words for ${rowId}`);
  }
  const seed = `${rowId}-rev-build-${suffix}`;
  const [target] = pickFromPool(multiMora, seed, 1);
  const mora = moraTilesFor(target.kana);
  // Decoys = mora drawn from OTHER prior words, padded to answer + 3 so
  // the build discriminates rather than just orders (a 1-decoy bank —
  // or いいえ's ZERO-decoy bank — was nearly a giveaway). Still honors
  // the "prior-row only" rule: decoys never preview the current row.
  const decoyCandidates = pickFromPool(
    pool.filter((w) => w.kana !== target.kana),
    `${seed}-decoy`,
    pool.length,
  );
  const decoys: string[] = [];
  outer: for (const w of decoyCandidates) {
    for (const t of moraTilesFor(w.kana)) {
      if (!mora.includes(t) && !decoys.includes(t)) {
        decoys.push(t);
        if (decoys.length >= 3) break outer;
      }
    }
  }
  const tiles = [...mora, ...decoys];
  return {
    id: `m1-${rowId}-3-rev-build-${suffix}`,
    type: "build_sentence",
    prompt: `Build the word for '${target.meaningEn}'`,
    targetSentence: target.kana,
    tiles,
    correctOrder: mora,
    granularity: "character",
    audioKey: target.kana,
    targetAnnotation: [{ surface: target.kana, reading: target.kana }],
  };
}

/**
 * `priorWordMcq` variant that lets the caller exclude a word already
 * used by the tail (typically the build target) so the same lexical
 * item doesn't recur across two adjacent tail steps. Needed because
 * tiny prior pools (e.g. ka can only draw from 5 vowel words) can land
 * the deterministic build + mcq seeds on the same word.
 */
function priorWordMcqExcluding(
  rowId: string,
  suffix: string,
  excludeKana: ReadonlySet<string>,
): LessonStep {
  // BUG-C 2026-05-18: emoji-less words (e.g. いけ) can't be a visual-MCQ
  // target or distractor — the entire step uses the emoji as the cue.
  // Excluded from both correct-candidate and distractor pools.
  // 2026-05-18 audit: also exclude image-blocklisted words (e.g. こえ).
  const pool = priorWordsFor(rowId).filter(
    (w) =>
      !excludeKana.has(w.kana) &&
      Boolean(w.emoji) &&
      !WORD_IMAGE_MCQ_BLOCKLIST.has(w.kana),
  );
  if (pool.length === 0) {
    throw new Error(`priorWordMcqExcluding: pool empty after exclusion for ${rowId}`);
  }
  const seed = `${rowId}-rev-word-${suffix}`;
  const [target, ...rest] = pickFromPool(pool, seed, 4);
  // Distractors: prefer same-pool foils; fall back to the full prior
  // pool (minus target, emoji-having only) if the post-exclusion pool
  // is shorter than 4.
  const fullPool = priorWordsFor(rowId).filter(
    (w) =>
      w.kana !== target.kana &&
      Boolean(w.emoji) &&
      !WORD_IMAGE_MCQ_BLOCKLIST.has(w.kana),
  );
  const distractorSource = rest.length >= 3 ? rest : fullPool.slice(0, 3);
  const distractors = distractorSource.slice(0, 3);
  const slot = correctSlot(`${rowId}-rev-word-${suffix}`);
  const options: { id: string; word: string; emoji: string }[] = [];
  let di = 0;
  for (let i = 0; i < 4; i++) {
    if (i === slot) {
      options.push({ id: "correct", word: target.kana, emoji: target.emoji! });
    } else {
      const d = distractors[di++];
      options.push({ id: `opt-${i}`, word: d.kana, emoji: d.emoji! });
    }
  }
  return {
    id: `m1-${rowId}-3-rev-word-${suffix}`,
    type: "word_image_mcq",
    meaningEn: target.meaningEn,
    options,
    correctOptionId: "correct",
  };
}

/**
 * Build the standard 4-item M1 prior-row review tail: 2 kana
 * (recognition + symbol_to_sound, different cognitive directions) +
 * 1 word build + 1 word mcq. Interleave guarantees no two same-type
 * steps adjacent. Caller drops this array directly into the row's
 * final sub-lesson `steps` before the closing info card.
 *
 * Order rationale (Bjork retrieval + interleave):
 *   1. kana recognition  — easier "audio → kana", warm-up
 *   2. word build_sentence  — production direction, harder
 *   3. kana symbol_to_sound — kana → romaji, harder recall
 *   4. word image_mcq      — meaning recall, closes on success
 *
 * The wordMcq excludes whatever word the build step picked so the
 * same lexical item never recurs across two tail steps (ka's pool of
 * 5 vowel words would otherwise collide on あい).
 */
export function priorRowReviewTail(rowId: string): LessonStep[] {
  const buildStep = priorWordBuildSentence(rowId, "1");
  // build_sentence carries the answer in targetSentence (always defined
  // for our prior-word builds).
  const buildWord =
    buildStep.type === "build_sentence" ? buildStep.targetSentence : "";
  return [
    priorKanaRecognition(rowId, "1"),
    buildStep,
    priorKanaSymbolToSound(rowId, "2"),
    priorWordMcqExcluding(rowId, "1", new Set([buildWord])),
  ];
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
