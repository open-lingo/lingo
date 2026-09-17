import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/components/ui/cn";
import type { Language } from "@/shared/domain/languages";
import {
  SETTINGS_GLOBAL_SECTIONS,
  type SettingsGlobalSectionId,
  type SettingsSectionId,
  isLanguageSectionId,
} from "./settingsSections";

function Chevron({ collapsed }: { collapsed: boolean }) {
  return (
    <svg
      className={cn(
        "h-3.5 w-3.5 shrink-0 transition-transform",
        collapsed && "-rotate-90",
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GLOBAL_LABEL_KEYS: Record<SettingsGlobalSectionId, string> = {
  general: "settings.nav.general",
  appearance: "settings.nav.appearance",
  accessibility: "settings.accessibility",
  notifications: "settings.notifications",
  privacy: "legal.settings.privacyTitle",
  "more-info": "settings.nav.moreInfo",
};

type SettingsNavProps = {
  activeSection: SettingsSectionId;
  onSectionChange: (id: SettingsSectionId) => void;
  languages: Language[];
};

export function SettingsNav({
  activeSection,
  onSectionChange,
  languages,
}: SettingsNavProps) {
  const { t } = useTranslation();
  const [languagesExpanded, setLanguagesExpanded] = useState(true);

  const languagesActive = isLanguageSectionId(activeSection);

  const tabScrollRef = useRef<HTMLElement>(null);
  const [tabScrolled, setTabScrolled] = useState(false);
  const [tabAtEnd, setTabAtEnd] = useState(false);
  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setTabScrolled(el.scrollLeft > 4);
      setTabAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    // Font-scale (85–140%, `settings.a11y.fontScale`) widens every label —
    // a scroll-length check taken once at mount goes stale the moment the
    // slider moves, which is exactly the surface being audited here.
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, []);

  return (
    <>
      {/* Mobile (<sm): horizontal scrolling tab strip so the user doesn't
          scroll past the whole nav to reach a section. Sections are flattened
          (global + per-language) into one touch-friendly carousel. An
          edge-fade mask (below) substitutes for the native scrollbar, which
          is hidden app-wide on touch — it reads as 'more content this way'. */}
      <div className="relative shrink-0 sm:hidden">
      {/* The edge-fade masks below are `w-6` (1.5rem); the scroll
          container's own inline padding must be AT LEAST as wide, or the
          fade paints over real label text instead of empty padding — at
          the 140% font-scale ceiling the trailing `w-6` fade landed 12px
          into "Accessibility"'s own glyphs (px-3 = 0.75rem was half the
          fade's width), reading as a hard clip. `px-6`/`scroll-px-6` keep
          the fade inside the gutter at every scale; the row was already
          reachable (`overflow-x-auto`, real touch scroll) — this fixes
          what it LOOKS like, not what it does. */}
      <nav
        ref={tabScrollRef}
        className="no-scrollbar flex gap-1.5 overflow-x-auto whitespace-nowrap scroll-px-6 border-b border-border px-6 py-2"
        aria-label={t("settings.nav.label", "Settings sections")}
      >
        {SETTINGS_GLOBAL_SECTIONS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            className={cn(
              "flex min-h-[44px] shrink-0 items-center rounded-full px-3.5 text-sm font-medium transition",
              activeSection === id
                ? "bg-accent-muted text-accent"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )}
            aria-current={activeSection === id ? "true" : undefined}
          >
            {t(GLOBAL_LABEL_KEYS[id])}
          </button>
        ))}
        {languages.map((lang) => {
          const sectionId = `lang-${lang.id}` as const;
          return (
            <button
              key={lang.id}
              type="button"
              onClick={() => onSectionChange(sectionId)}
              className={cn(
                "flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition",
                activeSection === sectionId
                  ? "bg-accent-muted text-accent"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
              )}
              aria-current={activeSection === sectionId ? "true" : undefined}
            >
              <span aria-hidden>{lang.flag}</span>
              {lang.name}
            </button>
          );
        })}
      </nav>
        {tabScrolled && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-surface to-transparent"
          />
        )}
        {!tabAtEnd && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-surface to-transparent"
          />
        )}
      </div>

      {/* Desktop (sm+): vertical rail with collapsible language group. */}
      <nav
        className="hidden min-h-0 shrink-0 flex-col gap-0.5 overflow-y-auto px-3 py-4 sm:flex sm:w-52 sm:border-r sm:border-border"
        aria-label={t("settings.nav.label", "Settings sections")}
      >
      {SETTINGS_GLOBAL_SECTIONS.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onSectionChange(id)}
          className={cn(
            "rounded-lg px-3 py-2 text-left text-sm font-medium transition",
            activeSection === id
              ? "bg-accent-muted text-accent"
              : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
          )}
          aria-current={activeSection === id ? "true" : undefined}
        >
          {t(GLOBAL_LABEL_KEYS[id])}
        </button>
      ))}

      <div className="mt-2 border-t border-border/60 pt-2">
        <button
          type="button"
          onClick={() => setLanguagesExpanded((v) => !v)}
          className={cn(
            "flex w-full items-center gap-1.5 rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide transition",
            languagesActive
              ? "text-accent"
              : "text-text-muted hover:bg-surface-muted hover:text-text-primary",
          )}
          aria-expanded={languagesExpanded}
        >
          <Chevron collapsed={!languagesExpanded} />
          <span className="min-w-0 flex-1 truncate">
            {t("settings.nav.languages", "Languages")}
          </span>
        </button>
        {languagesExpanded && (
          <ul className="mt-0.5 space-y-0.5 pl-2">
            {languages.map((lang) => {
              const sectionId = `lang-${lang.id}` as const;
              return (
                <li key={lang.id}>
                  <button
                    type="button"
                    onClick={() => onSectionChange(sectionId)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                      activeSection === sectionId
                        ? "bg-accent-muted font-medium text-accent"
                        : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                    )}
                    aria-current={
                      activeSection === sectionId ? "true" : undefined
                    }
                  >
                    <span aria-hidden>{lang.flag}</span>
                    <span className="truncate">{lang.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      </nav>
    </>
  );
}
