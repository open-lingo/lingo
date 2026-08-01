import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StoryWordInfo } from "./unknownWords";

const getCardState = vi.fn();
const setCardState = vi.fn();

vi.mock("@/features/flashcards/engine", () => ({
  getCardState: (...a: unknown[]) => getCardState(...a),
  setCardState: (...a: unknown[]) => setCardState(...a),
}));

const { addStoryWord, isStoryWordAdded, storyWordCardId } = await import("./addWord");

const atomWord: StoryWordInfo = {
  surface: "すし", reading: "sushi", meaning: "sushi",
  atomId: "ja:sushi", source: "atom", unknown: true,
};
const cultureWord: StoryWordInfo = {
  surface: "はなみ", reading: "hanami", meaning: "flower viewing",
  source: "gloss", unknown: true,
};

beforeEach(() => {
  getCardState.mockReset();
  setCardState.mockReset();
  // The real getCardState returns `SRSCardState | undefined` for a missing
  // card — mock it faithfully, or a `!== null` bug would slip through.
  getCardState.mockReturnValue(undefined);
});

describe("storyWordCardId", () => {
  it("uses the canonical atom id when the word has one", () => {
    expect(storyWordCardId(atomWord, "ja")).toBe("ja:sushi");
  });

  it("mints a story-local id for a word with no atom", () => {
    expect(storyWordCardId(cultureWord, "ja")).toBe("story-vocab:ja:はなみ");
  });
});

describe("addStoryWord", () => {
  it("seeds a learning card due today", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(addStoryWord(atomWord, "ja")).toBe(true);
    expect(setCardState).toHaveBeenCalledTimes(1);
    const [id, state] = setCardState.mock.calls[0];
    expect(id).toBe("ja:sushi");
    expect(state.recognition.state).toBe("learning");
    expect(state.production.state).toBe("learning");
    expect(state.recognition.dueDate).toBe(today);
    expect(state.recognition.reps).toBe(0);
  });

  it("mints a story-local card for a culture word", () => {
    expect(addStoryWord(cultureWord, "ja")).toBe(true);
    expect(setCardState.mock.calls[0][0]).toBe("story-vocab:ja:はなみ");
  });

  it("never clobbers an existing schedule", () => {
    getCardState.mockReturnValue({
      recognition: { state: "review", interval: 21 },
      production: { state: "review", interval: 21 },
    });
    expect(addStoryWord(atomWord, "ja")).toBe(false);
    expect(setCardState).not.toHaveBeenCalled();
  });

  it("isStoryWordAdded reflects existing state", () => {
    // Guards the undefined-vs-null trap: a missing card must read as NOT added.
    expect(isStoryWordAdded(atomWord, "ja")).toBe(false);
    getCardState.mockReturnValue({ recognition: { state: "learning" }, production: { state: "learning" } });
    expect(isStoryWordAdded(atomWord, "ja")).toBe(true);
  });
});
