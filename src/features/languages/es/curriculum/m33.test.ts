/**
 * ES M33 curriculum guard — «Tengo que trabajar», exactly 1 new atom:
 * «tengo que» (yo-form idiom anchor, phrase/kind). Every other person's
 * obligation sentence («tienes que», «tiene que», «tenemos que», «tienen
 * que») is graded through the ALREADY-REGISTERED bare «tener» conjugation
 * (tienes/tiene/tenemos/tienen, prior) plus the already-free connective
 * «que» — NEVER a second registered "X que" surface. This is the module's
 * one load-bearing design constraint (see m33-header.yaml + the IR's own
 * header comments), and the central risk this test file pins directly.
 * Sonnet-workflow-drafted (single-session, no subagent per this task's
 * explicit override), Fable spine + pins (2026-09-10). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim (no trailing
 *     match_pairs/speaking after it — mastery lessons close differently
 *     from every teaching lesson, per m32-L10's own precedent).
 *   - recall: L1=0; L2-L7,L9 = 1 each; L8,L10 = 2 each.
 *   - word_map cards: L1-L7 and L9 (8 total) — zero in L8/L10.
 *   - info cards: a NARROWER subset than word_map — ONLY L1 and L9 (L1's
 *     debut usage note, L9's dedicated «puedo» vs «tengo que» contrast
 *     note). L2-L8 recombine without an info card.
 *   - the sole new atom debuts on L1's dialogue_sim (image-MCQ-as-intro
 *     does not apply here — «tengo que» is a phrase/idiom atom, not an
 *     imageable noun, so its debut is the sim's own first graded reply).
 *   - every teaching lesson (L1-L9, INCLUDING the checkpoint L8) ends
 *     dialogue_sim → match_pairs → speaking — the module's own win-line
 *     closing shape.
 *   - BRIEF CORRECTION: the brief's own L10 target sentence ("Me duele la
 *     mano, pero tengo que comprarlo — necesito una chaqueta nueva.")
 *     pairs the masculine fused clitic «comprarlo» with the feminine
 *     antecedent «chaqueta» — a gender-agreement bug. L10 corrects this to
 *     «comprarla» in its own closest analog to a win line (a buildLit
 *     step, since mastery lessons carry no trailing speakLit); «comprarlo»
 *     is still exercised elsewhere in L10 with an unambiguous masculine
 *     referent, so both fused-clitic genders (m29) are still covered.
 */
import "./index";

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ES_M33_ATOMS, ES_M33_LESSONS, ES_M33_PLACEMENT, ES_M33_CHECKPOINT_INDEX } from "./m33";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m33",
  lessons: ES_M33_LESSONS,
  atoms: ES_M33_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m33",
  lessons: ES_M33_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m33")),
});

registerEsDoctrinePins({
  moduleId: "m33",
  lessons: ES_M33_LESSONS,
  checkpointIndex: ES_M33_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m33", ES_M33_LESSONS, ES_M33_ATOMS);

const getLesson = (n: number) => ES_M33_LESSONS[n - 1].steps;
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
const anyWord = (ws: readonly string[]) => new RegExp(`(^|[^\\p{L}])(${ws.join("|")})(?=[^\\p{L}]|$)`, "u");

/** The 1 new atom this module registers. */
const ALL_ATOMS = ES_M33_ATOMS.map((a) => a.surface);

/** Ground-truth recall floor per lesson, read from the compiled module. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Word_map appears in this exact lesson set. */
const MAP_LESSONS = [1, 2, 3, 4, 5, 6, 7, 9];

/** Info cards appear in a NARROWER set than word_map — L1 (debut) and L9 (puedo vs tengo que contrast) only. */
const INFO_LESSONS = [1, 9];

/**
 * Present-tense «tener» cells NEVER shipped by this module (or any prior
 * one) — the five person-forms actually in play are tengo/tienes/tiene/
 * tenemos/tienen (all PRIOR to m33). Anything else — vosotros, voseo,
 * preterite, future, subjunctive, or a plain typo shape — must never
 * appear anywhere, not even as a foil.
 */
const ILLEGAL_TENER_FORMS = [
  "tenéis", "tenimos", "tienemos", "tenen", "tenes", "tenesis",
  "tuve", "tuviste", "tuvo", "tuvimos", "tuvieron", "tuvisteis",
  "tendré", "tendrás", "tendrá", "tendremos", "tendrán", "tendréis",
  "tenga", "tengas", "tengamos", "tengan", "tengáis",
];

describe("ES m33 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M33_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M33_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M33_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 1 new atom — «tengo que», a yo-form phrase/idiom anchor", () => {
    expect(ALL_ATOMS).toEqual(["tengo que"]);
    const a = ES_M33_ATOMS[0];
    expect(a.partOfSpeech, "unexpected part of speech").toBe("phrase");
    expect(a.kind, "unexpected kind").toBe("phrase");
  });

  it("«tengo que» debuts on an intro-capable step (word_map does not count), at L1", () => {
    const re = word("tengo que");
    let found: { lesson: number; type: string } | null = null;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type === "word_map") continue; // unbilled preview
        if (esSurfaces(s).some((surf) => re.test(surf.toLowerCase()))) { found = { lesson: n, type: s.type }; break; }
      }
      if (found) break;
    }
    expect(found, "«tengo que» never appears").not.toBeNull();
    expect(ES_INTRO_TYPES.has(found!.type), `«tengo que» first appears on ${found!.type} (L${found!.lesson}), not an intro-capable step`).toBe(true);
    expect(found!.lesson, "«tengo que» must debut at L1").toBe(1);
  });

  it("«tengo que» is PRODUCED at least 2 times (answer positions) across the module", () => {
    const re = word("tengo que");
    const hits = LESSONS.map((n) => allSurfaces([n]).filter((s) => re.test(s.text.toLowerCase())).length);
    const total = hits.reduce((a, b) => a + b, 0);
    expect(total, `«tengo que» produced only ${total}× (need ≥2)`).toBeGreaterThanOrEqual(2);
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

  it("info cards appear in a NARROWER set than word_map — exactly L1 (debut) and L9 (puedo vs tengo que contrast)", () => {
    for (const n of [2, 3, 4, 5, 6, 7, 8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons, "info card must appear in exactly L1 and L9").toEqual(INFO_LESSONS);
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

  it("CENTRAL RISK PIN: no atoms: entry in the assembled IR is a two-word «X que» bigram other than «tengo que», and «que» never appears alone as an atoms: entry — every other person's obligation is credited through the PRIOR bare «tener» conjugation, never a second registered surface", () => {
    const irPath = path.resolve(__dirname, "ir", "m33.ir.yaml");
    const src = fs.readFileSync(irPath, "utf8");
    const bad: string[] = [];
    let checked = 0;
    for (const m of src.matchAll(/^\s*atoms:\s*\[([^\]]*)\]/gm)) {
      for (const raw of m[1].split(",")) {
        const surface = raw.trim().replace(/^["']|["']$/g, "");
        if (!surface) continue;
        checked++;
        if (surface === "que") bad.push(`bare "que" as an atoms: entry`);
        if (/ que$/.test(surface) && surface !== "tengo que") bad.push(`"${surface}" — an unregistered "X que" bigram in atoms:`);
      }
    }
    expect(checked, "no atoms: entries parsed — the regex has drifted").toBeGreaterThan(50);
    expect(bad, `bigram-credit trap found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: the dropped-«que» foil («tengo trabajar» etc.) never appears in a GRADED answer position or an NPC line — it exists ONLY as a deliberate wrong-answer distractor/option (grade answers, not every string)", () => {
    const DROPPED_QUE_RE = /\b(tengo|tienes|tiene|tenemos|tienen)\s+(trabajar|estudiar|nadar|comprar|hablar|bailar|cantar|comer|leer|ir|cocinar)\b/;
    const bad: string[] = [];
    for (const { id, text } of [...allSurfaces(), ...allNpcLines()]) {
      if (DROPPED_QUE_RE.test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `dropped-«que» foil in a graded answer or NPC line:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: L9's dedicated «puedo» vs «tengo que» contrast — its info card names both, and both surfaces are produced within L9", () => {
    const l9Info = getLesson(9).find((s) => s.type === "info") as unknown as { title: string; body: string } | undefined;
    expect(l9Info, "L9 must carry an info card").toBeDefined();
    const infoText = `${l9Info!.title} ${l9Info!.body}`.toLowerCase();
    expect(infoText, "L9 info card must name «puedo»").toMatch(/puedo/);
    expect(infoText, "L9 info card must name «tengo que»").toMatch(/tengo que/);
    const l9Surfaces = allSurfaces([9]).map((s) => s.text.toLowerCase());
    expect(l9Surfaces.some((t) => word("puedo").test(t)), "L9 must produce «puedo» in a graded answer").toBe(true);
    expect(l9Surfaces.some((t) => word("tengo que").test(t)), "L9 must produce «tengo que» in a graded answer").toBe(true);
  });

  it("PIN: no never-confirmed-PRIOR «tener» conjugation anywhere (not even a foil/tile/distractor) — only tengo/tienes/tiene/tenemos/tienen are taught", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      const m = text.toLowerCase().match(anyWord(ILLEGAL_TENER_FORMS));
      if (m) bad.push(`${id}: «${m[2]}»`);
    }
    expect(bad, `never-confirmed-PRIOR «tener» form produced:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: NPC dialogue_sim lines resolve on hand-inspection — every line in every m33 sim uses only PRIOR content plus this module's own «tengo que», or the exact ES_FUNCTION_WORDS/ES_PROPER_NAMES sets; hand sweep alongside the course-wide esSimNpcProvenance.test.ts gate", () => {
    const bad: string[] = [];
    const BANNED_UNREGISTERED_WORDS = ["podemos", "queremos", "pueden", "quieren"];
    for (const { id, text } of allNpcLines()) {
      for (const w of BANNED_UNREGISTERED_WORDS) {
        if (word(w).test(text.toLowerCase())) bad.push(`${id}: banned «${w}» in «${text}»`);
      }
    }
    expect(bad, `banned/unregistered word in an NPC line:\n${bad.join("\n")}`).toEqual([]);
  });
});
