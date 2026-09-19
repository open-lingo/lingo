import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

let visibleIds: readonly string[] = [...AVAILABLE_LEARNING_LANGUAGE_IDS];
// Cold-load race (lane PTFIX, 2026-09-18): `FeatureFlagsProvider` starts
// unready and resolves async — `flagsReady` simulates that in-flight
// window. Defaults true (the common case: flags already resolved) so the
// pre-existing tests below don't need to know this exists.
let flagsReady = true;
const setLanguage = vi.fn();

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: null, setLanguage }),
}));
vi.mock("@/shared/hooks/useVisibleLearningLanguageIds", () => ({
  useVisibleLearningLanguageIds: () => visibleIds,
}));
vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlagsReadyOptional: () => flagsReady,
}));

import { LangLayout } from "./LangLayout";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path=":lang" element={<LangLayout />}>
          <Route index element={<div data-testid="inside">inside {path}</div>} />
        </Route>
        {/* Redirect target — same shape as App.tsx's fallback route. */}
        <Route
          path={`/${AVAILABLE_LEARNING_LANGUAGE_IDS[0]}`}
          element={<div data-testid="fallback">fallback</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LangLayout — the :lang route guard (gates /pt/qa/m1, /pt/learn/placement-test, everything under /:lang)", () => {
  beforeEach(() => {
    flagsReady = true;
  });

  it("flag off: /pt/* redirects to the fallback language, even though pt IS a registered language id", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS]; // no "pt" — flag off or not allow-listed
    renderAt("/pt");
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("inside")).not.toBeInTheDocument();
  });

  it("flag on + allow-listed: /pt/* renders its Outlet (route reachable)", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"];
    renderAt("/pt");
    expect(screen.getByTestId("inside")).toBeInTheDocument();
    expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
  });

  it("existing languages (ja/ko/es/fr) are unaffected by pt's visibility either way", () => {
    for (const ids of [
      [...AVAILABLE_LEARNING_LANGUAGE_IDS],
      [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"],
    ]) {
      visibleIds = ids;
      const { unmount } = renderAt("/ja");
      expect(screen.getByTestId("inside")).toBeInTheDocument();
      unmount();
    }
  });

  it("an id that is neither registered nor pt still redirects regardless of pt's visibility", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"];
    renderAt("/not-a-real-language");
    expect(screen.getByTestId("fallback")).toBeInTheDocument();
  });

  describe("cold-load race (direct nav/refresh on /pt/* before the async feature-flags fetch resolves)", () => {
    it("flags pending + course not (yet) visible: renders the loading state, no redirect", () => {
      visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS]; // flags haven't resolved allow-list membership yet
      flagsReady = false;
      renderAt("/pt");
      expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
      expect(screen.queryByTestId("inside")).not.toBeInTheDocument();
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("flags resolved + not allowed: redirects (the pending window ends, it wasn't a permanent bypass)", () => {
      visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS];
      flagsReady = true;
      renderAt("/pt");
      expect(screen.getByTestId("fallback")).toBeInTheDocument();
      expect(screen.queryByTestId("inside")).not.toBeInTheDocument();
    });

    it("flags resolved + allowed: renders (deep-link into pt works once flags settle)", () => {
      visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"];
      flagsReady = true;
      renderAt("/pt");
      expect(screen.getByTestId("inside")).toBeInTheDocument();
      expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
    });

    it("flags pending but the course is already visible: renders immediately, no loading flash (base languages are flags-independent)", () => {
      visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS]; // ja is always visible — doesn't depend on flags
      flagsReady = false;
      renderAt("/ja");
      expect(screen.getByTestId("inside")).toBeInTheDocument();
      expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
    });
  });
});
