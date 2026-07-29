/**
 * Part-of-speech tagging + conjugation-engine linkage.
 *
 * Proves two things end-to-end:
 *   1. Coverage — every course atom carries a valid `pos`, and every atom that
 *      claims a conjugation link carries a class the engine actually accepts.
 *   2. The atom → engine join is real — feeding a tagged lemma's stored class
 *      into the engine reproduces the textbook-correct surface form.
 */
import { describe, it, expect } from "vitest";

import { JA_COURSE_ATOMS } from "./ja/courseAtoms";
import { conjugateVerb, conjugateIAdj } from "./ja/conjugationEngine";
import { VERB_ENTRIES, ADJ_ENTRIES } from "./ja/conjugationTables";

import { KO_COURSE_ATOMS } from "./ko/courseAtoms";
import { KO_LEMMAS } from "./ko/conjugationTables";
import { conjugateKo, type KoStemClass } from "./ko/conjugationEngine";

const VALID_POS = new Set([
  "noun","verb","adjective","adverb","particle","counter","number","pronoun",
  "determiner","conjunction","interjection","expression","proper-noun",
  "phrase","grammar","other",
]);

const JA_VERB_CLASSES = new Set(["ichidan", "godan", "irregular"]);
const JA_ADJ_CLASSES = new Set(["i-adj", "na-adj"]);
const KO_CLASSES = new Set<KoStemClass>([
  "regular","hada","p_irr","t_irr","s_irr","reu_irr","h_irr","l_stem","eu_irr",
]);

// ─── JA coverage ───────────────────────────────────────────────────────────

describe("JA — pos coverage", () => {
  it("every atom has a valid pos", () => {
    const bad = JA_COURSE_ATOMS.filter((a) => !VALID_POS.has(a.pos));
    expect(bad.map((a) => `${a.id}:${a.pos}`)).toEqual([]);
    expect(JA_COURSE_ATOMS.length).toBeGreaterThan(900);
  });

  it("conjugation links carry an engine-valid class matching the pos", () => {
    for (const a of JA_COURSE_ATOMS) {
      if (!a.conjugation) continue;
      if (a.pos === "verb") {
        expect(JA_VERB_CLASSES.has(a.conjugation.class)).toBe(true);
      } else if (a.pos === "adjective") {
        expect(JA_ADJ_CLASSES.has(a.conjugation.class)).toBe(true);
      } else {
        throw new Error(`${a.id}: conjugation link on non-verb/adjective pos ${a.pos}`);
      }
    }
  });

  it("entryId links resolve to a real table row with the same class", () => {
    for (const a of JA_COURSE_ATOMS) {
      const c = a.conjugation;
      if (!c?.entryId) continue;
      if (a.pos === "verb") {
        const e = VERB_ENTRIES.find((v) => v.id === c.entryId);
        expect(e, `${a.id} → verb ${c.entryId}`).toBeTruthy();
        expect(e!.group).toBe(c.class);
      } else {
        const e = ADJ_ENTRIES.find((v) => v.id === c.entryId);
        expect(e, `${a.id} → adj ${c.entryId}`).toBeTruthy();
        expect(e!.type).toBe(c.class);
      }
    }
  });
});

// ─── JA mechanical conjugation off the tags ─────────────────────────────────

describe("JA — mechanical conjugation from atom tags", () => {
  const bySurface = (s: string) => JA_COURSE_ATOMS.find((a) => a.kana === s)!;

  it("食べる (ichidan) → 食べます via the atom's stored class", () => {
    const atom = bySurface("たべる");
    expect(atom.pos).toBe("verb");
    expect(atom.conjugation?.class).toBe("ichidan");
    expect(conjugateVerb(atom.kana, "ichidan", "masu")).toBe("たべます");
  });

  it("every verb-linked lemma conjugates to a ます-form without throwing", () => {
    const verbs = JA_COURSE_ATOMS.filter((a) => a.pos === "verb" && a.conjugation);
    expect(verbs.length).toBeGreaterThan(50);
    for (const a of verbs) {
      const masu = conjugateVerb(
        a.kana,
        a.conjugation!.class as "ichidan" | "godan" | "irregular",
        "masu",
      );
      expect(masu.endsWith("ます"), `${a.id} → ${masu}`).toBe(true);
    }
  });

  it("every i-adjective-linked lemma conjugates its negative to a くない/ない-form", () => {
    const iadj = JA_COURSE_ATOMS.filter(
      (a) => a.pos === "adjective" && a.conjugation?.class === "i-adj",
    );
    expect(iadj.length).toBeGreaterThan(30);
    for (const a of iadj) {
      const neg = conjugateIAdj(a.kana, "negative");
      expect(neg.endsWith("ない"), `${a.id} → ${neg}`).toBe(true);
    }
    // spot: たかい → たかくない
    expect(conjugateIAdj("たかい", "negative")).toBe("たかくない");
  });
});

// ─── KO coverage + mechanical conjugation ───────────────────────────────────

describe("KO — pos coverage + conjugation linkage", () => {
  it("every atom has a valid pos", () => {
    const bad = KO_COURSE_ATOMS.filter((a) => !VALID_POS.has(a.partOfSpeech));
    expect(bad.map((a) => `${a.id}:${a.partOfSpeech}`)).toEqual([]);
  });

  it("every lemma-set atom is linked to its engine class", () => {
    const lemmaSurfaces = new Set(KO_LEMMAS.map((l) => l.lemma));
    const linked = KO_COURSE_ATOMS.filter(
      (a) => lemmaSurfaces.has(a.surface) && a.conjugation,
    );
    // every atom whose surface is a classed lemma must carry the link
    for (const a of KO_COURSE_ATOMS) {
      if (!lemmaSurfaces.has(a.surface)) continue;
      expect(a.conjugation, `${a.id} (${a.surface})`).toBeTruthy();
      expect(KO_CLASSES.has(a.conjugation!.class)).toBe(true);
      const lemma = KO_LEMMAS.find((l) => l.lemma === a.surface)!;
      expect(a.conjugation!.class).toBe(lemma.cls);
    }
    expect(linked.length).toBeGreaterThan(10);
  });

  it("linked lemmas conjugate to a real polite present via the engine", () => {
    for (const a of KO_COURSE_ATOMS) {
      if (!a.conjugation) continue;
      const form = conjugateKo(a.surface, a.conjugation.class, "present.polite");
      expect(form.length, `${a.id} → ${form}`).toBeGreaterThan(0);
    }
  });

  it("먹다 → 먹어요 and 크다 → 커요 straight off the atom tags", () => {
    const meokda = KO_COURSE_ATOMS.find((a) => a.surface === "먹다")!;
    expect(meokda.partOfSpeech).toBe("verb");
    expect(conjugateKo(meokda.surface, meokda.conjugation!.class, "present.polite")).toBe("먹어요");

    const keuda = KO_COURSE_ATOMS.find((a) => a.surface === "크다")!;
    expect(keuda.partOfSpeech).toBe("adjective");
    expect(keuda.conjugation!.class).toBe("eu_irr");
    expect(conjugateKo(keuda.surface, keuda.conjugation!.class, "present.polite")).toBe("커요");
  });
});
