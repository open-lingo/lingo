/**
 * ES M38 curriculum guard — «Hay que limpiar la casa», a zero-grammar
 * lexicon break: 6 new atoms, all rooms/areas of a house not already
 * covered by m3/m4's own scavenger hunt (casa, puerta, silla, ventana,
 * mesa, cama, baño, cocina, cuarto), plus one new bare-infinitive verb
 * that cashes in BOTH of the course's obligation constructions at once
 * («hay que», m37; «tengo que», m33):
 *
 *   el dormitorio (m)  bedroom       la sala (f)     living room
 *   el comedor (m)     dining room   el jardín (m)   garden/yard
 *   el garaje (m)       garage
 *   limpiar             to clean (BARE INFINITIVE ONLY — never conjugated)
 *
 * Two landmines specific to this module:
 *   - «jardín» is SINGULAR-ONLY in this course's own content — the shared
 *     regular-plural scope-check (`esRegularPlurals` in moduleBarGuards.ts)
 *     has no «/ín$/» branch and would compute the wrong-Spanish «jardínes»
 *     rather than the correct «jardines»; sidestepped entirely by never
 *     printing the plural anywhere (lessons OR placement).
 *   - «limpiar» is taught, drilled, and produced ONLY as a bare infinitive
 *     (after «hay que», «tengo que», «quiero», or «voy a») — no conjugated
 *     form («limpio»/«limpias»/«limpia»/«limpiamos»/«limpian»/«limpié»/
 *     «limpiaba») ever appears anywhere PRINTED, including as a wrong-answer
 *     MCQ option or tile-bank distractor — not just in a credited `atoms:`
 *     entry. Two such leaks (a sim wrong-option and two placement-bank
 *     distractors) were caught and fixed during authoring; guillemet-quoted
 *     mentions inside explanatory prose (hint/description/info body) are
 *     the one sanctioned exception, mirroring m37's own «never «yo hay
 *     que»» precedent.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim (no trailing
 *     match_pairs/speaking after it).
 *   - recall: L1 carries zero cue:"recall" steps (no earlier win line to
 *     recall from); L2-L7,L9 carry 1 each (immediately-preceding lesson's
 *     win line); L8,L10 carry 2 each (two different earlier win lines).
 *   - word_map cards: L1-L7 (7 total, one per debut/recombination lesson)
 *     — zero in L8-L10 (checkpoint, cross-recombination, mastery carry no
 *     new debut to map).
 *   - info cards: L1 (module framing / «dormitorio» recap), L9 (optional
 *     recap of both landmines — jardín singular, limpiar bare infinitive
 *     — before mastery). Zero elsewhere.
 *   - atoms debut in lesson order: dormitorio L1, sala L2, comedor L3,
 *     jardín L4, garaje L5, limpiar L6 — each on an intro-capable step
 *     (word_map doesn't count as billed exposure).
 *   - every teaching lesson (L1-L9, INCLUDING the checkpoint L8) ends
 *     dialogue_sim → match_pairs → speaking — the module's own win-line
 *     closing shape.
 *   - L7 is the "no new atom" recombination lesson pairing «me gusta»
 *     (m7) against all 5 rooms plus «hay que limpiar»; Dalia debuts there
 *     as NPC (the last unused name in ES_PROPER_NAMES, already present in
 *     moduleBarGuards.ts — no code change needed).
 *   - L9 is the cross-recombination lesson threading this module's rooms
 *     and «hay que limpiar» through m34's destinations, m14's puedo, m16's
 *     necesito — carries the optional recap info card.
 *   - NPC debuts, one new speaker per lesson: Ana (L1), Diego (L2), Carlos
 *     (L3), Elena (L4), Miguel (L5), Rosa (L6), Dalia (L7), Jorge (L8),
 *     Sofía (L9), Luis (L10).
 */
import "./index";

import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ES_M38_ATOMS, ES_M38_LESSONS, ES_M38_PLACEMENT, ES_M38_CHECKPOINT_INDEX } from "./m38";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m38",
  lessons: ES_M38_LESSONS,
  atoms: ES_M38_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m38",
  lessons: ES_M38_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m38")),
});

registerEsDoctrinePins({
  moduleId: "m38",
  lessons: ES_M38_LESSONS,
  checkpointIndex: ES_M38_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m38", ES_M38_LESSONS, ES_M38_ATOMS);

const getLesson = (n: number) => ES_M38_LESSONS[n - 1].steps;
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

/** The 6 new atoms this module registers. */
const ALL_ATOMS = ES_M38_ATOMS.map((a) => a.surface);

/** Explanatory fields legitimately quote a banned form as a negative
 * teaching example (e.g. "never «limpia» here") — grade answers/live
 * content, not every string (see grade-answers-not-every-string doctrine). */
const EXPLANATORY_FIELD = /\.(revealNote|why|explanation|body|description|gloss|replyGloss|title)$/;

/** Ground-truth recall floor per lesson, read from the compiled module —
 * mirrors m37's own recall-floor shape exactly: L1 carries zero (no
 * earlier win line to recall), L2-L7,L9 carry 1 each (the immediately-
 * preceding lesson's win line), L8 (checkpoint) and L10 (mastery) carry 2
 * each (two different earlier win lines). */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Word_map appears in exactly L1-L7 — one per debut/recombination lesson. */
const MAP_LESSONS = [1, 2, 3, 4, 5, 6, 7];

/** Info cards: L1 (module framing), L9 (optional two-landmine recap before
 * mastery). Zero elsewhere. */
const INFO_LESSONS = [1, 9];

/** Atom surface → the lesson it must debut on (intro-capable step). */
const DEBUT_LESSON: Record<string, number> = {
  dormitorio: 1, sala: 2, comedor: 3, jardín: 4, garaje: 5, limpiar: 6,
};

/** NPC debut lesson, one new speaker per lesson L1-L10. */
const NPC_DEBUT: Record<string, number> = {
  Ana: 1, Diego: 2, Carlos: 3, Elena: 4, Miguel: 5, Rosa: 6, Dalia: 7, Jorge: 8, Sofía: 9, Luis: 10,
};

describe("ES m38 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M38_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M38_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M38_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 6 new atoms: 5 nouns (each gendered) + 1 verb (no gender field), all kind vocab", () => {
    expect(ALL_ATOMS.sort()).toEqual(["comedor", "dormitorio", "garaje", "jardín", "limpiar", "sala"].sort());
    const byName = Object.fromEntries(ES_M38_ATOMS.map((a) => [a.surface, a]));
    for (const n of ["dormitorio", "sala", "comedor", "jardín", "garaje"]) {
      expect(byName[n].partOfSpeech, `${n}: expected noun`).toBe("noun");
      expect(byName[n].gender, `${n}: expected a gender`).toBeDefined();
    }
    expect(byName["limpiar"].partOfSpeech).toBe("verb");
    expect(byName["limpiar"].gender).toBeUndefined();
    for (const a of ES_M38_ATOMS) expect(a.kind, `${a.surface}: unexpected kind`).toBe("vocab");
    expect(byName["dormitorio"].gender).toBe("m");
    expect(byName["sala"].gender).toBe("f");
    expect(byName["comedor"].gender).toBe("m");
    expect(byName["jardín"].gender).toBe("m");
    expect(byName["garaje"].gender).toBe("m");
  });

  it("each atom debuts on its expected lesson, on an intro-capable step (word_map does not count)", () => {
    for (const [surface, expectedLesson] of Object.entries(DEBUT_LESSON)) {
      const re = word(surface);
      let found: { lesson: number; type: string } | null = null;
      for (const n of LESSONS) {
        for (const s of getLesson(n)) {
          if (s.type === "word_map") continue; // unbilled preview
          if (esSurfaces(s).some((x) => re.test(x.toLowerCase()))) { found = { lesson: n, type: s.type }; break; }
        }
        if (found) break;
      }
      expect(found, `«${surface}» never appears`).not.toBeNull();
      expect(ES_INTRO_TYPES.has(found!.type), `«${surface}» first appears on ${found!.type} (L${found!.lesson}), not an intro-capable step`).toBe(true);
      expect(found!.lesson, `«${surface}» must debut at L${expectedLesson}`).toBe(expectedLesson);
    }
  });

  it("every atom is PRODUCED at least 3 times (answer positions) across the module", () => {
    for (const surface of ALL_ATOMS) {
      const re = word(surface);
      const total = allSurfaces().filter((s) => re.test(s.text.toLowerCase())).length;
      expect(total, `«${surface}» produced only ${total}× (need ≥3)`).toBeGreaterThanOrEqual(3);
    }
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

  it("info cards appear in exactly L1, L9 (zero elsewhere)", () => {
    for (const n of [2, 3, 4, 5, 6, 7, 8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons, "info card must appear in exactly L1, L9").toEqual(INFO_LESSONS);
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

  it("CENTRAL RISK PIN: «jardín» is SINGULAR-ONLY — «jardines» never appears anywhere printed (lessons), including tiles/distractors/NPC lines; explanatory prose may still quote it as a negative example", () => {
    const bad: string[] = [];
    for (const { id, text } of [...allPrintedStrings(), ...allNpcLines()]) {
      if (EXPLANATORY_FIELD.test(id)) continue;
      if (word("jardines").test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `«jardines» (illegal plural) found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("CENTRAL RISK PIN: «jardín» is SINGULAR-ONLY in the placement bank too — «jardines» never appears in any placement prompt/correct/distractor", () => {
    const bad: string[] = [];
    const re = word("jardines");
    const scan = (id: string, text: string | undefined) => { if (text && re.test(text.toLowerCase())) bad.push(`${id}: «${text}»`); };
    for (const item of [ES_M38_PLACEMENT.screener, ES_M38_PLACEMENT.byModule].flat()) {
      const rec = item as unknown as Record<string, unknown>;
      scan(`${rec.id}/prompt`, rec.prompt as string | undefined);
      scan(`${rec.id}/correct`, rec.correct as string | undefined);
      for (const d of (rec.distractors as string[] | undefined) ?? []) scan(`${rec.id}/distractor`, d);
    }
    expect(bad, `«jardines» (illegal plural) found in placement:\n${bad.join("\n")}`).toEqual([]);
  });

  it("CENTRAL RISK PIN: «limpiar» is BARE-INFINITIVE ONLY — no conjugated form (limpio/limpias/limpia/limpiamos/limpian/limpié/limpiaba) ever appears anywhere printed (lessons), including a wrong-answer MCQ option or tile — not just in a credited atoms: entry", () => {
    const ILLEGAL_FORMS = ["limpio", "limpias", "limpia", "limpiamos", "limpian", "limpié", "limpiaba"];
    const bad: string[] = [];
    for (const { id, text } of [...allPrintedStrings(), ...allNpcLines()]) {
      if (EXPLANATORY_FIELD.test(id)) continue;
      const low = text.toLowerCase();
      for (const f of ILLEGAL_FORMS) {
        if (word(f).test(low)) bad.push(`${id}: «${f}» embedded in «${text}»`);
      }
    }
    expect(bad, `illegal conjugated «limpiar» form found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("CENTRAL RISK PIN: «limpiar» stays bare-infinitive in the placement bank too — no conjugated form appears in any placement prompt/correct/distractor", () => {
    const ILLEGAL_FORMS = ["limpio", "limpias", "limpia", "limpiamos", "limpian", "limpié", "limpiaba"];
    const bad: string[] = [];
    const scan = (id: string, text: string | undefined) => {
      if (!text) return;
      const low = text.toLowerCase();
      for (const f of ILLEGAL_FORMS) if (word(f).test(low)) bad.push(`${id}: «${f}» embedded in «${text}»`);
    };
    for (const item of [ES_M38_PLACEMENT.screener, ES_M38_PLACEMENT.byModule].flat()) {
      const rec = item as unknown as Record<string, unknown>;
      scan(`${rec.id}/prompt`, rec.prompt as string | undefined);
      scan(`${rec.id}/correct`, rec.correct as string | undefined);
      for (const d of (rec.distractors as string[] | undefined) ?? []) scan(`${rec.id}/distractor`, d);
    }
    expect(bad, `illegal conjugated «limpiar» form found in placement:\n${bad.join("\n")}`).toEqual([]);
  });

  it("CENTRAL RISK PIN: «limpiar» is always credited bare in atoms: entries — never fused with «hay que»/«tengo que» into one over-fused entry, and never itself expanded with a person ending in a credit array", () => {
    const irPath = path.resolve(__dirname, "ir", "m38.ir.yaml");
    const src = fs.readFileSync(irPath, "utf8");
    const bad: string[] = [];
    let checked = 0;
    for (const m of src.matchAll(/^\s*atoms:\s*\[([^\]]*)\]/gm)) {
      const entries = m[1].split(",").map((raw) => raw.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
      checked += entries.length;
      for (const e of entries) {
        if (e.startsWith("hay que ") || e.startsWith("tengo que ")) {
          bad.push(`"${e}" — over-fused, an obligation phrase must never absorb «limpiar» into one atoms: entry`);
        }
        if (/^limp/.test(e) && e !== "limpiar") {
          bad.push(`"${e}" — a conjugated/derived form of limpiar credited directly, must always be the bare "limpiar"`);
        }
      }
    }
    expect(checked, "no atoms: entries parsed — the regex has drifted").toBeGreaterThan(30);
    expect(bad, `limpiar credit trap found:\n${bad.join("\n")}`).toEqual([]);
  });

  for (const [speaker, debutLesson] of Object.entries(NPC_DEBUT)) {
    it(`PIN: ${speaker}'s NPC debut is L${debutLesson} — ${speaker} never appears as an NPC speaker before L${debutLesson}`, () => {
      for (const n of LESSONS.filter((x) => x < debutLesson)) {
        for (const s of getLesson(n)) {
          if (s.type !== "dialogue_sim") continue;
          for (const t of s.turns) {
            expect(t.npc.speaker, `L${n} sim: ${speaker} must not appear before L${debutLesson}`).not.toBe(speaker);
          }
        }
      }
      const lesson = getLesson(debutLesson).find((s) => s.type === "dialogue_sim");
      expect(lesson, `L${debutLesson} must carry a dialogue_sim`).toBeDefined();
      const speakers = lesson && lesson.type === "dialogue_sim" ? lesson.turns.map((t) => t.npc.speaker) : [];
      expect(speakers, `L${debutLesson}'s sim must feature ${speaker}`).toContain(speaker);
    });
  }

  it("every dialogue_sim NPC word (L1-L10) resolves to atoms taught ≤m38 — no untaught vocabulary in an NPC line", () => {
    // Spot-check: every NPC line is built entirely from words that also
    // appear somewhere in a graded ANSWER position within the same module
    // (a proxy for "already in the course's taught vocabulary by m38",
    // since allSurfaces() only contains post-m38-comprehensible content).
    const knownWords = new Set<string>();
    for (const { text } of allSurfaces()) {
      for (const w of text.toLowerCase().replace(/[¿?¡!.,—]/g, " ").split(/\s+/)) {
        if (w) knownWords.add(w);
      }
    }
    // «hay»/«que» are always known (m3/m37).
    knownWords.add("hay");
    knownWords.add("que");
    // NPC lines may also draw on the FULL prior course (m1-m37), not just
    // this module's own graded answers — allSurfaces() only proxies "taught
    // by m38", it isn't the whole registry. Each of these is grep-confirmed
    // as a registered atom in a module before m38: tu (m2, informal
    // possessive), tienes (m5), un (m3), perro (m5), adónde (m9), vas
    // (m18), quieres (m7), te (m13), gusta (component of «te gusta», m7),
    // qué (interrogative "what", m2).
    for (const w of ["tu", "tienes", "un", "perro", "adónde", "vas", "quieres", "te", "gusta", "qué"]) {
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
