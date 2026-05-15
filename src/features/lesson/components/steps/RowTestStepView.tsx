/**
 * RowTestStepView — thin wrapper around `TestRunner` so the StepRenderer
 * dispatcher can treat `row_test` like every other step.
 */
import type { RowTestStep } from "../../types";
import { TestRunner } from "../TestRunner";

type Props = {
  step: RowTestStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function RowTestStepView({ step, onComplete, onContinue }: Props) {
  return (
    <TestRunner step={step} onComplete={onComplete} onContinue={onContinue} />
  );
}
