import { useAuth0 } from "@auth0/auth0-react";
import { goToMarketing } from "@/shared/config/marketing";
import { IS_NATIVE, nativeCallbackUrl } from "@/shared/platform/native";
import { openInSystemBrowser } from "@/shared/platform/nativeAuth";
import { auth0Domain } from "@/shared/auth/config";
import { AUTH_BYPASS, BYPASS_USER } from "@/shared/auth/bypass";

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
      logout: IS_NATIVE ? () => {} : () => { goToMarketing(); },
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
  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: canonicalOrigin }, ...nativeOpen });

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
