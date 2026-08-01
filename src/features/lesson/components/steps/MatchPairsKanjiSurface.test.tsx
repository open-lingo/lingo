/**
 * Review match tiles (`playAudioOnSelect: true`) — kanji surface + furigana.
 *
 * History: raw `pair.source` KANA once stripped the kanji surface entirely
 * (Gate 10 finding, 2026-07-17 — fixed to plain-text kanji); Spencer's
 * follow-up ruling the same day: bare kanji there needs FURIGANA too, with
 * the same window-floor-OR-unmastered visibility as sentence surfaces
 * (`kanjiFuriganaSrsVisible`), rendered as okurigana-aligned ruby. Still NO
 * romaji ever in this branch — audio is the reading channel.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: unknown) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => "tts-url"),
  hasTtsAudio: vi.fn(() => true),
  useAutoPlayJaAudio: vi.fn(),
}));
vi.mock("@/shared/audio/sfx", () => ({ playSfx: vi.fn() }));
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: { learning: { showRomanization: { ja: false } } },
    updateSetting: vi.fn(),
  }),
}));
// SRS mastery: mock ONLY getCardState (isMastered stays the real predicate).
const getCardStateMock = vi.fn();
vi.mock("@/features/flashcards/engine", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getCardState: (id: string) => getCardStateMock(id),
}));

import { MatchPairsStepView } from "./MatchPairsStepView";
import { MASTERED_INTERVAL_DAYS } from "@/features/flashcards/engine";
import type { MatchPairsStep } from "../../types";

const MASTERED_STATE = {
  recognition: { interval: MASTERED_INTERVAL_DAYS + 10 },
  production: { interval: MASTERED_INTERVAL_DAYS + 10 },
} as never;

const step: MatchPairsStep = {
  id: "test-match-kanji",
  type: "match_pairs",
  prompt: "Match each Japanese word to its meaning (review)",
  playAudioOnSelect: true,
  pairs: [
    {
      id: "p-0",
      source: "みせ",
      target: "shop",
      // Post-kanji-substitution shape from applyKanjiSurfaces (stamped:
      // atomId + window state — here past the window).
      sourceAnnotation: [
        {
          surface: "店",
          reading: "みせ",
          atomId: "ja-m13-2-mise",
          furiganaWindowOpen: false,
        },
      ],
    },
    {
      id: "p-1",
      source: "すし",
      target: "sushi",
      sourceAnnotation: [{ surface: "すし", reading: "すし" }],
    },
  ],
};

function renderStep() {
  return render(
    <MatchPairsStepView step={step} onComplete={() => {}} onContinue={() => {}} />,
  );
}

beforeEach(() => {
  getCardStateMock.mockReset();
  getCardStateMock.mockReturnValue(undefined); // no SRS state → unmastered
});

describe("review match tiles — kanji surface + FSRS-gated furigana", () => {
  it("renders the annotation's kanji surface as ruby, not the raw kana source", () => {
    const { container } = renderStep();
    const ruby = container.querySelector('ruby[data-match-tile-kanji="true"]');
    expect(ruby).not.toBeNull();
    expect(ruby!.textContent).toContain("店");
    // Kana-only pairs still render their kana, plain (no ruby, no helper).
    expect(container.textContent).toContain("すし");
    expect(container.querySelectorAll("ruby").length).toBe(1);
  });

  it("past-window + unmastered: furigana visible (rt data-visible=true, kana reading)", () => {
    const { container } = renderStep();
    const rt = container
      .querySelector('ruby[data-match-tile-kanji="true"]')!
      .querySelector("rt.kana-helper")!;
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("みせ");
    expect(getCardStateMock).toHaveBeenCalledWith("ja-m13-2-mise");
  });

  it("past-window + mastered: bare kanji (rt data-visible=false, ZWSP)", () => {
    getCardStateMock.mockReturnValue(MASTERED_STATE);
    const { container } = renderStep();
    const rt = container
      .querySelector('ruby[data-match-tile-kanji="true"]')!
      .querySelector("rt.kana-helper")!;
    expect(rt.getAttribute("data-visible")).toBe("false");
    expect(rt.textContent).toBe("​");
  });

  it("never renders romaji on the source tiles in the audio-on-select branch", () => {
    const { container } = renderStep();
    const sourceTile = container
      .querySelector('ruby[data-match-tile-kanji="true"]')!
      .closest("button")!;
    expect(sourceTile.textContent).not.toMatch(/[A-Za-z]/);
  });
});
