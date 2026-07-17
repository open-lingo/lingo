/**
 * useDeckCards — local card-list state + CRUD for the DeckEditor.
 *
 * Owns the `cards` array and the `selectedIndex` cursor, plus add / update /
 * delete / duplicate / move / drag-reorder. Every mutation calls `markDirty`
 * so the shell can drive its unsaved-changes flag. `setCards` / `setSelectedIndex`
 * are exposed so the deck-load seed effect can hydrate this state directly.
 */

import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Flashcard } from "@/features/flashcards/data/types";
import { EMPTY_CARD, generateId } from "./_deckEditorHelpers";

export interface DeckCardsController {
  cards: Flashcard[];
  setCards: Dispatch<SetStateAction<Flashcard[]>>;
  selectedIndex: number | null;
  setSelectedIndex: Dispatch<SetStateAction<number | null>>;
  selectedCard: Flashcard | null;
  /** True when any card has a blank front — blocks deck-level save. */
  hasInvalidCards: boolean;
  addCard: () => void;
  updateCard: (index: number, updates: Partial<Flashcard>) => void;
  deleteCard: (index: number) => void;
  duplicateCard: (index: number) => void;
  moveCard: (from: number, dir: number) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useDeckCards(markDirty: () => void): DeckCardsController {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedCard = selectedIndex != null ? cards[selectedIndex] : null;

  const hasInvalidCards = useMemo(
    () => cards.some((c) => !c.front.trim()),
    [cards],
  );

  const addCard = useCallback(() => {
    const newCard: Flashcard = { ...EMPTY_CARD, id: generateId() };
    setCards((prev) => [...prev, newCard]);
    setSelectedIndex(cards.length);
    markDirty();
  }, [cards.length, markDirty]);

  const updateCard = useCallback(
    (index: number, updates: Partial<Flashcard>) => {
      setCards((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], ...updates };
        return next;
      });
      markDirty();
    },
    [markDirty],
  );

  const deleteCard = useCallback(
    (index: number) => {
      setCards((prev) => prev.filter((_, i) => i !== index));
      setSelectedIndex((prev) => {
        if (prev == null) return null;
        if (prev === index) return null;
        if (prev > index) return prev - 1;
        return prev;
      });
      markDirty();
    },
    [markDirty],
  );

  const duplicateCard = useCallback(
    (index: number) => {
      const card = cards[index];
      const newCard: Flashcard = { ...card, id: generateId() };
      setCards((prev) => {
        const next = [...prev];
        next.splice(index + 1, 0, newCard);
        return next;
      });
      setSelectedIndex(index + 1);
      markDirty();
    },
    [cards, markDirty],
  );

  const moveCard = useCallback(
    (from: number, dir: number) => {
      const to = from + dir;
      if (to < 0 || to >= cards.length) return;
      setCards((prev) => {
        const next = [...prev];
        [next[from], next[to]] = [next[to], next[from]];
        return next;
      });
      setSelectedIndex(to);
      markDirty();
    },
    [cards.length, markDirty],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = cards.findIndex((c) => c.id === active.id);
      const newIndex = cards.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      setCards((prev) => arrayMove(prev, oldIndex, newIndex));
      setSelectedIndex(newIndex);
      markDirty();
    },
    [cards, markDirty],
  );

  return {
    cards,
    setCards,
    selectedIndex,
    setSelectedIndex,
    selectedCard,
    hasInvalidCards,
    addCard,
    updateCard,
    deleteCard,
    duplicateCard,
    moveCard,
    handleDragEnd,
  };
}
