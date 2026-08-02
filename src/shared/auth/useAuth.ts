import { useAuth0 } from "@auth0/auth0-react";
import { goToMarketing } from "@/shared/config/marketing";

// Also gated on import.meta.env.DEV so a stray VITE_DEV_AUTH_BYPASS=true can
// never activate the bypass in a production build — Vite hard-codes DEV=false
// for `vite build`, so this branch is dead-code-eliminated from prod bundles.
const DEV_AUTH_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === "true";

const DEV_USER = {
  sub: "dev|user-1",
  email: "dev@openlingo.local",
  name: "Trevor",
  given_name: "Trevor",
  nickname: "Trevor",
  picture: "",
};

/**
 * Auth hook wrapping Auth0's useAuth0.
 * Single auth module: use this hook for login, logout, and user state.
 */
export function useAuth() {
  if (DEV_AUTH_BYPASS) {
    return {
      isLoading: false,
      isAuthenticated: true,
      error: undefined,
      user: DEV_USER,
      login: () => {},
      signup: () => {},
      logout: () => { goToMarketing(); },
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

  const login = () => loginWithRedirect();

  const signup = () =>
    loginWithRedirect({ authorizationParams: { screen_hint: "signup" } });

  const canonicalOrigin =
    window.location.origin + (window.location.origin.endsWith("/") ? "" : "/");
  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: canonicalOrigin } });

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
