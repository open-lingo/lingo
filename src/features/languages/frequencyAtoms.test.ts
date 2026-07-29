/**
 * Frequency-vocab data validity + conjugation-engine join.
 *
 * Mirrors the posTagging.test pattern: every frequency atom carries a valid
 * POS and a valid unlockModule, and every atom that claims a conjugation link
 * feeds a class the engine actually conjugates.
 */
import { describe, it, expect } from "vitest";

import { JA_FREQUENCY_ATOMS, JA_FREQ_LAST_MODULE } from "./ja/frequencyAtoms";
import { KO_FREQUENCY_ATOMS, KO_FREQ_LAST_MODULE } from "./ko/frequencyAtoms";
import {
  frequencyRankToModule,
  FREQ_FIRST_MODULE,
} from "./frequencyTypes";

import { conjugateVerb, conjugateIAdj } from "./ja/conjugationEngine";
import { conjugateKo, type KoStemClass } from "./ko/conjugationEngine";
import { KO_LEMMAS } from "./ko/conjugationTables";

const VALID_POS = new Set([
  "noun", "verb", "adjective", "adverb", "particle", "counter", "number",
  "pronoun", "determiner", "conjunction", "interjection", "expression",
  "proper-noun", "phrase", "grammar", "other",
]);

const JA_VERB_CLASSES = new Set(["ichidan", "godan", "irregular"]);
const JA_ADJ_CLASSES = new Set(["i-adj", "na-adj"]);
const KO_CLASSES = new Set<KoStemClass>([
  "regular", "hada", "p_irr", "t_irr", "s_irr", "reu_irr", "h_irr", "l_stem", "eu_irr",
]);

describe("JA frequency atoms", () => {
  it("is a non-trivial derived set", () => {
    expect(JA_FREQUENCY_ATOMS.length).toBeGreaterThan(150);
  });

  it("every atom has a valid pos, a freq-prefixed id, and a bounded unlockModule", () => {
    for (const a of JA_FREQUENCY_ATOMS) {
      expect(VALID_POS.has(a.pos), `${a.id}:${a.pos}`).toBe(true);
      expect(a.id.startsWith("ja:")).toBe(true);
      expect(a.source).toBe("freq");
      expect(a.unlockModule).toBeGreaterThanOrEqual(FREQ_FIRST_MODULE);
      expect(a.unlockModule).toBeLessThanOrEqual(JA_FREQ_LAST_MODULE);
      // unlockModule is baked from the single source of truth
      expect(a.unlockModule).toBe(
        frequencyRankToModule(a.frequencyRank, { lastModule: JA_FREQ_LAST_MODULE }),
      );
    }
  });

  it("frequency ranks are dense + unique (1..N)", () => {
    const ranks = JA_FREQUENCY_ATOMS.map((a) => a.frequencyRank).sort((x, y) => x - y);
    expect(ranks[0]).toBe(1);
    expect(ranks[ranks.length - 1]).toBe(JA_FREQUENCY_ATOMS.length);
    expect(new Set(ranks).size).toBe(ranks.length);
  });

  it("conjugable atoms link a class the engine conjugates", () => {
    let checked = 0;
    for (const a of JA_FREQUENCY_ATOMS) {
      if (!a.conjugation) continue;
      checked++;
      if (a.pos === "verb") {
        expect(JA_VERB_CLASSES.has(a.conjugation.class), `${a.id}`).toBe(true);
        const masu = conjugateVerb(
          a.surface,
          a.conjugation.class as "ichidan" | "godan" | "irregular",
          "masu",
        );
        expect(masu.endsWith("ます"), `${a.id} → ${masu}`).toBe(true);
      } else if (a.pos === "adjective") {
        expect(JA_ADJ_CLASSES.has(a.conjugation.class), `${a.id}`).toBe(true);
        if (a.conjugation.class === "i-adj") {
          const neg = conjugateIAdj(a.surface, "negative");
          expect(neg.endsWith("ない"), `${a.id} → ${neg}`).toBe(true);
        }
      } else {
        throw new Error(`${a.id}: conjugation on non-verb/adjective pos ${a.pos}`);
      }
    }
    expect(checked).toBeGreaterThan(20);
  });
});

describe("KO frequency atoms (seed)", () => {
  it("has a usable seed size", () => {
    expect(KO_FREQUENCY_ATOMS.length).toBeGreaterThanOrEqual(50);
  });

  it("every atom has a valid pos, ko-prefixed id, and a bounded unlockModule", () => {
    for (const a of KO_FREQUENCY_ATOMS) {
      expect(VALID_POS.has(a.pos), `${a.id}:${a.pos}`).toBe(true);
      expect(a.id.startsWith("ko:")).toBe(true);
      expect(a.reading.length).toBeGreaterThan(0);
      expect(a.source).toBe("freq");
      expect(a.unlockModule).toBeGreaterThanOrEqual(FREQ_FIRST_MODULE);
      expect(a.unlockModule).toBeLessThanOrEqual(KO_FREQ_LAST_MODULE);
      expect(a.unlockModule).toBe(
        frequencyRankToModule(a.frequencyRank, { lastModule: KO_FREQ_LAST_MODULE }),
      );
    }
  });

  it("conjugable atoms link a real KO_LEMMAS class that conjugates to a polite present", () => {
    let checked = 0;
    for (const a of KO_FREQUENCY_ATOMS) {
      if (!a.conjugation) continue;
      checked++;
      expect(KO_CLASSES.has(a.conjugation.class), `${a.id}`).toBe(true);
      if (a.conjugation.lemmaId) {
        const lemma = KO_LEMMAS.find((l) => l.id === a.conjugation!.lemmaId);
        expect(lemma, `${a.id} → lemma ${a.conjugation.lemmaId}`).toBeTruthy();
        expect(lemma!.lemma).toBe(a.surface);
        expect(lemma!.cls).toBe(a.conjugation.class);
      }
      const form = conjugateKo(a.surface, a.conjugation.class, "present.polite");
      expect(form.length, `${a.id} → ${form}`).toBeGreaterThan(0);
    }
    expect(checked).toBeGreaterThan(10);
  });
});
