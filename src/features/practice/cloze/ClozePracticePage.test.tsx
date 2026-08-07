import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Conversation, Story } from "../content";
import type { KnownAtom } from "../engine";

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
vi.mock("../useCourseLevel", () => ({ useCourseLevel: () => 7 }));

// Render TappableText as plain (tagged) text so tests don't need the
// dictionary-modal provider; the real component is exercised in its own test.
vi.mock("@/features/dictionary/TappableText", () => ({
  TappableText: ({ text, className }: { text: string; className?: string }) => (
    <span data-testid="tappable" className={className}>
      {text}
    </span>
  ),
}));

// Settings drive the romaji reading-aid gate; mutable so tests flip showRomanization.
const mockSettings = {
  learning: {
    showRomanization: {} as Record<string, boolean>,
    hiraganaRomajiAutoOff: false,
    katakanaRomajiAutoOff: false,
    romanizationOnForDay: null as string | null,
  },
};
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

const getStories = vi.fn((): Story[] => []);
const getConversations = vi.fn((): Conversation[] => []);
vi.mock("@/features/practice/content", () => ({
  getStories: () => getStories(),
  getConversations: () => getConversations(),
}));

const getKnownAtomsByPos = vi.fn((): KnownAtom[] => []);
vi.mock("@/features/practice/engine", () => ({
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

import { ClozePracticePage } from "./ClozePracticePage";

function noun(id: string, surface: string, reading: string, meaningEn: string): KnownAtom {
  return { id, surface, reading, meaningEn, pos: "noun", tier: "reviewing", due: false, weight: 1 };
}

const STORY_A: Story = {
  id: "ja-test-cafe",
  languageId: "ja",
  module: 3,
  level: 1,
  title: "At the cafe",
  theme: "A quiet morning.",
  questions: [],
  sentences: [{ text: "コーヒーを のみます。", translation: "I drink coffee.", reading: "koohii o nomimasu" }],
};

// Only コーヒー appears verbatim in the story sentence → exactly one cloze card.
const ANSWER_SURFACE = "コーヒー";
const KNOWN = [
  noun("ja:coffee", ANSWER_SURFACE, "koohii", "coffee"),
  noun("ja:water", "みず", "mizu", "water"),
  noun("ja:book", "ほん", "hon", "book"),
];

describe("ClozePracticePage", () => {
  beforeEach(() => {
    getStories.mockReset();
    getConversations.mockReset();
    getKnownAtomsByPos.mockReset();
    getCardState.mockReset();
    setCardState.mockReset();
    gradeFromLesson.mockClear();
    getConversations.mockReturnValue([]);
    mockSettings.learning.showRomanization = {};
    mockSettings.learning.romanizationOnForDay = null;
  });

  it("renders a cloze card drawn from authored content", () => {
    getStories.mockReturnValue([STORY_A]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    render(<ClozePracticePage />);

    expect(screen.getByText(/Fill in the blank/i)).toBeTruthy();
    // The meaning hint for the pooled sentence is shown.
    expect(screen.getByText("I drink coffee.")).toBeInTheDocument();
  });

  it("shows an empty state when the learner knows too few words", () => {
    getStories.mockReturnValue([STORY_A]);
    getKnownAtomsByPos.mockReturnValue([]);
    render(<ClozePracticePage />);

    expect(screen.getByText(/No fill-the-blanks yet/i)).toBeTruthy();
  });

  it("records a practice result and credits SRS on a correct pick", () => {
    getStories.mockReturnValue([STORY_A]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    getCardState.mockReturnValue({ existing: true });
    render(<ClozePracticePage />);

    const optionButtons = screen.getAllByRole("button");
    const answerButton = optionButtons.find((b) => (b.textContent ?? "").includes("コーヒー"))!;
    fireEvent.click(answerButton);

    expect(screen.getByText("Nice reading.")).toBeInTheDocument();
    expect(gradeFromLesson).toHaveBeenCalledWith(
      { existing: true },
      "recognition",
      { correct: true, retried: false },
    );
  });

  it("grades Again on a wrong pick instead of writing nothing", () => {
    getStories.mockReturnValue([STORY_A]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    getCardState.mockReturnValue({ existing: true });
    render(<ClozePracticePage />);

    const optionButtons = screen.getAllByRole("button");
    const wrongButton = optionButtons.find(
      (b) => (b.textContent ?? "") !== "" && !(b.textContent ?? "").includes(ANSWER_SURFACE),
    )!;
    fireEvent.click(wrongButton);

    expect(gradeFromLesson).toHaveBeenCalledWith(
      { existing: true },
      "recognition",
      { correct: false, retried: false },
    );
    expect(setCardState).toHaveBeenCalled();
  });

  it("never seeds a card that has no SRS state yet", () => {
    getStories.mockReturnValue([STORY_A]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    getCardState.mockReturnValue(undefined);
    render(<ClozePracticePage />);

    const answerButton = screen
      .getAllByRole("button")
      .find((b) => (b.textContent ?? "").includes(ANSWER_SURFACE))!;
    fireEvent.click(answerButton);

    expect(gradeFromLesson).not.toHaveBeenCalled();
    expect(setCardState).not.toHaveBeenCalled();
  });
});
