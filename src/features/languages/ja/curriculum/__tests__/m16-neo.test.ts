/**
 * m16-neo module guards. Same 2026-07-26 module shape as m12-m15
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m15 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
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

registerJaModuleContentLints("m16");

registerModuleBarGuards({
  moduleLabel: "m16-neo",
  lessons: M16_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15"],
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

describe("m16-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M16_NEO_LESSONS).toHaveLength(13);
    const reviews = M16_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M16_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M16_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M16_NEO_LESSONS[M16_NEO_LESSONS.length - 1].id).toBe("ja-m16-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M16_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M16_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M16_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m16-neo owes the spine's clause-linking grammar points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m16. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced.
   *  `made-until` is on this row because spinePlan s13 asks for から…まで in so
   *  many words while s15 (m19) asks only for までに; the ledger row was moved
   *  rather than ignored (see the IR notes). */
  const OWED = [
    "kara-because",
    "node-because",
    "kedo",
    "kara-origin",
    "counter-mai",
    "masu-past-negative",
    "made-until",
  ];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches wa-topic and nai-form in their NEW positions (the ⟳ beats)", () => {
    // The registry has no `wa-vs-ga` id and no id for the plain past negative,
    // and inv 42 forbids inventing one. So the は/が contrast lesson the spine
    // asks for is carried by m3's `wa-topic`, and the なかった card by m6's
    // `nai-form` — なかった IS the ない form with an い-adjective ending
    // swapped. Same ⟳ move m15 made with `ta-form`/`ga-existence`. No ledger
    // row moves for either: a re-teach is not a re-assignment.
    expect(taughtPoints.has("wa-topic"), "wa-topic card missing").toBe(true);
    expect(taughtPoints.has("nai-form"), "nai-form card missing").toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M16_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m16-neo pedagogy invariants", () => {
  it("ships exactly TWO conjugation ramps, and every emitted form is on its rule card", () => {
    // Inv 37: the ramp is pinned ahead of the interleaved middle and is NOT
    // intro-capable, so a form it emits that the introducing card never spells
    // out would debut on a non-intro step. L7 drills ませんでした and L8
    // なかった, three verbs each, one per class.
    const ramp = M16_NEO_LESSONS.flatMap((l) =>
      l.steps
        .filter((s) => s.type === "conjugation_transform")
        .map((s) => ({ lesson: l.id, step: s as unknown as Record<string, unknown> })),
    );
    expect(ramp).toHaveLength(6);
    const cards = new Map<string, string>();
    for (const lesson of M16_NEO_LESSONS)
      for (const step of lesson.steps)
        if (step.type === "grammar_rule")
          cards.set(lesson.id, JSON.stringify(step.examples));
    for (const { lesson, step } of ramp) {
      const answer = String(step.answer);
      expect(
        cards.get(lesson)?.includes(answer),
        `${lesson}: ramp emits ${answer}, which its rule card never spells out (inv 37)`,
      ).toBe(true);
    }
  });

  it("every ramp BASE is a verb an earlier module actually taught (inv 37)", () => {
    // m14 shipped a ramp printing すむ, a verb taught in no module — invisible
    // to every debut guard because a GIVEN is not an introduction.
    const TAUGHT_BASES = new Set(["たべる", "のむ", "する"]);
    for (const lesson of M16_NEO_LESSONS)
      for (const step of lesson.steps)
        if (step.type === "conjugation_transform")
          expect(
            TAUGHT_BASES.has((step as unknown as { base: string }).base),
            `${lesson.id}: ramp base ${(step as unknown as { base: string }).base} is not a taught verb`,
          ).toBe(true);
  });

  it("な (never だ) in front of ので — the module's headline trap", () => {
    // The L3 antiPattern is exactly 「しずかだので」, so the wrong shape must
    // never reach a GRADED surface. antiPattern text and the rule prose are
    // excluded: naming the error out loud is the teaching.
    const DA_BEFORE_NODE = /だので/;
    const offenders: string[] = [];
    for (const lesson of M16_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        // A cloze OFFERS だので as a distractor by design — that is the drill.
        if (step.type === "particle_cloze") continue;
        const blob = JSON.stringify(
          step.type === "grammar_rule"
            ? { ...step, antiPattern: undefined, rule: undefined }
            : step,
        );
        if (DA_BEFORE_NODE.test(blob)) offenders.push(`${lesson.id}/${String(step.id)}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("から / ので / けど are their OWN build tiles, never fused with the clause", () => {
    // Tokenization is pedagogy here: 「たかいから かわない」 must build as
    // たかい / から / かわない so the tiles show that the connector is a
    // separate piece hanging on the end of a plain clause.
    const FUSED = [
      "たかいから", "さむいから", "たかいので", "さむいので", "たかいけど",
      "いそがしいから", "ゆきだから", "ゆきだけど", "しずかなので",
    ];
    const offenders: string[] = [];
    for (const lesson of M16_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const tiles = step.tiles as string[] | undefined;
        if (!Array.isArray(tiles)) continue;
        for (const t of tiles)
          if (FUSED.includes(t)) offenders.push(`${lesson.id}/${String(step.id)}: ${t}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no は/が particle_cloze anywhere (inv 5 + the は↔が non-contrast rule)", () => {
    // は is m3's and が is m4's, so a cloze on either is out of its
    // introduction window (inv 5) — and inv 35 records that swapping は and が
    // usually yields correct Japanese, so half the frames would mark a right
    // answer wrong. L2 drills the pair by PRODUCTION instead.
    const offenders: string[] = [];
    for (const lesson of M16_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        if (step.type !== "particle_cloze") continue;
        const answer = String(step.correctParticle ?? "");
        if (answer === "は" || answer === "が")
          offenders.push(`${lesson.id}/${String(step.id)}: ${answer}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("an imageable word's FIRST appearance anywhere is its word_image_mcq (inv 30/44)", () => {
    // The m14 defect this catches: a rule card names the word, rule cards are
    // PINNED first, and the picture debut is stolen. Checked over the RAW step
    // JSON — `rule:` prose, antiPattern and the lesson title copied onto every
    // card included — because that is what the learner actually sees.
    // さむい and やすみ carry stale old-course fromModule tags (m8 / m10), so
    // moduleBarGuards' requireImageFirst skips them; this is the check that
    // does not.
    const DEBUTS = ["さむい", "やすみ"];
    const firstType = new Map<string, string>();
    for (const lesson of M16_NEO_LESSONS)
      for (const step of lesson.steps) {
        const blob = JSON.stringify(step);
        for (const kana of DEBUTS)
          if (!firstType.has(kana) && blob.includes(kana))
            firstType.set(kana, `${step.type} (${lesson.id}/${step.id})`);
      }
    for (const kana of DEBUTS)
      expect(
        firstType.get(kana)?.split(" ")[0],
        `${kana} first appears on ${firstType.get(kana)}, not its word_image_mcq`,
      ).toBe("word_image_mcq");
  });

  it("months never route through に (the homograph trap)", () => {
    // にがつ / じゅうにがつ tokenize through に, and に the particle vs に the
    // numeral 2 is the documented mis-credit class. The module builds every
    // month from a number the learner owns + がつ and simply never uses those
    // two.
    const corpus = JSON.stringify(M16_NEO_LESSONS.map((l) => l.steps));
    expect(corpus.includes("にがつ"), "にがつ routes through the に homograph").toBe(false);
  });
});
