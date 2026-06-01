/**
 * AdminLayout — shells for /admin/* routes.
 *
 * Two exported layout components:
 *
 *   AdminShell      — auth check + bare Outlet. Used by /admin/home (dashboard hub).
 *   AdminInnerShell — auth check + back-to-dashboard link + bare Outlet.
 *                     Used by every /admin/* inner page (no sidebar — the
 *                     dashboard at /admin/home is the only navigation surface).
 *
 * No sidebar anywhere. Inner pages are leaves; they're reached either from
 * the dashboard's nav-cards grid or via content cross-links (e.g. an event
 * row linking to /admin/users/:id). Each inner page gets a "← Dashboard"
 * link rendered above its content automatically.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/shared/auth/useAuth";
import { AdminBackButton } from "./AdminBackButton";

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

// ── AdminShell — bare auth wrapper (used by dashboard /admin/home) ─────────────

/** Auth guard + bare Outlet. No sidebar, no back link. Used for /admin/home. */
export function AdminShell() {
  return (
    <AuthGuard>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </AuthGuard>
  );
}

// ── AdminInnerShell — auth wrapper + back link (used by inner pages) ──────────

/** Auth guard + "← Dashboard" link + Outlet. Used for every /admin/* inner page. */
export function AdminInnerShell() {
  return (
    <AuthGuard>
      <div className="mx-auto flex min-h-0 max-w-6xl flex-1 flex-col gap-4 px-4 py-6 sm:px-6">
        <AdminBackButton />
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
      </div>
    </AuthGuard>
  );
}
