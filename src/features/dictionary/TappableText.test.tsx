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

// はなみ / さくら are deliberately absent from the mocked JA dictionary above,
// so anything tappable here can only have come from `extraSurfaces`.
describe("TappableText — story affordances", () => {
  it("routes taps to onWordTap when provided, not the dictionary", () => {
    const onWordTap = vi.fn();
    render(
      <TappableText
        text="はなみ"
        lang="ja"
        extraSurfaces={["はなみ"]}
        onWordTap={onWordTap}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "はなみ" }));
    expect(onWordTap).toHaveBeenCalledWith("はなみ");
    expect(openWord).not.toHaveBeenCalled();
  });

  it("falls back to the dictionary modal when no handler is given", () => {
    render(<TappableText text="はなみ" lang="ja" extraSurfaces={["はなみ"]} />);
    fireEvent.click(screen.getByRole("button", { name: "はなみ" }));
    expect(openWord).toHaveBeenCalledWith("はなみ");
  });

  it("makes extraSurfaces tappable even though the dictionary lacks them", () => {
    render(<TappableText text="はなみ" lang="ja" extraSurfaces={["はなみ"]} />);
    expect(screen.getByRole("button", { name: "はなみ" })).toBeInTheDocument();
  });

  it("adds the highlight class on top of the base word class, never replacing it", () => {
    render(
      <TappableText
        text="はなみとさくら"
        lang="ja"
        extraSurfaces={["はなみ", "さくら"]}
        highlightSurfaces={new Set(["はなみ"])}
      />,
    );
    const hanami = screen.getByRole("button", { name: "はなみ" });
    const sakura = screen.getByRole("button", { name: "さくら" });

    // Highlighted word carries the highlight decoration …
    expect(hanami.className).toContain("decoration-accent/60");
    expect(hanami.className).toContain("underline-offset-4");
    // … on TOP of the base affordance, which is still fully present.
    expect(hanami.className).toContain("decoration-dotted");
    expect(hanami.className).toContain("underline-offset-[3px]");

    // Non-highlighted word keeps only the base affordance.
    expect(sakura.className).not.toContain("decoration-accent/60");
    expect(sakura.className).toContain("decoration-dotted");
  });

  // Regression guard: both module-scope memo caches are keyed by language only
  // in the original implementation, so the FIRST story rendered for a language
  // would poison every later story that declares different extra surfaces.
  it("keys its memo caches by extraSurfaces, not language alone", () => {
    const first = render(
      <TappableText text="はなみさくら" lang="ja" extraSurfaces={["はなみ"]} />,
    );
    expect(screen.getByRole("button", { name: "はなみ" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "さくら" }),
    ).not.toBeInTheDocument();
    first.unmount();

    // Same language, same text, DIFFERENT extras — and deliberately no cache
    // reset, to prove the second render is not served the first one's tokens.
    render(
      <TappableText text="はなみさくら" lang="ja" extraSurfaces={["さくら"]} />,
    );
    expect(screen.getByRole("button", { name: "さくら" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "はなみ" }),
    ).not.toBeInTheDocument();
  });

  it("keys its memo caches by extraSurfaces (control: caches cleared between renders)", () => {
    const first = render(
      <TappableText text="はなみさくら" lang="ja" extraSurfaces={["はなみ"]} />,
    );
    expect(screen.getByRole("button", { name: "はなみ" })).toBeInTheDocument();
    first.unmount();

    __resetTappableTextCaches();

    render(
      <TappableText text="はなみさくら" lang="ja" extraSurfaces={["さくら"]} />,
    );
    expect(screen.getByRole("button", { name: "さくら" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "はなみ" }),
    ).not.toBeInTheDocument();
  });

  it("re-tokenizes when extraSurfaces changes identity but not content", () => {
    const { rerender } = render(
      <TappableText text="はなみさくら" lang="ja" extraSurfaces={["はなみ"]} />,
    );
    // New array, same contents — must not thrash, and must stay correct.
    rerender(
      <TappableText text="はなみさくら" lang="ja" extraSurfaces={["はなみ"]} />,
    );
    expect(screen.getByRole("button", { name: "はなみ" })).toBeInTheDocument();

    // New contents — must re-tokenize.
    rerender(
      <TappableText text="はなみさくら" lang="ja" extraSurfaces={["さくら"]} />,
    );
    expect(screen.getByRole("button", { name: "さくら" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "はなみ" }),
    ).not.toBeInTheDocument();
  });
});
