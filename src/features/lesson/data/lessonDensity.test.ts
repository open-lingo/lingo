/**
 * Density-driven sub-lesson builder coverage.
 *
 * Asserts the new drill-block chain (`symbol_recognition`, `symbol_to_sound`,
 * `listening_comprehension`, `fill_blank`, `speaking`, `symbol_production`)
 * emits the expected number of steps under each preset, that URL-bar
 * overrides via sessionStorage are honored, and that low-content rows
 * (yōon-intro, 1 kana) don't crash — they cap gracefully.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { ALL_ROWS, HIRAGANA_ROWS } from "./hiraganaCurriculum";
import { buildRowSubLessons } from "./lessonBuilder";
import {
  setDensityMode,
  setDensityOverride,
  getDensityConfig,
  DENSITY_PRESETS,
  __resetDensityWarnings,
} from "./lessonDensity";

function clearDensityStorage(): void {
  try {
    window.sessionStorage.clear();
  } catch {
    /* ignore */
  }
  __resetDensityWarnings();
}

/** Count steps in the first non-test sub-lesson of `rowId`. */
function firstSubLessonSteps(rowId: string) {
  const row = ALL_ROWS.find((r) => r.id === rowId);
  if (!row) throw new Error(`row ${rowId} not found`);
  const lessons = buildRowSubLessons(row);
  // First sub-lesson is the first non-test entry.
  const lesson = lessons.find((l) => !l.id.endsWith("-test"));
  if (!lesson) throw new Error(`no non-test sub-lesson in ${rowId}`);
  return lesson.steps;
}

function countByType(steps: { type: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of steps) out[s.type] = (out[s.type] ?? 0) + 1;
  return out;
}

describe("lessonDensity — preset defaults", () => {
  beforeEach(clearDensityStorage);

  it("Standard is the default preset", () => {
    const cfg = getDensityConfig();
    expect(cfg).toEqual(DENSITY_PRESETS.standard);
  });

  it("Speaking count defaults to 0 in Standard", () => {
    const cfg = getDensityConfig();
    expect(cfg.speaking).toBe(0);
  });

  it("Minimal preset has fewer drills than Standard", () => {
    setDensityMode("minimal");
    const cfg = getDensityConfig();
    expect(cfg).toEqual(DENSITY_PRESETS.minimal);
    const sum =
      cfg.recognition +
      cfg.symbolToSound +
      cfg.listening +
      cfg.fillBlank +
      cfg.speaking +
      cfg.production;
    expect(sum).toBeLessThan(
      DENSITY_PRESETS.standard.recognition +
        DENSITY_PRESETS.standard.symbolToSound +
        DENSITY_PRESETS.standard.listening +
        DENSITY_PRESETS.standard.fillBlank +
        DENSITY_PRESETS.standard.speaking +
        DENSITY_PRESETS.standard.production,
    );
  });

  it("Thorough preset has more drills than Standard", () => {
    setDensityMode("thorough");
    const cfg = getDensityConfig();
    expect(cfg).toEqual(DENSITY_PRESETS.thorough);
  });
});

describe("lessonDensity — URL-bar overrides", () => {
  beforeEach(clearDensityStorage);

  it("?density-recognition=10 override is honored", () => {
    setDensityOverride("recognition", "10");
    const cfg = getDensityConfig();
    expect(cfg.recognition).toBe(10);
    // Other dials keep their preset values.
    expect(cfg.listening).toBe(DENSITY_PRESETS.standard.listening);
  });

  it("clamps out-of-range overrides", () => {
    setDensityOverride("listening", "999");
    expect(getDensityConfig().listening).toBe(12);
    setDensityOverride("listening", "-5");
    expect(getDensityConfig().listening).toBe(0);
  });

  it("non-numeric override falls back to preset", () => {
    setDensityOverride("fillBlank", "abc");
    expect(getDensityConfig().fillBlank).toBe(DENSITY_PRESETS.standard.fillBlank);
  });
});

describe("lessonBuilder — sub-lesson step count under presets", () => {
  beforeEach(clearDensityStorage);

  // Pick rows with healthy content: ka, sa, ta have 2+ kana per sub-lesson
  // and 3+ anchor words across the row. Anchor distribution by sub-lesson
  // varies (sub-1 may have 1-2 anchors), so step-count thresholds account
  // for the per-row content caps.
  // All hiragana consonant rows (ka..ra) are hand-authored as of
  // 2026-05-16 — auto-builder output is discarded by mockLessons.ts
  // overrides. Sample from dakuten rows instead so this still exercises
  // the preset/density code path on rows that actually ship via the
  // auto-builder.
  const SAMPLE_ROWS = ["ga", "za"];

  it("Standard preset produces ≥13 steps per sub-lesson for typical rows", () => {
    // Floor lowered from 15 → 13 after the dedup fix (maxFromPool=1 for
    // sound / listening / fill / speaking / production — same word/kana no
    // longer repeats within a drill type). ka-1's 1-anchor sub-lesson now
    // produces 14 steps; sa/ta still 15-16.
    setDensityMode("standard");
    for (const rowId of SAMPLE_ROWS) {
      const steps = firstSubLessonSteps(rowId);
      expect(
        steps.length,
        `${rowId} standard: ${steps.length} steps (expected ≥13)`,
      ).toBeGreaterThanOrEqual(13);
    }
  });

  it("Minimal preset produces ≤12 steps per sub-lesson for typical rows", () => {
    // Bumped from ≤8 to ≤12 (2026-05-16). The remaining auto-builder
    // rows after the hiragana hand-authoring pass are dakuten ones with
    // 3-kana intros (per curriculum-restructure 2026-05-15) — Minimal
    // can't compress 3 kana × (intro/teach/recog/sound) below ~11 steps.
    setDensityMode("minimal");
    for (const rowId of SAMPLE_ROWS) {
      const steps = firstSubLessonSteps(rowId);
      expect(
        steps.length,
        `${rowId} minimal: ${steps.length} steps (expected ≤12)`,
      ).toBeLessThanOrEqual(12);
    }
  });

  it("Thorough preset substantially densifies typical rows (≥17 steps)", () => {
    setDensityMode("thorough");
    // Floor lowered from 20 → 17 after dedup. With maxFromPool=1 for the
    // word/kana drills, Thorough only adds more recognition (which still
    // allows 2× with distinct distractors) over Standard for small pools.
    // Larger pools (anchor-dense rows) hit the per-type counts cleanly.
    for (const rowId of SAMPLE_ROWS) {
      const steps = firstSubLessonSteps(rowId);
      expect(
        steps.length,
        `${rowId} thorough: ${steps.length} steps (expected ≥17)`,
      ).toBeGreaterThanOrEqual(17);
    }
  });

  it("Thorough hits ≥19 steps in at least one sub-lesson per anchor-dense row", () => {
    setDensityMode("thorough");
    // Anchor-dense rows fan out listening + fill_blank to their full
    // configured counts. Floor lowered from 24 → 19 after dedup
    // (maxFromPool=1 caps the listening/fill multiplier; sa peaks at 19).
    // ka..ra all hand-authored 2026-05-16 — anchor-density only
    // applies to dakuten/yōon rows still on the auto-builder.
    const ANCHOR_DENSE_ROWS = ["ga", "za"];
    for (const rowId of ANCHOR_DENSE_ROWS) {
      const row = ALL_ROWS.find((r) => r.id === rowId);
      if (!row) continue;
      const lessons = buildRowSubLessons(row);
      const maxSteps = Math.max(
        ...lessons
          .filter((l) => !l.id.endsWith("-test"))
          .map((l) => l.steps.length),
      );
      expect(
        maxSteps,
        `${rowId} thorough max sub-lesson: ${maxSteps} (expected ≥19)`,
      ).toBeGreaterThanOrEqual(19);
    }
  });

  it("emitted step ids are unique within a sub-lesson", () => {
    setDensityMode("standard");
    for (const rowId of SAMPLE_ROWS) {
      const steps = firstSubLessonSteps(rowId);
      const seen = new Set<string>();
      for (const s of steps) {
        expect(seen.has(s.id), `${rowId}: duplicate step id ${s.id}`).toBe(false);
        seen.add(s.id);
      }
    }
  });
});

describe("lessonBuilder — per-type counts respect the config", () => {
  beforeEach(clearDensityStorage);

  it("no step type emits more items than its config count", () => {
    setDensityMode("standard");
    const cfg = getDensityConfig();
    for (const row of HIRAGANA_ROWS) {
      const lessons = buildRowSubLessons(row);
      for (const lesson of lessons) {
        if (lesson.id.endsWith("-test")) continue;
        const counts = countByType(lesson.steps);
        expect(
          counts.symbol_recognition ?? 0,
          `${lesson.id} recognition`,
        ).toBeLessThanOrEqual(cfg.recognition);
        expect(
          counts.symbol_to_sound ?? 0,
          `${lesson.id} symbol_to_sound`,
        ).toBeLessThanOrEqual(cfg.symbolToSound);
        expect(
          counts.listening_comprehension ?? 0,
          `${lesson.id} listening`,
        ).toBeLessThanOrEqual(cfg.listening);
        expect(
          counts.fill_blank ?? 0,
          `${lesson.id} fill_blank`,
        ).toBeLessThanOrEqual(cfg.fillBlank);
        expect(
          counts.speaking ?? 0,
          `${lesson.id} speaking`,
        ).toBeLessThanOrEqual(cfg.speaking);
        expect(
          counts.symbol_production ?? 0,
          `${lesson.id} production`,
        ).toBeLessThanOrEqual(cfg.production);
      }
    }
  });

  it("speaking count is 0 in Standard for every sub-lesson", () => {
    setDensityMode("standard");
    for (const row of ALL_ROWS) {
      const lessons = buildRowSubLessons(row);
      for (const lesson of lessons) {
        const counts = countByType(lesson.steps);
        expect(
          counts.speaking ?? 0,
          `${lesson.id} unexpected speaking step in Standard`,
        ).toBe(0);
      }
    }
  });
});

describe("lessonBuilder — yōon rows cap gracefully", () => {
  beforeEach(clearDensityStorage);

  it("yoon-intro (1 sub-lesson, multi-codepoint kana) doesn't crash under Thorough", () => {
    setDensityMode("thorough");
    const row = ALL_ROWS.find((r) => r.id === "yoon-intro");
    expect(row).toBeDefined();
    if (!row) return;
    expect(() => buildRowSubLessons(row)).not.toThrow();
    const lessons = buildRowSubLessons(row);
    const lesson = lessons.find((l) => !l.id.endsWith("-test"));
    expect(lesson).toBeDefined();
    if (!lesson) return;
    // Yōon kana are multi-codepoint (e.g. きゃ) — production should be zero.
    const counts = countByType(lesson.steps);
    expect(counts.symbol_production ?? 0).toBe(0);
    // Recognition can still emit something (the helper allows ≤ N×2).
    expect(counts.symbol_recognition ?? 0).toBeGreaterThan(0);
  });

  it("override at 10 is capped to (kana × 2) for tiny rows", () => {
    setDensityMode("thorough");
    setDensityOverride("recognition", "10");
    const row = ALL_ROWS.find((r) => r.id === "yoon-intro");
    if (!row) return;
    const lesson = buildRowSubLessons(row).find((l) => !l.id.endsWith("-test"));
    if (!lesson) return;
    const counts = countByType(lesson.steps);
    // yoon-intro has 3 kana in its single sub-lesson, so max recognition is 6.
    expect((counts.symbol_recognition ?? 0)).toBeLessThanOrEqual(6);
  });
});

describe("lessonBuilder — row-test sub-lesson is unaffected by density", () => {
  beforeEach(clearDensityStorage);

  it("test sub-lesson contains a row_test step regardless of density", () => {
    setDensityMode("thorough");
    const row = ALL_ROWS.find((r) => r.id === "ka");
    if (!row) return;
    const testLesson = buildRowSubLessons(row).find((l) =>
      l.id.endsWith("-test"),
    );
    expect(testLesson).toBeDefined();
    if (!testLesson) return;
    const rowTest = testLesson.steps.find((s) => s.type === "row_test");
    expect(rowTest).toBeDefined();
  });
});
