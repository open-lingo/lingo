import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { useTranslation } from "react-i18next";

/**
 * Root `/`: send signed-in users to the app hub; send anonymous users to the
 * dedicated landing route (same SPA today; can move to a separate origin later).
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

  return <Navigate to="/landing" replace />;
}
