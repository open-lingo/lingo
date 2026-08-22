/**
 * Native (Capacitor) detection, and the handful of URLs that differ there.
 *
 * Everything native-specific in this app hangs off `IS_NATIVE`. Both terms of
 * it are *provably* false in a browser, which is the entire point — shipping
 * the iOS wrapper must not change behaviour for the people already using
 * app.openlingoapp.com:
 *
 *   1. `VITE_NATIVE` is set ONLY by `npm run build:native`. Vite inlines
 *      `import.meta.env.VITE_NATIVE` as `undefined` in every other build, so
 *      this term is a compile-time `false`.
 *   2. `capacitor:` is the scheme WKWebView serves the bundle from on iOS. No
 *      browser ever loads a document on it. This is the belt to (1)'s braces:
 *      a native build that forgot the flag still takes the native path instead
 *      of silently shipping web auth that can never redirect back into the app.
 *
 * Note what this does and does not buy. Term (2) is a runtime check, so the
 * whole expression is a runtime constant and the native branches are NOT
 * dead-code-eliminated from the web bundle — they ship, and never execute.
 * The guarantee is "provably never taken", not "absent". That trade is
 * deliberate: a few hundred bytes against a native build that fails silently.
 * Drop the `||` term if the bytes ever matter more than the safety net.
 *
 * ⚠️ Term (2) does NOT cover Android — Capacitor serves Android from
 * `http://localhost` by default, which is indistinguishable from `vite dev`.
 * When Android is added, the flag becomes load-bearing on its own, or
 * `androidScheme` has to move off http.
 */
export const IS_NATIVE =
  import.meta.env.VITE_NATIVE === "true" ||
  (typeof window !== "undefined" && window.location.protocol === "capacitor:");

/**
 * The iOS bundle identifier, which doubles as the app's custom URL scheme.
 *
 * ⚠️ Duplicated from `capacitor.config.ts` on purpose: that file is loaded by
 * the Capacitor CLI outside Vite, so it cannot import through the `@/` alias,
 * and this one is loaded by the bundle, so it cannot import from repo root
 * without dragging the CLI's types in. `native.test.ts` asserts the two are
 * identical — drift breaks login with an error message nobody can act on.
 */
export const NATIVE_APP_ID = "com.linguiversal.app";

/**
 * Auth0's callback URL for a Capacitor app.
 *
 * The shape (`{bundleId}://{auth0Domain}/capacitor/{bundleId}/callback`) is
 * Auth0's own convention, not an arbitrary choice — their docs, samples and
 * dashboard hints all assume it, so deviating costs you every piece of
 * copy-pasteable support material. This exact string must be pasted into the
 * Auth0 application's **Allowed Callback URLs** and **Allowed Logout URLs**.
 *
 * A web origin can't be used instead: `capacitor://localhost` is not a URL
 * iOS can hand back to the app from SFSafariViewController, and an https://
 * callback would land the user in Safari with a logged-in session the app
 * cannot see.
 */
export function nativeCallbackUrl(auth0Domain: string): string {
  return `${NATIVE_APP_ID}://${auth0Domain}/capacitor/${NATIVE_APP_ID}/callback`;
}
