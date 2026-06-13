import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TranslateStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { ExplainButton } from "../ExplainButton";

const CELEBRATE_MS = 1100;

type Props = {
  step: TranslateStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function TranslateStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const normalized = answer.trim();
  const isCorrect = step.acceptedAnswers.some(
    (a) => a.toLowerCase() === normalized.toLowerCase(),
  );

  function handleSubmit() {
    setSubmitted(true);
    onComplete(step.id, isCorrect);
    if (isCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const directionLabel =
    step.sourceLanguage === "native"
      ? "Translate to the target language"
      : "Translate to your language";

  const hasSubmittedWrong = submitted && !isCorrect;

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {directionLabel}
      </p>
      <h2 className="text-2xl font-bold text-text-primary">
        {step.sourceLanguage === "target" ? (
          step.sourceAnnotation ? (
            <AnnotatedJa segments={step.sourceAnnotation} />
          ) : (
            <AnnotatedJa text={step.sourceText} />
          )
        ) : (
          step.sourceText
        )}
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      <div className="relative">
        <textarea
          disabled={submitted}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your translation..."
          rows={3}
          className="w-full resize-none rounded-xl border-[1.5px] border-border bg-surface px-4 py-3 text-base text-text-primary outline-none transition-colors focus:border-accent disabled:opacity-60"
        />
        {celebrating && <CelebrationToast text={celebrationText} />}
      </div>

      {submitted && <Feedback correct={isCorrect} />}

      {submitted && !isCorrect && (
        <p className="text-sm text-text-secondary">
          Accepted answers: <span className="font-semibold text-text-primary">{step.acceptedAnswers.join(", ")}</span>
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
