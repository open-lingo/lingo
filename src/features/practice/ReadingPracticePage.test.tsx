import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Conversation, Story } from "./content";
import type { KnownAtom } from "./engine";

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

// Reached module — enough to unlock the mocked content.
vi.mock("./useCourseLevel", () => ({ useCourseLevel: () => 7 }));

// Render TappableText as plain (tagged) text so tests don't need the
// dictionary-modal provider; the real component is exercised in its own test.
vi.mock("@/features/dictionary/TappableText", () => ({
  TappableText: ({ text, className }: { text: string; className?: string }) => (
    <span data-testid="tappable" className={className}>
      {text}
    </span>
  ),
}));

const getStories = vi.fn((): Story[] => []);
const getConversations = vi.fn((): Conversation[] => []);
vi.mock("./content", () => ({
  getStories: () => getStories(),
  getConversations: () => getConversations(),
}));

const getKnownAtomsByPos = vi.fn((): KnownAtom[] => []);
vi.mock("./engine", () => ({
  getKnownAtomsByPos: () => getKnownAtomsByPos(),
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

function noun(id: string, surface: string, reading: string, meaningEn: string): KnownAtom {
  return { id, surface, reading, meaningEn, pos: "noun", tier: "reviewing", due: false, weight: 1 };
}

const STORY_A: Story = {
  id: "ja-test-cafe",
  languageId: "ja",
  module: 3,
  title: "At the cafe",
  theme: "A quiet morning.",
  sentences: [{ text: "コーヒーを のみます。", translation: "I drink coffee.", reading: "koohii o nomimasu" }],
};

const STORY_B: Story = {
  id: "ja-test-park",
  languageId: "ja",
  module: 3,
  title: "In the park",
  theme: "A walk in the park.",
  sentences: [{ text: "さんぽします。", translation: "I take a walk." }],
};

// Only コーヒー appears verbatim in a story sentence → exactly one cloze card.
const KNOWN = [
  noun("ja:coffee", "コーヒー", "koohii", "coffee"),
  noun("ja:water", "みず", "mizu", "water"),
  noun("ja:book", "ほん", "hon", "book"),
];

describe("ReadingPracticePage", () => {
  beforeEach(() => {
    getStories.mockReset();
    getConversations.mockReset();
    getKnownAtomsByPos.mockReset();
    getCardState.mockReset();
    setCardState.mockReset();
    gradeFromLesson.mockClear();
    getConversations.mockReturnValue([]);
  });

  it("lists available stories and opens the picked one as tappable text + a question", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    render(<ReadingPracticePage />);

    // Landing view: browse the module-gated story list first.
    expect(screen.getByText("Choose a story")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /At the cafe/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /In the park/ })).toBeInTheDocument();

    // Pick a story → it opens.
    fireEvent.click(screen.getByRole("button", { name: /At the cafe/ }));

    // Story reads via TappableText (inline lookup surface).
    expect(screen.getByRole("heading", { name: "At the cafe" })).toBeInTheDocument();
    const tappable = screen.getAllByTestId("tappable");
    expect(tappable.some((el) => el.textContent === "コーヒーを のみます。")).toBe(true);

    // Move to the comprehension check.
    fireEvent.click(screen.getByRole("button", { name: /Check understanding/ }));
    expect(screen.getByText("What is this story mostly about?")).toBeInTheDocument();
    // The correct gist is offered alongside a distractor drawn from other content.
    expect(screen.getByRole("button", { name: "A quiet morning." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A walk in the park." })).toBeInTheDocument();
  });

  it("returns to the story list via the back control", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    render(<ReadingPracticePage />);

    fireEvent.click(screen.getByRole("button", { name: /At the cafe/ }));
    expect(screen.getByRole("heading", { name: "At the cafe" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /All stories/ }));
    expect(screen.getByText("Choose a story")).toBeInTheDocument();
  });

  it("grades a comprehension answer and shows the score", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    render(<ReadingPracticePage />);

    fireEvent.click(screen.getByRole("button", { name: /At the cafe/ }));
    fireEvent.click(screen.getByRole("button", { name: /Check understanding/ }));
    // Answer every question, then finish.
    fireEvent.click(screen.getByRole("button", { name: "A quiet morning." }));
    fireEvent.click(screen.getByRole("button", { name: "I drink coffee." }));
    fireEvent.click(screen.getByRole("button", { name: /See how you did/ }));

    expect(screen.getByText("Nice reading")).toBeInTheDocument();
    expect(screen.getByText("You got 2 of 2 right.")).toBeInTheDocument();
  });

  it("runs fill-in-the-blanks over the chosen story, blanks a word, and grades it", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    // Card state exists → a correct answer credits recognition SRS.
    getCardState.mockReturnValue({ existing: true });
    render(<ReadingPracticePage />);

    // Open the story, then switch to the fill-in-the-blanks beat (radios).
    fireEvent.click(screen.getByRole("button", { name: /At the cafe/ }));
    fireEvent.click(screen.getByRole("radio", { name: /Fill in the blanks/ }));

    // Meaning hint for the authored sentence is shown.
    expect(screen.getByText("I drink coffee.")).toBeInTheDocument();
    // Options include the answer + same-POS known distractors.
    const optionButtons = screen.getAllByRole("button");
    const labels = optionButtons.map((b) => b.textContent ?? "");
    expect(labels.some((l) => l.includes("コーヒー"))).toBe(true);
    expect(labels.some((l) => l.includes("みず"))).toBe(true);

    // Pick the correct answer → reveal + credit.
    fireEvent.click(optionButtons.find((b) => (b.textContent ?? "").includes("コーヒー"))!);
    expect(screen.getByText("Nice reading.")).toBeInTheDocument();
    expect(screen.getByText("Score 1/1")).toBeInTheDocument();
    expect(gradeFromLesson).toHaveBeenCalledWith(
      { existing: true },
      "recognition",
      { correct: true, retried: false },
    );
  });

  it("shows an encouraging empty state when there is no content at the learner's level", () => {
    getStories.mockReturnValue([]);
    getConversations.mockReturnValue([]);
    getKnownAtomsByPos.mockReturnValue([]);
    render(<ReadingPracticePage />);

    expect(screen.getByText("Nothing to read just yet")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
