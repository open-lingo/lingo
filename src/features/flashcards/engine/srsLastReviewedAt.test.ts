/**
 * Fix 1 / Fix 15 — verify ``cardLastReviewedAt`` produces a sortable ISO
 * timestamp used by the backend last-write-wins merge key, and that
 * ``reviewCard`` populates the top-level ``lastReviewedAt``.
 */
import { describe, it, expect } from "vitest";
import { cardLastReviewedAt, createInitialState, reviewCard } from "./srs";
import type { SRSCardState } from "../data/types";

describe("cardLastReviewedAt", () => {
  it("prefers the top-level lastReviewedAt set by reviewCard", () => {
    const at = new Date("2026-05-25T15:30:00.000Z");
    const initial = createInitialState();
    const next = reviewCard(initial, "recognition", "good", at);
    expect(next.lastReviewedAt).toBe(at.toISOString());
    expect(cardLastReviewedAt(next)).toBe(at.toISOString());
  });

  it("falls back to the later modality lastReviewDate when no top-level ts", () => {
    const state: SRSCardState = {
      ...createInitialState(),
    };
    state.recognition.lastReviewDate = "2026-05-22";
    state.production.lastReviewDate = "2026-05-24";
    const got = cardLastReviewedAt(state);
    // Sortable ISO-8601 — date with UTC midday suffix
    expect(got.startsWith("2026-05-24T")).toBe(true);
    expect(got > "2026-05-22T23:59:59Z").toBe(true);
  });

  it("returns a string monotonically increasing with review time", () => {
    const initial = createInitialState();
    const at1 = new Date("2026-05-25T09:00:00.000Z");
    const at2 = new Date("2026-05-25T11:00:00.000Z");
    const s1 = reviewCard(initial, "recognition", "good", at1);
    const s2 = reviewCard(s1, "production", "good", at2);
    expect(cardLastReviewedAt(s2) > cardLastReviewedAt(s1)).toBe(true);
  });
});
