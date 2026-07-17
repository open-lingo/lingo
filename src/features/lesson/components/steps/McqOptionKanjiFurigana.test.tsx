/**
 * MCQ option kanji furigana (Spencer 2026-07-17 follow-up): verifies that
 * `optionAnnotations` flow through AnnotatedText's kanji branch — a kanji
 * option stamped past its window shows furigana while its atom is
 * unmastered and hides it once FSRS-mastered, okurigana-aligned.
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
    settings: { learning: { showRomaji: false } },
    updateSetting: vi.fn(),
  }),
}));
// SRS mastery: mock ONLY getCardState (isMastered stays the real predicate).
const getCardStateMock = vi.fn();
vi.mock("@/features/flashcards/engine", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getCardState: (id: string) => getCardStateMock(id),
}));

import { MultipleChoiceStepView } from "./MultipleChoiceStepView";
import { MASTERED_INTERVAL_DAYS } from "@/features/flashcards/engine";
import type { MultipleChoiceStep } from "../../types";

const MASTERED_STATE = {
  recognition: { interval: MASTERED_INTERVAL_DAYS + 10 },
  production: { interval: MASTERED_INTERVAL_DAYS + 10 },
} as never;

const step: MultipleChoiceStep = {
  id: "test-mcq-kanji-furigana",
  type: "multiple_choice",
  prompt: "Which word means school?",
  options: [
    { id: "correct", text: "がっこう" },
    { id: "opt-1", text: "ねこ" },
  ],
  correctOptionId: "correct",
  // Post-applyKanjiSurfaces shape: kanji surface, kana reading kept, window
  // closed — visibility hands over to the SRS gate.
  optionAnnotations: [
    [
      {
        surface: "学校",
        reading: "がっこう",
        atomId: "ja-m6-1-gakkou",
        furiganaWindowOpen: false,
      },
    ],
    undefined,
  ],
};

function renderStep() {
  return render(
    <MultipleChoiceStepView
      step={step}
      onComplete={() => {}}
      onContinue={() => {}}
    />,
  );
}

function optionRt(container: HTMLElement): HTMLElement {
  const ruby = Array.from(container.querySelectorAll("ruby")).find((r) =>
    (r.textContent ?? "").includes("学校"),
  );
  expect(ruby, "the kanji option must render as ruby").toBeDefined();
  return ruby!.querySelector("rt.kana-helper") as HTMLElement;
}

beforeEach(() => {
  getCardStateMock.mockReset();
  getCardStateMock.mockReturnValue(undefined); // no SRS state → unmastered
});

describe("MCQ optionAnnotations — kanji furigana through the shared gate", () => {
  it("past-window + unmastered: option shows 学校 with visible furigana", () => {
    const { container } = renderStep();
    const rt = optionRt(container);
    expect(rt.getAttribute("data-visible")).toBe("true");
    expect(rt.textContent).toBe("がっこう");
    expect(getCardStateMock).toHaveBeenCalledWith("ja-m6-1-gakkou");
  });

  it("past-window + mastered: option shows bare 学校 (rt hidden, ZWSP)", () => {
    getCardStateMock.mockReturnValue(MASTERED_STATE);
    const { container } = renderStep();
    const rt = optionRt(container);
    expect(rt.getAttribute("data-visible")).toBe("false");
    expect(rt.textContent).toBe("​");
  });
});
