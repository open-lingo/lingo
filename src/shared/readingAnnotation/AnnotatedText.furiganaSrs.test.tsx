/**
 * Sentence-furigana visibility predicate (Spencer 2026-07-17 — uniform with
 * build tiles): on a kanji segment the substitution pass stamped
 * (`atomId` + `furiganaWindowOpen`), furigana is visible when
 *
 *   furiganaWindowOpen === true            (the unlock+FURIGANA_WINDOW floor)
 *   OR !isMastered(getCardState(atomId))   (past the window, until FSRS mastery)
 *
 * Unstamped segments keep the legacy data-driven rule (`reading !== surface`
 * floats), which is exactly how `kanji_reading` prompts
 * (surface === reading === kanji) keep suppressing their answer.
 *
 * Mocking convention mirrors BuildTileKanjiSurface.test.tsx: ONLY
 * `getCardState` is mocked; `isMastered` stays the real predicate.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      learning: {
        showRomanization: true,
        hiraganaRomajiAutoOff: false,
        katakanaRomajiAutoOff: false,
      },
    },
  }),
}));
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));
// SRS mastery: mock ONLY getCardState (isMastered stays the real
// predicate — both modalities >= MASTERED_INTERVAL_DAYS).
const getCardStateMock = vi.fn();
vi.mock("@/features/flashcards/engine", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getCardState: (id: string) => getCardStateMock(id),
}));

import { AnnotatedText } from "./AnnotatedText";
import { MASTERED_INTERVAL_DAYS } from "@/features/flashcards/engine";
import type { JapaneseAnnotation } from "@/shared/japanese/types";

const MASTERED_STATE = {
  recognition: { interval: MASTERED_INTERVAL_DAYS + 10 },
  production: { interval: MASTERED_INTERVAL_DAYS + 10 },
} as never;

beforeEach(() => {
  getCardStateMock.mockReset();
  getCardStateMock.mockReturnValue(undefined); // default: no SRS state → unmastered
});

/** Render one stamped/unstamped kanji segment and return its <rt>. */
function renderSegmentRt(seg: JapaneseAnnotation): HTMLElement {
  const { container } = render(<AnnotatedText segments={[seg]} />);
  const rt = container.querySelector("rt");
  expect(rt).not.toBeNull();
  return rt as HTMLElement;
}

const GAKKOU: JapaneseAnnotation = {
  surface: "学校",
  reading: "がっこう",
  atomId: "ja-m6-1-gakkou",
};

describe("AnnotatedText — sentence furigana: window floor OR unmastered", () => {
  it("in-window + MASTERED → visible (the floor: newly-appeared kanji keep furigana)", () => {
    getCardStateMock.mockReturnValue(MASTERED_STATE);
    const rt = renderSegmentRt({ ...GAKKOU, furiganaWindowOpen: true });
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.getAttribute("aria-hidden")).toBe("false");
    expect(rt.textContent).toBe("がっこう");
  });

  it("past-window + UNMASTERED → visible (furigana stays until the learner knows the word)", () => {
    const rt = renderSegmentRt({ ...GAKKOU, furiganaWindowOpen: false });
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("がっこう");
    // The mastery lookup used the segment's atomId.
    expect(getCardStateMock).toHaveBeenCalledWith("ja-m6-1-gakkou");
  });

  it("past-window + MASTERED → hidden (bare kanji, ZWSP placeholder)", () => {
    getCardStateMock.mockReturnValue(MASTERED_STATE);
    const rt = renderSegmentRt({ ...GAKKOU, furiganaWindowOpen: false });
    expect(rt.getAttribute("data-visible")).toBe("false");
    expect(rt.getAttribute("aria-hidden")).toBe("true");
    expect(rt.textContent).toBe("​"); // zero-width space keeps geometry
  });

  it("no atomId (unstamped, reading ≠ surface) → legacy behavior: visible, no SRS read", () => {
    const rt = renderSegmentRt({
      surface: "学校",
      reading: "がっこう",
      furiganaWindowOpen: false, // flag without atomId must NOT gate
    });
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("がっこう");
    expect(getCardStateMock).not.toHaveBeenCalled();
  });

  it("no window flag (hand-authored kanji segment with atomId) → legacy behavior: visible", () => {
    getCardStateMock.mockReturnValue(MASTERED_STATE);
    const rt = renderSegmentRt(GAKKOU);
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("がっこう");
  });

  it("kanji_reading suppression shape (surface === reading === kanji) stays hidden even UNMASTERED — the reading IS the answer", () => {
    // The factory emits the prompt with surface === reading === kanji and an
    // atomId, and applyKanjiSurfaces never rewrites Han surfaces, so no flag
    // is ever stamped. helper === null structurally: nothing to float.
    const rt = renderSegmentRt({
      surface: "学校",
      reading: "学校",
      atomId: "ja-m6-1-gakkou",
    });
    expect(rt.getAttribute("data-visible")).toBe("false");
    expect(rt.getAttribute("aria-hidden")).toBe("true");
    expect(rt.textContent).toBe("​");
    // …and this must hold regardless of SRS state, without consulting it in
    // a way that could flip it: unmastered above, mastered here.
    getCardStateMock.mockReturnValue(MASTERED_STATE);
    const rt2 = renderSegmentRt({
      surface: "学校",
      reading: "学校",
      atomId: "ja-m6-1-gakkou",
    });
    expect(rt2.getAttribute("data-visible")).toBe("false");
  });

  it("hideHelper hard-off still wins over the SRS gate", () => {
    const { container } = render(
      <AnnotatedText
        segments={[{ ...GAKKOU, furiganaWindowOpen: true }]}
        hideHelper
      />,
    );
    const rt = container.querySelector("rt")!;
    expect(rt.getAttribute("data-visible")).toBe("false");
  });
});
