/**
 * SilentLetterStepView contract. Three of these guard fixes that are invisible
 * in source and obvious on a phone, so they regress silently:
 *   · a SPACE in `graphemes` is not a tile — it was a 36×16 tappable stub under
 *     the 24px tap floor, and an answer the learner can toggle but never needs;
 *   · the screen-reader label counts LETTERS, so «p» of «ils parlent» is letter
 *     4 and not letter 5;
 *   · an EMPTY selection is a real answer, because a word with no silent letter
 *     is a legitimate item — Check is therefore never disabled.
 * i18n + TTS are mocked (neither spins up in happy-dom), same as
 * AgreementClozeStepView.test.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { SilentLetterStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      key: string,
      def?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const template = typeof def === "string" ? def : key;
      const vars = (typeof def === "object" ? def : opts) ?? {};
      return template.replace(/\{\{(\w+)\}\}/g, (_, k: string) =>
        String(vars[k] ?? ""),
      );
    },
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => null),
}));

import { SilentLetterStepView } from "./SilentLetterStepView";

afterEach(() => {
  cleanup();
});

/** «ils parlent» — the multi-word item the space handling exists for. */
function twoWordStep(): SilentLetterStep {
  return {
    id: "sl-two-word",
    type: "silent_letter",
    graphemes: ["i", "l", "s", " ", "p", "a", "r", "l", "e", "n", "t"],
    silentIndices: [2, 8, 9, 10],
    meaningEn: "they speak",
    audioText: "ils parlent",
  };
}

/** A word with NOTHING silent — the item that stops the learner concluding
 *  every French word hides a letter. */
function noSilentStep(): SilentLetterStep {
  return {
    id: "sl-none",
    type: "silent_letter",
    graphemes: ["a", "v", "e", "c"],
    silentIndices: [],
    meaningEn: "with",
    audioText: "avec",
  };
}

const letterButtons = () =>
  screen.getAllByRole("button").filter((b) => /^Letter /.test(b.getAttribute("aria-label") ?? ""));

const tapLetter = (n: number, g: string) =>
  fireEvent.click(screen.getByRole("button", { name: `Letter ${n}: ${g}` }));

describe("SilentLetterStepView", () => {
  it("renders one tile per LETTER and none for the space", () => {
    render(
      <SilentLetterStepView step={twoWordStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const tiles = letterButtons();
    // 11 graphemes, one of which is a space.
    expect(tiles).toHaveLength(10);
    expect(tiles.map((b) => b.textContent).join("")).toBe("ilsparlent");
    for (const b of tiles) expect(b.textContent?.trim()).not.toBe("");
  });

  it("numbers letters, not graphemes, so the space does not shift the count", () => {
    render(
      <SilentLetterStepView step={twoWordStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    // «p» is graphemes[4] but the FOURTH letter.
    expect(screen.getByRole("button", { name: "Letter 4: p" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Letter 5: p" })).toBeNull();
    expect(letterButtons().at(-1)?.getAttribute("aria-label")).toBe("Letter 10: t");
  });

  it("accepts an empty selection as an answer and grades it correct when nothing is silent", () => {
    const onComplete = vi.fn();
    render(
      <SilentLetterStepView step={noSilentStep()} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    const check = screen.getByRole("button", { name: "Check" });
    // Never gated on a selection — an empty answer is a real answer.
    expect(check).not.toBeDisabled();
    fireEvent.click(check);
    expect(onComplete).toHaveBeenCalledWith("sl-none", true);
  });

  it("grades the selection as a SET — a superset of the silent letters is wrong", () => {
    const onComplete = vi.fn();
    render(
      <SilentLetterStepView step={twoWordStep()} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    for (const [n, g] of [[3, "s"], [8, "e"], [9, "n"], [10, "t"]] as const) tapLetter(n, g);
    tapLetter(1, "i"); // one letter too many
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("sl-two-word", false);
  });

  it("grades an exact match correct, and a toggle can undo a tap", () => {
    const onComplete = vi.fn();
    render(
      <SilentLetterStepView step={twoWordStep()} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    tapLetter(1, "i");
    tapLetter(1, "i"); // toggled back off
    for (const [n, g] of [[3, "s"], [8, "e"], [9, "n"], [10, "t"]] as const) tapLetter(n, g);
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("sl-two-word", true);
  });

  it("withholds the English gloss until commit — pre-commit it is a free hint", () => {
    render(
      <SilentLetterStepView step={noSilentStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    expect(screen.queryByText("with")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(screen.getByText("with")).toBeInTheDocument();
  });
});
