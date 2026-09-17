import type { LessonContent } from "../types";
import { getStepAtomIds, shouldWriteSrs } from "./_stepPredicates";
import { getSRSStore, canonicalizeCardId, type SRSStore } from "@/features/flashcards/engine/srsStorage";
import { isDue } from "@/features/flashcards/engine/srs";
import {
  logReviewGridServed,
  type ReviewGridServedPayload,
} from "@/shared/telemetry/sessionLog";

/**
 * A8 (2026-09-17) — always-on, local-only instrumentation: what does a
 * compiled lesson's graded (review-grid / practice-padding) content look
 * like against the learner's live FSRS due state? Read-only: never writes
 * FSRS, never changes what's served. See docs/learning-loop-2026-09-17.md
 * for the design and how to read the numbers.
 *
 * "Graded" reuses `shouldWriteSrs` — the exact predicate the lesson grading
 * pipeline itself uses to decide whether a step's completion is a Track A
 * write (a TEACH-kind step, or one with no `exercisedAtoms`, writes
 * nothing and is excluded here too — it isn't a review draw).
 */

/** Pure: compute one summary row per graded step in `lesson`, against `store`. */
export function summarizeReviewSteps(
  lesson: Pick<LessonContent, "id" | "steps">,
  store: SRSStore,
): ReviewGridServedPayload[] {
  const dueAtomIds = new Set<string>();
  for (const [id, state] of Object.entries(store)) {
    if (isDue(state)) dueAtomIds.add(id);
  }
  const out: ReviewGridServedPayload[] = [];
  lesson.steps.forEach((step, stepIndex) => {
    if (!shouldWriteSrs(step)) return;
    const served = new Set(getStepAtomIds(step).map((id) => canonicalizeCardId(id)));
    if (served.size === 0) return;
    let overlap = 0;
    for (const id of served) if (dueAtomIds.has(id)) overlap++;
    out.push({
      lessonId: lesson.id,
      stepIndex,
      servedAtomIds: served.size,
      dueAtomIds: dueAtomIds.size,
      overlap,
      notDueServed: served.size - overlap,
      dueNotServed: dueAtomIds.size - overlap,
    });
  });
  return out;
}

/**
 * Side-effecting: log one `review_grid_served` event per graded step in
 * `lesson`. No-op outside the browser (SSR / `content:emit` / Node test
 * runs) — telemetry has no reader there and the live store is empty
 * anyway, so this both avoids wasted work and keeps `content:emit`'s
 * output untouched by construction (this function never returns a value
 * or mutates `lesson`).
 */
export function recordReviewStepsServed(
  lesson: Pick<LessonContent, "id" | "steps">,
  store?: SRSStore,
): void {
  if (typeof window === "undefined") return;
  const rows = summarizeReviewSteps(lesson, store ?? getSRSStore());
  for (const row of rows) logReviewGridServed(row);
}
