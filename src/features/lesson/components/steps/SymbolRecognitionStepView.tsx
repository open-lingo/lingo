import { useState } from "react";
import type { SymbolRecognitionStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";

type Props = {
  step: SymbolRecognitionStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function SymbolRecognitionStepView({
  step,
  onComplete,
  onContinue,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = selected === step.correctOptionId;

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onComplete(step.id, isCorrect);
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-center text-gray-700 dark:text-gray-200">
        Listen, then select the correct symbol.
      </p>
      <button
        type="button"
        className="mx-auto rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        aria-label="Play sound"
      >
        ▶ Play
      </button>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          let style =
            "rounded-xl border-2 border-gray-200 bg-white py-4 text-3xl font-bold text-gray-900 transition hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-emerald-600";
          if (submitted && isAnswer) {
            style += " border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/30";
          } else if (submitted && isSelected && !isAnswer) {
            style += " border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/30";
          } else if (isSelected) {
            style += " border-emerald-500 ring-2 ring-emerald-500/30 dark:border-emerald-500";
          }
          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(opt.id)}
              className={style}
            >
              {opt.symbol}
            </button>
          );
        })}
      </div>
      {submitted && <Feedback correct={isCorrect} />}
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
