import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { IS_NATIVE } from "./native";
import { closeSystemBrowser } from "./nativeAuth";

/**
 * Completes the Auth0 round-trip on iOS. Renders nothing.
 *
 * On the web, Auth0 redirects the page itself, so `Auth0Provider` sees `?code`
 * on its own URL at mount and exchanges it with no help. In a Capacitor app
 * nothing navigates: login happens in SFSafariViewController, and the result
 * arrives as a custom-scheme deep link (`com.openlingo.app://…`) delivered to
 * the *native* layer as an `appUrlOpen` event. Without this listener the user
 * logs in successfully, the browser sheet sits there, and the app behind it
 * stays anonymous forever.
 *
 * Must render INSIDE `Auth0Provider` — it needs that client's
 * `handleRedirectCallback`. Mounting it outside would silently get a different
 * (unconfigured) client and every exchange would fail.
 */
export function NativeAuthBridge() {
  const { handleRedirectCallback } = useAuth0();

  useEffect(() => {
    if (!IS_NATIVE) return;

    // The listener is registered asynchronously (dynamic import + a bridge
    // round-trip), so an unmount can land before registration finishes.
    // `cancelled` makes that case remove the listener as soon as it exists
    // rather than leaking one per mount — StrictMode double-invokes effects in
    // dev, so this is the common path, not an edge case.
    let cancelled = false;
    let remove: (() => void) | undefined;

    void (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appUrlOpen", ({ url }) => {
        void (async () => {
          // Both an auth result and a logout return arrive on this scheme.
          // Only the former carries `state` + (`code` | `error`); calling
          // handleRedirectCallback on a logout return throws
          // "There are no query params available for parsing".
          const hasAuthResult =
            url.includes("state=") &&
            (url.includes("code=") || url.includes("error="));
          if (hasAuthResult) {
            try {
              await handleRedirectCallback(url);
            } catch {
              // A stale/replayed link (e.g. iOS re-delivering on resume) fails
              // the exchange. Swallow it: the sheet still has to close, and a
              // thrown error here would surface as an unhandled rejection with
              // no UI attached to it.
            }
          }
          await closeSystemBrowser();
        })();
      });
      if (cancelled) {
        void handle.remove();
        return;
      }
      remove = () => {
        void handle.remove();
      };
    })();

    return () => {
      cancelled = true;
      remove?.();
    };
  }, [handleRedirectCallback]);

  return null;
}
