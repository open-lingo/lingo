import { useState, useRef, useEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useVisibleLearningLanguageIds } from "@/shared/hooks/useVisibleLearningLanguageIds";

export function LanguageSelector({ dropUp = false }: { dropUp?: boolean } = {}) {
  const { language, languages, setLanguage, isLoading } = useLanguage();
  // Same seam `languages` above is already filtered by — see
  // useVisibleLearningLanguageIds.ts's header — reused here for the
  // "was the OLD path segment a visible learning language" URL-rewrite
  // guard below (not just the "which options render" question `languages`
  // answers).
  const visibleIds = useVisibleLearningLanguageIds();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  if (isLoading || !language) {
    return (
      <div className="h-9 w-14 motion-safe:animate-pulse rounded-lg bg-surface-elevated" aria-hidden />
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-9 items-center gap-1.5 rounded-lg border border-border px-2 py-1 text-sm font-medium text-text-primary transition hover:bg-surface-muted sm:gap-2 sm:px-3 sm:py-2"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span className="text-lg leading-none" aria-hidden>
          {language.flag}
        </span>
        <span className="hidden sm:inline">{language.name}</span>
        <Icon name="chevronDown" size={16} className="text-text-muted" />
      </button>

      {open && (
        <ul
          className={`absolute left-0 z-50 max-h-64 w-56 overflow-auto rounded-lg border border-border bg-surface py-1 shadow-popover ${
            dropUp ? "bottom-full mb-2" : "right-0 left-auto top-full mt-2"
          }`}
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
                  if (match && visibleIds.includes(match[1])) {
                    const rest = match[2] ?? "";
                    navigate(`/${lang.id}${rest}`);
                  }
                }}
                className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2 text-left text-sm text-text-primary hover:bg-surface-muted"
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span>{lang.name}</span>
                {language.id === lang.id && (
                  <Icon name="check" size={12} className="ml-auto text-text-muted" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
