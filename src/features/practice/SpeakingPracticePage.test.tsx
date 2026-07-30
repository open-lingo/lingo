import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { PracticeItem } from "@/features/practice/engine";
// Initialize the real i18next singleton so `t(key, default, opts)`
// interpolates our inline defaults (`Item {{current}} of {{total}}`).
import "@/shared/i18n/i18n";

// ── Mocks ────────────────────────────────────────────────────────────────────
// Language context throws without a provider; give it a fixed course.
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

// Control exactly what the generator returns per test.
const generatePracticeItems = vi.fn<(lang: string, opts: unknown) => PracticeItem[]>();
vi.mock("@/features/practice/engine", () => ({
  generatePracticeItems: (lang: string, opts: unknown) => generatePracticeItems(lang, opts),
}));

// TTS + stats touch the DOM / localStorage — stub them out.
vi.mock("@/shared/tts", () => ({ playJaAudio: vi.fn() }));
vi.mock("./practiceStats", () => ({ recordPracticeResult: vi.fn() }));

// SRS credit path — spy so we can assert the conservative wiring.
const getCardState = vi.fn<(id: string) => unknown>();
const setCardState = vi.fn<(id: string, state: unknown) => void>();
const gradeFromLesson = vi.fn<(state: unknown, modality: unknown, outcome: unknown) => unknown>(
  () => ({ marker: "graded" }),
);
vi.mock("@/features/flashcards/engine", () => ({
  getCardState: (id: string) => getCardState(id),
  setCardState: (id: string, state: unknown) => setCardState(id, state),
  gradeFromLesson: (state: unknown, modality: unknown, outcome: unknown) =>
    gradeFromLesson(state, modality, outcome),
}));

import { SpeakingPracticePage } from "./SpeakingPracticePage";

function item(overrides: Partial<PracticeItem>): PracticeItem {
  const target = overrides.target ?? "すし";
  return {
    id: "ja:gen:t:0",
    languageId: "ja",
    target,
    reading: "sushi",
    translation: "sushi",
    exercisedAtomIds: ["ja:sushi"],
    // Echo item by default (audio === target); tests set promptAudioText to
    // make a response item.
    promptAudioText: target,
    ...overrides,
  };
}

beforeEach(() => {
  generatePracticeItems.mockReset();
  getCardState.mockReset();
  setCardState.mockReset();
  gradeFromLesson.mockClear();
});

describe("SpeakingPracticePage", () => {
  it("renders a generated session with the first item and progress", () => {
    generatePracticeItems.mockReturnValue([
      item({ id: "a", target: "すし" }),
      item({ id: "b", target: "みず" }),
    ]);
    render(<SpeakingPracticePage />);

    expect(generatePracticeItems).toHaveBeenCalledWith(
      "ja",
      expect.objectContaining({ surface: "speaking", count: 12 }),
    );
    expect(screen.getByText("すし")).toBeInTheDocument();
    expect(screen.getByText("Item 1 of 2")).toBeInTheDocument();
  });

  it("advances through the session (fallback self-rate when speech is unavailable)", () => {
    // happy-dom has no SpeechRecognition → mic taps reveal the answer instead.
    getCardState.mockReturnValue({ some: "state" });
    generatePracticeItems.mockReturnValue([
      item({ id: "a", target: "すし", exercisedAtomIds: ["ja:sushi"] }),
      item({ id: "b", target: "みず", exercisedAtomIds: [] }),
    ]);
    render(<SpeakingPracticePage />);

    // Reveal, then self-rate correct → advances + credits SRS conservatively.
    fireEvent.click(screen.getByLabelText("Reveal answer"));
    fireEvent.click(screen.getByText("I said it"));

    expect(screen.getByText("Item 2 of 2")).toBeInTheDocument();
    expect(screen.getByText("みず")).toBeInTheDocument();
    // Production modality credited for the first item's atom.
    expect(gradeFromLesson).toHaveBeenCalledWith(
      { some: "state" },
      "production",
      expect.objectContaining({ correct: true }),
    );
    expect(setCardState).toHaveBeenCalledWith("ja:sushi", { marker: "graded" });
  });

  it("shows an encouraging empty state when the learner has too little vocab", () => {
    generatePracticeItems.mockReturnValue([]);
    render(<SpeakingPracticePage />);

    expect(
      screen.getByText("Keep learning to unlock speaking practice"),
    ).toBeInTheDocument();
  });
});
