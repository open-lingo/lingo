import { useAuth0 } from "@auth0/auth0-react";
import { goToMarketing } from "@/shared/config/marketing";
import { IS_NATIVE, nativeCallbackUrl } from "@/shared/platform/native";
import { openInSystemBrowser } from "@/shared/platform/nativeAuth";
import { auth0Domain } from "@/shared/auth/config";
import { AUTH_BYPASS, BYPASS_USER } from "@/shared/auth/bypass";

/**
 * The one option `useAuth()`'s `logout` exposes beyond "log out normally":
 * `{ openUrl: false }` for a LOCAL-ONLY logout — clear the cached session,
 * skip the browser/system-browser hop entirely. Same shape
 * `shared/api/provider.tsx`'s dead-session recovery already uses on the raw
 * auth0-react `logout`, and what `AuthHandoff`'s retry action uses to clear
 * a stuck/dead session before calling `login()` again.
 */
type LogoutOptions = { openUrl?: false };

/**
 * Auth hook wrapping Auth0's useAuth0.
 * Single auth module: use this hook for login, logout, and user state.
 */
export function useAuth() {
  if (AUTH_BYPASS) {
    return {
      isLoading: false,
      isAuthenticated: true,
      error: undefined,
      user: BYPASS_USER,
      // Native has no marketing site to leave for — `goToMarketing` would hand
      // the URL to Safari and strand the app (same trap as MarketingRedirect).
      // A bypassed native session has nothing to log out OF, so this is a no-op.
      // Accepts (and ignores) the same `LogoutOptions` shape the real logout
      // below takes, so callers (AuthHandoff's retry) don't need to branch
      // on AUTH_BYPASS.
      logout: IS_NATIVE
        ? (_options?: LogoutOptions) => {}
        : (_options?: LogoutOptions) => { goToMarketing(); },
      login: () => {},
      signup: () => {},
    };
  }

  const {
    isLoading,
    isAuthenticated,
    error,
    user,
    loginWithRedirect,
    logout: auth0Logout,
  } = useAuth0();

  // On native the authorize/logout URLs must open in SFSafariViewController,
  // not in the app's own webview: Auth0 blocks embedded-webview logins for
  // social connections, and App Review treats an in-app third-party credential
  // form as grounds for rejection. `openUrl` is a per-call option (it does not
  // exist on Auth0Provider), so every entry point has to pass it. Spread as
  // `{}` on web so those calls stay byte-for-byte what they were.
  const nativeOpen = IS_NATIVE ? { openUrl: openInSystemBrowser } : {};

  const login = () =>
    IS_NATIVE ? loginWithRedirect(nativeOpen) : loginWithRedirect();

  const signup = () =>
    loginWithRedirect({
      authorizationParams: { screen_hint: "signup" },
      ...nativeOpen,
    });

  // Native has no origin worth returning to — `capacitor://localhost` is not a
  // URL Auth0 can redirect a system browser at — so logout comes back through
  // the same custom scheme login does. ⚠️ This exact string must ALSO be in the
  // Auth0 application's Allowed Logout URLs, not just Allowed Callback URLs;
  // Auth0 checks those lists separately and a missing entry fails with a
  // full-screen Auth0 error page rather than anything the app can catch.
  const canonicalOrigin = IS_NATIVE
    ? nativeCallbackUrl(auth0Domain ?? "")
    : window.location.origin + (window.location.origin.endsWith("/") ? "" : "/");
  const logout = (options?: LogoutOptions) =>
    auth0Logout({
      logoutParams: { returnTo: canonicalOrigin },
      ...nativeOpen,
      // `openUrl: false` (when passed) OVERRIDES `nativeOpen`'s `openUrl` on
      // native — this is the local-only, no-browser-hop logout, same as
      // `shared/api/provider.tsx`'s `invalid_grant` recovery already does on
      // the raw auth0-react logout, applied identically on both platforms.
      ...(options?.openUrl === false ? { openUrl: false as const } : {}),
    });

  return {
    isLoading,
    isAuthenticated: !!isAuthenticated,
    error,
    user: user ?? null,
    login,
    signup,
    logout,
  };
}
