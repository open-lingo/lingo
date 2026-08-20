import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { GenderSortStep } from "../../types";
import { ContinueButton } from "../ContinueButton";
import { Feedback } from "../Feedback";
import { CelebrationToast, pickCelebrationText } from "../CelebrationToast";
import { ExplainButton } from "../ExplainButton";
import { Icon } from "@/shared/components/Icon";
import { useLessonKeyboard } from "../../hooks/useLessonKeyboard";

const CELEBRATE_MS = 1100;

type Props = {
  step: GenderSortStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

/**
 * GENDER SORT — a tray of bare nouns, two buckets labelled by the definite
 * article. Tap a noun to pick it up, tap a bucket to drop it; tap a placed
 * noun to send it back. Tap-to-place rather than drag: the lesson shell is a
 * fixed-height scroll container and a drag inside it fights the scroller on
 * touch, which is the same reason the build tray is tap-driven.
 *
 * Grading is all-or-nothing for the step's boolean — the learner either owns
 * the set or does not — but the board still marks each noun individually,
 * because "you got 6 of 8" with no idea WHICH is not a correction.
 *
 * The nouns render WITHOUT their article at every stage, including the
 * post-grading reveal. The article is the answer; printing it beside the noun
 * is the same defect as an option list that tags one option "(formal)".
 */
export function GenderSortStepView({ step, onComplete, onContinue }: Props) {
  const { t } = useTranslation();
  /** itemId -> bucketId. Absent = still in the tray. */
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  const byId = useMemo(
    () => Object.fromEntries(step.items.map((i) => [i.id, i])),
    [step.items],
  );
  const tray = step.items.filter((i) => !placed[i.id]);
  const allPlaced = tray.length === 0;
  const allCorrect = step.items.every((i) => placed[i.id] === i.bucketId);

  function place(bucketId: string) {
    if (submitted || !held) return;
    setPlaced((prev) => ({ ...prev, [held]: bucketId }));
    setHeld(null);
  }

  function liftBack(itemId: string) {
    if (submitted) return;
    setPlaced((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setHeld(null);
  }

  function handleSubmit() {
    if (!allPlaced || submitted) return;
    setSubmitted(true);
    onComplete(step.id, allCorrect);
    if (allCorrect) {
      setCelebrationText(pickCelebrationText(t));
      setCelebrating(true);
      window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    }
  }

  const handleEnter = useCallback(() => {
    if (!submitted && allPlaced) handleSubmit();
    else if (submitted) onContinue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, allPlaced, placed]);

  useLessonKeyboard({ onEnter: handleEnter });

  const hasSubmittedWrong = submitted && !allCorrect;

  function chipStyle(itemId: string): string {
    if (submitted) {
      return placed[itemId] === byId[itemId].bucketId
        ? "border-success bg-success/15 text-success"
        : "border-error bg-error/15 text-error";
    }
    return held === itemId
      ? "border-accent bg-accent/15 text-accent ring-2 ring-accent/40"
      : "border-border bg-surface text-text-primary hover:border-accent/60";
  }

  /**
   * The one-line coach. Tap-a-word-then-tap-a-bucket is not a discoverable
   * gesture — the first build of this step showed two dashed boxes and a tray
   * with nothing anywhere saying they were connected, so the board read as
   * decoration. The line names the next action in the learner's own current
   * state, and `min-h` reserves its row so switching between the two never
   * reflows the board under the finger that is mid-tap.
   */
  const coach = submitted
    ? null
    : held
      ? t("lesson.genderSort.coachHeld", "Now tap {{a}} or {{b}}", {
          a: step.buckets[0].label,
          b: step.buckets[1].label,
        })
      : allPlaced
        ? null
        : t("lesson.genderSort.coachIdle", "Tap a word, then tap its article");

  return (
    <div className="relative flex flex-1 flex-col gap-3">
      <ExplainButton
        explanation={step.explanation}
        hasSubmittedWrong={hasSubmittedWrong}
      />
      {/* TOP-anchored, like `agreement_cloze` — deliberately NOT the
          `mt-auto` free-space split `aspect_choice_cloze` uses. Splitting the
          void moves the whole board up when the meanings appear (measured 83px
          at 390x844), and the placed chips are this step's answer: they are
          what the learner looks back at to read the marks, so they must sit
          where they were left. The slack goes below the tray instead. */}
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">
        {step.prompt ??
          t("lesson.genderSort.instruction", "Sort every word into its group")}
      </p>

      {/* Two buckets. Fixed two-column grid at every width — the whole point
          is that there are exactly two classes, and a column that wraps to a
          stack on a narrow phone would hide that. */}
      <div className="grid grid-cols-2 gap-3">
        {step.buckets.map((bucket) => {
          const contents = step.items.filter((i) => placed[i.id] === bucket.id);
          return (
            <div
              key={bucket.id}
              /* Three things this class list is doing, all of them fixes:
                 - `bg-surface`, not `bg-surface-muted`: a recessed grey panel on
                   the grey stage, wearing a `disabled` drop button until a word
                   was held, read as a BROKEN control rather than an empty
                   container waiting for one. The bucket is always live-looking
                   now, and the only state change is the accent tint that says
                   "this is where the held word lands".
                 - the empty floor is sized from the CONTAINER (`cqh` against the
                   stage scroller), never `dvh` — house rule. An empty bucket
                   stops being a 104px strip on a 1280x900 stage, and it
                   pre-absorbs the growth as chips land, so the board no longer
                   lurches mid-play (56px of jump at 390x844 before, 17px after).
                 - dashed means droppable, so it goes solid at submit: after
                   grading nothing can land here and the board should read as
                   closed. */
              className={`relative flex min-h-[max(6.5rem,20cqh)] flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-colors ${
                submitted ? "border-solid" : "border-dashed"
              } ${
                held && !submitted
                  ? "border-accent bg-accent/5"
                  : "border-border bg-surface"
              }`}
            >
              {/* The drop target is a sibling of the chips, not their parent.
                  It used to be a <button> wrapping them, which is invalid
                  (interactive content inside a button) and had a real bite: a
                  tap anywhere near the middle of a filled bucket landed on a
                  placed chip and EJECTED it instead of dropping the held word.
                  Absolutely positioned behind the chips, it keeps the whole
                  panel droppable while every chip stays its own control. */}
              <button
                type="button"
                onClick={() => place(bucket.id)}
                disabled={submitted}
                aria-label={t("lesson.genderSort.bucketLabel", "Put in {{label}}", {
                  label: bucket.label,
                })}
                className={`absolute inset-0 rounded-2xl ${
                  submitted || !held ? "cursor-default" : "cursor-pointer"
                }`}
              />
              <span className="pointer-events-none relative text-lg font-black lowercase tracking-wide text-text-primary sm:text-xl">
                {bucket.label}
              </span>
              <span className="relative flex flex-wrap items-start justify-center gap-1.5">
                {contents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={submitted}
                    /* Holding a word and tapping a placed chip means "drop it
                       here" — the chip is inside the bucket the learner is
                       aiming at. Ejecting is what a tap means only when the
                       hand is empty. */
                    onClick={() => (held ? place(bucket.id) : liftBack(item.id))}
                    className={`rounded-lg border-2 px-2 py-0.5 text-base font-bold ${chipStyle(item.id)}`}
                  >
                    {item.surface}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </div>

      {/* Retires at submit with the tray it belongs to — there is nothing left
          to pick up, and its reserved row was 30px of the short-phone stage
          spent on a blank line above the teaching. */}
      {!submitted ? (
        <p
          aria-live="polite"
          className={`min-h-[1.125rem] text-center text-xs font-semibold ${
            held ? "text-accent" : "text-text-muted"
          }`}
        >
          {coach}
        </p>
      ) : null}

      {/* Tray. Reserves its height so the board does not jump as it empties —
          the same no-reflow rule the build tray follows. It RETIRES at submit:
          nothing can be picked up any more, so an empty box saying so cost 76px
          of a 485px short-phone stage and pushed the meanings out of the fold. */}
      {!submitted ? (
        <div className="flex min-h-[4.5rem] flex-wrap content-start items-start justify-center gap-2 rounded-2xl border border-border bg-surface-muted/50 p-3">
          {tray.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={held === item.id}
              onClick={() => setHeld(held === item.id ? null : item.id)}
              className={`rounded-xl border-2 px-3 py-1.5 text-lg font-bold transition-colors ${chipStyle(item.id)}`}
            >
              {item.surface}
            </button>
          ))}
          {allPlaced ? (
            <span className="self-center text-sm text-text-muted">
              {t("lesson.genderSort.trayEmpty", "Everything is placed.")}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Post-grading only: the meanings, and the rule the set was built to
          teach. Withheld pre-answer — an English gloss beside every noun turns
          a gender-recall task into a reading task.
          Set as one dense card in the `aspect_choice_cloze` reason-list idiom:
          the per-row verdict icon puts "which ones did I miss" in the same
          place as the correction, and the tighter type is what buys the whole
          list a chance of fitting a 667px-tall phone. */}
      {submitted ? (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {step.endingRule ? (
            <p className="border-b border-border-muted px-3 py-2 text-[0.8125rem] leading-snug text-text-secondary">
              {step.endingRule}
            </p>
          ) : null}
          <ul className="divide-y divide-border-muted">
            {step.items.map((item) => {
              const got = placed[item.id] === item.bucketId;
              return (
                <li
                  key={item.id}
                  className="flex items-start gap-2 px-3 py-1 text-[0.8125rem] leading-snug text-text-secondary"
                >
                  <span
                    className={`mt-px shrink-0 ${got ? "text-success" : "text-error"}`}
                    aria-hidden
                  >
                    <Icon name={got ? "check" : "close"} size={13} />
                  </span>
                  <span>
                    <strong className="font-semibold text-text-primary">
                      {step.buckets.find((b) => b.id === item.bucketId)?.label}{" "}
                      {item.surface}
                    </strong>
                    {" — "}
                    {item.meaningEn}
                    {item.note ? (
                      <span className="text-warning"> · {item.note}</span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Single bottom block (house CTA-harmony): banner + CTA together so the
          button never moves on submit. `data-testid="primary-cta"` is the
          sticky-action-bar hook (index.css § "Lesson action bar") — without it
          the post-grading meanings pushed Continue 148px below the fold at
          375x667 and 248px below on a miss. */}
      <div
        className="relative mt-auto flex flex-col gap-3 pt-3"
        data-testid="primary-cta"
      >
        {celebrating ? <CelebrationToast text={celebrationText} /> : null}
        {/* Verdict only. The corrected set is already on screen twice — every
            chip is colour-marked in its bucket and every article is spelled out
            in the list above — so a third rebuilt copy in the banner is pure
            height on the viewport that has least of it (the same call
            `aspect_choice_cloze` made). */}
        {hasSubmittedWrong ? <Feedback correct={false} /> : null}
        {!submitted ? (
          <ContinueButton
            onClick={handleSubmit}
            disabled={!allPlaced}
            label={t("lesson.check", "Check")}
          />
        ) : (
          <ContinueButton onClick={onContinue} />
        )}
      </div>
    </div>
  );
}
