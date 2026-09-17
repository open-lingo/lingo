/**
 * SelfExplanationMcqStepView contract (review P2, 2026-09-17): options
 * render on the Tile primitive (`size="sentence"`, `kind="grid"`), state
 * maps correctly, and the metacognitive miss-type distinction (surface vs
 * distractor wrong-answer copy) still fires. i18n / AnnotatedText are
 * mocked, same convention as ConjugationClozeStepView.test.tsx.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { SelfExplanationMcqStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => null),
}));
vi.mock("@/shared/readingAnnotation/AnnotatedText", () => ({
  AnnotatedText: ({ text }: { text: string }) => <>{text}</>,
}));

import { SelfExplanationMcqStepView } from "./SelfExplanationMcqStepView";

afterEach(() => cleanup());

function step(overrides: Partial<SelfExplanationMcqStep> = {}): SelfExplanationMcqStep {
  return {
    id: "sem-test",
    type: "self_explanation_mcq",
    anchor: { label: "わたし＿ がくせいです" },
    question: "Why is は correct here?",
    options: [
      { id: "rule", text: "は marks the topic being introduced.", reasonType: "rule" },
      { id: "surface", text: "It just sounded right.", reasonType: "surface" },
      { id: "distractor", text: "が always follows わたし.", reasonType: "distractor" },
    ],
    correctOptionId: "rule",
    ruleExplanation: "は introduces what the sentence is about.",
    ...overrides,
  };
}

const noop = () => {};

describe("SelfExplanationMcqStepView — Tile primitive", () => {
  it("renders every option inside a grid TileTray as a sentence-size option Tile", () => {
    const s = step();
    const { container } = render(
      <SelfExplanationMcqStepView step={s} onComplete={noop} onContinue={noop} />,
    );
    const tray = container.querySelector('[data-tile-tray][data-kind="grid"]')!;
    expect(tray).toBeTruthy();
    const tiles = tray.querySelectorAll('[data-tile][data-variant="option"][data-size="sentence"]');
    expect(tiles).toHaveLength(3);
    for (const t of Array.from(tiles)) {
      expect(t.getAttribute("data-state")).toBe("idle");
    }
  });

  it("uses a 2-col equal-row (fr) grid only for exactly 4 options", () => {
    const s4 = step({
      options: [
        { id: "a", text: "A", reasonType: "rule" },
        { id: "b", text: "B", reasonType: "surface" },
        { id: "c", text: "C", reasonType: "distractor" },
        { id: "d", text: "D", reasonType: "distractor" },
      ],
      correctOptionId: "a",
    });
    const { container } = render(
      <SelfExplanationMcqStepView step={s4} onComplete={noop} onContinue={noop} />,
    );
    const tray = container.querySelector('[data-tile-tray][data-kind="grid"]')!;
    expect(tray.getAttribute("data-cols")).toBe("2");
    expect(tray.getAttribute("data-fr")).toBe("true");

    cleanup();
    const s3 = step();
    const { container: c3 } = render(
      <SelfExplanationMcqStepView step={s3} onComplete={noop} onContinue={noop} />,
    );
    const tray3 = c3.querySelector('[data-tile-tray][data-kind="grid"]')!;
    expect(tray3.getAttribute("data-cols")).toBeNull();
    expect(tray3.getAttribute("data-fr")).toBeNull();
  });

  it("maps selection → correct/wrong Tile data-state on submit", () => {
    const s = step();
    render(<SelfExplanationMcqStepView step={s} onComplete={noop} onContinue={noop} />);
    const surfaceBtn = screen.getByRole("button", { name: /It just sounded right/ });
    fireEvent.click(surfaceBtn);
    expect(surfaceBtn.getAttribute("data-state")).toBe("selected");
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(surfaceBtn.getAttribute("data-state")).toBe("wrong");
    const ruleBtn = screen.getByRole("button", { name: /marks the topic/ });
    expect(ruleBtn.getAttribute("data-state")).toBe("correct");
  });

  it("fires onComplete with the grading verdict and surfaces the surface-miss copy", () => {
    const onComplete = vi.fn();
    const s = step();
    render(<SelfExplanationMcqStepView step={s} onComplete={onComplete} onContinue={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /It just sounded right/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("sem-test", false);
    expect(
      screen.getByText(/Close — that's the surface pattern, but the rule is deeper\./),
    ).toBeTruthy();
  });

  it("options lock (disabled) after submit", () => {
    const s = step();
    render(<SelfExplanationMcqStepView step={s} onComplete={noop} onContinue={noop} />);
    fireEvent.click(screen.getByRole("button", { name: /marks the topic/ }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    const ruleBtn = screen.getByRole("button", { name: /marks the topic/ });
    expect(ruleBtn).toBeDisabled();
  });
});
