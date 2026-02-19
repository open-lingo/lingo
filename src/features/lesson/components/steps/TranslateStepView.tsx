import { useState } from "react";
import type { TranslateStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";

type Props = {
  step: TranslateStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function TranslateStepView({ step, onComplete, onContinue }: Props) {
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const normalized = answer.trim();
  const isCorrect = step.acceptedAnswers.some(
    (a) => a.toLowerCase() === normalized.toLowerCase(),
  );

  function handleSubmit() {
    setSubmitted(true);
    onComplete(step.id, isCorrect);
  }

  const directionLabel =
    step.sourceLanguage === "native"
      ? "Translate to the target language"
      : "Translate to your language";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {directionLabel}
      </p>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {step.sourceText}
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{step.hint}</p>
      )}

      <textarea
        disabled={submitted}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your translation..."
        rows={3}
        className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-base outline-none transition focus:border-emerald-500 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-emerald-500"
      />

      {submitted && <Feedback correct={isCorrect} />}

      {submitted && !isCorrect && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Accepted answers: <span className="font-semibold">{step.acceptedAnswers.join(", ")}</span>
        </p>
      )}

      {!submitted ? (
        <ContinueButton
          onClick={handleSubmit}
          label="Check"
          disabled={normalized.length === 0}
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
