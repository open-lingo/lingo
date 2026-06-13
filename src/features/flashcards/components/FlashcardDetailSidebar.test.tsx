import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";
import { FlashcardDetailSidebar, hasSidebarContent } from "./FlashcardDetailSidebar";
import type { Flashcard } from "@/features/flashcards/data/types";

// Mock the audio module so the play button click doesn't try to construct
// a real HTMLAudioElement (happy-dom doesn't implement it fully).
const playSpy = vi.fn();
vi.mock("@/shared/audio/volume", () => ({
  playLocalAudio: (url: string) => playSpy(url),
}));

function renderSidebar(card: Flashcard) {
  return render(
    <I18nextProvider i18n={i18n}>
      <FlashcardDetailSidebar card={card} particles={null} layout="stacked" />
    </I18nextProvider>,
  );
}

describe("FlashcardDetailSidebar", () => {
  afterEach(() => {
    cleanup();
    playSpy.mockReset();
  });

  it("returns null when the card has no extras", () => {
    const card: Flashcard = {
      id: "x",
      type: "word",
      front: "hi",
      back: "hello",
    };
    expect(hasSidebarContent(card)).toBe(false);
    const { container } = renderSidebar(card);
    expect(container.firstChild).toBeNull();
  });

  it("renders reasoning + note + definition + context when present", () => {
    const card: Flashcard = {
      id: "x",
      type: "other",
      front: "hi",
      back: "hello",
      reasoning: "etymology blah",
      note: "casual greeting",
      definition: "salutation",
      context: "use anytime",
    };
    expect(hasSidebarContent(card)).toBe(true);
    renderSidebar(card);
    expect(screen.getByText("etymology blah")).toBeTruthy();
    expect(screen.getByText("casual greeting")).toBeTruthy();
    expect(screen.getByText("salutation")).toBeTruthy();
    expect(screen.getByText("use anytime")).toBeTruthy();
  });

  it("renders up to 3 examples and reveals more via the +N more affordance", () => {
    const card: Flashcard = {
      id: "x",
      type: "word",
      front: "りんご",
      back: "apple",
      examples: [
        { text: "ex1", translation: "tr1" },
        { text: "ex2", translation: "tr2" },
        { text: "ex3", translation: "tr3" },
        { text: "ex4", translation: "tr4" },
        { text: "ex5", translation: "tr5" },
      ],
    };
    renderSidebar(card);
    expect(screen.getByText("ex1")).toBeTruthy();
    expect(screen.getByText("ex3")).toBeTruthy();
    expect(screen.queryByText("ex4")).toBeNull();
    fireEvent.click(screen.getByText("+2 more"));
    expect(screen.getByText("ex4")).toBeTruthy();
    expect(screen.getByText("ex5")).toBeTruthy();
  });

  it("renders a play button for examples with audioUrl that calls playLocalAudio", () => {
    const card: Flashcard = {
      id: "x",
      type: "word",
      front: "りんご",
      back: "apple",
      examples: [
        { text: "with audio", translation: "tr", audioUrl: "/audio/x.mp3" },
        { text: "without audio", translation: "tr" },
      ],
    };
    renderSidebar(card);
    const playBtns = screen.getAllByRole("button", { name: /play example audio/i });
    expect(playBtns.length).toBe(1);
    fireEvent.click(playBtns[0]);
    expect(playSpy).toHaveBeenCalledWith("/audio/x.mp3");
  });

  it("renders segment breakdown for word cards with parts", () => {
    const card: Flashcard = {
      id: "x",
      type: "word",
      front: "私",
      back: "I",
      parts: [{ segment: "私", meaning: "I" }],
    };
    renderSidebar(card);
    expect(screen.getByText("私")).toBeTruthy();
    expect(screen.getByText(/I/)).toBeTruthy();
  });

  it("overlay variant is absolutely positioned (no layout shift)", () => {
    const card: Flashcard = {
      id: "x",
      type: "word",
      front: "人",
      back: "person",
      note: "kanji",
    };
    render(
      <I18nextProvider i18n={i18n}>
        <FlashcardDetailSidebar card={card} particles={null} layout="overlay" />
      </I18nextProvider>,
    );
    const aside = screen.getByRole("complementary");
    expect(aside.className).toContain("absolute");
    expect(aside.className).toContain("left-full");
  });

  it("overlay renders the toolbar above the body when provided", () => {
    const card: Flashcard = {
      id: "x",
      type: "word",
      front: "人",
      back: "person",
      note: "kanji note",
    };
    render(
      <I18nextProvider i18n={i18n}>
        <FlashcardDetailSidebar
          card={card}
          particles={null}
          layout="overlay"
          toolbar={<button type="button">tool</button>}
        />
      </I18nextProvider>,
    );
    expect(screen.getByRole("button", { name: "tool" })).toBeTruthy();
    expect(screen.getByText("kanji note")).toBeTruthy();
  });
});
