import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LiaisonListenStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { Icon } from "@/shared/components/Icon";
import { ExplainButton } from "../ExplainButton";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: LiaisonListenStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * Liaison Listen — mark where a French phrase links across a word boundary.
 *
 * The interaction is the point: the tappable targets are the GAPS between
 * words, not the words. Every other listening step in the app grades a whole
 * utterance, which cannot ask "did the final consonant of word 1 attach to
 * word 2" — and that question is what separates «les amis» [le.za.mi] from
 * «les héros» [le.e.ʁo], two phrases with the same spelling shape and opposite
 * behaviour.
 *
 * Visual grammar: words sit in a row as static text; between each pair is a
 * link target that reads as a connector rather than as a button, because
 * tapping it is a claim about the SOUND between two words. Selected links draw
 * an arc; after grading, missed links show in success colour and over-applied
 * ones in error colour, so the learner sees both failure directions — French
 * learners over-apply liaison as often as they miss it.
 *
 * Audio comes first and stays available: the learner must be able to replay
 * before committing, because this is a listening judgement and one pass is not
 * enough to hear a linked consonant. Listening is a GATE on Check, but only
 * while there is something to listen to — with no clip in the manifest the
 * gate lifts rather than trapping the learner in the step (`canCheck`).
 */
export function LiaisonListenStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [played, setPlayed] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  // Junctions are DERIVED from the word list, so a step cannot claim a link at
  // a position that does not exist between two real words.
  const junctionCount = Math.max(0, step.words.length - 1);
  const answer = useMemo(
    () => new Set(step.linkedJunctions.filter((j) => j >= 0 && j < junctionCount)),
    [step.linkedJunctions, junctionCount],
  );

  const allCorrect =
    picked.size === answer.size && [...answer].every((j) => picked.has(j));

  const hasAudio = !!getTtsUrl(step.audioText);
  // Listen-before-Check is a pedagogy gate, not a hard lock: if the clip is
  // missing from the manifest the play button is disabled, and gating Check on
  // `played` too would dead-end the learner in the step with no way out.
  const canCheck = played || !hasAudio;

  function play() {
    playJaAudio(step.audioText);
    setPlayed(true);
  }

  function toggle(j: number) {
    if (submitted) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(j)) next.delete(j);
      else next.add(j);
      return next;
    });
  }

  function handleSubmit() {
    if (submitted || !canCheck) return;
    setSubmitted(true);
    onComplete(step.id, allCorrect);
    if (allCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted && canCheck) handleSubmit();
    else if (submitted) onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, played, picked]);

  useLessonKeyboard({ onEnter: handleEnter });

  const hasSubmittedWrong = submitted && !allCorrect;

  /**
   * The arc drawn in a gap. DASHED means "an unclaimed gap you may tap" — the
   * same empty-slot idiom the cloze pill uses — and solid means the learner (or
   * the grader) has committed to a link there. A transparent border read as no
   * affordance at all: the gaps looked like plain word spacing.
   *
   * After grading the state tells the learner WHICH way they erred: every real
   * link goes success, an over-applied one goes error.
   */
  function arcTone(j: number): string {
    const isLinked = answer.has(j);
    const isPicked = picked.has(j);
    if (!submitted) {
      return isPicked
        ? "border-accent bg-accent/15"
        : "border-dashed border-accent/50 hover:border-accent";
    }
    if (isLinked) return "border-success bg-success/15";
    if (isPicked) return "border-error bg-error/15";
    // Correctly-silent junctions keep a faint dashed arc rather than vanishing:
    // "we graded this gap too, and nothing links here" is part of the lesson.
    return "border-dashed border-border";
  }

  // No corrected-phrase echo in the banner. After Check the phrase above IS
  // the answer key — every real link carries a success-toned arc, every
  // over-applied one an error-toned arc, and each note row names its pair — so
  // a rebuilt «Les‿amis…» line is a third copy that costs ~55px of a 557px
  // stage. The banner carries the verdict only.

  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <ExplainButton explanation={step.explanation} hasSubmittedWrong={hasSubmittedWrong} />
      {/* TOP-anchored, like `gender_sort` — NOT the `mt-auto` free-space split
          this step used to run. Splitting the void centres a short phrase, but
          the split collapses the instant the junction notes land, and the arcs
          are this step's ANSWER KEY: after Check they carry the success/error
          tones the learner is reading. Measured at 375x667, every junction
          target jumped 122.6px up the screen at the moment of grading (117.1px
          at 1280x800) — the exact reflow CLAUDE.md § "Lesson UI stability
          rules" forbids. Top-anchored it is 0.0px at both. The slack goes below
          the notes instead. */}
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {step.prompt}
      </p>

      {/* Padding is FIXED across submit, and so is the play button below it.
          Both used to shrink at Check to buy the notes room; between them they
          were the last 14px of junction-row movement once the free-space split
          was gone. Freezing them costs 16px of post-commit scroll at 375x667
          (26 -> 42, and 0 either way at 1280x800), which the sticky CTA already
          handles — the arcs holding still is worth more than 16px the learner
          scrolls while READING rather than while answering. */}
      <div className="rounded-2xl border-2 border-info/40 bg-info/5 px-4 py-4 sm:px-5 sm:py-5">
        {/* Audio is the stimulus, so it leads and stays available — same size
            before and after grading. */}
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={play}
            disabled={!hasAudio}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent-hover bg-accent text-white disabled:opacity-40 sm:h-12 sm:w-12"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={20} />
          </button>
        </div>

        {/* Words are static; the GAPS are the targets. Each word carries its
            following gap in one non-wrapping unit, so a line break can never
            orphan a junction from the pair it joins. */}
        <div className="flex flex-wrap items-end justify-center gap-y-2">
          {step.words.map((word, i) => (
            <span key={i} className="flex items-end">
              <span className="text-lg font-semibold leading-none text-text-primary sm:text-2xl">
                {word}
              </span>
              {i < junctionCount ? (
                <button
                  type="button"
                  disabled={submitted}
                  aria-pressed={picked.has(i)}
                  aria-label={t("lesson.liaison.junctionLabel", "Link {{a}} to {{b}}?", {
                    a: word,
                    b: step.words[i + 1],
                  })}
                  onClick={() => toggle(i)}
                  className={`inline-flex h-7 w-8 shrink-0 items-end justify-center ${submitted ? "cursor-default" : "cursor-pointer"}`}
                >
                  {/* The target is drawn as the undertie itself (U+203F, the IPA
                      mark for a linked juncture) rather than set as a glyph in a
                      circle: a bordered circle floating between two words reads
                      as a button about nothing, while an arc slung under the gap
                      reads as the tie between THESE two words. Borderless
                      wrapper + inner arc so the 28×32 tap target stays WCAG-size
                      without a 28px ring around the mark. */}
                  <span
                    aria-hidden
                    className={`block h-2 w-7 rounded-b-full border-2 border-t-0 transition-colors ${arcTone(i)}`}
                  />
                </button>
              ) : null}
            </span>
          ))}
        </div>

        <p className="mt-3 text-center text-sm text-text-secondary">
          &ldquo;{step.meaningEn}&rdquo;
        </p>
      </div>

      {/* Per-junction notes carry the rule. French learners over-apply liaison
          as often as they miss it, so the silent junctions are taught too. */}
      {submitted && step.junctionNotes ? (
        <ul className="divide-y divide-border-muted overflow-hidden rounded-xl border border-border bg-surface">
          {Object.entries(step.junctionNotes).map(([k, note]) => {
            const j = Number(k);
            if (!Number.isFinite(j) || j >= junctionCount) return null;
            const linked = answer.has(j);
            return (
              <li
                key={k}
                className="flex items-start gap-2 px-3 py-1 text-[0.8125rem] leading-snug text-text-secondary"
              >
                {/* Two channels, because the pair label alone cannot say which
                    junction links: the ICON is the fact (check = links, cross =
                    silent) and the TONE is the learner's call at that gap. A
                    missed link and an over-applied one both go error, which is
                    the pair of failures this step exists to separate. */}
                <span
                  className={`mt-px shrink-0 ${
                    linked === picked.has(j)
                      ? linked
                        ? "text-success"
                        : "text-text-muted"
                      : "text-error"
                  }`}
                  aria-hidden
                >
                  <Icon name={linked ? "check" : "close"} size={13} />
                </span>
                <span>
                  <strong className="font-semibold text-text-primary">
                    {step.words[j]}&nbsp;{step.words[j + 1]}
                  </strong>{" "}
                  — {note}
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
            disabled={!canCheck}
            label={
              canCheck
                ? t("lesson.check", "Check")
                : t("lesson.liaison.listenFirst", "Listen first")
            }
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>
    </div>
  );
}
