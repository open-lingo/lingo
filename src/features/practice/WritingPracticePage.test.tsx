/**
 * WritingPracticePage smoke: a generated writing item renders its English
 * prompt + an input; typing the expected target grades correct and advances;
 * a wrong answer surfaces the expected target; a low-vocab (empty) generation
 * shows the encouraging empty state.
 *
 * The tailored-practice engine reads real learner stores (localStorage), so we
 * mock `generatePracticeItems` to feed deterministic items. `useLang` is mocked
 * to skip the Router/LanguageContext providers; TTS is a no-op in happy-dom.
 * Grading (`gradeTypedAnswer`) runs for real against these Spanish items.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import type { PracticeItem } from "@/features/practice/engine";

const generatePracticeItems = vi.fn();

vi.mock("@/features/practice/engine", () => ({
  generatePracticeItems: (...args: unknown[]) => generatePracticeItems(...args),
}));
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => "es",
}));
vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  playJaAudio: vi.fn(),
}));

import { WritingPracticePage } from "./WritingPracticePage";

function item(overrides: Partial<PracticeItem> = {}): PracticeItem {
  return {
    id: "es:gen:t1:0",
    languageId: "es",
    target: "hola",
    reading: "hola",
    translation: "hello",
    exercisedAtomIds: [],
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  generatePracticeItems.mockReset();
});

describe("WritingPracticePage", () => {
  it("renders the English prompt and an input for a generated item", () => {
    generatePracticeItems.mockReturnValue([item()]);
    render(<WritingPracticePage />);

    expect(screen.getByText("hello")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: /your answer/i }),
    ).toBeInTheDocument();
    // The prompt does NOT leak the target answer before submitting.
    expect(screen.queryByText("hola")).not.toBeInTheDocument();
  });

  it("marks a correct typed answer and advances to the next item", () => {
    generatePracticeItems.mockReturnValue([
      item(),
      item({ id: "es:gen:t1:1", target: "gato", translation: "cat", reading: "gato" }),
    ]);
    render(<WritingPracticePage />);

    const input = screen.getByRole("textbox", { name: /your answer/i });
    fireEvent.change(input, { target: { value: "hola" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    expect(screen.getByText("Correct!")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    // Second item's prompt is now on screen.
    expect(screen.getByText("cat")).toBeInTheDocument();
    expect(screen.queryByText("hello")).not.toBeInTheDocument();
  });

  it("shows the expected answer when the typed answer is wrong", () => {
    // Distinct reading so the only "hola" on screen is the revealed target.
    generatePracticeItems.mockReturnValue([item({ reading: "OH-lah" })]);
    render(<WritingPracticePage />);

    const input = screen.getByRole("textbox", { name: /your answer/i });
    fireEvent.change(input, { target: { value: "zzzz" } });
    fireEvent.click(screen.getByRole("button", { name: "Check" }));

    // Wrong → nudge + reveal affordance, then the expected target appears.
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByText("hola")).toBeInTheDocument();
    expect(screen.getByText("The answer was:")).toBeInTheDocument();
  });

  it("shows the encouraging empty state when generation yields nothing", () => {
    generatePracticeItems.mockReturnValue([]);
    render(<WritingPracticePage />);

    expect(screen.getByText("Not enough words yet")).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: /your answer/i }),
    ).not.toBeInTheDocument();
  });
});
