import { useState, useRef, useEffect } from "react";
import { Icon } from "@/shared/components/Icon";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";

const OPTIONS = [
  { to: "practice/flashcards", query: "", labelKey: "home.cards.flashcardsOptionAll" },
  { to: "practice/flashcards", query: "?mode=vocab", labelKey: "home.cards.flashcardsOptionVocab" },
  { to: "practice/flashcards", query: "?mode=sentences", labelKey: "home.cards.flashcardsOptionSentences" },
] as const;

export function FlashcardsCard() {
  const { t } = useTranslation();
  const langPath = useLangPath();
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
        <span className="mb-3 flex shrink-0 items-center justify-center" aria-hidden>
          <Icon name="graduationCap" size={36} />
        </span>
        <h2 className="text-lg font-semibold text-text-primary">
          {t("home.cards.flashcards")}
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          {t("home.cards.flashcardsDesc")}
        </p>
        <span className="mt-2 inline-flex items-center text-xs text-text-muted">
          {t("home.cards.flashcardsChoose")}
          <Chevron className={`ml-1 h-4 w-4 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <ul className="absolute left-0 right-0 top-full z-10 mt-1 min-w-[200px] rounded-lg border border-border bg-surface py-1 shadow-popover">
          {OPTIONS.map((opt) => (
            <li key={opt.labelKey}>
              <Link
                to={langPath(opt.to) + opt.query}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-muted"
                onClick={() => setOpen(false)}
              >
                {t(opt.labelKey)}
              </Link>
            </li>
          ))}
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
