import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SegmentedControl } from "./SegmentedControl";

describe("SegmentedControl", () => {
  it("renders each option and marks the active one", () => {
    render(
      <SegmentedControl<"a" | "b">
        value="b"
        onChange={() => {}}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />,
    );
    const beta = screen.getByRole("radio", { name: "Beta" });
    expect(beta).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange when a segment is clicked", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl<"a" | "b">
        value="a"
        onChange={onChange}
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
  });
});
