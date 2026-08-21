import { describe, it, expect } from "vitest";
import {
  deriveModuleTestOut,
  collectGradable,
  getDerivedTestOutItems,
  pickCovering,
  TESTOUT_FORMATS,
  TESTOUT_SIZE,
  TESTOUT_DERIVED_FLOOR,
} from "./deriveModuleTestOut";
import { mulberry32 } from "@/shared/utils/seededRng";

// 2026-07-19 (rewrite spine): the ja map replaced the old m3-m17 modules
// with the dict-form-first spine — m3 (the m3-neo pilot) is the only ja
// module with authored lessons; m4-m29 are comingSoon placeholders whose
// test-outs can't derive yet (DistrictView hides the Test-out CTA for
// them). Derive the shipped list from the live map so spine modules
// re-enter this invariant automatically as their content lands.
import { getMockCourse } from "@/shared/domain/mockCourse";
const SHIPPED = getMockCourse("ja")
  .modules.filter(
    (m) => /^m\d+$/.test(m.id) && m.id !== "m1" && m.id !== "m2" && (m.tier ?? "n5") === "n5" && m.lessons.length > 0,
  )
  .map((m) => m.id);

describe("deriveModuleTestOut", () => {
  it("every shipped module yields a full-size, format-legal, covering test-out", () => {
    for (const mid of SHIPPED) {
      const d = deriveModuleTestOut(mid);
      // 10 questions (modules have hundreds of gradable steps, so always full).
      expect(d.steps.length, `${mid} size`).toBe(TESTOUT_SIZE);
      // Only allowed formats — no speaking/dialogue/symbol drills.
      for (const it of d.items) {
        expect(TESTOUT_FORMATS.has(it.format), `${mid} bad format ${it.format}`).toBe(true);
      }
      // Covers every skill section the module teaches (when it has ≤10),
      // else covers 10 distinct sections.
      const expectCovered = Math.min(d.sectionsTotal, TESTOUT_SIZE);
      expect(d.sectionsCovered, `${mid} coverage ${d.sectionsCovered}/${d.sectionsTotal}`)
        .toBeGreaterThanOrEqual(expectCovered);
      // No duplicate step ids (module is big enough).
      const ids = d.items.map((i) => (i.step as { id: string }).id);
      expect(new Set(ids).size, `${mid} dupes`).toBe(ids.length);
    }
  });

  it("excludes speaking/dialogue/symbol formats from the pool", () => {
    const withSpeaking = new Set([...TESTOUT_FORMATS, "speaking", "dialogue_listen"]);
    const legal = collectGradable("m3");
    const all = collectGradable("m3", withSpeaking);
    expect(all.length).toBeGreaterThan(legal.length); // speaking exists but is excluded by default
    expect(legal.every((i) => i.format !== "speaking")).toBe(true);
    expect(legal.every((i) => i.format !== "dialogue_listen")).toBe(true);
  });

  /**
   * Spencer 2026-08-18: *"we dont want to include the type translate step in
   * ANY test out feature."* Asserted three ways, because the earlier
   * format-legality check only proves the picked 12 obey TESTOUT_FORMATS —
   * it would still pass if `translate` were added back to that set.
   */
  describe("translate is barred from every test-out surface", () => {
    it("is not in TESTOUT_FORMATS", () => {
      expect(TESTOUT_FORMATS.has("translate")).toBe(false);
    });

    it("never reaches the gradable pool, in any shipped module or language", () => {
      const offenders: string[] = [];
      for (const lang of ["ja", "ko", "es"]) {
        for (const m of getMockCourse(lang).modules) {
          const items = collectGradable(m.id, TESTOUT_FORMATS, lang);
          if (items.some((i) => i.format === "translate")) {
            offenders.push(`${lang}/${m.id}`);
          }
        }
      }
      expect(offenders).toEqual([]);
    });

    it("instrument control: translate steps DO exist in the courses", () => {
      // Guards the check above from passing vacuously if translate steps
      // vanished from the curriculum or collectGradable stopped walking.
      const withTranslate = new Set([...TESTOUT_FORMATS, "translate"]);
      const found = collectGradable("m3", withTranslate).filter(
        (i) => i.format === "translate",
      );
      expect(found.length).toBeGreaterThan(0);
    });

    it("dropping it costs no module its floor or its section coverage", () => {
      // The reason this was safe to do course-wide rather than per-module.
      const thin: string[] = [];
      for (const lang of ["ja", "ko", "es"]) {
        for (const m of getMockCourse(lang).modules) {
          const items = collectGradable(m.id, TESTOUT_FORMATS, lang);
          if (items.length === 0) continue; // stub module, no derived path
          if (items.length < TESTOUT_DERIVED_FLOOR) thin.push(`${lang}/${m.id}`);
        }
      }
      expect(thin).toEqual([]);
    });
  });

  it("is deterministic (no rng) — same module yields the same picks", () => {
    const a = deriveModuleTestOut("m3").items.map((i) => (i.step as { id: string }).id);
    const b = deriveModuleTestOut("m3").items.map((i) => (i.step as { id: string }).id);
    expect(a).toEqual(b);
  });

  it("seeded rng — two different seeds draw different subsets, both size-legal & covering", () => {
    const drawA = deriveModuleTestOut("m3", { rng: mulberry32(1) });
    const drawB = deriveModuleTestOut("m3", { rng: mulberry32(999) });

    const idsA = drawA.items.map((i) => (i.step as { id: string }).id);
    const idsB = drawB.items.map((i) => (i.step as { id: string }).id);

    // Both honor size + formats (m3-neo has 100+ gradable steps).
    expect(idsA.length).toBe(TESTOUT_SIZE);
    expect(idsB.length).toBe(TESTOUT_SIZE);
    for (const it of [...drawA.items, ...drawB.items]) {
      expect(TESTOUT_FORMATS.has(it.format)).toBe(true);
    }
    // No dupes within a draw.
    expect(new Set(idsA).size).toBe(idsA.length);
    expect(new Set(idsB).size).toBe(idsB.length);
    // Different seeds => different subsets (anti-memorization). A big pool
    // makes an accidental full overlap astronomically unlikely.
    expect(idsA).not.toEqual(idsB);
  });

  it("seeded rng is stable within a seed (same seed → same draw)", () => {
    const a = deriveModuleTestOut("m3", { rng: mulberry32(42) }).items.map(
      (i) => (i.step as { id: string }).id,
    );
    const b = deriveModuleTestOut("m3", { rng: mulberry32(42) }).items.map(
      (i) => (i.step as { id: string }).id,
    );
    expect(a).toEqual(b);
  });

  it("pickCovering with rng still covers sections and honors size", () => {
    const all = collectGradable("m3");
    const picked = pickCovering(all, TESTOUT_SIZE, mulberry32(7));
    expect(picked.length).toBe(TESTOUT_SIZE);
    const sectionsTotal = new Set(all.map((i) => i.section)).size;
    const covered = new Set(picked.map((p) => p.section)).size;
    expect(covered).toBeGreaterThanOrEqual(Math.min(sectionsTotal, TESTOUT_SIZE));
  });

  // ── Korean derivation (change 2 — KO test-outs now derive real steps) ──
  describe("KO derivation", () => {
    it("collectGradable returns real KO steps for a KO grammar module", () => {
      const ko = collectGradable("m3", TESTOUT_FORMATS, "ko");
      expect(ko.length).toBeGreaterThan(0);
      // Every collected step came from a ko-* lesson.
      expect(ko.every((i) => i.lessonId.startsWith("ko-"))).toBe(true);
    });

    it("yields a full-size derived test-out for KO grammar modules", () => {
      for (const mid of ["m3", "m7", "m10"]) {
        const d = deriveModuleTestOut(mid, { languageId: "ko" });
        expect(d.steps.length, `ko ${mid} size`).toBe(TESTOUT_SIZE);
        for (const it of d.items) {
          expect(TESTOUT_FORMATS.has(it.format), `ko ${mid} format`).toBe(true);
        }
      }
    });

    it("getDerivedTestOutItems tags configs with languageId ko", () => {
      const configs = getDerivedTestOutItems("m7", "ko");
      expect(configs.length).toBe(TESTOUT_SIZE);
      expect(configs.every((c) => c.languageId === "ko")).toBe(true);
      expect(configs.every((c) => c.type === "derivedStep")).toBe(true);
    });
  });
});

describe("derived es test-out (parametrized language)", () => {
  // 2026-08-21: the July m1–m19 wave was archived; the §13 course is m1/m2.
  it.each(["m1", "m2"])(
    "es %s derives a workable, format-legal, in-module set",
    (mid) => {
      const d = deriveModuleTestOut(mid, { languageId: "es" });
      // Workable = clears the derived-path floor the page gates on.
      expect(d.items.length).toBeGreaterThanOrEqual(TESTOUT_DERIVED_FLOOR);
      for (const it of d.items) {
        expect(TESTOUT_FORMATS.has(it.format), `${mid} bad format ${it.format}`).toBe(true);
        expect(it.lessonId.startsWith(`es-${mid}-`), `${mid} foreign lesson ${it.lessonId}`).toBe(true);
      }
      // Sections come from the es lesson ids ("es-m10-6" → "m10-6").
      for (const it of d.items) {
        expect(it.section, `${mid} unparsed section ${it.section}`).toMatch(/^m\d+-\d+$/);
      }
    },
  );

  it("getDerivedTestOutItems stamps languageId 'es' and doesn't collide with ja's cache", () => {
    const es = getDerivedTestOutItems("m2", "es");
    // ja "m10" is an unauthored spine placeholder since 2026-07-19 — use the
    // authored ja m3 (m3-neo) as the cross-language cache foil instead.
    const ja = getDerivedTestOutItems("m3");
    expect(es.length).toBeGreaterThanOrEqual(TESTOUT_DERIVED_FLOOR);
    expect(es.every((c) => c.languageId === "es")).toBe(true);
    // Same moduleId, different course — the per-language cache keys must
    // keep the sets distinct.
    expect(ja.every((c) => c.languageId === "ja")).toBe(true);
    expect(es.every((c) => c.id.startsWith("es-"))).toBe(true);
    expect(ja.map((c) => c.id)).not.toEqual(es.map((c) => c.id));
  });
});
