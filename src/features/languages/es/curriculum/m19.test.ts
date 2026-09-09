/**
 * ES M19 curriculum guard — «Ayer hablé», the regular preterite (A2 opens).
 * Single-author wave (2026-09-09). Shared lints at ZERO debt + shared
 * doctrine pins + module-bespoke lanes below. Pin E12: every preterite cell
 * produced here must come from conjugationTables.ts.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M19_ATOMS, ES_M19_LESSONS, ES_M19_PLACEMENT, ES_M19_CHECKPOINT_INDEX } from "./m19";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES } from "../__tests__/moduleBarGuards";
import { ES_VERB_ENTRIES } from "../conjugationTables";

registerEsModuleContentLints({
  moduleId: "m19",
  lessons: ES_M19_LESSONS,
  atoms: ES_M19_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m19",
  lessons: ES_M19_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m19")),
});

registerEsDoctrinePins({
  moduleId: "m19",
  lessons: ES_M19_LESSONS,
  checkpointIndex: ES_M19_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m19", ES_M19_LESSONS, ES_M19_ATOMS);

const getLesson = (n: number) => ES_M19_LESSONS[n - 1].steps;
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

/** The preterite forms this module registers (everything with an accent-final
 *  -é/-ó/-í/-ió or the -aste/-iste ending), minus the transfer cell. */
const PRETERITE_ATOMS = ES_M19_ATOMS.map((a) => a.surface).filter((s) => /(é|ó|í|ió|aste|iste)$/.test(s) && !s.includes(" "));
const MARKERS = ["ayer", "anoche", "la semana pasada", "el fin de semana"];
const PRESENT_MARKERS = /\b(hoy|todos los días|mañana|ahora)\b/;

describe("ES m19 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M19_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M19_PLACEMENT.screener.length).toBe(1);
    expect(ES_M19_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("PIN E12: every preterite form produced is a cell of ES_VERB_ENTRIES — nothing hand-written", () => {
    const cells = new Set<string>();
    for (const v of ES_VERB_ENTRIES) for (const [k, f] of Object.entries(v.forms)) if (k.startsWith("preterite.")) cells.add(f);
    expect(PRETERITE_ATOMS.length, "no preterite atoms found — the pin would be vacuous").toBeGreaterThanOrEqual(20);
    const invented = PRETERITE_ATOMS.filter((s) => !cells.has(s));
    expect(invented, `preterite atoms that are not table cells: ${invented.join(", ")}`).toEqual([]);
    // and the singular-only discipline: no plural preterite cell anywhere in an answer
    const plural = /\b(\w+(aron|ieron|amos|imos|asteis|isteis))\b/;
    const bad = allSurfaces().filter((s) => {
      const m = s.text.toLowerCase().match(plural);
      // -amos / -imos are ALSO present-tense we-forms (m18); only flag the
      // unambiguous preterite plurals, and the present ones only when they
      // sit under a past marker
      if (!m) return false;
      if (/(aron|ieron|asteis|isteis)$/.test(m[1])) return true;
      return MARKERS.some((mk) => s.text.toLowerCase().includes(mk));
    }).map((s) => `${s.id}: «${s.text}»`);
    expect(bad, `plural preterite produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("ONLY REGULAR VERBS: no irregular preterite anywhere, not even an NPC line (m20's)", () => {
    const irregular = /\b(fui|fuiste|fue|hice|hiciste|hizo|tuve|tuviste|tuvo|estuve|estuviste|estuvo|vi|viste|vio|vine|viniste|vino|puse|pude|quise|dije|di|dio)\b/;
    const bad: string[] = [];
    for (const n of LESSONS) {
      const m = lessonBlob(n).toLowerCase().match(irregular);
      if (m) bad.push(`L${n}: «${m[0]}»`);
    }
    expect(bad, `irregular preterite printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("every registered preterite form debuts on an intro-capable step (the table does not make it PRIOR)", () => {
    for (const w of PRETERITE_ATOMS) {
      if (w === "cociné") continue; // transfer cell, pinned separately
      const re = new RegExp(`(^|[\\s¿"])${w}(?=[^\\p{L}]|$)`, "u");
      let found: { lesson: number; type: string } | null = null;
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type === "word_map") continue; // unbilled preview
          if (re.test(JSON.stringify(s).toLowerCase())) { found = { lesson: n, type: s.type }; break; }
        }
        if (found) break;
      }
      expect(found, `«${w}» never appears`).not.toBeNull();
      expect(ES_INTRO_TYPES.has(found!.type), `«${w}» first appears on ${found!.type} (L${found!.lesson}), not an intro-capable step`).toBe(true);
    }
  });

  it("the accent minimal pair (hablo/habló, compro/compró, estudio/estudió …) is drilled on live two-option blanks", () => {
    const sets = blankOptionSets();
    expect(sets.length).toBeGreaterThan(0);
    const strip = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const pairs = sets.filter((b) => b.options.length === 2 && strip(b.options[0]) === strip(b.options[1]) && b.options[0] !== b.options[1]);
    expect(pairs.length, "the now-vs-then accent pair is never a live two-option blank").toBeGreaterThanOrEqual(4);
  });

  it("markers and tenses agree: a past marker never sits with a present form, a present marker never with a preterite", () => {
    // \b is blind to accented letters, so the boundary is spelled out (a vacuous
    // pass here was caught 2026-09-09 — see prove-the-verifier-can-fail)
    const pastForm = new RegExp(`(^|[^\\p{L}])(${PRETERITE_ATOMS.join("|")})(?=[^\\p{L}]|$)`, "u");
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase();
      // split on the contrast joiners so «hoy estudio y ayer estudié» is judged per clause
      for (const clause of t.split(/,|\by\b|\bpero\b/)) {
        const hasPast = MARKERS.some((m) => clause.includes(m));
        const hasPresentMarker = PRESENT_MARKERS.test(clause);
        const hasPretForm = pastForm.test(clause);
        if (hasPresentMarker && hasPretForm) bad.push(`${id}: «${text}» (present marker + preterite)`);
        if (hasPast && /\b(hablo|compro|trabajo|estudio|como|vivo|salgo|escribo|habla|compra|trabaja|estudia|come|vive|sale|escribe)\b/.test(clause)) bad.push(`${id}: «${text}» (past marker + present form)`);
      }
    }
    expect(bad, `marker / tense disagreement:\n${bad.join("\n")}`).toEqual([]);
    for (const m of MARKERS) {
      const n = allSurfaces().filter((s) => s.text.toLowerCase().includes(m)).length;
      expect(n, `marker «${m}» is under-drilled (${n})`).toBeGreaterThanOrEqual(4);
    }
  });

  it("the transfer cell «cociné» lives ONLY in the L8 checkpoint, in exactly one step, and is produced", () => {
    const cocine = /(^|[^\p{L}])cociné(?=[^\p{L}]|$)/u;
    const outside = LESSONS.filter((n) => n !== 8 && cocine.test(lessonBlob(n).toLowerCase()));
    expect(outside, `transfer verb leaked out of the checkpoint: ${outside.map((n) => `L${n}`).join(", ")}`).toEqual([]);
    const carriers = getLesson(8).filter((s) => cocine.test(JSON.stringify(s).toLowerCase()));
    expect(carriers.length, "«cociné» must appear in exactly one checkpoint step").toBe(1);
    expect(ES_INTRO_TYPES.has(carriers[0].type), "the transfer step must be intro-capable").toBe(true);
    expect(allSurfaces([8]).some((s) => cocine.test(s.text.toLowerCase())), "the transfer never makes the learner produce «cociné»").toBe(true);
  });

  it("hacer / tener ruling (B112): hacer only as hago / haces / hace; no hacer or tener in the past", () => {
    const bad = allSurfaces().filter((s) => /\b(hacemos|hacen|hice|hizo|tuve|tuvo)\b/.test(s.text.toLowerCase())).map((s) => s.id);
    expect(bad).toEqual([]);
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

  it("no imperfect and no progressive anywhere (pin E7: preterite = simple past only)", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n).toLowerCase();
      for (const re of [/\b(hablaba|comía|vivía|trabajaba|compraba|estudiaba|salía|escribía)\b/, /\b(estoy|está|estaba)\s+\w+ndo\b/, /\bwas (speaking|eating|working|buying|studying|writing|living)\b/]) {
        const m = blob.match(re);
        if (m) bad.push(`L${n}: «${m[0]}»`);
      }
    }
    expect(bad, `out-of-scope tense / gloss:\n${bad.join("\n")}`).toEqual([]);
  });
});
