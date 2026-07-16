import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { ModalBase } from "@/shared/components/ModalBase";
import { useNavDestinations } from "@/shared/nav/useNavDestinations";
import { makePrefetchHandlers } from "@/shared/utils/routePrefetch";
import { useAuth } from "@/shared/auth/useAuth";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";
import { LanguagePickerGrid } from "@/features/home/LanguagePickerGrid";
import type { Language } from "@/shared/domain/languages";

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
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
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
        <div className="shrink-0 border-t border-border px-3 py-3">
          {/* Language switching lives behind a single icon here — the old
              inline dropdown crowded the rail. Lingots / sync / profile live
              in the floating bottom-right cluster (see Layout). */}
          <SidebarLanguageButton />
        </div>
      ) : null}
    </aside>
  );
}

/**
 * Compact language affordance for the rail footer: a globe icon button that
 * opens the flag-grid picker (same surface as first-launch / landing) as a
 * modal. Selecting a language mirrors LanguageSelector's behavior — persist
 * the choice, then rewrite the current URL's :lang segment so the page you're
 * on follows you to the new course.
 */
function SidebarLanguageButton() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  if (!language) return null;

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setOpen(false);
    const match = pathname.match(/^\/([^/]+)(\/.*)?$/);
    if (
      match &&
      (AVAILABLE_LEARNING_LANGUAGE_IDS as readonly string[]).includes(match[1])
    ) {
      navigate(`/${lang.id}${match[2] ?? ""}`);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
        aria-haspopup="dialog"
        aria-label={t("nav.switchLanguage", "Switch language")}
        title={t("nav.switchLanguage", "Switch language")}
      >
        <Icon name="globe" size={18} aria-hidden />
      </button>
      {open ? (
        <ModalBase
          onClose={() => setOpen(false)}
          title={t("nav.switchLanguage", "Switch language")}
          maxWidth="max-w-2xl"
        >
          <div className="px-6 py-6">
            <LanguagePickerGrid
              onSelect={handleSelect}
              selectedId={language.id}
              headline={t("nav.switchLanguageHeadline", "Your courses")}
              subhead={t(
                "nav.switchLanguageSubhead",
                "Jump to another language — progress is saved per course.",
              )}
            />
          </div>
        </ModalBase>
      ) : null}
    </>
  );
}
