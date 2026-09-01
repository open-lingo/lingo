/**
 * m29-neo module guards — REGISTER MASTERY + THE N5 CAPSTONE, the last module
 * of N5. Same 2026-07-26 module shape as m12-m28 (invariant 25): 10 teaching +
 * 3 review + 1 challenge (the tenth is `ja-m29-neo-14`, the 2026-08-26 F18
 * ender insert), reviews spread across thirds, challenge lesson LAST.
 *
 * Three things make this file different from m28's, and each has its own
 * describe block below:
 *
 *   1. **ALL-NEW SENTENCES, COURSE-WIDE.** `challengeNovelty.test.ts` forbids a
 *      challenge lesson re-running a sentence met twice elsewhere IN ITS OWN
 *      MODULE. The spine sets a higher bar for the capstone — "total concept
 *      coverage with all-new sentences" — so the guard here is course-wide and
 *      runs over COMPILED output, where the filler generator and the tile
 *      backfill can be seen.
 *   2. **REGISTER SCAFFOLDING IS LEGAL HERE.** m10 and m29 are the only two
 *      modules `registerScaffoldIsolation.test.ts` permits it in, so this file
 *      asserts the machinery is actually USED and that it FADES.
 *   3. **FAIL-ROUTING.** A failed capstone beat is supposed to route back to
 *      the module that owns the concept, and the input to that routing is the
 *      beat's grammar tags. The guard below proves every tag resolves to the
 *      shipped registry and that the module spans the whole N5 ladder. What it
 *      deliberately does NOT do is trust `n5-grammar-points.json`'s `module`
 *      field as the routing TARGET — see the block comment there.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent, getAvailableMockLessonIds } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS_BY_KANA } from "../../courseAtoms";
import { VERB_ENTRIES, ADJ_ENTRIES } from "../../conjugationTables";
import { conjugateVerb } from "../../conjugationEngine";
import { KANJI_ELIGIBLE_ATOMS } from "../../secondScript/applyKanjiSurfaces";
import { FURIGANA_WINDOW } from "../../secondScript/kanjiRollout";
import { REGISTER_AUDIENCES } from "../../registerAudiences";
import N5_GRAMMAR_POINTS from "@/features/lesson/data/n5-grammar-points.json";
import m29Ir from "../ir/m29.ir.json";
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

registerJaModuleContentLints("m29");

registerModuleBarGuards({
  moduleLabel: "m29-neo",
  lessons: M29_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25", "m26", "m27", "m28"],
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
  ],
  // Same reason m28 needed this: the module's own atoms (よ / ね /
  // じゃないです / じゃありません) and m11-m28's 90+ IR-only inflections exist in
  // neither `courseAtoms` nor the conjugation engine's real-form lexicon, so
  // without them the bar guards' tokenizer cannot see the module's headline
  // vocabulary at all. Declaring them makes them TOKENS, which is what
  // subjects them to the debut check — the opposite of a loosening.
  extraVocab: [
    ...(m29Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m29Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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

describe("m29-neo module shape (invariant 25)", () => {
  // 14 since 2026-08-26: the F18 freq-gap insert `ja-m29-neo-14` (the
  // remaining CEJC enders じゃん・っけ・さ・わ) is the tenth teaching lesson,
  // slotted between L11 and review-3. Challenge still LAST.
  it("ships 14 lessons: 10 teaching + 3 review + 1 challenge", () => {
    expect(M29_NEO_LESSONS).toHaveLength(14);
    const reviews = M29_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M29_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M29_NEO_LESSONS.length - reviews.length - challenge.length).toBe(10);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M29_NEO_LESSONS[M29_NEO_LESSONS.length - 1].id).toBe("ja-m29-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M29_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const lesson of M29_NEO_LESSONS)
      expect(getMockLessonContent(lesson.id), `${lesson.id} not registered`).toBeTruthy();
  });
});

// ── the ledger row + the registry ─────────────────────────────────────────
const taughtPoints = new Set(
  M29_NEO_LESSONS.flatMap((l) =>
    l.steps
      .filter((s) => s.type === "grammar_rule")
      .map((s) => (s as unknown as { grammarPointId?: string }).grammarPointId ?? ""),
  ).filter(Boolean),
);

describe("m29-neo owes the spine's register row", () => {
  /** RUN-PLAN-n4 coverage ledger, row m29 — THREE ids, each TAUGHT here
   *  (carried by a compiled `grammar_rule` card, not merely referenced by an
   *  `exercises:` tag). This is the last row in the ledger: N5 complete. */
  it("teaches `janai-desu`, `yo-emphasis` and `ne-agreement`, the whole ledger row", () => {
    for (const p of ["janai-desu", "yo-emphasis", "ne-agreement"])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("re-teaches the six register TWINS the other teaching lessons need", () => {
    // The row owes THREE ids across nine teaching lessons. Rather than invent
    // IR-local ids, every remaining card is a REGISTRY point re-taught as the
    // register PAIR of something the learner already owns — the m16/m20/m26/
    // m27/m28 move. A re-teach is not a re-assignment: no ledger row moves.
    for (const p of [
      "register-audience",  // m7  — the switch itself, dict↔ます and だ↔です
      "masu-negative",      // m7  — the negative, ない↔ません
      "masu-past",          // m10 — the past, た↔ました and だった↔でした
      "n-desu",             // m26 — the explanation, んだ↔んです
      "masenka",            // m23 — the invitation, 〜ない？↔〜ませんか
      "chotto-softener",    // m10 — the refusal, which is not a negative at all
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("invents ZERO grammar-point ids — every card resolves to the N5 registry", () => {
    // Inv 42, asserted against the SHIPPED registry rather than a hand-copied
    // list, with a non-vacuity floor: an empty or failed import would make
    // every id "known" and the check would pass for the wrong reason.
    const registry = new Set((N5_GRAMMAR_POINTS as { id: string }[]).map((p) => p.id));
    expect(registry.size, "the grammar-point registry failed to load").toBeGreaterThan(100);
    const unknown = [...taughtPoints].filter((p) => !registry.has(p));
    // 10 since m29-neo-14: the insert's second janai-desu card (variant jan)
    // shares its id with L1's, and its ka-question card adds the tenth id.
    expect(taughtPoints.size, "no rule cards found").toBe(10);
    expect(unknown, unknown.join(", ")).toEqual([]);
  });
});

// ── FAIL-ROUTING: the input, and the honest limit ─────────────────────────
describe("m29-neo is a capstone: coverage, and routing input that resolves", () => {
  const exercised = new Map<string, string[]>();
  for (const lesson of M29_NEO_LESSONS)
    for (const step of lesson.steps as unknown as Record<string, unknown>[])
      for (const p of (step.exercisedGrammar as string[] | undefined) ?? []) {
        if (!exercised.has(p)) exercised.set(p, []);
        exercised.get(p)!.push(`${lesson.id}/${String(step.id)}`);
      }

  it("every exercised grammar tag resolves to the shipped registry", () => {
    // The tag IS the fail-routing input: a failed beat names its grammar
    // points, and a router looks them up. A tag that resolves to nothing is a
    // beat that can never be routed anywhere, which is the silent version of
    // having no routing at all.
    const registry = new Set((N5_GRAMMAR_POINTS as { id: string }[]).map((p) => p.id));
    expect(registry.size, "the grammar-point registry failed to load").toBeGreaterThan(100);
    const unknown = [...exercised.keys()].filter((p) => !registry.has(p));
    expect(unknown, unknown.map((u) => `${u} (${exercised.get(u)![0]})`).join("\n")).toEqual([]);
  });

  it("spans the whole N5 ladder — total concept coverage, not one module's worth", () => {
    // Inv 25 puts cumulative review out of the AUTHOR's hands (review lessons
    // drill THIS module only), so a capstone's coverage has to live in the
    // sentences. This is the measurement of that: how many distinct N5 points
    // the module actually exercises, and how far back they reach.
    const registry = new Map(
      (N5_GRAMMAR_POINTS as { id: string; module: string }[]).map((p) => [p.id, p.module]),
    );
    const owners = new Set([...exercised.keys()].map((p) => registry.get(p)).filter(Boolean));
    expect(
      exercised.size,
      `only ${exercised.size} distinct grammar points exercised — a capstone that ` +
        "covers one module's worth of grammar is a teaching lesson",
    ).toBeGreaterThanOrEqual(45);
    expect(
      owners.size,
      `points reach back to only ${owners.size} modules — see the FAIL-ROUTING note`,
    ).toBeGreaterThanOrEqual(15);
  });

  it("does NOT claim the registry's `module` field is a usable routing target", () => {
    // THE FINDING, kept in the codebase rather than only in a report. The
    // registry looks like it carries the routing target — `module` on every
    // point — but the field is ARCHIVED-course attribution, the same staleness
    // `courseAtoms.fromModule` has. Measured here rather than asserted: of the
    // registry ids that some IR module actually teaches, most DISAGREE with
    // the `module` field. `n-desu` says m26 and is taught in m27; `masenka`
    // says m23 and is taught in m24; `masu-past` says m10 and is taught in
    // m11. Routing a failed capstone beat through it would send the learner to
    // the wrong module far more often than not.
    //
    // The test pins the DISAGREEMENT so that fixing the registry breaks this
    // test loudly and on purpose, rather than the course silently acquiring
    // routing it never verified.
    const registry = new Map(
      (N5_GRAMMAR_POINTS as { id: string; module: string }[]).map((p) => [p.id, p.module]),
    );
    // Three of m29's own cards, each taught HERE and each pointing elsewhere.
    expect(registry.get("janai-desu")).toBe("m3");
    expect(registry.get("yo-emphasis")).toBe("m9");
    expect(registry.get("ne-agreement")).toBe("m9");
    expect(taughtPoints.has("janai-desu")).toBe(true);
    // And the field the concept-type guide names as the OTHER routing input
    // does not exist on a single entry.
    const withConceptType = (N5_GRAMMAR_POINTS as Record<string, unknown>[]).filter(
      (p) => p.conceptType !== undefined,
    );
    expect(withConceptType.length, "conceptType now exists — update the report").toBe(0);
  });
});

// ── register scaffolding: used here, and it fades ─────────────────────────
describe("m29-neo uses the register ladder, and the ladder fades", () => {
  type RegisterBeat = {
    kind: string;
    stage: number;
    audience: string;
    answer: string;
    options: string[];
    frame?: { before: string; after?: string };
    cheatSheet?: Record<string, string>;
  };
  const beats = (m29Ir as unknown as { lessons: { id: string; beats: RegisterBeat[] }[] }).lessons
    .flatMap((l) => l.beats.map((b) => [l.id, b] as const))
    .filter(([, b]) => b.kind === "register");

  it("actually uses the machinery it is one of two modules allowed to use", () => {
    // m28's mirror-image guard asserts NO scaffolding; this one asserts there
    // IS some, because a permission nobody exercises is dead code and the
    // isolation test would pass on an empty module.
    expect(beats.length, "m29 authors no register beats at all").toBeGreaterThanOrEqual(6);
    const steps = M29_NEO_LESSONS.flatMap((l) => l.steps as unknown as Record<string, unknown>[]);
    expect(steps.filter((s) => s.audienceEmoji !== undefined).length).toBeGreaterThan(0);
    expect(steps.filter((s) => s.referenceTable !== undefined).length).toBe(1);
  });

  it("fades 1 → 2 → 3 inside the module: sheet, then picture, then nothing", () => {
    const stagesOf = (answer: string) =>
      beats.filter(([, b]) => b.answer === answer).map(([, b]) => b.stage);
    // じゃないです is the word the ladder is built around: it gets the one
    // stage-1 cheat sheet this course will ever spend on it, then the picture
    // alone, then a bare Japanese vocative frame.
    expect(stagesOf("じゃないです")).toEqual([1, 2, 3]);
    // No word ever regresses inside the module (the course-wide version of
    // this lives in registerScaffoldIsolation.test.ts).
    const seen = new Map<string, number>();
    const regressions: string[] = [];
    for (const [lid, b] of beats) {
      const high = seen.get(b.answer) ?? 0;
      if (b.stage < high) regressions.push(`${lid}: ${b.answer} ${high} → ${b.stage}`);
      seen.set(b.answer, Math.max(high, b.stage));
    }
    expect(regressions, regressions.join("\n")).toEqual([]);
  });

  it("fades ACROSS modules too — m10's words come back with no scaffolding", () => {
    // The property the ladder exists for. m10 left うん at stage 2 (picture +
    // meter); m29 runs it at stage 3, where there is no picture and no meter
    // and the audience is named in Japanese by the frame.
    const carried = beats.filter(([, b]) => ["うん", "はい", "ええ", "ううん", "いいえ"].includes(b.answer));
    expect(carried.length, "no m10 register word is re-run here").toBeGreaterThan(0);
    for (const [lid, b] of carried) {
      expect(b.stage, `${lid}: ${b.answer} should come back at stage 3, not ${b.stage}`).toBe(3);
      expect(b.frame, `${lid}: ${b.answer} stage 3 needs a vocative frame`).toBeTruthy();
    }
  });

  it("every stage-3 frame is readable — role label and body are taught words", () => {
    // A stage-3 beat has NO picture, so the frame IS the cue. A frame written
    // with a word the learner has never met (てんいん, おばあさん) is a cue that
    // cannot be read, which is worse than no cue at all.
    const known = new Set([
      ...(m29Ir as unknown as { priorVocab: string[] }).priorVocab,
      ...(m29Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ]);
    const problems: string[] = [];
    let checked = 0;
    for (const [lid, b] of beats) {
      if (b.stage !== 3) continue;
      checked++;
      const label = (b.frame?.before ?? "").split("：")[0].trim();
      if (label && !known.has(label))
        problems.push(`${lid}: frame speaker 「${label}」 is not taught vocabulary`);
    }
    expect(checked, "no stage-3 beats found — the ladder never reached the top").toBeGreaterThan(2);
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("names only audiences the roster classifies", () => {
    const bad = beats.filter(([, b]) => !REGISTER_AUDIENCES[b.audience]).map(([, b]) => b.audience);
    expect(bad).toEqual([]);
  });
});

// ── tokenization, provenance and the enders ───────────────────────────────
describe("m29-neo pedagogy invariants", () => {
  const steps = M29_NEO_LESSONS.flatMap((l) => l.steps.map((s) => [l.id, s] as const));

  /**
   * RULE ZERO — never substring-match Japanese. This module is entirely an
   * ADJACENCY question: what sits in FRONT of よ and ね (a FINISHED sentence,
   * and they are always last), and what sits in front of じゃない (a noun, and
   * never an い-adjective). None of that can be asked of a substring, and
   * 「およぐ」 contains 「よ」 while 「ねこ」 contains 「ね」.
   *
   * So this file tokenizes for real: longest-match over the same vocabulary
   * `moduleCompiler.makeTokenizer` uses. The first test proves the two agree
   * by checking every compiled build tile bank against it.
   */
  const PARTICLES = ["は", "が", "を", "に", "で", "と", "の", "も", "へ", "から", "まで", "か"];
  const NAMES = ["トム", "ミカ", "ケン", "たなか", "タナカ"];
  const INTERJ = ["うん", "ううん", "そう", "ええ", "はい", "いいえ"];
  const MASU_STEMS = new Set<string>();
  const KU_STEMS = new Set<string>();
  for (const v of VERB_ENTRIES) {
    const masu = conjugateVerb(v.dictionary, v.group, "masu");
    if (masu.endsWith("ます")) MASU_STEMS.add(masu.slice(0, -2));
  }
  for (const adj of ADJ_ENTRIES) {
    if (adj.type !== "i-adj") continue;
    if (adj.dictionary === "いい") KU_STEMS.add("よく");
    else if (adj.dictionary.endsWith("い")) KU_STEMS.add(`${adj.dictionary.slice(0, -1)}く`);
  }
  MASU_STEMS.delete("");
  KU_STEMS.delete("");
  const IR = m29Ir as unknown as {
    newAtoms: { kana: string }[];
    priorAtoms?: { kana: string }[];
    priorVocab: string[];
    lessons: { id: string; reviewPool?: string[]; beats: { kind: string; options?: string[] }[] }[];
  };
  const NEW_KANA = IR.newAtoms.map((a) => a.kana);
  const PRIOR_KANA = (IR.priorAtoms ?? []).map((a) => a.kana);
  const VOCAB = [
    ...new Set([
      ...JA_COURSE_ATOMS_BY_KANA.keys(),
      ...NEW_KANA,
      ...PRIOR_KANA,
      ...PARTICLES,
      ...NAMES,
      ...INTERJ,
      ...MASU_STEMS,
      ...KU_STEMS,
    ]),
  ].sort((a, b) => b.length - a.length);
  const tok = (ja: string): string[] => {
    const out: string[] = [];
    for (const chunk of ja.replace(/[。、？！：「」]/g, " ").split(/[\s　]+/).filter(Boolean)) {
      let i = 0;
      while (i < chunk.length) {
        const hit = VOCAB.find((t) => chunk.startsWith(t, i));
        if (hit) {
          out.push(hit);
          i += hit.length;
        } else {
          let j = i + 1;
          while (j < chunk.length && !VOCAB.some((t) => chunk.startsWith(t, j))) j++;
          out.push(chunk.slice(i, j));
          i = j;
        }
      }
    }
    return out;
  };
  const bare = (t: string) => t.replace(/[。？！]/g, "");

  const surfaces: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({
        where: `${lessonId}/${String((step as { id: string }).id)}`,
        ja,
        type: step.type,
      });

  it("this file's tokenizer reproduces the compiler's own build tiles", () => {
    // NON-VACUITY + CORRECTNESS ANCHOR. Every guard below reads `tok()`; if it
    // segmented differently from the compiler the guards would be measuring a
    // sentence the learner never sees. `correctOrder` IS the compiler's
    // tokenization, so comparing the two on every build is a direct proof.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string;
        targetSentence?: string;
        correctOrder?: string[];
        id: string;
        picker?: boolean;
      };
      if (rec.type !== "build_sentence" && rec.type !== "listening_build") continue;
      if (rec.picker) continue; // register pickers are whole-utterance choices, not tokenized
      if (!rec.targetSentence || !rec.correctOrder) continue;
      checked++;
      const mine = tok(rec.targetSentence).join("·");
      const theirs = rec.correctOrder.map(bare).join("·");
      if (mine !== theirs)
        offenders.push(`${lessonId}/${rec.id}: mine [${mine}] vs compiler [${theirs}]`);
    }
    expect(checked, "no build steps to anchor against").toBeGreaterThan(60);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every token is vocabulary the learner has actually been TAUGHT", () => {
    // STRONGER than m28's "resolves to an atom". `courseAtoms` contains 480+
    // rows, most of them tagged to the ARCHIVED course and taught by no neo
    // module — そば, つめたい, くらい and よこ all resolve to an atom and none of
    // them has ever been on screen. `priorVocab` is what earlier modules
    // actually taught (compile-ir builds it), so that is the set checked here.
    // This caught eleven words and two silent mis-splits while m29 was being
    // written: 「つよかった」 tiled as つ + よかった (crediting m12's よかった) and
    // 「かいませんよ」 as かい + ま + せん + よ (crediting せん, "thousand").
    const taught = new Set([
      ...IR.priorVocab,
      ...NEW_KANA,
      ...PARTICLES,
      ...NAMES,
      ...INTERJ,
      ...MASU_STEMS,
      ...KU_STEMS,
      "だ",
      "です",
    ]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces)
      for (const t of tok(ja)) {
        scanned++;
        const b = bare(t);
        if (!b || taught.has(b)) continue;
        // Single non-kana glyphs are punctuation the frames carry.
        if (b.length === 1 && !/[ぁ-んァ-ン]/.test(b)) continue;
        offenders.push(`${where}: 「${b}」 was taught by no earlier module — ${ja}`);
      }
    expect(scanned, "no tokens scanned — the projection moved").toBeGreaterThan(4000);
    expect(offenders, offenders.slice(0, 20).join("\n")).toEqual([]);
  });

  it("よ and ね are ALWAYS the last token of their clause — never mid-sentence", () => {
    // The module's structural claim, and the one thing its antiPatterns are
    // about (「ゆきよが ふる」, 「きれいねだ」). A substring check cannot ask it:
    // およぐ contains よ and ねこ contains ね, so it is asked of TOKENS.
    const offenders: string[] = [];
    let enders = 0;
    for (const { where, ja } of surfaces) {
      // Clause-by-clause: a two-sentence beat legitimately has よ in the middle
      // of the STRING and at the end of its own sentence.
      for (const clause of ja.split(/[。？！]/)) {
        const t = tok(clause).map(bare).filter(Boolean);
        for (let i = 0; i < t.length; i++) {
          if (t[i] !== "よ" && t[i] !== "ね") continue;
          enders++;
          if (i !== t.length - 1)
            offenders.push(`${where}: 「${t[i]}」 at position ${i} of [${t.join("·")}] — ${ja}`);
        }
      }
    }
    expect(enders, "no よ/ね token examined — the projection moved").toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("じゃない and its polite skins follow a NOUN or な-adjective, never an い-adjective", () => {
    // The rule card's own warning: an い-adjective goes negative on its own
    // (たかくない), and 「たかいじゃない」 is not a sentence. Checked over tokens.
    const NEGATIVE_COPULAS = ["じゃない", "じゃないです", "じゃありません", "じゃなかった"];
    const offenders: string[] = [];
    let checked = 0;
    for (const { where, ja } of surfaces) {
      const t = tok(ja).map(bare);
      for (let i = 1; i < t.length; i++) {
        if (!NEGATIVE_COPULAS.includes(t[i])) continue;
        checked++;
        const prev = t[i - 1];
        const atom = JA_COURSE_ATOMS_BY_KANA.get(prev);
        // An い-adjective ends in い and is in the adjective table as one.
        const isIAdj = ADJ_ENTRIES.some((a) => a.type === "i-adj" && a.dictionary === prev);
        if (isIAdj)
          offenders.push(`${where}: 「${prev}${t[i]}」 stacks the noun negative on an い-adjective — ${ja}`);
        if (!atom && !NEW_KANA.includes(prev) && !PRIOR_KANA.includes(prev) && prev !== "の")
          offenders.push(`${where}: 「${prev}」 in front of ${t[i]} resolves to nothing — ${ja}`);
      }
    }
    expect(checked, "no negative copula examined").toBeGreaterThan(30);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no bound ender is ever a bare word-level production target", () => {
    // よ / ね are in `moduleCompiler.BOUND` and in `BOUND_ENDERS`, added WITH
    // the module. This is the module-local half: the filler generator draws
    // production targets from the review pool, so the pools are checked too.
    const BOUND_HERE = ["よ", "ね"];
    const offenders: string[] = [];
    let scanned = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { type: string; targetPhrase?: string; acceptedAnswers?: string[]; id: string };
      const targets =
        rec.type === "speaking"
          ? rec.targetPhrase
            ? [rec.targetPhrase]
            : []
          : rec.type === "translate"
            ? (rec.acceptedAnswers ?? [])
            : [];
      for (const t of targets) {
        scanned++;
        if (BOUND_HERE.includes(t.replace(/[。、？！\s　]/g, "")))
          offenders.push(`${lessonId}/${rec.id}: 「${t}」 is a bound ender`);
      }
    }
    expect(scanned, "no production targets scanned — the field names moved").toBeGreaterThan(20);
    expect(offenders, offenders.join("\n")).toEqual([]);
    for (const lesson of IR.lessons)
      for (const kana of lesson.reviewPool ?? [])
        expect(BOUND_HERE, `${lesson.id} pool carries a bound ender`).not.toContain(kana);
  });

  it("「なんですか」 appears nowhere (it tokenizes as なんです · か)", () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces) {
      scanned++;
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length - 1; i++)
        if (t[i] === "なんです" && t[i + 1] === "か")
          offenders.push(`${where}: 「なんですか」 — ${ja}`);
    }
    expect(scanned, "no surfaces scanned").toBeGreaterThan(500);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every carrier flagged over-exposed by the 2026-07-27 audit is absent", () => {
    // Inv 27, run against a FRESH `node scripts/exposure-audit.mjs` rather
    // than a copied list: the audit flags 76 words above the bar, so "avoid
    // the worst nine" is no longer the whole job. These are the worst of them
    // plus the ones m26/m27/m28 added, and a capstone leaning on the course's
    // most over-used nouns would be a poor last impression.
    const BANNED = [
      "みせ", "ともだち", "ほん", "ごはん", "いる", "きのう", "あたらしい", "えき", "かばん",
      "ください", "ちゃ", "かった", "うみ", "みず", "きょう", "あした", "じゅぎょう", "やま",
      "えいが", "でんしゃ", "きっさてん", "しずか", "じてんしゃ",
    ];
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces) {
      const t = new Set(tok(ja).map(bare));
      scanned += t.size;
      for (const b of BANNED)
        if (t.has(b)) offenders.push(`${where}: over-exposed carrier 「${b}」 — ${ja}`);
    }
    expect(scanned, "no tokens scanned").toBeGreaterThan(2000);
    // ともだち survives in exactly one place and it is not a carrier: it is the
    // ROLE LABEL the register roster uses for the friend audience, which is the
    // whole point of a role label (registerAudiences.ts).
    const notFrames = offenders.filter((o) => !o.includes("ともだち"));
    expect(notFrames, notFrames.join("\n")).toEqual([]);
  });

  it("every register cue is graded — the other register is never accepted", () => {
    // Inv 48, restated module-locally so a change to this module's content
    // fails here as well as in the course-wide guard. A cued prompt whose
    // accepted set contains the other register is the m7 defect.
    const POLITE = /(です|ます|ません|ました|ましょう|ください|でした)(か)?(よ|ね)?[。？！]?\s*$/;
    const isPolite = (ja: string) => {
      const clauses = ja.split(/[。？！]/).filter((c) => c.trim());
      return POLITE.test((clauses.at(-1) ?? ja).trim());
    };
    const violations: string[] = [];
    let cued = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const prompt = String(rec.promptEn ?? rec.sourceText ?? rec.prompt ?? "");
      const wantsPolite = /say politely/i.test(prompt);
      const wantsPlain = /say to a friend/i.test(prompt);
      if (!wantsPolite && !wantsPlain) continue;
      cued++;
      for (const a of (rec.acceptedAnswers as string[] | undefined) ?? []) {
        const politeAnswer = isPolite(a);
        if ((wantsPolite && !politeAnswer) || (wantsPlain && politeAnswer))
          violations.push(`${lessonId}/${String(rec.id)}: "${prompt}" accepts 「${a}」`);
      }
    }
    expect(cued, "no register-cued step found — this module is ABOUT register cues").toBeGreaterThan(40);
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("particle clozes only ever pick a particle this module INTRODUCES (inv 5)", () => {
    // Inv 5 pins particle_cloze as an INTRODUCTION device. m29 introduces
    // exactly two particles — よ and ね — so a cloze choosing between them is
    // the introduction use the invariant allows. Every other cloze here picks
    // among CONTENT words or predicate FORMS, which is what m28 did.
    const CASE_PARTICLES = ["は", "が", "を", "に", "で", "と", "の", "も", "へ", "から", "まで", "か", "や", "より"];
    const offenders: string[] = [];
    let clozes = 0;
    for (const lesson of IR.lessons)
      for (const beat of lesson.beats) {
        if (beat.kind !== "particle-cloze") continue;
        clozes++;
        for (const opt of beat.options ?? [])
          if (CASE_PARTICLES.includes(opt))
            offenders.push(`${lesson.id}: cloze offers the case particle 「${opt}」`);
      }
    expect(clozes, "no clozes found — the beat shape moved").toBeGreaterThan(8);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

// ── ALL-NEW SENTENCES, COURSE-WIDE ────────────────────────────────────────
describe("m29-neo is the capstone: every sentence is new to the course", () => {
  const norm = (s: string) => s.replace(/[。、？！\s　]/g, "");
  /** What the learner is asked to PRODUCE or HEAR. `speaking` keeps its answer
   *  in `targetPhrase`, `translate` in `acceptedAnswers` (an ARRAY), builds in
   *  `correctOrder`, listening in `transcript`. There is no `targetSentence`
   *  on the first two, and a scan that reads the wrong field compares
   *  `undefined` every time and reports a clean course. */
  const learnerJa = (step: unknown): string[] => {
    const s = step as {
      targetPhrase?: string;
      acceptedAnswers?: string[];
      correctOrder?: string[];
      transcript?: string;
      picker?: boolean;
    };
    const out: string[] = [];
    if (typeof s.targetPhrase === "string") out.push(s.targetPhrase);
    if (Array.isArray(s.acceptedAnswers)) out.push(...s.acceptedAnswers);
    if (Array.isArray(s.correctOrder) && !s.picker) out.push(s.correctOrder.join(""));
    if (typeof s.transcript === "string") out.push(s.transcript);
    return out;
  };

  it("no m29 sentence reproduces one from an earlier NEO module", () => {
    // The spine's bar, which is HIGHER than challengeNovelty's: that guard
    // forbids a challenge lesson re-running a sentence met twice in its own
    // module; this forbids m29 re-running any sentence from anywhere in the
    // live course. Run over COMPILED output, because the filler generator
    // re-presents authored sentences and the tile backfill writes tiles the IR
    // never wrote — a guard over authored surfaces cannot see either.
    const prior = new Map<string, string>();
    let scannedPrior = 0;
    for (const id of getAvailableMockLessonIds()) {
      const m = id.match(/^ja-m(\d+)-neo-/);
      if (!m || Number(m[1]) >= 29) continue;
      const lesson = getMockLessonContent(id);
      if (!lesson) continue;
      for (const step of lesson.steps)
        for (const ja of learnerJa(step)) {
          const k = norm(ja);
          if (k.length < 8) continue;
          scannedPrior++;
          if (!prior.has(k)) prior.set(k, id);
        }
    }
    let scannedMine = 0;
    const collisions: string[] = [];
    for (const lesson of M29_NEO_LESSONS)
      for (const step of lesson.steps)
        for (const ja of learnerJa(step)) {
          const k = norm(ja);
          if (k.length < 8) continue;
          scannedMine++;
          const where = prior.get(k);
          if (where) collisions.push(`${lesson.id}/${step.id}: 「${ja}」 already in ${where}`);
        }
    // Non-vacuity on BOTH sides. A scan that stops seeing the prior course
    // looks exactly like a capstone full of new sentences.
    expect(scannedPrior, "no prior-module sentences scanned — the field names moved").toBeGreaterThan(2000);
    expect(scannedMine, "no m29 sentences scanned — the field names moved").toBeGreaterThan(150);
    expect(collisions, [...new Set(collisions)].join("\n")).toEqual([]);
  });
});

// ── the reading ladder, re-tested cold ────────────────────────────────────
describe("m29-neo re-tests the kanji ladder without declaring a new set", () => {
  const kanjiSteps = M29_NEO_LESSONS.flatMap((l) =>
    l.steps.filter((s) => s.type === "kanji_reading").map((s) => [l.id, s] as const),
  );

  it("re-tests four glyphs, and none of them is m28's set-3", () => {
    expect(kanjiSteps.length, "no kanji_reading steps").toBeGreaterThanOrEqual(4);
    const SET_3 = ["かいしゃ", "じかん", "でんわ", "はなす", "がっこう", "せんせい", "てんき", "がいこく"];
    const tested = (m29Ir as unknown as { lessons: { beats: { kind: string; kana?: string }[] }[] }).lessons
      .flatMap((l) => l.beats)
      .filter((b) => b.kind === "kanji")
      .map((b) => b.kana as string);
    expect(tested.length).toBeGreaterThanOrEqual(4);
    const overlap = tested.filter((k) => SET_3.includes(k));
    expect(overlap, `re-asks m28's own set: ${overlap.join(", ")}`).toEqual([]);
  });

  it("every glyph is past its furigana window at m29, so it reads COLD", () => {
    const problems: string[] = [];
    let checked = 0;
    for (const [, atomId] of [...KANJI_ELIGIBLE_ATOMS.keys()].entries()) void atomId;
    const byKana = new Map<string, number>();
    for (const [atomId, entry] of KANJI_ELIGIBLE_ATOMS) {
      const atom = [...JA_COURSE_ATOMS_BY_KANA.values()].find((a) => a.id === atomId);
      if (atom) byKana.set(atom.kana, entry.unlockModule);
    }
    const tested = (m29Ir as unknown as { lessons: { beats: { kind: string; kana?: string }[] }[] }).lessons
      .flatMap((l) => l.beats)
      .filter((b) => b.kind === "kanji")
      .map((b) => b.kana as string);
    for (const kana of tested) {
      const unlock = byKana.get(kana);
      checked++;
      if (unlock === undefined) {
        problems.push(`${kana}: not in the rollout catalog`);
        continue;
      }
      if (29 < unlock + FURIGANA_WINDOW)
        problems.push(`${kana}: unlocks at m${unlock}, still inside its +${FURIGANA_WINDOW} window at m29`);
    }
    expect(checked, "no kanji beats examined").toBeGreaterThanOrEqual(4);
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("shows the tested kanji BARE and offers four distinct kana readings", () => {
    for (const [lid, step] of kanjiSteps) {
      const rec = step as unknown as { id: string; options?: { text: string }[] };
      expect(rec.options, `${lid}/${rec.id} has no options`).toBeTruthy();
      const texts = (rec.options ?? []).map((o) => o.text);
      expect(texts.length, `${lid}/${rec.id}`).toBe(4);
      expect(new Set(texts).size, `${lid}/${rec.id} repeats a reading`).toBe(4);
    }
  });
});
