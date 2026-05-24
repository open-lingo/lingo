import type { SRSCardState, SRSModalityState, SRSPhase } from "../data/types";

/**
 * Pre-modality (flat) FSRS-6 state. This is what was stored in localStorage
 * before the 2026-05-23 modality split. Detected and upgraded on read so
 * existing learner progress isn't dropped.
 *
 * Note: SM-2 shape (easeFactor + repetitions, no stability) is NOT this —
 * those get dropped by the storage validator entirely, matching the
 * fsrs6-engine-roundtrip e2e assertion.
 */
export type LegacyFlatFsrsState = SRSModalityState & {
  lastSyncedAt?: string;
  buriedUntil?: string;
};

const VALID_PHASES: ReadonlySet<SRSPhase> = new Set([
  "new",
  "learning",
  "review",
  "relearning",
]);

/**
 * Type guard: input matches the pre-modality (flat) FSRS-6 shape.
 * Distinguishes from SM-2 (no stability) and from modal (has recognition
 * sub-state).
 */
export function isLegacyFlatFsrsState(v: unknown): v is LegacyFlatFsrsState {
  if (!v || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  if ("recognition" in obj || "production" in obj) return false;
  return (
    typeof obj.stability === "number" &&
    typeof obj.difficulty === "number" &&
    typeof obj.state === "string" &&
    VALID_PHASES.has(obj.state as SRSPhase) &&
    typeof obj.interval === "number" &&
    typeof obj.dueDate === "string" &&
    typeof obj.lastReviewDate === "string" &&
    typeof obj.reps === "number" &&
    typeof obj.lapses === "number" &&
    (obj.learningSteps === undefined || typeof obj.learningSteps === "number")
  );
}

/**
 * Upgrade a flat FSRS-6 state to the modal shape by copying the FSRS
 * variables into both sub-states. Hoists card-shared fields (lastSyncedAt,
 * buriedUntil) to the top level.
 *
 * The "both sub-states get the same starting state" choice is intentional:
 * we don't know which direction the legacy progress represents, so crediting
 * both is the most learner-friendly migration (under-progress feels worse
 * than over-progress for an already-engaged learner).
 */
export function migrateFlatToModal(flat: LegacyFlatFsrsState): SRSCardState {
  const { lastSyncedAt, buriedUntil, ...modality } = flat;
  const subState: SRSModalityState = {
    stability: modality.stability,
    difficulty: modality.difficulty,
    state: modality.state,
    interval: modality.interval,
    dueDate: modality.dueDate,
    lastReviewDate: modality.lastReviewDate,
    reps: modality.reps,
    lapses: modality.lapses,
  };
  if (modality.learningSteps !== undefined) {
    subState.learningSteps = modality.learningSteps;
  }
  const result: SRSCardState = {
    recognition: { ...subState },
    production: { ...subState },
  };
  if (lastSyncedAt !== undefined) result.lastSyncedAt = lastSyncedAt;
  if (buriedUntil !== undefined) result.buriedUntil = buriedUntil;
  return result;
}
