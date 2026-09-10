/**
 * FR m19 curriculum guard — the «Aller + infinitif» near-future module.
 * Standard suite in the m12-m18.test.ts shape, plus bespoke pins from
 * docs/fr-speech-near-future-2026-09-10.md:
 *   (a) no `speaking` step in a TEACHING lesson is EVER the learner's
 *       first exposure to a given subject+infinitive pairing (constraint
 *       3) — every new pairing must debut written first (word_map/cloze/
 *       build/sentenceMcq/listening_comprehension) in the same lesson or
 *       earlier. The checkpoint (L8) is explicitly exempt (constraint 5 —
 *       a checkpoint may test a novel graded RECOMBINATION of two known
 *       parts, e.g. elle+parler).
 *   (b) the literal word "week-end" never appears anywhere in the module
 *       (course-wide ban, confirmed via m8.ts/m8.test.ts precedent) —
 *       weekend-plan content must name samedi/dimanche explicitly.
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
import { FR_M18_MODULE } from "./m18";
import { FR_M19_ATOMS, FR_M19_MODULE, FR_M19_CHECKPOINT_INDEX } from "./m19";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import type { LessonStep } from "@/features/lesson/types";

registerFrModuleContentLints({
  moduleId: "m19",
  lessons: FR_M19_MODULE.lessons,
  atoms: FR_M19_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m19",
  lessons: FR_M19_MODULE.lessons,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9",
    "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18",
  ],
});

const LESSONS = FR_M19_MODULE.lessons;
const COUNT = LESSONS.length;

// No new homophoneKey pairs this module — «il va»/«elle va» carry no
// formal homophoneKey, kept empty per m12/m17/m18.test.ts's own
// precedent rather than omitted, so a future addition has an obvious
// place to land.
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

describe("FR m19 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M19_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m19 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m19 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M19_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M19_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m19 L${n} carries a non-graded step`,
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
              `m19 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m19 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m19 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m19Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m19Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m19 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(FR_M18_MODULE.lessons, false);
    walk(LESSONS, true);
    expect(m19Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m19 pins (docs/fr-m19-brief-2026-09-10.md +
  //    docs/fr-speech-near-future-2026-09-10.md) ──────────────────────────

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

  it('the literal word "week-end" never appears anywhere in the module (course-wide ban)', () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of allFrenchStrings(s)) {
          if (/week-?end/i.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `"week-end" found: ${bad.join("; ")}`).toEqual([]);
  });

  // ── Subject+infinitive first-exposure pin (constraint 3) ───────────────

  const INFINITIVES = ["parler", "habiter", "manger", "visiter"] as const;
  const SUBJECTS = ["je", "tu", "il", "elle", "on"] as const;

  /** Extracts every (subject, infinitive) pairing present in a sentence,
   *  base subject only (negation stripped) — a negated near-future
   *  sentence still counts as using the SAME pairing as its positive
   *  form, per the module's own "reuse already-debuted pairings inside
   *  ne...pas" design. */
  function extractPairs(text: string): string[] {
    const lower = text.toLowerCase();
    const pairs: string[] = [];
    for (const subj of SUBJECTS) {
      // positive: "subj va(is/s) <infinitive>"
      // negative: "subj ne va(is/s) pas <infinitive>"
      const posRe = new RegExp(`\\b${subj}\\s+va(?:is|s)?\\s+(${INFINITIVES.join("|")})\\b`);
      const negRe = new RegExp(
        `\\b${subj}\\s+ne\\s+va(?:is|s)?\\s+pas\\s+(${INFINITIVES.join("|")})\\b`,
      );
      const posMatch = lower.match(posRe);
      if (posMatch) pairs.push(`${subj}+${posMatch[1]}`);
      const negMatch = lower.match(negRe);
      if (negMatch) pairs.push(`${subj}+${negMatch[1]}`);
    }
    return pairs;
  }

  it("no `speaking` step in a TEACHING lesson is ever the learner's first exposure to a subject+infinitive pairing (constraint 3; checkpoint L8 exempt per constraint 5)", () => {
    const debuted = new Set<string>();
    const bad: string[] = [];
    for (let n = 1; n <= COUNT; n++) {
      const l = LESSONS[n - 1];
      const isCheckpoint = n === FR_M19_CHECKPOINT_INDEX;
      for (const s of l.steps) {
        const texts = allFrenchStrings(s);
        const pairsInStep = new Set<string>();
        for (const text of texts) {
          for (const p of extractPairs(text)) pairsInStep.add(p);
        }
        if (s.type === "speaking" && !isCheckpoint) {
          const targetPairs = extractPairs((s as { targetPhrase: string }).targetPhrase);
          for (const p of targetPairs) {
            if (!debuted.has(p)) {
              bad.push(`${l.id}/${s.id}: first exposure of "${p}" via a speaking step`);
            }
          }
        }
        // Any step (including this one, after the check above) can mark
        // pairs as debuted — a speaking step's OWN pairing counts as
        // debuted for subsequent steps too, matching how a printed
        // voicing debuts a phrase for later `cue:"recall"` reuse.
        for (const p of pairsInStep) debuted.add(p);
      }
    }
    expect(bad, `first-exposure-via-speaking violations: ${bad.join("; ")}`).toEqual([]);
  });

  it("the checkpoint's «elle va parler» is a deliberate novel recombination, not reused as a teaching-lesson debut elsewhere", () => {
    // Confirms the transfer-test design intent: elle+parler appears
    // exactly at the checkpoint (L8) and nowhere earlier as a debut.
    let firstLessonIndex = -1;
    for (let n = 1; n <= COUNT; n++) {
      const l = LESSONS[n - 1];
      for (const s of l.steps) {
        for (const text of allFrenchStrings(s)) {
          if (extractPairs(text).includes("elle+parler")) {
            if (firstLessonIndex === -1) firstLessonIndex = n;
          }
        }
      }
    }
    expect(firstLessonIndex).toBe(FR_M19_CHECKPOINT_INDEX);
  });
});
