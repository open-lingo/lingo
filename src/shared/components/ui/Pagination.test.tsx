import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("returns null when totalPages <= 1", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("marks current page with aria-current", () => {
    render(<Pagination page={2} totalPages={4} onPageChange={() => {}} />);
    const current = screen.getByRole("button", { name: "2" });
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("calls onPageChange with the clicked page", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={4} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables prev button on the first page", () => {
    render(<Pagination page={1} totalPages={4} onPageChange={() => {}} />);
    const prev = screen.getByLabelText("Previous page");
    expect(prev).toBeDisabled();
  });
});
