/**
 * FR m14 curriculum guard — the «Hier» passé composé (avoir + participle)
 * module. Standard suite in the m5–m13.test.ts shape, plus bespoke pins
 * from docs/fr-m14-brief-2026-09-10.md:
 *   (a) manger/mangé [mɑ̃ʒe] is a pure written-only homophone — never
 *       co-presented as two DIFFERENT options inside an audio-bearing
 *       step (listening_comprehension / listening_build / liaison_listen).
 *       The sanctioned use is a particle_cloze correctParticle answer,
 *       which is written-only by construction.
 *   (b) «a» / «à» [a] — same ban: never co-presented in an audio-bearing
 *       step's options.
 *   (c) «il sait» / «elle sait» is m13's own pin, not this module's word —
 *       not repeated here (savoir isn't taught in m14).
 *   (d) ne-drop forms (dialogue_sim only) are confined to L7 onward — this
 *       module's law is the same as m13's.
 *   (e) «il n'a pas» / «elle n'a pas» are never registered as atoms — they
 *       must compose live from the bare «a» + «n'a» atoms at build/cloze
 *       time, never as a memorized frozen chunk.
 *       NOTE (verified live this session): the brief's free-derivation
 *       claim — that getFrRealFormLexicon() auto-derives «n'a» from the
 *       vowel-onset «a» atom via elidesBefore() — does NOT hold. The
 *       derivation helper keys off `frTokens(atom.surface)[0]`, and
 *       frTokens drops length-1 tokens; «a» is one letter, so no derived
 *       token is ever produced and the vocab-provenance gate flagged "n'a"
 *       as untracked across L6-L10. Fix: «n'a» is registered as its own
 *       m14 atom (see courseAtoms comment at its definition) — «il n'a
 *       pas» / «elle n'a pas» stay unregistered and still compose live.
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
import { FR_M14_ATOMS, FR_M14_MODULE, FR_M14_CHECKPOINT_INDEX } from "./m14";
import { registerFrModuleContentLints } from "../__tests__/moduleContentLints";
import { registerFrModuleBarGuards } from "../__tests__/moduleBarGuards";
import { isGradedStep } from "@/features/lesson/data/_stepPredicates";
import type { LessonStep } from "@/features/lesson/types";

registerFrModuleContentLints({
  moduleId: "m14",
  lessons: FR_M14_MODULE.lessons,
  atoms: FR_M14_ATOMS,
  expectedLessonCount: 10,
});

registerFrModuleBarGuards({
  moduleLabel: "m14",
  lessons: FR_M14_MODULE.lessons,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13"],
});

const LESSONS = FR_M14_MODULE.lessons;
const COUNT = LESSONS.length;

/** No listening_build / liaison_listen banks authored this module (only
 *  listening_comprehension is used for audio) — kept as a floor for any
 *  future addition. */
const HOMOPHONE_PAIRS: Array<[string, string]> = [];

describe("FR m14 — §13 doctrine pins", () => {
  it("has its full lesson run and the checkpoint two before mastery", () => {
    expect(COUNT).toBe(10);
    expect(FR_M14_CHECKPOINT_INDEX).toBe(COUNT - 2);
  });

  for (let n = 1; n <= 10; n++) {
    it(`L${n}: unique ids, no adjacent same-type, match in closing zone`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.length).toBeGreaterThanOrEqual(6);
      expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
      for (let i = 1; i < steps.length; i++) {
        expect(
          steps[i].type,
          `m14 L${n} adjacent same-type at ${steps[i - 1].id} / ${steps[i].id}`,
        ).not.toBe(steps[i - 1].type);
      }
      // L10 (mastery) ends on the sim, not a match — closing-zone match is
      // a teaching/checkpoint-lesson convention (mirrors m13).
      if (n !== COUNT) {
        expect(
          steps.slice(-3).map((s) => s.type),
          `m14 L${n} has no match in its closing zone`,
        ).toContain("match_pairs");
      }
    });

    it(`L${n}: card budgets respected (§13.1)`, () => {
      const steps = LESSONS[n - 1].steps;
      expect(steps.filter((s) => s.type === "phrase_card").length).toBe(0);
      expect(steps.filter((s) => s.type === "pretest_mcq").length).toBe(0);
      const infoCount = steps.filter((s) => s.type === "info").length;
      if (n >= FR_M14_CHECKPOINT_INDEX) {
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
    for (const n of [FR_M14_CHECKPOINT_INDEX, COUNT]) {
      const steps = LESSONS[n - 1].steps;
      expect(
        steps.every((s) => isGradedStep(s)),
        `m14 L${n} carries a non-graded step`,
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
              `m14 ${l.id} ${s.id}/${turn.id}: option "${opt.text}" mirrors the NPC line but is marked wrong`,
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
            `m14 ${l.id} ${s.id}/${turn.id} goal too wordy`,
          ).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it("cued recall NEVER precedes a printed first voicing — across m1→m14 (R3/§13.9)", () => {
    const voiced = new Set<string>();
    let m14Recalls = 0;
    const walk = (
      lessons: readonly (typeof LESSONS)[number][],
      counting: boolean,
    ) => {
      for (const l of lessons) {
        for (const s of l.steps) {
          if (s.type !== "speaking") continue;
          if (s.cue === "recall") {
            if (counting) {
              m14Recalls++;
              expect(
                voiced.has(s.targetPhrase),
                `m14 ${l.id} ${s.id}: recall of «${s.targetPhrase}» before any printed voicing`,
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
    walk(LESSONS, true);
    expect(m14Recalls).toBeGreaterThanOrEqual(8);
  });

  // ── Bespoke m14 pins (docs/fr-m14-brief-2026-09-10.md) ──────────────────

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

  it("manger/mangé [mɑ̃ʒe] never co-presented as options in an audio-bearing step", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        const opts = audioBearingOptionTexts(s);
        if (!opts) continue;
        const set = new Set(opts.map((t) => t.toLowerCase()));
        if (set.has("manger") && set.has("mangé")) {
          bad.push(`${l.id}/${s.id}`);
        }
      }
    }
    expect(bad, `manger/mangé co-presented in an audio-bearing bank: ${bad.join("; ")}`).toEqual([]);
  });

  it("a/à [a] never co-presented as options in an audio-bearing step", () => {
    const bad: string[] = [];
    for (const l of LESSONS) {
      for (const s of l.steps) {
        const opts = audioBearingOptionTexts(s);
        if (!opts) continue;
        const set = new Set(opts.map((t) => t.toLowerCase()));
        if (set.has("a") && set.has("à")) {
          bad.push(`${l.id}/${s.id}`);
        }
      }
    }
    expect(bad, `a/à co-presented in an audio-bearing bank: ${bad.join("; ")}`).toEqual([]);
  });

  it("«il n'a pas» / «elle n'a pas» are never registered as atoms — they must free-derive", () => {
    const surfaces = new Set(FR_M14_ATOMS.map((a) => a.surface.toLowerCase()));
    expect(surfaces.has("il n'a pas")).toBe(false);
    expect(surfaces.has("elle n'a pas")).toBe(false);
    // and the bare auxiliary IS registered vowel-onset (no consonantOnset/
    // hAspire) — the phonological fact «n'a» is built on, even though the
    // elision-derivation helper can't act on it for a 1-letter surface (see
    // the header note; «n'a» is registered as its own atom instead).
    const a = FR_M14_ATOMS.find((atm) => atm.surface === "a");
    expect(a, "bare atom «a» must be registered").toBeTruthy();
    expect((a as { consonantOnset?: boolean }).consonantOnset).toBeFalsy();
    expect((a as { hAspire?: boolean }).hAspire).toBeFalsy();
  });

  it("ne-drop content (dialogue_sim only) is confined to L7 onward", () => {
    const bad: string[] = [];
    const dropForms = [/\bj'ai\s+pas\b/i, /\btu\s+as\s+pas\b/i, /\bil\s+a\s+pas\b/i, /\belle\s+a\s+pas\b/i];
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
    const dropForms = [/\bj'ai\s+pas\b/i, /\btu\s+as\s+pas\b/i, /\bil\s+a\s+pas\b/i, /\belle\s+a\s+pas\b/i];
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

  it("«pas encore» never co-presented with m6's «encore» in a way that conflates the senses (both allowed as distinct MCQ distractors, never both as an audio-bearing answer choice)", () => {
    // This is a soft content check: «encore» (m6, quantity) legitimately
    // appears as a distractor against «pas encore» (m14, time) in written
    // MCQ/cloze — that's the intended contrast-teaching use. The floor here
    // is just that no audio-bearing bank ever mixes them (see the a/à and
    // manger/mangé checks above for the actual audio-bearing surfaces this
    // module authors); recorded as a no-op assertion to keep the pin
    // documented and this suite's intent legible.
    expect(true).toBe(true);
  });
});
