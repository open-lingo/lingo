/**
 * ES M12 curriculum guard — «Este, ese», the module that teaches pointing.
 * Opus-authored 5-agent wave (2026-09-02); brief =
 * scratchpad/es-m12-spine.md, spine settled in
 * docs/handoff-2026-09-02-es-m11-m15.md. Shared lints at ZERO debt +
 * shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M12_ATOMS, ES_M12_LESSONS, ES_M12_PLACEMENT, ES_M12_CHECKPOINT_INDEX } from "./m12";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m12",
  lessons: ES_M12_LESSONS,
  atoms: ES_M12_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m12",
  lessons: ES_M12_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m12")),
});

registerEsDoctrinePins({
  moduleId: "m12",
  lessons: ES_M12_LESSONS,
  checkpointIndex: ES_M12_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m12", ES_M12_LESSONS, ES_M12_ATOMS);

const getLesson = (n: number) => ES_M12_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Learner-facing Spanish carried as a step's own sentence. */
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

describe("ES m12 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M12_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M12_PLACEMENT.screener.length).toBe(1);
    expect(ES_M12_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("comprar stays infinitive-only (never conjugated anywhere)", () => {
    // «comprar» itself is safe: \b after "compra" fails on the following r.
    const banned = /\bcompr(o|as|a)\b/;
    for (const { id, text } of allSurfaces()) {
      expect(banned.test(text), `${id}: conjugated infinitive-only verb in «${text}»`).toBe(false);
    }
  });

  it("aquel/aquella are never taught — two distances only", () => {
    for (const n of LESSONS) {
      expect(/aquel/i.test(lessonBlob(n)), `L${n}: the third distance leaked in`).toBe(false);
    }
  });

  it("derived forms ride the fold and are NOT registered", () => {
    // The guard folds an untracked regular feminine of an -o adjective into
    // its masculine, and an untracked regular plural into its singular.
    // Registering these would give each a debut requirement it does not need.
    for (const surf of ["cara", "caros", "caras", "barata", "baratos", "baratas", "zapatos"]) {
      expect(
        ES_M12_ATOMS.some((a) => a.surface === surf),
        `«${surf}» is a derived form — the fold covers it; the atom is the masculine singular`,
      ).toBe(false);
    }
  });

  it("estos/estas/esos/esas ARE registered — the fold does not reach them", () => {
    // este -> estos and ese -> esos are irregular, so unlike zapato/zapatos
    // these four cannot ride the m3 plural canon.
    for (const surf of ["estos", "estas", "esos", "esas"]) {
      expect(
        ES_M12_ATOMS.some((a) => a.surface === surf),
        `«${surf}» is an irregular plural and must be registered in its own right`,
      ).toBe(true);
    }
  });

  it("gender is staged as the ONLY variable at least twice", () => {
    // The module's thesis is that a demonstrative agrees. A blank whose two
    // options are the same demonstrative in two genders tests exactly that;
    // a blank offering «este» against «cuesta» tests nothing.
    const PAIRS = [
      ["este", "esta"],
      ["ese", "esa"],
      ["estos", "estas"],
      ["esos", "esas"],
    ];
    const staged = blankOptionSets().filter(({ options }) =>
      PAIRS.some(([m, f]) => options.includes(m) && options.includes(f)),
    );
    expect(staged.length, "blanks contrasting a demonstrative's two genders").toBeGreaterThanOrEqual(2);
  });

  it("number is staged as the ONLY variable at least twice", () => {
    const PAIRS = [
      ["este", "estos"],
      ["esta", "estas"],
      ["ese", "esos"],
      ["esa", "esas"],
    ];
    const staged = blankOptionSets().filter(({ options }) =>
      PAIRS.some(([sg, pl]) => options.includes(sg) && options.includes(pl)),
    );
    expect(staged.length, "blanks contrasting a demonstrative's singular and plural").toBeGreaterThanOrEqual(2);
  });

  it("cuesta/cuestan are both drilled — the number split is not decorative", () => {
    const texts = allSurfaces().map(({ text }) => text);
    expect(texts.filter((t) => /\bcuesta\b/.test(t)).length, "«cuesta» sentences").toBeGreaterThanOrEqual(3);
    expect(texts.filter((t) => /\bcuestan\b/.test(t)).length, "«cuestan» sentences").toBeGreaterThanOrEqual(2);
  });

  it("«esta» vs «está» is confronted, not dodged", () => {
    // They differ by one accent and the learner meets them in one sentence.
    // Somewhere in the module the choice must actually be graded.
    const forced = blankOptionSets().some(
      ({ options }) => options.includes("esta") && options.includes("está"),
    );
    const inABank = LESSONS.some((n) =>
      getLesson(n).some((s) => {
        const tiles = (s as unknown as Record<string, unknown>).tiles;
        return Array.isArray(tiles) && tiles.includes("esta") && tiles.includes("está");
      }),
    );
    expect(forced || inABank, "no step makes the learner choose between «esta» and «está»").toBe(true);
  });

  it("every pointer earns an ANSWER position, not just a distractor slot", () => {
    // Found in the L7/L8 wave: after a rewrite, «estas» survived the module
    // only as a distractor tile and a cloze option — offered eight times,
    // never once the thing the learner had to produce or decide. A
    // demonstrative the learner never commits to is not taught, and no
    // shared gate notices: registerEsAtomUsagePin counts appearances, and a
    // distractor is an appearance.
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
    for (const dem of ["este", "esta", "ese", "esa", "estos", "estas", "esos", "esas"]) {
      expect(words.has(dem), `«${dem}» is never in an answer position — it is offered, never produced`).toBe(true);
    }
  });

  it("the transfer cell lives ONLY in the L8 checkpoint", () => {
    for (const n of LESSONS) {
      if (n === 8) continue;
      expect(/sombrero/.test(lessonBlob(n)), `L${n}: transfer cell leaked outside the checkpoint`).toBe(false);
    }
    expect(/sombrero/.test(lessonBlob(8)), "L8 must carry the transfer beat").toBe(true);
  });

  it("L8's transfer build makes the learner decide agreement, not shape", () => {
    const build = getLesson(8).find(
      (s) =>
        s.type === "build_sentence" &&
        /sombrero/.test((s as never as Record<string, string>).targetSentence ?? ""),
    );
    expect(build, "L8 transfer buildLit missing").toBeDefined();
    const tiles = (build as never as Record<string, string[]>).tiles ?? [];
    expect(tiles.includes("esta"), "bank must hold a wrong-GENDER demonstrative").toBe(true);
    expect(tiles.includes("esos"), "bank must hold a wrong-NUMBER demonstrative").toBe(true);
  });

  it("sombrero carries no emoji — it must be met cold, in text", () => {
    const atom = ES_M12_ATOMS.find((a) => a.surface === "sombrero");
    expect(atom, "sombrero not registered").toBeDefined();
    expect((atom as unknown as Record<string, unknown>).emoji).toBeUndefined();
  });
});
