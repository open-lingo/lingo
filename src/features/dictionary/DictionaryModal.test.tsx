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

let mockLang = "ja";
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

import { DictionaryModal } from "./DictionaryModal";
import { getDictionaryEntries } from "@/shared/dictionary";

function renderModal(lang: string, initialWord: string | null = null) {
  mockLang = lang;
  return render(
    <MemoryRouter>
      <DictionaryModal open onClose={() => {}} initialWord={initialWord} />
    </MemoryRouter>,
  );
}

/** A rich entry for the language: has a frequency rank and a distinct reading. */
function pickEntry(lang: string) {
  const entry = getDictionaryEntries(lang).find(
    (e) => e.frequencyRank != null && e.reading !== e.surface,
  );
  return entry ?? getDictionaryEntries(lang)[0];
}

describe("DictionaryModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(["ja", "ko", "es"])(
    "opens on the search view for %s (search box + hint, no results yet)",
    (lang) => {
      renderModal(lang);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByLabelText("Search the dictionary")).toBeInTheDocument();
      expect(
        screen.getByText("Type a word, reading, or meaning to look it up."),
      ).toBeInTheDocument();
    },
  );

  it("searches and drills into a result, then goes back to search", () => {
    const target = pickEntry("ja");
    renderModal("ja");

    const search = screen.getByLabelText("Search the dictionary");
    fireEvent.change(search, { target: { value: target.surface } });

    // The searched surface shows up as a result row.
    const hit = screen.getAllByText(target.surface)[0];
    fireEvent.click(hit.closest("button")!);

    // Detail view: the entry meaning is now visible.
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(target.meaningEn)).toBeInTheDocument();

    // Back to search restores the search box.
    fireEvent.click(screen.getByLabelText("Back to search"));
    expect(screen.getByLabelText("Search the dictionary")).toBeInTheDocument();
  });

  it("opens directly to a known word via initialWord", () => {
    const target = pickEntry("ja");
    renderModal("ja", target.surface);

    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(target.meaningEn)).toBeInTheDocument();
    // getAllByText: the restamp reordered which entry pickEntry lands on, and
    // an entry may legitimately render its reading twice (ruby + detail row).
    expect(dialog.getAllByText(target.reading).length).toBeGreaterThan(0);
    // No search box while showing a resolved entry.
    expect(screen.queryByLabelText("Search the dictionary")).not.toBeInTheDocument();
  });

  it("shows a not-found state for an unknown initialWord", () => {
    renderModal("ja", "zzzznotarealword");
    expect(screen.getByText("Word not found")).toBeInTheDocument();
    expect(
      screen.getByText(/No dictionary entry for .*zzzznotarealword/),
    ).toBeInTheDocument();
  });

  it("scopes lookups to the active language (ko)", () => {
    const target = pickEntry("ko");
    renderModal("ko", target.surface);
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(target.meaningEn)).toBeInTheDocument();
  });

  // 열 is "ten" in 열 시에 ("at ten o'clock") and "fever" in 열이 나요 ("has a
  // fever"). Both appear in authored KO content, so a learner who taps it in
  // the fever line must be able to REACH the fever sense — a lone "ten" is a
  // confidently wrong answer they have no way to falsify.
  describe("homograph 열", () => {
    it("shows the taught number sense and offers the fever sense", () => {
      renderModal("ko", "열");
      const dialog = within(screen.getByRole("dialog"));
      expect(dialog.getByText("ten (10, native)")).toBeInTheDocument();
      expect(dialog.getByText("열 also means")).toBeInTheDocument();
      expect(dialog.getByText("fever / heat")).toBeInTheDocument();
    });

    it("drills into the fever sense, which links back to the number sense", () => {
      renderModal("ko", "열");
      const dialog = within(screen.getByRole("dialog"));

      fireEvent.click(dialog.getByText("fever / heat").closest("button")!);
      expect(dialog.getByText("열 also means")).toBeInTheDocument();
      expect(dialog.getByText("ten (10, native)")).toBeInTheDocument();
    });
  });
});
