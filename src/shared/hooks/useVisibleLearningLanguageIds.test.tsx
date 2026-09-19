import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { AVAILABLE_LEARNING_LANGUAGE_IDS } from "@/shared/domain/languageConfig";

// Controllable stand-ins for the three live sources this hook combines —
// same pattern useProgressReconcile.test.tsx uses for LanguageContext.
let flagsState = {
  version: 1,
  courses: { ptBeta: { enabled: false, allowlist: [] as string[] } },
} as unknown as import("@/shared/config/featureFlags").FeatureFlags;
let authUser: { email?: string } | null = null;
let meState: { id?: string } | null = null;

vi.mock("@/shared/contexts/FeatureFlagsContext", () => ({
  useFeatureFlags: () => flagsState,
  useFeatureFlagsOptional: () => flagsState,
}));
vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({ user: authUser }),
}));
vi.mock("@/shared/hooks/useMe", () => ({
  useMe: () => ({ me: meState, isLoading: false }),
}));

import {
  useVisibleLearningLanguageIds,
  useVisibleLearningLanguages,
  useIsCourseVisible,
} from "./useVisibleLearningLanguageIds";

function setFlags(enabled: boolean, allowlist: string[]) {
  flagsState = {
    version: 1,
    courses: { ptBeta: { enabled, allowlist } },
  } as unknown as import("@/shared/config/featureFlags").FeatureFlags;
}

describe("useVisibleLearningLanguageIds — the single React seam", () => {
  it("flag off: pt absent regardless of identity (Spencer included)", () => {
    setFlags(false, ["spencer@lichfieldfamily.com"]);
    authUser = { email: "spencer@lichfieldfamily.com" };
    meState = null;
    const { result } = renderHook(() => useVisibleLearningLanguageIds());
    expect(result.current).not.toContain("pt");
    expect([...result.current]).toEqual([...AVAILABLE_LEARNING_LANGUAGE_IDS]);
  });

  it("flag on + email allow-listed: pt present", () => {
    setFlags(true, ["spencer@lichfieldfamily.com"]);
    authUser = { email: "spencer@lichfieldfamily.com" };
    meState = null;
    const { result } = renderHook(() => useVisibleLearningLanguageIds());
    expect(result.current).toContain("pt");
  });

  it("flag on + email NOT allow-listed: pt absent", () => {
    setFlags(true, ["spencer@lichfieldfamily.com"]);
    authUser = { email: "someone-else@example.com" };
    meState = null;
    const { result } = renderHook(() => useVisibleLearningLanguageIds());
    expect(result.current).not.toContain("pt");
  });

  it("flag on + no email but the /users/me id is allow-listed: pt present (lead addition — id fallback)", () => {
    const userId = "e651cc3e-d8c3-4649-aca2-d014d8edd13a";
    setFlags(true, [userId]);
    authUser = {}; // no email claim client-side
    meState = { id: userId };
    const { result } = renderHook(() => useVisibleLearningLanguageIds());
    expect(result.current).toContain("pt");
  });

  it("never effects any other course: full AVAILABLE_LEARNING_LANGUAGE_IDS set is always present, flag state notwithstanding", () => {
    setFlags(true, ["spencer@lichfieldfamily.com"]);
    authUser = { email: "spencer@lichfieldfamily.com" };
    meState = null;
    const { result } = renderHook(() => useVisibleLearningLanguageIds());
    for (const id of AVAILABLE_LEARNING_LANGUAGE_IDS) {
      expect(result.current).toContain(id);
    }
  });

  it("useVisibleLearningLanguages resolves ids to full Language configs, pt included only when visible", () => {
    setFlags(true, ["spencer@lichfieldfamily.com"]);
    authUser = { email: "spencer@lichfieldfamily.com" };
    meState = null;
    const { result } = renderHook(() => useVisibleLearningLanguages());
    expect(result.current.map((l) => l.id)).toContain("pt");
    const pt = result.current.find((l) => l.id === "pt");
    expect(pt?.name).toBe("Portuguese");
  });

  it("useIsCourseVisible('pt') matches useVisibleLearningLanguageIds exactly", () => {
    setFlags(true, ["spencer@lichfieldfamily.com"]);
    authUser = { email: "someone-else@example.com" };
    meState = null;
    const { result } = renderHook(() => useIsCourseVisible("pt"));
    expect(result.current).toBe(false);

    authUser = { email: "spencer@lichfieldfamily.com" };
    const { result: result2 } = renderHook(() => useIsCourseVisible("pt"));
    expect(result2.current).toBe(true);
  });
});
