import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  getDirtyGrammarCards,
  buildGrammarSyncPayload,
  mergeGrammarServerState,
  performGrammarSync,
  hydrateGrammarFromServer,
  partitionSyncStore,
  GRAMMAR_KEY_PREFIX,
} from "./grammarSync";
import { getGrammarCardState, setGrammarCardState } from "./grammarSrs";
import { setCardState, getCardState, getSRSStore } from "./srsStorage";
import type { SRSCardState, SRSModalityState } from "../data/types";

// Fixed clock — mirrors srsSync.test.ts conventions.
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

function learnedCard(lastReviewedAt: string): SRSCardState {
  return {
    recognition: learnedSub(),
    production: learnedSub(),
    lastReviewedAt,
  };
}

describe("grammarSync (Track B)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(T0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getDirtyGrammarCards", () => {
    it("returns a grammar card that has never been synced", () => {
      setGrammarCardState("wa-topic", learnedCard("2026-05-30T00:00:00.000Z"));
      const dirty = getDirtyGrammarCards();
      expect(Object.keys(dirty)).toEqual(["wa-topic"]);
    });

    it("ignores a clean grammar card", () => {
      setGrammarCardState("wa-topic", {
        ...learnedCard("2026-05-30T00:00:00.000Z"),
        lastSyncedAt: "2026-05-31T00:00:00.000Z",
      });
      expect(Object.keys(getDirtyGrammarCards())).toEqual([]);
    });
  });

  describe("buildGrammarSyncPayload — key namespacing", () => {
    it("namespaces grammar point ids with the grammar: prefix on the wire", () => {
      setGrammarCardState("wa-topic", learnedCard("2026-05-30T00:00:00.000Z"));
      const payload = buildGrammarSyncPayload();
      expect(Object.keys(payload.cards)).toEqual([`${GRAMMAR_KEY_PREFIX}wa-topic`]);
    });

    it("round-trips through namespace + de-namespace without collision against a vocab id", () => {
      // Vocab store has "ja:wa-topic" (contrived collision-shaped id) while
      // grammar store has "wa-topic" — the namespaced wire key must keep
      // them distinguishable.
      setCardState("ja:wa-topic", learnedCard("2026-05-30T00:00:00.000Z"));
      setGrammarCardState("wa-topic", learnedCard("2026-05-30T00:00:00.000Z"));

      const grammarPayload = buildGrammarSyncPayload();
      expect(Object.keys(grammarPayload.cards)).toEqual(["grammar:wa-topic"]);

      // The vocab store is untouched by building the grammar payload.
      expect(getCardState("ja:wa-topic")).toBeDefined();
      expect(getGrammarCardState("wa-topic")).toBeDefined();
    });
  });

  describe("mergeGrammarServerState — LWW basics (mirrors srsSync LWW)", () => {
    it("newer server state replaces older local state", () => {
      setGrammarCardState("wa-topic", learnedCard("2026-05-01T00:00:00.000Z"));
      mergeGrammarServerState({
        "grammar:wa-topic": learnedCard("2026-06-01T00:00:00.000Z"),
      });
      const after = getGrammarCardState("wa-topic");
      expect(after?.lastReviewedAt).toBe("2026-06-01T00:00:00.000Z");
      expect(after?.lastSyncedAt).toBe(T0.toISOString());
    });

    it("newer local state survives an older server state", () => {
      setGrammarCardState("wa-topic", learnedCard("2026-06-01T00:00:00.000Z"));
      mergeGrammarServerState({
        "grammar:wa-topic": learnedCard("2026-05-01T00:00:00.000Z"),
      });
      expect(getGrammarCardState("wa-topic")?.lastReviewedAt).toBe(
        "2026-06-01T00:00:00.000Z",
      );
    });

    it("a deliberately reset local grammar card beats server 'learned' state (manualResetAt)", () => {
      setGrammarCardState("wa-topic", {
        recognition: newSub({ dueDate: "2026-01-01", lastReviewDate: "2026-01-01" }),
        production: newSub({ dueDate: "2026-01-01", lastReviewDate: "2026-01-01" }),
        manualResetAt: T0.toISOString(),
      });
      mergeGrammarServerState({
        "grammar:wa-topic": learnedCard("2099-01-01T00:00:00.000Z"),
      });
      const after = getGrammarCardState("wa-topic");
      expect(after?.recognition.reps).toBe(0);
      expect(after?.manualResetAt).toBe(T0.toISOString());
    });
  });

  describe("cross-track isolation", () => {
    it("a grammar sync never touches vocab store entries", () => {
      setCardState("ja:untouched", learnedCard("2026-01-01T00:00:00.000Z"));
      setGrammarCardState("wa-topic", learnedCard("2026-05-30T00:00:00.000Z"));

      const syncFn = vi.fn(async () => ({
        "grammar:wa-topic": learnedCard("2026-05-30T00:00:00.000Z"),
      }));

      return performGrammarSync(syncFn).then(() => {
        expect(getCardState("ja:untouched")?.lastReviewedAt).toBe(
          "2026-01-01T00:00:00.000Z",
        );
        expect(getCardState("ja:untouched")?.lastSyncedAt).toBeUndefined();
        expect(Object.keys(getSRSStore())).toEqual(["ja:untouched"]);
      });
    });

    it("mergeGrammarServerState ignores non-grammar-namespaced keys in a mixed response", () => {
      mergeGrammarServerState({
        "ja:some-vocab-card": learnedCard("2026-05-01T00:00:00.000Z"),
        "grammar:wa-topic": learnedCard("2026-05-01T00:00:00.000Z"),
      });
      expect(getGrammarCardState("wa-topic")).toBeDefined();
      expect(Object.keys(getSRSStore())).toEqual([]);
    });

    it("partitionSyncStore splits a mixed full-state response by the grammar: prefix", () => {
      const { vocab, grammar } = partitionSyncStore({
        "ja:a": learnedCard("2026-05-01T00:00:00.000Z"),
        "grammar:wa-topic": learnedCard("2026-05-01T00:00:00.000Z"),
      });
      expect(Object.keys(vocab)).toEqual(["ja:a"]);
      expect(Object.keys(grammar)).toEqual(["wa-topic"]);
    });
  });

  describe("performGrammarSync / markSynced guard (mirrors srsSync performSync)", () => {
    it("marks ONLY the ids the server echoes back synced", () => {
      setGrammarCardState("wa-topic", learnedCard("2026-05-01T00:00:00.000Z"));
      setGrammarCardState("ka-question", learnedCard("2026-05-01T00:00:00.000Z"));

      const syncFn = vi.fn(async () => ({
        "grammar:wa-topic": learnedCard("2026-05-01T00:00:00.000Z"),
      }));

      return performGrammarSync(syncFn).then((count) => {
        expect(count).toBe(1);
        expect(getGrammarCardState("wa-topic")?.lastSyncedAt).toBe(T0.toISOString());
        expect(getGrammarCardState("ka-question")?.lastSyncedAt).toBeUndefined();
      });
    });

    it("marks NOTHING synced when the server returns an empty object (404/501)", () => {
      setGrammarCardState("wa-topic", learnedCard("2026-05-01T00:00:00.000Z"));
      const syncFn = vi.fn(async () => ({}));

      return performGrammarSync(syncFn).then((count) => {
        expect(count).toBe(0);
        expect(getGrammarCardState("wa-topic")?.lastSyncedAt).toBeUndefined();
      });
    });

    it("is a no-op when there are no dirty grammar cards", () => {
      const syncFn = vi.fn(async () => ({}));
      return performGrammarSync(syncFn).then((count) => {
        expect(count).toBe(0);
        expect(syncFn).not.toHaveBeenCalled();
      });
    });
  });

  describe("hydrateGrammarFromServer", () => {
    it("merges only the grammar slice of a full-state response", async () => {
      setCardState("ja:untouched", learnedCard("2026-01-01T00:00:00.000Z"));

      await hydrateGrammarFromServer(async () => ({
        "ja:some-vocab-card": learnedCard("2026-05-01T00:00:00.000Z"),
        "grammar:wa-topic": learnedCard("2026-05-01T00:00:00.000Z"),
      }));

      expect(getGrammarCardState("wa-topic")).toBeDefined();
      // Vocab store untouched — no bogus "grammar:wa-topic" or
      // "ja:some-vocab-card" ingestion.
      expect(Object.keys(getSRSStore())).toEqual(["ja:untouched"]);
    });

    it("is a no-op for an empty response", async () => {
      await hydrateGrammarFromServer(async () => ({}));
      expect(getGrammarCardState("wa-topic")).toBeUndefined();
    });
  });
});
