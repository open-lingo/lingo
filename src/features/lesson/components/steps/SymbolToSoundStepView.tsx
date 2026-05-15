import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolToSoundStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import {
  autoPlayAlphabetAudio,
  getAlphabetAudioUrl,
} from "@/shared/audio/alphabetAudio";

const CELEBRATE_MS = 1100;

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
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  useEffect(() => {
    autoPlayAlphabetAudio(step.payload.audioKey, `symbol-to-sound-${step.id}`);
  }, [step.payload.audioKey, step.id]);

  function handlePlay() {
    if (!step.payload.audioKey) return;
    const audio = new Audio(getAlphabetAudioUrl(step.payload.audioKey));
    audio.play().catch(() => {});
  }

  const isCorrect = selected === step.correctOptionId;

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    onComplete(step.id, isCorrect);
    if (isCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  // Lay out options in a responsive grid sized to option count. 1 option = full
  // width (rare), 2/3 = single row, 4 = 2x2 (or 1x4 on wide). Keeps buttons
  // shaped to their content instead of stretching across the full width on
  // short romaji like "i" or "po".
  const optionCount = step.options.length;
  const optionGridCols =
    optionCount <= 2
      ? "grid-cols-2"
      : optionCount === 3
      ? "grid-cols-3"
      : "grid-cols-2 sm:grid-cols-4";

  return (
    <div className="flex flex-1 flex-col gap-5">
      <p className="text-center text-base text-text-secondary">
        {t("alphabet.whatSoundIsThis", "What sound does this symbol make?")}
      </p>
      <div className="flex flex-col items-center gap-4">
        <span
          className="font-japanese text-[140px] font-bold leading-none text-text-primary"
          aria-hidden
        >
          {step.payload.symbol}
        </span>
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-border bg-surface px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:border-accent hover:text-text-primary"
          aria-label="Play sound"
        >
          🔊 {t("alphabet.play", "Play")}
        </button>
      </div>
      <div className={`relative grid gap-3 ${optionGridCols}`}>
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          let style =
            "rounded-xl border-[1.5px] border-border bg-surface py-4 text-center text-lg font-semibold text-text-primary transition-colors duration-150 hover:border-accent";
          if (submitted && isAnswer) {
            style += " border-accent bg-accent-muted text-accent";
          } else if (submitted && isSelected && !isAnswer) {
            style += " border-error bg-red-50 text-error dark:bg-red-950/30";
          } else if (isSelected) {
            style += " border-accent bg-accent-muted text-accent";
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
        {celebrating && <CelebrationToast text={celebrationText} />}
      </div>
      {submitted && !isCorrect && <Feedback correct={false} />}
      {!submitted ? (
        <ContinueButton
          onClick={handleSubmit}
          label="Check"
          disabled={!selected}
        />
      ) : celebrating ? (
        <div className="invisible" aria-hidden>
          <ContinueButton onClick={() => {}} />
        </div>
      ) : (
        <div className="motion-safe:animate-fade-up">
          <ContinueButton
            onClick={onContinue}
            variant={isCorrect ? "correct" : "incorrect"}
          />
        </div>
      )}
    </div>
  );
}
