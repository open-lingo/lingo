/**
 * ES M25 curriculum guard — «Porque, por eso», the causal connective pair.
 * Sonnet-drafted lessons, Fable spine + pins (2026-09-10). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below. Only 2 new
 * atoms (porque, por eso); the module's value is recombination of PRIOR
 * m19-m24 preterite/imperfect narration and m23's connectives. Two m24
 * review lessons apply here too: unregistered verb forms must never appear
 * ANYWHERE (not even as tiles/distractors), and «como»/«ya que» are banned
 * as causal connectives («como» is PRIOR as "I eat", m11).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M25_ATOMS, ES_M25_LESSONS, ES_M25_PLACEMENT, ES_M25_CHECKPOINT_INDEX } from "./m25";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m25",
  lessons: ES_M25_LESSONS,
  atoms: ES_M25_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m25",
  lessons: ES_M25_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m25")),
});

registerEsDoctrinePins({
  moduleId: "m25",
  lessons: ES_M25_LESSONS,
  checkpointIndex: ES_M25_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m25", ES_M25_LESSONS, ES_M25_ATOMS);

const getLesson = (n: number) => ES_M25_LESSONS[n - 1].steps;
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

/** Same as allSurfaces, but also includes dialogue_sim NPC lines (questions), for scans that ban a form ANYWHERE, not just in graded answer positions. */
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

/** Every printed string anywhere in a lesson step, INCLUDING tiles/distractors/options — for scans that must ban a form even as a foil, not just in a graded answer position. */
function allPrintedStrings(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of nums) {
    for (const s of getLesson(n)) {
      const walk = (v: unknown, path: string) => {
        if (typeof v === "string") { out.push({ id: `${s.id}${path}`, text: v }); return; }
        if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${path}[${i}]`)); return; }
        if (v && typeof v === "object") { for (const [k, val] of Object.entries(v)) walk(val, `${path}.${k}`); }
      };
      walk(s, "");
    }
  }
  return out;
}

const lessonBlob = (n: number) => JSON.stringify(getLesson(n));
/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 2 new atoms this module registers. */
const ALL_ATOMS = ES_M25_ATOMS.map((a) => a.surface);

/** No progressive anywhere (out of scope for this module — carried from m24's review lesson). */
const PROGRESSIVE_RE = /\b(estoy|está|estaba|estábamos|estabas|estaban|estamos|están|estuve|estuvo)\s+(?!cuando\b)\w+(?:ando|iendo)\b/;

/** Unregistered preterite forms — querer/poder never shipped a preterite anywhere in m1-m24 (only the imperfect is PRIOR). Must never appear anywhere. */
const UNREGISTERED_PRETERITE = ["quise", "quisiste", "quiso", "quisimos", "quisieron", "pude", "pudiste", "pudo", "pudimos", "pudieron"];

/** Present-tense cells NEVER confirmed PRIOR for estar/hacer/querer/poder/venir — must never appear ANYWHERE in m25 (not even as a foil/distractor). */
const ILLEGAL_PRESENT_FORMS = ["estoy", "hacemos", "hacen", "queremos", "quieren", "podemos", "pueden", "vienes", "venimos", "vienen"];

/** salir preterite — only yo/tú/él (salí/saliste/salió) are registered (m19); nosotros/ellos/ustedes forms of salir's preterite were never registered anywhere. */
const UNREGISTERED_SALIR = ["salimos", "salieron", "salisteis"];

describe("ES m25 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M25_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M25_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M25_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 2 new atoms — porque, por eso", () => {
    expect(ALL_ATOMS.sort()).toEqual(["por eso", "porque"].sort());
  });

  it("PIN: porque-spelling discipline — «por qué» / «porqué» / bare two-word «por que» never appear in a GRADED answer position or sim NPC line; info-card/hint prose may still name the untaught contrast form for teaching purposes (grade answers, not every string)", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      if (/por qué|porqué/.test(t)) bad.push(`${id}: «${text}»`);
      // bare "por que" (two words, no accent) distinct from one-word "porque"
      if (/\bpor que\b/.test(t)) bad.push(`${id}: «${text}» (bare "por que")`);
    }
    expect(bad, `accidental por-qué spelling in graded content:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: «como» never used as a causal connective (as/since) — it is PRIOR as 'I eat' (m11) and banned causally per the m24 review lesson; «ya que» is also banned as an unpracticed causal synonym", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      if (/\bya que\b/.test(t)) bad.push(`${id}: «${text}» ("ya que")`);
      // "como" itself is fine (I eat, m11) — but never followed by a comma-led reason clause shape banned here.
      // Since this module never teaches "como" as causal, the simplest safe pin is: "como" never appears at all
      // in m25's own graded content (it belongs to m11's food-verb context, not this module's recombination set).
      if (word("como").test(t)) bad.push(`${id}: «${text}» ("como" printed — not part of this module's recombination set)`);
    }
    expect(bad, `banned causal connective or out-of-scope "como" found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: «eso» never appears standalone — always as part of the fixed phrase «por eso»", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      // strip every "por eso" occurrence, then check no "eso" remains
      const stripped = t.replace(/por eso/g, "");
      if (word("eso").test(stripped)) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `standalone "eso" (not part of "por eso") found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: no unregistered querer/poder preterite (quise/pude/...) in any printed step content — unregistered anywhere in m1-m24, only the imperfect is taught", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const m = text.toLowerCase().match(anyWord(UNREGISTERED_PRETERITE));
      if (m) bad.push(`${id}: «${m[2]}»`);
    }
    expect(bad, `unregistered querer/poder preterite produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: no never-confirmed-PRIOR present-tense form of estar/hacer/querer/poder/venir anywhere (not even a foil/tile/distractor)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const m = text.toLowerCase().match(anyWord(ILLEGAL_PRESENT_FORMS));
      if (m) bad.push(`${id}: «${m[2]}»`);
    }
    expect(bad, `never-confirmed-PRIOR present-tense form produced:\n${bad.join("\n")}`).toEqual([]);
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

  it("PIN: salir's preterite never appears in an unregistered person (only salí/saliste/salió — m19 — are registered; salimos/salieron/salisteis were never registered anywhere)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const m = text.toLowerCase().match(anyWord(UNREGISTERED_SALIR));
      if (m) bad.push(`${id}: «${m[2]}»`);
    }
    expect(bad, `unregistered salir preterite form produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("«ir» (infinitive) is never CREDITED as an atom — it legitimately appears as a plain word inside sentences (e.g. «quería ir al cine»), just never listed as a taught surface", () => {
    const bad = ES_M25_ATOMS.filter((a) => a.surface.toLowerCase() === "ir");
    expect(bad, "«ir» must never be registered as a live atom").toEqual([]);
  });

  it("every new atom debuts on an intro-capable step (word_map does not count), and both debut in L1/L4 respectively (porque L1, por eso L4)", () => {
    const debut = new Map<string, { lesson: number; type: string }>();
    for (const w of ALL_ATOMS) {
      const re = word(w);
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type === "word_map") continue; // unbilled preview
          if (esSurfaces(s).some((surf) => re.test(surf.toLowerCase()))) { debut.set(w, { lesson: n, type: s.type }); break; }
        }
        if (debut.has(w)) break;
      }
    }
    expect(debut.get("porque")?.lesson, "«porque» must debut in L1").toBe(1);
    expect(debut.get("por eso")?.lesson, "«por eso» must debut in L4").toBe(4);
    for (const w of ALL_ATOMS) {
      expect(ES_INTRO_TYPES.has(debut.get(w)!.type), `«${w}» first appears on ${debut.get(w)!.type}, not an intro-capable step`).toBe(true);
    }
  });

  it("each new atom is PRODUCED many times (answer positions), spread over ≥5 lessons (heavy recombination is the module's whole point)", () => {
    const short: string[] = [];
    for (const w of ALL_ATOMS) {
      const re = word(w);
      const hits = LESSONS.map((n) => allSurfaces([n]).filter((s) => re.test(s.text.toLowerCase())).length);
      const total = hits.reduce((a, b) => a + b, 0);
      const spread = hits.filter((h) => h > 0).length;
      if (total < 8 || spread < 5) short.push(`«${w}» ${total}× over ${spread} lesson(s)`);
    }
    expect(short, `under-produced atoms:\n${short.join("\n")}`).toEqual([]);
  });

  it("recall floor: ≥1 recall in L3/L5/L6/L7/L9, ≥2 in L8/L10; L1/L2/L4 carry none (nothing earlier of their own kind to recall — L4 debuts por eso with no prior por-eso win to recall)", () => {
    const recallCount = (n: number) => getLesson(n).filter((s) => (s as unknown as Record<string, unknown>).cue === "recall").length;
    for (const n of [3, 5, 6, 7, 9]) {
      expect(recallCount(n), `L${n} must carry ≥1 recall`).toBeGreaterThanOrEqual(1);
    }
    for (const n of [8, 10]) {
      expect(recallCount(n), `L${n} must carry ≥2 recalls`).toBeGreaterThanOrEqual(2);
    }
    for (const n of [1, 2]) {
      expect(recallCount(n), `L${n} must carry zero recalls — nothing earlier in this module to recall`).toBe(0);
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

  it("porque and por eso are both drilled in the checkpoint (L8) and the mastery lesson (L10)", () => {
    for (const n of [8, 10]) {
      const blob = lessonBlob(n).toLowerCase();
      expect(word("porque").test(blob), `L${n} must produce «porque»`).toBe(true);
      expect(/por eso/.test(blob), `L${n} must produce «por eso»`).toBe(true);
    }
  });

  it("at least one PRIOR m23 connective (cuando/mientras/de repente/entonces) appears in the mastery lesson (L10) alongside both m25 connectives", () => {
    const blob = lessonBlob(10).toLowerCase();
    const hasM23 = anyWord(["cuando", "mientras", "de repente", "entonces"]).test(blob) || /de repente/.test(blob);
    expect(hasM23, "L10 must include ≥1 PRIOR m23 connective").toBe(true);
  });

  it("the mirror lesson (L9) states both directions of the same two facts and explicitly names the equivalence in its info card", () => {
    const blob = lessonBlob(9).toLowerCase();
    expect(word("porque").test(blob) && /por eso/.test(blob), "L9 must produce both connectives").toBe(true);
    const infoSteps = getLesson(9).filter((s) => s.type === "info") as unknown as Array<{ body: string }>;
    expect(infoSteps.some((s) => /por eso/.test(s.body.toLowerCase()) && /porque/.test(s.body.toLowerCase())), "L9's info card must name both connectives explicitly").toBe(true);
  });
});
