/**
 * ListeningPracticePage smoke — now sourced from AUTHORED content (stories +
 * conversations) rather than generated sentences. Content, course level, TTS,
 * inline lookup, and SRS are mocked; the page's own item assembly + MCQ +
 * reveal flow run for real.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

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

vi.mock("./useCourseLevel", () => ({ useCourseLevel: () => 7 }));

vi.mock("@/shared/tts/prefetch", () => ({ usePrefetchAudio: () => {} }));

const playConversationLine = vi.fn();
vi.mock("./conversation/conversationAudio", () => ({
  playConversationLine: (...a: unknown[]) => playConversationLine(...a),
  conversationLineHasAudio: () => true,
}));

vi.mock("./conversation/conversationSrs", () => ({
  lineAtomIds: () => ["atom:1"],
}));

vi.mock("@/features/dictionary/TappableText", () => ({
  TappableText: ({ text }: { text: string }) => <span>{text}</span>,
}));

const setCardState = vi.fn();
vi.mock("@/features/flashcards/engine", () => ({
  getCardState: () => undefined,
  setCardState: (...a: unknown[]) => setCardState(...a),
  createInitialState: () => ({ recognition: {}, production: {} }),
  gradeFromLesson: (state: unknown) => state,
}));

const getStories = vi.fn();
const getConversations = vi.fn();
vi.mock("@/features/practice/content", () => ({
  getStories: (...a: unknown[]) => getStories(...a),
  getConversations: (...a: unknown[]) => getConversations(...a),
}));

import { ListeningPracticePage } from "./ListeningPracticePage";

const STORY = {
  id: "ja-m3-day",
  languageId: "ja",
  module: 3,
  title: "A day",
  theme: "",
  sentences: [
    { text: "コーヒーをのむ。", translation: "I drink coffee", reading: "koohii" },
    { text: "すしをたべる。", translation: "I eat sushi", reading: "sushi" },
    { text: "ほんをよむ。", translation: "I read a book", reading: "hon" },
  ],
};

beforeEach(() => {
  cleanup();
  playConversationLine.mockClear();
  setCardState.mockClear();
  getStories.mockReturnValue([STORY]);
  getConversations.mockReturnValue([]);
  // Fixed seed → deterministic session order ([book, sushi, coffee]).
  vi.spyOn(Math, "random").mockReturnValue(0);
});

describe("ListeningPracticePage (curated)", () => {
  it("renders a play control + comprehension choices from authored lines", () => {
    render(<ListeningPracticePage />);
    expect(screen.getByRole("button", { name: "Play audio" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "I drink coffee" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I eat sushi" })).toBeInTheDocument();
    // Auto-play fired for the first item.
    expect(playConversationLine).toHaveBeenCalled();
  });

  it("reveals the line (tappable), credits SRS, and advances on a correct choice", () => {
    render(<ListeningPracticePage />);
    // Fixed seed → the first item is the "book" line. The sentence is hidden
    // until the learner answers.
    expect(screen.queryByText("ほんをよむ。")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "I read a book" }));

    // Reveal shows the (tappable) target line + its reading, and SRS is credited.
    expect(screen.getByText("ほんをよむ。")).toBeInTheDocument();
    expect(screen.getByText("hon")).toBeInTheDocument();
    expect(setCardState).toHaveBeenCalledWith("atom:1", expect.anything());

    // Advancing moves to the next item.
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Item 2 of 3")).toBeInTheDocument();
  });

  it("shows an empty state when the language has no authored content", () => {
    getStories.mockReturnValue([]);
    getConversations.mockReturnValue([]);
    render(<ListeningPracticePage />);
    expect(screen.getByText("No listening content yet")).toBeInTheDocument();
  });
});
