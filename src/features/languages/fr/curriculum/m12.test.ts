/**
 * FR m12 curriculum guard — the «C'est combien ?» number-machine module:
 * regular tens (vingt–soixante) + cent, plus a shopping toolkit (ça coûte,
 * c'est cher, ce n'est pas cher). Standard suite in the m5–m11.test.ts
 * shape, plus two bespoke pins from docs/fr-m12-brief-2026-09-10.md:
 *   (a) no `speaking` (audio-graded) step targets a number above vingt/20
 *       — `ROMANCE_NUMBER_WORDS` only covers 0–20, so a spoken 21+ risks
 *       an ITN inversion with no word to map back to (brief §6/§7.3).
 *   (b) every dialogue_sim from L6 onward (the shopping lessons) quotes at
 *       least one price — a number + "euro(s)" pattern — somewhere in its
 *       NPC lines or reply options.
 * m12 authors no listening_build/liaison_listen banks, so the homophone
 * co-tiling ban is vacuously true (kept as a floor, same as m11).
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
import { FR_M12_ATOMS, FR_M12_MODULE, FR_M12_CHECKPOINT_INDEX } from "./m12";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerFrModuleContentLints({
  moduleId: "m12",
  lessons: FR_M12_MODULE.lessons,
  atoms: FR_M12_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m12",
  lessons: FR_M12_MODULE.lessons,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11"],
});

const LESSONS = FR_M12_MODULE.lessons;
const COUNT = LESSONS.length;

/** No homophone-co-tiling risk authored this module (no listening_build /
 *  liaison_listen banks) — kept as a floor for any future addition. */
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

/** Numbers this module explicitly keeps OUT of any audio-graded step —
 *  everything at or above "trente" (30), plus any vingt-compound past
 *  vingt itself (vingt et un = 21, vingt-deux = 22, …). Bare "vingt" (20)
 *  is the ceiling `ROMANCE_NUMBER_WORDS` still covers, so it's allowed. */
const NUMBER_ABOVE_TWENTY = /\b(trente|quarante|cinquante|soixante|cent)\b|vingt[\s-](?:et[\s-])?(?:un|deux|trois|quatre|cinq|six|sept|huit|neuf)/i;

/** A quoted price: a French tens/units number word followed by "euro(s)". */
const PRICE_PATTERN = /\b(vingt|trente|quarante|cinquante|soixante|cent)\b[^.!?]{0,20}\beuros?\b/i;

describe("FR m12 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M12_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m12 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      expect(
        steps.slice(-3).map((s) => s.type),
        `m12 L${n} has no match in its closing zone`,
      ).toContain("match_pairs");
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M12_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M12_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m12 L${n} carries a non-graded step`,
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
              `m12 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m12 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m12 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m12Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m12Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m12 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m12Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m12 pins (docs/fr-m12-brief-2026-09-10.md §6/§7.3, §4) ──────

  it("no audio-graded (speaking) step targets a number above vingt/20", () => {
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type !== "speaking") continue;
        expect(
          NUMBER_ABOVE_TWENTY.test(s.targetPhrase),
          `m12 ${l.id} ${s.id}: speaking step targets a number above 20 — ` +
            `«${s.targetPhrase}» — ROMANCE_NUMBER_WORDS only covers 0-20`,
        ).toBe(false);
      }
    }
  });

  it("every L6+ dialogue_sim quotes at least one price", () => {
    for (const l of LESSONS.slice(5)) {
      for (const s of l.steps) {
        if (s.type !== "dialogue_sim") continue;
        const allText = s.turns
          .flatMap((t) => [
            t.npc.kana,
            ...(t.reply.mode === "choice" ? t.reply.options.map((o) => o.text) : []),
          ])
          .join(" — ");
        expect(
          PRICE_PATTERN.test(allText),
          `m12 ${l.id} ${s.id}: dialogue_sim carries no price (number + euro(s))`,
        ).toBe(true);
      }
    }
  });
});
