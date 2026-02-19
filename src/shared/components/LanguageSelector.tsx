import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

export function LanguageSelector() {
  const { language, languages, setLanguage, isLoading } = useLanguage();
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
      <div className="h-9 w-14 animate-pulse rounded-lg bg-gray-600 dark:bg-gray-600" aria-hidden />
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        <span className="text-lg leading-none" aria-hidden>
          {language.flag}
        </span>
        <span className="hidden sm:inline">{language.name}</span>
        <ChevronIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </button>

      {open && (
        <ul
          className="absolute right-0 top-full z-50 mt-2 max-h-64 w-56 overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
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
                    const rest = match[2] ?? "";
                    navigate(`/${lang.id}${rest}`);
                  }
                }}
                className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <span>{lang.name}</span>
                {language.id === lang.id && (
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
