import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Capture the modal's openWord so we can assert what a tap looks up.
const openWord = vi.fn();
vi.mock("./DictionaryModalContext", () => ({
  useDictionaryModal: () => ({ open: vi.fn(), openWord, close: vi.fn() }),
}));

// Controlled per-language dictionaries; keep the real `foldText` so ES
// case/accent folding is exercised for real.
vi.mock("@/shared/dictionary", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/dictionary")>();
  const ENTRIES: Record<string, { surface: string }[]> = {
    ja: [
      { surface: "わたし" },
      { surface: "ねこ" }, // 2-char word …
      { surface: "ね" }, // … with a 1-char decoy that must not split it.
      { surface: "です" },
    ],
    ko: [{ surface: "저는" }, { surface: "학생" }],
    es: [{ surface: "cerveza" }, { surface: "quiero" }],
  };
  return {
    ...actual,
    getDictionaryEntries: (lang: string) => ENTRIES[lang] ?? [],
  };
});

import { TappableText, __resetTappableTextCaches } from "./TappableText";

beforeEach(() => {
  openWord.mockClear();
  __resetTappableTextCaches();
});

describe("TappableText", () => {
  it("JA: makes known words tappable, leaves particles plain, taps look up the surface", () => {
    const { container } = render(
      <TappableText text="わたしはねこです" lang="ja" />,
    );

    // Known words are buttons.
    expect(screen.getByRole("button", { name: "わたし" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ねこ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "です" })).toBeInTheDocument();
    // The particle は is plain text, not a button.
    expect(screen.queryByRole("button", { name: "は" })).not.toBeInTheDocument();
    // No text was lost.
    expect(container.textContent).toBe("わたしはねこです");

    fireEvent.click(screen.getByRole("button", { name: "わたし" }));
    expect(openWord).toHaveBeenCalledWith("わたし");
  });

  it("JA longest-match: a 2-char word is not split into two 1-char matches", () => {
    render(<TappableText text="ねこ" lang="ja" />);
    // One button for ねこ, and NOT a stray ね button from the 1-char decoy.
    expect(screen.getByRole("button", { name: "ねこ" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ね" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("KO: known words tappable across a space", () => {
    render(<TappableText text="저는 학생" lang="ko" />);
    expect(screen.getByRole("button", { name: "저는" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "학생" }));
    expect(openWord).toHaveBeenCalledWith("학생");
  });

  it("ES: splits on whitespace/punctuation and fold-matches (case-insensitive → canonical surface)", () => {
    const { container } = render(
      <TappableText text="Quiero una cerveza." lang="es" />,
    );

    // "Quiero" (folded) resolves to the canonical lowercase surface for lookup,
    // while its original casing still renders.
    const quiero = screen.getByRole("button", { name: "Quiero" });
    expect(quiero).toBeInTheDocument();
    fireEvent.click(quiero);
    expect(openWord).toHaveBeenCalledWith("quiero");

    fireEvent.click(screen.getByRole("button", { name: "cerveza" }));
    expect(openWord).toHaveBeenCalledWith("cerveza");

    // Unknown word + punctuation stay plain.
    expect(screen.queryByRole("button", { name: "una" })).not.toBeInTheDocument();
    expect(container.textContent).toBe("Quiero una cerveza.");
  });

  it("renders unknown text as plain, with no buttons and no crash", () => {
    const { container } = render(<TappableText text="あいうえお" lang="ja" />);
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(container.textContent).toBe("あいうえお");
  });
});
