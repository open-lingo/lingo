/**
 * ES M18 curriculum guard — «Nosotros y ellos», the plural persons.
 * Single-author wave (2026-09-09). Shared lints at ZERO debt + shared
 * doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M18_ATOMS, ES_M18_LESSONS, ES_M18_PLACEMENT, ES_M18_CHECKPOINT_INDEX } from "./m18";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m18",
  lessons: ES_M18_LESSONS,
  atoms: ES_M18_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m18",
  lessons: ES_M18_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m18")),
});

registerEsDoctrinePins({
  moduleId: "m18",
  lessons: ES_M18_LESSONS,
  checkpointIndex: ES_M18_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m18", ES_M18_LESSONS, ES_M18_ATOMS);

const getLesson = (n: number) => ES_M18_LESSONS[n - 1].steps;
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** Learner-facing Spanish carried as a step's own sentence — ANSWER positions only. */
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

const lessonBlob = (n: number) => JSON.stringify(getLesson(n));

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

/** Every pick-one blank in the module. */
function blankOptionSets(): Array<{ id: string; correct: string; options: string[] }> {
  const out: Array<{ id: string; correct: string; options: string[] }> = [];
  for (const n of LESSONS) {
    for (const s of getLesson(n)) {
      if (s.type === "particle_cloze") out.push({ id: s.id, correct: s.correctParticle, options: [...(s.options ?? [])] });
      else if (s.type === "agreement_cloze") {
        for (const seg of s.segments) if ("blank" in seg) out.push({ id: `${s.id}/${seg.blank.id}`, correct: seg.blank.correctAnswer, options: [...seg.blank.options] });
      }
    }
  }
  return out;
}

const WE = ["hablamos", "comemos", "vivimos", "somos", "tenemos", "vamos", "estamos", "necesitamos"];
const THEY = ["hablan", "comen", "viven", "son", "tienen", "van", "están"];
const FUNCTION_WORD_ATOMS = ["nosotros", "ellos", "ellas", "ustedes", "somos", "son", "estamos", "están"];

describe("ES m18 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M18_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M18_PLACEMENT.screener.length).toBe(1);
    expect(ES_M18_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("every function-word atom is NAMED on a card before it is spent, in the lesson that spends it first", () => {
    // nosotros / ellos / ellas / ustedes / somos / son / estamos / están all sit
    // in ES_FUNCTION_WORDS; registering them as atoms makes inv 33 bite, and
    // this pin adds the ORDER: card first, then an intro-capable step.
    for (const w of FUNCTION_WORD_ATOMS) {
      const re = new RegExp(`(^|[\\s¿])${w}\\b`);
      const lesson = LESSONS.find((n) => allSurfaces([n]).some((s) => re.test(s.text.toLowerCase())));
      expect(lesson, `«${w}» is never spent in an answer position`).toBeDefined();
      const steps = getLesson(lesson!);
      const info = steps.findIndex((s) => s.type === "info" && new RegExp(`«${w}»`).test(JSON.stringify(s)));
      expect(info, `L${lesson}: no card names «${w}» before it is spent`).toBeGreaterThanOrEqual(0);
      const first = steps.findIndex((s) => {
        if (s.type === "word_map") return false; // the map is an unbilled preview (§13.3), not a spend
        const rec = s as unknown as Record<string, unknown>;
        return ["audioText", "targetPhrase", "targetSentence"].some((k) => re.test(String(rec[k] ?? "").toLowerCase()));
      });
      expect(first, `L${lesson}: «${w}» spent before its card`).toBeGreaterThan(info);
      expect(ES_INTRO_TYPES.has(steps[first].type), `L${lesson}: «${w}» first cashed on ${steps[first].type}, not intro-capable`).toBe(true);
    }
  });

  it("both plural endings are drilled: every -mos form and every -n form earns ≥3 answer positions", () => {
    const surfaces = allSurfaces().map((s) => s.text.toLowerCase());
    const count = (w: string) => surfaces.filter((t) => new RegExp(`\\b${w}\\b`).test(t)).length;
    const thin = [...WE.filter((w) => w !== "necesitamos"), ...THEY].filter((w) => count(w) < 3);
    expect(thin, `under-drilled plural forms: ${thin.map((w) => `${w}=${count(w)}`).join(", ")}`).toEqual([]);
  });

  it("FORM DISCIPLINE: only the twelve registered plural forms are ever produced; untaught plurals are banned", () => {
    // The verb table makes queremos / podemos / hacemos … PRIOR from m18;
    // non-table verbs (trabajar, comprar, necesitar …) have no plural
    // registered. Any -mos token outside the registered set is a leak.
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      for (const w of text.toLowerCase().replace(/[¿?¡!.,]/g, "").split(/\s+/)) {
        if (/mos$/.test(w) && !WE.includes(w)) bad.push(`${id}: «${w}»`);
      }
    }
    const bannedN = /\b(trabajan|estudian|compran|necesitan|buscan|quieren|queremos|pueden|podemos|hacen|hacemos|vienen|salen|duermen|entienden|empiezan|vuelven|escriben|leen|beben|reciben|visitan|cantan|bailan|nadan|cocinan|viajan|gustamos)\b/;
    for (const { id, text } of allSurfaces()) {
      const m = text.toLowerCase().match(bannedN);
      if (m) bad.push(`${id}: «${m[0]}»`);
    }
    expect(bad, `untaught plural forms produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("vosotros and nosotras are never printed anywhere (pin E3); «va» / «estoy» never reach a billed slot", () => {
    const vos = /\b(vosotros|vosotras|nosotras|habláis|coméis|vivís|sois|tenéis|vais|estáis)\b/;
    const leaked = LESSONS.filter((n) => vos.test(lessonBlob(n).toLowerCase()));
    expect(leaked, "a vosotros / nosotras form is printed").toEqual([]);
    const untaught = /\b(va|estoy)\b/;
    const bad = [...allSurfaces(), ...billedFoilSlots()].filter((s) => untaught.test(s.text.toLowerCase())).map((s) => `${s.id}: «${s.text}»`);
    expect(bad, `an untaught singular cell reached a billed slot:\n${bad.join("\n")}`).toEqual([]);
  });

  it("«ustedes» always takes the -n ending in answers, never -mos", () => {
    const bad = allSurfaces().filter((s) => /\bustedes\s+(no\s+)?\w+mos\b/.test(s.text.toLowerCase())).map((s) => `${s.id}: «${s.text}»`);
    expect(bad, `ustedes with a we ending:\n${bad.join("\n")}`).toEqual([]);
    expect(allSurfaces().filter((s) => /\bustedes\s+(hablan|comen|viven|son|tienen|van|están)\b/.test(s.text.toLowerCase())).length, "«ustedes + -n» is under-drilled").toBeGreaterThanOrEqual(6);
  });

  it("ser / estar are contrasted in the plural on blanks with both halves live", () => {
    const sets = blankOptionSets();
    expect(sets.length, "no blanks found — the pin would be vacuous").toBeGreaterThan(0);
    const contrast = sets.filter((b) => (b.options.includes("somos") && b.options.includes("estamos")) || (b.options.includes("son") && b.options.includes("están")));
    expect(contrast.length, "no blank ever makes the learner choose ser vs estar in the plural").toBeGreaterThanOrEqual(2);
  });

  it("the transfer cell «necesitamos» lives ONLY in the L8 checkpoint, in exactly one step, and is produced", () => {
    const outside = LESSONS.filter((n) => n !== 8 && /\bnecesitamos\b/.test(lessonBlob(n).toLowerCase()));
    expect(outside, `transfer verb leaked out of the checkpoint: ${outside.map((n) => `L${n}`).join(", ")}`).toEqual([]);
    const carriers = getLesson(8).filter((s) => /\bnecesitamos\b/.test(JSON.stringify(s).toLowerCase()));
    expect(carriers.length, "«necesitamos» must appear in exactly one checkpoint step").toBe(1);
    expect(ES_INTRO_TYPES.has(carriers[0].type), "the transfer step must be intro-capable").toBe(true);
    expect(allSurfaces([8]).some((s) => /\bnecesitamos\b/.test(s.text.toLowerCase())), "the transfer never makes the learner produce «necesitamos»").toBe(true);
  });

  it("hacer ruling (B112) carries: hacemos / hacen never produced; tenemos / tienen ARE taught here", () => {
    const bad = allSurfaces().filter((s) => /\b(hacemos|hacen)\b/.test(s.text.toLowerCase())).map((s) => s.id);
    expect(bad).toEqual([]);
    expect(allSurfaces().some((s) => /\btenemos\b/.test(s.text.toLowerCase()))).toBe(true);
  });

  it("no cloze blank ever sits inside a question", () => {
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
      for (const re of [/\b(hablaron|comieron|vivieron|fuimos|fueron|tuvimos|tuvieron|estuvimos|estuvieron)\b/, /\bestamos\s+\w+ndo\b/]) {
        const m = blob.match(re);
        if (m) bad.push(`L${n}: «${m[0]}»`);
      }
    }
    expect(bad, `out-of-scope tense:\n${bad.join("\n")}`).toEqual([]);
  });
});
