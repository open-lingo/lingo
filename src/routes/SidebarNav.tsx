import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { useNavDestinations } from "@/shared/nav/useNavDestinations";
import { makePrefetchHandlers } from "@/shared/utils/routePrefetch";
import { LanguageSelector } from "@/shared/components/LanguageSelector";
import { AuthMenu } from "@/shared/components/AuthMenu";
import { LingotBalance } from "@/shared/components/LingotBalance";
import { SyncManagerTrigger } from "@/features/sync/SyncManagerTrigger";
import { useAuth } from "@/shared/auth/useAuth";

/**
 * Desktop (≥lg) left rail — the "sidebar" nav layout. Shares destinations
 * with the top bar via useNavDestinations so the two never diverge. Hidden
 * below lg; mobile keeps the top-bar header + hamburger regardless of layout
 * setting (see Layout.tsx). Fixed-position; Layout pads the page `lg:pl-60`.
 */
export function SidebarNav() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const dests = useNavDestinations();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
        <span
          className="inline-block h-7 w-7 shrink-0 bg-current"
          style={{
            maskImage: "url('/icon.ico')",
            WebkitMaskImage: "url('/icon.ico')",
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
          aria-hidden
        />
        <Link
          to={isAuthenticated ? "/home" : "/landing"}
          className="text-lg font-semibold text-text-primary"
        >
          {t("nav.siteName")}
        </Link>
      </div>

      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-4"
        aria-label={t("nav.primaryLabel", "Primary navigation")}
      >
        {dests.map((d) => (
          <Link
            key={d.key}
            to={d.to}
            {...(d.prefetch ? makePrefetchHandlers(d.prefetch) : {})}
            aria-current={d.active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              d.active
                ? "bg-accent-muted font-semibold text-text-primary"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
            }`}
          >
            <Icon name={d.icon} size={18} aria-hidden />
            <span className="flex-1 truncate">{d.label}</span>
            {d.badge ? (
              <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                {d.badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      {isAuthenticated ? (
        <div className="shrink-0 space-y-2 border-t border-border px-3 py-3">
          <div className="flex items-center gap-2">
            <LingotBalance />
            <LanguageSelector />
          </div>
          <div className="flex items-center gap-2">
            <SyncManagerTrigger />
            <span className="ml-auto">
              <AuthMenu />
            </span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
