import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { MarketingRedirect } from "@/routes/MarketingRedirect";

/**
 * Requires an Auth0 session. Anonymous users leave for the marketing site,
 * which now lives on its own origin.
 */
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <p className="text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <MarketingRedirect />;
  }

  return <Outlet />;
}
