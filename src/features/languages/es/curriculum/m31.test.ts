/**
 * ES M31 curriculum guard — «Me duele la mano», exactly 2 new atoms:
 * duele, duelen. Dative-experiencer «doler» rides the exact word order
 * «me gusta»/«me gustan» already taught in m13, applied to m30's seven
 * body nouns. Zero new nouns, zero new emoji (neither atom carries one —
 * a verb-morphology word, same class as m13's own «gusta»/«gustan»).
 * Sonnet-workflow-drafted (single-session, no subagent per this task's
 * explicit override), Fable spine + pins (2026-09-10). Shared lints at
 * ZERO debt + shared doctrine pins + module-bespoke lanes below.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim (its final
 *     turn's reply IS the module's own win-line: "no, no puedo porque
 *     me duele la mano").
 *   - recall: L1=0; L2,L4,L5,L6,L7,L9 = 1 each; L3,L8,L10 = 2 each.
 *   - info cards: L1-L7 and L9 (8 total) — zero in L8 (checkpoint) and
 *     L10 (mastery), per course convention.
 *   - word_map cards: same 8 lessons as info (L1-L7, L9) — zero in
 *     L8/L10.
 *   - new-atom debut lessons: duele → L1 (on the info card, quoted in
 *     guillemets — a verb-morphology word has no emoji, so this is NOT
 *     a word_image_mcq debut, matching m13's own «gusta» precedent);
 *     duelen → L2 (same device). «duelen» is banned from EVERY scanned
 *     surface in L1 (a clozeLit `options:` list IS scanned by
 *     esSurfaces — L1's own cloze blanks the el/la article instead of
 *     duele/duelen, specifically to keep L2 as duelen's one narrative
 *     debut); it appears in L1 only inside mcq/textMcq distractor
 *     arrays, which esSurfaces does NOT scan.
 *   - THE CENTRAL DISCRIMINATION (header's own mandate): «duele»/
 *     «duelen» never correctly conjugate to the person — no «*duelo»/
 *     «*dueles»/«*duelemos» as a correct answer anywhere. Every
 *     discrimination step keeps this foil in an UNSCANNED position
 *     (mcq/textMcq distractors, agreement_cloze blank options, sim
 *     wrong-choice options/build tiles) — never in a clozeLit
 *     `options:` list or as any step's correct/graded answer.
 *   - scope is yo/tú/3rd-singular-via-«le» ONLY: «nos»/«les» dative-
 *     plural never appear anywhere in this module, not even as a sim
 *     foil (an earlier draft's L2 sim briefly used "nos" as a wrong
 *     choice and was corrected to "te" before shipping, to stay
 *     strictly in scope).
 *   - «cabeza» never appears (not PRIOR; the header explicitly reserves
 *     it, and every other un-taught body noun, to a future module).
 *   - «tengo»-family + colors/size (azul, grande, pequeño) are RESERVED
 *     to L9's own dedicated tengo-vs-duele contrast lesson. The ONE
 *     exception: L10 (mastery) opens with a `cue: recall` of L9's own
 *     win-line ("tengo los ojos azules, pero me duelen") — pure
 *     retrieval of already-taught content, not new teaching, which the
 *     header's reservation was about.
 *   - «nariz» is never pluralized (no «narices») anywhere in the ten
 *     compiled lessons. It DOES appear as a deliberate wrong-answer
 *     distractor inside `docs/es-ir-sources/m31-placement.yaml`
 *     (pl-4, testing recognition that the plural is wrong) — pre-
 *     existing placement content, not part of the compiled lesson
 *     surface this file's pins scan.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M31_ATOMS, ES_M31_LESSONS, ES_M31_PLACEMENT, ES_M31_CHECKPOINT_INDEX } from "./m31";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m31",
  lessons: ES_M31_LESSONS,
  atoms: ES_M31_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m31",
  lessons: ES_M31_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m31")),
});

registerEsDoctrinePins({
  moduleId: "m31",
  lessons: ES_M31_LESSONS,
  checkpointIndex: ES_M31_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m31", ES_M31_LESSONS, ES_M31_ATOMS);

const getLesson = (n: number) => ES_M31_LESSONS[n - 1].steps;
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

/** Accent-safe word boundary: JS \b is blind to accented letters. */
const word = (w: string) => new RegExp(`(^|[^\\p{L}])${w}(?=[^\\p{L}]|$)`, "u");

/** The 2 new atoms this module registers. */
const ALL_ATOMS = ES_M31_ATOMS.map((a) => a.surface);

/** Which lesson each atom is expected to debut in (ground truth from the compiled module). */
const DEBUT_LESSON: Record<string, number> = {
  duele: 1,
  duelen: 2,
};

/** Ground-truth recall floor per lesson, read from the compiled module. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Never-conjugates-to-the-person foil forms — legal ONLY as unscanned distractors, never a graded answer. */
const PERSON_CONJUGATED_FOILS = ["duelo", "dueles", "duelemos"];

/** Scope ban: dative-plural pronouns explicitly excluded from this module (m31 covers yo/tú/3rd-singular-via-«le» only). */
const OUT_OF_SCOPE_DATIVE = ["nos", "les"];

/** tengo-family + colors/size — reserved to L9's dedicated contrast lesson (plus one pure recall in L10). */
const TENGO_FAMILY_AND_COLOR_SIZE = ["tengo", "tienes", "tiene", "azul", "azules", "grande", "grandes", "pequeño", "pequeños", "pequeña", "pequeñas"];

describe("ES m31 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M31_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M31_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M31_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 2 new atoms — duele, duelen", () => {
    expect(ALL_ATOMS.sort()).toEqual(["duele", "duelen"].sort());
  });

  it("both new atoms are verbs, kind vocab, and carry NO emoji (verb-morphology words, same class as m13's «gusta»/«gustan»)", () => {
    for (const a of ES_M31_ATOMS) {
      expect(a.partOfSpeech, `${a.surface}: unexpected part of speech`).toBe("verb");
      expect(a.kind, `${a.surface}: unexpected kind`).toBe("vocab");
      expect((a as unknown as Record<string, unknown>).emoji, `${a.surface}: must NOT carry an emoji`).toBeUndefined();
    }
  });

  it("each new atom debuts on an intro-capable step (word_map does not count), at its expected lesson", () => {
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

  it("«duelen» never appears on any SCANNED surface in L1 (esSurfaces), preserving L2 as its sole narrative debut — distractor-only positions are fine", () => {
    const hits: string[] = [];
    for (const s of getLesson(1)) {
      if (esSurfaces(s).some((surf) => word("duelen").test(surf.toLowerCase()))) {
        hits.push(s.id);
      }
    }
    expect(hits, `«duelen» found on a scanned L1 surface: ${hits.join(", ")}`).toEqual([]);
  });

  it("each new atom is PRODUCED at least 2 times (answer positions) across the module", () => {
    const short: string[] = [];
    for (const w of ALL_ATOMS) {
      const re = word(w);
      const hits = LESSONS.map((n) => allSurfaces([n]).filter((s) => re.test(s.text.toLowerCase())).length);
      const total = hits.reduce((a, b) => a + b, 0);
      if (total < 2) short.push(`«${w}» ${total}×`);
    }
    expect(short, `under-produced atoms:\n${short.join("\n")}`).toEqual([]);
  });

  it("recall floor (ground truth read from the compiled module): L1 zero; L2,L4-L7,L9 carry ≥1; L3,L8,L10 carry ≥2", () => {
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

  it("every teaching lesson (L1-L7, L9) ends sim → match_pairs → speaking (the module's own win-line closing shape)", () => {
    for (const n of [1, 2, 3, 4, 5, 6, 7, 9]) {
      const steps = getLesson(n);
      const last3 = steps.slice(-3).map((s) => s.type);
      expect(last3, `L${n} must end [dialogue_sim, match_pairs, speaking]`).toEqual(["dialogue_sim", "match_pairs", "speaking"]);
    }
  });

  it("the checkpoint lesson (L8) and the mastery lesson (L10) carry zero map/info cards; info/map cards appear in exactly L1-L7 and L9", () => {
    for (const n of [8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      const mapSteps = getLesson(n).filter((s) => s.type === "word_map");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
      expect(mapSteps.length, `L${n} must carry zero map cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons, "info card must appear in exactly L1-L7 and L9").toEqual([1, 2, 3, 4, 5, 6, 7, 9]);
    const mapLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "word_map"));
    expect(mapLessons, "word_map card must appear in exactly L1-L7 and L9").toEqual([1, 2, 3, 4, 5, 6, 7, 9]);
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

  it("THE CENTRAL DISCRIMINATION: «duele»/«duelen» never correctly conjugate to the person — no «duelo»/«dueles»/«duelemos» as a graded ANSWER anywhere", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      for (const foil of PERSON_CONJUGATED_FOILS) {
        if (word(foil).test(text.toLowerCase())) bad.push(`${id}: «${foil}» in graded answer «${text}»`);
      }
    }
    expect(bad, `person-conjugated «doler» form in a graded answer:\n${bad.join("\n")}`).toEqual([]);
  });

  it("the never-conjugate-to-person foil is actually exercised (present as a printed distractor) in a healthy number of discrimination steps, not just theoretically banned", () => {
    let count = 0;
    for (const { text } of allPrintedStrings()) {
      if (PERSON_CONJUGATED_FOILS.some((f) => word(f).test(text.toLowerCase()))) count++;
    }
    expect(count, "person-conjugated foil should appear as a distractor multiple times across the module").toBeGreaterThanOrEqual(8);
  });

  it("SCOPE: «nos»/«les» dative-plural never appear anywhere in this module, not even as a foil (module covers yo/tú/3rd-singular-via-«le» only)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      for (const w of OUT_OF_SCOPE_DATIVE) {
        if (word(w).test(text.toLowerCase())) bad.push(`${id}: «${w}» in «${text}»`);
      }
    }
    expect(bad, `out-of-scope dative pronoun printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("«cabeza» never appears anywhere (not PRIOR; reserved to a future module per the header)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      if (word("cabeza").test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `unregistered «cabeza» printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("«nariz» is never pluralized anywhere in the compiled lessons (no «narices») — it stays singular-only", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      if (word("narices").test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `«narices» printed in a compiled lesson (module deliberately stays singular-only):\n${bad.join("\n")}`).toEqual([]);
  });

  it("tengo-family + colors/size (tengo/tienes/tiene, azul, grande, pequeño) appear ONLY in L9's own teaching, plus L10's single pure recall of L9's win-line — never as new teaching elsewhere", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      if (n === 9) continue; // L9 is the dedicated contrast lesson — fully permitted
      for (const s of getLesson(n)) {
        const rec = s as unknown as Record<string, unknown>;
        const isPureRecall = n === 10 && rec.cue === "recall";
        if (isPureRecall) continue; // L10's recall of L9's own win-line — retrieval, not new teaching
        const hay = allPrintedStrings([n]).filter((p) => p.id.startsWith(s.id));
        for (const { id, text } of hay) {
          for (const w of TENGO_FAMILY_AND_COLOR_SIZE) {
            if (word(w).test(text.toLowerCase())) bad.push(`${id} (L${n}, non-recall): «${w}» in «${text}»`);
          }
        }
      }
    }
    expect(bad, `tengo-family/color/size content outside L9 (and L10's own recall):\n${bad.join("\n")}`).toEqual([]);
  });

  it("L9's tengo-vs-duele contrast never mixes both verbs inside one clause — same body part flips grammatical role across two SEPARATE clauses joined by «pero»/«y», never combined in one clause", () => {
    const bad: string[] = [];
    const bothVerbsInOneClause = /\b(tengo|tienes|tiene)\b[^,;]*\b(duele|duelen)\b|\b(duele|duelen)\b[^,;]*\b(tengo|tienes|tiene)\b/i;
    for (const { id, text } of allSurfaces([9])) {
      // Split on the clause-joining conjunctions the module actually uses.
      const clauses = text.split(/\bpero\b|\by\b|,/i);
      for (const clause of clauses) {
        if (bothVerbsInOneClause.test(clause)) bad.push(`${id}: both verbs in one clause — «${clause.trim()}»`);
      }
    }
    expect(bad, `tengo/duele mixed within a single clause:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: NPC dialogue_sim lines resolve on hand-inspection — every line in every m31 sim uses only registered surfaces (fromModule ≤ 31) or the exact ES_FUNCTION_WORDS/ES_PROPER_NAMES sets, manually grepped when authored (dialogue_sim carries ZERO esSurfaces coverage, so this pin is the only automated guard); the banned-word sweep re-asserts none of the five landmine words caught during authoring (lavarme, sólo, pasó, por qué/juega/algo/nada, conmigo) ever reached the compiled module", () => {
    const bad: string[] = [];
    const BANNED_UNREGISTERED_WORDS = ["lavarme", "pasó", "algo", "nada", "juega", "conmigo"];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "dialogue_sim") continue;
        for (const t of s.turns) {
          const npcText = t.npc.kana.toLowerCase();
          if (/sólo/.test(npcText)) bad.push(`${s.id}/${t.id}/npc: accented "sólo" (course uses unaccented "solo") in «${t.npc.kana}»`);
          if (/por qué/.test(npcText)) bad.push(`${s.id}/${t.id}/npc: unregistered "por qué" in «${t.npc.kana}»`);
          for (const w of BANNED_UNREGISTERED_WORDS) {
            if (word(w).test(npcText)) bad.push(`${s.id}/${t.id}/npc: unregistered «${w}» in «${t.npc.kana}»`);
          }
        }
      }
    }
    expect(bad, `banned/unregistered word in an NPC line:\n${bad.join("\n")}`).toEqual([]);
  });
});
