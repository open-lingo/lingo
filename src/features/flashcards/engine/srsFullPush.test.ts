/**
 * One-time full SRS push after a lesson reconcile (docs/handoff-2026-09-18-
 * resume.md §6 — "push the phone's full card set once so due counts match").
 *
 * Why a FULL push, not just the dirty-card path: a test-out/placement seed
 * writes hundreds of card intervals via `seedTestOutAtoms` in one localStorage
 * write, and while a freshly-seeded card IS "dirty" by `computeDirtyCards`'s
 * own rule, a full push is the safety net if any bookkeeping gap ever marks a
 * card synced without a confirmed server write. Gated per user (one-time) and
 * routed through `enqueueSyncOp` so it queues behind — never races — any
 * other `srs:sync` caller (the shared tag SRS already fixed this exact class
 * of bug for, `features/flashcards/engine/srsSync.ts` "enqueueSyncOp
 * serialization").
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  buildFullSyncPayload,
  performFullSync,
  pushAllSrsCardsOnceAfterReconcile,
  hasPushedFullSrsAfterReconcile,
  resetFullSrsPushMarkerForTests,
  enqueueSyncOp,
} from "./srsSync";
import { setCardState, getSRSStore } from "./srsStorage";
import type { SRSCardState, SRSModalityState } from "../data/types";

const USER = "auth0|founder";

function newSub(overrides: Partial<SRSModalityState> = {}): SRSModalityState {
  return {
    stability: 0,
    difficulty: 0,
    state: "new",
    interval: 0,
    dueDate: "2026-06-01",
    lastReviewDate: "2026-06-01",
    reps: 0,
    lapses: 0,
    ...overrides,
  };
}

/** A card already marked synced — the "clean" state a full push must STILL include. */
function syncedCard(): SRSCardState {
  return {
    recognition: newSub(),
    production: newSub(),
    lastReviewedAt: "2026-01-01T00:00:00.000Z",
    lastSyncedAt: "2026-09-01T00:00:00.000Z",
  };
}

function acceptAll(payload: { cards: Record<string, SRSCardState> }) {
  return Promise.resolve(payload.cards);
}

describe("buildFullSyncPayload — every card, not just dirty ones", () => {
  beforeEach(() => localStorage.clear());

  it("includes an already-synced card that a dirty-only payload would skip", () => {
    setCardState("ja:already-synced", syncedCard());
    const full = buildFullSyncPayload();
    expect(Object.keys(full.cards)).toEqual(["ja:already-synced"]);
  });
});

describe("performFullSync — serialized through enqueueSyncOp, never races another srs:sync caller", () => {
  beforeEach(() => localStorage.clear());

  it("two concurrent callers (a dirty-card push and a full push) never overlap on the wire", async () => {
    setCardState("ja:card-1", syncedCard());

    let active = 0;
    let maxActive = 0;
    const slowSync = async (payload: { cards: Record<string, SRSCardState> }) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 15));
      active--;
      return payload.cards;
    };

    // Mirrors the real shape: SRSPendingSync's own dirty-card push and this
    // module's full push both go through enqueueSyncOp with no coordination
    // beyond the shared chain.
    const [a, b] = await Promise.all([
      enqueueSyncOp(() => slowSync({ cards: {} })),
      performFullSync(slowSync),
    ]);

    expect(maxActive).toBe(1);
    expect(a).toBeDefined();
    expect(b).toBeGreaterThanOrEqual(1);
  });
});

describe("pushAllSrsCardsOnceAfterReconcile", () => {
  beforeEach(() => {
    localStorage.clear();
    resetFullSrsPushMarkerForTests(USER);
  });

  it("pushes every card once and marks the user done", async () => {
    setCardState("ja:x1", syncedCard());
    setCardState("ja:x2", syncedCard());

    expect(hasPushedFullSrsAfterReconcile(USER)).toBe(false);
    const batch = vi.fn(acceptAll);
    const synced = await pushAllSrsCardsOnceAfterReconcile(USER, batch);

    expect(synced).toBe(2);
    expect(hasPushedFullSrsAfterReconcile(USER)).toBe(true);
    const posted = batch.mock.calls.flatMap((c) => Object.keys(c[0].cards));
    expect(posted.sort()).toEqual(["ja:x1", "ja:x2"]);
  });

  it("is a no-op on the second call for the same user", async () => {
    setCardState("ja:y1", syncedCard());
    const batch = vi.fn(acceptAll);
    await pushAllSrsCardsOnceAfterReconcile(USER, batch);
    batch.mockClear();

    const secondRun = await pushAllSrsCardsOnceAfterReconcile(USER, batch);
    expect(secondRun).toBe(0);
    expect(batch).not.toHaveBeenCalled();
  });

  it("REGRESSION: a fully offline attempt leaves no marker — the next reconcile retries", async () => {
    setCardState("ja:z1", syncedCard());
    const failing = vi.fn(() => Promise.reject(new Error("offline")));

    await expect(pushAllSrsCardsOnceAfterReconcile(USER, failing)).rejects.toThrow("offline");
    expect(hasPushedFullSrsAfterReconcile(USER)).toBe(false);

    // Retry succeeds and marks done.
    const ok = vi.fn(acceptAll);
    const synced = await pushAllSrsCardsOnceAfterReconcile(USER, ok);
    expect(synced).toBe(1);
    expect(hasPushedFullSrsAfterReconcile(USER)).toBe(true);
  });

  it("marks done immediately when the store is empty (nothing to push)", async () => {
    const batch = vi.fn(acceptAll);
    const synced = await pushAllSrsCardsOnceAfterReconcile(USER, batch);
    expect(synced).toBe(0);
    expect(batch).not.toHaveBeenCalled();
    expect(hasPushedFullSrsAfterReconcile(USER)).toBe(true);
  });

  it("scopes the marker per user — a different user's push is independent", async () => {
    setCardState("ja:shared-store", syncedCard());
    await pushAllSrsCardsOnceAfterReconcile(USER, vi.fn(acceptAll));
    expect(hasPushedFullSrsAfterReconcile("auth0|someone-else")).toBe(false);
  });
});

// Sanity: getSRSStore is exercised indirectly above via setCardState; this
// just confirms the fixture helper actually wrote through to the real store
// (a broken fixture would make every test above vacuously pass with 0 cards).
describe("fixture sanity", () => {
  beforeEach(() => localStorage.clear());
  it("setCardState actually populates getSRSStore", () => {
    setCardState("ja:sanity", syncedCard());
    expect(Object.keys(getSRSStore())).toContain("ja:sanity");
  });
});
