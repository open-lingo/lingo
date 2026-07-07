import { describe, it, expect } from "vitest";
import {
  rollbackStats,
  rollbackRepeatQueue,
  restoreStateForUndo,
  type SessionStats,
} from "./undo";
import { createInitialState, reviewCard } from "./srs";
import { computeDirtyCards, mergeStates } from "./srsSync";
import type { Flashcard } from "../data/types";

function card(id: string): Flashcard {
  return { id, front: id, back: id, type: "word" } as Flashcard;
}

describe("rollbackStats", () => {
  it("reverts reviewed and correct for a non-again grade", () => {
    const stats: SessionStats = { reviewed: 5, correct: 4 };
    expect(rollbackStats(stats, "good")).toEqual({ reviewed: 4, correct: 3 });
    expect(rollbackStats(stats, "easy")).toEqual({ reviewed: 4, correct: 3 });
    expect(rollbackStats(stats, "hard")).toEqual({ reviewed: 4, correct: 3 });
  });

  it("reverts only reviewed for an again grade (correct was never incremented)", () => {
    const stats: SessionStats = { reviewed: 5, correct: 4 };
    expect(rollbackStats(stats, "again")).toEqual({ reviewed: 4, correct: 4 });
  });

  it("clamps at zero", () => {
    expect(rollbackStats({ reviewed: 0, correct: 0 }, "good")).toEqual({
      reviewed: 0,
      correct: 0,
    });
  });
});

describe("rollbackRepeatQueue", () => {
  const a = card("ja:a");
  const b = card("ja:b");

  it("drops the last-appended card when the grade requeued it", () => {
    expect(rollbackRepeatQueue([a, b], true)).toEqual([a]);
  });

  it("leaves the queue untouched when the grade did not requeue", () => {
    const q = [a, b];
    expect(rollbackRepeatQueue(q, false)).toBe(q);
  });

  it("only removes one entry even when the same card was requeued twice", () => {
    expect(rollbackRepeatQueue([a, a], true)).toEqual([a]);
  });

  it("handles an empty queue defensively", () => {
    expect(rollbackRepeatQueue([], true)).toEqual([]);
  });
});

describe("restoreStateForUndo", () => {
  it("restores the FSRS scheduling fields verbatim (no recompute)", () => {
    const pre = createInitialState();
    // Give it some prior history so we can prove sub-states round-trip.
    const seeded = reviewCard(pre, "recognition", "good", new Date("2026-06-01T12:00:00Z"));

    const restored = restoreStateForUndo(seeded, new Date("2026-07-02T12:00:00Z"));

    expect(restored.recognition).toEqual(seeded.recognition);
    expect(restored.production).toEqual(seeded.production);
  });

  it("stamps a fresh lastReviewedAt and drops lastSyncedAt so it is a new local change", () => {
    const pre = createInitialState();
    const graded = reviewCard(pre, "recognition", "good", new Date("2026-06-01T12:00:00Z"));
    const synced = { ...graded, lastSyncedAt: "2026-06-01T12:05:00.000Z" };

    const at = new Date("2026-07-02T09:30:00Z");
    const restored = restoreStateForUndo(synced, at);

    expect(restored.lastReviewedAt).toBe(at.toISOString());
    expect(restored.lastSyncedAt).toBeUndefined();

    // Dirty-card detection must see it as needing sync.
    const dirty = computeDirtyCards({ "ja:x": restored });
    expect(Object.keys(dirty)).toEqual(["ja:x"]);
  });

  it("wins last-write-wins against the already-synced graded state", () => {
    const pre = createInitialState();
    // A previously-reviewed card, then a MISgrade the user wants to undo.
    const preGrade = reviewCard(pre, "recognition", "good", new Date("2026-06-01T12:00:00Z"));
    const graded = reviewCard(preGrade, "recognition", "again", new Date("2026-07-02T08:00:00Z"));

    // The grade already synced to the server.
    const serverState = { "ja:x": graded };

    // User undoes slightly later — restored snapshot must be newest.
    const restored = restoreStateForUndo(preGrade, new Date("2026-07-02T08:00:30Z"));
    const merged = mergeStates(
      { "ja:x": restored },
      serverState,
      new Date("2026-07-02T08:01:00Z").toISOString(),
    );

    // Local (restored) beats the graded server copy — the undo persists.
    expect(merged["ja:x"].recognition).toEqual(preGrade.recognition);
    expect(merged["ja:x"].lastReviewedAt).toBe(restored.lastReviewedAt);
  });

  it("does not mutate the snapshot it was given", () => {
    const pre = createInitialState();
    const snap = reviewCard(pre, "recognition", "good", new Date("2026-06-01T12:00:00Z"));
    const before = structuredClone(snap);
    restoreStateForUndo(snap, new Date("2026-07-02T12:00:00Z"));
    expect(snap).toEqual(before);
  });
});
