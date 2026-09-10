/**
 * ES M29 curriculum guard — «Quiero verlo», the SECOND clitic position:
 * lo/la/los/las (m16) and me/te/se (m17) may now fuse onto the end of an
 * infinitive, instead of sitting only before the conjugated verb (querer
 * m7/m14, poder m14, ir a m28). Sonnet-drafted lessons, Fable spine + pins
 * (2026-09-10). Shared lints at ZERO debt + shared doctrine pins + module-
 * bespoke lanes below.
 *
 * This module registers 7 new atoms — NOT zero, despite the header's own
 * "NEW ATOMS: 0" framing decision. That framing does not survive contact
 * with the pipeline (`compile-ir-es.mjs` hard-requires `newAtoms.length >
 * 0`, and `esTokens()` never decomposes a fused clitic string back into
 * its component pronoun + infinitive, so an unregistered fused surface in
 * a graded-answer position is an unconditional "untracked word" failure).
 * The 7 registered surfaces (verlo, comprarlo, comprarla, comprarlos,
 * levantarme, hacerlo, verlos) are each a pure RECOMBINATION of PRIOR
 * parts (a PRIOR bare infinitive + a PRIOR pronoun) — see the header's own
 * "CORRECTION TO NEW ATOMS: 0" section.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim.
 *   - recall: L1=0; L2-L7,L9 = 1 each; L8,L10 = 2 each.
 *   - info cards: L1 (the module's usage-note contrast) and L9 (the
 *     "two ways, one meaning" side-by-side card) — NOT L1-only, unlike
 *     m28; zero in L8/L10 (checkpoint/mastery convention).
 *   - new-atom debut lessons: verlo→L1, comprarlo→L1, comprarla→L2,
 *     comprarlos→L3, levantarme→L4, hacerlo→L6, verlos→L10.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M29_ATOMS, ES_M29_LESSONS, ES_M29_PLACEMENT, ES_M29_CHECKPOINT_INDEX } from "./m29";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m29",
  lessons: ES_M29_LESSONS,
  atoms: ES_M29_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m29",
  lessons: ES_M29_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m29")),
});

registerEsDoctrinePins({
  moduleId: "m29",
  lessons: ES_M29_LESSONS,
  checkpointIndex: ES_M29_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m29", ES_M29_LESSONS, ES_M29_ATOMS);

const getLesson = (n: number) => ES_M29_LESSONS[n - 1].steps;
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

/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 7 new atoms this module registers. */
const ALL_ATOMS = ES_M29_ATOMS.map((a) => a.surface);

/** Which lesson each atom is expected to debut in (ground truth from the compiled module). */
const DEBUT_LESSON: Record<string, number> = {
  verlo: 1,
  comprarlo: 1,
  comprarla: 2,
  comprarlos: 3,
  levantarme: 4,
  hacerlo: 6,
  verlos: 10,
};

/** Ground-truth recall floor per lesson, read from the compiled module. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Every host verb / conjugated form that legally takes a bare-infinitive complement in this module (querer/poder/ir a paradigms). */
const HOST_VERB_FORMS = ["quiero", "quieres", "quiere", "puedo", "puedes", "puede", "voy", "vas", "va", "vamos", "van"];

/** The exact legal fused surfaces this module teaches (the 7 registered atoms) plus the PRIOR m17 dictionary-name atoms that coincide byte-for-byte with a legal 3rd-person-reflexive fusion (ducharse, levantarse — PRIOR since m17, reused unchanged here per the header's own note). */
const LEGAL_FUSED_FORMS = [...ALL_ATOMS, "ducharse", "levantarse"];

/** Indirect-object clitics — never taught in this course (hard rule 5). */
const INDIRECT_OBJECT_CLITICS = ["le", "les"];

/** Double-pronoun-stack / accent-needing fused forms this module must never print (hard rule 6) — dárselo-class, or any single-pronoun fusion that would need a written accent. None of this module's 7 legal fused forms need one; these are the shapes a drafting slip could produce. */
const BANNED_ACCENTED_OR_STACKED_FORMS = ["dármelo", "dártelo", "dárselo", "cuéntamelo", "decírmelo", "decírselo", "cómpramelo", "véndemelo"];

describe("ES m29 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M29_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M29_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M29_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 7 new atoms — verlo, comprarlo, comprarla, comprarlos, levantarme, hacerlo, verlos (the header's own 'NEW ATOMS: 0' framing does not survive the pipeline; see this file's header comment)", () => {
    expect(ALL_ATOMS.sort()).toEqual(
      ["verlo", "comprarlo", "comprarla", "comprarlos", "levantarme", "hacerlo", "verlos"].sort(),
    );
  });

  it("this module registers ZERO new noun/adjective atoms — every new atom is a fused verb+pronoun recombination of PRIOR parts, not a new dictionary entry", () => {
    for (const a of ES_M29_ATOMS) {
      expect(a.partOfSpeech, `${a.surface}: unexpected part of speech for this module`).toBe("verb");
    }
  });

  it("neither new atom carries an emoji — no new imageable vocab this module (0 new nouns, matches m28 precedent)", () => {
    for (const a of ES_M29_ATOMS) {
      expect((a as unknown as Record<string, unknown>).emoji, `${a.surface}: unexpected emoji on a grammar-word atom`).toBeUndefined();
    }
  });

  it("every new atom debuts on an intro-capable step (word_map does not count), at its expected lesson", () => {
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

  it("each new atom is PRODUCED at least 2 times (answer positions) — a thinner floor than m28's 3× since 4 of these 7 atoms are single-lesson-owned recombinations, not paradigm slots drilled across the whole module", () => {
    const short: string[] = [];
    for (const w of ALL_ATOMS) {
      const re = word(w);
      const hits = LESSONS.map((n) => allSurfaces([n]).filter((s) => re.test(s.text.toLowerCase())).length);
      const total = hits.reduce((a, b) => a + b, 0);
      if (total < 2) short.push(`«${w}» ${total}×`);
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

  it("the checkpoint lesson (L8) and the mastery lesson (L10) carry zero map/info cards; this module's two info cards are L1's contrast-setting usage note and L9's side-by-side 'two ways, one meaning' card only", () => {
    for (const n of [8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      const mapSteps = getLesson(n).filter((s) => s.type === "word_map");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
      expect(mapSteps.length, `L${n} must carry zero map cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons.sort(), "info cards must appear in exactly L1 and L9").toEqual([1, 9]);
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

  it("NEW PIN (hard rule 4): no third position — a pronoun (lo/la/los/las/me/te/se) never sits between a conjugated host verb and its infinitive complement, anywhere INCLUDING tiles/distractors/options/npc lines — the ONE place this exact string may legitimately appear is as the WRONG option in a discrimination step (mcq distractors, sim wrong-choice options), never as a correct/answer position", () => {
    const bad: string[] = [];
    const PRONOUNS = ["lo", "la", "los", "las", "me", "te", "se"];
    const re = new RegExp(`(${HOST_VERB_FORMS.join("|")}) a? ?(${PRONOUNS.join("|")}) (${["ver", "comprar", "hacer", "levantar", "duchar"].join("|")})`, "u");
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase();
      if (re.test(t)) bad.push(`${id}: third-position pronoun in a graded ANSWER position — «${text}»`);
    }
    expect(bad, `third-position foil printed as a correct/answer:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN (hard rule 3): the fused form and the pre-verbal form gloss IDENTICALLY — the reflexive dictionary-name atoms («levantarse», «ducharse», m17) never appear fused with a SECOND pronoun anywhere (that would be a double-pronoun stack, hard rule 6) — only the bare «levantar»/«duchar» (m17 L7) take a fused pronoun in this module", () => {
    const bad: string[] = [];
    const DOUBLE_FUSED_REFLEXIVE = ["levantarsele", "levantarseme", "levantarsete", "ducharsele", "ducharseme", "ducharsete"];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      const m = t.match(anyWord(DOUBLE_FUSED_REFLEXIVE));
      if (m) bad.push(`${id}: double-fused reflexive «${m[2]}» in «${text}»`);
    }
    expect(bad, `double-pronoun-stacked reflexive printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN (hard rule 5): no indirect-object clitics («le»/«les») anywhere — this course has never taught them", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      const m = t.match(anyWord(INDIRECT_OBJECT_CLITICS));
      if (m) bad.push(`${id}: indirect-object clitic «${m[2]}» in «${text}»`);
    }
    expect(bad, `indirect-object clitic printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN (hard rule 6): no double-pronoun stacks or accent-needing fused forms anywhere — «dármelo»/«cuéntamelo»/etc. are all OUT OF SCOPE for this module", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      const m = t.match(anyWord(BANNED_ACCENTED_OR_STACKED_FORMS));
      if (m) bad.push(`${id}: double-pronoun/accented fused form «${m[2]}» in «${text}»`);
    }
    expect(bad, `banned double-pronoun-stack or accent-needing fused form printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN (hard rule 7): no «irse» anywhere — only bare «ir» is registered (m28)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      if (word("irse").test(t)) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `«irse» printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: every fused form printed anywhere in the course is one of the 7 registered atoms or a PRIOR m17 dictionary-name reflexive (ducharse/levantarse) — no other fused verb+pronoun combination (e.g. unregistered «verla»/«verlas»/«comprarlas»/«ducharte»/«levantarte») ever appears in a graded ANSWER position", () => {
    const bad: string[] = [];
    const ANY_FUSED_PATTERN = /\b[a-záéíóúñü]*(arlo|arla|arlos|arlas|erlo|erla|erlos|erlas|irlo|irla|irlos|irlas|arme|erme|irme|arte|erte|irte|arse|erse|irse)\b/gu;
    for (const { id, text } of allSurfaces()) {
      const matches = text.toLowerCase().matchAll(ANY_FUSED_PATTERN);
      for (const m of matches) {
        const form = m[0];
        if (!LEGAL_FUSED_FORMS.includes(form)) bad.push(`${id}: unregistered fused form «${form}» in «${text}»`);
      }
    }
    expect(bad, `unregistered fused form in a graded answer position:\n${bad.join("\n")}`).toEqual([]);
  });

  it("STANDING PIN: no unregistered «de niños»/«de niñas» plural", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      if (/\bde niños\b|\bde niñas\b/.test(t)) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `unregistered plural «de niños»/«de niñas»:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: NPC dialogue_sim lines resolve on hand-inspection — every fused form appearing in an NPC line decomposes to a PRIOR bare infinitive + PRIOR pronoun (or is one of the 7 registered atoms / PRIOR ducharse/levantarse) — this is the exact class the live es-quality.test.ts course-wide dialogue_sim gate checks; this pin re-asserts it locally with this module's own known-legal list", () => {
    const bad: string[] = [];
    const ANY_FUSED_PATTERN = /\b[a-záéíóúñü]*(arlo|arla|arlos|arlas|erlo|erla|erlos|erlas|irlo|irla|irlos|irlas|arme|erme|irme|arte|erte|irte|arse|erse|irse)\b/gu;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "dialogue_sim") continue;
        for (const t of s.turns) {
          const npcText = t.npc.kana.toLowerCase();
          const matches = npcText.matchAll(ANY_FUSED_PATTERN);
          for (const m of matches) {
            const form = m[0];
            if (!LEGAL_FUSED_FORMS.includes(form)) bad.push(`${s.id}/${t.id}/npc: unregistered fused form «${form}» in «${t.npc.kana}»`);
          }
        }
      }
    }
    expect(bad, `unregistered fused form in an NPC line:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: «quieren»/«pueden» (ustedes/ellos present) never appear anywhere — never printed/drilled anywhere in the live course before this module (grep-confirmed against curriculum/*.ts), so exposing them for the first time here would violate 'intro before review' even though the conjugation-table-based gates technically tolerate them", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const t = text.toLowerCase();
      if (word("quieren").test(t) || word("pueden").test(t)) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `never-taught plural verb form printed:\n${bad.join("\n")}`).toEqual([]);
  });
});
