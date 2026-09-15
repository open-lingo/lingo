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
 * Raw (non-width) Tailwind screens — media queries that a min-width value
 * cannot express.
 *
 * `landscapeLg` = "≥lg AND landscape" and it exists because of the iPad
 * (`docs/ipad-scoping-2026-09-15.md` §2). `lg:` alone means "≥1024px wide",
 * which is true of a 13" iPad held in PORTRAIT (1024×1366) — so that one model
 * showed the desktop sidebar upright while every other iPad showed the
 * hamburger, purely because its portrait width happens to land on the
 * breakpoint. Spencer's direction is orientation-based ("landscape mirrors
 * desktop, portrait is the roomiest mobile"), which is an orientation
 * question, not a width one.
 *
 * ⚠️ This changes NOTHING on a desktop browser: a monitor or laptop window is
 * always `orientation: landscape` (width > height), so `landscapeLg` matches
 * exactly where `lg:` did — 1280×720, 1920×1080, and any resized window wider
 * than it is tall. It diverges only on a portrait tablet/phone ≥1024 CSS px
 * wide, which is the case it was added to catch. The same string is exported
 * as `MQ.landscapeLg` from `shared/platform/formFactor.ts` for the JS side.
 */
export const RAW_SCREENS = {
  landscapeLg: `(min-width: ${BREAKPOINTS.lg}px) and (orientation: landscape)`,
} as const;

export type RawScreen = keyof typeof RAW_SCREENS;

/**
 * Tailwind `theme.screens` map (px strings) derived from `BREAKPOINTS`, plus
 * the raw screens above. Consumed by `tailwind.config.js` so the config never
 * re-states the numbers.
 *
 * `landscapeLg` is declared LAST on purpose: Tailwind emits variants in
 * declaration order and media queries add no specificity, so a later screen
 * wins the overlap against `lg:` when both target the same property.
 */
export const SCREENS = {
  ...(Object.fromEntries(
    Object.entries(BREAKPOINTS).map(([name, px]) => [name, `${px}px`]),
  ) as Record<Breakpoint, string>),
  landscapeLg: { raw: RAW_SCREENS.landscapeLg },
} as Record<Breakpoint, string> & Record<RawScreen, { raw: string }>;
