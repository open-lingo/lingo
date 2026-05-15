import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { MultipleChoiceStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedJa } from "@/shared/japanese";
import {
  getTtsUrl,
  playJaAudio,
  useAutoPlayJaAudio,
} from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";

const CELEBRATE_MS = 1100;

type Props = {
  step: MultipleChoiceStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function MultipleChoiceStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctOptionId;

  // Auto-play prompt audio 500ms after mount. Either an explicit
  // promptAudioText (audio-first drills) or — when the prompt itself is
  // pure Japanese — the prompt string.
  useAutoPlayJaAudio(step.promptAudioText, `mc-${step.id}`);

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

  function replayPromptAudio() {
    if (step.promptAudioText) playJaAudio(step.promptAudioText);
  }

  const ttsAvailable =
    !!step.promptAudioText && !!getTtsUrl(step.promptAudioText);
  // 2×2 grid when 4 options; single column otherwise. Anchors Continue by
  // sizing the option block with a fixed min-height regardless of layout.
  const optionsAre4 = step.options.length === 4;
  const gridClasses = optionsAre4
    ? "relative grid grid-cols-2 gap-3 sm:gap-4"
    : "relative grid gap-3";

  return (
    <div className="flex flex-1 flex-col gap-6">
      {step.audioOnlyPrompt ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <button
            type="button"
            onClick={replayPromptAudio}
            disabled={!ttsAvailable}
            className="flex h-20 w-20 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_4px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_5px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_2px_0_0_var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={32} />
          </button>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {t("lesson.whichKanaStarts", "Which kana starts the word?")}
          </p>
        </div>
      ) : (
        <h2 className="text-xl font-semibold text-text-primary">
          {step.promptAnnotation ? (
            <AnnotatedJa segments={step.promptAnnotation} />
          ) : (
            <AnnotatedJa text={step.prompt} />
          )}
        </h2>
      )}

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      <div className={gridClasses} style={{ minHeight: optionsAre4 ? 220 : 180 }}>
        {step.options.map((opt, idx) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          const ann = step.optionAnnotations?.[idx];

          let style =
            "border-border bg-surface text-text-primary hover:border-accent";

          if (submitted && isAnswer) {
            style =
              "border-accent bg-accent-muted text-accent";
          } else if (submitted && isSelected && !isAnswer) {
            style =
              "border-error bg-red-50 text-error dark:bg-red-950/30";
          } else if (isSelected) {
            style =
              "border-accent bg-accent-muted text-accent";
          }

          // Big-glyph layout for short kana options; left-aligned text for
          // long English / sentence choices.
          const isShortGlyph = opt.text.length <= 2;
          const layout = isShortGlyph
            ? "flex items-center justify-center py-6 text-3xl font-bold"
            : "px-4 py-4 text-left text-base font-medium";

          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              onClick={() => setSelected(opt.id)}
              className={`rounded-xl border-[1.5px] transition-colors duration-150 ${layout} ${style} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {ann ? (
                <AnnotatedJa segments={ann} />
              ) : (
                <AnnotatedJa text={opt.text} />
              )}
            </button>
          );
        })}
        {celebrating && <CelebrationToast text={celebrationText} />}
      </div>

      {submitted && !isCorrect && (
        <Feedback correct={false} explanation={step.explanation} />
      )}

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
