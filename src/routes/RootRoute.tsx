import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { useTranslation } from "react-i18next";
import { MarketingRedirect } from "@/routes/MarketingRedirect";

/**
 * Root `/`: signed-in users go to the app hub; anonymous users leave for the
 * marketing site, which now owns the pitch at the apex. This app is served
 * from `app.<domain>`, so that is a cross-origin navigation, not a route.
 */
export function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <MarketingRedirect />;
}
