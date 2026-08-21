/**
 * TapTheWordStepView contract. The load-bearing guards:
 *   · single-target steps are a RADIO — a second tap MOVES the selection
 *     (stacking would make the commit guaranteed-wrong on a mis-tap);
 *   · grading is SET EQUALITY — on a tap-two step, finding one of two is
 *     wrong, and the missed target renders as a dashed outline, distinct
 *     from the learner's own picks;
 *   · unlike pretest_mcq this step reports honest correctness — it is
 *     graded retrieval.
 * i18n + TTS are mocked (neither spins up in happy-dom), same as
 * PretestMcqStepView.test.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { TapTheWordStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => (typeof def === "string" ? def : key),
  }),
}));
const { playJaAudio, getTtsUrl } = vi.hoisted(() => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn((): string | null => "/tts/fake.mp3"),
}));
vi.mock("@/shared/tts", () => ({ playJaAudio, getTtsUrl }));

import { TapTheWordStepView } from "./TapTheWordStepView";

afterEach(() => {
  cleanup();
  playJaAudio.mockClear();
});

function cognateStep(): TapTheWordStep {
  return {
    id: "tap-cognate",
    type: "tap_the_word",
    prompt: "Tap the word that means 'intelligent'.",
    tokens: ["mi", "esposa", "es", "muy", "inteligente"],
    correctIndices: [4],
    meaningEn: "My wife is very intelligent.",
    audioText: "mi esposa es muy inteligente",
    revealNote: "«inteligente» is a cognate.",
  };
}

function tapTwoStep(): TapTheWordStep {
  return {
    id: "tap-two",
    type: "tap_the_word",
    prompt: "Two of these words English already gave you — tap both.",
    tokens: ["tengo", "una", "familia", "muy", "grande"],
    correctIndices: [2, 4],
    audioText: "tengo una familia muy grande",
  };
}

function renderStep(step: TapTheWordStep) {
  const onComplete = vi.fn();
  const onContinue = vi.fn();
  render(
    <TapTheWordStepView
      step={step}
      onComplete={onComplete}
      onContinue={onContinue}
    />,
  );
  return { onComplete, onContinue };
}

const chip = (word: string) =>
  screen.getByRole("button", { name: `Tap ${word}` });

describe("TapTheWordStepView", () => {
  it("Check stays disabled until something is tapped", () => {
    renderStep(cognateStep());
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
    fireEvent.click(chip("inteligente"));
    expect(screen.getByRole("button", { name: "Check" })).not.toBeDisabled();
  });

  it("single-target steps behave like a radio — a second tap moves the pick", () => {
    const { onComplete } = renderStep(cognateStep());
    fireEvent.click(chip("esposa"));
    fireEvent.click(chip("inteligente"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    // If taps stacked, the selection {esposa, inteligente} would grade wrong.
    expect(onComplete).toHaveBeenCalledWith("tap-cognate", true);
  });

  it("reports honest incorrectness — this is graded retrieval", () => {
    const { onComplete } = renderStep(cognateStep());
    fireEvent.click(chip("esposa"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("tap-cognate", false);
  });

  it("multi-target grading is set equality; the missed target shows dashed", () => {
    const { onComplete } = renderStep(tapTwoStep());
    // States the arity so the learner never guesses HOW MANY.
    expect(screen.getByText("Tap 2 words")).toBeTruthy();
    fireEvent.click(chip("familia"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("tap-two", false);
    expect(chip("grande").className).toContain("border-dashed");
    expect(chip("familia").className).toContain("border-accent");
  });

  it("a wrong pick renders error-toned after commit", () => {
    renderStep(cognateStep());
    fireEvent.click(chip("muy"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(chip("muy").className).toContain("border-error");
  });

  it("the reveal note lands after commit and Continue advances", () => {
    const { onContinue } = renderStep(cognateStep());
    expect(screen.queryByText("«inteligente» is a cognate.")).toBeNull();
    fireEvent.click(chip("inteligente"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("«inteligente» is a cognate.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("autoplays the sentence once when a clip exists", () => {
    renderStep(cognateStep());
    expect(playJaAudio).toHaveBeenCalledWith("mi esposa es muy inteligente");
  });
});
