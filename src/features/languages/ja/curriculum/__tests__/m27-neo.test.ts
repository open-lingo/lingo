/**
 * m27-neo module guards. Same 2026-07-26 module shape as m12-m26
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m26 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS_BY_KANA } from "../../courseAtoms";
import { VERB_ENTRIES, ADJ_ENTRIES } from "../../conjugationTables";
import { conjugateVerb } from "../../conjugationEngine";
import N5_GRAMMAR_POINTS from "@/features/lesson/data/n5-grammar-points.json";
import m27Ir from "../ir/m27.ir.json";
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

registerJaModuleContentLints("m27");

registerModuleBarGuards({
  moduleLabel: "m27-neo",
  lessons: M27_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25", "m26"],
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
  ],
  // The 〜すぎる family exists in neither `courseAtoms` nor the conjugation
  // engine's real-form lexicon (there is no `sugiru` cell), so without this
  // the bar guards' own tokenizer could not see the module's headline
  // vocabulary: 「たべすぎたんだ」 came out as たべ + the unknown fragment
  // 「すぎたん」. Declaring them makes them TOKENS, which is what subjects them
  // to the debut check below — the opposite of a loosening.
  extraVocab: (m27Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map(
    (a) => a.kana,
  ),
  canon: COURSE_CANON,
  minLessons: 12,
  maxLessons: 15,
  requireChallengeLast: true,
  requireReviewCount: 3,
  requireChallengeStep: true,
  requireTeachFirst: true,
  requireImageFirst: true,
});

describe("m27-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M27_NEO_LESSONS).toHaveLength(13);
    const reviews = M27_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M27_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M27_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M27_NEO_LESSONS[M27_NEO_LESSONS.length - 1].id).toBe("ja-m27-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M27_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("carries NO kanji_reading steps (kanji-set-3 is m28's ledger row)", () => {
    const kanji = M27_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "kanji_reading",
    );
    expect(kanji).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M27_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M27_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m27-neo owes the spine's three explaining points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m27 — THREE ids, and each must be
   *  TAUGHT here (carried by a compiled `grammar_rule` card, not merely
   *  referenced by an `exercises:` tag). */
  it("teaches `n-desu`, `sugiru` and `ku-ni-naru`, the whole ledger row", () => {
    for (const p of ["n-desu", "sugiru", "ku-ni-naru"])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("re-teaches the six points the nine teaching lessons need", () => {
    // The row owes THREE ids across nine teaching lessons. Rather than invent
    // IR-local ids (m24 needed four, m25 six), every remaining card is a
    // REGISTRY point re-taught inside the new frame — the m20/m26 move. A
    // re-teach is not a re-assignment (the m16 ruling): no ledger row moves.
    for (const p of [
      "desu-copula",     // m3  — the copula is what the な in なんだ IS
      "kara-because",    // m16 — から gives the reason, んだ presents the sentence AS one
      "masu-present",    // m7  — んです, the polite skin of the same item
      "i-adj-present",   // m12 — the い that drops in front of すぎる
      "na-adj-present",  // m12 — に before なる, and nothing dropped before すぎる
      "ta-form",         // m11 — なった, the tense a change is reported in
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("invents ZERO grammar-point ids — every card resolves to the N5 registry", () => {
    // Inv 42, asserted against the SHIPPED registry rather than a hand-copied
    // list, with a non-vacuity floor: an empty or failed import would make
    // every id "known" and the check would pass for the wrong reason.
    const registry = new Set(
      (N5_GRAMMAR_POINTS as { id: string }[]).map((p) => p.id),
    );
    expect(registry.size, "the grammar-point registry failed to load").toBeGreaterThan(100);
    const unknown = [...taughtPoints].filter((p) => !registry.has(p));
    expect(taughtPoints.size, "no rule cards found").toBe(9);
    expect(unknown, unknown.join(", ")).toEqual([]);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M27_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m27-neo pedagogy invariants", () => {
  const steps = M27_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (the deliberate
   *  learner errors — 「ねつが あるだ」 and 「びょうきんだ」 ARE what these cards
   *  name) and grading-only `acceptedAnswers`. */
  const surfaces: { where: string; ja: string; type: string }[] = [];

  /**
   * RULE ZERO — never substring-match Japanese. Japanese has no spaces, so
   * `ja.includes(kana)` matches inside unrelated words and the wrong version
   * always PASSES. This module is entirely an ADJACENCY question — what sits
   * in FRONT of んだ (a verb) versus in front of なんだ (a noun), what sits in
   * front of すぎる (a ます-stem, never a dictionary form), what sits in front
   * of なる (a く-stem or に, never a bare い-adjective) — and none of those
   * can be asked of a substring. 「いくんだ」 and 「ごはんだ」 both contain んだ.
   *
   * So this file tokenizes for real: longest-match over the same vocabulary
   * `moduleCompiler.makeTokenizer` uses — courseAtoms ∪ this module's
   * newAtoms ∪ the priorAtoms compile-ir injects (m11-m16's inflections live
   * ONLY there) ∪ particles ∪ names ∪ interjections ∪ STEMS. The first test
   * below proves the two agree by checking every compiled build tile bank
   * against it, so nothing downstream rests on a re-implementation that
   * quietly drifted.
   */
  const PARTICLES = ["は", "が", "を", "に", "で", "と", "の", "も", "へ", "から", "まで", "か"];
  const NAMES = ["トム", "ミカ", "ケン", "たなか", "タナカ"];
  const INTERJ = ["うん", "ううん", "そう", "ええ", "はい", "いいえ"];
  /** ます-stems + い-adjective く-stems, derived exactly as the compiler does.
   *  Both matter here: すぎる attaches to the first and なる to the second. */
  const MASU_STEMS = new Set<string>();
  const KU_STEMS = new Set<string>();
  for (const v of VERB_ENTRIES) {
    const masu = conjugateVerb(v.dictionary, v.group, "masu");
    if (masu.endsWith("ます")) MASU_STEMS.add(masu.slice(0, -2));
  }
  for (const adj of ADJ_ENTRIES) {
    if (adj.type !== "i-adj") continue;
    // いい is irregular in every stem it forms: よく, never いく.
    if (adj.dictionary === "いい") KU_STEMS.add("よく");
    else if (adj.dictionary.endsWith("い")) KU_STEMS.add(`${adj.dictionary.slice(0, -1)}く`);
  }
  MASU_STEMS.delete("");
  KU_STEMS.delete("");
  const IR = m27Ir as unknown as {
    newAtoms: { kana: string }[];
    priorAtoms?: { kana: string }[];
    lessons: { id: string; reviewPool?: string[] }[];
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
    for (const chunk of ja.replace(/[。、？！]/g, " ").split(/[\s　]+/).filter(Boolean)) {
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

  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  /**
   * WHOLE SENTENCES, not every kana string on the step. `jaSurfaces` walks
   * every field, so a build's `tiles` array contributes the bare tile 「んだ」
   * as its own "surface" — useless for an ADJACENCY question, because there
   * is nothing on either side of it (a first pass at the preceder guards
   * below counted 129 phantom "sentence-initial んだ"). The adjacency guards
   * therefore read the sentence-carrying fields only.
   *
   * FIELD NAMES ARE THE TRAP. `speaking` keeps its answer in `targetPhrase`
   * and `translate` in `acceptedAnswers` (a list — grading is max-acceptance);
   * neither has a `targetSentence`. A scan that reads the wrong field compares
   * `undefined` every time, reports a clean course and is wrong, which is why
   * every guard below asserts it saw something.
   */
  const sentencesOf = (step: Record<string, unknown>): string[] => {
    const out: string[] = [];
    for (const k of ["targetSentence", "targetPhrase", "transcript", "audioText", "correctKana"]) {
      const v = step[k];
      if (typeof v === "string" && v.trim()) out.push(v);
    }
    if (Array.isArray(step.acceptedAnswers))
      for (const a of step.acceptedAnswers as string[])
        if (typeof a === "string" && a.trim()) out.push(a);
    const prompt = step.prompt as { before?: string; after?: string } | undefined;
    if (step.type === "particle_cloze" && prompt && typeof prompt === "object")
      out.push(`${prompt.before ?? ""}${String(step.correctParticle ?? "")}${prompt.after ?? ""}`);
    if (Array.isArray(step.lines))
      for (const l of step.lines as { kana?: string }[])
        if (typeof l?.kana === "string") out.push(l.kana);
    const ex = step.examples;
    if (Array.isArray(ex))
      for (const e of ex as { ja?: string }[]) if (typeof e?.ja === "string") out.push(e.ja);
    return out;
  };

  const sentences: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of sentencesOf(step as unknown as Record<string, unknown>))
      sentences.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  const bare = (t: string) => t.replace(/[。？！]/g, "");

  it("this file's tokenizer reproduces the compiler's own build tiles", () => {
    // NON-VACUITY + CORRECTNESS ANCHOR. Every guard below reads `tok()`, so if
    // `tok()` segmented differently from the compiler the guards would be
    // measuring a sentence the learner never sees. `correctOrder` IS the
    // compiler's tokenization, so comparing the two on every build in the
    // module is a direct proof that they agree — and it is what caught that
    // this file's vocabulary needed `priorAtoms` (「およがない」 is an m14 IR
    // atom with no courseAtoms row, so without it およ came out as junk).
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { type: string; targetSentence?: string; correctOrder?: string[]; id: string };
      if (rec.type !== "build_sentence" && rec.type !== "listening_build") continue;
      if (!rec.targetSentence || !rec.correctOrder) continue;
      checked++;
      const mine = tok(rec.targetSentence).join("·");
      const theirs = rec.correctOrder.map(bare).join("·");
      if (mine !== theirs)
        offenders.push(`${lessonId}/${rec.id}: mine [${mine}] vs compiler [${theirs}]`);
    }
    expect(checked, "no build steps to anchor against").toBeGreaterThan(40);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every token resolves to an atom — no invented surface reaches a tile", () => {
    // The general unbuildable class. `み` and `し` are deliberately allowed as
    // one-character tokens nowhere: the four verb stems this module BANS
    // (かい / き / し / はなし) are handled by their own guard below, because
    // each of them IS a real atom and so would sail through this one.
    const EXTRA = new Set([...PARTICLES, ...NAMES, ...INTERJ, ...MASU_STEMS, ...KU_STEMS, "だ", "です"]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces)
      for (const t of tok(ja)) {
        scanned++;
        if (
          t.length > 1 &&
          !JA_COURSE_ATOMS_BY_KANA.has(bare(t)) &&
          !NEW_KANA.includes(bare(t)) &&
          !PRIOR_KANA.includes(bare(t)) &&
          !EXTRA.has(bare(t))
        )
          offenders.push(`${where}: 「${t}」 resolves to no atom — ${ja}`);
      }
    expect(scanned, "no tokens scanned — the projection moved").toBeGreaterThan(2000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── The two skins, and which one attaches to what ──────────────────────
  //
  // These four lists ARE the module's central claim, written down. んだ /
  // んです attach to a finished VERBAL predicate; なんだ / なんです attach to a
  // NOUN or a な-adjective, because the copula they carry is the one a noun
  // needs. Mixing them is the module's own antiPattern (「びょうきんだ」) and
  // it is invisible to any substring check, so each list is enumerated and
  // every actual preceder in the compiled module must be on the right one.
  // A new sentence with an unclassified preceder FAILS, which is the point:
  // the author has to say which skin it takes.
  const VERBAL_PRECEDERS = new Set([
    // plain verbs, their negatives and their pasts
    "いく", "いかない", "たべる", "たべない", "のむ", "のまない", "のんだ",
    "かう", "かわない", "みる", "みない", "はたらく", "こない", "ある", "ない",
    "およがない",
    // い-adjectives
    "いそがしい", "むずかしい", "せまい", "おもしろい", "たかい", "たのしい",
    "ながい", "みじかい",
    // this module's own derived verbs — すぎる/なる are verbs, so they take ん
    "なる", "なった", "すぎた", "すぎる",
    "たかすぎる", "おおきすぎる", "ちいさすぎる", "さむすぎる",
    "むずかしすぎる", "しずかすぎる", "ながすぎる",
  ]);
  const NOMINAL_PRECEDERS = new Set([
    // nouns
    "かさ", "やすみ", "とけい", "びょうき", "めがね", "いしゃ",
    // な-adjectives — nouns wearing a hat, which is why they take the same な
    "すき", "きらい", "しずか",
  ]);

  it("the two preceder classes are disjoint (the classification means something)", () => {
    const both = [...VERBAL_PRECEDERS].filter((t) => NOMINAL_PRECEDERS.has(t));
    expect(both, `classified as both verbal and nominal: ${both.join(", ")}`).toEqual([]);
    expect(VERBAL_PRECEDERS.size).toBeGreaterThan(20);
    expect(NOMINAL_PRECEDERS.size).toBeGreaterThan(5);
  });

  it("んだ / んです follow a VERBAL predicate, never a bare noun", () => {
    const offenders: string[] = [];
    let checked = 0;
    for (const { where, ja } of sentences) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "んだ" && t[i] !== "んです") continue;
        const prev = t[i - 1];
        if (prev === undefined) {
          offenders.push(`${where}: 「${t[i]}」 opens a sentence — ${ja}`);
          continue;
        }
        checked++;
        if (NOMINAL_PRECEDERS.has(prev))
          offenders.push(
            `${where}: noun/な-adjective 「${prev}」 takes な first — 「${prev}な${t[i]}」, not 「${prev}${t[i]}」 — ${ja}`,
          );
        else if (!VERBAL_PRECEDERS.has(prev))
          offenders.push(`${where}: 「${prev}」 before 「${t[i]}」 is unclassified — ${ja}`);
      }
    }
    expect(checked, "no んだ/んです preceder examined — the projection moved")
      .toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("なんだ / なんです follow a NOUN or な-adjective, never a verb", () => {
    const offenders: string[] = [];
    let checked = 0;
    for (const { where, ja } of sentences) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "なんだ" && t[i] !== "なんです") continue;
        const prev = t[i - 1];
        if (prev === undefined) {
          offenders.push(`${where}: 「${t[i]}」 opens a sentence — ${ja}`);
          continue;
        }
        checked++;
        if (VERBAL_PRECEDERS.has(prev))
          offenders.push(
            `${where}: verb/い-adjective 「${prev}」 takes ん directly — 「${prev}んだ」, not 「${prev}${t[i]}」 — ${ja}`,
          );
        else if (!NOMINAL_PRECEDERS.has(prev))
          offenders.push(`${where}: 「${prev}」 before 「${t[i]}」 is unclassified — ${ja}`);
      }
    }
    expect(checked, "no なんだ/なんです preceder examined").toBeGreaterThan(20);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("the question word なん never fuses with だ / です", () => {
    // WHY 「なんだ」 AND 「なんです」 HAD TO BE THEIR OWN ATOMS. な is not an
    // atom and なん IS one (❓ "what"), so without those two rows
    // 「びょうきなんだ」 would tile びょうき · なん · だ and credit the question
    // word inside a statement. This asserts the registration is doing its job
    // in the COMPILED output, not merely that the rows exist.
    //
    // Its other half is a note for m28/m29: `compile-ir.mjs` hands this
    // module's newAtoms forward as `priorAtoms`, so 「なんですか」 meaning
    // "what is it?" would now tokenize as なんです · か. m27 writes it nowhere.
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        scanned++;
        if (t[i] === "なん" && (t[i + 1] === "だ" || t[i + 1] === "です"))
          offenders.push(`${where}: なん + ${t[i + 1]} — the explanatory did not fuse — ${ja}`);
        if (t[i] === "なんです" && t[i + 1] === "か")
          offenders.push(`${where}: 「なんですか」 is ambiguous with "what is it?" — ${ja}`);
      }
    }
    expect(scanned, "no tokens scanned").toBeGreaterThan(2000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── すぎる attaches to a stem ────────────────────────────────────────────
  it("すぎる / すぎた follow a ます-STEM, never a dictionary form", () => {
    // The card's own antiPattern is 「たべるすぎたんだ」. A dictionary form in
    // front of すぎる would render, grade and sound fine on a tile bank, and
    // teach the wrong derivation.
    const DICTIONARY = new Set(VERB_ENTRIES.map((v) => v.dictionary));
    const offenders: string[] = [];
    let checked = 0;
    for (const { where, ja } of sentences) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "すぎる" && t[i] !== "すぎた") continue;
        const prev = t[i - 1];
        if (prev === undefined) {
          offenders.push(`${where}: 「${t[i]}」 opens a sentence — ${ja}`);
          continue;
        }
        checked++;
        if (DICTIONARY.has(prev))
          offenders.push(`${where}: dictionary form 「${prev}」 in front of 「${t[i]}」 — ${ja}`);
        else if (!MASU_STEMS.has(prev))
          offenders.push(`${where}: 「${prev}」 is not a ます-stem — ${ja}`);
      }
    }
    // Floor set from the MEASUREMENT (31 preceders in the sentence-carrying
    // fields), not from a guess: its job is to catch the scan going blind, not
    // to be a content bar.
    expect(checked, "no すぎる/すぎた preceder examined").toBeGreaterThan(20);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("the four homograph verb stems never reach a すぎる tile", () => {
    // PROBED, not assumed, before a sentence was authored. 「かいすぎる」 tiles
    // かい · すぎる and かい is 貝 "shell" (the mis-credit that banned m19's
    // 「かいに いく」); 「ききすぎる」 tiles き · き · すぎる (き = 木 "tree");
    // 「しすぎる」 tiles し · すぎる (し = 4️⃣); 「はなしすぎる」 tiles はなし ·
    // すぎる and はなし is the registered NOUN "talk, story". Every one of the
    // four IS a real atom, which is exactly why the unbuildable gate and the
    // resolves-to-an-atom guard above both pass on them.
    const BANNED_STEMS = new Set(["かい", "き", "し", "はなし"]);
    const offenders: string[] = [];
    let sugiruTiles = 0;
    for (const { where, ja } of surfaces) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "すぎる" && t[i] !== "すぎた") continue;
        sugiruTiles++;
        if (i > 0 && BANNED_STEMS.has(t[i - 1]))
          offenders.push(`${where}: 「${t[i - 1]}」 is a homograph atom, not a usable stem — ${ja}`);
      }
    }
    expect(sugiruTiles, "no すぎる tile at all — the module's second ledger id is missing")
      .toBeGreaterThan(60);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── なる takes く or に ──────────────────────────────────────────────────
  it("なる / なった follow a く-STEM or に, never a bare adjective", () => {
    // The card's antiPattern is 「だんだん さむい なる」 for the い side and
    // 「げんきく なる」 for the な side; this checks both directions at once,
    // because a な-adjective reaching なる through く and an い-adjective
    // reaching it undressed are the same defect seen from two ends.
    const IADJ_FORMS = new Set<string>();
    for (const adj of ADJ_ENTRIES)
      if (adj.type === "i-adj")
        for (const f of Object.values(adj.forms as Record<string, string>)) IADJ_FORMS.add(f);
    const offenders: string[] = [];
    let ku = 0;
    let ni = 0;
    for (const { where, ja } of sentences) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length; i++) {
        if (t[i] !== "なる" && t[i] !== "なった") continue;
        const prev = t[i - 1];
        if (prev === undefined) {
          offenders.push(`${where}: 「${t[i]}」 opens a sentence — ${ja}`);
          continue;
        }
        if (prev === "に") {
          ni++;
          continue;
        }
        if (KU_STEMS.has(prev)) {
          ku++;
          continue;
        }
        if (IADJ_FORMS.has(prev))
          offenders.push(`${where}: bare い-adjective 「${prev}」 in front of 「${t[i]}」 — ${ja}`);
        else offenders.push(`${where}: 「${prev}」 in front of 「${t[i]}」 is neither a く-stem nor に — ${ja}`);
      }
    }
    expect(ku, "no 〜く なる — the い-adjective half of the ledger id is missing")
      .toBeGreaterThan(30);
    expect(ni, "no 〜に なる — the な-adjective/noun half is missing").toBeGreaterThan(30);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("「なくなる」 never appears (なく is the atom 鳴く, not a negative stem)", () => {
    // 「おかねが なく なる」 tiles おかね · が · なく · なる, and なく is the
    // registered atom "to chirp / roar". A change-of-state module reaches for
    // it constantly; this module says 「おかねが ない」 instead, which is what
    // it means anyway. Token-adjacency, never substring — なく is a substring
    // of なくなかった and of nothing else here, which is precisely the kind of
    // accident a substring test invents.
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces) {
      const t = tok(ja).map(bare);
      for (let i = 0; i < t.length - 1; i++) {
        scanned++;
        if (t[i] === "なく" && (t[i + 1] === "なる" || t[i + 1] === "なった"))
          offenders.push(`${where}: なく + ${t[i + 1]} — ${ja}`);
      }
    }
    expect(scanned, "no adjacent pairs scanned").toBeGreaterThan(1000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── vocabulary discipline ───────────────────────────────────────────────
  it("ships no untaught vocabulary the context pack claims is known", () => {
    // The pack is derived from `courseAtoms` attribution and OVERSTATES: none
    // of these is in any earlier module's priorVocab, so using one would be a
    // bare-word debut the compiler's own provenance gate cannot see (a
    // build_sentence IS intro-capable, so an untaught word slips through as a
    // "debut"). Each was checked token-exactly against m27's computed
    // priorVocab, not against the pack.
    //
    // はやい stays banned even though it is registered elsewhere:
    // `JA_PRIMARY_ATOM_BY_KANA` resolves the bare kana to `hayai-early` (早い),
    // so 「はやく なる」 glossed "gets faster" would credit the wrong sense
    // (m20's course-wide ruling). あつい is the same class — it resolves to
    // 暑い "hot" while its courseAtoms gloss reads "kind, deep, thick" — which
    // costs this module 「あつく なる」, the sentence a seasons beat wants most.
    // つよい / よわい are banned for a THIRD reason: neither is in ADJ_ENTRIES,
    // so 「つよく なる」 tiles つ · よく · なる and 「よわく なる」 is
    // unbuildable outright. たのしい and すずしい are absent from ADJ_ENTRIES
    // too, so they are usable as predicates (たのしいんです) but never with
    // なる — which is why they are NOT on this list and are covered by the
    // く-stem guard above instead.
    const UNTAUGHT = [
      "はやい", "あつい", "つよい", "よわい", "つめたい", "わるい", "やさしい",
      "まずい", "つまらない", "べんり", "ふべん", "かんたん", "たいへん",
      "こうえん", "まち", "ちかく", "そと", "きょうしつ", "おふろ", "しごと",
      "べんきょう", "ページ", "よこ", "さいふ", "いりぐち", "せいと",
      "ノート", "プール", "タクシー", "ドア", "どあ", "クラス", "スポーツ",
      "よむ", "かく", "うたう", "たつ", "とる", "なく",
      "とても", "たくさん", "でも", "また", "なんで", "おちゃ", "さけ",
      "ぷりん", "あおい", "しょうゆ", "あい", "えび", "ぱん", "ぴあの",
      // では is an ATOM ("with that…") taught nowhere, so a fused で + は would
      // tile an untaught word (m23's finding, restated by m26).
      "では",
    ];
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces)
      for (const t of tok(ja)) {
        scanned++;
        if (UNTAUGHT.includes(bare(t)))
          offenders.push(`${where}: 「${t}」 is taught by no module before m27 — ${ja}`);
      }
    expect(scanned, "no tokens scanned").toBeGreaterThan(2000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every carrier flagged over-exposed by the 2026-07-27 audit is absent", () => {
    // Inv 27. The brief's nine worst carriers plus the five m26 added from the
    // same audit. いたい is the painful one for THIS module — 「あたまが
    // いたいんだ」 is the textbook explanatory sentence and an explaining
    // module reaches for it by reflex — so ねつ / のど / びょうき / いそがしい
    // and 「じかんが ない」 carry the reasons instead. Token-exact, never
    // substring.
    //
    // SCOPED TO WHAT THE AUTHOR CHOSE — multi-token SENTENCES plus every
    // `reviewPool` — rather than to `jaSurfaces`, following m26's narrowing
    // and for its evidence: a scan over every surface fires on `word_image_mcq`
    // options, which the COMPILER picks out of `emojiPool`, so the offending
    // word is neither authored nor a carrier of anything. `reviewPool` is
    // scanned explicitly because a pool entry IS an authorial choice.
    const FATIGUED = new Set([
      "みせ", "ともだち", "ほん", "ごはん", "いる", "きのう", "あたらしい",
      "えき", "かばん", "みず", "かった", "うみ", "いたい", "でんしゃ",
      "ください", "きっさてん",
    ]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of sentences) {
      if (tok(ja).length < 2) continue;
      for (const t of tok(ja)) {
        scanned++;
        if (FATIGUED.has(bare(t))) offenders.push(`${where}: fatigued carrier 「${t}」 — ${ja}`);
      }
    }
    let pooled = 0;
    for (const lesson of IR.lessons)
      for (const kana of lesson.reviewPool ?? []) {
        pooled++;
        if (FATIGUED.has(kana))
          offenders.push(`${lesson.id}: fatigued carrier 「${kana}」 in reviewPool`);
      }
    // 1648 sentence tokens measured; floor set below it for the same reason.
    expect(scanned, "no sentence tokens scanned — the projection moved").toBeGreaterThan(1200);
    expect(pooled, "no reviewPool words scanned — the IR shape moved").toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no bound ender is ever a bare word-level production target", () => {
    // `moduleCompiler`'s BOUND list filters these out of the filler pools and
    // `boundEnderProduction.test.ts` is the course-wide ratchet; BOTH gained
    // this module's six enders WITH the module rather than after it, which is
    // the whole lesson of the つもり / ましょう incident. This is the local
    // half: no pool may carry one either, because a pool entry feeds the
    // filler's bare-word `speaking` slot and "Say: the thing is" is not a
    // sentence anyone says.
    // FIELD NAMES: `speaking` → targetPhrase, `translate` → acceptedAnswers.
    const BOUND = new Set([
      "んだ", "んです", "なんだ", "なんです", "すぎる", "すぎた",
      "つもり", "ましょう", "でしょう", "でしょ", "だろう", "かな", "たり",
    ]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; id: string; targetPhrase?: string; acceptedAnswers?: string[];
      };
      if (rec.type !== "speaking" && rec.type !== "translate") continue;
      const targets =
        rec.type === "speaking"
          ? [rec.targetPhrase].filter((x): x is string => typeof x === "string")
          : (rec.acceptedAnswers ?? []);
      for (const t of targets) {
        scanned++;
        if (BOUND.has(t.replace(/[。？！\s　]/g, "")))
          offenders.push(`${lessonId}/${rec.id} (${rec.type}): bare 「${t}」 as the answer`);
      }
    }
    let pooled = 0;
    for (const lesson of IR.lessons)
      for (const kana of lesson.reviewPool ?? []) {
        pooled++;
        if (BOUND.has(kana)) offenders.push(`${lesson.id}: bound ender 「${kana}」 in reviewPool`);
      }
    expect(scanned, "scanned no production targets — the field names moved")
      .toBeGreaterThan(30);
    expect(pooled, "no reviewPool words scanned").toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no true particle_cloze anywhere — m27 introduces no particle (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so a module that introduces no
    // particle may not use it on one at all. Every cloze here picks among
    // CONTENT words and predicate FORMS (んだ / だ / なんだ, のみすぎた /
    // のみすぎる / たべすぎた, なる / ある / はいる).
    const PARTICLE_SET = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    let seen = 0;
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      seen++;
      const options = (step as unknown as { options?: string[] }).options ?? [];
      if (options.length && options.every((o) => PARTICLE_SET.has(o)))
        offenders.push(`${lessonId}/${String(step.id)}: [${options.join(" | ")}]`);
    }
    expect(seen, "no particle_cloze steps at all — inv 45's usage floor is unmet")
      .toBeGreaterThan(8);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no cloze frame carries a character name or ends on the bare copula", () => {
    // A particle_cloze is HARVESTED into the grammar-review deck, whose
    // comprehensibility gate resolves every word through `courseAtoms` — and
    // ミカ / トム / ケン / たなか have no rows, so a frame naming one lands in
    // GATE_EXEMPTIONS as "too advanced" (m22's finding). The same gate strips
    // only atoms and TAUGHT_ENDINGS, and だ is in neither, so a frame ending
    // in the bare copula reads as unexplained vocabulary (m21's や cloze).
    const offenders: string[] = [];
    let seen = 0;
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      seen++;
      const rec = step as unknown as { sentenceBefore?: string; sentenceAfter?: string; targetSentence?: string };
      const frame = `${rec.sentenceBefore ?? ""}${rec.sentenceAfter ?? ""}${rec.targetSentence ?? ""}`;
      for (const name of ["ミカ", "トム", "ケン", "たなか"])
        if (frame.includes(name))
          offenders.push(`${lessonId}/${String(step.id)}: cloze frame names ${name}`);
      const tail = (rec.sentenceAfter ?? "").replace(/[。？！\s　]+$/g, "");
      if (tail.endsWith("だ"))
        offenders.push(`${lessonId}/${String(step.id)}: cloze frame ends on bare だ — "${tail}"`);
    }
    expect(seen, "no cloze steps found").toBeGreaterThan(8);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── glosses ─────────────────────────────────────────────────────────────
  it("すぎる is glossed as EXCESS, never as an intensifier", () => {
    // GLOSS DISCIPLINE, the one thing no mechanical check normally catches
    // (m23 shipped 11 sentences glossing はいる as "check in"). すぎる is
    // "too ~" — more than the situation can carry — and it is not よく or
    // ちょっと. A gloss reading "very" teaches an intensifier, which is a
    // different claim and a different word. Scoped to
    // listening_comprehension, the one step type carrying transcript AND
    // gloss as clean fields.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; transcript?: string; correctOptionId?: string;
        options?: { id: string; text: string }[]; id: string;
      };
      if (rec.type !== "listening_comprehension" || !rec.transcript) continue;
      const t = tok(rec.transcript).map(bare);
      if (!t.some((x) => x === "すぎる" || x === "すぎた" || x.endsWith("すぎる"))) continue;
      checked++;
      const correct = rec.options?.find((o) => o.id === rec.correctOptionId)?.text ?? "";
      if (/\bvery\b/i.test(correct))
        offenders.push(
          `${lessonId}/${rec.id}: すぎる glossed "very" — that is an intensifier, not an excess — "${correct}"`,
        );
      if (!/\btoo\b/i.test(correct))
        offenders.push(`${lessonId}/${rec.id}: すぎる transcript glossed without "too" — "${correct}"`);
    }
    expect(checked, "no すぎる listening item to check").toBeGreaterThan(6);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("なる is glossed as a CHANGE, never as a state", () => {
    // 「さむく なる」 is "it gets cold", not "it is cold" — the whole point of
    // the frame is that something is turning into something else, and a
    // stative gloss deletes it. なった is the same claim in the past
    // ("it's got cold"), which is why the accepted vocabulary includes both
    // directions.
    const CHANGE = /(get|gets|getting|got|become|becomes|becoming|became|turn|turns|coming to|comes to|here|is coming|goes quiet)/i;
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; transcript?: string; correctOptionId?: string;
        options?: { id: string; text: string }[]; id: string;
      };
      if (rec.type !== "listening_comprehension" || !rec.transcript) continue;
      const t = tok(rec.transcript).map(bare);
      if (!t.includes("なる") && !t.includes("なった")) continue;
      checked++;
      const correct = rec.options?.find((o) => o.id === rec.correctOptionId)?.text ?? "";
      if (!CHANGE.test(correct))
        offenders.push(`${lessonId}/${rec.id}: なる transcript glossed as a state — "${correct}"`);
    }
    expect(checked, "no なる listening item to check").toBeGreaterThan(6);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every register cue is graded — the other register is never accepted", () => {
    // Inv 48, module-local and reading the SENTENCE fields rather than only
    // `acceptedAnswers` (which is all the course-wide
    // `registerCueGrading.test.ts` can see). L5 is THE register lesson of this
    // module — "one item, two skins" is the spine tile's own phrase — and it
    // carries one deliberately PLAIN beat as the contrast, so both directions
    // have to be checked or the guard passes by only ever looking one way.
    const POLITE = /(です|ます|ません|ました|ましょう|ください|でした)(か)?[。？！]?\s*$/;
    const offenders: string[] = [];
    let politeCues = 0;
    let plainCues = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as Record<string, unknown>;
      const prompt = String(rec.promptEn ?? rec.sourceText ?? rec.prompt ?? "");
      const wantsPolite = /say politely/i.test(prompt);
      const wantsPlain = /say to a friend/i.test(prompt);
      if (!wantsPolite && !wantsPlain) continue;
      for (const ja of sentencesOf(rec)) {
        const clause = ja.split(/[。？！]/).filter((c) => c.trim()).at(-1) ?? ja;
        const isPolite = POLITE.test(clause.trim());
        if (wantsPolite) politeCues++;
        else plainCues++;
        if ((wantsPolite && !isPolite) || (wantsPlain && isPolite))
          offenders.push(
            `${lessonId}/${String(rec.id)}: prompt "${prompt}" carries ${isPolite ? "polite" : "plain"} 「${ja}」`,
          );
      }
    }
    expect(politeCues, "no politely-cued surface — L5's register lesson is missing")
      .toBeGreaterThan(8);
    expect(plainCues, "no friend-cued surface — the plain contrast beat is missing")
      .toBeGreaterThan(0);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
