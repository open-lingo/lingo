/**
 * FR m10 curriculum guard — eighth post-restart module (2026-09-01), the
 * run's last before the m11 conjugation-checkpoint pause. Standard suite
 * in the m5–m9.test.ts shape, plus the liaison-containment pins from the
 * coordinator ruling (audition set enumerated, checkpoint liaison-free)
 * and the silent-plural listening pin.
 */
import { describe, it, expect } from "vitest";
import type { LessonStep } from "@/features/lesson/types";
import { FR_M1_MODULE } from "./m1";
import { FR_M2_MODULE } from "./m2";
import { FR_M3_MODULE } from "./m3";
import { FR_M4_MODULE } from "./m4";
import { FR_M5_MODULE } from "./m5";
import { FR_M6_MODULE } from "./m6";
import { FR_M7_MODULE } from "./m7";
import { FR_M8_MODULE } from "./m8";
import { FR_M9_MODULE } from "./m9";
import { FR_M10_ATOMS, FR_M10_MODULE, FR_M10_CHECKPOINT_INDEX } from "./m10";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerFrModuleContentLints({
  moduleId: "m10",
  lessons: FR_M10_MODULE.lessons,
  atoms: FR_M10_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m10",
  lessons: FR_M10_MODULE.lessons,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9"],
});

const LESSONS = FR_M10_MODULE.lessons;
const COUNT = LESSONS.length;

// m10 word_maps carry NO tints: a plural chain spans both genders and a
// wrong tint would teach a false rule (m10.ts header).
const GENDERS: Record<string, "m" | "f"> = {};

/** THE LIAISON AUDITION SET (coordinator ruling) — every liaison_listen
 *  item's audioText must be one of these, so a bad Denise liaison is a
 *  one-string swap HERE + one step edit, never structural rework. */
const LIAISON_AUDITION_SET = new Set([
  "les chats et les écoles",
  "les hôtels et les chiens",
  "les écoles et les hôtels",
]);

/** Singular/plural pairs that are ONE sound — never co-tiled in a
 *  listening bank (written builds may: spelling the silent -s IS the
 *  written skill, pin §1). */
const HOMOPHONE_PAIRS: Array<[string, string]> = [
  ["chat", "chats"],
  ["chien", "chiens"],
  ["livre", "livres"],
  ["croissant", "croissants"],
  ["école", "écoles"],
  ["hôtel", "hôtels"],
];

describe("FR m10 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M10_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m10 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      expect(
        steps.slice(-3).map((s) => s.type),
        `m10 L${n} has no match in its closing zone`,
      ).toContain("match_pairs");
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M10_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M10_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m10 L${n} carries a non-graded step`,
      ).toBe(true);
    }
  });

  it("the module ends on a sim — not a grid (R7)", () => {
    const steps = LESSONS[COUNT - 1].steps;
    expect(steps[steps.length - 1].type).toBe("dialogue_sim");
  });

  it("m10 maps carry NO gender tints — a plural chain spans both sides (§13.4 note)", () => {
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "word_map") continue;
        s.tokens.forEach((token, idx) => {
          expect(
            s.tokenGenders?.[idx],
            `m10 ${l.id} ${s.id}: token «${token}» tint`,
          ).toBe(GENDERS[token]);
        });
      }
    }
  });

  it("liaison_listen: exactly 3 items, every audioText from the AUDITION SET, each with ≥1 silent junction", () => {
    let items = 0;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "liaison_listen") continue;
        items++;
        expect(
          LIAISON_AUDITION_SET.has(s.audioText),
          `${l.id}/${s.id}: liaison audio "${s.audioText}" is outside the audition set`,
        ).toBe(true);
        expect(
          s.linkedJunctions.length,
          `${l.id}/${s.id}: no linked junction`,
        ).toBeGreaterThanOrEqual(1);
        expect(
          s.linkedJunctions.length,
          `${l.id}/${s.id}: every junction links — teaches over-application (pin F1)`,
        ).toBeLessThan(s.words.length - 1);
      }
    }
    expect(items).toBe(3);
  });

  it("the CHECKPOINT is liaison-free (coordinator ruling — fragile beats stay swappable)", () => {
    const cp = LESSONS[FR_M10_CHECKPOINT_INDEX - 1].steps;
    expect(cp.filter((s) => s.type === "liaison_listen").length).toBe(0);
    // Nor may any checkpoint step's audio be a liaison-set string.
    for (const s of cp as never as Array<Record<string, unknown>>) {
      for (const key of ["audioText", "audioKey", "targetPhrase", "targetSentence"]) {
        if (typeof s[key] === "string") {
          expect(
            LIAISON_AUDITION_SET.has(s[key] as string),
            `checkpoint step ${s.id} depends on liaison string "${s[key]}"`,
          ).toBe(false);
        }
      }
    }
  });

  it("no listening bank co-tiles a silent singular/plural pair (one sound, pin §1)", () => {
    const checkBank = (bank: readonly string[], where: string) => {
      const set = new Set(bank.map((t) => t.toLowerCase()));
      for (const [sg, pl] of HOMOPHONE_PAIRS) {
        expect(
          set.has(sg) && set.has(pl),
          `${where}: "${sg}"/"${pl}" co-tiled in an ear-answered bank`,
        ).toBe(false);
      }
    };
    for (const l of LESSONS) {
      for (const s of l.steps as LessonStep[]) {
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
              `m10 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m10 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m10 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m10Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m10Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m10 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m10Recalls).toBeGreaterThanOrEqual(8);
  });
});
