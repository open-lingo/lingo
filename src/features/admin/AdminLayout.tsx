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
import { useMe } from "@/shared/hooks/useMe";
import { canAccessSiteAdmin } from "@/shared/auth/roles";
import { AdminSidebar } from "./AdminSidebar";
import { usePendingReviewCount } from "./usePendingReviewCount";

// ── Auth guard ────────────────────────────────────────────────────────────────

/**
 * Gate on ROLE, not just authentication.
 *
 * This checked `isAuthenticated` alone until 2026-08-01, so any signed-in
 * learner who typed `/admin` got the console shell — and the shell body
 * immediately fires `usePendingReviewCount` → `listAdminDecks({status:"draft"})`.
 * The only thing keeping people out was that the nav link is conditionally
 * rendered (`AuthMenu`), which is not a gate. The server-side fix (every admin
 * handler on `AdminUser`) is the real boundary; this stops a non-admin landing
 * on a shell that renders errors and fires requests it can't make.
 *
 * Fails CLOSED: if the role lookup errors, `me` is null and access is denied.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const { me, isLoading: roleLoading } = useMe();

  // Wait for the role before deciding, or a real admin gets bounced on every
  // page load while `getMe` is still in flight.
  if (isLoading || (isAuthenticated && roleLoading)) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-muted">{t("common.loading")}</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/landing" replace />;
  }

  if (!canAccessSiteAdmin(me?.role)) {
    // Signed in, just not an admin — send them to the app, not the landing page.
    return <Navigate to="/" replace />;
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
