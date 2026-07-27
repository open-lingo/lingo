import { useState } from "react";
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

  return (
    <>
      {/* Mobile (<sm): horizontal scrolling tab strip so the user doesn't
          scroll past the whole nav to reach a section. Sections are flattened
          (global + per-language) into one touch-friendly carousel. */}
      <nav
        className="no-scrollbar flex shrink-0 gap-1.5 overflow-x-auto whitespace-nowrap border-b border-border px-3 py-2 sm:hidden"
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
