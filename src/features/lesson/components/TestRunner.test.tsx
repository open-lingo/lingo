/**
 * TestRunner unit tests — review-tail mechanics + skip path (Task #84).
 *
 * The real step views (MultipleChoiceStepView etc.) require i18n, TTS
 * URL resolution and Japanese annotation context that aren't trivial
 * to spin up in happy-dom. We mock them with thin stub components that
 * expose two buttons — "answer-correct" and "answer-wrong" — that the
 * test driver clicks to advance the queue.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import type {
  MultipleChoiceStep,
  RowTestStep,
} from "../types";

afterEach(() => {
  cleanup();
});

vi.mock("./steps/MultipleChoiceStepView", () => ({
  MultipleChoiceStepView: ({
    step,
    onComplete,
    onContinue,
  }: {
    step: MultipleChoiceStep;
    onComplete: (id: string, correct: boolean) => void;
    onContinue: () => void;
  }) => (
    <div data-testid={`mc-stub-${step.id}`}>
      <button
        type="button"
        onClick={() => {
          onComplete(step.id, true);
          onContinue();
        }}
      >
        answer-correct
      </button>
      <button
        type="button"
        onClick={() => {
          onComplete(step.id, false);
          onContinue();
        }}
      >
        answer-wrong
      </button>
    </div>
  ),
}));

vi.mock("./steps/MatchPairsStepView", () => ({
  MatchPairsStepView: () => <div>match-stub</div>,
}));

vi.mock("./steps/BuildSentenceStepView", () => ({
  BuildSentenceStepView: () => <div>build-stub</div>,
}));

vi.mock("@/shared/components/ui", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

// Import AFTER mocks register.
import { TestRunner } from "./TestRunner";

function makeMc(id: string): MultipleChoiceStep {
  return {
    id,
    type: "multiple_choice",
    prompt: `prompt-${id}`,
    options: [
      { id: "a", text: "a" },
      { id: "b", text: "b" },
    ],
    correctOptionId: "a",
  };
}

function makeStep(items: number): RowTestStep {
  return {
    id: "step-root",
    type: "row_test",
    rowId: "ka",
    items: Array.from({ length: items }, (_, i) => ({
      kind: "mc" as const,
      payload: makeMc(`item-${i}`),
    })),
    passThreshold: 0.7,
    maxRetries: 3,
  };
}

describe("TestRunner — review-tail mechanics", () => {
  it("does not advance the queue front position on a wrong answer (re-queues)", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    const step = makeStep(3);
    render(
      <TestRunner
        step={step}
        onComplete={onComplete}
        onContinue={onContinue}
      />,
    );
    // Initial front of queue is item-0; progress label "0/3 done".
    expect(screen.getByText("0/3 done")).toBeInTheDocument();
    expect(screen.getByTestId("mc-stub-item-0")).toBeInTheDocument();

    // Wrong answer to item-0 — should re-queue, NOT advance progress.
    fireEvent.click(screen.getByText("answer-wrong"));
    // Now item-1 is front (item-0 went to back), progress still 0/3.
    expect(screen.getByText("0/3 done")).toBeInTheDocument();
    expect(screen.getByTestId("mc-stub-item-1")).toBeInTheDocument();
  });

  it("completes only when every item has been answered correctly at least once", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    const step = makeStep(2);
    render(
      <TestRunner
        step={step}
        onComplete={onComplete}
        onContinue={onContinue}
      />,
    );
    // item-0 correct → progress 1/2, front is item-1.
    fireEvent.click(screen.getByText("answer-correct"));
    expect(screen.getByText("1/2 done")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();

    // item-1 wrong → re-queued at the back, front is item-1 again.
    fireEvent.click(screen.getByText("answer-wrong"));
    expect(screen.getByText("1/2 done")).toBeInTheDocument();
    // Queue is now [item-1], correctSet = {item-0}.

    // item-1 correct → queue empties, onComplete fires with `true`.
    fireEvent.click(screen.getByText("answer-correct"));
    expect(onComplete).toHaveBeenCalledWith("step-root", true);
    // Phase flipped to "passed" — terminal screen visible.
    expect(screen.getByText(/Row complete/)).toBeInTheDocument();
  });

  it("uncapped re-queue — same item can be missed many times before passing", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    const step = makeStep(1);
    render(
      <TestRunner
        step={step}
        onComplete={onComplete}
        onContinue={onContinue}
      />,
    );
    // Wrong N times, no failure phase.
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getByText("answer-wrong"));
      expect(screen.getByText("0/1 done")).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();
    }
    fireEvent.click(screen.getByText("answer-correct"));
    expect(onComplete).toHaveBeenCalledWith("step-root", true);
  });

  it("Skip flow: confirm modal → onComplete(stepId, false)", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    const step = makeStep(3);
    render(
      <TestRunner
        step={step}
        onComplete={onComplete}
        onContinue={onContinue}
      />,
    );
    // Header Skip button opens the confirm modal.
    fireEvent.click(screen.getByText("Skip"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // Confirm modal's Skip button → onComplete(step.id, false).
    // There are now two "Skip" buttons (header + confirm). Use role/dialog.
    const dialog = screen.getByRole("dialog");
    const skipButtons = Array.from(dialog.querySelectorAll("button"));
    const confirmSkip = skipButtons.find((b) => b.textContent === "Skip");
    expect(confirmSkip).toBeDefined();
    act(() => {
      confirmSkip!.click();
    });
    expect(onComplete).toHaveBeenCalledWith("step-root", false);
    expect(screen.getByText(/Test skipped/)).toBeInTheDocument();
  });

  it("Skip flow: cancel keeps the runner in the running phase", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    const step = makeStep(2);
    render(
      <TestRunner
        step={step}
        onComplete={onComplete}
        onContinue={onContinue}
      />,
    );
    fireEvent.click(screen.getByText("Skip"));
    fireEvent.click(screen.getByText("Keep going"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(onComplete).not.toHaveBeenCalled();
    // Still showing item-0.
    expect(screen.getByTestId("mc-stub-item-0")).toBeInTheDocument();
  });

  it("idempotent: clicking Continue button on the passed screen calls onContinue once", () => {
    const onComplete = vi.fn();
    const onContinue = vi.fn();
    const step = makeStep(1);
    render(
      <TestRunner
        step={step}
        onComplete={onComplete}
        onContinue={onContinue}
      />,
    );
    fireEvent.click(screen.getByText("answer-correct"));
    expect(onComplete).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Continue"));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
