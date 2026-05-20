import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export type StudioHeaderProps = {
  deckName: string;
  status?: "draft" | "published" | "submitted" | "review" | "changes_requested" | "rejected";
  hasUnsavedChanges: boolean;
  saving: boolean;
  canSave: boolean;
  canSubmit: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
  onToggleDeckSettings?: () => void;
  showDeckSettings?: boolean;
  nameInput?: React.ReactNode;
};

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  published: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  changes_requested: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
};

export function StudioHeader({
  deckName,
  status = "draft",
  hasUnsavedChanges,
  saving,
  canSave,
  canSubmit,
  onSaveDraft,
  onSubmit,
  onToggleDeckSettings,
  nameInput,
}: StudioHeaderProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        <Link
          to={langPath("community/decks/mine")}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
          title={t("studio.headerBackToMyDecks", "Back to My Decks")}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">
            {t("studio.headerBackToMyDecks", "Back to My Decks")}
          </span>
        </Link>
        <span className="text-border">|</span>
        <div className="flex items-center gap-2">
          {nameInput ?? (
            <span className="text-base font-medium text-gray-900 dark:text-white">
              {deckName || t("community.contributeNamePlaceholder")}
            </span>
          )}
          {onToggleDeckSettings && (
            <button
              type="button"
              onClick={onToggleDeckSettings}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300"
              aria-label="Deck settings"
            >
              ⋮
            </button>
          )}
        </div>
        <span
          className={`rounded px-2 py-0.5 text-xs font-medium ${
            STATUS_STYLES[status] ?? STATUS_STYLES.draft
          }`}
        >
          {t(`community.status.${status}`)}
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {hasUnsavedChanges && (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {t("community.editorUnsavedChanges")}
          </span>
        )}
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={saving || !canSave}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {saving ? t("community.editorSaving") : t("community.editorSaveDraft")}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || !canSubmit}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
        >
          {t("community.contributeSubmit")}
        </button>
      </div>
    </div>
  );
}
