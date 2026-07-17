/**
 * LearnToolsRow (slimmed 2026-07-16) — the row renders only the progress
 * card ("Explore the course" was dropped; "Review & practice" moved into
 * the sidebar as ReviewPracticeBody, tested here too since it shares this
 * module).
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { Course } from "@/shared/domain/course";
import { LearnToolsRow, ReviewPracticeBody } from "./LearnToolsRow";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (k: string, opts?: { defaultValue?: string } & Record<string, unknown>) => {
      if (!opts) return k;
      if (typeof opts === "string") return opts;
      return opts.defaultValue ?? k;
    },
  }),
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "ja" } }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLangPath: () => (p: string) => `/ja/${p}`,
}));

vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => ({
    stats: { streak: 7, xp: 1234, level: 3, lingots: 0, bestStreak: 9, lastActiveDate: null },
  }),
}));

vi.mock("@/features/flashcards/useCardsDueCount", () => ({
  useCardsDueCount: () => ({ count: 5, isLoading: false }),
}));

afterEach(() => cleanup());

const course: Course = {
  id: "mock-1",
  title: "Japanese",
  languageId: "ja",
  modules: [
    {
      id: "m1",
      title: "Hiragana",
      eyebrow: "Module 1",
      summary: "Learn the first script",
      lessons: [
        { id: "ja-m1-a", title: "A" },
        { id: "ja-m1-b", title: "B" },
      ],
    },
    {
      id: "m2",
      title: "Dakuten",
      lessons: [{ id: "ja-m2-a", title: "A" }],
    },
  ],
};

const completedSet = new Set<string>(["ja-m1-a"]);

function renderRow() {
  return render(
    <MemoryRouter>
      <LearnToolsRow course={course} completedSet={completedSet} />
    </MemoryRouter>,
  );
}

describe("LearnToolsRow", () => {
  it("renders only the progress card (explore + review retired from the row)", () => {
    renderRow();
    expect(screen.getByText("Your progress")).toBeInTheDocument();
    expect(screen.queryByText("Explore the course")).toBeNull();
    expect(screen.queryByText("Review & practice")).toBeNull();
  });

  it("progress card switches body across All / Practice / Course tabs", () => {
    renderRow();

    // All tab (default): shows total XP + streak labels.
    expect(screen.getByText("Total XP")).toBeInTheDocument();
    expect(screen.getByText("Course complete")).toBeInTheDocument();

    // Practice tab: SRS due count surfaces.
    fireEvent.click(screen.getByRole("radio", { name: "Practice" }));
    expect(screen.getByText("Cards due now")).toBeInTheDocument();

    // Course tab: lessons + modules mastered.
    fireEvent.click(screen.getByRole("radio", { name: "Course" }));
    expect(screen.getByText("Lessons completed")).toBeInTheDocument();
    expect(screen.getByText("Modules mastered")).toBeInTheDocument();
  });

  it("journey CTA links to the journey page", () => {
    renderRow();
    const cta = screen.getByRole("link", { name: /Track my journey/i });
    expect(cta).toHaveAttribute("href", "/ja/practice/journey");
  });

  it("ReviewPracticeBody links to due-cards review and practice", () => {
    render(
      <MemoryRouter>
        <ReviewPracticeBody course={course} completedSet={completedSet} />
      </MemoryRouter>,
    );
    expect(screen.getByText("Review & practice")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Review due cards/i }),
    ).toHaveAttribute("href", "/ja/practice/flashcards/review");
    expect(screen.getByRole("link", { name: /^Practice$/i })).toHaveAttribute(
      "href",
      "/ja/practice",
    );
  });
});
