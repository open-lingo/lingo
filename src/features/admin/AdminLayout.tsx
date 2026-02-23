import { Navigate, Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/shared/auth/useAuth";

/** Admin area layout. Redirects to login if not authenticated. */
export function AdminLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          {t("admin.backToSite")}
        </Link>
        <Link to="/admin/users" className="text-sm font-medium text-gray-900 dark:text-white">
          {t("admin.users")}
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
