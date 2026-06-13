/**
 * TestRunner — runtime queue manager for a `RowTestStep`. Renders one item
 * at a time via the existing step renderers.
 *
 * Mechanics (3-strike model, 2026-05-17 Spencer revision):
 *   - Wrong answer: append the missed item to the back of the queue AND
 *     tick the mistake counter. Progress label unchanged.
 *   - Fail: 3 total mistakes → test ends, emits `onComplete(stepId, false)`.
 *     "Out of attempts" screen + Continue.
 *   - Pass: queue empty (every unique item answered correctly at least
 *     once) AND mistakes < MAX.
 *   - Skip: via the in-header Skip button + confirm modal. Fires
 *     `onComplete(stepId, false)`.
 *
 * Mistake indicator: 3 dots in the header alongside the progress label.
 * Same visual idiom as MatchPairsStepView — solid accent when available,
 * outlined when spent.
 */
const MAX_TEST_MISTAKES = 3;
import { useMemo, useState, useCallback, useRef } from "react";
import type { RowTestStep, RowTestItem } from "../types";
import { Button } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { reportGradedAnswer } from "../juice";
import { Confetti } from "./Confetti";
import { playSfx } from "@/shared/audio/sfx";
import { MultipleChoiceStepView } from "./steps/MultipleChoiceStepView";
import { MatchPairsStepView } from "./steps/MatchPairsStepView";
import { BuildSentenceStepView } from "./steps/BuildSentenceStepView";

type Props = {
  step: RowTestStep;
  /**
   * Called once when the test ends (queue empty OR skipped). `correct` is
   * `true` for a clean completion and `false` for skipped — mirroring the
   * pass/fail signature StepRenderer already expects.
   */
  onComplete: (stepId: string, correct: boolean, progressTicks?: number) => void;
  onContinue: () => void;
};

type ItemState = {
  /** Original index into step.items — stable identity through requeues. */
  origIdx: number;
  item: RowTestItem;
  /** Number of times this item has been re-queued. Used only for ids /
   *  diagnostics; the queue is uncapped under the review-tail model. */
  retries: number;
};

type TestPhase = "running" | "passed" | "failed" | "skipped";

export function TestRunner({ step, onComplete, onContinue }: Props) {
  // Initial queue: each unique item once.
  const initialQueue: ItemState[] = useMemo(
    () =>
      step.items.map((item, origIdx) => ({
        origIdx,
        item,
        retries: 0,
      })),
    [step.items],
  );

  const [queue, setQueue] = useState<ItemState[]>(initialQueue);
  /** Items the learner has eventually answered correctly. Stable progress
   *  count — only first-correct advances it. */
  const [correctSet, setCorrectSet] = useState<Set<number>>(() => new Set());
  const [mistakes, setMistakes] = useState(0);
  const [phase, setPhase] = useState<TestPhase>("running");
  const [confirmSkip, setConfirmSkip] = useState(false);
  /** Force-remount step views per attempt so re-queued items reset state. */
  const [attemptKey, setAttemptKey] = useState(0);

  const total = step.items.length;
  const correct = correctSet.size;

  const handleItemComplete = useCallback(
    (stepId: string, isCorrect: boolean) => {
      // No-op — we wait for explicit Continue before requeueing or
      // advancing. The view shows feedback in place until the learner
      // presses Continue.
      void stepId;
      void isCorrect;
    },
    [],
  );

  /**
   * Called by the inner step view's Continue handler. Advances the queue,
   * scoring the item and re-queueing on a miss (uncapped — review-tail).
   * On the final correct answer, finishes the test.
   *
   * Side effects (onComplete, phase transition) are intentionally NOT
   * inside the setState updater so React 19 strict-mode double-invoke
   * doesn't fire onComplete twice. We read the latest queue via state
   * and recompute outside.
   */
  const handleItemContinue = useCallback(
    (isCorrect: boolean) => {
      if (queue.length === 0) return;
      const [current, ...rest] = queue;
      // Per-item juice: each item is its own combo/chime event (unique
      // key per attempt so retries chime again). The step-level report
      // in LessonPage is suppressed for row tests to avoid doubling.
      reportGradedAnswer(
        `${step.id}#${current.origIdx}r${current.retries}`,
        isCorrect,
      );
      if (isCorrect) {
        const newCount = correctSet.has(current.origIdx)
          ? correctSet.size
          : correctSet.size + 1;
        setCorrectSet((prev) => {
          if (prev.has(current.origIdx)) return prev;
          const next = new Set(prev);
          next.add(current.origIdx);
          return next;
        });
        setQueue(rest);
        setAttemptKey((k) => k + 1);
        if (rest.length === 0) {
          setPhase("passed");
          playSfx("complete");
          onComplete(step.id, true, newCount);
        } else {
          // Incremental tick — feeds the weighted top progress bar
          // (row_test weight = item count). Final verdict still lands
          // with the pass/fail call; last-write-wins on the boolean.
          onComplete(step.id, true, newCount);
        }
        return;
      }
      // Wrong: tick the mistake counter, re-queue to the back. Fail out
      // when total mistakes hit MAX_TEST_MISTAKES.
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      if (nextMistakes >= MAX_TEST_MISTAKES) {
        setPhase("failed");
        onComplete(step.id, false);
        return;
      }
      setQueue([
        ...rest,
        { ...current, retries: current.retries + 1 },
      ]);
      setAttemptKey((k) => k + 1);
    },
    [queue, mistakes, correctSet, onComplete, step.id],
  );

  const skip = useCallback(() => {
    setPhase("skipped");
    onComplete(step.id, false);
  }, [onComplete, step.id]);

  if (phase === "passed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-12">
        {/* Row tests are the module's climactic beats — full fanfare
            (ordinary perfect lessons already get confetti; the harder
            milestone shouldn't celebrate less). */}
        <Confetti />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
          <Icon name="check" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Row complete!</h2>
        <p className="text-sm text-text-muted">
          {correct}/{total} answered correctly · no items left
        </p>
        <Button variant="primary-3d" onClick={onContinue}>
          Continue
        </Button>
      </div>
    );
  }

  if (phase === "skipped") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-12">
        <div className="text-text-muted" aria-hidden>
          <Icon name="skipForward" size={48} />
        </div>
        <h2 className="text-xl font-bold text-text-primary">Test skipped</h2>
        <p className="text-sm text-text-muted">
          You can come back any time — tap the row's test slot to earn the
          mastery ★.
        </p>
        <Button variant="primary-3d" onClick={onContinue}>
          Continue
        </Button>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-12">
        <div className="text-error" aria-hidden>
          <Icon name="heartCrack" size={48} />
        </div>
        <h2 className="text-2xl font-bold text-text-primary">Out of attempts</h2>
        <p className="max-w-sm text-center text-sm text-text-muted">
          {correct}/{total} answered correctly before missing 3. Come back
          when the row feels solid — the ★ is still up for grabs.
        </p>
        <Button variant="primary-3d" onClick={onContinue}>
          Continue
        </Button>
      </div>
    );
  }

  // Running: render the front-of-queue item.
  const current = queue[0];

  return (
    <div className="flex flex-1 flex-col gap-3">
      {/* Slim header: progress lives in the top lesson bar now (weighted
          per item) — only test-level info remains: attempts left + Skip. */}
      <div className="flex items-center justify-end gap-3 text-xs uppercase tracking-wider text-text-muted">
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1.5"
            aria-label={`${MAX_TEST_MISTAKES - mistakes} attempts left`}
          >
            {Array.from({ length: MAX_TEST_MISTAKES }, (_, i) => {
              const spent = i < mistakes;
              return (
                <span
                  key={i}
                  className={`block h-2.5 w-2.5 rounded-full border transition-colors duration-200 ${
                    spent
                      ? "border-border bg-transparent"
                      : "border-accent bg-accent"
                  }`}
                  aria-hidden
                />
              );
            })}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setConfirmSkip(true)}
          className="rounded-full border border-border px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-secondary transition hover:border-accent"
        >
          Skip
        </button>
      </div>
      <TestItemView
        key={`${current.origIdx}-${attemptKey}`}
        item={current.item}
        onComplete={handleItemComplete}
        onContinue={(wasCorrect) => handleItemContinue(wasCorrect)}
      />
      {confirmSkip ? (
        <SkipConfirm
          onCancel={() => setConfirmSkip(false)}
          onConfirm={() => {
            setConfirmSkip(false);
            skip();
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Thin adapter that dispatches a `RowTestItem` to the right step view and
 * tracks whether the most recent answer was correct so the outer Continue
 * handler knows whether to re-queue.
 */
function TestItemView({
  item,
  onComplete,
  onContinue,
}: {
  item: RowTestItem;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: (wasCorrect: boolean) => void;
}) {
  // Ref (not state) so the value read by `handleContinue` always reflects
  // the most recent answer — the inner step views may call Submit and
  // Continue in the same tick, before a state update re-renders.
  const lastCorrectRef = useRef<boolean | null>(null);
  const handleComplete = (stepId: string, isCorrect: boolean) => {
    lastCorrectRef.current = isCorrect;
    onComplete(stepId, isCorrect);
  };
  const handleContinue = () => {
    onContinue(lastCorrectRef.current ?? false);
  };
  if (item.kind === "mc") {
    return (
      <MultipleChoiceStepView
        step={item.payload}
        onComplete={handleComplete}
        onContinue={handleContinue}
      />
    );
  }
  if (item.kind === "match") {
    return (
      <MatchPairsStepView
        hideMistakeDots
        step={item.payload}
        onComplete={handleComplete}
        onContinue={handleContinue}
      />
    );
  }
  return (
    <BuildSentenceStepView
      step={item.payload}
      onComplete={handleComplete}
      onContinue={handleContinue}
    />
  );
}

function SkipConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-text-primary">
          Skip the row test?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          You won't lose progress on the sub-lessons, but you won't earn
          the row's mastery ★ until you complete the test.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted"
          >
            Keep going
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary hover:border-accent"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
