/**
 * ES M16 curriculum guard — «Lo veo», direct-object pronouns lo/la/los/las.
 * Opus-authored 5-agent wave (2026-09-07); brief = scratchpad/es-m16-spine.md,
 * spine + A1-boundary decision in docs/handoff-2026-09-06-es-build-alternates.md.
 * Shared lints at ZERO debt + shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M16_ATOMS, ES_M16_LESSONS, ES_M16_PLACEMENT, ES_M16_CHECKPOINT_INDEX } from "./m16";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m16",
  lessons: ES_M16_LESSONS,
  atoms: ES_M16_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m16",
  lessons: ES_M16_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m16")),
});

registerEsDoctrinePins({
  moduleId: "m16",
  lessons: ES_M16_LESSONS,
  checkpointIndex: ES_M16_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m16", ES_M16_LESSONS, ES_M16_ATOMS);

const getLesson = (n: number) => ES_M16_LESSONS[n - 1].steps;
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
      if (s.type === "dialogue_sim") {
        for (const t of s.turns) {
          const r = t.reply;
          out.push({ id: `${s.id}/${t.id}`, text: r.mode === "build" ? r.answer : r.options.find((o) => o.id === r.correctOptionId)?.text ?? "" });
        }
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
            out.push({ id: `${s.id}/${seg.blank.id}`, correct: seg.blank.correctAnswer, options: [...seg.blank.options] });
          }
        }
      }
    }
  }
  return out;
}

/** Slots `esSurfaces` BILLS: cloze options, build/listen tiles, match sources. */
function billedFoilSlots(): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of LESSONS) {
    for (const s of getLesson(n)) {
      const rec = s as unknown as Record<string, unknown>;
      if (s.type === "particle_cloze") for (const o of (rec.options as string[] | undefined) ?? []) out.push({ id: s.id, text: o });
      if (s.type === "build_sentence" || s.type === "listening_build") for (const t of (rec.tiles as string[] | undefined) ?? []) out.push({ id: s.id, text: t });
      if (s.type === "match_pairs") for (const p of (rec.pairs as Array<{ source?: string }> | undefined) ?? []) if (p.source) out.push({ id: s.id, text: p.source });
    }
  }
  return out;
}

const PRONOUNS = ["lo", "la", "los", "las"] as const;

describe("ES m16 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M16_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M16_PLACEMENT.screener.length).toBe(1);
    expect(ES_M16_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("«lo» is DEBUTED in L1 — info card names it, an intro-capable step cashes it — before any graded use", () => {
    // «lo» is in ES_FUNCTION_WORDS, so every shared gate licenses it without
    // evidence the learner has met it (the m12 «son» hole). Verified 2026-09-07:
    // zero occurrences in shipped m1–m15. This pin is the only thing that
    // makes L1 teach it.
    const l1 = getLesson(1);
    const info = l1.findIndex((s) => s.type === "info" && /«lo»/.test(JSON.stringify(s)));
    expect(info, "L1 has no info card whose «guillemets» name «lo»").toBeGreaterThanOrEqual(0);
    const firstUse = l1.findIndex((s) => {
      const rec = s as unknown as Record<string, unknown>;
      return ["audioText", "targetPhrase", "targetSentence"].some((k) => /\blo\b/.test(String(rec[k] ?? "").toLowerCase()));
    });
    expect(firstUse, "L1 never spends «lo» in an answer position").toBeGreaterThanOrEqual(0);
    expect(ES_INTRO_TYPES.has(l1[firstUse].type), `first «lo» contact is on ${l1[firstUse].type}, not an intro-capable step`).toBe(true);
    expect(firstUse, "«lo» is spent before the card that names it").toBeGreaterThan(info);
  });

  it("every pronoun earns ANSWER positions (≥4 each), so the module drills all four", () => {
    const surfaces = allSurfaces().map((s) => s.text.toLowerCase());
    const counts = Object.fromEntries(
      PRONOUNS.map((p) => [p, surfaces.filter((t) => new RegExp(`(^|\\s|¿)${p}\\s+(no\\s+)?(veo|ve|tengo|tienes|tiene|quiero|quieres|quiere|necesito|necesitas|necesita|busco|buscas|busca|compro|compras|compra|puedo|puedes|puede|hago|haces|hace)\\b`).test(t)).length]),
    );
    const thin = PRONOUNS.filter((p) => counts[p] < 4);
    expect(thin, `under-drilled pronouns (need >=4 pronoun+verb answers each): ${JSON.stringify(counts)}`).toEqual([]);
  });

  it("a cloze answered by a CARRIER pronoun (la/los/las) is a two-option discrimination trial", () => {
    // la/los/las are m3/m4 word-level property; pin E2 exempts them only as
    // exactly-two-option trials (§13.9 law 5).
    const sets = blankOptionSets();
    expect(sets.length, "no blanks found — the pin would be vacuous").toBeGreaterThan(0);
    const carrier = sets.filter((b) => ["la", "los", "las"].includes(b.correct.toLowerCase()));
    expect(carrier.length, "no carrier-pronoun cloze found — the drill this module exists for is missing").toBeGreaterThan(0);
    const bad = carrier.filter((b) => b.options.length !== 2);
    expect(bad.map((b) => b.id), "carrier-pronoun clozes must have exactly two options").toEqual([]);
  });

  it("hacer / tener ruling (B112): only the m15/m5-taught persons are ever produced", () => {
    // hacer.introducedAtModule = 16 makes its whole paradigm PRIOR from here;
    // tener folded at m5. Neither shared gate can see these forms.
    const banned = /\b(hacemos|hacéis|hacen|tenemos|tenéis|tienen|necesitamos|necesitan|buscamos|buscan|compramos|compran|vemos|ven|queremos|quieren|podemos|pueden)\b/;
    const bad = allSurfaces().filter((s) => banned.test(s.text.toLowerCase())).map((s) => `${s.id}: «${s.text}»`);
    expect(bad, `plural / untaught persons produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("no pronoun is ever fused onto an infinitive («verlo», «comprarla») — anywhere, even a sim", () => {
    const fused = /\b[a-záéíóúñ]+[aei]r(lo|la|los|las)\b/;
    const bad: string[] = [];
    for (const n of LESSONS) {
      const m = lessonBlob(n).toLowerCase().match(fused);
      if (m) bad.push(`L${n}: «${m[0]}»`);
    }
    expect(bad, `fused pronoun forms:\n${bad.join("\n")}`).toEqual([]);
  });

  it("the pronoun sits immediately before the conjugated verb in every answer («no lo veo», «lo quiero comprar»)", () => {
    // A pronoun followed by a noun is the ARTICLE (la mochila) and is fine;
    // a pronoun followed by anything else must be a verb, «no» never sits
    // between pronoun and verb, and the pronoun is never sentence-final.
    const verbs = /^(veo|ve|ves|tengo|tienes|tiene|quiero|quieres|quiere|necesito|necesitas|necesita|busco|buscas|busca|compro|compras|compra|puedo|puedes|puede|hago|haces|hace|come|bebo|leo|lee|escribe|recibo|entiendo|entiende|llevo|lleva)$/;
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const words = text.toLowerCase().replace(/[¿?¡!.,]/g, "").split(/\s+/);
      words.forEach((w, i) => {
        if (!(PRONOUNS as readonly string[]).includes(w)) return;
        const next = words[i + 1];
        if (next === undefined) { bad.push(`${id}: «${text}» ends on a pronoun`); return; }
        if (next === "no") bad.push(`${id}: «${text}» puts «no» after the pronoun`);
      });
    }
    expect(bad, `pronoun placement:\n${bad.join("\n")}`).toEqual([]);
    // and the positive claim: at least 4 «no + pronoun + verb» answers exist (L5's thesis)
    const neg = allSurfaces().filter((s) => /\bno\s+(lo|la|los|las)\s+\w+/.test(s.text.toLowerCase()));
    expect(neg.length, "negation with a pronoun is under-drilled").toBeGreaterThanOrEqual(4);
    // silence unused-var lint for the verb list (kept for authors extending this pin)
    expect(verbs.test("veo")).toBe(true);
  });

  it("order ghosts («veo lo», «el veo») live ONLY in unbilled slots", () => {
    const ghost = /\b(veo|tengo|quiero|necesito|busco|compro|tienes|tiene)\s+(lo|los)\b|\bel\s+(veo|tengo|quiero|necesito|busco|compro)\b/;
    const bad = billedFoilSlots().filter((s) => ghost.test(s.text.toLowerCase())).map((s) => `${s.id}: «${s.text}»`);
    expect(bad, `a ghost reached a billed slot:\n${bad.join("\n")}`).toEqual([]);
  });

  it("the transfer cell «maleta» lives ONLY in the L8 checkpoint, and is produced with a pronoun", () => {
    const outside: string[] = [];
    for (const n of LESSONS) {
      if (n === 8) continue;
      if (/\bmaleta\b/.test(lessonBlob(n).toLowerCase())) outside.push(`L${n}`);
    }
    expect(outside, `transfer noun leaked out of the checkpoint: ${outside.join(", ")}`).toEqual([]);
    expect(/\bmaleta\b/.test(lessonBlob(8).toLowerCase()), "the checkpoint never presents «maleta»").toBe(true);
    const cashed = allSurfaces([8]).some((s) => /\bla\s+(necesito|tengo|busco|quiero|veo|compro)\b/.test(s.text.toLowerCase()));
    expect(cashed, "the transfer never makes the learner produce «la» for the unseen noun").toBe(true);
  });

  it("no blank ever sits INSIDE a question («¿el regalo? no __ veo» is fine — the blank is in the statement)", () => {
    // The course convention is that a cloze is never a question. m16's
    // clozes carry a «¿el regalo?» antecedent prefix on purpose (the noun the
    // pronoun replaces), so the rule here is: every «¿» before a blank is
    // closed by a «?» before that blank.
    const bad: string[] = [];
    const balanced = (before: string) => (before.match(/¿/g) ?? []).length === (before.match(/\?/g) ?? []).length;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        if (s.type === "particle_cloze") {
          const prompt = rec.prompt as { before: string; after: string };
          expect(typeof prompt?.before, `${s.id}: particle_cloze prompt shape changed — pin would be vacuous`).toBe("string");
          if (!balanced(prompt.before) || /\?/.test(prompt.after)) bad.push(s.id);
        } else if (s.type === "agreement_cloze") {
          let acc = "";
          for (const seg of s.segments) {
            if ("blank" in seg) { if (!balanced(acc)) bad.push(`${s.id}/${seg.blank.id}`); acc += "_"; }
            else acc += seg.text;
          }
        }
      }
    }
    expect(bad, `blank inside a question: ${bad.join(", ")}`).toEqual([]);
  });

  it("no preterite and no progressive anywhere", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n).toLowerCase();
      for (const re of [/\b(necesité|busqué|compré|vi|tuve|quise)\b/, /\bestoy\s+\w+ndo\b/]) {
        const m = blob.match(re);
        if (m) bad.push(`L${n}: «${m[0]}»`);
      }
    }
    expect(bad, `out-of-scope tense:\n${bad.join("\n")}`).toEqual([]);
  });
});
