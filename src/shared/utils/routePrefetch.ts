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
/** LessonPage is lazy() in App.tsx — prefetch it while the learner is on the
 *  path so launching a lesson (station / resume FAB) navigates instantly and
 *  the start wipe fires without the chunk-load delay. */
export const prefetchLesson = () =>
  ignore(import("@/features/lesson/LessonPage"));
export const prefetchSocial = () =>
  ignore(import("@/features/social/SocialPage"));
export const prefetchShop = () =>
  ignore(import("@/features/shop/ShopPage"));
export const prefetchCommunity = () =>
  ignore(import("@/features/community/CommunityLayout"));
// Practice page is not currently lazy but the hover hint is a no-op
// either way; left in so the wiring stays correct if we split it later.
export const prefetchPractice = () =>
  ignore(import("@/features/practice/PracticePage").then(() => undefined));

/**
 * Boot-time warm of the open→lesson happy path, called once from main.tsx.
 *
 * Hover prefetch (below) only helps after the app is interactive; this one
 * attacks the boot waterfall itself. Without it, the home/map/lesson chunks
 * (~700 KB gz — mockLessons, StepRenderer and frequencyResolver ride in on
 * their static imports) start downloading only after the Auth0 session check
 * resolves AND the route mounts. Kicking the imports off on first idle lets
 * them download in parallel with the auth round trip, which is pure dead
 * time on the network.
 */
export function warmLearnerPathOnIdle() {
  const warm = () => {
    ignore(import("@/routes/ProtectedHome"));
    ignore(import("@/features/learn/LearnHomeSwitch"));
    prefetchLearn();
    prefetchLesson();
  };
  if ("requestIdleCallback" in window) {
    requestIdleCallback(warm, { timeout: 3000 });
  } else {
    setTimeout(warm, 1500);
  }
}

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
