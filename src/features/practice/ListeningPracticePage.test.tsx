import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { PracticeItem } from "./engine";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const s =
        opts && typeof opts.defaultValue === "string" ? opts.defaultValue : key;
      return s.replace(/\{\{(\w+)\}\}/g, (_, k) => String(opts?.[k] ?? ""));
    },
  }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => "ja",
  useLangPath: () => (p: string) => `/ja/${p}`,
}));

const playJaAudio = vi.fn();
vi.mock("@/shared/tts", () => ({
  playJaAudio: (...args: unknown[]) => playJaAudio(...args),
  // Report audio available so the "no audio" hint stays hidden in these tests.
  getTtsUrl: () => "https://cdn/audio.mp3",
}));

const setCardState = vi.fn();
vi.mock("@/features/flashcards/engine", () => ({
  getCardState: () => undefined,
  setCardState: (...args: unknown[]) => setCardState(...args),
  createInitialState: () => ({ recognition: {}, production: {} }),
  gradeFromLesson: (state: unknown) => state,
}));

let mockItems: PracticeItem[] = [];
vi.mock("./engine", () => ({
  generatePracticeItems: () => mockItems,
}));

import { ListeningPracticePage } from "./ListeningPracticePage";

function item(n: number, translation: string, atomIds: string[]): PracticeItem {
  return {
    id: `ja:gen:t:${n}`,
    languageId: "ja",
    target: `文${n}`,
    reading: `bun${n}`,
    translation,
    exercisedAtomIds: atomIds,
    promptAudioText: `文${n}`,
    sourceTemplateId: "t",
  };
}

describe("ListeningPracticePage", () => {
  beforeEach(() => {
    playJaAudio.mockClear();
    setCardState.mockClear();
  });

  it("renders a generated item with a play control and comprehension choices", () => {
    mockItems = [
      item(1, "I drink coffee", ["ja:coffee"]),
      item(2, "I eat sushi", ["ja:sushi"]),
      item(3, "I read a book", ["ja:book"]),
    ];
    render(<ListeningPracticePage />);

    expect(screen.getByRole("button", { name: "Play audio" })).toBeInTheDocument();
    // Correct meaning + same-set distractors are all offered.
    expect(screen.getByRole("button", { name: "I drink coffee" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I eat sushi" })).toBeInTheDocument();
    // Autoplay fired for the first item.
    expect(playJaAudio).toHaveBeenCalled();
  });

  it("reveals the sentence, credits SRS, and advances on a correct choice", () => {
    mockItems = [
      item(1, "I drink coffee", ["ja:coffee"]),
      item(2, "I eat sushi", ["ja:sushi"]),
      item(3, "I read a book", ["ja:book"]),
    ];
    render(<ListeningPracticePage />);

    // Sentence text is hidden until answered.
    expect(screen.queryByText("文1")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "I drink coffee" }));

    // Reveal shows the target sentence + reading.
    expect(screen.getByText("文1")).toBeInTheDocument();
    expect(screen.getByText("bun1")).toBeInTheDocument();
    // Correct answer credits the exercised atom's SRS state.
    expect(setCardState).toHaveBeenCalledWith("ja:coffee", expect.anything());

    // Advancing moves to item 2.
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Item 2 of 3")).toBeInTheDocument();
  });

  it("shows an encouraging empty state when no items generate", () => {
    mockItems = [];
    render(<ListeningPracticePage />);
    expect(screen.getByText("Not enough words yet")).toBeInTheDocument();
  });
});
