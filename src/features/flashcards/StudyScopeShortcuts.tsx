import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useSettings } from "@/shared/contexts/SettingsContext";

/** Quick links to SRS review with URL filters (all / vocab / lesson decks / saved study options). */
export function StudyScopeShortcuts({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { settings } = useSettings();
  const base = langPath("practice/flashcards/review");
  const opts = settings.flashcards?.studyOptions ?? [];

  const chip =
    "inline-flex items-center rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-text-secondary transition hover:border-accent hover:bg-surface-muted hover:text-text-primary";
  const chipSm =
    "inline-flex items-center rounded-md border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-text-secondary transition hover:border-accent hover:bg-surface-muted hover:text-text-primary";

  const c = compact ? chipSm : chip;

  return (
    <div
      className={compact ? "flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}
      aria-label={t("flashcards.studyShortcuts.label", "Study scopes")}
    >
      <Link to={base} className={c}>
        {t("flashcards.studyShortcuts.all", "All subscribed")}
      </Link>
      <Link to={`${base}?scope=vocab`} className={c}>
        {t("flashcards.studyShortcuts.vocab", "My vocabulary")}
      </Link>
      <Link to={`${base}?scope=lessons`} className={c}>
        {t("flashcards.studyShortcuts.lessons", "Lesson decks")}
      </Link>
      {opts.map((o) => (
        <Link
          key={o.id}
          to={`${base}?studyOption=${encodeURIComponent(o.id)}`}
          className={c}
        >
          {o.name}
        </Link>
      ))}
    </div>
  );
}

export default StudyScopeShortcuts;
