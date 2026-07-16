/**
 * AdminLayout — shell for /admin/* routes.
 *
 *   AdminInnerShell — auth check + persistent grouped sidebar + Outlet.
 *                     Used by every /admin/* route, including the dashboard hub
 *                     at /admin/home (the sidebar's Dashboard tab). The sidebar
 *                     is the console navigation surface (driven by adminNavConfig).
 *
 * Inner pages are leaves: they're reached from the sidebar groups or via
 * content cross-links (e.g. an event row linking to /admin/users/:id).
 */
import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/shared/auth/useAuth";
import { AdminSidebar } from "./AdminSidebar";
import { usePendingReviewCount } from "./usePendingReviewCount";

// ── Auth guard ────────────────────────────────────────────────────────────────

function AuthGuard({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}

// ── AdminInnerShell — auth wrapper + console sidebar (used by all admin pages) ─

function AdminInnerShellBody() {
  const pendingReview = usePendingReviewCount();
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8">
      <AdminSidebar pendingReview={pendingReview} />
      <div className="min-h-0 min-w-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
}

/** Auth guard + grouped console sidebar + Outlet. Used for every /admin/* inner page. */
export function AdminInnerShell() {
  return (
    <AuthGuard>
      <AdminInnerShellBody />
    </AuthGuard>
  );
}
