import { describe, expect, it } from "vitest";
// Importing mockLessons registers the `__lingo_get_lesson_content__` global
// the index uses to resolve lesson content (cycle-avoidance pattern).
import { getMockLessonContent } from "./mockLessons";
import { getAtomsForLesson, getAtomsUpToModule } from "./lessonAtomIndex";

/**
 * Cross-language lesson→atom index (2026-07-15 un-gating). JA keeps its
 * `introducedByLessonId` static index + surface-mining fallback; ES/KO
 * resolve through lesson `exercisedAtoms` and the normalized atom view.
 */
describe("getAtomsForLesson", () => {
  it("keeps the JA path intact (bare ids, explicit arg optional)", () => {
    const implicit = getAtomsForLesson("ja-m1-l1");
    const explicit = getAtomsForLesson("ja-m1-l1", "ja");
    expect(implicit.length).toBeGreaterThan(0);
    expect(implicit).toEqual(explicit);
    // JA ids stay bare — the SRS/unlock stores canonicalize on read/write.
    expect(implicit.every((a) => !a.id.includes(":"))).toBe(true);
  });

  it("resolves ES lesson atoms from exercisedAtoms with canonical ids", () => {
    expect(getMockLessonContent("es-m1-1")).not.toBeNull();
    const atoms = getAtomsForLesson("es-m1-1");
    expect(atoms.length).toBeGreaterThan(0);
    expect(atoms.every((a) => a.id.startsWith("es:"))).toBe(true);
    // A lesson only introduces atoms attributed to its own module.
    expect(atoms.every((a) => a.fromModule === "m1")).toBe(true);
    // The display surface rides in the `kana` slot the callers read.
    expect(atoms.every((a) => a.kana.length > 0 && a.meaningEn.length > 0)).toBe(
      true,
    );
    // Language inference from the lesson-id prefix matches the explicit arg.
    expect(getAtomsForLesson("es-m1-1", "es")).toEqual(atoms);
  });

  it("returns nothing for unregistered languages", () => {
    expect(getAtomsForLesson("fr-m1-1")).toEqual([]);
    expect(getAtomsForLesson("es-m1-1", "fr")).toEqual([]);
  });
});

describe("getAtomsUpToModule", () => {
  it("returns ES atoms up to the cutoff in curriculum order", () => {
    const upToM3 = getAtomsUpToModule("m3", "es");
    expect(upToM3.length).toBeGreaterThan(0);
    expect(upToM3.every((a) => a.id.startsWith("es:"))).toBe(true);

    const order = ["m1", "m2", "m3"];
    const indices = upToM3.map((a) => order.indexOf(a.fromModule));
    // Only m1..m3 attribution inside the cutoff…
    expect(indices.every((i) => i >= 0)).toBe(true);
    // …and catalog ordering (m1 → m3) is preserved through the filter.
    expect([...indices].sort((a, b) => a - b)).toEqual(indices);

    // A tighter cutoff yields a strict subset.
    const upToM1 = getAtomsUpToModule("m1", "es");
    expect(upToM1.length).toBeGreaterThan(0);
    expect(upToM1.length).toBeLessThan(upToM3.length);
  });

  it("returns KO atoms with canonical ids", () => {
    const upTo = getAtomsUpToModule("m3", "ko");
    expect(upTo.length).toBeGreaterThan(0);
    expect(upTo.every((a) => a.id.startsWith("ko:"))).toBe(true);
    // Only SRS-eligible atoms — never jamo/alphabet material.
    expect(upTo.every((a) => a.excludeFromSrs !== true)).toBe(true);
  });

  it("returns nothing for unknown languages or modules", () => {
    expect(getAtomsUpToModule("m3", "fr")).toEqual([]);
    expect(getAtomsUpToModule("m999", "es")).toEqual([]);
  });
});
