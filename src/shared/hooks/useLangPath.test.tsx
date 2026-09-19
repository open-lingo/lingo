import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import type { ReactNode } from "react";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

let visibleIds: readonly string[] = [...AVAILABLE_LEARNING_LANGUAGE_IDS];
let contextLanguage: { id: string } | null = null;

vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: contextLanguage }),
}));
vi.mock("@/shared/hooks/useVisibleLearningLanguageIds", () => ({
  useVisibleLearningLanguageIds: () => visibleIds,
}));

import { useLang, useLangPath } from "./useLangPath";

function wrapperAt(path: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path=":lang" element={children} />
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    );
  };
}

describe("useLang — placement's course resolution + every :lang-prefixed link builder", () => {
  it("flag off: /pt in the URL resolves to the fallback language, not pt", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS];
    contextLanguage = null;
    const { result } = renderHook(() => useLang(), { wrapper: wrapperAt("/pt") });
    expect(result.current).toBe(AVAILABLE_LEARNING_LANGUAGE_IDS[0]);
  });

  it("flag on + allow-listed: /pt in the URL resolves to pt", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"];
    contextLanguage = null;
    const { result } = renderHook(() => useLang(), { wrapper: wrapperAt("/pt") });
    expect(result.current).toBe("pt");
  });

  it("existing languages (ja) are unaffected by pt's visibility", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS];
    contextLanguage = null;
    const { result } = renderHook(() => useLang(), { wrapper: wrapperAt("/ja") });
    expect(result.current).toBe("ja");
  });

  it("useLangPath builds a pt-prefixed path only once pt is resolvable", () => {
    visibleIds = [...AVAILABLE_LEARNING_LANGUAGE_IDS, "pt"];
    contextLanguage = null;
    const { result } = renderHook(() => useLangPath(), { wrapper: wrapperAt("/pt") });
    expect(result.current("qa/m1")).toBe("/pt/qa/m1");
  });
});
