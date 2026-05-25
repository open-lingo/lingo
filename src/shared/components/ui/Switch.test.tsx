import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("reflects the checked state via aria-checked", () => {
    render(<Switch checked onCheckedChange={() => {}} ariaLabel="toggle" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onCheckedChange with the inverted value", () => {
    const onChange = vi.fn();
    render(<Switch checked={false} onCheckedChange={onChange} ariaLabel="t" />);
    fireEvent.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});
