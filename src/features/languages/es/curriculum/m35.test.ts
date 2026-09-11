/**
 * ES M35 curriculum guard — «El banco está cerca», exactly 3 new atoms:
 * cerca (adv, invariant), lejos (adv, invariant), lado (noun, m) — a
 * zero-new-verb-morphology grammar beat riding fully-PRIOR «está» (m4/
 * m18). «al lado de» is built COMPOSITIONALLY from the new noun «lado»
 * plus already-free «al»/«de»/«del» (ES_FUNCTION_WORDS) — never its own
 * idiom-phrase atom, and «del» never appears inside an atoms: array
 * (it's legal scope-checked text everywhere else, but not a registered
 * atom — only «de», m2, is). This module is the direct payoff of m4's own
 * "three jobs, three words" framing (es/está/hay) plus a second, distinct
 * three-way split (voy/está/hay, motion vs location vs existence) and a
 * dedicated «¿dónde está…?» asking-for-directions lesson (L7, Carlos
 * NPC debut). Sonnet-subagent-drafted per CLAUDE.md's bulk-authoring
 * rule, single continuous session (2026-09-10).
 * Shared lints at ZERO debt + shared doctrine pins + module-bespoke lanes.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim (no trailing
 *     match_pairs/speaking after it, per m33-L10/m34-L10's own precedent).
 *   - recall: L1=0; L2-L7,L9 = 1 each; L8,L10 = 2 each.
 *   - word_map cards: L1-L5 (5 total) — zero in L6/L7/L8/L9/L10. Map
 *     cards are NOT restricted to new-atom lessons (m34's own MAP_LESSONS
 *     spans well past its L4 atom cutoff) — L3/L5 here carry a map purely
 *     as a sentence preview despite debuting no new atom.
 *   - info cards: L1 (cerca debut), L2 (lejos debut), L4 (lado debut), L6
 *     (voy/está/hay three-way split), L9 (es/está/hay three-way split) —
 *     5 total.
 *   - cerca debuts L1, lejos debuts L2, lado debuts L4 — each via its own
 *     non-adjacent info card (word_map does not count as an intro step).
 *   - every teaching lesson (L1-L9, INCLUDING the checkpoint L8) ends
 *     dialogue_sim → match_pairs → speaking — the module's own win-line
 *     closing shape.
 *   - L7 is the dedicated «¿dónde está…?» asking-for-directions lesson;
 *     Carlos debuts there as NPC, deliberately reserved from L1-L6.
 */
import "./index";

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ES_M35_ATOMS, ES_M35_LESSONS, ES_M35_PLACEMENT, ES_M35_CHECKPOINT_INDEX } from "./m35";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m35",
  lessons: ES_M35_LESSONS,
  atoms: ES_M35_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m35",
  lessons: ES_M35_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m35")),
});

registerEsDoctrinePins({
  moduleId: "m35",
  lessons: ES_M35_LESSONS,
  checkpointIndex: ES_M35_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m35", ES_M35_LESSONS, ES_M35_ATOMS);

const getLesson = (n: number) => ES_M35_LESSONS[n - 1].steps;
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

/** The 3 new atoms this module registers. */
const ALL_ATOMS = ES_M35_ATOMS.map((a) => a.surface);

/** Ground-truth recall floor per lesson, read from the compiled module. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Word_map appears in exactly this lesson set — NOT restricted to
 * new-atom lessons (L3/L5 carry a preview map despite debuting nothing). */
const MAP_LESSONS = [1, 2, 3, 4, 5];

/** Info cards: L1 (cerca debut), L2 (lejos debut), L4 (lado debut), L6
 * (voy/está/hay), L9 (es/está/hay). */
const INFO_LESSONS = [1, 2, 4, 6, 9];

describe("ES m35 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M35_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M35_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M35_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 3 new atoms — cerca (adv), lejos (adv), lado (noun, masculine)", () => {
    expect(ALL_ATOMS.sort()).toEqual(["cerca", "lado", "lejos"].sort());
    const byName = Object.fromEntries(ES_M35_ATOMS.map((a) => [a.surface, a]));
    expect(byName.cerca.partOfSpeech).toBe("adverb");
    expect(byName.lejos.partOfSpeech).toBe("adverb");
    expect(byName.lado.partOfSpeech).toBe("noun");
    expect(byName.lado.gender).toBe("m");
    for (const a of ES_M35_ATOMS) expect(a.kind, `${a.surface}: unexpected kind`).toBe("vocab");
  });

  it("cerca debuts L1, lejos debuts L2, lado debuts L4 — each on an intro-capable step (word_map does not count)", () => {
    const EXPECTED_DEBUT: Record<string, number> = { cerca: 1, lejos: 2, lado: 4 };
    for (const [surf, lesson] of Object.entries(EXPECTED_DEBUT)) {
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
      expect(found!.lesson, `«${surf}» must debut at L${lesson}`).toBe(lesson);
    }
  });

  it("every new atom is PRODUCED at least 3 times (answer positions) across the module", () => {
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

  it("word_map cards appear in exactly L1-L5 (zero in L6-L10)", () => {
    for (const n of [6, 7, 8, 9, 10]) {
      const mapSteps = getLesson(n).filter((s) => s.type === "word_map");
      expect(mapSteps.length, `L${n} must carry zero map cards`).toBe(0);
    }
    const mapLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "word_map"));
    expect(mapLessons, "word_map card must appear in exactly L1-L5").toEqual(MAP_LESSONS);
  });

  it("info cards appear in exactly L1, L2, L4, L6, L9 (zero elsewhere)", () => {
    for (const n of [3, 5, 7, 8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons, "info card must appear in exactly L1, L2, L4, L6, L9").toEqual(INFO_LESSONS);
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

  it("CENTRAL RISK PIN: THE ATOMS: CREDIT TRAP — «del» never appears as a standalone entry in any atoms: array in the assembled IR (only «de», m2, is registered — «del» is legal scope-checked text via ES_FUNCTION_WORDS everywhere else, but never a creditable atom)", () => {
    const irPath = path.resolve(__dirname, "ir", "m35.ir.yaml");
    const src = fs.readFileSync(irPath, "utf8");
    const bad: string[] = [];
    let checked = 0;
    for (const m of src.matchAll(/^\s*atoms:\s*\[([^\]]*)\]/gm)) {
      for (const raw of m[1].split(",")) {
        const surface = raw.trim().replace(/^["']|["']$/g, "");
        if (!surface) continue;
        checked++;
        if (surface === "del") bad.push(`"del" credited directly in atoms: — must never appear (only "de" is registered)`);
        if (surface === "al lado de" || surface === "al lado del") bad.push(`"${surface}" credited as a single fused bigram — «al lado de» must never be its own atoms: entry`);
      }
    }
    expect(checked, "no atoms: entries parsed — the regex has drifted").toBeGreaterThan(50);
    expect(bad, `atoms: credit trap found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: «tengo que» is always credited as a single fused atoms: entry, never split into separate \"tengo\"+\"que\" tokens", () => {
    const irPath = path.resolve(__dirname, "ir", "m35.ir.yaml");
    const src = fs.readFileSync(irPath, "utf8");
    const bad: string[] = [];
    for (const m of src.matchAll(/^\s*atoms:\s*\[([^\]]*)\]/gm)) {
      const entries = m[1].split(",").map((raw) => raw.trim().replace(/^["']|["']$/g, ""));
      if (entries.includes("que") && !entries.includes("tengo que")) {
        bad.push(`bare "que" credited alongside other tokens without the fused "tengo que" atom: [${entries.join(", ")}]`);
      }
    }
    expect(bad, `split tengo/que credit found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: the motion-vs-location foil («voy cerca», «voy lejos», «voy al lado») never appears in a GRADED answer position or an NPC line — «voy» takes a destination noun, never a bare distance/location adverb", () => {
    const BAD_RE = /\bvoy (cerca|lejos|al lado)\b/;
    const bad: string[] = [];
    for (const { id, text } of [...allSurfaces(), ...allNpcLines()]) {
      if (BAD_RE.test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `motion-vs-location foil in a graded answer or NPC line:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: illegal present-tense estar forms («estoy», «estás» — never taught this module; only «está»/«están», both PRIOR from m4/m18) never appear anywhere, including tiles/distractors/NPC lines", () => {
    const ILLEGAL_FORMS = ["estoy", "estás"];
    const bad: string[] = [];
    for (const { id, text } of [...allPrintedStrings(), ...allNpcLines()]) {
      const low = text.toLowerCase();
      for (const f of ILLEGAL_FORMS) {
        if (word(f).test(low)) bad.push(`${id}: «${f}» embedded in «${text}»`);
      }
    }
    expect(bad, `illegal estar person-form found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: L4's gender-article discrimination — «del» (masculine) vs «de la» (feminine) both appear correctly across the module's graded answers; masculine places never take «de la», feminine «farmacia» never takes «del»", () => {
    const MASC = ["banco", "hospital", "correo", "supermercado"];
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      const low = text.toLowerCase();
      for (const m of MASC) {
        if (new RegExp(`de la ${m}\\b`).test(low)) bad.push(`${id}: «de la ${m}» — should be «del ${m}»`);
      }
      if (/\bdel farmacia\b/.test(low)) bad.push(`${id}: «del farmacia» — should be «de la farmacia»`);
    }
    expect(bad, `gender-fusion error in a graded answer:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: L7's Carlos NPC debut — Carlos never appears as an NPC speaker before L7", () => {
    for (const n of [1, 2, 3, 4, 5, 6]) {
      for (const s of getLesson(n)) {
        if (s.type !== "dialogue_sim") continue;
        for (const t of s.turns) {
          expect(t.npc.speaker, `${s.id}/${t.id}: Carlos must not appear before L7`).not.toBe("Carlos");
        }
      }
    }
    const l7 = getLesson(7).find((s) => s.type === "dialogue_sim");
    expect(l7, "L7 must carry a dialogue_sim").toBeDefined();
    const speakers = l7 && l7.type === "dialogue_sim" ? l7.turns.map((t) => t.npc.speaker) : [];
    expect(speakers, "L7's sim must feature Carlos").toContain("Carlos");
  });

  it("CENTRAL RISK PIN: no atoms: entry in the assembled IR credits a plural/inflected surface not itself registered (e.g. «lados») — plural sentences must still credit the registered singular", () => {
    const irPath = path.resolve(__dirname, "ir", "m35.ir.yaml");
    const src = fs.readFileSync(irPath, "utf8");
    const bad: string[] = [];
    let checked = 0;
    const PLURALS = ["lados"];
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
