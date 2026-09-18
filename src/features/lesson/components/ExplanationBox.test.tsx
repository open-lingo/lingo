/**
 * TestFlight #191/#193 (b28, 2026-09-17): the cloze family's post-answer
 * explanation rendered as one unclamped `<p>`, and a 5-line explanation
 * stacked with a wrapped option chip pushed CHECK/CONTINUE off the stage.
 * `ExplanationBox` clamps to 3 lines with a "More" expander that opens
 * INSIDE the box at a fixed height cap — the box's own footprint (and so
 * the CTA below it) must never change between collapsed and expanded.
 *
 * happy-dom does no real layout, so `clientHeight`/`scrollHeight` are 0 by
 * default — each test below stubs them via `Object.defineProperty` to
 * simulate "3 lines fit, N lines authored" the way a real browser measures
 * it, restoring the prototype afterwards.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ExplanationBox } from "./ExplanationBox";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, def?: string) => def ?? _key,
  }),
}));

function stubGeometry(clientHeight: number, scrollHeight: number) {
  Object.defineProperty(HTMLParagraphElement.prototype, "clientHeight", {
    configurable: true,
    get: () => clientHeight,
  });
  Object.defineProperty(HTMLParagraphElement.prototype, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  });
}

afterEach(() => {
  cleanup();
  // @ts-expect-error — restoring the stub away, not re-declaring the prop
  delete HTMLParagraphElement.prototype.clientHeight;
  // @ts-expect-error — ditto
  delete HTMLParagraphElement.prototype.scrollHeight;
});

describe("ExplanationBox", () => {
  it("renders the explanation text", () => {
    stubGeometry(60, 60);
    render(<ExplanationBox>Short explanation.</ExplanationBox>);
    expect(screen.getByText("Short explanation.")).toBeInTheDocument();
  });

  it("a short explanation (fits in 3 lines) shows no More button", () => {
    stubGeometry(60, 60); // scrollHeight === clientHeight -> nothing clipped
    render(<ExplanationBox>Short explanation.</ExplanationBox>);
    expect(screen.queryByRole("button", { name: "More" })).toBeNull();
  });

  it("a long explanation (overflows 3 lines) shows a More button, collapsed by line-clamp-3", () => {
    stubGeometry(60, 140); // scrollHeight > clientHeight -> real content is taller
    render(<ExplanationBox>A long explanation that runs past three lines.</ExplanationBox>);
    const btn = screen.getByRole("button", { name: "More" });
    expect(btn).toBeInTheDocument();
    const p = screen.getByText(/A long explanation/);
    expect(p.className).toContain("line-clamp-3");
  });

  it("More opens the full text INSIDE the box, at the SAME max-height as collapsed — the box footprint never changes", () => {
    stubGeometry(60, 140);
    render(<ExplanationBox>A long explanation that runs past three lines.</ExplanationBox>);
    const p = screen.getByText(/A long explanation/);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(p.className).not.toContain("line-clamp-3");
    expect(p.className).toContain("overflow-y-auto");
    // Capped at the COLLAPSED measurement (60px here), not the full
    // scrollHeight (140px) — the box scrolls internally instead of growing.
    expect(p.style.maxHeight).toBe("60px");
    expect(screen.getByRole("button", { name: "Less" })).toBeInTheDocument();
  });

  it("Less collapses back to the 3-line clamp", () => {
    stubGeometry(60, 140);
    render(<ExplanationBox>A long explanation that runs past three lines.</ExplanationBox>);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Less" }));
    const p = screen.getByText(/A long explanation/);
    expect(p.className).toContain("line-clamp-3");
  });
});
