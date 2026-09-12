import "../courseAtoms";
/**
 * FR m26 curriculum guard — «À la maison» — household rooms + mass-noun
 * kitchen staples. Standard suite in the m17–m25.test.ts shape, plus
 * bespoke pins specific to this module's own design (see m26.ts header):
 *   (a) exactly 8 new atoms this module (target 8, brief ceiling 10).
 *   (b) all 8 new atoms carry a `gender` field (unlike m25's phrase-only
 *       module, this gate has real work to do here).
 *   (c) NO `speaking`/`build`/production-`cloze`/sim-build-reply/MCQ-option
 *       step anywhere targets bare "eau" in isolation — always embedded in
 *       a fuller phrase (§5/§6 of the brief; `eau`/`au` is the largest
 *       existing false-positive class course-wide).
 *   (d) NO step anywhere contains the partitive surface "il y a du "/
 *       "il y a de la "/"il y a de l'" — mass nouns register in m26, the
 *       partitive grammar itself does not ship here (§2.1 of the brief).
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
import { FR_M19_MODULE } from "./m19";
import { FR_M20_MODULE } from "./m20";
import { FR_M21_MODULE } from "./m21";
import { FR_M22_MODULE } from "./m22";
import { FR_M23_MODULE } from "./m23";
import { FR_M24_MODULE } from "./m24";
import { FR_M25_MODULE } from "./m25";
import { FR_M26_ATOMS, FR_M26_MODULE, FR_M26_CHECKPOINT_INDEX } from "./m26";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerFrModuleContentLints({
  moduleId: "m26",
  lessons: FR_M26_MODULE.lessons,
  atoms: FR_M26_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m26",
  lessons: FR_M26_MODULE.lessons,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9",
    "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25",
  ],
});

const LESSONS = FR_M26_MODULE.lessons;
const COUNT = LESSONS.length;

// None of the 8 new nouns is a gender/agreement pair of another (8
// independent nouns, not masculine/feminine forms of the same word) — no
// homophoneKey wiring anywhere in this module, zero new homophone pairs.
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

describe("FR m26 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M26_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m26 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m26 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M26_CHECKPOINT_INDEX) {
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

    it(`L${n}: step-count floor respected for its lesson kind (§13/fr-quality)`, () => {
      const steps = LESSONS[n - 1].steps;
      if (n === FR_M26_CHECKPOINT_INDEX) {
        expect(steps.length).toBeGreaterThanOrEqual(12);
        expect(steps.length).toBeLessThanOrEqual(22);
      } else {
        expect(steps.length).toBeGreaterThanOrEqual(10);
        expect(steps.length).toBeLessThanOrEqual(25);
      }
    });
  }

  it("checkpoint and mastery are graded steps only", () => {
    for (const n of [FR_M26_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m26 L${n} carries a non-graded step`,
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
              `m26 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m26 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m26 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m26Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m26Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m26 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(FR_M21_MODULE.lessons, false);
    walk(FR_M22_MODULE.lessons, false);
    walk(FR_M23_MODULE.lessons, false);
    walk(FR_M24_MODULE.lessons, false);
    walk(FR_M25_MODULE.lessons, false);
    walk(LESSONS, true);
    expect(m26Recalls).toBeGreaterThanOrEqual(4);
  });

  // ── Bespoke m26 pins (this module's own design, m26.ts header decisions) ──

  it("exactly 8 new atoms this module", () => {
    expect(FR_M26_ATOMS.map((a) => a.surface).sort()).toEqual(
      ["beurre", "chambre", "cuisine", "eau", "jardin", "lait", "pain", "salon"].sort(),
    );
  });

  it("all 8 new atoms carry a gender field", () => {
    for (const a of FR_M26_ATOMS) {
      expect(a.gender, `${a.surface} should carry a gender field`).toBeDefined();
    }
  });

  it('no step anywhere targets bare "eau" in isolation — always embedded (§5/§6, eau/au false-positive class)', () => {
    const bad: string[] = [];
    const norm = (t: string) => t.trim().toLowerCase();
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type === "speaking" && norm(s.targetPhrase) === "eau") {
          bad.push(`${l.id}/${s.id}: bare "eau" speaking target`);
        }
        if (s.type === "build_sentence" && norm(s.targetSentence) === "eau") {
          bad.push(`${l.id}/${s.id}: bare "eau" build target`);
        }
        if (s.type === "particle_cloze" && norm(s.correctParticle) === "eau") {
          bad.push(`${l.id}/${s.id}: bare "eau" cloze target`);
        }
        if (s.type === "multiple_choice") {
          for (const o of s.options) {
            if (norm(o.text) === "eau") {
              bad.push(`${l.id}/${s.id}: bare "eau" MCQ option`);
            }
          }
        }
        if (s.type === "word_image_mcq") {
          for (const o of s.options) {
            if (norm(o.word) === "eau") {
              bad.push(`${l.id}/${s.id}: bare "eau" word-image MCQ option`);
            }
          }
        }
        if (s.type === "dialogue_sim") {
          for (const turn of s.turns) {
            if (turn.reply.mode === "build" && norm(turn.reply.answer) === "eau") {
              bad.push(`${l.id}/${s.id}/${turn.id}: bare "eau" sim build-reply target`);
            }
            if (turn.reply.mode === "choice") {
              for (const opt of turn.reply.options) {
                if (norm(opt.text) === "eau") {
                  bad.push(`${l.id}/${s.id}/${turn.id}: bare "eau" sim choice option`);
                }
              }
            }
          }
        }
        // match_pairs plays audio on select (playAudioOnSelect) — a bare
        // "eau" source pair would be a bare-audio moment just like a
        // speaking/listening target.
        if (s.type === "match_pairs") {
          for (const p of s.pairs) {
            if (norm(p.source) === "eau") {
              bad.push(`${l.id}/${s.id}: bare "eau" match_pairs source (plays audio on select)`);
            }
          }
        }
        if (s.type === "listening_build") {
          for (const t of s.tiles) {
            if (norm(t) === "eau") bad.push(`${l.id}/${s.id}: bare "eau" listening_build tile`);
          }
        }
        if (s.type === "liaison_listen") {
          for (const w of s.words) {
            if (norm(w) === "eau") bad.push(`${l.id}/${s.id}: bare "eau" liaison_listen word`);
          }
        }
      }
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it('no "il y a du/de la/de l\'" partitive surface appears anywhere in the module (§2.1 — mass nouns register, partitive grammar does not ship)', () => {
    const hay = JSON.stringify(LESSONS).toLowerCase();
    for (const needle of ["il y a du ", "il y a de la ", "il y a de l'", "il y a de l’"]) {
      expect(
        hay.includes(needle),
        `m26 module JSON contains partitive surface "${needle}"`,
      ).toBe(false);
    }
  });
});
