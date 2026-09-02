import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Flashcard } from "@/features/flashcards/data/types";
import { Icon } from "@/shared/components/Icon";

export function SortableCardItem({
  card,
  realIndex,
  isSelected,
  cardsLength,
  hasUnsavedChanges,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  placeholder,
  dragTitle,
  moveUpTitle,
  moveDownTitle,
  duplicateTitle,
  deleteTitle,
}: {
  card: Flashcard;
  realIndex: number;
  isSelected: boolean;
  cardsLength: number;
  hasUnsavedChanges?: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  placeholder: string;
  dragTitle: string;
  moveUpTitle: string;
  moveDownTitle: string;
  duplicateTitle: string;
  deleteTitle: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 rounded-lg border px-2 py-2 transition ${
          isSelected
            ? "border-accent bg-accent-muted"
            : "border-transparent hover:bg-surface-muted"
        } ${isDragging ? "opacity-50" : ""}`}
      >
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none shrink-0 rounded p-1 text-text-muted hover:bg-surface-muted hover:text-text-secondary active:cursor-grabbing"
          title={dragTitle}
          aria-label={dragTitle}
        >
          <Icon name="gripVertical" size={16} />
        </span>
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-left text-sm"
        >
          {isSelected && hasUnsavedChanges && (
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full bg-error"
              title="Unsaved changes"
              aria-label="Unsaved changes"
            />
          )}
          <span className="truncate">
            <span className="text-text-muted">{realIndex + 1}.</span>{" "}
            {card.front || placeholder}
          </span>
        </button>
        <div className="flex shrink-0 gap-0.5 opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveUp();
            }}
            disabled={realIndex === 0}
            className="rounded p-0.5 text-text-muted hover:bg-surface-muted disabled:opacity-30"
            title={moveUpTitle}
          >
            <Icon name="chevronUp" size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMoveDown();
            }}
            disabled={realIndex === cardsLength - 1}
            className="rounded p-0.5 text-text-muted hover:bg-surface-muted disabled:opacity-30"
            title={moveDownTitle}
          >
            <Icon name="chevronDown" size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="rounded p-0.5 text-text-muted hover:bg-surface-muted"
            title={duplicateTitle}
          >
            <Icon name="copy" size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-0.5 text-destructive hover:bg-destructive/10"
            title={deleteTitle}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>
    </li>
  );
}
