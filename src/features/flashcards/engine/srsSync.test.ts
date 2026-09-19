import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDirtyCards,
  markSynced,
  mergeServerState,
  performSync,
  chunkIds,
  SRS_SYNC_CHUNK_SIZE,
} from "./srsSync";
import { getCardState, setCardState, getSRSStore, setSRSStore } from "./srsStorage";
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
      // wrongly marked clean too. Tightened to per-card marking.
      //
      // This is a LIVE case, not hypothetical (2026-09-17 correctness
      // audit, docs/progress-sync-contract-2026-09-17.md): lingo-core's
      // `upsert_cards` (both sqlite + dynamo) now genuinely omits a card
      // from the result dict when its individual write fails — one card's
      // error no longer aborts the whole `/srs/sync` request. This test
      // pins the client-side half of that contract: an omitted id must
      // stay dirty, whatever the reason for the omission.
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

  // GAP A (lane SRSGAPS, 2026-09-18): `known` is just another field on
  // SRSCardState, so mergeStates' existing whole-card-wins-or-loses LWW
  // already carries it correctly through every branch below PROVIDED the
  // server round-trips it (fixed server-side, lingo-core `app/srs/
  // schemas.py`). These lock the client half of that contract: a pull must
  // never silently un-suppress a known card, and a genuine newer server
  // review must still win even when it un-suppresses one.
  describe("known flag precedence (test-out seed sync, GAP A)", () => {
    it("local known survives a pull of an OLDER server card that isn't known", () => {
      // The exact device-B-never-had-it-vs-device-A-just-seeded-it shape:
      // local was seeded (and synced) after the server's stale copy.
      setCardState("ja:a", { ...learnedCard("2026-06-01T00:00:00.000Z"), known: true });
      mergeServerState({
        "ja:a": { ...learnedCard("2026-05-01T00:00:00.000Z"), known: false },
      });
      const after = getCardState("ja:a");
      expect(after?.known).toBe(true);
      // No merge happened (local was newer) — lastSyncedAt is untouched.
      expect(after?.lastSyncedAt).toBeUndefined();
    });

    it("a genuinely NEWER server review un-suppresses a known card (LWW still wins)", () => {
      // A real review on another device after this one was marked known —
      // Spencer's stated contract: "known is sticky unless the server card
      // was reviewed later than the local one."
      setCardState("ja:a", { ...learnedCard("2026-05-01T00:00:00.000Z"), known: true });
      mergeServerState({
        "ja:a": { ...learnedCard("2026-06-01T00:00:00.000Z"), known: false },
      });
      const after = getCardState("ja:a");
      expect(after?.known).toBe(false);
      expect(after?.lastReviewedAt).toBe("2026-06-01T00:00:00.000Z");
    });

    it("a fresh device (no local card) adopts a known server card as known", () => {
      // !localCard → serverIsNewer is always true; this is the exact bug
      // shape before the server fix (server used to drop `known` on the
      // way out, so this test would have seen `undefined`, not `true`).
      mergeServerState({
        "ja:a": { ...learnedCard("2026-05-01T00:00:00.000Z"), known: true },
      });
      expect(getCardState("ja:a")?.known).toBe(true);
    });

    it("a fresh device adopts a NOT-known server card as due (no false suppression)", () => {
      mergeServerState({
        "ja:a": { ...learnedCard("2026-05-01T00:00:00.000Z"), known: false },
      });
      expect(getCardState("ja:a")?.known).toBe(false);
    });

    it("local not-known, older, loses to a newer known server card", () => {
      setCardState("ja:a", { ...learnedCard("2026-05-01T00:00:00.000Z"), known: false });
      mergeServerState({
        "ja:a": { ...learnedCard("2026-06-01T00:00:00.000Z"), known: true },
      });
      expect(getCardState("ja:a")?.known).toBe(true);
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

/**
 * Chunked push (2026-07-31). A learner can hold thousands of cards; the sync
 * POST is bounded by the Lambda function's 30s timeout (one conditional write
 * per card), NOT by the 6 MB payload cap. gzip does not help here — browsers
 * do not compress request bodies — so the push has to be split client-side.
 */
describe("performSync chunking", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });
  afterEach(() => vi.useRealTimers());

  /**
   * Seed n dirty (never-synced) cards in ONE store write. Per-card
   * `setCardState` re-reads and re-serializes the whole store each call, so
   * seeding thousands that way is quadratic and dominates the test run. Ids
   * are already canonical (`<lang>:<bare>`), which is what `setSRSStore`
   * expects.
   */
  function seedDirty(n: number): string[] {
    const store: Record<string, SRSCardState> = {};
    const ids: string[] = [];
    for (let i = 0; i < n; i++) {
      const id = `ja:c${i}`;
      store[id] = learnedCard("2026-06-01T00:00:00.000Z");
      ids.push(id);
    }
    setSRSStore(store);
    return ids;
  }

  it("never exceeds the server's per-request cap", async () => {
    seedDirty(2500);
    const sizes: number[] = [];
    const total = await performSync(async (p) => {
      sizes.push(Object.keys(p.cards).length);
      return p.cards;
    });

    expect(sizes.length).toBe(3); // 1000 + 1000 + 500
    expect(Math.max(...sizes)).toBeLessThanOrEqual(SRS_SYNC_CHUNK_SIZE);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(2500);
    expect(total).toBe(2500);
    expect(Object.keys(getDirtyCards())).toHaveLength(0);
  });

  it("sends every dirty card exactly once across batches", async () => {
    const ids = seedDirty(2101);
    const seen: string[] = [];
    await performSync(async (p) => {
      seen.push(...Object.keys(p.cards));
      return p.cards;
    });
    expect(seen).toHaveLength(2101);
    expect(new Set(seen).size).toBe(2101);
    expect(new Set(seen)).toEqual(new Set(ids));
  });

  it("keeps landed batches and leaves the rest dirty when a later batch fails", async () => {
    // The wedge this replaces: one oversized request timed out, nothing was
    // marked synced, and the identical payload was retried forever. Partial
    // progress must survive so the next sync has strictly less to do.
    seedDirty(2500);
    let call = 0;
    const total = await performSync(async (p) => {
      call++;
      if (call === 2) throw new Error("timeout");
      return p.cards;
    });

    expect(total).toBe(1000); // first batch only
    const stillDirty = Object.keys(getDirtyCards());
    expect(stillDirty).toHaveLength(1500);

    // The retry drains the remainder rather than re-sending the whole set.
    const sizes: number[] = [];
    const second = await performSync(async (p) => {
      sizes.push(Object.keys(p.cards).length);
      return p.cards;
    });
    expect(second).toBe(1500);
    expect(sizes.reduce((a, b) => a + b, 0)).toBe(1500);
    expect(Object.keys(getDirtyCards())).toHaveLength(0);
  });

  it("still rejects when the very first batch fails (nothing landed)", async () => {
    seedDirty(1500);
    await expect(
      performSync(async () => {
        throw new Error("offline");
      }),
    ).rejects.toThrow("offline");
    expect(Object.keys(getDirtyCards())).toHaveLength(1500);
  });

  it("sends a single request when the store fits in one batch", async () => {
    seedDirty(12);
    let calls = 0;
    await performSync(async (p) => {
      calls++;
      return p.cards;
    });
    expect(calls).toBe(1);
  });
});

describe("chunkIds", () => {
  it("splits evenly and keeps the remainder", () => {
    const ids = Array.from({ length: 7 }, (_, i) => `c${i}`);
    expect(chunkIds(ids, 3)).toEqual([
      ["c0", "c1", "c2"],
      ["c3", "c4", "c5"],
      ["c6"],
    ]);
  });

  it("returns nothing for an empty list and rejects a non-positive size", () => {
    expect(chunkIds([], 10)).toEqual([]);
    expect(() => chunkIds(["a"], 0)).toThrow();
  });

  it("stays within the server cap at its default size", () => {
    expect(SRS_SYNC_CHUNK_SIZE).toBeLessThanOrEqual(1000);
  });
});
