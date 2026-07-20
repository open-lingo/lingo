import type {
  GrammarRuleStep,
  LessonContent,
  LessonStep,
  MultipleChoiceStep,
  ReactiveGrammarTip,
} from "../types";
import { isGradedStep } from "./_stepPredicates";

/**
 * Grammar micro-teaching post-pass (workshop A, 2026-07-12).
 *
 * Runs centrally in getMockLessonContent (like padMatchPairsFloor), so all
 * ~94 authored grammarRule() cards inherit without re-authoring:
 *
 *  1. Every GRADED step following a grammar_rule card (until the next rule
 *     card) is tagged with a ReactiveGrammarTip derived from the card's
 *     antiPattern — the player flashes ✗/✓ + the rule line when the
 *     learner errs (once per point per session). Evidence: reactive
 *     error-moment intervention beats up-front anti-pattern display.
 *  2. A derived SPOT-THE-MISTAKE MCQ ("pick the correct sentence" —
 *     tap-only; the wrong form is never voiced or typed) is inserted at
 *     the end of the point's drill span, so learners who never err still
 *     get exactly one ✗-labeled exposure. Skipped when it would push the
 *     lesson past the density hard cap (25) — the reactive tip still
 *     covers those lessons.
 *
 * The rule card itself renders COMPACT in lessons (rule + example #1);
 * antiPattern/cultureNote never render as card text anymore.
 */
const DENSITY_HARD_HIGH = 25;

function tipFromRule(step: GrammarRuleStep): ReactiveGrammarTip | null {
  const anti = step.antiPattern;
  const right = step.examples[0];
  if (!anti || !right) return null;
  return {
    grammarPointId: step.grammarPointId ?? step.id,
    title: step.title,
    ruleLine: step.rule,
    wrongJa: anti.ja,
    wrongRomaji: anti.romaji,
    rightJa: right.ja,
    rightRomaji: right.romaji,
    why: anti.why,
  };
}

// spotStep()/hashBit() removed 2026-07-20 (invariant 32): the derived
// spot-the-mistake MCQ is retired. antiPattern now feeds only the reactive
// ✗ tip (tipFromRule). Do not reintroduce a derived recognition step.

export function deriveGrammarMicroSteps(lesson: LessonContent): LessonContent {
  if (!lesson.steps.some((s) => s.type === "grammar_rule")) return lesson;

  const out: LessonStep[] = [];
  let changed = false;
  let spotBudget = Math.max(0, DENSITY_HARD_HIGH - lesson.steps.length);

  let activeTip: ReactiveGrammarTip | null = null;
  let pendingSpot: MultipleChoiceStep | null = null;
  let lastTaggedIdx = -1;

  const flushSpot = () => {
    if (pendingSpot && lastTaggedIdx >= 0 && spotBudget > 0) {
      out.splice(lastTaggedIdx + 1, 0, pendingSpot);
      spotBudget--;
      changed = true;
    } else if (pendingSpot && import.meta.env?.DEV) {
      // Dropped spot = the learner never gets the labeled-✗ exposure for
      // this point. Audible in dev (same pattern as lessonDensity's cap
      // logs): either the lesson is over the density budget or two rule
      // cards sit back-to-back (empty drill span — see ja-m17-2-1).
      // eslint-disable-next-line no-console
      console.warn(
        `[grammar-micro] ${lesson.id}: spot for "${pendingSpot.id}" dropped ` +
          (lastTaggedIdx < 0 ? "(empty drill span)" : "(density budget)"),
      );
    }
    pendingSpot = null;
    lastTaggedIdx = -1;
  };

  for (const step of lesson.steps) {
    if (step.type === "grammar_rule") {
      flushSpot();
      const rule = step as GrammarRuleStep;
      activeTip = tipFromRule(rule);
      // Invariant 32 (Spencer 2026-07-20): the derived spot-the-mistake
      // MCQ is RETIRED — weak binary recognition. antiPattern now drives
      // ONLY the reactive ✗ tip (activeTip above); the grammar contrast is
      // taught by authored builds. Never re-enable pendingSpot = spotStep().
      pendingSpot = null;
      out.push(step);
      continue;
    }
    // Speaking is graded, but its miss/skip is a pronunciation outcome, not a
    // grammar-form choice. Tagging it means a "skip, no pass" fires the
    // reactive grammar-tip modal — which, because the modal is controller-level
    // and outlives the step, then floats over the NEXT step as a non-sequitur
    // "wrong answer". Never attach a grammar tip to a speaking step.
    if (
      activeTip &&
      isGradedStep(step) &&
      step.type !== "row_test" &&
      step.type !== "speaking"
    ) {
      out.push({ ...step, reactiveGrammarTip: activeTip });
      changed = true;
      lastTaggedIdx = out.length - 1;
    } else {
      out.push(step);
    }
  }
  flushSpot();

  return changed ? { ...lesson, steps: out } : lesson;
}
