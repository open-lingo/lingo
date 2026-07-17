import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Flashcard } from "@/features/flashcards/data/types";
import { SortableCardItem } from "./SortableCardItem";

export function CardNavigator({
  cards,
  filteredCards,
  selectedIndex,
  hasUnsavedChanges,
  cardSearch,
  onCardSearchChange,
  onAddCard,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onDragEnd,
}: {
  cards: Flashcard[];
  filteredCards: Flashcard[];
  selectedIndex: number | null;
  hasUnsavedChanges: boolean;
  cardSearch: string;
  onCardSearchChange: (value: string) => void;
  onAddCard: () => void;
  onSelect: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (index: number) => void;
  onDelete: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}) {
  const { t } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-surface-muted">
      <div className="border-b border-border p-2">
        <input
          type="search"
          value={cardSearch}
          onChange={(e) => onCardSearchChange(e.target.value)}
          placeholder={t("community.editorSearchCards")}
          className="w-full rounded border border-border px-2 py-1.5 text-sm bg-surface text-text-primary"
        />
        <button
          type="button"
          onClick={onAddCard}
          className="mt-2 w-full rounded-lg bg-accent py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
        >
          + {t("community.editorAddCard")}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {cards.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            {t("community.editorNoCards")}
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={filteredCards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-1">
                {filteredCards.map((card) => {
                  const realIndex = cards.indexOf(card);
                  return (
                    <SortableCardItem
                      key={card.id}
                      card={card}
                      realIndex={realIndex}
                      isSelected={selectedIndex === realIndex}
                      cardsLength={cards.length}
                      hasUnsavedChanges={hasUnsavedChanges}
                      onSelect={() => onSelect(realIndex)}
                      onMoveUp={() => onMoveUp(realIndex)}
                      onMoveDown={() => onMoveDown(realIndex)}
                      onDuplicate={() => onDuplicate(realIndex)}
                      onDelete={() => onDelete(realIndex)}
                      placeholder={t("community.editorCardFrontPlaceholder")}
                      dragTitle={t("community.editorDragToReorder")}
                      moveUpTitle={t("community.editorMoveUp")}
                      moveDownTitle={t("community.editorMoveDown")}
                      duplicateTitle={t("community.editorDuplicateCard")}
                      deleteTitle={t("community.editorDeleteCard")}
                    />
                  );
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </aside>
  );
}
