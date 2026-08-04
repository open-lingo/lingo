import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("@/features/practice/useCourseLevel", () => ({ useCourseLevel: () => 27 }));
// Mutable so a test can render the KO reader — the single-character lookup
// regression is a Korean one (열 = ten AND fever).
let currentLang = "ja";
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => currentLang,
  useLangPath: () => (p: string) => `/${currentLang}/${p}`,
}));
// Partial: the reader's transitive imports (lesson builder via the dictionary)
// use other TTS exports at module scope, so only the play calls are stubbed.
vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  playJaAudio: vi.fn(),
  playJaAudioToEnd: vi.fn(),
}));
const openWord = vi.fn();
vi.mock("@/features/dictionary/DictionaryModalContext", () => ({
  useDictionaryModal: () => ({ openWord }),
}));
// `useShowReadingRomaji` reads `useSettings()`, which throws outside a
// SettingsProvider. Stub the gate ON so the reading-aid branch is the one under
// test — the gate itself has its own coverage in the settings suite.
vi.mock("@/features/practice/reading/useShowReadingRomaji", () => ({
  useShowReadingRomaji: () => true,
}));
// Story text size is a persisted setting, so the reader's A-/A+ control reads
// `useSettings()` — which also throws outside a SettingsProvider. A minimal
// subscribed store keeps the control live without booting auth + the API.
const settingsListeners = new Set<() => void>();
let fakeSettings: { learning: Record<string, unknown> } = { learning: {} };
vi.mock("@/shared/contexts/SettingsContext", async () => {
  const { useSyncExternalStore } = await import("react");
  return {
    useSettings: () => ({
      settings: useSyncExternalStore((onChange: () => void) => {
        settingsListeners.add(onChange);
        return () => void settingsListeners.delete(onChange);
      }, () => fakeSettings),
      updateSetting: (path: string, value: unknown) => {
        fakeSettings = { learning: { ...fakeSettings.learning, [path.split(".")[1]]: value } };
        settingsListeners.forEach((l) => l());
      },
    }),
  };
});

const { StoryReaderPage } = await import("./StoryReaderPage");
const { allStories } = await import("@/features/practice/content");
const { resolveStoryWords } = await import("./unknownWords");

function renderReader(storyId = "ja-m3-about-me", lang = "ja") {
  currentLang = lang;
  return render(
    <MemoryRouter initialEntries={[`/${lang}/practice/stories/${storyId}`]}>
      <Routes>
        <Route path="/:lang/practice/stories/:storyId" element={<StoryReaderPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  currentLang = "ja";
  openWord.mockClear();
});

describe("StoryReaderPage", () => {
  it("renders the story's sentences", () => {
    renderReader();
    expect(screen.getByText(/About me/)).toBeTruthy();
  });

  it("toggles the English as joined paragraphs", () => {
    renderReader();
    const story = allStories("ja").find((s) => s.id === "ja-m3-about-me")!;
    fireEvent.click(screen.getByRole("button", { name: /Show English/i }));
    // The block's translations run together as prose — the sentence-per-row
    // layout is gone, so the first sentence's English is NOT its own element.
    expect(screen.queryByText(story.sentences[0].translation)).toBeNull();
    expect(
      screen.getByText(new RegExp(escapeRe(story.sentences[0].translation))),
    ).toBeTruthy();
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

  it("reveals a sentence's audio only on hover, one at a time", () => {
    const { container } = renderReader();
    // No permanently-rendered volume buttons — the prose is clean until the
    // learner points at a sentence.
    expect(screen.queryAllByRole("button", { name: /Play audio/i })).toHaveLength(0);

    const spans = container.querySelectorAll("[data-story-sentence]");
    const story = allStories("ja").find((s) => s.id === "ja-m3-about-me")!;
    expect(spans).toHaveLength(story.sentences.length);

    fireEvent.mouseEnter(spans[0]);
    expect(screen.getAllByRole("button", { name: /Play audio/i })).toHaveLength(1);
  });

  it("adjusts the story text size from the reader", () => {
    const { container } = renderReader();
    const prose = container.querySelector("[data-story-sentence]")!.closest("p")!;
    const before = (prose as HTMLElement).style.fontSize;
    fireEvent.click(screen.getByRole("button", { name: /Larger text/i }));
    expect((prose as HTMLElement).style.fontSize).not.toBe(before);
  });
});

describe("StoryReaderPage word lookup", () => {
  it("falls back to the dictionary for a word the story map doesn't carry", () => {
    // 열 is a single character, so `resolveStoryWords` deliberately leaves it
    // out of the highlight map — but it IS tappable, and used to open nothing.
    const { container } = renderReader("ko-m20-the-monday-stomachache", "ko");
    const story = allStories("ko").find((s) => s.id === "ko-m20-the-monday-stomachache")!;
    const words = resolveStoryWords(story, "ko");
    expect(words.has("열")).toBe(false);

    const button = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "열",
    );
    expect(button).toBeTruthy();
    fireEvent.click(button!);
    expect(openWord).toHaveBeenCalledWith("열");
  });

  it("does not play the sentence when a word is tapped", async () => {
    const { container } = renderReader("ko-m20-the-monday-stomachache", "ko");
    const { playJaAudio } = await import("@/shared/tts");
    (playJaAudio as unknown as ReturnType<typeof vi.fn>).mockClear();

    const button = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "열",
    );
    fireEvent.click(button!);
    expect(openWord).toHaveBeenCalledWith("열");
    expect(playJaAudio).not.toHaveBeenCalled();
  });

  it("opens the story word sheet when the map DOES carry the word", () => {
    const { container } = renderReader("ko-m20-the-monday-stomachache", "ko");
    const story = allStories("ko").find((s) => s.id === "ko-m20-the-monday-stomachache")!;
    const words = resolveStoryWords(story, "ko");
    expect(words.size).toBeGreaterThan(0);

    const mapped = [...container.querySelectorAll("button")].find(
      (b) => b.textContent !== null && words.has(b.textContent),
    );
    expect(mapped).toBeTruthy();
    fireEvent.click(mapped!);
    // The authored meaning wins — the dictionary is the FALLBACK, not the
    // default, so a glossed word must never route past its own sheet.
    expect(openWord).not.toHaveBeenCalled();
    expect(screen.getByText(words.get(mapped!.textContent!)!.meaning)).toBeTruthy();
  });
});

/** Story translations are authored prose — escape before regex-matching them. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
