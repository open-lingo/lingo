import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ConjugationClozeStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: ConjugationClozeStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Conjugation Cloze — sentence with a blank where a CONJUGATED verb form
 * goes; the cue chip names the derivation ("はなす → て form", optional
 * English cue). Layout, feedback, keyboard, and CTA conventions mirror
 * ParticleClozeStepView (the closest sibling): meaning shown up front
 * (a semantic cloze without the gloss is a guessing game — 2026-07-12 QA),
 * blank renders as a pill between the frame halves, 4 option buttons,
 * single bottom CTA block so the button never moves on submit.
 *
 * Audio: `audioText` is the FULL assembled sentence including the answer,
 * so nothing plays pre-commit. On a correct commit it auto-plays once
 * (timer held in a ref so advancing can't bleed it into the next step —
 * ParticleCloze precedent, Spencer QA 2026-07-16); a replay button
 * appears post-submit either way.
 */
export function ConjugationClozeStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctOptionId;
  const correctText =
    step.options.find((o) => o.id === step.correctOptionId)?.text ?? "";
  const selectedText = step.options.find((o) => o.id === selected)?.text;

  const fullAudio = step.audioText ?? null;
  const hasFullAudio = !!fullAudio && !!getTtsUrl(fullAudio);

  // Pending post-commit play, held in a ref so it's cancelled if the step
  // unmounts before it fires (audio must never play over the next step).
  const audioTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (audioTimer.current !== null) window.clearTimeout(audioTimer.current);
    },
    [],
  );

  function handleSubmit() {
    if (!selected || submitted) return;
    const correct = selected === step.correctOptionId;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      if (hasFullAudio && fullAudio) {
        audioTimer.current = window.setTimeout(() => playJaAudio(fullAudio), 320);
      }
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, selected]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        setSelected(step.options[n - 1].id);
      }
    },
  });

  const hasSubmittedWrong = submitted && !isCorrect;

  // Pill content: blank while unanswered / pre-submit shows the pick;
  // post-submit always shows the CORRECT form (wrong picks are shown
  // struck-out below, like ParticleCloze's "You picked" line).
  const pillText = submitted ? correctText : selectedText;

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {t("lesson.conjugationCloze.instruction", "Complete with the right form")}
      </p>

      {/* Derivation cue chip: dictionary form → target form (+ EN cue). */}
      <div
        data-testid="conjugation-cue"
        className="flex flex-wrap items-center justify-center gap-2 text-sm"
      >
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 font-japanese font-bold text-accent">
          {step.verb}
        </span>
        <span aria-hidden="true" className="text-text-muted">→</span>
        <span className="rounded-full border border-border bg-surface px-3 py-1 font-bold text-text-secondary">
          {step.formLabel}
        </span>
        {step.cueEn ? (
          <span className="text-text-muted">
            ({step.cueEn})
          </span>
        ) : null}
      </div>

      <div
        data-testid="conjugation-frame"
        className="rounded-2xl border-2 border-info/40 bg-info/5 px-5 py-6 text-center"
      >
        {step.meaningEn ? (
          <p className="mb-4 text-base text-text-secondary">
            &ldquo;{step.meaningEn}&rdquo;
          </p>
        ) : null}
        <div className="font-japanese text-2xl leading-relaxed text-text-primary sm:text-3xl">
          {step.beforeAnnotation ? (
            <AnnotatedJa segments={step.beforeAnnotation} />
          ) : (
            <AnnotatedJa text={step.prompt.before} />
          )}
          <span
            className={`mx-2 inline-flex min-w-[4rem] items-center justify-center rounded-full border-2 px-3 py-0.5 align-middle text-xl font-bold ${
              submitted
                ? isCorrect
                  ? "border-success bg-success/15 text-success"
                  : "border-error bg-error/15 text-error"
                : "border-dashed border-accent/60 bg-surface text-accent"
            }`}
          >
            {pillText ?? "?"}
          </span>
          {step.afterAnnotation ? (
            <AnnotatedJa segments={step.afterAnnotation} />
          ) : (
            <AnnotatedJa text={step.prompt.after} />
          )}
        </div>

        {submitted && !isCorrect && selectedText ? (
          <p className="mt-3 text-sm text-error">
            {t("lesson.youPicked", "You picked")}{" "}
            <span className="font-japanese font-bold">{selectedText}</span>
          </p>
        ) : null}

        {submitted && hasFullAudio ? (
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => fullAudio && playJaAudio(fullAudio)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white"
              aria-label={t("lesson.play", "Play audio")}
            >
              <Icon name="play" size={12} />
            </button>
          </div>
        ) : null}
      </div>

      {/* flex-wrap like ParticleCloze: long conjugated forms
          (のみませんでした) widen their tile instead of wrapping mid-word. */}
      <div className="flex flex-wrap gap-3">
        {step.options.map((option) => {
          const picked = selected === option.id;
          let style =
            "border-border bg-surface text-text-primary hover:border-accent/60";
          if (submitted) {
            if (option.id === step.correctOptionId) {
              style = "border-success bg-success/15 text-success";
            } else if (picked) {
              style = "border-error bg-error/15 text-error";
            } else {
              style = "border-border bg-surface text-text-muted opacity-60";
            }
          } else if (picked) {
            style = "border-accent bg-accent/10 text-accent";
          }
          const sizing =
            option.text.length >= 7
              ? "text-lg sm:text-xl"
              : option.text.length >= 5
                ? "text-xl sm:text-2xl"
                : "text-2xl sm:text-3xl";
          return (
            <button
              key={option.id}
              type="button"
              disabled={submitted}
              aria-pressed={picked}
              onClick={() => setSelected(option.id)}
              className={`flex h-[clamp(3.5rem,8dvh,4.5rem)] min-w-fit flex-1 basis-[calc(50%-0.75rem)] items-center justify-center whitespace-nowrap rounded-xl border-2 px-4 font-japanese font-bold transition-colors ${sizing} ${style}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Single bottom block: explanation + banner + CTA together so the
          button never moves on submit (house convention). */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6">
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {submitted && step.explanation ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary">
            {step.explanation}
          </p>
        ) : null}
        {hasSubmittedWrong && <Feedback correct={false} correctAnswer={correctText} />}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            disabled={!selected}
            label={t("lesson.check", "Check")}
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>
    </div>
  );
}
