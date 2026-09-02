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
  appId: "com.linguiversal.app",
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

/**
 * Simulator/device DEBUG harness — opt-in, never on by default.
 *
 * Set `CAP_DEV_SERVER=http://localhost:5173` before `npx cap sync ios` to make
 * the native shell load the Vite dev server instead of the bundled `dist`, and
 * to forward the webview's `console.*` into the native log (which is the only
 * way to see a JS-side error from `xcrun devicectl`/`simctl` — Capacitor
 * silences the console in release builds by default).
 *
 * ⚠️ Both settings are DEBUG-ONLY and must never reach a store build. Gating
 * them on an env var rather than a commented-out block is deliberate: an
 * edit-it-back-afterwards harness is exactly the kind of thing that ships by
 * accident. With no `CAP_DEV_SERVER` in the environment, `cap sync` emits the
 * production config, so the default is always safe.
 *
 * The dev server MUST be started with `VITE_NATIVE=true`, otherwise the bundle
 * is served over `http://localhost`, `IS_NATIVE` is false, and every native
 * branch (auth, TTS host, the speech plugin) silently takes the WEB path —
 * which produces a harness that passes while the real app fails.
 */
const devServer = process.env.CAP_DEV_SERVER;
if (devServer) {
  config.server = { url: devServer, cleartext: true };
}

// `CAP_DEV_LOGGING=1` forwards the webview console WITHOUT redirecting the app
// at a dev server — the combination a real phone needs. A device cannot load
// `http://localhost:5173` (that is the Mac's loopback, not the phone's), so
// tying logging to `CAP_DEV_SERVER` would mean the one place errors are hardest
// to see is the one place they cannot be logged.
if (devServer || process.env.CAP_DEV_LOGGING === "1") {
  config.loggingBehavior = "production";
}

export default config;
