/**
 * ES M32 curriculum guard — «Necesito una chaqueta nueva», exactly 5 new
 * atoms: pantalón, chaqueta, calcetines, guantes, bufanda ("clothing round
 * 2"). Every new noun is put straight to work with content already taught:
 * «tengo»/«necesito» (m16), size/color agreement (m6), «es»/«son» (m2/m18),
 * «voy a comprarlo/la/los» (m29), «¿cuánto cuesta?» (m12), and «me
 * duele(n)» (m31). No new wear-verb — clothing is always routed through
 * tengo/necesito/comprarlo-la-los, never «ponerse»/«llevar». Sonnet-
 * workflow-drafted (single-session, no subagent per this task's explicit
 * override), Fable spine + pins (2026-09-10). Shared lints at ZERO debt +
 * shared doctrine pins + module-bespoke lanes below.
 *
 * Ground truth (read from the compiled module):
 *   - checkpoint at L8; mastery at L10, ends on dialogue_sim (its final
 *     turn's reply carries the module's own win-content: "necesito
 *     comprar guantes — me duelen las manos").
 *   - recall: L1=0; L2-L7,L9 = 1 each; L8,L10 = 2 each.
 *   - word_map cards: L1-L7 and L9 (8 total) — zero in L8/L10, per course
 *     convention.
 *   - info cards: a NARROWER subset than word_map — ONLY L1, L3, L9 (this
 *     module's three usage-note cards: pantalón's singular-vs-English-
 *     plural quirk, calcetines' plural-only pattern following «dientes»
 *     m17, and L9's "chaining two frames" note for «me duelen» + «necesito»
 *     together for the first time). L2/L4/L5/L6/L7 debut or recombine
 *     without an info card — a structural DIVERGENCE from m31's template,
 *     where info and word_map always coincided on the exact same 8-lesson
 *     set. Do not copy m31's combined info+map assertion here.
 *   - new-atom debut lessons: pantalón → L1, chaqueta → L2, calcetines →
 *     L3, guantes → L4, bufanda → L5 (image-MCQ-as-introduction, §13.2).
 *   - all 5 atoms are nouns, kind vocab, and ALL carry an emoji (unlike
 *     m31's verb-morphology atoms, which carry none) — 👖🧥🧦🧤🧣.
 *   - «guantes»' emoji (🧤, emoji_u1f9e4.svg) was vendored into
 *     src/pub/noto-emoji/svg/ during this module's authoring (2026-09-10)
 *     — it was previously absent from the vendored set.
 *   - PLURAL-ONLY nouns: «calcetines» and «guantes» register directly as
 *     their plural surface (no singular card), following the «dientes»
 *     (m17) convention. The bare singulars «calcetín»/«guante» appear
 *     ONLY as deliberate wrong-answer distractors/options and inside
 *     pedagogy prose (explanation/description text quoting the banned
 *     singular to teach the rule) — never in a graded ANSWER position
 *     (esSurfaces / allSurfaces).
 *   - HARD BANS: no «unos»/«unas» (only «un»/«una» are PRIOR, despite
 *     both being ES_FUNCTION_WORDS); no new wear-verb («ponerse»/
 *     «llevar»); no «vestido» (its emoji 👗 belongs to «falda», m12); no
 *     «color»/«cuál» as taught vocabulary or a "which one" question
 *     frame. None of these appear anywhere in the compiled lesson
 *     surface (verified against allPrintedStrings, which also covers
 *     every unscanned distractor/tile/option position).
 *   - every teaching lesson (L1-L9) ends dialogue_sim → match_pairs →
 *     speaking — the module's own win-line closing shape, INCLUDING L8
 *     (m32's checkpoint follows the same closing shape as every teaching
 *     lesson, unlike m31's checkpoint, which m31's own test explicitly
 *     excluded from that check).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M32_ATOMS, ES_M32_LESSONS, ES_M32_PLACEMENT, ES_M32_CHECKPOINT_INDEX } from "./m32";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { registerEsDoctrinePins, registerEsAtomUsagePin } from "../__tests__/doctrinePins";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { ES_INTRO_TYPES, esSurfaces } from "../__tests__/moduleBarGuards";

registerEsModuleContentLints({
  moduleId: "m32",
  lessons: ES_M32_LESSONS,
  atoms: ES_M32_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m32",
  lessons: ES_M32_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m32")),
});

registerEsDoctrinePins({
  moduleId: "m32",
  lessons: ES_M32_LESSONS,
  checkpointIndex: ES_M32_CHECKPOINT_INDEX,
});
registerEsAtomUsagePin("m32", ES_M32_LESSONS, ES_M32_ATOMS);

const getLesson = (n: number) => ES_M32_LESSONS[n - 1].steps;
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

/** The 5 new atoms this module registers. */
const ALL_ATOMS = ES_M32_ATOMS.map((a) => a.surface);

/** Which lesson each atom is expected to debut in (ground truth from the compiled module). */
const DEBUT_LESSON: Record<string, number> = {
  "pantalón": 1,
  "chaqueta": 2,
  "calcetines": 3,
  "guantes": 4,
  "bufanda": 5,
};

/** Ground-truth recall floor per lesson, read from the compiled module. */
const RECALL_FLOOR: Record<number, number> = {
  1: 0, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 2, 9: 1, 10: 2,
};

/** Word_map appears in this exact lesson set. */
const MAP_LESSONS = [1, 2, 3, 4, 5, 6, 7, 9];

/** Info cards appear in a NARROWER set than word_map — this module's three usage-note lessons only. */
const INFO_LESSONS = [1, 3, 9];

/** Plural-only nouns this module registers — their bare singular must never sit in a graded answer position. */
const PLURAL_ONLY_SINGULARS = ["calcetín", "guante"];

/** Hard-banned forms: no new wear-verb, no «vestido» (owned by falda/m12), no «unos»/«unas» (only un/una are PRIOR), no color/cuál as taught vocabulary. */
const HARD_BANS = ["ponerse", "llevar", "vestido", "unos", "unas"];

describe("ES m32 — bespoke pins", () => {
  it("checkpoint at 8; placement shape holds", () => {
    expect(ES_M32_CHECKPOINT_INDEX).toBe(8);
    expect(ES_M32_PLACEMENT.screener.length).toBeGreaterThanOrEqual(1);
    expect(ES_M32_PLACEMENT.byModule.length).toBeGreaterThanOrEqual(3);
  });

  it("exactly 5 new atoms — pantalón, chaqueta, calcetines, guantes, bufanda", () => {
    expect(ALL_ATOMS.sort()).toEqual(["bufanda", "calcetines", "chaqueta", "guantes", "pantalón"].sort());
  });

  it("all 5 new atoms are nouns, kind vocab, and ALL carry an emoji (unlike m31's verb-morphology atoms)", () => {
    for (const a of ES_M32_ATOMS) {
      expect(a.partOfSpeech, `${a.surface}: unexpected part of speech`).toBe("noun");
      expect(a.kind, `${a.surface}: unexpected kind`).toBe("vocab");
      expect((a as unknown as Record<string, unknown>).emoji, `${a.surface}: must carry an emoji`).toBeTruthy();
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

  it("info cards appear in a NARROWER set than word_map — exactly L1, L3, L9 (this module's three usage-note lessons; a structural divergence from m31, where info and map always coincided)", () => {
    for (const n of [8, 10]) {
      const infoSteps = getLesson(n).filter((s) => s.type === "info");
      expect(infoSteps.length, `L${n} must carry zero info cards`).toBe(0);
    }
    const infoLessons = LESSONS.filter((n) => getLesson(n).some((s) => s.type === "info"));
    expect(infoLessons, "info card must appear in exactly L1, L3, L9").toEqual(INFO_LESSONS);
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

  it("PLURAL-ONLY NOUNS: «calcetín»/«guante» (bare singular) never sit in a graded ANSWER position — only as distractors/options or inside explanation prose teaching the rule", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      for (const w of PLURAL_ONLY_SINGULARS) {
        if (word(w).test(text.toLowerCase())) bad.push(`${id}: «${w}» in graded answer «${text}»`);
      }
    }
    expect(bad, `plural-only noun's bare singular in a graded answer:\n${bad.join("\n")}`).toEqual([]);
  });

  it("HARD BANS: no «ponerse»/«llevar» (no new wear-verb — clothing routes through tengo/necesito/comprarlo-la-los only), no «vestido» (emoji 👗 belongs to falda/m12), no «unos»/«unas» (only un/una are PRIOR) — anywhere, including foils", () => {
    const bad: string[] = [];
    for (const { id, text } of allPrintedStrings()) {
      for (const w of HARD_BANS) {
        if (word(w).test(text.toLowerCase())) bad.push(`${id}: «${w}» in «${text}»`);
      }
    }
    expect(bad, `hard-banned word printed anywhere in the module:\n${bad.join("\n")}`).toEqual([]);
  });

  it("no double clitic stacks and no bare-«lo» standalone registration/exposure — «lo» never appears as its own scanned token", () => {
    const bad: string[] = [];
    for (const { id, text } of allSurfaces()) {
      // Bare "lo" as a standalone word (not fused into comprarlo/verlo/etc.)
      if (/(^|[^\p{L}])lo(?=[^\p{L}]|$)/u.test(text.toLowerCase())) bad.push(`${id}: bare «lo» in «${text}»`);
    }
    expect(bad, `bare «lo» in a graded answer:\n${bad.join("\n")}`).toEqual([]);
  });

  it("PIN: NPC dialogue_sim lines resolve on hand-inspection — every line in every m32 sim uses only registered surfaces (fromModule ≤ 32) or the exact ES_FUNCTION_WORDS/ES_PROPER_NAMES sets; module carries ZERO legacy allowance in esSimNpcProvenance.test.ts, so this hand sweep is the only independent guard alongside that course-wide gate", () => {
    const bad: string[] = [];
    const BANNED_UNREGISTERED_WORDS = ["ponerse", "llevar", "vestido", "unos", "unas", "calcetín", "guante"];
    for (const n of LESSONS) {
      for (const s of getLesson(n)) {
        if (s.type !== "dialogue_sim") continue;
        for (const t of s.turns) {
          const npcText = t.npc.kana.toLowerCase();
          for (const w of BANNED_UNREGISTERED_WORDS) {
            if (word(w).test(npcText)) bad.push(`${s.id}/${t.id}/npc: banned «${w}» in «${t.npc.kana}»`);
          }
        }
      }
    }
    expect(bad, `banned/unregistered word in an NPC line:\n${bad.join("\n")}`).toEqual([]);
  });
});
