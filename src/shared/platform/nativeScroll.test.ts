import { describe, it, expect, afterEach, vi } from "vitest";
import { hasCoarsePointer, shouldUseNativeScroll } from "./nativeScroll";

/**
 * On a touch surface (the Capacitor app, or mobile web) we want the OS's own
 * transient scroll indicator, not a persistent painted bar — native apps have
 * no visible scrollbar. These guard both the CSS branch and the decision to
 * skip the OverlayScrollbars body pill. IS_NATIVE is false under the test
 * runner, so these exercise the coarse-pointer term.
 */
describe("nativeScroll", () => {
  const realMatchMedia = window.matchMedia;
  afterEach(() => {
    window.matchMedia = realMatchMedia;
    vi.restoreAllMocks();
  });

  function stubPointer(coarse: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("coarse") ? coarse : !coarse,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }

  it("hasCoarsePointer is true when the pointer:coarse media query matches", () => {
    stubPointer(true);
    expect(hasCoarsePointer()).toBe(true);
  });

  it("hasCoarsePointer is false when the pointer is fine (desktop mouse)", () => {
    stubPointer(false);
    expect(hasCoarsePointer()).toBe(false);
  });

  it("hasCoarsePointer is false when matchMedia is unavailable (SSR safety)", () => {
    // @ts-expect-error deliberately removing the API to model a non-DOM env
    window.matchMedia = undefined;
    expect(hasCoarsePointer()).toBe(false);
  });

  it("shouldUseNativeScroll follows the coarse pointer when not native", () => {
    stubPointer(true);
    expect(shouldUseNativeScroll()).toBe(true);
    stubPointer(false);
    expect(shouldUseNativeScroll()).toBe(false);
  });
});
