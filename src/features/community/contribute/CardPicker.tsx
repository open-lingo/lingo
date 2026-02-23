import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { DeckCard } from "@/shared/api/decks";

type CardPickerProps = {
  cards: DeckCard[];
  selectedText: string;
  onPick: (cardId: string, displayText: string) => void;
  onCreateNew: (initialFront: string) => void;
  onClose?: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
};

export function CardPicker({
  cards,
  selectedText,
  onPick,
  onCreateNew,
}: CardPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return cards;
    const q = search.trim().toLowerCase();
    return cards.filter(
      (c) =>
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.note ?? "").toLowerCase().includes(q)
    );
  }, [cards, search]);

  return (
    <div
      className="absolute z-50 w-72 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
      role="dialog"
      aria-label={t("community.storyEditorCardPicker", "Link to card")}
    >
      <div className="border-b border-gray-200 p-2 dark:border-gray-700">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("community.storyEditorSearchCards", "Search cards…")}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          autoFocus
        />
      </div>
      <div className="max-h-64 overflow-y-auto p-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
            {cards.length === 0
              ? t("community.storyEditorNoCardsInDeck", "No cards in deck yet.")
              : t("community.storyEditorNoMatchingCards", "No matching cards.")}
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((card) => (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => onPick(card.id, selectedText || card.front)}
                  className="w-full rounded px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{card.front}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">{card.back}</span>
                  <span className="ml-2 rounded bg-gray-200 px-1 text-xs dark:bg-gray-600">
                    {card.type}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="border-t border-gray-200 p-2 dark:border-gray-700">
        <button
          type="button"
          onClick={() => onCreateNew(selectedText)}
          className="w-full rounded border border-dashed border-gray-300 py-2 text-sm font-medium text-green-600 hover:border-green-400 hover:bg-green-50 dark:border-gray-600 dark:text-green-400 dark:hover:border-green-600 dark:hover:bg-green-900/20"
        >
          + {t("community.storyEditorCreateNewCard", "Create new card")}
        </button>
      </div>
    </div>
  );
}
