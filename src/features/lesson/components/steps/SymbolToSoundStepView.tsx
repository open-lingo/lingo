import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolToSoundStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { getTtsUrl } from "@/shared/japanese/tts";
import { getAlphabetAudioUrl } from "@/shared/audio/alphabetAudio";
import { playLocalAudio } from "@/shared/audio/volume";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { Icon } from "@/shared/components/Icon";

const CELEBRATE_MS = 1100;

type Props = {
  step: SymbolToSoundStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Revamped symbol_to_sound (2026-05-16): no central Play button, no
 * auto-play. The kana is shown alone at the top; the 2x2 grid below has
 * romaji-labeled buttons that play THEIR OWN kana's audio on tap.
 *
 * The user taps to sample each sound, compares against their memory of
 * the displayed kana (heard moments earlier in symbol_intro), and
 * commits with a separate Check button. Tap on a button does double
 * duty: preview the sound + select the option. Re-tap replays.
 */
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

  const isCorrect = selected === step.correctOptionId;

  function playForOption(opt: { symbol?: string }) {
    // Prefer the option's own kana via JA TTS. If no symbol is set
    // (legacy step authoring), fall back silently — the renderer still
    // works as a vanilla MC.
    if (opt.symbol) {
      const url = getTtsUrl(opt.symbol);
      if (url) {
        playLocalAudio(url);
        return;
      }
    }
    // Last-ditch: payload.audioKey (only the correct option matches).
    if (opt.symbol === step.payload.symbol && step.payload.audioKey) {
      playLocalAudio(getAlphabetAudioUrl(step.payload.audioKey));
    }
  }

  function handleOptionTap(opt: { id: string; symbol?: string }) {
    if (submitted) return;
    setSelected(opt.id);
    playForOption(opt);
  }

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
      if (!submitted && n <= step.options.length) handleOptionTap(step.options[n - 1]);
    },
    enabled: !celebrating,
  });

  const optionCount = step.options.length;
  const optionGridCols =
    optionCount <= 2
      ? "grid-cols-2"
      : optionCount === 3
        ? "grid-cols-3"
        : "grid-cols-2";

  return (
    <div className="flex flex-1 flex-col gap-6">
      <p className="text-center text-base text-text-secondary">
        {t(
          "alphabet.tapToHear",
          "Tap a sound to hear it. Pick the one that matches.",
        )}
      </p>
      <div className="flex justify-center">
        <span
          className="font-japanese text-[140px] font-bold leading-none text-text-primary"
          aria-hidden
        >
          {step.payload.symbol}
        </span>
      </div>
      <div className={`relative grid gap-4 ${optionGridCols}`}>
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          // Default + selected-pre-submit + post-submit-correct/wrong.
          // Selected state uses solid accent fill so the picked button is
          // unmistakable in both dark and light themes.
          let style =
            "flex items-center justify-center gap-3 rounded-xl border-2 border-border bg-surface py-8 text-center text-2xl font-bold text-text-primary transition-colors duration-150 hover:border-accent";
          if (submitted && isAnswer) {
            style =
              "flex items-center justify-center gap-3 rounded-xl border-2 border-accent bg-accent py-8 text-center text-2xl font-bold text-white transition-colors duration-150";
          } else if (submitted && isSelected && !isAnswer) {
            style =
              "flex items-center justify-center gap-3 rounded-xl border-2 border-error bg-error/15 py-8 text-center text-2xl font-bold text-error transition-colors duration-150";
          } else if (isSelected) {
            style =
              "flex items-center justify-center gap-3 rounded-xl border-2 border-accent bg-accent py-8 text-center text-2xl font-bold text-white transition-colors duration-150";
          }
          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => handleOptionTap(opt)}
              className={style}
              aria-label={`Hear ${opt.text}`}
            >
              <Icon name="volume" size={20} aria-hidden className="shrink-0" />
              <span>{opt.text}</span>
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
