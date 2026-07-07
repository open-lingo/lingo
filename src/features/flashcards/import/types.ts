/**
 * External-study import — normalized `known-items export v1` schema mirror
 * (anki-import-spec-2026-07-07 §"Normalized schema"). This is the FROZEN
 * interface contract shared with the offline extractor (`scripts/anki-
 * export-known.py`); the in-app half only ever consumes it. Keep in lockstep
 * with the extractor's header docstring.
 */

/** Evidence class from the extractor. */
export type EvidenceClass = "active" | "suspended-reviewed";

/** Per-note SRS evidence carried by one exported item. */
export interface KnownItemEvidence {
  /** "active" (in review queue) vs "suspended-reviewed" (weaker). */
  class: EvidenceClass;
  /** Current SRS interval in days; 0 if unknown. */
  intervalDays: number;
  /** Lifetime reviews across the note's cards. */
  reps: number;
  /** Lifetime lapses. */
  lapses: number;
  /** ISO date of the most recent review (optional). */
  lastReviewAt?: string;
  /** Provenance (deck path etc.), optional. */
  source?: string;
}

/** One studied item. */
export interface KnownItem {
  /** Surface form as studied (required, non-empty). */
  expression: string;
  /** Phonetic form (optional). */
  reading?: string;
  /** Gloss (optional). */
  meaning?: string;
  evidence: KnownItemEvidence;
}

/** Top-level export document. */
export interface KnownItemsExport {
  /** Schema version — must be 1. */
  version: 1;
  /** Lingo language id (e.g. "ja"). */
  language: string;
  /** Extractor id (e.g. "anki"). */
  source: string;
  /** ISO timestamp the export was produced. */
  exportedAt: string;
  items: KnownItem[];
}

/**
 * Outcome of applying a matched import (seed.ts).
 *
 * - `matchedItems`  — distinct export items that matched ≥1 atom.
 * - `seededCards`   — cards actually written (excludes no-clobber skips).
 * - `skippedExisting` — cards left untouched because real progress (`reps>0`)
 *   already existed on either modality.
 * - `unlockedAtoms` — matched atoms unlocked (0 when the toggle is off).
 * - `unmatched`     — items that matched no atom (preserved for a future
 *   custom-deck pass; downloadable from the report screen).
 * - `multiMatches`  — items that credited more than one atom (transparency).
 */
export interface ImportReport {
  matchedItems: number;
  seededCards: number;
  skippedExisting: number;
  unlockedAtoms: number;
  unmatched: KnownItem[];
  multiMatches: number;
}
