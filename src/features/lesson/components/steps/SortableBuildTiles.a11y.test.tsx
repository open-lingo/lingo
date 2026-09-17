/**
 * Accessibility wiring for `SortableBuildTiles` (2026-09-17 project review,
 * lane A2 — see docs/accessibility-2026-09-17.md):
 *   - dnd-kit `accessibility.screenReaderInstructions` + `announcements`,
 *     wired with our own strings (i18next keys, English default).
 *   - every rendered tray tile is a real `<button>` with an `aria-label`
 *     that includes the word, its state, and its position ("は, placed,
 *     position 2 of 5").
 *   - a `role="status"`/`aria-live="polite"` live region announces a
 *     tap-placed or tap-removed tile — neither is a dnd-kit drag event (the
 *     bank tap lives in the owning step view; the tray tap here is a plain
 *     `onClick`), so dnd-kit's own announcer never sees either.
 *   - reduced motion: the placed-tile slide/drop-overlay animation honours
 *     BOTH `prefers-reduced-motion` and the in-app `[data-reduced-motion]`
 *     toggle (dnd-kit's `transition`/`dropAnimation` are Web-Animations-API
 *     driven, so `index.css`'s `[data-reduced-motion="true"] *
 *     { transition-duration: 0.01ms !important }` rule — which only reaches
 *     CSS transitions — cannot cover them).
 *
 * Mounts the REAL `BuildSentenceStepView` (not a mock of
 * `SortableBuildTiles`) so a tap goes through the real bank→tray wiring,
 * and the REAL i18next instance (not the `t: (k, d) => d` template-literal
 * stand-in the rest of the suite uses) so the assertions check actual
 * interpolated strings.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import "@/shared/i18n/i18n";

vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => null),
  hasTtsAudio: vi.fn(() => false),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/volume", () => ({ playLocalAudio: vi.fn() }));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));

import { BuildSentenceStepView } from "./BuildSentenceStepView";
import { prefersReducedMotion } from "./SortableBuildTiles";
import type { BuildSentenceStep } from "../../types";

const noop = () => {};

/** Three one-tap-apart tiles: tap 1 exercises the `ids.length < 2` branch
 *  (no `DndContext`), tap 2 crosses into the sortable/`DndContext` branch —
 *  the same split `BuildTrayRowNesting.test.tsx` exercises for sizing. */
function sentenceStep(): BuildSentenceStep {
  const all = ["ねこ", "が", "すき"];
  return {
    id: "a11y-build",
    type: "build_sentence",
    prompt: "Build it",
    targetSentence: all.join(""),
    tiles: all,
    correctOrder: all,
    granularity: "word",
  } as BuildSentenceStep;
}

/** The bank is shuffled (seeded on `step.id` — deterministic across
 *  renders/resumes, but not in `step.tiles` array order), so a test cannot
 *  assume which word this returns; always read `.textContent` off it
 *  before clicking rather than assuming a word. Excludes tiles already
 *  placed (`disabled`) the same way a real tap would — a bank tile is
 *  `disabled={submitted || used}`, not merely marked by some `data-*`
 *  attribute, so the selector excludes `:disabled` directly. */
function firstBankTile(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>(
    '[data-tile-tray][data-kind="bank"] [data-tile]:not(:disabled)',
  );
  if (!el) throw new Error("no bank tile");
  return el;
}

function placedTiles(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-tile][data-slot="tray"]'));
}

/** `AnnotatedText` interleaves zero-width-space placeholders into a kana
 *  tile's DOM even when its romaji `<rt>` is hidden (so a kanji sibling's
 *  visible reading doesn't change the tile's box — see
 *  `BuildTileSurface.tsx`), so `.textContent` is not the plain grading
 *  string an aria-label is built from. Strip them for a clean comparison. */
function cleanWord(el: HTMLElement): string {
  return (el.textContent ?? "").replace(/​/g, "");
}

afterEach(() => {
  cleanup();
  delete document.documentElement.dataset.reducedMotion;
});

describe("SortableBuildTiles — tile labels (word, state, position)", () => {
  it("labels the lone placed tile before the DndContext branch mounts", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep()} onComplete={noop} onContinue={noop} />,
    );
    const bank = firstBankTile(container);
    const word = cleanWord(bank);
    fireEvent.click(bank);
    const placed = placedTiles(container);
    expect(placed).toHaveLength(1);
    expect(placed[0].tagName).toBe("BUTTON");
    expect(placed[0].getAttribute("aria-label")).toBe(`${word}, placed, position 1 of 1`);
    // Native button: Tab reaches it with no extra wiring.
    expect(placed[0].tabIndex).toBe(0);
  });

  it("labels every tile once the sortable (DndContext) branch mounts", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep()} onComplete={noop} onContinue={noop} />,
    );
    const firstWord = cleanWord(firstBankTile(container));
    fireEvent.click(firstBankTile(container));
    const secondWord = cleanWord(firstBankTile(container));
    fireEvent.click(firstBankTile(container));
    const placed = placedTiles(container);
    expect(placed).toHaveLength(2);
    expect(placed[0].getAttribute("aria-label")).toBe(`${firstWord}, placed, position 1 of 2`);
    expect(placed[1].getAttribute("aria-label")).toBe(`${secondWord}, placed, position 2 of 2`);
    expect(placed[0].tabIndex).toBe(0);
    expect(placed[1].tabIndex).toBe(0);
  });
});

describe("SortableBuildTiles — dnd-kit accessibility wiring", () => {
  it("wires screenReaderInstructions onto the sortable tiles (hidden, aria-describedby)", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep()} onComplete={noop} onContinue={noop} />,
    );
    fireEvent.click(firstBankTile(container));
    fireEvent.click(firstBankTile(container));
    const placed = placedTiles(container);
    const describedById = placed[0].getAttribute("aria-describedby");
    expect(describedById, "dnd-kit's useSortable sets aria-describedby").toBeTruthy();
    const instructions = document.getElementById(describedById!);
    expect(instructions?.textContent).toContain(
      "Double-tap a word in the word bank below to add it to the sentence",
    );
    expect(instructions?.textContent).toContain("press Space to pick it up");
  });

  it("marks sortable tiles with dnd-kit's draggable role/roledescription (KeyboardSensor is live)", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep()} onComplete={noop} onContinue={noop} />,
    );
    fireEvent.click(firstBankTile(container));
    fireEvent.click(firstBankTile(container));
    const placed = placedTiles(container);
    // `useSortable`/`useDraggable` attributes — proof the KeyboardSensor's
    // activator is actually attached to this element, not just configured
    // on the (unused-until-then) DndContext.
    expect(placed[0].getAttribute("aria-roledescription")).toBeTruthy();
  });
});

describe("SortableBuildTiles — live region for tap add/remove", () => {
  it("announces a tap-added tile (dnd-kit's own announcer never sees a plain click)", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep()} onComplete={noop} onContinue={noop} />,
    );
    const word = cleanWord(firstBankTile(container));
    fireEvent.click(firstBankTile(container));
    const status = Array.from(container.querySelectorAll('[role="status"]')).find((el) =>
      el.textContent?.includes("added to the sentence"),
    );
    expect(status, "tap-added live region").toBeTruthy();
    expect(status!.textContent).toBe(`${word} added to the sentence, position 1 of 1.`);
    expect(status!.getAttribute("aria-live")).toBe("polite");
  });

  it("announces a tap-removed tile with the remaining count", () => {
    const { container } = render(
      <BuildSentenceStepView step={sentenceStep()} onComplete={noop} onContinue={noop} />,
    );
    fireEvent.click(firstBankTile(container)); // place tile 1
    fireEvent.click(firstBankTile(container)); // place tile 2
    const placedBeforeRemoval = placedTiles(container);
    const removedWord = cleanWord(placedBeforeRemoval[0]);
    fireEvent.click(placedBeforeRemoval[0]); // tap-remove it
    const status = Array.from(container.querySelectorAll('[role="status"]')).find((el) =>
      el.textContent?.includes("removed from the sentence"),
    );
    expect(status, "tap-removed live region").toBeTruthy();
    expect(status!.textContent).toBe(`${removedWord} removed from the sentence. 1 word(s) placed.`);
  });
});

describe("SortableBuildTiles — reduced motion", () => {
  /**
   * `useSortable`'s `transition`/`DragOverlay`'s `dropAnimation` are
   * Web-Animations-API driven, not CSS, so they only ever run for the one
   * or two frames right after a REAL drag ends (`wasDragging` in dnd-kit's
   * own `useSortable` — confirmed empirically: a tap-only placement never
   * produces an inline `transition` at all, dragging or not, reduced motion
   * or not, since `isDragging`/`wasDragging` are both false for a click).
   * happy-dom does not implement pointer capture, so a real drag isn't
   * practically simulable here — asserting on `.style.transition` after a
   * tap would be vacuous in EITHER direction (see `regression-classes` C4:
   * "a green check that cannot fail"). The actual, testable surface is the
   * predicate this component's `transition`/`dropAnimation` props are
   * computed FROM: `prefersReducedMotion()`, exported for exactly this.
   */
  afterEach(() => {
    delete document.documentElement.dataset.reducedMotion;
  });

  it("is false with neither the OS preference nor the in-app toggle set", () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it("is true once the in-app toggle is set, even without an OS preference", () => {
    document.documentElement.dataset.reducedMotion = "true";
    expect(prefersReducedMotion()).toBe(true);
  });

  it("is false again once the in-app toggle is cleared", () => {
    document.documentElement.dataset.reducedMotion = "true";
    expect(prefersReducedMotion()).toBe(true);
    delete document.documentElement.dataset.reducedMotion;
    expect(prefersReducedMotion()).toBe(false);
  });
});
