/**
 * ES M7 curriculum guard — Sonnet-dispatched §13 IR module (2026-08-25
 * wave; brief = docs/es-m4-m10-wave-2026-08-24.md §m7). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M7_ATOMS, ES_M7_LESSONS, ES_M7_PLACEMENT, ES_M7_CHECKPOINT_INDEX } from "./m7";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m7",
  lessons: ES_M7_LESSONS,
  atoms: ES_M7_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m7",
  lessons: ES_M7_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m7")),
});

registerEsDoctrinePins({
  moduleId: "m7",
  lessons: ES_M7_LESSONS,
  checkpointIndex: ES_M7_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m7", ES_M7_LESSONS, ES_M7_ATOMS);

const getLesson = (n: number) => ES_M7_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function clozeCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of LESSONS) {
    for (const s of getLesson(n)) {
      if (s.type !== "particle_cloze") continue;
      counts[s.correctParticle] = (counts[s.correctParticle] ?? 0) + 1;
    }
  }
  return counts;
}

describe("ES m7 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M7_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M7_PLACEMENT.screener.length).toBe(1);
    expect(ES_M7_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("quiero/me-gusta and quiero/quieres lanes alternate with both halves live", () => {
    const c = clozeCounts();
    expect(c["quiero"] ?? 0, "quiero trials").toBeGreaterThanOrEqual(3);
    expect((c["gusta"] ?? 0) + (c["me gusta"] ?? 0), "me-gusta trials").toBeGreaterThanOrEqual(3);
    expect(c["quieres"] ?? 0, "quieres trials").toBeGreaterThanOrEqual(2);
  });

  it("hambre/sed is discriminated with both halves live (ear + cloze)", () => {
    let hambre = 0;
    let sed = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type === "particle_cloze" && ["hambre", "sed"].includes(s.correctParticle)) {
          if (s.correctParticle === "hambre") hambre++;
          else sed++;
        }
        if (s.type === "word_image_mcq" && s.options.some((o) => o.word === s.meaningEn)) {
          if (s.meaningEn === "tengo hambre") hambre++;
          if (s.meaningEn === "tengo sed") sed++;
        }
      }
    }
    expect(hambre, "hambre trials").toBeGreaterThanOrEqual(2);
    expect(sed, "sed trials").toBeGreaterThanOrEqual(2);
  });

  it("rico appears ONLY inside «¡qué rico!» in correct surfaces (chunk-only law)", () => {
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
          const v = rec[k];
          if (typeof v !== "string" || !v.includes("rico")) continue;
          expect(/¡?qué rico!?/.test(v), `${s.id} ${k}: «${v}»`).toBe(true);
        }
      }
    }
  });

});
