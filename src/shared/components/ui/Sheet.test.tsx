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
});
