import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders title and children when open", () => {
    render(
      <Modal open onClose={() => {}} title="Hello">
        <p>Body content</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden">
        <p>Body</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Title">
        <p>Body</p>
      </Modal>,
    );
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape when closeOnEscape is the default", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Title">
        <p>Body</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the footer slot when provided", () => {
    render(
      <Modal open onClose={() => {}} title="t" footer={<button>OK</button>}>
        <p>x</p>
      </Modal>,
    );
    expect(screen.getByText("OK")).toBeInTheDocument();
  });
});
