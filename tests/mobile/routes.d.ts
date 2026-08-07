/**
 * Hand-written declaration for the plain-ESM `routes.mjs` single source, so the
 * TS gate specs (`_matrix.ts`) get typed arrays and `tsc` stays clean.
 */
import type { RouteTarget, Viewport } from "./_matrix";

export const VIEWPORTS: Viewport[];
export const DESKTOP_VIEWPORTS: Viewport[];
export const PUBLIC_ROUTES: RouteTarget[];
export const AUTHED_ROUTES: RouteTarget[];
