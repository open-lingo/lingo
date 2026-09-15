import { describe, it, expect, beforeEach } from "vitest";
import {
  buildReviewQueue,
  buildQueueFromSubscriptions,
  type DeckSubscription,
  type DeckWithCards,
} from "./reviewQueue";
import { setCardState, clearSRSStore } from "./srsStorage";
import { createInitialState } from "./srs";
import type { Flashcard, SRSCardState } from "../data/types";

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

/**
 * TestFlight b13 #108 (Spencer): "We have two of this" — the same word
 * shown twice in one review session (JA, learner at m31). A card unlocked
 * into two subscribed decks at once has no SRS state yet, so both decks'
 * `newCards` builds independently include it — `dedupeSiblings` runs only
 * on the `due` list in `buildQueueFromSubscriptions`, never on `newCards`,
 * so the merged queue serves the sibling twice.
 */
describe("buildQueueFromSubscriptions — sibling dedupe across new cards", () => {
  beforeEach(() => clearSRSStore());

  it("does not serve the same new card twice when two subscribed decks both unlock it", () => {
    // Same underlying fact (identical front/kana), two different ids because
    // it was unlocked into two decks at once — exactly the dedupeSiblings key.
    const inDeckA: Flashcard = {
      id: "deckA:mizu",
      front: "水",
      back: "water",
      type: "word",
      reading: { surface: "水", kana: "みず" },
    };
    const inDeckB: Flashcard = {
      id: "deckB:mizu",
      front: "水",
      back: "water",
      type: "word",
      reading: { surface: "水", kana: "みず" },
    };
    const decks: DeckWithCards[] = [
      { id: "deck-a", cards: [inDeckA] },
      { id: "deck-b", cards: [inDeckB] },
    ];
    const subs: DeckSubscription[] = [
      { contentId: "deck-a", newCardsPerDay: 5, newCardOrder: "ordered" },
      { contentId: "deck-b", newCardsPerDay: 5, newCardOrder: "ordered" },
    ];
    // No SRS state at all — both are brand-new unlocks.
    const store: Record<string, SRSCardState> = {};

    const q = buildQueueFromSubscriptions(subs, decks, store, {});

    const frontKeys = q.queue.map(
      (c) => `${c.front.trim().toLowerCase()}|${c.reading?.kana ?? ""}`,
    );
    expect(new Set(frontKeys).size).toBe(frontKeys.length);
    expect(q.newCards).toHaveLength(1);
    expect(q.queue).toHaveLength(1);
  });

  it("prefers the due copy over a new sibling of the same fact", () => {
    const dueCopy: Flashcard = {
      id: "deckA:mizu-due",
      front: "水",
      back: "water",
      type: "word",
      reading: { surface: "水", kana: "みず" },
    };
    const newSibling: Flashcard = {
      id: "deckB:mizu-new",
      front: "水",
      back: "water",
      type: "word",
      reading: { surface: "水", kana: "みず" },
    };
    const decks: DeckWithCards[] = [
      { id: "deck-a", cards: [dueCopy] },
      { id: "deck-b", cards: [newSibling] },
    ];
    const subs: DeckSubscription[] = [
      { contentId: "deck-a", newCardsPerDay: 5, newCardOrder: "ordered" },
      { contentId: "deck-b", newCardsPerDay: 5, newCardOrder: "ordered" },
    ];
    const store: Record<string, SRSCardState> = {
      [dueCopy.id]: createInitialState(),
    };

    const q = buildQueueFromSubscriptions(subs, decks, store, {});

    expect(q.queue).toHaveLength(1);
    expect(q.queue[0].id).toBe(dueCopy.id);
    expect(q.newCards).toHaveLength(0);
  });
});

/**
 * Same gap, same fix, in the other queue builder: `buildReviewQueue`'s
 * `newCards` (unseenCards.slice) was never deduped against its own
 * (already-deduped) due pile, nor against itself. Low-probability in the
 * single course-deck caller today (one-card-per-atom), but the function is
 * exported/reused and should not silently double-serve a sibling.
 */
describe("buildReviewQueue — new cards deduped against due pile", () => {
  beforeEach(() => clearSRSStore());

  it("does not admit a new sibling of a card that's already due", () => {
    const dueCopy = card("course:mizu-due", "水", { surface: "水", kana: "みず" });
    const newSibling = card("community:mizu-new", "水", { surface: "水", kana: "みず" });
    setCardState(dueCopy.id, createInitialState());
    // newSibling gets no state — it's the unseen/new one.

    const q = buildReviewQueue([dueCopy, newSibling], 5);

    expect(q.queue).toHaveLength(1);
    expect(q.queue[0].id).toBe(dueCopy.id);
    expect(q.newCards).toHaveLength(0);
  });
});
