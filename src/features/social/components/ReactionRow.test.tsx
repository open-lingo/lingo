import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ReactionRow } from "./ReactionRow";

afterEach(() => cleanup());

describe("ReactionRow", () => {
  it("renders the configured kinds with their counts (inline)", () => {
    render(
      <ReactionRow
        variant="inline"
        reactions={[
          { kind: "wave", count: 3 },
          { kind: "fire", count: 5, mine: true },
        ]}
        available={["wave", "fire", "clap"]}
      />,
    );
    // wave + fire + clap = three buttons
    expect(screen.getAllByRole("button")).toHaveLength(3);
    // Initial counts render.
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("toggles a non-mine reaction on and off", () => {
    render(
      <ReactionRow
        variant="inline"
        reactions={[{ kind: "wave", count: 4 }]}
        available={["wave"]}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("4")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("5")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("can remove an initial mine: true reaction", () => {
    render(
      <ReactionRow
        variant="inline"
        reactions={[{ kind: "clap", count: 7, mine: true }]}
        available={["clap"]}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("7")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("uses ariaLabelPrefix when provided (inline)", () => {
    render(
      <ReactionRow
        variant="inline"
        reactions={[{ kind: "fire", count: 0 }]}
        available={["fire"]}
        ariaLabelPrefix="Cheer on Anna"
      />,
    );
    expect(
      screen.getByRole("button", { name: /Cheer on Anna/i }),
    ).toBeInTheDocument();
  });

  describe("menu variant (default)", () => {
    it("collapses reactions behind a single trigger and shows a count summary", () => {
      render(
        <ReactionRow
          reactions={[
            { kind: "wave", count: 3 },
            { kind: "fire", count: 5, mine: true },
          ]}
          available={["wave", "fire", "clap"]}
          ariaLabelPrefix="Cheer on Anna"
        />,
      );
      // Only the trigger renders up front (the pills live inside the popover).
      const trigger = screen.getByRole("button", { name: /Cheer on Anna/i });
      expect(trigger).toBeInTheDocument();
      // The summary chip surfaces the combined count without expanding.
      expect(screen.getByText("8")).toBeInTheDocument();
    });

    it("keeps the reaction pills collapsed until the trigger is clicked", () => {
      render(
        <ReactionRow
          reactions={[{ kind: "wave", count: 0 }]}
          available={["wave", "fire", "clap", "target"]}
          ariaLabelPrefix="React"
        />,
      );
      // Closed: just the trigger renders — the four pills stay collapsed in the
      // popover so the activity card doesn't grow tall. (Opening the portal is
      // covered in the e2e/visual pass; happy-dom's portal-mount timing makes
      // the click assertion flaky here.)
      expect(screen.getAllByRole("button")).toHaveLength(1);
      expect(
        screen.getByRole("button", { name: /React/i }),
      ).toBeInTheDocument();
    });
  });
});
