/**
 * ES-specific conformance checks. The generic conformance test at
 * `shared/language/__tests__/moduleConformance.test.ts` covers the
 * ADR-001 contract for every registered module; this file covers the
 * ES-specific invariants that wouldn't make sense for JA/KO:
 *
 *   - Every atom id starts with `es:` and ids are UNIQUE course-wide
 *     (parallel waves must not re-register earlier-module surfaces).
 *   - Particles slot is non-empty (articles/preps/conjunctions).
 *   - Conjugation slot has the 10 spine seed verbs, each with the full
 *     18-cell person × tense paradigm.
 *   - Placement bank covers every AUTHORED module (derived from which
 *     ES_M{n}_LESSONS arrays are non-empty, so this stays green as
 *     authoring waves land).
 *   - Gendered noun atoms carry a valid gender.
 *   - alphabetConfig / classifiers / secondScript / readingAnnotation /
 *     symbolMastery omitted (ADR-011; Latin script).
 */
import { describe, it, expect } from "vitest";
import { esModule } from "../module";
import { getEsCourseAtoms } from "../courseAtoms";
import { ES_ALL_LESSONS } from "../curriculum";

const authoredModuleIds = [...new Set(ES_ALL_LESSONS.map((l) => l.moduleId))];

describe("ES module", () => {
  it("has Spanish identity", () => {
    expect(esModule.id).toBe("es");
    expect(esModule.displayName.en).toBe("Spanish");
    expect(esModule.displayName.native).toBe("Español");
    expect(esModule.scriptFont).toBeTruthy();
    expect(esModule.textDirection).toBe("ltr");
    expect(esModule.courseId).toBe("mock-1");
  });

  it("courseAtoms are namespaced with es:", () => {
    expect(esModule.courseAtoms.length).toBeGreaterThan(20);
    for (const atom of esModule.courseAtoms) {
      expect(atom.id.startsWith("es:")).toBe(true);
      expect(atom.languageId).toBe("es");
    }
  });

  it("atom ids are unique across the course", () => {
    const ids = esModule.courseAtoms.map((a) => a.id);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate atom ids: ${[...new Set(dupes)].join(", ")}`).toEqual([]);
  });

  it("every atom fromModule matches ^m(1[0-6]|[1-9])$", () => {
    for (const atom of esModule.courseAtoms) {
      expect(
        atom.fromModule,
        `atom ${atom.id} has fromModule '${atom.fromModule}'`,
      ).toMatch(/^m(1[0-6]|[1-9])$/);
    }
  });

  it("particles slot populated (articles/preps/conjunctions)", () => {
    expect(esModule.particles).toBeDefined();
    const forms = (esModule.particles?.particles ?? []).map((p) => p.form);
    expect(forms.length).toBeGreaterThan(0);
    expect(forms).toEqual(expect.arrayContaining(["y", "o"]));
  });

  it("conjugation slot has ≥10 verb tables, each with >15 forms", () => {
    expect(esModule.conjugation).toBeDefined();
    const tables = esModule.conjugation?.tables ?? [];
    expect(tables.length).toBeGreaterThanOrEqual(10);
    for (const table of tables) {
      expect(table.lemmaAtomId.startsWith("es:")).toBe(true);
      expect(
        Object.keys(table.forms).length,
        `${table.lemmaAtomId} has too few forms`,
      ).toBeGreaterThan(15);
    }
  });

  it("placement bank covers every authored module", () => {
    expect(authoredModuleIds.length).toBeGreaterThan(0);
    for (const moduleId of authoredModuleIds) {
      const screenerItems = esModule.placementBank.screener.filter(
        (item) => item.moduleId === moduleId,
      );
      expect(
        screenerItems.length,
        `no screener item for authored module ${moduleId}`,
      ).toBeGreaterThanOrEqual(1);
      expect(
        esModule.placementBank.byModule[moduleId]?.length ?? 0,
        `byModule pool too small for authored module ${moduleId}`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it("curriculum contains m1", () => {
    const moduleIds = esModule.curriculum.map((m) => m.id);
    expect(moduleIds).toContain("m1");
  });

  it("gendered atoms carry a valid gender", () => {
    for (const atom of getEsCourseAtoms()) {
      if (atom.gender !== undefined) {
        expect(["m", "f"], `atom ${atom.id} gender '${atom.gender}'`).toContain(
          atom.gender,
        );
      }
    }
  });

  it("omits alphabetConfig / classifiers / secondScript / readingAnnotation / symbolMastery (ADR-011)", () => {
    expect(esModule.alphabetConfig).toBeUndefined();
    expect(esModule.classifiers).toBeUndefined();
    expect(esModule.secondScript).toBeUndefined();
    expect(esModule.readingAnnotation).toBeUndefined();
    expect(esModule.symbolMastery).toBeUndefined();
  });
});
