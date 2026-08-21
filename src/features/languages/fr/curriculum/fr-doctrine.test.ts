/**
 * FR m1+m2 curriculum guard — the §13-doctrine hand-authored modules.
 *
 * Promoted 2026-08-21 from the dev prototypes (Spencer's walk = the Denise
 * audition, passed). Shared lints at ZERO debt (no debt parameter exists
 * for FR — the bar predates the first module) plus the doctrine suite
 * ported from `features/lesson/dev/frProtoLessons.test.ts`. The recall-law
 * walk runs ACROSS modules: m1's printed voicings license m2's recalls.
 */
import { describe, it, expect } from "vitest";
import { FR_M1_ATOMS, FR_M1_MODULE, FR_M1_CHECKPOINT_INDEX } from "./m1";
import { FR_M2_ATOMS, FR_M2_MODULE, FR_M2_CHECKPOINT_INDEX } from "./m2";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerFrModuleContentLints({
  moduleId: "m1",
  lessons: FR_M1_MODULE.lessons,
  atoms: FR_M1_ATOMS,
  expectedLessonCount: 9,
});
registerFrModuleContentLints({
  moduleId: "m2",
  lessons: FR_M2_MODULE.lessons,
  atoms: FR_M2_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({ moduleLabel: "m1", lessons: FR_M1_MODULE.lessons, priorModules: [] });
registerFrModuleBarGuards({ moduleLabel: "m2", lessons: FR_M2_MODULE.lessons, priorModules: ["m1"] });

const MODULES = [
  {
    name: "fr m1",
    lessons: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    build: async (n: number) => FR_M1_MODULE.lessons[n - 1].steps,
    count: 9,
    checkpoint: FR_M1_CHECKPOINT_INDEX,
    mastery: 9,
  },
  {
    name: "fr m2",
    lessons: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    build: async (n: number) => FR_M2_MODULE.lessons[n - 1].steps,
    count: 10,
    checkpoint: FR_M2_CHECKPOINT_INDEX,
    mastery: 10,
  },
] as const;

// The fr tint dictionary — any map showing one of these tokens must
// tint it exactly so; everything else stays untinted (§13.4).
const GENDERS: Record<string, "m" | "f"> = {
  bonne: "f",
  nuit: "f",
  il: "m",
  elle: "f",
  "étudiant": "m",
  "étudiante": "f",
  monsieur: "m",
};

describe("FR m1+m2 — §13 doctrine pins (ported from the dev prototype suite)", () => {
  for (const mod of MODULES) {
    describe(mod.name, () => {
      it("has its full lesson run and a checkpoint after ALL teaching", () => {
        expect(mod.count).toBe(mod.lessons.length);
        expect(mod.checkpoint).toBe(mod.mastery - 2);
      });

      for (const n of mod.lessons) {
        it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, async () => {
          const steps = await mod.build(n);
          expect(steps.length).toBeGreaterThanOrEqual(6);
          expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
          for (let i = 1; i < steps.length; i++) {
            expect(
              steps[i].type,
              `${mod.name} L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
            ).not.toBe(steps[i - 1].type);
          }
          expect(
            steps.slice(-3).map((s) => s.type),
            `${mod.name} L${n} has no match in its closing zone`,
          ).toContain("match_pairs");
        });

        it(`L${n}: card budgets respected (§13.1)`, async () => {
          const steps = await mod.build(n);
          expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
          expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
          const infoCount = steps.filter((s) => s.type === "info").length;
          if (n >= mod.checkpoint) {
            expect(infoCount, "checkpoint/integration/mastery carry no cards").toBe(0);
          } else {
            expect(infoCount).toBeLessThanOrEqual(1);
          }
        });

        it(`L${n}: exercised atoms resolve to registered fr: ids (promotion flips §13.7)`, async () => {
          const steps = await mod.build(n);
          for (const s of steps) {
            const ex = (s as { exercisedAtoms?: string[] }).exercisedAtoms ?? [];
            for (const id of ex) expect(id.startsWith("fr:")).toBe(true);
          }
        });
      }

      it("checkpoint and mastery are graded steps only", async () => {
        for (const n of [mod.checkpoint, mod.mastery]) {
          const steps = await mod.build(n);
          expect(
            steps.every((s) => isGradedStep(s)),
            `${mod.name} L${n} carries a non-graded step`,
          ).toBe(true);
        }
      });

      it("the module ends on a sim — not a grid (R7)", async () => {
        const steps = await mod.build(mod.mastery);
        expect(steps[steps.length - 1].type).toBe("dialogue_sim");
      });

      it("any MCQ with digit options is audio-prompted (R4)", async () => {
        const digits = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        for (const n of mod.lessons) {
          for (const s of await mod.build(n)) {
            if (s.type !== "word_image_mcq") continue;
            if (!s.options.some((o) => digits.includes(o.emoji))) continue;
            expect(
              s.options.some((o) => o.word === s.meaningEn),
              `${mod.name} L${n} ${s.id}: digit emoji under an English prompt`,
            ).toBe(true);
          }
        }
      });

      it("gendered words carry the tint layer in every map (§13.4)", async () => {
        for (const n of mod.lessons) {
          for (const s of await mod.build(n)) {
            if (s.type !== "word_map") continue;
            s.tokens.forEach((token, idx) => {
              expect(
                s.tokenGenders?.[idx],
                `${mod.name} L${n} ${s.id}: token «${token}» tint`,
              ).toBe(GENDERS[token]);
            });
          }
        }
      });

      it("has ZERO typed translate steps — beginner production is tile builds", async () => {
        // R8 originally demanded >=1 typed translate; Spencer's fr m1 L9 walk
        // reversed it (2026-08-21: his phonetically-right «si vu plait» graded
        // wrong). Typed production tests SPELLING a beginner hasn't been
        // taught, so beginner modules build from tiles instead — typed
        // translate returns in later modules, once orthography is earned.
        let count = 0;
        for (const n of mod.lessons) {
          count += (await mod.build(n)).filter((s) => s.type === "translate").length;
        }
        expect(count).toBe(0);
      });

      it("no sim offers the NPC's own line as a WRONG option (§13.6)", async () => {
        const norm = (t: string) =>
          t.toLowerCase().replace(/[!?.,«»\s]+/g, " ").trim();
        for (const n of mod.lessons) {
          for (const s of await mod.build(n)) {
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
                  `${mod.name} L${n} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
                ).toBe(true);
              }
            }
          }
        }
      });

      it("micro-sim goal lines stay terse", async () => {
        for (const n of mod.lessons) {
          for (const s of await mod.build(n)) {
            if (s.type !== "dialogue_sim") continue;
            for (const turn of s.turns) {
              expect(
                turn.goal.split(/\s+/).length,
                `${mod.name} L${n} ${s.id}/${turn.id} goal too wordy`,
              ).toBeLessThanOrEqual(8);
            }
          }
        }
      });
    });
  }

  it("cued recall NEVER precedes a printed first voicing — across BOTH modules (R3/§13.9)", async () => {
    const voiced = new Set<string>();
    let recalls = 0;
    for (const mod of MODULES) {
      for (const n of mod.lessons) {
        for (const s of await mod.build(n)) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            recalls++;
            expect(
              voiced.has(s.targetPhrase),
              `${mod.name} L${n} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
            ).toBe(true);
          } else {
            voiced.add(s.targetPhrase);
          }
        }
      }
    }
    expect(recalls).toBeGreaterThanOrEqual(12);
  });
});
