/**
 * m25-neo module guards. Same 2026-07-26 module shape as m12-m24
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m24 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS_BY_KANA } from "../../courseAtoms";
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

registerJaModuleContentLints("m25");

registerModuleBarGuards({
  moduleLabel: "m25-neo",
  lessons: M25_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24"],
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

describe("m25-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M25_NEO_LESSONS).toHaveLength(13);
    const reviews = M25_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M25_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M25_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M25_NEO_LESSONS[M25_NEO_LESSONS.length - 1].id).toBe("ja-m25-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M25_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("carries NO kanji_reading steps (kanji-set-3 is m28's ledger row)", () => {
    const kanji = M25_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "kanji_reading",
    );
    expect(kanji).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M25_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M25_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m25-neo owes the spine's conjecture points", () => {
  /** RUN-PLAN-n4 coverage ledger, row m25 — ONE id, and it must be TAUGHT
   *  here (carried by a compiled `grammar_rule` card, not merely referenced). */
  it("teaches `deshou`, the whole ledger row, on a rule card", () => {
    expect(taughtPoints.has("deshou")).toBe(true);
  });

  it("teaches the six conjecture rungs the registry has no id for", () => {
    // `n5-grammar-points.json` holds 103 points and exactly ONE of them is
    // about conjecture: `deshou`. Spine tile n13 splits that family into six
    // teachable rungs — attachment to adjectives, attachment to verbs, the
    // certainty adverbs, かな, だろう and casual でしょ. Inv 42 forbids
    // INVENTING an id where the registry has one; it cannot require one that
    // does not exist. These six are declared in the IR's own grammarPoints[],
    // the same move m24 made for the potential system and m11 for `itsu-when`.
    // The registry was deliberately not edited — see the IR notes.
    for (const p of [
      "deshou-adjective",
      "deshou-verb",
      "tabun-kitto",
      "kana-wondering",
      "darou",
      "deshou-casual",
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("re-teaches ni-time and to-omoimasu, the two ⟳ points the spine asks for", () => {
    // `ni-time` (m11) because a SEASON is a time noun and the は/に split is
    // what a learner gets wrong about it; `to-omoimasu` (m18) because the
    // spine tile's own last line is "⟳ deepen of n08's clause-embedding".
    // Neither ledger row moves — a re-teach is not a re-assignment (m16).
    expect(taughtPoints.has("ni-time")).toBe(true);
    expect(taughtPoints.has("to-omoimasu")).toBe(true);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M25_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m25-neo pedagogy invariants", () => {
  const steps = M25_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (deliberate wrong
   *  sentences — 「ゆきだでしょう」 and 「ふるだでしょう」 ARE the learner errors
   *  these lessons name) and grading-only `acceptedAnswers`. */
  const surfaces: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  /**
   * RULE ZERO — never substring-match Japanese. Japanese has no spaces, so
   * `ja.includes(kana)` matches inside unrelated words and the wrong version
   * always PASSES. This module's whole subject matter is BOUND ENDERS
   * (でしょう / でしょ / だろう / かな) which by definition sit inside the same
   * space-delimited chunk as the predicate in front of them, so m24's
   * space-splitting `segmentsOf` would answer every question wrong here:
   * 「あめでしょう」 is ONE segment.
   *
   * So this file tokenizes for real — longest-match over the same vocabulary
   * `moduleCompiler.makeTokenizer` uses (courseAtoms ∪ particles ∪ names ∪
   * interjections). The first test below proves the two agree by checking
   * every compiled build tile bank against it, so nothing downstream is
   * resting on a re-implementation that quietly drifted.
   */
  const PARTICLES = ["は", "が", "を", "に", "で", "と", "の", "も", "へ", "から", "まで", "か"];
  const NAMES = ["トム", "ミカ", "ケン", "たなか", "タナカ"];
  const INTERJ = ["うん", "ううん", "そう", "ええ", "はい", "いいえ"];
  const VOCAB = [
    ...new Set([...JA_COURSE_ATOMS_BY_KANA.keys(), ...PARTICLES, ...NAMES, ...INTERJ]),
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

  /**
   * WHOLE SENTENCES, not every kana string on the step. `jaSurfaces` walks
   * every field, so a build's `tiles` array contributes the bare tile 「だろう」
   * as its own "surface" — useless for an ADJACENCY question (what sits in
   * front of the ender), because there is nothing in front of it. The
   * adjacency guards below therefore read the sentence-carrying fields only.
   */
  const sentencesOf = (step: Record<string, unknown>): string[] => {
    const out: string[] = [];
    for (const k of ["targetSentence", "targetPhrase", "transcript", "audioText", "correctKana"]) {
      const v = step[k];
      if (typeof v === "string" && v.trim()) out.push(v);
    }
    const prompt = step.prompt as { before?: string; after?: string } | undefined;
    if (step.type === "particle_cloze" && prompt && typeof prompt === "object")
      out.push(`${prompt.before ?? ""}${String(step.correctParticle ?? "")}${prompt.after ?? ""}`);
    if (Array.isArray(step.lines))
      for (const l of step.lines as { kana?: string }[])
        if (typeof l?.kana === "string") out.push(l.kana);
    for (const key of ["examples"]) {
      const ex = step[key];
      if (Array.isArray(ex))
        for (const e of ex as { ja?: string }[]) if (typeof e?.ja === "string") out.push(e.ja);
    }
    return out;
  };

  const sentences: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of sentencesOf(step as unknown as Record<string, unknown>))
      sentences.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  it("this file's tokenizer reproduces the compiler's own build tiles", () => {
    // NON-VACUITY + CORRECTNESS ANCHOR. Every guard below reads `tok()`, so if
    // `tok()` segmented differently from the compiler the guards would be
    // measuring a sentence the learner never sees. `correctOrder` IS the
    // compiler's tokenization, so comparing the two on every build in the
    // module is a direct proof that they agree.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { type: string; targetSentence?: string; correctOrder?: string[]; id: string };
      if (rec.type !== "build_sentence" && rec.type !== "listening_build") continue;
      if (!rec.targetSentence || !rec.correctOrder) continue;
      checked++;
      const mine = tok(rec.targetSentence).join("·");
      const theirs = rec.correctOrder.map((t) => t.replace(/[。？！]/g, "")).join("·");
      if (mine !== theirs)
        offenders.push(`${lessonId}/${rec.id}: mine [${mine}] vs compiler [${theirs}]`);
    }
    expect(checked, "no build steps to anchor against").toBeGreaterThan(40);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  const ENDERS = new Set(["でしょう", "でしょ", "だろう", "かな"]);

  it("every conjecture ender is its OWN tile, never fused to its predicate", () => {
    // でしょう is BOUND to the predicate in front of it (inv 41), which is
    // exactly the shape that hid m24's ましょう ます-stem trap. Read from the
    // COMPILED tiles rather than the authored string, because the tile is the
    // thing that credits an atom: a tile like 「あめでしょう」 would render fine,
    // grade fine, and teach nothing about attachment.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { tiles?: string[]; correctOrder?: string[]; id: string };
      for (const raw of [...(rec.tiles ?? []), ...(rec.correctOrder ?? [])]) {
        const t = raw.replace(/[。？！]/g, "");
        if (ENDERS.has(t)) continue;
        for (const e of ENDERS)
          if (t.length > e.length && t.endsWith(e))
            offenders.push(`${lessonId}/${rec.id}: tile 「${raw}」 fuses ${e} to its predicate`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("what sits in FRONT of an ender is always a word the learner owns", () => {
    // The positive half of the guard above, and the m24 noun-stem lesson
    // generalised: a bound ender is only safe when the thing it attaches to
    // resolves to a real atom. 「し」+ましょう credited 四 in m24; here the
    // predicate is always a free word, and this proves it rather than
    // asserting it.
    const EXTRA = new Set([...PARTICLES, ...NAMES, ...INTERJ, "だ", "です"]);
    const offenders: string[] = [];
    let seen = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { correctOrder?: string[]; id: string };
      const tiles = (rec.correctOrder ?? []).map((t) => t.replace(/[。？！]/g, ""));
      for (let i = 0; i < tiles.length; i++) {
        if (!ENDERS.has(tiles[i])) continue;
        seen++;
        const stem = tiles[i - 1];
        if (stem === undefined) {
          offenders.push(`${lessonId}/${rec.id}: 「${tiles[i]}」 opens the sentence`);
          continue;
        }
        if (!JA_COURSE_ATOMS_BY_KANA.has(stem) && !EXTRA.has(stem))
          offenders.push(
            `${lessonId}/${rec.id}: 「${stem}」+${tiles[i]} — the stem resolves to no atom`,
          );
      }
    }
    expect(seen, "no ender ever reaches a build tile").toBeGreaterThan(20);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("だろう is RECOGNITION — production only ever follows a question word", () => {
    // The spine's own wording: "だろう is RECOGNITION + the 何だろう self-talk
    // pattern only (audit: sentence-final だろう to a listener is
    // blunt/masculine, not a neutral register twin)". So a production surface
    // may say 「なんだろう」 / 「だれだろう」 — nobody has been addressed — and may
    // NEVER say 「あめだろう」. The statement kind is legal on the rule card, on
    // listening comprehension and in a dialogue, where the learner only hears
    // it. Token-adjacency, read off the tokenizer proven above.
    const QUESTION_WORDS = new Set(["なん", "なに", "だれ", "どこ", "どれ", "どちら", "どっち", "なんじ", "どの", "いつ"]);
    const PRODUCTION = new Set([
      "build_sentence", "translate", "speaking", "listening_build", "particle_cloze",
    ]);
    const offenders: string[] = [];
    for (const { where, ja, type } of sentences) {
      if (!PRODUCTION.has(type)) continue;
      const tokens = tok(ja);
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] !== "だろう") continue;
        if (i === 0 || !QUESTION_WORDS.has(tokens[i - 1]))
          offenders.push(`${where} (${type}): sentence-final だろう as a production target — ${ja}`);
      }
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
    // …and non-vacuity, both ways: the module must actually HEAR the blunt
    // kind, or the guard above passes by saying nothing at all.
    const heardFlat = sentences.filter(
      ({ ja, type }) =>
        (type === "listening_comprehension" || type === "dialogue_listen" || type === "grammar_rule") &&
        tok(ja).some((t, i, a) => t === "だろう" && i > 0 && !QUESTION_WORDS.has(a[i - 1])),
    );
    expect(
      heardFlat.length,
      "the blunt sentence-final だろう is never heard — the recognition beat is missing",
    ).toBeGreaterThanOrEqual(2);
  });

  it("no bound ender is ever a bare word-level production target", () => {
    // A `reviewPool` entry feeds BOTH the closing match grid and the
    // compiler's filler rotation, whose third slot is a bare-word `speaking`
    // step. Listing でしょう / でしょ / だろう / かな in a pool therefore compiles
    // to "Say: probably" with 「でしょう」 as the whole answer — a bound ender
    // torn off the sentence it exists to finish, and for だろう a straight
    // contradiction of this module's own card. m24 shipped exactly this shape
    // as 「ましょう」 in its review-3 filler. The enders keep their SRS credit
    // from the sentences that carry them, so nothing is lost but the word card.
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; id: string; targetPhrase?: string; acceptedAnswers?: string[];
      };
      if (rec.type !== "speaking" && rec.type !== "translate") continue;
      const targets = [rec.targetPhrase, ...(rec.acceptedAnswers ?? [])].filter(
        (x): x is string => typeof x === "string",
      );
      for (const t of targets)
        if (ENDERS.has(t.replace(/[。？！\s　]/g, "")))
          offenders.push(`${lessonId}/${rec.id} (${rec.type}): bare ender 「${t}」 as the answer`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no m43 certainty rung is pre-empted (はず / かもしれない / にちがいない)", () => {
    // spine-n4 §1.1 files m25 as the DEEPEN target of m43's four-rung ladder,
    // and m43's own tile says the introductions are PAIRWISE against でしょう.
    // Spending any of the other three rungs here would leave the learner with
    // four half-taught forms and m43 with nothing to contrast. Token-exact —
    // はず is a substring of nothing this module says, but ずっと and はし are
    // exactly the kind of accident a substring test invents.
    const BANNED = ["はず", "かもしれない", "かも", "にちがいない", "ちがいない"];
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const t of tok(ja))
        if (BANNED.includes(t)) offenders.push(`${where}: 「${t}」 belongs to m43 — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no weather verb reaches a surface in a form that has no atom row", () => {
    // 「ふった」 and 「ふらない」 have NO atom row and no lexicon in this repo can
    // spell them — `VERB_ENTRIES` does not carry ふる — so either would
    // tokenize to a multi-character unknown fragment and the tile bank could
    // not spell the sentence. Both were authored into a first draft and
    // rewritten out; this is what keeps them out. The general case (any
    // untracked token) is moduleBarGuards' job; this names the specific trap.
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const t of tok(ja))
        if (t.length > 1 && !JA_COURSE_ATOMS_BY_KANA.has(t) &&
            ![...PARTICLES, ...NAMES, ...INTERJ, "だ", "です"].includes(t))
          offenders.push(`${where}: 「${t}」 resolves to no atom — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("でしょう never appears in front of から (a different construction)", () => {
    // 「ふるでしょうから」 is real Japanese — a conjectured REASON — and the spine
    // does not allocate it here. Every から in this module hangs off a plain
    // clause, so the learner meets one conjecture pattern rather than two.
    const offenders: string[] = [];
    for (const { where, ja } of sentences) {
      const tokens = tok(ja);
      for (let i = 1; i < tokens.length; i++)
        if (tokens[i] === "から" && ENDERS.has(tokens[i - 1]))
          offenders.push(`${where}: 「${tokens[i - 1]}から」 — ${ja}`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("かな is glossed as wondering, never as a question", () => {
    // GLOSS DISCIPLINE, the one thing no mechanical check normally catches
    // (m23 shipped 11 sentences glossing はいる as "check in"). かな is the
    // speaker turning a thought over — nobody has been asked anything — so
    // every English gloss of a かな transcript says "I wonder", and none of
    // them is a direct question. Scoped to listening_comprehension, the one
    // step type carrying transcript AND gloss as clean fields.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; transcript?: string; correctOptionId?: string;
        options?: { id: string; text: string }[]; id: string;
      };
      if (rec.type !== "listening_comprehension" || !rec.transcript) continue;
      if (!tok(rec.transcript).includes("かな")) continue;
      checked++;
      const correct = rec.options?.find((o) => o.id === rec.correctOptionId)?.text ?? "";
      if (!/wonder/i.test(correct))
        offenders.push(`${lessonId}/${rec.id}: かな glossed "${correct}" — かな is wondering, not asking`);
    }
    expect(checked, "no かな listening item to check").toBeGreaterThanOrEqual(2);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("でしょう is glossed as probability, never as certainty or obligation", () => {
    // でしょう is "probably / I expect". It is NOT "will" (which claims the
    // certainty the form disclaims) and NOT "must" (that is はず, m43's rung).
    // "definitely" is legal ONLY when きっと is actually in the sentence —
    // the adverb, not the ending, is what raises the confidence.
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; transcript?: string; correctOptionId?: string;
        options?: { id: string; text: string }[]; id: string;
      };
      if (rec.type !== "listening_comprehension" || !rec.transcript) continue;
      const tokens = tok(rec.transcript);
      if (!tokens.includes("でしょう") && !tokens.includes("でしょ")) continue;
      checked++;
      const correct = rec.options?.find((o) => o.id === rec.correctOptionId)?.text ?? "";
      if (/\bmust\b/i.test(correct))
        offenders.push(`${lessonId}/${rec.id}: でしょう glossed "must" — that is はず (m43) — "${correct}"`);
      if (/\bdefinitely\b/i.test(correct) && !tokens.includes("きっと"))
        offenders.push(
          `${lessonId}/${rec.id}: でしょう glossed "definitely" with no きっと in the sentence — "${correct}"`,
        );
    }
    expect(checked, "no でしょう listening item to check").toBeGreaterThan(8);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no true particle_cloze anywhere — m25 introduces no particle (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so a module that introduces no
    // particle may not use it on one at all. Every cloze here picks among
    // CONTENT words — enders, adjectives, verbs, adverbs, season nouns.
    const PARTICLE_SET = new Set(["は", "が", "を", "に", "で", "と", "へ", "も", "の", "か", "や", "から", "まで", "より", "ね", "よ"]);
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const options = (step as unknown as { options?: string[] }).options ?? [];
      if (options.length && options.every((o) => PARTICLE_SET.has(o)))
        offenders.push(`${lessonId}/${String(step.id)}: [${options.join(" | ")}]`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no cloze frame carries a character name or ends on the bare copula", () => {
    // A particle_cloze is HARVESTED into the grammar-review deck, whose
    // comprehensibility gate resolves every word through `courseAtoms` — and
    // ミカ / トム / ケン / たなか have no rows, so a frame naming one lands in
    // GATE_EXEMPTIONS as "too advanced" (m22's finding). The same gate strips
    // only atoms and TAUGHT_ENDINGS, and だ is in neither, so a frame ending in
    // the bare copula reads as unexplained vocabulary (m21's や cloze).
    const offenders: string[] = [];
    for (const [lessonId, step] of steps) {
      if (step.type !== "particle_cloze") continue;
      const rec = step as unknown as { sentenceBefore?: string; sentenceAfter?: string; targetSentence?: string };
      const frame = `${rec.sentenceBefore ?? ""}${rec.sentenceAfter ?? ""}${rec.targetSentence ?? ""}`;
      for (const name of ["ミカ", "トム", "ケン", "たなか"])
        if (frame.includes(name))
          offenders.push(`${lessonId}/${String(step.id)}: cloze frame names ${name}`);
      const tail = (rec.sentenceAfter ?? "").replace(/[。？！\s　]+$/g, "");
      if (tail.endsWith("だ"))
        offenders.push(`${lessonId}/${String(step.id)}: cloze frame ends on bare だ — "${tail}"`);
    }
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no untaught vocabulary the context pack claims is known", () => {
    // The pack is built from `courseAtoms` attribution and OVERSTATES what the
    // learner has met: none of these is in any earlier module's priorVocab, so
    // using one would be a bare-word debut the compiler's own provenance gate
    // cannot see (a build_sentence IS intro-capable, so an untaught word slips
    // through as a "debut"). Every entry was found by tokenizing this module's
    // surfaces against the compiler's vocabulary and checking each token
    // against priorVocab — こうえん, いらない and そと were all caught that way
    // and rewritten out. Token-exact, never substring (RULE ZERO).
    // 2026-08-20: はやい/みがく left the list (the B067 m13 pack IR-introduces
    // both — ja-m13-neo-10 — so a pool draw is a met-word review), and よむ
    // left it (Spencer's R2 ruling: the m1 ya-row anchor is its introduction;
    // its restamped m1 tag legally admits it to met-word pools).
    const UNTAUGHT = [
      "こうえん", "へや", "そと", "まち", "ちかく", "そば", "えいご", "はなし",
      "にく", "ノート", "プール", "ゆっくりと", "せっけん", "なく", "さく",
      "いちばん", "いろ", "あまい", "おもい", "でる", "たつ", "なる",
      "かく", "とる", "うたう", "おぼえる", "いらない",
      // では is an ATOM ("with that…") taught nowhere, so 「かわでは」 fuses
      // で + は into it and tiles an untaught word (m23's finding).
      "では",
    ];
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const t of tok(ja))
        if (UNTAUGHT.includes(t))
          offenders.push(`${where}: 「${t}」 is taught by no module before m25 — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every carrier flagged over-exposed by the 2026-07-27 audit is absent", () => {
    // Inv 27. `node scripts/exposure-audit.mjs` names these 15 as the worst
    // over-exposed carriers in the course; a weather module has its own
    // gravity, so none of them carries a sentence here. Token-exact, never
    // substring — きっさてん contains さ and みず is a substring of nothing this
    // module says, and both distinctions matter.
    const FATIGUED = new Set([
      "みせ", "ともだち", "ほん", "ごはん", "みず", "きのう", "あたらしい",
      "えき", "かった", "うみ", "いたい", "でんしゃ", "ください", "きっさてん",
    ]);
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const t of tok(ja))
        if (FATIGUED.has(t)) offenders.push(`${where}: fatigued carrier 「${t}」 — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
