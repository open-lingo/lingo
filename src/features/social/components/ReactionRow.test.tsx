import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ReactionRow } from "./ReactionRow";

afterEach(() => cleanup());

describe("ReactionRow", () => {
  it("renders the configured kinds with their counts", () => {
    render(
      <ReactionRow
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

  it("uses ariaLabelPrefix when provided", () => {
    render(
      <ReactionRow
        reactions={[{ kind: "fire", count: 0 }]}
        available={["fire"]}
        ariaLabelPrefix="Cheer on Anna"
      />,
    );
    expect(
      screen.getByRole("button", { name: /Cheer on Anna/i }),
    ).toBeInTheDocument();
  });
});
