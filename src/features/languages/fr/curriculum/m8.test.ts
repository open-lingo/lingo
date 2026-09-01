/**
 * FR m8 curriculum guard — sixth post-restart module (2026-09-01),
 * authored per the playbook (docs/fr-authoring-playbook.md). Standard
 * suite in the m5–m7.test.ts shape, plus the no-habitual-day pin.
 */
import { describe, it, expect } from "vitest";
import { FR_M1_MODULE } from "./m1";
import { FR_M2_MODULE } from "./m2";
import { FR_M3_MODULE } from "./m3";
import { FR_M4_MODULE } from "./m4";
import { FR_M5_MODULE } from "./m5";
import { FR_M6_MODULE } from "./m6";
import { FR_M7_MODULE } from "./m7";
import { FR_M8_ATOMS, FR_M8_MODULE, FR_M8_CHECKPOINT_INDEX } from "./m8";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerFrModuleContentLints({
  moduleId: "m8",
  lessons: FR_M8_MODULE.lessons,
  atoms: FR_M8_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m8",
  lessons: FR_M8_MODULE.lessons,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7"],
});

const LESSONS = FR_M8_MODULE.lessons;
const COUNT = LESSONS.length;

// The m8 tint dictionary (§13.4). Days register as adverbial "other"
// with no gender at this tier (see the m8.ts header) — they stay
// untinted, like the time words demain/ce soir.
const GENDERS: Record<string, "m" | "f"> = {
  "à la": "f",
  plage: "f",
};

const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

describe("FR m8 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M8_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m8 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      expect(
        steps.slice(-3).map((s) => s.type),
        `m8 L${n} has no match in its closing zone`,
      ).toContain("match_pairs");
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M8_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M8_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m8 L${n} carries a non-graded step`,
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
            `m8 ${l.id} ${s.id}: token «${token}» tint`,
          ).toBe(GENDERS[token]);
        });
      }
    }
  });

  it("no habitual «le <day>» form ever ships — days are bare adverbials at this tier (m8.ts header)", () => {
    for (const l of LESSONS) {
      const text = JSON.stringify(l.steps).toLowerCase();
      for (const d of DAYS) {
        // Word-boundary the article: «école lundi» contains the raw
        // substring "le lundi" — only a freestanding «le» counts.
        const habitual = new RegExp(`(^|[^a-zà-ÿœ'])le ${d}`);
        expect(habitual.test(text), `${l.id} contains habitual "le ${d}"`).toBe(false);
      }
      expect(text.includes("week-end"), `${l.id} contains untaught "week-end"`).toBe(false);
    }
  });

  it("days interleave 3/2/2 across L1–L3 — never block-taught (§13.9 law 9)", () => {
    // First tracked appearance of each day must fall in its planned
    // lesson: lun/mar/mer in L1, jeu/ven in L2, sam/dim in L3.
    const firstLesson = new Map<string, number>();
    LESSONS.forEach((l, i) => {
      const text = JSON.stringify(l.steps).toLowerCase();
      for (const d of DAYS) {
        if (!firstLesson.has(d) && text.includes(d)) firstLesson.set(d, i + 1);
      }
    });
    expect(firstLesson.get("lundi")).toBe(1);
    expect(firstLesson.get("mardi")).toBe(1);
    expect(firstLesson.get("mercredi")).toBe(1);
    expect(firstLesson.get("jeudi")).toBe(2);
    expect(firstLesson.get("vendredi")).toBe(2);
    expect(firstLesson.get("samedi")).toBe(3);
    expect(firstLesson.get("dimanche")).toBe(3);
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
              `m8 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m8 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m8 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m8Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m8Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m8 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m8Recalls).toBeGreaterThanOrEqual(8);
  });
});
