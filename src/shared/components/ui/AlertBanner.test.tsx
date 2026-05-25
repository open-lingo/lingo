import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AlertBanner } from "./AlertBanner";

describe("AlertBanner", () => {
  it("renders title and message", () => {
    render(
      <AlertBanner variant="error" title="Failed">
        Network is down.
      </AlertBanner>,
    );
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Network is down.")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button clicked", () => {
    const onDismiss = vi.fn();
    render(<AlertBanner onDismiss={onDismiss}>Notice</AlertBanner>);
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
