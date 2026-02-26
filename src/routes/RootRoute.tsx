import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { LandingPage } from "@/features/landing/LandingPage";
import { useTranslation } from "react-i18next";

/** Root route: redirect to /home if logged in, else show landing. */
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

  return <LandingPage />;
}
