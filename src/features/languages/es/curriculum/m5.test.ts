/**
 * ES M5 curriculum guard — Sonnet-dispatched §13 IR module (2026-08-25
 * wave; brief = docs/es-m4-m10-wave-2026-08-24.md §m5). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M5_ATOMS, ES_M5_LESSONS, ES_M5_PLACEMENT, ES_M5_CHECKPOINT_INDEX } from "./m5";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m5",
  lessons: ES_M5_LESSONS,
  atoms: ES_M5_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m5",
  lessons: ES_M5_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m5")),
});

registerEsDoctrinePins({
  moduleId: "m5",
  lessons: ES_M5_LESSONS,
  checkpointIndex: ES_M5_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m5", ES_M5_LESSONS, ES_M5_ATOMS);

const getLesson = (n: number) => ES_M5_LESSONS[n - 1].steps;
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

describe("ES m5 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M5_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M5_PLACEMENT.screener.length).toBe(1);
    expect(ES_M5_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("tengo/tienes/tiene and mi/tu lanes alternate with both halves live", () => {
    const c = clozeCounts();
    expect(c["tengo"] ?? 0, "tengo trials").toBeGreaterThanOrEqual(3);
    expect(c["tienes"] ?? 0, "tienes trials").toBeGreaterThanOrEqual(3);
    expect(c["tiene"] ?? 0, "tiene trials").toBeGreaterThanOrEqual(3);
    expect(c["mi"] ?? 0, "mi trials").toBeGreaterThanOrEqual(3);
    expect(c["tu"] ?? 0, "tu trials").toBeGreaterThanOrEqual(2);
  });

  it("hermano/hermana and abuelo/abuela are trained BY EAR with both halves live", () => {
    const tally: Record<string, number> = {};
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "word_image_mcq") continue;
        if (!s.options.some((o) => o.word === s.meaningEn)) continue;
        const words = s.options.map((o) => o.word.replace(/^(el|la) /, ""));
        for (const pair of [["hermano", "hermana"], ["abuelo", "abuela"]]) {
          if (words.includes(pair[0]) && words.includes(pair[1])) {
            const key = s.meaningEn.replace(/^(el|la) /, "");
            tally[key] = (tally[key] ?? 0) + 1;
          }
        }
      }
    }
    expect(tally["hermano"] ?? 0).toBeGreaterThanOrEqual(2);
    expect(tally["hermana"] ?? 0).toBeGreaterThanOrEqual(2);
    expect(tally["abuelo"] ?? 0).toBeGreaterThanOrEqual(2);
    expect(tally["abuela"] ?? 0).toBeGreaterThanOrEqual(2);
  });

  it("no grandparent ever has a child's age (the absurd-age class stays dead)", () => {
    const text = JSON.stringify(ES_M5_LESSONS);
    expect(/abuel[oa] tiene (un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez) años/.test(text)).toBe(false);
  });

});
