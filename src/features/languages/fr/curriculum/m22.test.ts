/**
 * FR m22 curriculum guard — «À qui ?» (possession-de consolidation).
 * Standard suite in the m17-m21.test.ts shape, plus bespoke pins specific
 * to this module's speech-safety design (see m22.ts header, decision 6):
 *   (a) no `speaking` step's target differs from ANY other `speaking`
 *       target anywhere in the module by only a possessor-name swap
 *       (the classic "le sac de Marie"/"le sac de Paul" minimal pair the
 *       course-wide gate treats as HIGH RISK).
 *   (b) no `speaking` step's target differs from ANY other `speaking`
 *       target by only "ce n'est pas" / "c'est" (negation presence).
 *   (c) none of the three vowel-onset FR_PROPER_NAMES entries (hugo,
 *       emma, inès/ines) is used ANYWHERE in this module — a stricter
 *       self-imposed rule than "never right after de", chosen to make
 *       this pin trivially auditable and sidestep the d'-elision gap in
 *       getFrRealFormLexicon() entirely.
 *   Both (a) and (b) are expected to be VACUOUS by construction — this
 *   module has exactly one graded non-recall `speaking` target for its
 *   entire run — but are asserted explicitly rather than assumed.
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
import { FR_M22_ATOMS, FR_M22_MODULE, FR_M22_CHECKPOINT_INDEX } from "./m22";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";

registerFrModuleContentLints({
  moduleId: "m22",
  lessons: FR_M22_MODULE.lessons,
  atoms: FR_M22_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m22",
  lessons: FR_M22_MODULE.lessons,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9",
    "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21",
  ],
});

const LESSONS = FR_M22_MODULE.lessons;
const COUNT = LESSONS.length;

// No new homophoneKey pairs this module — "sac" carries no homophone risk.
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

describe("FR m22 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M22_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m22 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m22 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M22_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M22_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m22 L${n} carries a non-graded step`,
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
              `m22 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m22 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m22 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m22Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m22Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m22 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m22Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m22 pins (docs/fr-m22-brief-2026-09-10.md speech-safety
  //    checklist + this module's own one-graded-speaking-target policy) ──

  const VOWEL_ONSET_NAMES = ["hugo", "emma", "inès", "ines"];

  it("zero vowel-onset cast names (hugo/emma/inès) appear anywhere in the module", () => {
    const bad: string[] = [];
    const norm = (t: string) => t.toLowerCase();
    for (const l of LESSONS) {
      for (const s of l.steps) {
        const strings: string[] = [];
        const rec = s as Record<string, unknown>;
        for (const k of ["audioText", "targetPhrase", "targetSentence", "title"]) {
          if (typeof rec[k] === "string") strings.push(rec[k] as string);
        }
        if (Array.isArray(rec.tokens)) strings.push(...(rec.tokens as string[]));
        if (Array.isArray(rec.tiles)) strings.push(...(rec.tiles as string[]));
        if (Array.isArray(rec.options)) {
          for (const o of rec.options as Array<{ text?: string }>) {
            if (typeof o.text === "string") strings.push(o.text);
          }
        }
        if (s.type === "dialogue_sim") {
          for (const t of s.turns) {
            strings.push(t.npc.kana);
            if (t.npc.audioText) strings.push(t.npc.audioText);
            if (t.reply.mode === "choice") {
              strings.push(...t.reply.options.map((o) => o.text));
            }
          }
        }
        for (const text of strings) {
          for (const name of VOWEL_ONSET_NAMES) {
            if (new RegExp(`\\b${name}\\b`, "i").test(norm(text))) {
              bad.push(`${l.id}/${s.id}: "${name}" in "${text}"`);
            }
          }
        }
      }
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it("no `speaking` target differs from another `speaking` target ONLY by a possessor-name swap", () => {
    const targets: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type === "speaking") targets.push(s.targetPhrase);
      }
    }
    // Strip trailing "de <Name>" and compare stems — if two DIFFERENT full
    // phrases share a stem, that's a bare possessor-name minimal pair.
    const stemOf = (t: string) => t.replace(/\bde\s+[A-ZÀ-Ü][\wÀ-ÿ']*\s*$/i, "de •").trim();
    const byStem = new Map<string, Set<string>>();
    for (const t of targets) {
      const stem = stemOf(t);
      if (!byStem.has(stem)) byStem.set(stem, new Set());
      byStem.get(stem)!.add(t);
    }
    const bad: string[] = [];
    for (const [stem, phrases] of byStem) {
      if (phrases.size > 1) bad.push(`${stem}: ${[...phrases].join(" / ")}`);
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it("no `speaking` target differs from another `speaking` target ONLY by negation presence", () => {
    const targets: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type === "speaking") targets.push(s.targetPhrase);
      }
    }
    const stemOf = (t: string) => t.replace(/^ce n'est pas\b/i, "c'est").trim();
    const byStem = new Map<string, Set<string>>();
    for (const t of targets) {
      const stem = stemOf(t);
      if (!byStem.has(stem)) byStem.set(stem, new Set());
      byStem.get(stem)!.add(t);
    }
    const bad: string[] = [];
    for (const [stem, phrases] of byStem) {
      if (phrases.size > 1) bad.push(`${stem}: ${[...phrases].join(" / ")}`);
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });

  it("exactly one graded non-recall `speaking` target for the whole module (policy pin)", () => {
    let printedCount = 0;
    for (const l of LESSONS) {
      for (const s of l.steps) {
        if (s.type === "speaking" && s.cue !== "recall") printedCount++;
      }
    }
    expect(printedCount).toBe(1);
  });

  it('no "qui" of any kind (question-word usage) appears anywhere in the module (decision 3: dropped beat)', () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        const rec = s as Record<string, unknown>;
        const strings: string[] = [];
        for (const k of ["audioText", "targetPhrase", "targetSentence", "title"]) {
          if (typeof rec[k] === "string") strings.push(rec[k] as string);
        }
        if (s.type === "dialogue_sim") {
          for (const t of s.turns) {
            strings.push(t.npc.kana);
            if (t.npc.audioText) strings.push(t.npc.audioText);
          }
        }
        for (const text of strings) {
          if (/\bqui\b/i.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
        }
      }
    }
    expect(bad, bad.join("; ")).toEqual([]);
  });
});
