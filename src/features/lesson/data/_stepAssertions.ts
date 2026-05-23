import type { LessonStep } from "../types";
import {
  isPassiveStep,
  isGradedStep,
  getStepAtomIds,
  PASSIVE_STEP_KINDS,
} from "./_stepPredicates";

const FOLLOWUP_WINDOW_END = 3; // inclusive
const FOLLOWUP_WINDOW_START = 2; // inclusive — non-adjacent (audit 1.1)

export type LintFailure = { stepId: string; reason: string };

function findFollowupFailure(
  steps: ReadonlyArray<LessonStep>,
  i: number,
): LintFailure | null {
  const step = steps[i];
  if (!isPassiveStep(step)) return null;

  const window = steps.slice(i + 1, i + 1 + FOLLOWUP_WINDOW_END);
  const gradedInWindow = window.filter(isGradedStep);

  if (gradedInWindow.length === 0) {
    return {
      stepId: step.id,
      reason: `no graded follow-up within ${FOLLOWUP_WINDOW_END} steps`,
    };
  }

  const atomIds = getStepAtomIds(step);
  if (atomIds.length === 0) {
    // Untagged passive card: weaker check already satisfied above.
    return null;
  }

  // Adjacency check: a same-atom retrieval at i+1 is massed practice.
  const adjacent = steps[i + 1];
  if (adjacent && isGradedStep(adjacent)) {
    const adjAtoms = getStepAtomIds(adjacent);
    if (adjAtoms.some((a) => atomIds.includes(a))) {
      return {
        stepId: step.id,
        reason: `same-atom follow-up at i+1 is adjacent (massed practice)`,
      };
    }
  }

  // Within-window check: some step at i+2..i+3 must share an atom.
  const validWindow = steps.slice(
    i + FOLLOWUP_WINDOW_START,
    i + 1 + FOLLOWUP_WINDOW_END,
  );
  const covered = validWindow.some(
    (s) =>
      isGradedStep(s) && getStepAtomIds(s).some((a) => atomIds.includes(a)),
  );
  if (!covered) {
    return {
      stepId: step.id,
      reason: `atoms ${atomIds.join(",")} not exercised by any graded step at i+${FOLLOWUP_WINDOW_START}..i+${FOLLOWUP_WINDOW_END}`,
    };
  }
  return null;
}

export function checkPassiveCardFollowup(
  steps: ReadonlyArray<LessonStep>,
): { failures: LintFailure[] } {
  const failures: LintFailure[] = [];
  for (let i = 0; i < steps.length; i++) {
    const fail = findFollowupFailure(steps, i);
    if (fail) failures.push(fail);
  }
  return { failures };
}

export function assertPassiveCardsHaveFollowup(
  steps: ReadonlyArray<LessonStep>,
): void {
  const { failures } = checkPassiveCardFollowup(steps);
  if (failures.length === 0) return;
  const msg = failures.map((f) => `  ${f.stepId}: ${f.reason}`).join("\n");
  throw new Error(`Passive-card follow-up lint failed:\n${msg}`);
}

export function assertNoExplanationOnPassive(
  steps: ReadonlyArray<LessonStep>,
): void {
  const offenders = steps.filter(
    (s) =>
      PASSIVE_STEP_KINDS.has(s.type) &&
      (s as { explanation?: string }).explanation !== undefined,
  );
  if (offenders.length === 0) return;
  throw new Error(
    `explanation field is forbidden on passive steps: ${offenders.map((s) => s.id).join(", ")}`,
  );
}

// Minimum length for a substring of the answer to count as a "leak" in the
// explanation. Single particles (1 char) are unavoidable when explaining the
// rule ("the topic-marker particle"); 2+ char chunks of the literal answer
// indicate the author is restating the answer rather than the reasoning.
const ANSWER_LEAK_MIN_CHUNK = 2;

function chunksOfAnswer(answer: string): string[] {
  // Split on whitespace and common JA particle boundaries; keep chunks ≥2.
  return answer
    .split(/[\s、。]+/u)
    .filter((c) => c.length >= ANSWER_LEAK_MIN_CHUNK);
}

function answerStringsFor(step: LessonStep): string[] {
  if (step.type === "build_sentence") {
    const target = step.targetSentence;
    const correctAnswer = (step as { correctAnswer?: string }).correctAnswer;
    return [target, correctAnswer].filter((s): s is string => Boolean(s));
  }
  if (step.type === "translate") {
    const accepted = step.acceptedAnswers ?? [];
    const correctAnswer = (step as { correctAnswer?: string }).correctAnswer;
    return [...accepted, correctAnswer].filter((s): s is string => Boolean(s));
  }
  return [];
}

export function assertExplanationDoesntLeakAnswer(
  steps: ReadonlyArray<LessonStep>,
): void {
  for (const step of steps) {
    if (step.type !== "build_sentence" && step.type !== "translate") continue;
    const explanation = step.explanation;
    if (!explanation) continue;
    const answers = answerStringsFor(step);
    for (const answer of answers) {
      // Full-answer literal copy.
      if (explanation.includes(answer)) {
        throw new Error(
          `Step ${step.id} explanation leaks answer (contains literal "${answer}")`,
        );
      }
      // Substantive chunk of the answer (≥2 chars) copied into the explanation.
      for (const chunk of chunksOfAnswer(answer)) {
        if (explanation.includes(chunk)) {
          throw new Error(
            `Step ${step.id} explanation leaks answer (contains chunk "${chunk}" from answer "${answer}")`,
          );
        }
      }
    }
  }
}
