import { describe, expect, it } from "vitest";
import {
  JA_COURSE_ATOMS,
  JA_COURSE_ATOMS_BY_KANA,
  JA_PRIMARY_ATOM_BY_KANA,
} from "../courseAtoms";

/**
 * A bare kana must mean ONE atom, everywhere.
 *
 * Seventeen kana are shared by two or three atoms (はな 花/鼻, あめ 雨/飴, は
 * particle/歯 …). Two maps resolved them opposite ways — `new Map(entries)` is
 * last-wins, the compiler's own kana index was first-wins — so a sentence
 * could display "flower" while crediting SRS to 鼻 "nose". Nothing failed and
 * nothing looked wrong; the learner would just never be shown 花 again.
 *
 * Declaration order is arbitrary, so the sense has to be ruled on explicitly.
 */

const collisions = (): Map<string, string[]> => {
  const byKana = new Map<string, string[]>();
  for (const atom of JA_COURSE_ATOMS) {
    byKana.set(atom.kana, [...(byKana.get(atom.kana) ?? []), atom.id]);
  }
  return new Map([...byKana].filter(([, ids]) => ids.length > 1));
};

describe("homophone atom resolution", () => {
  it("has a ruling for every ambiguous kana", () => {
    const unruled = [...collisions()]
      .filter(([kana]) => !JA_PRIMARY_ATOM_BY_KANA[kana])
      .map(([kana, ids]) => `${kana}: ${ids.join(" / ")}`);

    expect(
      unruled,
      "Add each to JA_PRIMARY_ATOM_BY_KANA in courseAtoms.ts, choosing the " +
        "sense a bare kana means in a beginner course. Without a ruling the " +
        "winner depends on declaration order and the two kana maps can " +
        "disagree, which corrupts SRS scheduling silently.",
    ).toEqual([]);
  });

  it("rules only on kana that are actually ambiguous", () => {
    const ambiguous = collisions();
    const stale = Object.keys(JA_PRIMARY_ATOM_BY_KANA).filter(
      (kana) => !ambiguous.has(kana),
    );
    expect(stale).toEqual([]);
  });

  it("names ids that exist", () => {
    const ids = new Set(JA_COURSE_ATOMS.map((a) => a.id));
    const bogus = Object.entries(JA_PRIMARY_ATOM_BY_KANA)
      .filter(([, id]) => !ids.has(id))
      .map(([kana, id]) => `${kana} → ${id}`);
    expect(bogus).toEqual([]);
  });

  it("resolves every ruled kana to the ruled atom", () => {
    for (const [kana, id] of Object.entries(JA_PRIMARY_ATOM_BY_KANA)) {
      expect(JA_COURSE_ATOMS_BY_KANA.get(kana)?.id, kana).toBe(id);
    }
  });

  it("indexes every atom kana exactly once", () => {
    const kanas = new Set(JA_COURSE_ATOMS.map((a) => a.kana));
    expect(JA_COURSE_ATOMS_BY_KANA.size).toBe(kanas.size);
  });
});
