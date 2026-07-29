import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDirtyCards,
  markSynced,
  mergeServerState,
  performSync,
} from "./srsSync";
import { getCardState, setCardState, getSRSStore } from "./srsStorage";
import type { SRSCardState, SRSModalityState } from "../data/types";

// Fixed clock — never assert against the real system clock (per test
// conventions in srs.test.ts / srsStorage.test.ts).
const T0 = new Date("2026-06-01T12:00:00.000Z");

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

function learnedSub(overrides: Partial<SRSModalityState> = {}): SRSModalityState {
  return newSub({
    state: "review",
    interval: 10,
    reps: 3,
    stability: 5,
    difficulty: 4,
    ...overrides,
  });
}

/** A card that's been reviewed and learned, with a given lastReviewedAt. */
function learnedCard(lastReviewedAt: string): SRSCardState {
  return {
    recognition: learnedSub(),
    production: learnedSub(),
    lastReviewedAt,
  };
}

/**
 * A never-reviewed "new" card — the shared shape of resets AND seeds.
 * Dates are pinned to an old day so `cardLastReviewedAt`'s fallback (it
 * uses `lastReviewDate` when no top-level `lastReviewedAt` is set) doesn't
 * accidentally look "newer" than a real server review timestamp.
 */
function freshCard(extra: Partial<SRSCardState> = {}): SRSCardState {
  return {
    recognition: newSub({ dueDate: "2026-01-01", lastReviewDate: "2026-01-01" }),
    production: newSub({ dueDate: "2026-01-01", lastReviewDate: "2026-01-01" }),
    ...extra,
  };
}

describe("srsSync", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getDirtyCards", () => {
    it("returns a card that has never been synced", () => {
      setCardState("ja:a", learnedCard("2026-05-30T00:00:00.000Z"));
      const dirty = getDirtyCards();
      expect(Object.keys(dirty)).toEqual(["ja:a"]);
    });

    it("returns a card reviewed after its last sync", () => {
      setCardState("ja:a", {
        ...learnedCard("2026-05-31T00:00:00.000Z"),
        lastSyncedAt: "2026-05-30T00:00:00.000Z",
      });
      const dirty = getDirtyCards();
      expect(Object.keys(dirty)).toEqual(["ja:a"]);
    });

    it("ignores a clean card (synced at/after its last review)", () => {
      setCardState("ja:a", {
        ...learnedCard("2026-05-30T00:00:00.000Z"),
        lastSyncedAt: "2026-05-31T00:00:00.000Z",
      });
      const dirty = getDirtyCards();
      expect(Object.keys(dirty)).toEqual([]);
    });

    it("stamps a top-level lastReviewedAt onto the payload entry when missing", () => {
      // Legacy/derived cards may lack the top-level field; getDirtyCards
      // must still ship one (server requires it as the LWW key). Derived from
      // the later lastReviewDate expanded to START-of-day (see cardLastReviewedAt
      // — start-of-day, not noon, so a same-day sync clears never-reviewed seeds).
      const state: SRSCardState = {
        recognition: learnedSub({ lastReviewDate: "2026-05-30" }),
        production: newSub({ lastReviewDate: "2026-05-20" }),
      };
      setCardState("ja:a", state);
      const dirty = getDirtyCards();
      expect(dirty["ja:a"].lastReviewedAt).toBe("2026-05-30T00:00:00.000Z");
    });
  });

  describe("mergeServerState — LWW basics", () => {
    it("newer server state replaces older local state", () => {
      setCardState("ja:a", learnedCard("2026-05-01T00:00:00.000Z"));
      mergeServerState({ "ja:a": learnedCard("2026-06-01T00:00:00.000Z") });
      const after = getCardState("ja:a");
      expect(after?.lastReviewedAt).toBe("2026-06-01T00:00:00.000Z");
      expect(after?.lastSyncedAt).toBe(T0.toISOString());
    });

    it("newer local state survives an older server state", () => {
      const local = learnedCard("2026-06-01T00:00:00.000Z");
      setCardState("ja:a", local);
      mergeServerState({ "ja:a": learnedCard("2026-05-01T00:00:00.000Z") });
      const after = getCardState("ja:a");
      expect(after?.lastReviewedAt).toBe("2026-06-01T00:00:00.000Z");
      // Local wasn't overwritten, so lastSyncedAt stays whatever it was
      // (undefined here) — the merge is a no-op for this card.
      expect(after?.lastSyncedAt).toBeUndefined();
    });

    it("a card absent locally is simply adopted from the server", () => {
      mergeServerState({ "ja:a": learnedCard("2026-05-01T00:00:00.000Z") });
      expect(getCardState("ja:a")?.lastReviewedAt).toBe(
        "2026-05-01T00:00:00.000Z",
      );
    });
  });

  describe("reset preservation (Bug 1 regression)", () => {
    it("a deliberately reset local card beats older-looking server 'learned' state", () => {
      // Card manager's handleReset stamps manualResetAt — this is the
      // ONLY thing that should make a new/reps-0 card win against server
      // progress.
      setCardState("ja:a", freshCard({ manualResetAt: T0.toISOString() }));
      mergeServerState({ "ja:a": learnedCard("2026-01-01T00:00:00.000Z") });
      const after = getCardState("ja:a");
      expect(after?.recognition.state).toBe("new");
      expect(after?.recognition.reps).toBe(0);
      expect(after?.manualResetAt).toBe(T0.toISOString());
    });

    it("a deliberately reset local card beats server 'learned' state even when server is newer", () => {
      setCardState("ja:a", freshCard({ manualResetAt: T0.toISOString() }));
      mergeServerState({
        "ja:a": learnedCard("2099-01-01T00:00:00.000Z"),
      });
      const after = getCardState("ja:a");
      expect(after?.recognition.reps).toBe(0);
      expect(after?.manualResetAt).toBe(T0.toISOString());
    });

    it("BUG 1 FIX: a seeded-but-never-reviewed local card LOSES to server learned state", () => {
      // seedSchedule.createSeededState / placement seeding both produce a
      // new/reps-0 card with NO manualResetAt. Before the fix this was
      // indistinguishable from a deliberate reset and silently discarded
      // real server progress on hydrate.
      setCardState("ja:a", freshCard());
      mergeServerState({ "ja:a": learnedCard("2026-05-01T00:00:00.000Z") });
      const after = getCardState("ja:a");
      expect(after?.recognition.state).toBe("review");
      expect(after?.recognition.reps).toBe(3);
      expect(after?.lastReviewedAt).toBe("2026-05-01T00:00:00.000Z");
    });

    it("a plain new card with partial progress on one modality is never treated as a reset", () => {
      const partial = freshCard({
        recognition: learnedSub(),
        lastReviewedAt: "2026-01-01T00:00:00.000Z",
      });
      setCardState("ja:a", partial);
      mergeServerState({ "ja:a": learnedCard("2026-06-01T00:00:00.000Z") });
      const after = getCardState("ja:a");
      // Server is newer and local isn't reset-shaped (recognition has
      // reps > 0) — server wins normally.
      expect(after?.recognition.reps).toBe(3);
      expect(after?.production.state).toBe("review");
    });
  });

  describe("markSynced / server-returned-state guard", () => {
    it("markSynced stamps lastSyncedAt=now for the given ids only", () => {
      setCardState("ja:a", learnedCard("2026-05-01T00:00:00.000Z"));
      setCardState("ja:b", learnedCard("2026-05-01T00:00:00.000Z"));
      markSynced(["ja:a"]);
      expect(getCardState("ja:a")?.lastSyncedAt).toBe(T0.toISOString());
      expect(getCardState("ja:b")?.lastSyncedAt).toBeUndefined();
    });

    it("performSync marks ONLY the ids the server echoes back synced (tightened 2026-07-01)", async () => {
      // Was payload-level: gated on `Object.keys(serverState).length > 0`
      // then called `markSynced(dirtyIds)` for the FULL dirty set, so a
      // card the server silently dropped from a partial response was
      // wrongly marked clean too. Tightened to per-card marking once we
      // confirmed (both lingo-core repos — sqlite + dynamo `upsert_cards`)
      // that a real response always echoes every submitted card_id, so
      // this is a correctness fix with no behavior change against the real
      // backend — only against a hypothetical partial response, exercised
      // here.
      setCardState("ja:a", learnedCard("2026-05-01T00:00:00.000Z"));
      setCardState("ja:b", learnedCard("2026-05-01T00:00:00.000Z"));

      const syncFn = vi.fn(async () => ({
        "ja:a": learnedCard("2026-05-01T00:00:00.000Z"),
      }));

      const result = await performSync(syncFn);

      expect(result).toBe(1);
      expect(getCardState("ja:a")?.lastSyncedAt).toBe(T0.toISOString());
      expect(getCardState("ja:b")?.lastSyncedAt).toBeUndefined();
    });

    it("performSync marks NOTHING synced when the server returns an empty object (404/501)", async () => {
      setCardState("ja:a", learnedCard("2026-05-01T00:00:00.000Z"));
      const syncFn = vi.fn(async () => ({}));

      const result = await performSync(syncFn);

      expect(result).toBe(0);
      expect(getCardState("ja:a")?.lastSyncedAt).toBeUndefined();
    });

    it("performSync is a no-op when there are no dirty cards", async () => {
      const syncFn = vi.fn(async () => ({}));
      const result = await performSync(syncFn);
      expect(result).toBe(0);
      expect(syncFn).not.toHaveBeenCalled();
    });
  });

  describe("full store integrity", () => {
    it("mergeServerState leaves unrelated local cards untouched", () => {
      setCardState("ja:untouched", learnedCard("2026-01-01T00:00:00.000Z"));
      mergeServerState({ "ja:new-from-server": learnedCard(T0.toISOString()) });
      const store = getSRSStore();
      expect(store["ja:untouched"]?.lastReviewedAt).toBe(
        "2026-01-01T00:00:00.000Z",
      );
      expect(store["ja:new-from-server"]).toBeDefined();
    });
  });
});

describe("enqueueSyncOp serialization (concurrent syncs must queue, not race)", () => {
  beforeEach(() => localStorage.clear());

  it("two concurrent performSync calls never overlap and both resolve", async () => {
    // Regression: SRSPendingSync (boot push) and useSRSyncSession (reviewer
    // mount push) both POST with tag "srs:sync"; the ApiClient aborts the
    // previous in-flight request per tag, so overlapping syncs killed each
    // other and NOTHING reached the server (observed with a 394-card
    // Anki-import payload). The queue makes them take turns.
    setCardState("ja:queue-a", {
      recognition: learnedSub({ lastReviewDate: "2026-05-30" }),
      production: newSub(),
    } as SRSCardState);

    let active = 0;
    let maxActive = 0;
    const slowSync = async (payload: { cards: Record<string, SRSCardState> }) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 30));
      active--;
      return payload.cards;
    };

    const [a, b] = await Promise.all([
      performSync(slowSync),
      performSync(slowSync),
    ]);

    expect(maxActive).toBe(1); // strictly one POST in flight at a time
    // First call pushes the dirty card; second finds nothing left dirty.
    expect(a + b).toBeGreaterThanOrEqual(1);
    expect(Object.keys(getDirtyCards())).toHaveLength(0);
  });

  it("a failing sync does not wedge the queue", async () => {
    setCardState("ja:queue-b", {
      recognition: learnedSub({ lastReviewDate: "2026-05-30" }),
      production: newSub(),
    } as SRSCardState);

    const failing = async () => {
      throw new Error("boom");
    };
    await expect(performSync(failing)).rejects.toThrow("boom");

    // Queue must still run the next op.
    const ok = await performSync(async (p) => p.cards);
    expect(ok).toBeGreaterThanOrEqual(1);
  });
});
