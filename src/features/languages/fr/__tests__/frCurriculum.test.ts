/**
 * FR curriculum + placement derivation contract (Track D, 2026-08-19).
 *
 * Two defect classes are pinned here, both of the SILENT-OMISSION shape the
 * fr collectors exist to close:
 *
 * 1. `getMockCourse("fr")` used to fall through to the generic placeholder
 *    course — three fake English-titled modules, eight placeholder lessons,
 *    and an `m1-l0-alphabet` trainer node, contradicting fr/module.ts's own
 *    header ("Latin script needs no alphabet trainer"). The honest state is
 *    ZERO modules, derived from an (empty) glob of fr/curriculum/m*.ts.
 *
 * 2. `fr/placementBank.ts` used to silently SKIP an FR_M<n>_PLACEMENT export
 *    whose value was not a flat array — exactly what an author copying the
 *    ES convention ({screener, byModule} object) would write, and exactly
 *    the silent drop the file's own header promises to prevent.
 *
 * The collectors are tested through their exported pure forms with injected
 * fake glob records: authoring a REAL defective curriculum file would poison
 * the live globs (atoms + placement + pathway all read the same directory).
 */
import { describe, it, expect } from "vitest";
import { getMockCourse, ALPHABET_LESSON_ID } from "@/shared/domain/mockCourse";
import {
  buildFrenchCourse,
  collectFrModules,
  type FrModuleDef,
} from "../curriculum";
import { collectFrPlacement, FR_PLACEMENT_BANK } from "../placementBank";
import { collectFrAtomExports } from "../courseAtoms";

// ── defect 1: no placeholder course for fr ───────────────────────────────

describe("getMockCourse('fr') — derived, never the placeholder course", () => {
  const course = getMockCourse("fr");

  it("serves the derived FR pathway, byte-for-byte", () => {
    expect(course.modules).toEqual(buildFrenchCourse());
  });

  it("contains none of the placeholder lesson ids or module titles", () => {
    // The generic fallback fabricates these. None may EVER appear for fr —
    // this fails against the pre-2026-08-19 behavior (negative control).
    const placeholderTitles = ["Basics", "Everyday phrases", "Grammar foundations"];
    for (const m of course.modules) {
      expect(placeholderTitles).not.toContain(m.title);
    }
    const placeholderLessonIds = [
      ALPHABET_LESSON_ID,
      "m1-l0",
      "m1-l3",
      "m2-l1",
      "m2-l2",
      "m2-l3",
      "m3-l1",
      "m3-l2",
    ];
    const ids = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    for (const pid of placeholderLessonIds) {
      expect(ids).not.toContain(pid);
    }
  });

  it("contains no alphabet node — Latin script needs no alphabet trainer", () => {
    for (const m of course.modules) {
      for (const l of m.lessons) {
        expect(l.kind).not.toBe("alphabet");
        expect(l.id).not.toBe(ALPHABET_LESSON_ID);
      }
    }
  });
});

// ── curriculum collector guards ──────────────────────────────────────────

describe("collectFrModules — the pathway glob's guards", () => {
  const LESSON = {
    id: "fr-m1-l1",
    title: "Bonjour",
    moduleId: "m1",
    courseId: "mock-1",
    languageId: "fr",
    steps: [],
  };
  const DEF: FrModuleDef = {
    title: "M1 · Sons et salutations",
    eyebrow: "Module 1",
    lessons: [LESSON],
  };

  it("collects a well-formed module; its id derives from the FILE name", () => {
    expect(collectFrModules({ "./m1.ts": { FR_M1_MODULE: DEF } })).toEqual([
      { n: 1, def: DEF },
    ]);
  });

  it("sorts by module number, not glob order (m10 after m2)", () => {
    const got = collectFrModules({
      "./m10.ts": { FR_M10_MODULE: DEF },
      "./m2.ts": { FR_M2_MODULE: DEF },
    });
    expect(got.map((g) => g.n)).toEqual([2, 10]);
  });

  it("THROWS on a number/file-name mismatch — the m12-exports-M11 copy-paste", () => {
    expect(() =>
      collectFrModules({ "./m2.ts": { FR_M1_MODULE: DEF } }),
    ).toThrow(/must match the file name/);
  });

  it("THROWS on a module file with no FR_M<n>_MODULE export at all", () => {
    // Atoms taught (the atoms glob still sees the file) but the module never
    // drawn on the map — the ES m17 taught-but-never-scheduled failure.
    expect(() =>
      collectFrModules({ "./m1.ts": { FR_M1_ATOMS: [] } }),
    ).toThrow(/no FR_M1_MODULE export/);
  });

  it("THROWS on a malformed module def rather than skipping it", () => {
    expect(() =>
      collectFrModules({ "./m1.ts": { FR_M1_MODULE: [LESSON] } }),
    ).toThrow(/wrong shape/);
  });

  it("THROWS on a zero-lesson stub — absence, not a stub, means 'not yet'", () => {
    expect(() =>
      collectFrModules({
        "./m1.ts": { FR_M1_MODULE: { title: "M1", lessons: [] } },
      }),
    ).toThrow(/zero lessons/);
  });
});

// ── defect 3: placement exports must never be silently dropped ───────────

describe("collectFrPlacement — silent-drop guard", () => {
  const item = (id: string) => ({ id, moduleId: "m1", build: () => null as never });

  it("THROWS on the ES-style {screener, byModule} object export", () => {
    // This exact shape used to be SILENTLY SKIPPED — an author copying the
    // ES convention lost every placement item with no failing test.
    expect(() =>
      collectFrPlacement({
        "./curriculum/m1.ts": {
          FR_M1_PLACEMENT: { screener: [], byModule: {} },
        },
      }),
    ).toThrow(/flat PlacementItem\[\]/);
  });

  it("still THROWS on a number/file-name mismatch", () => {
    expect(() =>
      collectFrPlacement({
        "./curriculum/m2.ts": { FR_M2_PLACEMENT: [item("a")], FR_M3_PLACEMENT: [item("b")] },
      }),
    ).toThrow(/must match the file name/);
  });

  it("derives byModule + screener (first item per module, module order)", () => {
    const a = item("a");
    const b = item("b");
    const c = item("c");
    const got = collectFrPlacement({
      "./curriculum/m2.ts": { FR_M2_PLACEMENT: [c] },
      "./curriculum/m1.ts": { FR_M1_PLACEMENT: [a, b] },
    });
    expect(got.byModule).toEqual({ m1: [a, b], m2: [c] });
    expect(got.screener).toEqual([a, c]);
  });

  it("the live bank carries every authored module, screener = first items", () => {
    // Pinned `{screener: [], byModule: {}}` until 2026-08-19, when m1
    // landed. From here the shape is derived: one byModule pool per
    // authored module, its FIRST item doubling as the screener item.
    const modules = Object.keys(FR_PLACEMENT_BANK.byModule);
    expect(modules).toContain("m1");
    for (const m of modules) {
      const pool = FR_PLACEMENT_BANK.byModule[m];
      expect(pool.length, `${m} placement pool too small`).toBeGreaterThanOrEqual(4);
      expect(FR_PLACEMENT_BANK.screener).toContain(pool[0]);
    }
    expect(FR_PLACEMENT_BANK.screener.length).toBe(modules.length);
  });
});

// ── same guard on the atoms glob (adjacent instance, fixed in passing) ───

describe("collectFrAtomExports — silent-drop guard", () => {
  it("THROWS when FR_M<n>_ATOMS is not a flat array", () => {
    expect(() =>
      collectFrAtomExports({
        "./curriculum/m1.ts": { FR_M1_ATOMS: { bonjour: {} } },
      }),
    ).toThrow(/non-array/);
  });
});
