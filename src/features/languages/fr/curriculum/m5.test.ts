/**
 * FR m5 curriculum guard — third post-restart module (2026-09-01), the
 * first authored UNDER the frContentAudits gate. Standard suite in the
 * m3/m4.test.ts shape, plus two m5-specific inventory pins.
 */
import { describe, it, expect } from "vitest";
import { FR_M1_MODULE } from "./m1";
import { FR_M2_MODULE } from "./m2";
import { FR_M3_MODULE } from "./m3";
import { FR_M4_MODULE } from "./m4";
import { FR_M5_ATOMS, FR_M5_MODULE, FR_M5_CHECKPOINT_INDEX } from "./m5";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerFrModuleContentLints({
  moduleId: "m5",
  lessons: FR_M5_MODULE.lessons,
  atoms: FR_M5_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m5",
  lessons: FR_M5_MODULE.lessons,
  priorModules: ["m1", "m2", "m3", "m4"],
});

const LESSONS = FR_M5_MODULE.lessons;
const COUNT = LESSONS.length;

// The m5 tint dictionary (§13.4). «au» tints blue-m — it CONTAINS le;
// «à la» tints pink-f; bare «à» stays neutral (it belongs to no side).
const GENDERS: Record<string, "m" | "f"> = {
  au: "m",
  "à la": "f",
  cinéma: "m",
  gare: "f",
  restaurant: "m",
  "l'école": "f",
};

describe("FR m5 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M5_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m5 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      expect(
        steps.slice(-3).map((s) => s.type),
        `m5 L${n} has no match in its closing zone`,
      ).toContain("match_pairs");
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M5_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M5_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m5 L${n} carries a non-graded step`,
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
            `m5 ${l.id} ${s.id}: token «${token}» tint`,
          ).toBe(GENDERS[token]);
        });
      }
    }
  });

  it("«à le» never appears — the contraction is «au», one atom, one tile (pin F4)", () => {
    for (const l of LESSONS) {
      expect(
        JSON.stringify(l.steps).includes("à le "),
        `${l.id} writes «à le» — French fuses it: «au»`,
      ).toBe(false);
    }
  });

  it("«à la ville» never appears — French says «en ville», which is untaught (inventory rule)", () => {
    for (const l of LESSONS) {
      expect(
        JSON.stringify(l.steps).toLowerCase().includes("à la ville"),
        `${l.id} uses «à la ville» — ville stays out of the movement frame`,
      ).toBe(false);
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
              `m5 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m5 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m5 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m5Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m5Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m5 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m5Recalls).toBeGreaterThanOrEqual(8);
  });
});
