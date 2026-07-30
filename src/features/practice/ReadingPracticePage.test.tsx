import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import type { PracticeItem } from "./engine";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const s = opts && typeof opts.defaultValue === "string" ? opts.defaultValue : key;
      return s.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => String(opts?.[k] ?? ""));
    },
  }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => "ja",
  useLangPath: () => (p: string) => `/ja/${p}`,
}));

const generatePracticeItems = vi.fn();
vi.mock("./engine", () => ({
  generatePracticeItems: (...args: unknown[]) => generatePracticeItems(...args),
}));

const getCardState = vi.fn((..._a: unknown[]) => undefined as unknown);
const setCardState = vi.fn((..._a: unknown[]) => {});
const gradeFromLesson = vi.fn((..._a: unknown[]) => ({ graded: true }));
vi.mock("@/features/flashcards/engine", () => ({
  getCardState: (...a: unknown[]) => getCardState(...a),
  setCardState: (...a: unknown[]) => setCardState(...a),
  gradeFromLesson: (...a: unknown[]) => gradeFromLesson(...a),
}));

import { ReadingPracticePage } from "./ReadingPracticePage";

const clozeItem: PracticeItem = {
  id: "ja:gen:like:0",
  languageId: "ja",
  target: "わたしは すし が すきです",
  reading: "watashi wa sushi ga suki desu",
  translation: "I like sushi",
  exercisedAtomIds: ["ja:sushi", "ja:watashi"],
  blank: {
    slotKey: "obj",
    answer: "すし",
    answerReading: "sushi",
    distractors: [
      { surface: "みず", reading: "mizu", meaningEn: "water" },
      { surface: "ねこ", reading: "neko", meaningEn: "cat" },
      { surface: "ほん", reading: "hon", meaningEn: "book" },
    ],
  },
};

describe("ReadingPracticePage (madlibs cloze)", () => {
  beforeEach(() => {
    generatePracticeItems.mockReset();
    getCardState.mockReset();
    setCardState.mockReset();
    gradeFromLesson.mockClear();
  });

  it("renders a cloze item with a masked blank and shuffled options including the answer", () => {
    generatePracticeItems.mockReturnValue([clozeItem]);
    render(<ReadingPracticePage />);

    // Meaning hint present.
    expect(screen.getByText("I like sushi")).toBeInTheDocument();
    // Progress indicator.
    expect(screen.getByText("1 of 1")).toBeInTheDocument();

    // The answer is masked out of the sentence (not shown as plain text yet),
    // but all four options are offered as tappable buttons.
    const buttons = screen.getAllByRole("button");
    const optionLabels = buttons.map((b) => b.textContent ?? "");
    expect(optionLabels.some((l) => l.includes("すし"))).toBe(true);
    expect(optionLabels.some((l) => l.includes("みず"))).toBe(true);
    expect(optionLabels.some((l) => l.includes("ねこ"))).toBe(true);
    expect(optionLabels.some((l) => l.includes("ほん"))).toBe(true);
  });

  it("marks correct, credits SRS for exercised atoms, and reveals the filled sentence", () => {
    generatePracticeItems.mockReturnValue([clozeItem]);
    // Both atoms already have SRS state → both should be credited.
    getCardState.mockReturnValue({ existing: true });
    render(<ReadingPracticePage />);

    const answerBtn = screen
      .getAllByRole("button")
      .find((b) => (b.textContent ?? "").includes("すし"))!;
    fireEvent.click(answerBtn);

    expect(screen.getByText("Nice reading.")).toBeInTheDocument();
    expect(screen.getByText("Score 1/1")).toBeInTheDocument();
    // Conservative SRS credit ran for each exercised atom that had state.
    expect(gradeFromLesson).toHaveBeenCalledTimes(2);
    expect(setCardState).toHaveBeenCalledTimes(2);
    expect(gradeFromLesson).toHaveBeenCalledWith(
      { existing: true },
      "recognition",
      { correct: true, retried: false },
    );
  });

  it("marks wrong, shows the correct answer, and does not credit SRS", () => {
    generatePracticeItems.mockReturnValue([clozeItem]);
    getCardState.mockReturnValue({ existing: true });
    render(<ReadingPracticePage />);

    const wrongBtn = screen
      .getAllByRole("button")
      .find((b) => (b.textContent ?? "").includes("みず"))!;
    fireEvent.click(wrongBtn);

    expect(screen.getByText("Answer: すし")).toBeInTheDocument();
    expect(screen.getByText("Score 0/1")).toBeInTheDocument();
    expect(gradeFromLesson).not.toHaveBeenCalled();
  });

  it("advances to the next item and finishes to a summary", () => {
    generatePracticeItems.mockReturnValue([
      clozeItem,
      { ...clozeItem, id: "ja:gen:like:1" },
    ]);
    getCardState.mockReturnValue(undefined);
    render(<ReadingPracticePage />);

    // Answer item 1.
    fireEvent.click(
      screen.getAllByRole("button").find((b) => (b.textContent ?? "").includes("すし"))!,
    );
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();

    // Answer item 2 → Finish → summary.
    fireEvent.click(
      screen.getAllByRole("button").find((b) => (b.textContent ?? "").includes("すし"))!,
    );
    fireEvent.click(screen.getByRole("button", { name: /Finish/ }));

    expect(screen.getByText("Session complete")).toBeInTheDocument();
    expect(screen.getByText("You read 2 of 2 correctly.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /New session/ })).toBeInTheDocument();
  });

  it("shows an encouraging empty state when no items generate (low vocab)", () => {
    generatePracticeItems.mockReturnValue([]);
    render(<ReadingPracticePage />);

    expect(screen.getByText("Learn a few more words first")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("supports a straight-read beat for items without a blank", () => {
    const readOnly: PracticeItem = {
      id: "ja:seed:hello",
      languageId: "ja",
      target: "こんにちは",
      reading: "konnichiwa",
      translation: "hello",
      exercisedAtomIds: [],
    };
    generatePracticeItems.mockReturnValue([readOnly]);
    render(<ReadingPracticePage />);

    const gotIt = screen.getByRole("button", { name: /Got it/ });
    expect(within(gotIt).getByText("Got it")).toBeInTheDocument();
    fireEvent.click(gotIt);
    expect(screen.getByText("Session complete")).toBeInTheDocument();
  });
});
