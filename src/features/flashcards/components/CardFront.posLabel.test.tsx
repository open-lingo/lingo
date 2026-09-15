import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CardFront } from "./CardFront";

vi.mock("@/features/flashcards/engine/srsStorage", () => ({
  getCardState: () => ({ recognition: { interval: 0 }, production: { interval: 0 } }),
}));
vi.mock("@/features/flashcards/engine/srs", () => ({
  isMastered: () => false,
}));

describe("CardFront", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the posLabel badge when provided", () => {
    const { container } = render(
      <CardFront text="高い" posLabel="い-adj" />,
    );
    const badge = container.querySelector('[data-testid="card-pos-label"]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("い-adj");
  });

  it("does not render a badge when posLabel is absent", () => {
    const { container } = render(<CardFront text="これ" />);
    const badge = container.querySelector('[data-testid="card-pos-label"]');
    expect(badge).toBeNull();
  });

  it("renders the text correctly with posLabel present", () => {
    const { container } = render(
      <CardFront text="静か" posLabel="な-adj" />,
    );
    expect(container.textContent).toBe("な-adj静か");
  });
});
