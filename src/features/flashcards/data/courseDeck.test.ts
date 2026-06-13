import { describe, expect, it } from "vitest";
import { buildEnrichedJaCourseDeck } from "./courseDeck";
import {
  JA_COURSE_ATOMS,
  JA_COURSE_ATOMS_BY_ID,
  canonicalAtomId,
  isSrsEligibleAtom,
} from "@/features/languages/ja/courseAtoms";

/**
 * Course deck is generated from curriculum atoms (Spencer 2026-06-13),
 * replacing the disconnected 5-card stub. These guard the unification:
 * cards ↔ atoms one-to-one, ids canonical, unlock honored, sentences
 * mined from real lessons.
 */
function bareId(cardId: string): string {
  return cardId.replace(/^ja:/, "");
}

describe("JA course deck (from atoms)", () => {
  it("has one card per SRS-eligible atom, no stub remnants", () => {
    const deck = buildEnrichedJaCourseDeck(new Set());
    const eligible = JA_COURSE_ATOMS.filter(isSrsEligibleAtom);
    expect(deck.cards.length).toBe(eligible.length);
    // No leftover stub cards (ja-1..ja-5 etc.)
    expect(deck.cards.some((c) => /^ja-\d+$/.test(c.id))).toBe(false);
  });

  it("every card id is canonical and maps to a real atom", () => {
    const deck = buildEnrichedJaCourseDeck(new Set());
    for (const card of deck.cards) {
      expect(card.id.startsWith("ja:")).toBe(true);
      expect(JA_COURSE_ATOMS_BY_ID.has(bareId(card.id))).toBe(true);
    }
  });

  it("marks exactly the unlocked atoms as unlocked", () => {
    const eligible = JA_COURSE_ATOMS.filter(isSrsEligibleAtom);
    const sample = eligible.slice(0, 5).map(canonicalAtomId);
    const unlocked = new Set(sample);
    const deck = buildEnrichedJaCourseDeck(unlocked);
    const unlockedCards = deck.cards.filter((c) => c.unlocked);
    expect(unlockedCards.map((c) => c.id).sort()).toEqual([...sample].sort());
  });

  it("mines example sentences that actually contain the word", () => {
    const deck = buildEnrichedJaCourseDeck(new Set());
    const withExamples = deck.cards.filter(
      (c) => (c.examples?.length ?? 0) > 0,
    );
    // Mining should enrich a meaningful number of cards.
    expect(withExamples.length).toBeGreaterThan(10);
    for (const card of withExamples) {
      const atom = JA_COURSE_ATOMS_BY_ID.get(bareId(card.id));
      expect(atom).toBeDefined();
      const sentence = card.examples![0].text;
      expect(sentence.includes(atom!.kana)).toBe(true);
    }
  });
});
