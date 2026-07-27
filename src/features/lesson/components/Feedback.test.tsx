import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Feedback } from "./Feedback";

/**
 * The register pair ("Both work — plain X, polite Y") is NOT a correction:
 * both renderings are fully right until module 20, so it must not borrow the
 * amber `flagged` palette, which exists to say "correct, but you slipped".
 */
describe("Feedback note tone", () => {
  it("renders an informational note in the SUCCESS palette, not amber", () => {
    render(<Feedback correct note="Both work — plain いる, polite います" />);
    const banner = screen.getByRole("alert");
    expect(banner.className).toContain("border-success");
    expect(banner.className).not.toContain("border-warning");
    expect(banner).toHaveTextContent("Both work");
    expect(banner).toHaveTextContent("Correct!");
  });

  it("still uses amber for a genuine flagged nudge", () => {
    render(<Feedback correct flagged flaggedNote="Watch the accents: años" />);
    const banner = screen.getByRole("alert");
    expect(banner.className).toContain("border-warning");
    expect(banner).toHaveTextContent("Watch the accents");
  });

  it("suppresses the note on a wrong answer", () => {
    render(<Feedback correct={false} note="Both work" />);
    expect(screen.getByRole("alert")).not.toHaveTextContent("Both work");
  });

  it("lets a real flag win over the note when both are passed", () => {
    render(
      <Feedback correct flagged flaggedNote="Watch the accents" note="Both work" />,
    );
    const banner = screen.getByRole("alert");
    expect(banner.className).toContain("border-warning");
    expect(banner).toHaveTextContent("Watch the accents");
    expect(banner).not.toHaveTextContent("Both work");
  });
});
