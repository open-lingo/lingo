/**
 * Mobile render pipeline — the viewport × route matrix (research §6).
 *
 * The gate specs (`*.mobile.spec.ts`) iterate VIEWPORTS × active ROUTES and run
 * DOM-geometry assertions in a real Chromium layout engine. The matrix data
 * (VIEWPORTS + PUBLIC_ROUTES + AUTHED_ROUTES) lives in the plain-ESM
 * `./routes.mjs` so the Playwright specs and the `scripts/mobile-matrix.mjs`
 * visual sweep import the SAME arrays — no drift. This file adds the TS types,
 * the extended viewports, and the env-driven helpers on top.
 */
import { VIEWPORTS, PUBLIC_ROUTES, AUTHED_ROUTES } from "./routes.mjs";

export { VIEWPORTS, PUBLIC_ROUTES, AUTHED_ROUTES };

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
 * Extended/nightly viewports — short-height landscape clipping (research §6).
 * (Portrait VIEWPORTS + the PUBLIC_ROUTES/AUTHED_ROUTES arrays live in
 * `./routes.mjs` — the shared single source imported/re-exported above.)
 */
export const EXTENDED_VIEWPORTS: Viewport[] = [
  { name: "iphone-se-landscape", width: 667, height: 375 },
  { name: "pixel-7-landscape", width: 915, height: 412 },
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
