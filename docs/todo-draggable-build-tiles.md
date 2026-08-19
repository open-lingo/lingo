# DONE — drag-to-reorder tiles on tile-build steps

Spencer, 2026-08-18:

> "any step type with tiles for sentence build or listen or whatever, we need
> the same function duolingo has, where you can drag things dynamically in
> their spots, so I dont have to undo everything if I missed a word, and
> instead can drag and re-order. it should still function the same way it does
> now, but the drag functionality needs to be possible as well."

**Implemented and verified 2026-08-18.**

## What shipped

`components/steps/SortableBuildTiles.tsx` — one component, four trays:

| view | trays | strategy |
|---|---|---|
| `BuildSentenceStepView` | slots, word-build pill, sentence tray | horizontal ×2, wrap ×1 |
| `ListeningBuildStepView` | sentence tray (+ romaji-peek passthrough) | wrap |

The `isSingleAnswerPicker` branch is deliberately untouched — it is an MCQ
wearing tray clothes, one tile, nothing to reorder.

## Why grading could not break

The views hold `placedIdx: number[]` (bank indices) and derive
`placed = placedIdx.map(i => bankTiles[i])`. A reorder is a pure permutation of
`placedIdx`; the component never sees `correctOrder`. Sortable ids are the BANK
INDEX, not the tray position, which is also why duplicate glyphs (two は tiles)
reorder independently instead of swapping with each other.

**The five existing build tests pass UNMODIFIED** (25 assertions) —
`BuildSentenceLeniency`, `BuildSentenceSoClose`, `BuildSentenceTransform`,
`BuildTileKanjiSurface`, `ListeningBuildRomajiPeek`. That was the acceptance
bar: needing to edit one would have meant the change leaked into grading.

## The one real design problem, and the fix

dnd-kit's usual advice is `touch-action: none` on every draggable. That **kills
native scrolling for any swipe starting on a tile** — and on a phone the tile
area is most of the step, so the lesson would have become unscrollable. Caught
by testing, not by reading.

Fix: split the sensors instead of using one `PointerSensor`.

- **Mouse** — `MouseSensor`, 8px distance. A click with no travel still fires
  `onClick`, so tap-to-remove is untouched.
- **Touch** — `TouchSensor`, 200ms delay / 6px tolerance. A quick swipe scrolls,
  a quick tap removes, a press-and-hold drags.
- **Keyboard** — `KeyboardSensor` with `keyboardCodes` overridden to **Space
  only**. dnd-kit also binds Enter by default, which `useLessonKeyboard`
  already owns for check/continue — a focused tile would have swallowed the
  learner's submit.

`prefers-reduced-motion` passes `transition: null`, so the reorder lands
instantly while the drag stays available.

`@dnd-kit/utilities` is only a TRANSITIVE dep, so the transform is written
inline rather than importing its `CSS` helper.

## Verified in the browser, not just typechecked

| behaviour | result |
|---|---|
| mouse: tap places, tap removes | unchanged |
| mouse: drag first → last | `[は,で,を]` → `[で,を,は]`, same multiset |
| keyboard: Space / ArrowRight / Space | reorders |
| keyboard: Enter on a focused tile | still submits — reaches the lesson |
| touch: tap places / removes | unchanged |
| touch: quick vertical swipe | does NOT reorder (scroll preserved) |
| touch: press-and-hold + move | reorders |
| console errors | none |

## Correction to the earlier scouting note

An earlier version of this doc said doing the work "in the shared
`BuildTileSurface` covers both views at once". **That was wrong.**
`BuildTileSurface` only renders ONE tile's glyphs (kanji/furigana/romaji) — it
holds no ordering state. The ordering lives in each step view, which is why
this needed a new shared component and four separate call-site swaps.

## Not done — decide if wanted

**Dragging from the BANK into a specific slot.** Spencer's ask was reordering
what you already placed, which is what shipped. Bank→slot is a bigger problem
(the bank is position-stable by design so duplicate glyphs stay unambiguous)
and should be scoped on its own.

Other tile-ish views were left alone: `MatchPairsStepView`, the cloze views and
`DialogueSimStepView` do not use a placed-tile tray. Confirm whether "or
whatever" was meant to include them.

---

## Follow-up 2026-08-18 — the tray was a cap, not a floor

Spencer, walking m31 L1: *"if we have longer sentences in the future they
overflow the box."* The screenshot showed 10 placed tiles spilling out the
bottom of a tray sized for 7.

**Cause.** All four trays were pre-sized by an invisible ghost of
`step.correctOrder` and the real tiles rendered in an `absolute inset-0`
overlay. An absolutely-positioned child contributes nothing to its parent's
height, so the ghost was the tray's only height source — a hard cap. That is
fine while placed ≡ answer, and the bank breaks exactly that: it carries
distractors and `addTile` has no length limit, so a learner can place more
tiles than the answer has. On the m31 sentence Spencer built, the answer is
7 tiles and the bank offers 10.

Not a drag regression — reachable by tapping since the tray shipped. Drag
just makes people place-and-rearrange instead of place-once, so they hit it.

**Fix.** Ghost and tiles now share one CSS grid cell (`grid` +
`[grid-area:1/1]` on both). Grid sizes a cell to its tallest item, so the
tray height is `max(ghost, actual)`: the ghost still sets the FLOOR — placing
the expected tiles reflows nothing below — but it no longer caps. The
overlay's duplicated `px-4 py-2.5` goes away with the absolute positioning.

Same treatment for the two word-build layouts, which could run off-screen
sideways rather than spill downward: both gained `max-w-full` + `flex-wrap`,
and their `SortableBuildTiles` moved to `strategy="wrap"` (rectSortingStrategy)
since a wrapped list breaks `horizontalListSortingStrategy`'s offsets.

**Measured** — place every bank tile, then
`max(tile.bottom) - tray.bottom`, at 390×844:

| tray | before | after |
|---|---|---|
| sentence (`build_sentence`) | **147px spilled** | **0** — grows 172 → 330 |
| listening (`listening_build`) | **122px spilled** | **0** — grows 96 → 236 |
| word-build slots | n/a | 0 — grows 154 → 316 |
| word-build pill | n/a | 0 — grows 237 → 553 |

At 1440×900 nothing wraps, so the slots/pill trays grow sideways instead
(402 → 812, 42 → 846) and stay inside the viewport.

Drag re-verified after the layout change: mouse drag of tile 0 to last
reorders and preserves the multiset; Space/ArrowRight/Space reorders; zero
non-audio console errors. `tsc` clean, 9,549 passed / 16 skipped / 0 failed.

**Harness note.** The first drag run reported "no reorder" against BOTH the
old and new layout — the probe had wheel-scrolled the tray off-screen, so
Playwright's synthetic mouse never landed on a tile. `scrollIntoView` before
the drag fixed it. Check the instrument before believing the verdict.

---

## Open bug — second-row repositioning during a drag (Spencer 2026-08-18)

> *"bank slot dragging functionally is perfect, one small bug in second row
> dynamic repositioning when draging but we can address later."*

Deferred at Spencer's request. Recording the likely mechanism while it is
fresh so the fix starts from a hypothesis rather than a re-investigation.

**Where.** Only the wrapping trays — the sentence tray and the listening
tray, which pass `strategy="wrap"` (`rectSortingStrategy`). The
single-row layouts use `horizontalListSortingStrategy` and are unaffected.

**Likely mechanism.** `rectSortingStrategy` computes each item's transform
from the rects it measured when the drag STARTED. A tray that wraps has a
discontinuity at every row break: moving one tile across the break shifts
every following tile by a whole row height, and the strategy's linear
index→offset mapping does not model that. The 2026-08-18 grid-stack change
made the tray GROW as tiles wrap, which adds a second-order version of the
same problem — the container can gain a row mid-drag, so the measured rects
go stale underneath the strategy.

**First things to try**, cheapest first:

1. `measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}` on the
   `DndContext` — re-measures during the drag instead of at drag start. This
   alone may be the whole fix, and it is one line.
2. If the tray still jumps at the row break, the tray needs a stable height
   during a drag: freeze the container's measured height on `onDragStart`
   and release it on `onDragEnd`, so a row gained mid-drag cannot invalidate
   the rects.
3. Only if both fail: a custom strategy that maps index → (row, column) from
   the live wrapped geometry.

**Do not** revert to `horizontalListSortingStrategy` to make it go away —
that strategy computes wrong offsets the moment a list wraps, which is why
the wrapping trays use `rect` in the first place.

Reproduce: a build step whose placed tiles occupy two rows (m31 L1 at phone
width, or any 10-tile placement), then drag a tile from row 1 to row 2.
