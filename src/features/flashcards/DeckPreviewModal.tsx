import { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLangPath } from "@/shared/hooks/useLangPath";
import { getLanguageConfig } from "@/shared/domain/languageConfig";
import type { Flashcard, FlashcardDeck } from "@/features/flashcards/data/types";
import type { CommunityAddon } from "@/features/community/types";

function cardMatchesSearch(card: Flashcard, q: string): boolean {
  const trimmed = q.trim();
  if (!trimmed) return true;
  const searchable = [
    card.front,
    card.back,
    card.note,
    card.reasoning,
    card.type === "other" ? card.definition : undefined,
    card.type === "other" ? card.context : undefined,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const words = trimmed.toLowerCase().split(/\s+/);
  return words.every((word) => searchable.includes(word));
}

type DeckPreviewModalProps = {
  deck: FlashcardDeck | null;
  addon: CommunityAddon | null;
  onClose: () => void;
};

export function DeckPreviewModal({ deck, addon, onClose }: DeckPreviewModalProps) {
  const { t } = useTranslation();
  const langPath = useLangPath();
  const [search, setSearch] = useState("");

  const reviewHref = langPath("practice/flashcards/review");
  const hasCards = deck != null && deck.cards.length > 0;

  const filteredCards = useMemo(() => {
    if (!deck?.cards) return [];
    if (!search.trim()) return deck.cards;
    return deck.cards.filter((c) => cardMatchesSearch(c, search));
  }, [deck?.cards, search]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const title = deck?.name ?? addon?.name ?? "";
  const description = addon?.description ?? deck?.languageId
    ? getLanguageConfig(deck!.languageId)?.name ?? ""
    : "";
  const cardCount = deck?.cards.length ?? addon?.itemCount ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-preview-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div className="min-w-0 flex-1">
            <h2
              id="deck-preview-title"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {cardCount} {t("flashcards.cards")}
              {addon && description && ` · ${description}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label={t("flashcards.close")}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {hasCards ? (
          <>
            <div className="border-b border-gray-200 px-6 py-3 dark:border-gray-700">
              <label htmlFor="deck-preview-search" className="sr-only">
                {t("flashcards.searchPlaceholder")}
              </label>
              <input
                id="deck-preview-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("flashcards.searchPlaceholder")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredCards.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  {t("flashcards.searchNoResults")}
                </p>
              ) : (
                <ul className="space-y-2" role="list">
                  {filteredCards.map((card) => (
                    <li
                      key={card.id}
                      className="rounded-lg border border-gray-200 bg-gray-50 py-3 px-4 dark:border-gray-600 dark:bg-gray-700/50"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {card.front}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
                        {card.back}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 px-6 py-6">
            {addon?.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {addon.description}
              </p>
            )}
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              {t("flashcards.previewNoCards")}
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {t("flashcards.close")}
          </button>
          <Link
            to={reviewHref}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600"
          >
            {t("flashcards.startReview")}
          </Link>
        </div>
      </div>
    </div>
  );
}
