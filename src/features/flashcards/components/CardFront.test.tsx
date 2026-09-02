import { describe, it, expect, afterEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { CardFront } from "./CardFront";

const mastered = vi.hoisted(() => ({ value: false }));
vi.mock("@/features/flashcards/engine/srsStorage", () => ({
  getCardState: () => ({ recognition: { interval: 0 }, production: { interval: 0 } }),
}));
vi.mock("@/features/flashcards/engine/srs", () => ({
  isMastered: () => mastered.value,
}));

describe("CardFront", () => {
  afterEach(() => {
    cleanup();
    mastered.value = false;
  });

  it("renders plain text when there is no reading", () => {
    const { container } = render(<CardFront text="これ" />);
    expect(container.querySelector("ruby")).toBeNull();
    expect(container.textContent).toBe("これ");
  });

  it("renders okurigana-aligned ruby with visible furigana for an unmastered card", () => {
    const { container } = render(
      <CardFront text="飲む" reading={{ surface: "飲む", kana: "のむ" }} cardId="ja:nomu" face="prompt" />,
    );
    const rt = container.querySelector("rt.kana-helper")!;
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("の");
    expect(container.querySelector("ruby")!.textContent).toContain("飲");
    expect(container.textContent).not.toContain("(");
  });

  it("hides the furigana on the prompt face once the card is mastered", () => {
    mastered.value = true;
    const { container } = render(
      <CardFront text="学校" reading={{ surface: "学校", kana: "がっこう" }} cardId="ja:gakkou" face="prompt" />,
    );
    expect(container.querySelector("rt.kana-helper")!.getAttribute("data-visible")).toBe("false");
  });

  it("always shows the furigana on the answer face", () => {
    mastered.value = true;
    const { container } = render(
      <CardFront text="学校" reading={{ surface: "学校", kana: "がっこう" }} cardId="ja:gakkou" face="answer" />,
    );
    expect(container.querySelector("rt.kana-helper")!.getAttribute("data-visible")).toBe("true");
  });
});
