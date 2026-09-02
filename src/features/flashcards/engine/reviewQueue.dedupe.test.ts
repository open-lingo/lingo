import { describe, it, expect, beforeEach } from "vitest";
import { buildReviewQueue } from "./reviewQueue";
import { setCardState, clearSRSStore } from "./srsStorage";
import { createInitialState } from "./srs";
import type { Flashcard } from "../data/types";

/**
 * Sibling-bury dedupe (`dedupeSiblings` in reviewQueue.ts) keys on
 * `front|kana`. A card with no `reading` at all (kana-only decks, KO/ES/FR,
 * or a community-deck import that never set one) must still dedupe against
 * the same front with a reading — an absent reading is a wildcard, not a
 * distinct key. Otherwise course 水 (みず) and a community-deck 水 with no
 * reading both surface as "due" the same day.
 */
const card = (
  id: string,
  front: string,
  reading?: { surface: string; kana: string },
): Flashcard => ({
  id,
  front,
  back: id,
  type: "word",
  reading,
});

describe("buildReviewQueue — sibling dedupe across readings", () => {
  beforeEach(() => clearSRSStore());

  it("keeps both siblings when the front is shared but the kana differs", () => {
    const a = card("ja:nani-what", "何", { surface: "何", kana: "なに" });
    const b = card("ja:nani-nan", "何", { surface: "何", kana: "なん" });
    setCardState(a.id, createInitialState());
    setCardState(b.id, createInitialState());

    const q = buildReviewQueue([a, b], 0);

    expect(q.review.map((c) => c.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("buries the second sibling when front and kana both match", () => {
    const a = card("course:mizu", "水", { surface: "水", kana: "みず" });
    const b = card("community:mizu", "水", { surface: "水", kana: "みず" });
    setCardState(a.id, createInitialState());
    setCardState(b.id, createInitialState());

    const q = buildReviewQueue([a, b], 0);

    expect(q.review).toHaveLength(1);
    expect(q.review[0].id).toBe(a.id);
  });

  it("treats an absent reading as a wildcard against the same front with one", () => {
    const withReading = card("course:mizu", "水", { surface: "水", kana: "みず" });
    const withoutReading = card("community:mizu-noreading", "水");
    setCardState(withReading.id, createInitialState());
    setCardState(withoutReading.id, createInitialState());

    const q = buildReviewQueue([withReading, withoutReading], 0);

    expect(q.review).toHaveLength(1);
    expect(q.review[0].id).toBe(withReading.id);
  });

  it("treats an absent reading as a wildcard regardless of insertion order", () => {
    const withoutReading = card("community:mizu-noreading", "水");
    const withReading = card("course:mizu", "水", { surface: "水", kana: "みず" });
    setCardState(withoutReading.id, createInitialState());
    setCardState(withReading.id, createInitialState());

    const q = buildReviewQueue([withoutReading, withReading], 0);

    expect(q.review).toHaveLength(1);
    expect(q.review[0].id).toBe(withoutReading.id);
  });
});
