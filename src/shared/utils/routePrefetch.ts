/**
 * Route chunk prefetchers — fire the same dynamic-import the lazy() route
 * uses, on hover/focus, so the click navigation is instant.
 *
 * The browser caches the chunk after the first call; subsequent calls
 * resolve the same module promise. Errors are swallowed: a prefetch
 * failure must never break navigation (the on-click lazy() will retry
 * via lazyRetry anyway).
 *
 * Mobile (no hover) skips the mouseenter wiring; onFocus still fires for
 * keyboard nav and tap-then-tap patterns, so it stays useful there too.
 */

const HOVER_SUPPORTED =
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(hover: hover)").matches;

const ignore = (p: Promise<unknown>) => {
  p.catch(() => {
    /* prefetch must not break navigation */
  });
};

// Only routes that are lazy() in App.tsx benefit from prefetch — eagerly
// imported routes (FlashcardsPage, PracticePage) are already in the main
// bundle. We still expose Practice as a hover hint in case it goes lazy
// later; the import resolves cheaply when already in bundle.
export const prefetchLearn = () =>
  ignore(import("@/features/learn/LearnPage"));
export const prefetchSocial = () =>
  ignore(import("@/features/social/preview/SocialPreviewPage"));
export const prefetchShop = () =>
  ignore(import("@/features/shop/ShopPage"));
export const prefetchCommunity = () =>
  ignore(import("@/features/community/CommunityLayout"));
// Practice page is not currently lazy but the hover hint is a no-op
// either way; left in so the wiring stays correct if we split it later.
export const prefetchPractice = () =>
  ignore(import("@/features/practice/PracticePage").then(() => undefined));
export const prefetchMessenger = () =>
  ignore(import("@/features/messenger/MessengerPage"));

/**
 * Returns hover/focus handlers tuned to the device:
 * - Desktop (hover-capable pointer): hover-on-mouseenter + focus.
 * - Mobile/tablet (coarse pointer): focus only — no synthetic hover
 *   prefetch, which would be wasted bandwidth on touch.
 *
 * Always returns a focus handler because keyboard nav still wants the win.
 */
export function makePrefetchHandlers(prefetch: () => void) {
  return {
    onMouseEnter: HOVER_SUPPORTED ? prefetch : undefined,
    onFocus: prefetch,
  };
}
