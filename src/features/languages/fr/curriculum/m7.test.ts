/**
 * FR m7 curriculum guard — fifth post-restart module (2026-09-01),
 * authored per the playbook (docs/fr-authoring-playbook.md). Standard
 * suite in the m5/m6.test.ts shape, plus the no-plural-family pin.
 */
import { describe, it, expect } from "vitest";
import { FR_M1_MODULE } from "./m1";
import { FR_M2_MODULE } from "./m2";
import { FR_M3_MODULE } from "./m3";
import { FR_M4_MODULE } from "./m4";
import { FR_M5_MODULE } from "./m5";
import { FR_M6_MODULE } from "./m6";
import { FR_M7_ATOMS, FR_M7_MODULE, FR_M7_CHECKPOINT_INDEX } from "./m7";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerFrModuleContentLints({
  moduleId: "m7",
  lessons: FR_M7_MODULE.lessons,
  atoms: FR_M7_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m7",
  lessons: FR_M7_MODULE.lessons,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6"],
});

const LESSONS = FR_M7_MODULE.lessons;
const COUNT = LESSONS.length;

// The m7 tint dictionary (§13.4). Possessives tint with their side, the
// same rule as articles and au/à la.
const GENDERS: Record<string, "m" | "f"> = {
  un: "m",
  une: "f",
  mon: "m",
  ma: "f",
  frère: "m",
  sœur: "f",
  chien: "m",
  famille: "f",
  étudiant: "m",
};

describe("FR m7 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M7_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m7 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      expect(
        steps.slice(-3).map((s) => s.type),
        `m7 L${n} has no match in its closing zone`,
      ).toContain("match_pairs");
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M7_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M7_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m7 L${n} carries a non-graded step`,
      ).toBe(true);
    }
  });

  it("the module ends on a sim — not a grid (R7)", () => {
    const steps = LESSONS[COUNT - 1].steps;
    expect(steps[steps.length - 1].type).toBe("dialogue_sim");
  });

  it("gendered words carry the tint layer in every map (§13.4)", () => {
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "word_map") continue;
        s.tokens.forEach((token, idx) => {
          expect(
            s.tokenGenders?.[idx],
            `m7 ${l.id} ${s.id}: token «${token}» tint`,
          ).toBe(GENDERS[token]);
        });
      }
    }
  });

  it("no plural family form ever ships — plurals are deferred to m10 (playbook §6)", () => {
    for (const l of LESSONS) {
      const text = JSON.stringify(l.steps).toLowerCase();
      for (const p of ["frères", "sœurs", "chats", "chiens", "familles", "parents"]) {
        expect(text.includes(p), `${l.id} contains plural "${p}"`).toBe(false);
      }
    }
  });

  it("«ami/amie» stays out — the «mon amie» ma+vowel exception is a future beat (playbook §6)", () => {
    for (const l of LESSONS) {
      const text = JSON.stringify(l.steps).toLowerCase();
      expect(/\bamie?\b/.test(text), `${l.id} uses ami/amie before its beat`).toBe(false);
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
              `m7 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m7 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m7 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m7Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m7Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m7 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m7Recalls).toBeGreaterThanOrEqual(8);
  });
});
