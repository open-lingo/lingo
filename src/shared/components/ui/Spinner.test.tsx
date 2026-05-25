import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner } from "./Spinner";
import { CenteredLoader } from "./CenteredLoader";

describe("Spinner", () => {
  it("renders without label by default", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("exposes a status role with label when provided", () => {
    render(<Spinner label="Loading data" />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-label", "Loading data");
  });
});

describe("CenteredLoader", () => {
  it("renders the message", () => {
    render(<CenteredLoader message="Fetching..." />);
    expect(screen.getByText("Fetching...")).toBeInTheDocument();
  });
});
