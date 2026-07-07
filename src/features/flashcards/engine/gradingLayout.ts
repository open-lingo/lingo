import type { SRSRating } from "../data/types";
import { getSRSStore } from "./srsStorage";

/**
 * Grading-button layout for the flashcard reviewer.
 *
 * - `"simple"` — two buttons: "Didn't know" (→ `again`) / "Knew it" (→ `good`).
 * - `"full"`   — the four-button Again/Hard/Good/Easy row.
 */
export type GradingLayout = "simple" | "full";

/**
 * Resolve the effective grading layout. Pure so the history-aware default is
 * unit-testable without touching localStorage.
 *
 * - An explicit user preference always wins (once they touch the toggle, their
 *   choice is authoritative forever).
 * - With no explicit preference, default to `"full"` for a learner who has
 *   already reviewed a card (they've seen the 4-button row and understand the
 *   grades), and `"simple"` for a fresh learner.
 */
export function resolveGradingLayout(
  explicitPref: GradingLayout | undefined,
  hasAnyReviewedCard: boolean,
): GradingLayout {
  if (explicitPref === "simple" || explicitPref === "full") return explicitPref;
  return hasAnyReviewedCard ? "full" : "simple";
}

/**
 * Cheapest honest check for "has the learner ever reviewed a card?" — scans the
 * local SRS store for any card whose state shows a completed review: either a
 * top-level `lastReviewedAt` stamp (set by `reviewCard`) or a modality sub-state
 * with `reps > 0`. Short-circuits on the first hit.
 */
export function hasAnyReviewedCard(): boolean {
  const store = getSRSStore();
  for (const state of Object.values(store)) {
    if (state.lastReviewedAt) return true;
    if (state.recognition.reps > 0 || state.production.reps > 0) return true;
  }
  return false;
}

/** Map a simple-mode button to its FSRS rating. */
export const SIMPLE_RATING: Record<"didntKnow" | "knewIt", SRSRating> = {
  didntKnow: "again",
  knewIt: "good",
};
