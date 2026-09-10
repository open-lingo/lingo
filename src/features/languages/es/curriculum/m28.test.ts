/**
 * ES M28 curriculum guard — «Voy a nadar mañana», the periphrastic near
 * future («ir a» + infinitivo). Sonnet-drafted lessons, Fable spine + pins
 * (2026-09-10). Shared lints at ZERO debt + shared doctrine pins + module-
 * bespoke lanes below. Exactly TWO new atoms this module — «ir» (the
 * infinitive itself, the only piece of the paradigm PRIOR modules never
 * gave a real atom to) and «va» (the él/ella/usted present, previously
 * foil-only in m9/m18 mcq distractors, now a taught atom). «voy»(m9)/
 * «vas»(m9)/«vamos»(m18)/«van»(m18) are all PRIOR — this module's job is
 * to complete the paradigm and teach the NEW pattern (an infinitive
 * instead of a place after «a»), not to re-teach conjugation.
 *
 * Ground truth (read from the compiled module, not assumed from m27's
 * shape — recall/info counts differ module to module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim.
 *   - recall: L1=0; L2,L3,L4,L5,L6,L7,L9 = 1 each; L8,L10 = 2 each.
 *   - info cards: L1 only (the one contrast-setting usage note, hard rule
 *     6); zero elsewhere, including L8/L10.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M28_ATOMS, ES_M28_LESSONS, ES_M28_PLACEMENT, ES_M28_CHECKPOINT_INDEX } from "./m28";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m28",
  lessons: ES_M28_LESSONS,
  atoms: ES_M28_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m28",
  lessons: ES_M28_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m28")),
});

registerEsDoctrinePins({
  moduleId: "m28",
  lessons: ES_M28_LESSONS,
  checkpointIndex: ES_M28_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m28", ES_M28_LESSONS, ES_M28_ATOMS);

const getLesson = (n: number) => ES_M28_LESSONS[n - 1].steps;
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
      // multiple_choice (sentenceMcq/mcq IR): the CORRECT option is the graded
      // answer position — distractors are foils, not taught surfaces (see
      // "grade answers, not every string").
      if (s.type === "multiple_choice") {
        const options = (rec.options as Array<{ id: string; text: string }>) ?? [];
        const correctOptionId = rec.correctOptionId as string | undefined;
        const correct = options.find((o) => o.id === correctOptionId)?.text;
        if (correct) out.push({ id: s.id, text: correct });
      }
      // match_pairs (matchLit IR): each pair's Spanish `source` is a graded
      // recognition target, not a foil.
      if (s.type === "match_pairs") {
        const pairs = (rec.pairs as Array<{ source: string }>) ?? [];
        for (const p of pairs) if (p.source) out.push({ id: s.id, text: p.source });
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

/**
 * Same walk as allPrintedStrings, but drops explanatory PROSE fields
 * (explanation/why/body/revealNote/gloss/replyGloss/description/title/setting) —
 * per m25/m26/m27.test.ts's own precedent, "info-card/hint prose may still
 * name a banned form for teaching purposes" (e.g. L1's own info card and
 * the «va» atom's own hint both explicitly name «iba»/«fue» to explain the
 * contrast — that mention must not itself trip a ban). Bans that must hold
 * even as a tile/distractor/option foil should still fail on those; bans
 * on live production should not fire on legitimate teaching prose.
 */
const PROSE_FIELD_RE = /\.(explanation|why|body|revealNote|gloss|replyGloss|description|title|setting|hint)$/;
function allPrintedStringsNoProse(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  return allPrintedStrings(nums).filter(({ id }) => !PROSE_FIELD_RE.test(id));
}

/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 2 new atoms this module registers. */
const ALL_ATOMS = ES_M28_ATOMS.map((a) => a.surface);

/** Which lesson each atom is expected to debut in. */
const DEBUT_LESSON: Record<string, number> = {
  ir: 1,
  va: 3,
};

/** Ground-truth recall floor per lesson, read from the compiled module. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Taught bare infinitives that legally follow «a» in this module's «voy a + infinitivo» pattern (hard rule 6/7). */
const TAUGHT_INFINITIVES = ["ir", "nadar", "trabajar", "estudiar", "viajar", "comer", "cocinar", "hablar", "bailar", "cantar", "hacer"];

/** Invented morphological future-tense forms this module deliberately never teaches (the periphrastic «ir a + inf.» is a DIFFERENT construction) — must never appear anywhere, including as a tile/distractor/option foil. */
const INVENTED_FUTURE_FORMS = ["iré", "irás", "irá", "iremos", "irán", "nadaré", "trabajaré", "estudiaré", "viajaré", "comeré", "cocinaré", "hablaré", "bailaré", "cantaré", "vendré", "haré", "seré"];

describe("ES m28 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M28_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M28_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M28_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 2 new atoms — ir, va", () => {
    expect(ALL_ATOMS.sort()).toEqual(["ir", "va"].sort());
  });

  it("this module registers ZERO new noun/adjective atoms — both new atoms complete the «ir» verb paradigm (the bare infinitive, and its 3rd-person present)", () => {
    for (const a of ES_M28_ATOMS) {
      expect(a.partOfSpeech, `${a.surface}: unexpected part of speech for this module`).toBe("verb");
    }
  });

  it("neither new atom carries an emoji — no new imageable vocab this module (carries the no-new-emoji pin, confirmed no-op)", () => {
    for (const a of ES_M28_ATOMS) {
      expect((a as unknown as Record<string, unknown>).emoji, `${a.surface}: unexpected emoji on a grammar-word atom`).toBeUndefined();
    }
  });

  it("every new atom debuts on an intro-capable step (word_map does not count), at its expected lesson (ir→L1 via the info card, va→L3)", () => {
    const bad: string[] = [];
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
      const expectedLesson = DEBUT_LESSON[w];
      if (expectedLesson !== undefined && found!.lesson !== expectedLesson) {
        bad.push(`«${w}» debuts at L${found!.lesson}, expected L${expectedLesson}`);
      }
    }
    expect(bad, `atom debut violation:\n${bad.join("\n")}`).toEqual([]);
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

  it("recall floor (ground truth read from the compiled module): L1 zero; L2-L7,L9 carry ≥1; L8,L10 carry ≥2", () => {
    const recallCount = (n: number) => getLesson(n).filter((s) => (s as unknown as Record<string, unknown>).cue === "recall").length;
    for (const n of LESSONS) {
      const floor = RECALL_FLOOR[n];
      if (floor === 0) {
        expect(recallCount(n), `L${n} must carry zero recalls`).toBe(0);
      } else {
        expect(recallCount(n), `L${n} must carry ≥${floor} recall(s)`).toBeGreaterThanOrEqual(floor);
      }
    }
  });

  it("the mastery lesson (L10) ends on a sim, not a grid (§13.9 law 7)", () => {
    const steps = getLesson(10);
    expect(steps[steps.length - 1].type, "L10's last step must be dialogue_sim").toBe("dialogue_sim");
  });

  it("the checkpoint lesson (L8) carries zero info cards; the mastery lesson (L10) carries zero info cards (this module's one info card is L1's contrast-setting usage note only)", () => {
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

  it("PIN: porque-spelling discipline carried (this module recombines PRIOR porque/por eso from L6 on) — «por qué» / «porqué» / bare two-word «por que» never appear anywhere", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfacesAndNpc()) {
      const t = text.toLowerCase();
      if (/por qué|porqué/.test(t)) bad.push(`${id}: «${text}»`);
      if (/\bpor que\b/.test(t)) bad.push(`${id}: «${text}» (bare "por que")`);
    }
    expect(bad, `accidental por-qué spelling in graded content:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: no invented morphological future-tense forms anywhere (including tiles/distractors/options/goal) — this module teaches the PERIPHRASTIC near future («va a + inf.») only, never the true morphological future («irá», «nadaré», etc.)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      const m = t.match(anyWord(INVENTED_FUTURE_FORMS));
      if (m) bad.push(`${id}: invented future form «${m[2]}» in «${text}»`);
    }
    expect(bad, `invented morphological future form printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: no object pronoun forms (lo/los/las/me/te/le/les as a clitic, or the fused conmigo/contigo) — this course has never taught object pronouns; direct evidence this pin matters: an earlier draft of L5's sim used «contigo» and it was caught and fixed by hand before this pin existed", () => {
    const bad: string[] = [];
    const OBJECT_PRONOUN_FORMS = ["lo", "los", "las", "me", "te", "le", "les", "conmigo", "contigo"];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      const m = t.match(anyWord(OBJECT_PRONOUN_FORMS));
      if (m) bad.push(`${id}: object-pronoun form «${m[2]}» in «${text}»`);
    }
    expect(bad, `unregistered object-pronoun form printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: «va» is never conflated with «iba» (imperfect, m22) or «fue» (preterite, m19-m21) in a graded ANSWER position — «iba»/«fue» may appear only as foils (mcq distractors), never as what the learner is asked to produce or accept as correct", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase();
      if (word("iba").test(t) || word("fue").test(t)) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `«iba»/«fue» in a graded answer position:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN (hard rule 6/7): every «voy a»/«vas a»/«va a»/«vamos a»/«van a» is immediately followed by either a PLACE-phrase opener («la», «al») or a taught bare infinitive — never left ambiguous", () => {
    const bad: string[] = [];
    const CONJ = ["voy", "vas", "va", "vamos", "van"];
    for (const { id, text } of allPrintedStringsNoProse()) {
      const t = text.toLowerCase();
      const re = new RegExp(`(^|[^\\p{L}])(${CONJ.join("|")}) a(l)?(?=[^\\p{L}]|$) ?([\\p{L}]*)`, "gu");
      let m: RegExpExecArray | null;
      while ((m = re.exec(t))) {
        const contraction = m[3]; // "l" if "al"
        const next = m[4];
        if (contraction === "l") continue; // "al" — unambiguously a place
        if (next === "la") continue; // "a la ___" — unambiguously a place
        if (next === "") continue; // "a" at a clause/tile boundary with nothing captured on this pass
        if (!TAUGHT_INFINITIVES.includes(next)) {
          bad.push(`${id}: «${text}» — «a ${next}» is neither a taught infinitive nor a place-phrase opener`);
        }
      }
    }
    expect(bad, `ambiguous «voy a» + word:\n${bad.join("\n")}`).toEqual([]);
  });

  it("STANDING PIN: no unregistered «de niños»/«de niñas» plural (a contamination risk carried forward course-wide after it shipped unnoticed in both m26 L10 and m27 L10 — see moduleBarGuards/es-quality's own course-wide gate for the structural fix)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      if (/\bde niños\b|\bde niñas\b/.test(t)) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `unregistered plural «de niños»/«de niñas»:\n${bad.join("\n")}`).toEqual([]);
  });
});
