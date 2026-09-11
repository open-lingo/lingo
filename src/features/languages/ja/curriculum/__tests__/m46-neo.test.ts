/**
 * m46-neo module guards — spine unit n4-17, "Timing & aspect: 〜間に／
 * 〜うちに／〜ところだ／〜たばかり". Same module shape as m30-m45
 * (invariant 25): 8 teaching + 3 review + 1 challenge, reviews spread
 * across thirds, challenge LAST. Like m30-m45 it splices NOTHING in at
 * module level, so the compiled lessons ARE the shipped lessons and the
 * guards run over the whole module.
 *
 * Bespoke ratchets, on top of the standard shape + bar-guard scaffolding
 * every neo module gets:
 *
 *   a. **NO FRESH うち ATOM RATCHET.** うちに rides the SAME already-known
 *      うち lexeme from m16 (ja-m6-1-uchi) — this module registers no new
 *      うち-kana courseAtoms row of its own.
 *   b. **ところ/はじめ CASH-IN RATCHET.** both atoms carry
 *      `fromModule: "m46"` and `introducedByLessonId` pointing at the live
 *      lesson that actually teaches them (ja-m46-neo-4 / ja-m46-neo-6) —
 *      not a dead archived pointer.
 *   c. **め NEVER REGISTERED BARE RATCHET.** no courseAtoms row exists for
 *      bare め as a standalone atom in this module (m16's め "eye" owns
 *      that kana) — only the fused ordinals ひとつめ／ふたつめ appear as
 *      IR-local derivedFrom newAtoms.
 *   d. **QUANTITY-ばかり / TEMPORAL-たばかり NEVER SAME-LESSON RATCHET.**
 *      L5 (quantity ばかり) and L7 (たばかり) are never the same lesson —
 *      a full lesson (L6 + review-2) sits between them so neither primes
 *      the other.
 *   e. **COMPOUND-VERB DICTIONARY-FORM-ONLY RATCHET (L6 pair).**
 *      たべはじめる／よみつづける never appear past-tense-inflected
 *      anywhere in the module (budget discipline — only L8's おわる pair
 *      gets a past-tense surface).
 *   f. **NO ところだった ANYWHERE RATCHET.** the past-copula shape of
 *      ところだ (which this module never establishes as safe) never
 *      appears as a presented Japanese surface.
 *
 *   Plus: challenge-beat grammarPointId sets are pairwise distinct across
 *   all 9 challenge beats (8 teaching-lesson challenges + the capstone) —
 *   invariant 26, checked directly against the compiled IR.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS } from "../../courseAtoms";
import m45Ir from "../ir/m45.ir.json";
import m46Ir from "../ir/m46.ir.json";
import { M46_NEO_LESSONS } from "../m46-neo";
import { M45_NEO_LESSONS } from "../m45-neo";
import { M44_NEO_LESSONS } from "../m44-neo";
import { M43_NEO_LESSONS } from "../m43-neo";
import { M42_NEO_LESSONS } from "../m42-neo";
import { M41_NEO_LESSONS } from "../m41-neo";
import { M40_NEO_LESSONS } from "../m40-neo";
import { M39_NEO_LESSONS } from "../m39-neo";
import { M38_NEO_LESSONS } from "../m38-neo";
import { M37_NEO_LESSONS } from "../m37-neo";
import { M36_NEO_LESSONS } from "../m36-neo";
import { M35_NEO_LESSONS } from "../m35-neo";
import { M34_NEO_LESSONS } from "../m34-neo";
import { M33_NEO_LESSONS } from "../m33-neo";
import { M32_NEO_LESSONS } from "../m32-neo";
import { M31_NEO_LESSONS } from "../m31-neo";
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

registerJaModuleContentLints("m46");

registerModuleBarGuards({
  moduleLabel: "m46-neo",
  lessons: M46_NEO_LESSONS,
  priorModules: [
    "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12",
    "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22",
    "m23", "m24", "m25", "m26", "m27", "m28", "m29", "m30", "m31", "m32",
    "m33", "m34", "m35", "m36", "m37", "m38", "m39", "m40", "m41", "m42",
    "m43", "m44", "m45",
  ],
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
    ...M32_NEO_LESSONS,
    ...M33_NEO_LESSONS,
    ...M34_NEO_LESSONS,
    ...M35_NEO_LESSONS,
    ...M36_NEO_LESSONS,
    ...M37_NEO_LESSONS,
    ...M38_NEO_LESSONS,
    ...M39_NEO_LESSONS,
    ...M40_NEO_LESSONS,
    ...M41_NEO_LESSONS,
    ...M42_NEO_LESSONS,
    ...M43_NEO_LESSONS,
    ...M44_NEO_LESSONS,
    ...M45_NEO_LESSONS,
  ],
  // Same reason every IR-compiled module since m27 has needed this: this
  // module's own derived-form ledger (かえらない／ひとつめ／ふたつめ／
  // たべはじめる／よみつづける／たべおわる／たべおわった) is deliberately
  // NOT registered as a separate courseAtoms row beyond the verb-form/
  // vocab+derivedFrom kind — a derived form is never eligible for its own
  // atom row (irAtomRegistration.test.ts's DERIVED_KINDS rule) — so
  // without this the bar guards' tokenizer cannot see it at all. m45's own
  // newAtoms ride along the same way m45's own test carried m44 forward.
  extraVocab: [
    ...(m46Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m46Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
    ...(m45Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m45Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
      (a) => a.kana,
    ),
  ],
  canon: COURSE_CANON,
  minLessons: 12,
  maxLessons: 12,
  requireChallengeLast: true,
  requireReviewCount: 3,
  requireChallengeStep: true,
  requireTeachFirst: true,
  requireImageFirst: true,
  debutExempt: [
    // Derived verb/adj-form + derivedFrom-vocab atoms (IR-local, never
    // courseAtoms rows — DERIVED_KINDS exemption / derivedFrom exemption
    // per irAtomRegistration.test.ts): かえらない (negative of かえる),
    // ひとつめ／ふたつめ (fused ordinals off already-taught number atoms),
    // たべはじめる／よみつづける (L6 compound-verb dictionary forms),
    // たべおわる／たべおわった (L8 compound-verb dictionary + past form).
    // Each exists only for the tokenizer to see it — requiring it to ALSO
    // clear a debut-type bar is a check this class of token was never
    // meant to satisfy (mirrors m45-neo.test.ts's precedent for its own
    // causative derived forms).
    "かえらない", "ひとつめ", "ふたつめ", "たべはじめる", "よみつづける",
    "たべおわる", "たべおわった",
  ],
});

type CompiledStep = Record<string, unknown> & { type?: string; id?: string };

/**
 * RAW compiled steps — `M46_NEO_LESSONS` directly, deliberately NOT routed
 * through `getMockLessonContent` (the reactive-hint enrichment). m46 has no
 * katakana splicing, so `M46_NEO_LESSONS` already IS what ships.
 */
function stepsOf(lessonId: string): CompiledStep[] {
  const lesson = M46_NEO_LESSONS.find((l) => l.id === lessonId);
  if (!lesson) throw new Error(`m46-neo test: lesson ${lessonId} missing`);
  return lesson.steps as CompiledStep[];
}

/** Every Japanese surface the module presents AS Japanese (not as a wrong answer). */
function presentedSurfaces(): { lessonId: string; stepId: string; text: string }[] {
  const out: { lessonId: string; stepId: string; text: string }[] = [];
  for (const lesson of M46_NEO_LESSONS) {
    for (const step of stepsOf(lesson.id)) {
      for (const s of jaSurfaces(step)) out.push({ lessonId: lesson.id, stepId: step.id!, text: s });
    }
  }
  return out;
}

describe("m46-neo module shape (invariant 25)", () => {
  it("ships 12 lessons: 8 teaching + 3 review + 1 challenge", () => {
    expect(M46_NEO_LESSONS).toHaveLength(12);
    expect(M46_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id))).toHaveLength(3);
    expect(M46_NEO_LESSONS.filter((l) => /-challenge$/.test(l.id))).toHaveLength(1);
    expect(M46_NEO_LESSONS.at(-1)!.id).toMatch(/-challenge$/);
  });

  it("puts the reviews at positions 4, 8 and 11", () => {
    const at = M46_NEO_LESSONS.map((l, i) => (/-review(-\d+)?$/.test(l.id) ? i + 1 : 0)).filter(
      Boolean,
    );
    expect(at).toEqual([4, 8, 11]);
  });
});

describe("no fresh うち atom ratchet: うちに rides the existing m16 lexeme", () => {
  it("m46's newAtoms declare no bare うち row of its own", () => {
    const newAtoms = (m46Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms;
    expect(newAtoms.some((a) => a.kana === "うち")).toBe(false);
  });

  it("the already-known うち atom (ja-m6-1-uchi, m16) is still the only うち registration in courseAtoms", () => {
    const uchiRows = JA_COURSE_ATOMS.filter((a) => a.kana === "うち");
    expect(uchiRows).toHaveLength(1);
    expect(uchiRows[0]?.fromModule).toBe("m16");
  });
});

describe("ところ/はじめ cash-in ratchet: live pointers, not dead archived ones", () => {
  it("ところ carries fromModule m46 and points at ja-m46-neo-4", () => {
    const tokoro = JA_COURSE_ATOMS.find((a) => a.id === "tokoro");
    expect(tokoro?.fromModule).toBe("m46");
    expect(tokoro?.introducedByLessonId).toBe("ja-m46-neo-4");
  });

  it("はじめ carries fromModule m46 and points at ja-m46-neo-6", () => {
    const hajime = JA_COURSE_ATOMS.find((a) => a.id === "hajime");
    expect(hajime?.fromModule).toBe("m46");
    expect(hajime?.introducedByLessonId).toBe("ja-m46-neo-6");
  });
});

describe("め never registered bare ratchet", () => {
  it("no courseAtoms row has kana exactly め with fromModule m46", () => {
    const bareMe = JA_COURSE_ATOMS.find((a) => a.kana === "め" && a.fromModule === "m46");
    expect(bareMe).toBeUndefined();
  });

  it("m46's newAtoms register only the fused ordinals ひとつめ／ふたつめ, never bare め", () => {
    const newAtoms = (m46Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms;
    expect(newAtoms.some((a) => a.kana === "め")).toBe(false);
    expect(newAtoms.some((a) => a.kana === "ひとつめ")).toBe(true);
    expect(newAtoms.some((a) => a.kana === "ふたつめ")).toBe(true);
  });
});

describe("quantity-ばかり / temporal-たばかり never same-lesson ratchet", () => {
  it("bakari-quantity (L5) and ta-bakari-vs-ta-tokoro (L7) tag different lessons", () => {
    const lessons = (m46Ir as unknown as {
      lessons: { id: string; beats: { kind: string; exercises?: string[] }[] }[];
    }).lessons;
    const lessonsWithId = (gpId: string): string[] =>
      lessons
        .filter((l) => l.beats.some((b) => b.exercises?.includes(gpId)))
        .map((l) => l.id);
    const quantityLessons = lessonsWithId("bakari-quantity");
    const temporalLessons = lessonsWithId("ta-bakari-vs-ta-tokoro");
    expect(quantityLessons.length).toBeGreaterThan(0);
    expect(temporalLessons.length).toBeGreaterThan(0);
    for (const l of quantityLessons) expect(temporalLessons).not.toContain(l);
  });
});

describe("compound-verb dictionary-form-only ratchet: L6's はじめる／つづける pair never past-tense-inflected", () => {
  it("no presented Japanese surface contains たべはじめた or よみつづけた", () => {
    const offenders = presentedSurfaces().filter(
      ({ text }) => text.includes("たべはじめた") || text.includes("よみつづけた"),
    );
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });
});

describe("no ところだった anywhere ratchet: the past-copula shape is never established as safe", () => {
  it("no presented Japanese surface anywhere in this module contains ところだった", () => {
    const offenders = presentedSurfaces().filter(({ text }) => text.includes("ところだった"));
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });
});

describe("challenge-beat grammarPointId sets are pairwise distinct (invariant 26)", () => {
  it("every challenge beat across the module combines a unique set of grammarPointIds", () => {
    const lessons = (m46Ir as unknown as {
      lessons: { id: string; beats: { kind: string; combines?: string[] }[] }[];
    }).lessons;
    const sets: { lessonId: string; combo: string }[] = [];
    for (const lesson of lessons) {
      for (const beat of lesson.beats) {
        if (beat.kind === "challenge" && beat.combines) {
          sets.push({ lessonId: lesson.id, combo: [...beat.combines].sort().join("+") });
        }
      }
    }
    // 8 teaching-lesson challenges + 1 capstone challenge lesson = 9 beats.
    expect(sets.length).toBe(9);
    const combos = sets.map((s) => s.combo);
    expect(new Set(combos).size).toBe(combos.length);
  });
});

describe("だ+けど spacing discovery: no unspaced ところだけど anywhere", () => {
  it("no presented Japanese surface contains ところだけど (unspaced standalone copula だ + けど)", () => {
    const offenders = presentedSurfaces().filter(({ text }) => text.includes("ところだけど"));
    expect(offenders, JSON.stringify(offenders, null, 2)).toEqual([]);
  });
});
