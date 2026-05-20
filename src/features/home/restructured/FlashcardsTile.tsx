import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";
import { useFlashcardDueSummary } from "@/features/flashcards/useFlashcardDueSummary";

const PREVIEW_LIMIT = 3;

export function FlashcardsTile() {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const { language } = useLanguage();
  const langId = language?.id ?? "ko";
  const { count: cardsDue, isLoading } = useCardsDueCount(langId);
  const { dueQueue } = useFlashcardDueSummary(langId);

  const previewCards = dueQueue.slice(0, PREVIEW_LIMIT);
  const previewOverflow = Math.max(0, cardsDue - previewCards.length);

  return (
    <Card padding="md" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
          <Icon name="decks" size={22} aria-hidden />
        </span>
        {cardsDue > 0 ? (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
            {t("home.restructured.flashcards.duePill", { defaultValue: "Due" })}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm font-medium text-text-secondary">
        {t("home.restructured.flashcards.label", { defaultValue: "Flashcards" })}
      </p>
      <p
        className="text-3xl font-extrabold text-text-primary leading-none"
        aria-busy={isLoading}
      >
        {isLoading ? "…" : cardsDue}
        <span className="ml-1 text-sm font-medium text-text-secondary">
          {t("home.restructured.flashcards.cardsSuffix", { defaultValue: "cards" })}
        </span>
      </p>
      {previewCards.length > 0 ? (
        <div className="mt-3 flex items-center gap-1.5">
          {previewCards.map((card) => (
            <span
              key={card.id}
              title={card.front}
              className="flex h-7 min-w-7 max-w-[6rem] items-center justify-center truncate rounded-md border border-border bg-surface-muted px-1.5 text-sm font-bold text-text-primary"
            >
              {card.front}
            </span>
          ))}
          {previewOverflow > 0 ? (
            <span className="text-xs text-text-muted">+{previewOverflow}</span>
          ) : null}
        </div>
      ) : null}
      <Link
        to={langPath(cardsDue > 0 ? "practice/flashcards/review" : "practice/flashcards")}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
      >
        {cardsDue > 0
          ? t("home.restructured.flashcards.reviewCta", { defaultValue: "Review now" })
          : t("home.restructured.flashcards.openCta", { defaultValue: "Open flashcards" })}
        <Icon name="chevronRight" size={16} aria-hidden />
      </Link>
    </Card>
  );
}
