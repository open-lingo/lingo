/**
 * ES M4 curriculum guard — first Sonnet-dispatched §13 IR module
 * (2026-08-24 wave; brief = docs/es-m4-m10-wave-2026-08-24.md §m4).
 * Shared lints at ZERO debt + shared doctrine pins + the m4-bespoke
 * lanes: está/es, aquí/allí by ear, los/las, and the two rule-breakers
 * (el agua, la foto).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M4_ATOMS, ES_M4_LESSONS, ES_M4_PLACEMENT, ES_M4_CHECKPOINT_INDEX } from "./m4";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m4",
  lessons: ES_M4_LESSONS,
  atoms: ES_M4_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m4",
  lessons: ES_M4_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m4")),
});

registerEsDoctrinePins({
  moduleId: "m4",
  lessons: ES_M4_LESSONS,
  checkpointIndex: ES_M4_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m4", ES_M4_LESSONS, ES_M4_ATOMS);

const getLesson = (n: number) => ES_M4_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

describe("ES m4 — bespoke pins", () => {
  it("checkpoint at 8; placement carries 1 screener + 4 byModule", () => {
    expect(ES_M4_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M4_PLACEMENT.screener.length).toBe(1);
    expect(ES_M4_PLACEMENT.byModule.length).toBe(4);
  });

  it("está/es trials ALTERNATE with both halves live (the module's core lane)", () => {
    const counts: Record<string, number> = {};
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        counts[s.correctParticle] = (counts[s.correctParticle] ?? 0) + 1;
      }
    }
    expect(counts["está"] ?? 0, "está-answer trials").toBeGreaterThanOrEqual(4);
    expect(counts["es"] ?? 0, "es-answer trials").toBeGreaterThanOrEqual(3);
    expect(counts["los"] ?? 0, "los trials").toBeGreaterThanOrEqual(3);
    expect(counts["las"] ?? 0, "las trials").toBeGreaterThanOrEqual(3);
  });

  it("aquí/allí is trained BY EAR with both halves live", () => {
    let aqui = 0;
    let alli = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "word_image_mcq") continue;
        if (!s.options.some((o) => o.word === s.meaningEn)) continue;
        const words = s.options.map((o) => o.word);
        if (!words.includes("aquí") || !words.includes("allí")) continue;
        if (s.meaningEn === "aquí") aqui++;
        if (s.meaningEn === "allí") alli++;
      }
    }
    expect(aqui, "aquí-answer ear trials").toBeGreaterThanOrEqual(2);
    expect(alli, "allí-answer ear trials").toBeGreaterThanOrEqual(2);
  });

  it("«están» is unbuildable in m4 (plurals ride hay; estar-plural is a later module)", () => {
    expect(JSON.stringify(ES_M4_LESSONS).includes("están")).toBe(false);
  });

  it("«la agua» and «un foto» never appear as a CORRECT surface (the rule-breakers hold)", () => {
    // They may exist as distractors/trap options; never as answer text.
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
          const v = rec[k];
          if (typeof v !== "string") continue;
          expect(/\bla agua\b/.test(v), `${s.id} ${k}: «la agua»`).toBe(false);
          expect(/\bun foto\b/.test(v), `${s.id} ${k}: «un foto»`).toBe(false);
        }
      }
    }
  });

  it("«hay» never pairs with los/las in any CORRECT surface (trap options may)", () => {
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        const surfaces: string[] = [];
        for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
          if (typeof rec[k] === "string") surfaces.push(rec[k] as string);
        }
        if (s.type === "dialogue_sim") {
          for (const t of s.turns) {
            if (t.reply.mode === "build") {
              surfaces.push(t.reply.answer, ...(t.reply.alsoAccepted ?? []));
            }
          }
        }
        for (const text of surfaces) {
          expect(/hay (los|las) /.test(text), `${s.id}: «${text}»`).toBe(false);
        }
      }
    }
  });

  it("gendered words carry the tint layer in every map (§13.4)", () => {
    const GENDERS: Record<string, "m" | "f"> = {
      el: "m", la: "f", un: "m", una: "f", los: "m", las: "f",
      llave: "f", "llave?": "f", llaves: "f", mesa: "f", cama: "f",
      camas: "f", cocina: "f", foto: "f", "foto?": "f", fotos: "f",
      casa: "f", puerta: "f", silla: "f", sillas: "f", pluma: "f",
      "baño": "m", cuarto: "m", celular: "m", "celular?": "m",
      libro: "m", libros: "m", agua: "f",
    };
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "word_map") continue;
        s.tokens.forEach((token, idx) => {
          expect(
            s.tokenGenders?.[idx],
            `m4 L${n} ${s.id}: token «${token}» tint`,
          ).toBe(GENDERS[token]);
        });
      }
    }
  });
});
