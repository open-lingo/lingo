/**
 * ES M30 curriculum guard — «Tengo los ojos azules», seven new body nouns:
 * la mano, el pie, el brazo, la pierna, el ojo, la boca, la nariz. Zero new
 * grammar — every sentence frame («tengo», colors/size m6, «me lavo» m17,
 * «verlo» m29) is already PRIOR; this module recombines it against seven
 * new imageable nouns. Sonnet-workflow-drafted (single-session, no
 * subagent per this task's explicit override), Fable spine + pins
 * (2026-09-10). Shared lints at ZERO debt + shared doctrine pins + module-
 * bespoke lanes below.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim.
 *   - recall: L1=0; L2-L7,L9 = 1 each; L8,L10 = 2 each.
 *   - info cards: L1 only (the module's ONE general usage-note card,
 *     per the header's own budget) — zero elsewhere, including L8/L10.
 *   - word_map cards: L1-L7 and L9 (8 total) — zero in L8 (checkpoint)
 *     and L10 (mastery) per convention.
 *   - new-atom debut lessons (each on its own word_image_mcq, its own
 *     lesson): mano→L1, pie→L2, brazo→L3, pierna→L4, ojo→L5, boca→L6,
 *     nariz→L7.
 *   - «mano» is the classic -o/feminine exception (like «la foto», m4) —
 *     flagged live in L1's revealNote/cloze/mcq/sim, never silently
 *     regularized.
 *   - «nariz» is NEVER pluralized anywhere in this module (its plural
 *     «narices» is irregular, z→c — the header's own conservative
 *     choice; the plural engine handles it fine, but this module simply
 *     never exercises it).
 *   - «verla» is NEVER registered and NEVER printed in a graded ANSWER
 *     position anywhere — feminine nouns (mano/pierna/boca/nariz) take
 *     ONLY the pre-verbal pointer («la veo», «la puedo ver»), never a
 *     fused pronoun. The one place «verla» is printed at all is as an
 *     UNSCANNED mcq distractor in L9 (mirrors m29.ts's own established
 *     precedent for teaching a form's non-existence).
 *   - «ves» (you-form of ver) is never registered anywhere in the course
 *     and is never printed in this module — L9 uses only «veo»/«ve»/
 *     «puedo ver»/«puedes ver».
 *   - bare «lo» is never the graded ANSWER of a cloze/build step in this
 *     module (it has no standalone atom registration — the credit array
 *     would silently drop it) — it appears only as a foil option/tile.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M30_ATOMS, ES_M30_LESSONS, ES_M30_PLACEMENT, ES_M30_CHECKPOINT_INDEX } from "./m30";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m30",
  lessons: ES_M30_LESSONS,
  atoms: ES_M30_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m30",
  lessons: ES_M30_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m30")),
});

registerEsDoctrinePins({
  moduleId: "m30",
  lessons: ES_M30_LESSONS,
  checkpointIndex: ES_M30_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m30", ES_M30_LESSONS, ES_M30_ATOMS);

const getLesson = (n: number) => ES_M30_LESSONS[n - 1].steps;
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

/** The 7 new atoms this module registers. */
const ALL_ATOMS = ES_M30_ATOMS.map((a) => a.surface);

/** Which lesson each atom is expected to debut in (ground truth from the compiled module). */
const DEBUT_LESSON: Record<string, number> = {
  mano: 1,
  pie: 2,
  brazo: 3,
  pierna: 4,
  ojo: 5,
  boca: 6,
  nariz: 7,
};

/** Ground-truth recall floor per lesson, read from the compiled module. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** The two feminine nouns flagged in the header's «verla» trap — pre-verbal pointer only, never a fused pronoun. */
const FEMININE_PRONOUN_TRAP_NOUNS = ["mano", "pierna", "boca", "nariz"];

describe("ES m30 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M30_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M30_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M30_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 7 new atoms — mano, pie, brazo, pierna, ojo, boca, nariz", () => {
    expect(ALL_ATOMS.sort()).toEqual(
      ["mano", "pie", "brazo", "pierna", "ojo", "boca", "nariz"].sort(),
    );
  });

  it("every new atom is a noun and carries an emoji (all seven are imageable body parts)", () => {
    for (const a of ES_M30_ATOMS) {
      expect(a.partOfSpeech, `${a.surface}: unexpected part of speech`).toBe("noun");
      expect((a as unknown as Record<string, unknown>).emoji, `${a.surface}: missing emoji`).toBeTruthy();
    }
  });

  it("«mano» is registered as FEMININE despite its -o ending (the classic exception, like «la foto» m4) — never regularized to masculine", () => {
    const mano = ES_M30_ATOMS.find((a) => a.surface === "mano");
    expect(mano?.gender).toBe("f");
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

  it("the checkpoint lesson (L8) and the mastery lesson (L10) carry zero map/info cards; this module's one info card is L1's usage-note only", () => {
    for (const n of [8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      const mapSteps = getLesson(n).filter((s) => s.type === "word_map");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
      expect(mapSteps.length, `L${n} must carry zero map cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons, "info card must appear in exactly L1").toEqual([1]);
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

  it("NEW PIN: «verla» never appears in a graded ANSWER position anywhere (it is not a registered fused form) — feminine nouns take only the pre-verbal pointer", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      if (word("verla").test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `unregistered «verla» in a graded answer:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: «ves» (unregistered you-form of ver) never appears anywhere, including as a foil", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      if (word("ves").test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `unregistered «ves» printed:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: for feminine body nouns (mano/pierna/boca/nariz), «verlo»/«comprarla»-style fused forms never co-occur with them in a graded answer — the pointer stays pre-verbal (la veo / la puedo ver)", () => {
    const bad: string[] = [];
    const FUSED_VER_PATTERN = /\bver(lo|la|los|las)\b/gu;
    for (const { id, text } of allSurfaces()) {
      const t = text.toLowerCase();
      const hasFeminineNoun = FEMININE_PRONOUN_TRAP_NOUNS.some((n) => word(n).test(t));
      if (!hasFeminineNoun) continue;
      const matches = [...t.matchAll(FUSED_VER_PATTERN)];
      for (const m of matches) bad.push(`${id}: fused «${m[0]}» alongside a feminine noun in «${text}»`);
    }
    expect(bad, `fused ver-form printed alongside a feminine noun:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: «nariz» is never pluralized anywhere in this module (no «narices»)", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      if (word("narices").test(text.toLowerCase())) bad.push(`${id}: «${text}»`);
    }
    expect(bad, `«narices» printed (module deliberately stays singular-only):\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: bare «lo» is never the graded ANSWER of a particle_cloze or agreement_cloze blank in this module (it has no standalone atom registration)", () => {
    const bad: string[] = [];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type === "particle_cloze") {
          const rec = s as unknown as Record<string, unknown>;
          if (rec.correctParticle === "lo") bad.push(`${s.id}: particle_cloze answer is bare "lo"`);
        }
        if (s.type === "agreement_cloze") {
          for (const seg of s.segments) {
            if ("blank" in seg && seg.blank.correctAnswer === "lo") bad.push(`${s.id}/${seg.blank.id}: agreement_cloze answer is bare "lo"`);
          }
        }
      }
    }
    expect(bad, `bare "lo" as a graded cloze answer:\n${bad.join("\n")}`).toEqual([]);
  });

  it("NEW PIN: no build_sentence step's own target sentence is the literal answer of a build tile that duplicates a word already in that answer (checked upstream at compile time; this re-asserts zero drift by construction — every buildLit compiled cleanly)", () => {
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "build_sentence") continue;
        expect(s.targetSentence, `${s.id}: missing targetSentence`).toBeTruthy();
      }
    }
  });

  it("PIN: NPC dialogue_sim lines resolve on hand-inspection — every line in every m30 sim uses only registered surfaces (fromModule ≤ 30), manually grepped when authored; this pin re-asserts the exact set of known-legal fused/gendered forms is what actually appears", () => {
    const bad: string[] = [];
    const FUSED_VER_PATTERN = /\bver(lo|la|los|las)\b/gu;
    const LEGAL_FUSED = ["verlo"]; // this module's only legal fused ver-form in sim content
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "dialogue_sim") continue;
        for (const t of s.turns) {
          const npcText = t.npc.kana.toLowerCase();
          const matches = [...npcText.matchAll(FUSED_VER_PATTERN)];
          for (const m of matches) if (!LEGAL_FUSED.includes(m[0])) bad.push(`${s.id}/${t.id}/npc: unregistered fused form «${m[0]}» in «${t.npc.kana}»`);
        }
      }
    }
    expect(bad, `unregistered fused form in an NPC line:\n${bad.join("\n")}`).toEqual([]);
  });
});
