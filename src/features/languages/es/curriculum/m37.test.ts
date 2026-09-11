/**
 * ES M37 curriculum guard — «Hay que trabajar», exactly 1 new atom: «hay
 * que» (invariant phrase, "one has to / it's necessary to" — impersonal
 * obligation, never conjugates, no subject ever precedes it). Minimal-pair
 * contrast module against m33's «tengo/tienes/tiene que» (personal
 * obligation) — every lesson recombines the new impersonal phrase against
 * the prior personal one, plus PRIOR frames: existential «hay» (m3, now
 * doing double duty — «hay» + noun = existence, «hay» + «que» + infinitive
 * = obligation), «necesito»/«puedo» (m16/m14), destinations/«en»-mode
 * transport (m34/m36), body parts (m30/m31), shopping (m16/m34). The
 * central risk is «hay» vs «hay que» (same first word, two jobs) and
 * «hay que» vs «tengo que» (same shape, personal vs. impersonal) — both
 * get dedicated lessons (L5 for hay/hay-que, L2 for hay-que/tengo-que).
 * Sonnet-subagent-drafted per CLAUDE.md's bulk-authoring rule, single
 * continuous session (2026-09-10).
 * Shared lints at ZERO debt + shared doctrine pins + module-bespoke lanes.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim (no trailing
 *     match_pairs/speaking after it, per m34-L10/m35-L10/m36-L10's own
 *     precedent).
 *   - recall: L1-L7,L9 = 0 named "-recall" speaking steps carry the actual
 *     `cue: "recall"` marker; only L8 and L10 do (2 each — one per prior
 *     win line, never the immediately-preceding lesson's own win line
 *     paired with itself).
 *   - word_map cards: L1-L7 (7 total) — zero in L8-L10 (the checkpoint,
 *     cross-recombination, and mastery lessons carry no new debut to map).
 *   - info cards: L1 («hay que» debut framing), L5 (dedicated «hay» vs
 *     «hay que» — two jobs, one word), L9 (optional recap before mastery)
 *     — 3 total. Zero elsewhere, notably L2/L3 (discrimination and
 *     negation lessons lean on contrast pairs, not new framing prose).
 *   - «hay que» debuts L1 (word_map doesn't count — first billed exposure
 *     is the L1 info card / speaking / build chain).
 *   - every teaching lesson (L1-L9, INCLUDING the checkpoint L8) ends
 *     dialogue_sim → match_pairs → speaking — the module's own win-line
 *     closing shape.
 *   - L2 is the dedicated «hay que» vs «tengo/tienes/tiene que»
 *     discrimination lesson (no new atom); Ana debuts there as NPC.
 *   - L3 is the dedicated negation lesson, «no hay que» (still invariant,
 *     still no subject); Diego reappears.
 *   - L4 recombines with m30/m31 body-part vocabulary («me duele»); Marta
 *     debuts there as NPC (earlier than the original plan of L7 — the
 *     body-part/hospital thread needed her sooner).
 *   - L5 is the dedicated «hay» (existence) vs «hay que» (obligation)
 *     split — same first word, two jobs; Lupita debuts there as NPC.
 *   - L6 recombines with m36's «en»-mode transport nouns («ir en
 *     tren/metro/taxi/bicicleta»); no new NPC.
 *   - L7 is the dedicated question-form lesson, «¿qué hay que hacer?»,
 *     recombined with supermarket shopping (m16/m34); no new NPC.
 *   - L9 is the cross-recombination lesson pairing every strand of the
 *     module (destinations, transport, body parts, shopping) through
 *     «hay que» vs «tengo/tienes/tiene que» one more time before mastery;
 *     carries one optional recap info card (a deviation from an earlier
 *     2-info-card plan — mirrors m36-L9's own precedent of an optional
 *     recap card on a "no new atom" lesson).
 */
import "./index";

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ES_M37_ATOMS, ES_M37_LESSONS, ES_M37_PLACEMENT, ES_M37_CHECKPOINT_INDEX } from "./m37";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m37",
  lessons: ES_M37_LESSONS,
  atoms: ES_M37_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m37",
  lessons: ES_M37_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m37")),
});

registerEsDoctrinePins({
  moduleId: "m37",
  lessons: ES_M37_LESSONS,
  checkpointIndex: ES_M37_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m37", ES_M37_LESSONS, ES_M37_ATOMS);

const getLesson = (n: number) => ES_M37_LESSONS[n - 1].steps;
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

/** The single new atom this module registers. */
const ALL_ATOMS = ES_M37_ATOMS.map((a) => a.surface);

/** Ground-truth recall floor per lesson, read from the compiled module —
 * matches m36's precedent design: every "-sp-recall"-id speaking step
 * carries `cue: "recall"`, whether or not its `atoms` are populated. L1
 * has no earlier win line to recall from, so it carries zero. L2-L7 and
 * L9 each quote the immediately-preceding lesson's win line with full
 * atoms billed (1 recall each). L8 (checkpoint) and L10 (mastery) each
 * carry 2 pure recalls (empty atoms) pulled from two different earlier
 * win lines. 11 cue:"recall" steps total module-wide, satisfying the
 * doctrine pin's default minRecalls: 6 floor. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Word_map appears in exactly this lesson set — the module's only debut. */
const MAP_LESSONS = [1, 2, 3, 4, 5, 6, 7];

/** Info cards: L1 («hay que» debut), L5 (hay vs. hay que split), L9
 * (optional recap before mastery). Zero elsewhere. */
const INFO_LESSONS = [1, 5, 9];

describe("ES m37 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M37_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M37_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M37_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 1 new atom — «hay que» (phrase, invariant, no gender field)", () => {
    expect(ALL_ATOMS).toEqual(["hay que"]);
    const byName = Object.fromEntries(ES_M37_ATOMS.map((a) => [a.surface, a]));
    expect(byName["hay que"].partOfSpeech).toBe("phrase");
    expect(byName["hay que"].kind).toBe("phrase");
    expect(byName["hay que"].gender).toBeUndefined();
    for (const a of ES_M37_ATOMS) expect(a.kind, `${a.surface}: unexpected kind`).toBe("phrase");
  });

  it("«hay que» debuts on L1 on an intro-capable step (word_map does not count)", () => {
    const re = word("hay que");
    let found: { lesson: number; type: string } | null = null;
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type === "word_map") continue; // unbilled preview
        if (esSurfaces(s).some((x) => re.test(x.toLowerCase()))) { found = { lesson: n, type: s.type }; break; }
      }
      if (found) break;
    }
    expect(found, "«hay que» never appears").not.toBeNull();
    expect(ES_INTRO_TYPES.has(found!.type), `«hay que» first appears on ${found!.type} (L${found!.lesson}), not an intro-capable step`).toBe(true);
    expect(found!.lesson, "«hay que» must debut at L1").toBe(1);
  });

  it("«hay que» is PRODUCED at least 3 times (answer positions) across the module", () => {
    const re = word("hay que");
    const total = allSurfaces().filter((s) => re.test(s.text.toLowerCase())).length;
    expect(total, `«hay que» produced only ${total}× (need ≥3)`).toBeGreaterThanOrEqual(3);
  });

  it("recall floor (ground truth read from the compiled module): L1 carries zero cue:\"recall\" steps; L2-L7,L9 carry 1; L8,L10 carry ≥2", () => {
    const recallCount = (n: number) => getLesson(n).filter((s) => (s as unknown as Record<string, unknown>).cue === "recall").length;
    for (const n of LESSONS) {
      const floor = RECALL_FLOOR[n];
      if (floor === 0) {
        expect(recallCount(n), `L${n} must carry zero cue:"recall" steps`).toBe(0);
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

  it("word_map cards appear in exactly L1-L7 (zero in L8-L10)", () => {
    for (const n of [8, 9, 10]) {
      const mapSteps = getLesson(n).filter((s) => s.type === "word_map");
      expect(mapSteps.length, `L${n} must carry zero map cards`).toBe(0);
    }
    const mapLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "word_map"));
    expect(mapLessons, "word_map card must appear in exactly L1-L7").toEqual(MAP_LESSONS);
  });

  it("info cards appear in exactly L1, L5, L9 (zero elsewhere)", () => {
    for (const n of [2, 3, 4, 6, 7, 8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons, "info card must appear in exactly L1, L5, L9").toEqual(INFO_LESSONS);
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

  it("CENTRAL RISK PIN: «hay que» is always credited as a single fused atoms: entry, never split into bare \"hay\"+\"que\" tokens sitting alongside each other without the fused phrase — and never over-fused with a trailing infinitive (e.g. «hay que ir» as one atoms: entry)", () => {
    const irPath = path.resolve(__dirname, "ir", "m37.ir.yaml");
    const src = fs.readFileSync(irPath, "utf8");
    const bad: string[] = [];
    let checked = 0;
    for (const m of src.matchAll(/^\s*atoms:\s*\[([^\]]*)\]/gm)) {
      const entries = m[1].split(",").map((raw) => raw.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      checked += entries.length;
      if (entries.includes("que") && !entries.includes("hay que")) {
        bad.push(`bare "que" credited without the fused "hay que" atom: [${entries.join(", ")}]`);
      }
      for (const e of entries) {
        if (e.startsWith("hay que ") ) {
          bad.push(`"${e}" — over-fused, «hay que» must never absorb a trailing infinitive into one atoms: entry`);
        }
      }
    }
    expect(checked, "no atoms: entries parsed — the regex has drifted").toBeGreaterThan(50);
    expect(bad, `hay-que credit trap found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("CENTRAL RISK PIN: bare existential «hay» (there is/are, m3) is never registered with an accompanying bare \"que\" in the same atoms: entry unless the fused \"hay que\" phrase is also present — i.e. existential-hay sentences never accidentally credit a split obligation phrase", () => {
    const irPath = path.resolve(__dirname, "ir", "m37.ir.yaml");
    const src = fs.readFileSync(irPath, "utf8");
    const bad: string[] = [];
    for (const m of src.matchAll(/^\s*atoms:\s*\[([^\]]*)\]/gm)) {
      const entries = m[1].split(",").map((raw) => raw.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      if (entries.includes("hay") && entries.includes("que") && !entries.includes("hay que")) {
        bad.push(`existential "hay" alongside bare "que" without fused "hay que": [${entries.join(", ")}]`);
      }
    }
    expect(bad, `hay/que split-credit trap found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("CENTRAL RISK PIN: the tengo/tienes/tiene-que minimal-pair foils (bare «hay» substituted where «tengo que» belongs, and vice versa — «hay trabajar», «hay estudiar», «hay comprar», «hay ir», «hay hacer» with «que» dropped) never appear in a GRADED answer position or an NPC line — only as distractors/foils", () => {
    const BAD_RE = /\bhay (trabajar|estudiar|comprar|ir|hacer|limpiar|cocinar|descansar)\b/;
    const bad: string[] = [];
    for (const { id, text } of [...allSurfaces(), ...allNpcLines()]) {
      if (BAD_RE.test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `dropped-«que» foil in a graded answer or NPC line:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: no illegal subjunctive/past/future form of «haber» («haya», «hubo», «había», «habrá», «habría», «hayamos» — none taught this module; «hay» is invariant) appears anywhere, including tiles/distractors/NPC lines", () => {
    const ILLEGAL_FORMS = ["haya", "hubo", "había", "habrá", "habría", "hayamos"];
    const bad: string[] = [];
    for (const { id, text } of [...allPrintedStrings(), ...allNpcLines()]) {
      const low = text.toLowerCase();
      for (const f of ILLEGAL_FORMS) {
        if (word(f).test(low)) bad.push(`${id}: «${f}» embedded in «${text}»`);
      }
    }
    expect(bad, `illegal haber form found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: no standalone «yo hay que» / «tú hay que» / «él hay que» subject-marked form of the impersonal phrase ever appears — «hay que» never takes a subject pronoun in front of it", () => {
    // Explanatory fields (revealNote/why/explanation/body/description/gloss/
    // replyGloss/title) legitimately quote the BANNED form as a negative
    // teaching example ("never «yo hay que»") — grade answers/live content,
    // not every string (see grade-answers-not-every-string doctrine).
    const EXPLANATORY_FIELD = /\.(revealNote|why|explanation|body|description|gloss|replyGloss|title)$/;
    const BAD_RE = /\b(yo|tú|él|ella|usted|nosotros|ellos|ellas) hay que\b/;
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      if (EXPLANATORY_FIELD.test(id)) continue;
      if (BAD_RE.test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `subject-marked «hay que» found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: Marta's NPC debut is L4 — Marta never appears as an NPC speaker before L4", () => {
    for (const n of [1, 2, 3]) {
      for (const s of getLesson(n)) {
        if (s.type !== "dialogue_sim") continue;
        for (const t of s.turns) {
          expect(t.npc.speaker, `${s.id}/${t.id}: Marta must not appear before L4`).not.toBe("Marta");
        }
      }
    }
    const l4 = getLesson(4).find((s) => s.type === "dialogue_sim");
    expect(l4, "L4 must carry a dialogue_sim").toBeDefined();
    const speakers = l4 && l4.type === "dialogue_sim" ? l4.turns.map((t) => t.npc.speaker) : [];
    expect(speakers, "L4's sim must feature Marta").toContain("Marta");
  });

  it("PIN: Lupita's NPC debut is L5 — Lupita never appears as an NPC speaker before L5", () => {
    for (const n of [1, 2, 3, 4]) {
      for (const s of getLesson(n)) {
        if (s.type !== "dialogue_sim") continue;
        for (const t of s.turns) {
          expect(t.npc.speaker, `${s.id}/${t.id}: Lupita must not appear before L5`).not.toBe("Lupita");
        }
      }
    }
    const l5 = getLesson(5).find((s) => s.type === "dialogue_sim");
    expect(l5, "L5 must carry a dialogue_sim").toBeDefined();
    const speakers = l5 && l5.type === "dialogue_sim" ? l5.turns.map((t) => t.npc.speaker) : [];
    expect(speakers, "L5's sim must feature Lupita").toContain("Lupita");
  });

  it("every dialogue_sim NPC word (L1-L10) resolves to atoms taught ≤m37 — no untaught vocabulary in an NPC line", () => {
    // Spot-check: every NPC line is built entirely from words that also
    // appear somewhere in a graded ANSWER position within the same module
    // (a proxy for "already in the course's taught vocabulary by m37",
    // since allSurfaces() only contains post-m37-comprehensible content).
    const knownWords = new Set<string>();
    for (const { text } of allSurfaces()) {
      for (const w of text.toLowerCase().replace(/[¿?¡!.,—]/g, " ").split(/\s+/)) {
        if (w) knownWords.add(w);
      }
    }
    // «hay que» itself and its personal counterpart are always known.
    knownWords.add("hay");
    knownWords.add("que");
    // NPC lines may also draw on the FULL prior course (m1-m36), not just
    // this module's own graded answers — allSurfaces() only proxies "taught
    // by m37", it isn't the whole registry. Each of these is grep-confirmed
    // as a registered atom (or, for «cómo», a carrier-atom component owned
    // by an earlier phrase atom — see carrier-atoms-word-level-ownership)
    // in a module before m37: tú (m2), te (m13), dónde (m4), cómo (component
    // of «¿cómo estás?», m2), bien (m2), vamos (m18), entonces (m23),
    // necesitas (m16), todavía (m16).
    for (const w of ["tú", "te", "dónde", "cómo", "bien", "vamos", "entonces", "necesitas", "todavía"]) {
      knownWords.add(w);
    }
    const bad: string[] = [];
    for (const { id, text } of allNpcLines()) {
      for (const raw of text.toLowerCase().replace(/[¿?¡!.,—]/g, " ").split(/\s+/)) {
        const w = raw.trim();
        if (!w) continue;
        if (!knownWords.has(w)) bad.push(`${id}: «${w}» in «${text}» not seen in any graded answer this module`);
      }
    }
    expect(bad, `NPC line uses a word never produced in a graded answer:\n${bad.join("\n")}`).toEqual([]);
  });
});
