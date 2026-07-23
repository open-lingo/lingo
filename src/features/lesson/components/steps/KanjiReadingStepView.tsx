import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { KanjiReadingStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: KanjiReadingStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Kanji Reading — show a kanji word, pick its KANA reading (kanji → kana).
 *
 * NO FURIGANA ON THE PROMPT, and no autoplay. Both would hand over the
 * answer: this is the one step whose prompt is the thing under test.
 *  - The reading is suppressed structurally, not by a flag here: the factory
 *    emits `promptAnnotation` as `surface === reading === kanji`, and
 *    AnnotatedText floats an <rt> only when `surface !== reading`. Romaji is
 *    independently barred by its containsKanji gate. So there is no settings
 *    combination — and no `applyKanjiSurfaces` pass — that can reveal it.
 *  - Audio is the spoken answer, so unlike MultipleChoiceStepView (which
 *    calls `useAutoPlayJaAudio` on its prompt) there is no autoplay; the
 *    replay button appears only after a commit, per AgreementClozeStepView.
 *
 * Options are kana-only (shipped policy: no kanji production, ever), so
 * they render as plain text — annotating them would print romaji over the
 * answer set.
 */
export function KanjiReadingStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctOptionId;
  const hasAudio = !!step.audioText && !!getTtsUrl(step.audioText);

  // Pending answer-audio play, held in a ref so advancing can't let this
  // step's reading bleed into the next step (AgreementCloze precedent).
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
    }
    // Speak the reading on commit either way — hearing the right answer is
    // the corrective beat on a miss, and the confirmation on a hit.
    if (hasAudio && step.audioText) {
      const text = step.audioText;
      audioTimer.current = window.setTimeout(() => playJaAudio(text), 320);
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

  function optionStyle(optionId: string): string {
    const picked = selected === optionId;
    if (submitted) {
      if (optionId === step.correctOptionId) {
        return "border-success bg-success/15 text-success";
      }
      if (picked) return "border-error bg-error/15 text-error";
      return "border-border bg-surface text-text-muted opacity-60";
    }
    if (picked) return "border-accent bg-accent/10 text-accent";
    return "border-border bg-surface text-text-primary hover:border-accent/60";
  }

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {t("lesson.kanjiReading.instruction", "How do you read this?")}
      </p>

      <div
        data-testid="kanji-reading-prompt"
        className="rounded-2xl border-2 border-info/40 bg-info/5 px-5 py-8 text-center"
      >
        {/* The kanji under test — bare by construction (see the note above). */}
        <div className="text-5xl leading-tight text-text-primary sm:text-6xl">
          <AnnotatedJa segments={step.promptAnnotation} />
        </div>
        {step.meaningEn ? (
          // Meaning is a disambiguating cue, not the answer: homographs like
          // 一 (いち / ひと-) need it to have one correct reading.
          <p className="mt-4 text-base text-text-secondary">
            &ldquo;{step.meaningEn}&rdquo;
          </p>
        ) : null}
        {submitted && hasAudio ? (
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => step.audioText && playJaAudio(step.audioText)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white"
              aria-label={t("lesson.play", "Play audio")}
            >
              <Icon name="play" size={12} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {step.options.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={submitted}
            aria-pressed={selected === option.id}
            onClick={() => setSelected(option.id)}
            className={`rounded-xl border-2 px-4 py-4 text-2xl font-bold transition-colors ${optionStyle(option.id)} ${submitted ? "cursor-default" : "cursor-pointer"}`}
          >
            {option.text}
          </button>
        ))}
      </div>

      {/* Single bottom block (house CTA-harmony): banner + CTA together so
          the button never moves on submit. */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6" data-testid="primary-cta">
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {submitted && step.explanation ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary">
            {step.explanation}
          </p>
        ) : null}
        {hasSubmittedWrong && <Feedback correct={false} correctAnswer={step.reading} />}
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
