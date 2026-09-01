/**
 * Frequency ("optional") vocabulary — shared data model + gating math.
 *
 * Frequency atoms are words BEYOND the authored lessons that a learner can
 * opt into. Each unlocks at (or before) the learner's reached module, so they
 * already have the grammar to handle the word. Per-language registries live in
 * `<lang>/frequencyAtoms.ts`; the resolver in `frequencyResolver.ts` gates them
 * by module and hands the deck builder unlocked ids.
 *
 * This file is intentionally dependency-light (no per-language imports) so it
 * can sit under `features/languages` and be consumed by both languages and the
 * flashcards deck layer without an import cycle. The conjugation link is a
 * generic parameter, so JA supplies `JaConjugationLink` and KO supplies
 * `KoConjugationLink` without this type having to know either.
 */
import type { PartOfSpeech } from "@/shared/language/types";

/**
 * A single frequency-vocab word. `id` is canonical + language-prefixed
 * (`ja:tiishatsu`, `ko:시간`) so it shares the SRS/unlock key space with course
 * atoms — a JA frequency atom derived from a `fromModule: "future"` course atom
 * keeps that atom's id and therefore its existing course-deck card.
 *
 * @typeParam Conj - the language's conjugation-link shape (JaConjugationLink /
 *   KoConjugationLink). `never` for a language with no conjugation linkage.
 */
export type FrequencyAtom<Conj = never> = {
  /** Canonical, language-prefixed atom id (shares the SRS/unlock key space). */
  id: string;
  /** Display surface — kana (JA) / Hangul (KO). */
  surface: string;
  /** Reading aid — romaji (JA) / Revised Romanization (KO). */
  reading: string;
  /** Short English gloss. */
  meaningEn: string;
  /** Part of speech (shared taxonomy). */
  pos: PartOfSpeech;
  /** 1 = most frequent. Monotonic input to {@link frequencyRankToModule}. */
  frequencyRank: number;
  /** Content module at/after which this word unlocks (`frequencyRankToModule`). */
  unlockModule: number;
  /** Conjugation-engine link, on conjugable lemmas only. */
  conjugation?: Conj;
  /**
   * Learner-list difficulty grade, where the source provides one
   * (KO: 학습용 어휘 목록 2003 등급 A/B/C = level 1/2/3). Optional — JA has none.
   */
  grade?: "A" | "B" | "C";
  /**
   * Standard-curriculum fluency level, where the source provides one
   * (KO: 국제 통용 한국어 표준 교육과정 2017, 1급–6급 ≈ TOPIK/Sejong levels).
   */
  intlLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Discriminator — always "freq". */
  source: "freq";
};

/**
 * Rank-bucketing constants (single source of truth for gating).
 *
 * - Frequency words never appear before {@link FREQ_FIRST_MODULE}: the learner
 *   needs basic sentence grammar (post-kana, first grammar modules) before
 *   free vocabulary is useful.
 * - {@link FREQ_WORDS_PER_MODULE} words unlock per module thereafter — a fixed,
 *   controlled drip. A large deck (KO ~3k) does NOT spread evenly across every
 *   module (that floods each one); it drips the fixed rate and lets the
 *   overflow — the "extra" words past what the drip covers over the course —
 *   pile at the last module, available once the learner has progressed that far.
 *   Combined with the SRS intake throttle, never floods.
 * - Bounded above by {@link FREQ_LAST_MODULE_DEFAULT} (min of JA=30 / KO=27
 *   content modules): the last module is the catch-all where that overflow
 *   lands. Each registry passes its own `lastModule` for its true range.
 */
export const FREQ_FIRST_MODULE = 3;
export const FREQ_WORDS_PER_MODULE = 20;
export const FREQ_LAST_MODULE_DEFAULT = 27;

/** Tuning overrides for {@link frequencyRankToModule}. */
export type FrequencyRankToModuleOpts = {
  firstModule?: number;
  wordsPerModule?: number;
  lastModule?: number;
};

/**
 * Map a frequency rank (1 = most frequent) to the content module that unlocks
 * it. Monotonic non-decreasing in `rank`, clamped to
 * `[firstModule, lastModule]`. This is the ONE source of truth for
 * frequency-vocab gating — registries bake `unlockModule` from it and the
 * resolver gates against the same values.
 */
export function frequencyRankToModule(
  rank: number,
  opts: FrequencyRankToModuleOpts = {},
): number {
  const firstModule = opts.firstModule ?? FREQ_FIRST_MODULE;
  const wordsPerModule = opts.wordsPerModule ?? FREQ_WORDS_PER_MODULE;
  const lastModule = opts.lastModule ?? FREQ_LAST_MODULE_DEFAULT;
  // Guard degenerate inputs — rank is 1-based; bucket size is at least 1.
  const safeRank = Math.max(1, Math.floor(rank));
  const perBucket = Math.max(1, Math.floor(wordsPerModule));
  const bucket = Math.floor((safeRank - 1) / perBucket); // 0-based
  return Math.min(lastModule, firstModule + bucket);
}
