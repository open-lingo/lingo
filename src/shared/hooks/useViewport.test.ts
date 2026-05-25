import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useViewport, useBreakpoint } from "./useViewport";

const original =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia.bind(window)
    : undefined;

function setMatches(matches: boolean) {
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
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

describe("useViewport", () => {
  beforeEach(() => setMatches(true));
  afterEach(() => {
    if (original) window.matchMedia = original;
  });

  it("reports desktop when matchMedia matches the lg breakpoint", () => {
    const { result } = renderHook(() => useViewport());
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it("reports mobile when matchMedia does not match md", () => {
    setMatches(false);
    const { result } = renderHook(() => useViewport());
    expect(result.current.isMobile).toBe(true);
  });
});

describe("useBreakpoint", () => {
  beforeEach(() => setMatches(true));
  afterEach(() => {
    if (original) window.matchMedia = original;
  });

  it("returns true for matching breakpoint", () => {
    const { result } = renderHook(() => useBreakpoint("md"));
    expect(result.current).toBe(true);
  });
});
