/**
 * ES M14 curriculum guard — «Puedo, quiero», the module where the stem vowel
 * breaks. Opus-authored 5-agent wave (2026-09-02); brief =
 * scratchpad/es-m14-spine.md, spine settled in
 * docs/handoff-2026-09-02-es-m11-m15.md. Shared lints at ZERO debt +
 * shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M14_ATOMS, ES_M14_LESSONS, ES_M14_PLACEMENT, ES_M14_CHECKPOINT_INDEX } from "./m14";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m14",
  lessons: ES_M14_LESSONS,
  atoms: ES_M14_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m14",
  lessons: ES_M14_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m14")),
});

registerEsDoctrinePins({
  moduleId: "m14",
  lessons: ES_M14_LESSONS,
  checkpointIndex: ES_M14_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m14", ES_M14_LESSONS, ES_M14_ATOMS, {
  // «volver» is the L8 transfer cell's didn't-conjugate foil (see the
  // bespoke "registered but never drilled" pin below).
  neverProduced: ["volver"],
});

const getLesson = (n: number) => ES_M14_LESSONS[n - 1].steps;
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

/** Every pick-one blank in the module, whichever step type carries it. */
function blankOptionSets(): Array<{ id: string; correct: string; options: string[] }> {
  const out: Array<{ id: string; correct: string; options: string[] }> = [];
  for (const n of LESSONS) {
    for (const s of getLesson(n)) {
      if (s.type === "particle_cloze") {
        out.push({ id: s.id, correct: s.correctParticle, options: [...(s.options ?? [])] });
      } else if (s.type === "agreement_cloze") {
        for (const seg of s.segments) {
          if ("blank" in seg) {
            out.push({
              id: `${s.id}/${seg.blank.id}`,
              correct: seg.blank.correctAnswer,
              options: [...seg.blank.options],
            });
          }
        }
      }
    }
  }
  return out;
}

describe("ES m14 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M14_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M14_PLACEMENT.screener.length).toBe(1);
    expect(ES_M14_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("FORM DISCIPLINE: only the registered forms are ever produced", () => {
    // The header registers exactly three persons for poder and two apiece for
    // the rest. Every form below is real Spanish that this module never
    // taught, so producing one would grade the learner on an unmet form.
    const unregistered =
      /\b(podemos|podéis|pueden|duermes|duermen|dormimos|empiezo|empiezas|empiezan|entiendes|entienden|quieren|queremos|cuesto|cuestas)\b/;
    for (const { id, text } of allSurfaces()) {
      expect(unregistered.test(text.toLowerCase()), `${id}: unregistered verb form in «${text}»`).toBe(false);
    }
  });

  it("THE THESIS: the stem vowel is never left unbroken", () => {
    // «podo», «quero», «dormo», «entendo», «empezo» are what a learner who
    // has NOT understood the module would produce. If the module itself ever
    // prints one in an answer position, it teaches the mistake.
    const unbroken = /\b(podo|podes|quero|queres|dormo|dorme|entendo|entende|empezo|empeza)\b/;
    for (const { id, text } of allSurfaces()) {
      expect(unbroken.test(text.toLowerCase()), `${id}: unbroken stem vowel in «${text}»`).toBe(false);
    }
  });

  it("«la bota» is never named, and nosotros/vosotros stay out", () => {
    // The boot only means something when nosotros/vosotros are on the table,
    // and this course teaches yo/tú/él only — all three break, so there is no
    // unbroken form to contrast against. Naming it would be a picture of
    // nothing. See the m14 IR header.
    for (const n of LESSONS) {
      const blob = lessonBlob(n);
      expect(/la bota|\bboot\b/i.test(blob), `L${n}: «la bota»/"boot" is banned learner-facing`).toBe(false);
      expect(/\bnosotros\b|\bvosotros\b/i.test(blob), `L${n}: nosotros/vosotros are not taught`).toBe(false);
    }
  });

  it("the carriers are USED but never re-registered", () => {
    // quiero/quieres are m7's atoms, cuesta/cuestan m12's, entiendo m2's.
    // Re-registering an exact surface duplicates an atom id — the m11
    // pan/pero failure. They ride along as carriers instead.
    for (const surf of ["quiero", "quieres", "cuesta", "cuestan", "entiendo"]) {
      expect(
        ES_M14_ATOMS.some((a) => a.surface === surf),
        `«${surf}» belongs to an earlier module and must not be re-registered`,
      ).toBe(false);
    }
    // ...but the module must actually USE them, or the thesis has no evidence.
    const all = LESSONS.map((n) => lessonBlob(n)).join(" ");
    for (const surf of ["quiero", "cuesta", "entiendo"]) {
      expect(new RegExp(`\\b${surf}\\b`).test(all), `«${surf}» is the thesis and must appear`).toBe(true);
    }
  });

  it("a cloze answered by a CARRIER is a two-option discrimination trial", () => {
    // atomModuleBySurfaceWord resolves quiero->m7, cuesta->m12, entiendo->m2,
    // so pin E2 reads them as prior-module atoms. They survive only on the
    // §13.9 law 5 exemption: EXACTLY two options, both taught. This must
    // cover agreement_cloze blanks too, not just particle_cloze: L3's
    // yo/ella blank is answered by «entiendo» and faces the same pin.
    const carriers = new Set(["quiero", "quieres", "cuesta", "cuestan", "entiendo"]);
    const blanks = blankOptionSets();
    expect(blanks.length, "no blanks found — the pin would be vacuous").toBeGreaterThan(0);
    const carrierBlanks = blanks.filter((b) => carriers.has(b.correct.toLowerCase()));
    expect(
      carrierBlanks.length,
      "no carrier-answered blank found — the carrier set is stale",
    ).toBeGreaterThan(0);
    const bad = carrierBlanks
      .filter((b) => b.options.length !== 2)
      .map((b) => `${b.id}: «${b.correct}» is a prior-module atom with ${b.options.length} options`);
    expect(bad, `pin E2 needs exactly 2 options:\n${bad.join("\n")}`).toEqual([]);
  });

  it("both stem patterns are really drilled, not just named", () => {
    const all = LESSONS.map((n) => lessonBlob(n)).join(" ");
    const count = (re: RegExp) => (all.match(re) ?? []).length;
    expect(count(/\b(puedo|puedes|puede|duermo|duerme)\b/g), "o→ue is under-drilled").toBeGreaterThanOrEqual(8);
    expect(count(/\b(quiero|quieres|quiere|entiendo|entiende|empieza)\b/g), "e→ie is under-drilled").toBeGreaterThanOrEqual(8);
  });

  it("every registered atom earns an ANSWER position, not a distractor slot", () => {
    // registerEsAtomUsagePin counts appearances and a distractor IS an
    // appearance, so a form can be shown a dozen times and never once be the
    // thing the learner commits to. Found in the m12 wave.
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
    for (const a of ES_M14_ATOMS) {
      const surf = a.surface.toLowerCase();
      if (surf.includes(" ")) continue;
      // «volver» is registered ONLY so the gate can track the foil tile it
      // sits in — it is the didn't-conjugate distractor and must never be
      // the thing the learner produces. «vuelve» is the real answer.
      if (surf === "volver") continue;
      expect(words.has(surf), `«${surf}» is never in an answer position — it is offered, never produced`).toBe(true);
    }
  });

  it("the transfer cell lives ONLY in the L8 checkpoint", () => {
    for (const n of LESSONS) {
      if (n === 8) continue;
      expect(/\bvolver\b|\bvuelve\b/.test(lessonBlob(n)), `L${n}: transfer cell leaked outside the checkpoint`).toBe(false);
    }
    expect(/\bvuelve\b/.test(lessonBlob(8)), "L8 must carry the volver transfer beat").toBe(true);
  });

  it("the transfer pair is REGISTERED but never drilled", () => {
    // Registration is not teaching. The provenance gate bills every word of
    // every step — including a foil tile — so leaving volver/vuelve
    // unregistered fails unknownTokens (it did: 3 occurrences). m13 handles
    // «vacaciones» exactly this way: declared, then confined to L8 so the
    // learner still meets it cold. `vuelvo` is a form the module never uses.
    for (const surf of ["volver", "vuelve"]) {
      expect(ES_M14_ATOMS.some((a) => a.surface === surf), `«${surf}» must be registered`).toBe(true);
    }
    expect(ES_M14_ATOMS.some((a) => a.surface === "vuelvo"), "«vuelvo» is never used").toBe(false);
    // met cold means no picture to lean on
    for (const surf of ["volver", "vuelve"]) {
      const atom = ES_M14_ATOMS.find((a) => a.surface === surf);
      expect((atom as unknown as Record<string, unknown>).emoji, `«${surf}» must carry no emoji`).toBeUndefined();
    }
  });

  it("no preterite and no progressive anywhere", () => {
    const out = /\b(hablé|comí|fui|estuve|tuve|quise|pude|dormí|empecé|entendí|volví)\b|\b(estoy|está|están)\s+\w+ando\b|\b(estoy|está|están)\s+\w+iendo\b/;
    for (const { id, text } of allSurfaces()) {
      expect(out.test(text.toLowerCase()), `${id}: out-of-scope tense in «${text}»`).toBe(false);
    }
  });
});
