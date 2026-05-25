import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dialog, AlertDialog } from "./Dialog";

describe("Dialog", () => {
  it("renders title, description, and both buttons", () => {
    render(
      <Dialog
        open
        title="Confirm"
        description="Are you sure?"
        confirmLabel="Yes"
        cancelLabel="No"
        onClose={() => {}}
        onConfirm={() => {}}
      />,
    );
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Yes" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "No" })).toBeInTheDocument();
  });

  it("fires onConfirm and onClose appropriately", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <Dialog
        open
        title="Confirm"
        description="Are you sure?"
        confirmLabel="Yes"
        cancelLabel="No"
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("AlertDialog", () => {
  it("renders only the confirm button (no cancel)", () => {
    render(
      <AlertDialog
        open
        title="Heads up"
        description="Session expired"
        confirmLabel="OK"
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });
});
