import { useState } from "react";
import type { MultipleChoiceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";

type Props = {
  step: MultipleChoiceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function MultipleChoiceStepView({ step, onComplete, onContinue }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === step.correctOptionId;

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onComplete(step.id, selected === step.correctOptionId);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        {step.prompt}
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{step.hint}</p>
      )}

      <div className="grid gap-3">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;

          let style = "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-emerald-600 dark:hover:bg-gray-700";

          if (submitted && isAnswer) {
            style = "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/30";
          } else if (submitted && isSelected && !isAnswer) {
            style = "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/30";
          } else if (isSelected) {
            style = "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-900/20";
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(opt.id)}
              className={`rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${style} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>

      {submitted && (
        <Feedback correct={isCorrect} explanation={step.explanation} />
      )}

      {!submitted ? (
        <ContinueButton
          onClick={handleSubmit}
          label="Check"
          disabled={!selected}
        />
      ) : (
        <ContinueButton
          onClick={onContinue}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}
    </div>
  );
}
