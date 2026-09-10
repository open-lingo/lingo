/**
 * FR m17 curriculum guard — the «De onze à cent» module. Standard suite in
 * the m12–m16.test.ts shape, plus bespoke pins from
 * docs/fr-m17-brief-2026-09-10.md:
 *   (a) «l'onze» (the wrongly-elided form) never appears anywhere — «onze»
 *       carries `consonantOnset: true` and must always read «le onze».
 *   (b) no `speaking` step ever targets a number in 70–99 — that band is
 *       written-only (`ROMANCE_NUMBER_WORDS` covers only 0–20, mirrors
 *       m12's own NUMBER_ABOVE_TWENTY pin, but the ceiling here is vingt
 *       (20), not eleven — teens 11-19 and vingt itself stay speakable).
 *   (c) «quatre-vingts» (with the silent plural -s) never appears glued to
 *       a following unit — the -s is exclusive to exactly-80; every
 *       quatre-vingt-N (N=1..19) form must drop it.
 */
import { describe, it, expect } from "vitest";
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
import { FR_M17_ATOMS, FR_M17_MODULE, FR_M17_CHECKPOINT_INDEX } from "./m17";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import type { LessonStep } from "@/features/lesson/types";

registerFrModuleContentLints({
  moduleId: "m17",
  lessons: FR_M17_MODULE.lessons,
  atoms: FR_M17_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m17",
  lessons: FR_M17_MODULE.lessons,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9",
    "m10", "m11", "m12", "m13", "m14", "m15", "m16",
  ],
});

const LESSONS = FR_M17_MODULE.lessons;
const COUNT = LESSONS.length;

// No new homophoneKey pairs this module (header comment, verified) — kept
// empty per m12.test.ts's own precedent rather than omitted, so a future
// addition has an obvious place to land.
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

/** Any spoken/written number 70-99, in any of its valid orthographies
 *  (soixante-dix..soixante-dix-neuf, soixante et onze, quatre-vingts,
 *  quatre-vingt-un..quatre-vingt-dix-neuf). Mirrors m12.test.ts's
 *  NUMBER_ABOVE_TWENTY shape, scoped to this module's own new band. */
const NUMBER_70_TO_99 =
  /\bsoixante-dix(?:-(?:sept|huit|neuf))?\b|\bsoixante et onze\b|\bsoixante-(?:douze|treize|quatorze|quinze|seize)\b|\bquatre-vingts?\b|\bquatre-vingt-(?:un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|dix-sept|dix-huit|dix-neuf)\b/i;

describe("FR m17 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M17_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m17 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      // L10 (mastery) ends on the sim, not a match — closing-zone match is
      // a teaching/checkpoint-lesson convention (mirrors m12-m16).
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m17 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M17_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M17_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m17 L${n} carries a non-graded step`,
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
              `m17 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m17 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m17 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m17Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m17Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m17 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m17Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m17 pins (docs/fr-m17-brief-2026-09-10.md) ──────────────────

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

  it("«l'onze» never appears — onze is consonant-onset, always «le onze»", () => {
    const bad: string[] = [];
    const re = /\b[ljnmts]'onze\b|\bqu'onze\b/i;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of allFrenchStrings(s)) {
          if (re.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `wrongly-elided "l'onze" (or another clitic) found: ${bad.join("; ")}`).toEqual([]);
  });

  it("no speaking step ever targets a number in 70-99 (written-only band)", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "speaking") continue;
        if (NUMBER_70_TO_99.test(s.targetPhrase)) {
          bad.push(`${l.id}/${s.id}: "${s.targetPhrase}"`);
        }
      }
    }
    expect(bad, `speaking step targets a 70-99 number: ${bad.join("; ")}`).toEqual([]);
  });

  /** Same field set as allFrenchStrings, but reads ANSWER positions only —
   *  a multiple_choice/dialogue_sim reply's correct option, never its
   *  wrong-form distractors. Modules print wrong sentences on purpose as
   *  foils (e.g. this module's own "quatre-vingts et un" distractor,
   *  teaching the learner to reject the glued form); a semantic content
   *  pin must not flag a foil it exists to teach against. */
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

  it("«quatre-vingts» (silent plural -s) never glues onto a following unit", () => {
    const bad: string[] = [];
    // The -s is exclusive to exactly-80. Anywhere "quatre-vingts" is
    // followed by another number word IN AN ANSWER POSITION, the -s must
    // have been dropped — a wrong-form MCQ distractor teaching the
    // learner to reject the glued form is not itself a violation
    // (grade-answers-not-every-string).
    const gluedRe = /\bquatre-vingts[\s-](?:et[\s-])?(?:un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize)\b/i;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of answerPositionFrenchStrings(s)) {
          if (gluedRe.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `"quatre-vingts" (with -s) glued to a following unit: ${bad.join("; ")}`).toEqual([]);
  });
});
