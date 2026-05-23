import type { LessonStep } from "../types";

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
