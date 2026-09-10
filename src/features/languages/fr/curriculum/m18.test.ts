/**
 * FR m18 curriculum guard — the «Jamais, rien, plus» module. Standard
 * suite in the m12–m17.test.ts shape, plus bespoke pins from the
 * coordinator's speech-negation constraints (committed 807d3205,
 * docs/fr-speech-negation-2026-09-10.md):
 *   (a) no `speaking` step's targetPhrase ever contains a «ne ... plus»
 *       negation construction — that band stays written-only pending an
 *       edge-tts clip listen (constraint 5).
 *   (b) no `listening_comprehension` step's audioText contains a
 *       «ne ... plus» negation construction either — same written-only
 *       reasoning extended to ear-graded content, not just mic-graded.
 *   (c) no `speaking` step ever targets the bare word «jamais» alone —
 *       every jamais speaking target must be a full sentence (constraint
 *       2 — the written substring "mais" risks a false-positive
 *       loose-match against the unrelated word «mais»).
 *   (d) no «encore» recall is ever paired against a «ne...plus» target as
 *       spoken alternates (constraint 4) — verified structurally, since
 *       (a) already proves no «ne...plus» is ever spoken at all.
 */
import { describe, it, expect } from "vitest";
// Entry-point guard (2026-09-10, docs/fr-article-glob-race-2026-09-10.md):
// this file must not become the curriculum-module import entry point, or
// the numeric glob-order fix loses to a circular-import skip (see the fix
// note in courseAtoms.ts).
import "../courseAtoms";
import { FR_M1_MODULE } from "./m1";
import { FR_M2_MODULE } from "./m2";
import { FR_M3_MODULE } from "./m3";
import { FR_M4_MODULE } from "./m4";
import { FR_M5_MODULE } from "./m5";
import { FR_M6_MODULE } from "./m6";
import { FR_M7_MODULE } from "./m7";
import { FR_M8_MODULE } from "./m8";
import { FR_M9_MODULE } from "./m9";
import { FR_M10_MODULE } from "./m10";
import { FR_M11_MODULE } from "./m11";
import { FR_M12_MODULE } from "./m12";
import { FR_M13_MODULE } from "./m13";
import { FR_M14_MODULE } from "./m14";
import { FR_M15_MODULE } from "./m15";
import { FR_M16_MODULE } from "./m16";
import { FR_M17_MODULE } from "./m17";
import { FR_M18_ATOMS, FR_M18_MODULE, FR_M18_CHECKPOINT_INDEX } from "./m18";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import type { LessonStep } from "@/features/lesson/types";

registerFrModuleContentLints({
  moduleId: "m18",
  lessons: FR_M18_MODULE.lessons,
  atoms: FR_M18_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m18",
  lessons: FR_M18_MODULE.lessons,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9",
    "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17",
  ],
});

const LESSONS = FR_M18_MODULE.lessons;
const COUNT = LESSONS.length;

// No new homophoneKey pairs this module — «rien»/«bien» is a real risk
// (both are pre-authorized chrome, see FR_FUNCTION_WORDS) but neither
// atom carries a formal homophoneKey; kept empty per m12/m17.test.ts's
// own precedent rather than omitted, so a future addition has an
// obvious place to land.
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

/** Matches «ne»/«n'» ... «plus» within the same clause (bounded by
 *  sentence punctuation so it can't bridge two sentences in one string)
 *  — the negation construction the speech-negation constraints require
 *  to stay written-only. Does NOT match «moi non plus» (no preceding
 *  ne/n' clitic — "non" is not "ne"/"n'") or a bare «plus» used as
 *  "more" without a negating «ne». */
const NE_PLUS_NEGATION = /\bn(?:e|')\b[^.!?,]{0,24}\bplus\b/i;

describe("FR m18 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M18_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m18 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m18 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M18_CHECKPOINT_INDEX) {
        expect(infoCount, "checkpoint/integration/mastery carry no cards").toBe(0);
      } else {
        expect(infoCount).toBeLessThanOrEqual(1);
      }
    });

    it(`L${n}: exercised atoms resolve to registered fr: ids`, () => {
      for (const s of LESSONS[n - 1].steps) {
        const ex = (s as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
        for (const id of ex) expect(id.startsWith("fr:")).toBe(true);
      }
    });
  }

  it("checkpoint and mastery are graded steps only", () => {
    for (const n of [FR_M18_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m18 L${n} carries a non-graded step`,
      ).toBe(true);
    }
  });

  it("the module ends on a sim — not a grid (R7)", () => {
    const steps = LESSONS[COUNT - 1].steps;
    expect(steps[steps.length - 1].type).toBe("dialogue_sim");
  });

  it("no listening bank co-tiles a homophone pair (one sound, pin §1)", () => {
    const checkBank = (bank: readonly string[], where: string) => {
      const set = new Set(bank.map((t) => t.toLowerCase()));
      for (const [a, b] of HOMOPHONE_PAIRS) {
        expect(
          set.has(a) && set.has(b),
          `${where}: "${a}"/"${b}" co-tiled in an ear-answered bank`,
        ).toBe(false);
      }
    };
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type === "listening_build") checkBank(s.tiles, `${l.id}/${s.id}`);
        if (s.type === "liaison_listen") checkBank(s.words, `${l.id}/${s.id}`);
      }
    }
  });

  it("has ZERO typed translate steps — beginner production is tile builds", () => {
    const count = LESSONS.flatMap((l) =>
      l.steps.filter((s) => s.type === "translate"),
    ).length;
    expect(count).toBe(0);
  });

  it("no sim offers the NPC's own line as a WRONG option (§13.6)", () => {
    const norm = (t: string) => t.toLowerCase().replace(/[!?.,«»\s]+/g, " ").trim();
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "dialogue_sim") continue;
        for (const turn of s.turns) {
          if (turn.reply.mode !== "choice") continue;
          const npcLine = norm(turn.npc.kana);
          for (const opt of turn.reply.options) {
            if (norm(opt.text) !== npcLine) continue;
            const accepted =
              opt.id === turn.reply.correctOptionId ||
              (turn.reply.alsoCorrectOptionIds ?? []).includes(opt.id);
            expect(
              accepted,
              `m18 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("micro-sim goal lines stay terse", () => {
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "dialogue_sim") continue;
        for (const turn of s.turns) {
          expect(
            turn.goal.split(/\s+/).length,
            `m18 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m18 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m18Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m18Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m18 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
              ).toBe(true);
            }
          } else {
            voiced.add(s.targetPhrase);
          }
        }
      }
    };
    walk(FR_M1_MODULE.lessons, false);
    walk(FR_M2_MODULE.lessons, false);
    walk(FR_M3_MODULE.lessons, false);
    walk(FR_M4_MODULE.lessons, false);
    walk(FR_M5_MODULE.lessons, false);
    walk(FR_M6_MODULE.lessons, false);
    walk(FR_M7_MODULE.lessons, false);
    walk(FR_M8_MODULE.lessons, false);
    walk(FR_M9_MODULE.lessons, false);
    walk(FR_M10_MODULE.lessons, false);
    walk(FR_M11_MODULE.lessons, false);
    walk(FR_M12_MODULE.lessons, false);
    walk(FR_M13_MODULE.lessons, false);
    walk(FR_M14_MODULE.lessons, false);
    walk(FR_M15_MODULE.lessons, false);
    walk(FR_M16_MODULE.lessons, false);
    walk(FR_M17_MODULE.lessons, false);
    walk(LESSONS, true);
    expect(m18Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m18 pins (docs/fr-m18-brief-2026-09-10.md +
  //    docs/fr-speech-negation-2026-09-10.md) ──────────────────────────────

  /** Every French string a step surfaces to the learner — mirrors
   *  fr-quality.test.ts's stepFrenchStrings, plus dialogue_sim turns
   *  (which that shared helper deliberately skips). */
  function allFrenchStrings(step: LessonStep): string[] {
    const s = step as Record<string, unknown>;
    const out: string[] = [];
    for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
      if (typeof s[k] === "string") out.push(s[k] as string);
    }
    if (Array.isArray(s.tokens)) out.push(...(s.tokens as string[]));
    if (Array.isArray(s.tiles)) out.push(...(s.tiles as string[]));
    if (typeof s.correctParticle === "string") out.push(s.correctParticle as string);
    if (Array.isArray(s.options)) {
      for (const o of s.options as Array<{ text?: string }>) {
        if (typeof o.text === "string") out.push(o.text);
      }
    }
    if (Array.isArray(s.pairs)) {
      for (const p of s.pairs as Array<{ source?: string }>) {
        if (typeof p.source === "string") out.push(p.source);
      }
    }
    if (s.type === "dialogue_sim") {
      const sim = s as unknown as {
        turns: Array<{
          npc: { kana: string; audioText?: string };
          reply: { audioText?: string; mode: string; options?: Array<{ text: string }>; answer?: string };
        }>;
      };
      for (const t of sim.turns) {
        out.push(t.npc.kana);
        if (t.npc.audioText) out.push(t.npc.audioText);
        if (t.reply.audioText) out.push(t.reply.audioText);
        if (t.reply.mode === "choice" && t.reply.options) {
          out.push(...t.reply.options.map((o) => o.text));
        }
        if (t.reply.mode === "build" && t.reply.answer) out.push(t.reply.answer);
      }
    }
    return out;
  }

  /** Same field set as allFrenchStrings, but reads ANSWER positions only —
   *  a multiple_choice/dialogue_sim reply's correct option, never its
   *  wrong-form distractors (grade-answers-not-every-string — this
   *  module's own sentenceMcq distractors deliberately print «plus» as a
   *  wrong-option foil against «jamais»/«rien» targets, which must not
   *  trip a content pin). */
  function answerPositionFrenchStrings(step: LessonStep): string[] {
    const s = step as Record<string, unknown>;
    const out: string[] = [];
    for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
      if (typeof s[k] === "string") out.push(s[k] as string);
    }
    if (Array.isArray(s.tokens)) out.push(...(s.tokens as string[]));
    if (Array.isArray(s.tiles)) out.push(...(s.tiles as string[]));
    if (typeof s.correctParticle === "string") out.push(s.correctParticle as string);
    if (Array.isArray(s.options) && typeof s.correctOptionId === "string") {
      const opt = (s.options as Array<{ id: string; text?: string }>).find(
        (o) => o.id === s.correctOptionId,
      );
      if (opt?.text) out.push(opt.text);
    }
    if (Array.isArray(s.pairs)) {
      for (const p of s.pairs as Array<{ source?: string }>) {
        if (typeof p.source === "string") out.push(p.source);
      }
    }
    if (s.type === "dialogue_sim") {
      const sim = s as unknown as {
        turns: Array<{
          npc: { kana: string; audioText?: string };
          reply: {
            audioText?: string;
            mode: string;
            options?: Array<{ id: string; text: string }>;
            correctOptionId?: string;
            answer?: string;
          };
        }>;
      };
      for (const t of sim.turns) {
        out.push(t.npc.kana);
        if (t.npc.audioText) out.push(t.npc.audioText);
        if (t.reply.audioText) out.push(t.reply.audioText);
        if (t.reply.mode === "choice" && t.reply.options) {
          const opt = t.reply.options.find((o) => o.id === t.reply.correctOptionId);
          if (opt) out.push(opt.text);
        }
        if (t.reply.mode === "build" && t.reply.answer) out.push(t.reply.answer);
      }
    }
    return out;
  }

  it("no `speaking` step's targetPhrase ever contains a «ne...plus» negation (written-only until edge-tts, constraint 5)", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "speaking") continue;
        if (NE_PLUS_NEGATION.test(s.targetPhrase)) {
          bad.push(`${l.id}/${s.id}: "${s.targetPhrase}"`);
        }
      }
    }
    expect(bad, `speaking step targets ne...plus negation: ${bad.join("; ")}`).toEqual([]);
  });

  it("no `listening_comprehension` step's audioText ever contains a «ne...plus» negation (constraint 5, ear-graded too)", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "listening_comprehension") continue;
        const audio = (s as unknown as { audioText: string }).audioText;
        if (NE_PLUS_NEGATION.test(audio)) {
          bad.push(`${l.id}/${s.id}: "${audio}"`);
        }
      }
    }
    expect(bad, `listening_comprehension step targets ne...plus negation: ${bad.join("; ")}`).toEqual([]);
  });

  it("no `speaking` step ever targets the bare word «jamais» alone (constraint 2 — mais-substring false positive)", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "speaking") continue;
        if (s.targetPhrase.trim().toLowerCase() === "jamais") {
          bad.push(`${l.id}/${s.id}`);
        }
      }
    }
    expect(bad, `isolated bare-word "jamais" speaking target: ${bad.join("; ")}`).toEqual([]);
  });

  it("no `speaking` step ever targets the bare word «rien» alone (same caution extended to rien for consistency)", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "speaking") continue;
        if (s.targetPhrase.trim().toLowerCase() === "rien") {
          bad.push(`${l.id}/${s.id}`);
        }
      }
    }
    expect(bad, `isolated bare-word "rien" speaking target: ${bad.join("; ")}`).toEqual([]);
  });

  it("no jamais-vs-rien or rien-vs-bien discrimination is tested via a `speaking` step (constraint 3 — build/cloze/MCQ only)", () => {
    // A speaking step is fine as long as its own prompt doesn't ask the
    // learner to CHOOSE between jamais/rien/bien — that job belongs to
    // sentenceMcq/build/cloze. Speaking steps in this module target full
    // sentences containing exactly one of the three, never a bare
    // discrimination prompt.
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "speaking") continue;
        const phrase = s.targetPhrase.toLowerCase();
        const hits = ["jamais", "rien", "bien"].filter((w) =>
          new RegExp(`\\b${w}\\b`).test(phrase),
        );
        if (hits.length > 1) bad.push(`${l.id}/${s.id}: "${s.targetPhrase}" (${hits.join(",")})`);
      }
    }
    expect(bad, `speaking step conflates jamais/rien/bien in one sentence: ${bad.join("; ")}`).toEqual([]);
  });

  it("no dialogue_sim correct-reply audio ever contains a «ne...plus» negation (constraint 5, extended to sim reply audio)", () => {
    // dialogue_sim reply.audioText is voiced back to confirm the learner's
    // choice — the same TTS-graded-content risk speaking/listening carry.
    // answerPositionFrenchStrings reads only the CORRECT sim-reply option
    // (and cloze/build answer positions, harmless here — a bare "plus" or
    // "jamais"/"rien" token never matches the ne...plus regex on its own).
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "dialogue_sim") continue;
        for (const text of answerPositionFrenchStrings(s)) {
          if (NE_PLUS_NEGATION.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `sim reply answer-position targets ne...plus negation: ${bad.join("; ")}`).toEqual([]);
  });

  it("«moi non plus» (the fixed idiom) is never conflated with a productive «ne...plus» frame use in one sentence", () => {
    const bad: string[] = [];
    const idiom = /\bmoi non plus\b/i;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of allFrenchStrings(s)) {
          if (idiom.test(text) && NE_PLUS_NEGATION.test(text.replace(idiom, ""))) {
            bad.push(`${l.id}/${s.id}: "${text}"`);
          }
        }
      }
    }
    expect(bad, `sentence mixes idiom "moi non plus" with a productive ne...plus frame: ${bad.join("; ")}`).toEqual([]);
  });
});
