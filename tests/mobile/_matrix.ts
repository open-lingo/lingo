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
import {
  VIEWPORTS,
  DESKTOP_VIEWPORTS,
  PUBLIC_ROUTES,
  AUTHED_ROUTES,
} from "./routes.mjs";

export { VIEWPORTS, DESKTOP_VIEWPORTS, PUBLIC_ROUTES, AUTHED_ROUTES };

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

/** Set MOBILE_PUBLIC_ONLY=1 to restrict the run to the public subset. */
export const PUBLIC_ONLY = process.env.MOBILE_PUBLIC_ONLY === "1";

/**
 * Base URL for ANONYMOUS routes — a second dev server started WITHOUT
 * `VITE_DEV_AUTH_BYPASS` (see `playwright.config.ts`).
 *
 * Two servers because the bypass is a build-time constant:
 * `DEV_AUTH_BYPASS` in `shared/auth/bypass.ts` reads `import.meta.env` at module
 * load, so one server cannot serve a signed-in and a signed-out session at once.
 * Adding a runtime override to that file was the alternative and it is not worth
 * it — that module is the fence the whole "shipping iOS doesn't touch the web
 * app" claim rests on, and a test-only door in it is exactly the kind of thing
 * that later ships.
 *
 * Without this the bypass signed the browser in on every route, so every public
 * page landed on /home and the public gate measured the same page under three
 * names (2026-08-07).
 */
export const PUBLIC_BASE_URL =
  process.env.MOBILE_PUBLIC_URL ??
  `http://localhost:${process.env.MOBILE_PUBLIC_PORT ?? "5274"}`;

/** Set MOBILE_EXTENDED=1 to add the short-height landscape viewports. */
export const USE_EXTENDED = process.env.MOBILE_EXTENDED === "1";

/** Routes to actually exercise given the current env (public-only vs. full). */
export function activeRoutes(): RouteTarget[] {
  return PUBLIC_ONLY ? PUBLIC_ROUTES : ALL_ROUTES;
}

/**
 * Viewports to actually exercise given the current env.
 *
 * Desktop sizes ride the default run: the gate's whole point is "does the
 * layout hold at this size", and phone-only coverage is exactly how the
 * test-out CTA shipped below the fold at 1080p (2026-08-05).
 */
export function activeViewports(): Viewport[] {
  const base = [...VIEWPORTS, ...DESKTOP_VIEWPORTS];
  return USE_EXTENDED ? [...base, ...EXTENDED_VIEWPORTS] : base;
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
