import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ParticleClozeStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedJa } from "@/shared/japanese";
import { playJaAudio, getTtsUrl } from "@/shared/japanese/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: ParticleClozeStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Particle Cloze — sentence with a blank, pick the correct particle.
 *
 * The blank renders as a pill shape between the `before` / `after` halves
 * of the sentence (with AnnotatedJa ruby on each half). After submit the
 * correct particle slots into the pill, the English meaning reveals
 * below, and (if `audioText` is set) the full sentence audio plays once.
 */
export function ParticleClozeStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctParticle;

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted && !celebrating) onContinue();
  }, [submitted, selected, celebrating]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        setSelected(step.options[n - 1]);
      }
    },
    enabled: !celebrating,
  });

  const fullAudio = step.audioText ?? null;
  const hasFullAudio = !!fullAudio && !!getTtsUrl(fullAudio);

  function handleSubmit() {
    if (!selected) return;
    const correct = selected === step.correctParticle;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      if (hasFullAudio && fullAudio) {
        window.setTimeout(() => playJaAudio(fullAudio), 320);
      }
    }
  }

  function replayAudio() {
    if (fullAudio) playJaAudio(fullAudio);
  }

  // Pill content: blank while unanswered, then the chosen / correct
  // particle (post-submit). Wrong → show correct in pill, struck-through
  // user pick beside.
  const pillParticle = submitted ? step.correctParticle : selected;

  const hasSubmittedWrong = submitted && !isCorrect;

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {t("lesson.pickParticle", "Pick the particle that fits")}
      </p>

      <div className="rounded-2xl border-2 border-info/40 bg-info/5 px-5 py-6 text-center">
        <div className="font-japanese text-2xl leading-relaxed text-text-primary sm:text-3xl">
          <AnnotatedJa text={step.prompt.before} />
          <span
            className={`mx-2 inline-flex min-w-[3rem] items-center justify-center rounded-full border-2 px-3 py-0.5 align-middle text-xl font-bold ${
              submitted
                ? isCorrect
                  ? "border-success bg-success/15 text-success"
                  : "border-error bg-error/15 text-error"
                : "border-dashed border-accent/60 bg-surface text-accent"
            }`}
          >
            {pillParticle ?? "?"}
          </span>
          <AnnotatedJa text={step.prompt.after} />
        </div>

        {submitted && !isCorrect && selected ? (
          <p className="mt-3 text-sm text-error">
            {t("lesson.youPicked", "You picked")}{" "}
            <span className="font-japanese font-bold">{selected}</span>
          </p>
        ) : null}

        {submitted ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary">
            <span>{step.meaningEn}</span>
            {hasFullAudio ? (
              <button
                type="button"
                onClick={replayAudio}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white"
                aria-label={t("lesson.play", "Play audio")}
              >
                <Icon name="play" size={12} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-4 gap-3">
        {step.options.map((p) => {
          const picked = selected === p;
          let style =
            "border-border bg-surface text-text-primary hover:border-accent/60";
          if (submitted) {
            if (p === step.correctParticle) {
              style = "border-success bg-success/15 text-success";
            } else if (picked) {
              style = "border-error bg-error/15 text-error";
            } else {
              style = "border-border bg-surface text-text-muted opacity-60";
            }
          } else if (picked) {
            style = "border-accent bg-accent/10 text-accent";
          }
          return (
            <button
              key={p}
              type="button"
              disabled={submitted}
              aria-pressed={picked}
              onClick={() => setSelected(p)}
              className={`flex h-14 items-center justify-center rounded-xl border-2 font-japanese text-2xl font-bold transition-colors ${style}`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {submitted && step.explanation ? (
        <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary">
          {step.explanation}
        </p>
      ) : null}

      {!submitted ? (
        <ContinueButton
          onClick={handleSubmit}
          disabled={!selected}
          label={t("lesson.check", "Check")}
        />
      ) : (
        <>
          <Feedback correct={isCorrect} explanation={step.explanation} />
          <ContinueButton onClick={onContinue} />
        </>
      )}

      {celebrating ? <CelebrationToast text={celebrationText} /> : null}
    </div>
  );
}
