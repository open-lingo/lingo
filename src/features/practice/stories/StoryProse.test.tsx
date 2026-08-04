import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";

// The word sheet / dictionary modal is the story reader's business, not this
// component's — stub the context so TappableText can render its word buttons.
vi.mock("@/features/dictionary/DictionaryModalContext", () => ({
  useDictionaryModal: () => ({ openWord: vi.fn() }),
}));

const { StoryProse } = await import("./StoryProse");
const { groupStoryBlocks } = await import("./storyBlocks");
const { __resetTappableTextCaches } = await import("@/features/dictionary/TappableText");

// `ねこ` is passed as an extra surface, so it is guaranteed to render as a word
// button regardless of what the ja dictionary happens to carry. The rest of the
// line stays plain text — which is what a "non-word click" lands on.
const SENTENCES = [
  { text: "ねこ かわいい", translation: "The cat is cute.", reading: "neko kawaii" },
  { text: "いぬ おおきい", translation: "The dog is big.", reading: "inu ookii" },
];

function renderProse(overrides: Partial<Parameters<typeof StoryProse>[0]> = {}) {
  const onPlaySentence = vi.fn();
  const onWordTap = vi.fn();
  render(
    <StoryProse
      blocks={groupStoryBlocks(SENTENCES)}
      langId="ja"
      surfaces={["ねこ"]}
      highlight={new Set(["ねこ"])}
      onWordTap={onWordTap}
      showRomaji={false}
      showTranslations={false}
      playingIndex={null}
      onPlaySentence={onPlaySentence}
      fontScale={1}
      {...overrides}
    />,
  );
  return { onPlaySentence, onWordTap };
}

/** The wrapper span for a sentence — what a hover / non-word click hits. */
function sentenceSpan(index: number): HTMLElement {
  const el = document.querySelector(`[data-story-sentence="${index}"]`);
  if (!el) throw new Error(`no sentence span ${index}`);
  return el as HTMLElement;
}

beforeEach(() => {
  __resetTappableTextCaches();
});

describe("StoryProse sentence vs word clicks", () => {
  it("plays the sentence when non-word text is clicked", () => {
    const { onPlaySentence, onWordTap } = renderProse();
    fireEvent.click(sentenceSpan(0));
    expect(onPlaySentence).toHaveBeenCalledWith(0);
    expect(onWordTap).not.toHaveBeenCalled();
  });

  it("opens the word sheet WITHOUT playing the sentence when a word is clicked", () => {
    const { onPlaySentence, onWordTap } = renderProse();
    // The word button lives inside the sentence span, so its click bubbles
    // straight through the sentence's own handler. Only the word must act.
    fireEvent.click(within(sentenceSpan(0)).getByRole("button", { name: "ねこ" }));
    expect(onWordTap).toHaveBeenCalledWith("ねこ");
    expect(onPlaySentence).not.toHaveBeenCalled();
  });

  it("keys playback to the sentence that was clicked", () => {
    const { onPlaySentence } = renderProse();
    fireEvent.click(sentenceSpan(1));
    expect(onPlaySentence).toHaveBeenCalledWith(1);
  });
});

describe("StoryProse per-sentence popover", () => {
  it("shows no play button until a sentence is hovered", () => {
    renderProse();
    expect(screen.queryByRole("button", { name: /Play audio/i })).toBeNull();
  });

  it("reveals one play control plus the sentence's English on hover", () => {
    const { onPlaySentence } = renderProse();
    fireEvent.mouseEnter(sentenceSpan(1));

    const play = screen.getAllByRole("button", { name: /Play audio/i });
    expect(play).toHaveLength(1);
    expect(screen.getByText("The dog is big.")).toBeTruthy();

    fireEvent.click(play[0]);
    expect(onPlaySentence).toHaveBeenCalledWith(1);
  });

  it("carries the reading aid only when the romaji gate is on", () => {
    renderProse({ showRomaji: true });
    fireEvent.mouseEnter(sentenceSpan(0));
    expect(screen.getAllByText("neko kawaii").length).toBeGreaterThan(0);
  });

  it("hides again on mouse leave", () => {
    renderProse();
    fireEvent.mouseEnter(sentenceSpan(0));
    expect(screen.getByRole("button", { name: /Play audio/i })).toBeTruthy();
    fireEvent.mouseLeave(sentenceSpan(0));
    expect(screen.queryByRole("button", { name: /Play audio/i })).toBeNull();
  });
});

describe("StoryProse paragraph translation", () => {
  it("joins the block's sentences into one English paragraph", () => {
    renderProse({ showTranslations: true });
    // ONE element carrying both sentences — not a row per sentence, which is
    // what the old expanded layout produced and what broke the prose.
    expect(screen.getByText("The cat is cute. The dog is big.")).toBeTruthy();
    expect(screen.queryByText("The cat is cute.")).toBeNull();
  });

  it("leaves the target text in a single flowing paragraph", () => {
    renderProse({ showTranslations: true });
    const spans = document.querySelectorAll("[data-story-sentence]");
    expect(spans).toHaveLength(2);
    // Both sentences share one <p>: the English never splits the prose.
    expect(spans[0].closest("p")).toBe(spans[1].closest("p"));
  });

  it("gives a speech block its own joined English paragraph", () => {
    renderProse({
      showTranslations: true,
      blocks: groupStoryBlocks([
        { text: "ねこ かわいい", translation: "The cat is cute." },
        { text: "こんにちは", translation: "Hello.", speaker: "ケン" },
        { text: "げんき", translation: "How are you?", speaker: "ケン" },
      ]),
    });
    expect(screen.getByText("The cat is cute.")).toBeTruthy();
    expect(screen.getByText("Hello. How are you?")).toBeTruthy();
  });
});

describe("StoryProse font scale", () => {
  it("scales the target text and its reading aid, and nothing else", () => {
    renderProse({ fontScale: 1.6, showRomaji: true, showTranslations: true });
    const prose = sentenceSpan(0).closest("p") as HTMLElement;
    expect(prose.style.fontSize).toBe("2rem");
    expect(screen.getByText("neko kawaii inu ookii").style.fontSize).toBe("1.28rem");

    // The English paragraph is UI chrome, not story type — it must not move.
    const english = screen.getByText("The cat is cute. The dog is big.");
    expect(english.style.fontSize).toBe("");
  });
});
