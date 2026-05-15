import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolRecognitionStep } from "../../types";
import { Icon } from "@/shared/components/Icon";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import {
  autoPlayAlphabetAudio,
  getAlphabetAudioUrl,
} from "@/shared/audio/alphabetAudio";
import {
  getTtsUrl,
  playJaAudio,
  useAutoPlayJaAudio,
} from "@/shared/japanese/tts";

const CELEBRATE_MS = 1100;

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
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  // Legacy Korean-CDN path for non-JA scripts. JA kana auto-play through
  // the manifest-driven TTS resolver below.
  useEffect(() => {
    autoPlayAlphabetAudio(step.payload.audioKey, `recognition-${step.id}`);
  }, [step.payload.audioKey, step.id]);

  const isJaKana =
    step.payload.scriptId === "hiragana" ||
    step.payload.scriptId === "katakana";
  useAutoPlayJaAudio(
    isJaKana ? step.payload.symbol : undefined,
    `recog-tts-${step.id}`,
  );

  function handlePlay() {
    if (isJaKana && getTtsUrl(step.payload.symbol)) {
      playJaAudio(step.payload.symbol);
      return;
    }
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

  const hasAudio =
    Boolean(step.payload.audioKey) ||
    (isJaKana && Boolean(getTtsUrl(step.payload.symbol)));
  const romanization = step.payload.romanization;
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <h2 className="text-lg font-medium text-text-secondary">
          {t("alphabet.taskPickSymbol", "Pick the symbol for")}{" "}
          <span className="ml-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {romanization}
          </span>
        </h2>
        {hasAudio && (
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
            aria-label="Play sound"
          >
            <Icon name="play" size={14} /> {t("alphabet.play", "Play")}
          </button>
        )}
      </div>
      <div className="relative grid grid-cols-2 gap-3 sm:gap-4">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          let style =
            "rounded-xl border-2 border-gray-200 bg-white py-6 text-4xl font-bold text-gray-900 transition hover:border-emerald-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:border-emerald-600";
          if (submitted && isAnswer) {
            style +=
              " border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/30";
          } else if (submitted && isSelected && !isAnswer) {
            style +=
              " border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/30";
          } else if (isSelected) {
            style +=
              " border-emerald-500 ring-2 ring-emerald-500/30 dark:border-emerald-500";
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
