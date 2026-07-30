import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      _k: string,
      fb?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const s = typeof fb === "string" ? fb : _k;
      const vars = (typeof fb === "object" ? fb : opts) ?? {};
      return s.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        String((vars as Record<string, unknown>)[k] ?? ""),
      );
    },
  }),
}));

const mockLang = "ja";
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: mockLang } }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/${mockLang}/${p}`,
  useLang: () => mockLang,
}));

vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  playJaAudio: vi.fn(),
}));

import {
  DictionaryModalProvider,
  useDictionaryModal,
} from "./DictionaryModalContext";
import { getDictionaryEntries } from "@/shared/dictionary";

function Triggers({ word }: { word: string }) {
  const { open, openWord, close } = useDictionaryModal();
  return (
    <div>
      <button onClick={() => open()}>open-blank</button>
      <button onClick={() => openWord(word)}>open-word</button>
      <button onClick={() => close()}>close-it</button>
    </div>
  );
}

function renderProvider(word: string) {
  return render(
    <MemoryRouter>
      <DictionaryModalProvider>
        <Triggers word={word} />
      </DictionaryModalProvider>
    </MemoryRouter>,
  );
}

describe("DictionaryModalProvider / useDictionaryModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("throws when the hook is used outside the provider", () => {
    const Bare = () => {
      useDictionaryModal();
      return null;
    };
    // Silence the expected React error boundary console noise.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Bare />)).toThrow(/DictionaryModalProvider/);
    spy.mockRestore();
  });

  it("open() mounts the modal on the search view", async () => {
    renderProvider(getDictionaryEntries("ja")[0].surface);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("open-blank"));
    // Modal is lazy-loaded — await the chunk.
    expect(await screen.findByLabelText("Search the dictionary")).toBeInTheDocument();
  });

  it("openWord(existing) opens straight to the entry; close() dismisses it", async () => {
    const target = getDictionaryEntries("ja").find((e) => e.reading !== e.surface)!;
    renderProvider(target.surface);
    fireEvent.click(screen.getByText("open-word"));
    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByText(target.meaningEn)).toBeInTheDocument();

    fireEvent.click(screen.getByText("close-it"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
