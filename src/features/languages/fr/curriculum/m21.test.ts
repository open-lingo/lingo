/**
 * FR m21 curriculum guard — «De cent à mille» (hundreds and thousands).
 * Standard suite in the m17-m20.test.ts shape, plus bespoke pins from
 * docs/fr-speech-hundreds-2026-09-10.md:
 *   (a) NO `speaking` step — recall or graded, teaching lesson or
 *       checkpoint — ever targets a COMPOSITE number (e.g. "cent un",
 *       "deux cent cinquante"). Unlike m20's L6-liftable convention, this
 *       is a real speech-grading false-positive risk (finding 2 of the
 *       probe: a wrong digit hearing scores as well as the right one),
 *       so it applies UNCONDITIONALLY, including the checkpoint.
 *   (b) the -s-drop rule is never violated in any printed French string:
 *       "cent(s)" never carries a trailing -s when a further number
 *       follows it in the same phrase (no "deux cents un" anywhere).
 *   (c) "milles" (the wrong plural of "mille" — "mille" is invariable)
 *       never appears as a CORRECT answer anywhere; it only ever appears
 *       as a foil/distractor.
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
import { FR_M17_MODULE } from "./m17";
import { FR_M18_MODULE } from "./m18";
import { FR_M19_MODULE } from "./m19";
import { FR_M20_MODULE } from "./m20";
import { FR_M21_ATOMS, FR_M21_MODULE, FR_M21_CHECKPOINT_INDEX } from "./m21";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import type { LessonStep } from "@/features/lesson/types";

registerFrModuleContentLints({
  moduleId: "m21",
  lessons: FR_M21_MODULE.lessons,
  atoms: FR_M21_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m21",
  lessons: FR_M21_MODULE.lessons,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9",
    "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20",
  ],
});

const LESSONS = FR_M21_MODULE.lessons;
const COUNT = LESSONS.length;

// No new homophoneKey pairs this module — «cents» carries no formal
// homophoneKey (it's silent-plural, not a distinct sound from «cent»),
// kept empty per m12/m17-m20.test.ts's own precedent rather than omitted.
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

describe("FR m21 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M21_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m21 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m21 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M21_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M21_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m21 L${n} carries a non-graded step`,
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
              `m21 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m21 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m21 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m21Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m21Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m21 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(FR_M19_MODULE.lessons, false);
    walk(FR_M20_MODULE.lessons, false);
    walk(LESSONS, true);
    expect(m21Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m21 pins (docs/fr-m21-brief-2026-09-10.md +
  //    docs/fr-speech-hundreds-2026-09-10.md) ──────────────────────────────

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

  /** Only these "correct answer position" strings count for (a)/(b)/(c):
   *  build targetSentence, speaking targetPhrase, cloze correctParticle
   *  (combined with its before/after prompt), sentenceMcq's correct
   *  option, listening_comprehension's transcript, and a dialogue_sim
   *  turn's correct/alsoCorrect reply option(s). Wrong options / foils
   *  are deliberately excluded — this course prints wrong sentences on
   *  purpose as distractors (see [[grade-answers-not-every-string]]). */
  function answerPositionStrings(step: LessonStep): string[] {
    const s = step as Record<string, unknown>;
    const out: string[] = [];
    if (s.type === "build_sentence" && typeof s.targetSentence === "string") {
      out.push(s.targetSentence as string);
    }
    if (s.type === "speaking" && typeof s.targetPhrase === "string") {
      out.push(s.targetPhrase as string);
    }
    if (s.type === "particle_cloze") {
      const prompt = s.prompt as { before?: string; after?: string } | undefined;
      out.push(`${prompt?.before ?? ""} ${s.correctParticle as string} ${prompt?.after ?? ""}`);
    }
    if (s.type === "multiple_choice" && Array.isArray(s.options)) {
      const opts = s.options as Array<{ id: string; text: string }>;
      const correctId = s.correctOptionId as string;
      const correct = opts.find((o) => o.id === correctId);
      if (correct) out.push(correct.text);
    }
    if (s.type === "listening_comprehension" && typeof s.transcript === "string") {
      out.push(s.transcript as string);
    }
    if (s.type === "dialogue_sim") {
      const sim = s as unknown as {
        turns: Array<{
          reply: {
            mode: string;
            audioText?: string;
            options?: Array<{ id: string; text: string }>;
            correctOptionId?: string;
            alsoCorrectOptionIds?: string[];
          };
        }>;
      };
      for (const t of sim.turns) {
        if (t.reply.mode === "choice" && t.reply.options) {
          const okIds = new Set([
            t.reply.correctOptionId,
            ...(t.reply.alsoCorrectOptionIds ?? []),
          ]);
          for (const o of t.reply.options) {
            if (okIds.has(o.id)) out.push(o.text);
          }
        }
      }
    }
    return out;
  }

  // A composite number: "cent"/"cents"/"mille" DIRECTLY followed by
  // another number word (not "euros" or any other noun). Matches:
  // "cent un", "deux cent cinquante", "trois cent quatre-vingts",
  // "deux mille cinq cents" (mille+cents together still counts as
  // composite — it's not a BARE round multiple). Does NOT match bare
  // "deux cents euros", "cent euros", "trois mille euros", "neuf cents
  // euros" — in every bare case the word immediately after cent(s)/
  // mille is "euros", not a number word.
  const NUMBER_WORD_RE =
    "un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante|quatre-vingts?";
  const COMPOSITE_RE = new RegExp(
    `\\b(?:cents?|mille)\\s+(?:et\\s+)?(?:${NUMBER_WORD_RE})\\b`,
    "i",
  );

  it("no `speaking` step (recall or graded, any lesson including the checkpoint) ever targets a composite number", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "speaking") continue;
        if (COMPOSITE_RE.test(s.targetPhrase)) {
          bad.push(`${l.id}/${s.id}: "${s.targetPhrase}"`);
        }
      }
    }
    expect(bad, `composite number in a speaking step: ${bad.join("; ")}`).toEqual([]);
  });

  it("no `alsoAccepted` digit form is offered on a composite build step", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "build_sentence") continue;
        const also = (s as { alsoAccepted?: string[] }).alsoAccepted;
        if (!also || also.length === 0) continue;
        if (COMPOSITE_RE.test(s.targetSentence)) {
          bad.push(`${l.id}/${s.id}: composite build carries alsoAccepted`);
        }
      }
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it('the -s never appears on "cent(s)" when a further number follows, in any answer-position string (no "deux cents un")', () => {
    const bad: string[] = [];
    const DROP_VIOLATION_RE =
      /\bcents\s+(un|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|vingt|trente|quarante|cinquante|soixante)\b/;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of answerPositionStrings(s)) {
          if (DROP_VIOLATION_RE.test(text)) {
            bad.push(`${l.id}/${s.id}: "${text}"`);
          }
        }
      }
    }
    expect(bad, `-s wrongly kept before a following number: ${bad.join("; ")}`).toEqual([]);
  });

  it('"milles" (wrong plural of invariable «mille») never appears as a correct answer', () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of answerPositionStrings(s)) {
          if (/\bmilles\b/i.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, `"milles" found in an answer position: ${bad.join("; ")}`).toEqual([]);
  });

  it('"milles" appears at least once as a foil somewhere (confirms the distractor exists, not just absent)', () => {
    let found = false;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of allFrenchStrings(s)) {
          if (/\bmilles\b/i.test(text)) found = true;
        }
      }
    }
    expect(found, "expected at least one 'milles' foil somewhere in the module").toBe(true);
  });
});
