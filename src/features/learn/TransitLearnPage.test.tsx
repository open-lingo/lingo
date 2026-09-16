/**
 * TransitLearnPage tier switcher (2026-07-17). The map/rail geometry
 * (ResizeObserver-driven scale, rAF train rides, drag-to-pan) is heavy for
 * happy-dom, so this stubs those browser APIs just enough to mount the
 * page and asserts on the tier-switcher DOM surface — the pure derivation
 * logic itself is covered exhaustively in learnTier.test.ts.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
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

/**
 * Which MAP the page mounts is a JS decision now, not a `md:` class pair
 * (iPad pass 2026-09-15): the horizontal `NetworkMap` and the vertical
 * night-metro map are separate trees and only ONE mounts. Tests that assert
 * on a surface therefore have to say which shape they are modelling — before
 * the change both trees were always in the DOM and these assertions could be
 * mixed freely in one render.
 *
 * `wide` = a desktop window or a landscape iPad (horizontal map, signage
 * header, N5/N4 pill tabs, end-of-line banner). `phone` = below `md`, or any
 * portrait touch surface (vertical map, inline tier stops, no signage card).
 */
function stubShape(shape: "wide" | "phone") {
  const width = shape === "wide" ? 1280 : 390;
  window.matchMedia = ((query: string) => {
    const min = /min-width:\s*(\d+)px/.exec(query);
    let matches = !(min && width < Number(min[1]));
    // No test here models a portrait TABLET, so every pointer/orientation
    // clause resolves false — a phone is narrow enough that width alone
    // already puts it on the vertical map.
    if (query.includes("pointer: coarse") || query.includes("orientation:")) matches = false;
    if (query.includes("prefers-reduced-motion")) matches = false;
    return {
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    };
  }) as unknown as typeof window.matchMedia;
}

function renderPage(
  initialEntry: string,
  lang: string,
  completed: string[] = [],
  shape: "wide" | "phone" = "wide",
) {
  stubShape(shape);
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
    sessionStorage.clear();
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
    // m38's registration landing (2026-08-25) brought n4 to 9 modules
    // (m30-m38), crossing buildLayout's stations.length >= 9 floor for
    // drawing zone chips for the first time — so the map now actually
    // renders them, starting its own ZONE 1 rather than continuing n5's.
    expect(screen.getAllByText(/ZONE 1/).length).toBeGreaterThan(0);
  });

  it("ja with no param/storage defaults to n5 for a fresh learner", () => {
    // The pill tabs are a wide-map surface; the full station title is only
    // spelled out on the vertical map (the SVG map abbreviates its labels),
    // so the same derivation is checked once per shape.
    renderPage("/ja/learn", "ja", [], "wide");
    const n5Tab = screen.getByRole("button", { name: "N5 Line" });
    expect(n5Tab).toHaveAttribute("aria-pressed", "true");
    cleanup();
    renderPage("/ja/learn", "ja", [], "phone");
    expect(screen.getAllByText(/Plain sentences/).length).toBeGreaterThan(0);
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

  // The two shapes carry the SAME affordance in two different places: the
  // wide map gets a banner below it (the horizontal SVG can't host an in-map
  // interchange node), the vertical map gets an inline stop on the path
  // itself (2026-08-20). Since the iPad pass only one tree mounts, so this
  // asserts one per shape instead of counting both in one render.
  it("shows the end-of-line interchange affordance on n5 — wide map: banner", () => {
    renderPage("/ja/learn?tier=n5", "ja", [], "wide");
    expect(screen.getAllByRole("button", { name: /Continue onto the N4/ }).length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByTestId("vnm-tier-continue")).toBeNull();
  });

  it("shows the end-of-line interchange affordance on n5 — vertical map: inline stop", () => {
    renderPage("/ja/learn?tier=n5", "ja", [], "phone");
    expect(screen.getByTestId("vnm-tier-continue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue onto the N4/ })).toBeInTheDocument();
  });

  it("shows the back affordance on n4 in both shapes", () => {
    // Wide: the exact "← N5 Line" banner, distinct from the plain tier tab.
    renderPage("/ja/learn?tier=n4", "ja", [], "wide");
    expect(screen.getByRole("button", { name: "← N5 Line" })).toBeInTheDocument();
    cleanup();
    renderPage("/ja/learn?tier=n4", "ja", [], "phone");
    expect(screen.getByTestId("vnm-tier-back")).toBeInTheDocument();
  });
});

/**
 * TestFlight #172 — Spencer on an 11" iPad in landscape: "this page is too
 * cluttered, what elements can we resize while still keeping readability".
 * Two of the reductions are structural (a DOM shape, not a pixel), so they
 * are pinned here; the pixel results live in the measurement table on the
 * feedback lap.
 */
describe("TransitLearnPage clutter reductions (#172)", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    (globalThis as unknown as { ResizeObserver: typeof ResizeObserver }).ResizeObserver =
      StubObserver as unknown as typeof ResizeObserver;
    (globalThis as unknown as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
      StubObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => cleanup());

  describe("legend popover", () => {
    it("is collapsed to a single button by default — the panel is not mounted", () => {
      renderPage("/ja/learn", "ja", [], "wide");
      const btn = screen.getByRole("button", { name: "Map legend" });
      expect(btn).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText("Legend")).toBeNull();
      // The four legend rows are reference, not content — none of them is on
      // the map until asked for.
      expect(screen.queryByText("Locked / planned")).toBeNull();
      expect(screen.queryByText("Station complete")).toBeNull();
    });

    it("opens on click, carrying the rows AND the how-to-read paragraph that used to need a second toggle", () => {
      renderPage("/ja/learn", "ja", [], "wide");
      fireEvent.click(screen.getByRole("button", { name: "Map legend" }));
      expect(screen.getByRole("button", { name: "Map legend" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(screen.getByText("Legend")).toBeInTheDocument();
      expect(screen.getByText("Locked / planned")).toBeInTheDocument();
      expect(screen.getByText("Station complete")).toBeInTheDocument();
      expect(screen.getByText(/Stations are modules/)).toBeInTheDocument();
    });

    it("closes again on a second click", () => {
      renderPage("/ja/learn", "ja", [], "wide");
      const btn = screen.getByRole("button", { name: "Map legend" });
      fireEvent.click(btn);
      fireEvent.click(btn);
      expect(screen.queryByText("Locked / planned")).toBeNull();
    });

    it("remembers OPEN for the session, not forever", () => {
      renderPage("/ja/learn", "ja", [], "wide");
      fireEvent.click(screen.getByRole("button", { name: "Map legend" }));
      expect(sessionStorage.getItem("open-lingo-tmc-legend-open")).toBe("1");
      // localStorage must stay clean — a learner who opened the legend once
      // should not have it re-open on every visit for the rest of the year.
      expect(localStorage.getItem("open-lingo-tmc-legend-open")).toBeNull();

      cleanup();
      renderPage("/ja/learn", "ja", [], "wide");
      expect(screen.getByText("Locked / planned")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Map legend" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });

    it("a closed legend clears the session flag rather than pinning 'closed'", () => {
      sessionStorage.setItem("open-lingo-tmc-legend-open", "1");
      renderPage("/ja/learn", "ja", [], "wide");
      fireEvent.click(screen.getByRole("button", { name: "Map legend" }));
      expect(sessionStorage.getItem("open-lingo-tmc-legend-open")).toBeNull();
    });

    it("never mounts on the vertical map — that surface has no legend at all", () => {
      renderPage("/ja/learn", "ja", [], "phone");
      expect(screen.queryByRole("button", { name: "Map legend" })).toBeNull();
    });
  });

  describe("merged learn bar", () => {
    it("puts the title, the tier tabs and the view toggle in ONE bar", () => {
      const { container } = renderPage("/ja/learn", "ja", [], "wide");
      const bars = container.querySelectorAll('[data-tm="learn-bar"]');
      expect(bars).toHaveLength(1);
      const bar = bars[0] as HTMLElement;
      // Title: the signage card's job.
      expect(bar.querySelector("h1")?.textContent).toMatch(/Japanese for Beginners/);
      // Tier tabs: previously a separate full-width row under the card.
      expect(bar.querySelector('[aria-label="Course tier"]')).not.toBeNull();
      expect(bar.querySelectorAll('[data-tm="tier-tab"]')).toHaveLength(2);
      // …and there is no second tier row left outside it.
      expect(container.querySelectorAll('[data-tm="tier-tab"]')).toHaveLength(2);
    });

    it("keeps the subtitle and the line caption in the DOM, gated by CSS width not by JS", () => {
      // `.tmc-wide-only` hides them at ≤1366 CSS px (transitLearnPage.css) —
      // a media query, so happy-dom can only assert the hook is applied. The
      // pixel behaviour is covered by the measurement pass.
      const { container } = renderPage("/ja/learn", "ja", [], "wide");
      const bar = container.querySelector('[data-tm="learn-bar"]') as HTMLElement;
      const gated = bar.querySelectorAll(".tmc-wide-only");
      expect(gated.length).toBe(2);
      expect(bar.textContent).toMatch(/Modules, lessons, and side quests/);
    });

    it("courses with no n4 tier get the bar with no tabs in it (es)", () => {
      const { container } = renderPage("/es/learn", "es", [], "wide");
      const bar = container.querySelector('[data-tm="learn-bar"]') as HTMLElement;
      expect(bar).not.toBeNull();
      expect(bar.querySelector('[aria-label="Course tier"]')).toBeNull();
    });

    it("stays off the vertical map (#84 — no signage card there)", () => {
      const { container } = renderPage("/ja/learn", "ja", [], "phone");
      expect(container.querySelector('[data-tm="learn-bar"]')).toBeNull();
    });
  });

  describe("pan hint", () => {
    it("shows for a learner who has never panned the map", () => {
      const { container } = renderPage("/ja/learn", "ja", [], "wide");
      expect(container.querySelector('[data-tm="drag-hint"]')).not.toBeNull();
    });

    it("stays retired once the gesture has been used", () => {
      localStorage.setItem("open-lingo-tmc-drag-seen", "1");
      const { container } = renderPage("/ja/learn", "ja", [], "wide");
      expect(container.querySelector('[data-tm="drag-hint"]')).toBeNull();
    });
  });

  it("no longer floats the YOUR PROGRESS card over the map", () => {
    // Its two numbers moved into the rail's level row (ProfileCardBody, which
    // this file stubs out), so nothing on the map may still print them.
    const { container } = renderPage("/ja/learn", "ja", [], "wide");
    expect(container.textContent).not.toMatch(/Course complete/);
    expect(container.textContent).not.toMatch(/Total XP/);
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
