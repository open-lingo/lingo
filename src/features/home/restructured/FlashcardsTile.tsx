import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card } from "@/shared/components/ui";
import { Icon } from "@/shared/components/Icon";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useCardsDueCount } from "@/features/flashcards/useCardsDueCount";
import { useFlashcardDueSummary } from "@/features/flashcards/useFlashcardDueSummary";
import { CardFront } from "@/features/flashcards/components/CardFront";

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
  const allCaughtUp = !isLoading && cardsDue === 0;

  return (
    <Card padding="sm" className="h-full">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            allCaughtUp
              ? "bg-success/10 text-success"
              : "bg-accent-muted text-accent"
          }`}
        >
          <Icon
            name={allCaughtUp ? "sparkles" : "decks"}
            size={20}
            aria-hidden
          />
        </span>
        {cardsDue > 0 ? (
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warning">
            {t("home.restructured.flashcards.duePill", { defaultValue: "Due" })}
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-sm font-medium text-text-secondary">
        {t("home.restructured.flashcards.label", { defaultValue: "Flashcards" })}
      </p>
      {allCaughtUp ? (
        <>
          <p className="text-2xl font-bold text-text-primary leading-tight">
            {t("home.restructured.flashcards.allCaughtUp", {
              defaultValue: "All caught up!",
            })}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {t("learn.flashcardsZeroDue", { defaultValue: "0 cards due today" })}
          </p>
        </>
      ) : (
        <p
          className="text-3xl font-bold text-text-primary leading-none"
          aria-busy={isLoading}
        >
          {isLoading ? "…" : cardsDue}
          <span className="ml-1 text-sm font-medium text-text-secondary">
            {t("home.restructured.flashcards.cardsSuffix", {
              defaultValue: "cards",
            })}
          </span>
        </p>
      )}
      {previewCards.length > 0 ? (
        <div className="mt-2 flex items-center gap-1.5">
          {previewCards.map((card) => (
            <span
              key={card.id}
              title={card.front}
              className="flex h-7 min-w-7 max-w-[6rem] items-center justify-center truncate rounded-md border border-border bg-surface-muted px-1.5 text-sm font-bold text-text-primary"
            >
              <CardFront text={card.front} reading={card.reading} cardId={card.id} />
            </span>
          ))}
          {previewOverflow > 0 ? (
            <span className="text-xs text-text-muted">+{previewOverflow}</span>
          ) : null}
        </div>
      ) : null}
      <Link
        to={langPath(cardsDue > 0 ? "practice/flashcards/review" : "practice/flashcards")}
        className={`mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
          allCaughtUp
            ? "border border-border bg-surface text-text-secondary hover:border-accent/40 hover:text-text-primary"
            : "bg-accent text-accent-foreground hover:bg-accent-hover"
        }`}
      >
        {cardsDue > 0
          ? t("home.restructured.flashcards.reviewCta", { defaultValue: "Review now" })
          : t("home.restructured.flashcards.openCta", { defaultValue: "Open flashcards" })}
        <Icon name="chevronRight" size={16} aria-hidden />
      </Link>
    </Card>
  );
}
