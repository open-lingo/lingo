import { getSRSStore } from "@/features/flashcards/engine/srsStorage";
import type { SRSStore } from "@/features/flashcards/engine/srsStorage";
import { sortIdsByDueness, stateCoverage } from "@/features/flashcards/engine/dueRanking";

/**
 * FSRS-fed candidate selection for review grids / practice padding, behind
 * `reviewGridsFromFsrs` (`src/shared/config/featureFlags.ts`). OFF by
 * default — see docs/learning-loop-2026-09-17.md for the read/write map
 * (task 1) and the A/B design for deciding whether this is worth turning on.
 *
 * CONTRACT (do not weaken): this is a PERMUTATION, never a filter. It takes
 * `candidates` — an already comprehensibility-gated pool, exactly the shape
 * every pad/selection pass in this codebase already builds before ranking
 * (e.g. `moduleCompiler.ts`'s `fullPool = declaredPool.filter(usableHere)`,
 * `matchPairsFloor.ts`'s `prior` filtered by `taughtBefore`) — and returns
 * the SAME ids, only reordered. It can never add an id that wasn't already
 * in `candidates`, so a caller that only ever passes introduced/gated atoms
 * in (as today's callers already do) cannot have this function surface a
 * never-introduced one. "Intro before review" and comprehensibility-gating
 * stay enforced entirely upstream of this file, unchanged — see the gate
 * test in reviewGridFsrsSelection.test.ts.
 */
export type FsrsSelectionOptions = {
  /** The flag value. false → identity (today's heuristic order, untouched). */
  enabled: boolean;
  /** Injectable store for tests; defaults to the live `getSRSStore()`. */
  store?: SRSStore;
  /**
   * Minimum fraction (0-1) of `candidates` that must carry stored FSRS
   * state before ranking is trusted. Below this, returns the heuristic
   * (input) order untouched — guards new users, SSR, and a fresh install
   * where ranking a near-empty store would read as noise, not a win.
   * Default 0.5.
   */
  minCoverage?: number;
  todayMs?: number;
};

const DEFAULT_MIN_COVERAGE = 0.5;

/**
 * Reorder `candidates` (atom/card ids) by FSRS due-ness — most overdue
 * first, then lowest stability — when `opts.enabled`. Falls back to the
 * untouched heuristic order when disabled, when the store has state for
 * too few candidates, or when `candidates` is empty.
 *
 * Pure aside from the injected/live store read: no writes, no randomness,
 * same output for the same (candidates, store, todayMs).
 */
export function selectReviewCandidatesByFsrs(
  candidates: readonly string[],
  opts: FsrsSelectionOptions,
): string[] {
  if (!opts.enabled || candidates.length === 0) return [...candidates];
  const store = opts.store ?? getSRSStore();
  const minCoverage = opts.minCoverage ?? DEFAULT_MIN_COVERAGE;
  if (stateCoverage(candidates, store) < minCoverage) return [...candidates];
  return sortIdsByDueness(candidates, store, opts.todayMs);
}
