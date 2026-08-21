/**
 * FR M1 curriculum guard — the first French module, authored 2026-08-19 as
 * frameless IR (`ir/m1.ir.yaml` → `scripts/compile-ir-fr.mjs`) against the
 * full bar from day one. The shared gates register below; the bespoke
 * blocks pin M1's own authored decisions so a future edit cannot silently
 * unmake them:
 *
 *   - ZERO translate steps (typed French waits for the per-language
 *     accentPolicy work — pin F5: accent minimal pairs are forbidden as
 *     typed answers, and m1's «ou» sits on the ou/où pair; the typing
 *     budget went to speaking instead);
 *   - ZERO liaison_listen steps (ladder order: liaison RE-VOICES silent
 *     finals, so the silent-finals rung must exist as prior knowledge —
 *     liaison is m2's opening rung, handed the «huit» silent-h contrast
 *     by this module's mastery test);
 *   - placement: screener + 4 module items, screener first;
 *   - every atom carries a pronunciation hint (no audio-free first
 *     exposure of French orthography).
 */
import { describe, it, expect } from "vitest";
// Evaluate the full atom registry before ./m1 — same module-graph note as
// the ES module tests (factories resolving surfaces must not run mid-cycle).
import "../courseAtoms";
import { FR_M1_ATOMS, FR_M1_MODULE, FR_M1_PLACEMENT } from "./m1";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";

const LESSONS = FR_M1_MODULE.lessons;

describe("FR M1 bespoke", () => {
  it("module metadata is the authored identity", () => {
    expect(FR_M1_MODULE.title).toBe("Sons et salutations — sounds & first words");
    expect(FR_M1_MODULE.eyebrow).toBe("Module 1");
    expect(LESSONS[7].title).toBe("M1 Mastery Test");
  });

  it("ZERO translate steps module-wide (typed French waits for accentPolicy — see header)", () => {
    const translates = LESSONS.flatMap((l) =>
      l.steps.filter((s) => s.type === "translate").map((s) => `${l.id}/${s.id}`),
    );
    expect(translates).toEqual([]);
  });

  it("ZERO liaison_listen steps (liaison is m2's rung — silent finals must land first)", () => {
    const liaisons = LESSONS.flatMap((l) =>
      l.steps.filter((s) => s.type === "liaison_listen").map((s) => `${l.id}/${s.id}`),
    );
    expect(liaisons).toEqual([]);
  });

  it("teaches the silent-finals rung: ≥8 silent_letter drills across the module", () => {
    const count = LESSONS.reduce(
      (n, l) => n + l.steps.filter((s) => s.type === "silent_letter").length,
      0,
    );
    expect(count).toBeGreaterThanOrEqual(8);
  });

  it("placement ships screener + 4 module items, screener first", () => {
    expect(FR_M1_PLACEMENT.length).toBe(5);
    expect(FR_M1_PLACEMENT[0].id).toBe("pt-fr-m1-s");
    expect(FR_M1_PLACEMENT.every((p) => p.moduleId === "m1")).toBe(true);
    for (const item of FR_M1_PLACEMENT) {
      const step = item.build();
      expect(step.id, `placement ${item.id} builds a step with a different id`).toBe(item.id);
    }
  });

  it("every atom carries a pronunciation hint", () => {
    for (const a of FR_M1_ATOMS) {
      expect(
        typeof a.hint === "string" && a.hint.length > 0,
        `atom '${a.surface}' has no pronunciation hint`,
      ).toBe(true);
    }
  });

  it("«huit» is marked consonantOnset (blocks elision/liaison despite its vowel spelling)", () => {
    const huit = FR_M1_ATOMS.find((a) => a.surface === "huit");
    expect(huit?.consonantOnset).toBe(true);
  });
});

registerFrModuleContentLints({
  moduleId: "m1",
  lessons: LESSONS,
  atoms: FR_M1_ATOMS,
});

// ── FR authoring bar ────────────────────────────────────────────────────
// No debt parameter EXISTS for FR modules (the bar landed before the first
// module — see moduleBarGuards.ts). m1 has no prior modules.
registerFrModuleBarGuards({
  moduleLabel: "m1",
  lessons: LESSONS,
  priorModules: [],
});
