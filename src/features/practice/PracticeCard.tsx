import { useState, useRef, useEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/shared/contexts/LanguageContext";
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
        className="group flex flex-1 flex-col rounded-xl border border-border bg-surface p-6 text-left shadow-card transition hover:shadow-md"
      >
        <span className="mb-3 flex h-9 w-9 items-center justify-center" aria-hidden>
          <Icon name="dumbbell" size={36} />
        </span>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("home.cards.gym")}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t("home.cards.gymDesc")}
        </p>
        <span className="mt-2 inline-flex items-center text-xs text-text-muted">
          {t("home.cards.chooseType")}
          <Chevron className={`ml-1 h-4 w-4 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 min-w-[220px] rounded-lg border border-border bg-surface py-1 shadow-popover">
          {items.map((item) => {
            const label = item.labelKey ? t(item.labelKey) : (item.label ?? "");
            return (
              <li key={item.to + (item.label ?? "")}>
                <Link
                  to={item.to}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-muted"
                  onClick={() => setOpen(false)}
                >
                  {item.iconName && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center" aria-hidden>
                      <Icon name={item.iconName} size={20} />
                    </span>
                  )}
                  {!item.iconName && item.sampleCharacter && (
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center text-lg" aria-hidden>
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
