import type { LessonStep } from "../types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

export const PASSIVE_STEP_KINDS: ReadonlySet<LessonStep["type"]> = new Set([
  "phrase_card",
  "info",
  "grammar_rule",
]);

/**
 * Step kinds that NEVER advance FSRS state regardless of correctness.
 * Wider than PASSIVE_STEP_KINDS — includes teach/intro/dialogue surfaces
 * that may emit a completion signal but represent exposure rather than
 * retrieval. The lesson grading pipeline's `shouldWriteSrs(step)` gate
 * uses this set.
 *
 * Anything outside this set that carries `exercisedAtoms` does write SRS.
 */
const TEACH_STEP_KINDS: ReadonlySet<LessonStep["type"]> = new Set([
  "phrase_card",
  "info",
  "grammar_rule",
  "teach",
  "symbol_intro",
]);

export function isPassiveStep(step: LessonStep): boolean {
  return PASSIVE_STEP_KINDS.has(step.type);
}

export function isGradedStep(step: LessonStep): boolean {
  return !isPassiveStep(step);
}

/**
 * Gate for the lesson grading pipeline: should completing this step
 * advance an FSRS card's state?
 *
 * Rules (BOTH must hold):
 *   1. Step type is not in TEACH_STEP_KINDS (teach steps never write,
 *      even if they accidentally carry `exercisedAtoms`).
 *   2. Step has a non-empty `exercisedAtoms` list — without atom IDs
 *      there's nothing to credit.
 *
 * This implements Spencer's "only review cards count toward FSRS-6"
 * constraint: graded retrieval is the only signal that touches state.
 */
export function shouldWriteSrs(
  step: { type: string; exercisedAtoms?: readonly string[] },
): boolean {
  if (TEACH_STEP_KINDS.has(step.type as LessonStep["type"])) return false;
  return (step.exercisedAtoms?.length ?? 0) > 0;
}

const ALWAYS_SENTENCE: ReadonlySet<LessonStep["type"]> = new Set([
  "translate",
  "build_sentence",
  "listening_build",
  "listening_comprehension",
  "particle_cloze",
  "dialogue_listen",
  "speaking",
]);

function countSentenceTokens(
  annotation: ReadonlyArray<JapaneseAnnotation> | undefined,
): number {
  if (!annotation) return 0;
  return annotation.filter((a) => a.role !== "punctuation").length;
}

export function stepHasSentenceContent(step: LessonStep): boolean {
  if (ALWAYS_SENTENCE.has(step.type)) return true;
  if (step.type === "multiple_choice" || step.type === "fill_blank") {
    const annotation =
      step.type === "multiple_choice"
        ? step.promptAnnotation
        : step.sentenceAnnotation;
    return countSentenceTokens(annotation) >= 2;
  }
  return false;
}

/**
 * Adapter: extract the course-atom ids a step exercises, regardless of which
 * per-type field holds them. Returns [] when the step is not atom-tagged so
 * callers can fall back to weaker checks.
 *
 *   - phrase_card → `atomId` (single)
 *   - info / grammar_rule → `exercisedAtomIds`
 *   - graded steps → `exercisedAtoms` (lands with SRS unification phase 2;
 *     currently returns [] for graded steps until that lands)
 */
/**
 * Pure computation behind the lesson progress bar. Excludes passive cards
 * (phrase_card / info / grammar_rule) from both `total` and the running
 * `current` counter so tapping "Got it" on a teach card never advances the
 * chip. `current` ticks only when a graded step at index < currentStepIdx
 * has a recorded result (correct or incorrect — either constitutes
 * commitment).
 *
 * Extracted so it can be unit-tested without rendering LessonPage.
 */
export function computeGradedProgress(
  steps: ReadonlyArray<LessonStep>,
  currentStepIdx: number,
  results: Readonly<Record<string, unknown>>,
): { current: number; total: number } {
  const total = steps.filter(isGradedStep).length;
  const current = steps
    .slice(0, currentStepIdx)
    .filter((s) => isGradedStep(s) && results[s.id] !== undefined).length;
  return { current, total };
}

export function getStepAtomIds(step: LessonStep): readonly string[] {
  if (step.type === "phrase_card") {
    return step.atomId ? [step.atomId] : [];
  }
  if (step.type === "info" || step.type === "grammar_rule") {
    return step.exercisedAtomIds ?? [];
  }
  const exercisedAtoms = (step as { exercisedAtoms?: string[] }).exercisedAtoms;
  return exercisedAtoms ?? [];
}
