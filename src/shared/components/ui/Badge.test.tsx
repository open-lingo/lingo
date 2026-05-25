import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, Tag, Pill } from "./Badge";

describe("Badge", () => {
  it("renders children with neutral variant by default", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeInTheDocument();
  });

  it("Tag uses square corners (no rounded-full)", () => {
    const { container } = render(<Tag>Tag</Tag>);
    expect(container.firstChild).not.toHaveClass("rounded-full");
  });

  it("Pill uses rounded-full corners", () => {
    const { container } = render(<Pill>Pill</Pill>);
    expect(container.firstChild).toHaveClass("rounded-full");
  });
});
