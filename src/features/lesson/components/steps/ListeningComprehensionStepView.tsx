import { useCallback, useMemo, useState } from "react";
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
import { seededShuffle } from "@/shared/utils/seededShuffle";
import { useFormFactor } from "@/shared/platform/formFactor";
import { Badge } from "@/shared/components/ui";

const CELEBRATE_MS = 1100;

/**
 * TestFlight #63 (Spencer, b12 2026-09-14 — "Scrolls here are ugly, maybe we
 * limit these to 3 answers… Big decision"; Spencer's verdict, b12 follow-up:
 * "3 answers is fine on mobile and then we stick with 4 on web and then the
 * mobile just dynamically only picks 3"): a 4-long-English-option listening
 * MCQ pushes CONTINUE off a 390px screen, forcing a scroll before the learner
 * can even answer — but only on a touch/coarse-pointer surface. Desktop has
 * the vertical room, so it renders every authored option unchanged. Cap
 * what's RENDERED (not the authored bank, and not desktop) at 3 options.
 */
export const MAX_LISTENING_MCQ_OPTIONS = 3;

/**
 * Picks which options to render. Pure — takes the touch/compact flag as an
 * explicit argument rather than reading `hasCoarsePointer()` itself, so it
 * stays testable and reusable from non-DOM contexts (the render gate, the
 * visual-QA contract builder) without an environment to fake.
 *
 * When `compact` is false (desktop/web), every authored option renders,
 * unchanged from what's authored — Spencer's verdict keeps 4-on-web and
 * doesn't touch authoring either way.
 *
 * When `compact` is true (touch) and the step is authored with more than
 * `MAX_LISTENING_MCQ_OPTIONS`: the correct option always survives, and the
 * distractors are trimmed via a seed (the step id) so a given learner sees
 * the same 3 on every render/resume — not a fresh random subset each time
 * (which could occasionally drop every wrong answer at once, or reshuffle
 * mid-session and read as broken). Kept options preserve their authored
 * relative order, so the correct answer's position isn't a tell.
 */
export function selectDisplayedOptions<T extends { id: string }>(
  options: readonly T[],
  correctOptionId: string,
  seed: string,
  compact: boolean,
): T[] {
  if (!compact || options.length <= MAX_LISTENING_MCQ_OPTIONS) {
    return options.slice();
  }
  const correct = options.find((o) => o.id === correctOptionId);
  const distractors = options.filter((o) => o.id !== correctOptionId);
  const pickCount = correct
    ? MAX_LISTENING_MCQ_OPTIONS - 1
    : MAX_LISTENING_MCQ_OPTIONS;
  const kept = new Set(
    seededShuffle(distractors, seed)
      .slice(0, pickCount)
      .map((o) => o.id),
  );
  if (correct) kept.add(correct.id);
  return options.filter((o) => kept.has(o.id));
}

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

  // Same shape predicate the learn page uses to force the vertical map
  // (`LearnHomeSwitch.tsx`) — reused rather than inventing a second detector.
  // A laptop with a touchscreen reports `fine` as its primary pointer, so this
  // correctly leaves desktop alone. It was bare `hasCoarsePointer()` until the
  // iPad pass (2026-09-15): a landscape iPad has MORE vertical room than a
  // laptop, so trimming it to 3 options was the phone rule misfiring on a
  // desktop-shaped surface (docs/ipad-scoping-2026-09-15.md §2 — "landscape
  // iPad mirrors desktop"). Portrait iPad stays compact.
  const { forceVerticalLearnMap: compact } = useFormFactor();

  const displayedOptions = useMemo(
    () => selectDisplayedOptions(step.options, step.correctOptionId, step.id, compact),
    [step.options, step.correctOptionId, step.id, compact],
  );

  const isCorrect = selected === step.correctOptionId;

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted) onContinue();
  }, [submitted, selected]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= displayedOptions.length) {
        setSelected(displayedOptions[n - 1].id);
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
    <div className="relative flex flex-1 flex-col gap-4 sm:gap-6">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      {/* The cluster CENTRES in the space above the action block rather than
          starting at the top. These steps size to their content, so
          top-aligning them stranded one large void between the last element
          and the CTA on a tall phone (Spencer QA 2026-08-07, measured at
          430x932). Reading order is unchanged; only the position moved. The
          action block below keeps `mt-auto`, so it stays bottom-anchored and
          the fixed action bar does not shift. */}
      {/* Vertical rhythm tightens below sm. At 375×667 this step overflowed
          the stage scroller by 55px (measured 2026-08-19,
          docs/issues/step-overflow-measured-2026-08-19.md) — and 375×667 is
          an IN-SUPPORT viewport, not a legacy one. The design above sm is
          unchanged. */}
      <div className="flex min-h-0 flex-1 flex-col stage-center gap-4 sm:gap-6">
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
          <Badge variant="eyebrow">
            Listen and answer
          </Badge>
          {audioSilent && (
            <p role="status" className="text-sm text-warning">
              Audio unavailable right now — tap again to retry.
            </p>
          )}
          {step.transcript ? (
            // TestFlight #73 (Spencer, b12 2026-09-14 — "shrink sentence text
            // by 20% at least"): 24px → 19.2px (text-2xl → 1.2rem, exact -20%).
            <p className="font-japanese text-[1.2rem] font-semibold leading-tight text-text-primary">
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

      <div className="grid gap-2 sm:gap-3">
        {displayedOptions.map((opt) => {
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
              className={`rounded-xl border-[1.5px] px-4 py-3 text-left text-base font-medium transition-colors duration-150 sm:py-4 sm:text-lg ${style}`}
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
