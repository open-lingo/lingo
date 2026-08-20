import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AspectChoiceClozeStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: AspectChoiceClozeStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Aspect Choice Cloze — preterite vs imperfect (es), passé composé vs
 * imparfait (fr), decided by the surrounding narrative.
 *
 * The visual job here is different from `agreement_cloze`, and the layout
 * follows from it. Agreement is a property of ONE sentence, so that step
 * centres a single line. Aspect is a property of a STORY: the learner has to
 * read several clauses against each other to see which events move the story
 * forward and which paint the scene behind it. So the narrative is set
 * left-aligned at reading width with generous leading, like prose rather than
 * like a flashcard — the reading IS the exercise.
 *
 * Grading is per-blank, not all-or-nothing. Each blank is an independent
 * discourse judgement with its own reason, so collapsing them would throw away
 * the thing the step exists to teach. After Check, every blank shows WHY its
 * aspect is the one a speaker would use; without that the item is a coin flip
 * the learner cannot learn from.
 */
export function AspectChoiceClozeStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const blanks = useMemo(
    () => step.segments.flatMap((seg) => ("blank" in seg ? [seg.blank] : [])),
    [step.segments],
  );
  const allFilled = blanks.every((b) => selections[b.id]);
  const correctCount = blanks.filter((b) => selections[b.id] === b.correctAnswer).length;
  const allCorrect = correctCount === blanks.length;

  // No corrected-answer echo in the banner. After Check the story above is
  // already resolved — every right form sits in it in success colour, and each
  // one is repeated in bold in its reason row — so a rebuilt sentence in the
  // banner is a third copy that costs ~110px of a 557px stage and pushes the
  // teaching off a phone. The banner carries the verdict only.

  const fullAudio = step.audioText ?? null;
  const hasFullAudio = !!fullAudio && !!getTtsUrl(fullAudio);

  // Held in a ref so a pending play is cancelled on unmount — this step's
  // narrative audio must not bleed into the next step.
  const audioTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (audioTimer.current !== null) window.clearTimeout(audioTimer.current);
    },
    [],
  );

  function handleSubmit() {
    if (!allFilled || submitted) return;
    setSubmitted(true);
    onComplete(step.id, allCorrect);
    if (allCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
      if (hasFullAudio && fullAudio) {
        audioTimer.current = window.setTimeout(() => playJaAudio(fullAudio), 320);
      }
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted && allFilled) handleSubmit();
    else if (submitted) onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, allFilled, selections]);

  useLessonKeyboard({ onEnter: handleEnter });

  const hasSubmittedWrong = submitted && !allCorrect;

  function chipStyle(blank: (typeof blanks)[number], option: string): string {
    const picked = selections[blank.id] === option;
    if (submitted) {
      if (option === blank.correctAnswer) return "border-success bg-success/15 text-success";
      if (picked) return "border-error bg-error/15 text-error";
      return "border-border bg-surface text-text-muted opacity-60";
    }
    if (picked) return "border-accent bg-accent/10 text-accent";
    return "border-border bg-surface text-text-primary hover:border-accent/60";
  }

  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <ExplainButton explanation={step.explanation} hasSubmittedWrong={hasSubmittedWrong} />
      {/* TOP-anchored, like `gender_sort` — NOT the `mt-auto` free-space split
          this step used to run. See the block comment below: the chips ARE the
          learner's answer, and a split that collapses at Check drags every one
          of them up the screen at the moment they are marked. */}
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {step.prompt}
      </p>

      {/* NOTHING above or around the chips changes size at Check.
          This panel used to tighten on submit — narrower padding, a step down
          in type size and leading, and the gloss retiring from ABOVE the story
          — to buy the reasons room. Measured at 375x667, the combined effect
          was that the learner's own answer chips moved up to 183.7px vertically
          and 157.4px horizontally at the instant they were graded (117.6 /
          271.6px at 1280x800): the marks land on chips that are no longer where
          the learner left them, which is precisely what CLAUDE.md § "Lesson UI
          stability rules" forbids. Frozen, the measurement is 0.0px on both
          axes at both viewports.
          The height that bought is paid back where it does no harm: the gloss
          still retires at submit, it simply sits BELOW the story now, so its
          removal moves only the reasons under it. Residual cost is 65px of
          post-commit scroll at 375x667 (20 -> 85; 0 either way at 1280x800),
          under a sticky CTA, while the learner is reading rather than
          answering. */}
      <div className="rounded-2xl border-2 border-info/40 bg-info/5 px-4 py-4 sm:px-5 sm:py-5">
        {/* Prose, not a centred flashcard line — the learner must read across
            clauses to judge aspect, so this is set at reading width. Leading is
            tuned for a line box that already contains a chip: `loose` on top of
            chip height broke the paragraph into stripes. */}
        <div className="text-left text-base leading-[2.1] text-text-primary sm:text-lg sm:leading-[2.2]">
          {step.segments.map((seg, i) =>
            "text" in seg ? (
              <span key={i} className="whitespace-pre-wrap align-middle">
                {seg.text}
              </span>
            ) : (
              <span
                key={i}
                role="group"
                aria-label={t("lesson.aspectChoice.blankLabel", "Choose the form of {{lemma}}", {
                  lemma: seg.blank.lemma,
                })}
                className="mx-1 inline-flex max-w-full flex-wrap items-center gap-1 align-middle"
              >
                {/* The lemma rides IN the row, not stacked above it. Stacked, it
                    read as debris floating over the prose, and its extra line
                    box pushed every chip off the text baseline. It goes away at
                    submit — it exists to say WHICH verb is being chosen, and
                    once the answer is on screen it is only clutter around it —
                    but as a GHOST, not a removal: it is inline, so deleting it
                    re-wraps the whole paragraph and slides the graded chips
                    sideways (measured 157px at 375x667). `invisible` keeps the
                    metrics and costs nothing, since it shares the line box the
                    chips already occupy. */}
                <span
                  aria-hidden={submitted}
                  className={`text-[0.62em] font-bold uppercase tracking-[0.08em] text-text-muted${
                    submitted ? " invisible" : ""
                  }`}
                >
                  {seg.blank.lemma}
                </span>
                {/* The two forms never split across lines: the pair only means
                    anything read side by side. The lemma outside this row is
                    what gives way first when the group runs out of measure. */}
                <span className="inline-flex flex-nowrap items-center gap-1">
                  {seg.blank.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={submitted}
                      aria-pressed={selections[seg.blank.id] === option}
                      onClick={() =>
                        setSelections((prev) => ({ ...prev, [seg.blank.id]: option }))
                      }
                      className={`whitespace-nowrap rounded-lg border-2 px-2.5 py-0.5 text-[0.94em] font-bold leading-snug transition-colors ${chipStyle(seg.blank, option)} ${submitted ? "cursor-default" : "cursor-pointer"}`}
                    >
                      {option}
                    </button>
                  ))}
                </span>
              </span>
            ),
          )}
        </div>

        {/* The gloss is scaffolding for READING the story, and it sits BELOW
            the story so that retiring it cannot move the chips above it. Once
            the story is graded the reasons are the payload, and on a 390px
            phone the four of them plus the gloss do not both fit the stage — so
            it still retires at submit rather than pushing teaching out of
            view. */}
        {!submitted ? (
          <p className="mt-3 border-t border-border-muted pt-3 text-sm leading-relaxed text-text-secondary">
            {step.meaningEn}
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

      {/* The teaching payload. Shown for EVERY blank, not just missed ones —
          a learner who guessed right still has not learned why. */}
      {submitted ? (
        <ul className="divide-y divide-border-muted overflow-hidden rounded-xl border border-border bg-surface">
          {blanks.map((b) => {
            const got = selections[b.id] === b.correctAnswer;
            return (
              <li
                key={b.id}
                className="flex items-start gap-2 px-3 py-1 text-[0.8125rem] leading-snug text-text-secondary"
              >
                <span
                  className={`mt-px shrink-0 ${got ? "text-success" : "text-error"}`}
                  aria-hidden
                >
                  <Icon name={got ? "check" : "close"} size={13} />
                </span>
                <span>
                  <strong className="font-semibold text-text-primary">{b.correctAnswer}</strong> —{" "}
                  {b.reason}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* Single bottom block (house CTA-harmony): banner + CTA together so the
          button never moves on submit. */}
      <div className="relative mt-auto flex flex-col gap-3 pt-2" data-testid="primary-cta">
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {hasSubmittedWrong && <Feedback correct={false} />}
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
