import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

import { LeaguesModal } from "./LeaguesModal";
import { LEAGUE_TIERS, LEAGUE_TIER_TOTAL } from "../data/leagueTiers";

afterEach(() => cleanup());

describe("LeaguesModal", () => {
  it("returns null when closed", () => {
    const { container } = render(
      <LeaguesModal open={false} onClose={() => {}} currentTierIndex={4} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders every tier in the ladder", () => {
    render(
      <LeaguesModal open onClose={() => {}} currentTierIndex={null} />,
    );
    // Sanity: one row per tier in our static ladder.
    const rows = screen.getAllByTestId(/leagues-modal-row-/);
    expect(rows).toHaveLength(LEAGUE_TIER_TOTAL);
    // Each tier's name renders.
    for (const tier of LEAGUE_TIERS) {
      expect(screen.getByText(tier.name)).toBeInTheDocument();
    }
  });

  it("highlights the current tier with a pill", () => {
    render(<LeaguesModal open onClose={() => {}} currentTierIndex={4} />);
    // The current row has data-current="true" + an accent ring class.
    const currentRow = screen.getByTestId("leagues-modal-row-4");
    expect(currentRow).toHaveAttribute("data-current", "true");
    expect(currentRow.className).toMatch(/ring-accent/);
    // The pill should be present exactly once.
    expect(screen.getByText(/you're here/i)).toBeInTheDocument();
    // Other rows must NOT have data-current.
    const otherRow = screen.getByTestId("leagues-modal-row-2");
    expect(otherRow).not.toHaveAttribute("data-current");
  });

  it("does not highlight any tier when currentTierIndex is null", () => {
    render(<LeaguesModal open onClose={() => {}} currentTierIndex={null} />);
    expect(screen.queryByText(/you're here/i)).toBeNull();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(<LeaguesModal open onClose={onClose} currentTierIndex={0} />);
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when ESC is pressed", () => {
    const onClose = vi.fn();
    render(<LeaguesModal open onClose={onClose} currentTierIndex={0} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("renders the highest tier at the top of the list", () => {
    render(<LeaguesModal open onClose={() => {}} currentTierIndex={0} />);
    const rows = screen.getAllByTestId(/leagues-modal-row-/);
    // First row is the highest-index tier.
    expect(rows[0]).toHaveAttribute(
      "data-testid",
      `leagues-modal-row-${LEAGUE_TIER_TOTAL - 1}`,
    );
    // Last row is the lowest-index tier.
    expect(rows[rows.length - 1]).toHaveAttribute(
      "data-testid",
      "leagues-modal-row-0",
    );
  });
});
