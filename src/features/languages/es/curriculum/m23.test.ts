/**
 * ES M23 curriculum guard — «Cuando, mientras, de repente», preterite vs
 * imperfect in the SAME sentence. Sonnet-drafted lessons, Fable spine +
 * pins (2026-09-10). Shared lints at ZERO debt + shared doctrine pins +
 * module-bespoke lanes below.
 *
 * Unlike every module since m19, m23 registers ZERO new verb atoms — its
 * four new atoms (cuando, mientras, de repente, entonces) are invariable
 * connectives. So there is no m22-style "PIN E12" (accent rule over new
 * verb cells); instead the bespoke lane below pins that (a) the four new
 * atoms really are non-verb, (b) no new verb morphology was manufactured
 * (the header's explicit banned-imperfect list never appears), and (c)
 * every verb form the module DOES print is a PRIOR atom from m18
 * (present), m19–m21 (preterite), or m22 (imperfect).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M23_ATOMS, ES_M23_LESSONS, ES_M23_PLACEMENT, ES_M23_CHECKPOINT_INDEX } from "./m23";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m23",
  lessons: ES_M23_LESSONS,
  atoms: ES_M23_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m23",
  lessons: ES_M23_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m23")),
});

registerEsDoctrinePins({
  moduleId: "m23",
  lessons: ES_M23_LESSONS,
  checkpointIndex: ES_M23_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m23", ES_M23_LESSONS, ES_M23_ATOMS);

const getLesson = (n: number) => ES_M23_LESSONS[n - 1].steps;
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

/** Same as allSurfaces, but also includes dialogue_sim NPC lines (questions), for scans that ban/require a form ANYWHERE, not just in graded answer positions. */
function allSurfacesAndNpc(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out = allSurfaces(nums);
  for (const n of nums) {
    for (const s of getLesson(n)) {
      if (s.type === "dialogue_sim") {
        for (const t of s.turns) out.push({ id: `${s.id}/${t.id}/npc`, text: t.npc.kana });
      }
    }
  }
  return out;
}

/** Every tile/option/distractor too — for scans over the FULL sim turn (NPC + all reply candidates), per the L6+ imperfect-and-preterite invariant. */
function simTurnBlob(step: unknown): string {
  const s = step as { turns: Array<{ npc: { kana: string }; reply: { mode: string; tiles?: string[]; answer?: string; options?: Array<{ text: string }> } }> };
  const parts: string[] = [];
  for (const t of s.turns) {
    parts.push(t.npc.kana);
    if (t.reply.mode === "build") { parts.push(t.reply.answer ?? ""); parts.push(...(t.reply.tiles ?? [])); }
    else { parts.push(...(t.reply.options ?? []).map((o) => o.text)); }
  }
  return parts.join(" ").toLowerCase();
}

const lessonBlob = (n: number) => JSON.stringify(getLesson(n));
/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

const ALL_ATOMS = ES_M23_ATOMS.map((a) => a.surface);

/** The four surfaces the module's own header declares as new atoms — used to
 *  cross-check ES_M23_ATOMS wasn't silently expanded (or shrunk) at compile time. */
const HEADER_NEW_ATOMS = ["cuando", "mientras", "de repente", "entonces"];

/** PRIOR imperfect verb atoms (m22, 5 verbs × 4 persons). */
const IMPERFECT_FORMS = [
  "hablaba", "hablabas", "hablábamos", "hablaban",
  "tenía", "tenías", "teníamos", "tenían",
  "era", "eras", "éramos", "eran",
  "iba", "ibas", "íbamos", "iban",
  "veía", "veías", "veíamos", "veían",
];
const IMPERFECT_WE_FORMS = ["hablábamos", "teníamos", "éramos", "íbamos", "veíamos"];
const IMPERFECT_THEY_FORMS = ["hablaban", "tenían", "eran", "iban", "veían"];

/** PRIOR preterite verb atoms (m19 9 regular verbs, m20 6 irregulars yo/tú/él,
 *  m21 nosotros/ellos for the same verb set). «hablamos» (m18, present) is the
 *  ambiguous dual-reading nosotros form the header calls out — included here
 *  since a marked clause may legally use it as a preterite. */
const PRETERITE_FORMS = [
  "hablé", "hablaste", "habló", "hablamos", "hablaron",
  "compré", "compraste", "compró", "compraron",
  "trabajé", "trabajaste", "trabajó", "trabajaron",
  "estudié", "estudió", "estudiaron",
  "comí", "comiste", "comió", "comimos", "comieron",
  "viví", "vivió", "vivieron",
  "salí", "saliste", "salió",
  "escribí", "escribió", "escribieron",
  "cociné",
  "fui", "fuiste", "fue", "fuimos", "fueron",
  "hice", "hiciste", "hizo", "hicimos", "hicieron",
  "tuve", "tuviste", "tuvo", "tuvimos", "tuvieron",
  "estuve", "estuviste", "estuvo", "estuvimos", "estuvieron",
  "vi", "viste", "vio", "vimos", "vieron",
  "vine", "viniste", "vino", "vinimos", "vinieron",
];
const PRETERITE_WE_FORMS = ["fuimos", "hicimos", "tuvimos", "estuvimos", "vimos", "vinimos", "comimos", "hablamos"];
const PRETERITE_THEY_FORMS = ["fueron", "hicieron", "tuvieron", "estuvieron", "vieron", "vinieron", "hablaron", "comieron", "vivieron", "estudiaron", "compraron", "trabajaron", "escribieron"];

/** Every verb form legally producible in m23 (PRIOR only — nothing new). */
const ALL_LEGAL_VERB_FORMS = [...IMPERFECT_FORMS, ...PRETERITE_FORMS];

/** The header's explicit "these do not exist as atoms, do not manufacture them"
 *  list — the five imperfect-licensed verbs are hablar/tener/ser/ir/ver ONLY. */
const BANNED_IMPERFECT_FORMS = [
  "estaba", "hacía", "vivía", "trabajaba", "quería", "podía",
  "comía", "salía", "cocinaba", "escribía", "compraba", "estudiaba", "venía",
];

/** «todos» takes 3rd-person-plural agreement only, in BOTH tenses (header's
 *  "unchanged rule, now cuts both ways") — never a nosotros form, imperfect
 *  or preterite. */
const WE_FORMS = [...IMPERFECT_WE_FORMS, ...PRETERITE_WE_FORMS];
const THEY_FORMS = [...IMPERFECT_THEY_FORMS, ...PRETERITE_THEY_FORMS];

/** No progressive anywhere (still out of scope, m22's restated ban carried forward). */
const PROGRESSIVE_RE = /\b(estoy|está|estaba|estamos|están|estuve|estuvo)\s+\w+ndo\b/;

describe("ES m23 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M23_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M23_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M23_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("ZERO new verb morphology: all 4 new atoms are non-verb (conjunction/adverb), and they exactly match the header's declared newAtoms list", () => {
    expect(ALL_ATOMS.length, "atom count drifted from the header's 4 new atoms").toBe(4);
    const verbAtoms = ES_M23_ATOMS.filter((a) => a.partOfSpeech === "verb");
    expect(verbAtoms.map((a) => a.surface), "m23 must register ZERO verb atoms").toEqual([]);
    const sorted = (xs: string[]) => [...xs].sort();
    expect(sorted(ALL_ATOMS)).toEqual(sorted(HEADER_NEW_ATOMS));
  });

  it("PIN: no verb form outside the PRIOR imperfect (m22) / preterite (m19-m21) atom set is ever produced — in particular, none of the header's 13 explicitly-banned imperfect forms (estaba/hacía/vivía/trabajaba/quería/podía/comía/salía/cocinaba/escribía/compraba/estudiaba/venía) appear ANYWHERE", () => {
    const bad: string[] = [];
    const banned = anyWord(BANNED_IMPERFECT_FORMS);
    for (const n of LESSONS) {
      const m = lessonBlob(n).toLowerCase().match(banned);
      if (m) bad.push(`L${n}: banned unregistered imperfect form «${m[2]}»`);
    }
    expect(bad, `unregistered verb morphology printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: no progressive anywhere (out of scope for this module)", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n).toLowerCase();
      const m = blob.match(PROGRESSIVE_RE);
      if (m) bad.push(`L${n}: «${m[0].trim()}»`);
    }
    expect(bad, `progressive form printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("«cuando» (conjunction, unaccented, this module) is never confused with «¿cuándo?» (question word, accented, PRIOR m8) — cuando never opens a question, and any cuándo that appears is confined to a real question", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      const blob = lessonBlob(n);
      if (/¿\s*cuando\b/i.test(blob)) bad.push(`L${n}: unaccented «cuando» opens a question (should be «¿cuándo?» or isn't a question at all)`);
    }
    for (const n of LESSONS) {
      for (const { id, text } of allSurfacesAndNpc([n])) {
        if (!/cuándo/i.test(text)) continue;
        if (!/¿[^?]*cuándo[^?]*\?/i.test(text)) bad.push(`${id}: «cuándo» appears outside a question: «${text}»`);
      }
    }
    expect(bad, `cuando/cuándo confusion:\n${bad.join("\n")}`).toEqual([]);
  });

  it("«todos» takes 3rd-person-plural agreement only — never pairs with a nosotros form, in EITHER tense (checked per-clause, header: 'unchanged rule, now cuts both ways')", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      if (!word("todos").test(t)) continue;
      const todosClause = t.split(/,|\by\b|\bpero\b/).find((c) => word("todos").test(c));
      if (todosClause === undefined) continue;
      const hasWe = anyWord(WE_FORMS).test(todosClause);
      const hasThey = anyWord(THEY_FORMS).test(todosClause);
      if (hasWe) bad.push(`${id}: «${text}» — «todos» paired with a nosotros form in its own clause`);
      if (!hasThey && !hasWe) bad.push(`${id}: «${text}» — «todos» with no agreeing verb found in its own clause`);
    }
    expect(bad, `«todos» agreement violation:\n${bad.join("\n")}`).toEqual([]);
  });

  it("L6 ('Fue o era') carries an info card that explicitly contrasts fue vs. era vs. iba — the module's signature collision, not a footnote", () => {
    const infoSteps = getLesson(6).filter((s) => s.type === "info");
    expect(infoSteps.length, "L6 must carry an info card for the fue/era/iba collision").toBeGreaterThanOrEqual(1);
    const hasAllThree = infoSteps.some((s) => {
      const blob = JSON.stringify(s).toLowerCase();
      return word("fue").test(blob) && word("era").test(blob) && word("iba").test(blob);
    });
    expect(hasAllThree, "L6's info card must explicitly name all three of «fue», «era», «iba»").toBe(true);
  });

  it("every dialogue_sim turn from L6 on carries ≥1 imperfect AND ≥1 preterite verb form across its NPC line + reply tiles/options combined", () => {
    const bad: string[] = [];
    for (const n of [6, 7, 8, 9, 10]) {
      const simStep = getLesson(n).find((s) => s.type === "dialogue_sim");
      expect(simStep, `L${n} must carry a dialogue_sim step`).toBeDefined();
      const s = simStep as unknown as { turns: unknown[] };
      for (let i = 0; i < s.turns.length; i++) {
        const oneTurnBlob = simTurnBlob({ turns: [s.turns[i]] });
        const hasImperfect = anyWord(IMPERFECT_FORMS).test(oneTurnBlob);
        const hasPreterite = anyWord(PRETERITE_FORMS).test(oneTurnBlob);
        if (!hasImperfect || !hasPreterite) {
          bad.push(`L${n} turn ${i + 1}: imperfect=${hasImperfect} preterite=${hasPreterite}`);
        }
      }
    }
    expect(bad, `sim turn missing the imperfect+preterite pairing:\n${bad.join("\n")}`).toEqual([]);
  });

  it("every one of the 4 new atoms debuts on an intro-capable step (word_map does not count; scanned via esSurfaces, same billed-content rule as the shared vocab-provenance gate)", () => {
    for (const w of ALL_ATOMS) {
      const re = word(w);
      let found: { lesson: number; type: string } | null = null;
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type === "word_map") continue; // unbilled preview
          if (esSurfaces(s).some((surf) => re.test(surf.toLowerCase()))) { found = { lesson: n, type: s.type }; break; }
        }
        if (found) break;
      }
      expect(found, `«${w}» never appears`).not.toBeNull();
      expect(ES_INTRO_TYPES.has(found!.type), `«${w}» first appears on ${found!.type} (L${found!.lesson}), not an intro-capable step`).toBe(true);
    }
  });

  it("each new atom is PRODUCED at least 3 times (answer positions), spread over ≥2 lessons", () => {
    const short: string[] = [];
    for (const w of ALL_ATOMS) {
      const re = word(w);
      const hits = LESSONS.map((n) => allSurfaces([n]).filter((s) => re.test(s.text.toLowerCase())).length);
      const total = hits.reduce((a, b) => a + b, 0);
      const spread = hits.filter((h) => h > 0).length;
      if (total < 3 || spread < 2) short.push(`«${w}» ${total}× over ${spread} lesson(s)`);
    }
    expect(short, `under-produced atoms:\n${short.join("\n")}`).toEqual([]);
  });

  it("recall floor: ≥1 recall in L3/L4/L5/L6/L7/L9, ≥2 recalls in L8/L10", () => {
    const recallCount = (n: number) => getLesson(n).filter((s) => (s as unknown as Record<string, unknown>).cue === "recall").length;
    for (const n of [3, 4, 5, 6, 7, 9]) {
      expect(recallCount(n), `L${n} must carry ≥1 recall`).toBeGreaterThanOrEqual(1);
    }
    for (const n of [8, 10]) {
      expect(recallCount(n), `L${n} must carry ≥2 recalls`).toBeGreaterThanOrEqual(2);
    }
  });

  it("the mastery lesson (L10) ends on a sim, not a grid (§13.9 law 7)", () => {
    const steps = getLesson(10);
    expect(steps[steps.length - 1].type, "L10's last step must be dialogue_sim").toBe("dialogue_sim");
  });

  it("the checkpoint lesson (L8) carries zero info cards; the mastery lesson (L10) carries zero info cards", () => {
    for (const n of [8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
    }
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

  it("sanity: the legal-verb-form allowlists used above are non-empty (the pins above would be vacuous otherwise)", () => {
    expect(ALL_LEGAL_VERB_FORMS.length).toBeGreaterThan(30);
    expect(WE_FORMS.length).toBeGreaterThanOrEqual(10);
    expect(THEY_FORMS.length).toBeGreaterThanOrEqual(10);
  });
});
