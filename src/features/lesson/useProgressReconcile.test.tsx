/**
 * The b20 field failure, reproduced.
 *
 * Build 20 (2f56da91) reached the founder's phone and posted nothing: 33 GET
 * /progress/me and six tick-sized batch POSTs (62–658 ms) in 15 minutes, not
 * one 100-row chunk — and a queued row would have shown in the dirty count
 * and been drained by the very next tick, so nothing ever reached the queue.
 *
 * The reconciliation lived in `useProgressMe`'s query function, gated on a
 * learning language that is only readable after SettingsContext's Phase-2
 * effect has committed. `/progress/me` and `/users/me/settings` arrive in the
 * SAME `/boot` payload, but the progress half is consumed in a promise
 * continuation and the settings half needs a render + effect + localStorage
 * write — so progress always wins, the gate always skipped, and nothing
 * re-ran the query function when the language finally landed.
 *
 * The first test below is that ordering. It fails against the query-function
 * design and passes against the effect.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import type * as React from "react";
import type { ReactNode } from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { markLessonCompleted, getMockCompletedLessonIds } from "@/shared/domain/mockProgress";
import { LAST_USER_KEY } from "@/features/settings/storage";
import {
  RECONCILE_MARKER_PREFIX,
  readReconcileStatus,
  resetReconcileMemoryForTests,
} from "@/shared/domain/progressReconcile";
import {
  hasPushedFullSrsAfterReconcile,
  resetFullSrsPushMarkerForTests,
} from "@/features/flashcards/engine/srsSync";
import { setCardState } from "@/features/flashcards/engine/srsStorage";
import { resetBulkQueueForTests } from "@/shared/domain/testOutSyncQueue";
import {
  subscribeProgressChanged,
  resetProgressEventsForTests,
  type ProgressChangedEvent,
} from "@/shared/domain/progressEvents";
import { useProgressChangeInvalidation } from "./useProgressChangeInvalidation";
import type { SRSCardState } from "@/features/flashcards/data/types";
import type { BulkCompleteSubmission, LessonRollup, ProgressSummary } from "@/shared/api/progress";

const USER = "auth0|founder";
const mockGetMe = vi.fn();
const mockBulkComplete = vi.fn();
const mockSrsSync = vi.fn();

vi.mock("@/shared/auth/useAuth", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { sub: USER },
    error: undefined,
    login: () => {},
    signup: () => {},
    logout: () => {},
  }),
}));

vi.mock("@/shared/api", () => ({
  useApi: () => ({
    progress: { getMe: mockGetMe, bulkComplete: mockBulkComplete },
    srs: { sync: mockSrsSync },
  }),
}));

/** Controllable stand-in for LanguageProvider (backed by SettingsContext). */
let languageState: { language: { id: string } | null; isLoading: boolean } = {
  language: { id: "ja" },
  isLoading: false,
};
vi.mock("@/shared/contexts/LanguageContext", () => ({
  useLanguage: () => ({ ...languageState, languages: [], setLanguage: () => {} }),
}));

import { useProgressReconcile } from "./useProgressReconcile";

function wrapper(): (props: { children: ReactNode }) => React.JSX.Element {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

function rollups(ids: string[]): LessonRollup[] {
  const at = "2026-09-15T12:00:00.000Z";
  return ids.map((lessonId) => ({
    lessonId,
    bestScore: 1,
    firstPassedAt: at,
    latestAttemptAt: at,
    attemptCount: 1,
  }));
}

function summary(ids: string[]): ProgressSummary {
  return {
    user: { streak: 2, bestStreak: 2, lastActiveDate: "2026-09-15", xp: 385, level: 1, lingots: 58 },
    lessons: rollups(ids),
    concepts: [],
    last30days: [],
  };
}

function seed(n: number): string[] {
  const ids = Array.from({ length: n }, (_, i) => `ja-m1-l${i + 1}`);
  for (const id of ids) {
    markLessonCompleted(id, { accuracy: 1, xpEarned: 0, isReview: false });
  }
  return ids;
}

function posted(): string[] {
  return mockBulkComplete.mock.calls.flatMap((c) => (c[0] as BulkCompleteSubmission).lessonIds);
}

describe("useProgressReconcile", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LAST_USER_KEY, USER);
    localStorage.setItem(
      "open-lingo-settings",
      JSON.stringify({ learning: { learningLanguageId: "ja" } }),
    );
    languageState = { language: { id: "ja" }, isLoading: false };
    mockGetMe.mockReset();
    mockBulkComplete.mockReset();
    mockSrsSync.mockReset();
    mockSrsSync.mockImplementation((payload: { cards: Record<string, SRSCardState> }) =>
      Promise.resolve(payload.cards),
    );
    mockBulkComplete.mockImplementation((payload: BulkCompleteSubmission) =>
      Promise.resolve({
        accepted: payload.lessonIds.length,
        alreadyComplete: 0,
        total: payload.lessonIds.length,
      }),
    );
    resetReconcileMemoryForTests();
    resetBulkQueueForTests();
    resetFullSrsPushMarkerForTests(USER);
    resetProgressEventsForTests();
  });

  it("REPRO: progress resolves first and the language 2s later — it still posts", async () => {
    const local = seed(500);
    mockGetMe.mockResolvedValue(summary(local.slice(0, 18)));
    // The launch order the phone actually sees: no language yet.
    languageState = { language: null, isLoading: true };
    localStorage.removeItem("open-lingo-settings");

    const { rerender } = renderHook(() => useProgressReconcile(), { wrapper: wrapper() });
    await waitFor(() => expect(mockGetMe).toHaveBeenCalled());
    // Nothing yet — correct, the course isn't known.
    expect(mockBulkComplete).not.toHaveBeenCalled();

    // …SettingsContext Phase 2 lands (the "2 seconds later" half).
    await act(async () => {
      localStorage.setItem(
        "open-lingo-settings",
        JSON.stringify({ learning: { learningLanguageId: "ja" } }),
      );
      languageState = { language: { id: "ja" }, isLoading: false };
      rerender();
    });

    // ONE bulk-complete request, not 5 chunked batch POSTs (2026-09-18
    // redesign — ids only, no 100-row cap on this path).
    await waitFor(() => expect(mockBulkComplete).toHaveBeenCalledTimes(1));
    expect(posted()).toHaveLength(482);
  });

  it("posts the months of local-only completions the server never got", async () => {
    const local = seed(500);
    mockGetMe.mockResolvedValue(summary(local.slice(0, 18)));

    renderHook(() => useProgressReconcile(), { wrapper: wrapper() });
    await waitFor(() => expect(mockBulkComplete).toHaveBeenCalledTimes(1));

    expect(posted()).toHaveLength(482);
    expect(mockBulkComplete.mock.calls[0][0].source).toBe("test_out");
    expect(localStorage.getItem(`${RECONCILE_MARKER_PREFIX}${USER}`)).toBeTruthy();
    expect(readReconcileStatus(USER)?.confirmed).toBe(482);
    // LOCAL→SERVER only — nothing removed locally.
    expect(getMockCompletedLessonIds()).toHaveLength(500);
  });

  it("posts nothing when the server already has everything local has", async () => {
    const local = seed(40);
    mockGetMe.mockResolvedValue(summary([...local, "ja-m2-l1"]));

    renderHook(() => useProgressReconcile(), { wrapper: wrapper() });
    await waitFor(() => expect(getMockCompletedLessonIds()).toContain("ja-m2-l1"));
    expect(mockBulkComplete).not.toHaveBeenCalled();
    expect(readReconcileStatus(USER)?.reason).toBe("nothing-local-only");
  });

  it("waits rather than skipping while the language is still loading", async () => {
    seed(10);
    mockGetMe.mockResolvedValue(summary([]));
    languageState = { language: null, isLoading: true };

    renderHook(() => useProgressReconcile(), { wrapper: wrapper() });
    await waitFor(() => expect(mockGetMe).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(mockBulkComplete).not.toHaveBeenCalled();
    // No marker burned on the wait — the next render still reconciles.
    expect(localStorage.getItem(`${RECONCILE_MARKER_PREFIX}${USER}`)).toBeNull();
  });

  it("pushes every SRS card once, after a reconcile that actually posted something (docs/handoff-2026-09-18-resume.md §6)", async () => {
    const local = seed(20);
    mockGetMe.mockResolvedValue(summary(local.slice(0, 5)));
    setCardState("ja:atom-1", {
      recognition: { stability: 0, difficulty: 0, state: "new", interval: 0, dueDate: "2026-01-01", lastReviewDate: "2026-01-01", reps: 0, lapses: 0 },
      production: { stability: 0, difficulty: 0, state: "new", interval: 0, dueDate: "2026-01-01", lastReviewDate: "2026-01-01", reps: 0, lapses: 0 },
      lastReviewedAt: "2026-01-01T00:00:00.000Z",
    });

    renderHook(() => useProgressReconcile(), { wrapper: wrapper() });
    await waitFor(() => expect(mockBulkComplete).toHaveBeenCalled());
    await waitFor(() => expect(mockSrsSync).toHaveBeenCalledTimes(1));

    expect(hasPushedFullSrsAfterReconcile(USER)).toBe(true);
    const cardsPosted = mockSrsSync.mock.calls[0][0] as { cards: Record<string, unknown> };
    expect(Object.keys(cardsPosted.cards)).toContain("ja:atom-1");
  });

  it("does NOT push SRS when the reconcile posts nothing (server already had everything)", async () => {
    const local = seed(3);
    mockGetMe.mockResolvedValue(summary(local));
    setCardState("ja:atom-2", {
      recognition: { stability: 0, difficulty: 0, state: "new", interval: 0, dueDate: "2026-01-01", lastReviewDate: "2026-01-01", reps: 0, lapses: 0 },
      production: { stability: 0, difficulty: 0, state: "new", interval: 0, dueDate: "2026-01-01", lastReviewDate: "2026-01-01", reps: 0, lapses: 0 },
      lastReviewedAt: "2026-01-01T00:00:00.000Z",
    });

    renderHook(() => useProgressReconcile(), { wrapper: wrapper() });
    await waitFor(() => expect(readReconcileStatus(USER)?.reason).toBe("nothing-local-only"));
    await new Promise((r) => setTimeout(r, 20));
    expect(mockSrsSync).not.toHaveBeenCalled();
    expect(hasPushedFullSrsAfterReconcile(USER)).toBe(false);
  });

  // HOMEREFRESH (2026-09-18): build 33 shipped the reconcile above and moved
  // Spencer's server count 139 → 525 in seconds, but the Home page's
  // Continue button kept its pre-sync target until a navigation — because
  // NOTHING invalidated `["progress","me"]` after a push that only POSTs
  // (nothing local changes, so `mockProgress`'s own notify never fired
  // either). These tests pin the fix: the push emits `reconcile_push`
  // exactly once, and only when something actually landed.
  describe("progressChanged signal (HOMEREFRESH)", () => {
    it("emits reconcile_push exactly once when the push actually posts", async () => {
      const local = seed(500);
      mockGetMe.mockResolvedValue(summary(local.slice(0, 18)));
      const events: ProgressChangedEvent[] = [];
      const unsubscribe = subscribeProgressChanged((e) => events.push(e));

      renderHook(() => useProgressReconcile(), { wrapper: wrapper() });
      await waitFor(() => expect(mockBulkComplete).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(events.filter((e) => e.reason === "reconcile_push")).toHaveLength(1),
      );
      // Never per-lesson, never per-chunk — one signal for the whole batch.
      expect(events.filter((e) => e.reason === "reconcile_push")).toHaveLength(1);
      unsubscribe();
    });

    it("does NOT emit reconcile_push when the server already has everything (nothing posted)", async () => {
      const local = seed(40);
      mockGetMe.mockResolvedValue(summary([...local, "ja-m2-l1"]));
      const events: ProgressChangedEvent[] = [];
      const unsubscribe = subscribeProgressChanged((e) => events.push(e));

      renderHook(() => useProgressReconcile(), { wrapper: wrapper() });
      await waitFor(() => expect(getMockCompletedLessonIds()).toContain("ja-m2-l1"));
      await new Promise((r) => setTimeout(r, 20));
      expect(events.filter((e) => e.reason === "reconcile_push")).toHaveLength(0);
      unsubscribe();
    });

    it("end-to-end: the emitted signal costs exactly ONE extra progress/me GET (not zero, not a storm)", async () => {
      const local = seed(500);
      mockGetMe.mockResolvedValue(summary(local.slice(0, 18)));

      const w = wrapper();
      renderHook(
        () => {
          useProgressReconcile();
          useProgressChangeInvalidation();
        },
        { wrapper: w },
      );

      // Mount fetch: useProgressMe's own useQuery (inside useProgressReconcile).
      await waitFor(() => expect(mockGetMe).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(mockBulkComplete).toHaveBeenCalledTimes(1));
      // The invalidation the signal triggers refetches the one active
      // progress/me observer — exactly one more GET, not a burst.
      await waitFor(() => expect(mockGetMe).toHaveBeenCalledTimes(2));
      await new Promise((r) => setTimeout(r, 50));
      expect(mockGetMe).toHaveBeenCalledTimes(2);
    });
  });
});
