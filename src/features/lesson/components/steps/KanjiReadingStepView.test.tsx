/**
 * KanjiReadingStepView contract: pick the kana reading of a kanji surface.
 *
 * The load-bearing assertion is FURIGANA SUPPRESSION — this view renders the
 * very kanji it is testing, so a floating <rt> reading would print the
 * answer above the question. AnnotatedText is deliberately NOT mocked here
 * (unlike the other step-view tests): the whole point is proving the real
 * ruby renderer emits no reading for our furigana-OFF annotation, with
 * settings that would otherwise force helpers on. Settings/Language
 * contexts are stubbed the same way AnnotatedText.neverMix.test.tsx stubs
 * them — neither spins up in happy-dom.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { KanjiReadingStep } from "../../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, def?: string) => (typeof def === "string" ? def : key),
  }),
}));
vi.mock("@/shared/tts", () => ({
  playJaAudio: vi.fn(),
  getTtsUrl: vi.fn(() => "u"),
  hasTtsAudio: vi.fn(() => true),
  useAutoPlayJaAudio: vi.fn(),
}));
// Helpers forced ON — proving the kanji gate beats every setting.
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({
    settings: {
      learning: {
        showRomanization: {},
        hiraganaRomajiAutoOff: false,
        katakanaRomajiAutoOff: false,
      },
    },
  }),
}));
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

import { KanjiReadingStepView } from "./KanjiReadingStepView";

afterEach(() => cleanup());

function makeStep(overrides: Partial<KanjiReadingStep> = {}): KanjiReadingStep {
  return {
    id: "kr-test",
    type: "kanji_reading",
    kanji: "水",
    reading: "みず",
    meaningEn: "water",
    // Furigana-OFF shape emitted by the `kanjiReading` factory.
    promptAnnotation: [{ surface: "水", reading: "水", atomId: "ja-m3-3-v-mizu" }],
    options: [
      { id: "opt-0", text: "すい" },
      { id: "correct", text: "みず" },
      { id: "opt-2", text: "みつ" },
      { id: "opt-3", text: "みす" },
    ],
    correctOptionId: "correct",
    audioText: "みず",
    exercisedAtoms: ["ja-m3-3-v-mizu"],
    modality: "recognition",
    ...overrides,
  };
}

describe("KanjiReadingStepView", () => {
  it("shows the kanji with NO furigana — the answer is never printed above the prompt", () => {
    const { container } = render(
      <KanjiReadingStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(ruby!.textContent).toContain("水");
    const rt = container.querySelector("rt");
    // <rt> exists (layout stability) but carries no reading and is hidden.
    expect(rt!.textContent).not.toContain("みず");
    expect(rt!.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not leak the reading anywhere in the prompt before an answer", () => {
    const { container } = render(
      <KanjiReadingStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    const prompt = container.querySelector("[data-testid='kanji-reading-prompt']")!;
    expect(prompt.textContent).not.toContain("みず");
  });

  it("grades a correct pick and fires onComplete exactly once", () => {
    const onComplete = vi.fn();
    render(
      <KanjiReadingStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "みず" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("kr-test", true);
  });

  it("grades a wrong pick and reveals the correct reading in the banner", () => {
    const onComplete = vi.fn();
    render(
      <KanjiReadingStepView step={makeStep()} onComplete={onComplete} onContinue={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "すい" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("kr-test", false);
    // Reading is only disclosed AFTER the learner commits.
    expect(document.body.textContent).toContain("みず");
  });

  it("keeps Check disabled until an option is picked", () => {
    render(
      <KanjiReadingStepView step={makeStep()} onComplete={vi.fn()} onContinue={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
  });

  it("advances via onContinue after submitting", () => {
    const onContinue = vi.fn();
    render(
      <KanjiReadingStepView step={makeStep()} onComplete={vi.fn()} onContinue={onContinue} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "みず" }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
