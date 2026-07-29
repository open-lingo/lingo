/**
 * Frequency-vocab → course-deck integration.
 *
 * The deck builder must surface frequency cards as *unlocked* only when the
 * feature is enabled AND the word's module is reached — with lesson-driven
 * unlocks untouched in every case.
 */
import { describe, it, expect } from "vitest";
import { buildEnrichedCourseDeck } from "./data/courseDeck";
import type { FlashcardDeck } from "./data/types";
import { JA_FREQUENCY_ATOMS } from "@/features/languages/ja/frequencyAtoms";
import { KO_FREQUENCY_ATOMS } from "@/features/languages/ko/frequencyAtoms";
import { getFrequencyUnlockedAtomIds } from "@/features/languages/frequencyResolver";

const OFF = { enabled: false, reachedModule: 0 };
const cardById = (deck: FlashcardDeck | null, id: string) =>
  deck?.cards.find((c) => c.id === id);

describe("JA course deck — frequency overlay", () => {
  const sample = JA_FREQUENCY_ATOMS[0]; // rank 1, unlockModule 3
  const empty = new Set<string>();

  it("feature OFF: the frequency atom's card is present but locked + untagged", () => {
    const deck = buildEnrichedCourseDeck("ja", empty, OFF);
    const card = cardById(deck, sample.id);
    expect(card).toBeTruthy();
    expect(card!.unlocked).not.toBe(true);
    expect(card!.source).not.toBe("freq");
  });

  it("feature ON + module reached: the card flips to unlocked + source freq", () => {
    const deck = buildEnrichedCourseDeck("ja", empty, {
      enabled: true,
      reachedModule: sample.unlockModule,
    });
    const card = cardById(deck, sample.id);
    expect(card!.unlocked).toBe(true);
    expect(card!.source).toBe("freq");
  });

  it("feature ON but module NOT reached: still locked", () => {
    const later = JA_FREQUENCY_ATOMS.find((a) => a.unlockModule > 3)!;
    const deck = buildEnrichedCourseDeck("ja", empty, {
      enabled: true,
      reachedModule: later.unlockModule - 1,
    });
    const card = cardById(deck, later.id);
    expect(card!.unlocked).not.toBe(true);
  });

  it("higher reached module unlocks a superset of frequency cards", () => {
    const low = buildEnrichedCourseDeck("ja", empty, { enabled: true, reachedModule: 4 })!;
    const high = buildEnrichedCourseDeck("ja", empty, { enabled: true, reachedModule: 20 })!;
    const unlockedFreq = (d: typeof low) =>
      new Set(d.cards.filter((c) => c.source === "freq" && c.unlocked).map((c) => c.id));
    const lo = unlockedFreq(low);
    const hi = unlockedFreq(high);
    expect(hi.size).toBeGreaterThan(lo.size);
    for (const id of lo) expect(hi.has(id)).toBe(true);
  });

  it("lesson unlocks are unaffected by the frequency flag", () => {
    const lessonId = "ja:ai"; // an m1 (non-future) atom
    const off = buildEnrichedCourseDeck("ja", new Set([lessonId]), OFF)!;
    const on = buildEnrichedCourseDeck("ja", new Set([lessonId]), {
      enabled: true,
      reachedModule: 20,
    })!;
    expect(cardById(off, lessonId)!.unlocked).toBe(true);
    const onCard = cardById(on, lessonId)!;
    expect(onCard.unlocked).toBe(true);
    expect(onCard.source).not.toBe("freq"); // lesson atom, not a frequency word
  });
});

describe("KO course deck — frequency seed appended", () => {
  const empty = new Set<string>();

  it("feature OFF: no frequency-source cards in the deck", () => {
    const deck = buildEnrichedCourseDeck("ko", empty, OFF)!;
    expect(deck.cards.some((c) => c.source === "freq")).toBe(false);
  });

  it("feature ON: seed words appear as freq-source cards, unlocked per module", () => {
    const reached = 27;
    const deck = buildEnrichedCourseDeck("ko", empty, { enabled: true, reachedModule: reached })!;
    const freqCards = deck.cards.filter((c) => c.source === "freq");
    expect(freqCards.length).toBeGreaterThan(0);

    const freqIds = new Set(KO_FREQUENCY_ATOMS.map((a) => a.id));
    for (const c of freqCards) expect(freqIds.has(c.id)).toBe(true);

    const expectedUnlocked = getFrequencyUnlockedAtomIds("ko", reached, true);
    const unlockedFreq = new Set(
      deck.cards.filter((c) => c.source === "freq" && c.unlocked).map((c) => c.id),
    );
    expect(unlockedFreq).toEqual(expectedUnlocked);
  });

  it("feature ON grows the deck (seed has no backing course atoms)", () => {
    const off = buildEnrichedCourseDeck("ko", empty, OFF)!;
    const on = buildEnrichedCourseDeck("ko", empty, { enabled: true, reachedModule: 27 })!;
    expect(on.cards.length).toBeGreaterThan(off.cards.length);
  });
});
