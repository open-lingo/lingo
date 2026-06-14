import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/shared/components/Icon";
import { CardPreview } from "@/features/flashcards/CardPreview";
import type { Flashcard } from "@/features/flashcards/data/types";

export type CardCarouselProps = {
  cards: Flashcard[];
  languageId?: string;
};

/**
 * CardCarousel — pages through a deck's cards using the real SRS
 * {@link CardPreview} viewer, so a browsing user sees each card exactly as it
 * appears in review (tap-to-flip front/back, particle highlighting, info
 * panel). Prev/next page controls + a "n of N" counter sit below.
 *
 * The carousel remounts the viewer per index (keyed on `card.id`) so the flip
 * state resets to the front face when you move between cards.
 */
export function CardCarousel({ cards, languageId }: CardCarouselProps) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  const clampedIndex = Math.min(index, Math.max(0, cards.length - 1));
  const card = cards[clampedIndex];

  const prev = useCallback(
    () => setIndex((i) => (i <= 0 ? cards.length - 1 : i - 1)),
    [cards.length],
  );
  const next = useCallback(
    () => setIndex((i) => (i >= cards.length - 1 ? 0 : i + 1)),
    [cards.length],
  );

  if (!card) return null;

  return (
    <div className="space-y-3">
      <CardPreview
        key={card.id}
        card={card}
        languageId={languageId}
        reviewMode="word-first"
      />

      {cards.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prev}
            aria-label={t("flashcards.previousCard", "Previous card")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
          >
            <Icon name="chevronLeft" size={18} aria-hidden />
          </button>
          <span className="text-xs tabular-nums text-text-muted" aria-live="polite">
            {t("flashcards.cardCounter", {
              defaultValue: "{{current}} of {{total}}",
              current: clampedIndex + 1,
              total: cards.length,
            })}
          </span>
          <button
            type="button"
            onClick={next}
            aria-label={t("flashcards.nextCard", "Next card")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition hover:bg-surface-muted hover:text-text-primary"
          >
            <Icon name="chevronRight" size={18} aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
