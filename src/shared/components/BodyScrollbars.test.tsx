import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

const initialize = vi.fn();
vi.mock("overlayscrollbars-react", () => ({
  useOverlayScrollbars: () => [initialize, () => undefined],
}));

const shouldUseNativeScroll = vi.fn();
vi.mock("@/shared/platform/nativeScroll", () => ({
  shouldUseNativeScroll: () => shouldUseNativeScroll(),
}));

import { BodyScrollbars } from "./BodyScrollbars";

describe("BodyScrollbars", () => {
  beforeEach(() => {
    initialize.mockClear();
    shouldUseNativeScroll.mockReset();
    cleanup();
  });

  it("mounts the themed overlay bar on a fine-pointer (desktop) surface", () => {
    shouldUseNativeScroll.mockReturnValue(false);
    render(<BodyScrollbars />);
    expect(initialize).toHaveBeenCalledTimes(1);
    expect(initialize).toHaveBeenCalledWith(
      expect.objectContaining({ target: document.body }),
    );
  });

  it("does NOT mount the overlay on a touch surface — native scrollbar wins", () => {
    shouldUseNativeScroll.mockReturnValue(true);
    render(<BodyScrollbars />);
    expect(initialize).not.toHaveBeenCalled();
  });
});
