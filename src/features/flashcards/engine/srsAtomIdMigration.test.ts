/**
 * SRS storage atom-id namespace migration (Phase 2, ADR-005).
 *
 * Bare atom ids (pre-Phase-2) are canonicalized to `ja:<bare>` on read.
 * Mixed bare/prefixed payloads collapse to the prefixed form. The bulk
 * read rewrites the store in-place so subsequent writes never split
 * across bare/prefixed twins.
 */
import { beforeEach, describe, expect, it } from "vitest";
import {
  getCardState,
  getSRSStore,
  setCardState,
} from "./srsStorage";
import type { SRSCardState } from "../data/types";

const STORAGE_KEY = "open-lingo-srs:v2";

function makeState(reps = 1): SRSCardState {
  const sub = {
    stability: 1,
    difficulty: 1,
    state: "review" as const,
    interval: 1,
    dueDate: "2026-06-02",
    lastReviewDate: "2026-06-01",
    reps,
    lapses: 0,
  };
  return { recognition: { ...sub }, production: { ...sub } };
}

describe("SRS storage — Phase 2 atom-id namespace canonicalization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getCardState resolves a bare-id lookup against a prefixed-key entry", () => {
    const state = makeState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ "ja:ai": state }));
    expect(getCardState("ai")).toBeTruthy();
    expect(getCardState("ja:ai")).toBeTruthy();
  });

  it("setCardState with a bare id writes to the canonical prefixed key", () => {
    setCardState("ai", makeState());
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(raw["ja:ai"]).toBeTruthy();
    expect(raw["ai"]).toBeUndefined();
  });

  it("getSRSStore migrates legacy bare entries to prefixed in-place", () => {
    const state = makeState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ai: state, hito: state }));
    const store = getSRSStore();
    expect(store["ja:ai"]).toBeTruthy();
    expect(store["ja:hito"]).toBeTruthy();
    expect(store["ai"]).toBeUndefined();
    // Storage has been rewritten.
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(raw["ja:ai"]).toBeTruthy();
    expect(raw["ai"]).toBeUndefined();
  });

  it("prefixed-key wins when both shapes already exist", () => {
    const bareState = makeState(1);
    const prefixedState = makeState(7);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ai: bareState, "ja:ai": prefixedState }),
    );
    const store = getSRSStore();
    expect(store["ja:ai"].recognition.reps).toBe(7);
  });

  it("a fully-prefixed payload passes through unchanged", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ "ja:ai": makeState() }));
    const before = localStorage.getItem(STORAGE_KEY);
    getSRSStore();
    const after = localStorage.getItem(STORAGE_KEY);
    expect(after).toBe(before);
  });
});
