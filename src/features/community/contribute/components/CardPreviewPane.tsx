import { useTranslation } from "react-i18next";
import type { Flashcard } from "@/features/flashcards/data/types";
import { CardPreview } from "@/features/flashcards/CardPreview";
import {
  type ReviewMode,
  REVIEW_MODES,
  REVIEW_MODE_LABELS,
} from "@/features/flashcards/reviewModes";

export function CardPreviewPane({
  selectedCard,
  cardsLength,
  languageId,
  previewReviewMode,
  onReviewModeChange,
  onAddCard,
}: {
  selectedCard: Flashcard | null;
  cardsLength: number;
  languageId: string;
  previewReviewMode: ReviewMode;
  onReviewModeChange: (mode: ReviewMode) => void;
  onAddCard: () => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="flex min-w-0 flex-1 basis-0 flex-col border-r border-border bg-background p-6">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-secondary">
          {t("community.editorLivePreview")}
        </h3>
        <select
          value={previewReviewMode}
          onChange={(e) => onReviewModeChange(e.target.value as ReviewMode)}
          className="rounded border border-border px-2 py-1 text-xs bg-surface text-text-primary"
          title={t("flashcards.reviewModeLabel")}
        >
          {REVIEW_MODES.map((m) => (
            <option key={m} value={m}>
              {t(REVIEW_MODE_LABELS[m])}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {selectedCard ? (
          <div className="w-full max-w-[640px]">
            <CardPreview
              card={selectedCard}
              languageId={languageId}
              compact={false}
              reviewMode={previewReviewMode}
              infoPosition="side"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-text-muted">
              {cardsLength === 0
                ? t("community.editorAddFirstCard")
                : t("community.editorSelectCardToPreview")}
            </p>
            {cardsLength === 0 && (
              <button
                type="button"
                onClick={onAddCard}
                className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
              >
                {t("community.editorAddFirstCard")}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
