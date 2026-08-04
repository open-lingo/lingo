import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const openWord = vi.fn();
vi.mock("./DictionaryModalContext", () => ({
  useDictionaryModal: () => ({ open: vi.fn(), openWord, close: vi.fn() }),
}));

// Deliberately NOT mocking `@/shared/dictionary` — the whole point is that the
// REAL surface set decides where word boundaries fall.
import { TappableText, __resetTappableTextCaches } from "./TappableText";

beforeEach(() => {
  openWord.mockClear();
  __resetTappableTextCaches();
});

/**
 * Korean has no spaces inside an eojeol, so `TappableText` tokenizes by greedy
 * longest match over dictionary surfaces. A taught surface the dictionary lacks
 * is therefore not merely unanswerable — it is SHREDDED, and each piece answers
 * with a word the sentence does not contain.
 */
describe("TappableText over the taught lexicon", () => {
  it("keeps 나요 whole in 열이 나요 instead of splitting it into 나 + 요", () => {
    render(<TappableText text="열이 나요" lang="ko" />);
    expect(screen.getByRole("button", { name: "나요" })).toBeInTheDocument();
    // 나 alone is "I" — the wrong answer the split used to produce.
    expect(screen.queryByRole("button", { name: "나" })).not.toBeInTheDocument();
    // The fever half of the sentence is unaffected.
    expect(screen.getByRole("button", { name: "열" })).toBeInTheDocument();
  });

  it("keeps other taught conjugations whole", () => {
    const { container } = render(
      <TappableText text="괜찮을 거예요" lang="ko" />,
    );
    expect(screen.getByRole("button", { name: "괜찮을" })).toBeInTheDocument();
    expect(container.textContent).toBe("괜찮을 거예요");
  });

  it("keeps a long explanatory ending whole", () => {
    render(<TappableText text="길이 막혔거든요" lang="ko" />);
    expect(screen.getByRole("button", { name: "막혔거든요" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "길이" })).toBeInTheDocument();
  });
});
