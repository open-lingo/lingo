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
  "symbol_intro",
  // The switchover reveal is an introduction ("UNGRADED by design",
  // KanjiRevealStepView) — it emits onComplete(id, true) for resume
  // bookkeeping only. Outside this set it fired the combo/chime and padded
  // the accuracy denominator with an always-correct step (2026-07-29 review).
  "kanji_reveal",
  // NOTE — `dialogue_sim` is deliberately NOT in this set (2026-07-29
  // prototype). GRADING DECISION, recorded here because this is where the
  // question gets answered:
  //
  //   A simulation turn is RETRIEVAL — the learner produces or picks a reply
  //   and can get it wrong — so `isGradedStep` must be true: the step earns
  //   its progress-bar tick, the combo fires once per scenario, and
  //   `LessonPage.handleContinue`'s advance guard refuses to skip an
  //   unanswered scenario. Treating it as a teach card would make an
  //   interactive 4-turn exchange worth zero progress and let it be tapped
  //   past. Same call `dialogue_listen` already carries.
  //
  //   That is NOT a licence to write FSRS. The house rule (grading is
  //   review-only/deliberate; just-introduced content is never graded
  //   same-session) is enforced by the two gates that already exist:
  //   `shouldWriteSrs` needs a non-empty `exercisedAtoms`, which authors
  //   add ONLY in review contexts, and in content lessons D2's
  //   `shouldWriteContentReviewAtom` still filters out the lesson's own
  //   just-introduced atoms. A scenario that TEACHES its phrases carries
  //   `exercisedAtomIds` (exposure) and no `exercisedAtoms` — which is
  //   exactly what the prototype scenario does, so it writes nothing.
]);

export function isPassiveStep(step: LessonStep): boolean {
  return PASSIVE_STEP_KINDS.has(step.type);
}

/**
 * "Graded" = retrieval the learner can get wrong. Excludes the whole
 * TEACH set, not just PASSIVE_STEP_KINDS: `teach` and `symbol_intro`
 * emit a completion signal (always-correct) for resume bookkeeping, but
 * they're exposure — counting them inflated the progress-bar total and
 * the accuracy denominator, and made the advance guard in
 * `LessonPage.handleContinue` treat intro cards as quiz steps.
 */
export function isGradedStep(step: LessonStep): boolean {
  return !TEACH_STEP_KINDS.has(step.type);
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
  "agreement_cloze",
  "dialogue_listen",
  // Every sim turn is a sentence-context exchange (NPC line + produced
  // reply), so it counts toward the ≥60% sentence-context review mix.
  "dialogue_sim",
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
 * Progress weight of a graded step. Trace steps require
 * `minCorrectAttempts` passes — each successful pass is one bar tick
 * (Spencer 2026-06-13: effort should match progress; a 2-pass trace is
 * not the same unit as a one-tap MCQ). A skipped trace credits full
 * weight so skipping never stalls the bar.
 */
export function gradedStepWeight(step: LessonStep): number {
  if (step.type === "symbol_trace") {
    return Math.max(1, step.minCorrectAttempts ?? 1);
  }
  if (step.type === "row_test") {
    return Math.max(1, step.items?.length ?? 1);
  }
  return 1;
}

/**
 * Pure computation behind the lesson progress bar. Excludes teach-kind
 * cards (phrase_card / info / grammar_rule / teach / symbol_intro) from
 * both `total` and the running `current` counter so tapping "Got it" on a
 * teach card never advances the chip.
 *
 * `current` ticks when a graded step at index < currentStepIdx has a
 * recorded result (correct or incorrect — either constitutes
 * commitment). Trace steps additionally tick mid-step: `passCounts`
 * carries successful passes for the active trace, so each accepted
 * stroke advances the bar immediately.
 *
 * Extracted so it can be unit-tested without rendering LessonPage.
 */
export function computeGradedProgress(
  steps: ReadonlyArray<LessonStep>,
  currentStepIdx: number,
  results: Readonly<Record<string, unknown>>,
  passCounts: Readonly<Record<string, number>> = {},
): { current: number; total: number } {
  let total = 0;
  let current = 0;
  steps.forEach((s, idx) => {
    if (!isGradedStep(s)) return;
    const w = gradedStepWeight(s);
    total += w;
    if (s.type === "symbol_trace" || s.type === "row_test") {
      // Multi-unit steps tick per pass/item via passCounts. Completed
      // ones (committed result, behind the cursor) count full weight
      // even after a resume wipes in-memory passCounts.
      if (idx < currentStepIdx && results[s.id] !== undefined) {
        current += w;
      } else {
        current += Math.min(passCounts[s.id] ?? 0, w);
      }
      return;
    }
    if (idx < currentStepIdx && results[s.id] !== undefined) {
      current += 1;
    }
  });
  return { current, total };
}

/**
 * Progress bar counts for {@link LessonProgressBar}.
 *
 * Graded lessons (quizzes, trace, MCQ, …) use {@link computeGradedProgress}.
 * Exposure-only lessons (e.g. `ko-m1-intro` — all `info` cards) have zero
 * graded steps; fall back to 1-based position in the lesson so the bar never
 * shows `0/0`.
 */
export function getLessonProgressBarCounts(
  steps: ReadonlyArray<LessonStep>,
  currentStepIdx: number,
  results: Readonly<Record<string, unknown>>,
  inReplay: boolean,
  passCounts: Readonly<Record<string, number>> = {},
): { current: number; total: number } {
  const graded = computeGradedProgress(steps, currentStepIdx, results, passCounts);
  if (graded.total > 0) {
    return {
      current: inReplay ? graded.total : graded.current,
      total: graded.total,
    };
  }
  const total = steps.length;
  if (total === 0) return { current: 0, total: 0 };
  return {
    current: inReplay ? total : Math.min(currentStepIdx + 1, total),
    total,
  };
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
