/**
 * PretestMcqStepView contract. The two load-bearing guards protect the
 * "guessing is safe" promise the step type exists for (see the type's doc
 * block — pretesting effect):
 *   · `onComplete` reports TRUE even when the guess is wrong — this is a
 *     TEACH step and a wrong guess must never reach the accuracy
 *     denominator or the combo/chime path as a miss;
 *   · a wrong pick renders in the WARNING tone, never error red — red on
 *     an un-taught word breaks the contract the eyebrow chip states.
 * i18n + TTS are mocked (neither spins up in happy-dom), same as
 * SilentLetterStepView.test.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { PretestMcqStep } from "../../types";

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

import { PretestMcqStepView } from "./PretestMcqStepView";

afterEach(() => {
  cleanup();
  playJaAudio.mockClear();
});

function gustoStep(): PretestMcqStep {
  return {
    id: "pretest-gusto",
    type: "pretest_mcq",
    situationEn: "You've just been introduced to someone. What do you say?",
    options: [
      { id: "a", text: "mucho gusto" },
      { id: "b", text: "hasta luego" },
      { id: "c", text: "por favor" },
    ],
    correctOptionId: "a",
    reveal: {
      surface: "mucho gusto",
      meaningEn: "nice to meet you",
      hint: "Literally 'much pleasure'.",
    },
  };
}

function renderStep(step = gustoStep()) {
  const onComplete = vi.fn();
  const onContinue = vi.fn();
  render(
    <PretestMcqStepView
      step={step}
      onComplete={onComplete}
      onContinue={onContinue}
    />,
  );
  return { onComplete, onContinue };
}

describe("PretestMcqStepView", () => {
  it("Check stays disabled until a guess is picked; tap previews TTS", () => {
    renderStep();
    const check = screen.getByRole("button", { name: "Check" });
    expect(check).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: /pick hasta luego/i }));
    expect(playJaAudio).toHaveBeenCalledWith("hasta luego");
    expect(check).not.toBeDisabled();
  });

  it("reports correct: TRUE on a WRONG guess — the guess is not graded", () => {
    const { onComplete } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: /pick hasta luego/i }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("pretest-gusto", true);
  });

  it("a wrong pick renders warning-toned, never error red; the answer lights accent", () => {
    renderStep();
    const wrong = screen.getByRole("button", { name: /pick hasta luego/i });
    fireEvent.click(wrong);
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(wrong.className).toContain("border-warning");
    expect(wrong.className).not.toContain("border-error");
    const answer = screen.getByRole("button", { name: /pick mucho gusto/i });
    expect(answer.className).toContain("border-accent");
  });

  it("the reveal teaches after the guess: surface, meaning, hint, and audio", () => {
    renderStep();
    fireEvent.click(screen.getByRole("button", { name: /pick por favor/i }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    // Reveal panel content (surface also appears as an option — assert the
    // meaning + hint, which exist nowhere else).
    expect(screen.getByText("nice to meet you")).toBeTruthy();
    expect(screen.getByText("Literally 'much pleasure'.")).toBeTruthy();
    // The taught surface replays on commit.
    expect(playJaAudio).toHaveBeenCalledWith("mucho gusto");
  });

  it("after the reveal, Continue advances (Got it on a missed guess)", () => {
    const { onContinue } = renderStep();
    fireEvent.click(screen.getByRole("button", { name: /pick por favor/i }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("options lock after commit — the guess cannot be revised into a 'win'", () => {
    renderStep();
    fireEvent.click(screen.getByRole("button", { name: /pick por favor/i }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    const answer = screen.getByRole("button", { name: /pick mucho gusto/i });
    expect(answer).toBeDisabled();
  });
});
