/**
 * m32-neo module guards — spine unit n4-03, "Conditionals I: たら (と as the
 * contrast)". Same 2026-07-26 module shape as m12–m31 (invariant 25): 9
 * teaching + 3 review + 1 challenge, reviews spread across thirds, challenge
 * lesson LAST. Like m12–m31 it splices NOTHING in at module level — the
 * katakana programme ended at m11 — so the compiled lessons ARE the shipped
 * lessons and the guards run over the whole module.
 *
 * Four things make this file different from m31's, and each has its own
 * describe block:
 *
 *   1. **と's RESTRICTION IS NEVER VIOLATED IN AUTHORED CONTENT.** The module's
 *      payload is that と cannot take a request, an invitation, a want or an
 *      intention in its main clause — ×「えきに つくと、でんわを して ください」.
 *      A module that teaches that antiPattern must not contain it, so the check
 *      scans every compiled Japanese surface for と-clauses whose main clause
 *      ends in ください / ましょう / たい / つもり. Distractor options are scanned
 *      too: a wrong answer the learner is asked to REJECT is fine, but only in
 *      an options list, never as a sentence the lesson presents as Japanese.
 *   2. **ら LANDS ON THE PAST, EVERYWHERE.** たら is built on the た-form, so
 *      any 「dictionary + たら」 surface is a bug. The three deliberately-wrong
 *      shapes (ふるたら, たべるたら, なるたら, はいるたら, おすたら) exist ONLY as
 *      cloze distractors, and the test asserts exactly that split rather than
 *      banning the strings outright — an inventory with no wrong answers in it
 *      would pass for the wrong reason.
 *   3. **ば AND なら APPEAR NOWHERE.** They are n4-08, five modules out, and the
 *      four-way conditional contrast belongs to the m51 capstone. The spine's
 *      standing decision is pairwise-on-introduction, so this module must not
 *      mention them even to say they exist.
 *   4. **FOUR INVENTED IDS, AND ONLY FOUR.** N4 still has no grammar-point
 *      registry, so `tara`, `to-conditional`, `tara-dou` and `gurai-goro` are
 *      IR-local by necessity; every OTHER card is a shipped N5 registry point
 *      re-taught in the new frame. That ratio is asserted against the shipped
 *      registry, not a hand-copied list. `to-conditional` is deliberately NOT
 *      named `to` — `to-and` is a shipped N5 point for the listing particle.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import N5_GRAMMAR_POINTS from "@/features/lesson/data/n5-grammar-points.json";
import m32Ir from "../ir/m32.ir.json";
import { M31_NEO_LESSONS } from "../m31-neo";
import { M32_NEO_LESSONS } from "../m32-neo";
import { M30_NEO_LESSONS } from "../m30-neo";
import { M29_NEO_LESSONS } from "../m29-neo";
import { M28_NEO_LESSONS } from "../m28-neo";
import { M27_NEO_LESSONS } from "../m27-neo";
import { M26_NEO_LESSONS } from "../m26-neo";
import { M25_NEO_LESSONS } from "../m25-neo";
import { M24_NEO_LESSONS } from "../m24-neo";
import { M23_NEO_LESSONS } from "../m23-neo";
import { M22_NEO_LESSONS } from "../m22-neo";
import { M21_NEO_LESSONS } from "../m21-neo";
import { M20_NEO_LESSONS } from "../m20-neo";
import { M19_NEO_LESSONS } from "../m19-neo";
import { M18_NEO_LESSONS } from "../m18-neo";
import { M17_NEO_LESSONS } from "../m17-neo";
import { M16_NEO_LESSONS } from "../m16-neo";
import { M15_NEO_LESSONS } from "../m15-neo";
import { M14_NEO_LESSONS } from "../m14-neo";
import { M13_NEO_LESSONS } from "../m13-neo";
import { M12_NEO_LESSONS } from "../m12-neo";
import { M11_NEO_LESSONS } from "../m11-neo";
import { M10_NEO_LESSONS } from "../m10-neo";
import { M9_NEO_LESSONS } from "../m9-neo";
import { M8_NEO_LESSONS } from "../m8-neo";
import { M7_NEO_LESSONS } from "../m7-neo";
import { M3_NEO_LESSONS } from "../m3-neo";
import { M4_NEO_LESSONS } from "../m4-neo";
import { M5_NEO_LESSONS } from "../m5-neo";
import { M6_NEO_LESSONS } from "../m6-neo";

registerJaModuleContentLints("m32");

registerModuleBarGuards({
  moduleLabel: "m32-neo",
  lessons: M32_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31"],
  priorLessons: [
    ...M3_NEO_LESSONS,
    ...M4_NEO_LESSONS,
    ...M5_NEO_LESSONS,
    ...M6_NEO_LESSONS,
    ...M7_NEO_LESSONS,
    ...M8_NEO_LESSONS,
    ...M9_NEO_LESSONS,
    ...M10_NEO_LESSONS,
    ...M11_NEO_LESSONS,
    ...M12_NEO_LESSONS,
    ...M13_NEO_LESSONS,
    ...M14_NEO_LESSONS,
    ...M15_NEO_LESSONS,
    ...M16_NEO_LESSONS,
    ...M17_NEO_LESSONS,
    ...M18_NEO_LESSONS,
    ...M19_NEO_LESSONS,
    ...M20_NEO_LESSONS,
    ...M21_NEO_LESSONS,
    ...M22_NEO_LESSONS,
    ...M23_NEO_LESSONS,
    ...M24_NEO_LESSONS,
    ...M25_NEO_LESSONS,
    ...M26_NEO_LESSONS,
    ...M27_NEO_LESSONS,
    ...M28_NEO_LESSONS,
    ...M29_NEO_LESSONS,
    ...M30_NEO_LESSONS,
    ...M31_NEO_LESSONS,
  ],
  // Same reason m28/m29/m30 needed this: this module's own inflections
  // (ふったら, なると, おわったら …) and m11–m31's 100+ IR-only forms exist in
  // neither `courseAtoms` nor the conjugation engine's real-form lexicon, so
  // without them the bar guards' tokenizer cannot see the module's headline
  // vocabulary at all. Declaring them makes them TOKENS, which is what subjects
  // them to the debut check — the opposite of a loosening.
  extraVocab: [
    ...(m32Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m32Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
  ],
  canon: COURSE_CANON,
  minLessons: 12,
  maxLessons: 15,
  requireChallengeLast: true,
  requireReviewCount: 3,
  requireChallengeStep: true,
  requireTeachFirst: true,
  requireImageFirst: true,
});


/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; text: string }[] {
  const out: { lessonId: string; text: string }[] = [];
  for (const lesson of M32_NEO_LESSONS) {
    const content = getMockLessonContent(lesson.id) ?? lesson;
    for (const step of content.steps) {
      for (const s of jaSurfaces(step)) out.push({ lessonId: lesson.id, text: s });
    }
  }
  return out;
}

/** Options lists only — where a deliberately-wrong shape is allowed to live. */
function distractorStrings(): string[] {
  const out: string[] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) return void v.forEach(walk);
    if (v && typeof v === "object") {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        if ((k === "options" || k === "distractors") && Array.isArray(val)) {
          for (const o of val) if (typeof o === "string") out.push(o);
        } else walk(val);
      }
    }
  };
  walk(m32Ir);
  return out;
}

describe("m32-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M32_NEO_LESSONS).toHaveLength(13);
    expect(M32_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M32_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M32_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 12", () => {
    const at = M32_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(Boolean);
    expect(at).toEqual([4, 8, 12]);
  });
});

describe("と cannot take a request, an invitation, a want or an intention", () => {
  // The module's own antiPattern. A と-clause is `...と、` — the comma is what
  // separates it from と-the-listing-particle and と-the-quotation, both of
  // which are shipped N5 points and appear all over the prior corpus.
  const FORBIDDEN_TAILS = ["ください", "ましょう", "たい", "つもり"];

  // The module's own antiPatterns ARE the broken sentences — a card that
  // teaches ×「えきに つくと、でんわを して ください」 has to print it. Everything
  // else must be clean.
  const ANTI = new Set(
    (m32Ir as unknown as { grammarPoints: { antiPattern?: { ja: string } }[] }).grammarPoints
      .map((g) => g.antiPattern?.ja?.replace(/[。\s]/g, ""))
      .filter((x): x is string => Boolean(x)),
  );

  it("no presented sentence ends a と-clause with a blocked main clause", () => {
    const offenders: string[] = [];
    for (const { lessonId, text } of presentedSurfaces()) {
      if (ANTI.has(text.replace(/[。\s]/g, ""))) continue;
      const m = text.match(/と、(.*)$/);
      if (!m) continue;
      const main = m[1];
      for (const tail of FORBIDDEN_TAILS) {
        if (main.includes(tail)) offenders.push(`${lessonId}: ${text} (main clause has ${tail})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("scans a non-vacuous number of と-clauses", () => {
    const withTo = presentedSurfaces().filter((s) => /と、/.test(s.text));
    expect(withTo.length).toBeGreaterThan(20);
  });
});

describe("ら lands on the past form", () => {
  // Dictionary-form + たら is ungrammatical, and after the distractor rebuild
  // the module contains no such string anywhere — not even as a wrong answer,
  // because an invented non-form does not tokenize into tracked atoms and the
  // provenance guard rejects it. Every wrong option is now a REAL surface used
  // in the wrong place, which is a better distractor anyway.
  it("no dictionary-plus-たら surface exists, in content or in options", () => {
    const anti = new Set(
      (m32Ir as unknown as { grammarPoints: { antiPattern?: { ja: string } }[] }).grammarPoints
        .map((g) => g.antiPattern?.ja?.replace(/[。\s]/g, ""))
        .filter((x): x is string => Boolean(x)),
    );
    const offenders: string[] = [];
    for (const { lessonId, text } of presentedSurfaces()) {
      if (anti.has(text.replace(/[。\s]/g, ""))) continue;
      for (const m of text.matchAll(/[るすくむぶぬつうぐ]たら/g)) {
        offenders.push(`${lessonId}: ${text} (${m[0]})`);
      }
    }
    for (const d of distractorStrings()) {
      for (const m of d.matchAll(/[るすくむぶぬつうぐ]たら/g)) offenders.push(`option: ${d} (${m[0]})`);
    }
    expect(offenders).toEqual([]);
  });

  it("scans a non-vacuous number of たら surfaces", () => {
    const withTara = presentedSurfaces().filter((s) => /たら/.test(s.text));
    expect(withTara.length).toBeGreaterThan(30);
  });
});

describe("ば and なら are five modules away and appear nowhere", () => {
  it("no compiled surface and no authored prose mentions them", () => {
    const hits = presentedSurfaces().filter(({ text }) =>
      /なら(?![うわいえっ])|れば|けれ/.test(text),
    );
    expect(hits.map((h) => `${h.lessonId}: ${h.text}`)).toEqual([]);
  });
});

describe("four invented grammar-point ids, and only four", () => {
  const INVENTED = ["tara", "to-conditional", "tara-dou", "gurai-goro"];

  it("every other card is a shipped N5 registry point", () => {
    const registry = new Set(
      (N5_GRAMMAR_POINTS as unknown as { id: string }[]).map((p) => p.id),
    );
    const used = new Set(
      (m32Ir as unknown as { grammarPoints: { id: string }[] }).grammarPoints.map((g) => g.id),
    );
    const unregistered = [...used].filter((id) => !registry.has(id));
    expect(unregistered.sort()).toEqual([...INVENTED].sort());
  });

  it("does not reuse the listing particle's id for the conditional", () => {
    const used = (m32Ir as unknown as { grammarPoints: { id: string }[] }).grammarPoints.map((g) => g.id);
    expect(used).not.toContain("to");
    expect(used).toContain("to-conditional");
  });
});
