import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";
import { AdminBreadcrumbs } from "./AdminBreadcrumbs";

/** Admin area layout. Redirects to login if not authenticated. */
export function AdminLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs />
      <Outlet />
    </div>
  );
}
