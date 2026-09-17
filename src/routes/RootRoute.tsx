import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { MarketingRedirect } from "@/routes/MarketingRedirect";
import { AuthHandoff } from "@/features/auth/AuthHandoff";

/**
 * Root `/`: signed-in users go to the app hub; anonymous users leave for the
 * marketing site, which now owns the pitch at the apex. This app is served
 * from `app.<domain>`, so that is a cross-origin navigation, not a route.
 *
 * On web, `redirect_uri` is the app's own origin (main.tsx), so this is
 * also exactly where a visitor lands back after Auth0's own redirect —
 * `isLoading` here covers both that post-callback code exchange and a plain
 * cold-load session resume from localStorage, and both are "signing you
 * in" from the visitor's point of view.
 */
export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthHandoff direction="signing-in" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <MarketingRedirect />;
}
