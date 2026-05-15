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
            className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50 dark:bg-emerald-800/40 dark:text-emerald-300 dark:hover:bg-emerald-700/40"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={32} />
          </button>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {t("lesson.whichKanaStarts", "Which kana starts the word?")}
          </p>
        </div>
      ) : (
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {step.promptAnnotation ? (
            <AnnotatedJa segments={step.promptAnnotation} />
          ) : (
            <AnnotatedJa text={step.prompt} />
          )}
        </h2>
      )}

      {step.hint && !submitted && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{step.hint}</p>
      )}

      <div className={gridClasses} style={{ minHeight: optionsAre4 ? 220 : 180 }}>
        {step.options.map((opt, idx) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;
          const ann = step.optionAnnotations?.[idx];

          let style =
            "border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-emerald-600 dark:hover:bg-gray-700";

          if (submitted && isAnswer) {
            style =
              "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/30";
          } else if (submitted && isSelected && !isAnswer) {
            style =
              "border-red-500 bg-red-50 dark:border-red-500 dark:bg-red-900/30";
          } else if (isSelected) {
            style =
              "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/30 dark:border-emerald-500 dark:bg-emerald-900/20";
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
              className={`rounded-xl border-2 transition ${layout} ${style} ${submitted ? "cursor-default" : "cursor-pointer"}`}
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
