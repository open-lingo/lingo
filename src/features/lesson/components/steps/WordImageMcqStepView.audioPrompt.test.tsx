// Regression: QA 2026-07-16 (ja-m28-review-1) — the audio-prompt variant of
// word_image_mcq (vocabMcq review path, meaningEn = target kana) rendered
// "What is the word for なに?" with a tile captioned なに right below it,
// leaking the answer. The view must detect that mode and ask by ear instead.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WordImageMcqStepView } from "./WordImageMcqStepView";
import type { WordImageMcqStep } from "../../types";
import { seededShuffle } from "@/shared/utils/seededShuffle";

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
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

const baseStep = (over: Partial<WordImageMcqStep>): WordImageMcqStep => ({
  id: "t-1",
  type: "word_image_mcq",
  meaningEn: "love",
  options: [
    { id: "correct", word: "なに", emoji: "❓" },
    { id: "opt-1", word: "ねこ", emoji: "🐱" },
    { id: "opt-2", word: "いぬ", emoji: "🐶" },
    { id: "opt-3", word: "あい", emoji: "❤️" },
  ],
  correctOptionId: "correct",
  ...over,
});

describe("WordImageMcqStepView — audio-prompt mode (answer-leak regression)", () => {
  it("audio mode (meaningEn = an option word) asks by ear and never prints the target", () => {
    render(
      <WordImageMcqStepView
        step={baseStep({ meaningEn: "なに" })}
        onComplete={() => {}}
        onContinue={() => {}}
      />,
    );
    expect(screen.getByText("Which word do you hear?")).toBeTruthy();
    expect(screen.getByLabelText("Play audio")).toBeTruthy();
    // The prompt heading must not contain the answer; the tile caption for
    // なに still exists (sound→spelling is the exercise), but no "What is
    // the word for" template may leak it.
    expect(screen.queryByText(/What is the word for/)).toBeNull();
  });

  it("normal mode (English meaning) keeps the text prompt and no play button", () => {
    render(
      <WordImageMcqStepView
        step={baseStep({ meaningEn: "love" })}
        onComplete={() => {}}
        onContinue={() => {}}
      />,
    );
    expect(screen.getByText(/What is the word for/)).toBeTruthy();
    expect(screen.queryByLabelText("Play audio")).toBeNull();
    expect(screen.queryByText("Which word do you hear?")).toBeNull();
  });

  it("renders the kanji-substituted surface when optionAnnotations carries it", () => {
    // The kanji post-pass rewrites the option annotation surface to 学校; the
    // renderer's segments path must show that kanji instead of the bare kana.
    render(
      <WordImageMcqStepView
        step={baseStep({
          options: [
            { id: "correct", word: "がっこう", emoji: "🏫" },
            { id: "opt-1", word: "ねこ", emoji: "🐱" },
            { id: "opt-2", word: "いぬ", emoji: "🐶" },
            { id: "opt-3", word: "あい", emoji: "❤️" },
          ],
          optionAnnotations: [
            [{ surface: "学校", reading: "学校", atomId: "ja-m6-1-gakkou" }],
            [{ surface: "ねこ", reading: "ねこ" }],
            [{ surface: "いぬ", reading: "いぬ" }],
            [{ surface: "あい", reading: "あい" }],
          ],
        })}
        onComplete={() => {}}
        onContinue={() => {}}
      />,
    );
    expect(screen.getByText("学校")).toBeTruthy();
    // The bare kana of the substituted option is no longer rendered.
    expect(screen.queryByText("がっこう")).toBeNull();
    // Option still selectable by its kana aria-label (word unchanged).
    expect(screen.getByLabelText("Hear and pick がっこう")).toBeTruthy();
  });
});

describe("WordImageMcqStepView — seeded option order (position-tell regression)", () => {
  // The es/fr §13 wave hand-writes option literals correct-first for
  // readability, and this view renders without any factory in between —
  // 31 shipped steps had the answer in slot 1 (found 2026-08-24). The
  // render must reorder via seededShuffle(step.id), the same contract as
  // build-step tile banks.
  it("renders options in seededShuffle(step.id) order, never authored order", () => {
    const step = baseStep({});
    render(
      <WordImageMcqStepView step={step} onComplete={() => {}} onContinue={() => {}} />,
    );
    const words = step.options.map((o) => o.word);
    const expected = seededShuffle(
      step.options.map((_, i) => i),
      step.id,
    ).map((i) => words[i]);
    // If the fixture's seed ever degenerates to the identity permutation,
    // this pin would assert nothing — change the fixture id, not the pin.
    expect(expected).not.toEqual(words);
    const rendered = screen
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? "")
      .filter((l) => l.startsWith("Hear and pick "))
      .map((l) => l.replace("Hear and pick ", ""));
    expect(rendered).toEqual(expected);
  });
});
