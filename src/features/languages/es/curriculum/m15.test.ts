/**
 * ES M15 curriculum guard — «Hago, vengo», the module where the yo form goes
 * its own way. Opus-authored 5-agent wave (2026-09-02); brief =
 * scratchpad/es-m15-spine.md, spine settled in
 * docs/handoff-2026-09-02-es-m11-m15.md. Shared lints at ZERO debt +
 * shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M15_ATOMS, ES_M15_LESSONS, ES_M15_PLACEMENT, ES_M15_CHECKPOINT_INDEX } from "./m15";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";

registerEsModuleContentLints({
  moduleId: "m15",
  lessons: ES_M15_LESSONS,
  atoms: ES_M15_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m15",
  lessons: ES_M15_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m15")),
});

registerEsDoctrinePins({
  moduleId: "m15",
  lessons: ES_M15_LESSONS,
  checkpointIndex: ES_M15_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m15", ES_M15_LESSONS, ES_M15_ATOMS, {
  // «poner» is the transfer pair's didn't-conjugate foil; «pongo» is produced.
  neverProduced: ["poner"],
});

const getLesson = (n: number) => ES_M15_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Learner-facing Spanish carried as a step's own sentence — ANSWER positions
 *  only. Modules print wrong Spanish on purpose as foils; grading those would
 *  grade the pedagogy. */
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

/** Slots `esSurfaces` BILLS: a fabricated form in any of these is an
 *  untracked word. MCQ distractors and dialogue_sim are NOT billed. */
function billedFoilSlots(): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of LESSONS) {
    for (const s of getLesson(n)) {
      const rec = s as unknown as Record<string, unknown>;
      if (s.type === "particle_cloze") {
        for (const o of (rec.options as string[] | undefined) ?? []) out.push({ id: s.id, text: o });
      }
      if (s.type === "build_sentence" || s.type === "listening_build") {
        for (const t of (rec.tiles as string[] | undefined) ?? []) out.push({ id: s.id, text: t });
      }
      if (s.type === "match_pairs") {
        for (const p of (rec.pairs as Array<{ source?: string }> | undefined) ?? []) {
          if (p.source) out.push({ id: s.id, text: p.source });
        }
      }
    }
  }
  return out;
}

/** The over-regularised spellings the module exists to kill. Real Spanish
 *  refuses every one of them. */
const GHOSTS = /\b(haco|veno|salo|vego|teno|tieno|pono|poño)\b/;

describe("ES m15 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M15_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M15_PLACEMENT.screener.length).toBe(1);
    expect(ES_M15_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("FORM DISCIPLINE: only the registered persons are ever produced", () => {
    // The header registers yo/tú/él for hacer, yo/él for venir and salir, and
    // yo/él for ver — plus the bare infinitives. Every form below is real
    // Spanish this module never taught, so producing one grades the learner on
    // an unmet form. `unknownTokens` cannot see most of these: hacer sits in
    // ES_VERB_ENTRIES so its whole paradigm is in the real-form lexicon, and
    // tener's forms fold into PRIOR at introducedAtModule 5. This lane is
    // hand-enforced for exactly that reason.
    const unregistered =
      /\b(hacemos|hacen|hacéis|vienes|venimos|vienen|venís|sales|salimos|salen|salís|ves|vemos|ven|veis|tenemos|tienen|tenéis|pones|pone|ponemos|ponen|ponéis)\b/;
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      if (unregistered.test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `unregistered verb forms produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("THE THESIS: no ghost form is ever an answer", () => {
    // «haco», «veno», «salo», «vego» are what a learner who has NOT understood
    // the module would build. The module shows them on purpose — but only ever
    // as something to reject.
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      if (GHOSTS.test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `a ghost reached an answer position:\n${bad.join("\n")}`).toEqual([]);
  });

  it("ghosts live ONLY in unbilled slots, never in a cloze option or a tile", () => {
    // esSurfaces bills particle_cloze options, build/listening_build tiles and
    // match_pairs sources. A fabricated form in any of those is an untracked
    // word and fails provenance. It is unbilled — and therefore legal — only
    // in an MCQ distractor or inside a dialogue_sim.
    const slots = billedFoilSlots();
    expect(slots.length, "no billed foil slots found — this pin would be vacuous").toBeGreaterThan(20);
    const bad = slots
      .filter((s) => GHOSTS.test(s.text.toLowerCase()))
      .map((s) => `${s.id}: «${s.text}» sits in a BILLED slot`);
    expect(bad, `ghost in a billed slot:\n${bad.join("\n")}`).toEqual([]);
  });

  it("a cloze answered by a CARRIER is a two-option discrimination trial", () => {
    // tengo/tienes/tiene resolve to m5 and voy/vas to m9, so pin E2 reads them
    // as prior-module atoms. They survive only on the §13.9 law 5 exemption:
    // EXACTLY two options, both taught.
    const carriers = new Set(["tengo", "tienes", "tiene", "voy", "vas", "va", "quiero"]);
    const blanks = blankOptionSets();
    expect(blanks.length, "no blanks found — this pin would be vacuous").toBeGreaterThan(0);
    const carrierBlanks = blanks.filter((b) => carriers.has(b.correct.toLowerCase()));
    expect(carrierBlanks.length, "no carrier-answered blank — the carrier set is stale").toBeGreaterThan(0);
    const bad = carrierBlanks
      .filter((b) => b.options.length !== 2)
      .map((b) => `${b.id}: «${b.correct}» is a prior-module atom with ${b.options.length} options`);
    expect(bad, `pin E2 needs exactly 2 options:\n${bad.join("\n")}`).toEqual([]);
  });

  it("all five -go verbs are really drilled, not just named", () => {
    const surfaces = allSurfaces().map((s) => s.text.toLowerCase());
    const counts: Record<string, number> = {};
    for (const form of ["hago", "vengo", "salgo", "veo", "pongo"]) {
      counts[form] = surfaces.filter((t) => new RegExp(`\\b${form}\\b`).test(t)).length;
    }
    // «pongo» is the transfer cell and is deliberately met exactly once.
    expect(counts.pongo, "the transfer form must appear exactly once").toBe(1);
    const thin = ["hago", "vengo", "salgo", "veo"].filter((f) => counts[f] < 4);
    expect(thin, `under-drilled -go forms (need >=4 answers each): ${JSON.stringify(counts)}`).toEqual([]);
  });

  it("«veo» is taught as the exception that does NOT take -go", () => {
    // The whole point of ver in this module: it is the family member whose yo
    // form is irregular WITHOUT a g. If «vego» ever became an answer the
    // module would teach the opposite of its thesis — covered above — but the
    // positive claim also has to hold.
    const surfaces = allSurfaces().map((s) => s.text.toLowerCase());
    expect(surfaces.some((t) => /\bveo\b/.test(t)), "«veo» is never produced").toBe(true);
  });

  it("«ve» can never be read as the imperative of «ir»", () => {
    // «ve» is él-of-ver here, but bare «ve» also spells "go!" — and «ve a…»
    // reads as the ir imperative the course teaches in m9. Fence it
    // structurally: never sentence-initial, never followed by a/al.
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase().trim();
      if (/^ve\b/.test(t)) bad.push(`${id}: «${text}» starts with «ve»`);
      if (/\bve\s+al?\b/.test(t)) bad.push(`${id}: «${text}» reads as the ir imperative`);
    }
    expect(bad, `«ve» ambiguity:\n${bad.join("\n")}`).toEqual([]);
  });

  it("every registered atom earns an ANSWER position, not a distractor slot", () => {
    // registerEsAtomUsagePin only checks that a surface appears SOMEWHERE in
    // the lesson JSON — a distractor satisfies it. This is the real check.
    const surfaces = allSurfaces().map((s) => s.text.toLowerCase());
    const missing: string[] = [];
    for (const atom of ES_M15_ATOMS) {
      const surf = atom.surface.toLowerCase();
      // «poner» is the transfer cell's didn't-conjugate foil. It is registered
      // so the provenance gate can see it, and must NEVER be produced.
      if (surf === "poner") continue;
      if (!surfaces.some((t) => new RegExp(`\\b${surf.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(t))) {
        missing.push(surf);
      }
    }
    expect(missing, `atoms that never reach an answer: ${missing.join(", ")}`).toEqual([]);
  });

  it("the transfer cell lives ONLY in the L8 checkpoint", () => {
    const outside: string[] = [];
    for (const n of LESSONS) {
      if (n === 8) continue;
      if (/\bpon(er|go)\b/.test(lessonBlob(n).toLowerCase())) outside.push(`L${n}`);
    }
    expect(outside, `transfer pair leaked out of the checkpoint: ${outside.join(", ")}`).toEqual([]);
  });

  it("the transfer pair is REGISTERED but «poner» is never drilled", () => {
    // Registration is legibility for the provenance gate, not teaching. m14's
    // volver/vuelve set this precedent; m15 follows it exactly.
    const ids = new Set(ES_M15_ATOMS.map((a) => a.surface));
    expect(ids.has("poner"), "«poner» must be registered so unknownTokens can see it").toBe(true);
    expect(ids.has("pongo"), "«pongo» must be registered").toBe(true);
    const produced = allSurfaces().filter((s) => /\bponer\b/.test(s.text.toLowerCase()));
    expect(produced.map((p) => p.id), "«poner» must never be an answer").toEqual([]);
  });

  it("no preterite and no progressive anywhere", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n).toLowerCase();
      for (const re of [/\b(hice|hiciste|vine|viniste|salí|saliste|vi|viste|puse)\b/, /\bestoy\s+\w+ndo\b/]) {
        const m = blob.match(re);
        if (m) bad.push(`L${n}: «${m[0]}»`);
      }
    }
    expect(bad, `out-of-scope tense:\n${bad.join("\n")}`).toEqual([]);
  });
});
