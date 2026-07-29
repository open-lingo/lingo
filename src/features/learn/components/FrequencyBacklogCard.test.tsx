/**
 * FrequencyBacklogCard — the Learn-path "you've accumulated X optional words"
 * cue. It must render the backlog count ONLY when the opt-in frequency-vocab
 * flag is on AND the accumulated backlog is > 0; otherwise nothing (no
 * empty-state noise), and it must link to the flashcards reviewer.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockSettings: { flashcards?: { frequencyVocab?: boolean } } = {};
let mockSummary: { backlogCount: number; isLoading: boolean } = {
  backlogCount: 0,
  isLoading: false,
};

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, opts?: { defaultValue?: string; count?: number }) => {
      const dv = opts?.defaultValue ?? "";
      return opts?.count != null
        ? dv.replace("{{count}}", String(opts.count))
        : dv;
    },
  }),
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ko" } }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ko/${p}`,
}));

vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: mockSettings }),
}));

vi.mock("@/features/flashcards/useFlashcardDueSummary", () => ({
  useFlashcardDueSummary: () => mockSummary,
}));

import { FrequencyBacklogCard } from "./FrequencyBacklogCard";

function renderCard() {
  return render(
    <MemoryRouter>
      <FrequencyBacklogCard />
    </MemoryRouter>,
  );
}

describe("FrequencyBacklogCard", () => {
  beforeEach(() => {
    delete mockSettings.flashcards;
    mockSummary = { backlogCount: 0, isLoading: false };
  });

  it("shows the count and a reviewer link when enabled with a backlog", () => {
    mockSettings.flashcards = { frequencyVocab: true };
    mockSummary = { backlogCount: 12, isLoading: false };
    renderCard();
    expect(
      screen.getByText("12 new words ready to review"),
    ).toBeInTheDocument();
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/ko/practice/flashcards/review");
  });

  it("renders nothing when the opt-in flag is off", () => {
    mockSettings.flashcards = { frequencyVocab: false };
    mockSummary = { backlogCount: 12, isLoading: false };
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the backlog is zero", () => {
    mockSettings.flashcards = { frequencyVocab: true };
    mockSummary = { backlogCount: 0, isLoading: false };
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while the summary is loading", () => {
    mockSettings.flashcards = { frequencyVocab: true };
    mockSummary = { backlogCount: 12, isLoading: true };
    const { container } = renderCard();
    expect(container).toBeEmptyDOMElement();
  });
});
