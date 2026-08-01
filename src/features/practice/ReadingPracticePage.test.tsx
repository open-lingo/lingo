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

// App-wide dictionary modal (tap-a-word) — a no-op stub in tests.
const openWord = vi.fn();
vi.mock("@/features/dictionary/DictionaryModalContext", () => ({
  useDictionaryModal: () => ({ openWord, open: vi.fn(), close: vi.fn() }),
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

// Dictionary service — deterministic entries for the preview word extractor.
const DICT_ENTRIES = [
  { id: "ja:coffee", languageId: "ja", surface: "コーヒー", reading: "koohii", meaningEn: "coffee", pos: "noun", source: "course" },
  { id: "ja:drink", languageId: "ja", surface: "のみます", reading: "nomimasu", meaningEn: "drink", pos: "verb", source: "course" },
];
vi.mock("@/shared/dictionary", () => ({
  getDictionaryEntries: (_lang: string) => DICT_ENTRIES,
  lookupWord: (_lang: string, surface: string) =>
    DICT_ENTRIES.find((e) => e.surface === surface) ?? null,
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
  level: 1,
  title: "At the cafe",
  theme: "A quiet morning.",
  sentences: [{ text: "コーヒーを のみます。", translation: "I drink coffee.", reading: "koohii o nomimasu" }],
};

const STORY_B: Story = {
  id: "ja-test-park",
  languageId: "ja",
  module: 3,
  level: 1,
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

/** Open a story's preview modal from the Stories tab. */
function openPreview(title: RegExp) {
  fireEvent.click(screen.getByRole("button", { name: title }));
}

/** Switch top-level tab via the segmented control (rendered as radios). */
function switchTab(name: RegExp) {
  fireEvent.click(screen.getByRole("radio", { name }));
}

describe("ReadingPracticePage", () => {
  beforeEach(() => {
    getStories.mockReset();
    getConversations.mockReset();
    getKnownAtomsByPos.mockReset();
    getCardState.mockReset();
    setCardState.mockReset();
    gradeFromLesson.mockClear();
    openWord.mockClear();
    getConversations.mockReturnValue([]);
    mockSettings.learning.showRomanization = {};
    mockSettings.learning.romanizationOnForDay = null;
  });

  it("renders the two top-level tabs and switches between them", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    render(<ReadingPracticePage />);

    // Both tabs are present; Stories is the default (its list is shown).
    expect(screen.getByRole("radio", { name: /Stories/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Fill in the blank/ })).toBeInTheDocument();
    expect(screen.getByText("Choose a story")).toBeInTheDocument();

    // Switching to Fill in the blank leaves the story list behind and enters cloze.
    switchTab(/Fill in the blank/);
    expect(screen.queryByText("Choose a story")).not.toBeInTheDocument();
    expect(screen.getByText("I drink coffee.")).toBeInTheDocument();

    // ...and back to Stories.
    switchTab(/Stories/);
    expect(screen.getByText("Choose a story")).toBeInTheDocument();
  });

  it("Stories tab: list -> preview (difficulty + words) -> read -> comprehension", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    render(<ReadingPracticePage />);

    // Landing view: browse the module-gated story list first.
    expect(screen.getByText("Choose a story")).toBeInTheDocument();

    // Picking a story opens the PREVIEW modal (gate), not the reader.
    openPreview(/At the cafe/);
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    // "Words you'll see": at least one module word, tappable.
    expect(screen.getByRole("button", { name: /コーヒー/ })).toBeInTheDocument();
    // The preview no longer offers a fill-in-the-blanks shortcut — Read only.
    expect(screen.queryByRole("button", { name: /Fill in the blank/ })).not.toBeInTheDocument();

    // The Read button proceeds to the reader.
    fireEvent.click(screen.getByRole("button", { name: "Read" }));
    expect(screen.getByRole("heading", { name: "At the cafe" })).toBeInTheDocument();
    const tappable = screen.getAllByTestId("tappable");
    expect(tappable.some((el) => el.textContent === "コーヒーを のみます。")).toBe(true);

    // The tab switcher is hidden while reading (immersive).
    expect(screen.queryByRole("radio", { name: /Fill in the blank/ })).not.toBeInTheDocument();

    // Move to the comprehension check.
    fireEvent.click(screen.getByRole("button", { name: /Check understanding/ }));
    expect(screen.getByText("What is this story mostly about?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A quiet morning." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "A walk in the park." })).toBeInTheDocument();
  });

  it("returns to the story list via the back control", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    render(<ReadingPracticePage />);

    openPreview(/At the cafe/);
    fireEvent.click(screen.getByRole("button", { name: "Read" }));
    expect(screen.getByRole("heading", { name: "At the cafe" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /All stories/ }));
    expect(screen.getByText("Choose a story")).toBeInTheDocument();
  });

  it("grades a comprehension answer and shows the score", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    render(<ReadingPracticePage />);

    openPreview(/At the cafe/);
    fireEvent.click(screen.getByRole("button", { name: "Read" }));
    fireEvent.click(screen.getByRole("button", { name: /Check understanding/ }));
    // Answer every question, then finish.
    fireEvent.click(screen.getByRole("button", { name: "A quiet morning." }));
    fireEvent.click(screen.getByRole("button", { name: "I drink coffee." }));
    fireEvent.click(screen.getByRole("button", { name: /See how you did/ }));

    expect(screen.getByText("Nice reading")).toBeInTheDocument();
    expect(screen.getByText("You got 2 of 2 right.")).toBeInTheDocument();
  });

  it("Fill-in-the-blank tab: runs a cloze over the authored pool without picking a story", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);
    // Card state exists → a correct answer credits recognition SRS.
    getCardState.mockReturnValue({ existing: true });
    render(<ReadingPracticePage />);

    // Enter the standalone cloze tab directly — no story selection required.
    switchTab(/Fill in the blank/);

    // Meaning hint for an authored sentence from the pool is shown.
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

  it("Fill-in-the-blank tab: shows a graceful empty state when no cloze can be built", () => {
    // Stories exist (so the page isn't fully empty), but no known content words
    // → no blankable sentence → the cloze tab shows its own empty state.
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue([]);
    render(<ReadingPracticePage />);

    switchTab(/Fill in the blank/);
    expect(screen.getByText("No fill-the-blanks yet")).toBeInTheDocument();
  });

  it("gates the reading line on the romaji setting", () => {
    getStories.mockReturnValue([STORY_A, STORY_B]);
    getKnownAtomsByPos.mockReturnValue(KNOWN);

    // Romaji OFF → the reading aid is not rendered.
    mockSettings.learning.showRomanization = { ja: false };
    const { unmount } = render(<ReadingPracticePage />);
    openPreview(/At the cafe/);
    fireEvent.click(screen.getByRole("button", { name: "Read" }));
    expect(screen.queryByText("koohii o nomimasu")).not.toBeInTheDocument();
    unmount();

    // Romaji ON → the reading aid renders under the sentence.
    mockSettings.learning.showRomanization = {};
    render(<ReadingPracticePage />);
    openPreview(/At the cafe/);
    fireEvent.click(screen.getByRole("button", { name: "Read" }));
    expect(screen.getByText("koohii o nomimasu")).toBeInTheDocument();
  });

  it("shows an encouraging empty state when there is no content at the learner's level", () => {
    getStories.mockReturnValue([]);
    getConversations.mockReturnValue([]);
    getKnownAtomsByPos.mockReturnValue([]);
    render(<ReadingPracticePage />);

    expect(screen.getByText("Nothing to read just yet")).toBeInTheDocument();
    // Fully empty → no tabs, no actions.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });
});
