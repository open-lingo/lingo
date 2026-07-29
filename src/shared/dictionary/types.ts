/**
 * Dictionary lookup service — public types.
 *
 * A `DictionaryEntry` is the language-agnostic, reference-oriented view of a
 * single word we know about: authored course vocab unioned with the frequency
 * ("optional") vocab. It is built entirely off the language registry, so a 4th
 * language needs zero changes here. See `./index.ts` for the API.
 *
 * `PartOfSpeech` and `ConjugationTable` are reused from the language-module
 * contract (`@/shared/language/types`) rather than redefined — `conjugation`
 * carries the resolved paradigm table (forms keyed by form name), which the
 * UI can render directly or hand to `module.conjugation.trainer`.
 */
import type { ConjugationTable, PartOfSpeech } from "@/shared/language/types";

export type { PartOfSpeech, ConjugationTable };

/**
 * Where the entry came from:
 * - `course` — an authored course atom only.
 * - `frequency` — a frequency-vocab atom only (no authored lesson surfaces it).
 * - `both` — present in both; keeps the course definition/reading and gains the
 *   frequency rank.
 */
export type DictionarySource = "course" | "frequency" | "both";

export interface DictionaryEntry {
  /** Canonical, language-prefixed atom id (`ja:ai`, `ko:하다`, `es:cerveza`). */
  id: string;
  languageId: string;
  /** Target-language display form (kana for JA, Hangul for KO, surface for ES). */
  surface: string;
  /**
   * Reading aid — romaji (JA) / Revised Romanization (KO), from the atom's
   * pre-baked romanization. Falls back to `surface` for Latin-script languages
   * (ES) where the surface is already the reading.
   */
  reading: string;
  /** Short English meaning. */
  meaningEn: string;
  pos: PartOfSpeech;
  /** 1 = most frequent. Present only when the word is in the frequency vocab. */
  frequencyRank?: number;
  /**
   * Content module at which the word becomes available (`m3`). Authored-taught
   * words use their curriculum module; frequency-gated words that have no
   * authored lesson use their frequency unlock module. `future` / `sidequest-*`
   * for course atoms with no numeric module.
   */
  unlockModule?: string;
  source: DictionarySource;
  /** Resolved conjugation paradigm (from `module.conjugation.tables`), if any. */
  conjugation?: ConjugationTable;
  /** True when a recorded TTS clip exists in the language's tts manifest. */
  hasAudio?: boolean;
}

/** Options for {@link searchDictionary}. */
export interface SearchOptions {
  /** Cap the number of results (default: unbounded). */
  limit?: number;
}

/** Options for {@link getDictionaryEntries}. */
export interface EntryQueryOptions {
  /** Keep only these part(s) of speech. */
  pos?: PartOfSpeech | PartOfSpeech[];
  /** Keep only these source bucket(s). */
  source?: DictionarySource | DictionarySource[];
  /** Keep only entries unlocked at or before this content module number. */
  maxUnlockModule?: number;
  /** Sort order. `frequency` (default) = most-frequent first; `surface` = A→Z. */
  sort?: "frequency" | "surface";
  /** Cap the number of results (default: unbounded). */
  limit?: number;
}
