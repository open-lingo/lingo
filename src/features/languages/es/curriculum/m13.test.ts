/**
 * ES M13 curriculum guard — «Me gusta, me gustan», the module where the
 * sentence runs backwards. Opus-authored 5-agent wave (2026-09-02); brief =
 * scratchpad/es-m13-spine.md, spine settled in
 * docs/handoff-2026-09-02-es-m11-m15.md. Shared lints at ZERO debt +
 * shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M13_ATOMS, ES_M13_LESSONS, ES_M13_PLACEMENT, ES_M13_CHECKPOINT_INDEX } from "./m13";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m13",
  lessons: ES_M13_LESSONS,
  atoms: ES_M13_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m13",
  lessons: ES_M13_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m13")),
});

registerEsDoctrinePins({
  moduleId: "m13",
  lessons: ES_M13_LESSONS,
  checkpointIndex: ES_M13_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m13", ES_M13_LESSONS, ES_M13_ATOMS);

const getLesson = (n: number) => ES_M13_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Learner-facing Spanish carried as a step's own sentence. */
function allSurfaces(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of nums) {
    for (const s of getLesson(n)) {
      const rec = s as unknown as Record<string, unknown>;
      for (const k of ["audioText", "targetPhrase", "targetSentence", "transcript"]) {
        const v = rec[k];
        if (typeof v === "string") out.push({ id: s.id, text: v });
      }
    }
  }
  return out;
}

/** EVERY string anywhere in a lesson — tiles, options, prompts, sim turns. */
const lessonBlob = (n: number) => JSON.stringify(getLesson(n));

/** Options offered by whichever step type carries a pick-one blank. */
function blankOptionSets(): Array<{ id: string; options: string[] }> {
  const out: Array<{ id: string; options: string[] }> = [];
  for (const n of LESSONS) {
    for (const s of getLesson(n)) {
      if (s.type === "particle_cloze") {
        out.push({ id: s.id, options: [...(s.options ?? [])] });
      } else if (s.type === "agreement_cloze") {
        for (const seg of s.segments) {
          if ("blank" in seg) out.push({ id: `${s.id}/${seg.blank.id}`, options: [...seg.blank.options] });
        }
      }
    }
  }
  return out;
}

describe("ES m13 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M13_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M13_PLACEMENT.screener.length).toBe(1);
    expect(ES_M13_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("nadar/cocinar/viajar stay infinitive-only, and «nada» never appears", () => {
    // «nada» is banned outright, not merely as a conjugation: it is also a
    // real Spanish word ("nothing"), so a learner meeting it here cannot tell
    // which one they are being shown. The regex below catches both at once.
    const banned = /\b(nad|cocin|viaj)(o|as|a)\b/;
    for (const { id, text } of allSurfaces()) {
      expect(banned.test(text), `${id}: conjugated infinitive-only verb (or «nada») in «${text}»`).toBe(false);
    }
    for (const n of LESSONS) {
      expect(/"[^"]*\bnada\b[^"]*"/.test(lessonBlob(n)), `L${n}: «nada» is banned module-wide`).toBe(false);
    }
  });

  it("the plural persons and encantar are NOT taught here", () => {
    // Three persons is the whole table a beginner needs; nos/les and
    // «encantar» are m20s work and would double the module for no gain.
    for (const n of LESSONS) {
      const blob = lessonBlob(n);
      expect(/\bnos gusta/.test(blob), `L${n}: «nos gusta» is out of scope`).toBe(false);
      expect(/\bles gusta/.test(blob), `L${n}: «les gusta» is out of scope`).toBe(false);
      expect(/\bencanta/.test(blob), `L${n}: «encantar» is out of scope`).toBe(false);
    }
  });

  it("derived forms ride the fold and are NOT registered", () => {
    for (const surf of ["favorita", "favoritos", "favoritas", "pizzas", "helados", "películas"]) {
      expect(
        ES_M13_ATOMS.some((a) => a.surface === surf),
        `«${surf}» is a derived form — the fold covers it`,
      ).toBe(false);
    }
  });

  it("THE THESIS: gustan always has a plural subject, gusta never does", () => {
    // This is the one error every Spanish learner makes for years, and the
    // only pin here that checks meaning rather than shape. «me gusta los
    // zapatos» is the mistake; if the module itself ever prints it, the
    // module teaches the mistake.
    // A PLURAL SUBJECT is marked by a plural determiner, a plural
    // demonstrative (m12's own atoms), or the inherently-plural «vacaciones».
    const PLURAL_SUBJ = /\b(los|las|estos|estas|esos|esas|vacaciones)\b/;
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase();
      if (/\bgusta\s+(los|las|estos|estas|esos|esas)\b/.test(t)) {
        bad.push(`${id}: «gusta» with a plural subject — «${text}»`);
      }
      if (/\bgustan\b/.test(t) && !PLURAL_SUBJ.test(t)) {
        bad.push(`${id}: «gustan» with no plural subject in sight — «${text}»`);
      }
    }
    expect(bad, `THESIS violations:\n${bad.join("\n")}`).toEqual([]);
  });

  it("gusta and gustan are both really drilled", () => {
    const texts = allSurfaces().map(({ text }) => text.toLowerCase());
    expect(texts.filter((t) => /\bgusta\b/.test(t)).length, "«gusta» sentences").toBeGreaterThanOrEqual(8);
    expect(texts.filter((t) => /\bgustan\b/.test(t)).length, "«gustan» sentences").toBeGreaterThanOrEqual(5);
  });

  it("number is staged as the ONLY variable at least twice", () => {
    // A blank offering «gusta» against «gustan» tests the rule. A blank
    // offering «gusta» against «cuesta» tests vocabulary.
    const staged = blankOptionSets().filter(
      ({ options }) => options.includes("gusta") && options.includes("gustan"),
    );
    expect(staged.length, "blanks contrasting gusta with gustan").toBeGreaterThanOrEqual(2);
  });

  it("all three persons earn an ANSWER position, not just a distractor slot", () => {
    // registerEsAtomUsagePin counts appearances and a distractor is an
    // appearance, so a pronoun can be offered a dozen times and never once
    // be the thing the learner commits to. Found in the m12 wave.
    const answers: string[] = [];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        if (s.type === "build_sentence" || s.type === "listening_build") {
          answers.push(String(rec.targetSentence ?? ""));
        } else if (s.type === "speaking") {
          answers.push(String(rec.targetPhrase ?? ""));
        } else if (s.type === "particle_cloze") {
          answers.push(String(rec.correctParticle ?? ""));
        } else if (s.type === "agreement_cloze") {
          for (const seg of s.segments) if ("blank" in seg) answers.push(seg.blank.correctAnswer);
        }
      }
    }
    const words = new Set(
      answers.flatMap((a) => a.toLowerCase().replace(/[¿¡?!.,]/g, "").split(/\s+/)),
    );
    for (const w of ["me", "te", "le", "gusta", "gustan"]) {
      expect(words.has(w), `«${w}» is never in an answer position — it is offered, never produced`).toBe(true);
    }
  });

  it("the transfer cell lives ONLY in the L8 checkpoint", () => {
    for (const n of LESSONS) {
      if (n === 8) continue;
      expect(/vacaciones/.test(lessonBlob(n)), `L${n}: transfer cell leaked outside the checkpoint`).toBe(false);
    }
    expect(/vacaciones/.test(lessonBlob(8)), "L8 must carry the transfer beat").toBe(true);
  });

  it("L8's transfer build keeps BOTH agreement decisions live", () => {
    const build = getLesson(8).find(
      (s) =>
        s.type === "build_sentence" &&
        /vacaciones/.test((s as never as Record<string, string>).targetSentence ?? ""),
    );
    expect(build, "L8 transfer buildLit missing").toBeDefined();
    const tiles = (build as never as Record<string, string[]>).tiles ?? [];
    expect(tiles.includes("gusta"), "bank must hold the SINGULAR verb").toBe(true);
    expect(tiles.includes("el"), "bank must hold the SINGULAR article").toBe(true);
  });

  it("vacaciones carries no emoji — it must be met cold, in text", () => {
    const atom = ES_M13_ATOMS.find((a) => a.surface === "vacaciones");
    expect(atom, "vacaciones not registered").toBeDefined();
    expect((atom as unknown as Record<string, unknown>).emoji).toBeUndefined();
  });
});
