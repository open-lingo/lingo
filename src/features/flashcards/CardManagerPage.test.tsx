/**
 * Tests for the Card Manager modality date modal — opens on Due-cell
 * click, reflects current state in 4 date inputs, saves only changed
 * fields, cancels without writes, and closes on ESC.
 *
 * The hook (useCardManagerData) is mocked so we can assert exactly what
 * updateModalityDates was called with. Context providers (language,
 * router, i18n) are mocked at the import boundary.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DEFAULT_FEATURE_FLAGS } from "@/shared/config/featureFlags";
import type { ManagedCard } from "./useCardManagerData";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: unknown, _opts?: unknown) => {
      if (typeof defaultValue === "string") return defaultValue;
      if (
        defaultValue &&
        typeof defaultValue === "object" &&
        "defaultValue" in defaultValue &&
        typeof (defaultValue as { defaultValue?: unknown }).defaultValue ===
          "string"
      ) {
        return (defaultValue as { defaultValue: string }).defaultValue;
      }
      return key;
    },
  }),
}));

vi.mock("react-router-dom", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p}`,
}));

vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => DEFAULT_FEATURE_FLAGS,
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({ decks: { getMyVocabDeck: vi.fn() } }),
}));

const mockUpdateModalityDates = vi.fn();
const mockHandleBury = vi.fn();
const mockHandleUnbury = vi.fn();
const mockHandleReset = vi.fn();
const mockRefresh = vi.fn();
const mockUpdateDueDate = vi.fn();

let mockCards: ManagedCard[] = [];

vi.mock("./useCardManagerData", () => ({
  useCardManagerData: () => ({
    cards: mockCards,
    decks: [{ id: "deck-1", name: "Test Deck" }],
    isLoading: false,
    updateDueDate: mockUpdateDueDate,
    updateModalityDates: mockUpdateModalityDates,
    handleBury: mockHandleBury,
    handleUnbury: mockHandleUnbury,
    handleReset: mockHandleReset,
    refresh: mockRefresh,
  }),
}));

import { CardManagerPage } from "./CardManagerPage";

function makeCard(overrides: Partial<ManagedCard> = {}): ManagedCard {
  return {
    card: {
      id: "card-1",
      front: "ねこ",
      back: "cat",
    } as ManagedCard["card"],
    deckId: "deck-1",
    deckName: "Test Deck",
    status: "learning",
    state: {
      recognition: {
        stability: 2,
        difficulty: 5,
        state: "review",
        interval: 2,
        dueDate: "2026-06-09",
        lastReviewDate: "2026-06-07",
        reps: 3,
        lapses: 0,
      },
      production: {
        stability: 1,
        difficulty: 6,
        state: "review",
        interval: 1,
        dueDate: "2026-06-12",
        lastReviewDate: "2026-06-06",
        reps: 2,
        lapses: 1,
      },
    },
    ...overrides,
  };
}

describe("CardManagerPage — modality date modal", () => {
  beforeEach(() => {
    mockUpdateModalityDates.mockReset();
    mockUpdateDueDate.mockReset();
    mockCards = [makeCard()];
  });

  it("opens the modal when the Due cell is clicked", () => {
    render(<CardManagerPage />);
    // Modal not present yet.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Click the Due-cell button — earliest is recognition 2026-06-09.
    fireEvent.click(screen.getByRole("button", { name: "Adjust SRS dates" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    // Front + back are rendered both in the table row and inside the
    // modal context block — assert each appears at least twice.
    expect(screen.getAllByText("ねこ").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("cat").length).toBeGreaterThanOrEqual(2);
  });

  it("seeds each of the 4 date inputs from current state", () => {
    render(<CardManagerPage />);
    fireEvent.click(screen.getByRole("button", { name: "Adjust SRS dates" }));

    const recDue = document.getElementById("recognition-due") as HTMLInputElement;
    const recLast = document.getElementById(
      "recognition-last",
    ) as HTMLInputElement;
    const prodDue = document.getElementById("production-due") as HTMLInputElement;
    const prodLast = document.getElementById(
      "production-last",
    ) as HTMLInputElement;

    expect(recDue.value).toBe("2026-06-09");
    expect(recLast.value).toBe("2026-06-07");
    expect(prodDue.value).toBe("2026-06-12");
    expect(prodLast.value).toBe("2026-06-06");
  });

  it("saves only the changed fields when Save is clicked", () => {
    render(<CardManagerPage />);
    fireEvent.click(screen.getByRole("button", { name: "Adjust SRS dates" }));

    const prodDue = document.getElementById("production-due") as HTMLInputElement;
    fireEvent.change(prodDue, { target: { value: "2026-07-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mockUpdateModalityDates).toHaveBeenCalledTimes(1);
    expect(mockUpdateModalityDates).toHaveBeenCalledWith("card-1", {
      productionDue: "2026-07-01",
    });
  });

  it("saves all four fields when all are edited", () => {
    render(<CardManagerPage />);
    fireEvent.click(screen.getByRole("button", { name: "Adjust SRS dates" }));

    fireEvent.change(document.getElementById("recognition-due")!, {
      target: { value: "2026-08-01" },
    });
    fireEvent.change(document.getElementById("recognition-last")!, {
      target: { value: "2026-07-30" },
    });
    fireEvent.change(document.getElementById("production-due")!, {
      target: { value: "2026-08-02" },
    });
    fireEvent.change(document.getElementById("production-last")!, {
      target: { value: "2026-07-31" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(mockUpdateModalityDates).toHaveBeenCalledWith("card-1", {
      recognitionDue: "2026-08-01",
      recognitionLastReview: "2026-07-30",
      productionDue: "2026-08-02",
      productionLastReview: "2026-07-31",
    });
  });

  it("Cancel closes the modal without calling the setter", () => {
    render(<CardManagerPage />);
    fireEvent.click(screen.getByRole("button", { name: "Adjust SRS dates" }));

    fireEvent.change(document.getElementById("recognition-due")!, {
      target: { value: "2026-09-09" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockUpdateModalityDates).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("ESC closes the modal without calling the setter", () => {
    render(<CardManagerPage />);
    fireEvent.click(screen.getByRole("button", { name: "Adjust SRS dates" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(mockUpdateModalityDates).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("CardManagerPage — search filter", () => {
  beforeEach(() => {
    mockCards = [
      makeCard({
        card: {
          id: "card-jp",
          front: "学校",
          reading: { surface: "学校", kana: "がっこう" },
          back: "school",
        } as ManagedCard["card"],
      }),
    ];
  });

  it("finds a JA kanji card by typing its kana reading", () => {
    render(<CardManagerPage />);
    const search = document.getElementById("facet-search") as HTMLInputElement;
    fireEvent.change(search, { target: { value: "がっこう" } });
    expect(screen.getByText("学校")).toBeInTheDocument();
  });
});

describe("CardManagerPage — furigana rendering", () => {
  beforeEach(() => {
    mockCards = [
      makeCard({
        card: {
          id: "card-jp",
          front: "学校",
          reading: { surface: "学校", kana: "がっこう" },
          back: "school",
        } as ManagedCard["card"],
      }),
    ];
  });

  it("renders kanji fronts as ruby, not as '漢字 (かな)'", () => {
    const { container } = render(<CardManagerPage />);
    expect(container.querySelector("ruby")).not.toBeNull();
    expect(container.textContent).not.toContain("学校 (がっこう)");
  });
});
