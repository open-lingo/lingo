import { useState, useCallback, useEffect } from "react";
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
import { playLocalAudio } from "@/shared/audio/volume";
import {
  getTtsUrl,
  playJaAudio,
  useAutoPlayJaAudio,
} from "@/shared/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

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

  const isJaKana =
    step.payload.scriptId === "hiragana" ||
    step.payload.scriptId === "katakana";

  // Legacy Korean-CDN path for non-JA scripts only. JA kana auto-play
  // through the manifest-driven TTS resolver below — running both
  // double-fires the audio on JA steps that ship an audioKey.
  useEffect(() => {
    if (isJaKana) return;
    autoPlayAlphabetAudio(step.payload.audioKey, `recognition-${step.id}`);
  }, [step.payload.audioKey, step.id, isJaKana]);

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
    playLocalAudio(getAlphabetAudioUrl(step.payload.audioKey));
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

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted && !celebrating) onContinue();
  }, [submitted, selected, celebrating, onContinue]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) setSelected(step.options[n - 1].id);
    },
    enabled: !celebrating,
  });

  const hasAudio =
    Boolean(step.payload.audioKey) ||
    (isJaKana && Boolean(getTtsUrl(step.payload.symbol)));
  const romanization = step.payload.romanization;
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <h2 className="text-lg font-medium text-text-secondary">
          {t("alphabet.taskPickSymbol", "Pick the symbol for")}{" "}
          <span className="ml-1 text-2xl font-bold text-accent">
            {romanization}
          </span>
        </h2>
        {hasAudio && (
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_3px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]"
            aria-label={t("alphabet.play", "Play")}
          >
            <Icon name="play" size={14} />
          </button>
        )}
      </div>
      <div className="relative grid grid-cols-2 gap-4">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          // Solid accent fill on selected = unmistakable in any theme.
          let style =
            "font-japanese rounded-xl border-2 border-border bg-surface py-9 text-5xl font-bold text-text-primary transition-colors duration-150 hover:border-accent";
          if (submitted && isAnswer) {
            style =
              "font-japanese rounded-xl border-2 border-accent bg-accent py-9 text-5xl font-bold text-white transition-colors duration-150";
          } else if (submitted && isSelected && !isAnswer) {
            style =
              "font-japanese rounded-xl border-2 border-error bg-error/15 py-9 text-5xl font-bold text-error transition-colors duration-150";
          } else if (isSelected) {
            style =
              "font-japanese rounded-xl border-2 border-accent bg-accent py-9 text-5xl font-bold text-white transition-colors duration-150";
          }
          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => {
                // Preview-on-tap: play the kana's own audio when picked.
                // Same interaction as symbol_to_sound but with kana buttons.
                if (isJaKana && getTtsUrl(opt.symbol)) {
                  playJaAudio(opt.symbol);
                }
                setSelected(opt.id);
              }}
              className={style}
              aria-label={`Hear ${opt.symbol}`}
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
