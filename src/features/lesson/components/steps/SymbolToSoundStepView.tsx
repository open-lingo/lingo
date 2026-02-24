import { useState } from "react";
import type { SymbolToSoundStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";

type Props = {
  step: SymbolToSoundStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function SymbolToSoundStepView({
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
        What sound does this symbol make?
      </p>
      <div className="flex justify-center">
        <span
          className="text-5xl font-bold text-gray-900 dark:text-white"
          aria-hidden
        >
          {step.payload.symbol}
        </span>
      </div>
      <div className="grid gap-3">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          let style =
            "rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-left text-sm font-medium transition hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-emerald-600";
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
              {opt.text}
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
