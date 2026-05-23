import type { LessonStep } from "../types";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

export const PASSIVE_STEP_KINDS: ReadonlySet<LessonStep["type"]> = new Set([
  "phrase_card",
  "info",
  "grammar_rule",
]);

export function isPassiveStep(step: LessonStep): boolean {
  return PASSIVE_STEP_KINDS.has(step.type);
}

export function isGradedStep(step: LessonStep): boolean {
  return !isPassiveStep(step);
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
