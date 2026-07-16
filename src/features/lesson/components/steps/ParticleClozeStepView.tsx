import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ParticleClozeStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedText as AnnotatedJa } from "@/shared/readingAnnotation/AnnotatedText";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

/**
 * Options the "Pick the particle that fits" instruction is honest about.
 * Grammar pools reuse this step type for copula forms, verb endings,
 * adverbs, demonstratives… (2026-07-06 audit: the hardcoded label lied on
 * ~95 steps) — anything outside this set gets "Complete the sentence".
 */
const PARTICLE_OPTIONS = new Set([
  "は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "ね", "よ",
  "な", "わ", "や", "から", "まで", "までに", "より", "だけ", "しか",
  "くらい", "ぐらい", "ほど", "など",
]);

type Props = {
  step: ParticleClozeStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
  /**
   * Grammar-deck rendering: show `meaningEn` BEFORE the answer. In a
   * lesson the surrounding steps supply context, so the meaning stays a
   * post-submit reveal; standalone, a semantic cloze without the gloss is
   * a guessing game (です/でした/じゃないです are all grammatical).
   * Audio stays post-submit either way — it speaks the answer.
   */
  showMeaningPreAnswer?: boolean;
};

/**
 * Particle Cloze — sentence with a blank, pick the correct particle.
 *
 * The blank renders as a pill shape between the `before` / `after` halves
 * of the sentence (with AnnotatedJa ruby on each half). After submit the
 * correct particle slots into the pill, the English meaning reveals
 * below (or sits above the sentence from the start — see
 * `showMeaningPreAnswer`), and (if `audioText` is set) the full sentence
 * audio plays once.
 */
export function ParticleClozeStepView({
  step,
  onComplete,
  onContinue,
  showMeaningPreAnswer = false,
}: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const isCorrect = selected === step.correctParticle;

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= step.options.length) {
        setSelected(step.options[n - 1]);
      }
    },
  });

  const fullAudio = step.audioText ?? null;
  const hasFullAudio = !!fullAudio && !!getTtsUrl(fullAudio);

  // Pending correct-answer play, held in a ref so it's cancelled if the
  // step unmounts before it fires — advancing must not let this step's
  // audio play over the next one (Spencer QA 2026-07-16).
  const optionAudioTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (optionAudioTimer.current !== null) {
        window.clearTimeout(optionAudioTimer.current);
      }
    },
    [],
  );

  function handleSubmit() {
    if (!selected) return;
    const correct = selected === step.correctParticle;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      // Reinforce the CHOSEN option, not the whole sentence: the full
      // sentence used to keep playing and bleed into the next step
      // (Spencer QA 2026-07-16). The post-submit speaker button below
      // still replays the full sentence on explicit request.
      const pick = selected;
      if (getTtsUrl(pick)) {
        optionAudioTimer.current = window.setTimeout(
          () => playJaAudio(pick),
          320,
        );
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

  const allOptionsAreParticles = step.options.every((o) =>
    PARTICLE_OPTIONS.has(o),
  );
  // QA 2026-07-12 (Spencer): the gloss is needed pre-answer in LESSONS
  // too — "without the english phrase to translate off of, it's hard to
  // know the intention; sometimes there is no right particle." The deck
  // surface already showed it; now every surface does.
  const showMeaningUpFront = !!step.meaningEn;
  void showMeaningPreAnswer; // retained prop — all surfaces now show it

  return (
    <div className="relative flex flex-1 flex-col gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {allOptionsAreParticles
          ? t("lesson.pickParticle", "Pick the particle that fits")
          : t("lesson.completeSentence", "Complete the sentence")}
      </p>

      {/* Content starts at the top; the CTA block below carries mt-auto so
          it pins to the shared bottom action slot. */}
      <div className="rounded-2xl border-2 border-info/40 bg-info/5 px-5 py-6 text-center">
        {showMeaningUpFront ? (
          <p className="mb-4 text-base text-text-secondary">
            &ldquo;{step.meaningEn}&rdquo;
          </p>
        ) : null}
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

        {submitted && (!showMeaningUpFront || hasFullAudio) ? (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-text-secondary">
            {/* Meaning already sits above the sentence in pre-answer mode —
                don't repeat it; the row then carries only the audio replay. */}
            {!showMeaningUpFront ? <span>{step.meaningEn}</span> : null}
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

      {/* flex-wrap, not a fixed grid: long options (じゃないです) must widen
          their tile instead of wrapping mid-word; whitespace-nowrap +
          min-w-fit guarantee it, equal flex-basis keeps short particle sets
          evenly sized, and long options step the type down one size. */}
      <div className="flex flex-wrap gap-3">
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
          const sizing =
            p.length >= 5
              ? "text-lg sm:text-xl"
              : p.length >= 3
                ? "text-xl sm:text-2xl"
                : "text-2xl sm:text-3xl";
          return (
            <button
              key={p}
              type="button"
              disabled={submitted}
              aria-pressed={picked}
              onClick={() => setSelected(p)}
              className={`flex h-[clamp(3.5rem,8dvh,4.5rem)] min-w-fit flex-1 basis-[calc(25%-0.75rem)] items-center justify-center whitespace-nowrap rounded-xl border-2 px-4 font-japanese font-bold transition-colors ${sizing} ${style}`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Single bottom block: explanation + banner + CTA together so the
          button never moves on submit. Banner only on wrong — correct
          celebrates via toast; the explanation still teaches on both. */}
      <div className="relative mt-auto flex flex-col gap-4 pt-6">
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {submitted && step.explanation ? (
          <p className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-text-secondary">
            {step.explanation}
          </p>
        ) : null}
        {submitted && !isCorrect && <Feedback correct={false} />}
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
