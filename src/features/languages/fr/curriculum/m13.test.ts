/**
 * FR m13 curriculum guard — the «Je sais pas» negation-generalization +
 * spoken-register module. Standard suite in the m5–m12.test.ts shape, plus
 * bespoke pins from docs/fr-m13-brief-2026-09-10.md:
 *   (a) «il sait» / «elle sait» never appear anywhere — savoir is taught
 *       only as je sais / tu sais chunks (brief §5 homophone risk).
 *   (b) «je sais pas» (the ne-drop spoken form) never appears in a written
 *       ANSWER position (build target, cloze answer, speaking target,
 *       dialogue_sim reply the learner TYPES — n/a here since replies are
 *       choice-mode) — it may appear only inside dialogue_sim NPC lines and
 *       choice reply OPTIONS, from L7 onward (brief §4/§7 decision 2).
 *   (c) ne-drop forms (any dialogue_sim text lacking «ne»/«n'» where the
 *       written twin has it) are confined to L7+.
 * m13 authors no listening_build/liaison_listen banks, so the homophone
 * co-tiling ban is vacuously true (kept as a floor, same as m11/m12).
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
import { FR_M13_ATOMS, FR_M13_MODULE, FR_M13_CHECKPOINT_INDEX } from "./m13";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import type { LessonStep } from "@/features/lesson/types";

registerFrModuleContentLints({
  moduleId: "m13",
  lessons: FR_M13_MODULE.lessons,
  atoms: FR_M13_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m13",
  lessons: FR_M13_MODULE.lessons,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12"],
});

const LESSONS = FR_M13_MODULE.lessons;
const COUNT = LESSONS.length;

/** No homophone-co-tiling risk authored this module (no listening_build /
 *  liaison_listen banks) — kept as a floor for any future addition. */
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

describe("FR m13 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M13_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m13 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      // L10 (mastery) ends on the sim, not a match — closing-zone match is
      // a teaching/checkpoint-lesson convention (mirrors m12).
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m13 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M13_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M13_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m13 L${n} carries a non-graded step`,
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
              `m13 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m13 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m13 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m13Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m13Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m13 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m13Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m13 pins (docs/fr-m13-brief-2026-09-10.md §3/§4/§5/§7) ──────

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
    if (s.type === "dialogue_sim") {
      const sim = s as unknown as {
        turns: Array<{
          npc: { audioText: string };
          reply: { audioText?: string; mode: string; options?: Array<{ text: string }> };
        }>;
      };
      for (const t of sim.turns) {
        out.push(t.npc.audioText);
        if (t.reply.audioText) out.push(t.reply.audioText);
        if (t.reply.mode === "choice" && t.reply.options) {
          out.push(...t.reply.options.map((o) => o.text));
        }
      }
    }
    return out;
  }

  /** Answer-position strings ONLY — build/cloze/speaking targets, never
   *  dialogue_sim (which is recognition-only, outside the written-answer
   *  claim per brief §4/§7 decision 2). */
  function answerPositionStrings(step: LessonStep): string[] {
    const s = step as Record<string, unknown>;
    const out: string[] = [];
    if (s.type === "build_sentence" && typeof s.targetSentence === "string") {
      out.push(s.targetSentence as string);
    }
    if (s.type === "speaking" && typeof s.targetPhrase === "string") {
      out.push(s.targetPhrase as string);
    }
    if (s.type === "particle_cloze" && typeof s.correctParticle === "string") {
      // reconstruct the full sentence for a readable pin, but the
      // particle itself is the thing graded
      out.push(String(s.correctParticle));
    }
    return out;
  }

  it("«il sait» / «elle sait» never appear anywhere — savoir stays a chunk (brief §5)", () => {
    const bad: string[] = [];
    const risky = /\b(il|elle)\s+(?:ne\s+)?sait\b/i;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of allFrenchStrings(s)) {
          if (risky.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `«il/elle sait» found (untaught homophone risk): ${bad.join("; ")}`).toEqual([]);
  });

  it("«je sais pas» (ne-drop) never sits in a written answer position", () => {
    const bad: string[] = [];
    const dropForm = /\bje\s+sais\s+pas\b/i;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of answerPositionStrings(s)) {
          if (dropForm.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `ne-drop form in a written answer position: ${bad.join("; ")}`).toEqual([]);
  });

  it("ne-drop content (dialogue_sim only) is confined to L7 onward", () => {
    const bad: string[] = [];
    const dropForm = /\bje\s+sais\s+pas\b/i;
    for (const l of LESSONS) {
      const n = Number(/-(\d+)$/.exec(l.id)?.[1] ?? 0);
      if (n >= 7) continue;
      for (const s of l.steps) {
        if (s.type !== "dialogue_sim") continue;
        for (const text of allFrenchStrings(s)) {
          if (dropForm.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `ne-drop form appears before L7: ${bad.join("; ")}`).toEqual([]);
  });

  it("no build/cloze/speaking ANSWER position uses a banned lexical item (teens, 70-99, vous, jamais/rien/plus, en ville)", () => {
    const bad: string[] = [];
    const banned = /\b(vous|jamais|rien|onze|douze|treize|quatorze|quinze|seize|dix-sept|dix-huit|dix-neuf|soixante-dix|quatre-vingt|quatre-vingts|quatre-vingt-dix|en ville)\b/i;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of answerPositionStrings(s)) {
          if (banned.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `banned lexical item in an answer position: ${bad.join("; ")}`).toEqual([]);
  });
});
