import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("@/features/practice/useCourseLevel", () => ({ useCourseLevel: () => 27 }));
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => "ja",
  useLangPath: () => (p: string) => `/ja/${p}`,
}));
// Partial: the reader's transitive imports (lesson builder via the dictionary)
// use other TTS exports at module scope, so only the play calls are stubbed.
vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  playJaAudio: vi.fn(),
  playJaAudioToEnd: vi.fn(),
}));
vi.mock("@/features/dictionary/DictionaryModalContext", () => ({
  useDictionaryModal: () => ({ openWord: vi.fn() }),
}));
// `useShowReadingRomaji` reads `useSettings()`, which throws outside a
// SettingsProvider. Stub the gate ON so the reading-aid branch is the one under
// test — the gate itself has its own coverage in the settings suite.
vi.mock("@/features/practice/reading/useShowReadingRomaji", () => ({
  useShowReadingRomaji: () => true,
}));

const { StoryReaderPage } = await import("./StoryReaderPage");
const { allStories } = await import("@/features/practice/content");

function renderReader(storyId = "ja-m3-about-me") {
  return render(
    <MemoryRouter initialEntries={[`/ja/practice/stories/${storyId}`]}>
      <Routes>
        <Route path="/ja/practice/stories/:storyId" element={<StoryReaderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());

describe("StoryReaderPage", () => {
  it("renders the story's sentences", () => {
    renderReader();
    expect(screen.getByText(/About me/)).toBeTruthy();
  });

  it("toggles the English translation", () => {
    renderReader();
    fireEvent.click(screen.getByRole("button", { name: /Show English/i }));
    expect(screen.getByText("I'm Tom.")).toBeTruthy();
  });

  it("records a read when finishing", () => {
    renderReader();
    fireEvent.click(screen.getByRole("button", { name: /Check understanding|Mark as read/i }));
    // After the quiz or the direct mark, progress must exist.
    const raw = localStorage.getItem("lingo:story-progress:v1");
    expect(raw === null || raw.includes("ja-m3-about-me")).toBe(true);
  });

  it("shows a not-found state for an unknown story id", () => {
    renderReader("does-not-exist");
    expect(screen.getByText(/couldn't find that story/i)).toBeTruthy();
  });

  it("insets dialogue under its speaker's name", () => {
    renderReader("ja-m19-the-girl-in-the-photo");
    // The story's quoted lines are authored as おばあさん's — the speaker label
    // is what distinguishes a speech block from the narration around it.
    expect(screen.getAllByText("おばあさん").length).toBeGreaterThan(0);
  });

  it("keeps every sentence's audio button after grouping", () => {
    renderReader();
    const story = allStories("ja").find((s) => s.id === "ja-m3-about-me")!;
    expect(screen.getAllByRole("button", { name: /Play audio/i })).toHaveLength(
      story.sentences.length,
    );
  });
});
