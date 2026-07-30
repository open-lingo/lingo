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

// Audio is a side effect we don't exercise here — stub only the play call.
vi.mock("@/shared/tts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/tts")>()),
  playJaAudio: vi.fn(),
}));

import { DictionaryPage } from "./DictionaryPage";
import { getDictionaryEntries } from "@/shared/dictionary";

function renderPage(lang: string, initialEntry = `/${lang}/dictionary`) {
  mockLang = lang;
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <DictionaryPage />
    </MemoryRouter>,
  );
}

describe("DictionaryPage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it.each(["ja", "ko", "es"])("renders the viewer for %s without throwing", (lang) => {
    renderPage(lang);
    expect(
      screen.getByRole("heading", { name: "Dictionary", level: 1 }),
    ).toBeInTheDocument();
    // Browse count reflects the language's full entry list.
    expect(screen.getByText(/Showing \d+ of \d+ words/)).toBeInTheDocument();
    // Facets render.
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("Part of speech")).toBeInTheDocument();
  });

  it("does not render a language switcher (scoped to the active course language)", () => {
    renderPage("ja");
    expect(screen.queryByLabelText("Dictionary language")).not.toBeInTheDocument();
  });

  it("narrows to no results for a nonsense query", () => {
    renderPage("ja");
    const search = screen.getByLabelText("Search the dictionary");
    fireEvent.change(search, { target: { value: "zzzznotarealword" } });
    expect(screen.getByText("No words found")).toBeInTheDocument();
  });

  it("returns ranked search results for a real query", () => {
    const target = getDictionaryEntries("ja")[0];
    renderPage("ja");
    const search = screen.getByLabelText("Search the dictionary");
    fireEvent.change(search, { target: { value: target.surface } });
    expect(screen.getByText(/results for/)).toBeInTheDocument();
    // The searched surface appears in the result list.
    expect(screen.getAllByText(target.surface).length).toBeGreaterThan(0);
  });

  it("opens an entry detail showing meaning, reading, and frequency", () => {
    const entry = getDictionaryEntries("ja").find(
      (e) => e.frequencyRank != null && e.reading !== e.surface,
    );
    expect(entry).toBeDefined();
    renderPage("ja", `/ja/dictionary?word=${encodeURIComponent(entry!.id)}`);
    const sheet = within(screen.getByRole("dialog"));
    expect(sheet.getByText(entry!.meaningEn)).toBeInTheDocument();
    expect(sheet.getByText(entry!.reading)).toBeInTheDocument();
    expect(
      sheet.getByText(`#${entry!.frequencyRank} most frequent`),
    ).toBeInTheDocument();
  });

  it("renders the conjugation paradigm for a conjugable entry", () => {
    const conj = getDictionaryEntries("ja").find((e) => e.conjugation);
    expect(conj).toBeDefined();
    const [formKey, formValue] = Object.entries(conj!.conjugation!.forms)[0];
    renderPage("ja", `/ja/dictionary?word=${encodeURIComponent(conj!.id)}`);
    const sheet = within(screen.getByRole("dialog"));
    expect(sheet.getByText("Conjugation")).toBeInTheDocument();
    expect(sheet.getByText(formKey)).toBeInTheDocument();
    expect(sheet.getAllByText(formValue).length).toBeGreaterThan(0);
  });
});
