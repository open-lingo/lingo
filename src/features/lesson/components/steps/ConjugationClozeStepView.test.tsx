/**
 * ConjugationClozeStepView contract: sentence frame + blank + derivation
 * cue + 4 engine-derived options; the answer is never printed in the frame
 * before a commit (the assembled `audioText` contains it, so nothing plays
 * pre-commit either). Mock conventions follow KanjiReadingStepView.test.tsx
 * / BuildSentenceTransform.test.tsx: i18n / tts / sfx / settings / language
 * are stubbed; AnnotatedText renders for real.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

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
    settings: {
      learning: {
        showRomaji: false,
        showRomanization: false,
        hiraganaRomajiAutoOff: true,
        katakanaRomajiAutoOff: true,
      },
    },
    updateSetting: vi.fn(),
  }),
}));
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

import { ConjugationClozeStepView } from "./ConjugationClozeStepView";
import { conjugationCloze } from "@/features/languages/ja/grammarHelpers";
import { playJaAudio } from "@/shared/tts";

afterEach(() => cleanup());
beforeEach(() => vi.clearAllMocks());

// Real factory output — the view test drives what content will ship.
const step = conjugationCloze({
  id: "cjc-view-test",
  before: "コーヒーを ",
  after: " ください。",
  verb: "のむ",
  form: "te",
  cueEn: "drink (and…)",
  meaningEn: "Please drink the coffee.",
});
const correct = step.options.find((o) => o.id === step.correctOptionId)!;
const wrong = step.options.find((o) => o.id !== step.correctOptionId)!;

const noop = () => {};

describe("ConjugationClozeStepView", () => {
  it("renders the sentence frame with a blank and the derivation cue", () => {
    const { container } = render(
      <ConjugationClozeStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    const frame = container.querySelector('[data-testid="conjugation-frame"]')!;
    // Hidden rt placeholders inject zero-width spaces between glyphs.
    const frameText = frame.textContent!.replace(/​/g, "");
    expect(frameText).toContain("コーヒーを");
    expect(frameText).toContain("ください。");
    expect(frameText).toContain("?"); // the unanswered pill
    const cue = container.querySelector('[data-testid="conjugation-cue"]')!;
    expect(cue.textContent).toContain("のむ");
    expect(cue.textContent).toContain("て form");
    expect(cue.textContent).toContain("drink (and…)");
  });

  it("renders 4 option buttons and does NOT pre-reveal the answer in the frame", () => {
    const { container } = render(
      <ConjugationClozeStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    for (const o of step.options) {
      expect(screen.getByRole("button", { name: o.text })).toBeTruthy();
    }
    expect(step.options).toHaveLength(4);
    // The answer (のんで) lives ONLY in the option grid pre-commit — never
    // in the frame, and no audio has played (audioText contains it).
    const frame = container.querySelector('[data-testid="conjugation-frame"]')!;
    expect(frame.textContent!.replace(/​/g, "")).not.toContain(correct.text);
    expect(playJaAudio).not.toHaveBeenCalled();
  });

  it("keeps Check disabled until an option is picked", () => {
    render(
      <ConjugationClozeStepView step={step} onComplete={noop} onContinue={noop} />,
    );
    expect(screen.getByRole("button", { name: "Check" })).toBeDisabled();
  });

  it("grades a correct pick, slots the form into the pill, fires onComplete once", () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ConjugationClozeStepView step={step} onComplete={onComplete} onContinue={noop} />,
    );
    fireEvent.click(screen.getByRole("button", { name: correct.text }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith("cjc-view-test", true);
    const frame = container.querySelector('[data-testid="conjugation-frame"]')!;
    expect(frame.textContent!.replace(/​/g, "")).toContain(correct.text);
  });

  it("grades a wrong pick and reveals the correct form", () => {
    const onComplete = vi.fn();
    const { container } = render(
      <ConjugationClozeStepView step={step} onComplete={onComplete} onContinue={noop} />,
    );
    fireEvent.click(screen.getByRole("button", { name: wrong.text }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(onComplete).toHaveBeenCalledWith("cjc-view-test", false);
    const frame = container.querySelector('[data-testid="conjugation-frame"]')!;
    // Correct form slots into the pill; the wrong pick is echoed below it.
    expect(frame.textContent!.replace(/​/g, "")).toContain(correct.text);
    expect(frame.textContent).toContain("You picked");
  });

  it("plays the assembled sentence only after a correct commit (320ms delay)", () => {
    vi.useFakeTimers();
    try {
      render(
        <ConjugationClozeStepView step={step} onComplete={noop} onContinue={noop} />,
      );
      fireEvent.click(screen.getByRole("button", { name: correct.text }));
      fireEvent.click(screen.getByRole("button", { name: "Check" }));
      expect(playJaAudio).not.toHaveBeenCalled();
      vi.advanceTimersByTime(400);
      expect(playJaAudio).toHaveBeenCalledWith(step.audioText);
    } finally {
      vi.useRealTimers();
    }
  });

  it("advances via onContinue after submitting", () => {
    const onContinue = vi.fn();
    render(
      <ConjugationClozeStepView step={step} onComplete={noop} onContinue={onContinue} />,
    );
    fireEvent.click(screen.getByRole("button", { name: correct.text }));
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
