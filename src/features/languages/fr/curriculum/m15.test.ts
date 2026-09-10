/**
 * FR m15 curriculum guard — the «La visite» module. Standard suite in the
 * m5–m14.test.ts shape, plus bespoke pins from
 * docs/fr-m15-brief-2026-09-10.md:
 *   (a) «halle» ships h aspiré (`hAspire: true`) — `withArticle("halle")`
 *       must resolve to "la halle", NEVER "l'halle", in direct contrast
 *       with m4's already-registered mute-h «hôtel» ("l'hôtel").
 *   (b) visiter/visité [vizite] is a pure written-only homophone pair (bare
 *       infinitive vs past participle) — same law as m14's manger/mangé:
 *       never co-presented as two DIFFERENT options inside an audio-bearing
 *       step (listening_build / liaison_listen; listening_comprehension's
 *       options are English glosses, not a vector).
 *   (c) «il n'a pas visité» / «elle n'a pas visité» are never registered as
 *       their own frozen-chunk atoms — they compose live from m14's «n'a»
 *       atom plus this module's own «visité» participle, exactly as m14's
 *       L6-L7 machine already established.
 *   (d) ne-drop forms (dialogue_sim only) are confined to L7 onward — same
 *       law as m13/m14. This module widens the drop-form net past m14's
 *       avoir-only list: L6 debuts present-tense negation ("il ne visite
 *       pas"), so its own colloquial drop ("il visite pas") is also
 *       checked, plus "on a pas visité" (m14's list only covered
 *       j'ai/tu as/il a/elle a — "on" is new to this module's subject set).
 */
import { describe, it, expect } from "vitest";
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
import { FR_M15_ATOMS, FR_M15_MODULE, FR_M15_CHECKPOINT_INDEX } from "./m15";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import { withArticle } from "../grammarHelpers";
import type { LessonStep } from "@/features/lesson/types";

registerFrModuleContentLints({
  moduleId: "m15",
  lessons: FR_M15_MODULE.lessons,
  atoms: FR_M15_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m15",
  lessons: FR_M15_MODULE.lessons,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9",
    "m10", "m11", "m12", "m13", "m14",
  ],
});

const LESSONS = FR_M15_MODULE.lessons;
const COUNT = LESSONS.length;

/** No listening_build / liaison_listen banks authored this module (only
 *  listening_comprehension is used for audio) — kept as a floor for any
 *  future addition. */
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

describe("FR m15 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M15_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m15 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      // L10 (mastery) ends on the sim, not a match — closing-zone match is
      // a teaching/checkpoint-lesson convention (mirrors m13/m14).
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m15 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M15_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M15_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m15 L${n} carries a non-graded step`,
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
              `m15 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m15 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m15 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m15Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m15Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m15 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m15Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m15 pins (docs/fr-m15-brief-2026-09-10.md) ──────────────────

  /** Every French string a step surfaces to the learner — mirrors
   *  fr-quality.test.ts's stepFrenchStrings, plus dialogue_sim turns
   *  (which that shared helper deliberately skips). */
  function allFrenchStrings(step: LessonStep): string[] {
    const s = step as Record<string, unknown>;
    const out: string[] = [];
    for (const k of ["audioText", "targetPhrase", "targetSentence"]) {
      if (typeof s[k] === "string") out.push(s[k] as string);
    }
    if (Array.isArray(s.tokens)) out.push(...(s.tokens as string[]));
    if (s.type === "dialogue_sim") {
      const sim = s as unknown as {
        turns: Array<{
          npc: { audioText: string };
          reply: { audioText?: string; mode: string; options?: Array<{ text: string }> };
        }>;
      };
      for (const t of sim.turns) {
        out.push(t.npc.audioText);
        if (t.reply.audioText) out.push(t.reply.audioText);
        if (t.reply.mode === "choice" && t.reply.options) {
          out.push(...t.reply.options.map((o) => o.text));
        }
      }
    }
    return out;
  }

  /** Answer-position strings ONLY — build/cloze/speaking targets, never
   *  dialogue_sim (which is recognition-only). */
  function answerPositionStrings(step: LessonStep): string[] {
    const s = step as Record<string, unknown>;
    const out: string[] = [];
    if (s.type === "build_sentence" && typeof s.targetSentence === "string") {
      out.push(s.targetSentence as string);
    }
    if (s.type === "speaking" && typeof s.targetPhrase === "string") {
      out.push(s.targetPhrase as string);
    }
    if (s.type === "particle_cloze" && typeof s.correctParticle === "string") {
      out.push(String(s.correctParticle));
    }
    return out;
  }

  /** Options/tiles a step presents for the learner to choose among, when
   *  that step is audio-bearing (the learner hears audio and must pick a
   *  meaning/word — a homophone here is a genuine risk). */
  function audioBearingOptionTexts(step: LessonStep): string[] | null {
    const s = step as Record<string, unknown>;
    if (s.type === "listening_comprehension" && Array.isArray(s.distractorsEn)) {
      // meaning options are English — homophone risk is about the target
      // FRENCH word choices, not the EN glosses; listening_comprehension
      // never exposes French option text, so it's not a vector here.
      return null;
    }
    if (s.type === "listening_build" && Array.isArray(s.tiles)) return s.tiles as string[];
    if (s.type === "liaison_listen" && Array.isArray(s.words)) return s.words as string[];
    return null;
  }

  it("«halle» is h aspiré — withArticle never elides it, in direct contrast with m4's mute-h «hôtel»", () => {
    expect(withArticle("halle")).toBe("la halle");
    const halle = FR_M15_ATOMS.find((a) => a.surface === "halle");
    expect(halle, "atom «halle» must be registered").toBeTruthy();
    expect((halle as { hAspire?: boolean }).hAspire).toBe(true);
    expect((halle as { gender?: string }).gender).toBe("f");
  });

  it("visiter/visité [vizite] never co-presented as options in an audio-bearing step", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        const opts = audioBearingOptionTexts(s);
        if (!opts) continue;
        const set = new Set(opts.map((t) => t.toLowerCase()));
        if (set.has("visiter") && set.has("visité")) {
          bad.push(`${l.id}/${s.id}`);
        }
      }
    }
    expect(bad, `visiter/visité co-presented in an audio-bearing bank: ${bad.join("; ")}`).toEqual([]);
  });

  it("«il n'a pas visité» / «elle n'a pas visité» are never registered as atoms — they must free-derive from m14's «n'a» + this module's «visité»", () => {
    const surfaces = new Set(FR_M15_ATOMS.map((a) => a.surface.toLowerCase()));
    expect(surfaces.has("il n'a pas visité")).toBe(false);
    expect(surfaces.has("elle n'a pas visité")).toBe(false);
    expect(surfaces.has("il n'a pas")).toBe(false);
    expect(surfaces.has("elle n'a pas")).toBe(false);
  });

  it("ne-drop content (dialogue_sim only) is confined to L7 onward", () => {
    const bad: string[] = [];
    const dropForms = [
      /\bj'ai\s+pas\b/i,
      /\btu\s+as\s+pas\b/i,
      /\bil\s+a\s+pas\b/i,
      /\belle\s+a\s+pas\b/i,
      /\bon\s+a\s+pas\b/i,
      /\bje\s+visite\s+pas\b/i,
      /\btu\s+visites\s+pas\b/i,
      /\bil\s+visite\s+pas\b/i,
      /\belle\s+visite\s+pas\b/i,
      /\bon\s+visite\s+pas\b/i,
    ];
    for (const l of LESSONS) {
      const n = Number(/-(\d+)$/.exec(l.id)?.[1] ?? 0);
      if (n >= 7) continue;
      for (const s of l.steps) {
        if (s.type !== "dialogue_sim") continue;
        for (const text of allFrenchStrings(s)) {
          for (const re of dropForms) {
            if (re.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
          }
        }
      }
    }
    expect(bad, `ne-drop form appears before L7: ${bad.join("; ")}`).toEqual([]);
  });

  it("no ne-drop form sits in a written answer position (build/cloze/speaking)", () => {
    const bad: string[] = [];
    const dropForms = [
      /\bj'ai\s+pas\b/i,
      /\btu\s+as\s+pas\b/i,
      /\bil\s+a\s+pas\b/i,
      /\belle\s+a\s+pas\b/i,
      /\bon\s+a\s+pas\b/i,
      /\bje\s+visite\s+pas\b/i,
      /\btu\s+visites\s+pas\b/i,
      /\bil\s+visite\s+pas\b/i,
      /\belle\s+visite\s+pas\b/i,
      /\bon\s+visite\s+pas\b/i,
    ];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of answerPositionStrings(s)) {
          for (const re of dropForms) {
            if (re.test(text)) bad.push(`${l.id}/${s.id}: "${text}"`);
          }
        }
      }
    }
    expect(bad, `ne-drop form in a written answer position: ${bad.join("; ")}`).toEqual([]);
  });

  it("«pas encore» never sits in the same clause as a closed past time («hier soir»)", () => {
    // «pas encore» ("not yet") is incompatible with a closed-past time marker
    // like «hier soir» ("last night") — "not yet last night" is not a
    // coherent reading. Checked across every French string this module
    // surfaces (both answer-position and recognition-only text).
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        for (const text of allFrenchStrings(s)) {
          if (/pas encore/i.test(text) && /hier soir/i.test(text)) {
            bad.push(`${l.id}/${s.id}: "${text}"`);
          }
        }
      }
    }
    expect(bad, `«pas encore» + «hier soir» in the same clause: ${bad.join("; ")}`).toEqual([]);
  });
});
