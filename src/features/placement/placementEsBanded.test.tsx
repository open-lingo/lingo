/**
 * End-to-end regression: before `getItemsForModule` read the language
 * module's `placementBank` (ADR-001) for es/fr, `PlacementTestPage`'s banded
 * (self-declared-level) run for ANY non-JA/KO language always served zero
 * items — `itemsLookup` for a banded run calls `getItemsForModule` verbatim
 * (never the derived-from-lessons pool test-out uses), and that always
 * returned `[]` for es/fr. `selectNextItem` came back null on the very
 * first tick, and the engine finalized instantly to "Starting from the
 * top" — a learner who picked "I'm fairly comfortable" saw the exact same
 * screen as "Complete beginner".
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (
      _k: string,
      fb?: string | Record<string, unknown>,
      opts?: Record<string, unknown>,
    ) => {
      const s =
        typeof fb === "string" ? fb : (fb as { defaultValue?: string })?.defaultValue ?? _k;
      const vars = (typeof fb === "object" ? fb : opts) ?? {};
      return s.replace(/\{\{(\w+)\}\}/g, (_m, k) =>
        String((vars as Record<string, unknown>)[k] ?? ""),
      );
    },
  }),
}));

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({ progress: {} }),
}));

const settingsRef = {
  learning: {
    showRomanization: {},
    hiraganaRomajiAutoOff: false,
    katakanaRomajiAutoOff: false,
    hideBuildTileRomaji: false,
    buildTileRomajiAutoFlipped: false,
  },
  audio: { silentMode: false },
  accessibility: { reducedMotion: false },
};
vi.mock("@/shared/contexts/SettingsContext", () => ({
  useSettings: () => ({ settings: settingsRef, updateSetting: vi.fn() }),
}));

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: { id: "es" } }),
}));

// The content-as-data race (defect 1) is a separate concern — this test
// pins the banded-placement wiring, so the course reads "ready" from the
// first render (the real eager-registered curriculum, already loaded by
// this test's own imports elsewhere in the suite).
vi.mock("@/features/lesson/data/useLessonContent", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/lesson/data/useLessonContent")>();
  return {
    ...actual,
    useCourseReady: () => "ready" as const,
  };
});

import { PlacementTestPage } from "./PlacementTestPage";

describe("PlacementTestPage — es banded placement serves a real question", () => {
  beforeEach(cleanup);

  it('selecting a non-beginner band renders a first question, not "Starting from the top"', async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/es/learn/placement-test"]}>
        <Routes>
          <Route path=":lang/learn/placement-test" element={<PlacementTestPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // Step 0: self-declared level. es (unregistered in BANDS_BY_LANGUAGE)
    // falls back to `buildGenericBands`, whose top band is labeled this.
    const advancedBand = await screen.findByText("I'm fairly comfortable");
    advancedBand.click();

    // A real derived step must render — not an instant finalize. The stage
    // wrapper carries `data-visual-qa-step-id`/`-step-type` (see
    // `PlacementTestPage`'s `stageProps`) only once a step is served.
    await waitFor(() => {
      const stage = container.querySelector("[data-visual-qa-step-id]");
      expect(stage?.getAttribute("data-visual-qa-step-id")).toBeTruthy();
    });

    expect(screen.queryByText("Starting from the top")).toBeNull();
    expect(screen.queryByText(/Not quite yet/)).toBeNull();
  });
});
