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

  // Gate on whether a RECORDING EXISTS, not on which script this is. The old
  // `scriptId === hiragana|katakana` test excluded hangul, so Korean fell to
  // the alphabet-CDN path below — where every KO symbol step has a null
  // audioKey, producing silence with no request at all.
  const hasTtsClip = Boolean(getTtsUrl(step.payload.symbol));

  // Legacy alphabet-CDN path, used only when no recording exists. Running both
  // would double-fire on steps that have a clip AND an audioKey.
  useEffect(() => {
    if (hasTtsClip) return;
    autoPlayAlphabetAudio(step.payload.audioKey, `recognition-${step.id}`);
  }, [step.payload.audioKey, step.id, hasTtsClip]);

  useAutoPlayJaAudio(
    hasTtsClip ? step.payload.symbol : undefined,
    `recog-tts-${step.id}`,
  );

  function handlePlay() {
    if (hasTtsClip) {
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
    else if (submitted) onContinue();
  }, [submitted, selected, onContinue]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) setSelected(step.options[n - 1].id);
    },
  });

  const hasAudio =
    Boolean(step.payload.audioKey) ||
    hasTtsClip;
  const romanization = step.payload.romanization;
  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* The cluster CENTRES in the space above the action block rather than
          starting at the top. These steps size to their content, so
          top-aligning them stranded one large void between the last element
          and the CTA on a tall phone (Spencer QA 2026-08-07, measured at
          430x932). Reading order is unchanged; only the position moved. The
          action block below keeps `mt-auto`, so it stays bottom-anchored and
          the fixed action bar does not shift. */}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* QA 2026-07-12: prompt bumped a size — "make the sentence of
            'pick the symbol' a little bigger". */}
        <h2 className="text-xl font-medium text-text-secondary sm:text-2xl">
          {t("alphabet.taskPickSymbol", "Pick the symbol for")}{" "}
          <span className="ml-1 text-3xl font-bold text-accent">
            {romanization}
          </span>
        </h2>
        {hasAudio && (
          <button
            type="button"
            onClick={handlePlay}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] active:translate-y-px active:shadow-[0_1px_0_0_rgb(var(--color-accent-hover))]"
            aria-label={t("alphabet.play", "Play")}
          >
            <Icon name="play" size={14} />
          </button>
        )}
      </div>
      {/* Container-aware row height: cards grow into leftover column height
          on tall windows (relative to the lesson scroller, `cqh`) instead
          of stranding dead space — no `dvh` jitter on mobile chrome. */}
      <div
        className="grid grid-cols-2 gap-4"
        style={{ gridAutoRows: "minmax(clamp(7.5rem, 22cqh, 13rem), auto)" }}
      >
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          // Solid accent fill on selected = unmistakable in any theme.
          let style =
            "font-japanese rounded-xl border-2 border-border bg-surface py-9 text-5xl sm:text-6xl font-bold text-text-primary transition-colors duration-150 hover:border-accent";
          if (submitted && isAnswer) {
            style =
              "font-japanese rounded-xl border-2 border-accent bg-accent py-9 text-5xl sm:text-6xl font-bold text-white transition-colors duration-150";
          } else if (submitted && isSelected && !isAnswer) {
            style =
              "font-japanese rounded-xl border-2 border-error bg-error/15 py-9 text-5xl sm:text-6xl font-bold text-error transition-colors duration-150";
          } else if (isSelected) {
            style =
              "font-japanese rounded-xl border-2 border-accent bg-accent py-9 text-5xl sm:text-6xl font-bold text-white transition-colors duration-150";
          }
          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => {
                // Preview-on-tap: play the kana's own audio when picked.
                // Same interaction as symbol_to_sound but with kana buttons.
                if (getTtsUrl(opt.symbol)) {
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
      </div>
      </div>
      {/* Single bottom-anchored block: banner + CTA together so the
          button never moves on submit. */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
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
