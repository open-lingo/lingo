/**
 * ES M8 curriculum guard — Sonnet-dispatched §13 IR module (2026-08-25
 * wave; brief = docs/es-m4-m10-wave-2026-08-24.md §m8). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M8_ATOMS, ES_M8_LESSONS, ES_M8_PLACEMENT, ES_M8_CHECKPOINT_INDEX } from "./m8";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m8",
  lessons: ES_M8_LESSONS,
  atoms: ES_M8_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m8",
  lessons: ES_M8_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m8")),
});

registerEsDoctrinePins({
  moduleId: "m8",
  lessons: ES_M8_LESSONS,
  checkpointIndex: ES_M8_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m8", ES_M8_LESSONS, ES_M8_ATOMS);

const getLesson = (n: number) => ES_M8_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

describe("ES m8 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M8_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M8_PLACEMENT.screener.length).toBe(1);
    expect(ES_M8_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("el-as-'on' vs es lane alternates with both halves live", () => {
    let el = 0;
    let es = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        const opts = s.options ?? [];
        if (!(opts.includes("el") && opts.includes("es"))) continue;
        if (s.correctParticle === "el") el++;
        if (s.correctParticle === "es") es++;
      }
    }
    expect(el, "el-correct (on-day) trials").toBeGreaterThanOrEqual(3);
    expect(es, "es-correct (identity) trials").toBeGreaterThanOrEqual(3);
  });

  it("dos/doce and tres/trece ear lanes run with both halves live", () => {
    const earTargets: Record<string, number> = {};
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "word_image_mcq") continue;
        if (!s.options.some((o) => o.word === s.meaningEn)) continue;
        earTargets[s.meaningEn] = (earTargets[s.meaningEn] ?? 0) + 1;
      }
    }
    expect(earTargets["doce"] ?? 0, "doce ear trials").toBeGreaterThanOrEqual(2);
    expect(earTargets["dos"] ?? 0, "dos ear trials").toBeGreaterThanOrEqual(1);
    expect(earTargets["trece"] ?? 0, "trece ear trials").toBeGreaterThanOrEqual(2);
    expect(earTargets["tres"] ?? 0, "tres ear trials").toBeGreaterThanOrEqual(1);
    expect(earTargets["hoy"] ?? 0, "hoy ear trials").toBeGreaterThanOrEqual(2);
    expect(earTargets["mañana"] ?? 0, "mañana ear trials").toBeGreaterThanOrEqual(2);
  });

  it("día is trialed as el (the -a exception); la never wins a día cloze", () => {
    let elDia = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        const after = String(s.prompt?.after ?? "");
        if (!/^ ?día\b/.test(after.trimStart()) && !after.includes(" día")) continue;
        if (!(s.options ?? []).includes("la")) continue;
        expect(s.correctParticle, `${s.id}: día must take el`).toBe("el");
        elDia++;
      }
    }
    expect(elDia, "día el/la trials").toBeGreaterThanOrEqual(2);
  });

  it("day names never surface capitalized (lowercase law)", () => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
          const v = rec[k];
          if (typeof v !== "string") continue;
          for (const d of days) {
            expect(v.includes(d), `${s.id} ${k}: capitalized day in «${v}»`).toBe(false);
          }
        }
      }
    }
  });

  it("summit line «el sábado quiero un café» is produced in L9 and never printed before", () => {
    const line = "el sábado quiero un café";
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8] as const) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
          const v = rec[k];
          if (typeof v !== "string") continue;
          expect(v.includes(line), `${s.id} ${k}: summit line leaked early`).toBe(false);
        }
      }
    }
    const summit = getLesson(9).find((s) => s.type === "dialogue_sim");
    expect(summit).toBeDefined();
    const hasBuild =
      summit?.type === "dialogue_sim" &&
      summit.turns.some((t) => t.reply.mode === "build" && t.reply.answer === line);
    expect(hasBuild, "L9 sim must build the summit line").toBe(true);
  });
});
