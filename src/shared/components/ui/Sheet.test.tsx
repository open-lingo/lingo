import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sheet } from "./Sheet";

describe("Sheet", () => {
  it("renders body and title when open", () => {
    render(
      <Sheet open onClose={() => {}} title="Drawer">
        <p>Drawer body</p>
      </Sheet>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Drawer")).toBeInTheDocument();
    expect(screen.getByText("Drawer body")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Sheet open={false} onClose={() => {}} title="Drawer">
        <p>Drawer body</p>
      </Sheet>,
    );
    expect(screen.queryByText("Drawer body")).not.toBeInTheDocument();
  });

  it("calls onClose when close button clicked", () => {
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Drawer">
        <p>Body</p>
      </Sheet>,
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("side='auto' is a bottom sheet below md and a right drawer above", () => {
    render(
      <Sheet open onClose={() => {}} side="auto" title="Details">
        <p>Body</p>
      </Sheet>,
    );
    const panel = screen.getByRole("dialog");
    // Phone form: full-bleed, pinned to the bottom edge, rounded top.
    expect(panel.className).toContain("inset-x-0");
    expect(panel.className).toContain("bottom-0");
    expect(panel.className).toContain("rounded-t-2xl");
    // Home-indicator clearance in the full-bleed iOS wrapper; 0px elsewhere.
    expect(panel.className).toContain("pb-safe");
    // Desktop form on the SAME element, breakpoint-gated — no JS media query.
    expect(panel.className).toContain("md:right-0");
    expect(panel.className).toContain("md:h-full");
    expect(panel.className).toContain("md:max-w-sm");
    expect(panel.className).toContain("md:pb-0");
    // Desktop form is full-height and touches the top edge too (TestFlight
    // #161) — status-bar clearance there as well.
    expect(panel.className).toContain("md:pt-safe");
    // The mobile bottom-sheet form does not reach the top edge, so it must
    // NOT carry the bare (non-md) pt-safe utility.
    expect(panel.className).not.toMatch(/(^|\s)pt-safe(\s|$)/);
  });

  it("side='bottom' clears the home indicator too", () => {
    render(
      <Sheet open onClose={() => {}} side="bottom" title="Filters">
        <p>Body</p>
      </Sheet>,
    );
    expect(screen.getByRole("dialog").className).toContain("pb-safe");
  });

  it.each(["left", "right", "top"] as const)(
    "side='%s' clears the status bar/notch (TestFlight #161)",
    (side) => {
      render(
        <Sheet open onClose={() => {}} side={side} title="Panel">
          <p>Body</p>
        </Sheet>,
      );
      expect(screen.getByRole("dialog").className).toContain("pt-safe");
    },
  );
});
