import {
  DndContext,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { BuildTileSurface, type BuildTileDisplay } from "./BuildTileSurface";

/** Reduced-motion read for the reorder slide. Checked at render (the setting
 *  does not change mid-step) to match how the rest of the lesson treats it. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Drag-to-reorder for placed build tiles.
 *
 * Spencer 2026-08-18: "the same function duolingo has, where you can drag
 * things dynamically in their spots, so I dont have to undo everything if I
 * missed a word … it should still function the same way it does now, but the
 * drag functionality needs to be possible as well."
 *
 * ADDITIVE. Tap-to-remove is untouched — `PointerSensor` uses an 8px
 * activation distance (the same constraint `CardNavigator` settled on), so a
 * tap with no movement never becomes a drag and `onClick` still fires.
 *
 * GRADING IS UNTOUCHED. The views hold `placedIdx: number[]` (bank indices)
 * and derive `placed = placedIdx.map(i => bankTiles[i])`. A reorder is a pure
 * permutation of that array, so every comparison downstream sees the same
 * shape it always did. This component never sees `correctOrder`.
 *
 * IDENTITY: sortable ids are the BANK INDEX, not the tray position — the
 * views' own stable per-instance id, which is why duplicate glyphs (two は
 * tiles) reorder independently instead of swapping with each other.
 *
 * KEYBOARD: activation is SPACE ONLY. dnd-kit's default also binds Enter,
 * which `useLessonKeyboard` already owns for check/continue — a focused tile
 * would have swallowed the learner's submit.
 */
export function SortableBuildTiles({
  ids,
  tiles,
  tileKanji,
  disabled,
  onRemove,
  onReorder,
  className,
  tileClassName,
  strategy = "horizontal",
  onTileHoverStart,
  onTileHoverEnd,
  forceHelperFor,
}: {
  /** Stable per-instance ids — the views' bank indices. */
  ids: readonly number[];
  /** Display strings, parallel to `ids`. */
  tiles: readonly string[];
  tileKanji: ReadonlyMap<string, BuildTileDisplay>;
  disabled: boolean;
  /** Tray position to drop. Unchanged tap behaviour. */
  onRemove: (trayPosition: number) => void;
  onReorder: (next: number[]) => void;
  className?: string;
  tileClassName?: string;
  /** "wrap" for the flex-wrap sentence tray, "horizontal" for single rows. */
  strategy?: "horizontal" | "wrap";
  /** Romaji-peek passthrough (listening builds). Keyed by BANK index, the
   *  same id the peek hook uses, so a reorder never re-keys a reveal. */
  onTileHoverStart?: (id: number) => void;
  onTileHoverEnd?: () => void;
  forceHelperFor?: (id: number) => boolean;
}) {
  // Mouse and touch get DIFFERENT constraints on purpose.
  //
  // A single PointerSensor would need `touch-action: none` on every tile for
  // touch drags to track — and that kills NATIVE SCROLLING for any swipe that
  // starts on a tile. On a phone the tile area is most of the step, so the
  // lesson would have become unscrollable.
  //
  // Instead: mouse drags after 8px of travel (so a click still removes), and
  // touch drags only after a 200ms press (so a quick swipe scrolls the stage
  // and a quick tap removes, exactly as before).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: {
        start: ["Space"],
        cancel: ["Escape"],
        end: ["Space"],
      },
    }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(Number(active.id));
    const to = ids.indexOf(Number(over.id));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove([...ids], from, to));
  }

  // One tile can't be reordered, and a submitted step is read-only. Skipping
  // the context entirely keeps those cases byte-for-byte the old render.
  if (disabled || ids.length < 2) {
    return (
      <div className={className}>
        {tiles.map((tile, i) => (
          <button
            key={`${ids[i]}`}
            type="button"
            disabled={disabled}
            onClick={() => onRemove(i)}
            onMouseEnter={() => onTileHoverStart?.(ids[i])}
            onMouseLeave={onTileHoverEnd}
            className={tileClassName}
          >
            <BuildTileSurface
              tile={tile}
              kanji={tileKanji.get(tile)}
              forceHelper={forceHelperFor?.(ids[i])}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      // Re-measure droppables DURING the drag, not only at drag start.
      // `rectSortingStrategy` (the wrapping trays) derives every transform
      // from the rects it measured when the gesture began, and a wrapping
      // tray can gain a row mid-drag — which invalidates them underneath the
      // strategy and makes second-row tiles reposition wrongly (Spencer
      // 2026-08-18; docs/todo-draggable-build-tiles.md, "first things to
      // try", step 1). Applies to both strategies; the single-row trays
      // never change height, so for them it is measurement work and nothing
      // else.
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={ids as number[]}
        strategy={
          strategy === "wrap" ? rectSortingStrategy : horizontalListSortingStrategy
        }
      >
        <div className={className}>
          {tiles.map((tile, i) => (
            <SortableTile
              key={ids[i]}
              id={ids[i]}
              tile={tile}
              kanji={tileKanji.get(tile)}
              onRemove={() => onRemove(i)}
              onHoverStart={onTileHoverStart}
              onHoverEnd={onTileHoverEnd}
              forceHelper={forceHelperFor?.(ids[i])}
              className={tileClassName}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableTile({
  id,
  tile,
  kanji,
  onRemove,
  onHoverStart,
  onHoverEnd,
  forceHelper,
  className,
}: {
  id: number;
  tile: string;
  kanji?: BuildTileDisplay;
  onRemove: () => void;
  onHoverStart?: (id: number) => void;
  onHoverEnd?: () => void;
  forceHelper?: boolean;
  className?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    // `transition: null` disables dnd-kit's slide; the reorder still happens,
    // it just lands instantly. The drag itself stays available.
  } = useSortable({ id, transition: prefersReducedMotion() ? null : undefined });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onRemove}
      onMouseEnter={() => onHoverStart?.(id)}
      onMouseLeave={onHoverEnd}
      className={`${className ?? ""} ${
        isDragging ? "z-10 opacity-80" : ""
      }`}
      style={{
        // Written out rather than importing @dnd-kit/utilities' CSS helper:
        // that package is only a transitive dep here, so depending on it
        // directly would be an undeclared import.
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <BuildTileSurface tile={tile} kanji={kanji} forceHelper={forceHelper} />
    </button>
  );
}
