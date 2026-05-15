import { useState } from "react";
import type { FillBlankStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { AnnotatedJa } from "@/shared/japanese";

type Props = {
  step: FillBlankStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function FillBlankStepView({ step, onComplete, onContinue }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const allFilled = step.blanks.every((b) => (answers[b.id] ?? "").trim().length > 0);

  const isCorrect = step.blanks.every((b) => {
    const given = (answers[b.id] ?? "").trim();
    const accepted = [b.correctAnswer, ...(b.acceptedAnswers ?? [])];
    return accepted.includes(given);
  });

  function handleBankSelect(word: string) {
    if (submitted) return;
    const firstEmpty = step.blanks.find((b) => !(answers[b.id] ?? "").trim());
    if (firstEmpty) {
      setAnswers((prev) => ({ ...prev, [firstEmpty.id]: word }));
    }
  }

  function handleSubmit() {
    setSubmitted(true);
    onComplete(step.id, isCorrect);
  }

  const parts = step.sentence.split("{{blank}}");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Fill in the blank
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{step.hint}</p>
      )}

      <div className="flex flex-wrap items-baseline gap-1 text-2xl font-bold text-gray-900 dark:text-white">
        {parts.map((part, i) => (
          <span key={i} className="flex items-baseline gap-1">
            <span><AnnotatedJa text={part} /></span>
            {i < parts.length - 1 && (
              <span className="inline-block">
                {step.blanks[i] ? (
                  <input
                    type="text"
                    disabled={submitted || !!step.wordBank}
                    value={answers[step.blanks[i].id] ?? ""}
                    onChange={(e) =>
                      setAnswers((prev) => ({
                        ...prev,
                        [step.blanks[i].id]: e.target.value,
                      }))
                    }
                    className={`w-24 border-b-2 bg-transparent text-center text-2xl font-bold outline-none transition ${
                      submitted
                        ? isCorrect
                          ? "border-emerald-500 text-emerald-700 dark:text-emerald-400"
                          : "border-red-500 text-red-700 dark:text-red-400"
                        : "border-gray-400 focus:border-emerald-500 dark:border-gray-500"
                    }`}
                  />
                ) : (
                  <span className="inline-block w-16 border-b-2 border-gray-300" />
                )}
              </span>
            )}
          </span>
        ))}
      </div>

      {step.wordBank && (
        <div className="flex flex-wrap gap-2">
          {step.wordBank.map((word, i) => {
            const isUsed = Object.values(answers).includes(word);
            return (
              <button
                key={`${word}-${i}`}
                type="button"
                disabled={submitted || isUsed}
                onClick={() => handleBankSelect(word)}
                className={`rounded-lg border px-3 py-1.5 text-base font-medium transition ${
                  isUsed
                    ? "border-gray-200 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600"
                    : "border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:border-emerald-500 dark:hover:bg-gray-600"
                }`}
              >
                <AnnotatedJa text={word} />
              </button>
            );
          })}
        </div>
      )}

      {submitted && (
        <Feedback correct={isCorrect} />
      )}

      {submitted && !isCorrect && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Correct: <span className="font-semibold">{step.blanks.map((b) => b.correctAnswer).join(", ")}</span>
        </p>
      )}

      {!submitted ? (
        <ContinueButton onClick={handleSubmit} label="Check" disabled={!allFilled} />
      ) : (
        <ContinueButton
          onClick={onContinue}
          variant={isCorrect ? "correct" : "incorrect"}
        />
      )}
    </div>
  );
}
