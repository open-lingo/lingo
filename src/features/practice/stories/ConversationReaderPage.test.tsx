import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

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

const { ConversationReaderPage } = await import("./ConversationReaderPage");
const { allConversations } = await import("@/features/practice/content");

const first = allConversations("ja")[0];

function renderReader(id = first.id) {
  return render(
    <MemoryRouter initialEntries={[`/ja/practice/stories/${id}`]}>
      <Routes>
        <Route
          path="/ja/practice/stories/:storyId"
          element={<ConversationReaderPage conversationId={id} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => localStorage.clear());

describe("ConversationReaderPage", () => {
  it("renders the conversation's turns with speaker labels", () => {
    renderReader();
    expect(screen.getByText(first.title)).toBeTruthy();
    expect(screen.getAllByText(first.speakers[0].label).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Play line/i })).toHaveLength(
      first.lines.length,
    );
  });

  it("hides English until asked, then aligns it to each turn", () => {
    renderReader();
    expect(screen.queryByText(first.lines[0].translation)).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Show English/i }));
    expect(screen.getByText(first.lines[0].translation)).toBeTruthy();
  });

  it("records the read into the shared story-progress store", () => {
    renderReader();
    fireEvent.click(screen.getByRole("button", { name: /Mark as read/i }));
    expect(localStorage.getItem("lingo:story-progress:v1")).toContain(first.id);
  });

  it("shows a not-found state for an unknown conversation id", () => {
    renderReader("does-not-exist");
    expect(screen.getByText(/couldn't find that conversation/i)).toBeTruthy();
  });
});
