import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const mockGetSettings = vi.fn();
const mockUpdateSettings = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { sub: "auth0|abc" } }),
}));

vi.mock("@/shared/api/provider", () => ({
  useApi: () => ({
    users: { getSettings: mockGetSettings, updateSettings: mockUpdateSettings },
  }),
}));

vi.mock("@/features/admin/impersonation/ImpersonationContext", () => ({
  useImpersonation: () => null,
}));

// SettingsProvider syncs `learning.uiLocale` to i18next as a side effect —
// irrelevant to the hydration race under test, and the real i18next isn't
// initialized in this unit test.
vi.mock("i18next", () => ({
  default: { language: "en", changeLanguage: vi.fn() },
}));

import { SettingsProvider, useSettings } from "./SettingsContext";

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={qc}>
        <SettingsProvider>{children}</SettingsProvider>
      </QueryClientProvider>
    );
  };
}

/**
 * Regression coverage for the "fix:romaji-assumed" QA row ("I still see the
 * hiragana opening this"). Root cause: placement credits assumed modules and
 * flips `learning.hiraganaRomajiAutoOff` via `updateSetting` — but if the
 * shared GET /me/settings query is still in flight (or simply resolves with
 * server data that predates the fire-and-forget PATCH), the Phase-2 "server
 * wins" hydration effect used a `storedSnapshot` frozen at mount and
 * wholesale-replaced the `learning` namespace with the (stale) server
 * response, silently reverting the just-set one-shot flag.
 */
describe("SettingsProvider hydration race (romaji auto-off survives a slow settings GET)", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetSettings.mockReset();
    mockUpdateSettings.mockReset();
    mockUpdateSettings.mockResolvedValue({});
  });

  it("does not let a settings GET that resolves after a local update clobber it", async () => {
    let resolveGet!: (v: unknown) => void;
    mockGetSettings.mockReturnValue(
      new Promise((resolve) => {
        resolveGet = resolve;
      }),
    );

    const wrapper = makeWrapper();
    const { result } = renderHook(() => useSettings(), { wrapper });

    // Placement (assumed-module credit) fires while the initial GET is
    // still in flight — plausible any time an adaptive/banded placement
    // run finishes before a network read does.
    act(() => {
      result.current.updateSetting("learning.hiraganaRomajiAutoOff", true);
    });
    expect(result.current.settings.learning.hiraganaRomajiAutoOff).toBe(true);

    // The GET now resolves with server data that predates the PATCH just
    // fired above — a real race, since the PATCH is fire-and-forget.
    act(() => {
      resolveGet({ learning: {} });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.learning.hiraganaRomajiAutoOff).toBe(true);
  });

  it("still lets the server restore settings when localStorage was cleared (server wins over an EMPTY local cache)", async () => {
    mockGetSettings.mockResolvedValue({
      learning: { learningLanguageId: "ja", onboardingCompleted: true },
    });

    const wrapper = makeWrapper();
    const { result } = renderHook(() => useSettings(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.settings.learning.learningLanguageId).toBe("ja");
  });
});
