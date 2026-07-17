import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PracticeHero } from "./PracticeHero";
import { buildQuickStarts, type Suggestion } from "../practiceSuggestion";
import type { PracticeStats } from "../hooks/usePracticeStats";

const stats: PracticeStats = {
  dueCount: 12,
  retention: 0,
  hasRetention: false,
  streak: 4,
  bestStreak: 4,
  weekReviews: [0, 0, 0, 0, 0, 0, 0],
  weekTotalReviews: 0,
  daysActiveThisWeek: 0,
  learning: 20,
  mastered: 15,
  total: 83,
  level: 1,
  isLoading: false,
};
const lp = (p: string) => `/ja/${p}`;

function renderHero(suggestion: Suggestion) {
  const quickStarts = buildQuickStarts({
    suggestion,
    dueCount: stats.dueCount,
    dueReviews: [],
    langId: "ja",
    reviewModuleIdFor: (m) => m,
  });
  return render(
    <MemoryRouter>
      <PracticeHero
        stats={stats}
        suggestion={suggestion}
        quickStarts={quickStarts}
        langPath={lp}
      />
    </MemoryRouter>,
  );
}

describe("PracticeHero", () => {
  it("renders the Start CTA at the suggestion route", () => {
    renderHero({ kind: "srs", dueCount: 12, to: "practice/flashcards/review" });
    expect(document.querySelector('a[href="/ja/practice/flashcards/review"]')).toBeTruthy();
  });

  it("does not duplicate the primary action as a chip", () => {
    renderHero({ kind: "srs", dueCount: 12, to: "practice/flashcards/review" });
    // Only the Start CTA points at the review route — no duplicate chip.
    expect(document.querySelectorAll('a[href="/ja/practice/flashcards/review"]').length).toBe(1);
    // "Learn new words" chip is present.
    expect(document.querySelector('a[href="/ja/practice/flashcards"]')).toBeTruthy();
  });

  it("links the mastered stat to the journey page", () => {
    renderHero({ kind: "srs", dueCount: 12, to: "practice/flashcards/review" });
    expect(document.querySelector('a[href="/ja/practice/journey"]')).toBeTruthy();
  });
});
