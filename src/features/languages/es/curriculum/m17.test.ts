/**
 * ES M17 curriculum guard — «Me levanto», reflexive verbs (me / te / se).
 * Single-author wave (2026-09-09); spine in docs/handoff-2026-09-06-es-build-alternates.md.
 * Shared lints at ZERO debt + shared doctrine pins + module-bespoke lanes below.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M17_ATOMS, ES_M17_LESSONS, ES_M17_PLACEMENT, ES_M17_CHECKPOINT_INDEX } from "./m17";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES } from "../__tests__/moduleBarGuards";
import { lingoArtUrl } from "@/shared/assets/notoEmoji";

registerEsModuleContentLints({
  moduleId: "m17",
  lessons: ES_M17_LESSONS,
  atoms: ES_M17_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m17",
  lessons: ES_M17_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m17")),
});

registerEsDoctrinePins({
  moduleId: "m17",
  lessons: ES_M17_LESSONS,
  checkpointIndex: ES_M17_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m17", ES_M17_LESSONS, ES_M17_ATOMS);

const getLesson = (n: number) => ES_M17_LESSONS[n - 1].steps;
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

const POINTERS = ["me", "te", "se"] as const;
const VERB = "(levanto|levantas|levanta|ducho|duchas|ducha|lavo|lava|despierto|despierta|acuesto|acuesta|llamo|llamas|llama|peino|quiero|quiere|quieres|puedo|puede)";

describe("ES m17 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M17_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M17_PLACEMENT.screener.length).toBe(1);
    expect(ES_M17_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("«se» is DEBUTED in L1 — the card names it, an intro-capable step cashes it — before any graded use", () => {
    // «se» is a registered particle atom (unlike m16's «lo»), so inv 33
    // already holds its first exposure; this pin adds the ORDER: card first.
    const l1 = getLesson(1);
    const info = l1.findIndex((s) => s.type === "info" && /«se»/.test(JSON.stringify(s)));
    expect(info, "L1 has no info card whose «guillemets» name «se»").toBeGreaterThanOrEqual(0);
    const firstUse = l1.findIndex((s) => {
      const rec = s as unknown as Record<string, unknown>;
      return ["audioText", "targetPhrase", "targetSentence"].some((k) => /\bse\b/.test(String(rec[k] ?? "").toLowerCase()));
    });
    expect(firstUse, "L1 never spends «se» in an answer position").toBeGreaterThanOrEqual(0);
    expect(ES_INTRO_TYPES.has(l1[firstUse].type), `first «se» contact is on ${l1[firstUse].type}, not an intro-capable step`).toBe(true);
    expect(firstUse, "«se» is spent before the card that names it").toBeGreaterThan(info);
  });

  it("every pointer earns ANSWER positions (≥5 each), so the module drills all three", () => {
    const surfaces = allSurfaces().map((s) => s.text.toLowerCase());
    const counts = Object.fromEntries(
      POINTERS.map((p) => [p, surfaces.filter((t) => new RegExp(`(^|\\s|¿)${p}\\s+${VERB}\\b`).test(t)).length]),
    );
    const thin = POINTERS.filter((p) => counts[p] < 5);
    expect(thin, `under-drilled pointers (need >=5 pointer+verb answers each): ${JSON.stringify(counts)}`).toEqual([]);
  });

  it("FORM DISCIPLINE: only registered persons are produced — no plural, no unregistered tú cell", () => {
    // lavas / peinas are real Spanish this module never
    // registered; every plural person is out of scope. The shared gates cannot
    // see most of these (hacer/tener/querer paradigms are PRIOR by table).
    const banned =
      /\b(nos|os)\s|\b(levantamos|levantan|levantáis|duchamos|duchan|ducháis|lavamos|lavan|laváis|lavas|despertamos|despiertan|acostamos|acuestan|llamamos|llaman|peinas|peina|hacemos|hacen|tenemos|tienen|queremos|quieren|podemos|pueden)\b/;
    const bad = allSurfaces().filter((s) => banned.test(s.text.toLowerCase())).map((s) => `${s.id}: «${s.text}»`);
    expect(bad, `plural / unregistered persons produced:\n${bad.join("\n")}`).toEqual([]);
    // and not even an NPC says them (header: «lavas» / «peinas» are never printed)
    const npc = /\b(lavas|peinas)\b/;
    const leaked = LESSONS.filter((n) => npc.test(lessonBlob(n).toLowerCase()));
    expect(leaked, "an unregistered tú cell is printed somewhere (NPC line, option, tile)").toEqual([]);
  });

  it("no pointer is ever fused onto an infinitive («levantarme», «ducharte») — anywhere, even a sim", () => {
    const fused = /\b(levantar|duchar|lavar|despertar|acostar|peinar|llamar)(me|te|nos|se)\b/;
    // the -se dictionary forms are the verbs' NAMES; «peinarse» is the L8 gloss (English prompt only)
    const allowedNames = new Set(["levantarse", "ducharse", "lavarse", "despertarse", "acostarse", "peinarse"]);
    const bad: string[] = [];
    for (const n of LESSONS) {
      for (const m of lessonBlob(n).toLowerCase().matchAll(new RegExp(fused, "g"))) {
        if (!allowedNames.has(m[0])) bad.push(`L${n}: «${m[0]}»`);
      }
    }
    expect(bad, `fused pointer forms:\n${bad.join("\n")}`).toEqual([]);
  });

  it("the dictionary form («levantarse») is printed only as the verb's NAME, never inside a sentence", () => {
    const bad = allSurfaces()
      .filter((s) => /\b(levantarse|ducharse|lavarse|despertarse|acostarse)\b/.test(s.text.toLowerCase()) && s.text.trim().split(/\s+/).length > 1)
      .map((s) => `${s.id}: «${s.text}»`);
    expect(bad, `a -se infinitive inside a sentence:\n${bad.join("\n")}`).toEqual([]);
    // and the bare verbs that are NOT registered never reach a billed slot
    const bare = /\b(acostar|despertar|lavar|peinar)\b/;
    const leaked = [...allSurfaces(), ...billedFoilSlots()].filter((s) => bare.test(s.text.toLowerCase())).map((s) => `${s.id}: «${s.text}»`);
    expect(leaked, `unregistered bare infinitive in a billed slot:\n${leaked.join("\n")}`).toEqual([]);
  });

  it("the pointer sits immediately before its verb in every answer; «no» / adverbs stay outside the pair", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const words = text.toLowerCase().replace(/[¿?¡!.,]/g, "").split(/\s+/);
      words.forEach((w, i) => {
        if (!(POINTERS as readonly string[]).includes(w)) return;
        const next = words[i + 1];
        if (next === undefined) { bad.push(`${id}: «${text}» ends on a pointer`); return; }
        if (["no", "siempre", "nunca", "también", "hoy", "tarde", "temprano", "levantar", "duchar"].includes(next)) {
          bad.push(`${id}: «${text}» puts «${next}» right after the pointer`);
        }
      });
    }
    expect(bad, `pointer placement:\n${bad.join("\n")}`).toEqual([]);
    const neg = allSurfaces().filter((s) => /\bno\s+(me|te|se)\s+\w+/.test(s.text.toLowerCase()));
    expect(neg.length, "«no + pointer + verb» is under-drilled").toBeGreaterThanOrEqual(4);
    const twoVerb = allSurfaces().filter((s) => /\b(me|te|se)\s+(quiero|quieres|quiere)\s+(levantar|duchar)\b/.test(s.text.toLowerCase()));
    expect(twoVerb.length, "the two-verb placement («me quiero levantar») is under-drilled").toBeGreaterThanOrEqual(6);
  });

  it("order / pair ghosts («levanto me», «se levanto», «me acosto») live ONLY in unbilled slots", () => {
    const ghost = /\b(levanto|ducho|lavo|despierto|acuesto|levanta|ducha)\s+(me|se|te)\b|\bse\s+(levanto|ducho|lavo|despierto|acuesto)\b|\bme\s+(levanta|ducha|lava|despierta|acuesta)\b|\bacosto\b/;
    const bad = [...billedFoilSlots(), ...allSurfaces()].filter((s) => ghost.test(s.text.toLowerCase())).map((s) => `${s.id}: «${s.text}»`);
    expect(bad, `a ghost reached a billed slot or an answer:\n${bad.join("\n")}`).toEqual([]);
    // the ghosts do exist as distractors — otherwise the contrast is untaught
    expect(LESSONS.some((n) => /se levanto|me acosto|levanto me/.test(lessonBlob(n).toLowerCase())), "no ghost is ever shown to be rejected").toBe(true);
  });

  it("the transfer cell «peino» lives ONLY in the L8 checkpoint, in exactly one step, produced with «me»", () => {
    const outside = LESSONS.filter((n) => n !== 8 && /\bpeino\b/.test(lessonBlob(n).toLowerCase()));
    expect(outside, `transfer verb leaked out of the checkpoint: ${outside.map((n) => `L${n}`).join(", ")}`).toEqual([]);
    const carriers = getLesson(8).filter((s) => /\bpeino\b/.test(JSON.stringify(s).toLowerCase()));
    expect(carriers.length, "«peino» must appear in exactly one checkpoint step").toBe(1);
    expect(ES_INTRO_TYPES.has(carriers[0].type), "the transfer step must be intro-capable").toBe(true);
    expect(allSurfaces([8]).some((s) => /\bme peino\b/.test(s.text.toLowerCase())), "the transfer never makes the learner produce «me peino»").toBe(true);
  });

  it("hacer / tener ruling (B112) carries: only the taught persons are ever produced", () => {
    const banned = /\b(hacemos|hacéis|hacen|tenemos|tenéis|tienen)\b/;
    const bad = allSurfaces().filter((s) => banned.test(s.text.toLowerCase())).map((s) => `${s.id}: «${s.text}»`);
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

  it("the three routine verbs carry generated custom art (keyed by their printed surface)", () => {
    for (const w of ["levantarse", "acostarse", "despertarse"]) {
      expect(lingoArtUrl("es", w), `no custom art keyed es:${w}`).toMatch(/vocab\/es\//);
    }
  });

  it("no preterite and no progressive anywhere", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n).toLowerCase();
      for (const re of [/\b(levanté|duché|acosté|desperté|lavé|llamé)\b/, /\bestoy\s+\w+ndo\b/]) {
        const m = blob.match(re);
        if (m) bad.push(`L${n}: «${m[0]}»`);
      }
    }
    expect(bad, `out-of-scope tense:\n${bad.join("\n")}`).toEqual([]);
  });
});
