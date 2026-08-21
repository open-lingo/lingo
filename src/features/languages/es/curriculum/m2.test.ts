/**
 * ES M2 curriculum guard — the §13-doctrine hand-authored module.
 *
 * Promoted 2026-08-21 from the dev prototype; shared lints at ZERO debt
 * plus the doctrine suite ported from `features/lesson/dev/esM2Lessons.test.ts`.
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M2_ATOMS, ES_M2_LESSONS, ES_M2_PLACEMENT, ES_M2_CHECKPOINT_INDEX } from "./m2";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerEsModuleContentLints({
  moduleId: "m2",
  lessons: ES_M2_LESSONS,
  atoms: ES_M2_ATOMS,
  expectedLessonCount: 10,
});

registerEsModuleBarGuards({
  moduleLabel: "m2",
  lessons: ES_M2_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m2")),
});

describe("ES M2 bespoke guards", () => {
  it("the placement bank carries the m2 facts (1 screener + 4 byModule)", () => {
    expect(ES_M2_PLACEMENT.screener.length).toBe(1);
    expect(ES_M2_PLACEMENT.byModule.length).toBe(4);
  });
});

/** Dev-suite shim: the prototype's per-lesson builder, now a lookup. */
const buildEsM2Lesson = async (n: number) => ES_M2_LESSONS[n - 1].steps;

const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
const MASTERY = 10;

describe("ES m2 — §13 doctrine pins (ported from the dev prototype suite)", () => {
  it("has 10 lessons; the checkpoint sits after ALL teaching", () => {
    expect(ES_M2_LESSONS.length).toBe(10);
    expect(ES_M2_CHECKPOINT_INDEX).toBe(8);
  });

  for (const n of LESSONS) {
    it(`L${n}: unique ids, no adjacent same-type steps, match in the closing zone`, async () => {
      const steps = await buildEsM2Lesson(n);
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      const lastThree = steps.slice(-3).map((s) => s.type);
      expect(lastThree, `L${n} has no match in its closing zone`).toContain(
        "match_pairs",
      );
    });

    it(`L${n}: zero passive vocab cards; info budget respected (§13.1)`, async () => {
      const steps = await buildEsM2Lesson(n);
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n === MASTERY || n === ES_M2_CHECKPOINT_INDEX || n === 9) {
        expect(infoCount, "checkpoint/integration/mastery carry no cards").toBe(0);
      } else {
        expect(infoCount).toBeLessThanOrEqual(1);
      }
    });

    it(`L${n}: exercised atoms resolve to registered es: ids (promotion flips §13.7)`, async () => {
      const steps = await buildEsM2Lesson(n);
      for (const s of steps) {
        const ex = (s as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
        for (const id of ex) expect(id.startsWith("es:")).toBe(true);
      }
    });
  }

  it("checkpoint and mastery are graded steps only", async () => {
    for (const n of [ES_M2_CHECKPOINT_INDEX, MASTERY]) {
      const steps = await buildEsM2Lesson(n);
      expect(
        steps.every((s) => isGradedStep(s)),
        `L${n} carries a non-graded step`,
      ).toBe(true);
    }
  });

  it("the module ends on the stranger sim — not a grid (R7)", async () => {
    const steps = await buildEsM2Lesson(MASTERY);
    expect(steps[steps.length - 1].type).toBe("dialogue_sim");
  });

  it("has ZERO typed translate steps — beginner production is tile builds", async () => {
    // R8 originally demanded >=1 typed translate; Spencer's fr m1 L9 walk
    // reversed it (2026-08-21: his phonetically-right «si vu plait» graded
    // wrong). Typed production tests SPELLING a beginner hasn't been
    // taught, so beginner modules build from tiles instead — typed
    // translate returns in later modules, once orthography is earned.
    let count = 0;
    for (const n of LESSONS) {
      const steps = await buildEsM2Lesson(n);
      count += steps.filter((s) => s.type === "translate").length;
    }
    expect(count).toBe(0);
  });

  it("cued recall NEVER precedes a printed first voicing (R3 / §13.9)", async () => {
    // m2 seeds the printed set with m1's voiced surfaces — the recall
    // law spans modules (m1's printed voicings license m2 recalls).
    const { ES_M1_LESSONS } = await import("./m1");
    const voiced = new Set<string>();
    for (const lesson of ES_M1_LESSONS) {
      for (const s of lesson.steps) {
        if (s.type === "speaking" && s.cue !== "recall") voiced.add(s.targetPhrase);
      }
    }
    let recalls = 0;
    for (const n of LESSONS) {
      const steps = await buildEsM2Lesson(n);
      for (const s of steps) {
        if (s.type !== "speaking") continue;
        if (s.cue === "recall") {
          recalls++;
          expect(
            voiced.has(s.targetPhrase),
            `m2 L${n} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
          ).toBe(true);
        } else {
          voiced.add(s.targetPhrase);
        }
      }
    }
    expect(recalls).toBeGreaterThanOrEqual(6);
  });

  it("soy/eres and maestro/maestra trials ALTERNATE answers with both live (R5)", async () => {
    const counts: Record<string, number> = {};
    for (const n of LESSONS) {
      for (const s of await buildEsM2Lesson(n)) {
        if (s.type !== "particle_cloze") continue;
        counts[s.correctParticle] = (counts[s.correctParticle] ?? 0) + 1;
      }
    }
    expect(counts["soy"] ?? 0, "soy-answer trials").toBeGreaterThanOrEqual(2);
    expect(counts["eres"] ?? 0, "eres-answer trials").toBeGreaterThanOrEqual(2);
    expect(counts["maestro"] ?? 0, "maestro-answer trials").toBeGreaterThanOrEqual(1);
    expect(counts["maestra"] ?? 0, "maestra-answer trials").toBeGreaterThanOrEqual(2);
  });

  it("gendered words carry the tint layer in every map (§13.4)", async () => {
    const GENDERS: Record<string, "m" | "f"> = {
      "él": "m",
      ella: "f",
      maestro: "m",
      maestra: "f",
      "señor": "m",
      "señora": "f",
    };
    for (const n of LESSONS) {
      for (const s of await buildEsM2Lesson(n)) {
        if (s.type !== "word_map") continue;
        s.tokens.forEach((token, idx) => {
          expect(
            s.tokenGenders?.[idx],
            `m2 L${n} ${s.id}: token «${token}» tint`,
          ).toBe(GENDERS[token]);
        });
      }
    }
  });

  it("any MCQ with digit options is audio-prompted (m1 law carried forward)", async () => {
    const digits = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    for (const n of LESSONS) {
      for (const s of await buildEsM2Lesson(n)) {
        if (s.type !== "word_image_mcq") continue;
        if (!s.options.some((o) => digits.includes(o.emoji))) continue;
        expect(s.options.some((o) => o.word === s.meaningEn)).toBe(true);
      }
    }
  });

  it("no sim offers the NPC's own line as a WRONG option (§13.6)", async () => {
    const norm = (t: string) =>
      t.toLowerCase().replace(/[¡!¿?.,«»\s]+/g, " ").trim();
    for (const n of LESSONS) {
      for (const s of await buildEsM2Lesson(n)) {
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
              `m2 L${n} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("micro-sim goal lines stay terse everywhere", async () => {
    for (const n of LESSONS) {
      for (const s of await buildEsM2Lesson(n)) {
        if (s.type !== "dialogue_sim") continue;
        for (const turn of s.turns) {
          expect(
            turn.goal.split(/\s+/).length,
            `m2 L${n} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });
});
