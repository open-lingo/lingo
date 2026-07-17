/**
 * Regression (Gate 10 finding, 2026-07-17): review match tiles
 * (`playAudioOnSelect: true`) rendered raw `pair.source` KANA, silently
 * stripping the kanji surface the annotation carries (店→みせ, 学校→がっこう
 * on every review match step m8+). The audio-on-select branch must render
 * the annotation's post-substitution surface as plain text (no ruby — audio
 * is the reading channel).
 */
import { describe, it, expect, vi } from "vitest";
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
    settings: { learning: { showRomaji: false } },
    updateSetting: vi.fn(),
  }),
}));

import { MatchPairsStepView } from "./MatchPairsStepView";
import type { MatchPairsStep } from "../../types";

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
      // Post-kanji-substitution shape from applyKanjiSurfaces.
      sourceAnnotation: [{ surface: "店", reading: "みせ" }],
    },
    {
      id: "p-1",
      source: "すし",
      target: "sushi",
      sourceAnnotation: [{ surface: "すし", reading: "すし" }],
    },
  ],
};

describe("review match tiles — kanji surface", () => {
  it("renders the annotation's kanji surface, not the raw kana source", () => {
    const { container } = render(
      <MatchPairsStepView step={step} onComplete={() => {}} onContinue={() => {}} />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("店");
    expect(text).not.toContain("みせ");
    // Kana-only pairs still render their kana.
    expect(text).toContain("すし");
  });
});
