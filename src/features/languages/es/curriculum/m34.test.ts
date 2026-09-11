/**
 * ES M34 curriculum guard — «Necesito ir al banco», exactly 5 new atoms:
 * banco (m), farmacia (f), hospital (m), correo (m), supermercado (m) — a
 * zero-grammar lexicon break, direct sequel to m9's own places-in-town
 * debut. Every sentence frame is already registered: «voy»/«al»/«a» (m9),
 * «necesito»/«necesitas»/«necesita» (m16), «ir» (m28), «tengo que» + the
 * full bare-`tener` paradigm (m33, this course's own immediately-prior
 * module), «comprarlo»/«comprarla»/«comprarlos» (m29, paired with «leche»
 * m7 as a shopping-list object bought AT «supermercado», never fused onto
 * the destination noun itself), and «duele»/«duelen» (m31) paired with
 * m30's body nouns as an independent pain-frame recombination axis into
 * hospital/farmacia. Sonnet-workflow-drafted (single-session, no subagent
 * per this task's explicit override), Fable spine + pins (2026-09-10).
 * Shared lints at ZERO debt + shared doctrine pins + module-bespoke lanes.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim (no trailing
 *     match_pairs/speaking after it — mastery lessons close differently
 *     from every teaching lesson, per m32-L10/m33-L10's own precedent).
 *   - recall: L1=0; L2-L7,L9 = 1 each; L8,L10 = 2 each.
 *   - word_map cards: L1-L7 and L9 (8 total) — zero in L8/L10.
 *   - info cards: L1 (al vs a la debut), L3 (masculine or feminine
 *     discrimination), L4 (supermercado ≠ mercado), L6 (voy a / necesito
 *     ir a / tengo que ir a — the three-frame contrast), L9 (pain + place
 *     chaining) — 5 total, a WIDER set than m33's own 2-card budget
 *     because this module debuts 5 new nouns across L1-L4 one at a time.
 *   - L1 debuts TWO atoms (banco, farmacia) via two non-adjacent
 *     word_image_mcq steps in the same lesson, deliberately — the module's
 *     own masculine/feminine «al»/«a la» contrast needs both genders
 *     present from the first lesson.
 *   - hospital debuts L2, correo debuts L3, supermercado debuts L4 — each
 *     via its own single word_image_mcq.
 *   - every teaching lesson (L1-L9, INCLUDING the checkpoint L8) ends
 *     dialogue_sim → match_pairs → speaking — the module's own win-line
 *     closing shape.
 *   - BRIEF CORRECTION: the brief's paraphrase attributed «leche» to m11;
 *     grep confirms it is registered at m7 (gender f) — m11 only
 *     recombines the already-registered atom. This module's own header/
 *     hints correctly cite m7 for «leche», not m11.
 */
import "./index";

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ES_M34_ATOMS, ES_M34_LESSONS, ES_M34_PLACEMENT, ES_M34_CHECKPOINT_INDEX } from "./m34";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m34",
  lessons: ES_M34_LESSONS,
  atoms: ES_M34_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m34",
  lessons: ES_M34_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m34")),
});

registerEsDoctrinePins({
  moduleId: "m34",
  lessons: ES_M34_LESSONS,
  checkpointIndex: ES_M34_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m34", ES_M34_LESSONS, ES_M34_ATOMS);

const getLesson = (n: number) => ES_M34_LESSONS[n - 1].steps;
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
      if (s.type === "multiple_choice") {
        const options = (rec.options as Array<{ id: string; text: string }>) ?? [];
        const correctOptionId = rec.correctOptionId as string | undefined;
        const correct = options.find((o) => o.id === correctOptionId)?.text;
        if (correct) out.push({ id: s.id, text: correct });
      }
      if (s.type === "match_pairs") {
        const pairs = (rec.pairs as Array<{ source: string }>) ?? [];
        for (const p of pairs) if (p.source) out.push({ id: s.id, text: p.source });
      }
      if (s.type === "agreement_cloze") {
        // Reconstruct the joined CORRECT sentence from segments (esSurfaces'
        // own scan target) — the blank options themselves stay unscanned.
        let joined = "";
        for (const seg of s.segments) {
          joined += "blank" in seg ? seg.blank.correctAnswer : seg.text;
        }
        out.push({ id: s.id, text: joined });
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

/** Every NPC line across the module's dialogue_sim steps. */
function allNpcLines(nums: readonly number[] = LESSONS): Array<{ id: string; text: string }> {
  const out: Array<{ id: string; text: string }> = [];
  for (const n of nums) {
    for (const s of getLesson(n)) {
      if (s.type !== "dialogue_sim") continue;
      for (const t of s.turns) out.push({ id: `${s.id}/${t.id}/npc`, text: t.npc.kana });
    }
  }
  return out;
}

/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");

/** The 5 new atoms this module registers. */
const ALL_ATOMS = ES_M34_ATOMS.map((a) => a.surface);

/** Ground-truth recall floor per lesson, read from the compiled module. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Word_map appears in this exact lesson set. */
const MAP_LESSONS = [1, 2, 3, 4, 5, 6, 7, 9];

/** Info cards: L1 (al vs a la debut), L3 (masc/fem discrimination), L4
 * (supermercado ≠ mercado), L6 (three-frame contrast), L9 (pain + place). */
const INFO_LESSONS = [1, 3, 4, 6, 9];

/** Each new noun's gender, ground truth for the atoms array. */
const EXPECTED_GENDERS: Record<string, "m" | "f"> = {
  banco: "m",
  farmacia: "f",
  hospital: "m",
  correo: "m",
  supermercado: "m",
};

describe("ES m34 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M34_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M34_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M34_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 5 new atoms — banco/farmacia/hospital/correo/supermercado, all nouns with the correct registered gender", () => {
    expect(ALL_ATOMS.sort()).toEqual(["banco", "correo", "farmacia", "hospital", "supermercado"].sort());
    for (const a of ES_M34_ATOMS) {
      expect(a.partOfSpeech, `${a.surface}: unexpected part of speech`).toBe("noun");
      expect(a.kind, `${a.surface}: unexpected kind`).toBe("vocab");
      expect(a.gender, `${a.surface}: unexpected gender`).toBe(EXPECTED_GENDERS[a.surface]);
    }
  });

  it("banco and farmacia both debut on an intro-capable step (word_map does not count), at L1", () => {
    for (const surf of ["banco", "farmacia"]) {
      const re = word(surf);
      let found: { lesson: number; type: string } | null = null;
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type === "word_map") continue; // unbilled preview
          if (esSurfaces(s).some((x) => re.test(x.toLowerCase()))) { found = { lesson: n, type: s.type }; break; }
        }
        if (found) break;
      }
      expect(found, `«${surf}» never appears`).not.toBeNull();
      expect(ES_INTRO_TYPES.has(found!.type), `«${surf}» first appears on ${found!.type} (L${found!.lesson}), not an intro-capable step`).toBe(true);
      expect(found!.lesson, `«${surf}» must debut at L1`).toBe(1);
    }
  });

  it("hospital debuts at L2, correo at L3, supermercado at L4 — each on an intro-capable step", () => {
    const EXPECTED_DEBUT: Record<string, number> = { hospital: 2, correo: 3, supermercado: 4 };
    for (const [surf, lesson] of Object.entries(EXPECTED_DEBUT)) {
      const re = word(surf);
      let found: { lesson: number; type: string } | null = null;
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type === "word_map") continue;
          if (esSurfaces(s).some((x) => re.test(x.toLowerCase()))) { found = { lesson: n, type: s.type }; break; }
        }
        if (found) break;
      }
      expect(found, `«${surf}» never appears`).not.toBeNull();
      expect(ES_INTRO_TYPES.has(found!.type), `«${surf}» first appears on ${found!.type} (L${found!.lesson}), not an intro-capable step`).toBe(true);
      expect(found!.lesson, `«${surf}» must debut at L${lesson}`).toBe(lesson);
    }
  });

  it("every new noun is PRODUCED at least 3 times (answer positions) across the module", () => {
    for (const surf of ALL_ATOMS) {
      const re = word(surf);
      const total = allSurfaces().filter((s) => re.test(s.text.toLowerCase())).length;
      expect(total, `«${surf}» produced only ${total}× (need ≥3)`).toBeGreaterThanOrEqual(3);
    }
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

  it("every teaching lesson (L1-L9, INCLUDING the checkpoint L8) ends sim → match_pairs → speaking (the module's own win-line closing shape)", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
      const steps = getLesson(n);
      const last3 = steps.slice(-3).map((s) => s.type);
      expect(last3, `L${n} must end [dialogue_sim, match_pairs, speaking]`).toEqual(["dialogue_sim", "match_pairs", "speaking"]);
    }
  });

  it("word_map cards appear in exactly L1-L7 and L9 (zero in the checkpoint L8 and mastery L10)", () => {
    for (const n of [8, 10]) {
      const mapSteps = getLesson(n).filter((s) => s.type === "word_map");
      expect(mapSteps.length, `L${n} must carry zero map cards`).toBe(0);
    }
    const mapLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "word_map"));
    expect(mapLessons, "word_map card must appear in exactly L1-L7 and L9").toEqual(MAP_LESSONS);
  });

  it("info cards appear in exactly L1, L3, L4, L6, L9 (zero elsewhere)", () => {
    for (const n of [2, 5, 7, 8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons, "info card must appear in exactly L1, L3, L4, L6, L9").toEqual(INFO_LESSONS);
  });

  it("no cloze blank ever sits inside a question", () => {
    const bad: string[] = [];
    const balanced = (before: string) => (before.match(/¿/g) ?? []).length === (before.match(/\?/g) ?? []).length;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type === "agreement_cloze") {
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

  it("CENTRAL RISK PIN: never confuse «al» (masculine) and «a la» (feminine) in a GRADED answer position — banco/hospital/correo/supermercado always take «al», farmacia always takes «a la»", () => {
    const MASC = ["banco", "hospital", "correo", "supermercado"];
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const low = text.toLowerCase();
      for (const m of MASC) {
        if (new RegExp(`a la ${m}\\b`).test(low)) bad.push(`${id}: «a la ${m}» — should be «al ${m}»`);
      }
      if (/\bal farmacia\b/.test(low)) bad.push(`${id}: «al farmacia» — should be «a la farmacia»`);
    }
    expect(bad, `gender-fusion error in a graded answer:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: after «tengo que», the second verb is always the bare infinitive «ir» — the conjugated «voy» never follows «tengo que» in a graded answer or NPC line", () => {
    const BAD_RE = /tengo que voy/;
    const bad: string[] = [];
    for (const { id, text } of [...allSurfaces(), ...allNpcLines()]) {
      if (BAD_RE.test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `«tengo que voy» in a graded answer or NPC line:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: dropped-«que» foil («tengo ir al...») never appears in a GRADED answer position or an NPC line — it exists ONLY as a deliberate wrong-answer distractor/option", () => {
    const DROPPED_QUE_RE = /\btengo ir\b/;
    const bad: string[] = [];
    for (const { id, text } of [...allSurfaces(), ...allNpcLines()]) {
      if (DROPPED_QUE_RE.test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `dropped-«que» foil in a graded answer or NPC line:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: illegal «doler» person-forms («duelo», «dueles» — doler is impersonal; only «duele»/«duelen» are taught) never appear as part of a full sentence anywhere, not even a tile/distractor/option — bare single-token spelling-distractors (L9's textMcq) are the one exempted shape", () => {
    const ILLEGAL_DOLER_FORMS = ["duelo", "dueles"];
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const low = text.toLowerCase().trim();
      for (const f of ILLEGAL_DOLER_FORMS) {
        if (low === f) continue; // bare single-token spelling distractor — fine
        if (new RegExp(`\\b${f}\\b`).test(low)) bad.push(`${id}: «${f}» embedded in a longer string «${text}»`);
      }
    }
    expect(bad, `illegal «doler» person-form embedded in a sentence:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: L4's «comprarla» pairs only with a feminine antecedent (leche) in a graded answer — never «comprarlo» credited for the same referent", () => {
    const l4Surfaces = allSurfaces([4]).map((s) => s.text.toLowerCase());
    expect(l4Surfaces.some((t) => word("comprarla").test(t)), "L4 must produce «comprarla» in a graded answer").toBe(true);
  });

  it("PIN: L9's pain-frame — «duele»/«duelen» correctly agree with singular/plural body-part subject in every graded answer", () => {
    const bad: string[] = [];
    const SINGULAR_BODY = ["mano", "pie", "brazo", "pierna", "ojo", "boca", "nariz"];
    for (const { id, text } of allSurfaces([9, 10])) {
      const low = text.toLowerCase();
      for (const b of SINGULAR_BODY) {
        if (new RegExp(`duele los? ${b}s\\b`).test(low)) bad.push(`${id}: «duele» with plural «${b}s» — should be «duelen»`);
        if (new RegExp(`duelen (el|la) ${b}\\b`).test(low)) bad.push(`${id}: «duelen» with singular «${b}» — should be «duele»`);
      }
    }
    expect(bad, `duele/duelen agreement error:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: NPC dialogue_sim lines resolve on hand-inspection — every line in every m34 sim uses only PRIOR content plus this module's own 5 atoms, or the exact ES_FUNCTION_WORDS/ES_PROPER_NAMES sets; hand sweep alongside the course-wide esSimNpcProvenance.test.ts gate", () => {
    const bad: string[] = [];
    const BANNED_UNREGISTERED_WORDS = ["algo", "pasa"];
    for (const { id, text } of allNpcLines()) {
      for (const w of BANNED_UNREGISTERED_WORDS) {
        if (word(w).test(text.toLowerCase())) bad.push(`${id}: banned «${w}» in «${text}»`);
      }
    }
    expect(bad, `banned/unregistered word in an NPC line:\n${bad.join("\n")}`).toEqual([]);
  });

  it("CENTRAL RISK PIN: no atoms: entry in the assembled IR credits a plural surface (e.g. «bancos», «hospitales») — plural sentences must still credit the registered SINGULAR surface", () => {
    const irPath = path.resolve(__dirname, "ir", "m34.ir.yaml");
    const src = fs.readFileSync(irPath, "utf8");
    const bad: string[] = [];
    let checked = 0;
    const PLURALS = ["bancos", "farmacias", "hospitales", "correos", "supermercados"];
    for (const m of src.matchAll(/^\s*atoms:\s*\[([^\]]*)\]/gm)) {
      for (const raw of m[1].split(",")) {
        const surface = raw.trim().replace(/^["']|["']$/g, "");
        if (!surface) continue;
        checked++;
        if (PLURALS.includes(surface)) bad.push(`"${surface}" — a plural credited directly in atoms:, must be the singular`);
      }
    }
    expect(checked, "no atoms: entries parsed — the regex has drifted").toBeGreaterThan(50);
    expect(bad, `plural-credit trap found:\n${bad.join("\n")}`).toEqual([]);
  });
});
