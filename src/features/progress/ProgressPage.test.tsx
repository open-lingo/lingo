import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ProgressSummary } from "@/shared/api/progress";

// i18n isn't initialised in the test harness — return the English fallback.
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      const fb = typeof fallback === "string" ? fallback : _key;
      const vars = (typeof fallback === "object" ? fallback : opts) ?? {};
      return fb.replace(/\{\{(\w+)\}\}/g, (_, k) => String((vars as Record<string, unknown>)[k] ?? ""));
    },
  }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p}`,
}));

const mockUseProgressMe = vi.fn();
vi.mock("@/shared/hooks/useProgressMe", () => ({
  useProgressMe: () => mockUseProgressMe(),
}));

import { ProgressPage } from "./ProgressPage";

function summary(over: Partial<ProgressSummary> = {}): ProgressSummary {
  return {
    user: { streak: 5, bestStreak: 12, lastActiveDate: "2026-06-14", xp: 1750, level: 4, lingots: 30 },
    lessons: [],
    concepts: [
      {
        conceptId: "ja:biiru",
        encounters: 6,
        correctCount: 5,
        incorrectCount: 1,
        recentResults: [true, true, false, true],
        firstSeenAt: "2026-06-01",
        lastSeenAt: "2026-06-13",
        lastCorrectAt: "2026-06-13",
      },
    ],
    last30days: [
      { date: "2026-06-12", lessonsCompleted: 2, minutesActive: 10, xpEarned: 30 },
      { date: "2026-06-13", lessonsCompleted: 1, minutesActive: 5, xpEarned: 15 },
    ],
    ...over,
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ProgressPage />
    </MemoryRouter>,
  );
}

describe("ProgressPage", () => {
  beforeEach(() => {
    mockUseProgressMe.mockReset();
  });

  it("renders hero stats, panels, and mastery from the progress summary", () => {
    mockUseProgressMe.mockReturnValue({
      summary: summary(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    expect(screen.getByRole("heading", { name: "Journey", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // streak
    expect(screen.getByText("L4")).toBeInTheDocument(); // level ring
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("XP over time")).toBeInTheDocument();
    expect(screen.getByText("Mastery")).toBeInTheDocument();
  });

  it("opens the concept drill-in sheet when a mastery tile is clicked", () => {
    mockUseProgressMe.mockReturnValue({
      summary: summary(),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();

    // Mastery tile carries the resolved kana label for ja:biiru → "ビール".
    const tile = screen.getByRole("button", { name: /percent recent strength/i });
    fireEvent.click(tile);

    expect(screen.getByText("Recent results")).toBeInTheDocument();
    expect(screen.getByText("Practice this")).toBeInTheDocument();
  });

  it("shows the empty state when there is no activity or concepts", () => {
    mockUseProgressMe.mockReturnValue({
      summary: summary({
        concepts: [],
        last30days: [{ date: "2026-06-13", lessonsCompleted: 0, minutesActive: 0, xpEarned: 0 }],
      }),
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    renderPage();
    expect(screen.getByText("Your journey starts here")).toBeInTheDocument();
  });

  it("shows an error state with retry", () => {
    const refetch = vi.fn();
    mockUseProgressMe.mockReturnValue({ summary: null, isLoading: false, isError: true, refetch });

    renderPage();
    const retry = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retry);
    expect(refetch).toHaveBeenCalled();
  });
});
