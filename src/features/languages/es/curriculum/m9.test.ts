/**
 * ES M9 curriculum guard — Sonnet-dispatched §13 IR module (2026-08-25
 * wave; brief = docs/es-m4-m10-wave-2026-08-24.md §m9). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M9_ATOMS, ES_M9_LESSONS, ES_M9_PLACEMENT, ES_M9_CHECKPOINT_INDEX } from "./m9";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m9",
  lessons: ES_M9_LESSONS,
  atoms: ES_M9_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m9",
  lessons: ES_M9_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m9")),
});

registerEsDoctrinePins({
  moduleId: "m9",
  lessons: ES_M9_LESSONS,
  checkpointIndex: ES_M9_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m9", ES_M9_LESSONS, ES_M9_ATOMS);

const getLesson = (n: number) => ES_M9_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function allSurfaces(): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of LESSONS) {
    for (const s of getLesson(n)) {
      const rec = s as unknown as Record<string, unknown>;
      for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
        const v = rec[k];
        if (typeof v === "string") out.push({ id: s.id, text: v });
      }
    }
  }
  return out;
}

describe("ES m9 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M9_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M9_PLACEMENT.screener.length).toBe(1);
    expect(ES_M9_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("al vs a-la contraction lane alternates with both halves live", () => {
    let al = 0;
    let a = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        const opts = s.options ?? [];
        if (!(opts.includes("al") && opts.includes("a"))) continue;
        if (s.correctParticle === "al") al++;
        if (s.correctParticle === "a") a++;
      }
    }
    expect(al, "al-correct trials").toBeGreaterThanOrEqual(4);
    expect(a, "a-la-correct trials").toBeGreaterThanOrEqual(3);
  });

  it("voy/vas discrimination runs with both halves live", () => {
    let voy = 0;
    let vas = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        const opts = s.options ?? [];
        if (!(opts.includes("voy") && opts.includes("vas"))) continue;
        if (s.correctParticle === "voy") voy++;
        if (s.correctParticle === "vas") vas++;
      }
    }
    expect(voy, "voy-correct trials").toBeGreaterThanOrEqual(2);
    expect(vas, "vas-correct trials").toBeGreaterThanOrEqual(2);
  });

  it("dónde/adónde runs as a text-MCQ lane with both halves live", () => {
    let donde = 0;
    let adonde = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "multiple_choice") continue;
        const texts = s.options.map((o) => o.text);
        if (!(texts.includes("dónde") && texts.includes("adónde"))) continue;
        const correct = s.options.find((o) => o.id === s.correctOptionId)?.text;
        if (correct === "dónde") donde++;
        if (correct === "adónde") adonde++;
      }
    }
    expect(donde, "dónde-correct trials").toBeGreaterThanOrEqual(2);
    expect(adonde, "adónde-correct trials").toBeGreaterThanOrEqual(2);
  });

  it("«a el» never surfaces, and going home never takes an article", () => {
    for (const { id, text } of allSurfaces()) {
      expect(/\ba el\b/.test(text), `${id}: uncontracted «a el» in «${text}»`).toBe(false);
      expect(text.includes("voy a la casa"), `${id}: «voy a la casa» breaks the casa exception`).toBe(false);
      expect(text.includes("vas a la casa"), `${id}: «vas a la casa» breaks the casa exception`).toBe(false);
    }
  });
});
