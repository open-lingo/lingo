/**
 * ES M3 curriculum guard — the first §13-doctrine module authored through
 * the IR (2026-08-24). Shared lints at ZERO debt plus the doctrine suite
 * in the m1/m2 shape; the m3-specific pins at the bottom encode this
 * module's own inventory rules (articled debuts, the dinero restriction,
 * el/la + un/una discrimination lanes).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M3_ATOMS, ES_M3_LESSONS, ES_M3_PLACEMENT, ES_M3_CHECKPOINT_INDEX } from "./m3";
import { ES_M1_LESSONS } from "./m1";
import { ES_M2_LESSONS } from "./m2";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m3",
  lessons: ES_M3_LESSONS,
  atoms: ES_M3_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m3",
  lessons: ES_M3_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m3")),
});

describe("ES M3 bespoke guards", () => {
  it("the placement bank carries the m3 facts (1 screener + 3 byModule)", () => {
    expect(ES_M3_PLACEMENT.screener.length).toBe(1);
    expect(ES_M3_PLACEMENT.byModule.length).toBe(3);
  });
});

const getLesson = (n: number) => ES_M3_LESSONS[n - 1].steps;

const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

registerEsDoctrinePins({
  moduleId: "m3",
  lessons: ES_M3_LESSONS,
  checkpointIndex: ES_M3_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m3", ES_M3_LESSONS, ES_M3_ATOMS);

describe("ES m3 — bespoke doctrine pins", () => {
  it("the checkpoint sits after ALL teaching", () => {
    expect(ES_M3_LESSONS.length).toBe(10);
    expect(ES_M3_CHECKPOINT_INDEX).toBe(8);
  });

  it("cued recall NEVER precedes a printed first voicing (§13.9 law 3, m1–m3 scope)", () => {
    const voiced = new Set<string>();
    for (const modLessons of [ES_M1_LESSONS, ES_M2_LESSONS]) {
      for (const lesson of modLessons) {
        for (const s of lesson.steps) {
          if (s.type === "speaking" && s.cue !== "recall") voiced.add(s.targetPhrase);
        }
      }
    }
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "speaking") continue;
        if (s.cue === "recall") {
          expect(
            voiced.has(s.targetPhrase),
            `m3 L${n} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
          ).toBe(true);
        } else {
          voiced.add(s.targetPhrase);
        }
      }
    }
  });

  it("el/la and un/una trials ALTERNATE answers with both halves live (§13.9 law 4)", () => {
    const counts: Record<string, number> = {};
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "particle_cloze") continue;
        counts[s.correctParticle] = (counts[s.correctParticle] ?? 0) + 1;
      }
    }
    expect(counts["la"] ?? 0, "la-answer trials").toBeGreaterThanOrEqual(3);
    expect(counts["el"] ?? 0, "el-answer trials").toBeGreaterThanOrEqual(3);
    expect(counts["un"] ?? 0, "un-answer trials").toBeGreaterThanOrEqual(3);
    expect(counts["una"] ?? 0, "una-answer trials").toBeGreaterThanOrEqual(3);
    expect(counts["en"] ?? 0, "en trials").toBeGreaterThanOrEqual(2);
  });

  it("gendered words carry the tint layer in every map (§13.4)", () => {
    const GENDERS: Record<string, "m" | "f"> = {
      el: "m",
      la: "f",
      un: "m",
      una: "f",
      casa: "f",
      silla: "f",
      sillas: "f",
      llave: "f",
      llaves: "f",
      puerta: "f",
      ventana: "f",
      ventanas: "f",
      pluma: "f",
      plumas: "f",
      libro: "m",
      libros: "m",
      "lápiz": "m",
      papel: "m",
      celular: "m",
      dinero: "m",
    };
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "word_map") continue;
        s.tokens.forEach((token, idx) => {
          expect(
            s.tokenGenders?.[idx],
            `m3 L${n} ${s.id}: token «${token}» tint`,
          ).toBe(GENDERS[token]);
        });
      }
    }
  });
});

describe("ES m3 — inventory rules (this module's own laws)", () => {
  it("«un dinero» / «una dinero» is unbuildable — no surface anywhere carries it", () => {
    // dinero is a mass noun here: it rides hay/el only. The IR keeps it out
    // of every un/una trial; this pin keeps it out forever.
    const everything = JSON.stringify(ES_M3_LESSONS);
    expect(/\buna? dinero\b/.test(everything)).toBe(false);
  });

  it("every image-MCQ option ending in an m3 noun wears its article (§13.4)", () => {
    const nouns = ES_M3_ATOMS.filter((a) => a.partOfSpeech === "noun").map(
      (a) => a.surface,
    );
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "word_image_mcq") continue;
        for (const o of s.options) {
          const noun = nouns.find((x) => o.word === x || o.word.endsWith(` ${x}`));
          if (!noun) continue;
          expect(
            /^(el|la|un|una) /.test(o.word),
            `m3 L${n} ${s.id}: option «${o.word}» shows a bare noun — the article is part of the word`,
          ).toBe(true);
        }
      }
    }
  });

  it("carries a healthy audio-retrieval lane (≥10 audio-prompted word MCQs)", () => {
    let count = 0;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "word_image_mcq") continue;
        if (s.options.some((o) => o.word === s.meaningEn)) count++;
      }
    }
    expect(count).toBeGreaterThanOrEqual(10);
  });
});
