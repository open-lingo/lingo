import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { AuthHandoff } from "@/features/auth/AuthHandoff";
import { IS_NATIVE } from "@/shared/platform/native";

export function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth();
  // Web: `login()` navigates the tab away immediately, so this component is
  // never mounted again until the redirect back — "opening" is the only
  // direction it ever shows there.
  // Native: `login()` opens SFSafariViewController over this SAME screen
  // (loginWithRedirect never navigates the webview) and the round trip —
  // sheet open, user signs in, deep link back, NativeAuthBridge exchanges
  // the code — all resolves right here. There is no separate "we're back"
  // screen to switch to, so once `login()` has fired this shows
  // "signing-in" for the rest of that round trip.
  const [hasStartedLogin, setHasStartedLogin] = useState(false);

  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    setHasStartedLogin(true);
    login();
  }, [login, isLoading, isAuthenticated]);

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  const direction = IS_NATIVE && hasStartedLogin ? "signing-in" : "opening";
  return <AuthHandoff direction={direction} />;
}
