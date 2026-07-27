/**
 * m15-neo module guards. Same 2026-07-26 module shape as m12/m13/m14
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m14 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
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

registerJaModuleContentLints("m15");

registerModuleBarGuards({
  moduleLabel: "m15-neo",
  lessons: M15_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14"],
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

describe("m15-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M15_NEO_LESSONS).toHaveLength(13);
    const reviews = M15_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M15_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M15_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M15_NEO_LESSONS[M15_NEO_LESSONS.length - 1].id).toBe("ja-m15-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M15_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M15_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M15_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m15-neo owes the spine's relative-clause grammar points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m15. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = ["dictionary-form", "toki", "mae-ni", "te-kara"];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches ta-form and ga-existence in CLAUSE position (the ⟳ beats)", () => {
    // The registry has no id for "relative clause" and inv 42 forbids
    // inventing one, so the past-clause card is m11's `ta-form` and the
    // clause-internal-subject card is m6's `ga-existence`, both re-taught
    // here in the new position. Same move m14 made with `te-form`. The
    // ledger rows for m11/m13 are untouched — a re-teach is not a
    // re-assignment.
    expect(taughtPoints.has("ta-form"), "ta-form card missing").toBe(true);
    expect(taughtPoints.has("ga-existence"), "ga-existence card missing").toBe(true);
    // こと rides m13's `no-ga-suki`: こと and の are one construction with two
    // skins, and `koto-ga-aru` (the EXPERIENCE construction) stays on m23's
    // ledger row.
    expect(taughtPoints.has("no-ga-suki"), "no-ga-suki card missing").toBe(true);
  });

  it("ships NO conjugation_transform ramp (nothing here is a conjugation)", () => {
    // A relative clause composes forms the learner already owns; まえに/てから
    // attach whole forms. A ramp would drill a transformation this module does
    // not teach — and inv 37's hazard class (a ramp emitting a form its rule
    // card never spelled out, or printing an untaught base) cannot arise.
    const ramp = M15_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "conjugation_transform",
    );
    expect(ramp.map((s) => s.id)).toEqual([]);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M15_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m15-neo pedagogy invariants", () => {
  it("NO ます/です form ever appears inside a relative clause", () => {
    // The module's headline claim: the clause verb goes PLAIN. A polite form
    // in front of a noun is the exact error L1's antiPattern names, so it
    // must never appear on a TAUGHT surface. antiPattern text is excluded —
    // that is where the wrong shape is supposed to live.
    const POLITE_IN_CLAUSE =
      /(ます|ません|ました|ませんでした|です|でした)\s*(ひと|こと|とき|まえ|ほん|えいが|くつ|みせ|うた|いえ|じゅぎょう|かばん|くるま|じてんしゃ|ちゃ|じかん)/;
    const offenders: string[] = [];
    for (const lesson of M15_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const scrubbed = { ...step, antiPattern: undefined };
        const blob = JSON.stringify(scrubbed);
        if (POLITE_IN_CLAUSE.test(blob))
          offenders.push(`${lesson.id}/${String(step.id)}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("とき ships MATCHED-TENSE only (the spine defers the relative-tense flip)", () => {
    // spinePlan s11: "とき (#62) temporal clauses — MATCHED-TENSE sentences
    // only in this beat … the contrast belongs to the s22 deepen". So a
    // 〜た とき clause never ends in a non-past main verb and a 〜る とき
    // clause never ends in a past one. Only VERB clause heads carry tense —
    // a noun+の (がくせいの とき), an い-adjective (いそがしい とき) and a
    // な-adjective (げんきな とき) are tenseless and are skipped, which is
    // why the check reads explicit form lists instead of a suffix regex
    // (plain だ ends in the same kana as the past だ of んだ).
    const PAST = new Set([
      "いった", "かった", "きいた", "みた", "たべた", "のんだ", "あそんだ",
      "わかった", "だった",
    ]);
    const NONPAST = new Set([
      "いく", "かう", "きく", "みる", "たべる", "のむ", "ある", "ない",
      "あそぶ", "およぐ", "はたらく", "する", "くる", "うる", "おしえる",
    ]);
    const tenseOf = (tok: string): "past" | "nonpast" | null =>
      PAST.has(tok) ? "past" : NONPAST.has(tok) ? "nonpast" : null;
    const offenders: string[] = [];
    for (const lesson of M15_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const surfaces = [step.targetSentence, step.transcript, step.audioText].filter(
          (x): x is string => typeof x === "string",
        );
        for (const s of surfaces) {
          const m = /(\S+)\s+とき\s+(.+)$/.exec(s.replace(/[。？！]/g, ""));
          if (!m) continue;
          const clause = tenseOf(m[1]);
          const words = m[2].trim().split(/\s+/);
          const main = tenseOf(words[words.length - 1]);
          if (clause === null || main === null) continue;
          if (clause !== main)
            offenders.push(`${lesson.id}/${String(step.id)}: "${s}"`);
        }
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("まえに ALWAYS takes the dictionary form, てから ALWAYS the て-form", () => {
    // The module's two documented traps. 「たべた まえに」 and
    // 「たべるてから」 are the errors; neither may reach a GRADED surface.
    // A grammar_rule card's `rule:` prose and `antiPattern` are excluded:
    // naming the wrong shape out loud ("「たべた まえに」 is never Japanese")
    // is the teaching, and antiPattern is where the error belongs by design.
    const PAST_BEFORE_MAE = /(った|いた|んだ|べた|みた|した|きた|かった)\s*まえに/;
    const DICT_BEFORE_KARA = /(る|う|く|ぐ|す|つ|ぬ|ぶ|む)てから/;
    const offenders: string[] = [];
    for (const lesson of M15_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const blob = JSON.stringify(
          step.type === "grammar_rule"
            ? { ...step, antiPattern: undefined, rule: undefined }
            : step,
        );
        if (PAST_BEFORE_MAE.test(blob) || DICT_BEFORE_KARA.test(blob))
          offenders.push(`${lesson.id}/${String(step.id)}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("こと / とき / まえ are their OWN build tiles, never fused with a particle", () => {
    // Tokenization is pedagogy here: 「たべる ことが すきだ」 must build as
    // たべる / こと / が / すき / だ so the tiles show the composition the
    // rule card describes. A 「ことが」 or 「まえに」 tile would hide it.
    const FUSED = ["ことが", "ことは", "ことを", "ときに", "まえに", "てから"];
    const offenders: string[] = [];
    for (const lesson of M15_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const tiles = step.tiles as string[] | undefined;
        if (!Array.isArray(tiles)) continue;
        for (const t of tiles)
          if (FUSED.includes(t)) offenders.push(`${lesson.id}/${String(step.id)}: ${t}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no rule card names an imageable picture debut (inv 30/44)", () => {
    // requireImageFirst reads the RAW step JSON — `rule:` prose and
    // antiPattern included — and rule cards are PINNED first, so a mention
    // there steals the word's picture debut. m14 documented this; m15's four
    // debuts are deliberately absent from every card.
    const DEBUTS = ["えいが", "くつ", "いそがしい", "りょこう"];
    for (const lesson of M15_NEO_LESSONS) {
      for (const step of lesson.steps) {
        if (step.type !== "grammar_rule") continue;
        const blob = JSON.stringify(step);
        for (const kana of DEBUTS)
          expect(
            blob.includes(kana),
            `${lesson.id}/${step.id} names ${kana}, which must debut on its word_image_mcq`,
          ).toBe(false);
      }
    }
  });
});
