import { useMediaQuery } from "./useMediaQuery";

/**
 * Tailwind breakpoint mirrors (default config):
 *   sm  640
 *   md  768
 *   lg  1024
 *   xl  1280
 *   2xl 1536
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

export type Viewport = {
  /** width < md (768px) */
  isMobile: boolean;
  /** md <= width < lg */
  isTablet: boolean;
  /** width >= lg */
  isDesktop: boolean;
};

/**
 * High-level responsive flags driven by `matchMedia`. SSR-safe (initial pass returns
 * the desktop assumption — `isDesktop: true` — to avoid layout shift on first paint).
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
