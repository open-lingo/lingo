import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
  type Announcements,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
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
import { Tile, type TileProps } from "../tiles/Tile";

/**
 * Reduced-motion read for the reorder slide/drop-overlay animation. Checked
 * at render (the setting does not change mid-step) to match how the rest of
 * the lesson treats it — mirrors `Confetti.tsx`/`LessonIntro.tsx`, which is
 * why this checks BOTH the in-app override (`root.dataset.reducedMotion`,
 * `SettingsContext` § accessibility) and the OS media query, not the media
 * query alone: `useSortable`'s `transition` and `DragOverlay`'s
 * `dropAnimation` are Web-Animations-API driven, so they never see
 * `index.css`'s `[data-reduced-motion="true"] * { transition-duration:
 * 0.01ms !important }` rule (that rule only reaches CSS transitions/
 * animations, not JS-driven ones) — before this fixed the OS-only gap, a
 * learner who turned the in-app "Reduce motion" toggle on without also
 * having an OS-level reduced-motion preference still got the full slide and
 * drop-overlay animation on every tile move (docs/accessibility-2026-09-17.md).
 */
export function prefersReducedMotion(): boolean {
  if (typeof document !== "undefined" && document.documentElement.dataset.reducedMotion === "true") {
    return true;
  }
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
 *
 * ACCESSIBILITY (2026-09-17 project review, lane A2): tap-to-place is the
 * PRIMARY path (the bank tiles that add a word live in the owning step view,
 * outside this component — see `BuildSentenceStepView.tsx`/
 * `ListeningBuildStepView.tsx`), drag-to-reorder is secondary. Every tile
 * this component renders is a real `<button>` (`Tile`'s default `as`), so
 * Tab reaches each one and it already carries a visible label from its
 * children; `aria-label` here adds the position/state a sighted learner gets
 * from context ("は, placed, position 2 of 5" — the wording TestFlight/the
 * lead asked for). `DndContext`'s `accessibility.screenReaderInstructions`
 * is the one hook this component owns into dnd-kit's a11y surface — it is
 * announced (via a hidden `aria-describedby` block) the first time a screen
 * reader user focuses ANY placed tray tile, which in practice is the first
 * opportunity in this surface to explain the whole interaction (tap to add,
 * tap to remove, drag/Space+arrows to reorder); it cannot fire on the bank
 * tiles themselves, since those never enter a `DndContext`. `announcements`
 * overrides dnd-kit's own drag-lifecycle text with these words instead. A
 * SEPARATE `role="status"` live region below covers what `DndContext`
 * cannot: a tile ADDED from the bank, or REMOVED by a tap — neither goes
 * through dnd-kit's drag events at all, but both change this component's
 * `ids` prop, which the announcer watches directly (see `useEffect` below) —
 * so it fires regardless of which file the tap handler that caused it lives
 * in.
 */
/** No preview transforms: the wrap tray reorders for real on `onDragOver`. */
const liveReorderStrategy: SortingStrategy = () => null;

/** Screen-reader label for a tile's `TileState`, as it appears in an
 *  `aria-label`. Only the states a build/listen tray tile actually renders
 *  (`placed` pre-submit, `correct`/`wrong` after) get a specific word; any
 *  other state falls back to itself rather than going silent. */
function stateLabel(
  t: (key: string, def: string) => string,
  state: TileProps["state"],
): string {
  switch (state) {
    case "correct":
      return t("lesson.build.a11y.stateCorrect", "correct");
    case "wrong":
      return t("lesson.build.a11y.stateWrong", "incorrect");
    case "placed":
    case undefined:
      return t("lesson.build.a11y.statePlaced", "placed");
    default:
      return state;
  }
}

export function SortableBuildTiles({
  ids,
  tiles,
  tileKanji,
  disabled,
  onRemove,
  onReorder,
  className,
  rowAttrs,
  tile,
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
  /** `tileRowAttrs(...)` from `TileTray` — this component owns its row div
   *  (dnd-kit's `SortableContext` child), so the tray attributes are spread
   *  in rather than rendered by `TileTray` itself. */
  rowAttrs?: Record<string, string | undefined>;
  /** Which `Tile` these placed tiles are. Geometry and state colour come
   *  from the primitive; this component only adds the drag affordances. */
  tile: Pick<TileProps, "variant" | "density" | "slot" | "state">;
  /** Extra classes MERGED onto every tile (the pop animation). */
  tileClassName?: string;
  /** "wrap" for the flex-wrap sentence tray, "horizontal" for single rows. */
  strategy?: "horizontal" | "wrap";
  /** Romaji-peek passthrough (listening builds). Keyed by BANK index, the
   *  same id the peek hook uses, so a reorder never re-keys a reveal. */
  onTileHoverStart?: (id: number) => void;
  onTileHoverEnd?: () => void;
  forceHelperFor?: (id: number) => boolean;
}) {
  const { t } = useTranslation();

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

  // The word for a sortable id, read off the current (render-time) props —
  // used both by the aria-labels below and by the dnd-kit announcements.
  const wordFor = (id: number) => tiles[ids.indexOf(id)] ?? "";
  const positionOf = (id: number) => ids.indexOf(id) + 1;

  const screenReaderInstructions: ScreenReaderInstructions = {
    draggable: t(
      "lesson.build.a11y.instructions",
      "Double-tap a word in the word bank below to add it to the sentence. " +
        "A placed word can be removed the same way: double-tap it. To " +
        "reorder a placed word instead, press Space to pick it up, use the " +
        "arrow keys to move it, then press Space again to drop it in its " +
        "new position, or press Escape to cancel.",
    ),
  };

  const announcements: Announcements = {
    onDragStart: ({ active }) => {
      const id = Number(active.id);
      return t(
        "lesson.build.a11y.pickedUp",
        "Picked up {{word}}, position {{position}} of {{total}}.",
        { word: wordFor(id), position: positionOf(id), total: ids.length },
      );
    },
    onDragOver: ({ active, over }) => {
      const id = Number(active.id);
      if (!over) {
        return t(
          "lesson.build.a11y.movedOut",
          "{{word}} is no longer over a position in the sentence.",
          { word: wordFor(id) },
        );
      }
      return t(
        "lesson.build.a11y.movedOver",
        "{{word}} is over position {{position}} of {{total}}.",
        { word: wordFor(id), position: positionOf(Number(over.id)), total: ids.length },
      );
    },
    onDragEnd: ({ active, over }) => {
      const id = Number(active.id);
      if (!over) {
        return t("lesson.build.a11y.droppedNowhere", "{{word}} was dropped.", {
          word: wordFor(id),
        });
      }
      return t(
        "lesson.build.a11y.dropped",
        "Dropped {{word}}. Now at position {{position}} of {{total}}.",
        { word: wordFor(id), position: positionOf(Number(over.id)), total: ids.length },
      );
    },
    onDragCancel: ({ active }) => {
      const id = Number(active.id);
      return t(
        "lesson.build.a11y.cancelled",
        "Reordering cancelled. {{word}} returned to position {{position}} of {{total}}.",
        { word: wordFor(id), position: positionOf(id), total: ids.length },
      );
    },
  };

  // Tap-driven placement/removal never fires a dnd-kit drag event — the bank
  // tap lives in the owning step view, and the tray tap below is a plain
  // `onClick` — so neither is covered by `announcements` above. Both DO
  // change `ids`/`tiles` (this component is a pure reflection of the views'
  // `placedIdx` state), so watching that prop catches either tap regardless
  // of which file's handler caused it. `role="status"`/`aria-live="polite"`
  // (not `assertive`): a placement is a confirmation, not an interruption.
  //
  // BASELINE IS ALWAYS EMPTY, NOT THE MOUNT PROPS. The owning views only
  // mount this component once `placed.length > 0` (an empty tray renders a
  // static hint instead — see `BuildSentenceStepView`/
  // `ListeningBuildStepView`), so this component's FIRST render already
  // carries the just-added tile; seeding the ref from `ids` at mount would
  // make that first tap invisible to the diff below (`last.ids === ids`,
  // same reference, nothing to compare). Starting from `[]` instead means
  // mount-with-N-tiles is read as "N adds", which is exactly right for the
  // single-tile case every tap produces, and — a disclosed edge case — reads
  // as one (slightly imprecise) "added" announcement rather than silence on
  // the rarer resume-with-a-prefilled-tray path.
  const [announcement, setAnnouncement] = useState("");
  const prev = useRef<{ ids: readonly number[]; tiles: readonly string[] }>({ ids: [], tiles: [] });
  useEffect(() => {
    const last = prev.current;
    if (last.ids !== ids) {
      if (ids.length > last.ids.length) {
        const addedIdx = ids.findIndex((id) => !last.ids.includes(id));
        if (addedIdx >= 0) {
          setAnnouncement(
            t(
              "lesson.build.a11y.added",
              "{{word}} added to the sentence, position {{position}} of {{total}}.",
              { word: tiles[addedIdx], position: addedIdx + 1, total: ids.length },
            ),
          );
        }
      } else if (ids.length < last.ids.length) {
        const removedIdx = last.ids.findIndex((id) => !ids.includes(id));
        if (removedIdx >= 0) {
          setAnnouncement(
            t(
              "lesson.build.a11y.removed",
              "{{word}} removed from the sentence. {{total}} word(s) placed.",
              { word: last.tiles[removedIdx], total: ids.length },
            ),
          );
        }
      }
      prev.current = { ids, tiles };
    }
  }, [ids, tiles, t]);
  const liveRegion = (
    <div role="status" aria-live="polite" className="sr-only">
      {announcement}
    </div>
  );

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
      <>
        <div {...rowAttrs} className={className}>
          {tiles.map((word, i) => (
            <Tile
              key={`${ids[i]}`}
              {...tile}
              disabled={disabled}
              onClick={() => onRemove(i)}
              onMouseEnter={() => onTileHoverStart?.(ids[i])}
              onMouseLeave={onTileHoverEnd}
              className={tileClassName}
              aria-label={t(
                "lesson.build.a11y.tileLabel",
                "{{word}}, {{state}}, position {{position}} of {{total}}",
                {
                  word,
                  state: stateLabel(t, tile.state),
                  position: i + 1,
                  total: tiles.length,
                },
              )}
            >
              <BuildTileSurface
                tile={word}
                kanji={tileKanji.get(word)}
                forceHelper={forceHelperFor?.(ids[i])}
              />
            </Tile>
          ))}
        </div>
        {liveRegion}
      </>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{ announcements, screenReaderInstructions }}
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
          <div {...rowAttrs} className={className}>
            {tiles.map((word, i) => (
              <SortableTile
                key={ids[i]}
                id={ids[i]}
                tile={word}
                kanji={tileKanji.get(word)}
                tileProps={tile}
                onRemove={() => onRemove(i)}
                onHoverStart={onTileHoverStart}
                onHoverEnd={onTileHoverEnd}
                forceHelper={forceHelperFor?.(ids[i])}
                className={tileClassName}
                overlay={live}
                ariaLabel={t(
                  "lesson.build.a11y.tileLabel",
                  "{{word}}, {{state}}, position {{position}} of {{total}}",
                  {
                    word,
                    state: stateLabel(t, tile.state),
                    position: i + 1,
                    total: tiles.length,
                  },
                )}
              />
            ))}
          </div>
        </SortableContext>
        {live && (
          <DragOverlay dropAnimation={prefersReducedMotion() ? null : undefined}>
            {activeId != null && ids.includes(activeId) && (
              <Tile
                {...tile}
                aria-hidden="true"
                tabIndex={-1}
                className={`${tileClassName ?? ""} scale-105 opacity-90 shadow-lg`}
              >
                <BuildTileSurface
                  tile={tiles[ids.indexOf(activeId)]}
                  kanji={tileKanji.get(tiles[ids.indexOf(activeId)])}
                  forceHelper={forceHelperFor?.(activeId)}
                />
              </Tile>
            )}
          </DragOverlay>
        )}
      </DndContext>
      {liveRegion}
    </>
  );
}

function SortableTile({
  id,
  tile,
  kanji,
  tileProps,
  onRemove,
  onHoverStart,
  onHoverEnd,
  forceHelper,
  className,
  overlay,
  ariaLabel,
}: {
  id: number;
  tile: string;
  kanji?: BuildTileDisplay;
  tileProps: Pick<TileProps, "variant" | "density" | "slot" | "state">;
  onRemove: () => void;
  onHoverStart?: (id: number) => void;
  onHoverEnd?: () => void;
  forceHelper?: boolean;
  className?: string;
  /** DragOverlay draws the tile in hand; the in-place copy is the landing
   *  slot (dimmed, untransformed). Single-row trays lift the tile itself. */
  overlay?: boolean;
  /** "{{word}}, {{state}}, position {{position}} of {{total}}" — see the
   *  caller. The tile's visible children (kana or kanji ruby) already give a
   *  screen reader an accessible name; this REPLACES it with the same word
   *  plus the position/state context a sighted learner gets for free from
   *  the tray. */
  ariaLabel: string;
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
    <Tile
      {...tileProps}
      ref={setNodeRef}
      onClick={onRemove}
      onMouseEnter={() => onHoverStart?.(id)}
      onMouseLeave={onHoverEnd}
      aria-label={ariaLabel}
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
    </Tile>
  );
}
