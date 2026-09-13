// Regression: `font-japanese` (src/index.css) sets `word-break: keep-all` +
// `overflow-wrap: anywhere` — right for kana/hangul, but wrong for Latin
// scripts, where `overflow-wrap: anywhere` breaks INSIDE a word to avoid
// overflow. WordImageMcqStepView hard-coded `font-japanese` on every option
// label (~lines 312/328), so on a 3-up ES/FR grid at 390px a word like
// "mercado" or "escuela" wrapped mid-word ("el mercad / o", "la escuel / a").
// The class must only apply for the CJK scripts it was written for (ja/ko);
// other languages get normal word-boundary wrapping.
import { describe, expect, it, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { WordImageMcqStepView } from "./WordImageMcqStepView";
import type { WordImageMcqStep } from "../../types";

vi.mock(import("@/shared/tts"), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    playJaAudio: vi.fn(),
    getTtsUrl: vi.fn(() => "/tts/fake.mp3"),
  };
});
vi.mock("@/shared/contexts/SettingsContext", async () => {
  const { DEFAULT_SETTINGS } = await import("@/shared/settings/types");
  return { useSettings: () => ({ settings: DEFAULT_SETTINGS }) };
});

// Mutable so each test can pick the active language without a fresh mock
// module per case (vi.mock factories run once at hoist time).
const activeLanguage = { id: "ja" };
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: activeLanguage }),
}));

const esStep: WordImageMcqStep = {
  id: "t-es-1",
  type: "word_image_mcq",
  meaningEn: "market",
  options: [
    { id: "correct", word: "mercado", emoji: "🏪" },
    { id: "opt-1", word: "escuela", emoji: "🏫" },
    { id: "opt-2", word: "casa", emoji: "🏠" },
    { id: "opt-3", word: "perro", emoji: "🐶" },
  ],
  correctOptionId: "correct",
};

const jaStep: WordImageMcqStep = {
  id: "t-ja-1",
  type: "word_image_mcq",
  meaningEn: "cat",
  options: [
    { id: "correct", word: "ねこ", emoji: "🐱" },
    { id: "opt-1", word: "いぬ", emoji: "🐶" },
    { id: "opt-2", word: "あい", emoji: "❤️" },
    { id: "opt-3", word: "がっこう", emoji: "🏫" },
  ],
  correctOptionId: "correct",
};

describe("WordImageMcqStepView — option label script class", () => {
  afterEach(() => {
    cleanup();
    activeLanguage.id = "ja";
  });

  it("ES option labels do NOT carry font-japanese (mid-word-wrap regression)", () => {
    activeLanguage.id = "es";
    const { container } = render(
      <WordImageMcqStepView step={esStep} onComplete={() => {}} onContinue={() => {}} />,
    );
    const labelSpans = [...container.querySelectorAll('button span[lang="es"]')];
    expect(labelSpans.length).toBeGreaterThan(0);
    for (const span of labelSpans) {
      expect(span.className).not.toMatch(/\bfont-japanese\b/);
    }
  });

  it("JA option labels DO carry font-japanese", () => {
    activeLanguage.id = "ja";
    const { container } = render(
      <WordImageMcqStepView step={jaStep} onComplete={() => {}} onContinue={() => {}} />,
    );
    const labelSpans = [...container.querySelectorAll('button span[lang="ja"]')];
    expect(labelSpans.length).toBeGreaterThan(0);
    for (const span of labelSpans) {
      expect(span.className).toMatch(/\bfont-japanese\b/);
    }
  });
});
