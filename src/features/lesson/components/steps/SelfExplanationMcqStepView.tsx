import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SelfExplanationMcqStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { AnnotatedJa } from "@/shared/japanese";
import { getTtsUrl, playJaAudio } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: SelfExplanationMcqStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Self-Explanation MCQ — metacognitive follow-up to a primary answer step.
 *
 * Renders the anchor (the fact the learner just committed) prominently,
 * then asks "Why is X correct?" with 3 reason options tagged by
 * `reasonType` (`rule` / `surface` / `distractor`). Wrong-answer feedback
 * is differentiated: a surface miss gets "close — that's the pattern,
 * but the rule is…", a pure distractor miss gets "not quite — try again".
 *
 * Mirrors `MultipleChoiceStepView`'s structure (2×2 grid when 4 opts,
 * single column otherwise; correctSlot rotation handled via stable
 * pre-mount shuffle so distractor position varies across reloads).
 * Backed by Dunlosky 2013 (moderate-utility self-explanation effect).
 */
export function SelfExplanationMcqStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  // Stable per-mount shuffle so the rule-citing option doesn't always
  // sit in slot 0. Same correctSlot-rotation spirit as MCQ.
  const orderedOptions = useMemo(() => {
    const opts = [...step.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step.id]);

  const selectedOpt = orderedOptions.find((o) => o.id === selected);
  const isCorrect = selected === step.correctOptionId;
  const missType = selectedOpt?.reasonType;

  const handleEnter = useCallback(() => {
    if (!submitted && selected) handleSubmit();
    else if (submitted && !celebrating) onContinue();
  }, [submitted, selected, celebrating]);

  useLessonKeyboard({
    onEnter: handleEnter,
    onNumber: (n) => {
      if (!submitted && n <= orderedOptions.length) {
        setSelected(orderedOptions[n - 1].id);
      }
    },
    enabled: !celebrating,
  });

  const anchorAudioAvailable =
    !!step.anchor.audioText && !!getTtsUrl(step.anchor.audioText);

  function playAnchorAudio() {
    if (step.anchor.audioText) playJaAudio(step.anchor.audioText);
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

  const optionsAre4 = orderedOptions.length === 4;
  const gridClasses = optionsAre4
    ? "relative grid grid-cols-2 grid-rows-2 auto-rows-fr gap-3 sm:gap-4"
    : "relative grid gap-3";

  // Wrong-answer explanation copy distinguishes a "close" surface miss
  // from an unrelated distractor miss. The actual rule (if provided)
  // appends so the learner always leaves with the correct rule in mind.
  let wrongExplanation: string | undefined;
  if (submitted && !isCorrect) {
    if (missType === "surface") {
      wrongExplanation = t(
        "lesson.selfExplain.surfaceMiss",
        "Close — that's the surface pattern, but the rule is deeper.",
      );
    } else {
      wrongExplanation = t(
        "lesson.selfExplain.distractorMiss",
        "Not quite — that's unrelated to why this answer is correct.",
      );
    }
    if (step.ruleExplanation) {
      wrongExplanation = `${wrongExplanation} ${step.ruleExplanation}`;
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Anchor — the fact the learner just committed. Subtle tinted
          card so it reads as "context, not the question". */}
      <div className="flex items-start gap-3 rounded-2xl border-2 border-info/30 bg-info/5 px-5 py-4">
        <span className="mt-0.5 text-xs font-bold uppercase tracking-wider text-info shrink-0">
          {t("lesson.selfExplain.anchorTag", "You answered")}
        </span>
        <p className="flex-1 text-base font-medium text-text-primary">
          <AnnotatedJa text={step.anchor.label} />
        </p>
        {anchorAudioAvailable && (
          <button
            type="button"
            onClick={playAnchorAudio}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-accent-hover bg-accent text-white shadow-[0_2px_0_0_var(--color-accent-hover)] transition-all duration-150 hover:-translate-y-px hover:bg-accent-hover hover:shadow-[0_3px_0_0_var(--color-accent-hover)] active:translate-y-px active:shadow-[0_1px_0_0_var(--color-accent-hover)]"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={14} />
          </button>
        )}
      </div>

      <h2 className="text-xl font-semibold text-text-primary">
        {step.question}
      </h2>

      {step.hint && !submitted && (
        <p className="text-sm text-text-muted">{step.hint}</p>
      )}

      <div className={gridClasses} style={{ minHeight: optionsAre4 ? 220 : 180 }}>
        {orderedOptions.map((opt) => {
          const isSelected = selected === opt.id;
          const isAnswer = opt.id === step.correctOptionId;

          let style =
            "border-border bg-surface text-text-primary hover:border-accent";
          if (submitted && isAnswer) {
            style = "border-accent bg-accent text-white";
          } else if (submitted && isSelected && !isAnswer) {
            style = "border-error bg-error/15 text-error";
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
              className={`rounded-xl border-2 px-4 py-5 text-left text-base font-medium leading-snug transition-colors duration-150 ${style} ${submitted ? "cursor-default" : "cursor-pointer"}`}
            >
              {opt.text}
            </button>
          );
        })}
        {celebrating && <CelebrationToast text={celebrationText} />}
      </div>

      {/* Subtle reveal card on correct commit (the actual rule). */}
      {submitted && isCorrect && step.ruleExplanation && (
        <div className="rounded-2xl border-[1.5px] border-accent/40 bg-accent-muted/60 px-5 py-4 text-sm leading-relaxed text-text-primary">
          <span className="block text-xs font-bold uppercase tracking-wider text-accent">
            {t("lesson.selfExplain.ruleReveal", "The rule")}
          </span>
          <p className="mt-1.5">{step.ruleExplanation}</p>
        </div>
      )}

      {submitted && !isCorrect && (
        <Feedback correct={false} explanation={wrongExplanation} />
      )}

      {!submitted ? (
        <ContinueButton
          onClick={handleSubmit}
          label={t("lesson.check", "Check")}
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
