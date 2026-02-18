import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";
import { getPracticeItemsForLanguage } from "./practiceNavItems";

export function PracticeCard() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const items = getPracticeItemsForLanguage(language?.id);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group flex flex-1 flex-col rounded-xl border border-gray-200 bg-white p-6 text-left transition hover:border-gray-300 hover:shadow dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600 dark:hover:shadow-md"
      >
        <span className="mb-3 text-3xl" aria-hidden>
          🏋️
        </span>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t("home.cards.gym")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          {t("home.cards.gymDesc")}
        </p>
        <span className="mt-2 inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
          {t("home.cards.chooseType")}
          <Chevron className={`ml-1 h-4 w-4 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 min-w-[220px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          {items.map((item) => {
            const label = item.labelKey ? t(item.labelKey) : (item.label ?? "");
            return (
              <li key={item.to + (item.label ?? "")}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                  onClick={() => setOpen(false)}
                >
                  {item.sampleCharacter && (
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 text-lg dark:border-gray-600"
                      aria-hidden
                    >
                      {item.sampleCharacter}
                    </span>
                  )}
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
