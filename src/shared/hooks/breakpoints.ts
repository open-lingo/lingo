/**
 * Canonical responsive breakpoint pixel values — the single source of truth
 * shared by Tailwind (`theme.screens` in `tailwind.config.js`) and the JS
 * viewport hooks (`useViewport`, `useBreakpoint`). Keeping both consumers on
 * this one module stops the config and the hooks from silently drifting apart
 * (they were hand-copied duplicates before).
 *
 * Values match Tailwind's stock scale, so every existing `sm:`/`md:`/`lg:`
 * utility resolves to the exact same pixel as before.
 *
 * ── Semantic mobile boundary: `md` (768px) ──
 * `useViewport().isMobile` is true below `md`. That line is chosen because the
 * app shell collapses its primary navigation to the hamburger menu below `md`
 * (`md:hidden` in `routes/Layout.tsx`) — so `md` is the "phone/tablet-shaped
 * layout vs. desktop-nav" boundary, the point where JS-driven layout trees
 * actually diverge. Tailwind's finer `sm:` (640px) stays available for
 * utility-level show/hide, but the JS conditional-layout seam keys off `md`.
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/** The single documented mobile/desktop-nav boundary used by `useViewport`. */
export const MOBILE_BREAKPOINT: Breakpoint = "md";

/**
 * Tailwind `theme.screens` map (px strings) derived from `BREAKPOINTS`.
 * Consumed by `tailwind.config.js` so the config never re-states the numbers.
 */
export const SCREENS = Object.fromEntries(
  Object.entries(BREAKPOINTS).map(([name, px]) => [name, `${px}px`]),
) as Record<Breakpoint, string>;
