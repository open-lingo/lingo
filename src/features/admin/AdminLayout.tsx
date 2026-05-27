/**
 * AdminLayout — the shell for every /admin/* route.
 *
 * - Persistent left rail on lg+, horizontal tab strip on smaller screens
 * - Top bar with section title + a search box (filters the users list on
 *   /admin/users; ignored elsewhere). The search value is published via
 *   AdminSearchContext so child pages can subscribe.
 * - Breadcrumb row above the outlet for sub-routes.
 */
import { createContext, useContext, useMemo, useState } from "react";
import { Navigate, NavLink, Outlet, useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";

import { useAuth } from "@/shared/auth/useAuth";
import { cn } from "@/shared/components/ui/cn";
import { inputClassName } from "@/shared/components/ui/formStyles";

type AdminSearchValue = {
  query: string;
  setQuery: (q: string) => void;
};

const AdminSearchContext = createContext<AdminSearchValue | null>(null);

/** Read the admin-shell search box value (filters users list on /admin/users). */
export function useAdminSearch(): AdminSearchValue {
  const ctx = useContext(AdminSearchContext);
  if (!ctx) return { query: "", setQuery: () => undefined };
  return ctx;
}

type NavItem = {
  to: string;
  labelKey: string;
  labelFallback: string;
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    to: "/admin/home",
    labelKey: "admin.nav.home",
    labelFallback: "Home",
    match: (p) => p === "/admin" || p === "/admin/" || p.startsWith("/admin/home"),
  },
  {
    to: "/admin/users",
    labelKey: "admin.nav.users",
    labelFallback: "Users",
    match: (p) => p.startsWith("/admin/users"),
  },
  {
    to: "/admin/moderation",
    labelKey: "admin.nav.moderation",
    labelFallback: "Moderation",
    match: (p) => p.startsWith("/admin/moderation") || p.startsWith("/admin/content"),
  },
  {
    to: "/admin/ops",
    labelKey: "admin.nav.ops",
    labelFallback: "Ops",
    match: (p) =>
      p.startsWith("/admin/ops") ||
      p.startsWith("/admin/operations") ||
      p.startsWith("/admin/xp-config"),
  },
];

function activeItem(pathname: string): NavItem | null {
  return NAV_ITEMS.find((item) => item.match(pathname)) ?? null;
}

/** Admin area layout. Redirects to login if not authenticated. */
export function AdminLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [query, setQuery] = useState("");
  const searchCtx = useMemo(() => ({ query, setQuery }), [query]);

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
    <AdminSearchContext.Provider value={searchCtx}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
        <DesktopRail />
        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <MobileRail />
          <AdminTopBar />
          <AdminBreadcrumbRow />
          <div className="min-h-0 flex-1">
            <Outlet />
          </div>
        </div>
      </div>
    </AdminSearchContext.Provider>
  );
}

function DesktopRail() {
  const { t } = useTranslation();
  return (
    <aside
      aria-label={t("admin.nav.label", "Admin sections")}
      className="hidden w-56 shrink-0 flex-col gap-1 self-start rounded-xl border border-border bg-surface p-3 lg:flex"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin/home"}
          className={({ isActive }) =>
            cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-accent-muted text-accent"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )
          }
        >
          {t(item.labelKey, item.labelFallback)}
        </NavLink>
      ))}
    </aside>
  );
}

function MobileRail() {
  const { t } = useTranslation();
  return (
    <nav
      aria-label={t("admin.nav.label", "Admin sections")}
      className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-2 lg:hidden"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin/home"}
          className={({ isActive }) =>
            cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition",
              isActive
                ? "bg-accent-muted text-accent"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )
          }
        >
          {t(item.labelKey, item.labelFallback)}
        </NavLink>
      ))}
    </nav>
  );
}

function AdminTopBar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isUsersList = pathname === "/admin/users" || pathname === "/admin/users/";
  const active = activeItem(pathname);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-bold text-text-primary">
        {active ? t(active.labelKey, active.labelFallback) : t("admin.title", "Admin")}
      </h1>
      <AdminSearchBox
        placeholder={
          isUsersList
            ? t("admin.searchUsers", "Search users…")
            : t("admin.searchPlaceholder", "Search…")
        }
      />
    </div>
  );
}

function AdminSearchBox({ placeholder }: { placeholder: string }) {
  const { query, setQuery } = useAdminSearch();
  return (
    <div className="relative w-full sm:w-72">
      <Search
        size={14}
        aria-hidden
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(inputClassName, "pl-8")}
      />
    </div>
  );
}

function AdminBreadcrumbRow() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const params = useParams<{ userId?: string }>();
  const active = activeItem(pathname);

  const crumbs: { label: string; to?: string }[] = [
    { label: t("admin.title", "Admin"), to: "/admin/home" },
  ];

  if (active && active.to !== "/admin/home") {
    crumbs.push({ label: t(active.labelKey, active.labelFallback), to: active.to });
  }

  if (pathname.startsWith("/admin/users/") && params.userId) {
    crumbs.push({ label: `@${params.userId.slice(0, 8)}…` });
  } else if (pathname.startsWith("/admin/ops/")) {
    const tail = pathname.replace("/admin/ops/", "").split("/")[0];
    if (tail) crumbs.push({ label: tail.replace(/-/g, " ") });
  } else if (pathname.startsWith("/admin/moderation/")) {
    const tail = pathname.replace("/admin/moderation/", "").split("/")[0];
    if (tail) crumbs.push({ label: tail.replace(/-/g, " ") });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav
      aria-label={t("admin.breadcrumbs", "Breadcrumbs")}
      className="flex flex-wrap items-center gap-1 text-xs text-text-muted"
    >
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={`${c.label}-${i}`} className="flex items-center gap-1">
            {c.to && !isLast ? (
              <NavLink to={c.to} className="hover:text-text-primary">
                {c.label}
              </NavLink>
            ) : (
              <span className={isLast ? "font-medium text-text-secondary" : ""}>{c.label}</span>
            )}
            {!isLast && <span aria-hidden>/</span>}
          </span>
        );
      })}
    </nav>
  );
}
