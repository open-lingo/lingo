import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ResponsiveTable } from "./ResponsiveTable";

describe("ResponsiveTable", () => {
  it("renders its table children", () => {
    render(
      <ResponsiveTable>
        <table>
          <tbody>
            <tr>
              <td>cell</td>
            </tr>
          </tbody>
        </table>
      </ResponsiveTable>,
    );
    expect(screen.getByText("cell")).toBeInTheDocument();
  });

  it("scrolls horizontally rather than clipping (overflow-x-auto, not hidden)", () => {
    const { container } = render(
      <ResponsiveTable>
        <table />
      </ResponsiveTable>,
    );
    expect(container.firstChild).toHaveClass("overflow-x-auto");
    expect(container.firstChild).not.toHaveClass("overflow-hidden");
  });

  it("merges caller chrome classes onto the scroll container", () => {
    const { container } = render(
      <ResponsiveTable className="rounded-card border border-border">
        <table />
      </ResponsiveTable>,
    );
    expect(container.firstChild).toHaveClass("overflow-x-auto");
    expect(container.firstChild).toHaveClass("rounded-card");
    expect(container.firstChild).toHaveClass("border-border");
  });
});
