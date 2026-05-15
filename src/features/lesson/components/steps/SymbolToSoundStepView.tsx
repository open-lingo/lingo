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
      <div className="flex flex-col items-center gap-3">
        <span
          className="text-[140px] font-bold leading-none text-text-primary"
          aria-hidden
        >
          {step.payload.symbol}
        </span>
        <button
          type="button"
          onClick={handlePlay}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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
            "rounded-xl border-2 border-gray-200 bg-white py-4 text-center text-lg font-semibold text-text-primary transition hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-emerald-600";
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
