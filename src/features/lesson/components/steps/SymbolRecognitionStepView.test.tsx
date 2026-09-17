/**
 * SymbolRecognitionStepView contract (review P3, 2026-09-17 — this view had
 * no prior test file). Load-bearing guards:
 *   · the 2×2 symbol grid renders on the Tile primitive (`word-glyph`
 *     size, matching `KanjiReadingStepView`'s "symbol-style tiles"
 *     precedent), inside an `options-row`-family `[data-tile-tray]`;
 *   · state mapping follows `MultipleChoiceStepView`'s convention: idle →
 *     selected (pre-submit, lighter tint) → correct/wrong (post-submit),
 *     and an unpicked non-answer option stays `idle` rather than dimming;
 *   · grading + disabled-after-submit are unchanged by the migration.
 * i18n + TTS + alphabet-audio are mocked, same pattern as
 * StressPatternStepView.test.tsx / TapTheWordStepView.test.tsx.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { SymbolRecognitionStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => (typeof def === "string" ? def : key),
  }),
}));
const { playJaAudio, getTtsUrl, useAutoPlayJaAudio } = vi.hoisted(() => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn((): string | null => null),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/tts", () => ({ playJaAudio, getTtsUrl, useAutoPlayJaAudio }));
vi.mock("@/shared/audio/alphabetAudio", () => ({
  autoPlayAlphabetAudio: vi.fn(),
  getAlphabetAudioUrl: (k: string) => `/audio/${k}.mp3`,
}));
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));

import { SymbolRecognitionStepView } from "./SymbolRecognitionStepView";

afterEach(() => {
  cleanup();
  playJaAudio.mockClear();
});

function makeStep(overrides: Partial<SymbolRecognitionStep> = {}): SymbolRecognitionStep {
  return {
    id: "sr-test",
    type: "symbol_recognition",
    payload: {
      symbol: "あ",
      romanization: "a",
      ipa: "a",
      hint: "",
      scriptId: "hiragana",
    },
    options: [
      { id: "a", symbol: "あ" },
      { id: "i", symbol: "い" },
      { id: "u", symbol: "う" },
      { id: "e", symbol: "え" },
    ],
    correctOptionId: "a",
    ...overrides,
  };
}

function renderStep(step: SymbolRecognitionStep = makeStep()) {
  const onComplete = vi.fn();
  const onContinue = vi.fn();
  render(<SymbolRecognitionStepView step={step} onComplete={onComplete} onContinue={onContinue} />);
  return { onComplete, onContinue };
}

const opt = (symbol: string) => screen.getByRole("button", { name: `Hear ${symbol}` });

describe("SymbolRecognitionStepView", () => {
  it("renders every option as a Tile inside a tile tray", () => {
    renderStep();
    const tray = document.querySelector("[data-tile-tray]");
    expect(tray).not.toBeNull();
    for (const symbol of ["あ", "い", "う", "え"]) {
      const el = opt(symbol);
      expect(el.hasAttribute("data-tile")).toBe(true);
      expect(el.getAttribute("data-variant")).toBe("option");
      expect(el.getAttribute("data-size")).toBe("word-glyph");
      expect(tray!.contains(el)).toBe(true);
    }
  });

  it("Check stays disabled until an option is picked", () => {
    renderStep();
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
    fireEvent.click(opt("い"));
    expect(screen.getByRole("button", { name: "Check" })).not.toBeDisabled();
  });

  it("marks a pre-submit pick as `selected`, not `correct`", () => {
    renderStep();
    fireEvent.click(opt("あ"));
    expect(opt("あ").getAttribute("data-state")).toBe("selected");
  });

  it("grades correct and marks the answer tile `correct` after Check", () => {
    const { onComplete } = renderStep();
    fireEvent.click(opt("あ"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("sr-test", true);
    expect(opt("あ").getAttribute("data-state")).toBe("correct");
  });

  it("grades wrong, marks the pick `wrong`, and disables every option", () => {
    const { onComplete } = renderStep();
    fireEvent.click(opt("い"));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("sr-test", false);
    expect(opt("い").getAttribute("data-state")).toBe("wrong");
    // The correct (unpicked) answer still surfaces as `correct`.
    expect(opt("あ").getAttribute("data-state")).toBe("correct");
    for (const symbol of ["あ", "い", "う", "え"]) {
      expect(opt(symbol)).toBeDisabled();
    }
  });

  it("plays the tapped kana's own audio on selection when a clip exists", () => {
    getTtsUrl.mockReturnValue("/tts/a.mp3");
    renderStep();
    fireEvent.click(opt("あ"));
    expect(playJaAudio).toHaveBeenCalledWith("あ");
  });
});
