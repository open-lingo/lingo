/**
 * Regression (commit 7d64a32b, 2026-09-13 content-as-data wave): lesson
 * content is now fetched lazily per module (`ensureCourseLoaded` /
 * `useCourseReady`). `PlacementTestPage` called `useCourseReady(langId)`
 * but ignored the result, and derived the test-out set in a `useState`
 * initializer that ran on the FIRST render — before the module's lesson
 * JSON had loaded. On a cold direct navigation to
 * `/:lang/learn/test-out/:moduleId` the lesson registry is empty at that
 * point, so `hasBank` read false and the page showed "No test-out
 * questions yet" for a module that has a perfectly good bank, every time,
 * for as long as the fetch was in flight.
 *
 * This test drives the real race: it clears the lesson registry (simulating
 * the browser's cold empty table), holds `ensureCourseLoaded` pending, and
 * asserts the page shows neither the empty-bank message nor a served
 * question until the load resolves and the module's lessons are
 * registered — then asserts a real derived item renders.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import {
  __clearLessonRegistry,
  registerLessons,
  getRegisteredLessons,
} from "@/features/lesson/data/lessonRegistry";

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

// The loader the real `useCourseReady` hook awaits. Held pending under test
// control so we can observe the page's state WHILE the module JSON is still
// "in flight", then resolve it and observe the page after.
let resolveLoad: (() => void) | null = null;
vi.mock("@/features/lesson/data/contentLoader", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/features/lesson/data/contentLoader")>();
  return {
    ...actual,
    ensureCourseLoaded: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveLoad = resolve;
        }),
    ),
  };
});

import { PlacementTestPage } from "./PlacementTestPage";

const MODULE_ID = "m14";
const LANG = "es";
const LESSON_PREFIX = `${LANG}-${MODULE_ID}-`;

describe("PlacementTestPage test-out — cold registry / in-flight load", () => {
  let savedLessons: ReturnType<typeof getRegisteredLessons>;

  beforeEach(() => {
    resolveLoad = null;
    // Snapshot the real, already-authored es m14 lesson content (eager test
    // runtime has it loaded at import time) before wiping the registry, so
    // we can "deliver" it later exactly as the real loader would.
    savedLessons = getRegisteredLessons().filter((l) => l.id.startsWith(LESSON_PREFIX));
    expect(savedLessons.length).toBeGreaterThan(0);
    __clearLessonRegistry();
  });

  afterEach(() => {
    cleanup();
    // Restore the registry for every other test file sharing this worker.
    registerLessons(savedLessons);
  });

  it('shows no "no bank" / empty-result message while the course is still loading', async () => {
    render(
      <MemoryRouter initialEntries={[`/${LANG}/learn/test-out/${MODULE_ID}`]}>
        <Routes>
          <Route path=":lang/learn/test-out/:moduleId" element={<PlacementTestPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // The registry is empty and the load is still pending — the page must
    // NOT have already judged this module bank-less.
    expect(screen.queryByText("No test-out questions yet")).toBeNull();
    expect(screen.queryByText(/Not quite yet/)).toBeNull();
    expect(screen.queryByText(/0 of 0/)).toBeNull();

    // (Doesn't resolve in this test — verifies the pre-load state only.)
    expect(resolveLoad).not.toBeNull();
  });

  it("derives and renders a real item once the module loads", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={[`/${LANG}/learn/test-out/${MODULE_ID}`]}>
        <Routes>
          <Route path=":lang/learn/test-out/:moduleId" element={<PlacementTestPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(resolveLoad).not.toBeNull());

    // Deliver the content exactly as `ensureCourseLoaded` would: register
    // the lessons, THEN resolve the loader's promise.
    act(() => {
      registerLessons(savedLessons);
      resolveLoad?.();
    });

    await waitFor(() => {
      const stage = container.querySelector("[data-visual-qa-step-id]");
      expect(stage?.getAttribute("data-visual-qa-step-id")).toBeTruthy();
    });

    expect(screen.queryByText("No test-out questions yet")).toBeNull();
  });
});
