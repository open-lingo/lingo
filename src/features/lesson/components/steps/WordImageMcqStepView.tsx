import { useCallback, useState } from "react";
import type { WordImageMcqStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { useTranslation } from "react-i18next";
import { notoEmojiUrl, lingoArtUrl } from "@/shared/assets/notoEmoji";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: WordImageMcqStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Bold the english meaning inside `What is the word for 'love'?`. Matches
 * the emphasis pattern from ListeningBuildStepView so the user gets the
 * same visual cue across step types.
 */
function PromptWithEmphasis({ meaning }: { meaning: string }) {
  return (
    <>
      What is the word for{" "}
      <strong className="font-extrabold text-text-primary">
        &lsquo;{meaning}&rsquo;
      </strong>
      ?
    </>
  );
}

export function WordImageMcqStepView({ step, onComplete, onContinue }: Props) {
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
        handleTap(step.options[n - 1].id, step.options[n - 1].word);
      }
    },
    enabled: !celebrating,
  });

  function handleTap(optId: string, word: string) {
    if (submitted) return;
    // Preview-on-tap: play the word's TTS so the learner can match the
    // emoji + kana to a sound before committing. Same interaction as
    // symbol_to_sound / symbol_recognition.
    if (getTtsUrl(word)) {
      playJaAudio(word);
    }
    setSelected(optId);
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

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h2 className="text-center text-xl font-medium leading-snug text-text-secondary sm:text-2xl">
        <PromptWithEmphasis meaning={step.meaningEn} />
      </h2>

      {/* max-w cap shrinks the 2×2 ~15% vs unconstrained — emoji feels
       *  proportional rather than swimming in empty card space. */}
      <div className="relative mx-auto grid w-full max-w-[36rem] grid-cols-2 gap-4">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          // Square buttons. Same solid-accent selection pattern as the
          // other 2026-05-16 MCQ revamps — unmistakable in dark mode.
          let base =
            "relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 bg-surface p-4 transition-colors duration-150";
          let stateClasses = "border-border hover:border-accent";
          if (submitted && isAnswer) {
            stateClasses = "border-accent bg-accent/10";
          } else if (submitted && isSelected && !isAnswer) {
            stateClasses = "border-error bg-error/10";
          } else if (isSelected) {
            stateClasses = "border-accent bg-accent/5";
          }
          const emojiSrc = lingoArtUrl(opt.word) ?? notoEmojiUrl(opt.emoji);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => handleTap(opt.id, opt.word)}
              className={`${base} ${stateClasses}`}
              aria-label={`Hear and pick ${opt.word}`}
            >
              {/* Kana inset across the top of the card. */}
              <span
                className={
                  "font-japanese absolute left-0 right-0 top-3 text-center text-2xl font-bold tracking-wide sm:text-3xl " +
                  (submitted && isAnswer
                    ? "text-accent"
                    : submitted && isSelected && !isAnswer
                      ? "text-error"
                      : "text-text-primary")
                }
              >
                {opt.word}
              </span>
              {/* Emoji centered, sized to fill ~60–65% of the card.
               *  Noto Emoji SVG render — never device-dependent. */}
              {emojiSrc ? (
                <img
                  src={emojiSrc}
                  alt=""
                  width={160}
                  height={160}
                  loading="eager"
                  className="h-[60%] w-[60%] max-h-44 max-w-44 select-none object-contain"
                  draggable={false}
                />
              ) : (
                <span aria-hidden className="text-8xl">
                  {opt.emoji}
                </span>
              )}
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
