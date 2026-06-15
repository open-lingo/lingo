/**
 * Tests for useUnlockMapSync — server backup of the atom unlock ladder.
 *
 * Mocks useApi + useAuth (same pattern as useProgressMe.test). Drives the
 * hook through renderHook so the hydrate union + push-on-event flow is
 * exercised end-to-end against the local store.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  ATOMS_UNLOCKED_EVENT,
  getUnlockedAtomIds,
  isAtomUnlocked,
} from "@/features/lesson/data/unlockLessonAtoms";

const STORAGE_KEY = "lingo:unlocked-atoms";

const mockGetUnlocks = vi.fn();
const mockAddUnlocks = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({ isAuthenticated: true, isLoading: false, user: { sub: "u1" } }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    progress: { getUnlocks: mockGetUnlocks, addUnlocks: mockAddUnlocks },
  }),
}));

import { useUnlockMapSync } from "./useUnlockMapSync";

describe("useUnlockMapSync", () => {
  beforeEach(() => {
    localStorage.clear();
    mockGetUnlocks.mockReset();
    mockAddUnlocks.mockReset();
    mockAddUnlocks.mockResolvedValue(undefined);
  });

  it("restores the unlock ladder from the server into an empty local store", async () => {
    mockGetUnlocks.mockResolvedValue(["ja:a", "ja:b", "ja:c"]);

    renderHook(() => useUnlockMapSync());

    await waitFor(() => expect(isAtomUnlocked("ja:a")).toBe(true));
    expect(isAtomUnlocked("ja:c")).toBe(true);
    expect(getUnlockedAtomIds().size).toBe(3);
  });

  it("unions server + local and pushes local-only ids up (never drops either)", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["ja:local", "ja:shared"]));
    mockGetUnlocks.mockResolvedValue(["ja:shared", "ja:server"]);

    renderHook(() => useUnlockMapSync());

    await waitFor(() => expect(isAtomUnlocked("ja:server")).toBe(true));
    // Local-only id survives (union, not replace).
    expect(isAtomUnlocked("ja:local")).toBe(true);
    // And gets pushed up to the server.
    await waitFor(() => expect(mockAddUnlocks).toHaveBeenCalledWith(["ja:local"]));
  });

  it("keeps the local set untouched when the server isn't wired (getUnlocks → null)", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["ja:local"]));
    mockGetUnlocks.mockResolvedValue(null);

    renderHook(() => useUnlockMapSync());

    await waitFor(() => expect(mockGetUnlocks).toHaveBeenCalled());
    expect(isAtomUnlocked("ja:local")).toBe(true);
    expect(mockAddUnlocks).not.toHaveBeenCalled();
  });

  it("pushes newly-unlocked ids when an atoms-unlocked event fires", async () => {
    mockGetUnlocks.mockResolvedValue([]);
    renderHook(() => useUnlockMapSync());
    await waitFor(() => expect(mockGetUnlocks).toHaveBeenCalled());

    act(() => {
      window.dispatchEvent(
        new CustomEvent(ATOMS_UNLOCKED_EVENT, { detail: { atomIds: ["ja:new"] } }),
      );
    });

    expect(mockAddUnlocks).toHaveBeenCalledWith(["ja:new"]);
  });
});
