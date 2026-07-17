import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AgreementClozeStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: AgreementClozeStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Agreement Cloze — sentence with multiple blanks that must AGREE
 * (gender/number endings, articles). Each blank renders inline as a
 * chip-group of its small closed option set; one Check grades all blanks
 * together (all-or-nothing — agreement is a sentence property, so partial
 * credit would teach that "las caso blancas" is half right).
 *
 * On a miss the corrected sentence shows in the Feedback banner. If
 * `audioText` is set, the full sentence plays after a correct commit and
 * a replay button appears (post-submit only — it speaks the answer).
 * TTS lang is intentionally omitted: `defaultTtsLang` is stamped by
 * LanguageContext for whichever course is active.
 */
export function AgreementClozeStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const blanks = useMemo(
    () =>
      step.segments.flatMap((seg) => ("blank" in seg ? [seg.blank] : [])),
    [step.segments],
  );
  const allFilled = blanks.every((b) => selections[b.id]);
  const allCorrect = blanks.every(
    (b) => selections[b.id] === b.correctAnswer,
  );

  const correctedSentence = useMemo(
    () =>
      step.segments
        .map((seg) => ("text" in seg ? seg.text : seg.blank.correctAnswer))
        .join(""),
    [step.segments],
  );

  const fullAudio = step.audioText ?? null;
  const hasFullAudio = !!fullAudio && !!getTtsUrl(fullAudio);

  // Pending correct-answer play, held in a ref so it's cancelled if the
  // step unmounts before it fires — advancing must not let this step's
  // sentence audio bleed into the next step (Spencer QA 2026-07-16).
  const audioTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (audioTimer.current !== null) {
        window.clearTimeout(audioTimer.current);
      }
    },
    [],
  );

  function handleSubmit() {
    if (!allFilled || submitted) return;
    setSubmitted(true);
    // Exactly-once completion: `submitted` gates re-entry (Check button
    // disables + keyboard handler no-ops after commit).
    onComplete(step.id, allCorrect);
    if (allCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      if (hasFullAudio && fullAudio) {
        audioTimer.current = window.setTimeout(
          () => playJaAudio(fullAudio),
          320,
        );
      }
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted && allFilled) handleSubmit();
    else if (submitted) onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, allFilled, selections]);

  useLessonKeyboard({ onEnter: handleEnter });

  function replayAudio() {
    if (fullAudio) playJaAudio(fullAudio);
  }

  const hasSubmittedWrong = submitted && !allCorrect;

  function chipStyle(blank: (typeof blanks)[number], option: string): string {
    const picked = selections[blank.id] === option;
    if (submitted) {
      if (option === blank.correctAnswer) {
        return "border-success bg-success/15 text-success";
      }
      if (picked) {
        return "border-error bg-error/15 text-error";
      }
      return "border-border bg-surface text-text-muted opacity-60";
    }
    if (picked) {
      return "border-accent bg-accent/10 text-accent";
    }
    return "border-border bg-surface text-text-primary hover:border-accent/60";
  }

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {t(
          "lesson.agreementCloze.instruction",
          "Complete the sentence — everything must agree",
        )}
      </p>

      <div className="rounded-2xl border-2 border-info/40 bg-info/5 px-5 py-6 text-center">
        <p className="mb-4 text-base text-text-secondary">
          &ldquo;{step.meaningEn}&rdquo;
        </p>
        {/* Sentence flows inline: literal text spans + one chip-group per
            blank. Chips are real buttons (tab + Enter/Space) — keyboard
            path needs no extra wiring. */}
        <div className="text-2xl leading-loose text-text-primary sm:text-3xl">
          {step.segments.map((seg, i) =>
            "text" in seg ? (
              <span key={i} className="whitespace-pre-wrap align-middle">
                {seg.text}
              </span>
            ) : (
              <span
                key={i}
                role="group"
                aria-label={t(
                  "lesson.agreementCloze.blankLabel",
                  "Blank {{n}}",
                  { n: blanks.findIndex((b) => b.id === seg.blank.id) + 1 },
                )}
                className="mx-1 inline-flex flex-wrap items-center justify-center gap-1 align-middle"
              >
                {seg.blank.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={submitted}
                    aria-pressed={selections[seg.blank.id] === option}
                    onClick={() =>
                      setSelections((prev) => ({
                        ...prev,
                        [seg.blank.id]: option,
                      }))
                    }
                    className={`rounded-lg border-2 px-2.5 py-0.5 text-lg font-bold transition-colors sm:text-xl ${chipStyle(seg.blank, option)} ${submitted ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {option}
                  </button>
                ))}
              </span>
            ),
          )}
        </div>

        {submitted && hasFullAudio ? (
          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={replayAudio}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white"
              aria-label={t("lesson.play", "Play audio")}
            >
              <Icon name="play" size={12} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Single bottom block (house CTA-harmony): banner + CTA together so
          the button never moves on submit. Correct celebrates via toast;
          a miss shows the corrected sentence in the banner. */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6">
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {submitted && step.explanation ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary">
            {step.explanation}
          </p>
        ) : null}
        {hasSubmittedWrong && (
          <Feedback correct={false} correctAnswer={correctedSentence} />
        )}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            disabled={!allFilled}
            label={t("lesson.check", "Check")}
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>
    </div>
  );
}
