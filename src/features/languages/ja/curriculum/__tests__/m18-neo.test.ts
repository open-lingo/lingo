/**
 * m18-neo module guards. Same 2026-07-26 module shape as m12-m17
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m17 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { KANJI_ELIGIBLE_ATOMS } from "../../secondScript/applyKanjiSurfaces";
import { JA_COURSE_ATOMS_BY_KANA } from "../../courseAtoms";
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

registerJaModuleContentLints("m18");

registerModuleBarGuards({
  moduleLabel: "m18-neo",
  lessons: M18_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17"],
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

describe("m18-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M18_NEO_LESSONS).toHaveLength(13);
    const reviews = M18_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M18_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M18_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M18_NEO_LESSONS[M18_NEO_LESSONS.length - 1].id).toBe("ja-m18-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M18_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M18_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M18_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m18-neo owes the spine's quotation + kanji points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m18. Every one must be TAUGHT here —
   *  i.e. carried by a compiled `grammar_rule` card, not merely referenced. */
  const OWED = ["to-omoimasu", "to-quotation", "kanji-set-1"];

  it("teaches every owed grammar point on a rule card", () => {
    expect([...OWED].filter((p) => !taughtPoints.has(p))).toEqual([]);
  });

  it("re-teaches the six ⟳ points the module leans on", () => {
    // The row owes only THREE ids across nine teaching lessons, and inv 42
    // forbids inventing new ones. So six earlier points are re-taught in new
    // positions, the same ⟳ move m14-m17 made: the polite layer meeting the
    // quotation and losing (`masu-present`, m7), the negation asymmetry
    // between English and Japanese (`nai-form`, m6), だ surviving in front of
    // と (`desu-copula`, m3), the quote carrying its own tense (`ta-form`,
    // m11), に marking the person the words go TO (`ni-location`, m6) and
    // 「どう おもう？」 (`ka-question`, m3). No ledger row moves: a re-teach is
    // not a re-assignment.
    for (const p of [
      "masu-present",
      "nai-form",
      "desu-copula",
      "ta-form",
      "ni-location",
      "ka-question",
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M18_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m18-neo pedagogy invariants", () => {
  const steps = M18_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );
  const corpus = JSON.stringify(M18_NEO_LESSONS.map((l) => l.steps));

  it("no ます/です form is ever INSIDE a quotation (the module's central rule)", () => {
    // 「いきますと おもう」 is wrong Japanese, not merely stiff: politeness
    // lives on the FINAL verb only. The one legal polite surface in the whole
    // module is ききます, which is the OUTER verb of its sentence — so the
    // offence is a polite form followed by と, never a polite form as such.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      // antiPattern is a DELIBERATE wrong sentence (「たべますと おもう」) and
      // rule prose is mixed-script explanation — neither is a taught surface.
      for (const key of ["targetSentence", "audioText", "transcript", "target"]) {
        const s = rec[key];
        if (typeof s !== "string") continue;
        if (/(ます|ません|ました|です|でした)\s*と\s/.test(s))
          offenders.push(`${lessonId}/${String(rec.id)}: ${s}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("いった never means \"said\", and きた never means \"came\"", () => {
    // Both are REGISTERED atoms with other senses — いった is the past of いく
    // ("went") and きた is 北 ("north", m17). Using them for the past of いう
    // and くる would hand FSRS the wrong credit and teach a homograph the
    // course has never framed. Reported speech therefore stays non-past.
    const lines = M18_NEO_LESSONS.flatMap((l) =>
      l.steps.map((s) => JSON.stringify(s)),
    );
    for (const line of lines) {
      if (/いった/.test(line))
        expect(/\bsaid\b|\bsays\b/i.test(line), `いった glossed as "said": ${line.slice(0, 160)}`).toBe(false);
      if (/きた/.test(line))
        expect(/\bcame\b/i.test(line), `きた glossed as "came": ${line.slice(0, 160)}`).toBe(false);
    }
  });

  it("every kanji_reading step tests a TAUGHT word on an UNLOCKED surface", () => {
    // The ladder tests reading, not vocabulary: a kanji step is never a
    // word's first exposure, and it may not show a glyph the rollout has not
    // reached. `KANJI_ELIGIBLE_ATOMS` is the shipped schedule; m18 means the
    // unlock must be <= 18.
    const kanjiSteps = M18_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "kanji_reading",
    ) as unknown as { id: string; kanji: string; reading: string }[];
    expect(kanjiSteps.length, "the kanji-set-1 row owes reading practice").toBeGreaterThanOrEqual(6);
    const offenders: string[] = [];
    for (const s of kanjiSteps) {
      const atomId = JA_COURSE_ATOMS_BY_KANA.get(s.reading)?.id;
      const entry = atomId ? KANJI_ELIGIBLE_ATOMS.get(atomId) : undefined;
      if (!entry) offenders.push(`${s.id}: ${s.kanji} (${s.reading}) is not kanji-eligible`);
      else if (entry.unlockModule > 18)
        offenders.push(`${s.id}: ${s.kanji} unlocks at m${entry.unlockModule}, after m18`);
      else if (entry.kanji !== s.kanji)
        offenders.push(`${s.id}: authored ${s.kanji}, catalog says ${entry.kanji}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("a kanji_reading prompt renders BARE — never with its own answer above it", () => {
    // Inv 20 / the factory contract: promptAnnotation is the furigana-OFF
    // shape (surface === reading === the kanji), so the ruby renderer has
    // nothing to float and applyKanjiSurfaces refuses to re-annotate it.
    for (const [lessonId, step] of steps) {
      if (step.type !== "kanji_reading") continue;
      const s = step as unknown as {
        id: string;
        kanji: string;
        promptAnnotation: { surface: string; reading: string }[];
      };
      for (const seg of s.promptAnnotation)
        expect(seg.reading, `${lessonId}/${s.id} leaks its answer as furigana`).toBe(seg.surface);
    }
  });

  it("the kanji rule card never names a reading it goes on to test", () => {
    // Inv 20: putting a tested word's reading in prompt text defeats
    // kanji_reading. The card explains on-vs-kun with 一 precisely because 一
    // is not one of the tested glyphs.
    const card = M18_NEO_LESSONS.flatMap((l) => l.steps).find(
      (s) =>
        s.type === "grammar_rule" &&
        (s as { grammarPointId?: string }).grammarPointId === "kanji-set-1",
    ) as unknown as { rule: string } | undefined;
    expect(card, "kanji-set-1 rule card missing").toBeDefined();
    const tested = (
      M18_NEO_LESSONS.flatMap((l) => l.steps).filter(
        (s) => s.type === "kanji_reading",
      ) as unknown as { kanji: string }[]
    ).map((s) => s.kanji);
    for (const k of tested)
      expect(card!.rule.includes(k), `the card shows ${k}, a glyph it tests`).toBe(false);
  });

  it("no true particle_cloze anywhere — every cloze picks among CONTENT words", () => {
    // Inv 5 makes particle_cloze an INTRODUCTION device. m18 does introduce a
    // new FUNCTION of と, but the choice that teaches this module is
    // plain-vs-polite and dict-vs-past INSIDE the quote — a word choice. と
    // itself is drilled by production on every build in the module.
    const PARTICLES = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const options = ((step as unknown as Record<string, unknown>).options as string[] | undefined) ?? [];
      if (options.length && options.every((o) => PARTICLES.has(o)))
        offenders.push(`${lessonId}/${String(step.id)}: [${options.join(" | ")}]`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("the quotation と is its OWN build tile, never fused to the quoted verb", () => {
    // Tokenization is pedagogy here: 「あした いくと おもう」 must build as
    // あした / いく / と / おもう. A 「いくと」 tile would hide the particle the
    // whole module exists to teach — the same principle as inv 34.
    const FUSED = ["いくと", "くると", "たべると", "みると", "おもうと", "いうと", "だと", "こないと", "たべたと"];
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const tiles = (step as unknown as Record<string, unknown>).tiles as string[] | undefined;
      if (!Array.isArray(tiles)) continue;
      for (const t of tiles)
        if (FUSED.includes(t)) offenders.push(`${lessonId}/${String(step.id)}: ${t}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no Family II / untaught opinion vocabulary", () => {
    // The module's vocabulary is deliberately three words. Anything else an
    // author reaches for when writing opinions (よむ, にほんご, がっこう,
    // たぶん, でしょう) is either taught in no module or owned by a later one.
    for (const w of ["よむ", "にほんご", "がっこう", "たぶん", "でしょう", "おもいます", "いいます"])
      expect(corpus.includes(w), `${w} is not taught by m18 or any earlier module`).toBe(false);
  });
});
