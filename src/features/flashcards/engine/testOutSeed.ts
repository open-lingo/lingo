import type { SRSCardState, SRSModalityState, SRSPhase } from "../data/types";
import { addDays } from "./srs";

/**
 * FSRS seeding curve for "you already know this" signals — test-out and
 * banded placement (Spencer QA 2026-09-14, TestFlight b12 #80, `docs/
 * user-feedback/2026-09-14-testflight-b12.md` §5). This is the SEVENTH SRS
 * write surface ("test-out seed") — see the six-surfaces list in CLAUDE.md.
 *
 * When a learner tests out of (or places past) module N, every atom from an
 * earlier module M gets a synthetic FSRS interval proportional to how far
 * back it was introduced:
 *
 *   distance = (highest module tested out of) − (module that introduces
 *              the atom) + 1
 *   interval = distance × DAYS_PER_MODULE days
 *
 * Distance is floored at 1 so the just-tested module's OWN atoms still get
 * a real interval (5 days), not 0 — `distance(30, 30) === 1 → 5 days`;
 * `distance(30, 1) === 30 → 150 days`.
 *
 * This is a LINEAR curve, not exponential. Spencer's quote gave two anchors
 * that don't agree: "5 days per module" (stated rate) vs. his own worked
 * example, "test out of module 30 ... module one gets 120 days" (29 × 5 =
 * 145, not 120). The coordinator's call (this lane) was to trust the stated
 * per-module rate and add the `+1` so the tested module itself isn't
 * zeroed out — flagged to Spencer on the QA page rather than silently
 * resolved either way.
 */
export const DAYS_PER_MODULE = 5;
export const KNOWN_THRESHOLD_DAYS = 90;

/**
 * Module distance for the seeding curve. Floored at 1 — an atom introduced
 * AT or AFTER the highest tested module still counts as "just tested," not
 * "not tested" (a distance of 0 or negative would zero out or invert the
 * curve for the tested module's own atoms).
 */
export function moduleDistance(
  highestModuleIndex: number,
  introducedModuleIndex: number,
): number {
  return Math.max(1, highestModuleIndex - introducedModuleIndex + 1);
}

/**
 * The linear seeding curve: `distance` modules back → `distance ×
 * DAYS_PER_MODULE` days. Pure function of Spencer's stated per-module rate.
 */
export function seedIntervalDays(distance: number): number {
  return Math.max(1, Math.round(distance)) * DAYS_PER_MODULE;
}

/**
 * ≥ KNOWN_THRESHOLD_DAYS (90) = "known": suppressed from the flashcard
 * reviewer and review-lesson intake (never surfaces on its own), visible
 * only — with a badge, un-suppressible — in Card Manager. 60–89 days is
 * NOT known; it's ordinary FSRS at that (long) interval, i.e. it "gets a
 * little further" per Spencer's quote but still surfaces once due.
 */
export function isKnown(intervalDays: number): boolean {
  return intervalDays >= KNOWN_THRESHOLD_DAYS;
}

function seededSubState(intervalDays: number, today: string): SRSModalityState {
  return {
    // No independent seed input for stability here — approximate it as the
    // interval itself (FSRS stability ≈ interval at the app's ~90% target
    // retention), close enough for a synthetic "already proven" state that
    // review-lesson/reviewer surfaces only need to sort/display.
    stability: intervalDays,
    difficulty: 5, // mid-scale; a test-out carries no real difficulty signal.
    state: "review" as SRSPhase,
    interval: intervalDays,
    dueDate: addDays(today, intervalDays),
    lastReviewDate: today,
    reps: 1,
    lapses: 0,
  };
}

/**
 * Build the FSRS card state a test-out/placement pass seeds for one atom.
 * Both modalities get the identical synthetic interval — a test-out proves
 * the atom in aggregate, not per-modality (mirrors the flat, single-shape
 * seed `applyPlacement.ts`'s old `createPlacementSeedState` used, which
 * this replaces).
 */
export function createTestOutSeedState(
  intervalDays: number,
  today: string,
): SRSCardState {
  const sub = seededSubState(intervalDays, today);
  return {
    recognition: { ...sub },
    production: { ...sub },
    known: isKnown(intervalDays),
  };
}

/**
 * How "advanced" an existing card is, for the never-shorten guard: the
 * weaker of its two modalities (a card is only as strong as its weakest
 * direction). No existing state → -1, always less advanced than any seed.
 */
function existingIntervalDays(state: SRSCardState | undefined): number {
  if (!state) return -1;
  return Math.min(state.recognition.interval, state.production.interval);
}

/**
 * Seeding only applies to atoms with no existing SRS state, or a state
 * less advanced than the computed seed — NEVER shorten an existing longer
 * interval.
 */
export function shouldSeedTestOut(
  existing: SRSCardState | undefined,
  seedInterval: number,
): boolean {
  return existingIntervalDays(existing) < seedInterval;
}
