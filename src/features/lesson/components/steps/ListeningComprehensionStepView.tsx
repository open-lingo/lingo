import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ListeningComprehensionStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { playJaAudio } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";
import { formatPrompt } from "../formatPrompt";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";

const CELEBRATE_MS = 1100;

type Props = {
  step: ListeningComprehensionStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

export function ListeningComprehensionStepView({ step, onComplete, onContinue }: Props) {
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
        setSelected(step.options[n - 1].id);
      }
    },
  });

  // Route EVERY play through playJaAudio — see the matching note in
  // ListeningBuildStepView. Calling playLocalAudio on a manifest URL bypassed
  // the synthesis fallback and swallowed CDN failures silently.
  const [audioSilent, setAudioSilent] = useState(false);

  function handlePlay() {
    if (!step.transcript) return;
    void playJaAudio(step.transcript).then((result) =>
      setAudioSilent(result === "silent"),
    );
  }

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

  const hasSubmittedWrong = submitted && !isCorrect;

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      {/* Content cluster starts at the top; the CTA block below carries
          mt-auto so it pins to the shared bottom action slot. */}
      <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePlay}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_3px_0_0_rgb(var(--color-accent-hover))] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_4px_0_0_rgb(var(--color-accent-hover))] active:translate-y-px active:shadow-[0_1px_0_0_rgb(var(--color-accent-hover))]"
          aria-label="Play audio"
        >
          <Icon name="play" size={24} />
        </button>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
            Listen and answer
          </p>
          {audioSilent && (
            <p role="status" className="text-sm text-warning">
              Audio unavailable right now — tap again to retry.
            </p>
          )}
          {step.transcript ? (
            <p className="font-japanese text-2xl font-semibold leading-tight text-text-primary">
              {step.transcriptAnnotation ? (
                <AnnotatedJa segments={step.transcriptAnnotation} />
              ) : (
                step.transcript
              )}
              {step.romaji && (
                <span className="ml-2 font-sans text-sm font-normal text-text-secondary">
                  {step.romaji}
                </span>
              )}
            </p>
          ) : null}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-text-primary">
        {formatPrompt(step.question)}
      </h2>

      <div className="grid gap-3">
        {step.options.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;

          let style = "border-border bg-surface text-text-primary hover:border-accent";
          if (submitted && isAnswer) {
            style = "border-accent bg-accent-muted text-accent";
          } else if (submitted && isSelected && !isAnswer) {
            style = "border-error bg-error/10 text-error";
          } else if (isSelected) {
            style = "border-accent bg-accent-muted text-accent";
          }

          return (
            <button
              key={opt.id}
              type="button"
              disabled={submitted}
              aria-pressed={isSelected}
              onClick={() => setSelected(opt.id)}
              className={`rounded-xl border-[1.5px] px-4 py-4 text-left text-base font-medium transition-colors duration-150 sm:text-lg ${style}`}
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      </div>

      {/* Single bottom-anchored block: banner + CTA together so the
          button never moves on submit. Banner only on wrong — correct
          celebrates via toast (a success banner shoved layout around for
          fast learners and read as a stranded island on tall windows). */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
        {celebrating && <CelebrationToast text={celebrationText} />}
        {submitted && !isCorrect && (
          <Feedback correct={false} explanation={step.explanation} />
        )}
        {!submitted ? (
          <ContinueButton onClick={handleSubmit} label="Check" disabled={!selected} />
        ) : (
          <ContinueButton onClick={onContinue} variant={isCorrect ? "correct" : "incorrect"} />
        )}
      </div>
    </div>
  );
}
