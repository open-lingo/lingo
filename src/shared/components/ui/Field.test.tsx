import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Field } from "./Field";
import { Input } from "./Input";

describe("Field", () => {
  it("wires label to its child control via htmlFor / id", () => {
    render(
      <Field label="Email">
        <Input placeholder="you@example.com" />
      </Field>,
    );
    const input = screen.getByPlaceholderText("you@example.com") as HTMLInputElement;
    const label = screen.getByText("Email");
    expect(label).toHaveAttribute("for", input.id);
  });

  it("shows the error and marks the control aria-invalid", () => {
    render(
      <Field label="Email" error="Required">
        <Input placeholder="x" />
      </Field>,
    );
    const input = screen.getByPlaceholderText("x") as HTMLInputElement;
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Required")).toBeInTheDocument();
  });
});
