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

/**
 * SVG art with a raw-glyph fallback: a vendored Noto file that's missing
 * (or any future un-vendored emoji) renders the device emoji instead of
 * a broken-image box. The vendored set is curated, so gaps are possible
 * whenever new content is authored.
 */
function EmojiArt({ src, emoji }: { src: string | null; emoji: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span aria-hidden className="text-8xl">
        {emoji}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      width={160}
      height={160}
      loading="eager"
      onError={() => setFailed(true)}
      className="h-[58%] w-[58%] max-h-64 max-w-64 select-none object-contain"
      draggable={false}
    />
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
    else if (submitted) onContinue();
  }, [submitted, selected]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        handleTap(step.options[n - 1].id, step.options[n - 1].word);
      }
    },
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
      {/* Content cluster centers as one unit in leftover height. */}
      <div className="my-auto flex flex-col gap-6">
      <h2 className="text-center text-xl font-medium leading-snug text-text-secondary sm:text-2xl">
        <PromptWithEmphasis meaning={step.meaningEn} />
      </h2>

      {/* Grid height ≈ its width (two stacked squares), so the width cap
          is really a height cap: 100dvh minus the chrome + prompt +
          Continue budget. Shrinks on short laptops (MacBook 14" ≈ 840px
          usable); on tall windows it grows past the 42rem text column
          (picture cards have no line-length constraint) via the
          left-1/2 translate breakout, up to 56rem. */}
      <div className="relative left-1/2 grid w-[clamp(18rem,calc(100dvh-22rem),56rem)] max-w-[calc(100vw-3rem)] -translate-x-1/2 grid-cols-2 gap-4">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          // Square buttons. Same solid-accent selection pattern as the
          // other 2026-05-16 MCQ revamps — unmistakable in dark mode.
          let base =
            "flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-surface p-4 transition-colors duration-150";
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
              {/* Kana stacked above the art (normal flow, not absolute) so
               *  the card stays vertically balanced at any size. */}
              <span
                className={
                  "font-japanese text-center text-2xl font-bold tracking-wide sm:text-3xl " +
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
              <EmojiArt src={emojiSrc} emoji={opt.emoji} />
            </button>
          );
        })}
      </div>
      </div>

      {/* Single bottom-anchored block (banner + CTA) so the button never
          moves on submit. Width mirrors the grid's breakout so the column
          reads as one shape when the grid exceeds 42rem. */}
      <div className="relative left-1/2 flex w-[max(100%,min(calc(100dvh-22rem),56rem))] max-w-[calc(100vw-3rem)] -translate-x-1/2 flex-col gap-4">
        {celebrating && <CelebrationToast text={celebrationText} />}
        {submitted && !isCorrect && <Feedback correct={false} />}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            label="Check"
            disabled={!selected}
          />
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
