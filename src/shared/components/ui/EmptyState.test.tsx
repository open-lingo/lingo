import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("renders description and action when provided", () => {
    render(
      <EmptyState
        title="Empty deck"
        description="Add a card to get started."
        action={<button>New card</button>}
      />,
    );
    expect(screen.getByText("Add a card to get started.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New card" })).toBeInTheDocument();
  });
});
