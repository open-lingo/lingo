/**
 * `postMessage` protocol between `TileSizingQaPage` (parent) and
 * `TileSizingQaFramePage` (the desktop/mobile/tablet iframes). Kept as plain
 * string constants (not a class/enum) so the iframe and parent bundles
 * never need to share more than this one file.
 *
 * Every message from a frame carries a `view` field so the parent can tell
 * which of its three iframes sent it: `"mobile"` (base tier, <640px),
 * `"desktop"` (sm tier, the `?view=desktop` frame), or `"tablet"` (the
 * tabletPortrait tier, the `?view=tablet` frame — added for the iPad
 * portrait pass). `view` is not itself typed here (it travels as a plain
 * string on `MessageEvent.data`, same as the rest of this protocol) — the
 * parent's `TileSizingQaPage.tsx` and the frame's `TileSizingQaFramePage.tsx`
 * are the two places that must agree on these three literal values.
 */
export const TILE_QA_MESSAGE = {
  source: "lingo-qa-tiles",
  /** parent → frame: apply every {name: value} entry via setProperty. */
  setVars: "set-vars",
  /** parent → frame: removeProperty for every key (reset to shipped default). */
  clearVars: "clear-vars",
  /** frame → parent: the frame mounted its message listener. */
  ready: "ready",
  /**
   * parent → frame: `{ locked: boolean }` — "Lock tile heights" (TestFlight
   * #137). While locked the frame measures its own 8-tile fixture and sets
   * `--tile-box-h` itself (ignoring that key in any `setVars` it receives,
   * belt-and-suspenders against a race with the parent's normal push);
   * unlocking clears the self-measured value and the parent's next
   * `setVars` (sent immediately on unlock) restores the slider's value.
   */
  setLock: "set-lock",
  /** frame → parent: `{ height: number | null }` — the value the frame just
   *  self-applied to `--tile-box-h` while locked (null = no measurable
   *  fixture yet), so the page can show it next to the toggle. */
  lockMeasured: "lock-measured",
  /** frame → parent: `{ height: number }` — the frame document's full
   *  scrollHeight, so the desktop pane can size its iframe to exactly fit
   *  the content and let the OUTER pane be the only scroller (avoids a
   *  scrollbar-in-a-scrollbar). Sent on mount and on resize. */
  contentHeight: "content-height",
  /** parent → frame: `{ fixture: string }` — scroll the pane to that
   *  fixture's card (the QA page's section headers do this so the tiles a
   *  slider affects are on screen). */
  scrollTo: "scroll-to",
} as const;
