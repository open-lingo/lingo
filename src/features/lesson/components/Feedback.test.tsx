import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

/**
 * On a WIN the explanation is optional reading (Spencer 2026-08-20: "just
 * say correct and have a 'view explanation' button"); on a MISS the why
 * stays inline — that's the moment the learner actually needs it.
 */
describe("Feedback explanation disclosure", () => {
  it("collapses the explanation behind 'View explanation' on a correct answer", () => {
    render(<Feedback correct explanation="gracias means thank you" />);
    const banner = screen.getByRole("alert");
    expect(banner).not.toHaveTextContent("gracias means thank you");
    fireEvent.click(screen.getByRole("button", { name: "View explanation" }));
    expect(banner).toHaveTextContent("gracias means thank you");
  });

  it("keeps the explanation inline on a miss", () => {
    render(<Feedback correct={false} explanation="the why, right away" />);
    expect(screen.getByRole("alert")).toHaveTextContent("the why, right away");
    expect(screen.queryByRole("button", { name: "View explanation" })).toBeNull();
  });
});
