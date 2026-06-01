/**
 * KO-specific conformance checks. The generic conformance test at
 * `shared/language/__tests__/moduleConformance.test.ts` covers the
 * ADR-001 contract for every registered module; this file covers the
 * KO-specific invariants that wouldn't make sense for JA:
 *
 *   - Every atom id starts with `ko:`.
 *   - Particles slot is non-empty (KO opts in to particles via M3+).
 *   - Classifiers slot has ≥ 6 entries (Phase 5 acceptance criterion).
 *   - Conjugation slot has ≥ 1 verb table.
 *   - Curriculum surfaces M1 + M2 modules at minimum.
 *   - PlacementBank has a screener + per-module pools for M1/M2/M3.
 *   - secondScript / readingAnnotation / symbolMastery omitted (ADR-011).
 */
import { describe, it, expect } from "vitest";
import { koModule } from "../module";

describe("KO module", () => {
  it("has Korean identity", () => {
    expect(koModule.id).toBe("ko");
    expect(koModule.displayName.en).toBe("Korean");
    expect(koModule.displayName.native).toBe("한국어");
    expect(koModule.scriptFont).toContain("Noto Sans KR");
    expect(koModule.textDirection).toBe("ltr");
  });

  it("courseAtoms are namespaced with ko:", () => {
    expect(koModule.courseAtoms.length).toBeGreaterThan(50);
    for (const atom of koModule.courseAtoms) {
      expect(atom.id.startsWith("ko:")).toBe(true);
      expect(atom.languageId).toBe("ko");
    }
  });

  it("particles slot populated with starter set", () => {
    expect(koModule.particles).toBeDefined();
    const forms = (koModule.particles?.particles ?? []).map((p) => p.form);
    expect(forms).toEqual(
      expect.arrayContaining(["은", "는", "이", "가", "을", "를", "에", "에서"]),
    );
  });

  it("classifiers slot has the high-frequency set", () => {
    expect(koModule.classifiers).toBeDefined();
    const surfaces = (koModule.classifiers?.classifiers ?? []).map(
      (c) => c.surface,
    );
    // Phase 5 spec: 개, 명, 마리, 장, 잔, 권, 대, 살, 시, 분, 시간, 일.
    for (const expected of ["개", "명", "마리", "장", "잔", "권", "대", "살", "시", "분", "시간", "일"]) {
      expect(surfaces).toContain(expected);
    }
  });

  it("conjugation slot has at least one verb table", () => {
    expect(koModule.conjugation).toBeDefined();
    expect(koModule.conjugation?.tables.length).toBeGreaterThan(0);
    const firstVerb = koModule.conjugation?.tables[0];
    expect(firstVerb?.lemmaAtomId.startsWith("ko:")).toBe(true);
    expect(Object.keys(firstVerb?.forms ?? {}).length).toBeGreaterThan(15);
  });

  it("alphabet config surfaces every Hangul section", () => {
    expect(koModule.alphabetConfig).toBeDefined();
    const sectionIds = (koModule.alphabetConfig?.sections ?? []).map(
      (s) => s.id,
    );
    expect(sectionIds).toEqual(
      expect.arrayContaining([
        "consonants-plain",
        "consonants-aspirated",
        "consonants-tense",
        "vowels-basic",
        "vowels-y",
        "vowels-compound",
      ]),
    );
  });

  it("placement bank has screener + M1/M2/M3 pools", () => {
    expect(koModule.placementBank.screener.length).toBeGreaterThanOrEqual(3);
    expect(koModule.placementBank.byModule.m1?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(koModule.placementBank.byModule.m2?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(koModule.placementBank.byModule.m3?.length ?? 0).toBeGreaterThanOrEqual(3);
  });

  it("curriculum surfaces M1 + M2 modules", () => {
    const moduleIds = koModule.curriculum.map((m) => m.id);
    expect(moduleIds).toContain("m1");
    expect(moduleIds).toContain("m2");
  });

  it("omits secondScript / readingAnnotation / symbolMastery (per ADR-011)", () => {
    expect(koModule.secondScript).toBeUndefined();
    expect(koModule.readingAnnotation).toBeUndefined();
    expect(koModule.symbolMastery).toBeUndefined();
  });
});
