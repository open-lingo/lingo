/**
 * Mobile render pipeline — the viewport × route matrix (research §6).
 *
 * The gate specs (`*.mobile.spec.ts`) iterate VIEWPORTS × active ROUTES and run
 * DOM-geometry assertions in a real Chromium layout engine. Keep this the single
 * source of truth for what gets measured — the specs, the CI subset, and the
 * `scripts/mobile-matrix.mjs` visual sweep all read from here (the script mirrors
 * the same arrays; keep them in sync when adding a route/viewport).
 */

export interface Viewport {
  /** slug used in test titles and screenshot filenames */
  name: string;
  width: number;
  height: number;
}

export interface RouteTarget {
  /** URL path (may include a `?step=` query) */
  path: string;
  /** requires a valid `.auth/user.json` storageState */
  auth: boolean;
  /** learning language to seed into `open-lingo-settings` before nav */
  lang: "ja" | "ko" | null;
  /**
   * When true, the route is expected to expose `[data-testid="primary-cta"]`
   * and the cta-fold spec asserts it sits within the initial viewport.
   * Routes without the markup yet are skipped-with-annotation (ratchet: flip
   * the markup on in src, the assertion activates automatically).
   */
  primaryCta?: boolean;
}

/**
 * Primary gate viewports (research §6). `deviceScaleFactor` is left at Playwright's
 * default of 1 — DPR does not affect layout overflow and keeps snapshots small.
 * `tablet-portrait` (768×1024) sits exactly on the `md` boundary where the desktop
 * sidebar is still hidden — the highest-value "is the collapsed layout correct" check.
 */
export const VIEWPORTS: Viewport[] = [
  { name: "android-small", width: 360, height: 640 },
  { name: "iphone-se", width: 375, height: 667 },
  { name: "pixel-7", width: 412, height: 915 },
  { name: "iphone-14-promax", width: 430, height: 932 },
  { name: "tablet-portrait", width: 768, height: 1024 },
];

/** Extended/nightly viewports — short-height landscape clipping (research §6). */
export const EXTENDED_VIEWPORTS: Viewport[] = [
  { name: "iphone-se-landscape", width: 667, height: 375 },
  { name: "pixel-7-landscape", width: 915, height: 412 },
];

/**
 * The always-green subset: public marketing/auth routes that render without a
 * valid Auth0 storageState. CI runs these as the hard gate even when the authed
 * matrix can't (expired/absent token).
 */
export const PUBLIC_ROUTES: RouteTarget[] = [
  { path: "/landing", auth: false, lang: null },
  { path: "/get-started", auth: false, lang: null },
  { path: "/try", auth: false, lang: "ja" },
  { path: "/login", auth: false, lang: null },
  { path: "/about", auth: false, lang: null },
];

/**
 * Authed surfaces (research §6 route targets). Lesson step routes carry the
 * highest-risk `mt-auto`-below-fold + fixed-shell overflow class; they opt into
 * the CTA-in-fold assertion. A representative `ko` subset covers CJK/long-string
 * wrapping where overflow bites hardest.
 */
export const AUTHED_ROUTES: RouteTarget[] = [
  { path: "/home", auth: true, lang: "ja" },
  { path: "/settings", auth: true, lang: "ja" },

  // Learn + lesson player (LessonPage god file — highest overflow risk)
  { path: "/ja/learn", auth: true, lang: "ja" },
  { path: "/ja/learn/course", auth: true, lang: "ja" },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=0", auth: true, lang: "ja", primaryCta: true },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=2", auth: true, lang: "ja", primaryCta: true },
  { path: "/ja/learn/lessons/ja-m4-1-1?step=6", auth: true, lang: "ja", primaryCta: true },
  { path: "/ja/learn/placement-test", auth: true, lang: "ja", primaryCta: true },

  // Practice pillars
  { path: "/ja/practice", auth: true, lang: "ja" },
  { path: "/ja/practice/grammar", auth: true, lang: "ja" },
  { path: "/ja/practice/grammar/review", auth: true, lang: "ja" },
  { path: "/ja/practice/grammar/conjugation", auth: true, lang: "ja" },
  { path: "/ja/practice/flashcards", auth: true, lang: "ja" },
  { path: "/ja/practice/flashcards/review", auth: true, lang: "ja" },
  { path: "/ja/practice/flashcards/cards", auth: true, lang: "ja" },
  { path: "/ja/practice/flashcards/decks", auth: true, lang: "ja" },
  { path: "/ja/practice/alphabet", auth: true, lang: "ja" },
  { path: "/ja/practice/alphabet/hiragana", auth: true, lang: "ja" },
  { path: "/ja/practice/kanji", auth: true, lang: "ja" },
  { path: "/ja/practice/stories", auth: true, lang: "ja" },
  { path: "/ja/practice/journey", auth: true, lang: "ja" },
  { path: "/ja/practice/reading", auth: true, lang: "ja" },
  { path: "/ja/practice/speaking", auth: true, lang: "ja" },
  { path: "/ja/practice/listening", auth: true, lang: "ja" },
  { path: "/ja/practice/writing", auth: true, lang: "ja" },

  // Content + social
  { path: "/ja/vocab", auth: true, lang: "ja" },
  { path: "/ja/shop", auth: true, lang: "ja" },
  { path: "/ja/community/explore", auth: true, lang: "ja" },
  { path: "/ja/community/leaderboard", auth: true, lang: "ja" },
  { path: "/ja/social", auth: true, lang: "ja" },

  // Korean subset — CJK/long-string wrapping regression coverage
  { path: "/ko/learn", auth: true, lang: "ko" },
  { path: "/ko/practice", auth: true, lang: "ko" },
  { path: "/ko/community/leaderboard", auth: true, lang: "ko" },
];

export const ALL_ROUTES: RouteTarget[] = [...PUBLIC_ROUTES, ...AUTHED_ROUTES];

/** Set MOBILE_PUBLIC_ONLY=1 to restrict the run to the always-green public subset. */
export const PUBLIC_ONLY = process.env.MOBILE_PUBLIC_ONLY === "1";

/** Set MOBILE_EXTENDED=1 to add the short-height landscape viewports. */
export const USE_EXTENDED = process.env.MOBILE_EXTENDED === "1";

/** Routes to actually exercise given the current env (public-only vs. full). */
export function activeRoutes(): RouteTarget[] {
  return PUBLIC_ONLY ? PUBLIC_ROUTES : ALL_ROUTES;
}

/** Viewports to actually exercise given the current env. */
export function activeViewports(): Viewport[] {
  return USE_EXTENDED ? [...VIEWPORTS, ...EXTENDED_VIEWPORTS] : VIEWPORTS;
}

/** Stable slug for a route path — used in test titles and screenshot filenames. */
export function routeSlug(path: string): string {
  const slug = path
    .replace(/^\//, "")
    .replace(/\?.*$/, (q) => q.replace(/[?=&]/g, "-"))
    .replace(/\//g, "-")
    .replace(/[^a-z0-9-]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/-$/, "");
  return slug || "root";
}
