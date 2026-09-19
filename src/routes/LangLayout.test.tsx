import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

let visibleIds: readonly string[] = [...AVAILABLE_LEARNING_LANGUAGE_IDS];
const setLanguage = vi.fn();

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: null, setLanguage }),
}));
vi.mock("@/shared/hooks/useVisibleLearningLanguageIds", () => ({
  useVisibleLearningLanguageIds: () => visibleIds,
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
});
