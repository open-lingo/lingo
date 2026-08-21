/**
 * ES M1 curriculum guard — the §13-doctrine hand-authored module.
 *
 * Promoted 2026-08-21 from the dev prototype; this file carries BOTH the
 * shared lints (registered with ZERO debt — never add a debt entry, fix the
 * content) AND the full doctrine suite ported from
 * `features/lesson/dev/esM1Lessons.test.ts` (learner-sim rework pins).
 */
import "./index";

import { describe, it, expect } from "vitest";
import { ES_M1_ATOMS, ES_M1_LESSONS, ES_M1_PLACEMENT, ES_M1_CHECKPOINT_INDEX } from "./m1";
import { registerEsModuleContentLints } from "../__tests__/moduleContentLints";
import { registerEsModuleBarGuards } from "../__tests__/moduleBarGuards";
import { ES_MODULE_ORDER } from "../grammarHelpers";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerEsModuleContentLints({
  moduleId: "m1",
  lessons: ES_M1_LESSONS,
  atoms: ES_M1_ATOMS,
  expectedLessonCount: 9,
});

registerEsModuleBarGuards({
  moduleLabel: "m1",
  lessons: ES_M1_LESSONS,
  priorModules: ES_MODULE_ORDER.slice(0, ES_MODULE_ORDER.indexOf("m1")),
});

describe("ES M1 bespoke guards", () => {
  it("the placement bank carries the m1 facts (1 screener + 4 byModule)", () => {
    expect(ES_M1_PLACEMENT.screener.length).toBe(1);
    expect(ES_M1_PLACEMENT.byModule.length).toBe(4);
    for (const item of [...ES_M1_PLACEMENT.screener, ...ES_M1_PLACEMENT.byModule]) {
      const step = item.build();
      if (step.type !== "multiple_choice") {
        throw new Error(`${item.id}: expected a multiple_choice placement step`);
      }
      expect(step.options.length, `${item.id} should offer 4 options`).toBe(4);
    }
  });
});

/** Dev-suite shim: the prototype's per-lesson builder, now a lookup. */
const buildEsM1Lesson = async (n: number) => ES_M1_LESSONS[n - 1].steps;

const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const MASTERY = 9;

describe("ES m1 — §13 doctrine pins (ported from the dev prototype suite)", () => {
  it("has 9 lessons; the checkpoint sits after ALL teaching", () => {
    expect(ES_M1_LESSONS.length).toBe(9);
    expect(ES_M1_CHECKPOINT_INDEX).toBe(7);
  });

  it("L1 is the 15-step arc and ends on its win — speaking «no gracias»", () => {
    const steps = ES_M1_LESSONS[0].steps;
    expect(steps.length).toBe(15);
    const last = steps[steps.length - 1];
    expect(last.type).toBe("speaking");
    if (last.type === "speaking") expect(last.targetPhrase).toBe("no gracias");
    expect(steps[steps.length - 2].type).toBe("match_pairs");
  });

  for (const n of LESSONS) {
    it(`L${n}: unique ids, no adjacent same-type steps, match in the closing zone`, async () => {
      const steps = await buildEsM1Lesson(n);
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      // R7: the consolidation match sits NEAR the close, but the lesson
      // ends on its WIN (a production or the goodbye sim), not the grid.
      const lastThree = steps.slice(-3).map((s) => s.type);
      expect(
        lastThree,
        `L${n} has no match in its closing zone`,
      ).toContain("match_pairs");
    });

    it(`L${n}: zero passive vocab cards; info budget respected (§13.1)`, async () => {
      const steps = await buildEsM1Lesson(n);
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n === MASTERY || n === ES_M1_CHECKPOINT_INDEX) {
        expect(infoCount, "checkpoint/mastery carry no cards").toBe(0);
      } else {
        expect(infoCount).toBeLessThanOrEqual(1);
      }
    });

    it(`L${n}: exercised atoms resolve to registered es: ids (promotion flips §13.7)`, async () => {
      // The dev prototype deliberately carried NO atom attribution; the
      // promoted module registers its atoms, so factory steps that pass
      // surfaces must now resolve — and only ever to es-prefixed ids.
      const steps = await buildEsM1Lesson(n);
      for (const s of steps) {
        const ex = (s as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
        for (const id of ex) expect(id.startsWith("es:")).toBe(true);
      }
    });
  }

  it("checkpoint and mastery are graded steps only", async () => {
    for (const n of [ES_M1_CHECKPOINT_INDEX, MASTERY]) {
      const steps = await buildEsM1Lesson(n);
      expect(
        steps.every((s) => isGradedStep(s)),
        `L${n} carries a non-graded step`,
      ).toBe(true);
    }
  });

  it("the module ends on the Ana goodbye sim — not a grid (R7)", async () => {
    const steps = await buildEsM1Lesson(MASTERY);
    expect(steps[steps.length - 1].type).toBe("dialogue_sim");
  });

  it("every mastery word-image MCQ is audio-prompted — no digit crutch (R4)", async () => {
    const steps = await buildEsM1Lesson(MASTERY);
    for (const s of steps) {
      if (s.type !== "word_image_mcq") continue;
      expect(
        s.options.some((o) => o.word === s.meaningEn),
        `${s.id}: mastery MCQ prompts in English — the emoji answers it`,
      ).toBe(true);
    }
  });

  it("any MCQ with digit options is audio-prompted, module-wide (confirmation walk)", async () => {
    // The walk's top blocker: an English prompt with digit-emoji options
    // prints the answer next to the answer ("1️⃣ is a perfect printed
    // translation") — eight such steps were the entire intro surface for
    // ten items. A digit may appear ONLY where the prompt is the Spanish
    // audio, i.e. the digit is the meaning side, not the crutch.
    const digits = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      for (const s of steps) {
        if (s.type !== "word_image_mcq") continue;
        if (!s.options.some((o) => digits.includes(o.emoji))) continue;
        expect(
          s.options.some((o) => o.word === s.meaningEn),
          `L${n} ${s.id}: digit emoji under an English prompt — the answer is printed next to the answer`,
        ).toBe(true);
      }
    }
  });

  it("the module carries at least 6 zero-reading audio-prompt word MCQs", async () => {
    let count = 0;
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      count += steps.filter(
        (s) =>
          s.type === "word_image_mcq" &&
          s.options.some((o) => o.word === s.meaningEn),
      ).length;
    }
    expect(count).toBeGreaterThanOrEqual(6);
  });

  it("has ZERO typed translate steps — beginner production is tile builds", async () => {
    // R8 originally demanded >=1 typed translate; Spencer's fr m1 L9 walk
    // reversed it (2026-08-21: his phonetically-right «si vu plait» graded
    // wrong). Typed production tests SPELLING a beginner hasn't been
    // taught, so beginner modules build from tiles instead — typed
    // translate returns in later modules, once orthography is earned.
    let count = 0;
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      count += steps.filter((s) => s.type === "translate").length;
    }
    expect(count).toBe(0);
  });

  it("cued recall NEVER precedes a printed first voicing (R3 / §13.9)", async () => {
    // The machine form of the recall law: the first time a phrase is
    // SPOKEN it shows the printed form; `cue: "recall"` may only target
    // a phrase the learner has already voiced from print.
    const voiced = new Set<string>();
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      for (const s of steps) {
        if (s.type !== "speaking") continue;
        if (s.cue === "recall") {
          expect(
            voiced.has(s.targetPhrase),
            `L${n} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
          ).toBe(true);
        } else {
          voiced.add(s.targetPhrase);
        }
      }
    }
    // And the rework actually USES the mechanism (it was the module's
    // biggest gap: 19/19 read-aloud speaking steps).
    let recalls = 0;
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      recalls += steps.filter(
        (s) => s.type === "speaking" && s.cue === "recall",
      ).length;
    }
    expect(recalls).toBeGreaterThanOrEqual(6);
  });

  it("buenos/buenas trials ALTERNATE answers with both halves live (R5)", async () => {
    // The old module's only two discrimination trials both answered
    // "buenas" — always-answer-buenas scored 100%. Pin: at least two
    // cloze trials answer BUENOS with buenas among the options, and at
    // least one answers BUENAS with buenos live.
    let buenosTrials = 0;
    let buenasTrials = 0;
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      for (const s of steps) {
        if (s.type !== "particle_cloze") continue;
        if (s.correctParticle === "buenos" && s.options.includes("buenas")) {
          buenosTrials++;
        }
        if (s.correctParticle === "buenas" && s.options.includes("buenos")) {
          buenasTrials++;
        }
      }
    }
    expect(buenosTrials, "cloze trials answering buenos").toBeGreaterThanOrEqual(2);
    expect(buenasTrials, "cloze trials answering buenas").toBeGreaterThanOrEqual(1);
  });

  it("gendered greeting words carry the tint layer in every map (§13.4)", async () => {
    // Spencer 2026-08-20: "we need the gender colors implemented in the
    // lessons." The reveal-layer rides word_map.tokenGenders; any map
    // that shows a gendered greeting word must tint it correctly, and
    // invariant words must stay untinted (the contrast is the lesson).
    const GENDERS: Record<string, "m" | "f"> = {
      buenos: "m",
      "días": "m",
      buenas: "f",
      tardes: "f",
      noches: "f",
    };
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      for (const s of steps) {
        if (s.type !== "word_map") continue;
        s.tokens.forEach((token, idx) => {
          const expected = GENDERS[token];
          expect(
            s.tokenGenders?.[idx],
            `L${n} ${s.id}: token «${token}» tint`,
          ).toBe(expected);
        });
      }
    }
  });

  it("no sim offers the NPC's own line as a WRONG option — the natural-answer trap (§13.6)", async () => {
    const norm = (t: string) =>
      t.toLowerCase().replace(/[¡!¿?.,«»\s]+/g, " ").trim();
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      for (const s of steps) {
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
              `L${n} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
            ).toBe(true);
          }
        }
      }
    }
  });

  it("micro-sim goal lines stay terse everywhere — situations shown, not narrated", async () => {
    for (const n of LESSONS) {
      const steps = await buildEsM1Lesson(n);
      for (const s of steps) {
        if (s.type !== "dialogue_sim") continue;
        for (const turn of s.turns) {
          expect(
            turn.goal.split(/\s+/).length,
            `L${n} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });
});
