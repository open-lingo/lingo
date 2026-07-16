import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useFeatureFlags } from "@/shared/contexts/FeatureFlagsContext";
import { isCommunityEnabled } from "@/shared/config/featureFlags";

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
  draft: "bg-surface-muted text-text-secondary",
  submitted: "bg-info/15 text-info",
  review: "bg-warning/15 text-warning",
  published: "bg-success/15 text-success",
  changes_requested: "bg-warning/15 text-warning",
  rejected: "bg-destructive/15 text-destructive",
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
  const flags = useFeatureFlags();

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-3">
        {isCommunityEnabled(flags) ? (
          <>
            <Link
              to={langPath("community/library?tab=mine")}
              className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
              title={t("studio.headerBackToMyDecks", "Back to My Decks")}
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("studio.headerBackToMyDecks", "Back to My Decks")}
              </span>
            </Link>
            <span className="text-border">|</span>
          </>
        ) : null}
        <div className="flex items-center gap-2">
          {nameInput ?? (
            <span className="text-base font-medium text-text-primary">
              {deckName || t("community.contributeNamePlaceholder")}
            </span>
          )}
          {onToggleDeckSettings && (
            <button
              type="button"
              onClick={onToggleDeckSettings}
              className="rounded p-1.5 text-text-muted hover:bg-surface-muted hover:text-text-secondary"
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
          <span className="text-xs text-warning">
            {t("community.editorUnsavedChanges")}
          </span>
        )}
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={saving || !canSave}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted disabled:opacity-50"
        >
          {saving ? t("community.editorSaving") : t("community.editorSaveDraft")}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || !canSubmit}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
        >
          {t("community.contributeSubmit")}
        </button>
      </div>
    </div>
  );
}
