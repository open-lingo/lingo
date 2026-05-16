import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { SymbolToSoundStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { getTtsUrl } from "@/shared/japanese/tts";
import { getAlphabetAudioUrl } from "@/shared/audio/alphabetAudio";

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
        new Audio(url).play().catch(() => {});
        return;
      }
    }
    // Last-ditch: payload.audioKey (only the correct option matches).
    if (opt.symbol === step.payload.symbol && step.payload.audioKey) {
      new Audio(getAlphabetAudioUrl(step.payload.audioKey))
        .play()
        .catch(() => {});
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
      <div className={`relative grid gap-3 ${optionGridCols}`}>
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          let style =
            "flex items-center justify-center gap-2 rounded-xl border-[1.5px] border-border bg-surface py-5 text-center text-lg font-semibold text-text-primary transition-colors duration-150 hover:border-accent";
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
              onClick={() => handleOptionTap(opt)}
              className={style}
              aria-label={`Hear ${opt.text}`}
            >
              <span aria-hidden>🔊</span>
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
