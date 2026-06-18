/**
 * AdminSidebar — persistent grouped navigation for /admin/* inner pages.
 *
 * Renders the console IA from `ADMIN_NAV_GROUPS`: a Dashboard home link on
 * top, then one labelled section per group with its destination rows.
 * Active-route matching is longest-prefix so /admin/content/decks lights up
 * the Decks row, not just the group.
 *
 * Responsive: on lg+ it's a sticky left rail. Below lg it collapses into a
 * disclosure that toggles open above the page content.
 */
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { Icon } from "@/shared/components/Icon";
import { cn } from "@/shared/components/ui/cn";
import { ADMIN_NAV_GROUPS, type AdminNavItem } from "./adminNavConfig";

function matchActive(pathname: string, items: AdminNavItem[]): string | null {
  // Longest matching `to` prefix wins (so /admin/ops/audit beats /admin/ops).
  let best: string | null = null;
  for (const item of items) {
    if (pathname === item.to || pathname.startsWith(item.to + "/")) {
      if (!best || item.to.length > best.length) best = item.to;
    }
  }
  return best;
}

function NavRow({
  item,
  active,
  count,
}: {
  item: AdminNavItem;
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition",
        active
          ? "bg-accent-muted text-accent"
          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
      )}
    >
      <Icon
        name={item.icon}
        size={16}
        aria-hidden
        className={active ? "text-accent" : "text-text-muted group-hover:text-text-primary"}
      />
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-warning">
          {count}
        </span>
      )}
    </Link>
  );
}

function NavBody({
  pathname,
  pendingReview,
}: {
  pathname: string;
  pendingReview?: number;
}) {
  return (
    <nav className="space-y-5">
      <Link
        to="/admin/home"
        aria-current={pathname === "/admin/home" ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition",
          pathname === "/admin/home"
            ? "bg-accent-muted text-accent"
            : "text-text-primary hover:bg-surface-muted",
        )}
      >
        <Icon name="layoutDashboard" size={16} aria-hidden />
        Dashboard
      </Link>

      {ADMIN_NAV_GROUPS.map((group) => {
        const activeTo = matchActive(pathname, group.items);
        return (
          <div key={group.id} className="space-y-1">
            <p className="px-2.5 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavRow
                key={item.to}
                item={item}
                active={item.to === activeTo}
                count={item.pendingKey === "pendingReview" ? pendingReview : undefined}
              />
            ))}
          </div>
        );
      })}
    </nav>
  );
}

export function AdminSidebar({ pendingReview }: { pendingReview?: number }) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop: sticky rail */}
      <aside className="hidden lg:block lg:w-56 lg:shrink-0">
        <div className="sticky top-6">
          <NavBody pathname={pathname} pendingReview={pendingReview} />
        </div>
      </aside>

      {/* Mobile: disclosure */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary"
        >
          <span className="inline-flex items-center gap-2">
            <Icon name="menu" size={16} aria-hidden />
            Admin menu
          </span>
          <Icon name={mobileOpen ? "chevronUp" : "chevronDown"} size={16} aria-hidden />
        </button>
        {mobileOpen && (
          <div
            className="mt-2 rounded-card border border-border bg-surface p-3"
            onClick={() => setMobileOpen(false)}
          >
            <NavBody pathname={pathname} pendingReview={pendingReview} />
          </div>
        )}
      </div>
    </>
  );
}
