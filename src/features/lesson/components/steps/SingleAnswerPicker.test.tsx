/**
 * Single-answer build/listening pickers render as MCQ-shaped option
 * buttons, not a tray+bank (Spencer QA 2026-07-16, ja-m28-review-2: a
 * one-slot tile build "is a bad lesson type, it can be replaced with mcq
 * ... at the very least it just looks tacky"). Pins:
 *   - correctOrder.length === 1 (word granularity) → no tray, no dashed
 *     placeholder text, N tappable option buttons; correct pick grades
 *     correct, wrong pick grades wrong.
 *   - Multi-tile builds are completely unaffected (still tray + bank).
 *   - listening_build gets the same treatment when it emits a
 *     single-answer correctOrder.
 */
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => "tts-url"),
  hasTtsAudio: vi.fn(() => true),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: false } },
    updateSetting: vi.fn(),
  }),
}));

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import { ListeningBuildStepView } from "./ListeningBuildStepView";
import { build } from "@/features/languages/ja/grammarHelpers";
import type { ListeningBuildStep } from "../../types";

const noop = () => {};

/** Kana glyphs may render inside ruby/rt wrappers with zero-width-space
 *  placeholders, so match on stripped textContent rather than getByText. */
function findOptionButton(container: HTMLElement, kana: string): HTMLElement {
  const options = Array.from(container.querySelectorAll("button")).filter(
    (b) => b.hasAttribute("aria-pressed"),
  );
  const match = options.find(
    (b) => b.textContent?.replace(/​/g, "") === kana,
  );
  if (!match) throw new Error(`no option button found for "${kana}"`);
  return match;
}

describe("BuildSentenceStepView — single-answer word picker", () => {
  const step = build(
    "test-single-1",
    'Pick the word for "this"',
    "これ",
    ["これ", "あい", "いいえ"],
    ["これ"],
  );

  it("renders option buttons, no tray, no dashed placeholder", () => {
    const { container, queryByText } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    // No empty-tray placeholder text from the old tray+bank shape.
    expect(queryByText("Tap the right tile to answer")).toBeNull();
    expect(queryByText("Tap tiles to build the sentence")).toBeNull();
    // No dashed tray/pill container.
    expect(container.querySelector(".border-dashed")).toBeNull();
    // Every bank tile renders as a standalone tappable option (one row of
    // buttons, not a tray + a separate bank row below it).
    const buttons = container.querySelectorAll("button");
    // 3 options (tiles.length); no other clickable buttons pre-submit
    // besides the Check CTA — filter those with aria-pressed which only
    // the option buttons carry.
    const options = Array.from(buttons).filter((b) =>
      b.hasAttribute("aria-pressed"),
    );
    expect(options).toHaveLength(3);
  });

  it("selecting the correct option grades correct", () => {
    const onComplete = vi.fn();
    const { container, getByText } = render(
      <BuildSentenceStepView step={step} onComplete={onComplete} onContinue={noop} />,
    );
    fireEvent.click(findOptionButton(container, "これ"));
    fireEvent.click(getByText("Check"));
    expect(onComplete).toHaveBeenCalledWith("test-single-1", true);
  });

  it("selecting a wrong option grades wrong", () => {
    const onComplete = vi.fn();
    const { container, getByText } = render(
      <BuildSentenceStepView step={step} onComplete={onComplete} onContinue={noop} />,
    );
    fireEvent.click(findOptionButton(container, "あい"));
    fireEvent.click(getByText("Check"));
    expect(onComplete).toHaveBeenCalledWith("test-single-1", false);
  });
});

describe("BuildSentenceStepView — multi-tile build unaffected", () => {
  const step = build(
    "test-multi-1",
    "Say: I drink coffee.",
    "コーヒーを のみます",
    ["コーヒー", "を", "のみます"],
    ["コーヒー", "を", "のみます"],
  );

  it("still renders the tray + bank shape", () => {
    const { getByText } = render(
      <BuildSentenceStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(getByText("Tap tiles to build the sentence")).toBeTruthy();
  });
});

describe("ListeningBuildStepView — single-answer picker", () => {
  const step: ListeningBuildStep = {
    id: "test-lb-single-1",
    type: "listening_build",
    audioKey: "これ",
    prompt: "Build what you hear",
    targetSentence: "これ",
    tiles: ["これ", "あい", "いいえ"],
    correctOrder: ["これ"],
    granularity: "word",
  };

  it("renders option buttons, no tray placeholder", () => {
    const { container, queryByText } = render(
      <ListeningBuildStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(queryByText("Tap tiles to build what you hear")).toBeNull();
    const options = Array.from(container.querySelectorAll("button")).filter(
      (b) => b.hasAttribute("aria-pressed"),
    );
    expect(options).toHaveLength(3);
  });

  it("selecting the correct option grades correct", () => {
    const onComplete = vi.fn();
    const { container, getByText } = render(
      <ListeningBuildStepView step={step} onComplete={onComplete} onContinue={noop} />,
    );
    fireEvent.click(findOptionButton(container, "これ"));
    fireEvent.click(getByText("Check"));
    expect(onComplete).toHaveBeenCalledWith("test-lb-single-1", true);
  });

  it("selecting a wrong option grades wrong", () => {
    const onComplete = vi.fn();
    const { container, getByText } = render(
      <ListeningBuildStepView step={step} onComplete={onComplete} onContinue={noop} />,
    );
    fireEvent.click(findOptionButton(container, "いいえ"));
    fireEvent.click(getByText("Check"));
    expect(onComplete).toHaveBeenCalledWith("test-lb-single-1", false);
  });
});
