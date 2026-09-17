import type { SRSCardState } from "../data/types";
import { isDue } from "./srs";
import { canonicalizeCardId, type SRSStore } from "./srsStorage";

/**
 * READ-ONLY due-ness ranking helpers (A8, 2026-09-17,
 * docs/learning-loop-2026-09-17.md). No write-surface changes — these never
 * call `setCardState`/`setSRSStore`/`seedTestOutAtom*`, just read an
 * already-loaded `SRSStore` value and classify/sort ids over it.
 *
 * `matchPairsFloor.ts`'s `weaknessScore` (shipped 2026-09-15, RULE 3) proved
 * this exact ranking — overdue days, then stability, then difficulty — for
 * one pad pass. This file is the shared, generic version so a second caller
 * (`reviewGridFsrsSelection.ts`) doesn't reimplement the formula, and it
 * keeps the two axes the brief asks for ("most overdue first, then lowest
 * stability") separate rather than pre-blended into one score.
 */

const DAY_MS = 86_400_000;

/** Days past due across both modalities (min dueDate vs `todayMs`); 0 if not overdue. */
export function overdueDays(state: SRSCardState, todayMs: number = Date.now()): number {
  const dueMs = Math.min(
    new Date(state.recognition.dueDate).getTime(),
    new Date(state.production.dueDate).getTime(),
  );
  return Number.isFinite(dueMs) ? Math.max(0, (todayMs - dueMs) / DAY_MS) : 0;
}

/** Lower (more fragile) of the two modalities' FSRS stability. */
export function minStability(state: SRSCardState): number {
  return Math.min(state.recognition.stability, state.production.stability);
}

export type DueRank = {
  id: string;
  state: SRSCardState | undefined;
  due: boolean;
  overdueDays: number;
  minStability: number;
};

/** Classify one id's due-ness against a (caller-supplied) store snapshot. */
export function rankOne(id: string, store: SRSStore, todayMs: number = Date.now()): DueRank {
  const state = store[canonicalizeCardId(id)];
  if (!state) {
    return { id, state: undefined, due: false, overdueDays: 0, minStability: Infinity };
  }
  return {
    id,
    state,
    due: isDue(state),
    overdueDays: overdueDays(state, todayMs),
    minStability: minStability(state),
  };
}

/**
 * Sort ids by FSRS due-ness: ids with stored state before ids without
 * (stateless ids keep their original relative order among themselves — no
 * ranking possible), due before not-due, most-overdue first, then
 * lowest-stability first. Ties keep original relative order (stable).
 *
 * Pure: `store` is a plain value, never re-read from localStorage here.
 */
export function sortIdsByDueness(
  ids: readonly string[],
  store: SRSStore,
  todayMs: number = Date.now(),
): string[] {
  const ranked = ids.map((id, i) => ({ ...rankOne(id, store, todayMs), i }));
  ranked.sort((a, b) => {
    const aHas = !!a.state;
    const bHas = !!b.state;
    if (aHas !== bHas) return aHas ? -1 : 1;
    if (!aHas) return a.i - b.i;
    if (a.due !== b.due) return a.due ? -1 : 1;
    if (a.overdueDays !== b.overdueDays) return b.overdueDays - a.overdueDays;
    if (a.minStability !== b.minStability) return a.minStability - b.minStability;
    return a.i - b.i;
  });
  return ranked.map((r) => r.id);
}

/** Fraction (0-1) of `ids` that carry any stored FSRS state. */
export function stateCoverage(ids: readonly string[], store: SRSStore): number {
  if (ids.length === 0) return 0;
  let n = 0;
  for (const id of ids) if (store[canonicalizeCardId(id)]) n++;
  return n / ids.length;
}
