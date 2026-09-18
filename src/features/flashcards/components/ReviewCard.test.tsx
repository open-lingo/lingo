/**
 * TestFlight #205 (Spencer, b30): "This isn't centered correctly and font
 * size and bolding should be done so they can see words better no?" — the
 * word/reading face was text-3xl/font-medium; bumped to text-4xl/font-bold
 * across every modality (recognition AND production), not just the one
 * screenshot. The ruby centering half of #205 is a separate, deliberate
 * WebKit anti-word-pry tradeoff (`KanjiRuby`/`.kanji-ruby[data-fit]`,
 * TestFlight #36/#62) not touched here — see the code comment in
 * ReviewCard.tsx.
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { ReviewCard } from "./ReviewCard";
import type { Flashcard } from "@/features/flashcards/data/types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string, d?: string) => (typeof d === "string" ? d : k) }),
}));
vi.mock("@/features/flashcards/engine/srsStorage", () => ({
  getCardState: () => ({ recognition: { interval: 0 }, production: { interval: 0 } }),
}));
vi.mock("@/features/flashcards/engine/srs", () => ({
  isMastered: () => false,
}));

afterEach(() => cleanup());

const card: Flashcard = {
  id: "ja:hataraku",
  front: "働く",
  back: "to work",
  reading: { surface: "働く", kana: "はたらく" },
  posLabel: "verb",
  type: "word",
};

describe("ReviewCard word face sizing (#205)", () => {
  it("renders the word face at text-4xl/font-bold, for recognition", () => {
    const { container } = render(
      <ReviewCard
        card={card}
        flipped={false}
        onFlip={() => {}}
        testedModality="recognition"
        particles={null}
        highlightMode={false}
        fitted={false}
      />,
    );
    const p = container.querySelector("p")!;
    expect(p.className).toContain("text-4xl");
    expect(p.className).toContain("font-bold");
    expect(p.className).not.toContain("text-3xl");
    expect(p.className).not.toContain("font-medium");
  });

  it("renders the same size/weight for production too (sibling parity)", () => {
    const { container } = render(
      <ReviewCard
        card={card}
        flipped
        onFlip={() => {}}
        testedModality="production"
        particles={null}
        highlightMode={false}
        fitted={false}
      />,
    );
    const p = container.querySelector("p")!;
    expect(p.className).toContain("text-4xl");
    expect(p.className).toContain("font-bold");
  });
});
