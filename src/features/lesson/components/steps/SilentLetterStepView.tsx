import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SilentLetterStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { ExplainButton } from "../ExplainButton";
import { Icon } from "@/shared/components/Icon";
import { playJaAudio, getTtsUrl } from "@/shared/tts";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: SilentLetterStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * SILENT LETTER — tap every grapheme that is not pronounced.
 *
 * MULTI-select, and the count is deliberately never shown pre-commit: "how
 * many letters are silent" is half the question, and a control that reserved
 * three slots would answer it. That is also why Check is enabled from the
 * start rather than gated on a selection — an empty selection is a real
 * answer, because a word with no silent letter is a legitimate item.
 *
 * LAYOUT CONTRACT (CLAUDE.md § "Lesson UI stability rules"): the word row sits
 * at a fixed y through the whole step — the audio button and card padding do
 * not change size on submit — and every revealed block lands BELOW it, under a
 * CTA carrying the sticky `primary-cta` hook.
 */
export function SilentLetterStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const hasAudio = !!getTtsUrl(step.audioText);
  const silent = new Set(step.silentIndices);

  /**
   * The graphemes, grouped into WORDS. A `graphemes` array may contain the
   * spaces of a multi-word item («ils parlent»), and two things follow from
   * that which a flat row got wrong:
   *   · a space is not a letter. Rendered as a tile it was a tappable 36×16
   *     stub — under the 24px tap-target floor, misaligned against 48px
   *     letters, and an answer the learner can toggle but never needs.
   *   · a flat wrap breaks mid-word ("parl" / "ent"), which is the one thing
   *     this step must never do: the row is supposed to read as the WORD.
   * Grouping makes the space the break opportunity and keeps the rounded
   * end-caps on the ends of each word rather than on the ends of the array.
   */
  const groups = useMemo(() => {
    const out: { key: string; indices: number[] }[] = [];
    let word: number[] = [];
    for (let i = 0; i < step.graphemes.length; i++) {
      if (step.graphemes[i].trim() === "") {
        if (word.length) out.push({ key: `w${i}`, indices: word });
        word = [];
        out.push({ key: `s${i}`, indices: [] });
      } else {
        word.push(i);
      }
    }
    if (word.length) out.push({ key: "w-last", indices: word });
    return out;
  }, [step.graphemes]);

  // Position among LETTERS, for the screen-reader label — counting the spaces
  // would announce «p» of «ils parlent» as "letter 5" when it is the fourth.
  const letterNo = useMemo(() => {
    const map: Record<number, number> = {};
    let n = 0;
    step.graphemes.forEach((g, i) => {
      if (g.trim() !== "") map[i] = ++n;
    });
    return map;
  }, [step.graphemes]);
  const correct =
    picked.size === silent.size && [...picked].every((i) => silent.has(i));

  function toggle(i: number) {
    if (submitted) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    onComplete(step.id, correct);
    if (correct) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted) handleSubmit();
    else onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, picked]);

  useLessonKeyboard({ onEnter: handleEnter });

  /**
   * Post-commit each grapheme carries its own verdict, because "you got it
   * wrong" on a six-letter word with no indication of WHICH letter is not a
   * correction. Four states: correctly marked silent, missed, wrongly marked,
   * correctly left alone.
   */
  function graphemeStyle(i: number): string {
    if (!submitted) {
      return picked.has(i)
        ? "border-accent bg-accent/15 text-accent line-through decoration-2"
        : "border-border bg-surface text-text-primary hover:border-accent/60";
    }
    const isSilent = silent.has(i);
    const wasPicked = picked.has(i);
    if (isSilent && wasPicked) {
      return "border-success bg-success/15 text-success line-through decoration-2";
    }
    if (isSilent && !wasPicked) {
      // Missed: still shown struck through, because the struck-through form IS
      // the correct answer and the learner needs to see it, but in the error
      // tone so it reads as "this one, and you did not have it".
      return "border-error bg-error/15 text-error line-through decoration-2";
    }
    if (!isSilent && wasPicked) return "border-error bg-error/10 text-error";
    return "border-border bg-surface text-text-muted opacity-60";
  }

  const hasSubmittedWrong = submitted && !correct;
  const hasNotes = !!(step.ruleNote || step.contrast);

  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {step.prompt ??
          t(
            "lesson.silentLetter.instruction",
            "Tap every letter you do NOT hear",
          )}
      </p>

      <div className="rounded-2xl border-2 border-info/40 bg-info/5 px-4 py-4 sm:px-5 sm:py-5">
        {/* On demand, not on mount: the word is on screen from the start, so
            the audio is a reference the learner consults rather than the
            stimulus they answer from. That is the opposite of stress_pattern,
            where the spelling is hidden and the audio IS the question.
            Rendered disabled when no clip exists, like liaison_listen. */}
        <div className="mb-4 flex justify-center">
          <button
            type="button"
            onClick={() => playJaAudio(step.audioText)}
            disabled={!hasAudio}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-accent-hover bg-accent text-white disabled:opacity-40 sm:h-12 sm:w-12"
            aria-label={t("lesson.play", "Play audio")}
          >
            <Icon name="play" size={20} />
          </button>
        </div>

        {/* Graphemes sit flush against each other — no gap — so the row still
            reads as ONE WORD. Separated tiles turn «beaucoup» into eight
            objects and the learner stops seeing the word they are meant to be
            reading. The border does the segmentation instead. Word GROUPS are
            the only place the row may wrap (see `groups` above). */}
        <div className="flex flex-wrap items-stretch justify-center gap-y-2">
          {groups.map((grp) =>
            grp.indices.length === 0 ? (
              // The space between words: a break opportunity and a visual gap,
              // never a target.
              <span key={grp.key} aria-hidden className="w-2.5 sm:w-3.5" />
            ) : (
              <span key={grp.key} className="flex max-w-full flex-wrap">
                {grp.indices.map((i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={submitted}
                    aria-pressed={picked.has(i)}
                    aria-label={t(
                      "lesson.silentLetter.graphemeLabel",
                      "Letter {{n}}: {{grapheme}}",
                      { n: letterNo[i], grapheme: step.graphemes[i] },
                    )}
                    onClick={() => toggle(i)}
                    lang="fr"
                    /* Tighter on a phone so a long item («ils parlent», 10
                       letters) stays on ONE line at 375px — a wrapped word row
                       costs 56px of a scroller that has none, and reads as two
                       words. 1.75rem is still above the 24px tap floor. */
                    className={`-ml-px min-w-[1.75rem] border-2 px-1 py-1.5 text-xl font-bold transition-colors first:ml-0 first:rounded-l-xl last:rounded-r-xl sm:min-w-[2.25rem] sm:px-1.5 sm:text-3xl ${graphemeStyle(i)} ${submitted ? "cursor-default" : "cursor-pointer"}`}
                  >
                    {step.graphemes[i]}
                  </button>
                ))}
              </span>
            ),
          )}
        </div>

        {/* The meaning lands only after commit. Pre-commit an English gloss is
            a free hint on a step whose whole content is the written form — and
            on a pair like «petit»/«petite» the gloss is close to the answer. */}
        {submitted ? (
          <p className="mt-3 text-center text-sm text-text-secondary">
            {step.meaningEn}
          </p>
        ) : null}
      </div>

      {/* Rule + contrast in ONE block below the card, the slot liaison_listen
          uses for its junction notes — which is what keeps the card itself a
          fixed height across submit. */}
      {submitted && hasNotes ? (
        <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface px-3 py-2">
          {step.ruleNote ? (
            <p className="text-[0.8125rem] leading-snug text-text-secondary">
              {step.ruleNote}
            </p>
          ) : null}
          {/* The partner form is what the silence was DOING. Without it the
              learner memorises one word instead of learning the alternation. */}
          {step.contrast ? (
            <p
              className={`text-[0.8125rem] leading-snug text-text-muted ${
                step.ruleNote ? "mt-0.5 border-t border-border-muted pt-1" : ""
              }`}
            >
              <span lang="fr" className="font-bold text-text-primary">
                {step.contrast.writtenForm}
              </span>
              {" — "}
              {step.contrast.meaningEn}
              {step.contrast.note ? (
                <span className="text-warning"> · {step.contrast.note}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        className="relative mt-auto flex flex-col gap-3 pt-2"
        data-testid="primary-cta"
      >
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {/* Verdict only. Every grapheme already carries its own verdict tone
            above, so a rebuilt answer string in the banner is a third copy —
            the same call gender_sort and liaison_listen make. */}
        {hasSubmittedWrong ? <Feedback correct={false} /> : null}
        {!submitted ? (
          // Never disabled: an empty selection is a real answer, because a
          // word with no silent letter is a legitimate item and the learner
          // must be able to say so.
          <ContinueButton
            onClick={handleSubmit}
            label={t("lesson.check", "Check")}
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>
    </div>
  );
}
