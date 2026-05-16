import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/useAuth";
import { HomePage } from "@/features/home/HomePage";
import { useTranslation } from "react-i18next";

/** Home route: redirect to / if not logged in, else show dashboard. */
export function ProtectedHome() {
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
    return <Navigate to="/landing" replace />;
  }

  return <HomePage />;
}
