import { describe, expect, it } from "vitest";
import { buildEnrichedCourseDeck, buildEnrichedJaCourseDeck } from "./courseDeck";
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

describe("JA course deck art (Wave C emoji-refit)", () => {
  it("resolves custom art before falling back to emoji", () => {
    const deck = buildEnrichedJaCourseDeck(new Set());
    // しょうゆ has a Wave C custom PNG and NO emoji field — before the fix
    // this card's image was undefined.
    const shouyu = deck.cards.find((c) => c.id === "ja:shouyu")!;
    expect(shouyu).toBeDefined();
    expect(shouyu.image).toBe("/lingo-art/vocab/ja/shouyu.png");

    // あい (love) has an emoji and no custom art entry — must still fall
    // back to the Noto SVG, not regress to undefined.
    const ai = deck.cards.find((c) => c.id === "ja:ai")!;
    expect(ai).toBeDefined();
    expect(ai.image).toMatch(/^\/noto-emoji\/svg\/.+\.svg$/);
  });
});

describe("generic course deck (normalized atoms)", () => {
  it("builds an ES course deck with canonical ids, surfaces and glosses", () => {
    const deck = buildEnrichedCourseDeck("es", new Set())!;
    expect(deck).not.toBeNull();
    expect(deck.id).toBe("es-course");
    expect(deck.languageId).toBe("es");
    expect(deck.courseId).toBeTruthy();
    expect(deck.cards.length).toBeGreaterThan(0);
    for (const card of deck.cards) {
      expect(card.id.startsWith("es:")).toBe(true);
      expect(card.front.length).toBeGreaterThan(0); // Spanish surface
      expect(card.back.length).toBeGreaterThan(0); // English gloss
      expect(card.unlocked).toBe(false);
    }
    // Spot-check a known m1 atom: front is the target-language surface.
    const hola = deck.cards.find((c) => c.id === "es:hola")!;
    expect(hola.front).toBe("hola");
    expect(hola.back).toBe("hello");
  });

  it("marks exactly the unlocked ES atoms as unlocked", () => {
    const all = buildEnrichedCourseDeck("es", new Set())!;
    const sample = all.cards.slice(0, 5).map((c) => c.id);
    const deck = buildEnrichedCourseDeck("es", new Set(sample))!;
    const unlockedCards = deck.cards.filter((c) => c.unlocked);
    expect(unlockedCards.map((c) => c.id).sort()).toEqual([...sample].sort());
  });

  it("delegates JA to the enriched builder and returns null for no-catalog languages", () => {
    const ja = buildEnrichedCourseDeck("ja", new Set())!;
    expect(ja.id).toBe("ja-course");
    expect(buildEnrichedCourseDeck("fr", new Set())).toBeNull();
  });

  it("resolves custom art before emoji for a KO word (Wave C emoji-refit)", () => {
    const deck = buildEnrichedCourseDeck("ko", new Set())!;
    const gimchi = deck.cards.find((c) => c.front === "김치")!;
    expect(gimchi).toBeDefined();
    expect(gimchi.image).toBe("/lingo-art/vocab/ko/김치.png");
  });
});
