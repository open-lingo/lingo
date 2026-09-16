/**
 * TestFlight #165 (founder, build 20 — "maybe audio play button sits on the
 * left of the sentence as a two-word-tall thing allowing sentence wrap for
 * space"). Pins the shared primitive's contract: a left `shrink-0` button
 * sized off the caller's own font-size/line-height (floored at the 44px tap
 * target), and a `min-w-0` content column so long/wrapping text (ruby,
 * furigana) never pushes the button off its own row.
 */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ListenPromptHeader } from "./ListenPromptHeader";

afterEach(() => cleanup());

describe("ListenPromptHeader", () => {
  it("sizes the button from calc(2 * fontRem * lineHeight), floored at 44px", () => {
    render(
      <ListenPromptHeader onPlay={() => {}} fontRem={1.2} lineHeight={1.25}>
        <p>sentence</p>
      </ListenPromptHeader>,
    );
    const btn = screen.getByRole("button", { name: "Play audio" });
    expect(btn.className).toContain("h-[var(--lph-btn)]");
    expect(btn.className).toContain("w-[var(--lph-btn)]");
    expect(btn.className).toContain("shrink-0");
    const row = btn.parentElement as HTMLElement;
    expect(row.style.getPropertyValue("--lph-btn")).toBe(
      "max(44px, calc(1.2rem * 1.25 * 2))",
    );
  });

  it("floors the same way for a smaller prompt font (listening_build tier)", () => {
    render(
      <ListenPromptHeader onPlay={() => {}} fontRem={1.125} lineHeight={1.375}>
        <p>Build what you hear.</p>
      </ListenPromptHeader>,
    );
    const btn = screen.getByRole("button", { name: "Play audio" });
    const row = btn.parentElement as HTMLElement;
    expect(row.style.getPropertyValue("--lph-btn")).toBe(
      "max(44px, calc(1.125rem * 1.375 * 2))",
    );
  });

  it("wraps children in a min-w-0 column so the button never gets pushed to fixed content width", () => {
    render(
      <ListenPromptHeader onPlay={() => {}} fontRem={1.2} lineHeight={1.25}>
        <p>long wrapping sentence content</p>
      </ListenPromptHeader>,
    );
    const content = screen.getByText("long wrapping sentence content").parentElement;
    expect(content?.className).toContain("min-w-0");
  });

  it("fires onPlay when the button is tapped", () => {
    let played = 0;
    render(
      <ListenPromptHeader onPlay={() => played++} fontRem={1.2} lineHeight={1.25}>
        <p>sentence</p>
      </ListenPromptHeader>,
    );
    screen.getByRole("button", { name: "Play audio" }).click();
    expect(played).toBe(1);
  });
});
