/**
 * m17-neo module guards. Same 2026-07-26 module shape as m12-m16
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m16 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
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

registerJaModuleContentLints("m17");

registerModuleBarGuards({
  moduleLabel: "m17-neo",
  lessons: M17_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16"],
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

describe("m17-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M17_NEO_LESSONS).toHaveLength(13);
    const reviews = M17_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M17_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M17_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M17_NEO_LESSONS[M17_NEO_LESSONS.length - 1].id).toBe("ja-m17-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M17_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M17_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M17_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m17-neo owes the spine's family + counter + demonstrative points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m17. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = [
    "family-register",
    "counter-sai",
    "counter-nin",
    "kono-sono-ano-dono",
  ];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches the five ⟳ points the module leans on", () => {
    // The module owes only FOUR ids across nine teaching lessons, and inv 42
    // forbids inventing new ones. So five earlier points are re-taught in new
    // positions, the same ⟳ move m14/m15/m16 made: の between two family
    // words (`no-possession`, m4), 「おとうとが いる」 as the way Japanese says
    // you HAVE a sibling (`ga-existence`, m6), the number stack that ages past
    // ten are built from (`numbers-11-99`, m11), the これ-vs-この contrast
    // lesson the new row needs (`kore-sore-are-dore`, m4) and the question
    // frames that make the vocabulary usable (`dare`, m4). No ledger row
    // moves: a re-teach is not a re-assignment.
    for (const p of [
      "no-possession",
      "ga-existence",
      "numbers-11-99",
      "kore-sore-are-dore",
      "dare",
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M17_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m17-neo pedagogy invariants", () => {
  const corpus = JSON.stringify(M17_NEO_LESSONS.map((l) => l.steps));

  it("ships ZERO そと (others'-side) family words — the spine's ruling", () => {
    // spinePlan n07: "YOUR-family terms only (はは/ちち/あに/あね…)", because
    // "the honorific others'-side words wait for Family II so learners never
    // hold two words for 'mother' at once". Family II is m21 (tile s19). The
    // authoring brief asked for both sets; the SPINE WINS. The addressing rule
    // ("you call your own mother おかあさん to her face") is still taught — in
    // the L1 rule card's PROSE, in ROMAJI, where it states the fact without
    // putting a そと word on a graded surface.
    for (const w of ["おとうさん", "おかあさん", "おにいさん", "おねえさん", "ごきょうだい"])
      expect(corpus.includes(w), `${w} is Family II vocabulary (m21), not m17`).toBe(false);
  });

  it("a うち word never describes SOMEONE ELSE's family", () => {
    // The one error this module exists to prevent. 「ミカの あね」 is exactly
    // the mistake the register rule forbids, and it is invisible to every
    // mechanical guard because the Japanese is well-formed.
    const UCHI = ["ちち", "はは", "あに", "あね", "おとうと", "いもうと", "きょうだい"];
    const NAMES = ["トム", "ミカ", "ケン", "たなか"];
    const offenders: string[] = [];
    for (const name of NAMES)
      for (const w of UCHI)
        if (corpus.includes(`${name}の ${w}`) || corpus.includes(`${name}の${w}`))
          offenders.push(`${name}の ${w}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships ZERO word_image_mcq steps, and that is the honest count (inv 44)", () => {
    // ちち / はは / あに / あね are already on the course's own
    // WORD_IMAGE_MCQ_BLOCKLIST; おとうと / いもうと / きょうだい / ひとり /
    // ふたり / はたち fail the same test for the same reason (👦 reads "boy",
    // not "MY YOUNGER brother"; 🧍 already belongs to からだ; 🔞 is an
    // age-restriction sign). Every new atom is therefore `imageable: false`
    // and debuts on its rule card or a build beat. Inv 44 is explicit that
    // word_image_mcq carries no usage floor.
    const imaged = M17_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "word_image_mcq",
    );
    expect(imaged.map((s) => s.id), "an image debut appeared where none is honest").toEqual([]);
  });

  it("never uses に as a NUMERAL, and never an age with a sound-change cell", () => {
    // に the particle vs に the numeral 2 is the documented homograph
    // mis-credit class, so twenty is はたち (which is the pedagogy anyway) and
    // two people is ふたり. 〜さい geminates on 1, 8 and 10 — issai, hassai,
    // jussai — and a ROUND TEN inherits it (sanjussai, gojussai), so those
    // ages never reach a tile: 「ごじゅうさい」 would install a reading nobody
    // uses. This caught three of them in the module's first draft.
    for (const bad of [
      "にさい", "にじゅうさい", "にじゅっさい",
      "いっさい", "いちさい", "はっさい", "はちさい",
      "じゅっさい", "じゅうさい",
    ])
      expect(corpus.includes(bad), `${bad} is a sound-change or homograph cell`).toBe(false);
  });

  it("この / その / あの / どの always carry a noun, never stand alone", () => {
    // The whole point of the row: an adnominal must attach. A tile bank or
    // target that ends on one (or follows it with a particle) is the error the
    // rule card's antiPattern names.
    const offenders: string[] = [];
    for (const lesson of M17_NEO_LESSONS)
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const target = String(step.targetSentence ?? step.audioText ?? step.transcript ?? "");
        if (!target) continue;
        for (const d of ["この", "その", "あの", "どの"])
          if (new RegExp(`${d}(は|が|を|に|で|の|も|$)`).test(target))
            offenders.push(`${lesson.id}/${String(step.id)}: ${target}`);
      }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no true particle_cloze anywhere — every cloze picks among CONTENT words", () => {
    // Inv 5 makes particle_cloze an INTRODUCTION device, and this module
    // introduces no particle, so it has no business clozing one. Every cloze
    // here is a word choice (ちち/はは/かぞく, さんにん/さん/さんじ,
    // どの/どれ/どこ), which is also why particleClozePlacement has nothing to
    // catch: it fires only when EVERY option is a particle.
    const PARTICLES = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    for (const lesson of M17_NEO_LESSONS)
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        if (step.type !== "particle_cloze") continue;
        const options = (step.options as string[] | undefined) ?? [];
        if (options.length && options.every((o) => PARTICLES.has(o)))
          offenders.push(`${lesson.id}/${String(step.id)}: [${options.join(" | ")}]`);
      }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("family words are their OWN build tiles, never fused with a particle", () => {
    // Tokenization is pedagogy here: 「ちちは かいしゃで はたらく」 must build
    // as ちち / は / かいしゃ / で / はたらく. はは is the risky one — it is
    // two は kana — so a 「ははは」 tile would hide the topic particle inside
    // the word.
    const FUSED = ["ちちは", "ははは", "あには", "あねは", "おとうとは", "いもうとは", "ちちの", "ははの", "あにの", "あねの"];
    const offenders: string[] = [];
    for (const lesson of M17_NEO_LESSONS)
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        const tiles = step.tiles as string[] | undefined;
        if (!Array.isArray(tiles)) continue;
        for (const t of tiles)
          if (FUSED.includes(t)) offenders.push(`${lesson.id}/${String(step.id)}: ${t}`);
      }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
