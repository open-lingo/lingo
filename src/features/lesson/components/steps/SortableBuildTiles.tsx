import { useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  type SortingStrategy,
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
 *
 * WRAPPING TRAYS REORDER LIVE, NOT BY PREVIEW TRANSFORM. `rectSortingStrategy`
 * previews a sort by handing every tile the RECT of the tile it would replace
 * — right for a grid of equal cells, wrong for a flex-wrap row of words:
 * しらべて slid into で's slot and painted over its neighbour, 時計 over 窓
 * (TestFlight 2026-09-06 #46; reproduced on 10 of 20 random touch drags in
 * Chromium with the mid-drag overlap probe). So the wrap tray applies NO
 * strategy transform at all: `onDragOver` commits the permutation as it
 * happens, the flex layout reflows for real, and the sortable's own
 * layout-change animation slides the neighbours. The tile in hand is drawn by
 * `DragOverlay` (it follows the pointer whatever the DOM does underneath),
 * while its in-place copy stays dimmed as the landing slot.
 */
/** No preview transforms: the wrap tray reorders for real on `onDragOver`. */
const liveReorderStrategy: SortingStrategy = () => null;

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
  // Touch drags the same way mouse does: after a few px of travel, no
  // press-and-hold. That needs `touch-action: none` on the PLACED tiles (else
  // WebKit starts a scroll and cancels the drag), which is why it is scoped to
  // the tray only — the bank tiles are tap-to-place and keep native scrolling.
  // The 200ms hold this replaced (Spencer 2026-09-06: "mobile click to drag
  // for tiles isn't working the same way we have it on web") read as dead,
  // because nothing signalled that a hold was required. The lesson stage no
  // longer scrolls on the common phones (0px overflow on 15 Pro Max / 13 after
  // the 2026-09-05 fit pass), so a swipe that starts on a placed tile losing
  // its scroll is not a cost any more; the SE still scrolls from the bank.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { distance: 6 },
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

  const [activeId, setActiveId] = useState<number | null>(null);
  const live = strategy === "wrap";

  function commitMove(activeKey: number | string, overKey: number | string) {
    if (activeKey === overKey) return;
    const from = ids.indexOf(Number(activeKey));
    const to = ids.indexOf(Number(overKey));
    if (from < 0 || to < 0) return;
    onReorder(arrayMove([...ids], from, to));
  }

  function handleDragStart(e: DragStartEvent) {
    lastCommitDelta.current = null;
    setActiveId(Number(e.active.id));
  }

  // Pointer translation at the last live commit. A commit reflows the tray,
  // which can change `over` with the pointer perfectly still; acting on that
  // is the oscillation, so a still pointer never commits twice.
  const lastCommitDelta = useRef<{ x: number; y: number } | null>(null);

  function evaluateLiveMove(e: DragOverEvent | DragMoveEvent) {
    if (!live || !e.over || e.active.id === e.over.id) return;
    const last = lastCommitDelta.current;
    if (last && last.x === e.delta.x && last.y === e.delta.y) return;
    // HYSTERESIS. Committing on every `over` change oscillates when a narrow
    // tile is dragged onto a wide one: the swap puts the wide tile back under
    // the pointer, `over` flips back, and the pair trades places until React
    // throws "Maximum update depth exceeded" (40-drag probe, 1 in 40). So a
    // same-row move only commits once the tile in hand has crossed the
    // CENTRE of the tile it is over, in the direction of travel — after the
    // swap the same test reads false, and the pointer has to travel back
    // past that centre to undo it. Row changes commit on contact (the reflow
    // moves the target to another line), guarded by the still-pointer rule
    // above for the case where that reflow hands `over` straight back.
    const a = e.active.rect.current.translated;
    const o = e.over.rect;
    if (a && o) {
      const from = ids.indexOf(Number(e.active.id));
      const to = ids.indexOf(Number(e.over.id));
      const ax = a.left + a.width / 2;
      const ay = a.top + a.height / 2;
      const ox = o.left + o.width / 2;
      const oy = o.top + o.height / 2;
      const sameRow = Math.abs(ay - oy) < o.height / 2;
      if (sameRow && (to > from ? ax <= ox : ax >= ox)) return;
    }
    lastCommitDelta.current = { x: e.delta.x, y: e.delta.y };
    commitMove(e.active.id, e.over.id);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    // Live trays already hold the final order; this is the no-op safety net
    // for a drop whose last `over` never fired (and the whole move for the
    // single-row trays, which still preview by transform).
    commitMove(active.id, over.id);
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
      onDragStart={handleDragStart}
      onDragOver={evaluateLiveMove}
      onDragMove={evaluateLiveMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <SortableContext
        items={ids as number[]}
        strategy={live ? liveReorderStrategy : horizontalListSortingStrategy}
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
              overlay={live}
            />
          ))}
        </div>
      </SortableContext>
      {live && (
        <DragOverlay dropAnimation={prefersReducedMotion() ? null : undefined}>
          {activeId != null && ids.includes(activeId) && (
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className={`${tileClassName ?? ""} scale-105 opacity-90 shadow-lg`}
            >
              <BuildTileSurface
                tile={tiles[ids.indexOf(activeId)]}
                kanji={tileKanji.get(tiles[ids.indexOf(activeId)])}
                forceHelper={forceHelperFor?.(activeId)}
              />
            </button>
          )}
        </DragOverlay>
      )}
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
  overlay,
}: {
  id: number;
  tile: string;
  kanji?: BuildTileDisplay;
  onRemove: () => void;
  onHoverStart?: (id: number) => void;
  onHoverEnd?: () => void;
  forceHelper?: boolean;
  className?: string;
  /** DragOverlay draws the tile in hand; the in-place copy is the landing
   *  slot (dimmed, untransformed). Single-row trays lift the tile itself. */
  overlay?: boolean;
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
      // `touch-action: none` so the drag tracks on touch (see sensors above).
      // The lift (scale + shadow) is the feedback that the tile is in hand.
      className={`${className ?? ""} touch-none ${
        isDragging
          ? overlay
            ? "opacity-30"
            : "z-10 scale-105 opacity-90 shadow-lg"
          : ""
      }`}
      style={{
        // Written out rather than importing @dnd-kit/utilities' CSS helper:
        // that package is only a transitive dep here, so depending on it
        // directly would be an undeclared import.
        transform:
          transform && !(overlay && isDragging)
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
