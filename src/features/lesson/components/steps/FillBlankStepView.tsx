import { useState, useCallback } from "react";
import type { FillBlankStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { ExplainButton } from "../ExplainButton";
import { stepHasSentenceContent } from "../../data/_stepPredicates";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

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

  const handleEnter = useCallback(() => {
    if (!submitted && allFilled) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, allFilled, onContinue]);

  useLessonKeyboard({ onEnter: handleEnter });

  const parts = step.sentence.split("{{blank}}");
  const hasSubmittedWrong = submitted && !isCorrect;
  const showExplain = stepHasSentenceContent(step);

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      {showExplain && (
        <ExplainButton
          explanation={step.explanation}
          hasSubmittedWrong={hasSubmittedWrong}
        />
      )}
      <h2 className="text-lg font-semibold text-text-primary">
        Fill in the blank
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      {/* 3xl, not 2xl (Spencer 2026-07-29: "make the tiles and sentence text
          bigger ... fill some more space"). `leading-relaxed` comes with it —
          furigana rides above the line, and at 3xl a tight leading clips it.
          The blank narrows below `sm`: at 3xl a 128px blank plus といきます
          exceeds the ~300px available at 390px wide and the sentence wrapped,
          leaving the blank stranded on its own line. */}
      <div className="flex flex-wrap items-baseline gap-1.5 text-3xl font-bold leading-relaxed text-text-primary">
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
                    className={`w-24 border-b-[2.5px] bg-transparent text-center text-3xl font-bold outline-none transition-colors sm:w-32 ${
                      submitted
                        ? isCorrect
                          ? "border-accent text-accent"
                          : "border-error text-error"
                        : "border-border focus:border-accent"
                    }`}
                  />
                ) : (
                  <span className="inline-block w-20 border-b-[2.5px] border-border sm:w-24" />
                )}
              </span>
            )}
          </span>
        ))}
      </div>

      {step.wordBank && (
        <div className="flex flex-wrap gap-2.5">
          {step.wordBank.map((word, i) => {
            const isUsed = Object.values(answers).includes(word);
            return (
              <button
                key={`${word}-${i}`}
                type="button"
                disabled={submitted || isUsed}
                onClick={() => handleBankSelect(word)}
                className={`rounded-xl border-[1.5px] px-5 py-2.5 text-2xl font-medium leading-normal transition-colors duration-150 ${
                  isUsed
                    ? "border-border bg-surface-muted text-text-muted opacity-60"
                    : "border-border bg-surface text-text-primary hover:border-accent"
                }`}
              >
                <AnnotatedJa text={word} hideHelper={step.wordBankHideHelper} />
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom-anchored block: feedback + CTA together so the button
          sits in the shared bottom action slot on every step type. */}
      <div className="mt-auto flex flex-col gap-4 pt-6">
        {submitted && (
          <Feedback correct={isCorrect} />
        )}

        {submitted && !isCorrect && (
          <p className="text-sm text-text-secondary">
            Correct: <span className="font-semibold text-text-primary">{step.blanks.map((b) => b.correctAnswer).join(", ")}</span>
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
    </div>
  );
}
