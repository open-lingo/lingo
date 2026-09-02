import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import i18n from "@/shared/i18n/i18n";
import { VocabCardSheet } from "./VocabCardSheet";
import type { VocabRow } from "./vocabData";

const row: VocabRow = {
  id: "ja:gakkou", kana: "がっこう", kanji: "学校", romaji: "gakkou", meaning: "school",
  emoji: "🏫", imageUrl: null, module: "m3", kind: "vocab", tier: "learning", unlocked: true,
} as VocabRow;

function renderSheet() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <VocabCardSheet
          row={row}
          open
          onClose={() => {}}
          practiceTo="/ja/practice/flashcards/review"
        />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe("VocabCardSheet", () => {
  afterEach(cleanup);
  it("shows kanji with ruby, never the full-width paren string", () => {
    // Sheet portals into document.body, so assert against baseElement
    // rather than the RTL container div.
    const { baseElement } = renderSheet();
    expect(baseElement.querySelector("ruby")).not.toBeNull();
    expect(baseElement.textContent).not.toContain("（");
  });
});
