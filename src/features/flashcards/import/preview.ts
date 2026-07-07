/**
 * External-study import — preview computation for the settings card
 * (anki-import-spec-2026-07-07 §UI). Pure-ish: reads the SRS store to count
 * cards that already carry real progress ("already tracked"). Kept out of the
 * component so it is unit-testable.
 */
import { getCardState } from "../engine/srsStorage";
import { matchKnownItems, type ImportMatch } from "./match";
import type { KnownItem, KnownItemsExport } from "./types";

export interface ImportPreview {
  language: string;
  /** N — total items in the export. */
  totalItems: number;
  /** X — distinct atoms matched. */
  matchAtoms: number;
  /** Y — matched atoms already tracked (real reps>0; would be skipped). */
  alreadyTracked: number;
  /** Z — items matching no atom (beyond the course). */
  beyondCourse: number;
  matches: ImportMatch[];
  unmatched: KnownItem[];
  multiMatches: number;
}

export function computeImportPreview(exp: KnownItemsExport): ImportPreview {
  const { matches, unmatched, multiMatches } = matchKnownItems(exp.items, exp.language);

  const cardIds = new Set<string>();
  let alreadyTracked = 0;
  for (const m of matches) {
    if (cardIds.has(m.cardId)) continue;
    cardIds.add(m.cardId);
    const state = getCardState(m.cardId);
    if (state && (state.recognition.reps > 0 || state.production.reps > 0)) {
      alreadyTracked++;
    }
  }

  return {
    language: exp.language,
    totalItems: exp.items.length,
    matchAtoms: cardIds.size,
    alreadyTracked,
    beyondCourse: unmatched.length,
    matches,
    unmatched,
    multiMatches,
  };
}
