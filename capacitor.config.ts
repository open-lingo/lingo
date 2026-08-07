import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wrapper config — iOS only for now (free-provisioning testing on
 * Spencer's own device; see `docs/mobile-testing-setup-2026-08-06.md`).
 *
 * ⚠️ `appId` is ALSO the custom URL scheme Auth0 redirects back through, and it
 * is duplicated in `src/shared/platform/native.ts` as `NATIVE_APP_ID` because
 * this file is loaded by the Capacitor CLI (outside Vite, no `@/` alias) while
 * that one is loaded by the bundle. `native.test.ts` asserts the two match —
 * a silent drift here breaks login with no error message worth reading.
 *
 * `webDir: "dist"` is Vite's build output, NOT `publicDir` (`src/pub`). Native
 * bundles must be built with `npm run build:native`, which sets `VITE_NATIVE`
 * and points the bundle at the production backend; a plain `npm run build`
 * produces a web bundle whose auth can never redirect back into the app.
 */
const config: CapacitorConfig = {
  appId: "com.openlingo.app",
  appName: "Open Lingo",
  webDir: "dist",
  ios: {
    // Shows through before the web layer paints and behind the safe areas.
    // #f5f0e6 is the `--color-background` default in `shared/styles/tokens.css`
    // (= the `light` preset), which is what paints first on a cold launch —
    // ThemeContext only swaps in a stored dark palette once JS runs. Leaving
    // this at the WKWebView white default flashes on every launch.
    // ⚠️ A learner on the dark preset still gets a cream flash. Fixing that
    // properly means persisting the theme natively, not guessing here.
    backgroundColor: "#f5f0e6ff",
  },
};

export default config;
