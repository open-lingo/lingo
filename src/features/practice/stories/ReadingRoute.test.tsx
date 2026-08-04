import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("@/features/practice/useCourseLevel", () => ({ useCourseLevel: () => 27 }));
vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => "ja",
  useLangPath: () => (p: string) => `/ja/${p}`,
}));
vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  playJaAudio: vi.fn(),
  playJaAudioToEnd: vi.fn(),
}));
vi.mock("@/features/dictionary/DictionaryModalContext", () => ({
  useDictionaryModal: () => ({ openWord: vi.fn() }),
}));
vi.mock("@/features/practice/reading/useShowReadingRomaji", () => ({
  useShowReadingRomaji: () => true,
}));
// The reader's text-size control reads `useSettings()`, which throws outside a
// SettingsProvider. A static stub is enough — this suite tests dispatch, not
// the control.
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: { learning: {} }, updateSetting: vi.fn() }),
}));

const { ReadingRoute } = await import("./ReadingRoute");
const { allStories, allConversations } = await import("@/features/practice/content");

const story = allStories("ja")[0];
const conversation = allConversations("ja")[0];

function renderAt(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/ja/practice/stories/${id}`]}>
      <Routes>
        <Route path="/ja/practice/stories/:storyId" element={<ReadingRoute />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());

/**
 * Conversations used to be routed through a `stories/c/:id` segment that
 * rendered as a dead breadcrumb. Both kinds now resolve at the SAME path, so
 * the id has to pick the reader — that dispatch is what these cover.
 */
describe("ReadingRoute", () => {
  it("renders the story reader for a story id", () => {
    renderAt(story.id);
    expect(screen.getByText(story.title)).toBeTruthy();
    // The quiz CTA is story-only — conversations have no comprehension check.
    expect(screen.getByRole("button", { name: /check/i })).toBeTruthy();
  });

  it("renders the conversation reader for a conversation id, at the same path", () => {
    renderAt(conversation.id);
    expect(screen.getByText(conversation.title)).toBeTruthy();
    // Per-turn playback is conversation-only.
    expect(screen.getAllByRole("button", { name: /Play line/i })).toHaveLength(
      conversation.lines.length,
    );
  });

  it("falls through to the reader's not-found state when the id is neither", () => {
    renderAt("no-such-reading");
    expect(screen.getByText(/couldn't find that story/i)).toBeTruthy();
  });
});
