import type { LessonStep } from "../types";
import {
  isPassiveStep,
  isGradedStep,
  getStepAtomIds,
  PASSIVE_STEP_KINDS,
} from "./_stepPredicates";

const FOLLOWUP_WINDOW_END = 3; // inclusive

export type LintFailure = { stepId: string; reason: string };

function findFollowupFailure(
  steps: ReadonlyArray<LessonStep>,
  i: number,
): LintFailure | null {
  const step = steps[i];
  if (!isPassiveStep(step)) return null;

  // Terminal-outro exemption: a closing info/grammar_rule with no graded
  // step anywhere after it is the lesson's "celebrate what you just did"
  // card (typically variant="win"). These aren't dismiss-only teach cards
  // that ship without recall — the recall already happened in the lesson
  // body. phrase_card is NOT exempt: every vocab teach card needs a
  // retrieval somewhere downstream.
  if (step.type === "info" || step.type === "grammar_rule") {
    const hasAnyGradedAfter = steps.slice(i + 1).some(isGradedStep);
    if (!hasAnyGradedAfter) {
      return null;
    }
  }

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

  // Lesson-scoped phrase atoms (e.g. `ja-m3-1-coffee-desu`) are
  // intentional "sneak previews" — the author teaches a compound phrase
  // without the expectation that any single graded step will retrieve
  // that exact compound. The actual retrieval happens on the constituent
  // single-word atoms (here `v-coffee` + the inline `です` pattern). Skip
  // the strong-atom check for these so we don't false-positive the
  // legitimate preview pattern.
  const isLessonScopedAtom = (a: string) => /^ja-m\d+-\d+-/.test(a);
  if (atomIds.every(isLessonScopedAtom)) {
    return null;
  }

  // Adjacency-only check: a same-atom retrieval at i+1 with NO further
  // same-atom retrieval at i+2 or i+3 is massed practice (single test
  // pressed up against the teach, no spaced reinforcement). An adjacent
  // retrieval PLUS spaced retrieval downstream is fine — that's the
  // test-enhancement-then-distributed-practice pattern.
  const sameAtomAt = (idx: number): boolean => {
    const s = steps[idx];
    return !!s && isGradedStep(s) && getStepAtomIds(s).some((a) => atomIds.includes(a));
  };
  const adjacentSameAtom = sameAtomAt(i + 1);
  const spacedSameAtom = sameAtomAt(i + 2) || sameAtomAt(i + 3);

  if (adjacentSameAtom && !spacedSameAtom) {
    return {
      stepId: step.id,
      reason: `same-atom follow-up at i+1 is adjacent (massed practice)`,
    };
  }

  if (!adjacentSameAtom && !spacedSameAtom) {
    return {
      stepId: step.id,
      reason: `atoms ${atomIds.join(",")} not exercised by any graded step at i+1..i+${FOLLOWUP_WINDOW_END}`,
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
