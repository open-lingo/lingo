/**
 * m26-neo module guards. Same 2026-07-26 module shape as m12-m25
 * (invariant 25): 9 teaching + 3 review + 1 challenge, reviews spread across
 * thirds, challenge lesson LAST.
 *
 * Like m12-m25 this module splices NOTHING in at module level — the katakana
 * programme ended at m11 — so the compiled lessons ARE the shipped lessons
 * and the guards run over the whole module.
 */
import { describe, expect, it } from "vitest";
import { registerJaModuleContentLints } from "../../__tests__/moduleContentLints";
import { registerModuleBarGuards, COURSE_CANON } from "../../__tests__/moduleBarGuards";
import { getMockLessonContent } from "@/features/lesson/data/mockLessons";
import { jaSurfaces } from "@/features/lesson/data/stepTaxonomy";
import { JA_COURSE_ATOMS_BY_KANA } from "../../courseAtoms";
import N5_GRAMMAR_POINTS from "@/features/lesson/data/n5-grammar-points.json";
import m26Ir from "../ir/m26.ir.json";
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

registerJaModuleContentLints("m26");

registerModuleBarGuards({
  moduleLabel: "m26-neo",
  lessons: M26_NEO_LESSONS,
  priorModules: ["m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15", "m16", "m17", "m18", "m19", "m20", "m21", "m22", "m23", "m24", "m25"],
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

describe("m26-neo module shape (invariant 25)", () => {
  it("ships 13 lessons: 9 teaching + 3 review + 1 challenge", () => {
    expect(M26_NEO_LESSONS).toHaveLength(13);
    const reviews = M26_NEO_LESSONS.filter((l) => /-review(-\d+)?$/.test(l.id));
    const challenge = M26_NEO_LESSONS.filter((l) => l.id.endsWith("-challenge"));
    expect(reviews, reviews.map((l) => l.id).join(", ")).toHaveLength(3);
    expect(challenge).toHaveLength(1);
    expect(M26_NEO_LESSONS.length - reviews.length - challenge.length).toBe(9);
  });

  it("the CHALLENGE lesson is last", () => {
    expect(M26_NEO_LESSONS[M26_NEO_LESSONS.length - 1].id).toBe("ja-m26-neo-challenge");
  });

  it("carries NO katakana row lessons (the programme ended at m11)", () => {
    expect(M26_NEO_LESSONS.filter((l) => l.id.includes("-kata-"))).toHaveLength(0);
  });

  it("carries NO kanji_reading steps (kanji-set-3 is m28's ledger row)", () => {
    const kanji = M26_NEO_LESSONS.flatMap((l) => l.steps).filter(
      (s) => s.type === "kanji_reading",
    );
    expect(kanji).toHaveLength(0);
  });

  it("every lesson is reachable by deep link", () => {
    for (const l of M26_NEO_LESSONS) {
      expect(getMockLessonContent(l.id)?.id, l.id).toBe(l.id);
    }
  });
});

const taughtPoints = new Set(
  M26_NEO_LESSONS.flatMap((l) => l.steps)
    .filter((s) => s.type === "grammar_rule")
    .map((s) => (s as { grammarPointId?: string }).grammarPointId)
    .filter(Boolean) as string[],
);

describe("m26-neo owes the spine's superlative point", () => {
  /** RUN-PLAN-n4 coverage ledger, row m26 — ONE id, and it must be TAUGHT
   *  here (carried by a compiled `grammar_rule` card, not merely referenced). */
  it("teaches `ichiban-superlative`, the whole ledger row, on a rule card", () => {
    expect(taughtPoints.has("ichiban-superlative")).toBe(true);
  });

  it("re-teaches the eight points the nine teaching lessons need", () => {
    // The row owes ONE id across nine teaching lessons. Rather than invent
    // IR-local ids (m24 needed four, m25 six), every remaining card is a
    // REGISTRY point re-taught inside the new frame — the m20 move, which
    // re-taught six for exactly this reason. A re-teach is not a
    // re-assignment (the m16 ruling): no ledger row moves.
    for (const p of [
      "dare",             // m4  — a question word takes が inside the frame
      "no-ga-suki",       // m13 — 「〜のが いちばん すきだ」, superlative over ACTIONS
      "yori-comparison",  // m20 — the spine's own ⟳ spiral beat
      "to-and",           // m8  — と ties a list of any length; どっち vs どれ
      "na-adj-present",   // m12 — な-adjectives keep だ under いちばん
      "mo-also",          // m3  — 「AもBも〜けど Cが いちばん〜」
      "dictionary-form",  // m7  — いちばん scaling a VERB, which takes no だ
      "masu-present",     // m7  — the polite superlative question
    ])
      expect(taughtPoints.has(p), `${p} card missing`).toBe(true);
  });

  it("invents ZERO grammar-point ids — every card resolves to the N5 registry", () => {
    // Inv 42. m24 and m25 both had to declare IR-local ids because the
    // registry genuinely had no entry for the family they were teaching.
    // m26 has no such excuse: `ichiban-superlative` exists and everything
    // else here is a re-teach, so an unknown id would be an authoring slip
    // rather than a registry hole. Asserted against the shipped registry
    // rather than a hand-copied list.
    const registry = new Set(
      (N5_GRAMMAR_POINTS as { id: string }[]).map((p) => p.id),
    );
    expect(registry.size, "the grammar-point registry failed to load").toBeGreaterThan(100);
    const unknown = [...taughtPoints].filter((p) => !registry.has(p));
    expect(taughtPoints.size, "no rule cards found").toBe(9);
    expect(unknown, unknown.join(", ")).toEqual([]);
  });

  it("ships no register scaffolding (that machinery is m10/m29 only)", () => {
    for (const lesson of M26_NEO_LESSONS) {
      for (const step of lesson.steps as unknown as Record<string, unknown>[]) {
        expect(step.audienceEmoji, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.politenessHint, `${lesson.id}/${String(step.id)}`).toBeUndefined();
        expect(step.referenceTable, `${lesson.id}/${String(step.id)}`).toBeUndefined();
      }
    }
  });
});

describe("m26-neo pedagogy invariants", () => {
  const steps = M26_NEO_LESSONS.flatMap((l) =>
    l.steps.map((s) => [l.id, s] as const),
  );

  /** Every kana-only Japanese surface the module TEACHES. `jaSurfaces` is the
   *  shared projection: it scrubs `grammar_rule.antiPattern` (the deliberate
   *  learner errors — 「おいしい いちばん」 and 「ほうが いちばん」 ARE what these
   *  cards name) and grading-only `acceptedAnswers`. */
  const surfaces: { where: string; ja: string; type: string }[] = [];
  for (const [lessonId, step] of steps)
    for (const ja of jaSurfaces(step as unknown as { type?: string } & Record<string, unknown>))
      surfaces.push({ where: `${lessonId}/${String((step as { id: string }).id)}`, ja, type: step.type });

  /**
   * RULE ZERO — never substring-match Japanese. Japanese has no spaces, so
   * `ja.includes(kana)` matches inside unrelated words and the wrong version
   * always PASSES. This module is one long adjacency question — what sits in
   * front of いちばん, what sits either side of なかで, whether ほうが and
   * いちばん ever appear in the same clause — and none of those can be asked
   * of a substring.
   *
   * So this file tokenizes for real: longest-match over the same vocabulary
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
   * every field, so a build's `tiles` array contributes the bare tile 「いちばん」
   * as its own "surface" — useless for an ADJACENCY question, because there is
   * nothing on either side of it. The adjacency guards below therefore read
   * the sentence-carrying fields only.
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

  it("「なかで」 is FOUR pieces on the tiles — noun + の + なか + で", () => {
    // The superlative frame's whole claim is that it is not a fixed phrase:
    // なか is m6's ordinary noun, so it takes の in front and で behind. A tile
    // that shipped 「なかで」 fused (or worse, 「たべものの」 fused, which inv 34
    // bans outright) would render fine, grade fine, and teach the learner that
    // なかで is an unanalysable chunk. Read from the COMPILED tiles, because
    // the tile is the thing that credits an atom.
    const offenders: string[] = [];
    let seen = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { tiles?: string[]; correctOrder?: string[]; id: string };
      const tiles = (rec.correctOrder ?? []).map((t) => t.replace(/[。？！]/g, ""));
      for (const raw of [...(rec.tiles ?? []), ...tiles]) {
        const t = raw.replace(/[。？！]/g, "");
        if (t !== "なか" && t.includes("なか"))
          offenders.push(`${lessonId}/${rec.id}: tile 「${raw}」 buries なか inside a larger tile`);
      }
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i] !== "なか") continue;
        seen++;
        if (tiles[i - 1] !== "の")
          offenders.push(`${lessonId}/${rec.id}: なか is not preceded by の — [${tiles.join("·")}]`);
        if (tiles[i + 1] !== "で")
          offenders.push(`${lessonId}/${rec.id}: なか is not followed by で — [${tiles.join("·")}]`);
      }
    }
    expect(seen, "なか never reaches a build tile — the frame is not being built")
      .toBeGreaterThan(30);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("いちばん is its own tile and always sits IN FRONT of a predicate", () => {
    // いちばん is an adverb, not an ending: it scales the word AFTER it and
    // never fuses to anything. Sentence-final いちばん would be the card's own
    // antiPattern shipped as content, and a fused tile (「いちばんやすい」) would
    // hide the fact that the adjective is untouched — the module's central
    // promise. Token-adjacency over the compiler's own tiles.
    const offenders: string[] = [];
    let seen = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as { tiles?: string[]; correctOrder?: string[]; id: string };
      for (const raw of [...(rec.tiles ?? []), ...(rec.correctOrder ?? [])]) {
        const t = raw.replace(/[。？！]/g, "");
        if (t !== "いちばん" && t.includes("いちばん"))
          offenders.push(`${lessonId}/${rec.id}: tile 「${raw}」 fuses いちばん to its neighbour`);
      }
      const tiles = (rec.correctOrder ?? []).map((t) => t.replace(/[。？！]/g, ""));
      for (let i = 0; i < tiles.length; i++) {
        if (tiles[i] !== "いちばん") continue;
        seen++;
        const next = tiles[i + 1];
        if (next === undefined) {
          offenders.push(`${lessonId}/${rec.id}: いちばん ends the sentence — [${tiles.join("·")}]`);
          continue;
        }
        // What follows is an adjective, a verb, a な-adjective or the adverb
        // よく — never a particle, which would mean いちばん had been treated
        // as a noun.
        if (PARTICLES.includes(next))
          offenders.push(
            `${lessonId}/${rec.id}: いちばん is followed by the particle 「${next}」 — [${tiles.join("·")}]`,
          );
      }
    }
    expect(seen, "いちばん never reaches a build tile").toBeGreaterThan(40);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ほうが and いちばん never appear in the same clause", () => {
    // L5's antiPattern: 「ほうが」 has already picked the winner of a PAIR, so
    // there is nothing left for いちばん to top and the two frames never stack.
    // A けど / から clause boundary resets the count, which is exactly what the
    // teaching sentences do (「AよりBの ほうが やすいけど Cが いちばん やすい」),
    // so the check is per-CLAUSE rather than per-sentence.
    const BOUNDARY = new Set(["けど", "から", "ので"]);
    const offenders: string[] = [];
    let clausesWithHou = 0;
    for (const { where, ja } of sentences) {
      let clause: string[] = [];
      const flush = () => {
        if (clause.includes("ほう")) {
          clausesWithHou++;
          if (clause.includes("いちばん"))
            offenders.push(`${where}: ほうが and いちばん stack in one clause — ${ja}`);
        }
        clause = [];
      };
      for (const t of tok(ja)) {
        if (BOUNDARY.has(t)) flush();
        else clause.push(t);
      }
      flush();
    }
    expect(clausesWithHou, "no ほうが clause in a module whose spine beat is the n09 spiral")
      .toBeGreaterThan(8);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("どっち and いちばん never share a sentence", () => {
    // どっち asks about EXACTLY TWO, and a field of exactly two is the ほうが
    // frame — there is nothing for いちばん to top. The two words in one
    // sentence would contradict L6's card inside a single surface. Four
    // authored sentences broke the same rule the other way round (a なかで
    // field of exactly two items carrying いちばん) and were rewritten to three
    // items before this shipped.
    const offenders: string[] = [];
    let withDotchi = 0;
    for (const { where, ja } of sentences) {
      const t2 = tok(ja);
      if (!t2.includes("どっち")) continue;
      withDotchi++;
      if (t2.includes("いちばん"))
        offenders.push(`${where}: どっち (exactly two) with いちばん — ${ja}`);
    }
    expect(withDotchi, "no どっち sentence — the two-vs-many contrast is missing")
      .toBeGreaterThan(2);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("the n09 spiral is ALL-NEW — no sentence is reused from m20", () => {
    // spinePlan n14's second line, verbatim: "Comparison review against n09
    // with all-new sentences (spiral rule)". m20 is n09, so a repeated surface
    // would turn the deepen beat into a recitation of the intro beat. Compared
    // on NORMALISED whole sentences (spaces and punctuation stripped), and
    // only for multi-token strings — a bare tile like 「やすい」 is shared by
    // construction and says nothing about the spiral.
    const norm = (s: string) => s.replace(/[。、？！\s　]/g, "");
    const m20 = new Set<string>();
    for (const l of M20_NEO_LESSONS)
      for (const s of l.steps)
        for (const ja of sentencesOf(s as unknown as Record<string, unknown>))
          if (tok(ja).length > 2) m20.add(norm(ja));
    const offenders: string[] = [];
    let checked = 0;
    for (const { where, ja } of sentences) {
      if (tok(ja).length <= 2) continue;
      checked++;
      if (m20.has(norm(ja))) offenders.push(`${where}: reused verbatim from m20 — ${ja}`);
    }
    expect(m20.size, "no m20 sentences collected — sentencesOf stopped seeing them")
      .toBeGreaterThan(100);
    expect(checked, "no m26 sentences collected").toBeGreaterThan(200);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no m37 comparison rung is pre-empted (ほど)", () => {
    // spine-n4 §1.1 files the comparison family as "m20 / m26 · ほど joins at
    // m37", and m37 gets ほど's atom row. 〜ほど〜ない is the NEGATIVE
    // comparison and its whole pedagogic value there is being the minimal pair
    // of a frame the learner already owns — which requires it to still be new.
    // Token-exact: ほど is a substring of nothing this module says, but that is
    // precisely the kind of accident a substring test invents.
    const BANNED = ["ほど", "くらい", "ぐらい"];
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const t of tok(ja))
        if (BANNED.includes(t)) offenders.push(`${where}: 「${t}」 belongs to m37 — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every token resolves to an atom — no invented surface reaches a tile", () => {
    // The general unbuildable class, named for this module's own near-misses.
    // 「クラス」 has NO atom row, so 「クラスで いちばん」 — the sentence a
    // superlative module reaches for first — emits クラス as an unknown
    // fragment; and おちゃ is not a word here (the atom is ちゃ), so
    // 「おちゃの ほうが」 would tile a bare お. Both were probed and struck
    // before drafting; this is what keeps them out.
    const EXTRA = new Set([...PARTICLES, ...NAMES, ...INTERJ, "だ", "です"]);
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const t of tok(ja))
        if (t.length > 1 && !JA_COURSE_ATOMS_BY_KANA.has(t) && !EXTRA.has(t))
          offenders.push(`${where}: 「${t}」 resolves to no atom — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("ships no untaught vocabulary the context pack claims is known", () => {
    // The pack is built from `courseAtoms` attribution and OVERSTATES: none of
    // these is in any earlier module's priorVocab, so using one would be a
    // bare-word debut the compiler's own provenance gate cannot see (a
    // build_sentence IS intro-capable, so an untaught word slips through as a
    // "debut"). Nineteen of the pack's twenty-four "reinforcement targets" are
    // on this list, which is why the five that COULD be spent — さかな, ぞう,
    // ことば, えいご, おもい — were spent by REGISTERING them instead.
    //
    // はやい is a special case and stays banned even though it is registered
    // elsewhere: `JA_PRIMARY_ATOM_BY_KANA` resolves the bare kana to
    // `hayai-early` (早い), so a comparison glossed "fastest" would credit SRS
    // to the wrong sense (m20's course-wide ruling).
    const UNTAUGHT = [
      "はやい", "おそい", "あまい", "からい", "ながい", "みじかい", "かるい",
      "つよい", "よわい", "ひろい", "せまい", "やさしい",
      "こうえん", "へや", "そと", "まち", "ちかく", "そば", "はなし",
      "ノート", "プール", "タクシー", "とり", "ドア", "ペン", "かみ", "つくえ",
      "おかね", "くに", "せいと", "さいふ", "いりぐち", "まいばん", "まいあさ",
      "ぷりん", "あおい", "しょうゆ", "なく", "あい", "えび", "すむ", "よむ",
      "かく", "うたう", "とる", "いろ", "たくさん", "でも", "また", "よっつ",
      "クラス", "スポーツ",
      // では is an ATOM ("with that…") taught nowhere, so 「なかでは」 would fuse
      // で + は into it and tile an untaught word (m23's finding, and this
      // module says なかで four dozen times).
      "では",
    ];
    const offenders: string[] = [];
    for (const { where, ja } of surfaces)
      for (const t of tok(ja))
        if (UNTAUGHT.includes(t))
          offenders.push(`${where}: 「${t}」 is taught by no module before m26 — ${ja}`);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every carrier flagged over-exposed by the 2026-07-27 audit is absent", () => {
    // Inv 27. `node scripts/exposure-audit.mjs` names these as the worst
    // over-exposed carriers in the course. でんしゃ is the painful one — it is
    // m20's headline comparison carrier, and a comparison module reaches for it
    // by reflex — so ちかてつ / バス / じてんしゃ / ひこうき / ふね carry the
    // transport comparisons instead. Token-exact, never substring.
    //
    // SCOPED TO WHAT THE AUTHOR CHOSE — multi-token SENTENCES plus every
    // `reviewPool` — rather than to `jaSurfaces`, and the reason is evidence
    // rather than convenience. A first draft of this guard read every surface
    // and fired on 「ください」 at `ja-m26-neo-3-debut-0`, which is a
    // `word_image_mcq`: the compiler picks those options itself out of
    // `emojiPool`, so the offending word is neither authored nor a carrier of
    // anything. Inv 27 is about the words a module hangs its SENTENCES on, and
    // a compiler-drawn one-word distractor is not one. `reviewPool` is scanned
    // explicitly because a pool entry IS an authorial choice, and dropping to
    // sentences alone would have stopped seeing it.
    const FATIGUED = new Set([
      "みせ", "ともだち", "ほん", "ごはん", "みず", "きのう", "あたらしい",
      "えき", "かった", "うみ", "いたい", "でんしゃ", "ください", "きっさてん",
    ]);
    const offenders: string[] = [];
    let scanned = 0;
    for (const { where, ja } of sentences) {
      if (tok(ja).length < 2) continue;
      for (const t of tok(ja)) {
        scanned++;
        if (FATIGUED.has(t)) offenders.push(`${where}: fatigued carrier 「${t}」 — ${ja}`);
      }
    }
    let pooled = 0;
    for (const lesson of (m26Ir as { lessons: { id: string; reviewPool?: string[] }[] }).lessons)
      for (const kana of lesson.reviewPool ?? []) {
        pooled++;
        if (FATIGUED.has(kana))
          offenders.push(`${lesson.id}: fatigued carrier 「${kana}」 in reviewPool`);
      }
    expect(scanned, "no sentence tokens scanned — the projection moved").toBeGreaterThan(2000);
    expect(pooled, "no reviewPool words scanned — the IR shape moved").toBeGreaterThan(100);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no bound ender is ever a bare word-level production target", () => {
    // `moduleCompiler`'s BOUND list filters these out of the filler pools, and
    // `boundEnderProduction.test.ts` is the course-wide ratchet. This module
    // registers no bound form, so the list is unchanged — but いちばん is kept
    // out of every reviewPool for the neighbouring reason: a pool entry feeds
    // the filler's bare-word `speaking` slot, and "Say: the most" is a word
    // card for something this module only ever teaches inside a frame.
    // FIELD NAMES: `speaking` → targetPhrase, `translate` → acceptedAnswers.
    const BOUND = new Set(["つもり", "ましょう", "でしょう", "でしょ", "だろう", "かな", "たり", "いちばん", "ほう", "なか"]);
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
    expect(scanned, "scanned no production targets — the field names moved")
      .toBeGreaterThan(30);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("no true particle_cloze anywhere — m26 introduces no particle (inv 5)", () => {
    // particle_cloze is an INTRODUCTION device, so a module that introduces no
    // particle may not use it on one at all. Every cloze here picks among
    // CONTENT words — nouns, adjectives, verbs, question words and predicate
    // FORMS (しずかだ / しずか / しずかじゃない).
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

  it("いちばん is glossed as a superlative, never as an intensifier", () => {
    // GLOSS DISCIPLINE, the one thing no mechanical check normally catches
    // (m23 shipped 11 sentences glossing はいる as "check in"). いちばん tops a
    // GROUP — "the most", "the ~est", "my favourite", "the one I like most" —
    // and it is not とても. A gloss reading "very" would teach an intensifier,
    // which is a different claim and a different word. Scoped to
    // listening_comprehension, the one step type carrying transcript AND gloss
    // as clean fields.
    const SUPERLATIVE = /(\bmost\b|\best\b|est\b|favourite|favorite|biggest|cheapest|oldest|heaviest|quietest|busiest|coldest|coolest|liveliest|furthest)/i;
    const offenders: string[] = [];
    let checked = 0;
    for (const [lessonId, step] of steps) {
      const rec = step as unknown as {
        type: string; transcript?: string; correctOptionId?: string;
        options?: { id: string; text: string }[]; id: string;
      };
      if (rec.type !== "listening_comprehension" || !rec.transcript) continue;
      if (!tok(rec.transcript).includes("いちばん")) continue;
      checked++;
      const correct = rec.options?.find((o) => o.id === rec.correctOptionId)?.text ?? "";
      if (/\bvery\b/i.test(correct))
        offenders.push(
          `${lessonId}/${rec.id}: いちばん glossed "very" — that is とても, not a superlative — "${correct}"`,
        );
      if (!SUPERLATIVE.test(correct))
        offenders.push(
          `${lessonId}/${rec.id}: いちばん transcript glossed without a superlative — "${correct}"`,
        );
    }
    expect(checked, "no いちばん listening item to check").toBeGreaterThan(12);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });

  it("every register cue is graded — the other register is never accepted", () => {
    // Inv 48, module-local and reading the SENTENCE fields rather than only
    // `acceptedAnswers` (which is all the course-wide
    // `registerCueGrading.test.ts` can see). L11 is the polite lesson and it
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
    expect(politeCues, "no politely-cued surface — L11's register lesson is missing")
      .toBeGreaterThan(8);
    expect(plainCues, "no friend-cued surface — the plain contrast beat is missing")
      .toBeGreaterThan(0);
    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
