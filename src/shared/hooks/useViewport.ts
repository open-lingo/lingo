import { useMediaQuery } from "./useMediaQuery";
import { BREAKPOINTS, MOBILE_BREAKPOINT, type Breakpoint } from "./breakpoints";

// Breakpoint values live in one place now — see ./breakpoints.ts, which also
// feeds tailwind.config.js `theme.screens`. Re-exported here so existing
// importers (`@/shared/hooks/useViewport`) keep resolving.
export { BREAKPOINTS, MOBILE_BREAKPOINT };
export type { Breakpoint };

export type Viewport = {
  /** width < md (768px) — the documented mobile boundary (see breakpoints.ts) */
  isMobile: boolean;
  /** md <= width < lg */
  isTablet: boolean;
  /** width >= lg */
  isDesktop: boolean;
};

/**
 * High-level responsive flags driven by `matchMedia`.
 *
 * First-paint default is **mobile-first**: when `matchMedia` is unavailable
 * (true SSR, or a non-DOM test environment) `useMediaQuery` seeds `false`, so
 * `isMobile` starts `true`. In a real browser the correct value is computed
 * synchronously on the first render (the initializer reads `matchMedia`
 * eagerly), so there is no flash — the mobile-first seed only governs
 * window-less environments, which is the safer assumption for a mobile-first
 * app. (This corrects the previous comment, which claimed a desktop-first
 * default that the code never actually produced.)
 *
 * @example
 *   const { isMobile } = useViewport();
 *   return isMobile ? <Drawer /> : <Sidebar />;
 */
export function useViewport(): Viewport {
  const atLeastMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const atLeastLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  return {
    isMobile: !atLeastMd,
    isTablet: atLeastMd && !atLeastLg,
    isDesktop: atLeastLg,
  };
}

/** Convenience: matches Tailwind `<bp>:` prefix semantics (>= bp). */
export function useBreakpoint(bp: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS[bp]}px)`);
}
