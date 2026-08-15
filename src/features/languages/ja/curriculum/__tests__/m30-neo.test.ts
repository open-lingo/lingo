/**
 * m30-neo module guards — **THE FIRST N4 MODULE**, spine unit n4-01,
 * "て + helper I: 〜てみる / 〜ておく". Same 2026-07-26 module shape as m12–m29
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST. Like m12–m29 it splices NOTHING in at module
 * level — the katakana programme ended at m11 — so the compiled lessons ARE the
 * shipped lessons and the guards run over the whole module.
 *
 * Four things make this file different from m29's, and each has its own
 * describe block:
 *
 *   1. **THE HELPER MUST BE ATTACHED.** `applyKanjiSurfaces` kanji-fies a run
 *      only when the run holds exactly ONE dictionary word, so 「たべてみる」
 *      stays kana (correct — an auxiliary verb is written in kana) while a
 *      hypothetical 「たべて みる」 would split into two runs and render
 *      「たべて 見る」 on every headline sentence in the module. The check is on
 *      WHITESPACE-delimited chunks, not on a substring.
 *   2. **NO BARE 「て」 TILE.** The RUN-PLAN's homograph ruling flags て 手
 *      "hand" as UNVERIFIED — "if a て-form verb ever emits a bare て tile it is
 *      a silent mis-credit". A module made entirely of て-forms is where that
 *      would happen, so it is measured rather than assumed.
 *   3. **THE SCHEMA IS TWO TILES.** 「たべてみる」 must tile as たべて · みる. If a
 *      future edit registered a compound whole, the learner would stop
 *      assembling the pattern and the module's whole claim would quietly go.
 *   4. **TWO INVENTED IDS, AND ONLY TWO.** N4 has no grammar-point registry, so
 *      `te-miru` and `te-oku` are IR-local by necessity; every OTHER card is a
 *      shipped N5 registry point re-taught in the new frame. That ratio is
 *      asserted against the shipped registry, not a hand-copied list.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS_BY_KANA } from "../../courseAtoms";
import { VERB_ENTRIES, ADJ_ENTRIES } from "../../conjugationTables";
import { conjugateVerb } from "../../conjugationEngine";
import { KANJI_ELIGIBLE_ATOMS } from "../../secondScript/applyKanjiSurfaces";
import { FURIGANA_WINDOW } from "../../secondScript/kanjiRollout";
import {
  getTransformRulesetFor,
  TRANSFORM_RULESETS,
} from "../../conjugation/transformRulesets";
import N5_GRAMMAR_POINTS from "@/features/lesson/data/n5-grammar-points.json";
import m30Ir from "../ir/m30.ir.json";
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

registerJaModuleContentLints("m30");

registerModuleBarGuards({
  moduleLabel: "m30-neo",
  lessons: M30_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25", "m26", "m27", "m28", "m29"],
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
  ],
  // Same reason m28/m29 needed this: this module's own て-forms (しらべて,
  // ならって, おくって …) and m11–m29's 100+ IR-only inflections exist in neither
  // `courseAtoms` nor the conjugation engine's real-form lexicon, so without
  // them the bar guards' tokenizer cannot see the module's headline vocabulary
  // at all. Declaring them makes them TOKENS, which is what subjects them to
  // the debut check — the opposite of a loosening.
  extraVocab: [
    ...(m30Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    ...((m30Ir as unknown as { priorAtoms?: { kana: string }[] }).priorAtoms ?? []).map(
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

describe("m30-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M30_NEO_LESSONS).toHaveLength(13);
    const reviews = M30_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M30_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M30_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M30_NEO_LESSONS[M30_NEO_LESSONS.length - 1].id).toBe("ja-m30-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M30_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M30_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });

  it("declares exactly the spine's 34 atoms", () => {
    // spine-n4 §2, n4-01: `vocab: { count: 34 }`. A module that quietly grows
    // its allocation is the thing inv 16 exists to stop.
    const atoms = (m30Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms;
    expect(atoms).toHaveLength(34);
    expect(new Set(atoms.map((a) => a.kana)).size).toBe(34);
  });

  it("teaches every `must` word the spine allocates", () => {
    const kana = new Set(
      (m30Ir as unknown as { newAtoms: { kana: string }[] }).newAtoms.map((a) => a.kana),
    );
    for (const w of ["よやく", "しらべる", "きめる", "ならう", "つづける", "おくる"])
      expect(kana.has(w), `spine must-word ${w} missing`).toBe(true);
    // …and all eight of the `prefer` list, which this module could afford.
    for (const w of ["じゅんび", "とりあえず", "さいしょ", "けっか", "こたえ", "しつもん", "せつめい", "れんしゅう"])
      expect(kana.has(w), `spine prefer-word ${w} missing`).toBe(true);
  });
});

const taughtPoints = new Set(
  M30_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m30-neo owes the spine's て+helper row", () => {
  it("teaches `te-miru` and `te-oku`, the unit's two payload points", () => {
    for (const p of ["te-miru", "te-oku"])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("re-teaches the five REGISTRY points the nine teaching lessons need", () => {
    // N4 has no grammar-point registry, so the two payload ids above are
    // IR-local by necessity. Every remaining card is a shipped N5 point
    // re-taught inside the new frame — the m20/m26/m27/m28 move. A re-teach is
    // not a re-assignment (the m16 ruling): no ledger row moves.
    for (const p of [
      "ta-form", // m11 — the た lands on the HELPER, never the main verb
      "te-form", // m8  — the ramp that derives the new verbs' て-forms (×2 variants)
      "mae-ni", // m15 — ておく is almost always 〜まえに
      "kara-because", // m16 — the reason clause tells みる from おく
      "nai-form", // m6  — 〜てみない？ is the helper taking ない
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("invents EXACTLY TWO ids, and both are the N4 payload", () => {
    // Inv 42, asserted against the SHIPPED registry rather than a hand-copied
    // list, with a non-vacuity floor: an empty or failed import would make
    // every id "known" and the check would pass for the wrong reason.
    const registry = new Set((N5_GRAMMAR_POINTS as { id: string }[]).map((p) => p.id));
    expect(registry.size, "the grammar-point registry failed to load").toBeGreaterThan(100);
    const invented = [...taughtPoints].filter((p) => !registry.has(p)).sort();
    expect(taughtPoints.size, "no rule cards found").toBe(7);
    expect(invented).toEqual(["te-miru", "te-oku"]);
  });

  it("ships nine rule cards across nine teaching lessons", () => {
    // Seven distinct IDS but NINE cards: `te-miru` and `te-form` each teach
    // twice under a `variant`, which is how one grammar point keeps one SRS
    // history while each lesson still states its own rule (m6's three
    // `nai-form` cards). One card per teaching lesson — two adjacent PINNED
    // grammar_rule steps would fail the adjacency bar (m14's layout law).
    const cards = M30_NEO_LESSONS.flatMap((l) =>
      l.steps.filter((s) => s.type === "grammar_rule").map(() => l.id),
    );
    expect(cards).toHaveLength(9);
    expect(new Set(cards).size, "two cards landed in one lesson").toBe(9);
    for (const l of M30_NEO_LESSONS.filter((x) => /-review(-\d+)?$/.test(x.id)))
      expect(
        l.steps.filter((s) => s.type === "grammar_rule"),
        `${l.id} is a review lesson and should carry no rule card`,
      ).toHaveLength(0);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M30_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });

  it("ships ZERO image MCQs, deliberately", () => {
    // m30's allocation is almost entirely ABSTRACT (よやく, じゅんび, けっか,
    // せつめい, れんしゅう, さいしょ, とりあえず, こたえ, しつもん are process
    // nouns and adverbs; しらべる / きめる / つづける / ならう / おくる are
    // abstract actions), so no atom carries a courseAtoms emoji and the
    // compiler cannot emit a debut MCQ even if it wanted to. Inv 44 is explicit
    // that `word_image_mcq` carries no usage floor. Asserted rather than left
    // implicit so that adding an emoji to one of these rows is a decision
    // somebody takes on purpose.
    const imaged = M30_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "word_image_mcq",
    );
    expect(imaged.map((s) => s.id)).toEqual([]);
    const atoms = (m30Ir as unknown as { newAtoms: { kana: string; imageable?: boolean }[] })
      .newAtoms;
    expect(atoms.every((a) => a.imageable === false)).toBe(true);
  });
});

describe("m30-neo pedagogy invariants", () => {
  const steps = M30_NEO_LESSONS.flatMap((l) => l.steps.map((s) => [l.id, s] as const));

  /**
   * RULE ZERO — never substring-match Japanese. Japanese has no spaces, so
   * `ja.includes(kana)` matches inside unrelated words and the wrong version
   * always PASSES. This module is an ADJACENCY question end to end — what sits
   * in FRONT of a helper (a て-form and nothing else), and whether a SPACE ever
   * separates the two — and neither can be asked of a substring.
   *
   * So this file tokenizes for real: longest-match over the same vocabulary
   * `moduleCompiler.makeTokenizer` uses — courseAtoms ∪ this module's newAtoms ∪
   * the priorAtoms compile-ir injects (m11–m29's inflections live ONLY there) ∪
   * particles ∪ names ∪ interjections ∪ STEMS. The first test below proves the
   * two agree by checking every compiled build tile bank against it, so nothing
   * downstream rests on a re-implementation that quietly drifted.
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
  const IR = m30Ir as unknown as {
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

  const bare = (t: string) => t.replace(/[。？！]/g, "");

  const surfaces: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({
        where: `${lessonId}/${String((step as { id: string }).id)}`,
        ja,
        type: step.type,
      });

  /**
   * WHOLE SENTENCES, not every kana string on the step. `jaSurfaces` walks every
   * field, so a build's `tiles` array contributes the bare tile 「みる」 as its
   * own "surface" — useless for an adjacency question, because there is nothing
   * on either side of it.
   *
   * FIELD NAMES ARE THE TRAP. `speaking` keeps its answer in `targetPhrase` and
   * `translate` in `acceptedAnswers` (a list); neither has a `targetSentence`. A
   * scan that reads the wrong field compares `undefined` every time and reports
   * a clean course, which is why every guard below asserts it saw something.
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
      sentences.push({
        where: `${lessonId}/${String((step as { id: string }).id)}`,
        ja,
        type: step.type,
      });

  it("this file's tokenizer reproduces the compiler's own build tiles", () => {
    // NON-VACUITY + CORRECTNESS ANCHOR. Every guard below reads `tok()`, so if
    // `tok()` segmented differently from the compiler the guards would be
    // measuring a sentence the learner never sees. `correctOrder` IS the
    // compiler's tokenization, so comparing the two on every build in the
    // module is a direct proof that they agree.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string;
        targetSentence?: string;
        correctOrder?: string[];
        id: string;
      };
      if (rec.type !== "build_sentence" && rec.type !== "listening_build") continue;
      if (!rec.targetSentence || !rec.correctOrder) continue;
      checked++;
      const mine = tok(rec.targetSentence).join("·");
      const theirs = rec.correctOrder.map(bare).join("·");
      if (mine !== theirs)
        offenders.push(`${lessonId}/${rec.id}: mine [${mine}] vs compiler [${theirs}]`);
    }
    expect(checked, "no build steps to anchor against").toBeGreaterThan(80);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every token resolves to an atom — no invented surface reaches a tile", () => {
    const EXTRA = new Set([...PARTICLES, ...NAMES, ...INTERJ, ...MASU_STEMS, ...KU_STEMS, "だ", "な", "です"]);
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
    expect(scanned, "no tokens scanned — the projection moved").toBeGreaterThan(4000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── THE SCHEMA: て-form + helper, two tiles, no gap ──────────────────────
  const HELPERS = new Set(["みる", "みた", "みない", "みて", "おく", "おいた"]);
  /** Every registered て-form the tokenizer knows: an atom ending in て or で
   *  that is not itself a helper. Derived from the vocabulary, never listed. */
  const TE_FORMS = new Set(
    [...NEW_KANA, ...PRIOR_KANA, ...JA_COURSE_ATOMS_BY_KANA.keys()].filter(
      (k) => k.length > 1 && /[てで]$/.test(k) && !HELPERS.has(k),
    ),
  );

  it("NO BARE 「て」 TILE — て 手 'hand' is never mis-credited", () => {
    // The RUN-PLAN's homograph ruling (2026-07-27) left て "hand" UNVERIFIED:
    // "if a て-form verb ever emits a bare て tile it is a silent mis-credit of
    // the same class". A module built entirely out of て-forms is exactly where
    // that would first bite, so it is measured. It holds because every て-form
    // here is a WHOLE registered atom; this check exists so that stays true.
    const offenders: string[] = [];
    let scanned = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { id: string; tiles?: string[]; correctOrder?: string[] };
      for (const key of ["tiles", "correctOrder"] as const) {
        const v = rec[key];
        if (!Array.isArray(v)) continue;
        for (const t of v) {
          scanned++;
          // 「で」 is deliberately NOT checked: it is the location/means
          // PARTICLE and inv 34 requires it to be its own tile. Only 「て」
          // collides with a content atom (手 "hand").
          if (bare(t) === "て")
            offenders.push(`${lessonId}/${rec.id}: bare 「${t}」 in ${key}`);
        }
      }
    }
    expect(scanned, "no tiles scanned — the projection moved").toBeGreaterThan(700);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("a helper is always ATTACHED to its て-form — never separated by a space", () => {
    // Whitespace is a real word boundary in this corpus (the tokenizer splits
    // on it and never matches across it), so this is a TOKEN check, not a
    // substring one. A space here would give みる its own annotation run and
    // ship 「たべて 見る」 — the kanji pass kanji-fies a run holding exactly one
    // dictionary word.
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of sentences) {
      const chunks = ja.replace(/[。、？！]/g, "").split(/[\s　]+/).filter(Boolean);
      for (let i = 0; i < chunks.length; i++) {
        scanned++;
        if (!HELPERS.has(chunks[i])) continue;
        const prev = chunks[i - 1] ?? "";
        const prevTokens = tok(prev);
        if (TE_FORMS.has(prevTokens[prevTokens.length - 1] ?? ""))
          offenders.push(`${where}: 「${prev} ${chunks[i]}」 — the helper must be joined up — ${ja}`);
      }
    }
    expect(scanned, "no chunks scanned").toBeGreaterThan(1000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every helper token sits directly behind a て-form, and never behind anything else", () => {
    // The module's structural claim, over COMPILED tiles: 「たべてみる」 tiles as
    // たべて · みる. A helper preceded by anything but a て-form means either a
    // compound got registered whole (the schema stops being assembled) or a
    // sentence used みる as a MAIN verb inside a helper-shaped position.
    // Main-verb uses are legal and are exempted by name.
    const MAIN_VERB_OK = new Set(["みる", "みた", "みない", "みて", "おく"]);
    const offenders: string[] = [];
    let helpers = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { id: string; correctOrder?: string[] };
      if (!Array.isArray(rec.correctOrder)) continue;
      const t = rec.correctOrder.map(bare);
      for (let i = 0; i < t.length; i++) {
        if (!HELPERS.has(t[i])) continue;
        const prev = t[i - 1] ?? "";
        if (TE_FORMS.has(prev)) {
          helpers++;
          continue;
        }
        if (!MAIN_VERB_OK.has(t[i]))
          offenders.push(`${lessonId}/${rec.id}: 「${t[i]}」 follows 「${prev}」, not a て-form`);
      }
    }
    // 200+ helper tokens measured; the floor catches a projection that stops
    // seeing steps rather than one that sees them and passes.
    expect(helpers, "no helper token examined — the projection moved").toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("NO compound is registered whole — 「たべてみる」 is two atoms, never one", () => {
    for (const a of NEW_KANA) {
      for (const h of ["みる", "みた", "みない", "おく", "おいた"])
        expect(
          a.endsWith(h) && a.length > h.length,
          `${a} registers a helper compound — the schema must stay two tiles`,
        ).toBe(false);
    }
  });

  // ── Homograph + fatigue bans, measured over compiled tiles ───────────────
  it("never emits した / きた / かった / はいって / みたい", () => {
    // した is the m17 atom for 下 "below" and きた for 北 "north" (m23's
    // finding); はいって fragments to はい · って; かった is on the m26/m27
    // carrier-fatigue list; and みたい is m13's "want to watch", so
    // 「かってみたい」 would tile かって · みたい and credit the wrong verb on a
    // sentence about buying. All five are banned by AUTHORING, and this checks
    // the compiled output where the filler generator and tile backfill can be
    // seen.
    const BANNED = new Set(["した", "きた", "かった", "はいって", "みたい"]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of surfaces)
      for (const t of tok(ja)) {
        scanned++;
        if (BANNED.has(bare(t))) offenders.push(`${where}: 「${t}」 — ${ja}`);
      }
    expect(scanned).toBeGreaterThan(4000);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("the nine worst carriers of the exposure audit carry no sentence here", () => {
    const FATIGUED = new Set(["みせ", "ともだち", "ほん", "ごはん", "きのう", "あたらしい", "えき", "かばん"]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of sentences)
      for (const t of tok(ja)) {
        scanned++;
        if (FATIGUED.has(bare(t))) offenders.push(`${where}: 「${t}」 — ${ja}`);
      }
    expect(scanned).toBeGreaterThan(1500);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("〜とく is RECOGNITION only — never a production target, never in a pool", () => {
    // Spine D15. Both contractions are registered WHOLE (a bare 「とく」 would
    // let 「しとく」 tile as し · とく, and し is the atom for 四 "four"), and
    // both are kept out of every reviewPool because the filler generator draws
    // production targets from the pool (m23/m24's bound-ender finding).
    const TOKU = new Set(["かっとく", "しとく"]);
    for (const l of IR.lessons)
      for (const w of l.reviewPool ?? [])
        expect(TOKU.has(w), `${l.id} reviewPool carries ${w}`).toBe(false);
    const offenders: string[] = [];
    let production = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        id: string;
        type: string;
        targetSentence?: string;
        targetPhrase?: string;
        acceptedAnswers?: string[];
      };
      const targets = [
        rec.targetSentence,
        rec.targetPhrase,
        ...(rec.acceptedAnswers ?? []),
      ].filter(Boolean) as string[];
      if (!targets.length) continue;
      production++;
      for (const t of targets)
        for (const tk of tok(t))
          if (TOKU.has(bare(tk)))
            offenders.push(`${lessonId}/${rec.id}: 「${tk}」 is a production target — ${t}`);
    }
    expect(production, "no production targets scanned").toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  // ── Cloze frames (inv 5 / inv 40 + the grammar-deck gate) ────────────────
  it("no cloze frame names a character or ends on a bare だ", () => {
    // A particle_cloze is HARVESTED into the grammar-review deck, whose
    // comprehensibility gate resolves every word through `courseAtoms` — and
    // ミカ / トム / ケン / たなか have no rows (m22's finding). A frame ending on
    // bare だ fails the same gate (m21's finding).
    const clozes = steps.filter(([, s]) => s.type === "particle_cloze");
    expect(clozes.length, "no clozes found").toBeGreaterThan(10);
    for (const [lessonId, step] of clozes) {
      const rec = step as unknown as {
        id: string;
        prompt?: { before?: string; after?: string };
        correctParticle?: string;
      };
      const frame = `${rec.prompt?.before ?? ""}${rec.correctParticle ?? ""}${rec.prompt?.after ?? ""}`;
      for (const n of NAMES)
        expect(tok(frame).includes(n), `${lessonId}/${rec.id} names ${n}`).toBe(false);
      const tokens = tok(frame).map(bare);
      expect(tokens[tokens.length - 1], `${lessonId}/${rec.id} ends on bare だ`).not.toBe("だ");
    }
  });

  it("every cloze option is a taught atom or one of this module's own (inv 40)", () => {
    const declared = new Set([...NEW_KANA, ...PRIOR_KANA, ...JA_COURSE_ATOMS_BY_KANA.keys()]);
    let options = 0;
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { id: string; type: string; options?: { text?: string }[] };
      if (rec.type !== "particle_cloze" || !Array.isArray(rec.options)) continue;
      for (const o of rec.options) {
        const text = typeof o === "string" ? o : (o.text ?? "");
        if (!text) continue;
        options++;
        for (const t of tok(text))
          if (t.length > 1 && !declared.has(bare(t)))
            offenders.push(`${lessonId}/${rec.id}: option 「${text}」 → 「${t}」 is untracked`);
      }
    }
    expect(options, "no cloze options scanned").toBeGreaterThan(30);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});

// ── Formation points: inv 49 ────────────────────────────────────────────────
describe("m30-neo conjugation ramps (invariant 49)", () => {
  const transforms = M30_NEO_LESSONS.flatMap((l) =>
    l.steps.filter((s) => s.type === "conjugation_transform").map((s) => [l.id, s] as const),
  );

  it("ships transform cards, all on the て form", () => {
    expect(transforms.length, "no conjugation_transform steps").toBeGreaterThanOrEqual(5);
    for (const [lessonId, step] of transforms) {
      const rec = step as unknown as { id: string; form: string };
      expect(rec.form, `${lessonId}/${rec.id}`).toBe("te");
    }
  });

  it("every transform card renders a REAL rule table — no silent degradation", () => {
    // The table and the 💡 peek in `ConjugationTransformStepView` are both
    // `{ruleset && …}`-gated, so a form with no ruleset degrades SILENTLY to a
    // bare "produce this form" prompt: no teaching, no guidance, no peek, and
    // nothing errors. That silence is the defect inv 49 exists to stop.
    expect(TRANSFORM_RULESETS.te, "the `te` ruleset went missing").toBeDefined();
    for (const [lessonId, step] of transforms) {
      const rec = step as unknown as { id: string; form: string; base: string };
      const rs = getTransformRulesetFor(rec.form, rec.base);
      expect(rs, `${lessonId}/${rec.id}: ${rec.base} → ${rec.form} renders NO table`).toBeDefined();
      expect(rs!.rows.length, `${lessonId}/${rec.id}: empty table`).toBeGreaterThan(2);
    }
  });

  it("no transform card prints its own answer", () => {
    // The leak mask (`RULESET_ALTERNATES`) swaps a row whose canonical example
    // IS the drilled base. m30 drills five verbs and none of them is one of the
    // `te` ruleset's twelve canonical examples, so no alternate has to fire —
    // which is checked here rather than assumed, because "no alternate needed"
    // and "the alternate silently did not fire" look identical from outside.
    for (const [lessonId, step] of transforms) {
      const rec = step as unknown as { id: string; form: string; base: string; answer: string };
      const rs = getTransformRulesetFor(rec.form, rec.base)!;
      const leaks = rs.rows.filter((r) => r.examples.includes(rec.base));
      expect(leaks, `${lessonId}/${rec.id}: the pinned table shows ${rec.base} itself`).toEqual([]);
      const printed = rs.rows.flatMap((r) => r.chips.map((c) => c.text)).join("");
      expect(
        printed.includes(rec.answer),
        `${lessonId}/${rec.id}: the table prints the answer ${rec.answer}`,
      ).toBe(false);
    }
  });

  it("a ramp never introduces its own base verb", () => {
    // The base is the card's PREMISE, not its answer (m14 printed すむ as a
    // given, and すむ is taught in no module). `moduleCompiler` would accept a
    // same-lesson base — its filter only asks that the base exist somewhere in
    // `newAtoms` — so the ordering is the author's to hold.
    const introducedIn = new Map<string, number>();
    const lessons = (m30Ir as unknown as { lessons: { id: string; introduces?: string[] }[] })
      .lessons;
    lessons.forEach((l, i) => {
      for (const k of l.introduces ?? []) introducedIn.set(k, i);
    });
    for (const [lessonId, step] of transforms) {
      const rec = step as unknown as { id: string; base: string };
      const baseAt = introducedIn.get(rec.base);
      const rampAt = lessons.findIndex((l) => `ja-m30-neo-${l.id.replace("m30-neo-", "")}` === lessonId);
      expect(baseAt, `${rec.base} is introduced by no lesson`).toBeDefined();
      expect(
        baseAt! < rampAt,
        `${lessonId}/${rec.id}: base ${rec.base} is introduced in the SAME lesson as its ramp`,
      ).toBe(true);
    }
  });
});

// ── Kanji drip (thr-n4: dripped, never a kanji module) ──────────────────────
describe("m30-neo kanji drip", () => {
  const kanjiSteps = M30_NEO_LESSONS.flatMap((l) =>
    l.steps.filter((s) => s.type === "kanji_reading").map((s) => [l.id, s] as const),
  );

  it("drips four reading checks across four different lessons", () => {
    expect(kanjiSteps).toHaveLength(4);
    expect(new Set(kanjiSteps.map(([l]) => l)).size, "a kanji lesson formed").toBe(4);
  });

  it("every glyph READS BARE at m30 — past unlock + the furigana window", () => {
    // A kanji step is a cold recognition check, never a first sighting: the
    // word must have unlocked at m30 - FURIGANA_WINDOW or earlier, or the
    // learner is still being shown its furigana elsewhere in the same module.
    expect(KANJI_ELIGIBLE_ATOMS.size, "the rollout catalog failed to load").toBeGreaterThan(50);
    for (const [lessonId, step] of kanjiSteps) {
      const rec = step as unknown as {
        id: string;
        kanji: string;
        promptAnnotation?: { atomId?: string }[];
      };
      const atomId = rec.promptAnnotation?.[0]?.atomId;
      expect(atomId, `${lessonId}/${rec.id} has no atomId`).toBeTruthy();
      const entry = KANJI_ELIGIBLE_ATOMS.get(atomId!);
      expect(entry, `${lessonId}/${rec.id}: ${atomId} is not kanji-eligible`).toBeDefined();
      expect(
        entry!.unlockModule + FURIGANA_WINDOW,
        `${lessonId}/${rec.id}: ${rec.kanji} still inside its furigana window at m30`,
      ).toBeLessThanOrEqual(30);
    }
  });

  it("re-tests no word from kanji-set-1, set-2 or set-3", () => {
    // A fourth set that re-tested the first three would measure nothing.
    const SPENT = new Set([
      "わかる", "やま", "みず", "まいにち", "なまえ", "はなす", "ひと", "でんわ", "てんき",
      "ちいさい", "たべる", "たかい", "じかん", "した", "くる", "きく", "がっこう", "がいこく",
      "かわ", "かいしゃ", "うみ", "うえ", "いく", "あたらしい", "あし", "せんせい",
    ]);
    for (const [lessonId, step] of kanjiSteps) {
      const rec = step as unknown as { id: string; reading: string };
      expect(SPENT.has(rec.reading), `${lessonId}/${rec.id}: ${rec.reading} was already tested`).toBe(
        false,
      );
    }
  });
});
