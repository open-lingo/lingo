import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ListeningComprehensionStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { getTtsUrl } from "@/shared/japanese/tts";
import { playLocalAudio } from "@/shared/audio/volume";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: ListeningComprehensionStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function ListeningComprehensionStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctOptionId;

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted && !celebrating) onContinue();
  }, [submitted, selected, celebrating]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        setSelected(step.options[n - 1].id);
      }
    },
    enabled: !celebrating,
  });

  const audioUrl = step.transcript ? getTtsUrl(step.transcript) : null;

  function handlePlay() {
    if (!audioUrl) return;
    playLocalAudio(audioUrl);
  }

  function handleSubmit() {
    if (!selected) return;
    const correct = selected === step.correctOptionId;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const hasSubmittedWrong = submitted && !isCorrect;

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_4px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]"
          aria-label="Play audio"
        >
          <Icon name="play" size={24} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Listen and answer
          </p>
          {step.transcript ? (
            <p className="font-japanese text-2xl font-semibold leading-tight text-text-primary">
              {step.transcript}
              {step.romaji && (
                <span className="ml-2 font-sans text-sm font-normal text-text-secondary">
                  {step.romaji}
                </span>
              )}
            </p>
          ) : null}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-text-primary">
        {step.question}
      </h2>

      <div className="relative grid gap-3">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;

          let style = "border-border bg-surface text-text-primary hover:border-accent";
          if (submitted && isAnswer) {
            style = "border-accent bg-accent-muted text-accent";
          } else if (submitted && isSelected && !isAnswer) {
            style = "border-error bg-red-50 text-error dark:bg-red-950/30";
          } else if (isSelected) {
            style = "border-accent bg-accent-muted text-accent";
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              aria-pressed={isSelected}
              onClick={() => setSelected(opt.id)}
              className={`rounded-xl border-[1.5px] px-4 py-3.5 text-left text-sm font-medium transition-colors duration-150 ${style}`}
            >
              {opt.text}
            </button>
          );
        })}
        {celebrating && <CelebrationToast text={celebrationText} />}
      </div>

      {submitted && <Feedback correct={isCorrect} explanation={step.explanation} />}

      {!submitted ? (
        <ContinueButton onClick={handleSubmit} label="Check" disabled={!selected} />
      ) : celebrating ? (
        <div className="invisible" aria-hidden>
          <ContinueButton onClick={() => {}} />
        </div>
      ) : (
        <ContinueButton onClick={onContinue} variant={isCorrect ? "correct" : "incorrect"} />
      )}
    </div>
  );
}
