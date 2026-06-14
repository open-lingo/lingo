import { useState, useRef, useEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

/**
 * Floating learning-language switcher anchored bottom-left, out of the top
 * bar so the chrome stays short. Menu opens UPWARD (drop-up) since the pill
 * sits at the viewport bottom — never renders off-screen. Used in top-bar
 * layout (and mobile sidebar layout); the desktop sidebar keeps its own
 * inline language selector, so this hides at lg there.
 */
export function FloatingLanguagePill({ className = "" }: { className?: string }) {
  const { language, languages, setLanguage, isLoading } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  if (isLoading || !language) return null;

  return (
    <div
      ref={ref}
      className={`fixed bottom-4 left-3 z-30 sm:left-4 ${className}`}
    >
      {open && (
        <ul
          className="absolute bottom-full left-0 mb-2 max-h-72 w-56 overflow-auto rounded-xl border border-border bg-surface py-1 shadow-popover"
          role="listbox"
        >
          {languages.map((lang) => (
            <li key={lang.id} role="option" aria-selected={language.id === lang.id}>
              <button
                type="button"
                onClick={() => {
                  setLanguage(lang);
                  setOpen(false);
                  const match = pathname.match(/^\/([^/]+)(\/.*)?$/);
                  if (match && AVAILABLE_LEARNING_LANGUAGE_IDS.includes(match[1] as any)) {
                    navigate(`/${lang.id}${match[2] ?? ""}`);
                  }
                }}
                className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-muted"
              >
                <span className="text-xl leading-none" aria-hidden>
                  {lang.flag}
                </span>
                <span>{lang.name}</span>
                {language.id === lang.id && (
                  <Icon name="check" size={12} className="ml-auto text-text-muted" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-primary shadow-popover transition hover:bg-surface-muted"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select learning language"
      >
        <span className="text-lg leading-none" aria-hidden>
          {language.flag}
        </span>
        <span className="hidden sm:inline">{language.name}</span>
        <Icon name="chevronUp" size={14} className="text-text-muted" />
      </button>
    </div>
  );
}
