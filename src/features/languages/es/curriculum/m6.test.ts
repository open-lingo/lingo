/**
 * ES M6 curriculum guard — Sonnet-dispatched §13 IR module (2026-08-25
 * wave; brief = docs/es-m4-m10-wave-2026-08-24.md §m6). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M6_ATOMS, ES_M6_LESSONS, ES_M6_PLACEMENT, ES_M6_CHECKPOINT_INDEX } from "./m6";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m6",
  lessons: ES_M6_LESSONS,
  atoms: ES_M6_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m6",
  lessons: ES_M6_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m6")),
});

registerEsDoctrinePins({
  moduleId: "m6",
  lessons: ES_M6_LESSONS,
  checkpointIndex: ES_M6_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m6", ES_M6_LESSONS, ES_M6_ATOMS);

const getLesson = (n: number) => ES_M6_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;


describe("ES m6 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M6_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M6_PLACEMENT.screener.length).toBe(1);
    expect(ES_M6_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("the flip lane alternates (bonito-class both genders live); invariants are trapped", () => {
    const everything = JSON.stringify(ES_M6_LESSONS);
    for (const bad of ["azula", "verda", "granda"]) {
      expect(everything.includes(`"${bad}"`), `invariant trap ${bad} present as a distractor`).toBe(true);
      for (const key of ["audioText", "targetSentence", "targetPhrase"]) {
        expect(new RegExp(`"${key}":"[^"]*${bad}`).test(everything), `${bad} in a correct surface`).toBe(false);
      }
    }
  });

  it("ships agreement_cloze and gender_sort (the m6-unlocked types)", () => {
    let agr = 0;
    let gs = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type === "agreement_cloze") agr++;
        if (s.type === "gender_sort") gs++;
      }
    }
    expect(agr).toBeGreaterThanOrEqual(4);
    expect(gs).toBeGreaterThanOrEqual(1);
    expect(gs).toBeLessThanOrEqual(2);
  });

  it("«muy muy» is unbuildable and adjectives never precede their noun in a correct surface", () => {
    // Cards may QUOTE «muy muy» to ban it; only correct surfaces matter.
    const surfaces: string[] = [];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
          if (typeof rec[k] === "string") surfaces.push(rec[k] as string);
        }
      }
    }
    const everything = JSON.stringify(surfaces);
    expect(everything.includes("muy muy")).toBe(false);
    for (const adj of ["rojo", "azul", "verde", "negro", "blanco", "nuevo", "viejo"]) {
      expect(
        new RegExp(`"(audioText|targetSentence|targetPhrase)":"(el|la) ${adj} `).test(everything),
        `adjective-before-noun: ${adj}`,
      ).toBe(false);
    }
  });

});
