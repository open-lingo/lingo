/**
 * Types for vocab graduation — Phase 2.
 *
 * Anchor words "graduate" from the Learn lessons into the Flashcards
 * SRS pool when their module completes. This module owns the snapshot
 * + storage; the flashcards-side receiver (other maintainer) consumes
 * the events.
 */

export type GraduatedItem = {
  /** The kana / surface form, e.g. "みず". */
  kana: string;
  /** Romaji, e.g. "mizu". */
  romaji: string;
  /** English meaning, e.g. "water". */
  meaning: string;
  /** Module id that graduated this item, e.g. "m1". */
  sourceModuleId: string;
  /** Module title at graduation time, e.g. "Module 1 · Hiragana". */
  sourceModuleTitle: string;
  /** ISO 8601 timestamp of graduation. */
  unlockedAt: string;
};

/** Per-course store: `{ courseId: GraduatedItem[] }`. */
export type VocabGraduationStore = Record<string, GraduatedItem[]>;
