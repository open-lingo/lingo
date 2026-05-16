/**
 * TestRunner — runtime queue manager for a `RowTestStep`. Renders one item
 * at a time via the existing step renderers; on a miss, the item is
 * appended to the back of the queue (up to `maxRetries` times) so the
 * learner re-encounters it until they get it right.
 *
 * Termination conditions:
 *   1. queue empty AND correctSeen / totalSeen >= passThreshold → pass
 *   2. queue empty AND below threshold → retry whole test or skip
 *   3. user clicks "Skip test" → confirm modal → end
 *
 * Score model: each unique item contributes 1 to `totalSeen` the first
 * time we score it. Re-tries do NOT increment `totalSeen` again — that
 * would game the threshold downward. They DO update `correctSeen` once
 * the item is eventually answered correctly.
 */
import { useMemo, useState, useCallback } from "react";
import type { RowTestStep, RowTestItem } from "../types";
import { MultipleChoiceStepView } from "./steps/MultipleChoiceStepView";
import { MatchPairsStepView } from "./steps/MatchPairsStepView";
import { BuildSentenceStepView } from "./steps/BuildSentenceStepView";

type Props = {
  step: RowTestStep;
  onComplete: (stepId: string, correct: boolean) => void;
  onContinue: () => void;
};

type ItemState = {
  /** Original index into step.items — stable identity through requeues. */
  origIdx: number;
  item: RowTestItem;
  /** Number of times this item has been re-queued. */
  retries: number;
  /** True once the learner has gotten it right at least once. */
  passed: boolean;
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
        passed: false,
      })),
    [step.items],
  );

  const [queue, setQueue] = useState<ItemState[]>(initialQueue);
  /** Items the learner has seen at least once. Used for threshold math. */
  const [seenSet, setSeenSet] = useState<Set<number>>(() => new Set());
  /** Items the learner has eventually gotten right. */
  const [correctSet, setCorrectSet] = useState<Set<number>>(() => new Set());
  const [phase, setPhase] = useState<TestPhase>("running");
  const [confirmSkip, setConfirmSkip] = useState(false);
  /** Force-remount step views per attempt so re-queued items reset state. */
  const [attemptKey, setAttemptKey] = useState(0);

  const total = step.items.length;
  const correct = correctSet.size;
  const seen = seenSet.size;
  const remaining = queue.length;

  const handleItemComplete = useCallback(
    (stepId: string, isCorrect: boolean) => {
      // Defensive — re-entries during transitions shouldn't crash.
      if (queue.length === 0) return;
      // No-op — we wait for explicit Continue before requeueing or advancing.
      // The view shows feedback in place until the learner presses Continue.
      void stepId;
      void isCorrect;
    },
    [queue.length],
  );

  /**
   * Called by the inner step view's Continue handler. Advances the queue,
   * scoring the item and re-queueing on a miss (up to maxRetries).
   */
  const handleItemContinue = useCallback(
    (isCorrect: boolean) => {
      if (queue.length === 0) return;
      const [current, ...rest] = queue;
      const newSeen = new Set(seenSet);
      const newCorrect = new Set(correctSet);
      newSeen.add(current.origIdx);
      let nextQueue = rest;
      if (isCorrect) {
        newCorrect.add(current.origIdx);
      } else if (current.retries < step.maxRetries) {
        // Re-queue to the back.
        nextQueue = [
          ...rest,
          { ...current, retries: current.retries + 1, passed: false },
        ];
      }
      setSeenSet(newSeen);
      setCorrectSet(newCorrect);
      setQueue(nextQueue);
      setAttemptKey((k) => k + 1);

      // End-of-queue check.
      if (nextQueue.length === 0) {
        const passed = newCorrect.size / Math.max(1, newSeen.size) >= step.passThreshold;
        setPhase(passed ? "passed" : "failed");
        // Mark the encompassing step complete so the LessonPage flow can
        // award XP / mark progress. The lesson-engine treats `row_test` as
        // a single step; the inner queue is internal.
        onComplete(step.id, passed);
      }
    },
    [queue, seenSet, correctSet, step.maxRetries, step.passThreshold, step.id, onComplete],
  );

  const restart = useCallback(() => {
    setQueue(initialQueue);
    setSeenSet(new Set());
    setCorrectSet(new Set());
    setPhase("running");
    setAttemptKey((k) => k + 1);
  }, [initialQueue]);

  const skip = useCallback(() => {
    setPhase("skipped");
    onComplete(step.id, false);
  }, [onComplete, step.id]);

  if (phase === "passed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-12">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-text-primary">Row passed!</h2>
        <p className="text-sm text-text-muted">
          {correct}/{seen} correct ·{" "}
          {Math.round((correct / Math.max(1, seen)) * 100)}%
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-xl border border-accent-hover bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition hover:-translate-y-px"
        >
          Continue
        </button>
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-12">
        <div className="text-5xl">📝</div>
        <h2 className="text-2xl font-bold text-text-primary">
          Almost — let's run it again
        </h2>
        <p className="text-sm text-text-muted">
          {correct}/{seen} correct ·{" "}
          {Math.round((correct / Math.max(1, seen)) * 100)}% · need{" "}
          {Math.round(step.passThreshold * 100)}%
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={restart}
            className="rounded-xl border border-accent bg-accent-muted px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent transition hover:-translate-y-px"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-text-secondary transition hover:border-accent"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  if (phase === "skipped") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 py-12">
        <div className="text-5xl">⏭️</div>
        <h2 className="text-xl font-bold text-text-primary">Test skipped</h2>
        <p className="text-sm text-text-muted">
          You can come back to it any time — tap the test node again.
        </p>
        <button
          type="button"
          onClick={onContinue}
          className="rounded-xl border border-accent-hover bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_3px_0_0_var(--color-accent-hover)] transition hover:-translate-y-px"
        >
          Continue
        </button>
      </div>
    );
  }

  // Running: render the front-of-queue item.
  const current = queue[0];
  const progressLabel = `${correct}/${total} correct · ${remaining} left`;

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center justify-between text-xs uppercase tracking-wider text-text-muted">
        <span className="font-semibold">Row test</span>
        <span>{progressLabel}</span>
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
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const handleComplete = (stepId: string, isCorrect: boolean) => {
    setLastCorrect(isCorrect);
    onComplete(stepId, isCorrect);
  };
  const handleContinue = () => {
    onContinue(lastCorrect ?? false);
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
          You won't lose progress on the sub-lessons. You can return any time
          by tapping the test node.
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
