/**
 * TransitLearnPage tier switcher (2026-07-17). The map/rail geometry
 * (ResizeObserver-driven scale, rAF train rides, drag-to-pan) is heavy for
 * happy-dom, so this stubs those browser APIs just enough to mount the
 * page and asserts on the tier-switcher DOM surface — the pure derivation
 * logic itself is covered exhaustively in learnTier.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_k: string, fb?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
      const s = typeof fb === "string" ? fb : (fb as { defaultValue?: string })?.defaultValue ?? _k;
      const vars = (typeof fb === "object" ? fb : opts) ?? {};
      return s.replace(/\{\{(\w+)\}\}/g, (_, k) => String((vars as Record<string, unknown>)[k] ?? ""));
    },
  }),
}));

vi.mock("@/shared/hooks/useLangPath", () => ({
  useLang: () => (globalThis as { __mockLang?: string }).__mockLang ?? "ja",
  useLangPath: () => (p: string) => `/${(globalThis as { __mockLang?: string }).__mockLang ?? "ja"}/${p}`,
}));

vi.mock("./hooks/useCompletedLessonIds", () => ({
  useCompletedLessonIds: () => (globalThis as { __mockCompleted?: string[] }).__mockCompleted ?? [],
}));

vi.mock("./hooks/useLearnProfile", () => ({
  useLearnProfile: () => ({
    displayName: "Test",
    levelLabel: "Level 1",
    streakDays: 0,
    xpEarnedToday: 0,
    hasNoProgress: true,
    isLoading: false,
  }),
}));

vi.mock("@/features/settings/storage", () => ({
  getStoredSettings: () => null,
}));

vi.mock("@/shared/telemetry/sessionLog", () => ({
  logSessionEvent: () => {},
}));

vi.mock("@/features/placement/hooks/usePlacementDismissed", () => ({
  isPlacementDismissed: () => true,
  dismissPlacement: () => {},
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: { id: (globalThis as { __mockLang?: string }).__mockLang ?? "ja", name: "Japanese", flag: "jp" },
    isLoading: false,
  }),
}));

vi.mock("@/shared/hooks/useUserStats", () => ({
  useUserStats: () => ({
    stats: { streak: 0, bestStreak: 0, lastActiveDate: null, xp: 0, level: 1, lingots: 0 },
    isReady: true,
    isLoading: false,
    isError: false,
    refetch: () => {},
  }),
}));

// LearnSidebar (ProfileCard/QuestsCard/ReviewPractice) pulls in flashcards +
// auth + settings + SRS machinery unrelated to the tier switcher under
// test — stub it out entirely rather than chase that whole dependency tree.
vi.mock("@/features/learn/components/LearnSidebar", () => ({
  LearnSidebar: () => null,
}));

class StubObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

import TransitLearnPage from "./TransitLearnPage";
import { getMockCourse } from "@/shared/domain/mockCourse";

function renderPage(initialEntry: string, lang: string, completed: string[] = []) {
  (globalThis as { __mockLang?: string }).__mockLang = lang;
  (globalThis as { __mockCompleted?: string[] }).__mockCompleted = completed;
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/:lang/learn" element={<TransitLearnPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("TransitLearnPage tier switcher", () => {
  beforeEach(() => {
    localStorage.clear();
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      StubObserver as unknown as typeof ResizeObserver;
    (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
      StubObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => cleanup());

  it("renders no tier switcher for a course with no n4 tier (es)", () => {
    renderPage("/es/learn", "es");
    expect(screen.queryByRole("group", { name: "Course tier" })).toBeNull();
    expect(screen.queryByText("N4 Line")).toBeNull();
  });

  it("renders no tier switcher for ko either", () => {
    renderPage("/ko/learn", "ko");
    expect(screen.queryByRole("group", { name: "Course tier" })).toBeNull();
  });

  it("ja + ?tier=n4 renders only n4 modules, zone labels starting at ZONE 1", () => {
    renderPage("/ja/learn?tier=n4", "ja");
    expect(screen.getByRole("group", { name: "Course tier" })).toBeInTheDocument();
    // n4 station present — since the pilot's 2026-08-09 retirement (spec A1)
    // the only n4 module is the m30 comingSoon placeholder for n4-01
    // 「て + helper I」, drawn as a locked station.
    expect(screen.getAllByText(/て \+ helper I/).length).toBeGreaterThan(0);
    // n5-only station titles must NOT appear on the n4 map.
    expect(screen.queryByText(/Plain sentences/)).toBeNull();
    // buildLayout's own-ZONE-1..3 split — n4's map starts its own ZONE 1.
    // (only 2 n4 modules today, below buildLayout's stations.length >= 9
    // floor for drawing zone chips — assert the underlying strings.zones
    // wiring instead, which is what would render once n4 has 9+ stations.)
    expect(screen.queryAllByText(/ZONE/).length).toBe(0);
  });

  it("ja with no param/storage defaults to n5 for a fresh learner", () => {
    renderPage("/ja/learn", "ja");
    expect(screen.getAllByText(/Plain sentences/).length).toBeGreaterThan(0);
    const n5Tab = screen.getByRole("button", { name: "N5 Line" });
    expect(n5Tab).toHaveAttribute("aria-pressed", "true");
  });

  it("default-tier derivation: finishing every n5 lesson now lands on the N4 line", () => {
    // CHANGED 2026-07-27 with m29, and the change is the POINT rather than a
    // regression. This test used to assert the opposite ("stays on the N5
    // line"), and it was right at the time: m4-m29 were comingSoon
    // placeholders, so a learner who cleared everything AUTHORED was standing
    // at a content frontier inside N5 and must not be bounced onto N4. m29
    // (tile s25, the N5 capstone) was the last unauthored tile, so there is no
    // N5 frontier left — somebody who has finished every N5 lesson has
    // finished JLPT N5, and the next thing in front of them is the N4 line.
    // `deriveDefaultTier` is unchanged; reality moved and the expectation
    // follows it. The frontier behaviour it encodes still matters and is
    // covered synthetically in learnTier.test.ts.
    const ja = jaCompletedThroughN5();
    renderPage("/ja/learn", "ja", ja);
    expect(screen.getByRole("button", { name: "N4 Line" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "N5 Line" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("n5 map (27+ stations) draws its own ZONE 1/2/3 from buildLayout — same code path n4 will use once it has 9+ stations", () => {
    renderPage("/ja/learn?tier=n5", "ja");
    expect(screen.getAllByText(/ZONE 1/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ZONE 2/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ZONE 3/).length).toBeGreaterThan(0);
  });

  it("shows the end-of-line interchange banner on n5 and the back banner on n4", () => {
    renderPage("/ja/learn?tier=n5", "ja");
    expect(screen.getByRole("button", { name: /Continue onto the N4/ })).toBeInTheDocument();
    cleanup();
    renderPage("/ja/learn?tier=n4", "ja");
    // Exact match distinguishes the back-banner ("← N5 Line") from the
    // plain tier tab ("N5 Line").
    expect(screen.getByRole("button", { name: "← N5 Line" })).toBeInTheDocument();
  });
});

// All n5-tier lesson ids for the real ja mock course, so completing them
// pushes getCurrentModuleIndex onto the first n4 module (m29).
function jaCompletedThroughN5(): string[] {
  const course = getMockCourse("ja");
  return course.modules
    .filter((m) => (m.tier ?? "n5") === "n5")
    .flatMap((m) => m.lessons.map((l) => l.id));
}
