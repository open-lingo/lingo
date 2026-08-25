/**
 * ES M10 curriculum guard — Sonnet-dispatched §13 IR module (2026-08-25
 * wave; brief = docs/es-m4-m10-wave-2026-08-24.md §m10). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M10_ATOMS, ES_M10_LESSONS, ES_M10_PLACEMENT, ES_M10_CHECKPOINT_INDEX } from "./m10";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m10",
  lessons: ES_M10_LESSONS,
  atoms: ES_M10_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m10",
  lessons: ES_M10_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m10")),
});

registerEsDoctrinePins({
  moduleId: "m10",
  lessons: ES_M10_LESSONS,
  checkpointIndex: ES_M10_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m10", ES_M10_LESSONS, ES_M10_ATOMS);

const getLesson = (n: number) => ES_M10_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function allSurfaces(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of nums) {
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

describe("ES m10 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M10_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M10_PLACEMENT.screener.length).toBe(1);
    expect(ES_M10_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("trabajo is NOT re-registered (m9 owns the noun surface)", () => {
    expect(ES_M10_ATOMS.some((a) => a.surface === "trabajo")).toBe(false);
  });

  it("the -o/-as/-a machine lane runs with all three gears live", () => {
    const gears: Record<string, number> = {};
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        const c = s.correctParticle;
        if (/^(hablo|hablas|habla|trabajo|trabajas|trabaja|estudio|estudias|estudia)$/.test(c)) {
          gears[c.endsWith("as") ? "you" : /(o)$/.test(c) ? "I" : "he/she"] =
            (gears[c.endsWith("as") ? "you" : /(o)$/.test(c) ? "I" : "he/she"] ?? 0) + 1;
        }
      }
    }
    expect(gears["I"] ?? 0, "yo-form trials").toBeGreaterThanOrEqual(3);
    expect(gears["you"] ?? 0, "tú-form trials").toBeGreaterThanOrEqual(3);
    expect(gears["he/she"] ?? 0, "él/ella-form trials").toBeGreaterThanOrEqual(3);
  });

  it("escuchar/bailar/cantar stay infinitive-only (never conjugated anywhere)", () => {
    const banned = /\b(escuch|bail|cant)(o|as|a)\b/;
    for (const { id, text } of allSurfaces()) {
      expect(banned.test(text), `${id}: conjugated infinitive-only verb in «${text}»`).toBe(false);
    }
  });

  it("siempre/nunca discriminated with both halves live", () => {
    let siempre = 0;
    let nunca = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        const opts = s.options ?? [];
        if (!(opts.includes("siempre") && opts.includes("nunca"))) continue;
        if (s.correctParticle === "siempre") siempre++;
        if (s.correctParticle === "nunca") nunca++;
      }
    }
    expect(siempre, "siempre-correct trials").toBeGreaterThanOrEqual(2);
    expect(nunca, "nunca-correct trials").toBeGreaterThanOrEqual(2);
  });

  it("«hablo un poco» is reserved for the L10 finale (never printed before)", () => {
    for (const { id, text } of allSurfaces([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      expect(text.includes("hablo un poco"), `${id}: finale line leaked early in «${text}»`).toBe(false);
    }
    const finale = getLesson(10).find((s) => s.type === "dialogue_sim");
    expect(finale).toBeDefined();
    const lands =
      finale?.type === "dialogue_sim" &&
      finale.turns.some(
        (t) => t.reply.mode === "choice" && t.reply.options.some((o) => o.text.includes("hablo un poco")),
      );
    expect(lands, "L10 sim must land «hablo un poco»").toBe(true);
  });
});
