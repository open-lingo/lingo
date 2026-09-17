/**
 * SymbolToSoundStepView contract (review P3, 2026-09-17 — this view had no
 * prior test file). Load-bearing guards:
 *   · options render on the Tile primitive (`reveal` size — "one uniform
 *     mid size whatever the text length", the tier built for exactly this
 *     shape), inside a `[data-tile-tray][data-kind="grid"]`;
 *   · every shipped producer (ja/ko `_consonantRowHelpers`, `m1-l1`,
 *     `m1-sa`, `_hangulRowHelpers`, `m1-vowels`) emits exactly 4 options,
 *     so the 2×2 grid is the only reachable shape — grepped 2026-09-17;
 *   · tap-to-preview plays the OPTION's own clip, not the prompt's;
 *   · state mapping follows MultipleChoiceStepView's convention.
 * i18n + TTS + alphabet-audio are mocked, same pattern as the sibling
 * SymbolRecognitionStepView.test.tsx.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { SymbolToSoundStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => (typeof def === "string" ? def : key),
  }),
}));
const { getTtsUrl } = vi.hoisted(() => ({
  getTtsUrl: vi.fn((): string | null => "/tts/fake.mp3"),
}));
vi.mock("@/shared/tts", () => ({ getTtsUrl }));
vi.mock("@/shared/audio/alphabetAudio", () => ({
  getAlphabetAudioUrl: (k: string) => `/audio/${k}.mp3`,
}));
const { playLocalAudio } = vi.hoisted(() => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio }));

import { SymbolToSoundStepView } from "./SymbolToSoundStepView";

afterEach(() => {
  cleanup();
  playLocalAudio.mockClear();
});

function makeStep(overrides: Partial<SymbolToSoundStep> = {}): SymbolToSoundStep {
  return {
    id: "sts-test",
    type: "symbol_to_sound",
    payload: {
      symbol: "あ",
      romanization: "a",
      ipa: "a",
      hint: "",
      scriptId: "hiragana",
    },
    options: [
      { id: "correct", text: "a", symbol: "あ" },
      { id: "opt-1", text: "i", symbol: "い" },
      { id: "opt-2", text: "u", symbol: "う" },
      { id: "opt-3", text: "e", symbol: "え" },
    ],
    correctOptionId: "correct",
    ...overrides,
  };
}

function renderStep(step: SymbolToSoundStep = makeStep()) {
  const onComplete = vi.fn();
  const onContinue = vi.fn();
  render(<SymbolToSoundStepView step={step} onComplete={onComplete} onContinue={onContinue} />);
  return { onComplete, onContinue };
}

const opt = (text: string) => screen.getByRole("button", { name: `Hear ${text}` });

describe("SymbolToSoundStepView", () => {
  it("renders all 4 options as Tiles inside a grid tile tray", () => {
    renderStep();
    const tray = document.querySelector('[data-tile-tray][data-kind="grid"]');
    expect(tray).not.toBeNull();
    for (const text of ["a", "i", "u", "e"]) {
      const el = opt(text);
      expect(el.hasAttribute("data-tile")).toBe(true);
      expect(el.getAttribute("data-variant")).toBe("option");
      expect(el.getAttribute("data-size")).toBe("reveal");
      expect(tray!.contains(el)).toBe(true);
    }
  });

  it("previews the tapped option's own clip, not the prompt's", () => {
    renderStep();
    fireEvent.click(opt("i"));
    expect(playLocalAudio).toHaveBeenCalledWith("/tts/fake.mp3");
  });

  it("Check stays disabled until an option is picked", () => {
    renderStep();
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
    fireEvent.click(opt("a"));
    expect(screen.getByRole("button", { name: "Check" })).not.toBeDisabled();
  });

  it("marks a pre-submit pick as `selected`, not `correct`", () => {
    renderStep();
    fireEvent.click(opt("a"));
    expect(opt("a").getAttribute("data-state")).toBe("selected");
  });

  it("grades correct and marks the answer tile `correct` after Check", () => {
    const { onComplete } = renderStep();
    fireEvent.click(opt("a"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("sts-test", true);
    expect(opt("a").getAttribute("data-state")).toBe("correct");
  });

  it("grades wrong, marks the pick `wrong`, and disables every option", () => {
    const { onComplete } = renderStep();
    fireEvent.click(opt("i"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("sts-test", false);
    expect(opt("i").getAttribute("data-state")).toBe("wrong");
    expect(opt("a").getAttribute("data-state")).toBe("correct");
    for (const text of ["a", "i", "u", "e"]) {
      expect(opt(text)).toBeDisabled();
    }
  });
});
