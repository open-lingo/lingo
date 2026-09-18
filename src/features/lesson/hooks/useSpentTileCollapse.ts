import { useEffect, useRef, useState } from "react";

/**
 * TestFlight #184 (build 23, founder QA): "have the tiles disappear as
 * they click them in after a certain time count? The dynamic font
 * resizing is weird here." Screen: ja-m34-neo-6-challenge, a 13-tile HUGE
 * bank. The "weird resizing" was `tileFit.ts` re-negotiating mid-build:
 * until build 25 a huge bank (`hugeBank`, ≥12 tiles) skipped the sentence
 * tray's full-answer ghost reservation (b14 #114/#117 — that ghost used to
 * overflow the stage on its own), so the tray grew a row at a time as tiles
 * were placed while the bank never gave space back. Once the two together
 * overflowed the stage, the fit engine's shrink branch fired and every tile
 * on the step got smaller.
 *
 * THE TILE DISAPPEARS; ITS FOOTPRINT DOES NOT (build 25, 2026-09-17).
 * b24 collapsed the spent tile out of flow, on the reasoning that the bank
 * then "gives back exactly the row the tray gained". The tray no longer
 * gains rows — it starts at the full answer's height (see THE ONE
 * RESERVATION, `BuildSentenceStepView.tsx`) — so a row given back is a row
 * nobody needs, and taking it out of flow costs what the lead's ruling
 * forbids: every later bank tile jumps a slot, the bank loses a row, the
 * column re-centres, and the prompt moves (measured, 15 Pro Max at 100%:
 * the bank dropped 207.5 → 136.5px at tap 11 and the prompt fell back
 * 35.5px). So `"done"` is a FADE, in place: `index.css` animates `opacity`
 * and `transform` only — the two properties the sizing spec allows in the
 * lesson stage — and the box keeps its width, height, padding and border.
 * The founder's ask is "have the tiles disappear", and an invisible tile
 * has disappeared; the price is that the bank keeps a hole where it was,
 * which is the price of nothing else moving.
 *
 * `PENDING_MS` is the founder's "time count" — the tile stays at the
 * existing .4 spent opacity so the tap still reads as "placed", then fades
 * over ~150ms. Reappearing (tray → bank) is immediate: the pending timer is
 * cancelled and the `data-collapse` attribute is removed in the same tick —
 * with no `[data-collapse]` selector left to match there is nothing to
 * transition FROM, so the tile snaps back at full opacity with no animation.
 *
 * GHOST lane (2026-09-18, `docs/tile-tray-ux-2026-09-18.md` P2, lead's
 * ruling): this used to be gated to huge (>=12-tile) `BuildSentenceStepView`
 * banks only — because a normal bank's spent tile just sat at 0.4 opacity,
 * legible, for the rest of the step. That IS a lingering ghost of a used
 * word, and it's the default for 98%+ of build steps. The gate is gone:
 * every bank size runs this same state machine, on every build-type surface
 * that has a bank — Spencer's standing rule is one behaviour across EVERY
 * build-type surface ("ANY build step is so inconsistent… should be the
 * same", #137). It was always safe to run everywhere — the state machine
 * never actually depended on bank size or step type; the gate, and later
 * the single-surface home, only existed because b23/GHOST scoped the fix to
 * the bug report in front of them at the time.
 *
 * RENAMED from `useHugeBankCollapse` and moved out of `BuildSentenceStepView`
 * (GHOST lane, 2026-09-18 follow-up): "huge bank" stopped being true the
 * moment every bank size started calling it, and it's now shared by
 * `BuildSentenceStepView`, `ListeningBuildStepView`, and `FillBlankStepView`
 * — a single-view-local name and home would have lied on both counts.
 * Behavior is byte-for-byte unchanged from the pre-rename version; this is
 * an extraction, not a rewrite.
 */
const SPENT_TILE_COLLAPSE_PENDING_MS = 350;

export function useSpentTileCollapse(
  placedIdx: number[],
): Record<number, "pending" | "done"> {
  const [collapse, setCollapse] = useState<Record<number, "pending" | "done">>({});
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  // Which indices we're already tracking (pending or done) — the source of
  // truth for "is this a NEW spent tile", independent of `collapse` state's
  // own (async, batched) commit timing.
  const tracked = useRef(new Set<number>());

  useEffect(() => {
    const usedSet = new Set(placedIdx);

    for (const i of usedSet) {
      if (tracked.current.has(i)) continue;
      tracked.current.add(i);
      setCollapse((prev) => ({ ...prev, [i]: "pending" }));
      const timer = setTimeout(() => {
        timers.current.delete(i);
        // No inline geometry: `"done"` is a fade in place (index.css), so the
        // tile's box — and therefore every other bank tile's position, the
        // bank's row count and the column's centring — does not move.
        setCollapse((prev) => ({ ...prev, [i]: "done" }));
      }, SPENT_TILE_COLLAPSE_PENDING_MS);
      timers.current.set(i, timer);
    }

    for (const i of Array.from(tracked.current)) {
      if (usedSet.has(i)) continue;
      tracked.current.delete(i);
      const timer = timers.current.get(i);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(i);
      }
      setCollapse((prev) => {
        if (!(i in prev)) return prev;
        const next = { ...prev };
        delete next[i];
        return next;
      });
    }
  }, [placedIdx]);

  useEffect(() => {
    const liveTimers = timers.current;
    return () => {
      liveTimers.forEach(clearTimeout);
    };
  }, []);

  return collapse;
}
