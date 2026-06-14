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
    // No incremental progress reported yet.
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByTestId("mc-stub-item-0")).toBeInTheDocument();

    // Wrong answer to item-0 — should re-queue, NOT advance progress.
    fireEvent.click(screen.getByText("answer-wrong"));
    // Now item-1 is front (item-0 went to back); no progress reported.
    expect(onComplete).not.toHaveBeenCalled();
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
    // Incremental tick reported for the weighted top bar; verdict still
    // pending (boolean true is provisional, last-write-wins).
    expect(onComplete).toHaveBeenCalledWith("step-root", true, 1);

    // item-1 wrong → re-queued at the back, front is item-1 again.
    fireEvent.click(screen.getByText("answer-wrong"));
    // Queue is now [item-1], correctSet = {item-0}.

    // item-1 correct → queue empties, onComplete fires with `true`.
    fireEvent.click(screen.getByText("answer-correct"));
    expect(onComplete).toHaveBeenLastCalledWith("step-root", true, 2);
    // Phase flipped to "passed" — terminal screen visible.
    expect(screen.getByText(/Row complete/)).toBeInTheDocument();
  });

  it("3-strike fail: 3 wrong answers ends the test with onComplete(false)", () => {
    // 2026-05-17 (Spencer): replaced the uncapped re-queue model. Tests
    // now end after 3 total mistakes regardless of which items missed.
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
    fireEvent.click(screen.getByText("answer-wrong"));
    fireEvent.click(screen.getByText("answer-wrong"));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("answer-wrong"));
    expect(onComplete).toHaveBeenCalledWith("step-root", false);
    expect(screen.getByText("Out of attempts")).toBeInTheDocument();
  });

  it("passes with up to 2 mistakes if the item is eventually answered right", () => {
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
    fireEvent.click(screen.getByText("answer-wrong"));
    fireEvent.click(screen.getByText("answer-wrong"));
    fireEvent.click(screen.getByText("answer-correct"));
    expect(onComplete).toHaveBeenLastCalledWith("step-root", true, 1);
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
