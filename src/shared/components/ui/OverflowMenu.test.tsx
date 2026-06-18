import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { OverflowMenu } from "./OverflowMenu";

/**
 * OverflowMenu wraps the portal-based Popover/DropdownMenu. The rendered menu
 * panel is portalled and positioned from layout geometry that happy-dom does
 * not provide, so (matching the FriendsSection convention) we assert the
 * trigger contract here and leave panel-content interaction to the e2e/visual
 * pass.
 */
describe("OverflowMenu", () => {
  it("renders a labelled 3-dot trigger that is closed by default", () => {
    render(
      <OverflowMenu
        ariaLabel="More actions for Ada"
        items={[{ key: "view", label: "View profile", onSelect: vi.fn() }]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "More actions for Ada" });
    expect(trigger).toHaveAttribute("aria-haspopup");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Items are not in the document until the menu opens.
    expect(screen.queryByText("View profile")).toBeNull();
  });

  it("toggles aria-expanded when the trigger is clicked", () => {
    render(
      <OverflowMenu
        ariaLabel="More"
        items={[{ key: "msg", label: "Message", onSelect: vi.fn() }]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "More" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("renders a horizontal (kebab) trigger when orientation='horizontal'", () => {
    const { container } = render(
      <OverflowMenu
        orientation="horizontal"
        ariaLabel="More"
        items={[{ key: "a", label: "A", onSelect: vi.fn() }]}
      />,
    );
    // lucide renders the icon name into the svg class.
    expect(container.querySelector("svg.lucide-ellipsis")).not.toBeNull();
  });
});
