import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FilterBar } from "./FilterBar";

type MatchMediaFn = (q: string) => MediaQueryList;
const originalMatchMedia: MatchMediaFn | undefined =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia.bind(window)
    : undefined;

function setMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList) as MatchMediaFn;
}

describe("FilterBar", () => {
  beforeEach(() => {
    setMatchMedia(true); // desktop default
  });
  afterEach(() => {
    if (originalMatchMedia) window.matchMedia = originalMatchMedia;
  });

  it("renders filter selects inline on desktop", () => {
    const onChange = vi.fn();
    render(
      <FilterBar
        filters={[
          {
            key: "status",
            label: "Status",
            value: "all",
            options: [
              { label: "All", value: "all" },
              { label: "Done", value: "done" },
            ],
            onChange,
          },
        ]}
      />,
    );
    // The select should be visible without opening any sheet.
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.queryByLabelText("Filters")).not.toBeInTheDocument();
  });

  it("collapses to a Filters button + opens a Sheet on mobile", () => {
    setMatchMedia(false); // mobile
    render(
      <FilterBar
        filters={[
          {
            key: "status",
            label: "Status",
            value: "done",
            options: [
              { label: "All", value: "all" },
              { label: "Done", value: "done" },
            ],
            onChange: () => {},
          },
        ]}
      />,
    );
    const trigger = screen.getByLabelText("Filters");
    expect(trigger).toBeInTheDocument();
    // Badge with active count is visible.
    expect(trigger.textContent ?? "").toContain("1");
    // Sheet starts closed.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
