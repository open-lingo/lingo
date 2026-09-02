import type { SRSRating } from "../data/types";

/**
 * Grading-button layout for the flashcard reviewer.
 *
 * - `"simple"` — two buttons: "Didn't know" (→ `again`) / "Knew it" (→ `good`).
 * - `"full"`   — the four-button Again/Hard/Good/Easy row.
 */
export type GradingLayout = "simple" | "full";

/**
 * Resolve the effective grading layout.
 *
 * TWO BUTTONS ARE THE DEFAULT FOR EVERYONE (Spencer, 2026-09-02). This used to
 * take a second argument, `hasAnyReviewedCard`, and return `"full"` for anyone
 * who had ever graded a card. That meant the reviewer changed shape between the
 * learner's first and second session with nothing announcing it — and on a
 * phone the four-button row is the widest, most cramped thing on the screen.
 * Four stays available, but only when the learner picks it in review settings
 * (`flashcards.gradingLayoutLabel`), and that choice is authoritative forever.
 */
export function resolveGradingLayout(
  explicitPref: GradingLayout | undefined,
): GradingLayout {
  return explicitPref === "full" ? "full" : "simple";
}

/** Map a simple-mode button to its FSRS rating. */
export const SIMPLE_RATING: Record<"didntKnow" | "knewIt", SRSRating> = {
  didntKnow: "again",
  knewIt: "good",
};
